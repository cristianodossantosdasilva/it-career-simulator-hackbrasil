import { createContext, useContext } from 'react'
import { TEMA_PADRAO, type TemaShell } from './tema'

export type DensidadeShell = 'editorial' | 'operacional'

export interface ValorShell {
  tema: TemaShell
  definirTema: (tema: TemaShell) => void
  /** Existe uma sessao de laboratorio em memoria que pode ser retomada. */
  sessaoAtiva: boolean
  /** Volta para a sessao em andamento sem criar uma nova. */
  retomarLaboratorio?: () => void
}

export const ContextoShell = createContext<ValorShell>({
  tema: TEMA_PADRAO,
  definirTema: () => {},
  sessaoAtiva: false,
})

export function useShell(): ValorShell {
  return useContext(ContextoShell)
}
