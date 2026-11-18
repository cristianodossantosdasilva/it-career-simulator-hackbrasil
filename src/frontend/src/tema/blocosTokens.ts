/**
 * Analisador minimo de CSS para os blocos de token. Sem DOM e sem dependencia externa: roda no
 * Vitest e no Node (script de varredura), por isso importa so arquivos .ts com a extensao.
 */
import type { EsquemaCor } from './catalogo.ts'
import { NOMES_DO_CONTRATO, TOKENS_DE_COR } from './contratoTokens.ts'

export interface BlocoCss {
  readonly seletores: readonly string[]
  readonly corpo: string
  /** Linha (1 a partir do inicio do texto) da chave de abertura. O corpo comeca logo depois dela. */
  readonly linhaInicial: number
  /** Texto de abertura da regra de grupo (por exemplo `@media (...)`) que contem o bloco, ou null no nivel superior. */
  readonly contexto: string | null
}

export interface Declaracao {
  readonly nome: string
  readonly valor: string
  readonly linha: number
}

/** Troca cada comentario por espacos, mantendo as quebras de linha, para preservar a numeracao. Comentario de linha so em TypeScript. */
export function removerComentarios(css: string, aceitarComentarioDeLinha = false): string {
  let saida = ''
  let i = 0
  let aspas: string | null = null
  while (i < css.length) {
    const c = css[i]
    if (aspas !== null) {
      saida += c
      if (c === '\\' && i + 1 < css.length) {
        saida += css[i + 1]
        i += 2
        continue
      }
      // aspas simples e duplas nao atravessam linhas: uma aspa solta nao engole o resto do arquivo
      if (c === aspas || (c === '\n' && aspas !== '`')) aspas = null
      i += 1
      continue
    }
    if (c === '"' || c === "'" || (aceitarComentarioDeLinha && c === '`')) {
      aspas = c
      saida += c
      i += 1
      continue
    }
    if (aceitarComentarioDeLinha && c === '/' && css[i + 1] === '/') {
      let fim = css.indexOf('\n', i)
      if (fim === -1) fim = css.length
      saida += ' '.repeat(fim - i)
      i = fim
      continue
    }
    if (c === '/' && css[i + 1] === '*') {
      const fim = css.indexOf('*/', i + 2)
      const fecho = fim === -1 ? css.length : fim + 2
      saida += css.slice(i, fecho).replace(/[^\n]/g, ' ')
      i = fecho
      continue
    }
    saida += c
    i += 1
  }
  return saida
}

function contarLinhas(texto: string): number {
  let total = 0
  for (const c of texto) if (c === '\n') total += 1
  return total
}

function dividirSeletores(texto: string): string[] {
  const partes: string[] = []
  let profundidade = 0
  let aspas: string | null = null
  let atual = ''
  for (const c of texto) {
    if (aspas !== null) {
      atual += c
      if (c === aspas) aspas = null
      continue
    }
    if (c === '"' || c === "'") {
      aspas = c
      atual += c
    } else if (c === '(' || c === '[') {
      profundidade += 1
      atual += c
    } else if (c === ')' || c === ']') {
      profundidade -= 1
      atual += c
    } else if (c === ',' && profundidade === 0) {
      partes.push(atual)
      atual = ''
    } else {
      atual += c
    }
  }
  partes.push(atual)
  return partes.map((parte) => parte.replace(/\s+/g, ' ').trim()).filter((parte) => parte !== '')
}

const REGRAS_DE_GRUPO = /^@(media|supports|layer|container)\b/i

function percorrer(css: string, linhaBase: number, contexto: string | null, saida: BlocoCss[]): void {
  let i = 0
  let inicioPreludio = 0
  while (i < css.length) {
    const c = css[i]
    if (c === '"' || c === "'") {
      const fim = fecharAspas(css, i)
      i = fim
      continue
    }
    if (c === ';') {
      // regra sem corpo, como @import: descartada
      inicioPreludio = i + 1
      i += 1
      continue
    }
    if (c === '{') {
      const preludio = css.slice(inicioPreludio, i).trim()
      const fim = acharFecho(css, i)
      const corpo = css.slice(i + 1, fim)
      const linhaChave = linhaBase + contarLinhas(css.slice(0, i))
      if (REGRAS_DE_GRUPO.test(preludio)) {
        percorrer(corpo, linhaChave, preludio.replace(/\s+/g, ' '), saida)
      } else {
        saida.push({ seletores: dividirSeletores(preludio), corpo, linhaInicial: linhaChave, contexto })
      }
      i = fim + 1
      inicioPreludio = i
      continue
    }
    i += 1
  }
}

function fecharAspas(css: string, inicio: number): number {
  const aspas = css[inicio]
  let i = inicio + 1
  while (i < css.length) {
    if (css[i] === '\\') {
      i += 2
      continue
    }
    if (css[i] === aspas) return i + 1
    i += 1
  }
  return css.length
}

function acharFecho(css: string, abertura: number): number {
  let profundidade = 0
  let i = abertura
  while (i < css.length) {
    const c = css[i]
    if (c === '"' || c === "'") {
      i = fecharAspas(css, i)
      continue
    }
    if (c === '{') profundidade += 1
    if (c === '}') {
      profundidade -= 1
      if (profundidade === 0) return i
    }
    i += 1
  }
  return css.length
}

/** Blocos de regra do arquivo. Regras dentro de @media e @supports vem com o seletor original e o contexto. */
export function lerBlocos(css: string): BlocoCss[] {
  const saida: BlocoCss[] = []
  percorrer(removerComentarios(css), 1, null, saida)
  return saida
}

