import { Component, type ReactNode, useEffect, useRef, useState } from 'react'
import { apiClient, ConflitoSeqError } from './api/client'
import type { CarreiraResumoResponse, ReplayResponse, SessaoProjecao } from './api/types'
import { ChatApp } from './apps/ChatApp/ChatApp'
import { IntranetApp } from './apps/IntranetApp/IntranetApp'
import { ItsmApp } from './apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from './apps/SimuDeskApp/SimuDeskApp'
import { BarraSuperior } from './educacao/BarraSuperior'
import {
  type EstadoAcademia,
  carregarEstadoAcademia,
  nivelPorCenarioId,
  responderMentor,
  salvarEstadoAcademia,
} from './educacao/catalogoEducacional'
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
    return 'Missao concluida! Abra "Juiz 360º e Replay" para conferir sua nota e Curriculo Vivo.'
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
      return '4) Investigue logs e servicos no SimuDesk, eleve privilegio e inicie o AuroraGateway.'
    }
    if (!sessao.problemas.some((p) => p.resolvido)) return '5) Registre a causa raiz (servico e atualizacao) no Problema e resolva em lote.'
    return 'Incidente massivo resolvido! Confira Juiz 360º e Replay.'
  }
  if (cenario === 'sre-cloud-latencia') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o incidente SRE CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o SimuDesk.'
    if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, diagnostique pods/logs/curl, eleve privilegio e aplique a mitigacao.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 com nota de post-mortem.'
    return 'Incidente SRE mitigado! Confira Juiz 360º e Replay.'
  }
  if (cenario === 'diagnostico-sql-readonly') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado de auditoria SQL CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o console SQL.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '3) Execute SELECT somente leitura no SimuDesk (sem escrita) e resolva o chamado com o diagnostico.'
    return 'Auditoria SQL concluida! Confira Juiz 360º e Replay.'
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
  const [tema, setTema] = useState<'light' | 'dark'>('light')
  const [estadoAcademia, setEstadoAcademia] = useState<EstadoAcademia>(() => carregarEstadoAcademia())
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<SessaoProjecao | null>(null)
  const [aba, setAba] = useState<Aba>('itsm')
  const [gaveta, setGaveta] = useState<'notas' | 'tutor' | null>(null)
  const [tutorMsgs, setTutorMsgs] = useState<{ who: 'me' | 'ai'; text: string }[]>([
    { who: 'ai', text: 'Estou aqui durante o atendimento. Clique em "O que faço agora?" ou pergunte algo.' },
  ])
  const [tutorInput, setTutorInput] = useState('')
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

  useEffect(() => {
    document.documentElement.dataset.theme = tema
  }, [tema])

  function atualizarEstadoAcademia(updater: (prev: EstadoAcademia) => EstadoAcademia) {
    setEstadoAcademia((prev) => {
      const next = updater(prev)
      salvarEstadoAcademia(next)
      return next
    })
  }

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
      const nivel = nivelPorCenarioId(cenarioId)
      atualizarEstadoAcademia((prev) => ({ ...prev, focus: nivel.id }))
      setSessaoId(criada.sessaoId)
      setSessao(proj)
      setReplay(null)
      setNivel1Passos({ politica: false, token: false, recusado: false })
      setHistoricoTerminal([])
      setTutorMsgs([
        {
          who: 'ai',
          text: `Turno iniciado em ${nivel.titulo}. Se travar, pergunte "O que faço agora?".`,
        },
      ])
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
      if (
        res.projecao.chamados.length > 0 &&
        res.projecao.chamados.every((c) => c.status === 'Resolvido' || c.status === 'Encerrado')
      ) {
        const lvl = nivelPorCenarioId(res.projecao.meta.cenarioId)
        atualizarEstadoAcademia((prev) =>
          prev.labsDone.includes(lvl.id)
            ? prev
            : { ...prev, labsDone: [...prev.labsDone, lvl.id], xp: prev.xp + 60, weekMin: prev.weekMin + 15 },
        )
      }
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
          setAviso('Reset fraudulento recusado com seguranca! Abra "Juiz 360º e Replay" para conferir sua avaliacao.')
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
        tema={tema}
        onAlternarTema={() => setTema((t) => (t === 'light' ? 'dark' : 'light'))}
        estadoAcademia={estadoAcademia}
        onAtualizarAcademia={atualizarEstadoAcademia}
      />
    )
  }

  const nivelSessao = nivelPorCenarioId(sessao.meta.cenarioId)
  const paginaNotasSessao = estadoAcademia.pages.find(
    (p) => p.level === nivelSessao.id && p.type === 'cornell',
  ) ?? {
    id: `pg-${nivelSessao.id}`,
    icon: nivelSessao.icon,
    title: `${nivelSessao.nome} · Anotações`,
    level: nivelSessao.id,
    type: 'cornell' as const,
    cues: '',
    notes: '',
    summary: '',
  }
  const dicaAtual = obterProximaDicaMissao(sessao, nivel1Passos)

  function sairParaTelaInicial() {
    setSessaoId(null)
    setSessao(null)
    setGaveta(null)
    void atualizarResumoCarreira()
  }

  function atualizarNotasSessao(campo: 'cues' | 'notes', valor: string) {
    atualizarEstadoAcademia((prev) => {
      const existe = prev.pages.some((p) => p.id === paginaNotasSessao.id)
      const pages = existe
        ? prev.pages.map((p) => (p.id === paginaNotasSessao.id ? { ...p, [campo]: valor } : p))
        : [...prev.pages, { ...paginaNotasSessao, [campo]: valor }]
      return { ...prev, pages }
    })
  }

  function perguntarTutorSessao(pergunta: string) {
    const q = pergunta.trim()
    if (!q) return
    const ans =
      /(agora|próximo|proximo|travei|passo)/i.test(q) ? `Próximo passo: ${dicaAtual}` : responderMentor(q)
    setTutorMsgs((m) => [...m, { who: 'me', text: q }, { who: 'ai', text: ans }])
    setTutorInput('')
  }

  return (
    <div className="workstation">
      <BarraSuperior
        visaoAtual="lab"
        estado={estadoAcademia}
        tema={tema}
        xpOficial={resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp}
        onAlternarTema={() => setTema((t) => (t === 'light' ? 'dark' : 'light'))}
        onSelecionarVisao={sairParaTelaInicial}
        slotDireitoSessao={
          <>
            <span className="nav-chip hide-sm">{sessao.meta.nivel} · {sessao.meta.cenarioId}</span>
            <span className="nav-chip">Tempo Simulado: {sessao.meta.minutoSimulado}m</span>
            <span className="nav-chip hide-sm">Seq #{sessao.ultimoSeq}</span>
            <button
              type="button"
              className={`nav-btn ${gaveta === 'notas' ? 'solid' : ''}`}
              aria-pressed={gaveta === 'notas'}
              onClick={() => setGaveta((g) => (g === 'notas' ? null : 'notas'))}
            >
              📓 Minhas notas
            </button>
            <button
              type="button"
              className={`nav-btn ${gaveta === 'tutor' ? 'solid' : ''}`}
              aria-pressed={gaveta === 'tutor'}
              onClick={() => setGaveta((g) => (g === 'tutor' ? null : 'tutor'))}
            >
              🤖 Tutor IA
            </button>
            <button
              type="button"
              className="nav-btn"
              aria-label="Voltar para a Tela Inicial"
              onClick={sairParaTelaInicial}
            >
              ← Tela Inicial
            </button>
          </>
        }
      />

      <div className="mission-strip" role="status">
        <span>
          <strong>Missao Atual:</strong> {dicaAtual}
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

      <div className={`cockpit-body ${gaveta ? 'with-drawer' : ''}`}>
        <aside className="app-dock" aria-label="Aplicativos da Workstation">
          <nav aria-label="Aplicativos da Workstation">
            <button
              type="button"
              aria-current={aba === 'itsm' ? 'page' : undefined}
              className={`dock-btn ${aba === 'itsm' ? 'active' : ''}`}
              onClick={() => setAba('itsm')}
            >
              <span>ITSM / Chamados</span>
              <span className="badge">{sessao.chamados.length}</span>
            </button>
            <button
              type="button"
              aria-current={aba === 'chat' ? 'page' : undefined}
              className={`dock-btn ${aba === 'chat' ? 'active' : ''}`}
              onClick={() => setAba('chat')}
            >
              <span>Comunicador IA</span>
              <span className="badge">{sessao.dialogo.mensagens.length}</span>
            </button>
            <button
              type="button"
              aria-current={aba === 'simudesk' ? 'page' : undefined}
              className={`dock-btn ${aba === 'simudesk' ? 'active' : ''}`}
              onClick={() => setAba('simudesk')}
            >
              <span>SimuDesk Remoto</span>
              <span className={`badge ${sessao.dialogo.acessoRemotoLiberado ? 'badge-ok' : ''}`}>
                {sessao.dialogo.acessoRemotoLiberado ? 'ON' : 'LOCK'}
              </span>
            </button>
            <button
              type="button"
              aria-current={aba === 'kb' ? 'page' : undefined}
              className={`dock-btn ${aba === 'kb' ? 'active' : ''}`}
              onClick={() => setAba('kb')}
            >
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
              <span>Juiz 360º e Replay</span>
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
          {aba === 'kb' && (
            <IntranetApp
              key={artigoKbSelecionado ?? 'intranet'}
              artigoSelecionadoId={artigoKbSelecionado}
              onArtigoFechado={fecharArtigoKb}
            />
          )}
          {aba === 'replay' && (
            <ReplayView
              replay={replay}
              onAtualizar={carregarReplay}
              ocupado={ocupado}
              onNavegaKb={abrirArtigoKb}
              kbRetornoLinkUri={kbRetornoLinkUri}
            />
          )}
        </main>

        {gaveta === 'notas' && (
          <aside className="cockpit-drawer" aria-label="Minhas notas durante o atendimento">
            <div className="row-between">
              <h2 className="h3">📓 Minhas notas · {nivelSessao.nome}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGaveta(null)}>
                ✕
              </button>
            </div>
            <p className="muted" style={{ marginTop: '4px' }}>
              Método Cornell sincronizado ao seu Caderno de estudos.
            </p>
            <label className="block-label" htmlFor="ws-cues">
              Perguntas-chave
            </label>
            <textarea
              id="ws-cues"
              className="block xs"
              value={paginaNotasSessao.cues ?? ''}
              onChange={(e) => atualizarNotasSessao('cues', e.target.value)}
            />
            <label className="block-label" htmlFor="ws-notes">
              Anotações
            </label>
            <textarea
              id="ws-notes"
              className="block"
              value={paginaNotasSessao.notes ?? ''}
              onChange={(e) => atualizarNotasSessao('notes', e.target.value)}
            />
            <p className="muted saved">✓ Salvo automaticamente</p>
          </aside>
        )}

        {gaveta === 'tutor' && (
          <aside className="cockpit-drawer" aria-label="Tutor IA durante o atendimento">
            <div className="row-between">
              <h2 className="h3">🤖 Tutor IA</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGaveta(null)}>
                ✕
              </button>
            </div>
            <div className="chat short mt" aria-live="polite">
              {tutorMsgs.map((m, i) => (
                <div key={i} className={`bubble ${m.who}`}>
                  {m.who === 'ai' && <div className="who">🤖 Tutor IA</div>}
                  {m.text}
                </div>
              ))}
            </div>
            <div className="suggest mt">
              <button type="button" onClick={() => perguntarTutorSessao('O que faço agora?')}>
                O que faço agora?
              </button>
              <button type="button" onClick={() => perguntarTutorSessao('O que é DNS?')}>
                O que é DNS?
              </button>
              <button type="button" onClick={() => perguntarTutorSessao('O que é engenharia social?')}>
                Engenharia social
              </button>
            </div>
            <form
              className="row gap mt"
              onSubmit={(e) => {
                e.preventDefault()
                perguntarTutorSessao(tutorInput)
              }}
            >
              <label className="skip" htmlFor="ws-tutor-in">
                Pergunta ao Tutor IA
              </label>
              <input
                id="ws-tutor-in"
                type="text"
                className="text grow"
                placeholder="Pergunte ao tutor..."
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
              />
              <button type="submit" className="btn btn-ai btn-sm">
                Enviar
              </button>
            </form>
          </aside>
        )}
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
