import { Icone } from '../../ui/Icone'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA } from '../navegacao/rotas'

/** Página Biblioteca: catálogo de aulas, treino de explicação, caderno e referências de certificação. */
export function PaginaBiblioteca() {
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.biblioteca}</h1>
        <p className="pagina-jornada-texto">
          Catálogo de estudo: microaulas, flashcards, treino de explicação, caderno pessoal e certificações de referência.
        </p>
      </header>

      <div className="certsim-grade-2">
        <article className="certsim-cartao">
          <h2 className="h2">Aulas e fundamentos</h2>
          <p className="muted">Microaulas por nível (Help Desk N1 até N3) com flashcards de fixação.</p>
          <div className="acoes-linha">
            <LinkInterno href="/aulas" className="btn btn-primary">
              <Icone nome="aulas" tamanho={20} />
              <span>Abrir Aulas</span>
            </LinkInterno>
          </div>
        </article>

        <article className="certsim-cartao">
          <h2 className="h2">Catálogo de rotas e certificações</h2>
          <p className="muted">Veja todas as etapas da rota Suporte de TI e certificações de referência no mercado.</p>
          <div className="acoes-linha">
            <LinkInterno href="/catalogo" className="btn btn-secondary">
              <Icone nome="catalogo" tamanho={20} />
              <span>Abrir Catálogo</span>
            </LinkInterno>
          </div>
        </article>

        <article className="certsim-cartao">
          <h2 className="h2">Caderno de estudos</h2>
          <p className="muted">Suas anotações, resumos e revisão pessoal salvos neste navegador.</p>
          <div className="acoes-linha">
            <LinkInterno href="/caderno" className="btn btn-secondary">
              <Icone nome="caderno" tamanho={20} />
              <span>Abrir Caderno</span>
            </LinkInterno>
          </div>
        </article>

        <article className="certsim-cartao">
          <h2 className="h2">Treino de explicação</h2>
          <p className="muted">Pratique explicar conceitos técnicos com suas próprias palavras (técnica Feynman).</p>
          <div className="acoes-linha">
            <LinkInterno href="/aulas/treino" className="btn btn-secondary">
              <Icone nome="feynman" tamanho={20} />
              <span>Abrir Treino</span>
            </LinkInterno>
          </div>
        </article>
      </div>

      <PainelMentor papel="consultor" pagina="biblioteca" />
    </div>
  )
}
