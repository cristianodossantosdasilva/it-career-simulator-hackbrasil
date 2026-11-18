import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CATALOGO_TEMAS, TEMA_DO_TERMINAL } from './tema/catalogo'
import {
  NOMES_DE_COR,
  blocosDeToken,
  classificarBloco,
  compararIdentificadores,
  conferirContrato,
  lerBlocos,
  lerDeclaracoes,
} from './tema/blocosTokens'
import {
  COMPONENTES,
  CONTORNOS,
  FUNDOS_DE_COMPONENTE,
  FUNDOS_DE_TEXTO,
  ICONES_DE_STATUS,
  TEXTOS,
  TOKENS_ESTRUTURAIS,
} from './tema/contratoTokens'
import { seletoresComTemaForaDeBloco } from './tema/regrasEstilo'
import { razaoContraste } from './utils/contraste'

// O sufixo ?raw volta vazio no Vitest (css.include padrao e vazio e o plugin zera o CSS), entao o arquivo e lido do disco.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8')

/**
 * Contraste derivado dos tokens reais de index.css. Nenhum hexadecimal de token fica neste arquivo:
 * os valores saem dos blocos de tema, entao qualquer mudanca de token passa por estes limiares.
 * Limiares nos temas: texto 4,5; contorno de container, divisor, controle, foco e acento 3 para 1 (criterio
 * 1.4.11 da WCAG 2.2, aplicado tambem ao divisor por decisao do projeto). No alto contraste: texto 7;
 * controle, foco, acento e icones de status 4,5; contornos 3.
 */
const MINIMO_TEXTO = 4.5
const MINIMO_COMPONENTE = 3
const MINIMO_TEXTO_ALTO = 7
const MINIMO_COMPONENTE_ALTO = 4.5

type Tokens = Record<string, string>

const blocos: Map<string, Tokens> = blocosDeToken(css)
const IDS_DO_CATALOGO: string[] = CATALOGO_TEMAS.map((tema) => tema.id)
const CHAVES_ALTO = ['alto-contraste-claro', 'alto-contraste-escuro'] as const

function tokensDe(chave: string): Tokens {
  const tokens = blocos.get(chave)
  if (tokens === undefined) throw new Error(`Bloco de tokens ausente: ${chave}`)
  return tokens
}

