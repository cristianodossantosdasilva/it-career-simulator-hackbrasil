import { useState } from 'react'
import type { ChamadoDto, SessaoProjecao } from '../../api/types'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { Icone } from '../../ui/Icone'
import { SlaMeter } from '../../ui/SlaMeter'

const T = TEXTOS_WORKSTATION.itsm

interface Props {
  sessao: SessaoProjecao
  onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  ocupado: boolean
  /** Abre um artigo da base de conhecimento. Sem ele, a consulta de política só registra a ação no motor. */
  onAbrirKb?: (artigoId: string) => void
}

type EstadoVisual = 'neutro' | 'ativo' | 'atencao' | 'ok'

const STATUS_CHAMADO: Record<string, { rotulo: string; estado: EstadoVisual }> = {
  Novo: { rotulo: 'Novo', estado: 'neutro' },
  EmAtendimento: { rotulo: 'Em atendimento', estado: 'ativo' },
  Escalonado: { rotulo: 'Escalonado', estado: 'atencao' },
  Resolvido: { rotulo: 'Resolvido', estado: 'ok' },
  Encerrado: { rotulo: 'Encerrado', estado: 'ok' },
}

function EstadoChamado({ status }: { status: string }) {
  const info = STATUS_CHAMADO[status] ?? { rotulo: status, estado: 'neutro' as EstadoVisual }
  return (
    <span className="estado" data-estado={info.estado}>
      {info.rotulo}
    </span>
  )
}

function chamadoEncerrado(c: ChamadoDto) {
  return c.status === 'Resolvido' || c.status === 'Encerrado'
}

