import { useId, type ReactNode } from 'react'

interface PropsGrupoVertente {
  nome: string
  /** h3 no Plano de Carreira, h4 no Catálogo e no Portfólio. */
  nivelTitulo: 3 | 4
  children: ReactNode
}

/** Vertente da N3 Sênior como grupo com nome acessível igual ao título visível. */
export function GrupoVertente({ nome, nivelTitulo, children }: PropsGrupoVertente) {
  const idTitulo = useId()
  const Titulo = nivelTitulo === 3 ? 'h3' : 'h4'
  return (
    <div className="grupo-vertente" role="group" aria-labelledby={idTitulo}>
      <Titulo className="grupo-vertente-titulo" id={idTitulo}>
        {nome}
      </Titulo>
      {children}
    </div>
  )
}
