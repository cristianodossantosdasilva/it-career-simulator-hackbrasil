/**
 * Persistencia da preferencia do aluno. So duas chaves, nenhuma migracao: qualquer texto fora do catalogo
 * em `itfs_tema` e preferencia ausente, e a leitura nunca grava.
 */
import { type IdTema, ehIdTema } from './catalogo.ts'

export const CHAVE_TEMA = 'itfs_tema'
export const CHAVE_CONTRASTE = 'itfs_contraste'

export type EstadoContraste = 'alto' | 'padrao'

export interface ArmazenamentoChaveValor {
  getItem(chave: string): string | null
  setItem(chave: string, valor: string): void
}

/** Retorna null quando window.localStorage nao existe ou o acesso lanca excecao. */
export function obterArmazenamento(janela: Window): ArmazenamentoChaveValor | null {
  try {
    return janela.localStorage ?? null
  } catch {
    return null
  }
}

function ler(armazenamento: ArmazenamentoChaveValor | null, chave: string): string | null {
  if (armazenamento === null) return null
  try {
    return armazenamento.getItem(chave)
  } catch {
    return null
  }
}

function gravar(armazenamento: ArmazenamentoChaveValor | null, chave: string, valor: string): boolean {
  if (armazenamento === null) return false
  try {
    armazenamento.setItem(chave, valor)
    return true
  } catch {
    return false
  }
}

/** Valor exatamente igual a um IdTema, ou null. Excecao de leitura vira null. */
export function lerPreferenciaTema(armazenamento: ArmazenamentoChaveValor | null): IdTema | null {
  const valor = ler(armazenamento, CHAVE_TEMA)
  return ehIdTema(valor) ? valor : null
}

/** true quando gravou. Excecao de gravacao vira false, sem propagar. */
export function salvarPreferenciaTema(id: IdTema, armazenamento: ArmazenamentoChaveValor | null): boolean {
  return gravar(armazenamento, CHAVE_TEMA, id)
}

/** `alto` so quando o valor salvo e exatamente `alto`. Qualquer outro caso: `padrao`. */
export function lerContraste(armazenamento: ArmazenamentoChaveValor | null): EstadoContraste {
  return ler(armazenamento, CHAVE_CONTRASTE) === 'alto' ? 'alto' : 'padrao'
}

export function salvarContraste(estado: EstadoContraste, armazenamento: ArmazenamentoChaveValor | null): boolean {
  return gravar(armazenamento, CHAVE_CONTRASTE, estado)
}
