import type { MissoesAtivas } from '../armazenamento/missoesAtivas'
import type { IdMissao } from '../catalogos/catalogoRotas'

export type DecisaoInicioMesa =
  /** A sessão em memória já é desta missão. */
  | { tipo: 'usar-memoria' }
  /** Há sessão registrada para a missão em `itfs_voos_ativos`. */
  | { tipo: 'retomar'; sessaoId: string }
  | { tipo: 'criar' }

/**
 * Pura. Decide como a Mesa de Trabalho abre a missão sem nunca duplicar sessão. `nova` sempre cria. Não recebe o
 * modo de demonstração: quem decide se a Mesa de Trabalho pode abrir é o portão.
 */
export function decidirInicioMesa(
  missao: IdMissao,
  emMemoria: { cenarioId: string } | null,
  missoesAtivas: MissoesAtivas,
  nova: boolean,
): DecisaoInicioMesa {
  if (nova) return { tipo: 'criar' }
  if (emMemoria?.cenarioId === missao) return { tipo: 'usar-memoria' }
  const sessaoId = missoesAtivas.porMissao[missao]
  if (sessaoId) return { tipo: 'retomar', sessaoId }
  return { tipo: 'criar' }
}