function cor(chave: string, token: string): string {
  const valor = tokensDe(chave)[token]
  if (!/^#[0-9a-f]{6}$/i.test(valor ?? '')) throw new Error(`${chave}: ${token} nao e hexadecimal de 6 digitos: ${valor}`)
  return valor
}

function razao(chave: string, primeiro: string, fundo: string): number {
  return razaoContraste(cor(chave, primeiro), cor(chave, fundo))
}

/** Falha com o formato `<tema>: <token> sobre <token> = <razao> (minimo <limite>)`. */
function exigir(chave: string, primeiro: string, fundo: string, minimo: number): void {
  const valor = razao(chave, primeiro, fundo)
  expect(valor, `${chave}: ${primeiro} sobre ${fundo} = ${valor.toFixed(2)} (mínimo ${minimo})`).toBeGreaterThanOrEqual(minimo)
}

function exigirCor(chave: string, corFixa: string, fundo: string, minimo: number): void {
  const valor = razaoContraste(corFixa, cor(chave, fundo))
  expect(valor, `${chave}: ${corFixa} sobre ${fundo} = ${valor.toFixed(2)} (mínimo ${minimo})`).toBeGreaterThanOrEqual(minimo)
}

function regra(seletor: string): string {
  const linha = css.split('\n').find((l) => l.startsWith(seletor))
  if (!linha) throw new Error(`Regra nao encontrada: ${seletor}`)
  return linha
}

function pixels(valor: string): number {
  const rem = /^([\d.]+)rem$/.exec(valor)
  if (rem !== null) return Number(rem[1]) * 16
  const px = /^([\d.]+)px$/.exec(valor)
  if (px !== null) return Number(px[1])
  throw new Error(`Medida nao reconhecida: ${valor}`)
}

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canais.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('enumeração dos blocos de token e contrato', () => {
  it('tem um bloco para cada tema do catálogo e os dois conjuntos de alto contraste, sem sobra', () => {
    const esperados = [...IDS_DO_CATALOGO, ...CHAVES_ALTO]
    const encontrados = [...blocos.keys()]
    const diferenca = compararIdentificadores(esperados, encontrados)
    expect(diferenca.semBloco, `identificadores sem bloco: ${diferenca.semBloco.join(', ')}`).toEqual([])
    expect(diferenca.semCatalogo, `blocos sem identificador no catálogo: ${diferenca.semCatalogo.join(', ')}`).toEqual([])
  })

  it('o catálogo mantém a ordem dos blocos no arquivo', () => {
    const ordemNoArquivo = lerBlocos(css)
      .map(classificarBloco)
      .flatMap((tipo) => (tipo.tipo === 'tema' ? [tipo.id] : []))
    expect(ordemNoArquivo).toEqual(IDS_DO_CATALOGO)
  })

  it.each(IDS_DO_CATALOGO)('o bloco %s declara os 63 nomes do contrato e nada mais', (id) => {
    const resultado = conferirContrato(tokensDe(id))
    expect(resultado, `${id}: ausentes, vazios e excedentes`).toEqual({ ausentes: [], vazios: [], excedentes: [] })
  })

  it.each(IDS_DO_CATALOGO)('o bloco %s usa hexadecimal de 6 ou 8 dígitos em todo token de cor', (id) => {
    for (const nome of NOMES_DE_COR) {
      expect(tokensDe(id)[nome], `${id}: ${nome}`).toMatch(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
    }
  })

  it.each(CHAVES_ALTO)('o conjunto %s declara os 33 tokens de cor e nada mais', (chave) => {
    const resultado = conferirContrato(tokensDe(chave), NOMES_DE_COR)
    expect(resultado, `${chave}: ausentes, vazios e excedentes`).toEqual({ ausentes: [], vazios: [], excedentes: [] })
    for (const nome of NOMES_DE_COR) expect(tokensDe(chave)[nome], `${chave}: ${nome}`).toMatch(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  })

  it('nenhum seletor de tema aparece fora do primeiro seletor de um bloco de tema', () => {
    expect(seletoresComTemaForaDeBloco(css)).toEqual([])
  })

  it('os tokens estruturais ficam em :root, fora dos blocos de tema', () => {
    const raiz = lerBlocos(css).find((bloco) => bloco.contexto === null && bloco.seletores.length === 1 && bloco.seletores[0] === ':root')
    expect(raiz).toBeDefined()
    const nomes = lerDeclaracoes(raiz!).map((declaracao) => declaracao.nome)
    for (const estrutural of TOKENS_ESTRUTURAIS) expect(nomes, estrutural).toContain(estrutural)
  })

  it('o bloco de operacao também vale para o terminal e nenhum bloco de tema usa :root nem .dark', () => {
    const operacao = lerBlocos(css).find((bloco) => {
      const tipo = classificarBloco(bloco)
      return tipo.tipo === 'tema' && tipo.id === TEMA_DO_TERMINAL
    })
    expect(operacao?.seletores).toContain("[data-superficie='terminal']")
    for (const bloco of lerBlocos(css)) {
      if (classificarBloco(bloco).tipo !== 'tema') continue
      expect(bloco.seletores.join(' '), bloco.seletores.join(', ')).not.toMatch(/:root|\.dark/)
    }
  })

  it('o esquema de cor fica fora dos blocos de token', () => {
    expect(css).toMatch(/html\.dark,\s*\[data-superficie='terminal'\]\s*\{\s*color-scheme: dark;/)
    expect(css).toMatch(/html:not\(\.dark\)\s*\{\s*color-scheme: light;/)
  })
})

describe.each(CATALOGO_TEMAS.map((tema) => tema.id))('tokens do tema %s', (id) => {
  it('texto atinge 4,5:1 sobre surface, canvas, elevated, hover e accent-surface', () => {
    for (const fundo of FUNDOS_DE_TEXTO) {
      for (const texto of TEXTOS) {
        // Excecao documentada: no operacao os textos neutros nao chegam a 4,5 sobre accent-surface
        // sem colapsar a hierarquia. O item ativo de Aulas usa accent-text (regra verificada abaixo).
        const neutroSobreAcento =
          id === 'operacao' && fundo === '--accent-surface' && (texto === '--text-secondary' || texto === '--text-muted')
        if (neutroSobreAcento) continue
        exigir(id, texto, fundo, MINIMO_TEXTO)
      }
    }
  })

  it('text-secondary fica mais distante do fundo que text-muted em todos os fundos de texto', () => {
    for (const fundo of FUNDOS_DE_TEXTO) {
      if (id === 'operacao' && fundo === '--accent-surface') continue
      expect(razao(id, '--text-secondary', fundo), `${id}: secondary sobre ${fundo}`).toBeGreaterThan(razao(id, '--text-muted', fundo))
    }
  })

  it('texto de estado e de acento atinge 4,5:1 sobre a superfície própria e sobre os sólidos', () => {
    for (const estado of ['success', 'warning', 'danger']) {
      exigir(id, `--status-${estado}-text`, `--status-${estado}-surface`, MINIMO_TEXTO)
      exigirCor(id, '#FFFFFF', `--status-${estado}-solid`, MINIMO_TEXTO)
    }
    for (const fundo of ['--accent-primary', '--accent-hover']) exigir(id, '--accent-contrast', fundo, MINIMO_TEXTO)
    exigirCor(id, '#FFFFFF', '--accent-solid', MINIMO_TEXTO)
  })

  it('controle, foco e acento atingem 3:1 sobre surface, canvas, elevated e hover', () => {
    for (const fundo of [...FUNDOS_DE_COMPONENTE, '--bg-hover']) {
      for (const componente of COMPONENTES) exigir(id, componente, fundo, MINIMO_COMPONENTE)
    }
  })

  it('contorno de container, divisor e controle atingem 3:1 sobre surface, canvas e elevated', () => {
    for (const fundo of FUNDOS_DE_COMPONENTE) {
      for (const contorno of CONTORNOS) exigir(id, contorno, fundo, MINIMO_COMPONENTE)
    }
  })

  it('border-subtle fica abaixo de border-strong e border-strong abaixo de border-control em força', () => {
    for (const fundo of FUNDOS_DE_COMPONENTE) {
      expect(razao(id, '--border-subtle', fundo), `${id}: subtle contra strong sobre ${fundo}`).toBeLessThanOrEqual(
        razao(id, '--border-strong', fundo),
      )
      expect(razao(id, '--border-strong', fundo), `${id}: strong contra control sobre ${fundo}`).toBeLessThanOrEqual(
        razao(id, '--border-control', fundo),
      )
    }
  })

  it('pares dos componentes que deixaram de usar cores literais passam de 8:1 no texto', () => {
    // .btn-white: texto primario como fundo e canvas como texto; hover usa bg-hover com texto primario
    exigir(id, '--bg-canvas', '--text-primary', 8)
    exigir(id, '--text-primary', '--bg-hover', 8)
    // seletor de arquivo: text-primary sobre bg-elevated
    exigir(id, '--text-primary', '--bg-elevated', 8)
    // banner e alertas: text-primary sobre as superficies de aviso
    for (const fundo of ['--accent-surface', '--status-success-surface', '--status-danger-surface']) exigir(id, '--text-primary', fundo, 8)
  })

  it('o link Pular (text-primary sobre canvas) e o realce de tarefa concluída passam de 4,5:1', () => {
    exigir(id, '--bg-canvas', '--text-primary', MINIMO_TEXTO)
    exigir(id, '--status-success-text', '--status-success-surface', MINIMO_TEXTO)
  })

  it('o tamanho mínimo de texto é 12 px e as famílias seguem a lista permitida', () => {
    const tokens = tokensDe(id)
    for (const nome of Object.keys(tokens).filter((n) => n.startsWith('--font-size-'))) {
      expect(pixels(tokens[nome]), `${id}: ${nome}`).toBeGreaterThanOrEqual(12)
    }
    expect(tokens['--font-sans'].startsWith("'Inter'"), `${id}: --font-sans`).toBe(true)
    expect(tokens['--font-mono'].startsWith("'JetBrains Mono'"), `${id}: --font-mono`).toBe(true)
    const mono = tokens['--font-mono'].split(',').map((parte) => parte.trim().replace(/'/g, ''))
    expect(mono[mono.length - 1]).toBe('monospace')
    for (const familia of mono) expect(['JetBrains Mono', 'ui-monospace', 'Cascadia Code', 'Consolas', 'monospace'], `${id}: ${familia}`).toContain(familia)
  })
})

describe.each(CHAVES_ALTO)('alto contraste: %s', (chave) => {
  it('texto atinge 7:1 sobre os cinco fundos de texto', () => {
    for (const fundo of FUNDOS_DE_TEXTO) {
      for (const texto of TEXTOS) exigir(chave, texto, fundo, MINIMO_TEXTO_ALTO)
    }
  })

  it('texto de estado atinge 7:1 sobre a superfície própria', () => {
    for (const estado of ['success', 'warning', 'danger']) exigir(chave, `--status-${estado}-text`, `--status-${estado}-surface`, MINIMO_TEXTO_ALTO)
  })

  it('controle, foco, acento e ícones de status atingem 4,5:1 sobre surface, canvas e elevated', () => {
    for (const fundo of FUNDOS_DE_COMPONENTE) {
      for (const item of [...COMPONENTES, ...ICONES_DE_STATUS]) exigir(chave, item, fundo, MINIMO_COMPONENTE_ALTO)
    }
  })

  it('contorno de container e divisor atingem 4,5:1 sobre surface, canvas e elevated', () => {
    for (const fundo of FUNDOS_DE_COMPONENTE) {
      for (const contorno of CONTORNOS) exigir(chave, contorno, fundo, MINIMO_COMPONENTE_ALTO)
    }
  })

  it('texto sobre os sólidos e sobre o acento atinge 4,5:1', () => {
    for (const estado of ['success', 'warning', 'danger']) exigirCor(chave, '#FFFFFF', `--status-${estado}-solid`, MINIMO_TEXTO)
    for (const fundo of ['--accent-primary', '--accent-hover']) exigir(chave, '--accent-contrast', fundo, MINIMO_TEXTO)
    exigirCor(chave, '#FFFFFF', '--accent-solid', MINIMO_TEXTO)
  })
})

describe('terminal do SimuDesk, sempre com os valores de operacao', () => {
  it('texto atinge 4,5:1 sobre o canvas do terminal e sobre o cabeçalho elevated', () => {
    for (const texto of ['--text-primary', '--text-secondary', '--text-muted']) exigir(TEMA_DO_TERMINAL, texto, '--bg-canvas', MINIMO_TEXTO)
    for (const texto of ['--text-secondary', '--text-muted']) exigir(TEMA_DO_TERMINAL, texto, '--bg-elevated', MINIMO_TEXTO)
  })

  it('com alto contraste o texto do terminal atinge 7:1 sobre o canvas', () => {
    for (const texto of ['--text-primary', '--text-secondary', '--text-muted']) exigir('alto-contraste-escuro', texto, '--bg-canvas', MINIMO_TEXTO_ALTO)
  })

  it('a borda do terminal destaca das páginas de esquema claro em 3:1 ou mais', () => {
    const paginas = [...CATALOGO_TEMAS.filter((tema) => tema.esquema === 'claro').map((tema) => tema.id), 'alto-contraste-claro']
    for (const pagina of paginas) {
      for (const fundo of ['--bg-surface', '--bg-canvas']) {
        const valor = razaoContraste(cor(TEMA_DO_TERMINAL, '--border-subtle'), cor(pagina, fundo))
        expect(valor, `borda do terminal sobre ${fundo} de ${pagina} = ${valor.toFixed(2)} (mínimo 3)`).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('temas com identidade própria', () => {
  it('acolhedor tem raio grande de 12 px, esquema claro e fundo mais claro que o texto', () => {
    expect(tokensDe('acolhedor')['--radius-lg']).toBe('12px')
    expect(CATALOGO_TEMAS.find((tema) => tema.id === 'acolhedor')?.esquema).toBe('claro')
    expect(luminancia(cor('acolhedor', '--bg-canvas'))).toBeGreaterThan(luminancia(cor('acolhedor', '--text-primary')))
  })

  it('editorial tem pesos mais leves e títulos maiores que operacao', () => {
    expect(tokensDe('editorial')['--font-weight-semibold']).toBe('500')
    expect(tokensDe('editorial')['--font-weight-bold']).toBe('600')
    expect(pixels(tokensDe('editorial')['--font-size-3xl'])).toBeGreaterThan(pixels(tokensDe('operacao')['--font-size-3xl']))
  })
})

describe('regras de index.css que dependem dos tokens', () => {
  it('nao deixa cores literais nos botoes, no seletor de arquivo e nos avisos', () => {
    const alvos = [
      '.btn-white {',
      '.btn-white:hover',
      'input[type="file"]::file-selector-button {',
      'input[type="file"]::file-selector-button:hover',
      '.banner-notice {',
      '.alert-success {',
      '.alert-danger {',
      '.skip:focus {',
      '.done .tick {',
    ]
    for (const alvo of alvos) {
      const linha = regra(alvo)
      expect(linha, alvo).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(linha, alvo).not.toMatch(/rgba?\(/i)
    }
  })

  it('contornos de container usam border-strong', () => {
    for (const seletor of ['.edu-card {', '.glossary-details {', '.panel {', '.kb-article {', '.step-box {', '.chat {', '.painel-bloco {', '.chat-log {']) {
      expect(regra(seletor), seletor).toMatch(/border:\s*1px solid var\(--border-strong\)/)
    }
  })

  it('contêineres usam raio e espaço dos tokens, e os títulos usam tamanho e peso dos tokens', () => {
    for (const seletor of ['.edu-card {', '.panel {', '.card-section {', '.step-box {', '.glossary-details {', '.chat {']) {
      const linha = regra(seletor)
      expect(linha, seletor).toMatch(/border-radius:\s*var\(--radius-(sm|md|lg)\)/)
    }
    for (const seletor of ['.h1 {', '.h2 {', '.h3 {', '.lesson-title {']) {
      const linha = regra(seletor)
      expect(linha, seletor).toMatch(/font-size:\s*var\(--font-size-/)
      expect(linha, seletor).toMatch(/font-weight:\s*var\(--font-weight-/)
    }
  })

  it('texto auxiliar tem no minimo 12 px e alvos pequenos tem 44 px', () => {
    expect(regra('.btn-sm {')).toMatch(/min-height:\s*var\(--touch-target\)/)
    expect(regra('.glossary-details summary {')).toMatch(/min-height:\s*var\(--touch-target\)/)
    expect(regra('.todo label {')).toMatch(/min-height:\s*var\(--touch-target\)/)
    expect(regra('code {')).toMatch(/max\(0\.88em,\s*var\(--font-size-xs\)\)/)
    // Alvo de 44 px em todas as larguras: a largura minima do botao de contexto fica na regra base,
    // fora de qualquer bloco @media, e o link Pular tem 44 px de altura quando recebe foco.
    const inicio = css.indexOf('\n.botao-contexto {')
    expect(inicio).toBeGreaterThan(-1)
    expect(css.slice(inicio, css.indexOf('}', inicio))).toMatch(/min-width:\s*var\(--touch-target\)/)
    expect(regra('.skip:focus {')).toMatch(/min-height:\s*var\(--touch-target\)/)
  })

  it('bordas de controle usam border-control', () => {
    expect(regra('textarea.block {')).toMatch(/border:\s*1px solid var\(--border-control\)/)
    expect(regra('.suggest button {')).toMatch(/border:\s*1px solid var\(--border-control\)/)
    expect(css).toMatch(/\.lab-guia-alternar \{[^}]*border-bottom:\s*1px solid var\(--border-control\)/)
  })

  it('o botao troca a borda para o acento no hover', () => {
    expect(regra('button:hover:not(:disabled)')).toMatch(/border-color:\s*var\(--accent\)/)
    expect(css).toMatch(/--accent:\s*var\(--accent-primary\)/)
  })

  it('o item ativo de Aulas usa accent-text no texto auxiliar', () => {
    expect(css).toMatch(/\.lesson-item\.active \.muted, \.lesson-item\.active-fix \.muted \{ color: var\(--accent-text\); \}/)
  })
})
