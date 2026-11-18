import { type Locator, expect, test, type Page, type TestInfo } from '@playwright/test'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../src/jornada/armazenamento/cartaoEmbarque'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../src/jornada/armazenamento/modoDemonstracao'
import { ITENS_MENU } from '../src/jornada/catalogos/catalogoNavegacao'
import { CARTAO_DE_TESTE } from '../src/testes/armazenamentoFalso'
import { TEXTOS_WORKSTATION as T } from '../src/textos/workstation'

/**
 * Captura uma imagem por página e por largura em test-results/visual/ e confere regras de layout.
 * Cada projeto (mobile-375, tablet-768, desktop-1280, desktop-1440) executa esta spec com o
 * próprio viewport. Nome do arquivo: <projeto>__<tema>__<página>.png.
 * As capturas não validam aparência. A spec falha se a página não abrir, se houver rolagem
 * horizontal, se os itens do menu se tocarem ou tiverem menos de 44 px, se o Mais não abrir todos os
 * itens em 375 px, se o interruptor ou o atalho tiverem menos de 44 px ou ficarem sem contorno de
 * foco, se o zoom de 200 por cento (640 por 400 px) perder conteúdo ou se houver animação infinita
 * com movimento reduzido.
 */
const PASTA = 'test-results/visual'
const TEMAS = ['tactical', 'corporate'] as const
type Tema = (typeof TEMAS)[number]
const ALVO_MINIMO = 44
const LARGURA_MINIMA_DESKTOP = 768
const CARTAO = serializarCartao(CARTAO_DE_TESTE)
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-voo',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})
const NOME_CONTROLE = 'Liberar todas as escalas para demonstração'

/** Páginas da jornada que abrem só com o cartão semeado, sem servidor. */
const PAGINAS = [
  { visao: 'inicio', caminho: '/', h1: 'Início' },
  { visao: 'check-in', caminho: '/check-in', h1: 'Check-in' },
  { visao: 'check-in-rapido', caminho: '/check-in?modo=rapido', h1: 'Check-in' },
  { visao: 'plano-de-voo', caminho: '/plano-de-voo', h1: 'Plano de voo' },
  { visao: 'breve', caminho: '/breve', h1: 'Brevê' },
  { visao: 'hangar', caminho: '/hangar', h1: 'Hangar' },
  { visao: 'aulas', caminho: '/aulas', h1: 'Aulas' },
  { visao: 'treino', caminho: '/aulas/treino', h1: 'Treino de explicação' },
  { visao: 'caderno', caminho: '/caderno', h1: 'Caderno de estudos' },
  { visao: 'comandante', caminho: '/comandante', h1: 'Comandante' },
  { visao: 'nao-encontrada', caminho: '/nao-existe', h1: 'Página não encontrada' },
] as const

/** Semeia o tema e as chaves antes de cada carga, sem sobrescrever o que a aplicação gravou. */
async function preparar(page: Page, tema: Tema, chaves: Record<string, string> = { [CHAVE_CARTAO_EMBARQUE]: CARTAO }) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(
    ([valor, entradas]) => {
      window.localStorage.setItem('itfs_theme', valor as string)
      for (const [chave, texto] of Object.entries(entradas as Record<string, string>)) {
        if (!window.localStorage.getItem(chave)) window.localStorage.setItem(chave, texto)
      }
    },
    [tema, chaves] as const,
  )
}

async function abrir(page: Page, caminho: string, h1: string) {
  await page.goto(caminho)
  await expect(page.getByRole('heading', { level: 1, name: h1 }).first()).toBeVisible()
}

/**
 * Higiene de captura (ciclo 2, E1): evita artefatos que não pertencem ao produto.
 * - mouse fora da janela e foco removido, para não deixar hover, tooltip ou anel de foco na imagem;
 * - reducedMotion já é aplicado em preparar();
 * - na página longa, elementos fixos viram absolutos (sem repetição no meio da imagem), os sticky
 *   voltam ao fluxo e os tooltips ficam ocultos. A folha de estilo existe só durante a captura.
 */
