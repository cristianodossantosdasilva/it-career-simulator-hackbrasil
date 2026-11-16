import { useState } from 'react'
import { AlternadorTema } from '../shell/AlternadorTema'
import { Icone } from '../ui/Icone'
import {
  AREAS,
  JORNADA,
  PERGUNTAS,
  RESPOSTAS_FOCO,
  RESPOSTAS_RITMO,
  TEXTOS_HOME as T,
} from './catalogoVocacional'

interface HomeVocacionalProps {
  /** Há uma chamada à API em andamento (início de sessão pelo atalho). */
  ocupado: boolean
  erro: string | null
  /** Abre a Tela Inicial (Missões). Não cria sessão. */
  onComecar: () => void
  /** Mesmo efeito do Primeiro Voo: abre o laboratório do nível Estagiário ou retoma o turno em memória. */
  onIrDireto: () => void
}

type AbaCockpit = 'itsm' | 'terminal' | 'chat'

interface ComandoExecutado {
  comando: string
  saida: string
  status: 'ok' | 'alerta' | 'sucesso'
}

/**
 * Entrada pública antes da Tela Inicial.
 * Redesenhada como Rampa de Decolagem com Cockpit Tático Interativo.
 */
export function HomeVocacional({ ocupado, erro, onComecar, onIrDireto }: HomeVocacionalProps) {
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [abaAtiva, setAbaAtiva] = useState<AbaCockpit>('itsm')
  const [historicoComandos, setHistoricoComandos] = useState<ComandoExecutado[]>([
    {
      comando: 'ping gateway-doca4.aurora.local',
      saida: '64 bytes de 192.168.10.1: icmp_seq=1 ttl=64 tempo=1.2ms (Online)',
      status: 'ok',
    },
  ])

  const foco = respostas.foco ? RESPOSTAS_FOCO[respostas.foco] : undefined
  const ritmo = respostas.ritmo ? RESPOSTAS_RITMO[respostas.ritmo] : undefined

  function executarComandoSimulado(tipo: 'status' | 'reiniciar') {
    if (tipo === 'status') {
      setHistoricoComandos((ant) => [
        ...ant,
        {
          comando: 'systemctl status zebra-spooler',
          saida: 'ALERTA: servico spooler parado. Erro no buffer de impressao da Doca 4.',
          status: 'alerta',
        },
      ])
    } else {
      setHistoricoComandos((ant) => [
        ...ant,
        {
          comando: 'sudo systemctl restart zebra-spooler',
          saida: 'SUCESSO: servico reiniciado. Fila liberada. Etiquetas imprimindo.',
          status: 'sucesso',
        },
      ])
    }
  }

  return (
    <div className="home-voc">
      <a className="skip" href="#home-voc-conteudo">
        Pular para o conteúdo
      </a>

      <header className="home-voc-topo">
        <div className="home-voc-marca-container">
          <p className="home-voc-marca">
            <span className="home-voc-marca-icone" aria-hidden="true">
              <Icone nome="marca" />
            </span>
            <span className="home-voc-marca-nome">{T.marca}</span>
          </p>
          <span className="home-voc-badge-topo">Cockpit Tático v2026</span>
        </div>
        <div className="home-voc-topo-acoes">
          <AlternadorTema variante="completo" className="alternador-tema-linha" />
        </div>
      </header>

      <main id="home-voc-conteudo" className="home-voc-main">
        {/* HERO SECTION: GRID TÁTICO COM MINI-COCKPIT INTERATIVO */}
        <section className="home-voc-hero-grid" aria-labelledby="home-voc-titulo">
          <div className="home-voc-hero">
            <div className="home-voc-pill-tag">
              <span className="home-voc-pulse-dot" aria-hidden="true" />
              <span>Simulador de Voo Operacional de TI</span>
            </div>

            <h1 id="home-voc-titulo" className="home-voc-titulo">
              {T.titulo}
            </h1>

            <p className="home-voc-contexto">
              <Icone nome="laboratorio" tamanho={16} />
              {T.contexto}
            </p>

            <p className="home-voc-lead">{T.lead}</p>

            {erro && (
              <div className="alert-danger" role="alert">
                {erro}
              </div>
            )}

            <div className="home-voc-acoes">
              <button type="button" className="btn btn-primary btn-lg" disabled={ocupado} onClick={onComecar}>
                {T.comecar}
                <Icone nome="avancar" />
              </button>
              <button type="button" className="btn btn-secondary btn-lg" disabled={ocupado} onClick={onIrDireto}>
                {T.irDireto}
              </button>
            </div>

            <div className="home-voc-telemetria-strip" aria-hidden="true">
              <span className="home-voc-telemetria-item">
                <Icone nome="chamado" tamanho={16} /> ITSM Realista
              </span>
              <span className="home-voc-telemetria-separador">•</span>
              <span className="home-voc-telemetria-item">
                <Icone nome="relogio" tamanho={16} /> Telemetria SLA
              </span>
              <span className="home-voc-telemetria-separador">•</span>
              <span className="home-voc-telemetria-item">
                <Icone nome="verificar" tamanho={16} /> Caixa-Preta Auditável
              </span>
            </div>
          </div>

          {/* MINI-CONSOLE INTERATIVO DO SIMULADOR (COCKPIT TEASER) */}
          <div className="home-voc-cockpit-preview panel" role="region" aria-label="Console Operacional da Aurora Logística">
            <div className="home-voc-cockpit-header">
              <div className="home-voc-cockpit-dots" aria-hidden="true">
                <span className="cockpit-dot red" />
                <span className="cockpit-dot yellow" />
                <span className="cockpit-dot green" />
              </div>
              <div className="home-voc-cockpit-status">
                <span className="dado-mono">AURORA_OS // CONSOLE_v2.6</span>
              </div>
              <div className="home-voc-cockpit-sla dado-mono" aria-label="Tempo de SLA restante: 11 minutos e 42 segundos">
                <span className="home-voc-pulse-dot" aria-hidden="true" />
                <Icone nome="relogio" tamanho={16} /> SLA: 11:42
              </div>
            </div>

            {/* ABAS TÁTICAS DO CONSOLE */}
            <div className="home-voc-cockpit-tabs" role="tablist" aria-label="Ferramentas operacionais do chamado">
              <button
                type="button"
                role="tab"
                id="tab-itsm"
                aria-selected={abaAtiva === 'itsm'}
                aria-controls="panel-itsm"
                className={`home-voc-cockpit-tab ${abaAtiva === 'itsm' ? 'ativa' : ''}`}
                onClick={() => setAbaAtiva('itsm')}
              >
                <Icone nome="chamado" tamanho={16} />
                <span>Chamado #001</span>
                <span className="tab-badge-alerta" aria-hidden="true">P1</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-terminal"
                aria-selected={abaAtiva === 'terminal'}
                aria-controls="panel-terminal"
                className={`home-voc-cockpit-tab ${abaAtiva === 'terminal' ? 'ativa' : ''}`}
                onClick={() => setAbaAtiva('terminal')}
              >
                <Icone nome="terminal" tamanho={16} />
                <span>SimuDesk Shell</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-chat"
                aria-selected={abaAtiva === 'chat'}
                aria-controls="panel-chat"
                className={`home-voc-cockpit-tab ${abaAtiva === 'chat' ? 'ativa' : ''}`}
                onClick={() => setAbaAtiva('chat')}
              >
                <Icone nome="conversa" tamanho={16} />
                <span>Comunicador</span>
                <span className="tab-badge-novidade" aria-hidden="true">1</span>
              </button>
            </div>

            {/* CORPO DO CONSOLE CONFORME ABA */}
            <div className="home-voc-cockpit-conteudo">
              {abaAtiva === 'itsm' && (
                <div id="panel-itsm" role="tabpanel" aria-labelledby="tab-itsm" className="home-voc-tabpanel">
                  <div className="home-voc-cockpit-ticket">
                    <div className="home-voc-cockpit-meta">
                      <span className="chip chip-p1">P1 Alta Prioridade</span>
                      <span className="home-voc-cockpit-local">Doca de Expedição • Terminal 04</span>
                    </div>
                    <p className="home-voc-cockpit-assunto">Impressora térmica Zebra parada no check-out de cargas</p>
                    <p className="home-voc-cockpit-detalhe">
                      Três carretas aguardando impressão do romaneio fiscal para liberação na portaria.
                    </p>
                    <div className="home-voc-cockpit-acoes-inline">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAbaAtiva('terminal')}
                      >
                        <Icone nome="terminal" tamanho={16} /> Abrir SimuDesk Shell
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAbaAtiva('chat')}
                      >
                        <Icone nome="conversa" tamanho={16} /> Falar com Roberto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {abaAtiva === 'terminal' && (
                <div id="panel-terminal" role="tabpanel" aria-labelledby="tab-terminal" className="home-voc-tabpanel">
                  <div className="home-voc-terminal-box dado-mono">
                    <div className="home-voc-terminal-logs">
                      {historicoComandos.map((h, i) => (
                        <div key={i} className="home-voc-log-linha">
                          <p className="cmd-prompt"><span className="prompt-simbolo">$</span> {h.comando}</p>
                          <p className={`cmd-saida saida-${h.status}`}>{h.saida}</p>
                        </div>
                      ))}
                    </div>
                    <div className="home-voc-terminal-controles">
                      <span className="terminal-dica">Comandos de teste:</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm cmd-btn"
                        onClick={() => executarComandoSimulado('status')}
                      >
                        status spooler
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm cmd-btn"
                        onClick={() => executarComandoSimulado('reiniciar')}
                      >
                        reiniciar spooler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {abaAtiva === 'chat' && (
                <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="home-voc-tabpanel">
                  <div className="home-voc-cockpit-chat-preview">
                    <div className="home-voc-chat-msg">
                      <span className="home-voc-chat-avatar" aria-hidden="true">RD</span>
                      <div className="home-voc-chat-corpo">
                        <div className="home-voc-chat-topo">
                          <strong>Roberto Dias</strong>
                          <span className="home-voc-chat-hora">14:02</span>
                        </div>
                        <p>O caminhão precisa sair em 15 minutos e as etiquetas pararam de imprimir. Pode me ajudar urgente?</p>
                      </div>
                    </div>
                    <div className="home-voc-chat-msg chat-msg-resposta">
                      <span className="home-voc-chat-avatar avatar-operador" aria-hidden="true">TI</span>
                      <div className="home-voc-chat-corpo">
                        <div className="home-voc-chat-topo">
                          <strong>Você (Operador N1)</strong>
                          <span className="home-voc-chat-hora">14:03</span>
                        </div>
                        <p>Recebido, Roberto. Já abri a sessão no SimuDesk para diagnosticar o spooler da doca.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="home-voc-cockpit-footer">
              <span className="home-voc-cockpit-hint">
                <Icone nome="terminal" tamanho={16} /> Console SimuDesk e Base KB-0108 conectados
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm home-voc-btn-assumir"
                disabled={ocupado}
                onClick={onIrDireto}
              >
                Assumir chamado
              </button>
            </div>
          </div>
        </section>

        {/* JORNADA EM CINCO PASSOS */}
        <section aria-labelledby="home-voc-jornada-titulo">
          <div className="home-voc-secao-cabecalho">
            <h2 id="home-voc-jornada-titulo" className="home-voc-secao-titulo">
              {T.jornadaTitulo}
            </h2>
            <p className="home-voc-secao-subtitulo">Da primeira chamada até a credencial com evidências reais do seu turno.</p>
          </div>
          <ol className="home-voc-lista home-voc-jornada">
            {JORNADA.map((passo, indice) => (
              <li key={passo.id} className="panel home-voc-cartao home-voc-passo-card">
                <div className="home-voc-passo-topo">
                  <span className="home-voc-numero dado-mono" aria-hidden="true">
                    0{indice + 1}
                  </span>
                  <span className="home-voc-passo-fase">Etapa {indice + 1}</span>
                </div>
                <h3 className="home-voc-cartao-titulo">{passo.titulo}</h3>
                <p className="home-voc-cartao-texto">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ÁREAS E NÍVEIS */}
        <section aria-labelledby="home-voc-areas-titulo">
          <div className="home-voc-secao-cabecalho">
            <h2 id="home-voc-areas-titulo" className="home-voc-secao-titulo">
              {T.areasTitulo}
            </h2>
            <p className="home-voc-secao-texto">{T.areasTexto}</p>
          </div>
          <ul className="home-voc-lista home-voc-areas">
            {AREAS.map((area) => (
              <li
                key={area.id}
                className={`panel home-voc-cartao home-voc-area ${area.disponivel ? 'disponivel' : 'futura'}`}
              >
                <div className="home-voc-area-header">
                  <h3 className="home-voc-cartao-titulo">{area.nome}</h3>
                  {area.disponivel && <span className="home-voc-area-badge-ativo">Ativo</span>}
                </div>
                {area.disponivel && area.descricao && <p className="home-voc-cartao-texto">{area.descricao}</p>}
                {area.disponivel && area.nivel && <p className="home-voc-cartao-texto home-voc-area-nivel">{area.nivel}</p>}
                <span className={`chip ${area.disponivel ? 'home-voc-selo-ativo' : ''}`}>
                  {area.disponivel ? 'Disponível nesta edição' : 'Roteiro futuro'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* GUIA DE ORIENTAÇÃO */}
        <section className="panel home-voc-guia" aria-labelledby="home-voc-guia-titulo">
          <div className="home-voc-guia-topo">
            <div className="home-voc-guia-badge">
              <Icone nome="mentor" tamanho={16} /> Radar de Orientação
            </div>
            <h2 id="home-voc-guia-titulo" className="home-voc-secao-titulo">
              {T.guiaTitulo}
            </h2>
            <p className="home-voc-guia-rotulo">{T.guiaRotulo}</p>
          </div>

          <div className="home-voc-perguntas-grid">
            {PERGUNTAS.map((pergunta) => (
              <fieldset key={pergunta.id} className="home-voc-pergunta">
                <legend>{pergunta.enunciado}</legend>
                <div className="home-voc-opcoes">
                  {pergunta.opcoes.map((opcao) => (
                    <label key={opcao.id} className="home-voc-opcao">
                      <input
                        type="radio"
                        name={`home-voc-${pergunta.id}`}
                        value={opcao.id}
                        checked={respostas[pergunta.id] === opcao.id}
                        onChange={() => setRespostas((anteriores) => ({ ...anteriores, [pergunta.id]: opcao.id }))}
                      />
                      <span>{opcao.rotulo}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="home-voc-resposta-area" role="status" aria-live="polite">
            {(foco || ritmo) && (
              <div className="home-voc-resposta">
                {foco && <p>{foco}</p>}
                {ritmo && <p>{ritmo.texto}</p>}
              </div>
            )}
          </div>
          {ritmo && (
            <button
              type="button"
              className="btn btn-secondary btn-sm home-voc-sugestao"
              disabled={ocupado}
              onClick={ritmo.encaminhamento === 'laboratorio' ? onIrDireto : onComecar}
            >
              {ritmo.botao}
            </button>
          )}
        </section>

        {/* LIMITES E INTEGRIDADE OPERACIONAL */}
        <section className="panel home-voc-limites-painel" aria-labelledby="home-voc-limites-titulo">
          <div className="home-voc-limites-header">
            <Icone nome="verificar" tamanho={20} />
            <h2 id="home-voc-limites-titulo" className="home-voc-secao-titulo">
              {T.limitesTitulo}
            </h2>
          </div>
          <ul className="home-voc-limites">
            {T.limites.map((linha) => (
              <li key={linha}>{linha}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
