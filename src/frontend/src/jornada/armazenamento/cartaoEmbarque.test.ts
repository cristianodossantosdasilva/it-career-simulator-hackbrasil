import { describe, expect, it } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { gerarCartao, gerarRegistros } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import {
  CHAVE_CARTAO_EMBARQUE,
  analisarCartao,
  gravarCartao,
  lerCartao,
  serializarCartao,
} from './cartaoEmbarque'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from './registrosVoo'

/** Corrompe um cartão válido trocando um campo por valor inválido. */
const CORRUPCOES: readonly ((cartao: Record<string, unknown>) => void)[] = [
  (c) => (c.versao = 2),
  (c) => delete c.versao,
  (c) => (c.versaoRoteiro = 7),
  (c) => (c.rotaId = 'rota-inexistente'),
  (c) => (c.rotaId = 'dados'),
  (c) => (c.rotaId = 'infraestrutura-nuvem'),
  (c) => (c.rotaIndicadaId = 'qualquer'),
  (c) => (c.primeiraEscalaId = 'escala-fora'),
  (c) => (c.respostas = null),
  (c) => (c.respostas = { interesse: 'x', situacao: 3, ritmo: 'y' }),
  (c) => (c.origem = 'demonstracao'),
  (c) => delete c.origem,
  (c) => (c.emitidoEm = 'ontem'),
  (c) => (c.emitidoEm = 20261130),
]

describe('cartaoEmbarque', () => {
  it('Feature: jornada-de-voo, Property 6: Ida e volta do armazenamento (cartão com as duas origens)', () => {
    paraTodo('ida e volta do cartão', gerarCartao, (cartao) => {
      expect(analisarCartao(serializarCartao(cartao))).toEqual(cartao)
      const armazenamento = criarArmazenamentoFalso()
      expect(gravarCartao(armazenamento, cartao)).toBe(true)
      expect(lerCartao(armazenamento)).toEqual(cartao)
    })
  })

  it('Feature: jornada-de-voo, Property 7: Dado inválido é tratado como ausente (texto arbitrário)', () => {
    paraTodo(
      'texto arbitrário não vira cartão',
      (g) => g.escolher([g.texto(40), JSON.stringify(g.texto(10)), '[]', 'null', '{', '{"versao":1}']),
      (texto) => {
        expect(() => analisarCartao(texto)).not.toThrow()
        expect(analisarCartao(texto)).toBeNull()
      },
    )
    expect(analisarCartao(null)).toBeNull()
  })

  it('Feature: jornada-de-voo, Property 7: Dado inválido é tratado como ausente (campo corrompido)', () => {
    paraTodo(
      'cartão com campo corrompido',
      (g) => ({ cartao: gerarCartao(g), corrupcao: g.inteiro(0, CORRUPCOES.length - 1) }),
      ({ cartao, corrupcao }) => {
        const copia = JSON.parse(serializarCartao(cartao)) as Record<string, unknown>
        CORRUPCOES[corrupcao](copia)
        expect(analisarCartao(JSON.stringify(copia))).toBeNull()
      },
    )
  })

  it('Feature: jornada-de-voo, Property 8: Refazer o check-in preserva os registros', () => {
    paraTodo(
      'gravar o segundo cartão não toca os registros',
      (g) => ({ primeiro: gerarCartao(g), segundo: gerarCartao(g), registros: gerarRegistros(g) }),
      ({ primeiro, segundo, registros }) => {
        const textoRegistros = serializarRegistros(registros)
        const armazenamento = criarArmazenamentoFalso({ [CHAVE_REGISTROS_VOO]: textoRegistros })
        gravarCartao(armazenamento, primeiro)
        gravarCartao(armazenamento, segundo)
        expect(armazenamento.getItem(CHAVE_REGISTROS_VOO)).toBe(textoRegistros)
        expect(lerCartao(armazenamento)).toEqual(segundo)
        expect(armazenamento.gravacoes.every((g) => g.chave === CHAVE_CARTAO_EMBARQUE)).toBe(true)
      },
    )
  })

  it('devolve falso quando setItem lança e nulo quando getItem lança', () => {
    expect(gravarCartao(criarArmazenamentoFalso({}, { falharGravacao: true }), CARTAO_DE_TESTE)).toBe(false)
    const ilegivel = criarArmazenamentoFalso(
      { [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE) },
      { falharLeitura: true },
    )
    expect(lerCartao(ilegivel)).toBeNull()
  })
})