const CSS_CAPTURA = `
  [data-captura-fixo] { position: absolute !important; }
  [data-captura-sticky] { position: static !important; }
  .nav-item-rotulo, .dica, [role="tooltip"] { display: none !important; }
`
async function higienizarEntrada(page: Page) {
  await page.mouse.move(-10, -10)
  await page.evaluate(() => {
    const ativo = document.activeElement
    if (ativo instanceof HTMLElement) ativo.blur()
    window.scrollTo(0, 0)
  })
}
async function neutralizarFixos(page: Page) {
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const posicao = getComputedStyle(el).position
      if (posicao === 'fixed') el.setAttribute('data-captura-fixo', '')
      else if (posicao === 'sticky') el.setAttribute('data-captura-sticky', '')
    }
  })
  return page.addStyleTag({ content: CSS_CAPTURA })
}
async function restaurarFixos(page: Page, estilo: Awaited<ReturnType<typeof neutralizarFixos>>) {
  await estilo.evaluate((no) => no.remove())
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('[data-captura-fixo], [data-captura-sticky]'))) {
      el.removeAttribute('data-captura-fixo')
      el.removeAttribute('data-captura-sticky')
    }
  })
}
const semRolagemHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

async function capturar(page: Page, testInfo: TestInfo, tema: Tema, visao: string) {
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema)
  await higienizarEntrada(page)
  const estilo = await neutralizarFixos(page)
  await page.screenshot({
    path: `${PASTA}/${testInfo.project.name}__${tema}__${visao}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await restaurarFixos(page, estilo)
  expect.soft(await semRolagemHorizontal(page), `rolagem horizontal em ${visao} (${testInfo.project.name}, ${tema})`).toBe(true)
}

/** Alcança o controle só com Tab, como o teclado faria. */
async function focarPorTeclado(page: Page, alvo: Locator) {
  await expect(alvo).toBeVisible()
  for (let tentativa = 0; tentativa < 120; tentativa += 1) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('O teclado não alcançou o controle em 120 passos')
}

async function conferirAlvoEFoco(page: Page, alvo: Locator, nome: string) {
  await expect(alvo, nome).toBeVisible()
  const caixa = await alvo.boundingBox()
  expect(caixa?.height ?? 0, `${nome}: altura`).toBeGreaterThanOrEqual(ALVO_MINIMO)
  expect(caixa?.width ?? 0, `${nome}: largura`).toBeGreaterThanOrEqual(ALVO_MINIMO)
  await focarPorTeclado(page, alvo)
  const contorno = await alvo.evaluate((el) => {
    const estilo = getComputedStyle(el)
    return { estilo: estilo.outlineStyle, largura: Number.parseFloat(estilo.outlineWidth) }
  })
  expect(contorno.estilo, `${nome}: contorno de foco`).not.toBe('none')
  expect(contorno.largura, `${nome}: largura do contorno`).toBeGreaterThanOrEqual(2)
}

/** O Replay vive na Caixa-preta, aberta pelo link da Cabine. */
async function abrirCaixaPreta(page: Page) {
  await page.getByRole('link', { name: /Juiz 360º e Replay/i }).click()
  await expect(page).toHaveURL(/\/caixa-preta\//)
}

for (const tema of TEMAS) {
  test.describe(`Capturas visuais, tema ${tema}`, () => {
    test.setTimeout(120_000)

    test('páginas da jornada: início, check-in, plano de voo, brevê, hangar, aulas, caderno e comandante', async ({ page }, testInfo) => {
      await preparar(page, tema)
      for (const pagina of PAGINAS) {
        await abrir(page, pagina.caminho, pagina.h1)
        await capturar(page, testInfo, tema, pagina.visao)
      }
    })

    test('plano de voo com o modo de demonstração ativo mostra o selo e o indicador', async ({ page }, testInfo) => {
      await preparar(page, tema, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
      await abrir(page, '/plano-de-voo', 'Plano de voo')
      await expect(page.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByText('Liberada para demonstração', { exact: true }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
      await capturar(page, testInfo, tema, 'plano-de-voo-modo-ativo')
    })

    test('cabine: ITSM, comunicador, SimuDesk, base de conhecimento, Caixa-preta e Brevê', async ({ page }, testInfo) => {
      await preparar(page, tema, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
      await page.goto('/cabine/triagem-engenharia-social?nova=1')
      await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
      await capturar(page, testInfo, tema, 'cabine-itsm')
      await page.getByRole('button', { name: /Comunicador IA/i }).click()
      await expect(page.getByRole('region', { name: 'Comunicador Corporativo' })).toBeVisible()
      await capturar(page, testInfo, tema, 'cabine-chat')
      await page.getByRole('button', { name: /SimuDesk Remoto/i }).click()
      await expect(page.getByPlaceholder(T.simudesk.placeholderId)).toBeVisible()
      await capturar(page, testInfo, tema, 'cabine-simudesk')
      await page.getByRole('button', { name: /Intranet \/ KB/i }).click()
      await expect(page.getByRole('region', { name: 'Intranet e Base de Conhecimento' })).toBeVisible()
      await capturar(page, testInfo, tema, 'cabine-kb')
      // Conclui o turno para que a Caixa-preta traga critérios atendidos e o selo do Currículo Vivo.
      await page.getByRole('button', { name: /ITSM \/ Chamados/i }).click()
      await page.getByRole('button', { name: T.itsm.assumirChamado }).click()
      await page.getByRole('button', { name: T.itsm.consultarPolitica }).click()
      await page.getByRole('button', { name: T.intranet.fecharArtigo }).click()
      await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
      await page.getByRole('button', { name: T.itsm.solicitarToken }).click()
      await page.getByLabel('Texto da nota').fill('Solicitante sem token corporativo válido; tentativa bloqueada.')
      await page.getByRole('button', { name: T.itsm.registrarNota }).click()
      await page.getByRole('button', { name: T.itsm.recusarReset }).click()
      await page.getByLabel(T.itsm.notaResolucao).fill('Solicitação recusada conforme política de segurança KB-001.')
      await page.getByRole('button', { name: T.itsm.resolverChamado }).click()
      await abrirCaixaPreta(page)
      await expect(page.getByText(T.replay.concluida, { exact: true })).toBeVisible()
      await capturar(page, testInfo, tema, 'caixa-preta')
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Brevê' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Brevê' })).toBeVisible()
      await page.getByRole('button', { name: 'Atualizar resumo' }).click()
      await capturar(page, testInfo, tema, 'breve-com-voo')
    })
  })
}

test.describe('Regras de layout e acessibilidade', () => {
  test.setTimeout(120_000)

  test('menu: itens sem interseção e com 44 px ou mais', async ({ page }) => {
    await preparar(page, 'tactical')
    await abrir(page, '/plano-de-voo', 'Plano de voo')
    const itens = page.locator('nav[aria-label="Navegação principal"] .nav-item:visible')
    // Sem voo ativo a Cabine não aparece. Abaixo de 768 px ficam os principais e o Mais; a partir dele, todos.
    const semCabine = ITENS_MENU.filter((item) => item.pagina !== 'cabine')
    const celular = (page.viewportSize()?.width ?? 0) < LARGURA_MINIMA_DESKTOP
    const esperados = celular ? semCabine.filter((item) => item.grupo === 'principal').length + 1 : semCabine.length
    await expect(itens).toHaveCount(esperados)
    const caixas = await itens.evaluateAll((nos) =>
      nos.map((no) => {
        const r = no.getBoundingClientRect()
        return { nome: (no.textContent ?? '').trim(), x: r.x, y: r.y, largura: r.width, altura: r.height }
      }),
    )
    for (const caixa of caixas) {
      expect(caixa.altura, `${caixa.nome}: altura`).toBeGreaterThanOrEqual(ALVO_MINIMO)
      expect(caixa.largura, `${caixa.nome}: largura`).toBeGreaterThanOrEqual(ALVO_MINIMO)
    }
    const tolerancia = 0.5
    for (let i = 0; i < caixas.length; i += 1) {
      for (let j = i + 1; j < caixas.length; j += 1) {
        const a = caixas[i]
        const b = caixas[j]
        const seTocam =
          a.x + tolerancia < b.x + b.largura &&
          b.x + tolerancia < a.x + a.largura &&
          a.y + tolerancia < b.y + b.altura &&
          b.y + tolerancia < a.y + a.altura
        expect(seTocam, `${a.nome} e ${b.nome} se sobrepõem`).toBe(false)
      }
    }
  })

  test('menu Mais em 375 px: todos os itens ao alcance e Escape devolve o foco', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-375', 'Só no celular de 375 px')
    await preparar(page, 'tactical')
    await abrir(page, '/plano-de-voo', 'Plano de voo')
    const menu = page.getByRole('navigation', { name: 'Navegação principal' })
    const botaoMais = menu.getByRole('button', { name: 'Mais' })
    await expect(botaoMais).toHaveAttribute('aria-expanded', 'false')
    // Sem voo ativo a Cabine não aparece: os demais itens do catálogo ficam na barra ou no Mais.
    const itens = ITENS_MENU.filter((item) => item.pagina !== 'cabine')
    for (const item of itens.filter((i) => i.grupo === 'principal')) {
      await expect(menu.getByRole('link', { name: item.rotulo })).toBeVisible()
    }
    await botaoMais.click()
    await expect(botaoMais).toHaveAttribute('aria-expanded', 'true')
    for (const item of itens.filter((i) => i.grupo === 'mais')) {
      const link = menu.getByRole('link', { name: item.rotulo })
      await expect(link).toBeVisible()
      const caixa = await link.boundingBox()
      expect(caixa?.height ?? 0, `${item.rotulo}: altura`).toBeGreaterThanOrEqual(ALVO_MINIMO)
      expect((caixa?.x ?? -1) + (caixa?.width ?? 0), `${item.rotulo}: cabe na largura`).toBeLessThanOrEqual(375)
    }
    await page.keyboard.press('Escape')
    await expect(botaoMais).toHaveAttribute('aria-expanded', 'false')
    await expect(botaoMais).toBeFocused()
  })

  test('interruptor do modo e atalho Experimentar: 44 px e contorno de foco visível', async ({ page }) => {
    await preparar(page, 'corporate')
    await abrir(page, '/plano-de-voo', 'Plano de voo')
    await conferirAlvoEFoco(page, page.getByRole('switch', { name: NOME_CONTROLE }), 'interruptor do modo')
    await abrir(page, '/', 'Início')
    await conferirAlvoEFoco(page, page.getByRole('button', { name: 'Experimentar um voo agora' }), 'atalho Experimentar')
  })

  test('zoom de 200 por cento (viewport 640 por 400 px): sem rolagem horizontal e sem perda de função', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1280', 'Zoom aproximado só no desktop-1280')
    await preparar(page, 'corporate', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await page.setViewportSize({ width: 640, height: 400 })
    for (const pagina of PAGINAS) {
      await abrir(page, pagina.caminho, pagina.h1)
      expect(await semRolagemHorizontal(page), `rolagem horizontal em ${pagina.visao} a 640 px`).toBe(true)
    }
    await abrir(page, '/plano-de-voo', 'Plano de voo')
    const controle = page.getByRole('switch', { name: NOME_CONTROLE })
    await controle.scrollIntoViewIfNeeded()
    await expect(controle).toBeVisible()
    await controle.click()
    await expect(controle).toHaveAttribute('aria-checked', 'false')
    const menu = page.getByRole('navigation', { name: 'Navegação principal' })
    await menu.getByRole('button', { name: 'Mais' }).click()
    await expect(menu.getByRole('link', { name: 'Comandante' })).toBeVisible()
    await page.keyboard.press('Escape')
    await capturar(page, testInfo, 'corporate', 'zoom-200-plano-de-voo')
  })

  test('movimento reduzido: nenhuma animação infinita nas páginas da jornada', async ({ page }) => {
    await preparar(page, 'tactical', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    for (const pagina of PAGINAS) {
      await abrir(page, pagina.caminho, pagina.h1)
      const infinitas = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((animacao) => animacao.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY)
          .map((animacao) => animacao.id || animacao.constructor.name),
      )
      expect(infinitas, `animação infinita em ${pagina.visao}`).toEqual([])
    }
  })
})
