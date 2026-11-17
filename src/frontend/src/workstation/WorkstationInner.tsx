import { useState } from 'react'
import { ChatApp } from '../apps/ChatApp/ChatApp'
import { IntranetApp } from '../apps/IntranetApp/IntranetApp'
import { ItsmApp } from '../apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from '../apps/SimuDeskApp/SimuDeskApp'
import { BarraSuperior, type VisaoAcademia } from '../educacao/BarraSuperior'
import { nivelPorCenarioId, responderMentor } from '../educacao/catalogoEducacional'
import { useAcademia, useVoo } from '../jornada/contextosJornada'
import { obterProximaDicaMissao } from '../lab/dicaMissao'
import { MissionGuide } from '../lab/MissionGuide'
import { roteiroDoCenario } from '../lab/roteiros'
import { SplitLabWorkspace } from '../lab/SplitLabWorkspace'
import { ReplayView } from '../replay/ReplayView'
import { Icone } from '../ui/Icone'
import { TelaInicial } from './TelaInicial'

/**
 * Alterna entre a Tela Inicial e a Workstation, lendo o estado de ProvedorJornada. Componente de
 * transição da fase 1: as páginas por rota substituem esta alternância na fase 2.
 */
export function WorkstationInner() {
  const { estadoAcademia, atualizarEstadoAcademia, resumoCarreira, atualizarResumoCarreira } = useAcademia()
  const {
    sessaoId,
    sessao,
    emLaboratorio,
    setEmLaboratorio,
    aba,
    setAba,
    gaveta,
    setGaveta,
    tutorMsgs,
    setTutorMsgs,
    tutorInput,
    setTutorInput,
    ocupado,
    aviso,
    setAviso,
    replay,
    nivel1Passos,
    historicoTerminal,
    artigoKbSelecionado,
    kbRetornoLinkUri,
    abrirArtigoKb,
    abrirKbDoItsm,
    fecharArtigoKb,
    iniciarSessao,
    executarAcao,
    enviarChat,
    carregarReplay,
  } = useVoo()
  const [visaoAcademia, setVisaoAcademia] = useState<VisaoAcademia>('home')

  if (!sessaoId || !sessao || !emLaboratorio) {
    return <TelaInicial visaoInicial={visaoAcademia} onIniciar={iniciarSessao} ocupado={ocupado} erro={aviso} />
  }
  const nivelSessao = nivelPorCenarioId(sessao.meta.cenarioId)
  const paginaNotasSessao = estadoAcademia.pages.find(
    (p) => p.level === nivelSessao.id && p.type === 'cornell',
  ) ?? {
    id: `pg-${nivelSessao.id}`,
    icon: nivelSessao.icon,
    title: `${nivelSessao.nome}: Anotações`,
    level: nivelSessao.id,
    type: 'cornell' as const,
    cues: '',
    notes: '',
    summary: '',
  }
  const dicaAtual = obterProximaDicaMissao(sessao, nivel1Passos)
  const contextoRoteiro = { sessao, passosNivel1: nivel1Passos }
  const roteiroAtual = roteiroDoCenario(sessao.meta.cenarioId)
  const passosFeitos = roteiroAtual.passos.filter((passo) => passo.concluido(contextoRoteiro)).length

  // A sessao continua em memoria: o destino Laboratorio do shell retoma o turno sem criar outro.
  function irParaAcademia(visao: VisaoAcademia = 'home') {
    setVisaoAcademia(visao)
    setEmLaboratorio(false)
    setGaveta(null)
    void atualizarResumoCarreira()
  }

  function abrirReplay() {
    setAba('replay')
    void carregarReplay()
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
        xpOficial={resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp}
        onSelecionarVisao={irParaAcademia}
        onAbrirCurriculo={abrirReplay}
        credencialAtiva={aba === 'replay'}
        slotDireitoSessao={
          <>
            <span className="dado-contexto hide-sm">
              <span className="dado-contexto-rotulo">Nível</span> {sessao.meta.nivel}
            </span>
            <span className="dado-contexto">
              <Icone nome="relogio" tamanho={16} />
              <span className="dado-mono">{sessao.meta.minutoSimulado} min</span>
              <span className="sr-only">de tempo simulado</span>
            </span>
            <span className="dado-contexto hide-sm">
              <span className="dado-contexto-rotulo">Semente</span>{' '}
              <span className="dado-mono">{sessao.meta.semente}</span>
            </span>
            <span className="dado-contexto hide-sm">
              <span className="dado-contexto-rotulo">Seq</span> <span className="dado-mono">{sessao.ultimoSeq}</span>
            </span>
            <button
              type="button"
              className="botao-contexto"
              aria-pressed={gaveta === 'notas'}
              onClick={() => setGaveta((g) => (g === 'notas' ? null : 'notas'))}
            >
              <Icone nome="notas" />
              <span className="botao-contexto-texto">Minhas notas</span>
            </button>
            <button
              type="button"
              className="botao-contexto"
              aria-pressed={gaveta === 'tutor'}
              onClick={() => setGaveta((g) => (g === 'tutor' ? null : 'tutor'))}
            >
              <Icone nome="conversa" />
              <span className="botao-contexto-texto">Mentor da missão</span>
            </button>
            <button
              type="button"
              className="botao-contexto"
              aria-label="Voltar para a Tela Inicial"
              onClick={() => irParaAcademia('home')}
            >
              <Icone nome="voltar" />
              <span className="botao-contexto-texto">Tela inicial</span>
            </button>
          </>
        }
      />

      {aviso && (
        <div className="banner-notice" role="status" aria-live="polite">
          <span>{aviso}</span>
          <button type="button" className="chip" onClick={() => setAviso(null)}>
            Fechar
          </button>
        </div>
      )}

      <SplitLabWorkspace
        resumoGuia={`${passosFeitos} de ${roteiroAtual.passos.length} passos`}
        guia={
          <MissionGuide
            cenarioId={sessao.meta.cenarioId}
            contexto={contextoRoteiro}
            proximoPasso={dicaAtual}
            tituloMissao={nivelSessao.titulo}
            onAbrirFerramenta={(ferramenta) => setAba(ferramenta)}
            onAbrirCaixaPreta={abrirReplay}
          />
        }
        consola={
          <>
            <nav className="lab-ferramentas" aria-label="Aplicativos da Workstation">
              <button
                type="button"
                aria-current={aba === 'itsm' ? 'page' : undefined}
                className={`dock-btn ${aba === 'itsm' ? 'active' : ''}`}
                onClick={() => setAba('itsm')}
              >
                <Icone nome="chamado" tamanho={16} />
                <span>ITSM / Chamados</span>
                <span className="dock-contagem dado-mono">{sessao.chamados.length}</span>
              </button>
              <button
                type="button"
                aria-current={aba === 'chat' ? 'page' : undefined}
                className={`dock-btn ${aba === 'chat' ? 'active' : ''}`}
                onClick={() => setAba('chat')}
              >
                <Icone nome="conversa" tamanho={16} />
                <span>Comunicador IA</span>
                <span className="dock-contagem dado-mono">{sessao.dialogo.mensagens.length}</span>
              </button>
              <button
                type="button"
                aria-current={aba === 'simudesk' ? 'page' : undefined}
                className={`dock-btn ${aba === 'simudesk' ? 'active' : ''}`}
                onClick={() => setAba('simudesk')}
              >
                <Icone nome="remoto" tamanho={16} />
                <span>SimuDesk Remoto</span>
                <span className={`dock-contagem ${sessao.dialogo.acessoRemotoLiberado ? 'ok' : ''}`}>
                  {sessao.dialogo.acessoRemotoLiberado ? 'Liberado' : 'Bloqueado'}
                </span>
              </button>
              <button
                type="button"
                aria-current={aba === 'kb' ? 'page' : undefined}
                className={`dock-btn ${aba === 'kb' ? 'active' : ''}`}
                onClick={() => setAba('kb')}
              >
                <Icone nome="base" tamanho={16} />
                <span>Intranet / KB</span>
              </button>
              <button
                type="button"
                aria-current={aba === 'replay' ? 'page' : undefined}
                className={`dock-btn ${aba === 'replay' ? 'active' : ''}`}
                onClick={abrirReplay}
              >
                <Icone nome="credencial" tamanho={16} />
                <span>Juiz 360º e Replay</span>
              </button>
            </nav>

        <main className="workspace-main">
          {aba === 'itsm' && <ItsmApp sessao={sessao} onAcao={executarAcao} ocupado={ocupado} onAbrirKb={abrirKbDoItsm} />}
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
          </>
        }
        gaveta={
          gaveta ? (
            <>

        {gaveta === 'notas' && (
          <aside className="cockpit-drawer" aria-label="Minhas notas durante o atendimento">
            <div className="row-between">
              <h2 className="h3">Minhas notas: {nivelSessao.nome}</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Fechar minhas notas"
                onClick={() => setGaveta(null)}
              >
                <Icone nome="fechar" />
              </button>
            </div>
            <p className="muted mt-1">Método Cornell sincronizado ao seu Caderno de estudos.</p>
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
            <p className="muted saved">
              <Icone nome="confirmar" tamanho={16} /> Salvo automaticamente
            </p>
          </aside>
        )}

        {gaveta === 'tutor' && (
          <aside className="cockpit-drawer" aria-label="Mentor da missão durante o atendimento">
            <div className="row-between">
              <h2 className="h3">Mentor da missão</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Fechar mentor da missão"
                onClick={() => setGaveta(null)}
              >
                <Icone nome="fechar" />
              </button>
            </div>
            <p className="muted mt-1">Respostas guiadas pelo conteúdo da trilha.</p>
            <div className="chat short mt" aria-live="polite">
              {tutorMsgs.map((m, i) => (
                <div key={i} className={`bubble ${m.who}`}>
                  {m.who === 'ai' && <div className="who">Mentor</div>}
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
                Pergunta ao mentor
              </label>
              <input
                id="ws-tutor-in"
                type="text"
                className="text grow"
                placeholder="Pergunte ao mentor..."
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Enviar
              </button>
            </form>
          </aside>
        )}
            </>
          ) : undefined
        }
      />
    </div>
  )
}
