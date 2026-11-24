import { useCallback, useState } from 'react'
import {
  type ModoCabine,
  gravarMarcasRevisar,
  gravarModoCabine,
  lerMarcasRevisar,
  lerModoCabine,
} from './filaDeChamados'

/** Estado local da Cabine: modo (Treino ou Missão), chamado em foco e chamados marcados para revisar. */
export function useEstadoCabine(sessaoId: string) {
  const [modo, definirModo] = useState<ModoCabine>(lerModoCabine)
  const [focoId, setFocoId] = useState<string | null>(null)
  const [marcas, definirMarcas] = useState<readonly string[]>(() => lerMarcasRevisar(sessaoId))

  const setModo = useCallback((novo: ModoCabine) => {
    definirModo(novo)
    gravarModoCabine(novo)
  }, [])

  const alternarRevisar = useCallback(
    (id: string) => {
      definirMarcas((atuais) => {
        const proximas = atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]
        gravarMarcasRevisar(sessaoId, proximas)
        return proximas
      })
    },
    [sessaoId],
  )

  return { modo, setModo, focoId, setFocoId, marcas, alternarRevisar }
}

export type EstadoCabine = ReturnType<typeof useEstadoCabine>
