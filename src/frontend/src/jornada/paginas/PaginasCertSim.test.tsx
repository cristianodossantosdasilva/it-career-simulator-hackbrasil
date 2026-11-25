import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../armazenamento/cartaoPerfil'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../armazenamento/registrosMissao'
import { ProvedorJornada } from '../ProvedorJornada'
import { registrarHistorico } from '../simulados/historico'
import { criarEntradaPortfolioLab, lerProvaLabPendente, registrarEntradaPortfolioLab } from '../simulados/portfolioLab'
import { registrarQuestoesErradas } from '../simulados/revisaoEspacada'
import { PaginaAprender } from './PaginaAprender'
import { PaginaBiblioteca } from './PaginaBiblioteca'
import { PaginaCarreira } from './PaginaCarreira'
import { PaginaHistorico } from './PaginaHistorico'
import { PaginaPainel } from './PaginaPainel'
import { PaginaPraticar } from './PaginaPraticar'
import { PaginaProvas } from './PaginaProvas'
import { PaginaReforco } from './PaginaReforco'
import { PaginaSimulados } from './PaginaSimulados'

function renderizarComJornada(ui: React.ReactElement) {
  const armazenamento = criarArmazenamentoFalso({
    [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE),
  })
  return render(<ProvedorJornada armazenamento={armazenamento}>{ui}</ProvedorJornada>)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('Páginas do layout CertSim e três níveis', () => {
  it('Carreira exibe h1 único, etapas concluídas e plano de estudo', () => {
    renderizarComJornada(<PaginaCarreira />)
    expect(screen.getByRole('heading', { level: 1, name: 'Carreira' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Plano de estudo sugerido' })).toBeInTheDocument()
  })

  it('Simulados configura Teórico vs Lab, Padrão vs Prática, domínios e mostra Pronto para começar com 5 regras', () => {
    renderizarComJornada(<PaginaSimulados />)
    expect(screen.getByRole('heading', { level: 1, name: 'Simulados' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Personalizado/ }))
    expect(screen.getByRole('group', { name: 'Domínios do simulado' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para revisão das regras' }))
    const pronto = screen.getByRole('heading', { level: 2, name: 'Pronto para começar?' }).closest('section') as HTMLElement
    expect(within(pronto).getAllByRole('listitem')).toHaveLength(5)
  })

  it('Provas exibe Prova teórica e Prova de Lab e confirma regras antes de iniciar', () => {
    renderizarComJornada(<PaginaProvas />)
    expect(screen.getByRole('heading', { level: 1, name: 'Provas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Prova teórica' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Pronto para começar?' })).toBeInTheDocument()
  })

  it('Histórico, Painel e Reforço diário leem entradas de itfs_historico_v1 e filtram corretamente', () => {
    registrarHistorico({
      id: 'sim-1',
      tipo: 'teorico',
      formato: 'padrao',
      escopo: 'completo',
      quando: '2026-11-24T12:00:00.000Z',
      duracaoSeg: 900,
      percentual: 55,
      aprovado: false,
      porDominio: [{ dominio: 'Redes', total: 10, corretas: 5 }],
      origem: 'simulado',
    })

    renderizarComJornada(<PaginaHistorico />)
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getAllByText('55%').length).toBeGreaterThanOrEqual(1)
    fireEvent.click(screen.getByRole('button', { name: 'Aprovados' }))
    expect(screen.getByText(/Nenhum simulado ou prova registrado/)).toBeInTheDocument()
    cleanup()

    renderizarComJornada(<PaginaPainel />)
    expect(screen.getByRole('heading', { level: 1, name: 'Painel' })).toBeInTheDocument()
    expect(screen.getByText(/Maior oportunidade de ganho:/)).toBeInTheDocument()
    cleanup()

    renderizarComJornada(<PaginaReforco />)
    expect(screen.getByRole('heading', { level: 1, name: 'Reforço diário' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Redes' })).toBeInTheDocument()
  })

  it('Aprender, Praticar e Biblioteca renderizam seus cabeçalhos principais', () => {
    renderizarComJornada(<PaginaAprender />)
    expect(screen.getByRole('heading', { level: 1, name: 'Aprender' })).toBeInTheDocument()
    cleanup()

    renderizarComJornada(<PaginaPraticar />)
    expect(screen.getByRole('heading', { level: 1, name: 'Praticar' })).toBeInTheDocument()
    cleanup()

    renderizarComJornada(<PaginaBiblioteca />)
    expect(screen.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument()
  })

  it('Reforço diário exibe fila para hoje (máx 10), botões Acertei/Errei e contador de sequência', () => {
    const agora = new Date()
    const erros = Array.from({ length: 12 }, (_, idx) => ({
      questaoId: `q-${idx + 1}`,
      dominio: 'Redes',
      enunciado: `Enunciado da questão ${idx + 1}`,
      respostaCorreta: 'Porta 53',
      explicacao: 'DNS usa porta 53.',
      origem: 'simulado' as const,
    }))
    registrarQuestoesErradas(erros, agora)

    renderizarComJornada(<PaginaReforco />)
    expect(screen.getByRole('heading', { level: 2, name: /Revisão espaçada — fila para hoje \(10\/10\)/ })).toBeInTheDocument()
    expect(screen.getByText('Sequência: 0 dias')).toBeInTheDocument()

    const botoesAcertei = screen.getAllByRole('button', { name: 'Acertei' })
    expect(botoesAcertei).toHaveLength(10)

    fireEvent.click(botoesAcertei[0])
    expect(screen.getByText('Sequência: 1 dia')).toBeInTheDocument()

    const botoesErrei = screen.getAllByRole('button', { name: 'Errei' })
    fireEvent.click(botoesErrei[0])
    expect(screen.getByText('Sequência: 1 dia')).toBeInTheDocument()
  })

  it('Histórico lista sessões de Lab concluídas (Guiado e Prova) com data, cenário, modo e nota', () => {
    const regGuiado = registroDeTeste('reset-senha-desbloqueio', 'sessao-guiado-1')
    const regProva = {
      ...registroDeTeste('pasta-rede-inacessivel', 'sessao-prova-1'),
      resultado: {
        ...registroDeTeste('pasta-rede-inacessivel', 'sessao-prova-1').resultado,
        criterios: [
          { id: 'c1', descricao: 'Critério 1', atendido: true },
          { id: 'c2', descricao: 'Critério 2', atendido: false },
        ],
      },
    }
    registrarEntradaPortfolioLab(criarEntradaPortfolioLab(regProva))

    const armazenamento = criarArmazenamentoFalso({
      [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE),
      [CHAVE_REGISTROS_MISSAO]: serializarRegistros([regGuiado, regProva]),
    })
    render(
      <ProvedorJornada armazenamento={armazenamento}>
        <PaginaHistorico />
      </ProvedorJornada>,
    )

    expect(screen.getByRole('heading', { level: 2, name: /Sessões de Lab concluídas \(2\)/ })).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    const grupoFiltroLab = screen.getByRole('group', { name: 'Filtrar sessões de Lab por modo' })
    fireEvent.click(within(grupoFiltroLab).getByRole('button', { name: 'Prova' }))
    expect(screen.getByRole('heading', { level: 2, name: /Sessões de Lab concluídas \(1\)/ })).toBeInTheDocument()
  })

  it('Provas registra início da Prova de Lab ao confirmar início', () => {
    renderizarComJornada(<PaginaProvas />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Prova de Lab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prova' }))
    expect(lerProvaLabPendente()).not.toBeNull()
  })
})
