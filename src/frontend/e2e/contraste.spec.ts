import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../src/jornada/armazenamento/cartaoEmbarque'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../src/jornada/armazenamento/modoDemonstracao'
import { CARTAO_DE_TESTE } from '../src/testes/armazenamentoFalso'
import { TEXTOS_WORKSTATION as T } from '../src/textos/workstation'
import {
  celulaNaoCalculavel,
  gravarJson,
  medirCelula,
  type Estado,
  type ResultadoCelula,
} from './contraste.helper'

/**
 * Medição de contraste e contorno das páginas da jornada, nos temas corporate e tactical. Não corrige
 * produto e não valida limiar: mede e grava um JSON por projeto, tema e grupo em
 * test-results/contraste/. O relatório (e2e/contraste.relatorio.mjs) lê esses arquivos.
 *
 * Grupos: estudo (páginas da jornada sem voo), demonstracao (Início e Plano de voo com o modo ativo, com
 * selo e indicador) e laboratorio (Cabine, Caixa-preta e Brevê com um voo concluído).
 * A mesma página é reutilizada por tema, para poupar requisições (o backend limita por IP).
 * Falha só quando a primeira página não abre. Uma tela que não abre vira célula "não calculável"
 * com o motivo, e o relatório lista essas células.
 */
const PASTA = 'test-results/contraste'
const TEMAS = ['tactical', 'corporate'] as const
type Tema = (typeof TEMAS)[number]
const CARTAO = serializarCartao(CARTAO_DE_TESTE)
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-voo',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})

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

async function abrir(page: Page, tema: Tema, caminho: string, h1: string) {
  await page.goto(caminho)
  await expect(page.getByRole('heading', { level: 1, name: h1 }).first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema)
}

