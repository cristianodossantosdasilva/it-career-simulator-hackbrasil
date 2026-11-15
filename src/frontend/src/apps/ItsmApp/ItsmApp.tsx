import { useState } from 'react'
import type { ChamadoDto, SessaoProjecao } from '../../api/types'

interface Props {
  sessao: SessaoProjecao
  onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  ocupado: boolean
}

export function ItsmApp({ sessao, onAcao, ocupado }: Props) {
  const [selecionadoId, setSelecionadoId] = useState<string>(sessao.chamados[0]?.id ?? 'CH-0001')
  const [categoria, setCategoria] = useState('Acesso a Rede')
  const [urgencia, setUrgencia] = useState('Alta')
  const [impacto, setImpacto] = useState('Medio')
  const [notaTexto, setNotaTexto] = useState('')
  const [notaTipo, setNotaTipo] = useState<'Interna' | 'Publica'>('Interna')
  const [notaResolucao, setNotaResolucao] = useState('')
  const [tituloProblema, setTituloProblema] = useState('Queda ERP apos atualizacao')
  const [causaRaiz, setCausaRaiz] = useState('')

  const chamado: ChamadoDto | undefined =
    sessao.chamados.find((c) => c.id === selecionadoId) ?? sessao.chamados[0]
  const ehNivel1 = sessao.meta.cenarioId === 'triagem-engenharia-social'
  const ehNivel3 = sessao.meta.cenarioId === 'incidente-massivo'

  return (
    <div className="app-split" aria-label="Sistema ITSM">
      <section className="panel" aria-label="Fila de chamados">
        <h2>Fila ITSM ({sessao.chamados.length})</h2>
        <ul className="ticket-list">
          {sessao.chamados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`ticket-item ${c.id === chamado?.id ? 'active' : ''}`}
                onClick={() => setSelecionadoId(c.id)}
              >
                <div className="row-between">
                  <strong>{c.id}</strong>
                  <span className={`badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
                <div className="ticket-title">{c.titulo}</div>
                <div className="ticket-meta">
                  <span>{c.solicitante}</span>
                  <span>{c.prioridade ?? 'Sem P'}</span>
                  {c.slaAlvoMinuto !== null && (
                    <span className={c.slaVencido ? 'text-danger' : ''}>
                      SLA: {c.slaAlvoMinuto}m {c.slaVencido ? '(VENCIDO)' : ''}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-label="Detalhes do chamado">
        {!chamado ? (
          <p>Nenhum chamado selecionado.</p>
        ) : (
          <>
            <div className="row-between">
              <h2>
                {chamado.id} — {chamado.titulo}
              </h2>
              <span className="badge">{chamado.status}</span>
            </div>
            <p className="muted">
              Solicitante: <strong>{chamado.solicitante}</strong> | Categoria:{' '}
              <strong>{chamado.categoria ?? 'Nao classificado'}</strong> | Prioridade:{' '}
              <strong>{chamado.prioridade ?? '—'}</strong>
            </p>
            <p className="ticket-desc">{chamado.descricao}</p>

            {chamado.status === 'Novo' && (
              <div className="actions-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={ocupado}
                  onClick={() => onAcao('itsm.assumir_chamado', { chamadoId: chamado.id })}
                >
                  Assumir Chamado
                </button>
              </div>
            )}

            {ehNivel1 && (
              <div className="card-section">
                <h3>Acoes de Seguranca (Engenharia Social)</h3>
                <p className="muted">
                  Passo a passo: <strong>1)</strong> Assuma o chamado → <strong>2)</strong> Consulte a Politica KB-001 →{' '}
                  <strong>3)</strong> Solicite Token Corporativo → <strong>4)</strong> Registre Nota Interna →{' '}
                  <strong>5)</strong> Recuse o reset → <strong>6)</strong> Resolva o chamado com nota publica.
                </p>
                <div className="actions-bar">
                  <button type="button" disabled={ocupado} onClick={() => onAcao('seguranca.consultar_politica')}>
                    Consultar Politica KB-001
                  </button>
                  <button type="button" disabled={ocupado} onClick={() => onAcao('seguranca.solicitar_token')}>
                    Solicitar Token Corporativo
                  </button>
                  <button type="button" className="btn-success" disabled={ocupado} onClick={() => onAcao('seguranca.recusar_reset')}>
                    Recusar Reset sem Validacao
                  </button>
                  <button type="button" className="btn-danger" disabled={ocupado} onClick={() => onAcao('seguranca.resetar_senha')}>
                    Resetar Senha Agora (Risco)
                  </button>
                </div>
              </div>
            )}

            {!ehNivel1 && chamado.status !== 'Resolvido' && chamado.status !== 'Encerrado' && (
              <div className="card-section">
                <h3>Classificacao &amp; SLA</h3>
                <div className="form-grid">
                  <label>
                    Categoria
                    <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
                  </label>
                  <label>
                    Urgencia
                    <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
                      <option>Baixa</option>
                      <option>Media</option>
                      <option>Alta</option>
                      <option>Critica</option>
                    </select>
                  </label>
                  <label>
                    Impacto
                    <select value={impacto} onChange={(e) => setImpacto(e.target.value)}>
                      <option>Baixo</option>
                      <option>Medio</option>
                      <option>Alto</option>
                      <option>Generalizado</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
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
                  Salvar Classificacao
                </button>
              </div>
            )}

            {chamado.status !== 'Encerrado' && (
              <div className="card-section">
                <h3>Adicionar Nota / Escalonar</h3>
                <div className="form-row">
                  <select
                    aria-label="Tipo da nota"
                    value={notaTipo}
                    onChange={(e) => setNotaTipo(e.target.value as 'Interna' | 'Publica')}
                  >
                    <option value="Interna">Nota Interna</option>
                    <option value="Publica">Nota Publica</option>
                  </select>
                  <input
                    aria-label="Texto da nota"
                    placeholder="Registre evidencias ou andamento..."
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                  />
                  <button
                    type="button"
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
                    Registrar Nota
                  </button>
                </div>

                {chamado.status === 'EmAtendimento' && (
                  <button
                    type="button"
                    className="btn-secondary"
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
              <div className="card-section">
                <h3>{ehNivel1 ? 'Resolver Chamado (Encerrar Recusa)' : 'Resolver Chamado'}</h3>
                <div className="form-row">
                  <input
                    aria-label="Nota publica de resolucao"
                    placeholder={
                      ehNivel1
                        ? 'Ex.: Solicitacao recusada conforme politica KB-001 (sem validacao).'
                        : 'Descreva a solucao aplicada (nota publica obrigatoria)...'
                    }
                    value={notaResolucao}
                    onChange={(e) => setNotaResolucao(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-success"
                    disabled={ocupado || !notaResolucao.trim()}
                    onClick={async () => {
                      await onAcao('itsm.resolver_chamado', {
                        chamadoId: chamado.id,
                        notaPublica: notaResolucao,
                      })
                      setNotaResolucao('')
                    }}
                  >
                    Resolver Chamado
                  </button>
                </div>
              </div>
            )}

            <div className="card-section">
              <h3>Linha do Tempo de Notas ({chamado.notas.length})</h3>
              {chamado.notas.length === 0 ? (
                <p className="muted">Nenhuma nota registrada ainda.</p>
              ) : (
                <ul className="notes-list">
                  {chamado.notas.map((n) => (
                    <li key={n.seq}>
                      <span className="badge">{n.tipo}</span> <strong>{n.minutoSimulado}m</strong> — {n.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {ehNivel3 && (
              <div className="card-section">
                <h3>Gestao de Problema ITIL ({sessao.problemas.length})</h3>
                {sessao.problemas.length === 0 ? (
                  <div className="form-row">
                    <input value={tituloProblema} onChange={(e) => setTituloProblema(e.target.value)} />
                    <button type="button" className="btn-primary" disabled={ocupado} onClick={() => onAcao('itsm.criar_problema', { titulo: tituloProblema })}>
                      Criar Problema ITIL
                    </button>
                  </div>
                ) : (
                  sessao.problemas.map((p) => (
                    <div key={p.id} className="form-stack">
                      <p>
                        <strong>{p.id}</strong> — {p.titulo} | Vinculados: <strong>{p.chamadosVinculados.length}/3</strong>
                      </p>
                      <div className="actions-bar">
                        {sessao.chamados.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            className="chip"
                            disabled={ocupado || p.chamadosVinculados.includes(ch.id)}
                            onClick={() => onAcao('itsm.vincular_problema', { problemaId: p.id, chamadoId: ch.id })}
                          >
                            {p.chamadosVinculados.includes(ch.id) ? `${ch.id} vinculado` : `Vincular ${ch.id}`}
                          </button>
                        ))}
                      </div>
                      <div className="form-row">
                        <input
                          placeholder="Causa raiz (ex: AuroraGateway parou apos atualizacao)"
                          value={causaRaiz}
                          onChange={(e) => setCausaRaiz(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={ocupado || !causaRaiz.trim()}
                          onClick={() => onAcao('itsm.registrar_causa_raiz', { problemaId: p.id, causaRaiz })}
                        >
                          Registrar Causa Raiz
                        </button>
                      </div>
                      {!p.resolvido && (
                        <button
                          type="button"
                          className="btn-success"
                          disabled={ocupado}
                          onClick={() =>
                            onAcao('itsm.resolver_problema', {
                              problemaId: p.id,
                              notaPublica: 'Servico AuroraGateway restaurado e ERP normalizado.',
                            })
                          }
                        >
                          Resolver Todos em Lote
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
    </div>
  )
}
