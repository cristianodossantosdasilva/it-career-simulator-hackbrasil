/** Grava a aparencia no elemento html. So atributos e classe: nunca estilo inline. */
import { type IdTema, TEMA_PADRAO_PRODUTO, ehIdTema, obterTema } from './catalogo.ts'
import type { EstadoContraste } from './persistencia.ts'

export const ATRIBUTO_CONTRASTE = 'data-contraste'
export const VALOR_CONTRASTE_ALTO = 'alto'
export const CLASSE_ESCURO = 'dark'

/** Grava data-theme, a classe dark e data-contraste. Identificador invalido vira o tema padrao do produto. */
export function aplicarAparencia(raiz: HTMLElement, tema: string, contraste: EstadoContraste): IdTema {
  const id: IdTema = ehIdTema(tema) ? tema : TEMA_PADRAO_PRODUTO
  raiz.dataset.theme = id
  raiz.classList.toggle(CLASSE_ESCURO, obterTema(id).esquema === 'escuro')
  if (contraste === 'alto') raiz.setAttribute(ATRIBUTO_CONTRASTE, VALOR_CONTRASTE_ALTO)
  else raiz.removeAttribute(ATRIBUTO_CONTRASTE)
  return id
}

/** Le o estado que o script inicial deixou no html. */
export function lerAparenciaDoDocumento(raiz: HTMLElement): { tema: IdTema | null; contraste: EstadoContraste } {
  const tema = raiz.dataset.theme
  return {
    tema: ehIdTema(tema) ? tema : null,
    contraste: raiz.getAttribute(ATRIBUTO_CONTRASTE) === VALOR_CONTRASTE_ALTO ? 'alto' : 'padrao',
  }
}
