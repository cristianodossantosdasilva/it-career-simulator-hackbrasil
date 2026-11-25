import { type Locator, type Page, expect, test } from '@playwright/test'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../src/jornada/armazenamento/cartaoPerfil'
import { CARTAO_DE_TESTE } from '../src/testes/armazenamentoFalso'

const CHAVE_MISSOES_ATIVAS = 'itfs_missoes_ativas'
const MISSAO_LIBERADA_SEM_REGISTROS = 'reset-senha-desbloqueio'

/** Semeia o Cartão_de_Embarque antes de cada carga da página, sem sobrescrever o que a aplicação gravou. */
async function semearCartao(page: Page) {
  const entrada = { chave: CHAVE_CARTAO_PERFIL, texto: serializarCartao(CARTAO_DE_TESTE) }
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
  { nome: 'Carreira', caminho: '/carreira' },
  { nome: 'Aprender', caminho: '/aprender' },
  { nome: 'Praticar', caminho: '/praticar' },
  { nome: 'Biblioteca', caminho: '/biblioteca' },
  { nome: 'Reforço diário', caminho: '/reforco' },
  { nome: 'Simulados', caminho: '/simulados' },
  { nome: 'Provas', caminho: '/provas' },
  { nome: 'Painel', caminho: '/painel' },
  { nome: 'Histórico', caminho: '/historico' },
  { nome: 'Portfólio', caminho: '/portfolio' },
  { nome: 'Mentor', caminho: '/mentor' },
  { nome: 'Início', caminho: '/' },
] as const

const ENDERECOS = [
  { caminho: '/', h1: 'Início' },
  { caminho: '/diagnostico', h1: 'Diagnóstico' },
  { caminho: '/plano-de-carreira', h1: 'Plano de Carreira' },
  { caminho: '/portfolio', h1: 'Portfólio' },
  { caminho: '/catalogo', h1: 'Catálogo' },
  { caminho: '/aulas', h1: 'Aulas' },
  { caminho: '/aulas/treino', h1: 'Treino de explicação' },
  { caminho: '/caderno', h1: 'Caderno de estudos' },
  { caminho: '/mentor', h1: 'Mentor' },
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
    await menu(page).getByRole('link', { name: 'Carreira' }).click()
    await menu(page).getByRole('link', { name: 'Portfólio' }).click()
    await menu(page).getByRole('link', { name: 'Histórico' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Histórico')
    await page.goBack()
    await expect(page).toHaveURL(/\/portfolio$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfólio')
    await page.goBack()
    await expect(page).toHaveURL(/\/carreira$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carreira')
    await page.goForward()
    await expect(page).toHaveURL(/\/portfolio$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfólio')
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
    for (const nome of ['Carreira', 'Portfólio', 'Aprender', 'Mentor']) {
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
    await page.goto('/plano-de-carreira')
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

  test('/nao-existe e /mesa-de-trabalho/inexistente mostram a página 404', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    for (const caminho of ['/nao-existe', '/mesa-de-trabalho/inexistente']) {
      await page.goto(caminho)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
    }
    expect(criacoes()).toBe(0)
  })

  test('/mesa-de-trabalho/pasta-rede-inacessivel sem o registro da Help Desk N1 mostra o aviso da etapa e não cria sessão', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    await page.goto('/mesa-de-trabalho/pasta-rede-inacessivel')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mesa de Trabalho')
    await expect(page.getByText(/A etapa Service Desk N1 Jr ainda não está liberada/)).toBeVisible()
    expect(criacoes()).toBe(0)
  })
})

test.describe('Portão do cartão de perfil', () => {
  test('sem cartão, /plano-de-carreira termina em /diagnostico sem acrescentar uma entrada de histórico', async ({ page }) => {
    await page.goto('/')
    const antes = await tamanhoDoHistorico(page)
    await page.goto('/plano-de-carreira')
    await expect(page).toHaveURL(/\/diagnostico\?motivo=sem-cartao$/)
    expect(await tamanhoDoHistorico(page)).toBe(antes + 1)
    await expect(page.getByRole('status').filter({ hasText: /cartão/i }).first()).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Início')
  })
})

test.describe('Fluxo completo com o servidor local', () => {
  test('do Diagnóstico à Mesa de Trabalho só com o teclado, sem criar sessão ao recarregar nem ao ir a Aulas', async ({ page }) => {
    const criacoes = contarCriacoesDeSessao(page)
    await page.goto('/diagnostico')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Diagnóstico')

    await escolherPorTeclado(page, 'Ajudar pessoas com tecnologia')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Continuar' }))
    await escolherPorTeclado(page, 'Pergunto o que aparece na tela e desde quando')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Continuar' }))
    await escolherPorTeclado(page, 'Indo direto para o chamado')
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Ver indicação' }))
    await ativarPorTeclado(page, page.getByRole('button', { name: /Confirmar e gerar o cartão de perfil/ }))
    await ativarPorTeclado(page, page.getByRole('link', { name: /Ir para o Plano de Carreira/ }))
    await expect(page).toHaveURL(/\/plano-de-carreira$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plano de Carreira')
    expect(criacoes()).toBe(0)

    const resposta = page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/sessoes',
    )
    await ativarPorTeclado(page, page.getByRole('button', { name: 'Iniciar primeira missão' }))
    const criada = await resposta
    expect(criada.status(), await criada.text()).toBeLessThan(300)
    await expect(page).toHaveURL(new RegExp(`/mesa-de-trabalho/${MISSAO_LIBERADA_SEM_REGISTROS}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mesa de Trabalho')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Recarregar a Mesa de Trabalho retoma a sessão guardada e não cria outra.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mesa de Trabalho')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Ir a Aulas e voltar pelo menu também não cria sessão.
    await menu(page).getByRole('link', { name: 'Aprender' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aprender')
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mesa de Trabalho')
    await expect(page.getByRole('heading', { name: /CH-\d+/ }).first()).toBeVisible()
    expect(criacoes()).toBe(1)

    // Revisão e Portfólio abrem depois de uma missão liberada sem registros anteriores.
    const sessaoId = await page.evaluate(
      ([chave, missao]) => {
        const missoes = JSON.parse(window.localStorage.getItem(chave) ?? '{}') as { porMissao?: Record<string, string> }
        return missoes.porMissao?.[missao] ?? null
      },
      [CHAVE_MISSOES_ATIVAS, MISSAO_LIBERADA_SEM_REGISTROS] as const,
    )
    expect(sessaoId).toMatch(/^[A-Za-z0-9-]{1,64}$/)
    await page.goto(`/revisao/${sessaoId}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Revisão')
    await menu(page).getByRole('link', { name: 'Portfólio' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfólio')
    expect(criacoes()).toBe(1)
  })
})
