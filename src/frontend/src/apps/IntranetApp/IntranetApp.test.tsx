import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { IntranetApp } from './IntranetApp'
import { dividirConteudo } from './passosKb'

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

  it('troca de artigo com foco no título e fecha pelo botão Fechar artigo', async () => {
    render(<IntranetApp />)
    const kb1 = screen.getByRole('button', { name: /KB-001.*Politica de Verificacao/i })
    fireEvent.click(kb1)
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', 'kb-titulo-KB-001'))

    const kb2 = screen.getByRole('button', { name: /KB-002/i })
    fireEvent.click(kb2)
    expect(kb2).toHaveAttribute('aria-expanded', 'true')
    expect(kb1).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', 'kb-titulo-KB-002'))

    fireEvent.click(screen.getByRole('button', { name: TEXTOS_WORKSTATION.intranet.fecharArtigo }))
    expect(kb2).toHaveAttribute('aria-expanded', 'false')
  })

  it('divide a numeração inline em passos sem alterar o texto', () => {
    const r = dividirConteudo(
      'Ao resolver, descreva: 1) Qual era o problema, 2) Qual foi a causa, 3) Qual ação foi aplicada. Nunca resolva antes de confirmar.',
    )
    expect(r.introducao).toBe('Ao resolver, descreva:')
    expect(r.passos).toEqual(['Qual era o problema', 'Qual foi a causa', 'Qual ação foi aplicada.'])
    expect(r.fecho).toBe('Nunca resolva antes de confirmar.')
    expect(dividirConteudo('Texto sem passos (30min).')).toEqual({ introducao: 'Texto sem passos (30min).', passos: [], fecho: '' })
  })

  it('apresenta os passos do artigo de resolução como lista', () => {
    const { container } = render(<IntranetApp artigoSelecionadoId="KB-007" />)
    const passos = container.querySelectorAll('.kb-passos li')
    expect(passos).toHaveLength(3)
    expect(passos[0]).toHaveTextContent('Qual era o problema')
    expect(container.querySelector('.kb-conteudo')).toHaveTextContent('Nunca resolva antes de confirmar')
  })
})