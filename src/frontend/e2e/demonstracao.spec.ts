import { type Locator, type Page, type Request, expect, test } from '@playwright/test'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../src/jornada/armazenamento/cartaoEmbarque'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../src/jornada/armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_VOO } from '../src/jornada/armazenamento/registrosVoo'
import type { IdMissao } from '../src/jornada/catalogos/catalogoRotas'
import { CHECKIN_RAPIDO, ROTEIRO_CHECKIN, rotuloDaResposta } from '../src/jornada/catalogos/catalogoVocacional'
import { textosDaMissao } from '../src/jornada/componentes/textosDaMissao'
import { CARTAO_DE_TESTE } from '../src/testes/armazenamentoFalso'

const NOME_CONTROLE = 'Liberar todas as escalas para demonstração'
const CARTAO = serializarCartao(CARTAO_DE_TESTE)
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-voo',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})

interface RequisicaoApi {
  metodo: string
  url: string
  cabecalhos: Record<string, string>
  corpo: string | null
}

let requisicoes: RequisicaoApi[] = []
let errosDoConsole: string[] = []

/** Semeia chaves antes de cada carga da página, sem sobrescrever o que a aplicação gravou. */
async function semear(page: Page, chaves: Record<string, string>) {
  await page.addInitScript((entradas) => {
    for (const [chave, texto] of Object.entries(entradas)) {
      if (!window.localStorage.getItem(chave)) window.localStorage.setItem(chave, texto)
    }
  }, chaves)
}

function criacoesDeSessao(): RequisicaoApi[] {
  return requisicoes.filter((r) => r.metodo === 'POST' && new URL(r.url).pathname === '/api/sessoes')
}

const lerChave = (page: Page, chave: string) => page.evaluate((c) => window.localStorage.getItem(c), chave)

/** Alcança o controle só com Tab, como o teclado faria. */
async function focarPorTeclado(page: Page, alvo: Locator) {
  await expect(alvo).toBeVisible()
  for (let tentativa = 0; tentativa < 120; tentativa += 1) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('O teclado não alcançou o controle em 120 passos')
}

function cartaoDaMissao(page: Page, missao: IdMissao): Locator {
  return page.locator('li.cartao-missao').filter({ has: page.getByRole('heading', { name: textosDaMissao(missao).titulo }) })
}

test.beforeEach(({ page }) => {
  requisicoes = []
  errosDoConsole = []
  page.on('request', (pedido: Request) => {
    if (!new URL(pedido.url()).pathname.startsWith('/api/')) return
    requisicoes.push({
      metodo: pedido.method(),
      url: pedido.url(),
      cabecalhos: pedido.headers(),
      corpo: pedido.postData(),
    })
  })
  page.on('console', (mensagem) => {
    if (mensagem.type() !== 'error') return
    // Fonte recusada pelo servidor de desenvolvimento quando node_modules está fora da pasta (worktree): não é da página.
    if (/\.woff2?(\?|$)/.test(mensagem.location().url)) return
    errosDoConsole.push(mensagem.text())
  })
  page.on('pageerror', (erro) => errosDoConsole.push(erro.message))
})

// Isolamento: o modo nunca chega à API, em nenhum teste deste arquivo.
test.afterEach(() => {
  for (const requisicao of requisicoes) {
    const texto = JSON.stringify(requisicao).toLowerCase()
    expect(texto, `${requisicao.metodo} ${requisicao.url}`).not.toContain('demonstracao')
    expect(texto, `${requisicao.metodo} ${requisicao.url}`).not.toContain('itfs_modo')
  }
})

