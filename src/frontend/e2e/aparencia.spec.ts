import { type Browser, type Page, type Request, expect, test } from '@playwright/test'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../src/jornada/armazenamento/cartaoPerfil'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../src/jornada/armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../src/jornada/armazenamento/registrosMissao'
import { CARTAO_DE_TESTE, registroDeTeste } from '../src/testes/armazenamentoFalso'
import { TEXTOS_WORKSTATION as T } from '../src/textos/workstation'
import { blocosDeToken } from '../src/tema/blocosTokens'
import { CATALOGO_TEMAS, type IdTema } from '../src/tema/catalogo'
import { CHAVE_CONTRASTE, CHAVE_TEMA } from '../src/tema/persistencia'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Aparência (temas e alto contraste), no projeto chromium: aplicação antes da primeira pintura, configuração do
 * cliente, teclado, tempo de troca, área de toque e foco, janelas estreitas, sessão preservada, requisições
 * sem aparência, esquema de cor, fonte monoespaçada, movimento reduzido e fonte bloqueada.
 * Cada caso que precisa de um tema próprio abre um contexto novo: scripts de inicialização se acumulam numa
 * mesma página e o último valeria para todos.
 */
const TEMAS = CATALOGO_TEMAS
const CARTAO = serializarCartao(CARTAO_DE_TESTE)
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-carreira',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})
const REGISTRO_DA_HELP_DESK = serializarRegistros([registroDeTeste('reset-senha-desbloqueio', 'sessao-ajuda-e2e')])
const ORIGEM = 'http://127.0.0.1:5173'
const ALVO_MINIMO = 44
const LIMITE_TROCA_MS = 100
const CSS = readFileSync(fileURLToPath(new URL('../src/index.css', import.meta.url)), 'utf8')
const BLOCOS = blocosDeToken(CSS)

type Contraste = 'padrao' | 'alto'
interface ConfiguracaoDeTeste {
  temasPermitidos?: string[]
  temaPadrao?: string
  travado?: boolean
}
interface OpcoesDePagina {
  tema?: IdTema
  contraste?: Contraste
  configuracao?: ConfiguracaoDeTeste
  chaves?: Record<string, string>
  largura?: number
  altura?: number
  reducedMotion?: 'reduce' | 'no-preference'
  /** Registra mutações de data-theme e data-contraste com performance.now(). */
  observar?: boolean
}

const CHAVES_DA_JORNADA = { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO, [CHAVE_REGISTROS_MISSAO]: REGISTRO_DA_HELP_DESK }

function blocoDeConfiguracao(configuracao: ConfiguracaoDeTeste): string {
  const envelope = { versao: 1, configuracao, camposIgnorados: [], erro: null }
  return `<script type="application/json" id="itfs-config-cliente">${JSON.stringify(envelope)}</script>`
}

