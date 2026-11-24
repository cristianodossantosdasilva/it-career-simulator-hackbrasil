import { useState } from 'react'
import type { QuestaoPublica } from '../api/teorico'
import {
  FILTROS_PADRAO,
  FILTROS_PRATICA,
  type FiltroMapa,
  type InstantaneoProva,
  type SeloQuestao,
  contarRespondidas,
  filtrarQuestoes,
  selosDaQuestao,
} from './estadoProva'

const ROTULO_SELO: Record<SeloQuestao, string> = {
  atual: 'Questão atual',
  correta: 'Correta',
  incorreta: 'Incorreta',
  branco: 'Em branco',
  revisar: 'Revisar',
  respondida: 'Respondida',
}

interface Props {
  questoes: readonly QuestaoPublica[]
  indice: number
  instantaneo: InstantaneoProva
  pratica: boolean
  aoIr: (indice: number) => void
  aoFinalizar: () => void
  finalizarDesabilitado?: boolean
}

function trecho(texto: string): string {
  return texto.length > 70 ? `${texto.slice(0, 67)}...` : texto
}

/** Mapa lateral de questões: progresso, filtros e selos. */
export function MapaQuestoes({ questoes, indice, instantaneo, pratica, aoIr, aoFinalizar, finalizarDesabilitado }: Props) {
  const [filtro, setFiltro] = useState<FiltroMapa>('todas')
  const filtros = pratica ? FILTROS_PRATICA : FILTROS_PADRAO
  const visiveis = filtrarQuestoes(questoes, filtro, instantaneo)
  const respondidas = contarRespondidas(questoes, instantaneo)

  return (
    <aside className="teorico-mapa" aria-label="Mapa de questões">
      <div className="teorico-mapa-topo">
        <h2 className="teorico-mapa-titulo">Mapa de questões</h2>
        <p className="teorico-mapa-contagem">
          <span className="dado-mono">{respondidas}</span> de <span className="dado-mono">{questoes.length}</span> respondidas
        </p>
      </div>
      <div className="teorico-filtros" role="group" aria-label="Filtrar questões">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            className="teorico-filtro"
            aria-pressed={filtro === f.id}
            onClick={() => setFiltro(f.id)}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      {visiveis.length === 0 ? (
        <p className="teorico-mapa-vazio" role="status">
          Nenhuma questão neste filtro.
        </p>
      ) : (
        <ol className="teorico-mapa-lista">
          {visiveis.map((q) => {
            const posicao = questoes.findIndex((x) => x.id === q.id)
            const atual = posicao === indice
            return (
              <li key={q.id}>
                <button
                  type="button"
                  className="teorico-mapa-item"
                  data-atual={atual}
                  aria-current={atual ? 'true' : undefined}
                  onClick={() => aoIr(posicao)}
                >
                  <span className="teorico-mapa-numero dado-mono">{posicao + 1}</span>
                  <span className="teorico-mapa-enunciado">{trecho(q.enunciado)}</span>
                  <span className="teorico-selos">
                    {selosDaQuestao(q.id, atual, instantaneo).map((s) => (
                      <span key={s} className="teorico-selo" data-selo={s}>
                        {ROTULO_SELO[s]}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
      <button type="button" className="teorico-botao teorico-botao-sucesso" onClick={aoFinalizar} disabled={finalizarDesabilitado}>
        Finalizar
      </button>
    </aside>
  )
}
