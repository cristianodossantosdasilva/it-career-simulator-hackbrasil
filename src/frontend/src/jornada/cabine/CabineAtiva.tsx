import { useVoo } from '../contextosJornada'
import { CabecalhoDaCabine } from './CabecalhoDaCabine'
import { TurnoDaCabine } from './TurnoDaCabine'
import { useEstadoCabine } from './useEstadoCabine'

/** Mesa de Trabalho com a sessão aberta: cabeçalho de progresso e turno com o mapa de chamados. */
export function CabineAtiva({ missao }: { missao: string }) {
  const { sessaoId } = useVoo()
  if (!sessaoId) return null
  return <CabineAtivaComSessao missao={missao} sessaoId={sessaoId} />
}

function CabineAtivaComSessao({ missao, sessaoId }: { missao: string; sessaoId: string }) {
  const estado = useEstadoCabine(sessaoId)
  return (
    <>
      <CabecalhoDaCabine missao={missao} modo={estado.modo} aoMudarModo={estado.setModo} focoId={estado.focoId} />
      <TurnoDaCabine estado={estado} />
    </>
  )
}
