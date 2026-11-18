import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChamadoDto, SessaoProjecao } from '../api/types'
import { MissionGuide } from './MissionGuide'
import { CHAVE_LARGURA_GUIA, SplitLabWorkspace } from './SplitLabWorkspace'
import { type ContextoRoteiro, roteiroDoCenario } from './roteiros'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

function criarChamado(sobrescrever: Partial<ChamadoDto> = {}): ChamadoDto {
  return {
    id: 'CH-0001',
    titulo: 'Reset urgente',
    descricao: '',
    solicitante: 'Diretor',
    status: 'Novo',
    categoria: null,
    urgencia: null,
    impacto: null,
    prioridade: null,
    abertoEmMinuto: 0,
    slaAlvoMinuto: null,
    resolvidoEmMinuto: null,
    slaVencido: false,
    responsavel: null,
    nivelAtendimento: null,
    problemaId: null,
    notas: [],
    ...sobrescrever,
  }
}

function criarSessao(chamado: Partial<ChamadoDto> = {}, cenarioId = 'triagem-engenharia-social'): SessaoProjecao {
  return {
    carreira: { cargoAtual: 'Estagiário', xpTotal: 0, missoesConcluidas: [] },
    chamados: [criarChamado(chamado)],
    problemas: [],
    estacao: {
      privilegio: 'Padrao',
      gruposPorUsuario: {},
      dnsServidor: {},
      dnsCacheEstacao: {},
      servicos: [],
      compartilhamentoAcessivel: false,
      firewallAtivo: true,
      logs: [],
      comandosSuportados: [],
    },
    dialogo: {
      acessoRemotoLiberado: false,
      idAcessoRemoto: null,
      pinAcessoRemoto: null,
      identidadeValidada: false,
      pistasSolicitadas: 0,
      usuarioConfirmouFuncionamento: false,
      mensagens: [],
    },
    meta: { cenarioId, semente: 1, nivel: 'N1', versaoManifesto: 'v1', minutoSimulado: 0, ultimoSeq: 0 },
    ultimoSeq: 0,
  }
}

function contexto(sessao: SessaoProjecao, passosTriagem = { politica: false, token: false, recusado: false }): ContextoRoteiro {
  return { sessao, passosTriagem }
}

describe('roteiro da missao', () => {
  it('marca cada passo so pelo estado do motor e deixa o primeiro pendente como ativo', () => {
    const sessao = criarSessao()
    const { passos } = roteiroDoCenario('triagem-engenharia-social')
    expect(passos.map((p) => p.concluido(contexto(sessao)))).toEqual([false, false, false, false, false, false])

    const andamento = criarSessao({ status: 'EmAtendimento', notas: [{ seq: 1, tipo: 'Interna', autor: 'Aluno', texto: 'x', minutoSimulado: 1 }] })
    const feitos = passos.map((p) => p.concluido(contexto(andamento, { politica: true, token: true, recusado: false })))
    expect(feitos).toEqual([true, true, true, true, false, false])
  })

  it('usa o roteiro padrao para cenarios sem roteiro proprio', () => {
    expect(roteiroDoCenario('pasta-rede-inacessivel').passos.map((p) => p.id)).toEqual([
      'assumir',
      'identidade',
      'corrigir',
      'resolver',
    ])
  })
})

describe('MissionGuide', () => {
  it('lista o checklist, destaca o passo atual e abre a ferramenta indicada', async () => {
    const aoAbrir = vi.fn()
    const { container } = render(
      <MissionGuide
        cenarioId="triagem-engenharia-social"
        contexto={contexto(criarSessao())}
        proximoPasso="1) Assuma o chamado."
        tituloMissao="Triagem"
        onAbrirFerramenta={aoAbrir}
        onAbrirCaixaPreta={vi.fn()}
      />,
    )
    const lista = screen.getByRole('list', { name: 'Checklist da missão' })
    const itens = within(lista).getAllByRole('listitem')
    expect(itens).toHaveLength(6)
    expect(itens[0]).toHaveAttribute('aria-current', 'step')
    expect(itens[1]).not.toHaveAttribute('aria-current')
    expect(screen.getByText('1) Assuma o chamado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Revisar na Caixa-Preta/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Abrir ITSM/i }))
    expect(aoAbrir).toHaveBeenCalledWith('itsm')
    expect((await axe.run(container)).violations).toEqual([])
  })

  it('oferece a Caixa-Preta quando todos os passos terminam', () => {
    const aoAbrirReplay = vi.fn()
    const sessao = criarSessao({
      status: 'Resolvido',
      notas: [{ seq: 1, tipo: 'Interna', autor: 'Aluno', texto: 'x', minutoSimulado: 1 }],
    })
    render(
      <MissionGuide
        cenarioId="triagem-engenharia-social"
        contexto={contexto(sessao, { politica: true, token: true, recusado: true })}
        proximoPasso="Missão concluída."
        tituloMissao="Triagem"
        onAbrirFerramenta={vi.fn()}
        onAbrirCaixaPreta={aoAbrirReplay}
      />,
    )
    expect(screen.queryByRole('button', { name: /^Abrir / })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Revisar na Caixa-Preta/i }))
    expect(aoAbrirReplay).toHaveBeenCalledTimes(1)
  })
})

describe('SplitLabWorkspace', () => {
  function montar() {
    return render(
      <SplitLabWorkspace
        resumoGuia="0 de 6 passos"
        guia={<aside aria-label="Guia">guia</aside>}
        consola={<main>console</main>}
      />,
    )
  }

  it('divisoria acessivel muda a largura por teclado, respeita os limites e persiste', () => {
    montar()
    const divisor = screen.getByRole('separator', { name: /Redimensionar o guia da missão/i })
    expect(divisor).toHaveAttribute('aria-valuenow', '32')
    expect(divisor).toHaveAttribute('aria-valuemin', '20')
    expect(divisor).toHaveAttribute('aria-valuemax', '50')

    fireEvent.keyDown(divisor, { key: 'ArrowRight' })
    expect(divisor).toHaveAttribute('aria-valuenow', '34')
    expect(window.localStorage.getItem(CHAVE_LARGURA_GUIA)).toBe('34')
    fireEvent.keyDown(divisor, { key: 'ArrowLeft' })
    fireEvent.keyDown(divisor, { key: 'ArrowLeft' })
    expect(divisor).toHaveAttribute('aria-valuenow', '30')
    fireEvent.keyDown(divisor, { key: 'Home' })
    expect(divisor).toHaveAttribute('aria-valuenow', '20')
    fireEvent.keyDown(divisor, { key: 'ArrowLeft' })
    expect(divisor).toHaveAttribute('aria-valuenow', '20')
    fireEvent.keyDown(divisor, { key: 'End' })
    expect(divisor).toHaveAttribute('aria-valuenow', '50')
  })

  it('restaura a largura salva e ignora valores fora dos limites', () => {
    window.localStorage.setItem(CHAVE_LARGURA_GUIA, '41')
    const { unmount } = montar()
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '41')
    unmount()
    window.localStorage.setItem(CHAVE_LARGURA_GUIA, '90')
    montar()
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '32')
  })

  it('o botao do guia alterna o painel em telas estreitas', () => {
    montar()
    const alternar = screen.getByRole('button', { name: /Guia da missão/i })
    expect(alternar).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(alternar)
    expect(alternar).toHaveAttribute('aria-expanded', 'true')
    expect(alternar).toHaveTextContent('0 de 6 passos')
  })
})
