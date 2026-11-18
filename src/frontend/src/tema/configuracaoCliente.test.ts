import { describe, expect, it } from 'vitest'
import { type Gerador, paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS, type IdTema, ehIdTema } from './catalogo.ts'
import {
  CONFIGURACAO_AUSENTE,
  ID_BLOCO_CONFIGURACAO,
  lerEnvelopeDoDocumento,
  normalizarConfiguracao,
} from './configuracaoCliente.ts'
import { type EnvelopeConfiguracao, criarEnvelope, serializarParaHtml } from './envelopeConfiguracao.ts'

function normalizar(texto: string) {
  const avisos: string[] = []
  const resultado = normalizarConfiguracao(criarEnvelope(texto), (mensagem) => avisos.push(mensagem))
  return { resultado, avisos }
}

describe('normalização da configuração do cliente, exemplos', () => {
  it('bloco ausente: configuração ausente e nenhum aviso', () => {
    const avisos: string[] = []
    expect(normalizarConfiguracao(null, (m) => avisos.push(m))).toBe(CONFIGURACAO_AUSENTE)
    expect(avisos).toEqual([])
  })

  it('arquivo ilegível avisa e libera o catálogo inteiro', () => {
    const { resultado, avisos } = normalizar('{ nao e json')
    expect(resultado).toBe(CONFIGURACAO_AUSENTE)
    expect(avisos).toEqual(['[Aparência] Configuração do cliente ilegível; todos os temas do catálogo ficam permitidos.'])
  })

  it('tipo inválido avisa o campo', () => {
    const { resultado, avisos } = normalizar('{"travado":"sim"}')
    expect(resultado).toBe(CONFIGURACAO_AUSENTE)
    expect(avisos).toEqual(['[Aparência] Configuração do cliente ignorada: o campo "travado" tem tipo inválido.'])
  })

  it('campo desconhecido avisa só o nome', () => {
    const { avisos } = normalizar('{"temasPermitidos":["editorial"],"segredo":"valor-secreto"}')
    expect(avisos).toEqual(['[Aparência] Campo ignorado na configuração do cliente: "segredo".'])
  })

  it('descarta tema fora do catálogo e repetido, um aviso por ocorrência', () => {
    const { resultado, avisos } = normalizar('{"temasPermitidos":["acolhedor","sepia","acolhedor","editorial"]}')
    expect(resultado.temasPermitidos).toEqual(['acolhedor', 'editorial'])
    expect(avisos).toEqual([
      '[Aparência] Tema "sepia" descartado dos temas permitidos: não existe no catálogo.',
      '[Aparência] Tema "acolhedor" descartado dos temas permitidos: repetido.',
    ])
  })

  it('lista vazia avisa, libera o catálogo e desliga a trava', () => {
    const { resultado, avisos } = normalizar('{"temasPermitidos":[],"travado":true,"temaPadrao":"editorial"}')
    expect(resultado.temasPermitidos).toEqual(CATALOGO_TEMAS.map((tema) => tema.id))
    expect(resultado.travado).toBe(false)
    expect(avisos).toEqual(['[Aparência] Nenhum tema permitido válido; todos os temas do catálogo ficam permitidos.'])
  })

  it('padrão fora da lista é substituído pelo primeiro da lista', () => {
    const { resultado, avisos } = normalizar('{"temasPermitidos":["corporativo","acolhedor"],"temaPadrao":"editorial"}')
    expect(resultado.temaPadrao).toBe('corporativo')
    expect(avisos).toEqual(['[Aparência] Tema padrão "editorial" fora dos temas permitidos; substituído por "corporativo".'])
  })

  it('trava sem padrão usa o primeiro tema da lista', () => {
    const { resultado, avisos } = normalizar('{"temasPermitidos":["acolhedor","corporativo"],"travado":true}')
    expect(resultado).toEqual({ temasPermitidos: ['acolhedor', 'corporativo'], temaPadrao: 'acolhedor', travado: true })
    expect(avisos).toEqual([])
  })

  it('corta identificadores longos em 32 caracteres', () => {
    const longo = 'x'.repeat(80)
    const { avisos } = normalizar(JSON.stringify({ temasPermitidos: [longo, 'editorial'] }))
    expect(avisos[0]).toContain(`"${'x'.repeat(32)}"`)
    expect(avisos[0]).not.toContain('x'.repeat(33))
  })

  it('lê o envelope do documento e trata bloco corrompido como ilegível', () => {
    const documento = document.implementation.createHTMLDocument('t')
    expect(lerEnvelopeDoDocumento(documento)).toBeNull()
    const bloco = documento.createElement('script')
    bloco.type = 'application/json'
    bloco.id = ID_BLOCO_CONFIGURACAO
    bloco.textContent = serializarParaHtml(criarEnvelope('{"travado":true}'))
    documento.head.append(bloco)
    expect(lerEnvelopeDoDocumento(documento)).toMatchObject({ versao: 1, configuracao: { travado: true } })
    bloco.textContent = '{ quebrado'
    expect(lerEnvelopeDoDocumento(documento)).toBe('ilegivel')
  })
})

