import { afterEach, describe, expect, it, vi } from 'vitest'
import { analisarCartao, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { CATALOGO_ROTAS, rotaPorId } from './catalogoRotas'
import { ROTEIRO_CHECKIN, TEXTOS_HOME, TEXTO_PONTO_DE_PARTIDA, VERSAO_ROTEIRO } from './catalogoVocacional'
import { type RespostasCheckIn, indicarRota, montarCartaoDoCheckIn, rotaDeEmbarque } from './regrasIndicacao'

const [interesses, situacoes, ritmos] = ROTEIRO_CHECKIN.perguntas.map((pergunta) =>
  pergunta.opcoes.map((opcao) => opcao.id),
)

/** As 32 combinações do roteiro: 4 vezes 4 vezes 2. */
const COMBINACOES: RespostasCheckIn[] = interesses.flatMap((interesse) =>
  situacoes.flatMap((situacao) => ritmos.map((ritmo) => ({ interesse, situacao, ritmo }))),
)

const IDS_DAS_ROTAS = CATALOGO_ROTAS.map((rota) => rota.id as string)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Roteiro e catálogo vocacional', () => {
  it('tem 3 perguntas e 32 combinações', () => {
    expect(ROTEIRO_CHECKIN.versao).toBe(VERSAO_ROTEIRO)
    expect(ROTEIRO_CHECKIN.perguntas.map((pergunta) => pergunta.id)).toEqual(['interesse', 'situacao', 'ritmo'])
    expect(COMBINACOES).toHaveLength(32)
  })

  it('usa os identificadores fixados para as opções do atalho', () => {
    expect(interesses).toContain('ajudar-pessoas')
    expect(situacoes).toContain('perguntar-o-que-aparece')
    expect(ritmos).toContain('praticar')
  })

  it('só pesa rotas que existem no catálogo e traz os limites do guia', () => {
    for (const pergunta of ROTEIRO_CHECKIN.perguntas) {
      for (const opcao of pergunta.opcoes) {
        for (const rotaId of Object.keys(opcao.pesos)) expect(IDS_DAS_ROTAS).toContain(rotaId)
      }
    }
    expect(TEXTOS_HOME.limites.length).toBeGreaterThanOrEqual(4)
    expect(TEXTO_PONTO_DE_PARTIDA).toMatch(/ponto de partida/)
  })
})

describe('Feature: jornada-de-voo, Property 4: Indicação total e determinística', () => {
  it('devolve uma rota do catálogo, justificativa não vazia e o mesmo resultado em chamadas repetidas', () => {
    for (const respostas of COMBINACOES) {
      const primeira = indicarRota(respostas)
      expect(IDS_DAS_ROTAS, JSON.stringify(respostas)).toContain(primeira.rotaId)
      expect(primeira.justificativa.trim().length, JSON.stringify(respostas)).toBeGreaterThan(0)
      expect(indicarRota(respostas)).toEqual(primeira)
      expect(indicarRota({ ...respostas })).toEqual(primeira)
    }
  })

  it('soma os pesos e desempata pela ordem do catálogo', () => {
    expect(
      indicarRota({ interesse: 'ajudar-pessoas', situacao: 'perguntar-o-que-aparece', ritmo: 'praticar' }).rotaId,
    ).toBe('suporte-ti')
    expect(
      indicarRota({ interesse: 'construir-programas', situacao: 'automatizar-verificacao', ritmo: 'estudar' }).rotaId,
    ).toBe('desenvolvimento')
    expect(
      indicarRota({ interesse: 'encontrar-padroes', situacao: 'procurar-registros', ritmo: 'estudar' }).rotaId,
    ).toBe('dados')
    expect(
      indicarRota({ interesse: 'manter-servidores-redes', situacao: 'procurar-registros', ritmo: 'praticar' }).rotaId,
    ).toBe('infraestrutura-nuvem')
    // Empate de 2 a 2 entre Suporte de TI e Desenvolvimento: vence a rota que vem primeiro no catálogo.
    expect(
      indicarRota({ interesse: 'ajudar-pessoas', situacao: 'automatizar-verificacao', ritmo: 'praticar' }).rotaId,
    ).toBe('suporte-ti')
  })

  it('cita as respostas que pesaram e o ritmo, e não quebra com identificador desconhecido', () => {
    const indicacao = indicarRota({
      interesse: 'ajudar-pessoas',
      situacao: 'perguntar-o-que-aparece',
      ritmo: 'estudar',
    })
    expect(indicacao.ritmo).toBe('estudar')
    expect(indicacao.justificativa).toContain('Ajudar pessoas com tecnologia')
    expect(indicacao.justificativa).toContain('Pergunto o que aparece na tela e desde quando')
    expect(indicarRota({ interesse: '???', situacao: '', ritmo: 'x' })).toMatchObject({
      rotaId: 'suporte-ti',
      ritmo: 'praticar',
    })
  })

  it('não chama fetch', () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    for (const respostas of COMBINACOES) indicarRota(respostas)
    expect(espiao).not.toHaveBeenCalled()
  })
})

describe('Feature: jornada-de-voo, Property 5: Cartão emitido sempre embarca em rota disponível', () => {
  it('em todas as combinações, o cartão tem rota disponível, rota indicada e origem checkin', () => {
    for (const respostas of COMBINACOES) {
      const cartao = montarCartaoDoCheckIn(respostas, '2026-11-20T12:00:00.000Z')
      const indicada = indicarRota(respostas).rotaId
      expect(cartao.rotaIndicadaId, JSON.stringify(respostas)).toBe(indicada)
      expect(rotaPorId(cartao.rotaId)?.status, JSON.stringify(respostas)).toBe('disponivel')
      expect(cartao.origem).toBe('checkin')
      expect(cartao.versaoRoteiro).toBe(VERSAO_ROTEIRO)
      expect(cartao.respostas).toEqual(respostas)
      expect(cartao.primeiraEscalaId).toBe(rotaPorId(cartao.rotaId)?.escalas[0]?.id)
      // O que é emitido precisa ser lido de volta pelo armazenamento.
      expect(analisarCartao(serializarCartao(cartao))).toEqual(cartao)
    }
  })

  it('rota indicada disponível embarca nela; indisponível embarca em suporte-ti', () => {
    for (const rota of CATALOGO_ROTAS) {
      expect(rotaDeEmbarque(rota.id)).toBe(rota.status === 'disponivel' ? rota.id : 'suporte-ti')
    }
    const cartao = montarCartaoDoCheckIn(
      { interesse: 'construir-programas', situacao: 'automatizar-verificacao', ritmo: 'praticar' },
      '2026-11-20T12:00:00.000Z',
    )
    expect(cartao.rotaIndicadaId).toBe('desenvolvimento')
    expect(cartao.rotaId).toBe('suporte-ti')
    expect(cartao.primeiraEscalaId).toBe('help-desk-n1')
  })
})
