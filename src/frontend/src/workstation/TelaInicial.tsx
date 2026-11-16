import { useEffect, useState } from 'react'
import type { CarreiraResumoResponse } from '../api/types'
import { AulasView } from '../educacao/AulasView'
import { BarraSuperior, type VisaoAcademia } from '../educacao/BarraSuperior'
import { CadernoView } from '../educacao/CadernoView'
import {
  GLOSSARIO_INICIANTE,
  LEVELS,
  type EstadoAcademia,
  type NivelId,
  calcularProgressoNivel,
  nivelPorCenarioId,
  nivelPorId,
  obterCardsParaHoje,
  obterProximaAcao,
  primeiraAulaNivel,
} from '../educacao/catalogoEducacional'
import { MentorView } from '../educacao/MentorView'
import { verificarCurriculoVivoJson, type ResultadoVerificacaoCurriculo } from '../utils/jcs'

interface Props {
  onIniciar: (cenarioId: string, semente?: number, causaForcada?: string) => Promise<void>
  ocupado: boolean
  erro: string | null
  resumoCarreira?: CarreiraResumoResponse | null
  apelido?: string
  onApelidoChange?: (valor: string) => void
  onAtualizarCarreira?: (apelido?: string) => void
  tema?: 'light' | 'dark'
  onAlternarTema?: () => void
  estadoAcademia: EstadoAcademia
  onAtualizarAcademia: (updater: (prev: EstadoAcademia) => EstadoAcademia) => void
  /** Visao aberta ao montar (o shell usa ao voltar do laboratorio para Aulas, Caderno ou Mentor). */
  visaoInicial?: VisaoAcademia
}

