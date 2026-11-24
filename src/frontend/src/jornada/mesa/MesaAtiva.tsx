import { useMissao } from '../contextosJornada'
import { CabecalhoDaMesa } from './CabecalhoDaMesa'
import { TurnoDaMesa } from './TurnoDaMesa'
import { useEstadoMesa } from './useEstadoMesa'

/** Mesa de Trabalho com a sessão aberta: cabeçalho de progresso e turno com o mapa de chamados. */
export function MesaAtiva({ missao }: { missao: string }) {
  const { sessaoId } = useMissao()
  if (!sessaoId) return null
  return <MesaAtivaComSessao missao={missao} sessaoId={sessaoId} />
}

function MesaAtivaComSessao({ missao, sessaoId }: { missao: string; sessaoId: string }) {
  const estado = useEstadoMesa(sessaoId)
  return (
    <>
      <CabecalhoDaMesa missao={missao} modo={estado.modo} aoMudarModo={estado.setModo} focoId={estado.focoId} />
      <TurnoDaMesa estado={estado} />
    </>
  )
}
