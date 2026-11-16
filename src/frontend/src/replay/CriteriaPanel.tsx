import { useEffect, useRef } from 'react'
import type { CriterioAvaliacaoDto } from '../api/types'
import { resolverUriParaId } from '../data/kbCatalogo'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { Icone } from '../ui/Icone'

const T = TEXTOS_WORKSTATION.replay

interface Props {
  criterios: CriterioAvaliacaoDto[]
  onVerEvento: (seq: number) => void
  onNavegaKb?: (artigoId: string, origem: HTMLElement) => void
  /** URI do link de KB que deve receber o foco ao voltar do artigo. */
  kbRetornoLinkUri?: string | null
}

/**
 * Comparativo de decisões: para cada critério, o que a sessão registrou ao lado da prática recomendada.
 * Os dois textos vêm do Juiz 360 (motivo e praticaEsperada). Nada é calculado aqui.
 */
export function CriteriaPanel({ criterios, onVerEvento, onNavegaKb, kbRetornoLinkUri }: Props) {
  const kbLinksRef = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (kbRetornoLinkUri) requestAnimationFrame(() => kbLinksRef.current[kbRetornoLinkUri]?.focus())
  }, [kbRetornoLinkUri, criterios])

  return (
    <ul className="criterios" aria-label={T.listaCriterios}>
      {criterios.map((c) => {
        const artigoId = c.linkKb ? resolverUriParaId(c.linkKb) : null
        return (
          <li key={c.id} className="criterio" data-atendido={c.atendido ? 'sim' : 'nao'}>
            <div className="criterio-topo">
              <span className="criterio-id dado-mono">{c.id}</span>
              <span className="criterio-estado">
                <Icone nome={c.atendido ? 'confirmar' : 'alerta'} tamanho={16} />
                {c.atendido ? T.atendido : T.pendente}
              </span>
            </div>
            <p className="criterio-descricao">{c.descricao}</p>

            {(c.motivo || c.praticaEsperada) && (
              <dl className="comparativo">
                {c.motivo && (
                  <div>
                    <dt>O que você fez</dt>
                    <dd>{c.motivo}</dd>
                  </div>
                )}
                {c.praticaEsperada && (
                  <div data-tipo="recomendada">
                    <dt>Prática recomendada</dt>
                    <dd>{c.praticaEsperada}</dd>
                  </div>
                )}
              </dl>
            )}

            {(c.eventoSeq != null || artigoId) && (
              <div className="criterio-acoes">
                {c.eventoSeq != null && (
                  <button type="button" className="btn btn-neutro btn-sm" onClick={() => onVerEvento(c.eventoSeq!)}>
                    {T.verEvento(c.eventoSeq)}
                  </button>
                )}
                {artigoId && c.linkKb && (
                  <button
                    type="button"
                    className="btn btn-neutro btn-sm"
                    aria-label={T.consultarKb(c.linkKb)}
                    data-kb-uri={c.linkKb}
                    ref={(el) => {
                      kbLinksRef.current[c.linkKb!] = el
                    }}
                    onClick={(e) => onNavegaKb?.(artigoId, e.currentTarget)}
                  >
                    Consultar KB
                  </button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
