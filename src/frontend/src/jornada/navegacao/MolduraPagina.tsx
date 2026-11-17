import type { ReactNode } from 'react'

/** Link de salto e região principal de cada página. O h1 da página fica dentro de `#conteudo-pagina`. */
export function MolduraPagina({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#conteudo-pagina">
        Pular para o conteúdo
      </a>
      <main id="conteudo-pagina">{children}</main>
    </>
  )
}
