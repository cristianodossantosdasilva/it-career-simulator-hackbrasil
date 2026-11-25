import { useMemo, useState } from 'react'
import { Icone } from '../../ui/Icone'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { lerHistorico } from '../simulados/historico'
import {
  LIMITE_FILA_HOJE,
  filaParaHoje,
  gravarRevisaoEspacada,
  lerRevisaoEspacada,
  responderCartao,
  sequenciaAtiva,
} from '../simulados/revisaoEspacada'

/** Página Reforço diário: revisão espaçada (1/3/7/14 dias), domínios abaixo de 70% e critérios pendentes de Lab. */
export function PaginaReforco() {
  const { registros } = useArmazenamentoJornada()
  const entradas = useMemo(() => lerHistorico(), [])
  const [revisados, setRevisados] = useState<string[]>([])
  const [estadoRevisao, setEstadoRevisao] = useState(() => lerRevisaoEspacada())

  const agora = new Date()
  const filaHoje = filaParaHoje(estadoRevisao, agora, LIMITE_FILA_HOJE)
  const sequenciaDias = sequenciaAtiva(estadoRevisao, agora)

  const dominiosParaReforcar = useMemo(() => {
    const mapa = new Map<string, { total: number; corretas: number }>()
    for (const entrada of entradas) {
      for (const dom of entrada.porDominio) {
        const atual = mapa.get(dom.dominio) ?? { total: 0, corretas: 0 }
        mapa.set(dom.dominio, { total: atual.total + dom.total, corretas: atual.corretas + dom.corretas })
      }
    }
    return [...mapa.entries()]
      .map(([dominio, d]) => ({
        dominio,
        percentual: d.total > 0 ? Math.round((d.corretas / d.total) * 100) : 0,
      }))
      .filter((item) => item.percentual < 70)
  }, [entradas])

  const criteriosPendentes = useMemo(
    () =>
      registros.flatMap((reg) =>
        reg.resultado.criterios
          .filter((c) => !c.atendido)
          .map((c) => ({
            chave: `${reg.sessaoId}:${c.id}`,
            missao: textosDaMissao(reg.missao).titulo,
            sessaoId: reg.sessaoId,
            descricao: c.descricao,
          })),
      ),
    [registros],
  )

  function marcarRevisado(chave: string) {
    setRevisados((atuais) => (atuais.includes(chave) ? atuais : [...atuais, chave]))
  }

  function registrarRespostaEspacada(questaoId: string, acertou: boolean) {
    setEstadoRevisao((atual) => {
      const proximo = responderCartao(atual, questaoId, acertou, new Date())
      gravarRevisaoEspacada(proximo)
      return proximo
    })
  }

  const semPendencias =
    dominiosParaReforcar.length === 0 && criteriosPendentes.length === 0 && estadoRevisao.cartoes.length === 0

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.reforco}</h1>
        <p className="pagina-jornada-texto">
          Revisão espaçada (caixas de 1, 3, 7 e 14 dias), domínios teóricos abaixo de 70% e critérios de Lab pendentes.
        </p>
      </header>

      <section className="secao-jornada" aria-labelledby="reforco-espacada-titulo">
        <div className="certsim-cartao-topo">
          <h2 id="reforco-espacada-titulo" className="h2">
            Revisão espaçada — fila para hoje ({filaHoje.length}/{LIMITE_FILA_HOJE})
          </h2>
          <span className="selo-status" aria-label={`Sequência de ${sequenciaDias} ${sequenciaDias === 1 ? 'dia' : 'dias'}`}>
            Sequência: {sequenciaDias} {sequenciaDias === 1 ? 'dia' : 'dias'}
          </span>
        </div>

        {filaHoje.length === 0 ? (
          <div className="certsim-cartao">
            <p className="pagina-jornada-texto">
              {estadoRevisao.cartoes.length === 0
                ? 'Nenhuma questão errada na fila de revisão espaçada ainda. Ao errar questões teóricas ou de simulado, elas aparecem aqui.'
                : 'Você concluiu todas as revisões programadas para hoje. Volte amanhã para manter sua sequência.'}
            </p>
          </div>
        ) : (
          <ul className="lista-simples">
            {filaHoje.map((cartao) => (
              <li key={cartao.questaoId} className="certsim-cartao">
                <div className="certsim-cartao-topo">
                  <span className="eyebrow">
                    {cartao.dominio} · {cartao.origem === 'simulado' ? 'Simulado' : 'Teórico'}
                  </span>
                  <span className="selo-status">
                    Caixa {cartao.caixa} {cartao.caixa === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <p className="pagina-jornada-texto">{cartao.enunciado}</p>
                {(cartao.respostaCorreta || cartao.explicacao) && (
                  <details className="certsim-detalhes">
                    <summary className="certsim-detalhes-resumo">Ver resposta e explicação</summary>
                    <div className="certsim-detalhes-corpo">
                      {cartao.respostaCorreta && (
                        <p>
                          <strong>Resposta esperada:</strong> {cartao.respostaCorreta}
                        </p>
                      )}
                      {cartao.explicacao && <p className="muted">{cartao.explicacao}</p>}
                    </div>
                  </details>
                )}
                <div className="acoes-linha">
                  <button
                    type="button"
                    className="btn btn-primary certsim-botao-alvo"
                    onClick={() => registrarRespostaEspacada(cartao.questaoId, true)}
                  >
                    <span>Acertei</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary certsim-botao-alvo"
                    onClick={() => registrarRespostaEspacada(cartao.questaoId, false)}
                  >
                    <span>Errei</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {semPendencias ? (
        <div className="certsim-cartao">
          <h2 className="h2">Nenhum erro pendente para revisar</h2>
          <p className="pagina-jornada-texto">
            Faça um simulado em Modo Prática ou conclua um atendimento na Mesa de Trabalho para gerar cartões de reforço.
          </p>
          <div className="acoes-linha">
            <LinkInterno href="/aprender" className="btn btn-primary">
              <Icone nome="aprender" tamanho={20} />
              <span>Praticar em Aprender</span>
            </LinkInterno>
            <LinkInterno href="/simulados" className="btn btn-secondary">
              <Icone nome="simulados" tamanho={20} />
              <span>Abrir Simulados</span>
            </LinkInterno>
          </div>
        </div>
      ) : (
        <>
          {dominiosParaReforcar.length > 0 && (
            <section className="secao-jornada" aria-labelledby="reforco-dominios-titulo">
              <h2 id="reforco-dominios-titulo" className="h2">
                Domínios teóricos prioritários ({dominiosParaReforcar.length})
              </h2>
              <div className="certsim-grade-2">
                {dominiosParaReforcar.map((item) => (
                  <article key={item.dominio} className="certsim-cartao">
                    <div className="certsim-cartao-topo">
                      <h3 className="h3">{item.dominio}</h3>
                      <span className="selo-status">{item.percentual}%</span>
                    </div>
                    <p className="muted">Recomendação: revisar questões no modo Prática até atingir 70% ou mais.</p>
                    <div className="acoes-linha">
                      <LinkInterno href="/aprender" className="btn btn-primary btn-sm">
                        <span>Praticar domínio</span>
                      </LinkInterno>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {criteriosPendentes.length > 0 && (
            <section className="secao-jornada" aria-labelledby="reforco-labs-titulo">
              <h2 id="reforco-labs-titulo" className="h2">
                Critérios de Lab para revisar ({criteriosPendentes.length})
              </h2>
              <ul className="lista-simples">
                {criteriosPendentes.map((item) => {
                  const feito = revisados.includes(item.chave)
                  return (
                    <li key={item.chave} className="certsim-item-lista">
                      <div>
                        <strong>{item.descricao}</strong>
                        <p className="muted">Missão: {item.missao}</p>
                      </div>
                      <div className="acoes-linha">
                        <LinkInterno
                          href={enderecoDe({ pagina: 'revisao', sessao: item.sessaoId })}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Ver na Revisão</span>
                        </LinkInterno>
                        <button
                          type="button"
                          className={feito ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                          disabled={feito}
                          onClick={() => marcarRevisado(item.chave)}
                        >
                          <span>{feito ? 'Revisado hoje' : 'Marcar como revisado'}</span>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <PainelMentor papel="mentor" pagina="reforco" />
    </div>
  )
}
