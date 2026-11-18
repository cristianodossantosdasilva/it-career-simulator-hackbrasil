import { createContext, useContext } from 'react'
import { TEMA_PADRAO, type TemaShell } from './tema'

export type DensidadeShell = 'editorial' | 'operacional'

export interface ValorShell {
  tema: TemaShell
  definirTema: (tema: TemaShell) => void
}

export const ContextoShell = createContext<ValorShell>({
  tema: TEMA_PADRAO,
  definirTema: () => {},
})

export function useShell(): ValorShell {
  return useContext(ContextoShell)
}
