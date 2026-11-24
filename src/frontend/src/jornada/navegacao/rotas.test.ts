import { describe, expect, it } from 'vitest'
import { LESSONS, LEVELS } from '../../educacao/catalogoEducacional'
import { type Gerador, paraTodo } from '../../testes/propriedade'
import { CATALOGO_ROTAS, type Missao, type Rota, missoesDaEscala } from '../catalogos/catalogoRotas'
import {
  type IdPagina,
  NOME_PAGINA,
  type RotaResolvida,
  enderecoDe,
  resolverEndereco,
  tituloDocumento,
} from './rotas'

const MISSOES: readonly Missao[] = (CATALOGO_ROTAS as readonly Rota[]).flatMap((rota) =>
  rota.escalas.flatMap((escala) => missoesDaEscala(escala).map((item) => item.missao)),
)
const IDS_MISSAO = MISSOES.map((m) => m.id)
const AULAS = Object.values(LESSONS).flatMap((aulas) => aulas.map((aula) => aula.id))
const NIVEIS = LEVELS.map((nivel) => nivel.id)

const PADROES_CONHECIDOS: readonly [string, IdPagina][] = [
  ['/', 'inicio'],
  ['/check-in', 'check-in'],
  ['/plano-de-voo', 'plano-de-voo'],
  ['/breve', 'breve'],
  ['/hangar', 'hangar'],
  ['/aulas', 'aulas'],
  ['/aulas/treino', 'treino'],
  ['/caderno', 'caderno'],
  ['/comandante', 'comandante'],
]

const SEGMENTOS = [
  '', 'cabine', 'caixa-preta', 'breve', 'aulas', 'treino', 'check-in', 'plano-de-voo', 'hangar',
  'caderno', 'comandante', 'Breve', 'portfólio', 'x', '..', '%20', ...IDS_MISSAO,
]

function gerarCaminho(g: Gerador): string {
  switch (g.inteiro(0, 3)) {
    case 0:
      return g.texto(24)
    case 1:
      return `/${g.lista((gg) => gg.escolher(SEGMENTOS), 4).join('/')}`
    case 2:
      return `/${g.escolher(['cabine', 'caixa-preta'])}/${g.escolher([...IDS_MISSAO, g.texto(12), 'sessao-1'])}${g.escolher(['', '/'])}`
    default:
      return `${g.escolher(PADROES_CONHECIDOS)[0]}${g.escolher(['', '/', '//', '/x'])}`
  }
}

function gerarBusca(g: Gerador): string {
  const chaves = ['motivo', 'modo', 'causa', 'semente', 'nova', 'nivel', 'aula', 'x']
  const valores = ['sem-cartao', 'rapido', 'cards', 'C1', 'C4', 'GATEWAY', '42', '-1', '1', 'n1', 'n1-1', '', g.texto(6)]
  const pares = g.lista((gg) => `${gg.escolher(chaves)}=${encodeURIComponent(gg.escolher(valores))}`, 4)
  return g.escolher(['', '?']) + pares.join('&')
}

function gerarRotaValida(g: Gerador): RotaResolvida {
  switch (g.inteiro(0, 10)) {
    case 0:
      return { pagina: 'inicio' }
    case 1:
      return { pagina: 'check-in', motivo: g.escolher(['sem-cartao', null] as const), rapido: g.escolher([true, false]) }
    case 2:
      return { pagina: 'plano-de-voo' }
    case 3: {
      const missao = g.escolher(MISSOES)
      const disponiveis = missao.causas.filter((c) => c.status === 'disponivel').map((c) => c.codigo)
      return {
        pagina: 'cabine',
        missao: missao.id,
        semente: g.escolher([null, g.inteiro(0, 1_000_000)]),
        causa: disponiveis.length > 0 ? g.escolher([null, ...disponiveis]) : null,
        nova: g.escolher([true, false]),
      }
    }
    case 4: {
      const alfabeto = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
      const tamanho = g.inteiro(1, 64)
      let sessao = ''
      for (let i = 0; i < tamanho; i += 1) sessao += alfabeto[g.inteiro(0, alfabeto.length - 1)]
      return { pagina: 'caixa-preta', sessao }
    }
    case 5:
      return { pagina: 'breve' }
    case 6:
      return { pagina: 'hangar' }
    case 7:
      return {
        pagina: 'aulas',
        nivel: g.escolher([null, ...NIVEIS]),
        modo: g.escolher(['lesson', 'cards'] as const),
        aula: g.escolher([null, ...AULAS]),
      }
    case 8:
      return { pagina: 'treino' }
    case 9:
      return { pagina: 'caderno' }
    default:
      return { pagina: 'comandante' }
  }
}

