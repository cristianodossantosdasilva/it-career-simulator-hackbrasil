import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS } from './catalogo.ts'
import {
  CHAVE_CONTRASTE,
  CHAVE_TEMA,
  lerContraste,
  lerPreferenciaTema,
  obterArmazenamento,
  salvarContraste,
  salvarPreferenciaTema,
} from './persistencia.ts'

describe('persistência da aparência', () => {
  it('usa as chaves itfs_tema e itfs_contraste', () => {
    expect(CHAVE_TEMA).toBe('itfs_tema')
    expect(CHAVE_CONTRASTE).toBe('itfs_contraste')
  })

  it('sem compatibilidade: nomes antigos em itfs_tema viram preferência ausente e continuam gravados', () => {
    for (const antigo of ['tactical', 'corporate']) {
      const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: antigo })
      expect(lerPreferenciaTema(armazenamento)).toBeNull()
      expect(armazenamento.dados.get(CHAVE_TEMA)).toBe(antigo)
      expect(armazenamento.gravacoes).toEqual([])
    }
  })

  it('não lê a chave antiga itfs_theme', () => {
    const armazenamento = criarArmazenamentoFalso({ itfs_theme: 'operacao' })
    expect(lerPreferenciaTema(armazenamento)).toBeNull()
  })

  it('armazenamento nulo: leitura vazia e gravação sem efeito', () => {
    expect(lerPreferenciaTema(null)).toBeNull()
    expect(lerContraste(null)).toBe('padrao')
    expect(salvarPreferenciaTema('operacao', null)).toBe(false)
    expect(salvarContraste('alto', null)).toBe(false)
  })

  it('armazenamento que lança exceção não propaga', () => {
    const armazenamento = criarArmazenamentoFalso({}, { falharLeitura: true, falharGravacao: true })
    expect(lerPreferenciaTema(armazenamento)).toBeNull()
    expect(lerContraste(armazenamento)).toBe('padrao')
    expect(salvarPreferenciaTema('editorial', armazenamento)).toBe(false)
    expect(salvarContraste('alto', armazenamento)).toBe(false)
  })

  it('obterArmazenamento devolve null quando o acesso à janela lança exceção', () => {
    const janela = {
      get localStorage(): Storage {
        throw new Error('bloqueado')
      },
    } as unknown as Window
    expect(obterArmazenamento(janela)).toBeNull()
  })
})

// Feature: temas-selecionaveis, Property 11: Ida e volta da persistência
describe('ida e volta da persistência, propriedade', () => {
  it('lê o que salvou e o contraste não altera o tema', () => {
    paraTodo(
      'ida e volta da persistência',
      (g) => ({
        tema: g.escolher(CATALOGO_TEMAS).id,
        contraste: g.escolher(['alto', 'padrao'] as const),
        outro: g.escolher(CATALOGO_TEMAS).id,
      }),
      ({ tema, contraste, outro }) => {
        const armazenamento = criarArmazenamentoFalso()
        expect(salvarPreferenciaTema(tema, armazenamento)).toBe(true)
        expect(lerPreferenciaTema(armazenamento)).toBe(tema)
        salvarContraste(contraste, armazenamento)
        expect(lerContraste(armazenamento)).toBe(contraste)
        expect(armazenamento.dados.get(CHAVE_TEMA)).toBe(tema)
        salvarPreferenciaTema(outro, armazenamento)
        expect(lerContraste(armazenamento)).toBe(contraste)
      },
    )
  })
})

// Feature: temas-selecionaveis, Property 12: Valores salvos inválidos
describe('valores salvos inválidos, propriedade', () => {
  it('só o identificador exato vale e a leitura nunca altera o valor salvo', () => {
    const ids = CATALOGO_TEMAS.map((tema) => tema.id as string)
    paraTodo(
      'valores salvos inválidos',
      (g) => {
        const base = g.escolher(ids)
        const variante = g.escolher([
          g.texto(12),
          base.toUpperCase(),
          ` ${base}`,
          `${base} `,
          `${base}\n`,
          '',
          base[0].toUpperCase() + base.slice(1),
        ])
        return variante
      },
      (texto) => {
        const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: texto, [CHAVE_CONTRASTE]: texto })
        const esperadoTema = ids.includes(texto) ? texto : null
        expect(lerPreferenciaTema(armazenamento)).toBe(esperadoTema)
        expect(lerContraste(armazenamento)).toBe(texto === 'alto' ? 'alto' : 'padrao')
        expect(armazenamento.dados.get(CHAVE_TEMA)).toBe(texto)
        expect(armazenamento.dados.get(CHAVE_CONTRASTE)).toBe(texto)
        expect(armazenamento.gravacoes).toEqual([])
      },
    )
  })
})
