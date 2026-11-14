import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import vetoresJcs from '../../../docs/vetores-jcs-sha256.json'
import { App } from './App'
import { canonicalizarJcs, sha256Hex, verificarCurriculoVivoJson } from './utils/jcs'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('IT Flight Simulator UI', () => {
  it('renderiza tela inicial com 3 niveis e permite selecionar nivel', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /IT Flight Simulator/i })).toBeInTheDocument()
    expect(screen.getByText(/Triagem & Defesa contra Engenharia Social/i)).toBeInTheDocument()
    expect(screen.getByText(/Pasta de Rede Inacessivel/i)).toBeInTheDocument()
    expect(screen.getByText(/Incidente Massivo & Problema ITIL/i)).toBeInTheDocument()

    const nivel1 = screen.getByRole('button', { name: /Triagem & Defesa contra Engenharia Social/i })
    fireEvent.click(nivel1)
    expect(nivel1.className).toContain('selected')
  })

  it('carrega resumo de carreira a partir do localStorage e exibe integridade SHA-256', async () => {
    window.localStorage.setItem('itfs_jornada_sessoes', JSON.stringify(['sessao-1', 'sessao-expirada']))
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          apelido: null,
          cargoAtual: 'Analista Jr (N1)',
          xpTotal: 150,
          promocoes: { nivel1Concluido: true, nivel2Concluido: false, nivel3Concluido: false },
          competencias: ['Triagem & Seguranca'],
          sessoesConfirmadas: [
            {
              sessaoId: 'sessao-1',
              cenarioId: 'triagem-engenharia-social',
              nivel: 'N1',
              concluida: true,
              xp: 150,
              hashSessao: 'abc',
            },
          ],
          sessoesNaoConfirmadas: ['sessao-expirada'],
          integridade: {
            hash: 'deadbeef1234',
            algoritmo: 'SHA-256',
            regraHash: 'SHA-256 sem apelido e sem hash.',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Analista Jr \(N1\)/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/150 XP/i)).toBeInTheDocument()
    expect(screen.getByText(/1 sessao\(oes\) marcada\(s\) como nao confirmada/i)).toBeInTheDocument()
    expect(screen.getByText(/deadbeef1234/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar Curriculo Vivo \(JSON\)/i })).toBeInTheDocument()
  })

  it('nao possui violacoes de acessibilidade (axe-core) na tela inicial', async () => {
    const { container } = render(<App />)
    const results = await axe.run(container)
    expect(results.violations).toEqual([])
  })

  it('vetores compartilhados JCS RFC 8785 + SHA-256 batem com o backend C#', async () => {
    for (const vetor of vetoresJcs) {
      const jcs = canonicalizarJcs(vetor.entrada)
      expect(jcs).toBe(vetor.jcs)
      const hash = await sha256Hex(jcs)
      expect(hash).toBe(vetor.sha256)
    }
  })

  it('verificador offline identifica curriculo integro, divergente e nao verificavel', async () => {
    const vetorNucleo = vetoresJcs.find((v) => v.nome === 'curriculo_nucleo_v1')!
    const integroJson = JSON.stringify({
      ...vetorNucleo.entrada,
      apelido: 'Maria',
      exportadoEm: '2026-11-14T22:00:00Z',
      integridade: { hash: vetorNucleo.sha256, algoritmo: 'SHA-256/JCS-RFC8785' },
    })

    const r1 = await verificarCurriculoVivoJson(integroJson)
    expect(r1.status).toBe('integro')

    const r2 = await verificarCurriculoVivoJson(integroJson.replace('"xpTotal":150', '"xpTotal":999'))
    expect(r2.status).toBe('divergente')

    const r3 = await verificarCurriculoVivoJson('{json-invalido')
    expect(r3.status).toBe('nao_verificavel')
  })
})
