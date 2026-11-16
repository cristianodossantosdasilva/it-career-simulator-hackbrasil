import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { razaoContraste } from './utils/contraste'

// O sufixo ?raw volta vazio no Vitest (css.include padrao e vazio e o plugin zera o CSS), entao o arquivo e lido do disco.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8')

/**
 * Contraste derivado dos tokens reais de index.css. Nenhum hexadecimal de token fica neste arquivo:
 * os valores saem dos blocos de tema, entao qualquer mudanca de token passa por estes limiares.
 * Limiares (07_PLANO_FINAL.md, secao 4): texto 4,5; controle e foco 3,0; contorno de container 2,0
 * sobre surface e canvas; divisor 1,4 no corporate e sem regressao no tactical (1,71 e 1,81).
 */

type Tema = 'corporate' | 'tactical'
type Tokens = Record<string, string>

function bloco(origem: string, abertura: RegExp): string {
  const corpo = abertura.exec(origem)?.[1]
  if (corpo === undefined) throw new Error(`Bloco de tokens nao encontrado: ${abertura}`)
  return corpo
}

function lerTokens(corpo: string): Tokens {
  const semComentarios = corpo.replace(/\/\*[\s\S]*?\*\//g, '')
  const tokens: Tokens = {}
  for (const m of semComentarios.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim()
  return tokens
}

const temas: Record<Tema, Tokens> = {
  corporate: lerTokens(bloco(css, /:root,\s*\[data-theme='corporate'\]\s*\{([^}]*)\}/)),
  tactical: lerTokens(bloco(css, /\[data-theme='tactical'\],\s*\.dark\s*\{([^}]*)\}/)),
}

const FUNDOS = ['bg-surface', 'bg-canvas', 'bg-elevated', 'bg-hover', 'accent-surface'] as const
const FUNDOS_CONTORNO = ['bg-surface', 'bg-canvas'] as const
const FUNDOS_CONTROLE = ['bg-surface', 'bg-canvas', 'bg-elevated'] as const

