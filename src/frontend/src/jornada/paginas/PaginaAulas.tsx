import { AulasView } from '../../educacao/AulasView'
import { LEVELS } from '../../educacao/catalogoEducacional'
import { ehIdMissao } from '../catalogos/catalogoRotas'
import { useAcademia } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, type RotaResolvida, enderecoDe } from '../navegacao/rotas'

type RotaAulas = Extract<RotaResolvida, { pagina: 'aulas' }>

/**
 * Aulas: nível, modo e aula vêm dos parâmetros do endereço. O conteúdo é o de AulasView, sem mudança de
 * comportamento. Sem nível no endereço, vale o nível em foco da Academia.
 */
export function PaginaAulas({ rota }: { rota: RotaAulas }) {
  const { estadoAcademia, atualizarEstadoAcademia } = useAcademia()
  const nivel = rota.nivel ?? estadoAcademia.focus

  function irParaCaderno(paginaId: string) {
    atualizarEstadoAcademia((anterior) => ({ ...anterior, activePage: paginaId }))
    navegar(enderecoDe({ pagina: 'caderno' }))
  }

  function iniciarLaboratorio(cenarioId: string) {
    // Os portões da Cabine decidem se a missão já pode ser aberta.
    navegar(
      ehIdMissao(cenarioId)
        ? enderecoDe({ pagina: 'cabine', missao: cenarioId, semente: null, causa: null, nova: false })
        : enderecoDe({ pagina: 'plano-de-voo' }),
    )
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.aulas}</h1>
        <p className="pagina-jornada-texto">Aulas curtas e flashcards por nível, para estudar antes de ir à Cabine.</p>
        <nav aria-label="Níveis das aulas" className="acoes-linha">
          {LEVELS.map((item) => (
            <LinkInterno
              key={item.id}
              href={enderecoDe({ pagina: 'aulas', nivel: item.id, modo: 'lesson', aula: null })}
              className={item.id === nivel ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              aria-current={item.id === nivel ? 'page' : undefined}
            >
              {item.cargo}
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
        nivelTitulo={2}
      />
    </div>
  )
}
