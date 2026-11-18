import type { ReactNode } from 'react'

export type DensidadeShell = 'editorial' | 'operacional'

interface AppShellProps {
  children: ReactNode
  densidade?: DensidadeShell
}

/**
 * Casca unica da Academia e da Workstation. Reserva o espaco do rail (desktop) e da barra inferior
 * (celular). A navegacao fica em BarraSuperior. A aparencia nao passa por aqui: ela vive no armazem
 * de src/tema, que o script inicial e o BotaoAparencia usam.
 */
export function AppShell({ children, densidade = 'editorial' }: AppShellProps) {
  return (
    <div className="app-shell" data-density={densidade}>
      {children}
    </div>
  )
}
