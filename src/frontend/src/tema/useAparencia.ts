import { useSyncExternalStore } from 'react'
import { type ArmazemAparencia, type InstantaneoAparencia, obterArmazemAparencia } from './armazemAparencia.ts'

export interface ResultadoUseAparencia extends InstantaneoAparencia, Pick<ArmazemAparencia, 'escolherTema' | 'definirContraste'> {}

export function useAparencia(armazem: ArmazemAparencia = obterArmazemAparencia()): ResultadoUseAparencia {
  const instantaneo = useSyncExternalStore(armazem.assinar, armazem.obter, armazem.obter)
  return { ...instantaneo, escolherTema: armazem.escolherTema, definirContraste: armazem.definirContraste }
}
