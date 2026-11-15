import { Component, type ReactNode, useEffect, useRef, useState } from 'react'
import { apiClient, ConflitoSeqError } from './api/client'
import type { CarreiraResumoResponse, ReplayResponse, SessaoProjecao } from './api/types'
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

function obterProximaDicaMissao(
  sessao: SessaoProjecao,
  nivel1Passos?: { politica: boolean; token: boolean; recusado: boolean },
): string {
  const cenario = sessao.meta.cenarioId
  const ch1 = sessao.chamados[0]
  if (!ch1) return 'Explore a Workstation.'
  if (cenario === 'triagem-engenharia-social') {
    if (ch1.status === 'Novo') return '1) Clique em "Assumir Chamado" no ITSM.'
    if (!nivel1Passos?.politica) {
      return '2) Clique em "Consultar Politica KB-001" no painel Seguranca.'
    }
    if (!nivel1Passos?.token) {
      return '3) Clique em "Solicitar Token Corporativo" para verificar a identidade do solicitante.'
    }
    if (ch1.notas.every((n) => n.tipo !== 'Interna')) {
      return '4) Registre uma Nota Interna no chamado documentando a tentativa sem token.'
    }
    if (!nivel1Passos?.recusado) return '5) Clique em "Recusar Reset sem Validacao" no painel Seguranca.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') {
      return '6) Resolva o chamado no card "Resolver Chamado (Encerrar Recusa)" com nota publica.'
    }
    return 'Missao concluida! Abra "Juiz 360º & Replay" para conferir sua nota e Curriculo Vivo.'
  }
  if (cenario === 'incidente-massivo') {
    if (sessao.chamados.every((c) => c.status === 'Novo')) {
      return '1) Assuma um chamado no ITSM (classifique se precisar resolver individualmente) e crie um Problema ITIL.'
    }
    if (sessao.problemas.length === 0) return '2) Crie um Problema ITIL no ITSM e vincule os 3 chamados.'
    if (!sessao.dialogo.acessoRemotoLiberado) {
      return '3) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o SimuDesk.'
    }
    if (!sessao.estacao.servicos.some((s) => s.nome === 'AuroraGateway' && s.status === 'Running')) {
      return '4) Investigue logs/servicos no SimuDesk, eleve privilegio e inicie o AuroraGateway.'
    }
    if (!sessao.problemas.some((p) => p.resolvido)) return '5) Registre a causa raiz (servico + atualizacao) no Problema e resolva em lote.'
    return 'Incidente massivo resolvido! Confira Juiz 360º & Replay.'
  }
  if (cenario === 'sre-cloud-latencia') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o incidente SRE CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o SimuDesk.'
    if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, diagnostique pods/logs/curl, eleve privilegio e aplique a mitigacao.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 com nota de post-mortem.'
    return 'Incidente SRE mitigado! Confira Juiz 360º & Replay.'
  }
  if (cenario === 'diagnostico-sql-readonly') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado de auditoria SQL CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o console SQL.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '3) Execute SELECT somente leitura no SimuDesk (sem escrita) e resolva o chamado com o diagnostico.'
    return 'Auditoria SQL concluida! Confira Juiz 360º & Replay.'
  }
  if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado CH-0001 no ITSM.'
  if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador (AUR-1042 / 2042) para liberar o SimuDesk.'
  if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, execute diagnostico antes de alterar e corrija a causa raiz.'
  if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 no ITSM com nota publica.'
  return 'Atendimento concluido! Confira o Relatorio do Juiz 360º e seu Curriculo Vivo.'
}

const STORAGE_SESSOES_KEY = 'itfs_jornada_sessoes'

