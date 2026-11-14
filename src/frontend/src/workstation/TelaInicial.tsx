import { useState } from 'react'
import type { CarreiraResumoResponse } from '../api/types'

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
      </div>
    </main>
  )
}
