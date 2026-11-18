import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ContextoShell, type DensidadeShell, type ValorShell } from './contextoShell'
import { type TemaShell, aplicarTema, carregarTema, salvarTema } from './tema'

interface AppShellProps {
  children: ReactNode
  densidade?: DensidadeShell
}

/**
 * Casca unica da Academia e da Workstation. Guarda o tema, expoe o contexto do shell e reserva
 * o espaco do rail (desktop) e da barra inferior (celular). A navegacao fica em BarraSuperior.
 */
export function AppShell({ children, densidade = 'editorial' }: AppShellProps) {
  const [tema, setTema] = useState<TemaShell>(carregarTema)

  useEffect(() => {
    aplicarTema(tema)
    salvarTema(tema)
  }, [tema])

  const valor = useMemo<ValorShell>(
    () => ({ tema, definirTema: setTema }),
    [tema],
  )

  return (
    <ContextoShell.Provider value={valor}>
      <div className="app-shell" data-density={densidade}>
        {children}
      </div>
    </ContextoShell.Provider>
  )
}
