import { Component, type ReactNode } from 'react'
import { useVoo } from './jornada/contextosJornada'
import { Roteador } from './jornada/navegacao/Roteador'
import { ProvedorJornada } from './jornada/ProvedorJornada'
import { AppShell } from './shell/AppShell'
import { WorkstationInner } from './workstation/WorkstationInner'

class ErrorBoundary extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  render() {
    if (this.state.erro) {
      return (
        <div className="page">
          <div className="edu-card card-b">
            <h2>Erro na Workstation</h2>
            <p className="alert-danger">{this.state.erro.message}</p>
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ erro: null })}>
              Recarregar Interface
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/** AppShell com a densidade e o atalho de retomada derivados do voo em memória. */
function CascaJornada({ children }: { children: ReactNode }) {
  const { sessaoId, sessao, emLaboratorio, retomarLaboratorio } = useVoo()
  const sessaoAtiva = Boolean(sessaoId && sessao)
  return (
    <AppShell
      densidade={sessaoAtiva && emLaboratorio ? 'operacional' : 'editorial'}
      sessaoAtiva={sessaoAtiva}
      onRetomarLaboratorio={retomarLaboratorio}
    >
      {children}
    </AppShell>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <ProvedorJornada>
        <CascaJornada>
          {/* Fase 1: todo endereço mostra a árvore atual, que já tem o próprio main. */}
          <Roteador comMoldura={false} renderizarPagina={() => <WorkstationInner />} />
        </CascaJornada>
      </ProvedorJornada>
    </ErrorBoundary>
  )
}

export default App
