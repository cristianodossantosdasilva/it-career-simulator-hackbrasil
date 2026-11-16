import { useEffect, useRef, useState } from 'react'
import type { ReplayResponse } from '../api/types'
import { resolverUriParaId } from '../data/kbCatalogo'

interface Props {
  replay: ReplayResponse | null
  onAtualizar: () => Promise<void>
  ocupado: boolean
  onNavegaKb?: (artigoId: string, origem: HTMLElement) => void
  kbRetornoLinkUri?: string | null
}

export function ReplayView({ replay, onAtualizar, ocupado, onNavegaKb, kbRetornoLinkUri }: Props) {
  const [indiceSelecionado, setIndiceSelecionado] = useState(0)
  const kbLinksRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const eventoCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (kbRetornoLinkUri) requestAnimationFrame(() => kbLinksRef.current[kbRetornoLinkUri!]?.focus())
  }, [kbRetornoLinkUri, replay])

  if (!replay) {
    return (
      <section className="panel" aria-label="Relatorio do Juiz 360" aria-busy={ocupado}>
        <h2>Avaliação 360º, Replay e Currículo Vivo</h2>
        <button type="button" className="btn-primary" disabled={ocupado} onClick={onAtualizar}>
          Carregar Replay e Avaliacao
        </button>
        <p className="muted">Nenhum replay carregado. Carregue para ver criterios e linha do tempo.</p>
      </section>
    )
  }

  const indiceValido = replay ? Math.min(Math.max(0, indiceSelecionado), Math.max(0, replay.eventos.length - 1)) : 0
  const eventoAtual = replay.eventos[indiceValido]
  const criteriosAtendidos = replay.avaliacao.criterios.filter((c) => c.atendido).length
  const proximoFoco = replay.avaliacao.criterios.find((c) => !c.atendido)

  return (
    <div className="app-split" role="group" aria-label="Replay e Avaliacao 360">
      <section className="panel" aria-label="Relatorio do Juiz 360">
        <div className="row-between">
          <h2>Relatório do Juiz 360º</h2>
          <button type="button" disabled={ocupado} onClick={onAtualizar}>
            Atualizar
          </button>
        </div>
        <div className="debrief-box">
          <strong>Debrief Didático da Caixa-Preta:</strong> {criteriosAtendidos} de {replay.avaliacao.criterios.length} critérios
          atendidos.{' '}
          {replay.avaliacao.incidenteSeguranca
            ? 'Houve incidente de segurança — revise na linha do tempo o momento do erro para consolidar o procedimento seguro.'
            : proximoFoco
              ? `Próximo foco de aprendizado: ${proximoFoco.praticaEsperada ?? proximoFoco.descricao}`
              : 'Atendimento conduzido com evidências completas e postura segura.'}
        </div>
        <p className="muted">
          Status: <strong>{replay.avaliacao.concluida ? 'Concluida' : 'Em andamento'}</strong> |{' '}
          {replay.avaliacao.resumo}
          {replay.meta.causa && (
            <>
              {' '}
              | Causa sorteada: <strong>{replay.meta.causa}</strong>
            </>
          )}
        </p>

        {replay.avaliacao.incidenteSeguranca && (
          <div className="alert-danger" role="alert">
            Incidente de seguranca registrado nesta sessao!
          </div>
        )}

        <ul className="criteria-list" role="list" aria-label="Criterios de avaliacao">
          {replay.avaliacao.criterios.map((c) => (
            <li
              key={c.id}
              className={c.atendido ? 'crit-ok' : 'crit-fail'}
            >
              <div className="crit-header">
                <strong>{c.id}</strong> — {c.descricao}{' '}
                <span className="badge">
                  {c.atendido ? 'Atendido' : 'Pendente'}
                </span>
                {c.eventoSeq && (
                  <button
                    type="button"
                    className="chip"
                    aria-label={`Ver evento sequencia ${c.eventoSeq}`}
                    onClick={() => {
                      const idx = replay.eventos.findIndex((e) => e.seq === c.eventoSeq)
                      if (idx >= 0) {
                        setIndiceSelecionado(idx)
                        requestAnimationFrame(() => eventoCardRef.current?.focus())
                      }
                    }}
                  >
                    Ver seq #{c.eventoSeq}
                  </button>
                )}
              </div>
              {c.motivo && (
                <p className="crit-motivo" aria-label="Motivo">
                  <em>{c.motivo}</em>
                </p>
              )}
              {c.praticaEsperada && (
                <p className="crit-pratica">
                  <span className="crit-label">Pratica esperada:</span> {c.praticaEsperada}
                </p>
              )}
              {c.linkKb && (
                resolverUriParaId(c.linkKb) &&
                <button
                  type="button"
                  className="crit-kb-link"
                  aria-label={`Consultar KB: ${c.linkKb}`}
                  data-kb-uri={c.linkKb}
                  ref={(el) => { kbLinksRef.current[c.linkKb!] = el }}
                  onClick={(e) => {
                    const artigoId = resolverUriParaId(c.linkKb!)
                    if (artigoId) onNavegaKb?.(artigoId, e.currentTarget)
                  }}
                >
                  Consultar KB
                </button>
              )}
            </li>
          ))}
        </ul>

        {replay.curriculo && (
          <div className="card-section curriculo-box">
            <h3>Curriculo Vivo (Portfolio Auditavel)</h3>
            <p>
              Competencias comprovadas:{' '}
              <strong>{replay.curriculo.competencias.join(' · ') || 'Nenhuma'}</strong>
            </p>
            <p className="muted">
              Algoritmo: <code>{replay.curriculo.algoritmo}</code>
            </p>
            <div className="hash-box">
              Hash de Auditoria: <code>{replay.curriculo.hash}</code>
            </div>
          </div>
        )}
      </section>

      <section className="panel" aria-label="Linha do tempo do Replay">
        <h2>Caixa-Preta do Atendimento ({replay.eventos.length} eventos)</h2>
        {replay.eventos.length === 0 ? <p className="muted">Nenhum evento registrado nesta sessao.</p> : <>
        <div className="timeline-controls">
          <label htmlFor="replay-range">Passo: #{eventoAtual?.seq ?? 1}</label>
          <input
            id="replay-range"
            type="range"
            min={0}
            max={Math.max(0, replay.eventos.length - 1)}
            value={indiceValido}
            aria-valuetext={eventoAtual ? `Evento #${eventoAtual.seq} — ${eventoAtual.tipo}` : undefined}
            onChange={(e) => setIndiceSelecionado(Number(e.target.value))}
          />
        </div>

        {eventoAtual && (
          <div className="card-section" ref={eventoCardRef} tabIndex={-1}>
            <div className="row-between">
              <strong>
                Seq #{eventoAtual.seq} — {eventoAtual.tipo}
              </strong>
              <span>{eventoAtual.minutoSimulado}m</span>
            </div>
            <pre className="json-box">{JSON.stringify(eventoAtual.payload ?? eventoAtual.dados ?? {}, null, 2)}</pre>
          </div>
        )}

        <ul className="timeline-list" aria-label="Eventos da linha do tempo">
          {replay.eventos.map((e, idx) => (
            <li key={e.seq}>
              <button
                type="button"
                className={`timeline-btn ${idx === indiceValido ? 'active' : ''}`}
                aria-current={idx === indiceValido ? 'step' : undefined}
                onClick={() => setIndiceSelecionado(idx)}
              >
                <span>
                  #{e.seq} {e.tipo}
                </span>
                <span>{e.minutoSimulado}m</span>
              </button>
            </li>
          ))}
        </ul>
        </>}
      </section>
    </div>
  )
}
