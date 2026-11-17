/** Auxiliares de leitura e gravação defensivas do Armazenamento_Local. Nenhuma função lança erro. */

export type RegistroGenerico = Record<string, unknown>

export function ehObjeto(valor: unknown): valor is RegistroGenerico {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

/** JSON inválido, texto ausente ou valor que não é objeto devolvem nulo. */
export function analisarObjetoJson(texto: string | null): RegistroGenerico | null {
  if (texto === null) return null
  try {
    const valor: unknown = JSON.parse(texto)
    return ehObjeto(valor) ? valor : null
  } catch {
    return null
  }
}

export function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string'
}

export function ehDataIso(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && !Number.isNaN(Date.parse(valor))
}

/** Lê a chave e devolve nulo quando o armazenamento está indisponível. */
export function lerChave(armazenamento: Pick<Storage, 'getItem'>, chave: string): string | null {
  try {
    return armazenamento.getItem(chave)
  } catch {
    return null
  }
}

/** Grava a chave e devolve falso quando o armazenamento recusa (cota esgotada ou indisponível). */
export function gravarChave(armazenamento: Pick<Storage, 'setItem'>, chave: string, texto: string): boolean {
  try {
    armazenamento.setItem(chave, texto)
    return true
  } catch {
    return false
  }
}
