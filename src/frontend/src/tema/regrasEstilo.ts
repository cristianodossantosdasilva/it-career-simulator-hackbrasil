/**
 * Varredura das regras de estilo do sistema de temas. Sem DOM, importa so blocosTokens.ts para rodar
 * no Vitest e no script de lint (Node com remocao nativa de tipos).
 */
import { classificarBloco, lerBlocos, removerComentarios } from './blocosTokens.ts'

export interface Ocorrencia {
  readonly arquivo: string
  readonly linha: number
  readonly trecho: string
}

const COR_HEX = /#[0-9a-fA-F]+\b/g
const COMPRIMENTOS_VALIDOS = new Set([3, 4, 6, 8])

function contarLinhas(texto: string): number {
  let total = 0
  for (const c of texto) if (c === '\n') total += 1
  return total
}

function corHexNaLinha(linha: string): boolean {
  for (const achado of linha.matchAll(COR_HEX)) {
    if (COMPRIMENTOS_VALIDOS.has(achado[0].length - 1)) return true
  }
  return false
}

/** Linhas de interior de bloco de tema ou de alto contraste (de linhaInicial ate a chave de fechamento). */
function linhasDeBlocosDeToken(css: string): Set<number> {
  const linhas = new Set<number>()
  for (const bloco of lerBlocos(css)) {
    if (classificarBloco(bloco).tipo === 'outro') continue
    const ultima = bloco.linhaInicial + contarLinhas(bloco.corpo)
    for (let linha = bloco.linhaInicial; linha <= ultima; linha += 1) linhas.add(linha)
  }
  return linhas
}

/** Cores hexadecimais de 3, 4, 6 e 8 digitos fora de comentarios. Em `.css`, o interior dos blocos de token e permitido. */
export function hexForaDeBlocos(arquivo: string, texto: string): Ocorrencia[] {
  const ehCss = arquivo.endsWith('.css')
  const semComentarios = removerComentarios(texto, !ehCss)
  const permitidas = ehCss ? linhasDeBlocosDeToken(texto) : new Set<number>()
  const achadas: Ocorrencia[] = []
  semComentarios.split('\n').forEach((linhaBruta, indice) => {
    const numero = indice + 1
    if (permitidas.has(numero)) return
    if (corHexNaLinha(linhaBruta)) achadas.push({ arquivo, linha: numero, trecho: linhaBruta.trim() })
  })
  return achadas
}

/** Qualquer `[data-theme` que nao seja o primeiro seletor de um bloco de tema no nivel superior. */
export function seletoresComTemaForaDeBloco(css: string, arquivo = 'src/index.css'): Ocorrencia[] {
  const achadas: Ocorrencia[] = []
  for (const bloco of lerBlocos(css)) {
    const ehBlocoDeTema = classificarBloco(bloco).tipo === 'tema'
    bloco.seletores.forEach((seletor, posicao) => {
      if (!seletor.includes('[data-theme')) return
      if (ehBlocoDeTema && posicao === 0) return
      achadas.push({ arquivo, linha: bloco.linhaInicial, trecho: seletor })
    })
  }
  return achadas
}
