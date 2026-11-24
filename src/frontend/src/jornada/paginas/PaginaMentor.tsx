import { PAPEIS, PAPEL_POR_PAGINA, AVISO_JUIZ, type PapelMentor } from '../mentor/catalogoMentor'
import { TEXTOS_HOME } from '../catalogos/catalogoVocacional'
import { NOME_PAGINA, type IdPagina } from '../navegacao/rotas'

const ORDEM_DOS_PAPEIS: readonly PapelMentor[] = ['consultor', 'instrutor', 'copiloto', 'mentor']

function paginasDoPapel(papel: PapelMentor): string {
  const paginas = (Object.keys(PAPEL_POR_PAGINA) as IdPagina[]).filter((pagina) => PAPEL_POR_PAGINA[pagina] === papel)
  return paginas.map((pagina) => NOME_PAGINA[pagina]).join(' e ')
}

/** Explica os quatro papéis do Mentor, o que cada um faz e não faz, e os limites do guia. */
export function PaginaMentor() {
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['mentor']}</h1>
        <p className="pagina-jornada-texto">
          O Mentor é o guia da jornada. Ele muda de papel conforme a fase em que você está e só orienta, com textos
          escritos para esta plataforma.
        </p>
        <p className="muted">{TEXTOS_HOME.guiaRotulo}</p>
      </header>
      <section className="secao-jornada" aria-labelledby="mentor-papeis">
        <h2 id="mentor-papeis">Os quatro papéis</h2>
        <ul className="papeis-mentor">
          {ORDEM_DOS_PAPEIS.map((id) => {
            const papel = PAPEIS[id]
            return (
              <li key={id} className="papel-mentor">
                <h3>{papel.nome}</h3>
                <p>{papel.resumo}</p>
                <p className="muted">Atua em: {paginasDoPapel(id)}.</p>
                <p>
                  <strong>O que faz</strong>
                </p>
                <ul className="lista-simples">
                  {papel.faz.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>
                  <strong>O que não faz</strong>
                </p>
                <ul className="lista-simples">
                  {papel.naoFaz.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </section>
      <section className="secao-jornada" aria-labelledby="mentor-limites">
        <h2 id="mentor-limites">{TEXTOS_HOME.limitesTitulo}</h2>
        <ul className="lista-simples">
          {TEXTOS_HOME.limites.map((limite) => (
            <li key={limite}>{limite}</li>
          ))}
        </ul>
        <p className="muted">{AVISO_JUIZ}.</p>
      </section>
    </div>
  )
}
