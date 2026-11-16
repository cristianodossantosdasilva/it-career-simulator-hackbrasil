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
  tema?: 'light' | 'dark'
  onAlternarTema?: () => void
}

const NIVEIS = [
  {
    id: 'triagem-engenharia-social',
    cargo: 'Nível 1 · Estagiário',
    titulo: 'Triagem e Defesa contra Engenharia Social',
    desc: 'Atenda um pedido urgente de suposto diretor sem token. Consulte a política, registre nota interna e proteja a empresa.',
    competencias: 'Segurança · Política KB · Triagem ITSM',
  },
  {
    id: 'pasta-rede-inacessivel',
    cargo: 'Nível 2 · Analista Jr (N1)',
    titulo: 'Pasta de Rede Inacessível (Simulador de Causas)',
    desc: '3 causas sorteadas por semente (Grupo AD, DNS ou Serviço parado). Valide identidade, conecte no SimuDesk e resolva.',
    competencias: 'AD · DNS · Serviços · SimuDesk',
  },
  {
    id: 'incidente-massivo',
    cargo: 'Nível 3 · Analista Pleno (N2)',
    titulo: 'Incidente Massivo e Problema ITIL',
    desc: '3 chamados simultâneos após atualização. Crie um Problema ITIL, investigue logs, restaure o AuroraGateway e resolva em lote.',
    competencias: 'Problema ITIL · Causa Raiz · Logs',
  },
  {
    id: 'sre-cloud-latencia',
    cargo: 'Nível 4 (V2) · SRE e Cloud',
    titulo: 'Incidente Cloud e Kubernetes (Simulador)',
    desc: '3 causas raiz simuladas (OOMKilled, Pool Postgres ou TLS expirado). Investigue pods e logs no SimuDesk e mitigue com segurança.',
    competencias: 'Kubernetes · Observabilidade · SRE',
  },
  {
    id: 'diagnostico-sql-readonly',
    cargo: 'Nível 4b (V2) · SQL Read-Only',
    titulo: 'Auditoria SQL Somente Leitura',
    desc: 'Investigue divergência de faturamento no conjunto de dados sintético via SELECT e EXPLAIN. Escrita e injeção SQL são bloqueadas.',
    competencias: 'SQL Analítico · Auditoria · Segurança',
  },
]

const GLOSSARIO_INICIANTE = [
  { termo: 'ITSM (Fila de Chamados)', definicao: 'Sistema onde o técnico registra, prioriza (SLA) e documenta cada atendimento.' },
  { termo: 'SimuDesk (Acesso Remoto)', definicao: 'Ferramenta de acesso remoto corporativo que só libera conexão após validar matrícula e ramal do solicitante.' },
  { termo: 'KB (Base de Conhecimento)', definicao: 'Manual interno de procedimentos aprovados da Aurora Logística para agir com segurança.' },
  { termo: 'Caixa-Preta (Replay)', definicao: 'Gravação passo a passo da sua missão mostrando o que o Juiz 360º avaliou e por quê.' },
  { termo: 'Semente e Chaos Injector', definicao: 'Número opcional que sorteia qual defeito real aconteceu nos bastidores para evitar resposta decorada.' },
]

