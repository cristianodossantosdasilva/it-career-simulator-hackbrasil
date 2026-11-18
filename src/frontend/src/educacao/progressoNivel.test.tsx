import '@testing-library/jest-dom/vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { abrirAplicacao, irPeloMenu, limparNavegador } from '../testes/abrirAplicacao'
import {
  CHAVE_ARMAZENAMENTO_ACADEMIA,
  DEFAULT_PAGES,
  LEVELS,
  calcularProgressoNivel,
  carregarEstadoAcademia,
  criarEstadoInicialAcademia,
  salvarEstadoAcademia,
  type EstadoAcademia,
} from './catalogoEducacional'

afterEach(() => {
  cleanup()
  limparNavegador()
})

const NOTA_SEMEADA = DEFAULT_PAGES.find((p) => p.level === 'help-desk-n1' && p.type === 'cornell')?.notes ?? ''

function comNotaDoHelpDesk(notes: string | undefined): EstadoAcademia {
  const estado = criarEstadoInicialAcademia()
  const pagina = estado.pages.find((p) => p.level === 'help-desk-n1' && p.type === 'cornell')
  if (!pagina) throw new Error('pagina Cornell do Help Desk N1 ausente')
  pagina.notes = notes
  return estado
}

describe('Progresso por nivel sem notas semeadas', () => {
  it('estado limpo devolve t 0, f 0 e p 0 nos 6 niveis', () => {
    const estado = criarEstadoInicialAcademia()
    expect(LEVELS).toHaveLength(6)
    LEVELS.forEach((nivel) => {
      expect(calcularProgressoNivel(estado, nivel.id)).toEqual({ t: 0, f: 0, p: 0 })
    })
  })

  it('o Brevê mostra Teoria 0%, Fixação 0% e Prática 0% nos 6 niveis, sem progresso parcial', () => {
    abrirAplicacao('/')
    irPeloMenu('Brevê')
    const rotulos = screen.getAllByText('Teoria 0%, Fixação 0%, Prática 0%')
    expect(rotulos).toHaveLength(6)
    expect(within(document.body).queryByText(/Fixação 20%/)).not.toBeInTheDocument()
  })
  it('a pagina semeada de cada nivel Cornell tem texto longo o bastante para o teste ser significativo', () => {
    expect(NOTA_SEMEADA.trim().length).toBeGreaterThan(20)
    const semeadasDoN1 = DEFAULT_PAGES.find((p) => p.level === 'service-desk-n1-jr' && p.type === 'cornell')
    expect(semeadasDoN1?.notes?.trim().length).toBeGreaterThan(20)
  })

  it('notas semeadas sem edicao nao contam', () => {
    const estado = criarEstadoInicialAcademia()
    expect(calcularProgressoNivel(estado, 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(estado, 'service-desk-n1-jr').f).toBe(0)
  })

  it('notas editadas pelo aluno contam 20 pontos de fixacao', () => {
    const estado = comNotaDoHelpDesk(`${NOTA_SEMEADA}\n• Meu resumo: chamado registra e rastreia o pedido.`)
    expect(calcularProgressoNivel(estado, 'help-desk-n1').f).toBe(20)
  })

  it('texto igual ao semeado nao conta, mesmo com espacos nas pontas e quebra CRLF', () => {
    expect(calcularProgressoNivel(comNotaDoHelpDesk(NOTA_SEMEADA), 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoHelpDesk(`  \n${NOTA_SEMEADA}\n  `), 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoHelpDesk(NOTA_SEMEADA.replace(/\n/g, '\r\n')), 'help-desk-n1').f).toBe(0)
  })

  it('nota apagada ou com 20 caracteres ou menos nao conta', () => {
    expect(calcularProgressoNivel(comNotaDoHelpDesk(''), 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoHelpDesk(undefined), 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoHelpDesk('a'.repeat(20)), 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoHelpDesk('a'.repeat(21)), 'help-desk-n1').f).toBe(20)
  })

  it('dado legado salvo carrega sem quebrar e recalcula', () => {
    const legado = {
      xp: 40,
      focus: 'service-desk-n1-jr',
      lessonsDone: ['l1'],
      pages: [
        { id: 'pg-help-desk-n1', icon: '\u{1F392}', title: 'Help Desk N1', level: 'help-desk-n1', type: 'cornell', notes: NOTA_SEMEADA },
        { id: 'pg-service-desk-n1-jr', icon: 'nivel-service-desk-n1-jr', title: 'Service Desk N1 Jr', level: 'service-desk-n1-jr', type: 'cornell', notes: 'Minhas anotacoes sobre DNS e IP.' },
      ],
    }
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO_ACADEMIA, JSON.stringify(legado))
    const estado = carregarEstadoAcademia()
    expect(estado.focus).toBe('service-desk-n1-jr')
    expect(calcularProgressoNivel(estado, 'help-desk-n1').f).toBe(0)
    expect(calcularProgressoNivel(estado, 'service-desk-n1-jr').f).toBe(20)

    salvarEstadoAcademia(estado)
    expect(calcularProgressoNivel(carregarEstadoAcademia(), 'service-desk-n1-jr').f).toBe(20)
  })

  it('dado legado sem a pagina Cornell do nivel nao quebra', () => {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO_ACADEMIA, JSON.stringify({ pages: [] }))
    const estado = carregarEstadoAcademia()
    expect(calcularProgressoNivel(estado, 'n2-pleno')).toEqual({ t: 0, f: 0, p: 0 })
  })
})
