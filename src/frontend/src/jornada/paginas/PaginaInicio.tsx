import { Icone } from '../../ui/Icone'
import { etapaDaMissao } from '../catalogos/catalogoRotas'
import { JORNADA, TEXTOS_HOME } from '../catalogos/catalogoVocacional'
import { DemonstracaoDiagnostico } from '../componentes/DemonstracaoDiagnostico'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { BotaoExperimentar } from '../demonstracao/BotaoExperimentar'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'

/** Página Início: boas-vindas no layout CertSim, continuar missão, atalhos e demonstração. */
export function PaginaInicio() {
  const { cartao, registros, missoesAtivas } = useArmazenamentoJornada()
  const ultimaLocal = missoesAtivas.ultimaMissao ? etapaDaMissao(missoesAtivas.ultimaMissao) : null

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
              <LinkInterno href="/plano-de-carreira" className="btn btn-primary btn-lg">
                <Icone nome="plano-de-carreira" tamanho={20} />
                <span>Ir para o Plano de Carreira</span>
              </LinkInterno>
              <LinkInterno href="/diagnostico" className="btn btn-secondary btn-lg">
                <Icone nome="diagnostico" tamanho={20} />
                <span>Refazer o diagnóstico</span>
              </LinkInterno>
            </div>
            <BotaoExperimentar />
          </>
        ) : (
          <>
            <BotaoExperimentar destaque />
            <div className="acoes-linha">
              <LinkInterno href="/diagnostico" className="btn btn-secondary btn-lg">
                <Icone nome="diagnostico" tamanho={20} />
                <span>Fazer o diagnóstico completo</span>
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
            <div className="certsim-cartao">
              <p className="eyebrow">Atendimento em andamento</p>
              <h3 className="h3">{ultimaLocal.missao.titulo}</h3>
              <p className="muted">Etapa: {ultimaLocal.etapa.nome} · Sessão salva neste navegador</p>
              <div className="acoes-linha">
                <LinkInterno
                  href={enderecoDe({
                    pagina: 'mesa-de-trabalho',
                    missao: ultimaLocal.missao.id,
                    semente: null,
                    causa: null,
                    nova: false,
                  })}
                  className="btn btn-primary"
                >
                  <Icone nome="iniciar" tamanho={20} />
                  <span>Continuar missão</span>
                </LinkInterno>
                <LinkInterno href="/carreira" className="btn btn-secondary">
                  <Icone nome="carreira" tamanho={20} />
                  <span>Ver Carreira</span>
                </LinkInterno>
              </div>
            </div>
          ) : (
            <div className="certsim-cartao">
              <p className="pagina-jornada-texto">
                {registros.length > 0
                  ? `Você já concluiu ${registros.length} ${registros.length === 1 ? 'missão prática' : 'missões práticas'}.`
                  : 'Seu cartão de perfil está pronto. Escolha entre Teórico, Prático ou Lab.'}
              </p>
              <div className="acoes-linha">
                <LinkInterno href="/simulados" className="btn btn-primary">
                  <Icone nome="simulados" tamanho={20} />
                  <span>Abrir Simulados</span>
                </LinkInterno>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="secao-jornada" aria-labelledby="inicio-atalhos-titulo">
        <h2 id="inicio-atalhos-titulo" className="h2">
          Três níveis e acesso rápido
        </h2>
        <div className="certsim-grade-3">
          <article className="certsim-cartao">
            <h3 className="h3">Nível Teórico</h3>
            <p className="muted">Questões objetivas por tópico com feedback imediato ou prova cronometrada.</p>
            <div className="acoes-linha">
              <LinkInterno href="/aprender" className="btn btn-secondary">
                <Icone nome="aprender" tamanho={20} />
                <span>Aprender</span>
              </LinkInterno>
            </div>
          </article>
          <article className="certsim-cartao">
            <h3 className="h3">Nível Prático</h3>
            <p className="muted">Chamados guiados na Mesa de Trabalho com pistas progressivas.</p>
            <div className="acoes-linha">
              <LinkInterno href="/praticar" className="btn btn-secondary">
                <Icone nome="praticar" tamanho={20} />
                <span>Praticar</span>
              </LinkInterno>
            </div>
          </article>
          <article className="certsim-cartao">
            <h3 className="h3">Nível Lab</h3>
            <p className="muted">Simulados e provas práticas avaliadas pelo Juiz 360º sem apoio.</p>
            <div className="acoes-linha">
              <LinkInterno href="/simulados" className="btn btn-primary">
                <Icone nome="simulados" tamanho={20} />
                <span>Simulados e Provas</span>
              </LinkInterno>
            </div>
          </article>
        </div>
        <div className="certsim-filtros">
          <LinkInterno href="/provas" className="btn btn-secondary">
            <Icone nome="provas" tamanho={20} />
            <span>Provas</span>
          </LinkInterno>
          <LinkInterno href="/reforco" className="btn btn-secondary">
            <Icone nome="reforco" tamanho={20} />
            <span>Reforço diário</span>
          </LinkInterno>
          <LinkInterno href="/painel" className="btn btn-secondary">
            <Icone nome="painel" tamanho={20} />
            <span>Painel</span>
          </LinkInterno>
          <LinkInterno href="/historico" className="btn btn-secondary">
            <Icone nome="historico" tamanho={20} />
            <span>Histórico</span>
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

      <DemonstracaoDiagnostico />

      <section className="secao-jornada" aria-labelledby="inicio-limites">
        <h2 id="inicio-limites">{TEXTOS_HOME.limitesTitulo}</h2>
        <p className="muted">{TEXTOS_HOME.guiaRotulo}</p>
        <ul className="lista-simples">
          {TEXTOS_HOME.limites.map((limite) => (
            <li key={limite}>{limite}</li>
          ))}
        </ul>
      </section>

      <PainelMentor papel="consultor" pagina="inicio" />
    </div>
  )
}
