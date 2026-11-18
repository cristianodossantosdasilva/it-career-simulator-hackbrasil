import { CadernoView } from '../../educacao/CadernoView'
import { useAcademia } from '../contextosJornada'

/** Caderno de estudos. CadernoView já tem o h1 com o nome da página. */
export function PaginaCaderno() {
  const { estadoAcademia, atualizarEstadoAcademia } = useAcademia()
  return <CadernoView estado={estadoAcademia} onAtualizarEstado={atualizarEstadoAcademia} />
}
