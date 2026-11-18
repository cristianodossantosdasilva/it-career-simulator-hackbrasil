import type { ReactNode } from 'react'
import type { DecisaoPortao } from '../navegacao/portoes'
import type { RotaResolvida } from '../navegacao/rotas'
import { Pagina404 } from './Pagina404'
import { PaginaAulas } from './PaginaAulas'
import { PaginaBreve } from './PaginaBreve'
import { PaginaCabine } from './PaginaCabine'
import { PaginaCaderno } from './PaginaCaderno'
import { PaginaCaixaPreta } from './PaginaCaixaPreta'
import { PaginaCheckIn } from './PaginaCheckIn'
import { PaginaComandante } from './PaginaComandante'
import { PaginaHangar } from './PaginaHangar'
import { PaginaInicio } from './PaginaInicio'
import { PaginaPlanoDeVoo } from './PaginaPlanoDeVoo'
import { PaginaTreino } from './PaginaTreino'

/** Cada `IdPagina` renderiza a sua página. A decisão do portão só interessa à Cabine. */
export function renderizarPaginaJornada(rota: RotaResolvida, portao: DecisaoPortao): ReactNode {
  switch (rota.pagina) {
    case 'inicio':
      return <PaginaInicio />
    case 'check-in':
      return <PaginaCheckIn rota={rota} />
    case 'plano-de-voo':
      return <PaginaPlanoDeVoo />
    case 'cabine':
      return <PaginaCabine rota={rota} portao={portao} />
    case 'caixa-preta':
      return <PaginaCaixaPreta rota={rota} />
    case 'breve':
      return <PaginaBreve />
    case 'hangar':
      return <PaginaHangar />
    case 'aulas':
      return <PaginaAulas rota={rota} />
    case 'treino':
      return <PaginaTreino />
    case 'caderno':
      return <PaginaCaderno />
    case 'comandante':
      return <PaginaComandante />
    case 'nao-encontrada':
      return <Pagina404 rota={rota} />
  }
}
