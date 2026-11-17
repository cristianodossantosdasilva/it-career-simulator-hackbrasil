import { Icone } from '../../ui/Icone'
import { APRESENTACAO_STATUS, type StatusDisponibilidade } from '../catalogos/status'

/** Estado de disponibilidade em texto e ícone, nunca só por cor. */
export function SeloStatus({ status }: { status: StatusDisponibilidade }) {
  const { texto, icone } = APRESENTACAO_STATUS[status]
  return (
    <span className={`selo-status selo-status-${status}`}>
      <Icone nome={icone} tamanho={16} />
      <span>{texto}</span>
    </span>
  )
}
