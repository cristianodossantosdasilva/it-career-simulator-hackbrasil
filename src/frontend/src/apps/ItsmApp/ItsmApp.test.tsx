import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { ItsmApp } from './ItsmApp'

afterEach(cleanup)

const T = TEXTOS_WORKSTATION.itsm

const sessao = ({} as SessaoProjecao)
Object.assign(sessao, {
  carreira: { cargoAtual: 'Analista Jr', xpTotal: 0, missoesConcluidas: [] },
  chamados: [
    { id: 'CH-0001', titulo: 'Acesso à rede indisponível', descricao: 'A usuária não consegue acessar a pasta compartilhada.', solicitante: 'Maria Silva', status: 'EmAtendimento', categoria: 'Acesso a Rede', urgencia: 'Alta', impacto: 'Medio', prioridade: 'P2', abertoEmMinuto: 0, slaAlvoMinuto: 30, resolvidoEmMinuto: null, slaVencido: true, responsavel: 'Analista', nivelAtendimento: 'N1', problemaId: null, notas: [{ seq: 1, tipo: 'Interna', autor: 'Analista', texto: 'Conexão validada; investigando permissões.', minutoSimulado: 4 }] },
    { id: 'CH-0002', titulo: 'Impressora sem resposta', descricao: 'A impressora do setor está indisponível.', solicitante: 'João Souza', status: 'Novo', categoria: null, urgencia: null, impacto: null, prioridade: 'P3', abertoEmMinuto: 1, slaAlvoMinuto: 60, resolvidoEmMinuto: null, slaVencido: false, responsavel: null, nivelAtendimento: null, problemaId: null, notas: [] },
  ],
  problemas: [], estacao: {}, dialogo: {}, meta: { cenarioId: 'demo', semente: 1, nivel: 'N1', versaoManifesto: '1', minutoSimulado: 4, ultimoSeq: 1 }, ultimoSeq: 1,
})

const sessaoNivel1 = { ...sessao, meta: { ...sessao.meta, cenarioId: 'triagem-engenharia-social' } } as SessaoProjecao

describe('ItsmApp W22', () => {
  it('mantém a seleção da fila e não apresenta violações axe-core', async () => {
    const { container } = render(<ItsmApp sessao={sessao} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByRole('heading', { name: /CH-0001/i })).toBeInTheDocument()
    expect(container.querySelector('.ticket-item.active')).toHaveTextContent('CH-0001')
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: /CH-0002/ }))
    expect(screen.getByRole('heading', { name: /CH-0002/i })).toBeInTheDocument()
    expect(container.querySelector('.ticket-item.active')).toHaveTextContent('CH-0002')
    expect((await axe.run(container)).violations).toEqual([])
  })

  it('mostra a fila em tabela com prioridade, SLA real e linha selecionada', () => {
    render(<ItsmApp sessao={sessao} onAcao={vi.fn(async () => {})} ocupado={false} />)
    const colunas = screen.getAllByRole('columnheader').map((c) => c.textContent)
    expect(colunas).toEqual(['Chave', 'Resumo', 'Prioridade', 'SLA', 'Status'])

    const linha1 = screen.getByRole('row', { name: /CH-0001/ })
    expect(linha1).toHaveAttribute('aria-selected', 'true')
    expect(within(linha1).getByText('P2')).toBeInTheDocument()
    expect(within(linha1).getByText('Vencido')).toBeInTheDocument()
    expect(within(linha1).getByText('Em atendimento')).toBeInTheDocument()

    const linha2 = screen.getByRole('row', { name: /CH-0002/ })
    expect(linha2).toHaveAttribute('aria-selected', 'false')
    expect(within(linha2).getByText('Restam 56 min')).toBeInTheDocument()
    expect(within(linha2).getByText('Novo')).toBeInTheDocument()
  })

  it('separa nota interna de resposta pública e envia o tipo certo ao motor', async () => {
    const onAcao = vi.fn(async () => {})
    const { container } = render(<ItsmApp sessao={sessao} onAcao={onAcao} ocupado={false} />)
    const interna = container.querySelector('.itsm-nota[data-tipo="interna"]')
    expect(interna).toHaveTextContent(T.notaInterna)

    expect(screen.getByRole('button', { name: T.registrarNotaInterna })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Tipo da nota'), { target: { value: 'Publica' } })
    expect(screen.getByText(/o solicitante vê/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Texto da nota'), { target: { value: 'Estamos verificando a pasta.' } })
    fireEvent.click(screen.getByRole('button', { name: T.enviarRespostaPublica }))
    await waitFor(() =>
      expect(onAcao).toHaveBeenCalledWith('itsm.adicionar_nota', {
        chamadoId: 'CH-0001',
        tipo: 'Publica',
        texto: 'Estamos verificando a pasta.',
      }),
    )
  })

  it('apresenta as quatro decisões de segurança com o mesmo peso e abre o KB-001 ao consultar a política', async () => {
    const onAcao = vi.fn(async () => {})
    const onAbrirKb = vi.fn()
    render(<ItsmApp sessao={sessaoNivel1} onAcao={onAcao} ocupado={false} onAbrirKb={onAbrirKb} />)
    const decisoes = [T.consultarPolitica, T.solicitarToken, T.recusarReset, T.resetarSenha].map((nome) =>
      screen.getByRole('button', { name: nome }),
    )
    for (const botao of decisoes) {
      expect(botao).toHaveClass('btn-neutro')
      expect(botao).not.toHaveClass('btn-success')
      expect(botao).not.toHaveClass('btn-danger')
    }
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(4)

    fireEvent.click(decisoes[0])
    await waitFor(() => expect(onAbrirKb).toHaveBeenCalledWith('KB-001'))
    expect(onAcao).toHaveBeenCalledWith('seguranca.consultar_politica')
  })

  it('consulta a política sem o callback e continua enviando a ação ao motor', async () => {
    const onAcao = vi.fn(async () => {})
    render(<ItsmApp sessao={sessaoNivel1} onAcao={onAcao} ocupado={false} />)
    fireEvent.click(screen.getByRole('button', { name: T.consultarPolitica }))
    await waitFor(() => expect(onAcao).toHaveBeenCalledWith('seguranca.consultar_politica'))
  })
})