/** Contexto e página novos, com tema, contraste, chaves e (opcional) configuração do cliente injetada no HTML. */
async function novaPagina(browser: Browser, opcoes: OpcoesDePagina = {}): Promise<Page> {
  const contexto = await browser.newContext({
    viewport: { width: opcoes.largura ?? 1280, height: opcoes.altura ?? 900 },
    reducedMotion: opcoes.reducedMotion ?? 'no-preference',
  })
  const page = await contexto.newPage()
  await page.addInitScript(
    ([chaveTema, tema, chaveContraste, contraste, entradas, observar]) => {
      if (tema) window.localStorage.setItem(chaveTema as string, tema as string)
      if (contraste === 'alto') window.localStorage.setItem(chaveContraste as string, 'alto')
      for (const [chave, texto] of Object.entries(entradas as Record<string, string>)) {
        if (!window.localStorage.getItem(chave)) window.localStorage.setItem(chave, texto)
      }
      if (observar) {
        const registro: { atributo: string; valor: string | null; t: number }[] = []
        ;(window as unknown as { __aparencia: typeof registro }).__aparencia = registro
        new MutationObserver((lista) => {
          for (const mutacao of lista) {
            const atributo = mutacao.attributeName ?? ''
            registro.push({ atributo, valor: (mutacao.target as Element).getAttribute(atributo), t: performance.now() })
          }
        }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme', 'data-contraste'] })
      }
    },
    [CHAVE_TEMA, opcoes.tema ?? 'operacao', CHAVE_CONTRASTE, opcoes.contraste ?? 'padrao', opcoes.chaves ?? { [CHAVE_CARTAO_PERFIL]: CARTAO }, opcoes.observar ?? false] as const,
  )
  if (opcoes.configuracao) {
    const bloco = blocoDeConfiguracao(opcoes.configuracao)
    await page.route(
      (url) => url.origin === ORIGEM && !url.pathname.startsWith('/assets') && !url.pathname.startsWith('/api'),
      async (rota) => {
        if (!rota.request().isNavigationRequest()) return rota.continue()
        const resposta = await rota.fetch()
        const corpo = await resposta.text()
        return rota.fulfill({ response: resposta, body: corpo.replace(/<head[^>]*>/, (abertura) => abertura + bloco) })
      },
    )
  }
  return page
}

async function fechar(page: Page) {
  await page.context().close()
}

const botaoAparencia = (page: Page) => page.getByRole('button', { name: 'Aparência' })
const painel = (page: Page) => page.getByRole('region', { name: 'Aparência' })
const html = (page: Page) => page.locator('html')

async function abrirPainel(page: Page) {
  await botaoAparencia(page).click()
  await expect(painel(page)).toBeVisible()
}

async function abrirInicio(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Início' }).first()).toBeVisible()
}

/** Alcança o controle só com Tab, como o teclado faria. */
async function focarPorTeclado(page: Page, alvo: ReturnType<Page['locator']>) {
  await expect(alvo).toBeVisible()
  for (let tentativa = 0; tentativa < 120; tentativa += 1) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('O teclado não alcançou o controle em 120 passos')
}

/** #000 e #000000 são a mesma cor: compara por rgb. */
function hexParaRgb(valor: string): string {
  let hex = valor.trim().replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const n = Number.parseInt(hex.slice(0, 6), 16)
  return `rgb(${(n >> 16) % 256}, ${(n >> 8) % 256}, ${n % 256})`
}

const esquemaDoTema = (id: IdTema) => CATALOGO_TEMAS.find((tema) => tema.id === id)!.esquema

test.describe('Aparência', () => {
  test.setTimeout(180_000)

  for (const contraste of ['padrao', 'alto'] as const) {
    for (const tema of TEMAS) {
      test(`${tema.id}, contraste ${contraste}: tema aplicado antes da primeira pintura`, async ({ browser }) => {
        const page = await novaPagina(browser, { tema: tema.id, contraste, observar: true })
        try {
          await abrirInicio(page)
          await page.waitForFunction(
            () => performance.getEntriesByName('first-paint').length > 0 || performance.getEntriesByName('first-contentful-paint').length > 0,
          )
          const resultado = await page.evaluate(() => {
            const pintura = performance.getEntriesByName('first-paint')[0] ?? performance.getEntriesByName('first-contentful-paint')[0]
            const registro = (window as unknown as { __aparencia: { atributo: string; valor: string | null; t: number }[] }).__aparencia
            return {
              pintura: pintura.startTime,
              depois: registro.filter((r) => r.t > pintura.startTime),
              tema: document.documentElement.dataset.theme,
              contraste: document.documentElement.getAttribute('data-contraste'),
            }
          })
          expect(resultado.depois, 'mutação de aparência depois da primeira pintura').toEqual([])
          expect(resultado.tema).toBe(tema.id)
          expect(resultado.contraste).toBe(contraste === 'alto' ? 'alto' : null)
        } finally {
          await fechar(page)
        }
      })
    }
  }

  test('configuração do cliente trava o tema, avisa só de campo inválido e vale antes da pintura', async ({ browser }) => {
    const page = await novaPagina(browser, {
      tema: 'editorial',
      observar: true,
      configuracao: { temasPermitidos: ['corporativo', 'acolhedor', 'inexistente'], temaPadrao: 'corporativo', travado: true },
    })
    const avisos: string[] = []
    page.on('console', (mensagem) => {
      if (mensagem.text().startsWith('[Aparência]')) avisos.push(mensagem.text())
    })
    try {
      await abrirInicio(page)
      await expect(html(page)).toHaveAttribute('data-theme', 'corporativo')
      expect(avisos.some((aviso) => aviso.includes('inexistente')), `avisos: ${avisos.join(' | ')}`).toBe(true)
      const antesDaPintura = await page.evaluate(() => {
        const pintura = performance.getEntriesByName('first-paint')[0] ?? performance.getEntriesByName('first-contentful-paint')[0]
        const registro = (window as unknown as { __aparencia: { t: number }[] }).__aparencia
        return pintura === undefined || registro.every((r) => r.t <= pintura.startTime)
      })
      expect(antesDaPintura).toBe(true)
      await abrirPainel(page)
      await expect(painel(page).getByText('Tema: Corporativo')).toBeVisible()
      await expect(painel(page).getByText('Definido pela empresa cliente')).toBeVisible()
      await expect(painel(page).getByRole('radio')).toHaveCount(0)
      await expect(painel(page).getByRole('switch', { name: 'Alto contraste' })).toBeVisible()
    } finally {
      await fechar(page)
    }
  })

  test('configuração do cliente sem trava oferece só os temas permitidos', async ({ browser }) => {
    const page = await novaPagina(browser, { configuracao: { temasPermitidos: ['corporativo', 'acolhedor'] } })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      await expect(painel(page).getByRole('radio')).toHaveCount(2)
      await expect(painel(page).getByRole('radio', { name: /Corporativo/ })).toBeVisible()
      await expect(painel(page).getByRole('radio', { name: /Acolhedor/ })).toBeVisible()
    } finally {
      await fechar(page)
    }
  })

  test('sem configuração do cliente nenhum aviso de aparência aparece no console', async ({ browser }) => {
    const page = await novaPagina(browser)
    const avisos: string[] = []
    page.on('console', (mensagem) => {
      if (mensagem.text().includes('[Aparência]')) avisos.push(mensagem.text())
    })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      await expect(painel(page).getByRole('radio')).toHaveCount(TEMAS.length)
      expect(avisos).toEqual([])
    } finally {
      await fechar(page)
    }
  })

  test('teclado: abrir, navegar com setas em ciclo, marcar, fechar com Escape e com Tab', async ({ browser }) => {
    const page = await novaPagina(browser)
    try {
      await abrirInicio(page)
      await focarPorTeclado(page, botaoAparencia(page))
      await page.keyboard.press('Enter')
      await expect(painel(page)).toBeVisible()
      await expect(botaoAparencia(page)).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Tab')
      const ordem = TEMAS.map((tema) => tema.id)
      await expect(painel(page).getByRole('radio', { name: /Operação/ })).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(html(page)).toHaveAttribute('data-theme', ordem[1])
      await expect(painel(page).getByRole('radio', { name: /Corporativo/ })).toBeChecked()
      // Volta ao primeiro e, de novo para cima, dá a volta até o último (retorno circular).
      await page.keyboard.press('ArrowUp')
      await expect(html(page)).toHaveAttribute('data-theme', ordem[0])
      await page.keyboard.press('ArrowUp')
      await expect(html(page)).toHaveAttribute('data-theme', ordem[ordem.length - 1])
      await page.keyboard.press('ArrowDown')
      await expect(html(page)).toHaveAttribute('data-theme', ordem[0])
      // Espaço no item em foco o mantém marcado.
      await page.keyboard.press('Space')
      await expect(painel(page).getByRole('radio', { name: /Operação/ })).toBeChecked()
      expect(await page.evaluate((chave) => window.localStorage.getItem(chave), CHAVE_TEMA)).toBe(ordem[0])
      // Tab chega ao interruptor de alto contraste e Space o liga.
      await page.keyboard.press('Tab')
      const interruptor = painel(page).getByRole('switch', { name: 'Alto contraste' })
      await expect(interruptor).toBeFocused()
      await page.keyboard.press('Space')
      await expect(html(page)).toHaveAttribute('data-contraste', 'alto')
      // Escape fecha e devolve o foco ao botão.
      await page.keyboard.press('Escape')
      await expect(painel(page)).toBeHidden()
      await expect(botaoAparencia(page)).toBeFocused()
      // Tab para fora do painel o fecha.
      await page.keyboard.press('Enter')
      await expect(painel(page)).toBeVisible()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await expect(painel(page)).toBeHidden()
    } finally {
      await fechar(page)
    }
  })

  test('tempo de aplicação: 100 ms ou menos na troca de tema e na de contraste', async ({ browser }) => {
    const page = await novaPagina(browser, { observar: true })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      await page.evaluate(() => {
        const janela = window as unknown as { __clique: number }
        document.addEventListener('click', () => { janela.__clique = performance.now() }, true)
      })
      const medir = async (acao: () => Promise<void>, atributo: string) => {
        const antes = await page.evaluate(() => (window as unknown as { __aparencia: unknown[] }).__aparencia.length)
        await acao()
        await expect
          .poll(() => page.evaluate(() => (window as unknown as { __aparencia: unknown[] }).__aparencia.length))
          .toBeGreaterThan(antes)
        return page.evaluate(
          ([indice, nome]) => {
            const janela = window as unknown as { __clique: number; __aparencia: { atributo: string; t: number }[] }
            const mutacao = janela.__aparencia.slice(indice as number).find((m) => m.atributo === nome)
            return mutacao ? mutacao.t - janela.__clique : Number.POSITIVE_INFINITY
          },
          [antes, atributo] as const,
        )
      }
      for (const tema of TEMAS.slice(1)) {
        const duracao = await medir(() => painel(page).getByRole('radio', { name: new RegExp(tema.nome) }).click(), 'data-theme')
        expect(duracao, `troca para ${tema.id}`).toBeLessThanOrEqual(LIMITE_TROCA_MS)
      }
      const ligar = await medir(() => painel(page).getByRole('switch', { name: 'Alto contraste' }).click(), 'data-contraste')
      expect(ligar, 'alto contraste ligado').toBeLessThanOrEqual(LIMITE_TROCA_MS)
      const desligar = await medir(() => painel(page).getByRole('switch', { name: 'Alto contraste' }).click(), 'data-contraste')
      expect(desligar, 'alto contraste desligado').toBeLessThanOrEqual(LIMITE_TROCA_MS)
    } finally {
      await fechar(page)
    }
  })

  test('área de toque de 44 por 44 px e contorno de foco de 2 px com afastamento de 2 px', async ({ browser }) => {
    const page = await novaPagina(browser)
    try {
      await abrirInicio(page)
      const caixaBotao = await botaoAparencia(page).boundingBox()
      expect(caixaBotao?.width ?? 0, 'botão: largura').toBeGreaterThanOrEqual(ALVO_MINIMO)
      expect(caixaBotao?.height ?? 0, 'botão: altura').toBeGreaterThanOrEqual(ALVO_MINIMO)
      await abrirPainel(page)
      const alvos = [
        ...(await painel(page).locator('label.opcao-tema').all()),
        painel(page).locator('label.controle-contraste'),
      ]
      for (const alvo of alvos) {
        const caixa = await alvo.boundingBox()
        expect(caixa?.width ?? 0, 'alvo: largura').toBeGreaterThanOrEqual(ALVO_MINIMO)
        expect(caixa?.height ?? 0, 'alvo: altura').toBeGreaterThanOrEqual(ALVO_MINIMO)
      }
      // Foco por teclado (o foco por mouse não mostra o anel): recarrega e percorre botão, opção marcada e interruptor.
      await abrirInicio(page)
      const contornoDe = async (nome: string, alvo: ReturnType<Page['locator']>) => {
        await expect(alvo, nome).toBeFocused()
        const contorno = await alvo.evaluate((el) => {
          const estilo = getComputedStyle(el)
          return { estilo: estilo.outlineStyle, largura: estilo.outlineWidth, afastamento: estilo.outlineOffset }
        })
        expect(contorno.estilo, `${nome}: contorno`).not.toBe('none')
        expect(contorno.largura, `${nome}: largura do contorno`).toBe('2px')
        expect(contorno.afastamento, `${nome}: afastamento do contorno`).toBe('2px')
      }
      await focarPorTeclado(page, botaoAparencia(page))
      await contornoDe('botão', botaoAparencia(page))
      await page.keyboard.press('Enter')
      await page.keyboard.press('Tab')
      await contornoDe('opção marcada', painel(page).getByRole('radio', { name: /Operação/ }))
      await page.keyboard.press('Tab')
      await contornoDe('interruptor', painel(page).getByRole('switch'))    } finally {
      await fechar(page)
    }
  })

  test('janela de 320 px: nenhum nome ou esquema cortado', async ({ browser }) => {
    const page = await novaPagina(browser, { largura: 320, altura: 700 })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      const cortados = await painel(page).evaluate((raiz) =>
        Array.from(raiz.querySelectorAll('.opcao-tema-nome, .opcao-tema-esquema, .tema-definido-nome, legend'))
          .filter((no) => no.scrollWidth > no.clientWidth + 1)
          .map((no) => `${no.className} ${no.scrollWidth} contra ${no.clientWidth}`),
      )
      expect(cortados).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    } finally {
      await fechar(page)
    }
  })

  test('375 px: painel inteiro dentro da janela e acima da barra inferior', async ({ browser }) => {
    const page = await novaPagina(browser, { largura: 375, altura: 812 })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      const caixa = await painel(page).boundingBox()
      const barra = await page.getByRole('navigation', { name: 'Navegação principal' }).boundingBox()
      expect(caixa).not.toBeNull()
      expect(barra).not.toBeNull()
      expect(caixa!.x, 'borda esquerda').toBeGreaterThanOrEqual(0)
      expect(caixa!.x + caixa!.width, 'borda direita').toBeLessThanOrEqual(375 + 0.5)
      expect(caixa!.y + caixa!.height, 'base do painel acima da barra inferior').toBeLessThanOrEqual(barra!.y + 0.5)
      // Com o painel aberto, o último controle também fica visível sem rolar a página.
      await expect(painel(page).getByRole('switch', { name: 'Alto contraste' })).toBeInViewport()
    } finally {
      await fechar(page)
    }
  })

  test('esquema de cor nativo e tokens por tema, com e sem alto contraste', async ({ browser }) => {
    for (const contraste of ['padrao', 'alto'] as const) {
      for (const tema of TEMAS) {
        const page = await novaPagina(browser, { tema: tema.id, contraste })
        try {
          await abrirInicio(page)
          const lido = await page.evaluate(() => {
            const raiz = document.documentElement
            return {
              esquema: getComputedStyle(raiz).colorScheme,
              canvas: getComputedStyle(raiz).getPropertyValue('--bg-canvas').trim(),
              classeEscura: raiz.classList.contains('dark'),
            }
          })
          const nativo = esquemaDoTema(tema.id) === 'escuro' ? 'dark' : 'light'
          expect(lido.esquema, `${tema.id}/${contraste}: color-scheme`).toBe(nativo)
          expect(lido.classeEscura, `${tema.id}/${contraste}: classe dark`).toBe(nativo === 'dark')
          const esperado =
            contraste === 'alto'
              ? BLOCOS.get(nativo === 'dark' ? 'alto-contraste-escuro' : 'alto-contraste-claro')?.['--bg-canvas']
              : BLOCOS.get(tema.id)?.['--bg-canvas']
          expect(esperado, `${tema.id}/${contraste}: bloco de token lido de index.css`).toBeDefined()
          expect(hexParaRgb(lido.canvas), `${tema.id}/${contraste}: --bg-canvas`).toBe(hexParaRgb(esperado!))
        } finally {
          await fechar(page)
        }
      }
    }
  })

  test('movimento reduzido: troca sem transição', async ({ browser }) => {
    const page = await novaPagina(browser, { reducedMotion: 'reduce' })
    try {
      await abrirInicio(page)
      await abrirPainel(page)
      await painel(page).getByRole('radio', { name: /Corporativo/ }).click()
      await expect(html(page)).toHaveAttribute('data-theme', 'corporativo')
      const duracoes = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button'))
          .filter((botao) => botao.getBoundingClientRect().width > 0)
          .map((botao) => getComputedStyle(botao).transitionDuration),
      )
      expect(duracoes.length).toBeGreaterThan(0)
      for (const duracao of duracoes) expect(duracao).toBe('0s')
    } finally {
      await fechar(page)
    }
  })

  test('fonte bloqueada: tema aplicado, texto visível, sem mensagem ao aluno e sem fonte de outra origem', async ({ browser }) => {
    const page = await novaPagina(browser, { tema: 'editorial' })
    const externas: string[] = []
    page.on('request', (requisicao: Request) => {
      if (requisicao.resourceType() === 'font' && !requisicao.url().startsWith(ORIGEM)) externas.push(requisicao.url())
    })
    await page.route('**/*.woff2', (rota) => rota.abort())
    try {
      await abrirInicio(page)
      await expect(html(page)).toHaveAttribute('data-theme', 'editorial')
      await expect(page.getByRole('heading', { level: 1, name: 'Início' }).first()).toBeVisible()
      await expect(page.getByText(/fonte|font/i)).toHaveCount(0)
      expect(externas).toEqual([])
    } finally {
      await fechar(page)
    }
  })
})

