import { useEffect, useState } from 'react'
import { AulasView } from '../educacao/AulasView'
import { BarraSuperiorTransicao, type VisaoAcademia } from './BarraSuperiorTransicao'
import { CadernoView } from '../educacao/CadernoView'
import {
  ETAPAS_MISSAO_ZERO,
  GLOSSARIO_INICIANTE,
  type NivelEducacional,
  type NivelId,
  calcularProgressoNivel,
  nivelPorId,
  obterCardsParaHoje,
  obterProximaAcao,
  primeiraAulaNivel,
} from '../educacao/catalogoEducacional'
import { MentorView } from '../educacao/MentorView'
import { useAcademia } from '../jornada/contextosJornada'
import { useShell } from '../shell/contextoShell'
import { CredencialView } from './CredencialView'
import { PainelPerfilExtra } from './PainelPerfilExtra'
import { PrimeiroVoo } from './PrimeiroVoo'
import { TabelaMissoes } from './TabelaMissoes'
import { TransparenciaEscopo } from './TransparenciaEscopo'

interface Props {
  onIniciar: (cenarioId: string, semente?: number, causaForcada?: string) => Promise<void>
  ocupado: boolean
  erro: string | null

  /** Visao aberta ao montar (o shell usa ao voltar do laboratorio para Aulas, Caderno ou Mentor). */
  visaoInicial?: VisaoAcademia
}


