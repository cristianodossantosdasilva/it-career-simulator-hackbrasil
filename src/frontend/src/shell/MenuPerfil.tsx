import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { LEVELS, type EstadoAcademia, type NivelId, obterPatente } from '../educacao/catalogoEducacional'
import { Icone } from '../ui/Icone'
import { AlternadorTema } from './AlternadorTema'

interface MenuPerfilProps {
  estado: EstadoAcademia
  xpTotal: number
  onMudarFoco?: (nivel: NivelId) => void
  onAbrirCurriculo?: () => void
  /** Conteudo extra do painel (Pomodoro, plano e meta entram aqui na etapa 3). */
  children?: ReactNode
}

export function MenuPerfil({ estado, xpTotal, onMudarFoco, onAbrirCurriculo, children }: MenuPerfilProps) {
  const [aberto, setAberto] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const idPainel = useId()
  const patente = obterPatente(estado)

  useEffect(() => {
    if (!aberto) return
    function aoApontarFora(evento: PointerEvent) {
      if (raizRef.current && !raizRef.current.contains(evento.target as Node)) setAberto(false)
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAberto(false)
        botaoRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', aoApontarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoApontarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <div className="menu-perfil" ref={raizRef}>
      <button
        ref={botaoRef}
        type="button"
        className="botao-contexto"
        aria-expanded={aberto}
        aria-controls={aberto ? idPainel : undefined}
        onClick={() => setAberto((valor) => !valor)}
      >
        <Icone nome="perfil" />
        <span className="botao-contexto-texto">Perfil</span>
        <Icone nome="expandir" tamanho={16} />
      </button>

      {aberto && (
        <div id={idPainel} className="menu-perfil-painel" role="region" aria-label="Seu progresso">
          <h2 className="menu-perfil-titulo">Seu progresso</h2>
          <dl className="menu-perfil-dados">
            <div>
              <dt>Patente</dt>
              <dd>{patente}</dd>
            </div>
            <div>
              <dt>Sequência</dt>
              <dd>
                <span className="dado-mono">{estado.streak}</span> dia(s)
              </dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd className="dado-mono">{xpTotal}</dd>
            </div>
          </dl>

          {onMudarFoco && (
            <label className="menu-perfil-campo" htmlFor="focus-select">
              Nível em foco
              <select
                id="focus-select"
                className="text sm"
                value={estado.focus}
                onChange={(e) => onMudarFoco(e.target.value as NivelId)}
              >
                {LEVELS.map((nivel) => (
                  <option key={nivel.id} value={nivel.id}>
                    {nivel.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {children}

          {onAbrirCurriculo && (
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-block so-mobile"
              onClick={() => {
                setAberto(false)
                onAbrirCurriculo()
              }}
            >
              <Icone nome="credencial" tamanho={16} />
              Credencial
            </button>
          )}

          <AlternadorTema variante="completo" className="so-mobile" />
        </div>
      )}
    </div>
  )
}
