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

  useEffect(() => {
    if (kbRetornoLinkUri) requestAnimationFrame(() => kbLinksRef.current[kbRetornoLinkUri!]?.focus())
  }, [kbRetornoLinkUri, replay])

  if (!replay) {
    return (
      <section className="panel" aria-label="Relatorio do Juiz 360">
        <h2>Avaliacao 360º, Replay &amp; Curriculo Vivo</h2>
        <button type="button" className="btn-primary" disabled={ocupado} onClick={onAtualizar}>
          Carregar Replay e Avaliacao
        </button>
      </section>
    )
  }

  const eventoAtual = replay.eventos[indiceSelecionado] ?? replay.eventos[0]

  return (
    <div className="app-split" aria-label="Replay e Avaliacao 360">
      <section className="panel" aria-label="Relatorio do Juiz 360">
        <div className="row-between">
          <h2>Relatorio do Juiz 360º</h2>
          <button type="button" disabled={ocupado} onClick={onAtualizar}>
            Atualizar
          </button>
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
              aria-label={`${c.id}: ${c.atendido ? 'Atendido' : 'Pendente'}`}
            >
              <div className="crit-header">
                <strong>{c.id}</strong> — {c.descricao}{' '}
                <span className="badge" role="status" aria-live="polite">
                  {c.atendido ? 'Atendido' : 'Pendente'}
                </span>
                {c.eventoSeq && (
                  <button
                    type="button"
                    className="chip"
                    aria-label={`Ver evento sequencia ${c.eventoSeq}`}
                    onClick={() => {
                      const idx = replay.eventos.findIndex((e) => e.seq === c.eventoSeq)
                      if (idx >= 0) setIndiceSelecionado(idx)
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
                <button
                  type="button"
                  className="crit-kb-link"
                  aria-label={`Link para base de conhecimento: ${c.linkKb}`}
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
        <h2>Replay em Linha do Tempo ({replay.eventos.length} eventos)</h2>
        <div className="timeline-controls">
          <label htmlFor="replay-range">Passo: #{eventoAtual?.seq ?? 1}</label>
          <input
            id="replay-range"
            type="range"
            min={0}
            max={Math.max(0, replay.eventos.length - 1)}
            value={indiceSelecionado}
            onChange={(e) => setIndiceSelecionado(Number(e.target.value))}
          />
        </div>

        {eventoAtual && (
          <div className="card-section">
            <div className="row-between">
              <strong>
                Seq #{eventoAtual.seq} — {eventoAtual.tipo}
              </strong>
              <span>{eventoAtual.minutoSimulado}m</span>
            </div>
            <pre className="json-box">{JSON.stringify(eventoAtual.payload ?? eventoAtual.dados ?? {}, null, 2)}</pre>
          </div>
        )}

        <ul className="timeline-list">
          {replay.eventos.map((e, idx) => (
            <li key={e.seq}>
              <button
                type="button"
                className={`timeline-btn ${idx === indiceSelecionado ? 'active' : ''}`}
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
      </section>
    </div>
  )
}
