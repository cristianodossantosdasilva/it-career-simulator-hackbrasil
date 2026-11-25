import { describe, expect, it } from 'vitest'
import { paraTodo, type Gerador } from '../testes/propriedade'
import {
  CATALOGO_TEMAS,
  TEMA_DO_TERMINAL,
  TEMA_PADRAO_PRODUTO,
  ehIdTema,
  obterTema,
  validarCatalogo,
} from './catalogo.ts'
import {
  CONTRATO_TOKENS,
  NOMES_DO_CONTRATO,
  TOKENS_DE_COR,
  type CategoriaToken,
} from './contratoTokens.ts'

const SIMBOLO = String.fromCharCode(38)

function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

describe('catálogo de temas', () => {
  it('tem a ordem, os esquemas e os padrões esperados', () => {
    expect(CATALOGO_TEMAS.map((tema) => tema.id)).toEqual(['operacao', 'corporativo', 'editorial', 'acolhedor'])
    expect(CATALOGO_TEMAS.map((tema) => tema.esquema)).toEqual(['escuro', 'claro', 'escuro', 'claro'])
    expect(TEMA_PADRAO_PRODUTO).toBe('corporativo')
    expect(TEMA_DO_TERMINAL).toBe('operacao')
  })

  it('usa como identificador o nome visível normalizado', () => {
    for (const tema of CATALOGO_TEMAS) expect(tema.id).toBe(normalizarNome(tema.nome))
  })

  it('não tem E comercial em nenhum nome e é válido', () => {
    for (const tema of CATALOGO_TEMAS) expect(tema.nome.includes(SIMBOLO)).toBe(false)
    expect(validarCatalogo(CATALOGO_TEMAS)).toEqual([])
  })

  it('compara identificadores com ===, sem normalizar', () => {
    expect(ehIdTema('operacao')).toBe(true)
    for (const valor of ['Operacao', ' operacao', 'operacao ', 'sepia', 'neon', '', null, undefined, 3]) {
      expect(ehIdTema(valor)).toBe(false)
    }
    expect(obterTema('editorial').nome).toBe('Editorial')
  })
})

describe('contrato de tokens', () => {
  it('tem 63 nomes, 33 de cor, sem repetição', () => {
    expect(CONTRATO_TOKENS).toHaveLength(63)
    expect(NOMES_DO_CONTRATO.size).toBe(63)
    expect(TOKENS_DE_COR).toHaveLength(33)
    const contagem: Record<CategoriaToken, number> = { cor: 0, sombra: 0, familia: 0, tamanho: 0, peso: 0, espaco: 0, raio: 0 }
    for (const token of CONTRATO_TOKENS) contagem[token.categoria] += 1
    expect(contagem).toEqual({ cor: 33, sombra: 4, familia: 2, tamanho: 8, peso: 4, espaco: 9, raio: 3 })
  })
})

describe('validarCatalogo, exemplos por tipo de defeito', () => {
  const valida = { id: 'azul-claro', nome: 'Azul claro', esquema: 'claro' }
  it('aceita entrada válida', () => {
    expect(validarCatalogo([valida])).toEqual([])
  })
  it('acusa campo ausente', () => {
    expect(validarCatalogo([{ nome: 'x', esquema: 'claro' }])).toEqual([{ indice: 0, id: null, campo: 'id', motivo: 'ausente' }])
  })
  it('acusa identificador fora do formato', () => {
    expect(validarCatalogo([{ ...valida, id: 'Azul' }])).toEqual([{ indice: 0, id: 'Azul', campo: 'id', motivo: 'formato' }])
  })
  it('acusa identificador repetido', () => {
    expect(validarCatalogo([valida, valida])).toEqual([{ indice: 1, id: 'azul-claro', campo: 'id', motivo: 'repetido' }])
  })
  it('acusa nome vazio, longo e com E comercial', () => {
    const erros = validarCatalogo([
      { ...valida, id: 'um-tema', nome: '' },
      { ...valida, id: 'dois-tema', nome: 'a'.repeat(41) },
      { ...valida, id: 'tres-tema', nome: `A${SIMBOLO}B` },
    ])
    expect(erros.map((erro) => [erro.indice, erro.campo, erro.motivo])).toEqual([
      [0, 'nome', 'formato'],
      [1, 'nome', 'formato'],
      [2, 'nome', 'formato'],
    ])
  })
  it('acusa esquema inválido', () => {
    expect(validarCatalogo([{ ...valida, esquema: 'sepia' }])).toEqual([{ indice: 0, id: 'azul-claro', campo: 'esquema', motivo: 'formato' }])
  })
})

