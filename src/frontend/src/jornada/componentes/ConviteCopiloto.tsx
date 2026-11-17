import { useId } from 'react'
import { CONVITE_COPILOTO } from '../catalogos/catalogoVocacional'

/** Convite informativo. Sem campo de formulário e sem requisição de rede. */
export function ConviteCopiloto() {
  const idTitulo = useId()
  return (
    <section className="convite-copiloto" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="h3">
        {CONVITE_COPILOTO.titulo}
      </h2>
      <p className="pagina-jornada-texto">{CONVITE_COPILOTO.texto}</p>
    </section>
  )
}