/** Conduz a Mesa de Trabalho da Service Desk N1 Jr até o SimuDesk conectado, com um comando já executado. */
async function abrirSimuDeskConectado(page: Page) {
  await page.goto('/mesa-de-trabalho/pasta-rede-inacessivel?semente=2&causa=C3&nova=1')
  await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
  await page.getByRole('button', { name: T.itsm.assumirChamado }).click()
  await page.getByRole('button', { name: T.itsm.salvarClassificacao }).click()
  await page.getByRole('button', { name: /Comunicador IA/i }).click()
  await page.getByLabel(/Matr[ií]cula/i).fill('AUR-1042')
  await page.getByLabel(/Ramal/i).fill('2042')
  await page.getByRole('button', { name: /Validar Identidade/i }).click()
  await expect(page.getByText(T.chat.identidadeVerificada)).toBeVisible()
}

/** Troca o tema e o contraste pelo painel, sem recarregar a página. */
async function trocarAparencia(page: Page, nomeTema: RegExp, esperado: IdTema, alto: boolean) {
  await abrirPainel(page)
  await painel(page).getByRole('radio', { name: nomeTema }).click()
  const interruptor = painel(page).getByRole('switch', { name: 'Alto contraste' })
  if ((await interruptor.isChecked()) !== alto) await interruptor.click()
  await expect(html(page)).toHaveAttribute('data-theme', esperado)
  await page.keyboard.press('Escape')
  await expect(painel(page)).toBeHidden()
}

