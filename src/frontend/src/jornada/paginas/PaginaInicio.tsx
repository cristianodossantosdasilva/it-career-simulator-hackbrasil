import { Icone } from '../../ui/Icone'
import { BotaoExperimentar } from '../demonstracao/BotaoExperimentar'
import { DemonstracaoCheckIn } from '../componentes/DemonstracaoCheckIn'
import { escalaDaMissao } from '../catalogos/catalogoRotas'
import { JORNADA, TEXTOS_HOME } from '../catalogos/catalogoVocacional'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelComandante } from '../comandante/PainelComandante'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'

/** Página Início: acesso rápido para continuar missão, atalhos da jornada, demonstração e limites. */
export function PaginaInicio() {
  const { cartao, registros, voosAtivos } = useArmazenamentoJornada()
  const ultimaLocal = voosAtivos.ultimaMissao ? escalaDaMissao(voosAtivos.ultimaMissao) : null

  return (
    <div className="page pagina-jornada">
      <header>
        <p className="eyebrow">{TEXTOS_HOME.marca}</p>
        <h1 className="h1">{NOME_PAGINA.inicio}</h1>
        <p className="h2">{TEXTOS_HOME.titulo}</p>
        <p className="pagina-jornada-texto">{TEXTOS_HOME.lead}</p>
        <p className="muted">{TEXTOS_HOME.contexto}</p>
        {cartao ? (
          <>
            <div className="acoes-linha">
              <LinkInterno href="/plano-de-voo" className="btn btn-primary btn-lg">
                <Icone nome="plano-de-voo" tamanho={20} />
                <span>Ir para o Plano de voo</span>
              </LinkInterno>
              <LinkInterno href="/check-in" className="btn btn-secondary btn-lg">
                <Icone nome="check-in" tamanho={20} />
                <span>Refazer o check-in</span>
              </LinkInterno>
            </div>
            <BotaoExperimentar />
          </>
        ) : (
          <>
            <BotaoExperimentar destaque />
            <div className="acoes-linha">
              <LinkInterno href="/check-in" className="btn btn-secondary btn-lg">
                <Icone nome="check-in" tamanho={20} />
                <span>Fazer o check-in completo</span>
              </LinkInterno>
            </div>
          </>
        )}
      </header>

      {(ultimaLocal || cartao) && (
        <section className="secao-jornada" aria-labelledby="inicio-continuar-titulo">
          <h2 id="inicio-continuar-titulo" className="h2">
            Continuar missão
          </h2>
          {ultimaLocal ? (
            <div className="cartao-missao">
              <p className="eyebrow">Voo em andamento</p>
              <h3 className="cartao-missao-titulo">{ultimaLocal.missao.titulo}</h3>
              <p className="muted">
                Escala: {ultimaLocal.escala.nome} · Sessão salva neste navegador
              </p>
              <div className="acoes-linha">
                <LinkInterno
                  href={enderecoDe({
                    pagina: 'cabine',
                    missao: ultimaLocal.missao.id,
                    semente: null,
                    causa: null,
                    nova: false,
                  })}
                  className="btn btn-primary"
                >
                  <Icone nome="embarcar" tamanho={20} />
                  <span>Continuar missão</span>
                </LinkInterno>
                <LinkInterno href="/plano-de-voo" className="btn btn-secondary">
                  <Icone nome="plano-de-voo" tamanho={20} />
                  <span>Escolher outro chamado</span>
                </LinkInterno>
              </div>
            </div>
          ) : (
            <div className="cartao-missao">
              <p className="pagina-jornada-texto">
                {registros.length > 0
                  ? `Você já registrou ${registros.length} ${registros.length === 1 ? 'missão concluída' : 'missões concluídas'}.`
                  : 'Seu cartão de embarque está pronto. Configure o modo Treino ou Missão no Plano de voo.'}
              </p>
              <div className="acoes-linha">
                <LinkInterno href="/plano-de-voo" className="btn btn-primary">
                  <Icone nome="embarcar" tamanho={20} />
                  <span>Configurar próxima missão</span>
                </LinkInterno>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="secao-jornada" aria-labelledby="inicio-atalhos-titulo">
        <h2 id="inicio-atalhos-titulo" className="h2">
          Atalhos rápidos
        </h2>
        <div className="grade-atalhos-inicio">
          {cartao ? (
            <LinkInterno href="/plano-de-voo" className="btn btn-secondary">
              <Icone nome="plano-de-voo" tamanho={20} />
              <span>Configurar voo (Treino ou Missão)</span>
            </LinkInterno>
          ) : (
            <LinkInterno href="/check-in" className="btn btn-secondary">
              <Icone nome="check-in" tamanho={20} />
              <span>Iniciar Check-in</span>
            </LinkInterno>
          )}
          <LinkInterno href="/aulas" className="btn btn-secondary">
            <Icone nome="aulas" tamanho={20} />
            <span>Aulas e fundamentos</span>
          </LinkInterno>
          <LinkInterno href="/breve" className="btn btn-secondary">
            <Icone nome="credencial" tamanho={20} />
            <span>Brevê e histórico</span>
          </LinkInterno>
          <LinkInterno href="/caderno" className="btn btn-secondary">
            <Icone nome="caderno" tamanho={20} />
            <span>Caderno de estudos</span>
          </LinkInterno>
          <LinkInterno href="/comandante" className="btn btn-secondary">
            <Icone nome="mentor" tamanho={20} />
            <span>Comandante</span>
          </LinkInterno>
        </div>
      </section>

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
