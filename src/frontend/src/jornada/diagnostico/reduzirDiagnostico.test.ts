import { describe, expect, it } from 'vitest'
import type { PerguntaDiagnostico } from '../armazenamento/cartaoPerfil'
import { ROTEIRO_DIAGNOSTICO } from '../catalogos/catalogoVocacional'
import { paraTodo } from '../../testes/propriedade'
import {
  type AcaoDiagnostico,
  ESTADO_INICIAL_DIAGNOSTICO,
  type EstadoDiagnostico,
  reduzirDiagnostico,
  respostasCompletas,
} from './reduzirDiagnostico'

const PERGUNTAS = ROTEIRO_DIAGNOSTICO.perguntas
const TOTAL = PERGUNTAS.length
const TODAS_AS_OPCOES = [...new Set(PERGUNTAS.flatMap((pergunta) => pergunta.opcoes.map((opcao) => opcao.id))), 'invalida']

function aplicar(acoes: readonly AcaoDiagnostico[]): EstadoDiagnostico {
  return acoes.reduce(reduzirDiagnostico, ESTADO_INICIAL_DIAGNOSTICO)
}

describe('reduzirDiagnostico', () => {
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
    expect(reduzirDiagnostico(indicacao, { tipo: 'confirmar' }).fase).toBe('cartao')
  })

  it('voltar na indicação retorna à última pergunta e mantém as respostas', () => {
    const indicacao = aplicar([
      { tipo: 'responder', opcaoId: 'ajudar-pessoas' },
      { tipo: 'responder', opcaoId: 'perguntar-o-que-aparece' },
      { tipo: 'responder', opcaoId: 'praticar' },
    ])
    const voltou = reduzirDiagnostico(indicacao, { tipo: 'voltar' })
    expect(voltou).toMatchObject({ fase: 'perguntas', indice: TOTAL - 1 })
    expect(respostasCompletas(voltou)).not.toBeNull()
  })

  it('confirmar fora da indicação e opção de outra pergunta não mudam nada', () => {
    expect(reduzirDiagnostico(ESTADO_INICIAL_DIAGNOSTICO, { tipo: 'confirmar' })).toBe(ESTADO_INICIAL_DIAGNOSTICO)
    expect(reduzirDiagnostico(ESTADO_INICIAL_DIAGNOSTICO, { tipo: 'responder', opcaoId: 'praticar' })).toBe(
      ESTADO_INICIAL_DIAGNOSTICO,
    )
    expect(reduzirDiagnostico(ESTADO_INICIAL_DIAGNOSTICO, { tipo: 'voltar' })).toBe(ESTADO_INICIAL_DIAGNOSTICO)
  })
})

describe('Feature: jornada-de-missao, Property 10: Redutor do diagnóstico', () => {
  it('mantém o índice no intervalo, só chega à indicação com tudo respondido e guarda a última resposta', () => {
    paraTodo(
      'redutor do diagnóstico',
      (g) =>
        g.lista(
          (h): AcaoDiagnostico => {
            const sorteio = h.inteiro(0, 9)
            if (sorteio <= 5) return { tipo: 'responder', opcaoId: h.escolher(TODAS_AS_OPCOES) }
            if (sorteio <= 8) return { tipo: 'voltar' }
            return sorteio === 9 && h.inteiro(0, 3) === 0 ? { tipo: 'reiniciar' } : { tipo: 'confirmar' }
          },
          40,
        ),
      (acoes) => {
        let estado = ESTADO_INICIAL_DIAGNOSTICO
        let modelo: Partial<Record<PerguntaDiagnostico, string>> = {}
        for (const acao of acoes) {
          if (acao.tipo === 'reiniciar') modelo = {}
          if (acao.tipo === 'responder' && estado.fase === 'perguntas') {
            const pergunta = PERGUNTAS[estado.indice]
            if (pergunta.opcoes.some((opcao) => opcao.id === acao.opcaoId)) {
              modelo = { ...modelo, [pergunta.id]: acao.opcaoId }
            }
          }
          estado = reduzirDiagnostico(estado, acao)
          expect(estado.indice).toBeGreaterThanOrEqual(0)
          expect(estado.indice).toBeLessThanOrEqual(TOTAL - 1)
          if (estado.fase !== 'perguntas') expect(respostasCompletas(estado)).not.toBeNull()
          expect(estado.respostas).toEqual(modelo)
        }
      },
    )
  })
})
