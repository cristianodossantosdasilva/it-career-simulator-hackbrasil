import { Component, type ReactNode } from 'react'
import { BarraDaJornada } from './jornada/BarraDaJornada'
import { useVoo } from './jornada/contextosJornada'
import { useLocalAtual } from './jornada/navegacao/navegador'
import { Roteador } from './jornada/navegacao/Roteador'
import { renderizarPaginaJornada } from './jornada/paginas/renderizarPaginaJornada'
import { ProvedorJornada } from './jornada/ProvedorJornada'
import { AppShell } from './shell/AppShell'

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

/** AppShell com a densidade derivada do voo em memória. */
function CascaJornada({ children }: { children: ReactNode }) {
  const { sessaoId, sessao } = useVoo()
  const local = useLocalAtual()
  const sessaoAtiva = Boolean(sessaoId && sessao)
  const naCabine = local.caminho.startsWith('/cabine/')
  return (
    <AppShell densidade={sessaoAtiva && naCabine ? 'operacional' : 'editorial'}>{children}</AppShell>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <ProvedorJornada>
        <CascaJornada>
          <Roteador
            barra={(rota) => <BarraDaJornada pagina={rota.pagina} />}
            renderizarPagina={renderizarPaginaJornada}
          />
        </CascaJornada>
      </ProvedorJornada>
    </ErrorBoundary>
  )
}

export default App
