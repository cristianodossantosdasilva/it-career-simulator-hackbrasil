import { describe, expect, it } from 'vitest'
import { type Gerador, paraTodo } from '../testes/propriedade'
import {
  blocosDeToken,
  classificarBloco,
  compararIdentificadores,
  conferirContrato,
  lerBlocos,
  lerDeclaracoes,
  serializarBloco,
} from './blocosTokens.ts'
import { CONTRATO_TOKENS, NOMES_DO_CONTRATO } from './contratoTokens.ts'

const CSS_EXEMPLO = `/* cabecalho { falso: bloco; } */
:root { --medida: 70ch; }

[data-theme='operacao'],
[data-superficie='terminal'] {
  --bg-canvas: #0B1120; /* fundo */
  /* --comentado: #FFFFFF; */
  --font-sans: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  --glow-accent: 0 0 0 1px #0EA5E959, 0 0 12px #0EA5E938;
}

@media (max-width: 767.98px) {
  [data-theme='corporativo'] { --bg-canvas: #FFFFFF; }
  .botao { padding: 0; }
}

html[data-contraste='alto']:not(.dark) { --bg-canvas: #FFFFFF; }
html[data-contraste='alto'].dark,
html[data-contraste='alto'] [data-superficie='terminal'] { --bg-canvas: #000000; }
`

describe('analisador de blocos CSS', () => {
  it('lê blocos de nível superior ignorando comentários e mantém seletores múltiplos', () => {
    const blocos = lerBlocos(CSS_EXEMPLO)
    expect(blocos[0].seletores).toEqual([':root'])
    expect(blocos[1].seletores).toEqual(["[data-theme='operacao']", "[data-superficie='terminal']"])
    expect(blocos.some((bloco) => bloco.corpo.includes('falso'))).toBe(false)
  })

  it('lê declarações sem o comentário e com a linha correta', () => {
    const bloco = lerBlocos(CSS_EXEMPLO)[1]
    const declaracoes = lerDeclaracoes(bloco)
    expect(declaracoes.map((d) => d.nome)).toEqual(['--bg-canvas', '--font-sans', '--glow-accent'])
    expect(declaracoes[0]).toMatchObject({ valor: '#0B1120' })
    const linhas = CSS_EXEMPLO.split('\n')
    for (const declaracao of declaracoes) expect(linhas[declaracao.linha - 1]).toContain(declaracao.nome)
  })

  it('mantém regras de @media com o seletor original e o contexto', () => {
    const blocos = lerBlocos(CSS_EXEMPLO)
    const dentro = blocos.filter((bloco) => bloco.contexto !== null)
    expect(dentro.map((bloco) => bloco.seletores[0])).toEqual(["[data-theme='corporativo']", '.botao'])
    expect(dentro[0].contexto).toBe('@media (max-width: 767.98px)')
  })

  it('classifica tema, alto contraste claro e escuro e o resto como outro', () => {
    const tipos = lerBlocos(CSS_EXEMPLO).map(classificarBloco)
    expect(tipos).toEqual([
      { tipo: 'outro' },
      { tipo: 'tema', id: 'operacao' },
      { tipo: 'outro' },
      { tipo: 'outro' },
      { tipo: 'alto-contraste', esquema: 'claro' },
      { tipo: 'alto-contraste', esquema: 'escuro' },
    ])
  })

  it('blocosDeToken ignora regras dentro de @media', () => {
    const mapa = blocosDeToken(CSS_EXEMPLO)
    expect([...mapa.keys()].sort()).toEqual(['alto-contraste-claro', 'alto-contraste-escuro', 'operacao'])
    expect(mapa.get('operacao')?.['--bg-canvas']).toBe('#0B1120')
  })
})

// Feature: temas-selecionaveis, Property 2: Ida e volta do analisador de blocos
const SELETORES = [
  "[data-theme='operacao']",
  "[data-theme='corporativo']",
  "[data-theme='editorial']",
  "[data-theme='acolhedor']",
  "[data-superficie='terminal']",
  "html[data-contraste='alto']:not(.dark)",
  "html[data-contraste='alto'].dark",
  "html[data-contraste='alto'] [data-superficie='terminal']",
]
const VALORES = [
  '#0B1120', '#abc', '#ABCD', '#0EA5E9', '#020617B3', 'none',
  '0 0 0 1px #0EA5E959, 0 0 12px #0EA5E938',
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  "'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace",
  '0.75rem', '12px', '500',
]

function gerarSeletores(g: Gerador): string[] {
  const total = g.inteiro(1, 3)
  const escolhidos: string[] = []
  while (escolhidos.length < total) {
    const seletor = g.escolher(SELETORES)
    if (!escolhidos.includes(seletor)) escolhidos.push(seletor)
  }
  return escolhidos
}