test.describe('Aparência com sessão em andamento', () => {
  test.setTimeout(240_000)

  test('trocar tema e contraste preserva rota, texto digitado, saída do terminal e cores do terminal, sem chamar a API', async ({ browser }) => {
    const page = await novaPagina(browser, { chaves: CHAVES_DA_JORNADA })
    try {
      await abrirSimuDeskConectado(page)
      // Rascunho na nota do ITSM, antes de ir ao terminal.
      await page.getByRole('button', { name: /ITSM \/ Chamados/i }).click()
      const nota = page.getByLabel(T.itsm.notaResolucao)
      await nota.fill('Rascunho da resolução, não enviado.')
      const caminho = new URL(page.url()).pathname
      const chamadasApi: string[] = []
      page.on('request', (requisicao) => {
        if (new URL(requisicao.url()).pathname.startsWith('/api')) chamadasApi.push(`${requisicao.method()} ${requisicao.url()}`)
      })
      // Fase 1: o rascunho do ITSM resiste às trocas (a nota fica na tela durante elas).
      for (const [indice, tema] of TEMAS.entries()) {
        await trocarAparencia(page, new RegExp(tema.nome), tema.id, indice % 2 === 1)
        expect(new URL(page.url()).pathname, `rota em ${tema.id}`).toBe(caminho)
        await expect(nota, `nota do ITSM em ${tema.id}`).toHaveValue('Rascunho da resolução, não enviado.')
      }
      await trocarAparencia(page, /Operação/, 'operacao', false)
      await page.getByRole('button', { name: /SimuDesk Remoto/i }).click()
      await page.getByRole('button', { name: T.simudesk.preencherConectar }).click()
      await page.getByLabel('Comando do terminal').fill('net start')
      await page.getByRole('button', { name: 'Executar' }).click()
      await expect(page.getByText(/Workstation.*Stopped/i)).toBeVisible()
      await page.getByLabel('Comando do terminal').fill('whoami /groups')
      const saida = await page.locator('.terminal-output').innerText()
      const coresDoTerminal = () =>
        page.evaluate(() => {
          const casca = getComputedStyle(document.querySelector('.terminal-shell')!)
          return { fundo: casca.backgroundColor, texto: casca.color }
        })
      /** O terminal é sempre escuro: no contraste padrão usa o bloco operacao e, no alto contraste, o conjunto escuro. */
      const coresEsperadas = (alto: boolean) => {
        const tokens = BLOCOS.get(alto ? 'alto-contraste-escuro' : 'operacao')
        return { fundo: hexParaRgb(tokens!['--bg-canvas']), texto: hexParaRgb(tokens!['--text-primary']) }
      }
      expect(await coresDoTerminal(), 'cores iniciais do terminal').toEqual(coresEsperadas(false))
      // Fase 2: terminal. Só as chamadas feitas durante as trocas contam (o comando acima chamou a API).
      expect(chamadasApi.every((chamada) => chamada.includes('/acoes') || chamada.includes('/chat')), `chamadas antes das trocas: ${chamadasApi.join(' | ')}`).toBe(true)
      chamadasApi.length = 0
      for (const [indice, tema] of TEMAS.entries()) {
        await trocarAparencia(page, new RegExp(tema.nome), tema.id, indice % 2 === 1)
        expect(new URL(page.url()).pathname, `rota em ${tema.id}`).toBe(caminho)
        expect(await page.locator('.terminal-output').innerText(), `saída do terminal em ${tema.id}`).toBe(saida)
        await expect(page.getByLabel('Comando do terminal')).toHaveValue('whoami /groups')
        expect(await coresDoTerminal(), `cores do terminal em ${tema.id}`).toEqual(coresEsperadas(indice % 2 === 1))
      }
      expect(chamadasApi, 'chamadas à API durante as trocas de aparência').toEqual([])
    } finally {
      await fechar(page)
    }
  })

  test('requisições e replay iguais em todos os temas, sem identificador de aparência', async ({ browser }) => {
    const rodadas: { tema: string; requisicoes: string[]; replay: string }[] = []
    const rodadasDeAparencia: { tema: IdTema; contraste: Contraste }[] = [
      ...TEMAS.map((tema) => ({ tema: tema.id, contraste: 'padrao' as const })),
      { tema: 'operacao', contraste: 'alto' },
    ]
    const normalizar = (texto: string) =>
      texto
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, ':data')
        .replace(/\d{10,}/g, ':numero')
    for (const { tema, contraste } of rodadasDeAparencia) {
      const page = await novaPagina(browser, { tema, contraste, chaves: CHAVES_DA_JORNADA })
      const requisicoes: string[] = []
      const brutas: string[] = []
      let sessaoId = ''
      page.on('request', (requisicao) => {
        const url = new URL(requisicao.url())
        if (!url.pathname.startsWith('/api')) return
        const corpo = requisicao.postData() ?? ''
        brutas.push(`${requisicao.url()} ${corpo} ${JSON.stringify(requisicao.headers())}`)
        requisicoes.push(normalizar(`${requisicao.method()} ${url.pathname}${url.search} ${corpo}`))
      })
      page.on('response', async (resposta) => {
        if (resposta.request().method() === 'POST' && new URL(resposta.url()).pathname === '/api/sessoes') {
          sessaoId = ((await resposta.json()) as { sessaoId: string }).sessaoId
        }
      })
      try {
        await page.goto('/mesa-de-trabalho/triagem-engenharia-social?semente=7&nova=1')
        await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
        await page.getByRole('button', { name: T.itsm.assumirChamado }).click()
        await page.getByRole('button', { name: T.itsm.consultarPolitica }).click()
        await page.getByRole('button', { name: T.intranet.fecharArtigo }).click()
        await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
        await page.getByRole('button', { name: T.itsm.solicitarToken }).click()
        await page.getByLabel('Texto da nota').fill('Solicitante sem token corporativo válido; tentativa bloqueada.')
        await page.getByRole('button', { name: T.itsm.registrarNota }).click()
        await expect.poll(() => sessaoId).not.toBe('')
        const resposta = await page.request.get(`/api/sessoes/${sessaoId}/replay`)
        expect(resposta.ok()).toBe(true)
        const replay = (await resposta.json()) as {
          eventos: { tipo: string }[]
          avaliacao: { criterios: { id: string; atendido: boolean }[] }
        }
        const resumo = JSON.stringify({
          tipos: replay.eventos.map((evento) => evento.tipo),
          criterios: replay.avaliacao.criterios.map((criterio) => [criterio.id, criterio.atendido]),
        })
        // Nome de chave e prefixo nunca aparecem. Identificadores de tema só contam como valor exato: o texto
        // livre do aluno pode conter palavras comuns como "corporativo".
        const idsDeTema = TEMAS.map((t) => t.id)
        for (const requisicao of brutas) {
          const minusculo = requisicao.toLowerCase()
          for (const proibido of ['itfs_', 'data-contraste', 'data-theme']) {
            expect(minusculo, `requisição com "${proibido}" em ${tema}/${contraste}`).not.toContain(proibido)
          }
          for (const id of idsDeTema) {
            expect(minusculo, `valor "${id}" em ${tema}/${contraste}`).not.toContain(`"${id}"`)
          }
          expect(minusculo, `cabeçalho ou endereço com tema em ${tema}/${contraste}`).not.toMatch(/(tema|theme|contraste|contrast)=/)
        }
        rodadas.push({ tema: `${tema}/${contraste}`, requisicoes, replay: resumo })
      } finally {
        await fechar(page)
      }
    }
    for (const rodada of rodadas.slice(1)) {
      expect(rodada.requisicoes, `requisições de ${rodada.tema} contra ${rodadas[0].tema}`).toEqual(rodadas[0].requisicoes)
      expect(rodada.replay, `replay de ${rodada.tema} contra ${rodadas[0].tema}`).toBe(rodadas[0].replay)
    }
  })

  test('replay abre no tema atual depois da troca', async ({ browser }) => {
    const page = await novaPagina(browser, { chaves: CHAVES_DA_JORNADA })
    try {
      await page.goto('/mesa-de-trabalho/triagem-engenharia-social?nova=1')
      await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
      await page.getByRole('button', { name: T.itsm.assumirChamado }).click()
      await page.getByRole('button', { name: T.itsm.consultarPolitica }).click()
      await page.getByRole('button', { name: T.intranet.fecharArtigo }).click()
      await page.getByRole('button', { name: T.itsm.solicitarToken }).click()
      await page.getByLabel('Texto da nota').fill('Solicitante sem token corporativo válido; tentativa bloqueada.')
      await page.getByRole('button', { name: T.itsm.registrarNota }).click()
      await page.getByRole('button', { name: T.itsm.recusarReset }).click()
      await page.getByLabel(T.itsm.notaResolucao).fill('Solicitação recusada conforme política de segurança KB-001.')
      await page.getByRole('button', { name: T.itsm.resolverChamado }).click()
      await trocarAparencia(page, /Acolhedor/, 'acolhedor', false)
      await page.getByRole('link', { name: /Juiz 360º e Replay/i }).click()
      await expect(page).toHaveURL(/\/caixa-preta\//)
      await expect(page.getByText(T.replay.concluida, { exact: true })).toBeVisible()
      await expect(html(page)).toHaveAttribute('data-theme', 'acolhedor')
    } finally {
      await fechar(page)
    }
  })

  test('fonte monoespaçada no terminal, em código e em dados', async ({ browser }) => {
    const page = await novaPagina(browser, { chaves: CHAVES_DA_JORNADA })
    try {
      await abrirSimuDeskConectado(page)
      await page.getByRole('button', { name: /SimuDesk Remoto/i }).click()
      await page.getByRole('button', { name: T.simudesk.preencherConectar }).click()
      await expect(page.locator('.terminal-output')).toBeVisible()
      const familias = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.terminal-output, code, .dado-mono')).map((no) => ({
          seletor: no.tagName.toLowerCase() + (no.className ? '.' + String(no.className).split(' ')[0] : ''),
          familia: getComputedStyle(no).fontFamily,
        })),
      )
      expect(familias.length).toBeGreaterThan(0)
      for (const item of familias) {
        expect(item.familia.replaceAll('"', '').startsWith('JetBrains Mono'), `${item.seletor}: ${item.familia}`).toBe(true)
      }
    } finally {
      await fechar(page)
    }
  })
})