/** Nota pública da resolução em lote quando a pessoa não escreve a dela: serve a qualquer causa do incidente. */
const NOTA_LOTE_PADRAO = 'Serviço restabelecido e chamados vinculados normalizados.'
export function ItsmApp({ sessao, onAcao, ocupado, onAbrirKb }: Props) {
  const [selecionadoId, setSelecionadoId] = useState<string>(sessao.chamados[0]?.id ?? 'CH-0001')
  const [categoria, setCategoria] = useState('Acesso a Rede')
  const [urgencia, setUrgencia] = useState('Alta')
  const [impacto, setImpacto] = useState('Medio')
  const [notaTexto, setNotaTexto] = useState('')
  const [notaTipo, setNotaTipo] = useState<'Interna' | 'Publica'>('Interna')
  const [notaResolucao, setNotaResolucao] = useState('')
  const [tituloProblema, setTituloProblema] = useState('Falha simultanea em varios chamados')
  const [notaLote, setNotaLote] = useState('')
  const [causaRaiz, setCausaRaiz] = useState('')

  const chamado: ChamadoDto | undefined =
    sessao.chamados.find((c) => c.id === selecionadoId) ?? sessao.chamados[0]
  const ehTriagem = sessao.meta.cenarioId === 'triagem-engenharia-social'
  const ehIncidenteMassivo = sessao.meta.cenarioId === 'incidente-massivo'
  const minutoAtual = sessao.meta.minutoSimulado

  async function consultarPolitica() {
    await onAcao('seguranca.consultar_politica')
    onAbrirKb?.('KB-001')
  }

  return (
    <section className="itsm" aria-label="Sistema ITSM">
      <section className="itsm-fila" aria-label="Fila de chamados">
        <h2>
          Fila de chamados <span className="muted">({sessao.chamados.length})</span>
        </h2>
        <div className="tabela-rolagem">
          <table className="tabela-dados fila-chamados">
            <caption className="sr-only">Chamados da sessão. Use o botão da chave para abrir o detalhe.</caption>
            <thead>
              <tr>
                <th scope="col">Chave</th>
                <th scope="col">Resumo</th>
                <th scope="col">Prioridade</th>
                <th scope="col">SLA</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessao.chamados.map((c) => {
                const ativo = c.id === chamado?.id
                return (
                  <tr key={c.id} aria-selected={ativo} data-ativo={ativo}>
                    <td data-rotulo="Chave">
                      <button
                        type="button"
                        className={`ticket-item ${ativo ? 'active' : ''}`}
                        aria-current={ativo ? 'true' : undefined}
                        onClick={() => setSelecionadoId(c.id)}
                      >
                        {c.id}
                      </button>
                    </td>
                    <td data-rotulo="Resumo">
                      <span className="fila-titulo">{c.titulo}</span>
                      <span className="fila-solicitante">{c.solicitante}</span>
                    </td>
                    <td data-rotulo="Prioridade" className="dado-mono">
                      {c.prioridade ?? 'Sem prioridade'}
                    </td>
                    <td data-rotulo="SLA">
                      <SlaMeter
                        abertoEmMinuto={c.abertoEmMinuto}
                        alvoMinuto={c.slaAlvoMinuto}
                        minutoAtual={minutoAtual}
                        vencido={c.slaVencido}
                        encerrado={chamadoEncerrado(c)}
                      />
                    </td>
                    <td data-rotulo="Status">
                      <EstadoChamado status={c.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="itsm-detalhe" aria-label="Detalhes do chamado">
        {!chamado ? (
          <p>Nenhum chamado selecionado.</p>
        ) : (
          <>
            <header className="itsm-detalhe-topo">
              <h2>
                <Icone nome="chamado" tamanho={20} />
                <span>
                  {chamado.id}: {chamado.titulo}
                </span>
              </h2>
              <EstadoChamado status={chamado.status} />
            </header>
            <dl className="itsm-dados">
              <div>
                <dt>Solicitante</dt>
                <dd>{chamado.solicitante}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{chamado.categoria ?? 'Não classificado'}</dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd className="dado-mono">{chamado.prioridade ?? 'Não definida'}</dd>
              </div>
              <div>
                <dt>SLA</dt>
                <dd>
                  <SlaMeter
                    abertoEmMinuto={chamado.abertoEmMinuto}
                    alvoMinuto={chamado.slaAlvoMinuto}
                    minutoAtual={minutoAtual}
                    vencido={chamado.slaVencido}
                    encerrado={chamadoEncerrado(chamado)}
                  />
                </dd>
              </div>
            </dl>
            <p className="ticket-desc">{chamado.descricao}</p>

            {chamado.status === 'Novo' && (
              <div className="actions-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={ocupado}
                  onClick={() => onAcao('itsm.assumir_chamado', { chamadoId: chamado.id })}
                >
                  {T.assumirChamado}
                </button>
              </div>
            )}

            {ehTriagem && (
              <div className="itsm-bloco">
                <h3>Ações de segurança</h3>
                <ol className="itsm-checklist">
                  <li>Consulte a política KB-001 antes de agir.</li>
                  <li>Peça o token corporativo e confirme a identidade de quem pede.</li>
                  <li>Registre a evidência em uma nota interna.</li>
                  <li>Decida o que fazer com o pedido de reset e resolva o chamado com uma nota pública.</li>
                </ol>
                <div className="actions-bar">
                  <button type="button" className="btn-neutro" disabled={ocupado} onClick={consultarPolitica}>
                    {T.consultarPolitica}
                  </button>
                  <button type="button" className="btn-neutro" disabled={ocupado} onClick={() => onAcao('seguranca.solicitar_token')}>
                    {T.solicitarToken}
                  </button>
                  <button type="button" className="btn-neutro" disabled={ocupado} onClick={() => onAcao('seguranca.recusar_reset')}>
                    {T.recusarReset}
                  </button>
                  <button type="button" className="btn-neutro" disabled={ocupado} onClick={() => onAcao('seguranca.resetar_senha')}>
                    {T.resetarSenha}
                  </button>
                </div>
              </div>
            )}

            {!ehTriagem && chamado.status !== 'Resolvido' && chamado.status !== 'Encerrado' && (
              <div className="itsm-bloco">
                <h3>Classificação e SLA</h3>
                <div className="form-grid">
                  <label>
                    Categoria
                    <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
                  </label>
                  <label>
                    Urgência
                    <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
                      <option value="Baixa">Baixa</option>
                      <option value="Media">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Critica">Crítica</option>
                    </select>
                  </label>
                  <label>
                    Impacto
                    <select value={impacto} onChange={(e) => setImpacto(e.target.value)}>
                      <option value="Baixo">Baixo</option>
                      <option value="Medio">Médio</option>
                      <option value="Alto">Alto</option>
                      <option value="Generalizado">Generalizado</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className="btn-neutro"
                  disabled={ocupado}
                  onClick={() =>
                    onAcao('itsm.classificar_chamado', {
                      chamadoId: chamado.id,
                      categoria,
                      urgencia,
                      impacto,
                    })
                  }
                >
                  {T.salvarClassificacao}
                </button>
              </div>
            )}

            {chamado.status !== 'Encerrado' && (
              <div className="itsm-bloco">
                <h3>Notas e escalonamento</h3>
                <div className="form-row">
                  <select
                    aria-label="Tipo da nota"
                    value={notaTipo}
                    onChange={(e) => setNotaTipo(e.target.value as 'Interna' | 'Publica')}
                  >
                    <option value="Interna">{T.notaInterna}</option>
                    <option value="Publica">{T.respostaPublica}</option>
                  </select>
                  <input
                    aria-label="Texto da nota"
                    aria-describedby="itsm-nota-dica"
                    placeholder="Registre evidências ou andamento..."
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-neutro"
                    disabled={ocupado || !notaTexto.trim()}
                    onClick={async () => {
                      await onAcao('itsm.adicionar_nota', {
                        chamadoId: chamado.id,
                        tipo: notaTipo,
                        texto: notaTexto,
                      })
                      setNotaTexto('')
                    }}
                  >
                    {notaTipo === 'Interna' ? T.registrarNotaInterna : T.enviarRespostaPublica}
                  </button>
                </div>
                <p id="itsm-nota-dica" className="muted itsm-dica">
                  {notaTipo === 'Interna'
                    ? 'Nota interna: só a equipe de TI vê. Use para evidências e decisões.'
                    : 'Resposta pública: o solicitante vê. Use para informar andamento e solução.'}
                </p>

                {chamado.status === 'EmAtendimento' && (
                  <button
                    type="button"
                    className="btn-neutro"
                    disabled={ocupado}
                    onClick={() =>
                      onAcao('itsm.escalonar_chamado', {
                        chamadoId: chamado.id,
                        destino: 'N2',
                        notaInterna: notaTexto.trim() || 'Escalonado para N2 com evidencias do diagnostico.',
                      })
                    }
                  >
                    Escalonar para N2
                  </button>
                )}
              </div>
            )}

            {(chamado.status === 'EmAtendimento' || chamado.status === 'Escalonado') && (
              <div className="itsm-bloco">
                <h3>{ehTriagem ? 'Encerrar a recusa' : 'Resolução'}</h3>
                <div className="form-row">
                  <input
                    aria-label={T.notaResolucao}
                    placeholder={
                      ehTriagem
                        ? 'Ex.: Solicitação recusada conforme política KB-001 (sem validação).'
                        : 'Descreva a solução aplicada (nota pública obrigatória)...'
                    }
                    value={notaResolucao}
                    onChange={(e) => setNotaResolucao(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={ocupado || !notaResolucao.trim()}
                    onClick={async () => {
                      await onAcao('itsm.resolver_chamado', {
                        chamadoId: chamado.id,
                        notaPublica: notaResolucao,
                      })
                      setNotaResolucao('')
                    }}
                  >
                    {T.resolverChamado}
                  </button>
                </div>
              </div>
            )}

            <div className="itsm-bloco">
              <h3>Histórico de notas ({chamado.notas.length})</h3>
              {chamado.notas.length === 0 ? (
                <p className="muted">Nenhuma nota registrada ainda.</p>
              ) : (
                <ol className="itsm-notas">
                  {chamado.notas.map((n) => {
                    const publica = n.tipo === 'Publica'
                    return (
                      <li key={n.seq} className="itsm-nota" data-tipo={publica ? 'publica' : 'interna'}>
                        <div className="itsm-nota-cabecalho">
                          <strong className="itsm-nota-tipo">{publica ? T.respostaPublica : T.notaInterna}</strong>
                          <span className="dado-mono">minuto {n.minutoSimulado}</span>
                          <span>{n.autor}</span>
                        </div>
                        <p>{n.texto}</p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            {ehIncidenteMassivo && (
              <div className="itsm-bloco">
                <h3>Gestão de problema ITIL ({sessao.problemas.length})</h3>
                {sessao.problemas.length === 0 ? (
                  <div className="form-row">
                    <input
                      aria-label="Título do problema"
                      value={tituloProblema}
                      onChange={(e) => setTituloProblema(e.target.value)}
                    />
                    <button type="button" className="btn-primary" disabled={ocupado} onClick={() => onAcao('itsm.criar_problema', { titulo: tituloProblema })}>
                      {T.criarProblema}
                    </button>
                  </div>
                ) : (
                  sessao.problemas.map((p) => (
                    <div key={p.id} className="form-stack">
                      <p>
                        <strong className="dado-mono">{p.id}</strong>: {p.titulo}. Vinculados:{' '}
                        <strong>{p.chamadosVinculados.length}/3</strong>
                      </p>
                      <div className="actions-bar">
                        {sessao.chamados.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            className="btn-neutro btn-sm"
                            disabled={ocupado || p.chamadosVinculados.includes(ch.id)}
                            onClick={() => onAcao('itsm.vincular_problema', { problemaId: p.id, chamadoId: ch.id })}
                          >
                            {p.chamadosVinculados.includes(ch.id) ? `${ch.id} vinculado` : `Vincular ${ch.id}`}
                          </button>
                        ))}
                      </div>
                      <div className="form-row">
                        <input
                          placeholder="Causa raiz (componente afetado e o que provocou a falha)"
                          value={causaRaiz}
                          onChange={(e) => setCausaRaiz(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-neutro"
                          disabled={ocupado || !causaRaiz.trim()}
                          onClick={() => onAcao('itsm.registrar_causa_raiz', { problemaId: p.id, causaRaiz })}
                        >
                          {T.registrarCausaRaiz}
                        </button>
                      </div>
                      {!p.resolvido && (
                        <input
                          aria-label="Nota pública da resolução em lote"
                          placeholder={NOTA_LOTE_PADRAO}
                          value={notaLote}
                          onChange={(e) => setNotaLote(e.target.value)}
                        />
                      )}
                      {!p.resolvido && (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={ocupado}
                          onClick={() =>
                            onAcao('itsm.resolver_problema', {
                              problemaId: p.id,
                              notaPublica: notaLote.trim() || NOTA_LOTE_PADRAO,
                            })
                          }
                        >
                          {T.resolverLote}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  )
}
