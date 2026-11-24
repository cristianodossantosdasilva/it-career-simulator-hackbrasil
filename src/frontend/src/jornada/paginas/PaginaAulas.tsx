import { AulasView } from '../../educacao/AulasView'
import { LEVELS } from '../../educacao/catalogoEducacional'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { useAcademia } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, type RotaResolvida, enderecoDe } from '../navegacao/rotas'
import { useDestinoDaPratica } from '../navegacao/usarDestinoDaPratica'

type RotaAulas = Extract<RotaResolvida, { pagina: 'aulas' }>

/**
 * Aulas: nível, modo e aula vêm dos parâmetros do endereço. O conteúdo é o de AulasView, sem mudança de
 * comportamento. Sem nível no endereço, vale o nível em foco da Academia.
 */
export function PaginaAulas({ rota }: { rota: RotaAulas }) {
  const { estadoAcademia, atualizarEstadoAcademia } = useAcademia()
  const nivel = rota.nivel ?? estadoAcademia.focus
  const destinoDaPratica = useDestinoDaPratica()

  function irParaCaderno(paginaId: string) {
    atualizarEstadoAcademia((anterior) => ({ ...anterior, activePage: paginaId }))
    navegar(enderecoDe({ pagina: 'caderno' }))
  }

  /** Etapa liberada (ou modo de demonstração): Mesa de Trabalho da missão. Bloqueada: Plano de Carreira, nunca a Mesa de Trabalho. */
  function iniciarLaboratorio(cenarioId: IdMissao) {
    navegar(destinoDaPratica(cenarioId).endereco)
  }

  function avisoDaPratica(cenarioId: IdMissao): string | null {
    const destino = destinoDaPratica(cenarioId)
    return destino.tipo === 'plano-de-carreira' ? destino.aviso : null
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.aulas}</h1>
        <p className="pagina-jornada-texto">Aulas curtas e flashcards por nível, para estudar antes de ir à Mesa de Trabalho.</p>
        <nav aria-label="Níveis das aulas" className="acoes-linha">
          {LEVELS.map((item) => (
            <LinkInterno
              key={item.id}
              href={enderecoDe({ pagina: 'aulas', nivel: item.id, modo: 'lesson', aula: null })}
              className={item.id === nivel ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              aria-current={item.id === nivel ? 'page' : undefined}
            >
              {item.nome}
            </LinkInterno>
          ))}
          <LinkInterno href={enderecoDe({ pagina: 'treino' })} className="btn btn-secondary btn-sm">
            {NOME_PAGINA.treino}
          </LinkInterno>
        </nav>
      </header>
      <AulasView
        key={`${nivel}-${rota.modo}-${rota.aula ?? ''}`}
        estado={estadoAcademia}
        nivel={nivel}
        modoInicial={rota.modo}
        aulaInicialId={rota.aula ?? undefined}
        onAtualizarEstado={atualizarEstadoAcademia}
        onIrParaCaderno={irParaCaderno}
        onIniciarLaboratorio={iniciarLaboratorio}
        avisoDaPratica={avisoDaPratica}
        nivelTitulo={2}
      />
    </div>
  )
}
