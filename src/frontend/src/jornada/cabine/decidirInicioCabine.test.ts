import { describe, expect, it } from 'vitest'
import { MISSOES_CATALOGO, gerarVoosAtivos } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import { VOOS_ATIVOS_VAZIO } from '../armazenamento/voosAtivos'
import { decidirInicioCabine } from './decidirInicioCabine'

describe('decidirInicioCabine', () => {
  it('Feature: jornada-de-voo, Property 14: Abertura da mesa de trabalho nunca duplica sessão', () => {
    paraTodo(
      'abertura da mesa de trabalho',
      (g) => ({
        missao: g.escolher(MISSOES_CATALOGO),
        emMemoria: g.inteiro(0, 2) === 0 ? null : { cenarioId: g.escolher(MISSOES_CATALOGO) },
        voos: gerarVoosAtivos(g),
        nova: g.inteiro(0, 3) === 0,
      }),
      ({ missao, emMemoria, voos, nova }) => {
        const decisao = decidirInicioCabine(missao, emMemoria, voos, nova)
        const gravada = voos.porMissao[missao]
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
    const voos = { ...VOOS_ATIVOS_VAZIO, porMissao: { 'incidente-massivo': 'sessao-7' } }
    expect(decidirInicioCabine('incidente-massivo', null, voos, false)).toEqual({ tipo: 'retomar', sessaoId: 'sessao-7' })
    expect(decidirInicioCabine('incidente-massivo', { cenarioId: 'incidente-massivo' }, voos, false)).toEqual({
      tipo: 'usar-memoria',
    })
    expect(decidirInicioCabine('pasta-rede-inacessivel', { cenarioId: 'incidente-massivo' }, voos, false)).toEqual({
      tipo: 'criar',
    })
    expect(decidirInicioCabine('incidente-massivo', { cenarioId: 'incidente-massivo' }, voos, true)).toEqual({ tipo: 'criar' })
  })
})
