import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { gerarDataIso } from '../../testes/geradoresJornada'
import { type Gerador, paraTodo } from '../../testes/propriedade'
import {
  CHAVE_MODO_DEMONSTRACAO,
  type ModoDemonstracao,
  analisarModoDemonstracao,
  gravarModoDemonstracao,
  lerModoDemonstracao,
  serializarModoDemonstracao,
} from './modoDemonstracao'

function gerarModo(g: Gerador): ModoDemonstracao {
  return {
    versao: 1,
    ativo: g.inteiro(0, 1) === 1,
    origem: g.escolher(['plano-de-carreira', 'atalho-experimentar'] as const),
    alteradoEm: gerarDataIso(g),
  }
}

const MODO_ATIVO: ModoDemonstracao = {
  versao: 1,
  ativo: true,
  origem: 'plano-de-carreira',
  alteradoEm: '2026-11-20T12:00:00.000Z',
}

describe('modoDemonstracao', () => {
  it('Feature: jornada-de-missao, Property 6: Ida e volta do armazenamento (modo de demonstração)', () => {
    paraTodo('ida e volta do modo', gerarModo, (modo) => {
      expect(analisarModoDemonstracao(serializarModoDemonstracao(modo))).toEqual(modo)
      const armazenamento = criarArmazenamentoFalso()
      expect(gravarModoDemonstracao(armazenamento, modo)).toBe(true)
      expect(lerModoDemonstracao(armazenamento)).toBe(modo.ativo)
      expect(armazenamento.gravacoes.map((item) => item.chave)).toEqual([CHAVE_MODO_DEMONSTRACAO])
    })
  })

  it('Feature: jornada-de-missao, Property 7: Dado inválido é tratado como ausente (modo de demonstração)', () => {
    paraTodo(
      'texto arbitrário não ativa o modo',
      (g) => g.escolher([g.texto(40), JSON.stringify(g.texto(10)), '[]', 'null', '{', '{"versao":1}', '{"versao":2,"ativo":true}']),
      (texto) => {
        expect(() => analisarModoDemonstracao(texto)).not.toThrow()
        expect(analisarModoDemonstracao(texto)).toBeNull()
        const armazenamento = criarArmazenamentoFalso({ [CHAVE_MODO_DEMONSTRACAO]: texto })
        expect(lerModoDemonstracao(armazenamento)).toBe(false)
        expect(armazenamento.gravacoes).toHaveLength(0)
        expect(armazenamento.dados.get(CHAVE_MODO_DEMONSTRACAO)).toBe(texto)
      },
    )
  })

  it('campos com tipo ou valor errado são tratados como ausentes, mesmo com ativo verdadeiro', () => {
    const corrupcoes: ((modo: Record<string, unknown>) => void)[] = [
      (m) => (m.versao = 2),
      (m) => (m.versao = 99),
      (m) => delete m.versao,
      (m) => (m.ativo = 'true'),
      (m) => (m.ativo = 1),
      (m) => delete m.ativo,
      (m) => (m.origem = 'outra'),
      (m) => delete m.origem,
      (m) => (m.alteradoEm = 20261130),
      (m) => delete m.alteradoEm,
    ]
    for (const corromper of corrupcoes) {
      const modo: Record<string, unknown> = { ...MODO_ATIVO }
      corromper(modo)
      const texto = JSON.stringify(modo)
      expect(analisarModoDemonstracao(texto)).toBeNull()
      expect(lerModoDemonstracao(criarArmazenamentoFalso({ [CHAVE_MODO_DEMONSTRACAO]: texto }))).toBe(false)
    }
  })

  it('sem chave gravada o modo é inativo', () => {
    expect(lerModoDemonstracao(criarArmazenamentoFalso())).toBe(false)
  })

  it('getItem que lança devolve inativo, sem lançar e sem gravar', () => {
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_MODO_DEMONSTRACAO]: serializarModoDemonstracao(MODO_ATIVO) }, { falharLeitura: true })
    expect(() => lerModoDemonstracao(armazenamento)).not.toThrow()
    expect(lerModoDemonstracao(armazenamento)).toBe(false)
    expect(armazenamento.gravacoes).toHaveLength(0)
  })

  it('setItem que lança devolve falso', () => {
    const armazenamento = criarArmazenamentoFalso({}, { falharGravacao: true })
    expect(gravarModoDemonstracao(armazenamento, MODO_ATIVO)).toBe(false)
    expect(armazenamento.dados.size).toBe(0)
  })

  it('desativar grava ativo falso sem apagar a chave', () => {
    const armazenamento = criarArmazenamentoFalso()
    gravarModoDemonstracao(armazenamento, MODO_ATIVO)
    gravarModoDemonstracao(armazenamento, { ...MODO_ATIVO, ativo: false, origem: 'atalho-experimentar' })
    expect(armazenamento.dados.has(CHAVE_MODO_DEMONSTRACAO)).toBe(true)
    expect(analisarModoDemonstracao(armazenamento.dados.get(CHAVE_MODO_DEMONSTRACAO) ?? null)?.ativo).toBe(false)
    expect(lerModoDemonstracao(armazenamento)).toBe(false)
  })

  it('a leitura nunca chama setItem nem removeItem', () => {
    const chamadas: string[] = []
    const leitor = {
      getItem: () => serializarModoDemonstracao(MODO_ATIVO),
      setItem: () => chamadas.push('setItem'),
      removeItem: () => chamadas.push('removeItem'),
    }
    expect(lerModoDemonstracao(leitor)).toBe(true)
    expect(chamadas).toEqual([])
  })
})
