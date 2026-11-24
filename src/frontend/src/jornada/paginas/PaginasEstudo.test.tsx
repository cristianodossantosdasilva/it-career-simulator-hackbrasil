import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LESSONS, LEVELS } from '../../educacao/catalogoEducacional'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaAulas } from './PaginaAulas'
import { PaginaCaderno } from './PaginaCaderno'
import { PaginaComandante } from './PaginaComandante'
import { PaginaHangar } from './PaginaHangar'
import { PaginaTreino } from './PaginaTreino'

function abrir(pagina: ReactElement, inicial: Record<string, string> = {}) {
  render(<ProvedorJornada armazenamento={criarArmazenamentoFalso(inicial)}>{pagina}</ProvedorJornada>)
}

function aulasEm(nivel: (typeof LEVELS)[number]['id'] | null, modo: 'lesson' | 'cards' = 'lesson', aula: string | null = null) {
  return <PaginaAulas rota={{ pagina: 'aulas', nivel, modo, aula }} />
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/aulas')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Páginas de estudo', () => {
  it('Aulas: um único h1, a primeira aula do nível em foco como h2 e os links de nível e de Treino', () => {
    abrir(aulasEm(null))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Aulas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: LESSONS['help-desk-n1'][0].title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Treino de explicação' })).toHaveAttribute('href', '/aulas/treino')
    expect(screen.getByRole('link', { name: LEVELS[0].nome })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: LEVELS[1].nome })).toHaveAttribute('href', '/aulas?nivel=service-desk-n1-jr')
  })

  it('Aulas: nível e aula vêm do endereço e o modo cards mostra os flashcards', () => {
    abrir(aulasEm('n2-pleno', 'lesson', LESSONS['n2-pleno'][1].id))
    expect(screen.getByRole('heading', { level: 2, name: LESSONS['n2-pleno'][1].title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: LEVELS[2].nome })).toHaveAttribute('aria-current', 'page')
    cleanup()
    abrir(aulasEm('service-desk-n1-jr', 'cards'))
    expect(screen.getByRole('heading', { level: 2, name: `Flashcards de ${LEVELS[1].nome}` })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('Treino: um único h1 com o nome da página e o Mentor como h2', () => {
    abrir(<PaginaTreino />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Treino de explicação' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Mentor' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para as Aulas' })).toHaveAttribute('href', '/aulas')
  })

  it('Caderno: mantém o conteúdo de CadernoView, com um único h1', () => {
    abrir(<PaginaCaderno />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Caderno de estudos' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Páginas do caderno' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Editor da página' })).toBeInTheDocument()
    expect(screen.getByText('Nova página')).toBeInTheDocument()
  })

  it('Mentor: quatro papéis, o que cada um faz e não faz, e os limites do guia', () => {
    abrir(<PaginaComandante />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Mentor' })).toBeInTheDocument()
    const papeis = screen.getAllByRole('heading', { level: 3 }).map((titulo) => titulo.textContent)
    expect(papeis).toEqual(['Consultor', 'Instrutor', 'Copiloto', 'Mentor'])
    expect(screen.getByText('Atua em: Caixa-preta e Portfólio.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'O que este guia não faz' })).toBeInTheDocument()
    expect(screen.getByText('Não promete emprego, salário nem resultado.')).toBeInTheDocument()
  })

  it('Catálogo: um único h1 e as rotas do catálogo com o status em texto', () => {
    abrir(<PaginaHangar />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeInTheDocument()
    const rotas = within(screen.getByRole('heading', { level: 2, name: 'Rotas' }).closest('section') as HTMLElement)
    expect(rotas.getByRole('heading', { level: 3, name: 'Suporte de TI' })).toBeInTheDocument()
    expect(rotas.getByText('Disponível')).toBeInTheDocument()
    expect(rotas.getByText('Em preparação')).toBeInTheDocument()
    expect(rotas.getAllByText('Futuro')).toHaveLength(2)
  })

  it('Aulas: o link de outro nível leva ao endereço do nível', () => {
    abrir(aulasEm('help-desk-n1'))
    fireEvent.click(screen.getByRole('link', { name: LEVELS[3].nome }))
    expect(window.location.pathname + window.location.search).toBe('/aulas?nivel=n3-a-redes-nuvem')
  })
})

function concluirPrimeiraAula() {
  fireEvent.click(screen.getByRole('button', { name: /mostrar alternativas/i }))
  fireEvent.click(screen.getByRole('button', { name: /^B\)/ }))
  fireEvent.click(screen.getByRole('button', { name: /^Bom/ }))
}

const registrosAte = (...missoes: IdMissao[]) => ({
  [CHAVE_REGISTROS_VOO]: serializarRegistros(missoes.map((missao, i) => registroDeTeste(missao, `sessao-${i}`))),
})

describe('Prática a partir das Aulas respeita os portões da Mesa de Trabalho', () => {
  it('Praticar agora da primeira aula leva à Mesa de Trabalho de reset-senha-desbloqueio, sem aviso de bloqueio', () => {
    abrir(aulasEm(null))
    expect(screen.getByRole('heading', { level: 2, name: 'O que faz o Suporte de TI (e o que é um chamado)' })).toBeInTheDocument()
    concluirPrimeiraAula()
    expect(screen.queryByText(/ainda não está liberada/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar agora' }))
    expect(window.location.pathname).toBe('/cabine/reset-senha-desbloqueio')
  })

  it('o botão do nível também leva à primeira missão do nível quando a etapa está liberada', () => {
    abrir(aulasEm('help-desk-n1'))
    fireEvent.click(screen.getByRole('button', { name: 'Praticar no laboratório' }))
    expect(window.location.pathname).toBe('/cabine/reset-senha-desbloqueio')
  })

  it('com a etapa bloqueada, a prática não leva à Mesa de Trabalho: mostra o estado e leva ao Plano de Carreira', () => {
    abrir(aulasEm('n2-pleno'))
    expect(screen.queryByRole('button', { name: 'Praticar no laboratório' })).not.toBeInTheDocument()
    const botao = screen.getByRole('button', { name: 'Ver o Plano de Carreira' })
    expect(screen.getByText(/A etapa N2 Pleno ainda não está liberada\. Conclua as missões disponíveis de Service Desk N1 Jr/)).toBeInTheDocument()
    expect(botao).toHaveAccessibleDescription(/ainda não está liberada/)
    fireEvent.click(botao)
    expect(window.location.pathname).toBe('/plano-de-voo')
  })

  it('com a etapa bloqueada, Praticar agora da aula também leva ao Plano de Carreira', () => {
    abrir(aulasEm('n2-pleno'))
    fireEvent.click(screen.getByRole('button', { name: /mostrar alternativas/i }))
    fireEvent.click(screen.getByRole('button', { name: /^B\)/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Bom/ }))
    const botoes = screen.getAllByRole('button', { name: 'Ver o Plano de Carreira' })
    fireEvent.click(botoes[botoes.length - 1])
    expect(window.location.pathname).toBe('/plano-de-voo')
  })

  it('com os registros das etapas anteriores, a N2 Pleno leva à Mesa de Trabalho de incidente-massivo', () => {
    abrir(aulasEm('n2-pleno'), registrosAte('reset-senha-desbloqueio', 'pasta-rede-inacessivel'))
    expect(screen.queryByText(/ainda não está liberada/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar no laboratório' }))
    expect(window.location.pathname).toBe('/cabine/incidente-massivo')
  })

  it('com o modo de demonstração ativo, a etapa bloqueada leva à Mesa de Trabalho', () => {
    const modo = serializarModoDemonstracao({ versao: 1, ativo: true, origem: 'plano-de-voo', alteradoEm: '2026-11-20T12:00:00.000Z' })
    abrir(aulasEm('n3-b-data-center-backup'), { [CHAVE_MODO_DEMONSTRACAO]: modo })
    fireEvent.click(screen.getByRole('button', { name: 'Praticar no laboratório' }))
    expect(window.location.pathname).toBe('/cabine/falha-backup-restore')
  })

  it('as aulas de SQL da N3-C praticam diagnostico-sql-readonly, e o botão do nível pratica a triagem', () => {
    const modo = serializarModoDemonstracao({ versao: 1, ativo: true, origem: 'plano-de-voo', alteradoEm: '2026-11-20T12:00:00.000Z' })
    abrir(aulasEm('n3-c-seguranca-dados', 'lesson', LESSONS['n3-c-seguranca-dados'][1].id), { [CHAVE_MODO_DEMONSTRACAO]: modo })
    concluirPrimeiraAula()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar agora' }))
    expect(window.location.pathname).toBe('/cabine/diagnostico-sql-readonly')
    cleanup()
    abrir(aulasEm('n3-c-seguranca-dados'), { [CHAVE_MODO_DEMONSTRACAO]: modo })
    fireEvent.click(screen.getByRole('button', { name: 'Praticar no laboratório' }))
    expect(window.location.pathname).toBe('/cabine/triagem-engenharia-social')
  })
})
