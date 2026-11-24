import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiTeorico, CorrecaoProva, ProvaTeorica, VerificacaoQuestao } from '../api/teorico'
import { CHAVE_HISTORICO, lerHistorico } from '../jornada/simulados/historico'
import {
  CHAVE_ANDAMENTO_TEORICO,
  alternarSelecao,
  filtrarQuestoes,
  formatarTempo,
  selosDaQuestao,
} from './estadoProva'
import { TelaProvaTeorica } from './TelaProvaTeorica'

const EXPLICACAO = {
  correta: 'Porque validar a identidade evita fraude.',
  incorretas: [
    { alternativaId: 'a', texto: 'Expõe a credencial.' },
    { alternativaId: 'c', texto: 'Não prova identidade.' },
  ],
  referencia: 'https://exemplo.test/ref',
}

function prova(duracao: number | null): ProvaTeorica {
  return {
    provaId: 'pt-teste',
    semente: 42,
    duracaoSegundos: duracao,
    notaAprovacao: 70,
    questoes: [
      {
        id: 'q1', dominio: 'acesso', topico: 'Senhas e MFA', nivel: 1, enunciado: 'Primeira pergunta?', selecao: 'unica',
        alternativas: [{ id: 'a', texto: 'Alfa' }, { id: 'b', texto: 'Beta' }, { id: 'c', texto: 'Gama' }],
      },
      {
        id: 'q2', dominio: 'redes', topico: 'DNS', nivel: 2, enunciado: 'Segunda pergunta?', selecao: 'multipla',
        alternativas: [{ id: 'a', texto: 'Um' }, { id: 'b', texto: 'Dois' }, { id: 'c', texto: 'Três' }],
      },
    ],
  }
}

function apiFalsa(duracao: number | null): { api: ApiTeorico; corrigir: ReturnType<typeof vi.fn> } {
  const corrigir = vi.fn(async (pedido: { respostas: { questaoId: string; respostas: string[] }[] }): Promise<CorrecaoProva> => {
    const certa = pedido.respostas[0].respostas.join() === 'b'
    return {
      total: 2,
      corretas: certa ? 2 : 0,
      percentual: certa ? 100 : 0,
      aprovado: certa,
      porDominio: [
        { dominio: 'Acesso e contas', total: 1, corretas: certa ? 1 : 0 },
        { dominio: 'Redes', total: 1, corretas: certa ? 1 : 0 },
      ],
      questoes: [
        { id: 'q1', correta: certa, gabarito: ['b'], explicacao: EXPLICACAO },
        { id: 'q2', correta: certa, gabarito: ['a', 'b'], explicacao: EXPLICACAO },
      ],
    }
  })
  const api: ApiTeorico = {
    topicos: vi.fn(),
    criarProva: vi.fn(async () => prova(duracao)),
    verificar: vi.fn(async (_id: string, respostas: string[]): Promise<VerificacaoQuestao> => ({
      correta: respostas.join() === 'b',
      gabarito: ['b'],
      explicacao: EXPLICACAO,
    })),
    corrigir: corrigir as unknown as ApiTeorico['corrigir'],
    explicar: vi.fn(async () => ({ texto: 'Texto estático.', origem: 'fallback' as const })),
  }
  return { api, corrigir }
}

beforeEach(() => window.localStorage.clear())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('estadoProva', () => {
  const inst = {
    respostas: { q1: ['a'] },
    marcadas: ['q2'],
    verificacoes: { q1: { correta: false, gabarito: ['b'], explicacao: EXPLICACAO } },
  }
  const questoes = prova(null).questoes

  it('filtra por revisar, em branco e incorretas', () => {
    expect(filtrarQuestoes(questoes, 'todas', inst)).toHaveLength(2)
    expect(filtrarQuestoes(questoes, 'revisar', inst).map((q) => q.id)).toEqual(['q2'])
    expect(filtrarQuestoes(questoes, 'branco', inst).map((q) => q.id)).toEqual(['q2'])
    expect(filtrarQuestoes(questoes, 'incorretas', inst).map((q) => q.id)).toEqual(['q1'])
  })

  it('monta os selos da questão', () => {
    expect(selosDaQuestao('q1', true, inst)).toEqual(['atual', 'incorreta'])
    expect(selosDaQuestao('q2', false, inst)).toEqual(['branco', 'revisar'])
  })

  it('alterna seleção única e múltipla e formata o tempo', () => {
    expect(alternarSelecao(['a'], 'b', 'unica')).toEqual(['b'])
    expect(alternarSelecao(['a'], 'b', 'multipla')).toEqual(['a', 'b'])
    expect(alternarSelecao(['a', 'b'], 'a', 'multipla')).toEqual(['b'])
    expect(formatarTempo(3600)).toBe('1:00:00')
    expect(formatarTempo(65)).toBe('01:05')
  })
})

