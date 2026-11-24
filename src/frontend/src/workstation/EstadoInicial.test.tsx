import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import {
  CHAVE_ARMAZENAMENTO_ACADEMIA,
  carregarEstadoAcademia,
  criarEstadoInicialAcademia,
  salvarEstadoAcademia,
} from '../educacao/catalogoEducacional'
import { abrirAplicacao, irPeloMenu, limparNavegador } from '../testes/abrirAplicacao'
import { registroDeTeste } from '../testes/armazenamentoFalso'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../jornada/armazenamento/registrosMissao'

afterEach(() => {
  cleanup()
  limparNavegador()
  vi.restoreAllMocks()
})

function espiarInicioDeSessao() {
  return vi.spyOn(apiClient, 'criarSessao').mockRejectedValue(new Error('sem rede no teste'))
}

describe('Estado inicial do Plano de Carreira', () => {
  it('abre sem escolha livre de missao, sem Iniciar e sem abrir sessao', () => {
    const criarSessao = espiarInicioDeSessao()
    abrirAplicacao('/')
    irPeloMenu('Plano de Carreira')
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Iniciar no Simulador/i })).not.toBeInTheDocument()
    expect(criarSessao).not.toHaveBeenCalled()
  })

  it('Primeira Missão leva a Mesa de Trabalho da primeira missao disponivel da rota e abre a sessao', async () => {
    const criarSessao = espiarInicioDeSessao()
    abrirAplicacao('/plano-de-carreira')
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar primeira missão' }))
    expect(window.location.pathname).toBe('/mesa-de-trabalho/reset-senha-desbloqueio')
    await waitFor(() => expect(criarSessao).toHaveBeenCalledTimes(1))
    expect(criarSessao).toHaveBeenCalledWith({ cenarioId: 'reset-senha-desbloqueio' })
  })

  it('Demo rapida inicia a missao de demonstracao com semente 42 e a Causa do catalogo', async () => {
    const criarSessao = espiarInicioDeSessao()
    // A Service Desk N1 Jr só libera depois do registro da Help Desk N1.
    window.localStorage.setItem(CHAVE_REGISTROS_MISSAO, serializarRegistros([registroDeTeste('reset-senha-desbloqueio', 'sessao-ajuda')]))
    abrirAplicacao('/plano-de-carreira')
    const opcoes = screen.getByText('Opções avançadas para teste').closest('details') as HTMLDetailsElement
    opcoes.open = true
    fireEvent.click(within(opcoes).getByRole('link', { name: /Demo rápida/i }))
    await waitFor(() => expect(criarSessao).toHaveBeenCalledTimes(1))
    expect(criarSessao).toHaveBeenCalledWith(
      expect.objectContaining({ cenarioId: 'pasta-rede-inacessivel', semente: 42, causaForcada: expect.any(String) }),
    )
  })
})

describe('Focus inicial da Academia', () => {
  it('estado limpo usa help-desk-n1 e Aulas abre em Help Desk N1', () => {
    expect(criarEstadoInicialAcademia().focus).toBe('help-desk-n1')
    expect(carregarEstadoAcademia().focus).toBe('help-desk-n1')
    abrirAplicacao('/')
    irPeloMenu('Aulas')
    expect(screen.getByRole('heading', { level: 2, name: 'Help Desk N1' })).toBeInTheDocument()
  })

  it('quem ja tem service-desk-n1-jr salvo permanece nele', () => {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO_ACADEMIA, JSON.stringify({ focus: 'service-desk-n1-jr' }))
    expect(carregarEstadoAcademia().focus).toBe('service-desk-n1-jr')
    abrirAplicacao('/')
    irPeloMenu('Aulas')
    expect(screen.getByRole('heading', { level: 2, name: 'Service Desk N1 Jr' })).toBeInTheDocument()
  })
})

describe('Missao 0 depois da Primeira Missão e antes das etapas', () => {
  function secaoMissaoZero() {
    const titulo = screen.getByRole('heading', { level: 2, name: /Missão 0/i })
    const detalhes = titulo.closest('details')
    expect(detalhes).not.toBeNull()
    return detalhes as HTMLDetailsElement
  }
  function vemAntes(a: Element, b: Element) {
    return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING
  }

  it('ordem no DOM: Primeira Missão, Missao 0, etapas, Glossario', () => {
    abrirAplicacao('/plano-de-carreira')
    const ordem = [
      screen.getByRole('heading', { level: 2, name: 'Iniciar primeira missão' }),
      screen.getByRole('heading', { level: 2, name: /Missão 0/i }),
      screen.getByRole('heading', { level: 2, name: 'Help Desk N1' }),
      screen.getByText(/Glossário rápido para iniciantes/i),
    ]
    for (let i = 0; i < ordem.length - 1; i += 1) {
      expect(vemAntes(ordem[i], ordem[i + 1]), `posicao ${i} antes de ${i + 1}`).toBe(true)
    }
  })

  it('o texto de apoio diferencia a Missao 0 da Primeira Missão', () => {
    abrirAplicacao('/plano-de-carreira')
    expect(secaoMissaoZero()).toHaveTextContent(/dentro do chamado/i)
    expect(screen.getAllByText(/depois que ele estiver aberto/i)).toHaveLength(1)
  })

  it('sem progresso a Missao 0 abre aberta', () => {
    abrirAplicacao('/plano-de-carreira')
    expect(secaoMissaoZero().open).toBe(true)
  })

  it('com progresso a Missao 0 abre recolhida e a escolha manual nao e persistida', () => {
    salvarEstadoAcademia({ ...criarEstadoInicialAcademia(), lessonsDone: ['aula-qualquer'] })
    const primeira = abrirAplicacao('/plano-de-carreira')
    const detalhes = secaoMissaoZero()
    expect(detalhes.open).toBe(false)
    detalhes.open = true
    primeira.unmount()
    abrirAplicacao('/plano-de-carreira')
    expect(secaoMissaoZero().open).toBe(false)
  })

  it('a ordem de Tab percorre Primeira Missão, Missao 0 e o primeiro Iniciar', () => {
    abrirAplicacao('/plano-de-carreira')
    const alvos = Array.from(
      document.querySelectorAll<HTMLElement>('button:not([disabled]), summary, a[href], input, select, textarea'),
    )
    // Sem tabindex positivo, a ordem de Tab segue a ordem do DOM.
    expect(alvos.some((el) => el.tabIndex > 0)).toBe(false)
    const primeiroMissao = screen.getByRole('button', { name: 'Iniciar primeira missão' })
    const resumoMissaoZero = secaoMissaoZero().querySelector('summary') as HTMLElement
    const primeiroIniciar = screen.getAllByRole('link', { name: /Iniciar/ })[0]
    expect(alvos.indexOf(primeiroMissao)).toBeGreaterThanOrEqual(0)
    expect(alvos.indexOf(resumoMissaoZero)).toBeGreaterThan(alvos.indexOf(primeiroMissao))
    expect(alvos.indexOf(primeiroIniciar)).toBeGreaterThan(alvos.indexOf(resumoMissaoZero))
  })
})
