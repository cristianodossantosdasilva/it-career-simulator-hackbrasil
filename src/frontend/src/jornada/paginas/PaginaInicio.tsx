import { Icone } from '../../ui/Icone'
import { DemonstracaoCheckIn } from '../componentes/DemonstracaoCheckIn'
import { JORNADA, TEXTOS_HOME } from '../catalogos/catalogoVocacional'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelComandante } from '../comandante/PainelComandante'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA } from '../navegacao/rotas'

/** Página Início: apresenta o produto, mostra um exemplo do check-in e diz o que o guia não faz. */
export function PaginaInicio() {
  const { cartao } = useArmazenamentoJornada()
  return (
    <div className="page pagina-jornada">
      <header>
        <p className="eyebrow">{TEXTOS_HOME.marca}</p>
        <h1 className="h1">{NOME_PAGINA.inicio}</h1>
        <p className="h2">{TEXTOS_HOME.titulo}</p>
        <p className="pagina-jornada-texto">{TEXTOS_HOME.lead}</p>
        <p className="muted">{TEXTOS_HOME.contexto}</p>
        <div className="acoes-linha">
          {cartao ? (
            <>
              <LinkInterno href="/plano-de-voo" className="btn btn-primary btn-lg">
                <Icone nome="plano-de-voo" tamanho={20} />
                <span>Ir para o Plano de voo</span>
              </LinkInterno>
              <LinkInterno href="/check-in" className="btn btn-secondary btn-lg">
                <Icone nome="check-in" tamanho={20} />
                <span>Refazer o check-in</span>
              </LinkInterno>
            </>
          ) : (
            <LinkInterno href="/check-in" className="btn btn-primary btn-lg">
              <Icone nome="check-in" tamanho={20} />
              <span>Fazer o check-in</span>
            </LinkInterno>
          )}
        </div>
      </header>

      <section className="secao-jornada" aria-labelledby="inicio-passos">
        <h2 id="inicio-passos">{TEXTOS_HOME.jornadaTitulo}</h2>
        <ol className="passos-jornada">
          {JORNADA.map((passo) => (
            <li key={passo.id} className="passo-jornada">
              <h3>{passo.titulo}</h3>
              <p>{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <DemonstracaoCheckIn />

      <section className="secao-jornada" aria-labelledby="inicio-limites">
        <h2 id="inicio-limites">{TEXTOS_HOME.limitesTitulo}</h2>
        <p className="muted">{TEXTOS_HOME.guiaRotulo}</p>
        <ul className="lista-simples">
          {TEXTOS_HOME.limites.map((limite) => (
            <li key={limite}>{limite}</li>
          ))}
        </ul>
      </section>

      <PainelComandante papel="consultor" pagina="inicio" />
    </div>
  )
}
