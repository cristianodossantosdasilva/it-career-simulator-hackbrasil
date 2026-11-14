import { useEffect, useState } from 'react'
import type { CarreiraResumoResponse } from '../api/types'
import { verificarCurriculoVivoJson, type ResultadoVerificacaoCurriculo } from '../utils/jcs'

interface Props {
  onIniciar: (cenarioId: string, semente?: number, causaForcada?: string) => Promise<void>
  ocupado: boolean
  erro: string | null
  resumoCarreira?: CarreiraResumoResponse | null
  apelido?: string
  onApelidoChange?: (valor: string) => void
  onAtualizarCarreira?: (apelido?: string) => void
}

const NIVEIS = [
  {
    id: 'triagem-engenharia-social',
    cargo: 'Nivel 1 · Estagiario',
    titulo: 'Triagem & Defesa contra Engenharia Social',
    desc: 'Atenda um pedido urgente da "Diretoria" sem token. Consulte a politica, documente no ITSM e proteja a empresa.',
    competencias: 'Seguranca · Politica KB · Triagem',
  },
  {
    id: 'pasta-rede-inacessivel',
    cargo: 'Nivel 2 · Analista Jr (N1)',
    titulo: 'Pasta de Rede Inacessivel (Chaos Injector)',
    desc: '3 causas raiz sorteadas por semente (Grupo AD, DNS ou Servico parado). Valide identidade, conecte no SimuDesk e resolva.',
    competencias: 'AD · DNS · Servicos · SimuDesk',
  },
  {
    id: 'incidente-massivo',
    cargo: 'Nivel 3 · Analista Pleno (N2)',
    titulo: 'Incidente Massivo & Problema ITIL',
    desc: '3 chamados simultaneos apos atualizacao. Crie um Problema, investigue logs, restaure o AuroraGateway e resolva em lote.',
    competencias: 'ITIL Problem · RCA · Logs',
  },
  {
    id: 'sre-cloud-latencia',
    cargo: 'Nivel 4 (V2) · SRE / Cloud',
    titulo: 'Incidente Cloud & Kubernetes (Chaos)',
    desc: '3 causas raiz simuladas (OOMKilled, Pool Postgres ou TLS expirado). Investigue pods/logs no SimuDesk e mitigue sem acao destrutiva.',
    competencias: 'Kubernetes · Observabilidade · SRE',
  },
  {
    id: 'diagnostico-sql-readonly',
    cargo: 'Nivel 4b (V2) · SQL Read-Only',
    titulo: 'Auditoria SQL Somente Leitura',
    desc: 'Investigue divergencia de faturamento no dataset sintetico via SELECT/EXPLAIN. Escrita e SQL injection sao bloqueados.',
    competencias: 'SQL Analitico · Auditoria · Seguranca',
  },
]

