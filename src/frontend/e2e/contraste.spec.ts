import { existsSync } from 'node:fs'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../src/jornada/armazenamento/cartaoEmbarque'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../src/jornada/armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../src/jornada/armazenamento/registrosVoo'
import { CARTAO_DE_TESTE, registroDeTeste } from '../src/testes/armazenamentoFalso'
import { CATALOGO_TEMAS, type IdTema } from '../src/tema/catalogo'
import { CHAVE_CONTRASTE, CHAVE_TEMA } from '../src/tema/persistencia'
import { TEXTOS_WORKSTATION as T } from '../src/textos/workstation'
import {
  celulaNaoCalculavel,
  gravarJson,
  medirCelula,
  violacoesDaCelula,
  type Contraste,
  type Estado,
  type ResultadoCelula,
} from './contraste.helper'

/**
 * Medição de contraste e contorno das páginas da jornada, em todos os temas do catálogo, com o contraste
 * padrão e com o alto contraste. Mede e grava um JSON por projeto, tema, contraste e grupo em
 * test-results/contraste/ (o relatório e2e/contraste.relatorio.mjs lê esses arquivos). Ao fim de cada teste,
 * depois de gravar o JSON, falha se houver violação da WCAG 2.2 AA: texto (axe), contorno de container,
 * controle, divisor e foco, texto abaixo de 12 px, status sem texto nem ícone e cores do terminal.
 *
 * Grupos: estudo (páginas da jornada sem voo, mais o painel de aparência aberto), demonstracao (Início e
 * Plano de voo com o modo ativo), laboratorio (Cabine, Caixa-preta e Brevê com um voo concluído) e terminal
 * (SimuDesk conectado da Service Desk N1 Jr, onde o terminal existe e as cores dele são conferidas).
 * O contraste padrão roda em todos os projetos visuais. O alto contraste roda só em mobile-375 e desktop-1440.
 * Uma tela que não abre vira célula "não calculável" com o motivo, e o relatório lista essas células.
 */
const PASTA = 'test-results/contraste'
const TEMAS = CATALOGO_TEMAS
const PROJETOS_COM_ALTO_CONTRASTE = ['mobile-375', 'desktop-1440']
const GRUPOS = ['estudo', 'demonstracao', 'laboratorio', 'terminal'] as const
type Grupo = (typeof GRUPOS)[number]
type Tema = (typeof TEMAS)[number]

const contrastesDoProjeto = (projeto: string): Contraste[] =>
  PROJETOS_COM_ALTO_CONTRASTE.includes(projeto) ? ['padrao', 'alto'] : ['padrao']
const caminhoJson = (projeto: string, tema: string, contraste: Contraste, grupo: Grupo) =>
  `${PASTA}/${projeto}__${tema}__${contraste}__${grupo}.json`
const CARTAO = serializarCartao(CARTAO_DE_TESTE)
const REGISTRO_DA_HELP_DESK = serializarRegistros([registroDeTeste('reset-senha-desbloqueio', 'sessao-ajuda-e2e')])
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-voo',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})

/** Semeia tema e contraste e as chaves da jornada antes de cada carga, sem sobrescrever o que a aplicação gravou. */
async function preparar(
  page: Page,
  tema: IdTema,
  contraste: Contraste,
  chaves: Record<string, string> = { [CHAVE_CARTAO_EMBARQUE]: CARTAO },
) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(
    ([chaveTema, valorTema, chaveContraste, valorContraste, entradas]) => {
      window.localStorage.setItem(chaveTema as string, valorTema as string)
      if (valorContraste === 'alto') window.localStorage.setItem(chaveContraste as string, 'alto')
      else window.localStorage.removeItem(chaveContraste as string)
      for (const [chave, texto] of Object.entries(entradas as Record<string, string>)) {
        if (!window.localStorage.getItem(chave)) window.localStorage.setItem(chave, texto)
      }
    },
    [CHAVE_TEMA, tema, CHAVE_CONTRASTE, contraste, chaves] as const,
  )
}

