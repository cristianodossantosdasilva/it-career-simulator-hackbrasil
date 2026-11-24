import type { NomeIcone } from '../../ui/catalogoIcones'
import { type IdPagina, enderecoDe } from '../navegacao/rotas'
import type { IdMissao } from './catalogoRotas'

export type IdItemMenu =
  | 'inicio'
  | 'carreira'
  | 'aprender'
  | 'praticar'
  | 'biblioteca'
  | 'reforco'
  | 'simulados'
  | 'provas'
  | 'painel'
  | 'historico'
  | 'portfolio'
  | 'mentor'

export type SecaoMenu = 'Estudo' | 'Avaliar' | 'Progresso'

export interface ItemMenu {
  id: IdItemMenu
  rotulo: string
  icone: NomeIcone
  secao: SecaoMenu
  /** principal: barra inferior no celular. mais: lista aberta pelo botão Mais no celular. */
  grupo: 'principal' | 'mais'
  /** Página que o item marca como atual. */
  pagina: IdPagina
}

export const SECOES_MENU: readonly SecaoMenu[] = ['Estudo', 'Avaliar', 'Progresso']

export const ITENS_MENU: readonly ItemMenu[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'marca', secao: 'Estudo', grupo: 'principal', pagina: 'inicio' },
  { id: 'carreira', rotulo: 'Carreira', icone: 'carreira', secao: 'Estudo', grupo: 'principal', pagina: 'carreira' },
  { id: 'aprender', rotulo: 'Aprender', icone: 'aprender', secao: 'Estudo', grupo: 'mais', pagina: 'aprender' },
  { id: 'praticar', rotulo: 'Praticar', icone: 'praticar', secao: 'Estudo', grupo: 'mais', pagina: 'praticar' },
  { id: 'biblioteca', rotulo: 'Biblioteca', icone: 'biblioteca', secao: 'Estudo', grupo: 'mais', pagina: 'biblioteca' },
  { id: 'reforco', rotulo: 'Reforço diário', icone: 'reforco', secao: 'Estudo', grupo: 'mais', pagina: 'reforco' },
  { id: 'simulados', rotulo: 'Simulados', icone: 'simulados', secao: 'Avaliar', grupo: 'principal', pagina: 'simulados' },
  { id: 'provas', rotulo: 'Provas', icone: 'provas', secao: 'Avaliar', grupo: 'mais', pagina: 'provas' },
  { id: 'painel', rotulo: 'Painel', icone: 'painel', secao: 'Progresso', grupo: 'principal', pagina: 'painel' },
  { id: 'historico', rotulo: 'Histórico', icone: 'historico', secao: 'Progresso', grupo: 'mais', pagina: 'historico' },
  { id: 'portfolio', rotulo: 'Portfólio', icone: 'portfolio', secao: 'Progresso', grupo: 'mais', pagina: 'portfolio' },
  { id: 'mentor', rotulo: 'Mentor', icone: 'mentor', secao: 'Progresso', grupo: 'mais', pagina: 'mentor' },
]

/** Endereço do item no novo menu. */
export function hrefDoItem(item: ItemMenu, _contexto: { missaoAtiva: IdMissao | null }): string | null {
  switch (item.pagina) {
    case 'inicio':
    case 'carreira':
    case 'aprender':
    case 'praticar':
    case 'biblioteca':
    case 'reforco':
    case 'simulados':
    case 'provas':
    case 'painel':
    case 'historico':
    case 'portfolio':
    case 'mentor':
      return enderecoDe({ pagina: item.pagina })
    default:
      return null
  }
}

/** Páginas de fluxo e rotas legadas não marcam item fora do catálogo do menu. */
export function itemAtivoDoMenu(pagina: IdPagina): IdItemMenu | null {
  return ITENS_MENU.find((item) => item.pagina === pagina)?.id ?? null
}
