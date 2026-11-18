/** Contrato de tokens: o que todo bloco de tema declara, e os pares de contraste que os testes medem. */
export type CategoriaToken = 'cor' | 'sombra' | 'familia' | 'tamanho' | 'peso' | 'espaco' | 'raio'

export interface TokenDoContrato {
  readonly nome: `--${string}`
  readonly categoria: CategoriaToken
}

const NOMES_DE_COR = [
  '--bg-canvas', '--bg-surface', '--bg-elevated', '--bg-hover',
  '--border-subtle', '--border-strong', '--border-control',
  '--text-primary', '--text-secondary', '--text-muted',
  '--accent-primary', '--accent-hover', '--accent-surface', '--accent-text', '--accent-contrast', '--accent-solid',
  '--status-success', '--status-warning', '--status-danger',
  '--status-success-text', '--status-warning-text', '--status-danger-text',
  '--status-success-surface', '--status-warning-surface', '--status-danger-surface',
  '--status-warning-border',
  '--status-success-solid', '--status-warning-solid', '--status-danger-solid',
  '--focus-ring', '--overlay-scrim', '--nav', '--nav-2',
] as const

function categoria(nomes: readonly `--${string}`[], tipo: CategoriaToken): TokenDoContrato[] {
  return nomes.map((nome) => ({ nome, categoria: tipo }))
}

export const CONTRATO_TOKENS: readonly TokenDoContrato[] = [
  ...categoria(NOMES_DE_COR, 'cor'),
  ...categoria(['--glow-accent', '--shadow-sm', '--shadow-md', '--shadow-overlay'], 'sombra'),
  ...categoria(['--font-sans', '--font-mono'], 'familia'),
  ...categoria(
    ['--font-size-xs', '--font-size-sm', '--font-size-base', '--font-size-md', '--font-size-lg', '--font-size-xl', '--font-size-2xl', '--font-size-3xl'],
    'tamanho',
  ),
  ...categoria(['--font-weight-regular', '--font-weight-medium', '--font-weight-semibold', '--font-weight-bold'], 'peso'),
  ...categoria(['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8', '--space-10', '--space-12'], 'espaco'),
  ...categoria(['--radius-sm', '--radius-md', '--radius-lg'], 'raio'),
]

export const NOMES_DO_CONTRATO: ReadonlySet<string> = new Set(CONTRATO_TOKENS.map((token) => token.nome))
export const TOKENS_DE_COR: readonly string[] = CONTRATO_TOKENS.filter((token) => token.categoria === 'cor').map((token) => token.nome)

/** Tokens estruturais: so em :root, iguais em todos os temas e fora do contrato. */
export const TOKENS_ESTRUTURAIS: readonly string[] = [
  '--line-height-tight', '--line-height-ui', '--line-height-read', '--measure',
  '--focus-ring-width', '--focus-ring-offset', '--touch-target',
  '--rail-width', '--context-bar-height', '--bottom-bar-height',
  '--z-shell', '--z-menu', '--z-modal',
  '--duration-fast', '--easing-standard', '--row-height', '--cell-padding-y',
]

/** Fundos sobre os quais todo texto e medido. */
export const FUNDOS_DE_TEXTO: readonly string[] = ['--bg-surface', '--bg-canvas', '--bg-elevated', '--bg-hover', '--accent-surface']
export const TEXTOS: readonly string[] = ['--text-primary', '--text-secondary', '--text-muted', '--accent-text']
/** Contornos, foco e acento: criterio 1.4.11 da WCAG 2.2, 3 para 1 nos temas. */
export const COMPONENTES: readonly string[] = ['--border-control', '--focus-ring', '--accent-primary']
/** Contornos de container e divisores: o projeto os mede com o mesmo limite de 3 para 1. */
export const CONTORNOS: readonly string[] = ['--border-subtle', '--border-strong', '--border-control']
export const ICONES_DE_STATUS: readonly string[] = ['--status-success', '--status-warning', '--status-danger']
export const FUNDOS_DE_COMPONENTE: readonly string[] = ['--bg-surface', '--bg-canvas', '--bg-elevated']
