import type { EstadoAcademia, FlashCardComNivel } from '../educacao/catalogoEducacional'
import { Icone } from '../ui/Icone'
import { formatarTimer } from './usePomodoro'

interface PainelPerfilExtraProps {
  estado: EstadoAcademia
  cardsHoje: FlashCardComNivel[]
  pomodoro: { segundos: number; rodando: boolean; alternar: () => void; zerar: () => void }
  onRevisar: () => void
  onAlternarTarefa: (indice: number) => void
  onEditarPlano: () => void
}

/** Pomodoro, meta semanal, revisoes e plano de estudos. Vive no menu de perfil, fora da primeira dobra. */
export function PainelPerfilExtra({
  estado,
  cardsHoje,
  pomodoro,
  onRevisar,
  onAlternarTarefa,
  onEditarPlano,
}: PainelPerfilExtraProps) {
  const pctSemana = Math.min(100, Math.round((estado.weekMin / Math.max(1, estado.weekGoal)) * 100))
  const plano = estado.pages.find((p) => p.id === 'plano')

  return (
    <>
      <section className="perfil-bloco" aria-labelledby="perfil-meta">
        <h3 id="perfil-meta" className="perfil-bloco-titulo">
          Meta semanal
        </h3>
        <p className="perfil-bloco-texto">
          <span className="dado-mono">{estado.weekMin}</span> de <span className="dado-mono">{estado.weekGoal}</span> min
          ({pctSemana}%)
        </p>
        <progress className="medidor" value={pctSemana} max={100} aria-labelledby="perfil-meta" />
      </section>

      <section className="perfil-bloco" aria-labelledby="perfil-foco">
        <h3 id="perfil-foco" className="perfil-bloco-titulo">
          Timer de foco (25 minutos)
        </h3>
        <div className="perfil-linha">
          <span className="pomodoro-tempo dado-mono" role="timer" aria-label="Tempo restante do foco">
            {formatarTimer(pomodoro.segundos)}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={pomodoro.alternar}>
            {pomodoro.rodando ? 'Pausar' : 'Iniciar'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={pomodoro.zerar}>
            Zerar
          </button>
        </div>
      </section>

      <section className="perfil-bloco" aria-labelledby="perfil-revisao">
        <h3 id="perfil-revisao" className="perfil-bloco-titulo">
          Revisões de hoje
        </h3>
        <div className="perfil-linha">
          <span className="perfil-bloco-texto">
            <span className="dado-mono">{cardsHoje.length}</span> flashcard(s) para revisar
          </span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={cardsHoje.length === 0} onClick={onRevisar}>
            <Icone nome="cartoes" tamanho={16} />
            Revisar
          </button>
        </div>
      </section>

      <section className="perfil-bloco" aria-labelledby="perfil-plano">
        <div className="perfil-linha">
          <h3 id="perfil-plano" className="perfil-bloco-titulo">
            Plano de estudos
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEditarPlano}>
            Editar no caderno
          </button>
        </div>
        {(plano?.todos ?? []).length === 0 ? (
          <p className="perfil-bloco-texto">Nenhuma tarefa no plano.</p>
        ) : (
          <ul className="perfil-tarefas">
            {(plano?.todos ?? []).map((tarefa, indice) => (
              <li key={`${indice}-${tarefa.t}`} className={tarefa.done ? 'done' : undefined}>
                <input
                  type="checkbox"
                  id={`ht-${indice}`}
                  checked={tarefa.done}
                  onChange={() => onAlternarTarefa(indice)}
                />
                <label htmlFor={`ht-${indice}`}>{tarefa.t}</label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