export function TelaInicial({
  onIniciar,
  ocupado,
  erro,
  resumoCarreira,
  apelido = '',
  onApelidoChange,
  onAtualizarCarreira,
}: Props) {
  const [cenario, setCenario] = useState('pasta-rede-inacessivel')
  const [semente, setSemente] = useState('')
  const [mostrarVerificador, setMostrarVerificador] = useState(false)
  const [jsonVerificar, setJsonVerificar] = useState('')
  const [resultadoVerif, setResultadoVerif] = useState<ResultadoVerificacaoCurriculo | null>(null)
  const [avisoColdStart, setAvisoColdStart] = useState(false)

  useEffect(() => {
    if (!ocupado) return
    const timer = window.setTimeout(() => setAvisoColdStart(true), 2000)
    return () => {
      window.clearTimeout(timer)
      setAvisoColdStart(false)
    }
  }, [ocupado])

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

  return (
    <main className="start-screen">
      <div className="start-card">
        <div className="hero-header">
          <div>
            <span className="badge badge-info">Hack Brasil 2026 · Acesso a Educacao · Time CVE-K</span>
          </div>
          <h1 className="hero-title">IT Flight Simulator</h1>
          <p className="lead">
            Simulador de voo para carreiras em TI. Assuma seu turno na <strong>Aurora Logistica</strong>,
            opere o ITSM, atenda clientes simulados, investigue falhas reais no SimuDesk e gere seu{' '}
            <strong>Curriculo Vivo</strong> auditavel por SHA-256.
          </p>
        </div>

        {ocupado && avisoColdStart && (
          <div className="banner-notice" role="status">
            Acordando servidor na nuvem (Render Free) — a primeira chamada apos inatividade pode levar ate 40 segundos.
          </div>
        )}

        {erro && (
          <div className="alert-danger" role="alert">
            {erro}
          </div>
        )}

        <div className="levels-grid" role="radiogroup" aria-label="Escolha o nivel da simulacao">
          {NIVEIS.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`level-card ${cenario === n.id ? 'selected' : ''}`}
              onClick={() => setCenario(n.id)}
            >
              <span className="badge badge-ok">{n.cargo}</span>
              <h2>{n.titulo}</h2>
              <p>{n.desc}</p>
              <span className="muted" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                {n.competencias}
              </span>
            </button>
          ))}
        </div>

        <div className="start-footer">
          <label>
            Semente (opcional, para reproduzir causa)
            <input
              type="number"
              placeholder="Aleatoria"
              value={semente}
              onChange={(e) => setSemente(e.target.value)}
            />
          </label>
          <div className="actions-bar">
            <button
              type="button"
              className="btn-secondary"
              disabled={ocupado}
              onClick={() => onIniciar('pasta-rede-inacessivel', 42, 'C1')}
            >
              Demo Rapida (Nivel 2 · C1)
            </button>
            <button
              type="button"
              className="btn-primary btn-lg"
              disabled={ocupado}
              onClick={() => onIniciar(cenario, semente ? Number(semente) : undefined)}
            >
              {ocupado ? 'Preparando Workstation...' : 'Decolar no Simulador →'}
            </button>
          </div>
        </div>

        {resumoCarreira && (
          <section className="panel" aria-label="Progressao de Carreira e Curriculo Vivo" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <strong>Sua Jornada:</strong> {resumoCarreira.cargoAtual} ·{' '}
                <span className="badge badge-info">{resumoCarreira.xpTotal} XP</span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span className={`badge ${resumoCarreira.promocoes.nivel1Concluido ? 'badge-ok' : ''}`}>
                  N1 {resumoCarreira.promocoes.nivel1Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel2Concluido ? 'badge-ok' : ''}`}>
                  N2 {resumoCarreira.promocoes.nivel2Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel3Concluido ? 'badge-ok' : ''}`}>
                  N3 {resumoCarreira.promocoes.nivel3Concluido ? 'OK' : 'Pendente'}
                </span>
              </div>
            </div>

            {resumoCarreira.sessoesNaoConfirmadas.length > 0 && (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                {resumoCarreira.sessoesNaoConfirmadas.length} sessao(oes) marcada(s) como nao confirmada (expirada ou ausente; sem XP).
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <label style={{ flex: '1 1 200px' }}>
                Apelido no Curriculo Vivo (opcional)
                <input
                  type="text"
                  placeholder="Ex.: Maria Silva"
                  value={apelido}
                  onChange={(e) => onApelidoChange?.(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onAtualizarCarreira?.(apelido)}
              >
                Atualizar Resumo
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={exportarCurriculoVivo}
              >
                Exportar Curriculo Vivo (JSON)
              </button>
            </div>

            <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              Integridade ({resumoCarreira.integridade.algoritmo}): <code>{resumoCarreira.integridade.hash}</code> —{' '}
              {resumoCarreira.integridade.regraHash} (Nota: valida a integridade do conteudo exportado; nao constitui certificado oficial nem prova autoria.)
            </p>
          </section>
        )}

        <section className="panel" aria-label="Verificador local de Curriculo Vivo" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>
              <strong>Verificador de Integridade (Offline):</strong> valide um arquivo <code>curriculo-vivo-itfs.json</code> localmente no navegador.
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMostrarVerificador((v) => !v)}
            >
              {mostrarVerificador ? 'Ocultar Verificador' : 'Verificar Curriculo Vivo'}
            </button>
          </div>

          {mostrarVerificador && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label>
                Cole o JSON do Curriculo Vivo ou selecione o arquivo .json
                <textarea
                  rows={4}
                  placeholder='{"cargoAtual": "...", "xpTotal": 0, ...}'
                  value={jsonVerificar}
                  onChange={(e) => void executarVerificacao(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-elevated)', color: '#f1f5f9', border: '1px solid var(--border-bright)' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept=".json,application/json"
                  aria-label="Selecionar arquivo JSON do Curriculo Vivo"
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
                  className={
                    resultadoVerif.status === 'integro'
                      ? 'badge badge-ok'
                      : resultadoVerif.status === 'divergente'
                        ? 'alert-danger'
                        : 'banner-notice'
                  }
                  style={{ padding: '0.6rem 0.8rem', borderRadius: '8px' }}
                >
                  <strong>
                    {resultadoVerif.status === 'integro'
                      ? 'INTEGRO'
                      : resultadoVerif.status === 'divergente'
                        ? 'DIVERGENTE'
                        : 'NAO VERIFICAVEL'}
                    :
                  </strong>{' '}
                  {resultadoVerif.motivo}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