describe('TelaProvaTeorica', () => {
  it('Prática: verifica na hora, mostra a explicação estruturada e pede o texto extra', async () => {
    const { api } = apiFalsa(null)
    render(<TelaProvaTeorica config={{ formato: 'pratica', escopo: 'completo', origem: 'pratica' }} titulo="Prática teórica" aoSair={() => {}} api={api} />)
    expect(await screen.findByRole('heading', { name: 'Primeira pergunta?' })).toBeInTheDocument()
    expect(document.querySelector('.teorico-posicao')?.textContent).toMatch(/Questão 1 de 2/)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()

    const verificar = screen.getByRole('button', { name: 'Verificar resposta' })
    expect(verificar).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/Alfa/))
    fireEvent.click(verificar)
    expect(await screen.findByRole('heading', { name: 'Incorreto' })).toBeInTheDocument()
    expect(screen.getByText('Porque validar a identidade evita fraude.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir documentação' })).toHaveAttribute('href', 'https://exemplo.test/ref')
    expect(screen.getAllByText('Correta').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Explicar de forma simples' }))
    expect(await screen.findByText('Texto estático.')).toBeInTheDocument()
    expect(screen.getByText('Texto padrão')).toBeInTheDocument()
  })

  it('Prova padrão: cronômetro, sem feedback antes do fim, finalização com confirmação e histórico', async () => {
    const { api, corrigir } = apiFalsa(3600)
    render(<TelaProvaTeorica config={{ formato: 'padrao', escopo: 'completo', origem: 'prova' }} titulo="Prova teórica" aoSair={() => {}} api={api} />)
    await screen.findByRole('heading', { name: 'Primeira pergunta?' })
    expect(screen.getByRole('timer')).toHaveTextContent('1:00:00')
    expect(screen.queryByRole('button', { name: 'Verificar resposta' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/Beta/))
    expect(api.verificar).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByRole('heading', { name: 'Segunda pergunta?' })).toBeInTheDocument()
    expect(screen.getByText(/Selecione todas as corretas/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Marcar para revisar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Marcadas' }))
    const mapa = screen.getByRole('complementary', { name: 'Mapa de questões' })
    expect(within(mapa).getAllByText('Revisar').length).toBe(1)

    fireEvent.click(within(mapa).getByRole('button', { name: 'Finalizar' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/não pode ser desfeita/)).toBeInTheDocument()
    expect(within(dialogo).getByText(/sem resposta contam como erradas/)).toBeInTheDocument()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Finalizar agora' }))

    expect(await screen.findByText('APROVADO', { exact: false })).toBeInTheDocument()
    expect(corrigir).toHaveBeenCalledTimes(1)
    expect(corrigir.mock.calls[0][0].respostas).toEqual([
      { questaoId: 'q1', respostas: ['b'] },
      { questaoId: 'q2', respostas: [] },
    ])
    expect(screen.getByText('Desempenho por domínio')).toBeInTheDocument()
    expect(screen.getByText('Pontos fortes')).toBeInTheDocument()
    const historico = lerHistorico()
    expect(historico).toHaveLength(1)
    expect(historico[0]).toMatchObject({ tipo: 'teorico', formato: 'padrao', origem: 'prova', percentual: 100, aprovado: true })
    expect(window.localStorage.getItem(CHAVE_ANDAMENTO_TEORICO)).toBeNull()
    expect(window.localStorage.getItem(CHAVE_HISTORICO)).not.toBeNull()
  })

  it('salva o andamento ao responder e retoma a mesma prova', async () => {
    const { api } = apiFalsa(null)
    const primeira = render(<TelaProvaTeorica config={{ formato: 'pratica', escopo: 'completo', origem: 'pratica' }} titulo="Prática teórica" aoSair={() => {}} api={api} />)
    await screen.findByRole('heading', { name: 'Primeira pergunta?' })
    fireEvent.click(screen.getByLabelText(/Gama/))
    await waitFor(() => expect(window.localStorage.getItem(CHAVE_ANDAMENTO_TEORICO)).toContain('"c"'))
    primeira.unmount()

    render(<TelaProvaTeorica config={{ formato: 'pratica', escopo: 'completo', origem: 'pratica' }} titulo="Prática teórica" retomar aoSair={() => {}} api={api} />)
    await screen.findByRole('heading', { name: 'Primeira pergunta?' })
    expect(screen.getByLabelText(/Gama/)).toBeChecked()
    expect(api.criarProva).toHaveBeenLastCalledWith(expect.objectContaining({ semente: 42 }))
  })

  it('mostra erro e permite tentar de novo quando a API falha', async () => {
    const { api } = apiFalsa(null)
    ;(api.criarProva as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Servidor indisponível.'))
    render(<TelaProvaTeorica config={{ formato: 'pratica', escopo: 'completo', origem: 'pratica' }} titulo="Prática teórica" aoSair={() => {}} api={api} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('heading', { name: 'Primeira pergunta?' })).toBeInTheDocument()
  })

  it('encerra a prova quando o tempo acaba', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { api, corrigir } = apiFalsa(2)
    render(<TelaProvaTeorica config={{ formato: 'padrao', escopo: 'completo', origem: 'simulado' }} titulo="Simulado teórico" aoSair={() => {}} api={api} />)
    await screen.findByRole('heading', { name: 'Primeira pergunta?' })
    await vi.advanceTimersByTimeAsync(2500)
    await waitFor(() => expect(corrigir).toHaveBeenCalled())
    expect(await screen.findByText(/O tempo acabou/)).toBeInTheDocument()
  })
})