function dividirDeclaracoes(corpo: string): { texto: string; deslocamento: number }[] {
  const partes: { texto: string; deslocamento: number }[] = []
  let profundidade = 0
  let aspas: string | null = null
  let atual = ''
  let inicio = 0
  for (let i = 0; i < corpo.length; i += 1) {
    const c = corpo[i]
    if (aspas !== null) {
      atual += c
      if (c === aspas) aspas = null
      continue
    }
    if (c === '"' || c === "'") {
      aspas = c
      atual += c
    } else if (c === '(') {
      profundidade += 1
      atual += c
    } else if (c === ')') {
      profundidade -= 1
      atual += c
    } else if (c === ';' && profundidade === 0) {
      partes.push({ texto: atual, deslocamento: inicio })
      atual = ''
      inicio = i + 1
    } else {
      atual += c
    }
  }
  partes.push({ texto: atual, deslocamento: inicio })
  return partes
}

export function lerDeclaracoes(bloco: BlocoCss): Declaracao[] {
  const corpo = removerComentarios(bloco.corpo)
  const declaracoes: Declaracao[] = []
  for (const parte of dividirDeclaracoes(corpo)) {
    const dois = parte.texto.indexOf(':')
    if (dois === -1) continue
    const nome = parte.texto.slice(0, dois).trim()
    if (nome === '' || nome.includes('{') || nome.includes('}')) continue
    const valor = parte.texto.slice(dois + 1).replace(/\s+/g, ' ').trim()
    const antes = corpo.slice(0, parte.deslocamento + parte.texto.length - parte.texto.trimStart().length)
    declaracoes.push({ nome, valor, linha: bloco.linhaInicial + contarLinhas(antes) })
  }
  return declaracoes
}

export function serializarBloco(seletores: readonly string[], tokens: Readonly<Record<string, string>>): string {
  const linhas = Object.entries(tokens).map(([nome, valor]) => `  ${nome}: ${valor};`)
  return `${seletores.join(',\n')} {\n${linhas.join('\n')}\n}\n`
}

export type TipoBloco =
  | { readonly tipo: 'tema'; readonly id: string }
  | { readonly tipo: 'alto-contraste'; readonly esquema: EsquemaCor }
  | { readonly tipo: 'outro' }

const SELETOR_DE_TEMA = /^\[data-theme='([a-z][a-z0-9-]*)'\]$/
const SELETOR_AC_CLARO = "html[data-contraste='alto']:not(.dark)"
const SELETOR_AC_ESCURO = "html[data-contraste='alto'].dark"

export function classificarBloco(bloco: BlocoCss): TipoBloco {
  if (bloco.contexto !== null || bloco.seletores.length === 0) return { tipo: 'outro' }
  const primeiro = bloco.seletores[0]
  const tema = SELETOR_DE_TEMA.exec(primeiro)
  if (tema !== null) return { tipo: 'tema', id: tema[1] }
  if (primeiro === SELETOR_AC_CLARO) return { tipo: 'alto-contraste', esquema: 'claro' }
  if (primeiro === SELETOR_AC_ESCURO) return { tipo: 'alto-contraste', esquema: 'escuro' }
  return { tipo: 'outro' }
}

/** Chave: id do tema, `alto-contraste-claro` ou `alto-contraste-escuro`. Valor: declaracoes do bloco. */
export function blocosDeToken(css: string): Map<string, Record<string, string>> {
  const mapa = new Map<string, Record<string, string>>()
  for (const bloco of lerBlocos(css)) {
    const tipo = classificarBloco(bloco)
    if (tipo.tipo === 'outro') continue
    const chave = tipo.tipo === 'tema' ? tipo.id : `alto-contraste-${tipo.esquema}`
    const tokens = mapa.get(chave) ?? {}
    for (const declaracao of lerDeclaracoes(bloco)) tokens[declaracao.nome] = declaracao.valor
    mapa.set(chave, tokens)
  }
  return mapa
}

export interface ResultadoContrato {
  readonly ausentes: string[]
  readonly vazios: string[]
  readonly excedentes: string[]
}

/** Confere um bloco contra o contrato. Para os conjuntos de alto contraste, passe `TOKENS_DE_COR`. */
export function conferirContrato(
  tokens: Readonly<Record<string, string>>,
  esperados: ReadonlySet<string> = NOMES_DO_CONTRATO,
): ResultadoContrato {
  const ausentes: string[] = []
  const vazios: string[] = []
  for (const nome of esperados) {
    if (!(nome in tokens)) ausentes.push(nome)
    else if (tokens[nome].trim() === '') vazios.push(nome)
  }
  const excedentes = Object.keys(tokens).filter((nome) => !esperados.has(nome))
  return { ausentes, vazios, excedentes }
}

export const NOMES_DE_COR: ReadonlySet<string> = new Set(TOKENS_DE_COR)

export interface DiferencaIdentificadores {
  readonly semBloco: string[]
  readonly semCatalogo: string[]
}

export function compararIdentificadores(catalogo: readonly string[], blocos: readonly string[]): DiferencaIdentificadores {
  const noCatalogo = new Set(catalogo)
  const nosBlocos = new Set(blocos)
  return {
    semBloco: catalogo.filter((id) => !nosBlocos.has(id)),
    semCatalogo: blocos.filter((id) => !noCatalogo.has(id)),
  }
}
