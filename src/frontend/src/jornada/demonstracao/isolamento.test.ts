import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { createElement, useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { projecaoDeTeste, respostaJson } from '../../testes/apiDeTeste'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_VOO } from '../armazenamento/registrosVoo'
import { type ValorVoo, useVoo } from '../contextosJornada'
import { ProvedorJornada } from '../ProvedorJornada'

const FONTES = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>
const SEM_TESTES = Object.entries(FONTES).filter(([caminho]) => !/\.test\.tsx?$/.test(caminho))

function importa(texto: string, alvo: RegExp): boolean {
  return [...texto.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm)].some((achado) =>
    alvo.test(achado[1]),
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Isolamento do modo de demonstração', () => {
  it('a varredura encontra os módulos que ela deveria vigiar', () => {
    const caminhos = SEM_TESTES.map(([caminho]) => caminho)
    expect(caminhos.some((c) => c.includes('/jornada/demonstracao/'))).toBe(true)
    expect(caminhos.some((c) => c.endsWith('/armazenamento/modoDemonstracao.ts'))).toBe(true)
    expect(caminhos.some((c) => c.includes('/api/'))).toBe(true)
    expect(caminhos.some((c) => c.includes('/jornada/cabine/'))).toBe(true)
  })

  it('demonstracao/ e modoDemonstracao.ts não importam api/client nem registrosVoo', () => {
    const vigiados = SEM_TESTES.filter(
      ([caminho]) => caminho.includes('/jornada/demonstracao/') || caminho.endsWith('/armazenamento/modoDemonstracao.ts'),
    )
    expect(vigiados.length).toBeGreaterThan(0)
    for (const [caminho, texto] of vigiados) {
      expect(importa(texto, /api\/client/), `${caminho} importa api/client`).toBe(false)
      expect(importa(texto, /registrosVoo/), `${caminho} importa registrosVoo`).toBe(false)
    }
  })

  it('api/ e jornada/cabine/ não contêm o modo nem a chave dele', () => {
    const vigiados = SEM_TESTES.filter(([caminho]) => caminho.includes('/src/api/') || caminho.includes('/jornada/cabine/'))
    expect(vigiados.length).toBeGreaterThan(0)
    for (const [caminho, texto] of vigiados) {
      expect(texto, `${caminho} cita modoDemonstracao`).not.toContain('modoDemonstracao')
      expect(texto, `${caminho} cita a chave do modo`).not.toContain('itfs_modo_demonstracao')
    }
  })

  // Feature: jornada-de-voo, Property 23: O modo não toca registros nem rede
  it('abrir pasta-rede-inacessivel e agir produz as mesmas requisições com o modo ativo e inativo', async () => {
    async function executar(modoAtivo: boolean) {
      // O provedor guarda os identificadores de sessão no localStorage do navegador: parte de um estado igual.
      window.localStorage.clear()
      const requisicoes: { url: string; metodo: string; cabecalhos: string; corpo: string | null }[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (entrada, init) => {
        const url = String(entrada)
        const metodo = init?.method ?? 'GET'
        requisicoes.push({
          url,
          metodo,
          cabecalhos: JSON.stringify([...new Headers(init?.headers).entries()].sort()),
          corpo: typeof init?.body === 'string' ? init.body : null,
        })
        if (metodo === 'POST' && url.endsWith('/api/sessoes')) {
          return respostaJson({ sessaoId: 'sessao-fixa', semente: 42, ultimoSeq: 0 })
        }
        if (url.endsWith('/avaliacao')) {
          return respostaJson({ concluida: false, criterios: [], incidenteSeguranca: false, xpTotal: 0, resumo: '' })
        }
        if (url.includes('/api/carreira/resumo')) return respostaJson({}, 500)
        return respostaJson(projecaoDeTeste('pasta-rede-inacessivel'))
      })
      const armazenamento = criarArmazenamentoFalso(
        modoAtivo
          ? {
              [CHAVE_MODO_DEMONSTRACAO]: serializarModoDemonstracao({
                versao: 1,
                ativo: true,
                origem: 'plano-de-voo',
                alteradoEm: '2026-11-20T12:00:00.000Z',
              }),
            }
          : {},
      )
      let voo: ValorVoo | null = null
      function Captura() {
        const valor = useVoo()
        useEffect(() => {
          voo = valor
        })
        return null
      }
      render(createElement(ProvedorJornada, { armazenamento }, createElement(Captura)))
      await act(async () => {
        await voo?.abrirVoo('pasta-rede-inacessivel', { semente: 42, nova: true })
      })
      await waitFor(() => expect(voo?.sessaoId).toBe('sessao-fixa'))
      await act(async () => {
        await voo?.executarAcao('consultar_chamado', { chamadoId: 'INC-1' })
      })
      cleanup()
      vi.restoreAllMocks()
      return { requisicoes, armazenamento }
    }
    const inativo = await executar(false)
    const ativo = await executar(true)
    expect(inativo.requisicoes.length).toBeGreaterThan(1)
    expect(ativo.requisicoes).toEqual(inativo.requisicoes)
    for (const requisicao of ativo.requisicoes) {
      const texto = JSON.stringify(requisicao).toLowerCase()
      expect(texto).not.toContain('demonstracao')
      expect(texto).not.toContain('itfs_modo')
    }
    // O modo não grava nem apaga Registro_de_Voo e não regrava a própria chave só por abrir uma missão.
    expect(ativo.armazenamento.dados.has(CHAVE_REGISTROS_VOO)).toBe(false)
    expect(ativo.armazenamento.gravacoes.filter((g) => g.chave === CHAVE_MODO_DEMONSTRACAO)).toHaveLength(0)
  })
})