export interface ConteudoKb {
  introducao: string
  passos: string[]
  fecho: string
}

/**
 * Separa a numeracao inline dos artigos ("1) ..., 2) ..., 3) ...") em passos para leitura.
 * Apresentacao apenas: o texto do artigo nao e alterado. Sem numeracao sequencial a partir de 1,
 * devolve o conteudo inteiro como introducao.
 */
export function dividirConteudo(texto: string): ConteudoKb {
  const marcadores = [...texto.matchAll(/(?:^|\s)(\d)\)\s/g)]
  const sequencial = marcadores.length >= 2 && marcadores.every((m, i) => Number(m[1]) === i + 1)
  if (!sequencial) return { introducao: texto, passos: [], fecho: '' }

  const inicio = marcadores[0].index ?? 0
  const introducao = texto.slice(0, inicio).trim()
  const partes = texto
    .slice(inicio)
    .split(/(?:^|\s)\d\)\s/)
    .map((p) => p.trim())
    .filter(Boolean)

  let fecho = ''
  const ultimo = partes[partes.length - 1]
  const corte = ultimo.search(/\.\s+(?=[A-ZÀ-Ý])/)
  if (corte >= 0) {
    fecho = ultimo.slice(corte + 1).trim()
    partes[partes.length - 1] = ultimo.slice(0, corte + 1)
  }
  return { introducao, passos: partes.map((p) => p.replace(/[,;]$/, '')), fecho }
}
