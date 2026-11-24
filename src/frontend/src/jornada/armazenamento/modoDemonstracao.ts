/**
 * Modo_de_Demonstração: atalho para conhecer todas as etapas. Este módulo não importa o cliente da API nem os
 * módulos do cartão, dos registros e das missões ativos, e só conhece a chave `itfs_modo_demonstracao`.
 */
export const CHAVE_MODO_DEMONSTRACAO = 'itfs_modo_demonstracao'

export type OrigemModoDemonstracao = 'plano-de-voo' | 'atalho-experimentar'

export interface ModoDemonstracao {
  versao: 1
  ativo: boolean
  /** Onde a última escolha foi feita. Só informativo. */
  origem: OrigemModoDemonstracao
  /** ISO 8601. */
  alteradoEm: string
}

const ORIGENS: readonly OrigemModoDemonstracao[] = ['plano-de-voo', 'atalho-experimentar']

/** Pura e total: nunca lança. Devolve nulo para qualquer texto fora do formato da versão 1. */
export function analisarModoDemonstracao(texto: string | null): ModoDemonstracao | null {
  if (texto === null) return null
  let dado: unknown
  try {
    dado = JSON.parse(texto)
  } catch {
    return null
  }
  if (typeof dado !== 'object' || dado === null || Array.isArray(dado)) return null
  const { versao, ativo, origem, alteradoEm } = dado as Record<string, unknown>
  if (versao !== 1 || typeof ativo !== 'boolean' || typeof alteradoEm !== 'string') return null
  const origemValida = ORIGENS.find((item) => item === origem)
  if (!origemValida) return null
  return { versao: 1, ativo, origem: origemValida, alteradoEm }
}

export function serializarModoDemonstracao(modo: ModoDemonstracao): string {
  return JSON.stringify(modo)
}

/** Leitura defensiva: devolve falso em qualquer falha. Nunca lança, nunca grava e nunca apaga. */
export function lerModoDemonstracao(armazenamento: Pick<Storage, 'getItem'>): boolean {
  let texto: string | null
  try {
    texto = armazenamento.getItem(CHAVE_MODO_DEMONSTRACAO)
  } catch {
    return false
  }
  return analisarModoDemonstracao(texto)?.ativo === true
}

/** Grava só a chave do modo. Devolve falso se `setItem` lançar. Desativar grava `ativo: false`. */
export function gravarModoDemonstracao(armazenamento: Pick<Storage, 'setItem'>, modo: ModoDemonstracao): boolean {
  try {
    armazenamento.setItem(CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao(modo))
    return true
  } catch {
    return false
  }
}
