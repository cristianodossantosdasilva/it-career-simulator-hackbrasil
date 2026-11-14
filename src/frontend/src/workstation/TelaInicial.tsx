import { useState } from 'react'

interface Props {
  onIniciar: (cenarioId: string, semente?: number) => Promise<void>
  ocupado: boolean
  erro: string | null
}

const NIVEIS = [
  {
    id: 'triagem-engenharia-social',
    cargo: 'Nivel 1 — Estagiario',
    titulo: 'Triagem, Atendimento & Engenharia Social',
    desc: 'Atendimento inicial, politica de verificacao de identidade e defesa contra tentativa de fraude VIP.',
  },
  {
    id: 'pasta-rede-inacessivel',
    cargo: 'Nivel 2 — Analista Jr (N1)',
    titulo: 'Pasta de Rede Inacessivel (Chaos Injector)',
    desc: '3 causas raiz sorteadas por semente (Grupo AD, DNS ou Servico parado) com terminal e ITSM.',
  },
  {
    id: 'incidente-massivo',
    cargo: 'Nivel 3 — Analista Pleno (N2)',
    titulo: 'Incidente Massivo & Problema ITIL',
    desc: 'Correlacao de multiplos chamados apos patch, leitura de logs e registro de causa raiz.',
  },
]

export function TelaInicial({ onIniciar, ocupado, erro }: Props) {
  const [cenario, setCenario] = useState('pasta-rede-inacessivel')
  const [semente, setSemente] = useState('')

  return (
    <main className="start-screen">
      <div className="start-card">
        <span className="badge badge-ok">Hack Brasil 2026 · Acesso a Educacao · Time CVE-K</span>
        <h1>IT Flight Simulator</h1>
        <p className="lead">
          Simulador pratico de carreira em TI: assuma o turno na <strong>Aurora Logistica</strong>,
          investigue falhas reais no SimuDesk, atenda clientes simulados e gere seu{' '}
          <strong>Curriculo Vivo</strong> auditavel. Sem login obrigatorio.
        </p>

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
              <span className="badge">{n.cargo}</span>
              <h3>{n.titulo}</h3>
              <p>{n.desc}</p>
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
          <button
            type="button"
            className="btn-primary btn-lg"
            disabled={ocupado}
            onClick={() => onIniciar(cenario, semente ? Number(semente) : undefined)}
          >
            {ocupado ? 'Iniciando turno...' : 'Iniciar Simulacao'}
          </button>
        </div>
      </div>
    </main>
  )
}
