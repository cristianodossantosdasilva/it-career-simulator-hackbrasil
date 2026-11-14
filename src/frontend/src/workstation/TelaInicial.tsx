import { useState } from 'react'

interface Props {
  onIniciar: (cenarioId: string, semente?: number, causaForcada?: string) => Promise<void>
  ocupado: boolean
  erro: string | null
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

export function TelaInicial({ onIniciar, ocupado, erro }: Props) {
  const [cenario, setCenario] = useState('pasta-rede-inacessivel')
  const [semente, setSemente] = useState('')

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
              <h3>{n.titulo}</h3>
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
              Demo Rapida (N1 · C1)
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
      </div>
    </main>
  )
}
