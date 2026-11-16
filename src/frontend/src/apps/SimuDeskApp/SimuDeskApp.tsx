import { useRef, useState } from 'react'
import type { SessaoProjecao } from '../../api/types'

interface Props {
  sessao: SessaoProjecao
  historicoTerminal: { cmd: string; saida: string; priv: string }[]
  onComando: (comando: string) => Promise<void>
  onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  ocupado: boolean
}

interface PodInfo {
  nome: string
  status: 'Running' | 'CrashLoopBackOff' | 'OOMKilled' | 'Pending'
  restarts: number
  ready: string
}

interface ClusterState {
  pods: PodInfo[]
  pgbouncerPool: { ativas: number; espera: number; limite: number }
  ingressTls: { valido: boolean; expira: string }
}

interface SchemaColumn {
  nome: string
  tipo: string
  pk?: boolean
  fk?: string
}

interface TableSchema {
  nome: string
  colunas: SchemaColumn[]
  registros: number
}

function getClusterState(sessao: SessaoProjecao): ClusterState {
  const healthy = sessao.estacao.compartilhamentoAcessivel
  return {
    pods: [
      { nome: 'api-pedidos-7f8b6', status: healthy ? 'Running' : 'OOMKilled', restarts: healthy ? 0 : 3, ready: healthy ? '1/1' : '0/1' },
      { nome: 'api-pedidos-9c2d1', status: 'Running', restarts: 0, ready: '1/1' },
      { nome: 'pgbouncer-pool-0', status: healthy ? 'Running' : 'CrashLoopBackOff', restarts: healthy ? 0 : 5, ready: healthy ? '1/1' : '0/1' },
      { nome: 'ingress-tls-proxy', status: 'Running', restarts: 0, ready: '1/1' },
    ],
    pgbouncerPool: { ativas: healthy ? 45 : 98, espera: healthy ? 2 : 47, limite: 100 },
    ingressTls: { valido: healthy, expira: healthy ? '2027-03-15' : '2026-11-10' },
  }
}

function getSchemaDataset(): TableSchema[] {
  return [
    {
      nome: 'pedidos',
      colunas: [
        { nome: 'id', tipo: 'INT', pk: true },
        { nome: 'cliente_id', tipo: 'INT', fk: 'clientes.id' },
        { nome: 'total', tipo: 'DECIMAL(10,2)' },
        { nome: 'status', tipo: 'VARCHAR(20)' },
        { nome: 'criado_em', tipo: 'TIMESTAMP' },
      ],
      registros: 1247,
    },
    {
      nome: 'pagamentos',
      colunas: [
        { nome: 'id', tipo: 'INT', pk: true },
        { nome: 'pedido_id', tipo: 'INT', fk: 'pedidos.id' },
        { nome: 'valor', tipo: 'DECIMAL(10,2)' },
        { nome: 'metodo', tipo: 'VARCHAR(20)' },
        { nome: 'processado_em', tipo: 'TIMESTAMP' },
      ],
      registros: 1389,
    },
  ]
}