// Feature: temas-selecionaveis, Property 14: Normalização da lista e do padrão do cliente
describe('normalização da lista e do padrão, propriedade', () => {
  const UNIVERSO = [...CATALOGO_TEMAS.map((tema) => tema.id as string), 'sepia', 'neon', '', 'Operacao']

  function gerar(g: Gerador) {
    return {
      lista: g.lista((h) => h.escolher(UNIVERSO), 8),
      padrao: g.escolher<string | undefined>([undefined, ...UNIVERSO]),
      travado: g.inteiro(0, 1) === 1,
    }
  }

  it('produz a lista das primeiras ocorrências, um aviso por descarte e padrão contido na lista', () => {
    paraTodo('normalização da lista', gerar, ({ lista, padrao, travado }) => {
      const objeto: Record<string, unknown> = { temasPermitidos: lista, travado }
      if (padrao !== undefined) objeto.temaPadrao = padrao
      const avisos: string[] = []
      const resultado = normalizarConfiguracao(criarEnvelope(JSON.stringify(objeto)), (m) => avisos.push(m))

      const primeiras: IdTema[] = []
      let descartes = 0
      for (const item of lista) {
        if (ehIdTema(item) && !primeiras.includes(item)) primeiras.push(item)
        else descartes += 1
      }
      if (primeiras.length === 0) {
        expect(resultado.temasPermitidos).toEqual(CATALOGO_TEMAS.map((tema) => tema.id))
        expect(resultado.travado).toBe(false)
        expect(resultado.temaPadrao).toBeNull()
        expect(avisos).toHaveLength(descartes + 1)
        return
      }
      expect(resultado.temasPermitidos).toEqual(primeiras)
      expect(resultado.travado).toBe(travado)
      let avisosEsperados = descartes
      if (padrao !== undefined) {
        if (ehIdTema(padrao) && primeiras.includes(padrao)) expect(resultado.temaPadrao).toBe(padrao)
        else {
          expect(resultado.temaPadrao).toBe(primeiras[0])
          avisosEsperados += 1
        }
      } else {
        expect(resultado.temaPadrao).toBe(travado ? primeiras[0] : null)
      }
      expect(avisos).toHaveLength(avisosEsperados)
      if (resultado.temaPadrao !== null) expect(resultado.temasPermitidos).toContain(resultado.temaPadrao)
    })
  })
})

// Feature: temas-selecionaveis, Property 15: Higienização e tipos do envelope
describe('higienização e tipos do envelope, propriedade', () => {
  it('nunca lança exceção e só mantém os três campos conhecidos', () => {
    paraTodo(
      'envelope nunca lança',
      (g) => g.escolher([g.texto(30), '[1,2]', 'null', '42', '"texto"', '{"a":1', JSON.stringify({ temasPermitidos: g.lista((h) => h.texto(5), 3) })]),
      (texto) => {
        const envelope = criarEnvelope(texto)
        for (const nome of Object.keys(envelope.configuracao ?? {})) {
          expect(['temasPermitidos', 'temaPadrao', 'travado']).toContain(nome)
        }
        expect(serializarParaHtml(envelope).includes('<')).toBe(false)
      },
    )
  })

  it('o valor de campo extra nunca aparece no envelope nem nas mensagens, e o nome aparece uma vez', () => {
    paraTodo(
      'campos extras',
      (g) => ({
        nomes: Array.from({ length: g.inteiro(1, 3) }, (_, i) => `extra${i}${g.inteiro(0, 99)}`),
        valor: `SEGREDO-${g.inteiro(1000, 9999)}-<script>`,
      }),
      ({ nomes, valor }) => {
        const objeto: Record<string, unknown> = { temasPermitidos: ['editorial'] }
        for (const nome of nomes) objeto[nome] = valor
        const envelope: EnvelopeConfiguracao = criarEnvelope(JSON.stringify(objeto))
        expect(serializarParaHtml(envelope)).not.toContain('SEGREDO')
        const avisos: string[] = []
        normalizarConfiguracao(envelope, (m) => avisos.push(m))
        expect(avisos.join('\n')).not.toContain('SEGREDO')
        for (const nome of new Set(nomes)) expect(avisos.filter((m) => m.includes(`"${nome}"`))).toHaveLength(1)
      },
    )
  })

  it('campo conhecido com tipo errado resulta em configuração ausente e aviso que cita o campo', () => {
    paraTodo(
      'tipo errado',
      (g) => ({
        campo: g.escolher(['temasPermitidos', 'temaPadrao', 'travado'] as const),
        valor: g.escolher<unknown>([1, 'texto', null, {}, [1, 2], true, ['a', 3]]),
      }),
      ({ campo, valor }) => {
        const certo = campo === 'temasPermitidos' ? Array.isArray(valor) && valor.every((v) => typeof v === 'string')
          : campo === 'temaPadrao' ? typeof valor === 'string'
          : typeof valor === 'boolean'
        const avisos: string[] = []
        const resultado = normalizarConfiguracao(criarEnvelope(JSON.stringify({ [campo]: valor })), (m) => avisos.push(m))
        if (certo) return
        expect(resultado).toBe(CONFIGURACAO_AUSENTE)
        expect(avisos.some((m) => m.includes(`"${campo}"`))).toBe(true)
      },
    )
  })
})
