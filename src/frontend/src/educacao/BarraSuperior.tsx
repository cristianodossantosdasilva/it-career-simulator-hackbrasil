import { LEVELS, type EstadoAcademia, type NivelId, obterPatente } from './catalogoEducacional'

export type VisaoAcademia = 'home' | 'aulas' | 'caderno' | 'mentor'

interface BarraSuperiorProps {
  visaoAtual: VisaoAcademia | 'lab'
  estado: EstadoAcademia
  tema: 'light' | 'dark'
  xpOficial?: number
  onAlternarTema: () => void
  onSelecionarVisao?: (visao: VisaoAcademia) => void
  onEntrarLaboratorio?: () => void
  onMudarFoco?: (nivel: NivelId) => void
  onAbrirCurriculo?: () => void
  slotDireitoSessao?: React.ReactNode
}

export function BarraSuperior({
  visaoAtual,
  estado,
  tema,
  xpOficial,
  onAlternarTema,
  onSelecionarVisao,
  onEntrarLaboratorio,
  onMudarFoco,
  onAbrirCurriculo,
  slotDireitoSessao,
}: BarraSuperiorProps) {
  const xpTotal = xpOficial ?? estado.xp
  const patente = obterPatente(estado)

  return (
    <>
      <header className="topnav">
        <div className="brand">
          <div className="brand-logo-badge" aria-hidden="true">
            ✈
          </div>
          <div>
            <div className="brand-name">IT Flight Simulator</div>
            <div className="brand-sub">Academia de Suporte de TI · Hack Brasil 2026</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Navegação principal">
          <button
            type="button"
            className={`nav-link ${visaoAtual === 'home' ? 'active' : ''}`}
            aria-current={visaoAtual === 'home' ? 'page' : undefined}
            onClick={() => onSelecionarVisao?.('home')}
          >
            🏠 Painel
          </button>
          <button
            type="button"
            className={`nav-link ${visaoAtual === 'aulas' ? 'active' : ''}`}
            aria-current={visaoAtual === 'aulas' ? 'page' : undefined}
            onClick={() => onSelecionarVisao?.('aulas')}
          >
            📖 Aulas
          </button>
          <button
            type="button"
            className={`nav-link ${visaoAtual === 'caderno' ? 'active' : ''}`}
            aria-current={visaoAtual === 'caderno' ? 'page' : undefined}
            onClick={() => onSelecionarVisao?.('caderno')}
          >
            📓 Caderno
          </button>
          <button
            type="button"
            className={`nav-link ${visaoAtual === 'mentor' ? 'active' : ''}`}
            aria-current={visaoAtual === 'mentor' ? 'page' : undefined}
            onClick={() => onSelecionarVisao?.('mentor')}
          >
            🤖 Mentor IA
          </button>
          <button
            type="button"
            className={`nav-link ${visaoAtual === 'lab' ? 'active' : ''}`}
            aria-current={visaoAtual === 'lab' ? 'page' : undefined}
            onClick={() => onEntrarLaboratorio?.()}
          >
            🛠️ Laboratório
          </button>
        </nav>

        <div className="nav-right">
          {slotDireitoSessao}
          <span className="nav-chip hide-sm" title="Dias seguidos estudando">
            🔥 {estado.streak} dia(s)
          </span>
          <span className="nav-chip">⭐ {xpTotal} XP</span>
          <button
            type="button"
            className="nav-btn"
            aria-label={tema === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            onClick={onAlternarTema}
          >
            {tema === 'light' ? '🌙 Tema Escuro' : '☀️ Tema Claro'}
          </button>
          {onAbrirCurriculo && (
            <button type="button" className="nav-btn solid" onClick={onAbrirCurriculo}>
              📜 Currículo Vivo
            </button>
          )}
        </div>
      </header>

      {visaoAtual !== 'lab' && onMudarFoco && (
        <div className="subbar">
          <label htmlFor="focus-select" className="sub-label">
            Nível em foco
          </label>
          <select
            id="focus-select"
            className="text sm"
            value={estado.focus}
            onChange={(e) => onMudarFoco(e.target.value as NivelId)}
          >
            {LEVELS.map((L) => (
              <option key={L.id} value={L.id}>
                {L.icon} {L.nome}
              </option>
            ))}
          </select>
          <span className="chip c-mastery">🎖️ {patente}</span>
          <div className="legend" aria-label="Legenda das cores do ciclo de aprendizagem">
            <span className="lg theory">Teoria</span>
            <span className="lg fix">Fixação</span>
            <span className="lg practice">Prática</span>
            <span className="lg mastery">Domínio</span>
          </div>
        </div>
      )}
    </>
  )
}
