import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { IntranetApp } from './IntranetApp'

afterEach(cleanup)

describe('IntranetApp W22', () => {
  it('filtra a base e não apresenta violações axe-core com artigo recolhido ou expandido', async () => {
    const { container } = render(<IntranetApp />)
    const busca = screen.getByRole('textbox', { name: 'Buscar na Base de Conhecimento' })
    fireEvent.change(busca, { target: { value: 'KB-001' } })
    expect(screen.getByRole('listitem')).toHaveTextContent('KB-001')
    expect((await axe.run(container)).violations).toEqual([])

    const artigo = screen.getByRole('button', { name: /KB-001.*Politica de Verificacao/i })
    fireEvent.click(artigo)
    expect(artigo).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: /KB-001.*Politica de Verificacao/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
