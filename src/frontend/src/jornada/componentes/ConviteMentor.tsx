import { useId } from 'react'
import { CONVITE_MENTOR } from '../catalogos/catalogoVocacional'

/** Convite informativo. Sem campo de formulário e sem requisição de rede. */
export function ConviteMentor() {
  const idTitulo = useId()
  return (
    <section className="convite-mentor" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="h3">
        {CONVITE_MENTOR.titulo}
      </h2>
      <p className="pagina-jornada-texto">{CONVITE_MENTOR.texto}</p>
    </section>
  )
}
