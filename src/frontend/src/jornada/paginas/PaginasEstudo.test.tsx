import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LESSONS, LEVELS } from '../../educacao/catalogoEducacional'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaAulas } from './PaginaAulas'
import { PaginaCaderno } from './PaginaCaderno'
import { PaginaComandante } from './PaginaComandante'
import { PaginaHangar } from './PaginaHangar'
import { PaginaTreino } from './PaginaTreino'

function abrir(pagina: ReactElement) {
  render(<ProvedorJornada armazenamento={criarArmazenamentoFalso()}>{pagina}</ProvedorJornada>)
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
    expect(screen.getByRole('heading', { level: 2, name: LESSONS.estagiario[0].title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Treino de explicação' })).toHaveAttribute('href', '/aulas/treino')
    expect(screen.getByRole('link', { name: LEVELS[0].cargo })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: LEVELS[1].cargo })).toHaveAttribute('href', '/aulas?nivel=n1')
  })

  it('Aulas: nível e aula vêm do endereço e o modo cards mostra os flashcards', () => {
    abrir(aulasEm('n2', 'lesson', LESSONS.n2[1].id))
    expect(screen.getByRole('heading', { level: 2, name: LESSONS.n2[1].title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: LEVELS[2].cargo })).toHaveAttribute('aria-current', 'page')
    cleanup()
    abrir(aulasEm('n1', 'cards'))
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

  it('Comandante: quatro papéis, o que cada um faz e não faz, e os limites do guia', () => {
    abrir(<PaginaComandante />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Comandante' })).toBeInTheDocument()
    const papeis = screen.getAllByRole('heading', { level: 3 }).map((titulo) => titulo.textContent)
    expect(papeis).toEqual(['Consultor', 'Instrutor', 'Copiloto', 'Mentor'])
    expect(screen.getByText('Atua em: Caixa-preta e Brevê.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'O que este guia não faz' })).toBeInTheDocument()
    expect(screen.getByText('Não promete emprego, salário nem resultado.')).toBeInTheDocument()
  })

  it('Hangar mínimo: um único h1 e as rotas do catálogo com o status em texto', () => {
    abrir(<PaginaHangar />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Hangar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Suporte de TI' })).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText('Em preparação')).toBeInTheDocument()
    expect(screen.getAllByText('Futuro')).toHaveLength(2)
  })

  it('Aulas: o link de outro nível leva ao endereço do nível', () => {
    abrir(aulasEm('estagiario'))
    fireEvent.click(screen.getByRole('link', { name: LEVELS[3].cargo }))
    expect(window.location.pathname + window.location.search).toBe('/aulas?nivel=n3')
  })
})
