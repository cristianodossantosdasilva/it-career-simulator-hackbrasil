import { Component, type ReactNode, useState } from 'react'
import { apiClient, ConflitoSeqError } from './api/client'
import type { ReplayResponse, SessaoProjecao } from './api/types'
import { ChatApp } from './apps/ChatApp/ChatApp'
import { IntranetApp } from './apps/IntranetApp/IntranetApp'
import { ItsmApp } from './apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from './apps/SimuDeskApp/SimuDeskApp'
import { ReplayView } from './replay/ReplayView'
import { TelaInicial } from './workstation/TelaInicial'

type Aba = 'itsm' | 'chat' | 'simudesk' | 'kb' | 'replay'

class ErrorBoundary extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  render() {
    if (this.state.erro) {
      return (
        <div className="start-screen">
          <div className="start-card">
            <h2>Erro na Workstation</h2>
            <p className="alert-danger">{this.state.erro.message}</p>
            <button type="button" className="btn-primary" onClick={() => this.setState({ erro: null })}>
              Recarregar Interface
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function obterProximaDicaMissao(sessao: SessaoProjecao): string {
  const cenario = sessao.meta.cenarioId
  const ch1 = sessao.chamados[0]
  if (!ch1) return 'Explore a Workstation.'
  if (cenario === 'triagem-engenharia-social') {
    if (ch1.status === 'Novo') return '1) Assuma o chamado no ITSM e consulte a politica de seguranca.'
    if (ch1.status === 'EmAtendimento') return '2) Consulte a politica KB-001, registre nota interna e recuse o reset fraudulento.'
    return 'Missao concluida! Abra Avaliacao & Replay para conferir seu Curriculo Vivo.'
  }
  if (cenario === 'incidente-massivo') {
    if (sessao.problemas.length === 0) return '1) Crie um Problema ITIL no ITSM e vincule os 3 chamados.'
    if (!sessao.estacao.servicos.some((s) => s.nome === 'AuroraGateway' && s.status === 'Running')) {
      return '2) Investigue logs/servicos no SimuDesk, eleve privilegio e inicie o AuroraGateway.'
    }
    if (!sessao.problemas.some((p) => p.resolvido)) return '3) Registre a causa raiz no Problema e resolva em lote.'
    return 'Incidente massivo resolvido! Confira Avaliacao & Replay.'
  }
  if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado CH-0001 no ITSM.'
  if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador (AUR-1042 / 2042) para liberar o SimuDesk.'
  if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, execute diagnostico antes de alterar e corrija a causa raiz.'
  if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 no ITSM com nota publica.'
  return 'Atendimento concluido! Confira o Relatorio do Juiz 360º e seu Curriculo Vivo.'
}

function WorkstationInner() {
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<SessaoProjecao | null>(null)
  const [aba, setAba] = useState<Aba>('itsm')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [replay, setReplay] = useState<ReplayResponse | null>(null)
  const [historicoTerminal, setHistoricoTerminal] = useState<
    { cmd: string; saida: string; priv: string }[]
  >([])

  async function iniciarSessao(cenarioId: string, semente?: number, causaForcada?: string) {
    setOcupado(true)
    setAviso(null)
    try {
      const criada = await apiClient.criarSessao({ cenarioId, semente, causaForcada })
      const proj = await apiClient.obterSessao(criada.sessaoId)
      setSessaoId(criada.sessaoId)
      setSessao(proj)
      setReplay(null)
      setHistoricoTerminal([])
      setAba('itsm')
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Erro ao iniciar sessao')
    } finally {
      setOcupado(false)
    }
  }

  async function executarAcao(tipo: string, dados?: Record<string, unknown>) {
    if (!sessaoId || !sessao) return
    setOcupado(true)
    setAviso(null)
    try {
      const res = await apiClient.executarAcao(sessaoId, tipo, sessao.ultimoSeq, dados)
      setSessao(res.projecao)
      for (const ev of res.eventos) {
        if (ev.tipo === 'AcaoRejeitada') {
          setAviso(`Acao rejeitada: ${String(ev.dados?.motivo ?? 'regra de negocio')}`)
        } else if (ev.tipo === 'PistaSolicitada') {
          setAviso(String(ev.dados?.texto ?? 'Pista registrada.'))
        } else if (ev.tipo === 'DnsRegistroCorrigido') {
          setAviso('N2 Virtual corrigiu o DNS! Eleve o privilegio e execute ipconfig /flushdns no SimuDesk.')
        } else if (ev.tipo === 'AcessoPastaRestabelecido') {
          setAviso('Pasta Financeiro restabelecida! Agora resolva o chamado no ITSM com nota publica.')
        } else if (ev.tipo === 'ComandoExecutado' || ev.tipo === 'ComandoNaoSuportado') {
          setHistoricoTerminal((prev) => [
            ...prev,
            {
              cmd: String(ev.dados?.comando ?? ''),
              saida: String(ev.dados?.saida ?? ''),
              priv: String(ev.dados?.privilegio ?? sessao.estacao.privilegio),
            },
          ])
        }
      }
    } catch (err) {
      if (err instanceof ConflitoSeqError) {
        const atual = await apiClient.obterSessao(sessaoId)
        setSessao(atual)
        setAviso(err.message)
      } else {
        setAviso(err instanceof Error ? err.message : 'Erro ao executar acao')
      }
    } finally {
      setOcupado(false)
    }
  }

  async function enviarChat(persona: 'cliente' | 'techlead', mensagem: string) {
    if (!sessaoId || !sessao) return
    setOcupado(true)
    setAviso(null)
    try {
      const res = await apiClient.enviarChat(sessaoId, persona, mensagem, sessao.ultimoSeq)
      setSessao(res.projecao)
    } catch (err) {
      if (err instanceof ConflitoSeqError) {
        const atual = await apiClient.obterSessao(sessaoId)
        setSessao(atual)
        setAviso(err.message)
      } else {
        setAviso(err instanceof Error ? err.message : 'Erro no chat')
      }
    } finally {
      setOcupado(false)
    }
  }

  async function carregarReplay() {
    if (!sessaoId) return
    setOcupado(true)
    try {
      const r = await apiClient.obterReplay(sessaoId)
      setReplay(r)
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Erro ao carregar replay')
    } finally {
      setOcupado(false)
    }
  }

  if (!sessaoId || !sessao) {
    return <TelaInicial onIniciar={iniciarSessao} ocupado={ocupado} erro={aviso} />
  }

  return (
    <div className="workstation">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">IT Flight Simulator</span>
          <span className="badge badge-info">{sessao.meta.nivel}</span>
          <span className="muted">Cenario: {sessao.meta.cenarioId}</span>
        </div>

        <div className="topbar-right">
          <span className="badge badge-ok">Tempo Simulado: {sessao.meta.minutoSimulado}m</span>
          <span className="badge">Seq #{sessao.ultimoSeq}</span>
          <button
            type="button"
            onClick={() => {
              setSessaoId(null)
              setSessao(null)
            }}
          >
            Trocar Nivel
          </button>
        </div>
      </header>

      <div className="mission-strip" role="status">
        <span>
          <strong>Missao Atual:</strong> {obterProximaDicaMissao(sessao)}
        </span>
        <span className="muted">Aurora Logistica · Semente {sessao.meta.semente}</span>
      </div>

      {aviso && (
        <div className="banner-notice" role="status" aria-live="polite">
          <span>{aviso}</span>
          <button type="button" className="chip" onClick={() => setAviso(null)}>
            Fechar
          </button>
        </div>
      )}

      <div className="cockpit-body">
        <aside className="app-dock" aria-label="Aplicativos da Workstation">
          <button type="button" className={`dock-btn ${aba === 'itsm' ? 'active' : ''}`} onClick={() => setAba('itsm')}>
            <span>ITSM / Chamados</span>
            <span className="badge">{sessao.chamados.length}</span>
          </button>
          <button type="button" className={`dock-btn ${aba === 'chat' ? 'active' : ''}`} onClick={() => setAba('chat')}>
            <span>Comunicador IA</span>
            <span className="badge">{sessao.dialogo.mensagens.length}</span>
          </button>
          <button type="button" className={`dock-btn ${aba === 'simudesk' ? 'active' : ''}`} onClick={() => setAba('simudesk')}>
            <span>SimuDesk Remoto</span>
            <span className={`badge ${sessao.dialogo.acessoRemotoLiberado ? 'badge-ok' : ''}`}>
              {sessao.dialogo.acessoRemotoLiberado ? 'ON' : 'LOCK'}
            </span>
          </button>
          <button type="button" className={`dock-btn ${aba === 'kb' ? 'active' : ''}`} onClick={() => setAba('kb')}>
            <span>Intranet / KB</span>
            <span className="badge">KB</span>
          </button>
          <button
            type="button"
            className={`dock-btn ${aba === 'replay' ? 'active' : ''}`}
            onClick={() => {
              setAba('replay')
              void carregarReplay()
            }}
          >
            <span>Juiz 360º &amp; Replay</span>
            <span className="badge badge-info">XP</span>
          </button>
        </aside>

        <main className="workspace-main">
          {aba === 'itsm' && <ItsmApp sessao={sessao} onAcao={executarAcao} ocupado={ocupado} />}
          {aba === 'chat' && <ChatApp sessao={sessao} onChat={enviarChat} onAcao={executarAcao} ocupado={ocupado} />}
          {aba === 'simudesk' && (
            <SimuDeskApp
              sessao={sessao}
              historicoTerminal={historicoTerminal}
              onComando={(comando) => executarAcao('estacao.executar_comando', { comando })}
              onAcao={executarAcao}
              ocupado={ocupado}
            />
          )}
          {aba === 'kb' && <IntranetApp />}
          {aba === 'replay' && <ReplayView replay={replay} onAtualizar={carregarReplay} ocupado={ocupado} />}
        </main>
      </div>
    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <WorkstationInner />
    </ErrorBoundary>
  )
}

export default App
