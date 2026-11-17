import type { VoosAtivos } from '../armazenamento/voosAtivos'
import type { IdMissao } from '../catalogos/catalogoRotas'

export type DecisaoInicioCabine =
  /** A sessão em memória já é desta missão. */
  | { tipo: 'usar-memoria' }
  /** Há sessão registrada para a missão em `itfs_voos_ativos`. */
  | { tipo: 'retomar'; sessaoId: string }
  | { tipo: 'criar' }

/**
 * Pura. Decide como a Cabine abre o voo sem nunca duplicar sessão. `nova` sempre cria. Não recebe o
 * modo de demonstração: quem decide se a Cabine pode abrir é o portão.
 */
export function decidirInicioCabine(
  missao: IdMissao,
  emMemoria: { cenarioId: string } | null,
  voosAtivos: VoosAtivos,
  nova: boolean,
): DecisaoInicioCabine {
  if (nova) return { tipo: 'criar' }
  if (emMemoria?.cenarioId === missao) return { tipo: 'usar-memoria' }
  const sessaoId = voosAtivos.porMissao[missao]
  if (sessaoId) return { tipo: 'retomar', sessaoId }
  return { tipo: 'criar' }
}