function cor(tema: Tema, token: string): string {
  const valor = temas[tema][token]
  if (!/^#[0-9a-f]{6}$/i.test(valor ?? '')) throw new Error(`Token ${token} do tema ${tema} nao e hexadecimal: ${valor}`)
  return valor
}

function razao(tema: Tema, primeiro: string, fundo: string): number {
  return razaoContraste(cor(tema, primeiro), cor(tema, fundo))
}

function regra(seletor: string): string {
  const linha = css.split('\n').find((l) => l.startsWith(seletor))
  if (!linha) throw new Error(`Regra nao encontrada: ${seletor}`)
  return linha
}

describe.each(['corporate', 'tactical'] as const)('tokens do tema %s', (tema) => {
  it('le os tokens reais de index.css', () => {
    expect(cor(tema, 'bg-surface')).toMatch(/^#/)
    expect(cor(tema, 'text-muted')).toMatch(/^#/)
    expect(css.length).toBeGreaterThan(1000)
  })

  it('texto atinge 4,5:1 sobre surface, canvas, elevated, hover e accent-surface', () => {
    for (const fundo of FUNDOS) {
      for (const texto of ['text-primary', 'text-secondary', 'text-muted', 'accent-text']) {
        // Excecao documentada: no tactical os textos neutros nao chegam a 4,5 sobre accent-surface
        // sem colapsar a hierarquia. O item ativo de Aulas usa accent-text (regra verificada abaixo).
        const neutroSobreAcento = tema === 'tactical'
          ? fundo === 'accent-surface' ? texto === 'text-secondary' || texto === 'text-muted' : false
          : false
        if (neutroSobreAcento) continue
        expect(razao(tema, texto, fundo), `${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('text-secondary fica mais distante do fundo que text-muted em todos os fundos de texto', () => {
    for (const fundo of FUNDOS) {
      if (tema === 'tactical' ? fundo === 'accent-surface' : false) continue
      expect(razao(tema, 'text-secondary', fundo), fundo).toBeGreaterThan(razao(tema, 'text-muted', fundo))
    }
  })

  it('texto de estado e de acento atinge 4,5:1 sobre a superficie propria', () => {
    for (const estado of ['success', 'warning', 'danger']) {
      expect(razao(tema, `status-${estado}-text`, `status-${estado}-surface`), estado).toBeGreaterThanOrEqual(4.5)
      expect(razaoContraste('#FFFFFF', cor(tema, `status-${estado}-solid`)), `${estado} solido`).toBeGreaterThanOrEqual(4.5)
    }
    for (const fundo of ['accent-primary', 'accent-hover', 'accent-solid']) {
      const texto = fundo === 'accent-solid' ? '#FFFFFF' : cor(tema, 'accent-contrast')
      expect(razaoContraste(texto, cor(tema, fundo)), fundo).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('controle e foco atingem 3:1 sobre surface, canvas e elevated', () => {
    for (const fundo of FUNDOS_CONTROLE) {
      for (const controle of ['border-control', 'focus-ring', 'accent-primary']) {
        expect(razao(tema, controle, fundo), `${controle} sobre ${fundo}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('contorno de container atinge 2,0:1 sobre surface e canvas', () => {
    for (const fundo of FUNDOS_CONTORNO) {
      expect(razao(tema, 'border-strong', fundo), fundo).toBeGreaterThanOrEqual(2)
    }
  })

  it('divisor atinge o piso do tema sobre surface e canvas', () => {
    const piso: Record<Tema, Record<string, number>> = {
      corporate: { 'bg-surface': 1.4, 'bg-canvas': 1.4 },
      tactical: { 'bg-surface': 1.71, 'bg-canvas': 1.81 },
    }
    for (const fundo of FUNDOS_CONTORNO) {
      expect(razao(tema, 'border-subtle', fundo), fundo).toBeGreaterThanOrEqual(piso[tema][fundo])
    }
  })

  it('border-subtle continua mais claro que border-strong e border-strong que border-control', () => {
    for (const fundo of FUNDOS_CONTORNO) {
      expect(razao(tema, 'border-subtle', fundo)).toBeLessThan(razao(tema, 'border-strong', fundo))
      expect(razao(tema, 'border-strong', fundo)).toBeLessThan(razao(tema, 'border-control', fundo))
    }
  })

  it('pares dos componentes que deixaram de usar cores literais passam de 8:1 no texto e 3:1 na borda', () => {
    // .btn-white: texto primario como fundo e canvas como texto; hover usa bg-hover com texto primario
    expect(razao(tema, 'bg-canvas', 'text-primary')).toBeGreaterThanOrEqual(8)
    expect(razao(tema, 'text-primary', 'bg-hover')).toBeGreaterThanOrEqual(8)
    // seletor de arquivo: text-primary sobre bg-elevated e bg-hover, borda de controle
    expect(razao(tema, 'text-primary', 'bg-elevated')).toBeGreaterThanOrEqual(8)
    expect(razao(tema, 'border-control', 'bg-elevated')).toBeGreaterThanOrEqual(3)
    // banner e alertas: text-primary sobre as superficies de aviso
    for (const fundo of ['accent-surface', 'status-success-surface', 'status-danger-surface']) {
      expect(razao(tema, 'text-primary', fundo), fundo).toBeGreaterThanOrEqual(8)
    }
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
    ]
    for (const alvo of alvos) {
      const linha = regra(alvo)
      expect(linha, alvo).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(linha, alvo).not.toMatch(/rgba?\(/i)
    }
  })

  it('nao mantem override de avisos por tema: os tokens ja mudam com o tema', () => {
    expect(css).not.toMatch(/\[data-theme='tactical'\]\s+\.(banner-notice|alert-success|alert-danger)/)
  })

  it('contornos de container usam border-strong', () => {
    for (const seletor of ['.edu-card {', '.glossary-details {', '.panel {', '.kb-article {', '.step-box {', '.chat {', '.painel-bloco {', '.chat-log {']) {
      expect(regra(seletor), seletor).toMatch(/border:\s*1px solid var\(--border-strong\)/)
    }
  })

  it('texto auxiliar tem no minimo 12 px e alvos pequenos tem 44 px', () => {
    const xs = /--font-size-xs:\s*([\d.]+)rem/.exec(css)
    expect(xs).not.toBeNull()
    expect(Number(xs?.[1]) * 16).toBeGreaterThanOrEqual(12)
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

  it('o botao troca a borda para o acento no hover (cobre border-control sobre bg-hover)', () => {
    expect(regra('button:hover:not(:disabled)')).toMatch(/border-color:\s*var\(--accent\)/)
    expect(css).toMatch(/--accent:\s*var\(--accent-primary\)/)
  })

  it('o item ativo de Aulas usa accent-text no texto auxiliar', () => {
    expect(css).toMatch(/\.lesson-item\.active \.muted, \.lesson-item\.active-fix \.muted \{ color: var\(--accent-text\); \}/)
  })
})

describe('terminal do SimuDesk, forcado em tactical dentro do tema corporate', () => {
  // O elemento recebe data-theme="tactical", entao os tokens resolvem para o bloco tactical
  // mesmo quando a pagina esta em corporate. Medido a parte, apenas com valores tactical.
  it('texto atinge 4,5:1 sobre o canvas do terminal e sobre o cabecalho elevated', () => {
    for (const texto of ['text-primary', 'text-secondary', 'text-muted']) {
      expect(razao('tactical', texto, 'bg-canvas'), `${texto} sobre canvas`).toBeGreaterThanOrEqual(4.5)
    }
    for (const texto of ['text-secondary', 'text-muted']) {
      expect(razao('tactical', texto, 'bg-elevated'), `${texto} sobre cabecalho`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('borda do terminal destaca da pagina corporate em 2,0:1 ou mais', () => {
    for (const fundo of ['bg-surface', 'bg-canvas']) {
      const r = razaoContraste(cor('tactical', 'border-subtle'), cor('corporate', fundo))
      expect(r, `borda tactical sobre ${fundo} corporate`).toBeGreaterThanOrEqual(2)
    }
  })
})
