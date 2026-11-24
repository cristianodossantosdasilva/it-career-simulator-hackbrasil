import type { NomeIcone } from '../../ui/catalogoIcones'
import { type IdPagina, enderecoDe } from '../navegacao/rotas'
import type { IdMissao } from './catalogoRotas'

export type IdItemMenu = 'inicio' | 'plano' | 'mesa-de-trabalho' | 'portfolio' | 'catalogo' | 'aulas' | 'caderno' | 'mentor'

export interface ItemMenu {
  id: IdItemMenu
  rotulo: string
  icone: NomeIcone
  /** principal: barra inferior no celular. mais: lista aberta pelo botão Mais no celular. */
  grupo: 'principal' | 'mais'
  /** Página que o item marca como atual. */
  pagina: IdPagina
}

export const ITENS_MENU: readonly ItemMenu[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'marca', grupo: 'principal', pagina: 'inicio' },
  { id: 'plano', rotulo: 'Plano de Carreira', icone: 'plano-de-carreira', grupo: 'principal', pagina: 'plano-de-carreira' },
  { id: 'mesa-de-trabalho', rotulo: 'Mesa de Trabalho', icone: 'laboratorio', grupo: 'principal', pagina: 'mesa-de-trabalho' },
  { id: 'portfolio', rotulo: 'Portfólio', icone: 'portfolio', grupo: 'principal', pagina: 'portfolio' },
  { id: 'catalogo', rotulo: 'Catálogo', icone: 'catalogo', grupo: 'mais', pagina: 'catalogo' },
  { id: 'aulas', rotulo: 'Aulas', icone: 'aulas', grupo: 'mais', pagina: 'aulas' },
  { id: 'caderno', rotulo: 'Caderno', icone: 'caderno', grupo: 'mais', pagina: 'caderno' },
  { id: 'mentor', rotulo: 'Mentor', icone: 'mentor', grupo: 'mais', pagina: 'mentor' },
]

/** Endereço do item. A Mesa de Trabalho só aparece com missão ativa: sem missão ativa devolve nulo e o item some. */
export function hrefDoItem(item: ItemMenu, contexto: { missaoAtiva: IdMissao | null }): string | null {
  switch (item.pagina) {
    case 'mesa-de-trabalho':
      return contexto.missaoAtiva
        ? enderecoDe({ pagina: 'mesa-de-trabalho', missao: contexto.missaoAtiva, semente: null, causa: null, nova: false })
        : null
    case 'aulas':
      return enderecoDe({ pagina: 'aulas', nivel: null, modo: 'lesson', aula: null })
    case 'inicio':
    case 'plano-de-carreira':
    case 'portfolio':
    case 'catalogo':
    case 'caderno':
    case 'mentor':
      return enderecoDe({ pagina: item.pagina })
    default:
      return null
  }
}

/** Diagnóstico, Revisão, Treino e 404 são páginas de fluxo e não marcam item. */
export function itemAtivoDoMenu(pagina: IdPagina): IdItemMenu | null {
  return ITENS_MENU.find((item) => item.pagina === pagina)?.id ?? null
}
