import { useState } from 'react'
import type { ChamadoDto } from '../../api/types'
import { Icone } from '../../ui/Icone'
import {
  FILTROS_MAPA,
  type FiltroMapa,
  chamadoEncerrado,
  contagemPorFiltro,
  filtrarChamados,
  selosDoChamado,
} from './filaDeChamados'
import './cabine.css'

interface Props {
  chamados: readonly ChamadoDto[]
  atualId: string | null
  marcas: readonly string[]
  aoEscolher: (id: string) => void
  aoAlternarRevisar: (id: string) => void
}

/** Mapa lateral dos chamados da missão: contagem, filtros e selos. */
export function MapaDeChamados({ chamados, atualId, marcas, aoEscolher, aoAlternarRevisar }: Props) {
  const [filtro, setFiltro] = useState<FiltroMapa>('todos')
  const contagem = contagemPorFiltro(chamados, marcas)
  const visiveis = filtrarChamados(chamados, filtro, marcas)
  const resolvidos = chamados.filter(chamadoEncerrado).length

  return (
    <section className="mapa-chamados" aria-label="Mapa de chamados">
      <div className="mapa-chamados-cabecalho">
        <h2 className="lab-guia-subtitulo">Mapa de chamados</h2>
        <p className="muted">
          <span className="dado-mono">{resolvidos}</span> de <span className="dado-mono">{chamados.length}</span> resolvidos
        </p>
      </div>
      <div className="mapa-filtros" role="group" aria-label="Filtrar chamados">
        {FILTROS_MAPA.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip mapa-filtro"
            aria-pressed={filtro === item.id}
            onClick={() => setFiltro(item.id)}
          >
            {item.rotulo} <span className="dado-mono">{contagem[item.id]}</span>
          </button>
        ))}
      </div>
      {visiveis.length === 0 ? (
        <p className="muted mapa-vazio" role="status">
          Nenhum chamado neste filtro.
        </p>
      ) : (
        <ul className="mapa-lista">
          {visiveis.map((chamado) => {
            const atual = chamado.id === atualId
            const marcado = marcas.includes(chamado.id)
            return (
              <li key={chamado.id} className="mapa-item" data-atual={atual}>
                <button
                  type="button"
                  className="mapa-item-botao"
                  aria-current={atual ? 'true' : undefined}
                  onClick={() => aoEscolher(chamado.id)}
                >
                  <span className="dado-mono mapa-item-chave">{chamado.id}</span>
                  <span className="mapa-item-titulo">{chamado.titulo}</span>
                  <span className="mapa-selos">
                    {selosDoChamado(chamado, atual, marcado).map((selo) => (
                      <span key={selo.id} className="mapa-selo" data-selo={selo.id}>
                        {selo.rotulo}
                      </span>
                    ))}
                  </span>
                </button>
                <button
                  type="button"
                  className="mapa-revisar"
                  aria-pressed={marcado}
                  aria-label={`${marcado ? 'Desmarcar' : 'Marcar'} ${chamado.id} para revisar`}
                  onClick={() => aoAlternarRevisar(chamado.id)}
                >
                  <Icone nome="notas" tamanho={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
