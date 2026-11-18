import { useRef, useState } from 'react'
import type { ReplayResponse } from '../api/types'
import { nomeDoNivelDaMissao } from '../jornada/catalogos/catalogoRotas'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { Icone } from '../ui/Icone'
import { CredentialCard } from './CredentialCard'
import { CriteriaPanel } from './CriteriaPanel'
import { TimelineReplay } from './TimelineReplay'

const T = TEXTOS_WORKSTATION.replay

interface Props {
  replay: ReplayResponse | null
  onAtualizar: () => Promise<void>
  ocupado: boolean
  onNavegaKb?: (artigoId: string, origem: HTMLElement) => void
  kbRetornoLinkUri?: string | null
}

export function ReplayView({ replay, onAtualizar, ocupado, onNavegaKb, kbRetornoLinkUri }: Props) {
  const [indiceSelecionado, setIndiceSelecionado] = useState(0)
  const eventoCardRef = useRef<HTMLDivElement>(null)

  if (!replay) {
    return (
      <section className="replay replay-vazio" aria-label={T.regiaoRelatorio} aria-busy={ocupado}>
        <h2 className="h2">Avaliação 360º, replay e Currículo Vivo</h2>
        <p className="muted">{T.semReplay}</p>
        <button type="button" className="btn btn-primary" disabled={ocupado} onClick={onAtualizar}>
          {T.carregar}
        </button>
      </section>
    )
  }

  const { avaliacao, eventos, meta, curriculo } = replay
  const indiceValido = Math.min(Math.max(0, indiceSelecionado), Math.max(0, eventos.length - 1))
  const atendidos = avaliacao.criterios.filter((c) => c.atendido).length
  const proximoFoco = avaliacao.criterios.find((c) => !c.atendido)

  function verEvento(seq: number) {
    const idx = eventos.findIndex((e) => e.seq === seq)
    if (idx < 0) return
    setIndiceSelecionado(idx)
    requestAnimationFrame(() => eventoCardRef.current?.focus())
  }

  return (
    <div className="replay" role="group" aria-label={T.grupo}>
      <div className="replay-grade">
      <section className="replay-resumo" aria-label={T.regiaoRelatorio} aria-busy={ocupado}>
        <div className="replay-topo">
          <h2 className="h2">Relatório do Juiz 360º</h2>
          <button type="button" className="btn btn-neutro btn-sm" disabled={ocupado} onClick={onAtualizar}>
            {T.atualizar}
          </button>
        </div>

        <div className="replay-placar">
          <p className="replay-placar-numero dado-mono">
            {atendidos} de {avaliacao.criterios.length}
          </p>
          <p className="replay-placar-legenda">critérios atendidos</p>
          <div className="replay-medidor" aria-hidden="true">
            {avaliacao.criterios.map((c) => (
              <span key={c.id} data-atendido={c.atendido ? 'sim' : 'nao'} />
            ))}
          </div>
        </div>

        <div className="meta-linha replay-status">
          <span>
            Status: <strong>{avaliacao.concluida ? T.concluida : T.emAndamento}</strong>
          </span>
          <span>{avaliacao.resumo}</span>
          {meta.causa && (
            <span>
              Causa sorteada: <strong>{meta.causa}</strong>
            </span>
          )}
        </div>

        <p className="replay-debrief">
          <Icone nome="ideia" tamanho={20} />
          <span>
            <strong>Debrief da Caixa-Preta.</strong>{' '}
            {avaliacao.incidenteSeguranca
              ? 'Houve incidente de segurança. Revise na linha do tempo o momento do erro para consolidar o procedimento seguro.'
              : proximoFoco
                ? `Próximo foco de aprendizado: ${proximoFoco.praticaEsperada ?? proximoFoco.descricao}`
                : 'Atendimento conduzido com evidências completas e postura segura.'}
          </span>
        </p>

        {avaliacao.incidenteSeguranca && (
          <div className="alert-danger" role="alert">
            {T.incidente}
          </div>
        )}
      </section>

      <section className="replay-criterios" aria-labelledby="replay-criterios-titulo">
        <h2 id="replay-criterios-titulo" className="h2">
          Decisões e prática recomendada
        </h2>
        <CriteriaPanel
          criterios={avaliacao.criterios}
          onVerEvento={verEvento}
          onNavegaKb={onNavegaKb}
          kbRetornoLinkUri={kbRetornoLinkUri}
        />
      </section>

      <section className="replay-tempo" aria-label={T.regiaoLinhaTempo}>
        <h2 className="h2">Caixa-Preta do atendimento ({eventos.length} eventos)</h2>
        {eventos.length === 0 ? (
          <p className="muted">{T.semEventos}</p>
        ) : (
          <TimelineReplay
            eventos={eventos}
            criterios={avaliacao.criterios}
            indice={indiceValido}
            onSelecionar={setIndiceSelecionado}
            cartaoRef={eventoCardRef}
          />
        )}
      </section>

      {curriculo && (
        <div className="replay-selo">
          <CredentialCard curriculo={curriculo} nivel={nomeDoNivelDaMissao(meta.cenarioId) ?? meta.nivel} />
        </div>
      )}
      </div>
    </div>
  )
}