function gerarMapa(g: Gerador): Record<string, string> {
  const mapa: Record<string, string> = {}
  const total = g.inteiro(1, 12)
  for (let i = 0; i < total; i += 1) mapa[`--token-${g.inteiro(0, 40)}`] = g.escolher(VALORES)
  return mapa
}

describe('ida e volta do analisador de blocos, propriedade', () => {
  it('lerDeclaracoes de lerBlocos de serializarBloco devolve o mesmo mapa, com comentários e linhas em branco', () => {
    paraTodo(
      'ida e volta do analisador',
      (g) => ({ seletores: gerarSeletores(g), mapa: gerarMapa(g), enfeites: g.lista((h) => h.inteiro(0, 2), 6) }),
      ({ seletores, mapa, enfeites }) => {
        const linhas = serializarBloco(seletores, mapa).split('\n')
        const inicio = linhas.findIndex((linha) => linha.endsWith('{'))
        const enfeitadas = linhas.flatMap((linha, indice) => {
          if (indice <= inicio || !linha.startsWith('  --')) return [linha]
          const enfeite = enfeites[indice % Math.max(enfeites.length, 1)] ?? 0
          if (enfeite === 1) return ['', linha]
          if (enfeite === 2) return ['  /* nota { ; } */', linha]
          return [linha]
        })
        const blocos = lerBlocos(`/* topo */\n${enfeitadas.join('\n')}`)
        expect(blocos).toHaveLength(1)
        expect(blocos[0].seletores).toEqual(seletores)
        const lido: Record<string, string> = {}
        for (const declaracao of lerDeclaracoes(blocos[0])) lido[declaracao.nome] = declaracao.valor
        expect(lido).toEqual(mapa)
      },
    )
  })
})

describe('conferência do contrato', () => {
  it('relata ausentes, vazios e excedentes de um exemplo', () => {
    const tokens = Object.fromEntries(CONTRATO_TOKENS.map((token) => [token.nome, 'x']))
    delete tokens['--bg-canvas']
    tokens['--bg-surface'] = ' '
    tokens['--outro'] = '1'
    expect(conferirContrato(tokens)).toEqual({ ausentes: ['--bg-canvas'], vazios: ['--bg-surface'], excedentes: ['--outro'] })
  })

  it('compara identificadores do catálogo com os dos blocos', () => {
    expect(compararIdentificadores(['a', 'b'], ['b', 'c'])).toEqual({ semBloco: ['a'], semCatalogo: ['c'] })
  })
})

// Feature: temas-selecionaveis, Property 3: Conferência do contrato e correspondência entre catálogo e blocos
describe('conferência do contrato, propriedade', () => {
  it('relata exatamente os nomes removidos, esvaziados e acrescentados', () => {
    paraTodo(
      'conferência do contrato',
      (g) => {
        const nomes = [...NOMES_DO_CONTRATO]
        const removidos = new Set<string>()
        const esvaziados = new Set<string>()
        for (const nome of nomes) {
          const sorteio = g.inteiro(0, 9)
          if (sorteio === 0) removidos.add(nome)
          else if (sorteio === 1) esvaziados.add(nome)
        }
        const extras = Array.from({ length: g.inteiro(0, 4) }, (_, i) => `--extra-${i}`)
        return { removidos, esvaziados, extras }
      },
      ({ removidos, esvaziados, extras }) => {
        const tokens: Record<string, string> = {}
        for (const nome of NOMES_DO_CONTRATO) {
          if (removidos.has(nome)) continue
          tokens[nome] = esvaziados.has(nome) ? '  ' : 'valor'
        }
        for (const extra of extras) tokens[extra] = 'valor'
        const resultado = conferirContrato(tokens)
        expect(new Set(resultado.ausentes)).toEqual(removidos)
        expect(new Set(resultado.vazios)).toEqual(esvaziados)
        expect(new Set(resultado.excedentes)).toEqual(new Set(extras))
        expect(resultado.ausentes).toHaveLength(removidos.size)
      },
    )
  })

  it('relata exatamente a diferença simétrica entre catálogo e blocos', () => {
    const universo = ['operacao', 'corporativo', 'editorial', 'acolhedor', 'telemetria', 'sepia', 'neon']
    paraTodo(
      'correspondência entre catálogo e blocos',
      (g) => ({
        catalogo: universo.filter(() => g.inteiro(0, 1) === 1),
        blocos: universo.filter(() => g.inteiro(0, 1) === 1),
      }),
      ({ catalogo, blocos }) => {
        const { semBloco, semCatalogo } = compararIdentificadores(catalogo, blocos)
        expect(new Set(semBloco)).toEqual(new Set(catalogo.filter((id) => !blocos.includes(id))))
        expect(new Set(semCatalogo)).toEqual(new Set(blocos.filter((id) => !catalogo.includes(id))))
      },
    )
  })
})
