import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import vetoresJcs from '../../../docs/vetores-jcs-sha256.json'
import { App } from './App'
import { IntranetApp } from './apps/IntranetApp/IntranetApp'
import { canonicalizarJcs, sha256Hex, verificarCurriculoVivoJson } from './utils/jcs'
import { razaoContraste } from './utils/contraste'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('IT Flight Simulator UI', () => {
  it('calcula contraste WCAG e verifica os pares principais da interface', () => {
    expect(razaoContraste('#000000', '#ffffff')).toBeCloseTo(21, 4)
    expect(razaoContraste('#94a3b8', '#0d1322')).toBeGreaterThanOrEqual(4.5)
    expect(razaoContraste('#38bdf8', '#0d1322')).toBeGreaterThanOrEqual(4.5)
    expect(razaoContraste('#64748b', '#0d1322')).toBeGreaterThanOrEqual(3)
    expect(razaoContraste('#64748b', '#131c31')).toBeGreaterThanOrEqual(3)
    // Tema Claro Educacional (WCAG AA)
    expect(razaoContraste('#0f172a', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(razaoContraste('#475569', '#f3f5f8')).toBeGreaterThanOrEqual(4.5)
    expect(razaoContraste('#0369a1', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(razaoContraste('#ffffff', '#0f1b2d')).toBeGreaterThanOrEqual(4.5)
  })
  it('Intranet troca o artigo selecionado e move o foco para o novo titulo', async () => {
    const { rerender } = render(<IntranetApp key="KB-001" artigoSelecionadoId="KB-001" />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /KB-001.*Politica de Verificacao/i })).toHaveFocus())
    rerender(<IntranetApp key="KB-002" artigoSelecionadoId="KB-002" />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /KB-002.*Verificacao de Identidade/i })).toHaveFocus())
  })

  it('renderiza tela inicial com 5 niveis, Missao 0 e permite selecionar nivel', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /IT Flight Simulator/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Missão 0/i })).toBeInTheDocument()
    expect(screen.getByText(/Triagem e Defesa contra Engenharia Social/i)).toBeInTheDocument()
    expect(screen.getByText(/Pasta de Rede Inacessível/i)).toBeInTheDocument()
    expect(screen.getByText(/Incidente Massivo e Problema ITIL/i)).toBeInTheDocument()

    const nivel1 = screen.getByRole('radio', { name: /Triagem e Defesa contra Engenharia Social/i })
    fireEvent.click(nivel1)
    expect(nivel1.className).toContain('selected')
    expect(nivel1).toHaveAttribute('aria-checked', 'true')
  })

  it('carrega resumo de carreira a partir do localStorage e exibe integridade SHA-256', async () => {
    window.localStorage.setItem('itfs_jornada_sessoes', JSON.stringify(['sessao-1', 'sessao-expirada']))
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          apelido: null,
          cargoAtual: 'Analista Jr (N1)',
          xpTotal: 150,
          promocoes: { nivel1Concluido: true, nivel2Concluido: false, nivel3Concluido: false, nivel4Concluido: true, nivel4bConcluido: false },
          competencias: ['Triagem e Seguranca'],
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
    const painelCarreira = await screen.findByRole('region', {
      name: /Progressão de Carreira e Currículo Vivo/i,
    })
    expect(within(painelCarreira).getByText(/Analista Jr \(N1\)/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/150 XP/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText('N4 OK')).toBeInTheDocument()
    expect(within(painelCarreira).getByText('N4b Pendente')).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/1 sessao\(oes\) marcada\(s\) como nao confirmada/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/deadbeef1234/i)).toBeInTheDocument()
    expect(
      within(painelCarreira).getByRole('button', { name: /Exportar Curr[ií]culo Vivo \(JSON\)/i }),
    ).toBeInTheDocument()
  })

  it('navega pelas abas Aulas, Caderno e Mentor IA do Prototipo v3 sem violacoes axe-core', async () => {
    const { container } = render(<App />)
    const navPrincipal = screen.getByRole('navigation', { name: /Navegação principal/i })

    fireEvent.click(within(navPrincipal).getByRole('button', { name: /📖 Aulas/i }))
    expect(screen.getByRole('heading', { name: /Rede, IP e DNS/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(within(navPrincipal).getByRole('button', { name: /📓 Caderno/i }))
    expect(screen.getByRole('heading', { name: /Caderno de estudos/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])

    fireEvent.click(within(navPrincipal).getByRole('button', { name: /🤖 Mentor IA/i }))
    expect(screen.getByRole('heading', { name: /Mentor IA/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
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

  it('badges e apelido podem mudar sem alterar a verificacao JCS/SHA-256', async () => {
    const vetor = vetoresJcs.find((v) => v.nome === 'curriculo_nucleo_v1')!
    const exportado = {
      ...vetor.entrada,
      promocoes: { nivel4Concluido: true, nivel4bConcluido: false },
      apelido: 'Codex',
      integridade: { hash: vetor.sha256, algoritmo: 'SHA-256/JCS-RFC8785' },
    }
    expect((await verificarCurriculoVivoJson(JSON.stringify(exportado))).status).toBe('integro')
    exportado.promocoes.nivel4Concluido = false
    exportado.apelido = 'Outra pessoa'
    expect((await verificarCurriculoVivoJson(JSON.stringify(exportado))).status).toBe('integro')
    expect(canonicalizarJcs(vetor.entrada)).toBe(vetor.jcs)
    expect(await sha256Hex(vetor.jcs)).toBe(vetor.sha256)
  })

  it('rejeita JSON com hash SHA-256 recalculado quando a assinatura ECDSA P-256 e invalida', async () => {
    const forjado = {
      cargoAtual: 'Diretor',
      xpTotal: 9999,
      competencias: ['Seguranca'],
      sessoesConfirmadas: [],
    }
    const jcs = canonicalizarJcs({
      cargoAtual: forjado.cargoAtual,
      xpTotal: forjado.xpTotal,
      competencias: ['Seguranca'],
      sessoesConfirmadas: [],
    })
    const hashForjado = await sha256Hex(jcs)
    const payload = JSON.stringify({
      ...forjado,
      integridade: {
        hash: hashForjado,
        algoritmo: 'SHA-256/JCS-RFC8785',
        assinatura: '0'.repeat(128),
        algoritmoAssinatura: 'ECDSA-P256-SHA256',
        kid: 'itfs-hackbrasil-2026-es256-v1',
      },
    })
    const resultado = await verificarCurriculoVivoJson(payload)
    expect(resultado.status).toBe('divergente')
    expect(resultado.assinaturaVerificada).toBe(false)
  })
})
