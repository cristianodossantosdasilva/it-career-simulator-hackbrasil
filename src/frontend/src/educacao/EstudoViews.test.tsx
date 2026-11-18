import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AulasView } from './AulasView'
import { CadernoView } from './CadernoView'
import {
  CHAVE_ARMAZENAMENTO_ACADEMIA,
  type EstadoAcademia,
  LEVELS,
  carregarEstadoAcademia,
  criarEstadoInicialAcademia,
  normalizarIconePagina,
  responderMentor,
} from './catalogoEducacional'
import { MentorView } from './MentorView'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const REGEX_EMOJI = /\p{Extended_Pictographic}/u

function Academia({ children }: { children: (estado: EstadoAcademia, atualizar: (fn: (p: EstadoAcademia) => EstadoAcademia) => void) => React.ReactNode }) {
  const [estado, setEstado] = useState(criarEstadoInicialAcademia)
  return <>{children(estado, (fn) => setEstado((prev) => fn(prev)))}</>
}

describe('Telas de estudo', () => {
  it('o catalogo usa identificadores de icone e nenhuma pagina padrao traz emoji', () => {
    const estado = criarEstadoInicialAcademia()
    for (const nivel of LEVELS) expect(nivel.icon).toMatch(/^nivel-/)
    for (const pagina of estado.pages) expect(pagina.icon).not.toMatch(REGEX_EMOJI)
  })

  it('converte icones emoji de paginas salvas em versoes antigas ao carregar', () => {
    expect(normalizarIconePagina('🎒')).toBe('nivel-help-desk-n1')
    expect(normalizarIconePagina('📝')).toBe('notas')
    expect(normalizarIconePagina('desconhecido')).toBe('pagina')
    expect(normalizarIconePagina('plano')).toBe('plano')

    const salvo = criarEstadoInicialAcademia()
    window.localStorage.setItem(
      CHAVE_ARMAZENAMENTO_ACADEMIA,
      JSON.stringify({ ...salvo, pages: salvo.pages.map((p) => ({ ...p, icon: '🎤' })) }),
    )
    expect(carregarEstadoAcademia().pages.every((p) => p.icon === 'pitch')).toBe(true)
  })

  it('Aulas mostra modulo, aula e flashcards sem emoji e sem violacoes axe', async () => {
    const { container } = render(
      <Academia>
        {(estado, atualizar) => (
          <AulasView
            estado={estado}
            nivel="help-desk-n1"
            onAtualizarEstado={atualizar}
            onIrParaCaderno={vi.fn()}
            onIniciarLaboratorio={vi.fn()}
          />
        )}
      </Academia>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Help Desk N1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Praticar no laboratório/i })).toBeInTheDocument()
    expect(container.textContent ?? '').not.toMatch(REGEX_EMOJI)
    expect(container.textContent ?? '').not.toContain('·')
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: /Flashcards de revisão/i }))
    expect(screen.getByRole('heading', { level: 1, name: 'Flashcards de Help Desk N1' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Virar cartão/i }))
    expect(screen.getByRole('button', { name: /Lembrei fácil/i })).toBeInTheDocument()
  })

  it('Caderno cria paginas com identificador de icone valido', () => {
    const { container } = render(
      <Academia>{(estado, atualizar) => <CadernoView estado={estado} onAtualizarEstado={atualizar} />}</Academia>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Caderno de estudos' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Página livre/i }))
    expect(screen.getByLabelText('Título da página')).toHaveValue('Página sem título')
    expect(container.textContent ?? '').not.toMatch(REGEX_EMOJI)
  })

  it('Mentor se apresenta como base da trilha, sem rotulo de IA, e oferece exercicio guiado', async () => {
    const { container } = render(
      <Academia>{(estado, atualizar) => <MentorView estado={estado} onAtualizarEstado={atualizar} />}</Academia>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Mentor' })).toBeInTheDocument()
    expect(screen.getByText('Respostas guiadas pelo conteúdo da trilha.')).toBeInTheDocument()
    expect(screen.getByText(/não é um chat de inteligência artificial aberto/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Exercício guiado/i })).toBeInTheDocument()
    expect(container.textContent ?? '').not.toMatch(/\bIA\b/)
    expect(container.textContent ?? '').not.toMatch(REGEX_EMOJI)
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'O que é DNS?' }))
    const log = container.querySelector('.chat') as HTMLElement
    expect(within(log).getByText(/agenda de contatos da rede/i)).toBeInTheDocument()
  })

  it('Mentor avisa quando a pergunta esta fora da base da trilha', () => {
    expect(responderMentor('qual a capital da França')).toMatch(/fora da base desta trilha/i)
  })
})
