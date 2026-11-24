import { describe, expect, it } from 'vitest'
import type { PerguntaCheckIn } from '../armazenamento/cartaoEmbarque'
import { ROTEIRO_CHECKIN } from '../catalogos/catalogoVocacional'
import { paraTodo } from '../../testes/propriedade'
import {
  type AcaoCheckIn,
  ESTADO_INICIAL_CHECKIN,
  type EstadoCheckIn,
  reduzirCheckIn,
  respostasCompletas,
} from './reduzirCheckIn'

const PERGUNTAS = ROTEIRO_CHECKIN.perguntas
const TOTAL = PERGUNTAS.length
const TODAS_AS_OPCOES = [...new Set(PERGUNTAS.flatMap((pergunta) => pergunta.opcoes.map((opcao) => opcao.id))), 'invalida']

function aplicar(acoes: readonly AcaoCheckIn[]): EstadoCheckIn {
  return acoes.reduce(reduzirCheckIn, ESTADO_INICIAL_CHECKIN)
}

describe('reduzirCheckIn', () => {
  it('responde as três perguntas e chega à indicação, depois ao cartão', () => {
    const indicacao = aplicar([
      { tipo: 'responder', opcaoId: 'ajudar-pessoas' },
      { tipo: 'responder', opcaoId: 'perguntar-o-que-aparece' },
      { tipo: 'responder', opcaoId: 'praticar' },
    ])
    expect(indicacao.fase).toBe('indicacao')
    expect(respostasCompletas(indicacao)).toEqual({
      interesse: 'ajudar-pessoas',
      situacao: 'perguntar-o-que-aparece',
      ritmo: 'praticar',
    })
    expect(reduzirCheckIn(indicacao, { tipo: 'confirmar' }).fase).toBe('cartao')
  })

  it('voltar na indicação retorna à última pergunta e mantém as respostas', () => {
    const indicacao = aplicar([
      { tipo: 'responder', opcaoId: 'ajudar-pessoas' },
      { tipo: 'responder', opcaoId: 'perguntar-o-que-aparece' },
      { tipo: 'responder', opcaoId: 'praticar' },
    ])
    const voltou = reduzirCheckIn(indicacao, { tipo: 'voltar' })
    expect(voltou).toMatchObject({ fase: 'perguntas', indice: TOTAL - 1 })
    expect(respostasCompletas(voltou)).not.toBeNull()
  })

  it('confirmar fora da indicação e opção de outra pergunta não mudam nada', () => {
    expect(reduzirCheckIn(ESTADO_INICIAL_CHECKIN, { tipo: 'confirmar' })).toBe(ESTADO_INICIAL_CHECKIN)
    expect(reduzirCheckIn(ESTADO_INICIAL_CHECKIN, { tipo: 'responder', opcaoId: 'praticar' })).toBe(
      ESTADO_INICIAL_CHECKIN,
    )
    expect(reduzirCheckIn(ESTADO_INICIAL_CHECKIN, { tipo: 'voltar' })).toBe(ESTADO_INICIAL_CHECKIN)
  })
})

describe('Feature: jornada-de-voo, Property 10: Redutor do diagnóstico', () => {
  it('mantém o índice no intervalo, só chega à indicação com tudo respondido e guarda a última resposta', () => {
    paraTodo(
      'redutor do diagnóstico',
      (g) =>
        g.lista(
          (h): AcaoCheckIn => {
            const sorteio = h.inteiro(0, 9)
            if (sorteio <= 5) return { tipo: 'responder', opcaoId: h.escolher(TODAS_AS_OPCOES) }
            if (sorteio <= 8) return { tipo: 'voltar' }
            return sorteio === 9 && h.inteiro(0, 3) === 0 ? { tipo: 'reiniciar' } : { tipo: 'confirmar' }
          },
          40,
        ),
      (acoes) => {
        let estado = ESTADO_INICIAL_CHECKIN
        let modelo: Partial<Record<PerguntaCheckIn, string>> = {}
        for (const acao of acoes) {
          if (acao.tipo === 'reiniciar') modelo = {}
          if (acao.tipo === 'responder' && estado.fase === 'perguntas') {
            const pergunta = PERGUNTAS[estado.indice]
            if (pergunta.opcoes.some((opcao) => opcao.id === acao.opcaoId)) {
              modelo = { ...modelo, [pergunta.id]: acao.opcaoId }
            }
          }
          estado = reduzirCheckIn(estado, acao)
          expect(estado.indice).toBeGreaterThanOrEqual(0)
          expect(estado.indice).toBeLessThanOrEqual(TOTAL - 1)
          if (estado.fase !== 'perguntas') expect(respostasCompletas(estado)).not.toBeNull()
          expect(estado.respostas).toEqual(modelo)
        }
      },
    )
  })
})