async function conferirAparencia(page: Page, tema: IdTema, contraste: Contraste) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema)
  if (contraste === 'alto') await expect(page.locator('html')).toHaveAttribute('data-contraste', 'alto')
  else await expect(page.locator('html')).not.toHaveAttribute('data-contraste', /.*/)
}

async function abrir(page: Page, tema: IdTema, contraste: Contraste, caminho: string, h1: string) {
  await page.goto(caminho)
  await expect(page.getByRole('heading', { level: 1, name: h1 }).first()).toBeVisible()
  await conferirAparencia(page, tema, contraste)
}
/** O Replay vive na Caixa-preta, aberta pelo link da Cabine. */
async function abrirCaixaPreta(page: Page) {
  await page.getByRole('link', { name: /Juiz 360º e Replay/i }).click()
  await expect(page).toHaveURL(/\/caixa-preta\//)
  await expect(page.getByText(T.replay.concluida, { exact: true })).toBeVisible()
}
function criarColetor(page: Page, testInfo: TestInfo, tema: Tema, contraste: Contraste, grupo: Grupo) {
  const viewport = page.viewportSize() ?? { width: 0, height: 0 }
  const celulas: ResultadoCelula[] = []

  async function medir(tela: string, estado: Estado, abrir: () => Promise<void>) {
    const meta = {
      projeto: testInfo.project.name,
      tema: tema.id,
      esquema: tema.esquema,
      contraste,
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

  function gravar() {
    const navegador = page.context().browser()
    gravarJson(caminhoJson(testInfo.project.name, tema.id, contraste, grupo), {
      projeto: testInfo.project.name,
      tema: tema.id,
      esquema: tema.esquema,
      contraste,
      grupo,
      chromium: navegador?.version() ?? null,
      node: process.version,
      celulas,
    })
  }

  /** Falha com a lista de violações das categorias da WCAG 2.2 AA. Chamar depois de gravar o JSON. */
  function exigirSemViolacoes() {
    const violacoes = celulas.flatMap(violacoesDaCelula)
    expect(violacoes, `${violacoes.length} violação(ões) em ${tema.id}/${contraste}:\n${violacoes.join('\n')}`).toEqual([])
  }

  return { medir, gravar, celulas, exigirSemViolacoes }
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
  for (const contraste of ['padrao', 'alto'] as const) {
    test.describe(`Medição de contraste, tema ${tema.id}, contraste ${contraste}`, () => {
      test.setTimeout(300_000)

      test.beforeEach(({ baseURL }, testInfo) => {
        expect(baseURL).toBeTruthy()
        test.skip(!contrastesDoProjeto(testInfo.project.name).includes(contraste), 'Alto contraste só em mobile-375 e desktop-1440')
      })

      test('estudo: páginas da jornada sem voo e painel de aparência (estado limpo)', async ({ page }, testInfo) => {
        const coletor = criarColetor(page, testInfo, tema, contraste, 'estudo')
        try {
          await preparar(page, tema.id, contraste)
          await abrir(page, tema.id, contraste, '/', 'Início')
          for (const pagina of PAGINAS_DE_ESTUDO) {
            await coletor.medir(pagina.tela, 'limpo', () => abrir(page, tema.id, contraste, pagina.caminho, pagina.h1))
          }
          await coletor.medir('Painel de Aparência', 'painel de aparência aberto', async () => {
            await abrir(page, tema.id, contraste, '/', 'Início')
            await page.getByRole('button', { name: 'Aparência' }).click()
            await expect(page.getByRole('region', { name: 'Aparência' })).toBeVisible()
          })
        } finally {
          coletor.gravar()
        }
        expect(coletor.celulas.length).toBeGreaterThan(0)
        coletor.exigirSemViolacoes()
      })

      test('demonstração: Início e Plano de voo com o modo ativo (selo e indicador)', async ({ page }, testInfo) => {
        const coletor = criarColetor(page, testInfo, tema, contraste, 'demonstracao')
        try {
          await preparar(page, tema.id, contraste, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
          await abrir(page, tema.id, contraste, '/', 'Início')
          await coletor.medir('Início', 'modo de demonstração ativo', async () => {
            await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
          })
          await coletor.medir('Plano de voo', 'modo de demonstração ativo', async () => {
            await abrir(page, tema.id, contraste, '/plano-de-voo', 'Plano de voo')
            await expect(page.getByText('Liberada para demonstração', { exact: true }).first()).toBeVisible()
            await expect(page.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeVisible()
          })
        } finally {
          coletor.gravar()
        }
        expect(coletor.celulas.length).toBeGreaterThan(0)
        coletor.exigirSemViolacoes()
      })

      test('laboratório: Cabine, Caixa-preta e Brevê (missão iniciada e turno concluído)', async ({ page }, testInfo) => {
        const coletor = criarColetor(page, testInfo, tema, contraste, 'laboratorio')
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
          await preparar(page, tema.id, contraste, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
          await page.goto('/cabine/triagem-engenharia-social?nova=1')
          await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
          await conferirAparencia(page, tema.id, contraste)
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
          coletor.gravar()
        }
        expect(coletor.celulas.length).toBeGreaterThan(0)
        coletor.exigirSemViolacoes()
      })

      test('terminal: SimuDesk conectado com saída de comando', async ({ page }, testInfo) => {
        const coletor = criarColetor(page, testInfo, tema, contraste, 'terminal')
        try {
          await preparar(page, tema.id, contraste, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_REGISTROS_VOO]: REGISTRO_DA_HELP_DESK })
          await page.goto('/cabine/pasta-rede-inacessivel?semente=2&causa=C3&nova=1')
          await expect(page.getByRole('heading', { name: /CH-0001/i })).toBeVisible()
          await conferirAparencia(page, tema.id, contraste)
          await page.getByRole('button', { name: T.itsm.assumirChamado }).click()
          await page.getByRole('button', { name: T.itsm.salvarClassificacao }).click()
          await page.getByRole('button', { name: /Comunicador IA/i }).click()
          await page.getByLabel(/Matr[ií]cula/i).fill('AUR-1042')
          await page.getByLabel(/Ramal/i).fill('2042')
          await page.getByRole('button', { name: /Validar Identidade/i }).click()
          await expect(page.getByText(T.chat.identidadeVerificada)).toBeVisible()
          await coletor.medir('Cabine: SimuDesk com terminal', 'missão iniciada', async () => {
            await page.getByRole('button', { name: /SimuDesk Remoto/i }).click()
            await page.getByRole('button', { name: T.simudesk.preencherConectar }).click()
            await page.getByLabel('Comando do terminal').fill('net start')
            await page.getByRole('button', { name: 'Executar' }).click()
            await expect(page.getByText(/Workstation.*Stopped/i)).toBeVisible()
          })
        } finally {
          coletor.gravar()
        }
        expect(coletor.celulas.some((celula) => celula.terminal !== null && celula.terminal !== undefined), 'o terminal do SimuDesk não foi medido').toBe(true)
        coletor.exigirSemViolacoes()
      })
    })
  }
}

test('cada tema e contraste esperado deixou JSON de medição neste projeto', ({ baseURL }, testInfo) => {
  expect(baseURL).toBeTruthy()
  const faltando: string[] = []
  for (const tema of TEMAS) {
    for (const contraste of contrastesDoProjeto(testInfo.project.name)) {
      for (const grupo of GRUPOS) {
        const caminho = caminhoJson(testInfo.project.name, tema.id, contraste, grupo)
        if (!existsSync(caminho)) faltando.push(caminho)
      }
    }
  }
  expect(faltando, `JSON de medição ausente:\n${faltando.join('\n')}`).toEqual([])
})