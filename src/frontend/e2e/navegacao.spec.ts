import { type Locator, type Page, expect, test } from '@playwright/test'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../src/jornada/armazenamento/cartaoEmbarque'
import { CARTAO_DE_TESTE } from '../src/testes/armazenamentoFalso'

const CHAVE_VOOS_ATIVOS = 'itfs_voos_ativos'
const MISSAO_LIBERADA_SEM_REGISTROS = 'pasta-rede-inacessivel'

/** Semeia o Cartão_de_Embarque antes de cada carga da página, sem sobrescrever o que a aplicação gravou. */
async function semearCartao(page: Page) {
  const entrada = { chave: CHAVE_CARTAO_EMBARQUE, texto: serializarCartao(CARTAO_DE_TESTE) }
  await page.addInitScript(({ chave, texto }) => {
    if (!window.localStorage.getItem(chave)) window.localStorage.setItem(chave, texto)
  }, entrada)
}

function menu(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal' })
}

function contarCriacoesDeSessao(page: Page): () => number {
  let total = 0
  page.on('request', (pedido) => {
    if (pedido.method() === 'POST' && new URL(pedido.url()).pathname === '/api/sessoes') total += 1
  })
  return () => total
}

const tamanhoDoHistorico = (page: Page) => page.evaluate(() => window.history.length)

/**
 * Alcança o controle só com Tab e setas, como o teclado faria. Em grupo de rádio, o Tab para no primeiro
 * item e as setas trocam a opção.
 */
async function focarPorTeclado(page: Page, alvo: Locator) {
  await expect(alvo).toBeVisible()
  for (let tentativa = 0; tentativa < 120; tentativa += 1) {
    if (await alvo.evaluate((el) => el === document.activeElement)) return
    const noMesmoGrupo = await alvo.evaluate((el) => {
      const ativo = document.activeElement
      return (
        el instanceof HTMLInputElement &&
        el.type === 'radio' &&
        ativo instanceof HTMLInputElement &&
        ativo.type === 'radio' &&
        ativo.name === el.name
      )
    })
    await page.keyboard.press(noMesmoGrupo ? 'ArrowDown' : 'Tab')
  }
  throw new Error('O teclado não alcançou o controle em 120 passos')
}

async function escolherPorTeclado(page: Page, rotulo: string) {
  const radio = page.getByRole('radio', { name: rotulo })
  await focarPorTeclado(page, radio)
  // O Tab só leva o foco ao grupo. A barra de espaço marca a opção que tem o foco.
  if (!(await radio.isChecked())) await page.keyboard.press('Space')
  await expect(radio).toBeChecked()
}

async function ativarPorTeclado(page: Page, alvo: Locator) {
  await focarPorTeclado(page, alvo)
  await page.keyboard.press('Enter')
}

const ITENS_DO_MENU = [
  { nome: 'Plano de voo', caminho: '/plano-de-voo' },
  { nome: 'Brevê', caminho: '/breve' },
  { nome: 'Hangar', caminho: '/hangar' },
  { nome: 'Aulas', caminho: '/aulas' },
  { nome: 'Caderno', caminho: '/caderno' },
  { nome: 'Comandante', caminho: '/comandante' },
  { nome: 'Início', caminho: '/' },
] as const

const ENDERECOS = [
  { caminho: '/', h1: 'Início' },
  { caminho: '/check-in', h1: 'Check-in' },
  { caminho: '/plano-de-voo', h1: 'Plano de voo' },
  { caminho: '/breve', h1: 'Brevê' },
  { caminho: '/hangar', h1: 'Hangar' },
  { caminho: '/aulas', h1: 'Aulas' },
  { caminho: '/aulas/treino', h1: 'Treino de explicação' },
  { caminho: '/caderno', h1: 'Caderno de estudos' },
  { caminho: '/comandante', h1: 'Comandante' },
] as const

