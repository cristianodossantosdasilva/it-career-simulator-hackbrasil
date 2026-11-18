import type { ReactNode } from 'react'

/**
 * Link de salto, barra de navegação e região principal de cada página. O h1 da página fica dentro de
 * `#conteudo-pagina`. A barra vem antes do `main`, então o `main` nunca aparece aninhado.
 */
export function MolduraPagina({ barra, children }: { barra?: ReactNode; children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#conteudo-pagina">
        Pular para o conteúdo
      </a>
      {barra}
      <main id="conteudo-pagina">{children}</main>
    </>
  )
}
