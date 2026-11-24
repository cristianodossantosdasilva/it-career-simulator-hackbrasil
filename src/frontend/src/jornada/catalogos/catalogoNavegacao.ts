import type { NomeIcone } from '../../ui/catalogoIcones'
import { type IdPagina, enderecoDe } from '../navegacao/rotas'
import type { IdMissao } from './catalogoRotas'

export type IdItemMenu = 'inicio' | 'plano' | 'cabine' | 'breve' | 'hangar' | 'aulas' | 'caderno' | 'comandante'

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
  { id: 'plano', rotulo: 'Plano de Carreira', icone: 'plano-de-voo', grupo: 'principal', pagina: 'plano-de-voo' },
  { id: 'cabine', rotulo: 'Mesa de Trabalho', icone: 'laboratorio', grupo: 'principal', pagina: 'cabine' },
  { id: 'breve', rotulo: 'Portfólio', icone: 'breve', grupo: 'principal', pagina: 'breve' },
  { id: 'hangar', rotulo: 'Catálogo', icone: 'hangar', grupo: 'mais', pagina: 'hangar' },
  { id: 'aulas', rotulo: 'Aulas', icone: 'aulas', grupo: 'mais', pagina: 'aulas' },
  { id: 'caderno', rotulo: 'Caderno', icone: 'caderno', grupo: 'mais', pagina: 'caderno' },
  { id: 'comandante', rotulo: 'Mentor', icone: 'mentor', grupo: 'mais', pagina: 'comandante' },
]

/** Endereço do item. A Mesa de Trabalho só aparece com missão ativo: sem missão ativa devolve nulo e o item some. */
export function hrefDoItem(item: ItemMenu, contexto: { missaoAtiva: IdMissao | null }): string | null {
  switch (item.pagina) {
    case 'cabine':
      return contexto.missaoAtiva
        ? enderecoDe({ pagina: 'cabine', missao: contexto.missaoAtiva, semente: null, causa: null, nova: false })
        : null
    case 'aulas':
      return enderecoDe({ pagina: 'aulas', nivel: null, modo: 'lesson', aula: null })
    case 'inicio':
    case 'plano-de-voo':
    case 'breve':
    case 'hangar':
    case 'caderno':
    case 'comandante':
      return enderecoDe({ pagina: item.pagina })
    default:
      return null
  }
}

/** Diagnóstico, Caixa-preta, Treino e 404 são páginas de fluxo e não marcam item. */
export function itemAtivoDoMenu(pagina: IdPagina): IdItemMenu | null {
  return ITENS_MENU.find((item) => item.pagina === pagina)?.id ?? null
}
