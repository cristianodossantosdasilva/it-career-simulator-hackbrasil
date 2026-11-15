import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReplayResponse } from '../api/types'
import { ReplayView } from './ReplayView'

afterEach(cleanup)

const replayBase: ReplayResponse = {
  sessaoId: 'sintetica', meta: { cenarioId: 'demo', causa: null, nivel: 'N1', semente: 1, versaoManifesto: '1' }, ultimoSeq: 2,
  eventos: [
    { seq: 1, tipo: 'Inicio', minutoSimulado: 0, dados: { ok: true } },
    { seq: 2, tipo: 'Acao', minutoSimulado: 1, payload: { x: 2 } },
  ],
  avaliacao: { concluida: true, criterios: [{ id: 'R1', descricao: 'Descricao completa', atendido: false, eventoSeq: 2, motivo: 'Motivo visivel', praticaEsperada: 'Pratica visivel', linkKb: 'kb://invalido/nao-existe' }], incidenteSeguranca: false, xpTotal: 0, resumo: 'Resumo' }, curriculo: null,
}
const atualizar = vi.fn(async () => {})

describe('ReplayView W18', () => {
  it('exibe vazio sem range/lista, limita o indice e expõe texto acessível no range', async () => {
    const vazio = { ...replayBase, eventos: [] }
    const { rerender } = render(<ReplayView replay={vazio} onAtualizar={atualizar} ocupado={false} />)
    expect(screen.getByText('Nenhum evento registrado nesta sessao.')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /timeline/i })).not.toBeInTheDocument()
    rerender(<ReplayView replay={replayBase} onAtualizar={atualizar} ocupado={false} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } })
    rerender(<ReplayView replay={{ ...replayBase, eventos: [replayBase.eventos[0]] }} onAtualizar={atualizar} ocupado={false} />)
    await waitFor(() => expect(screen.getByRole('slider')).toHaveValue('0'))
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Evento #1 — Inicio')
  })

  it('preserva texto do critério, esconde KB indisponível e foca o evento selecionado', async () => {
    render(<ReplayView replay={replayBase} onAtualizar={atualizar} ocupado={false} />)
    const criterio = screen.getAllByRole('listitem')[0]
    expect(criterio).toHaveTextContent('Descricao completa')
    expect(criterio).toHaveTextContent('Motivo visivel')
    expect(criterio).toHaveTextContent('Pratica visivel')
    expect(screen.queryByRole('button', { name: /Consultar KB/i })).not.toBeInTheDocument()
    expect(screen.getByText('Pendente')).not.toHaveAttribute('role', 'status')
    fireEvent.click(screen.getByRole('button', { name: 'Ver evento sequencia 2' }))
    await waitFor(() => expect(screen.getByText(/Seq #2 — Acao/).closest('[tabindex="-1"]')).toHaveFocus())
    expect(screen.getByRole('button', { name: /#2 Acao/ })).toHaveAttribute('aria-current', 'step')
  })

  it('informa replay vazio de carregamento e ocupado', () => {
    render(<ReplayView replay={null} onAtualizar={atualizar} ocupado />)
    expect(screen.getByText('Nenhum replay carregado. Carregue para ver criterios e linha do tempo.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Relatorio do Juiz 360' })).toHaveAttribute('aria-busy', 'true')
  })

  it('não tem violações axe no replay com eventos', async () => {
    const { container } = render(<ReplayView replay={replayBase} onAtualizar={atualizar} ocupado={false} />)
    expect((await axe.run(container)).violations).toEqual([])
  })

  it('expõe a lista da timeline nomeada e o botão KB com nome iniciando por "Consultar KB" (WCAG 2.5.3)', () => {
    const comKb: ReplayResponse = {
      ...replayBase,
      avaliacao: { ...replayBase.avaliacao, criterios: [{ ...replayBase.avaliacao.criterios[0], linkKb: 'kb://seguranca/politica-reset-senha' }] },
    }
    const onNavegaKb = vi.fn()
    render(<ReplayView replay={comKb} onAtualizar={atualizar} ocupado={false} onNavegaKb={onNavegaKb} />)
    expect(screen.getByRole('list', { name: 'Eventos da linha do tempo' })).toBeInTheDocument()
    const kb = screen.getByRole('button', { name: /^Consultar KB/ })
    expect(kb).toHaveAttribute('data-kb-uri', 'kb://seguranca/politica-reset-senha')
    fireEvent.click(kb)
    expect(onNavegaKb).toHaveBeenCalledWith(expect.any(String), kb)
  })

  it('não tem violações axe nos estados null, incidente e currículo', async () => {
    const vazio = render(<ReplayView replay={null} onAtualizar={atualizar} ocupado={false} />)
    expect((await axe.run(vazio.container)).violations).toEqual([])
    vazio.unmount()
    const incidente = render(
      <ReplayView replay={{ ...replayBase, avaliacao: { ...replayBase.avaliacao, incidenteSeguranca: true } }} onAtualizar={atualizar} ocupado={false} />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Incidente de seguranca')
    expect((await axe.run(incidente.container)).violations).toEqual([])
    incidente.unmount()
    const curriculo = render(
      <ReplayView
        replay={{ ...replayBase, curriculo: { competencias: ['Seguranca', 'ITSM'], algoritmo: 'SHA-256', hash: 'abc123', versaoManifesto: '1' } }}
        onAtualizar={atualizar}
        ocupado={false}
      />,
    )
    expect(screen.getByRole('heading', { name: /Curriculo Vivo/ })).toBeInTheDocument()
    expect((await axe.run(curriculo.container)).violations).toEqual([])
  })
})