describe('validação do catálogo, propriedade', () => {
  // Feature: temas-selecionaveis, Property 1: Validação do catálogo
  type Defeito = 'id-ausente' | 'id-formato' | 'id-repetido' | 'nome-vazio' | 'nome-longo' | 'nome-simbolo' | 'esquema'
  const DEFEITOS: readonly Defeito[] = ['id-ausente', 'id-formato', 'id-repetido', 'nome-vazio', 'nome-longo', 'nome-simbolo', 'esquema']

  function gerarCaso(g: Gerador) {
    const total = g.inteiro(3, 8)
    const entradas: Record<string, unknown>[] = Array.from({ length: total }, (_, i) => ({
      id: `tema-${String.fromCharCode(97 + i)}${i}`,
      nome: `Tema ${i}`,
      esquema: i % 2 === 0 ? 'claro' : 'escuro',
    }))
    const indices = Array.from({ length: total }, (_, i) => i)
    const sorteados = new Set<number>()
    const quantidade = g.inteiro(0, total)
    while (sorteados.size < quantidade) sorteados.add(g.escolher(indices))
    const defeituosos = [...sorteados]
    const esperados: { indice: number; campo: string; motivo: string }[] = []
    for (const indice of defeituosos) {
      let defeito = g.escolher(DEFEITOS)
      const fontes = indices.filter((i) => i < indice && !sorteados.has(i))
      if (defeito === 'id-repetido' && fontes.length === 0) defeito = 'id-formato'
      const entrada = entradas[indice]
      if (defeito === 'id-ausente') {
        delete entrada.id
        esperados.push({ indice, campo: 'id', motivo: 'ausente' })
      } else if (defeito === 'id-formato') {
        entrada.id = g.escolher(['Tema', 'a', 'tema_1', '1tema', 'tema espaco'])
        esperados.push({ indice, campo: 'id', motivo: 'formato' })
      } else if (defeito === 'id-repetido') {
        entrada.id = entradas[g.escolher(fontes)].id
        esperados.push({ indice, campo: 'id', motivo: 'repetido' })
      } else if (defeito === 'nome-vazio') {
        entrada.nome = ''
        esperados.push({ indice, campo: 'nome', motivo: 'formato' })
      } else if (defeito === 'nome-longo') {
        entrada.nome = 'n'.repeat(g.inteiro(41, 60))
        esperados.push({ indice, campo: 'nome', motivo: 'formato' })
      } else if (defeito === 'nome-simbolo') {
        entrada.nome = `A${SIMBOLO}B`
        esperados.push({ indice, campo: 'nome', motivo: 'formato' })
      } else {
        entrada.esquema = g.escolher(['sepia', '', 'CLARO'])
        esperados.push({ indice, campo: 'esquema', motivo: 'formato' })
      }
    }
    return { entradas, esperados }
  }

  it('retorna exatamente um erro por defeito injetado e nenhum para listas sem defeito', () => {
    paraTodo('validação do catálogo', gerarCaso, ({ entradas, esperados }) => {
      const erros = validarCatalogo(entradas).map(({ indice, campo, motivo }) => ({ indice, campo, motivo }))
      const ordenar = (lista: { indice: number; campo: string }[]) =>
        [...lista].sort((a, b) => a.indice - b.indice || a.campo.localeCompare(b.campo))
      expect(ordenar(erros)).toEqual(ordenar(esperados))
    })
  })
})
