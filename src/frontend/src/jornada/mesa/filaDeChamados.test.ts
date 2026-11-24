import { describe, expect, it } from 'vitest'
import type { ChamadoDto } from '../../api/types'
import { chamadoEmFoco, contagemPorFiltro, filtrarChamados, selosDoChamado } from './filaDeChamados'

function chamado(id: string, status: string, slaVencido = false): ChamadoDto {
  return {
    id,
    titulo: `Chamado ${id}`,
    descricao: '',
    solicitante: 'Usuária Sintética',
    status,
    categoria: null,
    urgencia: null,
    impacto: null,
    prioridade: null,
    abertoEmMinuto: 0,
    slaAlvoMinuto: null,
    resolvidoEmMinuto: null,
    slaVencido,
    responsavel: null,
    nivelAtendimento: null,
    problemaId: null,
    notas: [],
  }
}

const FILA = [chamado('CH-1', 'Resolvido'), chamado('CH-2', 'Novo', true), chamado('CH-3', 'EmAtendimento')]

describe('mapa de chamados', () => {
  it('filtra por abertos, resolvidos e para revisar', () => {
    expect(filtrarChamados(FILA, 'todos', [])).toHaveLength(3)
    expect(filtrarChamados(FILA, 'abertos', []).map((c) => c.id)).toEqual(['CH-2', 'CH-3'])
    expect(filtrarChamados(FILA, 'resolvidos', []).map((c) => c.id)).toEqual(['CH-1'])
    expect(filtrarChamados(FILA, 'revisar', ['CH-3']).map((c) => c.id)).toEqual(['CH-3'])
    expect(contagemPorFiltro(FILA, ['CH-3'])).toEqual({ todos: 3, abertos: 2, resolvidos: 1, revisar: 1 })
  })

  it('o chamado em foco é o escolhido, senão o primeiro aberto, senão o primeiro', () => {
    expect(chamadoEmFoco(FILA, 'CH-3')?.id).toBe('CH-3')
    expect(chamadoEmFoco(FILA, null)?.id).toBe('CH-2')
    expect(chamadoEmFoco([chamado('CH-9', 'Resolvido')], null)?.id).toBe('CH-9')
    expect(chamadoEmFoco([], null)).toBeUndefined()
  })

  it('os selos refletem estado, SLA do motor e marca de revisão', () => {
    expect(selosDoChamado(FILA[1], true, true).map((s) => s.id)).toEqual(['atual', 'aberto', 'sla-vencido', 'revisar'])
    expect(selosDoChamado(FILA[0], false, false).map((s) => s.id)).toEqual(['resolvido'])
  })
})
