import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import { App } from '../App'
import { carregarEstadoAcademia, criarEstadoInicialAcademia } from '../educacao/catalogoEducacional'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

function espiarInicioDeSessao() {
  return vi.spyOn(apiClient, 'criarSessao').mockRejectedValue(new Error('sem rede no teste'))
}

function botaoDecolar() {
  return screen.getByRole('button', { name: /Decolar no Simulador/i })
}

describe('Estado inicial da tela de missoes', () => {
  it('abre sem nenhuma missao marcada e com o Decolar indisponivel e explicado', () => {
    render(<App />)
    const radios = within(screen.getByRole('radiogroup', { name: /Escolha o nível da simulação/i })).getAllByRole('radio')
    expect(radios).toHaveLength(5)
    radios.forEach((radio) => expect(radio).toHaveAttribute('aria-checked', 'false'))

    const decolar = botaoDecolar()
    expect(decolar).toHaveAttribute('aria-disabled', 'true')
    expect(decolar).not.toBeDisabled()
    const apoio = screen.getByText('Escolha uma missão')
    expect(apoio).toBeVisible()
    expect(decolar).toHaveAttribute('aria-describedby', apoio.id)
  })

  it('clique e Enter no Decolar sem selecao nao iniciam missao', () => {
    const criarSessao = espiarInicioDeSessao()
    render(<App />)
    const decolar = botaoDecolar()
    fireEvent.click(decolar)
    // Em navegador, Enter em botao nativo gera um clique depois do keydown.
    fireEvent.keyDown(decolar, { key: 'Enter', code: 'Enter' })
    fireEvent.click(decolar)
    expect(criarSessao).not.toHaveBeenCalled()
    expect(decolar).toHaveAttribute('aria-disabled', 'true')
  })

  it('escolher uma missao libera o Decolar e inicia o cenario escolhido', async () => {
    const criarSessao = espiarInicioDeSessao()
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: /Triagem e Defesa contra Engenharia Social/i }))
    const decolar = botaoDecolar()
    expect(decolar).not.toHaveAttribute('aria-disabled')
    expect(decolar).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByText('Escolha uma missão')).not.toBeInTheDocument()

    fireEvent.click(decolar)
    await waitFor(() => expect(criarSessao).toHaveBeenCalledTimes(1))
    expect(criarSessao).toHaveBeenCalledWith(expect.objectContaining({ cenarioId: 'triagem-engenharia-social' }))
  })

  it('Demo rapida continua iniciando o Nivel 2 com a causa C1 sem selecao previa', async () => {
    const criarSessao = espiarInicioDeSessao()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Demo rápida: Nível 2, C1/i }))
    await waitFor(() => expect(criarSessao).toHaveBeenCalledTimes(1))
    expect(criarSessao).toHaveBeenCalledWith({ cenarioId: 'pasta-rede-inacessivel', semente: 42, causaForcada: 'C1' })
  })

  it('Primeiro Voo continua iniciando o Estagiario', async () => {
    const criarSessao = espiarInicioDeSessao()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar primeiro voo' }))
    await waitFor(() => expect(criarSessao).toHaveBeenCalledTimes(1))
    expect(criarSessao).toHaveBeenCalledWith(expect.objectContaining({ cenarioId: 'triagem-engenharia-social' }))
  })
})

describe('Focus inicial da Academia', () => {
  it('estado limpo usa estagiario e Aulas abre em Estagiario', () => {
    expect(criarEstadoInicialAcademia().focus).toBe('estagiario')
    expect(carregarEstadoAcademia().focus).toBe('estagiario')

    render(<App />)
    const navPrincipal = screen.getByRole('navigation', { name: /Navegação principal/i })
    fireEvent.click(within(navPrincipal).getByRole('button', { name: 'Aulas' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Estagiário' })).toBeInTheDocument()
  })

  it('quem ja tem n1 salvo permanece em n1, sem migracao', () => {
    window.localStorage.setItem('itfs_academia_v3', JSON.stringify({ focus: 'n1' }))
    expect(carregarEstadoAcademia().focus).toBe('n1')

    render(<App />)
    const navPrincipal = screen.getByRole('navigation', { name: /Navegação principal/i })
    fireEvent.click(within(navPrincipal).getByRole('button', { name: 'Aulas' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Analista Jr (N1)' })).toBeInTheDocument()
  })
})
