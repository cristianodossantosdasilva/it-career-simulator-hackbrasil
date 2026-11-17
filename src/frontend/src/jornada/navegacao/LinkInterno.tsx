import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navegar } from './navegador'

export interface PropsLinkInterno extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  /** Substitui a entrada atual do histórico em vez de acrescentar outra. */
  substituir?: boolean
}

function deveInterceptar(evento: MouseEvent<HTMLAnchorElement>, href: string): boolean {
  if (evento.defaultPrevented) return false
  if (evento.button !== 0) return false
  if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return false
  if (evento.currentTarget.hasAttribute('target')) return false
  if (!href.startsWith('/') || href.startsWith('//')) return false
  try {
    return new URL(href, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Link com `href` real. Só o clique principal sem teclas modificadoras, sem `target` e para a mesma
 * origem é tratado pela aplicação. Os demais seguem o comportamento padrão do navegador.
 */
export function LinkInterno({ href, substituir = false, onClick, ...resto }: PropsLinkInterno) {
  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    onClick?.(evento)
    if (!deveInterceptar(evento, href)) return
    evento.preventDefault()
    navegar(href, { substituir })
  }
  return <a {...resto} href={href} onClick={aoClicar} />
}
