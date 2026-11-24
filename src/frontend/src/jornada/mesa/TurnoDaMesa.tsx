import type { ReactNode } from 'react'
import { ChatApp } from '../../apps/ChatApp/ChatApp'
import { IntranetApp } from '../../apps/IntranetApp/IntranetApp'
import { ItsmApp } from '../../apps/ItsmApp/ItsmApp'
import { SimuDeskApp } from '../../apps/SimuDeskApp/SimuDeskApp'
import { nivelPorCenarioId } from '../../educacao/catalogoEducacional'
import { obterProximaDicaMissao } from '../../lab/dicaMissao'
import { semAcessoRemoto } from '../../lab/estadoDoCenario'
import { MissionGuide } from '../../lab/MissionGuide'
import { roteiroDoCenario } from '../../lab/roteiros'
import { SplitLabWorkspace } from '../../lab/SplitLabWorkspace'
import { Icone } from '../../ui/Icone'
import { PainelMentor } from '../mentor/PainelMentor'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useAcademia, useMissao } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { enderecoDe } from '../navegacao/rotas'
import type { Aba } from '../contextosJornada'
import { MapaDeChamados } from './MapaDeChamados'
import { chamadoEmFoco } from './filaDeChamados'
import type { EstadoMesa } from './useEstadoMesa'

const TEXTO_SEM_DICA = 'Modo Missão: dicas ocultas. Mude para Treino para ver o próximo passo.'

const FERRAMENTAS: readonly Aba[] = ['itsm', 'chat', 'simudesk', 'kb']

/**
 * Turno de atendimento da Mesa de Trabalho: guia da missão, aplicativos e gavetas de notas e do Mentor. O
 * motor decide todo estado: aqui só saem ações do participante.
 */
export function TurnoDaMesa({ estado }: { estado: EstadoMesa }) {
  const { modo, setFocoId, focoId, marcas, alternarRevisar } = estado
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
    passosTriagem,
    historicoTerminal,
    artigoKbSelecionado,
    abrirKbDoItsm,
    fecharArtigoKb,
    registroRecente,
    falhaRegistro,
    tentarRegistrarDeNovo,
    executarAcao,
    enviarChat,
  } = useMissao()
  if (!sessaoId || !sessao) return null

  const cenarioDaSessao = sessao.meta.cenarioId
  // Toda Missão do catálogo tem nível de estudo. Só um cenário fora do catálogo (nivelPorCenarioId devolve
  // null) usa o título do catálogo e uma página de notas própria, sem cair no primeiro módulo.
  const nivelSessao = nivelPorCenarioId(cenarioDaSessao)
  const textosMissao = textosDaMissao(cenarioDaSessao)
  const nomeDasNotas = nivelSessao?.nome ?? textosMissao.titulo
  const paginaNotasSessao = estadoAcademia.pages.find((pagina) =>
    nivelSessao
      ? pagina.level === nivelSessao.id && pagina.type === 'cornell'
      : pagina.level === null && pagina.id === `pg-${cenarioDaSessao}`,
  ) ?? {
    id: `pg-${nivelSessao?.id ?? cenarioDaSessao}`,
    icon: nivelSessao?.icon ?? 'notas',
    title: `${nomeDasNotas}: Anotações`,
    level: nivelSessao?.id ?? null,
    type: 'cornell' as const,
    cues: '',
    notes: '',
    summary: '',
  }
  const dicaAtual = obterProximaDicaMissao(sessao, passosTriagem)
  const contextoRoteiro = { sessao, passosTriagem: passosTriagem }
  const roteiroAtual = roteiroDoCenario(sessao.meta.cenarioId)
  const passosFeitos = roteiroAtual.passos.filter((passo) => passo.concluido(contextoRoteiro)).length
  const enderecoRevisao = enderecoDe({ pagina: 'revisao', sessao: sessaoId })
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
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Abrir a Revisão', href: enderecoRevisao }]}>
          Missão registrada neste navegador. A Revisão mostra a linha do tempo e a avaliação do Juiz 360º.
        </AvisoHonesto>
      )}
      {falhaRegistro && (
        <AvisoHonesto acoes={[{ tipo: 'botao', rotulo: 'Tentar registrar de novo', aoClicar: () => void tentarRegistrarDeNovo() }]}>
          Não foi possível consultar a avaliação para registrar esta missão. O turno continua.
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
          <>
            <MissionGuide
              cenarioId={sessao.meta.cenarioId}
              contexto={contextoRoteiro}
              proximoPasso={modo === 'treino' ? dicaAtual : TEXTO_SEM_DICA}
              tituloMissao={textosMissao.titulo}
              onAbrirFerramenta={(ferramenta) => setAba(ferramenta)}
              onAbrirRevisao={() => navegar(enderecoRevisao)}
            />
            <MapaDeChamados
              chamados={sessao.chamados}
              atualId={chamadoEmFoco(sessao.chamados, focoId)?.id ?? null}
              marcas={marcas}
              aoEscolher={(id) => {
                setFocoId(id)
                setAba('itsm')
              }}
              aoAlternarRevisar={alternarRevisar}
            />
          </>
        }
        consola={
          <>
            <nav className="lab-ferramentas" aria-label="Aplicativos da Mesa de Trabalho">
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
                <span
                  className={`dock-contagem ${sessao.dialogo.acessoRemotoLiberado || semAcessoRemoto(cenarioDaSessao) ? 'ok' : ''}`}
                  title={
                    !semAcessoRemoto(cenarioDaSessao) && !sessao.dialogo.acessoRemotoLiberado
                      ? 'Libera depois de validar a identidade do usuário no Comunicador'
                      : undefined
                  }
                >
                  {semAcessoRemoto(cenarioDaSessao) ? 'Console' : sessao.dialogo.acessoRemotoLiberado ? 'Liberado' : 'Bloqueado'}
                </span>,
              )}
              {botaoDaFerramenta('kb', 'base', 'Intranet / KB')}
              <LinkInterno href={enderecoRevisao} className="dock-btn">
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
            <aside className="mesa-drawer" aria-label="Minhas notas durante o atendimento">
              <div className="row-between">
                <h2 className="h3">Minhas notas: {nomeDasNotas}</h2>
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
            <aside className="mesa-drawer" aria-label="Mentor durante o atendimento">
              <div className="row-between">
                <p className="muted">O Mentor só orienta: não executa ações e não avalia a missão.</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Fechar o Mentor"
                  onClick={() => setGaveta(null)}
                >
                  <Icone nome="fechar" />
                </button>
              </div>
              <PainelMentor papel="copiloto" pagina="mesa-de-trabalho" dicaMissao={modo === 'treino' ? dicaAtual : null} />
            </aside>
          ) : undefined
        }
      />
    </>
  )
}
