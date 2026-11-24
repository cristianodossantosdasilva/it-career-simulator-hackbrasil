import { describe, expect, it } from 'vitest'
import { MISSOES_CATALOGO, gerarMissoesAtivas } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import { MISSOES_ATIVAS_VAZIO } from '../armazenamento/missoesAtivas'
import { decidirInicioMesa } from './decidirInicioMesa'

describe('decidirInicioMesa', () => {
  it('Feature: jornada-de-missao, Property 14: Abertura da mesa de trabalho nunca duplica sessão', () => {
    paraTodo(
      'abertura da mesa de trabalho',
      (g) => ({
        missao: g.escolher(MISSOES_CATALOGO),
        emMemoria: g.inteiro(0, 2) === 0 ? null : { cenarioId: g.escolher(MISSOES_CATALOGO) },
        missoesAtivas: gerarMissoesAtivas(g),
        nova: g.inteiro(0, 3) === 0,
      }),
      ({ missao, emMemoria, missoesAtivas, nova }) => {
        const decisao = decidirInicioMesa(missao, emMemoria, missoesAtivas, nova)
        const gravada = missoesAtivas.porMissao[missao]
        if (nova) {
          expect(decisao).toEqual({ tipo: 'criar' })
        } else if (emMemoria?.cenarioId === missao) {
          expect(decisao).toEqual({ tipo: 'usar-memoria' })
        } else if (gravada) {
          expect(decisao).toEqual({ tipo: 'retomar', sessaoId: gravada })
        } else {
          expect(decisao).toEqual({ tipo: 'criar' })
        }
      },
    )
  })

  it('exemplos', () => {
    const missoesAtivas = { ...MISSOES_ATIVAS_VAZIO, porMissao: { 'incidente-massivo': 'sessao-7' } }
    expect(decidirInicioMesa('incidente-massivo', null, missoesAtivas, false)).toEqual({ tipo: 'retomar', sessaoId: 'sessao-7' })
    expect(decidirInicioMesa('incidente-massivo', { cenarioId: 'incidente-massivo' }, missoesAtivas, false)).toEqual({
      tipo: 'usar-memoria',
    })
    expect(decidirInicioMesa('pasta-rede-inacessivel', { cenarioId: 'incidente-massivo' }, missoesAtivas, false)).toEqual({
      tipo: 'criar',
    })
    expect(decidirInicioMesa('incidente-massivo', { cenarioId: 'incidente-massivo' }, missoesAtivas, true)).toEqual({ tipo: 'criar' })
  })
})
