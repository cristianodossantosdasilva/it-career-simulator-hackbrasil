import type { IdMissao } from '../catalogos/catalogoRotas'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { type DestinoDaPratica, destinoDaPratica } from './destinoDaPratica'

/** Destino de prática de uma Missão pelos registros de missão e pelo modo de demonstração deste navegador. */
export function useDestinoDaPratica(): (missao: IdMissao) => DestinoDaPratica {
  const { registros, modoDemonstracao } = useArmazenamentoJornada()
  return (missao) => destinoDaPratica(missao, registros, modoDemonstracao)
}
