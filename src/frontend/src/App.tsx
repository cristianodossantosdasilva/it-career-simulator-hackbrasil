import { useState } from 'react'
import { apiClient, ConflitoSeqError } from './api/client'
import type { ReplayResponse, SessaoProjecao } from './api/types'
import { ChatApp } from './apps/ChatApp/ChatApp'
import { IntranetApp } from './apps/IntranetApp/IntranetApp'
import { ItsmApp } from './apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from './apps/SimuDeskApp/SimuDeskApp'
import { ReplayView } from './replay/ReplayView'
import { TelaInicial } from './workstation/TelaInicial'

type Aba = 'itsm' | 'chat' | 'simudesk' | 'kb' | 'replay'

export function App() {
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<SessaoProjecao | null>(null)
  const [aba, setAba] = useState<Aba>('itsm')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [replay, setReplay] = useState<ReplayResponse | null>(null)
  const [historicoTerminal, setHistoricoTerminal] = useState<
    { cmd: string; saida: string; priv: string }[]
  >([])

  async function iniciarSessao(cenarioId: string, semente?: number) {
    setOcupado(true)
    setAviso(null)
    try {
      const criada = await apiClient.criarSessao({ cenarioId, semente })
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
          <strong>IT Flight Simulator</strong>
          <span className="badge">{sessao.meta.nivel}</span>
          <span className="muted">Cenario: {sessao.meta.cenarioId}</span>
        </div>

        <nav className="nav-tabs" role="tablist" aria-label="Aplicativos da Workstation">
          <button type="button" role="tab" aria-selected={aba === 'itsm'} className={aba === 'itsm' ? 'active' : ''} onClick={() => setAba('itsm')}>
            ITSM ({sessao.chamados.length})
          </button>
          <button type="button" role="tab" aria-selected={aba === 'chat'} className={aba === 'chat' ? 'active' : ''} onClick={() => setAba('chat')}>
            Comunicador
          </button>
          <button type="button" role="tab" aria-selected={aba === 'simudesk'} className={aba === 'simudesk' ? 'active' : ''} onClick={() => setAba('simudesk')}>
            SimuDesk
          </button>
          <button type="button" role="tab" aria-selected={aba === 'kb'} className={aba === 'kb' ? 'active' : ''} onClick={() => setAba('kb')}>
            Intranet / KB
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'replay'}
            className={aba === 'replay' ? 'active' : ''}
            onClick={() => {
              setAba('replay')
              void carregarReplay()
            }}
          >
            Avaliacao &amp; Replay
          </button>
        </nav>

        <div className="topbar-right">
          <span className="badge">Tempo: {sessao.meta.minutoSimulado}m</span>
          <button
            type="button"
            onClick={() => {
              setSessaoId(null)
              setSessao(null)
            }}
          >
            Nova Sessao
          </button>
        </div>
      </header>

      {aviso && (
        <div className="banner-notice" role="status" aria-live="polite">
          <span>{aviso}</span>
          <button type="button" className="chip" onClick={() => setAviso(null)}>
            Fechar
          </button>
        </div>
      )}

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
  )
}

export default App