test.describe('Navegação por endereços', () => {
  test.beforeEach(async ({ page }) => {
    await semearCartao(page)
  })

  test('cada item do menu muda a URL e acrescenta uma entrada ao histórico', async ({ page }) => {
    await page.goto('/')
    for (const item of ITENS_DO_MENU) {
      const antes = await tamanhoDoHistorico(page)
      const atual = new URL(page.url()).pathname
      await menu(page).getByRole('link', { name: item.nome }).click()
      await expect.poll(() => new URL(page.url()).pathname).toBe(item.caminho)
      if (atual !== item.caminho) expect(await tamanhoDoHistorico(page)).toBe(antes + 1)
      await expect(menu(page).getByRole('link', { name: item.nome })).toHaveAttribute('aria-current', 'page')
    }
  })

  test('voltar e avançar do navegador percorrem as páginas visitadas', async ({ page }) => {
    await page.goto('/')
    await menu(page).getByRole('link', { name: 'Plano de voo' }).click()
    await menu(page).getByRole('link', { name: 'Brevê' }).click()
    await menu(page).getByRole('link', { name: 'Caderno' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Caderno de estudos')
    await page.goBack()
    await expect(page).toHaveURL(/\/breve$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brevê')
    await page.goBack()
    await expect(page).toHaveURL(/\/plano-de-voo$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plano de voo')
    await page.goForward()
    await expect(page).toHaveURL(/\/breve$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brevê')
  })

  for (const endereco of ENDERECOS) {
    test(`recarregar e abrir direto ${endereco.caminho} mostra o h1 ${endereco.h1}`, async ({ page }) => {
      await page.goto(endereco.caminho)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(endereco.h1)
      await page.reload()
      await expect(page).toHaveURL(new RegExp(`${endereco.caminho === '/' ? '/$' : `${endereco.caminho}$`}`))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(endereco.h1)
      await expect(page.locator('main')).toHaveCount(1)
    })
  }

  test('depois de navegar, o foco vai ao h1, que tem o nome da página no início do título e contorno visível', async ({ page }) => {
    await page.goto('/')
    for (const nome of ['Plano de voo', 'Brevê', 'Aulas', 'Comandante']) {
      await menu(page).getByRole('link', { name: nome }).click()
      const titulo = page.locator('#conteudo-pagina h1')
      await expect(titulo).toBeFocused()
      const leitura = await titulo.evaluate((h1) => {
        const estilo = window.getComputedStyle(h1)
        return {
          texto: h1.textContent?.trim() ?? '',
          documento: document.title,
          estiloContorno: estilo.outlineStyle,
          larguraContorno: Number.parseFloat(estilo.outlineWidth),
        }
      })
      expect(leitura.documento.startsWith(leitura.texto)).toBe(true)
      expect(leitura.estiloContorno).not.toBe('none')
      expect(leitura.larguraContorno).toBeGreaterThan(0)
    }
  })

  test('as três Vertentes da N3 Sênior são grupos nomeados, na ordem do catálogo', async ({ page }) => {
    await page.goto('/plano-de-voo')
    const nomes = ['N3-A Redes e Nuvem', 'N3-B Data Center e Backup', 'N3-C Segurança e Dados']
    const posicoes: number[] = []
    for (const nome of nomes) {
      const grupo = page.getByRole('group', { name: nome })
      await expect(grupo).toBeVisible()
      const caixa = await grupo.boundingBox()
      posicoes.push(caixa?.y ?? -1)
    }
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  test('/nao-existe e /cabine/inexistente mostram a página 404', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    for (const caminho of ['/nao-existe', '/cabine/inexistente']) {
      await page.goto(caminho)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
    }
    expect(criacoes()).toBe(0)
  })

  test('/cabine/reset-senha-desbloqueio mostra o aviso de preparação e não cria sessão', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    await page.goto('/cabine/reset-senha-desbloqueio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cabine')
    await expect(page.getByText('Este cenário ainda está em preparação no simulador.')).toBeVisible()
    expect(criacoes()).toBe(0)
  })
})

test.describe('Portão do cartão de embarque', () => {
  test('sem cartão, /plano-de-voo termina em /check-in sem acrescentar uma entrada de histórico', async ({ page }) => {
    await page.goto('/')
    const antes = await tamanhoDoHistorico(page)
    await page.goto('/plano-de-voo')
    await expect(page).toHaveURL(/\/check-in\?motivo=sem-cartao$/)
    expect(await tamanhoDoHistorico(page)).toBe(antes + 1)
    await expect(page.getByRole('status').filter({ hasText: /cartão/i }).first()).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Início')
  })

  test('sem cartão, o item Plano de voo do menu também termina no Check-in', async ({ page }) => {
    await page.goto('/')
    const antes = await tamanhoDoHistorico(page)
    await menu(page).getByRole('link', { name: 'Plano de voo' }).click()
    await expect(page).toHaveURL(/\/check-in\?motivo=sem-cartao$/)
    expect(await tamanhoDoHistorico(page)).toBe(antes + 1)
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('Fluxo completo com o servidor local', () => {
  test('do Check-in à Cabine só com o teclado, sem criar sessão ao recarregar nem ao ir a Aulas', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    await page.goto('/check-in')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check-in')

    await escolherPorTeclado(page, 'Ajudar pessoas com tecnologia')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Continuar' }))
    await escolherPorTeclado(page, 'Pergunto o que aparece na tela e desde quando')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Continuar' }))
    await escolherPorTeclado(page, 'Indo direto para o chamado')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Ver indicação' }))
    await ativarPorTeclado(page, page.getByRole('button', { name: /Confirmar e gerar o cartão de embarque/ }))
    await ativarPorTeclado(page, page.getByRole('link', { name: /Ir para o Plano de voo/ }))
    await expect(page).toHaveURL(/\/plano-de-voo$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plano de voo')
    expect(criacoes()).toBe(0)

    const resposta = page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/sessoes',
    )
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Iniciar primeiro voo' }))
    const criada = await resposta
    expect(criada.status(), await criada.text()).toBeLessThan(300)
    await expect(page).toHaveURL(new RegExp(`/cabine/${MISSAO_LIBERADA_SEM_REGISTROS}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cabine')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Recarregar a Cabine retoma a sessão guardada e não cria outra.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cabine')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Ir a Aulas e voltar pelo menu também não cria sessão.
    await menu(page).getByRole('link', { name: 'Aulas' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aulas')
    await menu(page).getByRole('link', { name: 'Cabine' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cabine')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Caixa-preta e Brevê abrem depois de uma missão liberada sem registros anteriores.
    const sessaoId = await page.evaluate(
      ([chave, missao]) => {
        const voos = JSON.parse(window.localStorage.getItem(chave) ?? '{}') as { porMissao?: Record<string, string> }
        return voos.porMissao?.[missao] ?? null
      },
      [CHAVE_VOOS_ATIVOS, MISSAO_LIBERADA_SEM_REGISTROS] as const,
    )
    expect(sessaoId).toMatch(/^[A-Za-z0-9-]{1,64}$/)
    await page.goto(`/caixa-preta/${sessaoId}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Caixa-preta')
    await menu(page).getByRole('link', { name: 'Brevê' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brevê')
    expect(criacoes()).toBe(1)
  })
})
