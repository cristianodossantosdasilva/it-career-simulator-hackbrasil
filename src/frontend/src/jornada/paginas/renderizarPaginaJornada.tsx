import type { ReactNode } from 'react'
import type { DecisaoPortao } from '../navegacao/portoes'
import type { RotaResolvida } from '../navegacao/rotas'
import { Pagina404 } from './Pagina404'
import { PaginaAprender } from './PaginaAprender'
import { PaginaAulas } from './PaginaAulas'
import { PaginaBiblioteca } from './PaginaBiblioteca'
import { PaginaCaderno } from './PaginaCaderno'
import { PaginaCarreira } from './PaginaCarreira'
import { PaginaCatalogo } from './PaginaCatalogo'
import { PaginaDiagnostico } from './PaginaDiagnostico'
import { PaginaHistorico } from './PaginaHistorico'
import { PaginaInicio } from './PaginaInicio'
import { PaginaMentor } from './PaginaMentor'
import { PaginaMesa } from './PaginaMesa'
import { PaginaPainel } from './PaginaPainel'
import { PaginaPlanoDeCarreira } from './PaginaPlanoDeCarreira'
import { PaginaPortfolio } from './PaginaPortfolio'
import { PaginaPraticar } from './PaginaPraticar'
import { PaginaProvas } from './PaginaProvas'
import { PaginaReforco } from './PaginaReforco'
import { PaginaRevisao } from './PaginaRevisao'
import { PaginaSimulados } from './PaginaSimulados'
import { PaginaTreino } from './PaginaTreino'

/** Cada `IdPagina` renderiza a sua página. A decisão do portão só interessa à Mesa de Trabalho. */
export function renderizarPaginaJornada(rota: RotaResolvida, portao: DecisaoPortao): ReactNode {
  switch (rota.pagina) {
    case 'inicio':
      return <PaginaInicio />
    case 'carreira':
      return <PaginaCarreira />
    case 'aprender':
      return <PaginaAprender />
    case 'praticar':
      return <PaginaPraticar />
    case 'biblioteca':
      return <PaginaBiblioteca />
    case 'reforco':
      return <PaginaReforco />
    case 'simulados':
      return <PaginaSimulados />
    case 'provas':
      return <PaginaProvas />
    case 'painel':
      return <PaginaPainel />
    case 'historico':
      return <PaginaHistorico />
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
