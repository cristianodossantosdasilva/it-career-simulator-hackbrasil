import type { ReactNode } from 'react'
import { ChatApp } from '../../apps/ChatApp/ChatApp'
import { IntranetApp } from '../../apps/IntranetApp/IntranetApp'
import { ItsmApp } from '../../apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from '../../apps/SimuDeskApp/SimuDeskApp'
import { nivelPorCenarioId } from '../../educacao/catalogoEducacional'
import { obterProximaDicaMissao } from '../../lab/dicaMissao'
import { MissionGuide } from '../../lab/MissionGuide'
import { roteiroDoCenario } from '../../lab/roteiros'
import { SplitLabWorkspace } from '../../lab/SplitLabWorkspace'
import { Icone } from '../../ui/Icone'
import { PainelComandante } from '../comandante/PainelComandante'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { useAcademia, useVoo } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { enderecoDe } from '../navegacao/rotas'
import type { Aba } from '../contextosJornada'

const FERRAMENTAS: readonly Aba[] = ['itsm', 'chat', 'simudesk', 'kb']

/**
 * Turno de atendimento da Cabine: guia da missão, aplicativos e gavetas de notas e do Comandante. O
 * motor decide todo estado: aqui só saem ações do participante.
 */
export function TurnoDaCabine() {
  const { estadoAcademia, atualizarEstadoAcademia } = useAcademia()
  const {
    sessaoId,
    sessao,
    aba,
    setAba,
    gaveta,
    setGaveta,
    ocupado,
    aviso,
    setAviso,
    nivel1Passos,
    historicoTerminal,
    artigoKbSelecionado,
    abrirKbDoItsm,
    fecharArtigoKb,
    registroRecente,
    falhaRegistro,
    tentarRegistrarDeNovo,
    executarAcao,
    enviarChat,
  } = useVoo()
  if (!sessaoId || !sessao) return null

  const nivelSessao = nivelPorCenarioId(sessao.meta.cenarioId)
  const paginaNotasSessao = estadoAcademia.pages.find(
    (pagina) => pagina.level === nivelSessao.id && pagina.type === 'cornell',
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
  const enderecoCaixaPreta = enderecoDe({ pagina: 'caixa-preta', sessao: sessaoId })
  const abaVisivel: Aba = FERRAMENTAS.includes(aba) ? aba : 'itsm'

  function atualizarNotasSessao(campo: 'cues' | 'notes', valor: string) {
    atualizarEstadoAcademia((anterior) => {
      const existe = anterior.pages.some((pagina) => pagina.id === paginaNotasSessao.id)
      const pages = existe
        ? anterior.pages.map((pagina) => (pagina.id === paginaNotasSessao.id ? { ...pagina, [campo]: valor } : pagina))
        : [...anterior.pages, { ...paginaNotasSessao, [campo]: valor }]
      return { ...anterior, pages }
    })
  }

  function botaoDaFerramenta(id: Aba, icone: 'chamado' | 'conversa' | 'remoto' | 'base', rotulo: string, extra?: ReactNode) {
    const ativa = abaVisivel === id
    return (
      <button
        type="button"
        aria-current={ativa ? 'page' : undefined}
        className={`dock-btn ${ativa ? 'active' : ''}`}
        onClick={() => setAba(id)}
      >
        <Icone nome={icone} tamanho={16} />
        <span>{rotulo}</span>
        {extra}
      </button>
    )
  }

  return (
    <>
      {registroRecente?.sessaoId === sessaoId && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Abrir a Caixa-preta', href: enderecoCaixaPreta }]}>
          Voo registrado neste navegador. A Caixa-preta mostra a linha do tempo e a avaliação do Juiz 360º.
        </AvisoHonesto>
      )}
      {falhaRegistro && (
        <AvisoHonesto acoes={[{ tipo: 'botao', rotulo: 'Tentar registrar de novo', aoClicar: () => void tentarRegistrarDeNovo() }]}>
          Não foi possível consultar a avaliação para registrar este voo. O turno continua.
        </AvisoHonesto>
      )}
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
            onAbrirCaixaPreta={() => navegar(enderecoCaixaPreta)}
          />
        }
        consola={
          <>
            <nav className="lab-ferramentas" aria-label="Aplicativos da Cabine">
              {botaoDaFerramenta(
                'itsm',
                'chamado',
                'ITSM / Chamados',
                <span className="dock-contagem dado-mono">{sessao.chamados.length}</span>,
              )}
              {botaoDaFerramenta(
                'chat',
                'conversa',
                'Comunicador IA',
                <span className="dock-contagem dado-mono">{sessao.dialogo.mensagens.length}</span>,
              )}
              {botaoDaFerramenta(
                'simudesk',
                'remoto',
                'SimuDesk Remoto',
                <span className={`dock-contagem ${sessao.dialogo.acessoRemotoLiberado ? 'ok' : ''}`}>
                  {sessao.dialogo.acessoRemotoLiberado ? 'Liberado' : 'Bloqueado'}
                </span>,
              )}
              {botaoDaFerramenta('kb', 'base', 'Intranet / KB')}
              <LinkInterno href={enderecoCaixaPreta} className="dock-btn">
                <Icone nome="credencial" tamanho={16} />
                <span>Juiz 360º e Replay</span>
              </LinkInterno>
            </nav>
            <div className="workspace-main">
              {abaVisivel === 'itsm' && (
                <ItsmApp sessao={sessao} onAcao={executarAcao} ocupado={ocupado} onAbrirKb={abrirKbDoItsm} />
              )}
              {abaVisivel === 'chat' && (
                <ChatApp sessao={sessao} onChat={enviarChat} onAcao={executarAcao} ocupado={ocupado} />
              )}
              {abaVisivel === 'simudesk' && (
                <SimuDeskApp
                  sessao={sessao}
                  historicoTerminal={historicoTerminal}
                  onComando={(comando) => executarAcao('estacao.executar_comando', { comando })}
                  onAcao={executarAcao}
                  ocupado={ocupado}
                />
              )}
              {abaVisivel === 'kb' && (
                <IntranetApp
                  key={artigoKbSelecionado ?? 'intranet'}
                  artigoSelecionadoId={artigoKbSelecionado}
                  onArtigoFechado={fecharArtigoKb}
                />
              )}
            </div>
          </>
        }
        gaveta={
          gaveta === 'notas' ? (
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
                onChange={(evento) => atualizarNotasSessao('cues', evento.target.value)}
              />
              <label className="block-label" htmlFor="ws-notes">
                Anotações
              </label>
              <textarea
                id="ws-notes"
                className="block"
                value={paginaNotasSessao.notes ?? ''}
                onChange={(evento) => atualizarNotasSessao('notes', evento.target.value)}
              />
              <p className="muted saved">
                <Icone nome="confirmar" tamanho={16} /> Salvo automaticamente
              </p>
            </aside>
          ) : gaveta === 'tutor' ? (
            <aside className="cockpit-drawer" aria-label="Comandante durante o atendimento">
              <div className="row-between">
                <p className="muted">O Comandante só orienta: não executa ações e não avalia o voo.</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Fechar o Comandante"
                  onClick={() => setGaveta(null)}
                >
                  <Icone nome="fechar" />
                </button>
              </div>
              <PainelComandante papel="copiloto" pagina="cabine" dicaMissao={dicaAtual} />
            </aside>
          ) : undefined
        }
      />
    </>
  )
}
