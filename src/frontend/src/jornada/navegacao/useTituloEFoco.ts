import { useEffect } from 'react'
import type { LocalAtual } from './navegador'
import { tituloDocumento } from './rotas'

/**
 * Define o título do documento com o nome da página. Fora da carga inicial, leva o foco ao h1 da
 * página (`#conteudo-pagina h1`), para que leitores de tela anunciem a troca de página.
 */
export function useTituloEFoco(nome: string, local: LocalAtual): void {
  useEffect(() => {
    document.title = tituloDocumento(nome)
  }, [nome])

  useEffect(() => {
    if (local.origem === 'inicial') return
    const titulo = document.querySelector<HTMLElement>('#conteudo-pagina h1')
    if (!titulo) return
    if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1')
    titulo.focus()
  }, [local.chave, local.origem])
}
