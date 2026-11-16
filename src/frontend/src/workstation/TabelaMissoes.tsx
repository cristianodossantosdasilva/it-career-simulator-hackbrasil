import {
  LEVELS,
  type EstadoAcademia,
  type NivelEducacional,
  calcularProgressoNivel,
} from '../educacao/catalogoEducacional'
import { Icone } from '../ui/Icone'

interface TabelaMissoesProps {
  estado: EstadoAcademia
  cenarioSelecionado: string
  ocupado: boolean
  semente: string
  onSementeChange: (valor: string) => void
  onSelecionar: (nivel: NivelEducacional) => void
  onAbrirAulas: (nivel: NivelEducacional) => void
  onPraticar: (nivel: NivelEducacional) => void
  onDecolar: () => void
  onDemoRapida: () => void
}

function descreverEstado(p: { t: number; f: number; p: number }): { texto: string; concluida: boolean } {
  if (p.p === 100) return { texto: 'Concluída', concluida: true }
  if (p.t > 0 || p.f > 0) return { texto: 'Em andamento', concluida: false }
  return { texto: 'Não iniciada', concluida: false }
}

/** Lista das 5 missoes. Cada linha e um radio (escolhe o cenario) seguido do estado e das acoes. */
export function TabelaMissoes({
  estado,
  cenarioSelecionado,
  ocupado,
  semente,
  onSementeChange,
  onSelecionar,
  onAbrirAulas,
  onPraticar,
  onDecolar,
  onDemoRapida,
}: TabelaMissoesProps) {
  const temSelecao = cenarioSelecionado !== ''
  return (
    <section className="missoes" aria-labelledby="missoes-titulo">
      <div className="missoes-cabecalho">
        <h2 id="missoes-titulo" className="h2">
          Missões
        </h2>
        <p className="muted">Escolha um nível para estudar na Academia ou para decolar direto no laboratório.</p>
      </div>

      <div role="radiogroup" aria-label="Escolha o nível da simulação" className="missoes-lista">
        {LEVELS.map((nivel, indice) => {
          const progresso = calcularProgressoNivel(estado, nivel.id)
          const situacao = descreverEstado(progresso)
          const selecionado = cenarioSelecionado === nivel.cenarioId
          const iniciada = progresso.t > 0 || progresso.f > 0 || progresso.p > 0
          return (
            <div key={nivel.id} className={`missao-linha ${selecionado ? 'current' : ''}`}>
              <button
                type="button"
                role="radio"
                aria-checked={selecionado}
                className={`missao-escolha ${selecionado ? 'selected' : ''}`}
                onClick={() => onSelecionar(nivel)}
              >
                <span className="missao-numero dado-mono" aria-hidden="true">
                  {indice + 1}
                </span>
                <span className="missao-texto">
                  <span className="missao-cargo">{nivel.cargo}</span>
                  <span className="missao-titulo">{nivel.titulo}</span>
                  <span className="missao-desc">{nivel.desc}</span>
                  <span className="missao-competencias">{nivel.competencias}</span>
                </span>
              </button>

              <div className="missao-estado">
                <p className={`missao-situacao ${situacao.concluida ? 'concluida' : ''}`}>
                  {situacao.concluida && <Icone nome="confirmar" tamanho={16} />}
                  {situacao.texto}
                </p>
                {iniciada && (
                  <p className="missao-progresso dado-mono">
                    Teoria {progresso.t}%, Fixação {progresso.f}%, Prática {progresso.p}%
                  </p>
                )}
              </div>

              <div className="missao-acoes">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAbrirAulas(nivel)}>
                  <Icone nome="aulas" tamanho={16} />
                  Aulas
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={ocupado} onClick={() => onPraticar(nivel)}>
                  <Icone nome="laboratorio" tamanho={16} />
                  Praticar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="missoes-lancamento">
        <label className="field-stack">
          Semente (opção avançada para repetir causa)
          <input
            type="number"
            placeholder="Aleatória"
            value={semente}
            onChange={(e) => onSementeChange(e.target.value)}
          />
        </label>
        <div className="missoes-lancamento-acoes">
          {!temSelecao && (
            <p id="decolar-apoio" className="muted">
              Escolha uma missão
            </p>
          )}
          <button type="button" className="btn btn-secondary" disabled={ocupado} onClick={onDemoRapida}>
            Demo rápida: Nível 2, C1
          </button>
          <button
            type="button"
            className={`btn btn-lg ${temSelecao ? 'btn-primary' : 'btn-secondary btn-indisponivel'}`}
            disabled={ocupado}
            aria-disabled={temSelecao ? undefined : true}
            aria-describedby={temSelecao ? undefined : 'decolar-apoio'}
            onClick={() => {
              if (!temSelecao) return
              onDecolar()
            }}
          >
            {ocupado ? 'Preparando a Workstation...' : 'Decolar no Simulador'}
            {!ocupado && <Icone nome="avancar" />}
          </button>
        </div>
      </div>
    </section>
  )
}
