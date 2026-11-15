import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { ItsmApp } from './ItsmApp'

afterEach(cleanup)

const sessao = ({} as SessaoProjecao)
Object.assign(sessao, {
  carreira: { cargoAtual: 'Analista Jr', xpTotal: 0, missoesConcluidas: [] },
  chamados: [
    { id: 'CH-0001', titulo: 'Acesso à rede indisponível', descricao: 'A usuária não consegue acessar a pasta compartilhada.', solicitante: 'Maria Silva', status: 'EmAtendimento', categoria: 'Acesso a Rede', urgencia: 'Alta', impacto: 'Medio', prioridade: 'P2', abertoEmMinuto: 0, slaAlvoMinuto: 30, resolvidoEmMinuto: null, slaVencido: true, responsavel: 'Analista', nivelAtendimento: 'N1', problemaId: null, notas: [{ seq: 1, tipo: 'Interna', autor: 'Analista', texto: 'Conexão validada; investigando permissões.', minutoSimulado: 4 }] },
    { id: 'CH-0002', titulo: 'Impressora sem resposta', descricao: 'A impressora do setor está indisponível.', solicitante: 'João Souza', status: 'Novo', categoria: null, urgencia: null, impacto: null, prioridade: 'P3', abertoEmMinuto: 1, slaAlvoMinuto: 60, resolvidoEmMinuto: null, slaVencido: false, responsavel: null, nivelAtendimento: null, problemaId: null, notas: [] },
  ],
  problemas: [], estacao: {}, dialogo: {}, meta: { cenarioId: 'demo', semente: 1, nivel: 'N1', versaoManifesto: '1', minutoSimulado: 4, ultimoSeq: 1 }, ultimoSeq: 1,
})

describe('ItsmApp W22', () => {
  it('mantém a seleção da fila e não apresenta violações axe-core', async () => {
    const { container } = render(<ItsmApp sessao={sessao} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByRole('heading', { name: /CH-0001/i })).toBeInTheDocument()
    expect(container.querySelector('.ticket-item.active')).toHaveTextContent('CH-0001')
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: /CH-0002/ }))
    expect(screen.getByRole('heading', { name: /CH-0002/i })).toBeInTheDocument()
    expect(container.querySelector('.ticket-item.active')).toHaveTextContent('CH-0002')
  })
})
