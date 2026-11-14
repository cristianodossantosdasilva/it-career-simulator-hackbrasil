import { useState } from 'react'
import type { SessaoProjecao } from '../../api/types'

interface Props {
  sessao: SessaoProjecao
  historicoTerminal: { cmd: string; saida: string; priv: string }[]
  onComando: (comando: string) => Promise<void>
  onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  ocupado: boolean
}

export function SimuDeskApp({ sessao, historicoTerminal, onComando, onAcao, ocupado }: Props) {
  const [conectado, setConectado] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [comando, setComando] = useState('')
  const [subAba, setSubAba] = useState<'terminal' | 'paineis'>('terminal')

  const elevado = sessao.estacao.privilegio === 'Elevado'

  if (!conectado) {
    return (
      <section className="panel" aria-label="Conexao SimuDesk">
        <h2>SimuDesk — Acesso Remoto Corporativo</h2>
        <p className="muted">
          {sessao.dialogo.acessoRemotoLiberado
            ? `Credenciais liberadas: ID ${sessao.dialogo.idAcessoRemoto} | PIN ${sessao.dialogo.pinAcessoRemoto}`
            : 'Valide a identidade da usuaria no Comunicador (Chat) para obter o ID e PIN.'}
        </p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (
              sessao.dialogo.acessoRemotoLiberado &&
              idInput.trim() === sessao.dialogo.idAcessoRemoto &&
              pinInput.trim() === sessao.dialogo.pinAcessoRemoto
            ) {
              setConectado(true)
            }
          }}
        >
          <label>
            ID da Estacao
            <input placeholder="NNN NNN NNN" value={idInput} onChange={(e) => setIdInput(e.target.value)} />
          </label>
          <label>
            PIN
            <input placeholder="4 digitos" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
          </label>
          <div className="actions-bar">
            <button type="submit" className="btn-primary" disabled={!sessao.dialogo.acessoRemotoLiberado}>
              Conectar na Estacao
            </button>
            {sessao.dialogo.acessoRemotoLiberado && (
              <button
                type="button"
                onClick={() => {
                  setIdInput(sessao.dialogo.idAcessoRemoto ?? '')
                  setPinInput(sessao.dialogo.pinAcessoRemoto ?? '')
                  setConectado(true)
                }}
              >
                Preencher e Conectar
              </button>
            )}
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="panel" aria-label="Estacao remota EST-FIN-042">
      <div className="row-between">
        <div>
          <h2>Estacao Remota — EST-FIN-042</h2>
          <span className={`badge ${elevado ? 'badge-warn' : ''}`}>
            Contexto: {elevado ? 'Prompt Elevado (Admin)' : 'Usuario Padrao'}
          </span>{' '}
          <span className={`badge ${sessao.estacao.compartilhamentoAcessivel ? 'badge-ok' : 'badge-err'}`}>
            Pasta Financeiro: {sessao.estacao.compartilhamentoAcessivel ? 'Acessivel' : 'Inacessivel'}
          </span>
        </div>
        <div className="actions-bar">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onAcao(elevado ? 'estacao.reduzir_privilegio' : 'estacao.elevar_privilegio')}
          >
            {elevado ? 'Voltar p/ Usuario Padrao' : 'Elevar Privilegio'}
          </button>
          <button type="button" className={subAba === 'terminal' ? 'btn-primary' : ''} onClick={() => setSubAba('terminal')}>
            Terminal
          </button>
          <button type="button" className={subAba === 'paineis' ? 'btn-primary' : ''} onClick={() => setSubAba('paineis')}>
            Paineis Admin
          </button>
        </div>
      </div>

      {subAba === 'terminal' ? (
        <div className="terminal-box">
          <div className="chips-row" aria-label="Comandos sugeridos">
            {sessao.estacao.comandosSuportados.map((cmd) => (
              <button
                key={cmd}
                type="button"
                className="chip"
                onClick={() => setComando(cmd === 'nslookup' || cmd === 'ping' ? `${cmd} fileserver.aurora.local` : cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="terminal-output" role="log" aria-live="polite">
            {historicoTerminal.length === 0 ? (
              <div className="muted">Digite um comando suportado para investigar a estacao.</div>
            ) : (
              historicoTerminal.map((item, idx) => (
                <div key={idx} className="term-entry">
                  <div>
                    <span className="term-prompt">[{item.priv}]&gt;</span> <code>{item.cmd}</code>
                  </div>
                  <pre>{item.saida}</pre>
                </div>
              ))
            )}
          </div>

          <form
            className="form-row"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!comando.trim()) return
              const cmd = comando
              setComando('')
              await onComando(cmd)
            }}
          >
            <input
              aria-label="Comando do terminal"
              placeholder="Ex: whoami /groups, nslookup fileserver.aurora.local, net start..."
              value={comando}
              onChange={(e) => setComando(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={ocupado || !comando.trim()}>
              Executar
            </button>
          </form>
        </div>
      ) : (
        <div className="panels-grid">
          <div className="card-section">
            <h3>Diretorio &amp; Grupos</h3>
            {Object.entries(sessao.estacao.gruposPorUsuario).map(([u, grupos]) => (
              <div key={u} className="kv-row">
                <strong>{u}:</strong> <span>{grupos.join(', ')}</span>
              </div>
            ))}
            <button
              type="button"
              disabled={ocupado || !elevado}
              onClick={() =>
                onAcao('estacao.adicionar_usuario_grupo', {
                  usuario: 'maria.souza',
                  grupo: 'GRP_FINANCEIRO_PASTA',
                })
              }
            >
              Adicionar maria.souza em GRP_FINANCEIRO_PASTA
            </button>
          </div>

          <div className="card-section">
            <h3>Servicos da Estacao</h3>
            {sessao.estacao.servicos.map((s) => (
              <div key={s.nome} className="row-between">
                <span>
                  {s.nome}: <strong>{s.status}</strong>
                </span>
                {s.status !== 'Running' && (
                  <button
                    type="button"
                    disabled={ocupado || !elevado}
                    onClick={() => onAcao('estacao.reiniciar_servico', { servico: s.nome })}
                  >
                    Iniciar
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="card-section">
            <h3>DNS (Somente Leitura N1)</h3>
            {Object.values(sessao.estacao.dnsServidor).map((d) => (
              <div key={d.host}>
                <code>{d.host}</code> → <strong>{d.ip}</strong>
              </div>
            ))}
          </div>

          <div className="card-section">
            <h3>Logs da Estacao</h3>
            <ul className="notes-list">
              {sessao.estacao.logs.map((l, i) => (
                <li key={i}>
                  <code>{l}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