function formatarTimer(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TelaInicial({
  onIniciar,
  ocupado,
  erro,
  resumoCarreira,
  apelido = '',
  onApelidoChange,
  onAtualizarCarreira,
  tema = 'light',
  onAlternarTema,
  estadoAcademia,
  onAtualizarAcademia,
  visaoInicial = 'home',
}: Props) {
  const [visao, setVisao] = useState<VisaoAcademia>(visaoInicial)
  const [cenario, setCenario] = useState('pasta-rede-inacessivel')
  const [semente, setSemente] = useState('')
  const [aulaAlvo, setAulaAlvo] = useState<{
    nivel: NivelId
    modo: 'lesson' | 'cards'
    aulaId?: string
    chave: number
  } | null>(null)
  const [mostrarVerificador, setMostrarVerificador] = useState(false)
  const [jsonVerificar, setJsonVerificar] = useState('')
  const [resultadoVerif, setResultadoVerif] = useState<ResultadoVerificacaoCurriculo | null>(null)
  const [avisoColdStart, setAvisoColdStart] = useState(false)
  const [cvModalAberto, setCvModalAberto] = useState(false)

  const [pomoSegundos, setPomoSegundos] = useState(25 * 60)
  const [pomoRodando, setPomoRodando] = useState(false)

  useEffect(() => {
    if (!ocupado) return
    const timer = window.setTimeout(() => setAvisoColdStart(true), 2000)
    return () => {
      window.clearTimeout(timer)
      setAvisoColdStart(false)
    }
  }, [ocupado])

  useEffect(() => {
    if (!pomoRodando) return
    const id = window.setInterval(() => {
      setPomoSegundos((prev) => {
        if (prev <= 1) {
          setPomoRodando(false)
          onAtualizarAcademia((st) => ({ ...st, weekMin: st.weekMin + 25 }))
          return 25 * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [pomoRodando, onAtualizarAcademia])

  async function executarVerificacao(conteudo: string) {
    setJsonVerificar(conteudo)
    if (!conteudo.trim()) {
      setResultadoVerif(null)
      return
    }
    const res = await verificarCurriculoVivoJson(conteudo)
    setResultadoVerif(res)
  }

  function exportarCurriculoVivo() {
    if (!resumoCarreira) return
    const payload = {
      ...resumoCarreira,
      apelido: apelido.trim() || resumoCarreira.apelido || null,
      exportadoEm: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'curriculo-vivo-itfs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function abrirAula(nivelId: NivelId, aulaId?: string) {
    onAtualizarAcademia((prev) => ({ ...prev, focus: nivelId }))
    setCenario(nivelPorId(nivelId).cenarioId)
    setAulaAlvo((prev) => ({
      nivel: nivelId,
      modo: 'lesson',
      aulaId: aulaId ?? primeiraAulaNivel(estadoAcademia, nivelId),
      chave: (prev?.chave ?? 0) + 1,
    }))
    setVisao('aulas')
  }

  function abrirFlashcards(nivelId: NivelId) {
    onAtualizarAcademia((prev) => ({ ...prev, focus: nivelId }))
    setCenario(nivelPorId(nivelId).cenarioId)
    setAulaAlvo((prev) => ({
      nivel: nivelId,
      modo: 'cards',
      chave: (prev?.chave ?? 0) + 1,
    }))
    setVisao('aulas')
  }

  function abrirCaderno(paginaId: string) {
    onAtualizarAcademia((prev) => ({ ...prev, activePage: paginaId }))
    setVisao('caderno')
  }

  function alternarTodoPlano(idx: number) {
    onAtualizarAcademia((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === 'plano' && p.todos
          ? {
              ...p,
              todos: p.todos.map((td, i) => (i === idx ? { ...td, done: !td.done } : td)),
            }
          : p,
      ),
    }))
  }

  const nivelSelecionado = nivelPorCenarioId(cenario)
  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp
  const proximaAcao = obterProximaAcao(estadoAcademia)
  const cardsHoje = obterCardsParaHoje(estadoAcademia)
  const planoEstudos = estadoAcademia.pages.find((p) => p.id === 'plano')
  const pctSemana = Math.min(100, Math.round((estadoAcademia.weekMin / Math.max(1, estadoAcademia.weekGoal)) * 100))

  function executarProximaAcao() {
    if (proximaAcao.act === 'lesson') {
      abrirAula(proximaAcao.level, proximaAcao.lessonId)
    } else if (proximaAcao.act === 'cards') {
      abrirFlashcards(proximaAcao.level)
    } else if (proximaAcao.act === 'lab') {
      void onIniciar(nivelPorId(proximaAcao.level).cenarioId, semente ? Number(semente) : undefined)
    } else {
      setCvModalAberto(true)
    }
  }

  return (
    <div className="academia-shell">
      <a className="skip" href="#app-main">
        Pular para o conteúdo
      </a>

      <BarraSuperior
        visaoAtual={visao}
        estado={estadoAcademia}
        tema={tema}
        xpOficial={xpExibido}
        onAlternarTema={() => onAlternarTema?.()}
        onSelecionarVisao={(v) => {
          setVisao(v)
          if (v === 'aulas' && (!aulaAlvo || aulaAlvo.nivel !== estadoAcademia.focus)) {
            setAulaAlvo((prev) => ({
              nivel: estadoAcademia.focus,
              modo: 'lesson',
              aulaId: primeiraAulaNivel(estadoAcademia, estadoAcademia.focus),
              chave: (prev?.chave ?? 0) + 1,
            }))
          }
        }}
        onEntrarLaboratorio={() => void onIniciar(cenario, semente ? Number(semente) : undefined)}
        onMudarFoco={(nivelId) => {
          onAtualizarAcademia((prev) => ({ ...prev, focus: nivelId }))
          setCenario(nivelPorId(nivelId).cenarioId)
        }}
        onAbrirCurriculo={() => setCvModalAberto(true)}
      />

      <main id="app-main">
        {visao === 'home' && (
          <div className="page">
            <div className="page-head">
              <p className="eyebrow">Painel do aluno · Aurora Logística (100% Dados Sintéticos · Sem Login)</p>
              <h1 className="h1">IT Flight Simulator — Academia de Suporte de TI</h1>
              <p className="lead">
                Do zero ao especialista em suporte de TI: aprenda a teoria com analogias, fixe com repetição espaçada e Método Cornell, e decole na Workstation corporativa com assinatura criptográfica <strong>ECDSA P-256</strong>.
              </p>
            </div>

            {ocupado && avisoColdStart && (
              <div className="banner-notice" aria-live="polite" style={{ marginBottom: '16px' }}>
                Acordando servidor da API na nuvem — a primeira chamada após inatividade pode levar alguns segundos.
              </div>
            )}

            {erro && (
              <div className="alert-danger" role="alert">
                {erro}
              </div>
            )}

            <div className="grid-home">
              <div className="stack">
                <section className="continue" aria-label="Continue de onde parou">
                  <div className="continue-ic" aria-hidden="true">
                    {proximaAcao.phase === 'theory'
                      ? '📖'
                      : proximaAcao.phase === 'fix'
                        ? '🧠'
                        : proximaAcao.phase === 'practice'
                          ? '🛠️'
                          : '🏅'}
                  </div>
                  <div style={{ flex: '1 1 280px' }}>
                    <p className="eyebrow">Continue de onde parou</p>
                    <h2>{proximaAcao.title}</h2>
                    <p>{proximaAcao.meta}</p>
                  </div>
                  <button type="button" className="btn btn-white btn-lg" onClick={executarProximaAcao}>
                    {proximaAcao.cta} →
                  </button>
                </section>

                <section className="edu-card" aria-label="Trilha de carreira">
                  <div className="card-h">
                    <div>
                      <h2 className="h2">Sua trilha: do zero ao especialista (5 Cenários Executáveis)</h2>
                      <p className="muted">
                        Selecione um nível abaixo para estudar na Academia ou decolar direto no Laboratório simulado.
                      </p>
                    </div>
                    <span className="chip c-theory">Foco atual: {nivelSelecionado.cargo}</span>
                  </div>

                  <div role="radiogroup" aria-label="Escolha o nível da simulação">
                    {LEVELS.map((L) => {
                      const pr = calcularProgressoNivel(estadoAcademia, L.id)
                      const selected = cenario === L.cenarioId
                      return (
                        <div key={L.id} className={`lvl ${selected ? 'current' : ''}`}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={`lvl-select ${selected ? 'selected' : ''}`}
                            onClick={() => {
                              setCenario(L.cenarioId)
                              onAtualizarAcademia((prev) => ({ ...prev, focus: L.id }))
                            }}
                          >
                            <div className="lvl-icon" aria-hidden="true">
                              {L.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="row wrap gap">
                                <span className={`badge ${selected ? 'badge-info' : ''}`}>{L.cargo}</span>
                                {L.tag && <span className="chip c-mastery">{L.tag}</span>}
                              </div>
                              <div className="lvl-title">{L.titulo}</div>
                              <p className="lvl-desc">{L.desc}</p>
                              <div className="muted" style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                                {L.competencias}
                              </div>
                            </div>
                          </button>

                          <div className="lvl-bars">
                            <div>
                              <div className="mini-top">
                                <span>Teoria</span>
                                <strong>{pr.t}%</strong>
                              </div>
                              <div
                                className="bar theory"
                                role="progressbar"
                                aria-label={`Teoria ${L.nome}`}
                                aria-valuenow={pr.t}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <span style={{ width: `${pr.t}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="mini-top">
                                <span>Fixação</span>
                                <strong>{pr.f}%</strong>
                              </div>
                              <div
                                className="bar fix"
                                role="progressbar"
                                aria-label={`Fixação ${L.nome}`}
                                aria-valuenow={pr.f}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <span style={{ width: `${pr.f}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="mini-top">
                                <span>Prática</span>
                                <strong>{pr.p}%</strong>
                              </div>
                              <div
                                className="bar practice"
                                role="progressbar"
                                aria-label={`Prática ${L.nome}`}
                                aria-valuenow={pr.p}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <span style={{ width: `${pr.p}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="lvl-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => abrirAula(L.id)}
                            >
                              📖 Aulas
                            </button>
                            <button
                              type="button"
                              className="btn btn-practice btn-sm"
                              disabled={ocupado}
                              onClick={() => {
                                setCenario(L.cenarioId)
                                onAtualizarAcademia((prev) => ({ ...prev, focus: L.id }))
                                void onIniciar(L.cenarioId, semente ? Number(semente) : undefined)
                              }}
                            >
                              🛠️ Praticar
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="launch-bar">
                    <label className="field-stack">
                      Semente (opção avançada para repetir causa)
                      <input
                        type="number"
                        placeholder="Aleatória"
                        value={semente}
                        onChange={(e) => setSemente(e.target.value)}
                      />
                    </label>
                    <div className="actions-bar">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={ocupado}
                        onClick={() => onIniciar('pasta-rede-inacessivel', 42, 'C1')}
                      >
                        Demo Rápida (Nível 2 · C1)
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        disabled={ocupado}
                        onClick={() => onIniciar(cenario, semente ? Number(semente) : undefined)}
                      >
                        {ocupado ? 'Preparando Workstation...' : 'Decolar no Simulador →'}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="mission-zero-card" aria-label="Missão 0 para iniciantes">
                  <h2>Missão 0 — Como funciona em 4 passos (nunca atuou em TI? Comece aqui)</h2>
                  <div className="steps-grid">
                    <div className="step-box">
                      <strong>1. Leia o chamado no ITSM</strong>
                      Clique em Assumir Chamado e confira quem pediu ajuda e qual é a urgência (SLA).
                    </div>
                    <div className="step-box">
                      <strong>2. Valide identidade no Chat</strong>
                      Antes de mexer no computador ou resetar senha, confirme matrícula e ramal com segurança.
                    </div>
                    <div className="step-box">
                      <strong>3. Investigue antes de alterar</strong>
                      Use o SimuDesk para observar pistas reais antes de trocar qualquer configuração.
                    </div>
                    <div className="step-box">
                      <strong>4. Registre nota e veja a Caixa-Preta</strong>
                      Documente o que fez em linguagem clara e abra o Replay para conferir acertos e melhorias.
                    </div>
                  </div>
                </section>

                <section className="edu-card card-b" aria-label="Ciclo de aprendizagem">
                  <h2 className="h2">Como você aprende aqui (Ciclo Cognitivo em 4 Etapas)</h2>
                  <p className="muted" style={{ margin: '4px 0 14px' }}>
                    Clique em qualquer etapa para navegar diretamente entre estudo ativo e prática corporativa.
                  </p>
                  <div className="cycle">
                    <button
                      type="button"
                      className="cycle-step"
                      style={{ '--x': 'var(--theory-solid)' } as React.CSSProperties}
                      onClick={() => abrirAula(estadoAcademia.focus)}
                    >
                      <span className="chip c-theory">1 · Aprender</span>
                      <strong>Aulas curtas</strong>
                      <span className="muted">Analogias do dia a dia, sem jargão.</span>
                    </button>
                    <button
                      type="button"
                      className="cycle-step"
                      style={{ '--x': 'var(--fix-solid)' } as React.CSSProperties}
                      onClick={() => setVisao('caderno')}
                    >
                      <span className="chip c-fix">2 · Fixar</span>
                      <strong>Flashcards e Caderno</strong>
                      <span className="muted">Repetição espaçada e Método Cornell.</span>
                    </button>
                    <button
                      type="button"
                      className="cycle-step"
                      style={{ '--x': 'var(--practice-solid)' } as React.CSSProperties}
                      onClick={() => void onIniciar(cenario, semente ? Number(semente) : undefined)}
                    >
                      <span className="chip c-practice">3 · Praticar</span>
                      <strong>Laboratório</strong>
                      <span className="muted">Chamados reais simulados na Aurora.</span>
                    </button>
                    <button
                      type="button"
                      className="cycle-step"
                      style={{ '--x': 'var(--mastery-solid)' } as React.CSSProperties}
                      onClick={() => setVisao('mentor')}
                    >
                      <span className="chip c-mastery">4 · Explicar</span>
                      <strong>Feynman e Pitch</strong>
                      <span className="muted">Ensine para aprender e vá para a vaga.</span>
                    </button>
                  </div>
                </section>

                <details className="glossary-details">
                  <summary>Glossário rápido para iniciantes (ITSM, SimuDesk, KB, Caixa-Preta e Semente)</summary>
                  <div className="glossary-grid">
                    {GLOSSARIO_INICIANTE.map((item) => (
                      <div key={item.termo} className="glossary-item">
                        <strong>{item.termo}:</strong> {item.definicao}
                      </div>
                    ))}
                  </div>
                </details>

                <section className="edu-card card-b" aria-label="Transparência do escopo do produto">
                  <h2 className="h2">Transparência do Escopo: MVP Hackathon vs. Roadmap do Curso Livre</h2>
                  <div className="scope-grid">
                    <div className="scope-card">
                      <h3>Implementado Hoje nesta Demo (MVP Hackathon)</h3>
                      <ul>
                        <li>
                          Academia completa (Painel, Aulas com recordação ativa e SM-2, Caderno estilo Notion/Cornell e Mentor Feynman/STAR).
                        </li>
                        <li>
                          Workstation determinística com 5 cenários jogáveis, ITSM, Comunicador auditável e SimuDesk (Terminal, AD, DNS, Logs, SRE e SQL Read-Only).
                        </li>
                        <li>
                          Base de Conhecimento (26 artigos), Caixa-Preta Replay e Juiz 360º com assinatura ECDSA P-256.
                        </li>
                      </ul>
                    </div>
                    <div className="scope-card">
                      <h3>Roadmap Pós-Hackathon (Ondas 1 a 4)</h3>
                      <ul>
                        <li>Trilha integral de 560h (UC1 a UC8), persistência multi-tenant em PostgreSQL e simulados PBQ autorais.</li>
                        <li>
                          8 Laboratórios interativos dedicados (Hardware ESD, Multi-OS, Cabeamento e Wi-Fi RF, M365, Servidores, Firewall, Data Center e Blue Team).
                        </li>
                        <li>Chamada por voz e vídeo com personas de IA sob teto orçamentário e certificado de curso livre.</li>
                      </ul>
                    </div>
                  </div>
                  <p className="muted mt">
                    <strong>Aviso de Dados e Natureza:</strong> Simulador educacional gratuito de demonstração em curso livre. Opera em sessão anônima sem login e utiliza apenas dados 100% sintéticos (empresa fictícia Aurora Logística). Não emite diploma técnico oficial nem certificação de terceiros.
                  </p>
                </section>
              </div>

              <aside className="stack">
                <section className="edu-card card-b" aria-label="Seu dia">
                  <h2 className="h2">Hoje</h2>
                  <div className="stat-row">
                    <div className="ring" style={{ '--p': pctSemana } as React.CSSProperties}>
                      <div>
                        {estadoAcademia.weekMin}
                        <span className="muted d-block" style={{ fontSize: '0.72rem', fontWeight: 500 }}>
                          de {estadoAcademia.weekGoal}m
                        </span>
                      </div>
                    </div>
                    <div>
                      <strong>Meta semanal</strong>
                      <p className="muted">
                        {pctSemana}% concluída · 🔥 {estadoAcademia.streak} dia(s) seguido(s)
                      </p>
                    </div>
                  </div>

                  <div className="pomo">
                    <div>
                      <div className="muted">⏱ Timer de foco (Pomodoro 25/5)</div>
                      <div className="pomo-time">{formatarTimer(pomoSegundos)}</div>
                    </div>
                    <div className="row gap">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setPomoRodando((r) => !r)}
                      >
                        {pomoRodando ? 'Pausar' : 'Iniciar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setPomoRodando(false)
                          setPomoSegundos(25 * 60)
                        }}
                      >
                        Zerar
                      </button>
                    </div>
                  </div>

                  <div className="row-between mt">
                    <div>
                      <strong>🧠 {cardsHoje.length} revisões para hoje</strong>
                      <p className="muted">Flashcards no momento certo de revisar.</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ai btn-sm"
                      disabled={cardsHoje.length === 0}
                      onClick={() => abrirFlashcards(cardsHoje[0]?.level ?? estadoAcademia.focus)}
                    >
                      Revisar
                    </button>
                  </div>
                </section>

                <section className="edu-card card-b" aria-label="Plano de hoje">
                  <div className="row-between">
                    <h2 className="h2">Plano de estudos</h2>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => abrirCaderno('plano')}>
                      Editar ↗
                    </button>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {(planoEstudos?.todos ?? []).map((td, idx) => (
                      <div key={idx} className={`todo ${td.done ? 'done' : ''}`}>
                        <input
                          type="checkbox"
                          id={`ht-${idx}`}
                          checked={td.done}
                          onChange={() => alternarTodoPlano(idx)}
                        />
                        <label htmlFor={`ht-${idx}`}>{td.t}</label>
                      </div>
                    ))}
                  </div>
                </section>

                {resumoCarreira && (
                  <section id="cv-panel" className="edu-card card-b" aria-label="Progressão de Carreira e Currículo Vivo">
                    <div className="career-header">
                      <div>
                        <strong>Sua Jornada:</strong> {resumoCarreira.cargoAtual} ·{' '}
                        <span className="badge badge-info">{resumoCarreira.xpTotal} XP</span>
                      </div>
                      <div className="career-badges">
                        <span className={`badge ${resumoCarreira.promocoes.nivel1Concluido ? 'badge-ok' : ''}`}>
                          N1 {resumoCarreira.promocoes.nivel1Concluido ? 'OK' : 'Pendente'}
                        </span>
                        <span className={`badge ${resumoCarreira.promocoes.nivel2Concluido ? 'badge-ok' : ''}`}>
                          N2 {resumoCarreira.promocoes.nivel2Concluido ? 'OK' : 'Pendente'}
                        </span>
                        <span className={`badge ${resumoCarreira.promocoes.nivel3Concluido ? 'badge-ok' : ''}`}>
                          N3 {resumoCarreira.promocoes.nivel3Concluido ? 'OK' : 'Pendente'}
                        </span>
                        <span className={`badge ${resumoCarreira.promocoes.nivel4Concluido ? 'badge-ok' : ''}`}>
                          N4 {resumoCarreira.promocoes.nivel4Concluido ? 'OK' : 'Pendente'}
                        </span>
                        <span className={`badge ${resumoCarreira.promocoes.nivel4bConcluido ? 'badge-ok' : ''}`}>
                          N4b {resumoCarreira.promocoes.nivel4bConcluido ? 'OK' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    {resumoCarreira.sessoesNaoConfirmadas.length > 0 && (
                      <p className="muted mt">
                        {resumoCarreira.sessoesNaoConfirmadas.length} sessao(oes) marcada(s) como nao confirmada (expirada ou ausente; sem XP).
                      </p>
                    )}

                    <div className="career-form">
                      <label className="field-stack">
                        Apelido no Currículo Vivo (opcional)
                        <input
                          type="text"
                          placeholder="Ex.: Ana Paula"
                          value={apelido}
                          onChange={(e) => onApelidoChange?.(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onAtualizarCarreira?.(apelido)}
                      >
                        Atualizar Resumo
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={exportarCurriculoVivo}>
                        Exportar Currículo Vivo (JSON)
                      </button>
                    </div>

                    <p className="integrity-note">
                      Integridade ({resumoCarreira.integridade.algoritmo}): <code>{resumoCarreira.integridade.hash}</code>
                      {resumoCarreira.integridade.algoritmoAssinatura && (
                        <>
                          {' '}
                          · Assinatura ({resumoCarreira.integridade.algoritmoAssinatura} · chave{' '}
                          <code>{resumoCarreira.integridade.kid}</code>)
                        </>
                      )}{' '}
                      — {resumoCarreira.integridade.regraHash}
                    </p>
                  </section>
                )}

                <section className="edu-card card-b" aria-label="Verificador local de Currículo Vivo">
                  <div className="verifier-header">
                    <span>
                      <strong>Verificador Offline de Autenticidade:</strong> valide integridade SHA-256 e assinatura ECDSA P-256 de um arquivo{' '}
                      <code>curriculo-vivo-itfs.json</code> localmente no navegador.
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setMostrarVerificador((v) => !v)}
                    >
                      {mostrarVerificador ? 'Ocultar Verificador' : 'Verificar Currículo Vivo'}
                    </button>
                  </div>

                  {mostrarVerificador && (
                    <div className="verifier-body">
                      <label className="field-stack">
                        Cole o JSON do Currículo Vivo ou selecione o arquivo .json
                        <textarea
                          rows={4}
                          placeholder='{"cargoAtual": "...", "xpTotal": 0, ...}'
                          value={jsonVerificar}
                          onChange={(e) => void executarVerificacao(e.target.value)}
                          className="verifier-textarea"
                        />
                      </label>
                      <div className="verifier-file">
                        <input
                          type="file"
                          accept=".json,application/json"
                          aria-label="Selecionar arquivo JSON do Currículo Vivo"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            void file.text().then((txt) => executarVerificacao(txt))
                          }}
                        />
                      </div>
                      {resultadoVerif && (
                        <div
                          role="status"
                          className={`verifier-result ${resultadoVerif.status === 'integro' ? 'alert-success' : resultadoVerif.status === 'divergente' ? 'alert-danger' : 'banner-notice'}`}
                        >
                          <strong>
                            {resultadoVerif.status === 'integro'
                              ? 'INTEGRO:'
                              : resultadoVerif.status === 'divergente'
                                ? 'DIVERGENTE:'
                                : 'NAO VERIFICAVEL:'}
                          </strong>{' '}
                          {resultadoVerif.motivo}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        )}

        {visao === 'aulas' && (
          <AulasView
            key={`${aulaAlvo?.nivel ?? estadoAcademia.focus}-${aulaAlvo?.chave ?? 0}`}
            estado={estadoAcademia}
            nivel={aulaAlvo?.nivel ?? estadoAcademia.focus}
            modoInicial={aulaAlvo?.modo ?? 'lesson'}
            aulaInicialId={aulaAlvo?.aulaId}
            onAtualizarEstado={onAtualizarAcademia}
            onIrParaCaderno={abrirCaderno}
            onIniciarLaboratorio={(cid) => void onIniciar(cid, semente ? Number(semente) : undefined)}
          />
        )}

        {visao === 'caderno' && (
          <CadernoView estado={estadoAcademia} onAtualizarEstado={onAtualizarAcademia} />
        )}

        {visao === 'mentor' && (
          <MentorView estado={estadoAcademia} onAtualizarEstado={onAtualizarAcademia} />
        )}
      </main>

      {cvModalAberto && (
        <div
          className="cv-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCvModalAberto(false)
          }}
        >
          <div className="cv-modal-card">
            <div className="card-h">
              <div>
                <span className="chip c-mastery">✓ JCS RFC 8785 + ECDSA P-256</span>
                <h2 id="cv-modal-title" className="h2" style={{ marginTop: '6px' }}>
                  📜 Currículo Vivo e Progresso na Academia
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCvModalAberto(false)}
              >
                ✕ Fechar
              </button>
            </div>

            <div className="card-b stack">
              <div className="steps-grid" style={{ marginTop: 0 }}>
                <div className="step-box">
                  <span>XP total</span>
                  <strong>{xpExibido} XP</strong>
                </div>
                <div className="step-box">
                  <span>Aulas concluídas</span>
                  <strong>{estadoAcademia.lessonsDone.length}</strong>
                </div>
                <div className="step-box">
                  <span>Laboratórios concluídos</span>
                  <strong>{estadoAcademia.labsDone.length}</strong>
                </div>
                <div className="step-box">
                  <span>Pitches STAR</span>
                  <strong>{estadoAcademia.pitches.length}</strong>
                </div>
              </div>

              <div>
                <h3 className="h3">Evolução por nível</h3>
                <div className="stack-xs mt">
                  {LEVELS.map((L) => {
                    const p = calcularProgressoNivel(estadoAcademia, L.id)
                    return (
                      <div key={L.id} className="step-box row-between">
                        <span>
                          {L.icon} <strong>{L.nome}</strong> — Teoria {p.t}% · Fixação {p.f}% · Prática {p.p}%
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setCvModalAberto(false)
                            void onIniciar(L.cenarioId, semente ? Number(semente) : undefined)
                          }}
                        >
                          Praticar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {estadoAcademia.pitches.length > 0 && (
                <div>
                  <h3 className="h3">Histórias STAR salvas</h3>
                  {estadoAcademia.pitches.map((pt, i) => (
                    <div key={i} className="preview mt">
                      {pt.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="row wrap gap">
                {resumoCarreira && (
                  <button type="button" className="btn btn-primary" onClick={exportarCurriculoVivo}>
                    ⬇ Exportar Currículo Vivo Oficial (JSON)
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCvModalAberto(false)
                    setVisao('home')
                    setMostrarVerificador(true)
                  }}
                >
                  🔍 Abrir Verificador Offline
                </button>
              </div>

              <p className="muted">
                Nota: a assinatura ECDSA P-256 garante que o arquivo oficial gerado pelo backend não foi alterado após a exportação; não constitui diploma técnico nem certificação de terceiros.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
