import { CATALOGO_ROTAS } from '../catalogos/catalogoRotas'
import { SeloStatus } from '../componentes/SeloStatus'
import { NOME_PAGINA } from '../navegacao/rotas'

/**
 * Hangar mínimo: as rotas do catálogo com o status de cada uma. As Missões, as certificações, os
 * parceiros e a transparência do escopo entram na tarefa 9.5.
 */
export function PaginaHangar() {
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.hangar}</h1>
        <p className="pagina-jornada-texto">
          O que existe hoje e o que está previsto. Cada item mostra o status em texto: disponível, em preparação ou futuro.
        </p>
      </header>
      <section className="secao-jornada" aria-labelledby="hangar-rotas">
        <h2 id="hangar-rotas">Rotas</h2>
        <ul className="lista-rotas-hangar">
          {CATALOGO_ROTAS.map((rota) => (
            <li key={rota.id} className="rota-hangar">
              <h3>{rota.nome}</h3>
              <p>{rota.descricao}</p>
              <p>
                <SeloStatus status={rota.status} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
