import type { ReactNode } from 'react'
import type { DecisaoPortao } from '../navegacao/portoes'
import type { RotaResolvida } from '../navegacao/rotas'
import { Pagina404 } from './Pagina404'
import { PaginaAulas } from './PaginaAulas'
import { PaginaPortfolio } from './PaginaPortfolio'
import { PaginaMesa } from './PaginaMesa'
import { PaginaCaderno } from './PaginaCaderno'
import { PaginaRevisao } from './PaginaRevisao'
import { PaginaDiagnostico } from './PaginaDiagnostico'
import { PaginaMentor } from './PaginaMentor'
import { PaginaCatalogo } from './PaginaCatalogo'
import { PaginaInicio } from './PaginaInicio'
import { PaginaPlanoDeCarreira } from './PaginaPlanoDeCarreira'
import { PaginaTreino } from './PaginaTreino'

/** Cada `IdPagina` renderiza a sua página. A decisão do portão só interessa à Mesa de Trabalho. */
export function renderizarPaginaJornada(rota: RotaResolvida, portao: DecisaoPortao): ReactNode {
  switch (rota.pagina) {
    case 'inicio':
      return <PaginaInicio />
    case 'diagnostico':
      return <PaginaDiagnostico rota={rota} />
    case 'plano-de-carreira':
      return <PaginaPlanoDeCarreira />
    case 'mesa-de-trabalho':
      return <PaginaMesa rota={rota} portao={portao} />
    case 'revisao':
      return <PaginaRevisao rota={rota} />
    case 'portfolio':
      return <PaginaPortfolio />
    case 'catalogo':
      return <PaginaCatalogo />
    case 'aulas':
      return <PaginaAulas rota={rota} />
    case 'treino':
      return <PaginaTreino />
    case 'caderno':
      return <PaginaCaderno />
    case 'mentor':
      return <PaginaMentor />
    case 'nao-encontrada':
      return <Pagina404 rota={rota} />
  }
}