export function TelaInicial({ onIniciar, ocupado, erro, visaoInicial = 'home' }: Props) {
  const shell = useShell()
  const {
    estadoAcademia,
    atualizarEstadoAcademia: onAtualizarAcademia,
    resumoCarreira,
    apelido,
    setApelido: onApelidoChange,
    atualizarResumoCarreira,
    pomodoro,
  } = useAcademia()
  const onAtualizarCarreira = (nome?: string) => void atualizarResumoCarreira(undefined, nome)
  const [visao, setVisao] = useState<VisaoAcademia>(visaoInicial)
  const [credencialAberta, setCredencialAberta] = useState(false)
  const [cenario, setCenario] = useState('')
  const [semente, setSemente] = useState('')
  const [aulaAlvo, setAulaAlvo] = useState<{
    nivel: NivelId
    modo: 'lesson' | 'cards'
    aulaId?: string
    chave: number
  } | null>(null)
  const [avisoColdStart, setAvisoColdStart] = useState(false)


  useEffect(() => {
    if (!ocupado) return
    const timer = window.setTimeout(() => setAvisoColdStart(true), 2000)
    return () => {
      window.clearTimeout(timer)
      setAvisoColdStart(false)
    }
  }, [ocupado])

  const sementeNumero = semente ? Number(semente) : undefined

  function irParaVisao(destino: VisaoAcademia) {
    setCredencialAberta(false)
    setVisao(destino)
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
    irParaVisao('aulas')
  }

  function abrirFlashcards(nivelId: NivelId) {
    onAtualizarAcademia((prev) => ({ ...prev, focus: nivelId }))
    setCenario(nivelPorId(nivelId).cenarioId)
    setAulaAlvo((prev) => ({
      nivel: nivelId,
      modo: 'cards',
      chave: (prev?.chave ?? 0) + 1,
    }))
    irParaVisao('aulas')
  }

  function abrirCaderno(paginaId: string) {
    onAtualizarAcademia((prev) => ({ ...prev, activePage: paginaId }))
    irParaVisao('caderno')
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

  function selecionarNivel(nivel: NivelEducacional) {
    setCenario(nivel.cenarioId)
    onAtualizarAcademia((prev) => ({ ...prev, focus: nivel.id }))
  }

  function praticar(nivel: NivelEducacional) {
    selecionarNivel(nivel)
    void onIniciar(nivel.cenarioId, sementeNumero)
  }

  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp
  const proximaAcao = obterProximaAcao(estadoAcademia)
  const cardsHoje = obterCardsParaHoje(estadoAcademia)
  const nivelDoPasso = nivelPorId(proximaAcao.level)
  const temProgresso =
    estadoAcademia.lessonsDone.length > 0 ||
    estadoAcademia.labsDone.length > 0 ||
    estadoAcademia.pitches.length > 0 ||
    xpExibido > 0
  const primeiroNivel = nivelPorId('estagiario')

  function executarProximaAcao() {
    if (proximaAcao.act === 'lesson') {
      abrirAula(proximaAcao.level, proximaAcao.lessonId)
    } else if (proximaAcao.act === 'cards') {
      abrirFlashcards(proximaAcao.level)
    } else if (proximaAcao.act === 'lab') {
      void onIniciar(nivelDoPasso.cenarioId, sementeNumero)
    } else {
      setCredencialAberta(true)
    }
  }

  const conteudoPerfil = ({ fechar }: { fechar: () => void }) => (
    <PainelPerfilExtra
      estado={estadoAcademia}
      cardsHoje={cardsHoje}
      pomodoro={pomodoro}
      onRevisar={() => {
        fechar()
        abrirFlashcards(cardsHoje[0]?.level ?? estadoAcademia.focus)
      }}
      onAlternarTarefa={alternarTodoPlano}
      onEditarPlano={() => {
        fechar()
        abrirCaderno('plano')
      }}
    />
  )

  return (
    <div className="academia-shell">
      <a className="skip" href="#app-main">
        Pular para o conteúdo
      </a>

      <BarraSuperiorTransicao
        visaoAtual={visao}
        estado={estadoAcademia}
        xpOficial={xpExibido}
        credencialAtiva={credencialAberta}
        rotuloLocal={credencialAberta ? 'Credencial' : undefined}
        onSelecionarVisao={(v) => {
          irParaVisao(v)
          if (v === 'aulas' && (!aulaAlvo || aulaAlvo.nivel !== estadoAcademia.focus)) {
            setAulaAlvo((prev) => ({
              nivel: estadoAcademia.focus,
              modo: 'lesson',
              aulaId: primeiraAulaNivel(estadoAcademia, estadoAcademia.focus),
              chave: (prev?.chave ?? 0) + 1,
            }))
          }
        }}
        onEntrarLaboratorio={() =>
          void onIniciar(cenario || nivelPorId(estadoAcademia.focus).cenarioId, sementeNumero)
        }
        onMudarFoco={(nivelId) => {
          onAtualizarAcademia((prev) => ({ ...prev, focus: nivelId }))
          setCenario(nivelPorId(nivelId).cenarioId)
        }}
        onAbrirCurriculo={() => setCredencialAberta(true)}
        conteudoPerfil={conteudoPerfil}
      />

      <main id="app-main">
        {credencialAberta && (
          <CredencialView
            estado={estadoAcademia}
            xpTotal={xpExibido}
            resumoCarreira={resumoCarreira}
            apelido={apelido}
            onApelidoChange={onApelidoChange}
            onAtualizarCarreira={onAtualizarCarreira}
            onPraticar={praticar}
          />
        )}

        {!credencialAberta && visao === 'home' && (
          <div className="page home">
            <div className="page-head">
              <h1 className="h1">IT Flight Simulator</h1>
              <p className="lead">
                Academia de suporte de TI. Estude, pratique chamados simulados no laboratório e veja suas decisões na
                Caixa-Preta, com credencial assinada em ECDSA P-256.
              </p>
            </div>

            {(erro || (ocupado && avisoColdStart)) && (
              <div className="page-avisos">
                {ocupado && avisoColdStart && (
                  <div className="banner-notice" aria-live="polite">
                    Acordando o servidor da API na nuvem. A primeira chamada após inatividade pode levar alguns
                    segundos.
                  </div>
                )}
                {erro && (
                  <div className="alert-danger" role="alert">
                    {erro}
                  </div>
                )}
              </div>
            )}

            <div className="stack">
              <PrimeiroVoo
                temProgresso={temProgresso}
                sessaoAtiva={shell.sessaoAtiva}
                proximaAcao={proximaAcao}
                nivelFoco={nivelDoPasso}
                progressoFoco={calcularProgressoNivel(estadoAcademia, nivelDoPasso.id)}
                ocupado={ocupado}
                onIniciarPrimeiroVoo={() => void onIniciar(primeiroNivel.cenarioId, sementeNumero)}
                onEstudarAntes={() => abrirAula(primeiroNivel.id)}
                onExecutarProximaAcao={executarProximaAcao}
                onRetomarLaboratorio={() => shell.retomarLaboratorio?.()}
              />

              {/* Nao persiste a escolha manual: a cada visita a abertura segue temProgresso. */}
              <details className="glossary-details" open={!temProgresso} aria-labelledby="missao-zero-titulo">
                <summary className="missao-zero-resumo">
                  <h2 id="missao-zero-titulo" className="h2">
                    Missão 0: o que fazer dentro do chamado
                  </h2>
                  <span className="muted">
                    O Primeiro Voo abre o chamado. Este roteiro mostra o que fazer depois que ele estiver aberto.
                  </span>
                </summary>
                <ol className="steps-grid">
                  {ETAPAS_MISSAO_ZERO.map((etapa, indice) => (
                    <li key={etapa.titulo} className="step-box">
                      <strong>
                        {indice + 1}. {etapa.titulo}
                      </strong>
                      {etapa.texto}
                    </li>
                  ))}
                </ol>
              </details>
              <TabelaMissoes
                estado={estadoAcademia}
                cenarioSelecionado={cenario}
                ocupado={ocupado}
                semente={semente}
                onSementeChange={setSemente}
                onSelecionar={selecionarNivel}
                onAbrirAulas={(nivel) => abrirAula(nivel.id)}
                onPraticar={praticar}
                onDecolar={() => {
                  if (!cenario) return
                  void onIniciar(cenario, sementeNumero)
                }}
                onDemoRapida={() => void onIniciar('pasta-rede-inacessivel', 42, 'C1')}
              />

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

              <TransparenciaEscopo />
            </div>
          </div>
        )}

        {!credencialAberta && visao === 'aulas' && (
          <AulasView
            key={`${aulaAlvo?.nivel ?? estadoAcademia.focus}-${aulaAlvo?.chave ?? 0}`}
            estado={estadoAcademia}
            nivel={aulaAlvo?.nivel ?? estadoAcademia.focus}
            modoInicial={aulaAlvo?.modo ?? 'lesson'}
            aulaInicialId={aulaAlvo?.aulaId}
            onAtualizarEstado={onAtualizarAcademia}
            onIrParaCaderno={abrirCaderno}
            onIniciarLaboratorio={(cid) => void onIniciar(cid, sementeNumero)}
          />
        )}

        {!credencialAberta && visao === 'caderno' && (
          <CadernoView estado={estadoAcademia} onAtualizarEstado={onAtualizarAcademia} />
        )}

        {!credencialAberta && visao === 'mentor' && (
          <MentorView estado={estadoAcademia} onAtualizarEstado={onAtualizarAcademia} />
        )}
      </main>
    </div>
  )
}
