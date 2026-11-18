import { MentorView } from '../../educacao/MentorView'
import { useAcademia } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'

/** Treino de explicação: o Mentor de estudo (Feynman, STAR e perguntas à base da trilha). */
export function PaginaTreino() {
  const { estadoAcademia, atualizarEstadoAcademia } = useAcademia()
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.treino}</h1>
        <p className="pagina-jornada-texto">Treine a explicação de um conceito com as suas palavras e receba um retorno por regras fixas.</p>
        <p>
          <LinkInterno
            href={enderecoDe({ pagina: 'aulas', nivel: null, modo: 'lesson', aula: null })}
            className="btn btn-secondary btn-sm"
          >
            Voltar para as Aulas
          </LinkInterno>
        </p>
      </header>
      <MentorView estado={estadoAcademia} onAtualizarEstado={atualizarEstadoAcademia} nivelTitulo={2} />
    </div>
  )
}
