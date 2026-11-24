import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { responderMentor } from '../../educacao/catalogoEducacional'
import { paraTodo } from '../../testes/propriedade'
import { type IdPagina, NOME_PAGINA } from '../navegacao/rotas'
import { AVISO_JUIZ, PAPEIS, type PapelMentor, papelPorPagina } from './catalogoMentor'
import { PainelMentor } from './PainelMentor'
import { PREFIXO_PROXIMO_PASSO, responderComoMentor } from './responderMentor'

const PAGINAS = Object.keys(NOME_PAGINA) as IdPagina[]
const PAPEIS_IDS = Object.keys(PAPEIS) as PapelMentor[]

const FONTES = import.meta.glob('./*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Mentor', () => {
  it('nenhum módulo de mentor/ importa o cliente da API, os registros ou o cartão', () => {
    const modulos = Object.entries(FONTES).filter(([caminho]) => !/\.test\.tsx?$/.test(caminho))
    expect(modulos.length).toBeGreaterThanOrEqual(3)
    for (const [caminho, fonte] of modulos) {
      const origens = [...fonte.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
      for (const proibido of ['api/client', 'registrosMissao', 'cartaoPerfil']) {
        expect(origens.some((origem) => origem.includes(proibido)), `${caminho} importa ${proibido}`).toBe(false)
      }
    }
  })

  it('Feature: jornada-de-missao, Property 20: Papel do Mentor por página', () => {
    const esperado: Partial<Record<IdPagina, PapelMentor>> = {
      inicio: 'consultor',
      'diagnostico': 'consultor',
      'plano-de-carreira': 'instrutor',
      'mesa-de-trabalho': 'copiloto',
      'revisao': 'mentor',
      'portfolio': 'mentor',
    }
    paraTodo('papel por página', (g) => g.escolher(PAGINAS), (pagina) => {
      expect(papelPorPagina(pagina)).toBe(esperado[pagina] ?? null)
    })
    for (const pagina of PAGINAS) expect(papelPorPagina(pagina)).toBe(esperado[pagina] ?? null)
  })

  it('Feature: jornada-de-missao, Property 21: Mentor só orienta', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    const ler = vi.spyOn(Storage.prototype, 'getItem')
    const gravar = vi.spyOn(Storage.prototype, 'setItem')
    const remover = vi.spyOn(Storage.prototype, 'removeItem')
    paraTodo(
      'mentor só orienta',
      (g) => ({
        papel: g.escolher(PAPEIS_IDS),
        pergunta: g.escolher([
          g.texto(30),
          '',
          'O que faço agora?',
          'travei no passo',
          ...PAPEIS_IDS.flatMap((p) => PAPEIS[p].sugestoes.map((s) => s.pergunta)),
        ]),
        contexto: Object.freeze({
          pagina: g.escolher(PAGINAS),
          dicaMissao: g.inteiro(0, 1) === 0 ? null : `Dica ${g.texto(10)}`,
        }),
      }),
      ({ papel, pergunta, contexto }) => {
        const copia = { ...contexto }
        const resposta = responderComoMentor(papel, pergunta, contexto)
        expect(contexto).toEqual(copia)
        const definicao = PAPEIS[papel]
        const catalogo = [
          ...Object.values(definicao.abertura),
          ...definicao.sugestoes.map((s) => s.resposta),
          responderMentor(pergunta),
        ]
        const proximoPasso = contexto.dicaMissao ? `${PREFIXO_PROXIMO_PASSO}${contexto.dicaMissao}` : null
        expect(catalogo.includes(resposta) || resposta === proximoPasso).toBe(true)
        expect(resposta).not.toMatch(/\b(aprovad|reprovad|nota \d)/i)
      },
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(ler).not.toHaveBeenCalled()
    expect(gravar).not.toHaveBeenCalled()
    expect(remover).not.toHaveBeenCalled()
  })

  it('o painel mostra o papel em texto e, no papel Mentor, o aviso do Juiz 360º', () => {
    render(<PainelMentor papel="mentor" pagina="revisao" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Mentor, papel Mentor' })).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(AVISO_JUIZ)).length).toBeGreaterThan(0)
    cleanup()
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(<PainelMentor papel="copiloto" pagina="mesa-de-trabalho" dicaMissao="Abra o chamado no ITSM." />)
    expect(screen.getByRole('heading', { level: 2, name: 'Mentor, papel Copiloto' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'O que faço agora?' }))
    expect(screen.getByText('Próximo passo: Abra o chamado no ITSM.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