test.describe('Modo de demonstração', () => {
  test('atalho sem cartão: check-in rápido, Cabine, modo ativo e uma única sessão', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Atender meu primeiro chamado' }).click()
    await expect(page).toHaveURL(/\/check-in\?modo=rapido$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Check-in rápido' })).toBeVisible()
    for (const pergunta of ROTEIRO_CHECKIN.perguntas) {
      const rotulo = rotuloDaResposta(pergunta.id, CHECKIN_RAPIDO.respostas[pergunta.id]) ?? ''
      await expect(page.getByText(rotulo, { exact: true })).toBeVisible()
    }
    const entradas = await page.evaluate(() => window.history.length)
    await page.getByRole('button', { name: 'Confirmar e embarcar' }).click()
    await expect(page).toHaveURL(/\/cabine\/pasta-rede-inacessivel$/)
    expect(await page.evaluate(() => window.history.length)).toBe(entradas)
    await expect(page.getByRole('heading', { level: 1, name: 'Cabine' })).toBeFocused()
    await expect(page.getByRole('status').filter({ hasText: 'Modo de demonstração ativado' })).toHaveCount(1)
    await expect.poll(() => criacoesDeSessao().length).toBe(1)
    expect(JSON.parse((await lerChave(page, CHAVE_MODO_DEMONSTRACAO)) ?? 'null')).toMatchObject({ ativo: true })
    expect(JSON.parse((await lerChave(page, CHAVE_CARTAO_EMBARQUE)) ?? 'null')).toMatchObject({
      origem: 'checkin-rapido',
    })
    expect(await lerChave(page, CHAVE_REGISTROS_VOO)).toBeNull()
  })

  test('atalho com cartão: Cabine direta, cartão intacto e voltar leva ao Início', async ({ page }) => {
    await semear(page, { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    await page.goto('/')
    await page.getByRole('button', { name: 'Atender meu primeiro chamado' }).click()
    await expect(page).toHaveURL(/\/cabine\/pasta-rede-inacessivel$/)
    expect(await lerChave(page, CHAVE_CARTAO_EMBARQUE)).toBe(CARTAO)
    expect(JSON.parse((await lerChave(page, CHAVE_MODO_DEMONSTRACAO)) ?? 'null')).toMatchObject({ ativo: true })
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible()
  })

  test('controle só com teclado: libera, sobrevive a recarga e desativa', async ({ page }) => {
    await semear(page, { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    await page.goto('/plano-de-voo')
    const controle = page.getByRole('switch', { name: NOME_CONTROLE })
    await expect(controle).toHaveAttribute('aria-checked', 'false')
    await focarPorTeclado(page, controle)
    await page.keyboard.press('Space')
    await expect(controle).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Liberada para demonstração', { exact: true })).toHaveCount(4)
    await expect(
      cartaoDaMissao(page, 'sre-cloud-latencia').getByRole('link', { name: /Embarcar/ }),
    ).toHaveAttribute('href', '/cabine/sre-cloud-latencia')
    const backup = cartaoDaMissao(page, 'falha-backup-restore')
    await expect(backup.getByText('Em preparação', { exact: true })).toHaveCount(0)
    await expect(backup.getByRole('link', { name: /Embarcar/ })).toHaveAttribute('href', '/cabine/falha-backup-restore')

    await page.reload()
    await expect(page.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'true')
    await focarPorTeclado(page, page.getByRole('switch', { name: NOME_CONTROLE }))
    await page.keyboard.press('Space')
    await expect(page.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'false')
    await expect(cartaoDaMissao(page, 'incidente-massivo').getByText('Bloqueada', { exact: true })).toBeVisible()
    await expect(cartaoDaMissao(page, 'sre-cloud-latencia').getByText('Bloqueada', { exact: true })).toBeVisible()
    expect(JSON.parse((await lerChave(page, CHAVE_MODO_DEMONSTRACAO)) ?? 'null')).toMatchObject({ ativo: false })
    expect(await lerChave(page, CHAVE_REGISTROS_VOO)).toBeNull()
  })

  test('portão do cartão vale com o modo ativo: sem cartão a Cabine vai ao check-in e não cria sessão', async ({
    page,
  }) => {
    await semear(page, { [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await page.goto('/cabine/incidente-massivo')
    await expect(page).toHaveURL(/\/check-in\?motivo=sem-cartao$/)
    expect(criacoesDeSessao()).toHaveLength(0)
  })

  test('Brevê com o modo ativo e sem registros mostra o estado vazio', async ({ page }) => {
    await semear(page, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await page.goto('/breve')
    await expect(page.getByText(/Você ainda não tem voos registrados/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
    expect(await lerChave(page, CHAVE_REGISTROS_VOO)).toBeNull()
    expect(requisicoes.filter((r) => r.metodo === 'POST')).toHaveLength(0)
  })

  test('valor corrompido na chave do modo abre desativado e sem erro no console', async ({ page }) => {
    await semear(page, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: '{' })
    await page.goto('/plano-de-voo')
    await expect(page.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toHaveCount(0)
    expect(errosDoConsole).toEqual([])
  })

  test('em 375 px o controle e o indicador cabem, sem rolagem horizontal, com alvo de 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await semear(page, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await page.goto('/plano-de-voo')
    const controle = page.getByRole('switch', { name: NOME_CONTROLE })
    const indicador = page.getByRole('link', { name: 'Modo de demonstração ativo' })
    for (const alvo of [controle, indicador]) {
      await expect(alvo).toBeVisible()
      const caixa = await alvo.boundingBox()
      expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect((caixa?.x ?? -1) + (caixa?.width ?? 0)).toBeLessThanOrEqual(375)
    }
    const larguras = await page.evaluate(() => ({
      conteudo: document.documentElement.scrollWidth,
      janela: document.documentElement.clientWidth,
    }))
    expect(larguras.conteudo).toBeLessThanOrEqual(larguras.janela)
    await focarPorTeclado(page, controle)
    const contorno = await controle.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contorno).not.toBe('none')
  })
})