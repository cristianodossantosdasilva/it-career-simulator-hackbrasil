import { useCallback, useEffect, useRef, useState } from 'react'

const DURACAO_SEGUNDOS = 25 * 60
const MINUTOS_CREDITADOS = 25

export function formatarTimer(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Temporizador de foco 25 minutos. O estado fica fora do menu de perfil para que a contagem
 * continue com o painel fechado. Ao terminar, avisa quantos minutos creditar na meta semanal.
 */
export function usePomodoro(aoConcluir: (minutos: number) => void) {
  const [segundos, setSegundos] = useState(DURACAO_SEGUNDOS)
  const [rodando, setRodando] = useState(false)
  const restante = useRef(DURACAO_SEGUNDOS)
  const concluir = useRef(aoConcluir)

  useEffect(() => {
    concluir.current = aoConcluir
  }, [aoConcluir])

  useEffect(() => {
    if (!rodando) return
    const id = window.setInterval(() => {
      restante.current -= 1
      if (restante.current > 0) {
        setSegundos(restante.current)
        return
      }
      restante.current = DURACAO_SEGUNDOS
      setSegundos(DURACAO_SEGUNDOS)
      setRodando(false)
      concluir.current(MINUTOS_CREDITADOS)
    }, 1000)
    return () => window.clearInterval(id)
  }, [rodando])

  const alternar = useCallback(() => setRodando((valor) => !valor), [])
  const zerar = useCallback(() => {
    restante.current = DURACAO_SEGUNDOS
    setRodando(false)
    setSegundos(DURACAO_SEGUNDOS)
  }, [])

  return { segundos, rodando, alternar, zerar }
}
