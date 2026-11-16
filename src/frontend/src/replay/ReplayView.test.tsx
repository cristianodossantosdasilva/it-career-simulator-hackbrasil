import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReplayResponse } from '../api/types'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { ReplayView } from './ReplayView'
import { eventoDeRisco, rotuloDoEvento } from './rotulosEvento'

afterEach(cleanup)

const T = TEXTOS_WORKSTATION.replay

const replayBase: ReplayResponse = {
  sessaoId: 'sintetica', meta: { cenarioId: 'demo', causa: null, nivel: 'N1', semente: 1, versaoManifesto: '1' }, ultimoSeq: 2,
  eventos: [
    { seq: 1, tipo: 'Inicio', minutoSimulado: 0, dados: { ok: true } },
    { seq: 2, tipo: 'Acao', minutoSimulado: 1, payload: { x: 2 } },
  ],
  avaliacao: { concluida: true, criterios: [{ id: 'R1', descricao: 'Descricao completa', atendido: false, eventoSeq: 2, motivo: 'Motivo visivel', praticaEsperada: 'Pratica visivel', linkKb: 'kb://invalido/nao-existe' }], incidenteSeguranca: false, xpTotal: 0, resumo: 'Resumo' }, curriculo: null,
}
const atualizar = vi.fn(async () => {})

describe('ReplayView', () => {
  it('exibe vazio sem range/lista, limita o índice e expõe texto acessível no range', async () => {
    const vazio = { ...replayBase, eventos: [] }
    const { rerender } = render(<ReplayView replay={vazio} onAtualizar={atualizar} ocupado={false} />)
    expect(screen.getByText(T.semEventos)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: T.listaEventos })).not.toBeInTheDocument()
    rerender(<ReplayView replay={replayBase} onAtualizar={atualizar} ocupado={false} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } })
    rerender(<ReplayView replay={{ ...replayBase, eventos: [replayBase.eventos[0]] }} onAtualizar={atualizar} ocupado={false} />)
    await waitFor(() => expect(screen.getByRole('slider')).toHaveValue('0'))
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Evento #1: Inicio')
  })

  it('mostra o comparativo do critério, esconde KB indisponível e foca o evento selecionado', async () => {
    render(<ReplayView replay={replayBase} onAtualizar={atualizar} ocupado={false} />)
    const criterio = within(screen.getByRole('list', { name: T.listaCriterios })).getAllByRole('listitem')[0]
    expect(criterio).toHaveTextContent('Descricao completa')
    expect(within(criterio).getByText('O que você fez').nextElementSibling).toHaveTextContent('Motivo visivel')
    expect(within(criterio).getByText('Prática recomendada').nextElementSibling).toHaveTextContent('Pratica visivel')
    expect(screen.queryByRole('button', { name: /Consultar KB/i })).not.toBeInTheDocument()
    expect(screen.getByText(T.pendente)).not.toHaveAttribute('role', 'status')
    fireEvent.click(screen.getByRole('button', { name: T.verEvento(2) }))
    await waitFor(() => expect(screen.getByText(/Seq #2: Acao/).closest('[tabindex="-1"]')).toHaveFocus())
    expect(screen.getByRole('button', { name: /#2 Acao/ })).toHaveAttribute('aria-current', 'step')
  })

  it('informa replay vazio de carregamento e ocupado', () => {
    render(<ReplayView replay={null} onAtualizar={atualizar} ocupado />)
    expect(screen.getByText(T.semReplay)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: T.regiaoRelatorio })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: T.carregar })).toBeDisabled()
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
    expect(screen.getByRole('list', { name: T.listaEventos })).toBeInTheDocument()
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
    expect(screen.getByRole('alert')).toHaveTextContent(T.incidente)
    expect((await axe.run(incidente.container)).violations).toEqual([])
    incidente.unmount()
    const curriculo = render(
      <ReplayView
        replay={{ ...replayBase, curriculo: { competencias: ['Seguranca', 'ITSM'], algoritmo: 'SHA-256', hash: 'abc123', versaoManifesto: '1' } }}
        onAtualizar={atualizar}
        ocupado={false}
      />,
    )
    expect(screen.getByRole('heading', { name: T.credencial })).toBeInTheDocument()
    expect((await axe.run(curriculo.container)).violations).toEqual([])
  })

  it('traduz tipos do motor, marca risco e liga o critério ao evento na linha do tempo', () => {
    expect(rotuloDoEvento('PoliticaSegurancaConsultada')).toBe('Política de segurança consultada')
    expect(rotuloDoEvento('TipoNovoDoMotor')).toBe('TipoNovoDoMotor')
    expect(eventoDeRisco('SenhaResetadaIndevidamente')).toBe(true)
    expect(eventoDeRisco('ResetRecusado')).toBe(false)

    const replay: ReplayResponse = {
      ...replayBase,
      eventos: [
        { seq: 1, tipo: 'PoliticaSegurancaConsultada', minutoSimulado: 2, dados: {} },
        { seq: 2, tipo: 'SenhaResetadaIndevidamente', minutoSimulado: 5, dados: { chamadoId: 'CH-0001' }, criterios: ['R2'] },
      ],
    }
    render(<ReplayView replay={replay} onAtualizar={atualizar} ocupado={false} />)
    const lista = screen.getByRole('list', { name: T.listaEventos })
    expect(within(lista).getByRole('button', { name: /#1 Política de segurança consultada/ })).toBeInTheDocument()
    const risco = within(lista).getByRole('button', { name: /#2 Senha resetada sem validação/ })
    expect(risco).toHaveTextContent('evento de risco')
    expect(risco).toHaveTextContent('critério R2, R1')
  })

  it('guarda o evento bruto em detalhes recolhidos e mostra o selo com hash e aviso de verificação', () => {
    const replay: ReplayResponse = {
      ...replayBase,
      curriculo: { competencias: ['Seguranca', 'ITSM'], algoritmo: 'SHA-256', hash: 'abc123', versaoManifesto: '7' },
    }
    const { container } = render(<ReplayView replay={replay} onAtualizar={atualizar} ocupado={false} />)
    const bruto = container.querySelector('details.evento-bruto') as HTMLDetailsElement
    expect(bruto).not.toHaveAttribute('open')
    expect(bruto).toHaveTextContent(T.eventoBruto)
    const selo = screen.getByRole('region', { name: T.credencial })
    expect(selo).toHaveTextContent('Seguranca, ITSM')
    expect(selo).toHaveTextContent('abc123')
    expect(selo).toHaveTextContent('ECDSA P-256')
  })

  it('mostra status, resumo e causa em elementos próprios', () => {
    const replay: ReplayResponse = {
      ...replayBase,
      meta: { ...replayBase.meta, causa: 'DNS' },
      avaliacao: { ...replayBase.avaliacao, resumo: '1/1 criterios atendidos | XP: 60' },
    }
    render(<ReplayView replay={replay} onAtualizar={atualizar} ocupado={false} />)
    expect(screen.getByText(T.concluida, { exact: true })).toBeInTheDocument()
    expect(screen.getByText('1/1 criterios atendidos | XP: 60')).toBeInTheDocument()
    expect(screen.getByText('DNS')).toBeInTheDocument()
  })
})
