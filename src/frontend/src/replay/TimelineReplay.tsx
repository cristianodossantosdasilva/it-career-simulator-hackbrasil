import type { RefObject } from 'react'
import type { CriterioAvaliacaoDto, EventoDto } from '../api/types'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { Icone } from '../ui/Icone'
import { eventoDeRisco, ICONE_ORIGEM, origemDoEvento, ROTULO_ORIGEM, rotuloDoEvento } from './rotulosEvento'

const T = TEXTOS_WORKSTATION.replay

interface Props {
  eventos: EventoDto[]
  criterios: CriterioAvaliacaoDto[]
  indice: number
  onSelecionar: (indice: number) => void
  cartaoRef: RefObject<HTMLDivElement | null>
}

/** Critérios ligados a um evento: os que o próprio evento declara e os que apontam para o seq dele. */
function criteriosDoEvento(evento: EventoDto, criterios: CriterioAvaliacaoDto[]): string[] {
  const ids = new Set<string>(evento.criterios ?? [])
  for (const c of criterios) if (c.eventoSeq === evento.seq) ids.add(c.id)
  return [...ids]
}

/** Linha do tempo vertical da Revisão, com o controle de passo e o detalhe do evento selecionado. */
export function TimelineReplay({ eventos, criterios, indice, onSelecionar, cartaoRef }: Props) {
  const atual = eventos[indice]
  const origemAtual = atual ? origemDoEvento(atual.tipo) : 'sistema'
  const criteriosAtuais = atual ? criteriosDoEvento(atual, criterios) : []
  const dadosAtuais = atual ? (atual.payload ?? atual.dados ?? {}) : {}

  return (
    <>
      <div className="tempo-controle">
        <label htmlFor="replay-range">Passo: #{atual?.seq ?? 1}</label>
        <input
          id="replay-range"
          type="range"
          min={0}
          max={Math.max(0, eventos.length - 1)}
          value={indice}
          aria-valuetext={atual ? `Evento #${atual.seq}: ${rotuloDoEvento(atual.tipo)}` : undefined}
          onChange={(e) => onSelecionar(Number(e.target.value))}
        />
      </div>

      {atual && (
        <div className="evento-detalhe" ref={cartaoRef} tabIndex={-1}>
          <div className="evento-detalhe-topo">
            <strong>
              Seq #{atual.seq}: {rotuloDoEvento(atual.tipo)}
            </strong>
            <span className="dado-mono">{atual.minutoSimulado} min</span>
          </div>
          <p className="evento-origem">
            <Icone nome={ICONE_ORIGEM[origemAtual]} tamanho={16} />
            {ROTULO_ORIGEM[origemAtual]}
            {criteriosAtuais.length > 0 && <span>, critério {criteriosAtuais.join(', ')}</span>}
          </p>
          <details className="evento-bruto">
            <summary>{T.eventoBruto}</summary>
            <pre className="json-box">{JSON.stringify(dadosAtuais, null, 2)}</pre>
          </details>
        </div>
      )}

      <ol className="tempo-lista" aria-label={T.listaEventos}>
        {eventos.map((e, idx) => {
          const origem = origemDoEvento(e.tipo)
          const risco = eventoDeRisco(e.tipo)
          const ligados = criteriosDoEvento(e, criterios)
          const ativo = idx === indice
          return (
            <li key={e.seq} className="tempo-item" data-risco={risco ? 'sim' : undefined}>
              <button
                type="button"
                className="tempo-botao"
                data-ativo={ativo ? 'sim' : undefined}
                aria-current={ativo ? 'step' : undefined}
                onClick={() => onSelecionar(idx)}
              >
                <span className="tempo-marcador" aria-hidden="true">
                  <Icone nome={risco ? 'alerta' : ICONE_ORIGEM[origem]} tamanho={16} />
                </span>
                <span className="tempo-texto">
                  <span className="tempo-titulo">
                    #{e.seq} {rotuloDoEvento(e.tipo)}
                  </span>
                  <span className="tempo-meta">
                    {ROTULO_ORIGEM[origem]}
                    {risco && ', evento de risco'}
                    {ligados.length > 0 && `, critério ${ligados.join(', ')}`}
                  </span>
                </span>
                <span className="tempo-minuto dado-mono">{e.minutoSimulado} min</span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}