function carregarSessaoIdsSalvas(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_SESSOES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function salvarSessaoId(id: string): string[] {
  const atuais = carregarSessaoIdsSalvas()
  const atualizados = atuais.includes(id) ? atuais : [...atuais, id]
  try {
    window.localStorage.setItem(STORAGE_SESSOES_KEY, JSON.stringify(atualizados))
  } catch {
    // ignore storage errors
  }
  return atualizados
}

function WorkstationInner() {
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<SessaoProjecao | null>(null)
  const [aba, setAba] = useState<Aba>('itsm')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [replay, setReplay] = useState<ReplayResponse | null>(null)
  const [resumoCarreira, setResumoCarreira] = useState<CarreiraResumoResponse | null>(null)
  const [apelido, setApelido] = useState('')
  const [nivel1Passos, setNivel1Passos] = useState({ politica: false, token: false, recusado: false })
  const [historicoTerminal, setHistoricoTerminal] = useState<
    { cmd: string; saida: string; priv: string }[]
  >([])
  const [artigoKbSelecionado, setArtigoKbSelecionado] = useState<string | null>(null)
  const [kbRetornoLinkUri, setKbRetornoLinkUri] = useState<string | null>(null)
  const linkKbOrigemRef = useRef<HTMLElement | null>(null)

  function abrirArtigoKb(artigoId: string, origem: HTMLElement) {
    setKbRetornoLinkUri(
      origem.getAttribute('data-kb-uri') ?? origem.getAttribute('aria-label')?.replace(/^Consultar KB: /, '') ?? null,
    )
    linkKbOrigemRef.current = origem
    setArtigoKbSelecionado(artigoId)
    setAba('kb')
  }

  function fecharArtigoKb() {
    const origem = linkKbOrigemRef.current
    if (!origem) return
    setAba('replay')
    setArtigoKbSelecionado(null)
    requestAnimationFrame(() => {
      // ReplayView é remontada ao voltar para a aba e restaura o foco pelo URI estável.
      linkKbOrigemRef.current = null
    })
  }

  async function atualizarResumoCarreira(ids?: string[], nome?: string) {
    const lista = ids ?? carregarSessaoIdsSalvas()
    if (lista.length === 0) {
      setResumoCarreira(null)
      return
    }
    try {
      const resumo = await apiClient.obterResumoCarreira(lista, (nome ?? apelido).trim() || undefined)
      setResumoCarreira(resumo)
    } catch {
      // backend pode estar reiniciando; nao bloqueia tela inicial
    }
  }

  useEffect(() => {
    let ativo = true
    const lista = carregarSessaoIdsSalvas()
    if (lista.length === 0) return
    apiClient
      .obterResumoCarreira(lista)
      .then((resumo) => {
        if (ativo) setResumoCarreira(resumo)
      })
      .catch(() => {
        // backend pode estar reiniciando; nao bloqueia tela inicial
      })
    return () => {
      ativo = false
    }
  }, [])

  async function iniciarSessao(cenarioId: string, semente?: number, causaForcada?: string) {
    setOcupado(true)
    setAviso(null)
    try {
      const criada = await apiClient.criarSessao({ cenarioId, semente, causaForcada })
      const proj = await apiClient.obterSessao(criada.sessaoId)
      const ids = salvarSessaoId(criada.sessaoId)
      setSessaoId(criada.sessaoId)
      setSessao(proj)
      setReplay(null)
      setNivel1Passos({ politica: false, token: false, recusado: false })
      setHistoricoTerminal([])
      setAba('itsm')
      void atualizarResumoCarreira(ids)
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
        } else if (ev.tipo === 'PoliticaSegurancaConsultada') {
          setNivel1Passos((p) => ({ ...p, politica: true }))
          setAviso('Politica KB-001 consultada: reset de senha exige validacao de Matricula/Ramal e token corporativo.')
        } else if (ev.tipo === 'TokenSolicitado') {
          setNivel1Passos((p) => ({ ...p, token: true }))
          setAviso('Token corporativo verificado: solicitante NAO possui token valido (alerta de engenharia social!).')
        } else if (ev.tipo === 'ResetRecusado') {
          setNivel1Passos((p) => ({ ...p, recusado: true }))
          setAviso('Reset fraudulento recusado com seguranca! Abra "Juiz 360º & Replay" para conferir sua avaliacao.')
        } else if (ev.tipo === 'SenhaResetadaIndevidamente') {
          setAviso('ALERTA: Senha resetada sem verificacao! Incidente de seguranca registrado.')
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
    return (
      <TelaInicial
        onIniciar={iniciarSessao}
        ocupado={ocupado}
        erro={aviso}
        resumoCarreira={resumoCarreira}
        apelido={apelido}
        onApelidoChange={setApelido}
        onAtualizarCarreira={(nome) => void atualizarResumoCarreira(undefined, nome)}
      />
    )
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
            className="btn-secondary"
            aria-label="Voltar para a Tela Inicial"
            onClick={() => {
              setSessaoId(null)
              setSessao(null)
              void atualizarResumoCarreira()
            }}
          >
            ← Tela Inicial
          </button>
        </div>
      </header>

      <div className="mission-strip" role="status">
        <span>
          <strong>Missao Atual:</strong> {obterProximaDicaMissao(sessao, nivel1Passos)}
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
          <nav aria-label="Aplicativos da Workstation">
            <button type="button" aria-current={aba === 'itsm' ? 'page' : undefined} className={`dock-btn ${aba === 'itsm' ? 'active' : ''}`} onClick={() => setAba('itsm')}>
              <span>ITSM / Chamados</span>
              <span className="badge">{sessao.chamados.length}</span>
            </button>
            <button type="button" aria-current={aba === 'chat' ? 'page' : undefined} className={`dock-btn ${aba === 'chat' ? 'active' : ''}`} onClick={() => setAba('chat')}>
              <span>Comunicador IA</span>
              <span className="badge">{sessao.dialogo.mensagens.length}</span>
            </button>
            <button type="button" aria-current={aba === 'simudesk' ? 'page' : undefined} className={`dock-btn ${aba === 'simudesk' ? 'active' : ''}`} onClick={() => setAba('simudesk')}>
              <span>SimuDesk Remoto</span>
              <span className={`badge ${sessao.dialogo.acessoRemotoLiberado ? 'badge-ok' : ''}`}>
                {sessao.dialogo.acessoRemotoLiberado ? 'ON' : 'LOCK'}
              </span>
            </button>
            <button type="button" aria-current={aba === 'kb' ? 'page' : undefined} className={`dock-btn ${aba === 'kb' ? 'active' : ''}`} onClick={() => setAba('kb')}>
              <span>Intranet / KB</span>
              <span className="badge">KB</span>
            </button>
            <button
              type="button"
              aria-current={aba === 'replay' ? 'page' : undefined}
              className={`dock-btn ${aba === 'replay' ? 'active' : ''}`}
              onClick={() => {
                setAba('replay')
                void carregarReplay()
              }}
            >
              <span>Juiz 360º &amp; Replay</span>
              <span className="badge badge-info">XP</span>
            </button>
          </nav>
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
          {aba === 'kb' && <IntranetApp key={artigoKbSelecionado ?? 'intranet'} artigoSelecionadoId={artigoKbSelecionado} onArtigoFechado={fecharArtigoKb} />}
          {aba === 'replay' && <ReplayView replay={replay} onAtualizar={carregarReplay} ocupado={ocupado} onNavegaKb={abrirArtigoKb} kbRetornoLinkUri={kbRetornoLinkUri} />}
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
