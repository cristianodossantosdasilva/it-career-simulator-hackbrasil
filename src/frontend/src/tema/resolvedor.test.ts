import { describe, expect, it } from 'vitest'
import { type Gerador, paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS, type IdTema, ehIdTema } from './catalogo.ts'
import type { ConfiguracaoNormalizada } from './configuracaoCliente.ts'
import { type EsquemaNavegador, permissoesEfetivas, resolverTema } from './resolvedor.ts'

const IDS: readonly IdTema[] = CATALOGO_TEMAS.map((tema) => tema.id)
const ESQUEMAS: readonly EsquemaNavegador[] = ['light', 'dark', 'no-preference', null]

function resolver(configuracao: ConfiguracaoNormalizada | null, preferencia: string | null, esquema: EsquemaNavegador) {
  return resolverTema({ configuracao, preferencia, esquemaNavegador: esquema })
}

describe('resolvedor de tema, exemplos do catálogo real', () => {
  it('sem configuração: esquema escuro vira operacao, claro vira corporativo, o resto corporativo', () => {
    expect(resolver(null, null, 'dark')).toBe('operacao')
    expect(resolver(null, null, 'light')).toBe('corporativo')
    expect(resolver(null, null, 'no-preference')).toBe('corporativo')
    expect(resolver(null, null, null)).toBe('corporativo')
  })

  it('preferência válida vence o esquema do navegador', () => {
    expect(resolver(null, 'acolhedor', 'dark')).toBe('acolhedor')
  })

  it('trava com padrão vence a preferência', () => {
    const configuracao: ConfiguracaoNormalizada = { temasPermitidos: ['corporativo', 'acolhedor'], temaPadrao: 'corporativo', travado: true }
    expect(resolver(configuracao, 'acolhedor', 'dark')).toBe('corporativo')
  })

  it('preferência fora dos permitidos é ignorada', () => {
    const configuracao: ConfiguracaoNormalizada = { temasPermitidos: ['corporativo', 'acolhedor'], temaPadrao: null, travado: false }
    expect(resolver(configuracao, 'operacao', 'dark')).toBe('corporativo')
  })

  it('o resolvedor não recebe o contraste como parâmetro', () => {
    expect(resolverTema.length).toBe(1)
  })
})

function gerarConfiguracao(g: Gerador): ConfiguracaoNormalizada | null {
  if (g.inteiro(0, 4) === 0) return null
  const universo = [...IDS, 'sepia', 'xyz'] as string[]
  const lista = g.lista((h) => h.escolher(universo), 6)
  const padrao = g.inteiro(0, 2) === 0 ? null : g.escolher(universo)
  return {
    temasPermitidos: lista as IdTema[],
    temaPadrao: padrao as IdTema | null,
    travado: g.inteiro(0, 1) === 1,
  }
}

function gerarEntradas(g: Gerador) {
  const preferencia = g.escolher<string | null>([null, ...IDS, g.texto(8), 'Operacao'])
  return { configuracao: gerarConfiguracao(g), preferencia, esquema: g.escolher(ESQUEMAS) }
}

// Feature: temas-selecionaveis, Property 6: Totalidade e determinismo do resolvedor
describe('totalidade e determinismo, propriedade', () => {
  it('sempre devolve um tema do catálogo e permitido, e o mesmo resultado para as mesmas entradas', () => {
    paraTodo('totalidade do resolvedor', gerarEntradas, ({ configuracao, preferencia, esquema }) => {
      const primeiro = resolver(configuracao, preferencia, esquema)
      expect(ehIdTema(primeiro)).toBe(true)
      expect(permissoesEfetivas(configuracao).permitidos).toContain(primeiro)
      expect(resolver(configuracao, preferencia, esquema)).toBe(primeiro)
    })
  })
})

// Feature: temas-selecionaveis, Property 7: Precedência da trava
describe('precedência da trava, propriedade', () => {
  it('com trava, devolve o padrão efetivo ou o resultado sem preferência', () => {
    paraTodo('precedência da trava', gerarEntradas, ({ configuracao, preferencia, esquema }) => {
      if (configuracao === null) return
      const travada = { ...configuracao, travado: true }
      const { padrao, travado } = permissoesEfetivas(travada)
      if (!travado) return // lista vazia desliga a trava (3.9)
      const resultado = resolver(travada, preferencia, esquema)
      if (padrao !== null) expect(resultado).toBe(padrao)
      else expect(resultado).toBe(resolver(travada, null, esquema))
    })
  })
})

// Feature: temas-selecionaveis, Property 8: Preferência e cadeia de reserva
describe('preferência e cadeia de reserva, propriedade', () => {
  it('segue a ordem preferência, padrão, esquema, operacao e primeiro permitido', () => {
    paraTodo('cadeia de reserva', gerarEntradas, ({ configuracao, preferencia, esquema }) => {
      const destravada = configuracao === null ? null : { ...configuracao, travado: false }
      const { permitidos, padrao } = permissoesEfetivas(destravada)
      const naOrdem = CATALOGO_TEMAS.filter((tema) => permitidos.includes(tema.id))
      let esperado: IdTema
      if (preferencia !== null && permitidos.some((id) => id === preferencia)) esperado = preferencia as IdTema
      else if (padrao !== null) esperado = padrao
      else {
        const alvo = esquema === 'dark' ? 'escuro' : esquema === 'light' ? 'claro' : null
        const porEsquema = alvo === null ? undefined : naOrdem.find((tema) => tema.esquema === alvo)
        if (porEsquema !== undefined) esperado = porEsquema.id
        else if (permitidos.includes('corporativo')) esperado = 'corporativo'
        else esperado = naOrdem[0].id
      }
      expect(resolver(destravada, preferencia, esquema)).toBe(esperado)
    })
  })
})

// Feature: temas-selecionaveis, Property 9: Equivalências de entrada do resolvedor
describe('equivalências de entrada, propriedade', () => {
  it('preferência fora dos permitidos equivale a preferência nula, sem gravar', () => {
    paraTodo('preferência fora dos permitidos', gerarEntradas, ({ configuracao, preferencia, esquema }) => {
      const { permitidos } = permissoesEfetivas(configuracao)
      if (preferencia !== null && permitidos.some((id) => id === preferencia)) return
      expect(resolver(configuracao, preferencia, esquema)).toBe(resolver(configuracao, null, esquema))
    })
  })

  it('configuração sem tema do catálogo equivale a configuração nula', () => {
    paraTodo(
      'lista sem identificador do catálogo',
      (g) => ({
        lista: g.lista((h) => h.escolher(['sepia', 'neon', 'xyz', '', 'Operacao']), 5),
        padrao: g.escolher<string | null>([null, 'operacao', 'xyz']),
        travado: g.inteiro(0, 1) === 1,
        preferencia: g.escolher<string | null>([null, ...IDS]),
        esquema: g.escolher(ESQUEMAS),
      }),
      ({ lista, padrao, travado, preferencia, esquema }) => {
        const configuracao = { temasPermitidos: lista as unknown as IdTema[], temaPadrao: padrao as IdTema | null, travado }
        expect(resolver(configuracao, preferencia, esquema)).toBe(resolver(null, preferencia, esquema))
      },
    )
  })
})