export function TelaInicial({
  onIniciar,
  ocupado,
  erro,
  resumoCarreira,
  apelido = '',
  onApelidoChange,
  onAtualizarCarreira,
  tema = 'light',
  onAlternarTema,
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
        <header className="hero-header">
          <div className="hero-top-row">
            <span className="badge badge-info">Hack Brasil 2026 · Acesso à Educação · Time CVE-K</span>
            {onAlternarTema && (
              <button
                type="button"
                className="btn-secondary"
                aria-label={tema === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
                onClick={onAlternarTema}
              >
                {tema === 'light' ? 'Tema Escuro' : 'Tema Claro Educacional'}
              </button>
            )}
          </div>
          <h1 className="hero-title">IT Flight Simulator</h1>
          <p className="lead">
            Simulador prático de voo para quem está começando do zero em suporte de TI. Assuma seu turno na empresa
            fictícia <strong>Aurora Logística</strong>, pratique com <strong>100% de dados sintéticos e sem login</strong>,
            aprenda pela <strong>Caixa-Preta do Atendimento (Replay)</strong> e gere seu <strong>Currículo Vivo</strong>{' '}
            com assinatura criptográfica <strong>ECDSA P-256</strong>.
          </p>
        </header>

        <section className="mission-zero-card" aria-label="Missão 0 para iniciantes">
          <h2>Missão 0 — Como funciona em 4 passos (nunca atuou em TI? Comece aqui)</h2>
          <div className="steps-grid">
            <div className="step-box">
              <strong>1. Leia o chamado no ITSM</strong>
              Clique em Assumir Chamado e confira quem pediu ajuda e qual é a urgência (SLA).
            </div>
            <div className="step-box">
              <strong>2. Valide identidade no Chat</strong>
              Antes de mexer no computador ou resetar senha, confirme matrícula e ramal com segurança.
            </div>
            <div className="step-box">
              <strong>3. Investigue antes de alterar</strong>
              Use o SimuDesk para observar pistas reais antes de trocar qualquer configuração.
            </div>
            <div className="step-box">
              <strong>4. Registre nota e veja a Caixa-Preta</strong>
              Documente o que fez em linguagem clara e abra o Replay para conferir acertos e melhorias.
            </div>
          </div>
        </section>

        {ocupado && avisoColdStart && (
          <div className="banner-notice" role="status">
            Acordando servidor da API na nuvem — a primeira chamada após inatividade pode levar alguns segundos.
          </div>
        )}

        {erro && (
          <div className="alert-danger" role="alert">
            {erro}
          </div>
        )}

        <div className="levels-grid" role="radiogroup" aria-label="Escolha o nível da simulação">
          {NIVEIS.map((n) => (
            <button
              key={n.id}
              type="button"
              role="radio"
              aria-checked={cenario === n.id}
              className={`level-card ${cenario === n.id ? 'selected' : ''}`}
              onClick={() => setCenario(n.id)}
            >
              <span className={`badge ${cenario === n.id ? 'badge-info' : ''}`}>{n.cargo}</span>
              <h2>{n.titulo}</h2>
              <p>{n.desc}</p>
              <span className="level-competencias">{n.competencias}</span>
            </button>
          ))}
        </div>

        <details className="glossary-details">
          <summary>Glossário rápido para iniciantes (ITSM, SimuDesk, KB, Caixa-Preta e Semente)</summary>
          <div className="glossary-grid">
            {GLOSSARIO_INICIANTE.map((item) => (
              <div key={item.termo} className="glossary-item">
                <strong>{item.termo}:</strong> {item.definicao}
              </div>
            ))}
          </div>
        </details>

        <div className="start-footer">
          <label className="field-stack">
            Semente (opção avançada para repetir causa)
            <input
              type="number"
              placeholder="Aleatória"
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
              Demo Rápida (Nível 2 · C1)
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
          <section className="panel" aria-label="Progressão de Carreira e Currículo Vivo">
            <div className="career-header">
              <div>
                <strong>Sua Jornada:</strong> {resumoCarreira.cargoAtual} ·{' '}
                <span className="badge badge-info">{resumoCarreira.xpTotal} XP</span>
              </div>
              <div className="career-badges">
                <span className={`badge ${resumoCarreira.promocoes.nivel1Concluido ? 'badge-ok' : ''}`}>
                  N1 {resumoCarreira.promocoes.nivel1Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel2Concluido ? 'badge-ok' : ''}`}>
                  N2 {resumoCarreira.promocoes.nivel2Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel3Concluido ? 'badge-ok' : ''}`}>
                  N3 {resumoCarreira.promocoes.nivel3Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel4Concluido ? 'badge-ok' : ''}`}>
                  N4 {resumoCarreira.promocoes.nivel4Concluido ? 'OK' : 'Pendente'}
                </span>
                <span className={`badge ${resumoCarreira.promocoes.nivel4bConcluido ? 'badge-ok' : ''}`}>
                  N4b {resumoCarreira.promocoes.nivel4bConcluido ? 'OK' : 'Pendente'}
                </span>
              </div>
            </div>

            {resumoCarreira.sessoesNaoConfirmadas.length > 0 && (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                {resumoCarreira.sessoesNaoConfirmadas.length} sessao(oes) marcada(s) como nao confirmada (expirada ou ausente; sem XP).
              </p>
            )}

            <div className="career-form">
              <label className="field-stack">
                Apelido no Currículo Vivo (opcional)
                <input
                  type="text"
                  placeholder="Ex.: Ana Paula"
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
                Exportar Currículo Vivo (JSON)
              </button>
            </div>

            <p className="integrity-note">
              Integridade ({resumoCarreira.integridade.algoritmo}): <code>{resumoCarreira.integridade.hash}</code>
              {resumoCarreira.integridade.algoritmoAssinatura && (
                <>
                  {' '}
                  · Assinatura ({resumoCarreira.integridade.algoritmoAssinatura} · chave{' '}
                  <code>{resumoCarreira.integridade.kid}</code>)
                </>
              )}{' '}
              — {resumoCarreira.integridade.regraHash}
            </p>
          </section>
        )}

        <section className="panel" aria-label="Verificador local de Currículo Vivo">
          <div className="verifier-header">
            <span>
              <strong>Verificador Offline de Autenticidade:</strong> valide integridade SHA-256 e assinatura ECDSA P-256 de um arquivo{' '}
              <code>curriculo-vivo-itfs.json</code> localmente no navegador.
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMostrarVerificador((v) => !v)}
            >
              {mostrarVerificador ? 'Ocultar Verificador' : 'Verificar Currículo Vivo'}
            </button>
          </div>

          {mostrarVerificador && (
            <div className="verifier-body">
              <label className="field-stack">
                Cole o JSON do Currículo Vivo ou selecione o arquivo .json
                <textarea
                  rows={4}
                  placeholder='{"cargoAtual": "...", "xpTotal": 0, ...}'
                  value={jsonVerificar}
                  onChange={(e) => void executarVerificacao(e.target.value)}
                  className="verifier-textarea"
                />
              </label>
              <div className="verifier-file">
                <input
                  type="file"
                  accept=".json,application/json"
                  aria-label="Selecionar arquivo JSON do Currículo Vivo"
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
                  className={`verifier-result ${resultadoVerif.status === 'integro' ? 'alert-success' : resultadoVerif.status === 'divergente' ? 'alert-danger' : 'banner-notice'}`}
                >
                  <strong>
                    {resultadoVerif.status === 'integro'
                      ? 'INTEGRO:'
                      : resultadoVerif.status === 'divergente'
                        ? 'DIVERGENTE:'
                        : 'NAO VERIFICAVEL:'}
                  </strong>{' '}
                  {resultadoVerif.motivo}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel" aria-label="Transparência do escopo do produto">
          <h2>Transparência do Escopo: MVP Hackathon vs. Roadmap do Curso Livre</h2>
          <div className="scope-grid">
            <div className="scope-card">
              <h3>Implementado Hoje nesta Demo (MVP Hackathon)</h3>
              <ul>
                <li>Workstation determinística com 5 cenários jogáveis e 3 causas sorteadas por semente.</li>
                <li>Fila ITSM, Comunicador roteirizado auditável, SimuDesk (Terminal, Diretório, Serviços, Logs, SRE e SQL Read-Only).</li>
                <li>Base de Conhecimento (26 artigos), Caixa-Preta Replay e Juiz 360º com assinatura ECDSA P-256.</li>
              </ul>
            </div>
            <div className="scope-card">
              <h3>Roadmap Pós-Hackathon (Ondas 1 a 4)</h3>
              <ul>
                <li>Trilha de aulas completas (estimativa 560h), revisão espaçada (Leitner/FSRS), Caderno Cornell e PBQs autorais.</li>
                <li>8 Laboratórios interativos dedicados (Hardware ESD, Multi-OS, Cabeamento e Wi-Fi RF, M365, Servidores, Firewall, Data Center e Blue Team).</li>
                <li>Chamada por voz e vídeo com personas de IA sob teto orçamentário e certificado de curso livre.</li>
              </ul>
            </div>
          </div>
          <p className="muted" style={{ marginTop: '0.65rem', marginBottom: 0 }}>
            <strong>Aviso de Dados e Natureza:</strong> Simulador educacional gratuito de demonstração em curso livre. Opera em sessão anônima sem login e utiliza apenas dados 100% sintéticos (empresa fictícia Aurora Logística). Não emite diploma técnico oficial nem certificação de terceiros.
          </p>
        </section>
      </div>
    </main>
  )
}