function SrePainelCluster({ cluster, elevado, ocupado, onAcao }: { cluster: ClusterState; elevado: boolean; ocupado: boolean; onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void> }) {
  const poolCritico = cluster.pgbouncerPool.ativas > 90 || cluster.pgbouncerPool.espera > 20
  const tlsCritico = !cluster.ingressTls.valido
  return (
    <>
      <div className="card-section sre-cluster-panel" role="region" aria-label="Painel de Cluster Kubernetes">
        <h3>Cluster / Pods</h3>
        <div className="pods-grid" role="list" aria-label="Lista de pods">
          {cluster.pods.map((pod) => (
            <div key={pod.nome} className={`pod-card ${pod.status !== 'Running' ? 'pod-error' : ''}`} role="listitem" aria-label={`Pod ${pod.nome}, status ${pod.status}`}>
              <div className="pod-header">
                <code className="pod-name">{pod.nome}</code>
                <span className={`badge ${pod.status === 'Running' ? 'badge-ok' : 'badge-err'}`}>{pod.status}</span>
              </div>
              <div className="pod-meta">
                <span>Ready: {pod.ready}</span>
                <span>Restarts: {pod.restarts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-section" role="region" aria-label="Pool PgBouncer">
        <h3>PgBouncer Pool</h3>
        <div className="pool-meter" role="meter" aria-valuenow={cluster.pgbouncerPool.ativas} aria-valuemin={0} aria-valuemax={cluster.pgbouncerPool.limite} aria-label="Conexoes ativas">
          <div className="pool-bar" style={{ width: `${(cluster.pgbouncerPool.ativas / cluster.pgbouncerPool.limite) * 100}%` }} />
        </div>
        <div className="pool-stats">
          <span className={poolCritico ? 'text-danger' : ''}>Ativas: <strong>{cluster.pgbouncerPool.ativas}</strong>/{cluster.pgbouncerPool.limite}</span>
          <span className={cluster.pgbouncerPool.espera > 10 ? 'text-warn' : ''}>Aguardando: <strong>{cluster.pgbouncerPool.espera}</strong></span>
        </div>
        {poolCritico && <p className="alert-inline" role="alert">Pool sob pressao. Considere escalar ou investigar queries longas.</p>}
      </div>

      <div className="card-section" role="region" aria-label="Ingress TLS">
        <h3>Ingress TLS</h3>
        <div className="row-between">
          <span>Certificado: <span className={`badge ${tlsCritico ? 'badge-err' : 'badge-ok'}`}>{tlsCritico ? 'Expirado' : 'Valido'}</span></span>
          <span>Expira: <code>{cluster.ingressTls.expira}</code></span>
        </div>
        {tlsCritico && <p className="alert-inline" role="alert">Certificado expirado. Renove antes de investigar outras causas.</p>}
      </div>

      <div className="card-section sre-actions" role="region" aria-label="Acoes de mitigacao SRE">
        <h3>Acoes de Mitigacao {!elevado && <span className="badge badge-warn">Requer Admin</span>}</h3>
        <div className="actions-bar">
          <button type="button" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Reiniciar pod com OOM" onClick={() => onAcao('sre.restart_pod', { pod: 'api-pedidos-7f8b6' })}>
            Reiniciar Pod OOM
          </button>
          <button type="button" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Escalar pool PgBouncer" onClick={() => onAcao('sre.scale_pool', { novoLimite: 150 })}>
            Escalar Pool (+50)
          </button>
          <button type="button" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Renovar certificado TLS" onClick={() => onAcao('sre.renew_cert', {})}>
            Renovar Cert TLS
          </button>
        </div>
      </div>
    </>
  )
}

function SqlPainelSchema({ schema }: { schema: TableSchema[] }) {
  return (
    <>
      <div className="card-section sql-readonly-banner" role="region" aria-label="Modo somente leitura">
        <div className="row-between">
          <h3>Console SQL</h3>
          <span className="badge badge-info">Somente Leitura (SELECT)</span>
        </div>
        <p className="muted">Use SELECT e EXPLAIN para investigar. Comandos INSERT, UPDATE e DELETE estao bloqueados.</p>
      </div>

      <div className="card-section sql-schema-panel" role="region" aria-label="Schema do Dataset Sintetico">
        <h3>Schema e Dataset Sintético</h3>
        {schema.map((tabela) => (
          <div key={tabela.nome} className="table-schema" role="article" aria-label={`Tabela ${tabela.nome}`}>
            <div className="table-header">
              <code className="table-name">{tabela.nome}</code>
              <span className="badge">{tabela.registros} registros</span>
            </div>
            <ul className="columns-list" role="list" aria-label={`Colunas da tabela ${tabela.nome}`}>
              {tabela.colunas.map((col) => (
                <li key={col.nome} className="column-item" role="listitem">
                  <code>{col.nome}</code>
                  <span className="col-type">{col.tipo}</span>
                  {col.pk && <span className="badge badge-ok">PK</span>}
                  {col.fk && <span className="badge badge-info" title={`Referencia ${col.fk}`}>FK → {col.fk}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card-section" role="region" aria-label="Consultas sugeridas">
        <h3>Consultas Sugeridas</h3>
        <ul className="query-suggestions" role="list">
          <li role="listitem"><code>SELECT p.id, p.total, SUM(pg.valor) as pago FROM pedidos p LEFT JOIN pagamentos pg ON p.id = pg.pedido_id GROUP BY p.id, p.total</code></li>
          <li role="listitem"><code>SELECT id, total FROM pedidos WHERE id NOT IN (SELECT DISTINCT pedido_id FROM pagamentos)</code></li>
          <li role="listitem"><code>EXPLAIN ANALYZE SELECT * FROM pedidos WHERE criado_em {'>'} '2026-11-01'</code></li>
        </ul>
      </div>
    </>
  )
}

export function SimuDeskApp({ sessao, historicoTerminal, onComando, onAcao, ocupado }: Props) {
  const [conectado, setConectado] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [comando, setComando] = useState('')
  const [subAba, setSubAba] = useState<'terminal' | 'paineis'>('terminal')
  const [erroCredenciais, setErroCredenciais] = useState(false)
  const comandoInputRef = useRef<HTMLInputElement>(null)
  const sugerirComando = (valor: string) => {
    setComando(valor)
    comandoInputRef.current?.focus()
  }

  const elevado = sessao.estacao.privilegio === 'Elevado'
  const isSreCenario = sessao.meta.cenarioId === 'sre-cloud-latencia'
  const isSqlCenario = sessao.meta.cenarioId === 'diagnostico-sql-readonly'

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
              setErroCredenciais(false)
            } else {
              setErroCredenciais(true)
            }
          }}
        >
          <label>
            ID da Estacao
            <input autoComplete="off" placeholder="NNN NNN NNN" value={idInput} onChange={(e) => { setIdInput(e.target.value); setErroCredenciais(false) }} />
          </label>
          <label>
            PIN
            <input autoComplete="off" inputMode="numeric" placeholder="4 digitos" value={pinInput} onChange={(e) => { setPinInput(e.target.value); setErroCredenciais(false) }} />
          </label>
          {erroCredenciais && <p role="alert">ID ou PIN invalido.</p>}
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
          <div role="status"><span className={`badge ${elevado ? 'badge-warn' : ''}`}>
            Contexto: {elevado ? 'Prompt Elevado (Admin)' : 'Usuario Padrao'}
          </span>{' '}
          {sessao.meta.cenarioId === 'incidente-massivo' ? (
            <span
              className={`badge ${
                sessao.estacao.servicos.some((s) => s.nome === 'AuroraGateway' && s.status === 'Running')
                  ? 'badge-ok'
                  : 'badge-err'
              }`}
            >
              AuroraGateway:{' '}
              {sessao.estacao.servicos.find((s) => s.nome === 'AuroraGateway')?.status ?? 'Stopped'}
            </span>
          ) : sessao.meta.cenarioId === 'sre-cloud-latencia' ? (
            <span className={`badge ${sessao.estacao.compartilhamentoAcessivel ? 'badge-ok' : 'badge-err'}`}>
              Cluster Cloud: {sessao.estacao.compartilhamentoAcessivel ? 'Healthy' : 'Degraded'}
            </span>
          ) : sessao.meta.cenarioId === 'diagnostico-sql-readonly' ? (
            <span className="badge badge-info">SQL Console: Somente Leitura (SELECT)</span>
          ) : sessao.meta.cenarioId !== 'triagem-engenharia-social' ? (
            <span className={`badge ${sessao.estacao.compartilhamentoAcessivel ? 'badge-ok' : 'badge-err'}`}>
              Pasta Financeiro: {sessao.estacao.compartilhamentoAcessivel ? 'Acessivel' : 'Inacessivel'}
            </span>
          ) : null}</div>
          {!elevado && <span id="simudesk-requer-admin">Requer Prompt Elevado</span>}
        </div>
        <div className="actions-bar">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onAcao(elevado ? 'estacao.reduzir_privilegio' : 'estacao.elevar_privilegio')}
          >
            {elevado ? 'Voltar p/ Usuario Padrao' : 'Elevar Privilegio'}
          </button>
          <button type="button" aria-pressed={subAba === 'terminal'} className={subAba === 'terminal' ? 'btn-primary' : ''} onClick={() => setSubAba('terminal')}>
            Terminal
          </button>
          <button type="button" aria-pressed={subAba === 'paineis'} className={subAba === 'paineis' ? 'btn-primary' : ''} onClick={() => setSubAba('paineis')}>
            Paineis Admin
          </button>
        </div>
      </div>

      {subAba === 'terminal' ? (
        <div className="terminal-shell">
          <div className="terminal-header">
            <span>simudesk@EST-FIN-042 ({elevado ? 'ADMIN ELEVADO' : 'usuario'})</span>
            <button type="button" className="chip" disabled={ocupado} onClick={() => onAcao('estacao.ler_logs')}>
              Ler Logs da Estacao
            </button>
          </div>
          {isSreCenario && (
            <div className="chips-row sre-commands" style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border)' }} role="toolbar" aria-label="Comandos de diagnostico SRE">
              <button type="button" className="chip chip-sre" onClick={() => sugerirComando('kubectl get pods -n pedidos')}>kubectl get pods</button>
              <button type="button" className="chip chip-sre" onClick={() => sugerirComando('kubectl logs api-pedidos-7f8b6 --tail=50')}>kubectl logs</button>
              <button type="button" className="chip chip-sre" onClick={() => sugerirComando('kubectl describe ingress pedidos-ingress')}>kubectl describe ingress</button>
              <button type="button" className="chip chip-sre" onClick={() => sugerirComando('curl -I https://api.pedidos.aurora.local/health')}>curl -I (health)</button>
              <button type="button" className="chip chip-sre" onClick={() => sugerirComando('psql -c "SELECT * FROM pg_stat_activity WHERE state != \'idle\'"')}>pg_stat_activity</button>
            </div>
          )}
          {isSqlCenario && (
            <div className="chips-row sql-commands" style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border)' }} role="toolbar" aria-label="Consultas SQL somente leitura">
              <span className="badge badge-info" style={{ marginRight: '0.5rem' }}>Somente Leitura</span>
              <button type="button" className="chip chip-sql" onClick={() => sugerirComando('SELECT COUNT(*) FROM pedidos')}>SELECT COUNT pedidos</button>
              <button type="button" className="chip chip-sql" onClick={() => sugerirComando('SELECT SUM(valor) FROM pagamentos')}>SUM pagamentos</button>
              <button type="button" className="chip chip-sql" onClick={() => sugerirComando('EXPLAIN SELECT p.id, pg.valor FROM pedidos p JOIN pagamentos pg ON p.id = pg.pedido_id')}>EXPLAIN JOIN</button>
              <button type="button" className="chip chip-sql" onClick={() => sugerirComando('SELECT id, total FROM pedidos WHERE status = \'processado\' LIMIT 10')}>pedidos processados</button>
            </div>
          )}
          <div className="chips-row" style={{ padding: '0 0.85rem' }} role="toolbar" aria-label="Comandos sugeridos">
            {sessao.estacao.comandosSuportados.map((cmd) => (
              <button
                key={cmd}
                type="button"
                className="chip"
                onClick={() => sugerirComando(cmd === 'nslookup' || cmd === 'ping' ? `${cmd} fileserver.aurora.local` : cmd)}
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
            style={{ padding: '0 0.85rem 0.85rem' }}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!comando.trim()) return
              const cmd = comando
              setComando('')
              await onComando(cmd)
            }}
          >
            <input
              ref={comandoInputRef}
              aria-label="Comando do terminal"
              placeholder={isSreCenario ? 'Ex: kubectl get pods, kubectl logs...' : isSqlCenario ? 'Ex: SELECT * FROM pedidos LIMIT 10' : 'Ex: whoami /groups, nslookup...'}
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
          {isSreCenario && <SrePainelCluster cluster={getClusterState(sessao)} elevado={elevado} ocupado={ocupado} onAcao={onAcao} />}
          {isSqlCenario && <SqlPainelSchema schema={getSchemaDataset()} />}

          <div className="card-section" role="region" aria-label="Diretorio e Grupos">
            <h3>Diretório e Grupos</h3>
            {Object.entries(sessao.estacao.gruposPorUsuario).map(([u, grupos]) => (
              <div key={u} className="kv-row">
                <strong>{u}:</strong> <span>{grupos.join(', ')}</span>
              </div>
            ))}
            <button
              type="button"
              disabled={ocupado || !elevado}
              aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined}
              aria-label="Adicionar maria.souza ao grupo GRP_FINANCEIRO_PASTA"
              onClick={() =>
                onAcao('estacao.adicionar_usuario_grupo', {
                  usuario: 'maria.souza',
                  grupo: 'GRP_FINANCEIRO_PASTA',
                })
              }
            >
              Adicionar maria.souza em GRP_FINANCEIRO_PASTA
            </button>
            {Object.values(sessao.estacao.gruposPorUsuario).every((grupos) => grupos.length === 0) && <p className="muted">Nenhum grupo carregado.</p>}
          </div>

          <div className="card-section" role="region" aria-label="Servicos da Estacao">
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
                    aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined}
                    aria-label={`Iniciar servico ${s.nome}`}
                    onClick={() => onAcao('estacao.reiniciar_servico', { servico: s.nome })}
                  >
                    Iniciar
                  </button>
                )}
              </div>
            ))}
            {sessao.estacao.servicos.length === 0 && <p className="muted">Nenhum servico carregado.</p>}
          </div>

          <div className="card-section" role="region" aria-label="DNS somente leitura">
            <h3>DNS (Somente Leitura N1)</h3>
            {Object.values(sessao.estacao.dnsServidor).map((d) => (
              <div key={d.host}>
                <code>{d.host}</code> → <strong>{d.ip}</strong>
              </div>
            ))}
            {Object.keys(sessao.estacao.dnsServidor).length === 0 && <p className="muted">Nenhum registro DNS carregado.</p>}
          </div>

          <div className="card-section" role="region" aria-label="Logs da estacao">
            <h3>Logs da Estacao</h3>
            <ul className="notes-list">
              {sessao.estacao.logs.map((l, i) => (
                <li key={i}>
                  <code>{l}</code>
                </li>
              ))}
            </ul>
            {sessao.estacao.logs.length === 0 && <p className="muted">Nenhum log carregado. Use 'Ler Logs da Estacao' no Terminal.</p>}
          </div>
        </div>
      )}
    </section>
  )
}
