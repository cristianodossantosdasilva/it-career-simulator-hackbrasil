import '@testing-library/jest-dom/vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { abrirAplicacao, irPeloMenu, limparNavegador } from '../testes/abrirAplicacao'
import {
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

const NOTA_SEMEADA = DEFAULT_PAGES.find((p) => p.level === 'estagiario' && p.type === 'cornell')?.notes ?? ''

function comNotaDoEstagiario(notes: string | undefined): EstadoAcademia {
  const estado = criarEstadoInicialAcademia()
  const pagina = estado.pages.find((p) => p.level === 'estagiario' && p.type === 'cornell')
  if (!pagina) throw new Error('pagina Cornell do Estagiario ausente')
  pagina.notes = notes
  return estado
}

describe('Progresso por nivel sem notas semeadas', () => {
  it('estado limpo devolve t 0, f 0 e p 0 nos 5 niveis', () => {
    const estado = criarEstadoInicialAcademia()
    expect(LEVELS).toHaveLength(5)
    LEVELS.forEach((nivel) => {
      expect(calcularProgressoNivel(estado, nivel.id)).toEqual({ t: 0, f: 0, p: 0 })
    })
  })

  it('o Brevê mostra Teoria 0%, Fixação 0% e Prática 0% nos 5 niveis, sem progresso parcial', () => {
    abrirAplicacao('/')
    irPeloMenu('Brevê')
    const rotulos = screen.getAllByText('Teoria 0%, Fixação 0%, Prática 0%')
    expect(rotulos).toHaveLength(5)
    expect(within(document.body).queryByText(/Fixação 20%/)).not.toBeInTheDocument()
  })
  it('a pagina semeada de cada nivel Cornell tem texto longo o bastante para o teste ser significativo', () => {
    expect(NOTA_SEMEADA.trim().length).toBeGreaterThan(20)
    const semeadasDoN1 = DEFAULT_PAGES.find((p) => p.level === 'n1' && p.type === 'cornell')
    expect(semeadasDoN1?.notes?.trim().length).toBeGreaterThan(20)
  })

  it('notas semeadas sem edicao nao contam', () => {
    const estado = criarEstadoInicialAcademia()
    expect(calcularProgressoNivel(estado, 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(estado, 'n1').f).toBe(0)
  })

  it('notas editadas pelo aluno contam 20 pontos de fixacao', () => {
    const estado = comNotaDoEstagiario(`${NOTA_SEMEADA}\n• Meu resumo: chamado registra e rastreia o pedido.`)
    expect(calcularProgressoNivel(estado, 'estagiario').f).toBe(20)
  })

  it('texto igual ao semeado nao conta, mesmo com espacos nas pontas e quebra CRLF', () => {
    expect(calcularProgressoNivel(comNotaDoEstagiario(NOTA_SEMEADA), 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoEstagiario(`  \n${NOTA_SEMEADA}\n  `), 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoEstagiario(NOTA_SEMEADA.replace(/\n/g, '\r\n')), 'estagiario').f).toBe(0)
  })

  it('nota apagada ou com 20 caracteres ou menos nao conta', () => {
    expect(calcularProgressoNivel(comNotaDoEstagiario(''), 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoEstagiario(undefined), 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoEstagiario('a'.repeat(20)), 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(comNotaDoEstagiario('a'.repeat(21)), 'estagiario').f).toBe(20)
  })

  it('dado legado salvo carrega sem quebrar e recalcula', () => {
    const legado = {
      xp: 40,
      focus: 'n1',
      lessonsDone: ['l1'],
      pages: [
        { id: 'pg-estagiario', icon: '\u{1F392}', title: 'Estagiario', level: 'estagiario', type: 'cornell', notes: NOTA_SEMEADA },
        { id: 'pg-n1', icon: 'nivel-n1', title: 'N1', level: 'n1', type: 'cornell', notes: 'Minhas anotacoes sobre DNS e IP.' },
      ],
    }
    window.localStorage.setItem('itfs_academia_v3', JSON.stringify(legado))
    const estado = carregarEstadoAcademia()
    expect(estado.focus).toBe('n1')
    expect(calcularProgressoNivel(estado, 'estagiario').f).toBe(0)
    expect(calcularProgressoNivel(estado, 'n1').f).toBe(20)

    salvarEstadoAcademia(estado)
    expect(calcularProgressoNivel(carregarEstadoAcademia(), 'n1').f).toBe(20)
  })

  it('dado legado sem a pagina Cornell do nivel nao quebra', () => {
    window.localStorage.setItem('itfs_academia_v3', JSON.stringify({ pages: [] }))
    const estado = carregarEstadoAcademia()
    expect(calcularProgressoNivel(estado, 'n2')).toEqual({ t: 0, f: 0, p: 0 })
  })
})
