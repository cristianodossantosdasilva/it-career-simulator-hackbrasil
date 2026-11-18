import { type FocusEvent, useEffect, useId, useRef, useState } from 'react'
import { useAnuncioJornada } from '../jornada/navegacao/anuncioJornada'
import { type ArmazemAparencia, obterArmazemAparencia } from '../tema/armazemAparencia'
import { Icone } from '../ui/Icone'
import { PainelAparencia } from './PainelAparencia'

/** Botão da barra de contexto que abre o painel de aparência. O anúncio usa a região viva única da jornada. */
export function BotaoAparencia({ armazem }: { armazem?: ArmazemAparencia }) {
  // Cria o armazem no primeiro render, mesmo com o painel fechado: assim o html ja traz o tema aplicado.
  const armazemEmUso = armazem ?? obterArmazemAparencia()
  const [aberto, setAberto] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const idPainel = useId()
  const { anunciar } = useAnuncioJornada()

  useEffect(() => {
    if (!aberto) return
    function aoApontarFora(evento: PointerEvent) {
      if (raizRef.current && !raizRef.current.contains(evento.target as Node)) setAberto(false)
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return
      setAberto(false)
      botaoRef.current?.focus()
    }
    document.addEventListener('pointerdown', aoApontarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoApontarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  function aoPerderFoco(evento: FocusEvent<HTMLDivElement>) {
    const destino = evento.relatedTarget as Node | null
    if (destino !== null && !evento.currentTarget.contains(destino)) setAberto(false)
  }

  return (
    <div className="aparencia" ref={raizRef} onBlur={aoPerderFoco}>
      <button
        ref={botaoRef}
        type="button"
        className="botao-contexto"
        aria-expanded={aberto}
        aria-controls={aberto ? idPainel : undefined}
        onClick={() => setAberto((valor) => !valor)}
      >
        <Icone nome="aparencia" />
        <span className="botao-contexto-texto">Aparência</span>
        <Icone nome="expandir" tamanho={16} />
      </button>
      {aberto && <PainelAparencia id={idPainel} aoAnunciar={anunciar} armazem={armazemEmUso} />}
    </div>
  )
}
