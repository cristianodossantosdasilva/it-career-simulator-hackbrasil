import { useCallback, useState } from 'react'
import {
  type ModoMesa,
  gravarMarcasRevisar,
  gravarModoMesa,
  lerMarcasRevisar,
  lerModoMesa,
} from './filaDeChamados'

/** Estado local da Mesa de Trabalho: modo (Treino ou Missão), chamado em foco e chamados marcados para revisar. */
export function useEstadoMesa(sessaoId: string) {
  const [modo, definirModo] = useState<ModoMesa>(lerModoMesa)
  const [focoId, setFocoId] = useState<string | null>(null)
  const [marcas, definirMarcas] = useState<readonly string[]>(() => lerMarcasRevisar(sessaoId))

  const setModo = useCallback((novo: ModoMesa) => {
    definirModo(novo)
    gravarModoMesa(novo)
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

export type EstadoMesa = ReturnType<typeof useEstadoMesa>
