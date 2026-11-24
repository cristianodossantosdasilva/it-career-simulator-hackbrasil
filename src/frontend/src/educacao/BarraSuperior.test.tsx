import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { IdMissao } from '../jornada/catalogos/catalogoRotas'
import { reiniciarLocalAtual } from '../jornada/navegacao/navegador'
import type { IdPagina } from '../jornada/navegacao/rotas'
import { AppShell } from '../shell/AppShell'
import { BarraSuperior } from './BarraSuperior'
import { carregarEstadoAcademia } from './catalogoEducacional'

function renderizar(paginaAtual: IdPagina, missaoAtiva: IdMissao | null = null) {
  return render(
    <AppShell>
      <BarraSuperior paginaAtual={paginaAtual} missaoAtiva={missaoAtiva} estado={carregarEstadoAcademia()} />
    </AppShell>,
  )
}

function navegacao() {
  return screen.getByRole('navigation', { name: 'Navegação principal' })
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
  reiniciarLocalAtual()
})

afterEach(() => {
  cleanup()
})

describe('BarraSuperior por links', () => {
  it('marca o item da página com aria-current e mostra o nome da página na barra de contexto', () => {
    renderizar('plano-de-carreira')
    const nav = navegacao()
    const plano = within(nav).getByRole('link', { name: 'Plano de Carreira' })
    expect(plano).toHaveAttribute('href', '/plano-de-carreira')
    expect(plano).toHaveAttribute('aria-current', 'page')
    expect(plano).toHaveClass('active')
    expect(within(nav).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
    expect(document.querySelector('.barra-contexto-local')).toHaveTextContent('Plano de Carreira')
  })

  it('mostra a Mesa de Trabalho só com missão ativa', () => {
    renderizar('inicio')
    expect(within(navegacao()).queryByRole('link', { name: 'Mesa de Trabalho' })).not.toBeInTheDocument()
    cleanup()
    renderizar('mesa-de-trabalho', 'incidente-massivo')
    const mesa = within(navegacao()).getByRole('link', { name: 'Mesa de Trabalho' })
    expect(mesa).toHaveAttribute('href', '/mesa-de-trabalho/incidente-massivo')
    expect(mesa).toHaveAttribute('aria-current', 'page')
  })

  it('páginas de fluxo não marcam item', () => {
    renderizar('diagnostico')
    expect(within(navegacao()).queryAllByRole('link').some((l) => l.hasAttribute('aria-current'))).toBe(false)
  })

  it('o botão Mais abre a lista, leva o foco ao primeiro link e Escape devolve o foco', () => {
    renderizar('inicio')
    const mais = within(navegacao()).getByRole('button', { name: 'Mais' })
    expect(mais).toHaveAttribute('aria-expanded', 'false')
    expect(mais).toHaveAttribute('aria-controls', 'nav-mais')
    const lista = document.getElementById('nav-mais')
    expect(lista).not.toBeVisible()

    fireEvent.click(mais)
    expect(mais).toHaveAttribute('aria-expanded', 'true')
    expect(lista).toBeVisible()
    const links = within(lista as HTMLElement).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Catálogo', 'Aulas', 'Caderno', 'Mentor'])
    expect(links[0]).toHaveFocus()
    expect(within(lista as HTMLElement).queryByRole('group', { name: 'Tema da interface' })).not.toBeInTheDocument()
    expect(within(document.querySelector('.barra-contexto') as HTMLElement).getByRole('button', { name: 'Aparência' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mais).toHaveAttribute('aria-expanded', 'false')
    expect(mais).toHaveFocus()
  })

  it('seguir um link da lista fecha o Mais e navega', () => {
    renderizar('inicio')
    const mais = within(navegacao()).getByRole('button', { name: 'Mais' })
    fireEvent.click(mais)
    const lista = document.getElementById('nav-mais') as HTMLElement
    act(() => {
      fireEvent.click(within(lista).getByRole('link', { name: 'Catálogo' }))
    })
    expect(window.location.pathname).toBe('/catalogo')
    expect(mais).toHaveAttribute('aria-expanded', 'false')
  })

  it('marca o botão Mais quando a página está no grupo mais', () => {
    renderizar('caderno')
    const mais = within(navegacao()).getByRole('button', { name: 'Mais' })
    expect(mais).toHaveClass('active')
    fireEvent.click(mais)
    const lista = document.getElementById('nav-mais') as HTMLElement
    expect(within(lista).getByRole('link', { name: 'Caderno' })).toHaveAttribute('aria-current', 'page')
    cleanup()
    renderizar('portfolio')
    expect(within(navegacao()).getByRole('button', { name: 'Mais' })).not.toHaveClass('active')
  })
})