/** O Replay vive na Caixa-preta, aberta pelo link da Cabine. */
async function abrirCaixaPreta(page: Page) {
  await page.getByRole('link', { name: /Juiz 360º e Replay/i }).click()
  await expect(page).toHaveURL(/\/caixa-preta\//)
  await expect(page.getByText(T.replay.concluida, { exact: true })).toBeVisible()
}
function criarColetor(page: Page, testInfo: TestInfo, tema: Tema, grupo: string) {
  const viewport = page.viewportSize() ?? { width: 0, height: 0 }
  const celulas: ResultadoCelula[] = []

  async function medir(tela: string, estado: Estado, abrir: () => Promise<void>) {
    const meta = {
      projeto: testInfo.project.name,
      tema,
      viewport: { largura: viewport.width, altura: viewport.height },
      tela,
      estado,
    }
    try {
      await abrir()
    } catch (erro) {
      const motivo = `a tela não abriu: ${String((erro as Error).message).split('\n')[0]}`
      celulas.push(celulaNaoCalculavel(meta, motivo))
      return
    }
    try {
      celulas.push(await medirCelula(page, meta))
    } catch (erro) {
      celulas.push(celulaNaoCalculavel(meta, `a medição falhou: ${String((erro as Error).message).split('\n')[0]}`))
    }
  }

  async function gravar() {
    const navegador = page.context().browser()
    gravarJson(`${PASTA}/${testInfo.project.name}__${tema}__${grupo}.json`, {
      projeto: testInfo.project.name,
      tema,
      grupo,
      chromium: navegador?.version() ?? null,
      node: process.version,
      celulas,
    })
  }

  return { medir, gravar, celulas }
}

const PAGINAS_DE_ESTUDO = [
  { tela: 'Início', caminho: '/', h1: 'Início' },
  { tela: 'Check-in', caminho: '/check-in', h1: 'Check-in' },
  { tela: 'Check-in rápido', caminho: '/check-in?modo=rapido', h1: 'Check-in' },
  { tela: 'Plano de voo', caminho: '/plano-de-voo', h1: 'Plano de voo' },
  { tela: 'Brevê', caminho: '/breve', h1: 'Brevê' },
  { tela: 'Hangar', caminho: '/hangar', h1: 'Hangar' },
  { tela: 'Aulas', caminho: '/aulas', h1: 'Aulas' },
  { tela: 'Treino de explicação', caminho: '/aulas/treino', h1: 'Treino de explicação' },
  { tela: 'Caderno', caminho: '/caderno', h1: 'Caderno de estudos' },
  { tela: 'Comandante', caminho: '/comandante', h1: 'Comandante' },
  { tela: 'Página não encontrada', caminho: '/nao-existe', h1: 'Página não encontrada' },
] as const

for (const tema of TEMAS) {
  test.describe(`Medição de contraste, tema ${tema}`, () => {
    test.setTimeout(300_000)

    test('estudo: páginas da jornada sem voo (estado limpo)', async ({ page }, testInfo) => {
      const coletor = criarColetor(page, testInfo, tema, 'estudo')
      try {
        await preparar(page, tema)
        await abrir(page, tema, '/', 'Início')
        for (const pagina of PAGINAS_DE_ESTUDO) {
          await coletor.medir(pagina.tela, 'limpo', () => abrir(page, tema, pagina.caminho, pagina.h1))
        }
      } finally {
        await coletor.gravar()
      }
      expect(coletor.celulas.length).toBeGreaterThan(0)
    })

    test('demonstração: Início e Plano de voo com o modo ativo (selo e indicador)', async ({ page }, testInfo) => {
      const coletor = criarColetor(page, testInfo, tema, 'demonstracao')
      try {
        await preparar(page, tema, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
        await abrir(page, tema, '/', 'Início')
        await coletor.medir('Início', 'modo de demonstração ativo', async () => {
          await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
        })
        await coletor.medir('Plano de voo', 'modo de demonstração ativo', async () => {
          await abrir(page, tema, '/plano-de-voo', 'Plano de voo')
          await expect(page.getByText('Liberada para demonstração', { exact: true }).first()).toBeVisible()
          await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
        })
      } finally {
        await coletor.gravar()
      }
      expect(coletor.celulas.length).toBeGreaterThan(0)
    })

    test('laboratório: Cabine, Caixa-preta e Brevê (missão iniciada e turno concluído)', async ({ page }, testInfo) => {
      const coletor = criarColetor(page, testInfo, tema, 'laboratorio')
      const abrirFerramenta = (nome: RegExp, confirmacao: () => Promise<void>) => async () => {
        await page.getByRole('button', { name: nome }).click()
        await confirmacao()
      }
      const chat = abrirFerramenta(/Comunicador IA/i, () =>
        expect(page.getByRole('region', { name: 'Comunicador Corporativo' })).toBeVisible())
      const simudesk = abrirFerramenta(/SimuDesk Remoto/i, () => expect(page.getByPlaceholder(T.simudesk.placeholderId)).toBeVisible())
      const kb = abrirFerramenta(/Intranet \/ KB/i, () =>
        expect(page.getByRole('region', { name: 'Intranet e Base de Conhecimento' })).toBeVisible())
      try {
        await preparar(page, tema, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
        await page.goto('/cabine/triagem-engenharia-social?nova=1')
        await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('data-theme', tema)
        await coletor.medir('Cabine: ITSM', 'missão iniciada', async () => {})
        await coletor.medir('Cabine: Chat', 'missão iniciada', chat)
        await coletor.medir('Cabine: SimuDesk', 'missão iniciada', simudesk)
        await coletor.medir('Cabine: KB', 'missão iniciada', kb)
        // Conclui o turno da triagem (mesmo roteiro de e2e/visual.spec.ts).
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
        await coletor.medir('Cabine: ITSM', 'turno concluído', async () => {})
        await coletor.medir('Cabine: Chat', 'turno concluído', chat)
        await coletor.medir('Cabine: SimuDesk', 'turno concluído', simudesk)
        await coletor.medir('Cabine: KB', 'turno concluído', kb)
        await coletor.medir('Caixa-preta', 'turno concluído', () => abrirCaixaPreta(page))
        await coletor.medir('Brevê', 'turno concluído', async () => {
          await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Brevê' }).click()
          await expect(page.getByRole('heading', { level: 1, name: 'Brevê' })).toBeVisible()
          await page.getByRole('button', { name: 'Atualizar resumo' }).click()
        })
      } finally {
        await coletor.gravar()
      }
      expect(coletor.celulas.length).toBeGreaterThan(0)
    })
  })
}
