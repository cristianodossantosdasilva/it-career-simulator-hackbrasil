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

/**
 * Entrada pública antes da Tela Inicial.
 * Redesenhada com estética de Cockpit Operacional e Teaser do Simulador em Voo.
 */
export function HomeVocacional({ ocupado, erro, onComecar, onIrDireto }: HomeVocacionalProps) {
  const [respostas, setRespostas] = useState<Record<string, string>>({})

  const foco = respostas.foco ? RESPOSTAS_FOCO[respostas.foco] : undefined
  const ritmo = respostas.ritmo ? RESPOSTAS_RITMO[respostas.ritmo] : undefined

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
          <span className="home-voc-badge-topo">Cockpit v2026</span>
        </div>
        <div className="home-voc-topo-acoes">
          <AlternadorTema variante="completo" className="alternador-tema-linha" />
        </div>
      </header>

      <main id="home-voc-conteudo" className="home-voc-main">
        {/* HERO SECTION: GRID TÁTICO COM TEASER DO COCKPIT */}
        <section className="home-voc-hero-grid" aria-labelledby="home-voc-titulo">
          <div className="home-voc-hero">
            <p className="home-voc-contexto">
              <Icone nome="laboratorio" tamanho={16} />
              {T.contexto}
            </p>
            <h1 id="home-voc-titulo" className="home-voc-titulo">
              {T.titulo}
            </h1>
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
                <Icone nome="chamado" tamanho={14} /> ITSM Realista
              </span>
              <span className="home-voc-telemetria-separador">•</span>
              <span className="home-voc-telemetria-item">
                <Icone nome="relogio" tamanho={14} /> Telemetria SLA
              </span>
              <span className="home-voc-telemetria-separador">•</span>
              <span className="home-voc-telemetria-item">
                <Icone nome="verificar" tamanho={14} /> Caixa-Preta Auditável
              </span>
            </div>
          </div>

          {/* TEASER DO COCKPIT OPERACIONAL DA AURORA LOGÍSTICA */}
          <div className="home-voc-cockpit-preview panel" aria-hidden="true">
            <div className="home-voc-cockpit-header">
              <div className="home-voc-cockpit-status">
                <span className="home-voc-pulse-dot" />
                <span className="dado-mono">AURORA OPERACIONAL • CH-0001</span>
              </div>
              <div className="home-voc-cockpit-sla dado-mono">
                <Icone nome="relogio" tamanho={13} /> SLA: 12:00
              </div>
            </div>

            <div className="home-voc-cockpit-ticket">
              <div className="home-voc-cockpit-meta">
                <span className="chip chip-p1">P1 Alta Prioridade</span>
                <span className="home-voc-cockpit-local">Doca de Expedição • Terminal 04</span>
              </div>
              <p className="home-voc-cockpit-assunto">Impressora térmica Zebra parada no check-out de cargas</p>
            </div>

            <div className="home-voc-cockpit-chat-preview">
              <div className="home-voc-chat-msg">
                <span className="home-voc-chat-avatar">RD</span>
                <div className="home-voc-chat-corpo">
                  <div className="home-voc-chat-topo">
                    <strong>Roberto Dias</strong>
                    <span className="home-voc-chat-hora">14:02</span>
                  </div>
                  <p>O caminhão precisa sair em 15 minutos e as etiquetas pararam de imprimir. Pode me ajudar urgente?</p>
                </div>
              </div>
            </div>

            <div className="home-voc-cockpit-footer">
              <span className="home-voc-cockpit-hint">
                <Icone nome="terminal" tamanho={14} /> Console SimuDesk + Base KB-0108 conectados
              </span>
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
            <Icone nome="verificar" tamanho={18} />
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
