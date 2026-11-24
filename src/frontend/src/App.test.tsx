import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import vetoresJcs from '../../../docs/vetores-jcs-sha256.json'
import { App } from './App'
import { IntranetApp } from './apps/IntranetApp/IntranetApp'
import { obterArmazemAparencia } from './tema/armazemAparencia'
import { CATALOGO_TEMAS } from './tema/catalogo'
import { textosDaMissao } from './jornada/componentes/textosDaMissao'
import { abrirAplicacao, irPeloMenu, limparNavegador, menuPrincipal } from './testes/abrirAplicacao'
import { Icone } from './ui/Icone'
import { canonicalizarJcs, sha256Hex, verificarCurriculoVivoJson } from './utils/jcs'
import { razaoContraste } from './utils/contraste'

afterEach(() => {
  cleanup()
  limparNavegador()
  vi.restoreAllMocks()
})

describe('IT Career Simulator UI', () => {
  it('calcula a razao de contraste WCAG; os pares dos tokens ficam em tokensContraste.test.ts', () => {
    expect(razaoContraste('#000000', '#ffffff')).toBeCloseTo(21, 4)
    expect(razaoContraste('#777777', '#777777')).toBeCloseTo(1, 4)
  })

  it('shell tem uma unica navegacao principal por links, sem Mesa de Trabalho sem missão ativo, e troca o tema pelo botao Aparencia', () => {
    abrirAplicacao('/')
    const navs = screen.getAllByRole('navigation', { name: /Navegação principal/i })
    expect(navs).toHaveLength(1)
    const destinos = within(navs[0]).getAllByRole('link').map((link) => link.textContent?.trim())
    expect(destinos).toEqual(['Início', 'Plano de Carreira', 'Portfólio', 'Catálogo', 'Aulas', 'Caderno', 'Mentor'])
    expect(within(navs[0]).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(navs[0].textContent).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(document.documentElement.dataset.theme).toBe('operacao')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.queryByRole('group', { name: 'Tema da interface' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    const grupoTema = screen.getByRole('group', { name: 'Tema' })
    const corporativo = within(grupoTema).getByRole('radio', { name: /Corporativo/ })
    fireEvent.click(corporativo)
    expect(corporativo).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('corporativo')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('itfs_tema')).toBe('corporativo')
    fireEvent.click(within(grupoTema).getByRole('radio', { name: /Operação/ }))
    expect(document.documentElement.dataset.theme).toBe('operacao')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('a estrutura da pagina e igual em todos os temas e navegar nao muda os atributos do html', () => {
    const { container } = abrirAplicacao('/')
    const armazem = obterArmazemAparencia()
    const estruturas = CATALOGO_TEMAS.map((tema) => {
      act(() => {
        armazem.escolherTema(tema.id)
      })
      return container.querySelector('#root, .app-shell')?.parentElement?.innerHTML ?? container.innerHTML
    })
    expect(new Set(estruturas).size).toBe(1)
    act(() => {
      armazem.escolherTema('editorial')
      armazem.definirContraste(true)
    })
    const antes = document.documentElement.outerHTML.slice(0, document.documentElement.outerHTML.indexOf('>') + 1)
    irPeloMenu('Plano de Carreira')
    irPeloMenu('Início')
    const depois = document.documentElement.outerHTML.slice(0, document.documentElement.outerHTML.indexOf('>') + 1)
    expect(depois).toBe(antes)
    expect(depois).toContain('data-theme="editorial"')
    expect(depois).toContain('data-contraste="alto"')
    act(() => {
      armazem.definirContraste(false)
      armazem.escolherTema('operacao')
    })
  })

  it('a pagina tem um unico main e o link de salto aponta para ele', () => {
    const { container } = abrirAplicacao('/plano-de-voo')
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo-pagina')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-pagina')
    expect(within(screen.getByRole('main')).getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('menu de perfil abre o progresso, fecha com Escape e devolve o foco', async () => {
    const { container } = render(<App />)
    const botaoPerfil = screen.getByRole('button', { name: /Perfil/i })
    expect(botaoPerfil).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(botaoPerfil)
    const painel = screen.getByRole('region', { name: 'Seu progresso' })
    expect(within(painel).getByLabelText(/Nível em foco/i)).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Seu progresso' })).not.toBeInTheDocument()
    expect(botaoPerfil).toHaveFocus()
  })

  it('Icone e decorativo por padrao e vira imagem nomeada com rotulo', () => {
    render(
      <>
        <Icone nome="aulas" data-testid="decorativo" />
        <Icone nome="credencial" rotulo="Credencial verificada" />
      </>,
    )
    expect(screen.getByTestId('decorativo')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: 'Credencial verificada' })).toBeInTheDocument()
  })

  it('Intranet troca o artigo selecionado e move o foco para o novo titulo', async () => {
    const { rerender } = render(<IntranetApp key="KB-001" artigoSelecionadoId="KB-001" />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /KB-001.*Politica de Verificacao/i })).toHaveFocus())
    rerender(<IntranetApp key="KB-002" artigoSelecionadoId="KB-002" />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /KB-002.*Verificacao de Identidade/i })).toHaveFocus())
  })

  it('Plano de Carreira mostra as etapas, a Missao 0 e as missoes, sem escolha livre de nivel', () => {
    abrirAplicacao('/plano-de-voo')
    expect(screen.getByRole('heading', { level: 1, name: 'Plano de Carreira' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Missão 0/i })).toBeInTheDocument()
    for (const missao of ['triagem-engenharia-social', 'pasta-rede-inacessivel', 'incidente-massivo'] as const) {
      expect(screen.getByRole('heading', { name: textosDaMissao(missao).titulo })).toBeInTheDocument()
    }
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Iniciar no Simulador/i })).not.toBeInTheDocument()
  })

  it('Plano de Carreira tem o Primeiro Missão como objeto central e guarda Pomodoro, meta e plano no menu de perfil', async () => {
    const { container } = abrirAplicacao('/plano-de-voo')
    expect(screen.getByRole('heading', { name: 'Iniciar primeiro missão', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar primeiro missão' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Estudar antes' })).toBeInTheDocument()
    const fluxo = screen.getByRole('list', { name: 'Fluxo do primeiro missão' })
    expect(within(fluxo).getAllByRole('listitem').map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Estudar',
      'Praticar no Split-Screen',
      'Revisar na Caixa-Preta',
    ])
    expect(screen.queryByText(/Timer de foco/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Meta semanal/i)).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
    fireEvent.click(screen.getByRole('button', { name: /Perfil/i }))
    const painel = screen.getByRole('region', { name: 'Seu progresso' })
    expect(within(painel).getByText('Meta semanal')).toBeInTheDocument()
    expect(within(painel).getByRole('timer', { name: /Tempo restante do foco/i })).toHaveTextContent('25:00')
    expect(within(painel).getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
    expect(within(painel).getByText('Plano de estudos')).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
  })

  it('Portfólio abre pelo menu, mostra o verificador e volta ao Início', () => {
    abrirAplicacao('/')
    irPeloMenu('Portfólio')
    expect(window.location.pathname).toBe('/breve')
    expect(within(menuPrincipal()).getByRole('link', { name: 'Portfólio' })).toHaveAttribute('aria-current', 'page')
    expect(within(menuPrincipal()).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('region', { name: /Verificador local de Currículo Vivo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Início' })).not.toBeInTheDocument()
    irPeloMenu('Início')
    expect(window.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
  })

  it('carrega resumo de carreira a partir do localStorage e exibe integridade SHA-256', async () => {
    window.localStorage.setItem('itfs_jornada_sessoes', JSON.stringify(['sessao-1', 'sessao-expirada']))
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          apelido: null,
          cargoAtual: 'N3 Sênior',
          xpTotal: 150,
          promocoes: { helpDeskN1Concluido: true, serviceDeskN1JrConcluido: false, n2PlenoConcluido: false, n3ARedesNuvemConcluido: true, n3BDataCenterBackupConcluido: false, n3CTriagemConcluido: false, n3CSqlConcluido: false },
          competencias: ['Triagem e Seguranca'],
          sessoesConfirmadas: [
            {
              sessaoId: 'sessao-1',
              cenarioId: 'reset-senha-desbloqueio',
              nivel: 'Help Desk N1',
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
    abrirAplicacao('/')
    irPeloMenu('Portfólio')
    expect(screen.getByRole('heading', { name: 'Credencial', level: 2 })).toBeInTheDocument()
    const painelCarreira = await screen.findByRole('region', {
      name: /Progressão de Carreira e Currículo Vivo/i,
    })
    expect(within(painelCarreira).getByText(/N3 Sênior/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/150 XP/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText('Incidente Cloud e Kubernetes (Simulador) OK')).toBeInTheDocument()
    expect(within(painelCarreira).getByText('Auditoria SQL Somente Leitura Pendente')).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/1 sessão\(ões\) marcada\(s\) como não confirmada/i)).toBeInTheDocument()
    expect(within(painelCarreira).getByText(/deadbeef1234/i)).toBeInTheDocument()
    expect(
      within(painelCarreira).getByRole('button', { name: /Exportar Curr[ií]culo Vivo \(JSON\)/i }),
    ).toBeInTheDocument()
  })

  it('navega pelos destinos Aulas, Caderno e Treino sem violacoes axe-core', async () => {
    const { container } = abrirAplicacao('/')
    irPeloMenu('Aulas')
    expect(within(menuPrincipal()).getByRole('link', { name: 'Aulas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Aulas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /O que faz o Suporte de TI/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
    irPeloMenu('Caderno')
    expect(screen.getByRole('heading', { name: /Caderno de estudos/i })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
    irPeloMenu('Aulas')
    fireEvent.click(screen.getByRole('link', { name: 'Treino de explicação' }))
    expect(window.location.pathname).toBe('/aulas/treino')
    expect(screen.getByRole('heading', { level: 1, name: 'Treino de explicação' })).toBeInTheDocument()
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

    const r2 = await verificarCurriculoVivoJson(integroJson.replace('"xpTotal":90', '"xpTotal":999'))
    expect(r2.status).toBe('divergente')

    const r3 = await verificarCurriculoVivoJson('{json-invalido')
    expect(r3.status).toBe('nao_verificavel')
  })

  it('badges e apelido podem mudar sem alterar a verificacao JCS/SHA-256', async () => {
    const vetor = vetoresJcs.find((v) => v.nome === 'curriculo_nucleo_v1')!
    const exportado = {
      ...vetor.entrada,
      promocoes: { n3ARedesNuvemConcluido: true, n3CSqlConcluido: false },
      apelido: 'Codex',
      integridade: { hash: vetor.sha256, algoritmo: 'SHA-256/JCS-RFC8785' },
    }
    expect((await verificarCurriculoVivoJson(JSON.stringify(exportado))).status).toBe('integro')
    exportado.promocoes.n3ARedesNuvemConcluido = false
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