function separar(endereco: string): [string, string] {
  const indice = endereco.indexOf('?')
  return indice < 0 ? [endereco, ''] : [endereco.slice(0, indice), endereco.slice(indice)]
}

describe('resolverEndereco', () => {
  // Feature: jornada-de-voo, Property 1: Resolução de endereço total e única
  it('resolve todo par (caminho, busca) para exatamente uma rota', () => {
    paraTodo(
      'Property 1',
      (g) => ({ caminho: gerarCaminho(g), busca: gerarBusca(g) }),
      ({ caminho, busca }) => {
        const rota = resolverEndereco(caminho, busca)
        expect(Object.keys(NOME_PAGINA)).toContain(rota.pagina)
        const semBarra = caminho.length > 1 && caminho.endsWith('/') ? caminho.slice(0, -1) : caminho
        const conhecido = PADROES_CONHECIDOS.find(([padrao]) => padrao === semBarra)
        if (conhecido) {
          expect(rota.pagina).toBe(conhecido[1])
          return
        }
        const cabine = /^\/cabine\/([^/]+)$/.exec(semBarra)
        if (cabine) {
          if ((IDS_MISSAO as readonly string[]).includes(cabine[1])) {
            expect(rota).toMatchObject({ pagina: 'cabine', missao: cabine[1] })
          } else {
            expect(rota).toEqual({ pagina: 'nao-encontrada', caminho, missaoDesconhecida: cabine[1] })
          }
          return
        }
        const caixa = /^\/caixa-preta\/([A-Za-z0-9-]{1,64})$/.exec(semBarra)
        if (caixa) {
          expect(rota).toEqual({ pagina: 'caixa-preta', sessao: caixa[1] })
          return
        }
        expect(rota).toEqual({ pagina: 'nao-encontrada', caminho, missaoDesconhecida: null })
      },
    )
  })

  it('aceita barra final e combinações independentes de motivo e modo', () => {
    expect(resolverEndereco('/breve/', '')).toEqual({ pagina: 'breve' })
    expect(resolverEndereco('/check-in', '?motivo=sem-cartao&modo=rapido')).toEqual({
      pagina: 'check-in',
      motivo: 'sem-cartao',
      rapido: true,
    })
    expect(resolverEndereco('/check-in', '?motivo=outro&modo=lento')).toEqual({
      pagina: 'check-in',
      motivo: null,
      rapido: false,
    })
    expect(resolverEndereco('/caixa-preta/abc_def', '')).toMatchObject({ pagina: 'nao-encontrada' })
  })

  // Feature: jornada-de-voo, Property 2: Ida e volta de endereço
  it('devolve a rota original ao resolver o endereço gerado por enderecoDe', () => {
    paraTodo('Property 2', gerarRotaValida, (rota) => {
      const [caminho, busca] = separar(enderecoDe(rota))
      expect(resolverEndereco(caminho, busca)).toEqual(rota)
    })
  })

  // Feature: jornada-de-voo, Property 2: Ida e volta de endereço (Causa fora do catálogo ou em preparação)
  it('ignora causa em preparação ou fora do catálogo', () => {
    paraTodo(
      'Property 2, causa',
      (g) => {
        const missao = g.escolher(MISSOES)
        const indisponiveis = missao.causas.filter((c) => c.status !== 'disponivel').map((c) => c.codigo)
        return { missao: missao.id, causa: g.escolher([...indisponiveis, g.texto(8), 'C9', 'OUTRA']) }
      },
      ({ missao, causa }) => {
        const rota = resolverEndereco(`/cabine/${missao}`, `?causa=${encodeURIComponent(causa)}`)
        expect(rota).toMatchObject({ pagina: 'cabine', missao, causa: null })
      },
    )
  })
})

describe('tituloDocumento', () => {
  // Feature: jornada-de-voo, Property 3: Título do documento
  it('compõe o nome da página com o nome do produto, sem E comercial', () => {
    const paginas = Object.keys(NOME_PAGINA) as IdPagina[]
    expect(paginas).toHaveLength(12)
    paraTodo(
      'Property 3',
      (g) => g.escolher(paginas),
      (pagina) => {
        const nome = NOME_PAGINA[pagina]
        const titulo = tituloDocumento(nome)
        expect(titulo).toBe(`${nome}, IT Career Simulator`)
        expect(nome).not.toContain('&')
        expect(titulo).not.toContain('&')
      },
    )
    for (const pagina of paginas) expect(tituloDocumento(NOME_PAGINA[pagina])).not.toContain('&')
  })
})
