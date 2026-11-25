import { useMemo } from 'react'
import { Icone } from '../../ui/Icone'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA } from '../navegacao/rotas'
import { lerHistorico } from '../simulados/historico'

/** Página Painel: dashboard de prontidão, média, taxa de aprovação e domínio prioritário. */
export function PaginaPainel() {
  const { registros } = useArmazenamentoJornada()
  const entradas = useMemo(() => lerHistorico(), [])

  const media =
    entradas.length > 0 ? Math.round(entradas.reduce((acc, item) => acc + item.percentual, 0) / entradas.length) : 0
  const aprovados = entradas.filter((e) => e.aprovado).length
  const taxaAprovacao = entradas.length > 0 ? Math.round((aprovados / entradas.length) * 100) : 0

  const porDominio = useMemo(() => {
    const mapa = new Map<string, { total: number; corretas: number }>()
    for (const entrada of entradas) {
      for (const dom of entrada.porDominio) {
        const atual = mapa.get(dom.dominio) ?? { total: 0, corretas: 0 }
        mapa.set(dom.dominio, { total: atual.total + dom.total, corretas: atual.corretas + dom.corretas })
      }
    }
    return [...mapa.entries()]
      .map(([dominio, dados]) => ({
        dominio,
        total: dados.total,
        corretas: dados.corretas,
        percentual: dados.total > 0 ? Math.round((dados.corretas / dados.total) * 100) : 0,
      }))
      .sort((a, b) => a.percentual - b.percentual)
  }, [entradas])

  const dominioMaisFraco = porDominio[0] ?? null

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.painel}</h1>
        <p className="pagina-jornada-texto">
          Visão consolidada do seu desempenho em Teórico, Prático e Lab.
        </p>
      </header>

      <div className="certsim-grade-3">
        <article className="certsim-cartao">
          <p className="eyebrow">Média nos simulados</p>
          <p className="certsim-kpi dado-mono">{media}%</p>
          <p className="muted">Meta de aprovação nas provas: 70%</p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Taxa de aprovação</p>
          <p className="certsim-kpi dado-mono">{taxaAprovacao}%</p>
          <p className="muted">
            {aprovados} de {entradas.length} tentativas aprovadas
          </p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Labs concluídos</p>
          <p className="certsim-kpi dado-mono">{registros.length}</p>
          <p className="muted">Sessões avaliadas pelo Juiz 360º</p>
        </article>
      </div>

      <section className="secao-jornada" aria-labelledby="painel-dominios-titulo">
        <h2 id="painel-dominios-titulo" className="h2">
          Desempenho por domínio
        </h2>
        {porDominio.length === 0 ? (
          <div className="certsim-cartao">
            <p className="pagina-jornada-texto">
              Conclua um simulado ou prova para ver o mapa de pontos fortes e oportunidades por domínio.
            </p>
            <div className="acoes-linha">
              <LinkInterno href="/simulados" className="btn btn-primary">
                <Icone nome="simulados" tamanho={20} />
                <span>Iniciar simulado</span>
              </LinkInterno>
            </div>
          </div>
        ) : (
          <div className="certsim-cartao">
            <ul className="lista-simples">
              {porDominio.map((item) => (
                <li key={item.dominio}>
                  <div className="certsim-cartao-topo">
                    <strong>{item.dominio}</strong>
                    <span className="dado-mono">
                      {item.corretas}/{item.total} ({item.percentual}%)
                    </span>
                  </div>
                  <progress
                    className="certsim-progresso"
                    value={item.corretas}
                    max={Math.max(1, item.total)}
                    aria-label={`${item.dominio}: ${item.percentual}%`}
                  />
                </li>
              ))}
            </ul>
            {dominioMaisFraco && (
              <div className="acoes-linha">
                <p className="muted">
                  Maior oportunidade de ganho: <strong>{dominioMaisFraco.dominio}</strong> ({dominioMaisFraco.percentual}%).
                </p>
                <LinkInterno href="/reforco" className="btn btn-secondary">
                  <Icone nome="reforco" tamanho={20} />
                  <span>Ir para Reforço diário</span>
                </LinkInterno>
              </div>
            )}
          </div>
        )}
      </section>

      <PainelMentor papel="mentor" pagina="painel" />
    </div>
  )
}
