import { useRef, useState } from 'react'
import type { SessaoProjecao } from '../../api/types'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { semAcessoRemoto, servicoExterno } from '../../lab/estadoDoCenario'
import { Icone } from '../../ui/Icone'

const T = TEXTOS_WORKSTATION.simudesk

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

type EstadoVisual = 'neutro' | 'ativo' | 'atencao' | 'perigo' | 'ok'

function Estado({ estado, children }: { estado: EstadoVisual; children: React.ReactNode }) {
  return (
    <span className="estado" data-estado={estado}>
      {children}
    </span>
  )
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

function descreverAmbiente(cenarioId: string): string {
  switch (cenarioId) {
    case 'sre-cloud-latencia':
      return 'Cluster Kubernetes do serviço de pedidos'
    case 'diagnostico-sql-readonly':
      return 'Console SQL do banco de pedidos, somente leitura'
    case 'incidente-massivo':
      return 'Estação Windows do financeiro, com serviços internos e acesso a fornecedores'
    case 'reset-senha-desbloqueio':
      return 'Console do diretório da Aurora, com contas e ramais'
    case 'falha-backup-restore':
      return 'Servidor de backup do Financeiro, com repositório e job diário'
    default:
      return 'Estação Windows corporativa'
  }
}

function descreverConsole(cenarioId: string): { rotulo: string; host: string } {
  switch (cenarioId) {
    case 'reset-senha-desbloqueio':
      return { rotulo: T.consoleDiretorio, host: 'dc.aurora.local' }
    case 'falha-backup-restore':
      return { rotulo: T.consoleBackup, host: 'bkp-repo.aurora.local' }
    default:
      return { rotulo: T.estacaoRemota, host: 'EST-FIN-042' }
  }
}
/**
 * Argumento que o botão de comando já preenche. Só o que o chamado ou o próprio comando mostram: a pessoa
 * do chamado e o host do diagnóstico. Nada que indique a Causa ou a ação corretiva.
 */
function comandoSugerido(cenarioId: string, cmd: string): string {
  if (cmd === 'nslookup' || cmd === 'ping') return `${cmd} fileserver.aurora.local`
  if (cenarioId === 'reset-senha-desbloqueio' && cmd !== 'discar') return `${cmd} fernanda.lima`
  return cmd
}
function placeholderDoTerminal(cenarioId: string): string {
  switch (cenarioId) {
    case 'sre-cloud-latencia':
      return 'Ex: kubectl get pods, kubectl logs...'
    case 'diagnostico-sql-readonly':
      return 'Ex: SELECT * FROM pedidos LIMIT 10'
    case 'reset-senha-desbloqueio':
      return 'Ex: diretorio, net user...'
    case 'falha-backup-restore':
      return 'Ex: backup status, backup log...'
    default:
      return 'Ex: whoami /groups, nslookup...'
  }
}
function SrePainelCluster({ cluster, elevado, ocupado, onAcao }: { cluster: ClusterState; elevado: boolean; ocupado: boolean; onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void> }) {
  const poolCritico = cluster.pgbouncerPool.ativas > 90 || cluster.pgbouncerPool.espera > 20
  const tlsCritico = !cluster.ingressTls.valido
  return (
    <>
      <div className="painel-bloco sre-cluster-panel" role="region" aria-label="Painel de Cluster Kubernetes">
        <h3>Cluster / Pods</h3>
        <div className="pods-grid" role="list" aria-label="Lista de pods">
          {cluster.pods.map((pod) => (
            <div key={pod.nome} className="pod-card" data-erro={pod.status !== 'Running'} role="listitem" aria-label={`Pod ${pod.nome}, status ${pod.status}`}>
              <div className="pod-header">
                <code className="pod-name">{pod.nome}</code>
                <Estado estado={pod.status === 'Running' ? 'ok' : 'perigo'}>{pod.status}</Estado>
              </div>
              <div className="pod-meta">
                <span>Ready: {pod.ready}</span>
                <span>Restarts: {pod.restarts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="painel-bloco" role="region" aria-label="Pool PgBouncer">
        <h3>PgBouncer Pool</h3>
        <div className="pool-meter" role="meter" aria-valuenow={cluster.pgbouncerPool.ativas} aria-valuemin={0} aria-valuemax={cluster.pgbouncerPool.limite} aria-label="Conexões ativas">
          <div className="pool-bar" data-critico={poolCritico} style={{ width: `${(cluster.pgbouncerPool.ativas / cluster.pgbouncerPool.limite) * 100}%` }} />
        </div>
        <div className="pool-stats">
          <span className={poolCritico ? 'text-danger' : ''}>Ativas: <strong>{cluster.pgbouncerPool.ativas}</strong>/{cluster.pgbouncerPool.limite}</span>
          <span className={cluster.pgbouncerPool.espera > 10 ? 'text-warn' : ''}>Aguardando: <strong>{cluster.pgbouncerPool.espera}</strong></span>
        </div>
        {poolCritico && <p className="alert-inline" role="alert">Pool sob pressão. Considere escalar ou investigar queries longas.</p>}
      </div>

      <div className="painel-bloco" role="region" aria-label="Ingress TLS">
        <h3>Ingress TLS</h3>
        <div className="row-between">
          <span>Certificado: <Estado estado={tlsCritico ? 'perigo' : 'ok'}>{tlsCritico ? 'Expirado' : 'Válido'}</Estado></span>
          <span>Expira: <code>{cluster.ingressTls.expira}</code></span>
        </div>
        {tlsCritico && <p className="alert-inline" role="alert">Certificado expirado. Renove antes de investigar outras causas.</p>}
      </div>

      <div className="painel-bloco sre-actions" role="region" aria-label={T.regiaoSreMitigacao}>
        <h3>
          Ações de mitigação {!elevado && <span className="simudesk-aviso">(exige privilégio elevado)</span>}
        </h3>
        <div className="actions-bar">
          <button type="button" className="btn-neutro" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Reiniciar pod com OOM" onClick={() => onAcao('sre.restart_pod', { pod: 'api-pedidos-7f8b6' })}>
            Reiniciar pod OOM
          </button>
          <button type="button" className="btn-neutro" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Escalar pool PgBouncer" onClick={() => onAcao('sre.scale_pool', { novoLimite: 150 })}>
            Escalar pool (+50)
          </button>
          <button type="button" className="btn-neutro" disabled={ocupado || !elevado} aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined} aria-label="Renovar certificado TLS" onClick={() => onAcao('sre.renew_cert', {})}>
            Renovar cert TLS
          </button>
        </div>
      </div>
    </>
  )
}

function SqlPainelSchema({ schema }: { schema: TableSchema[] }) {
  return (
    <>
      <div className="painel-bloco sql-readonly-banner" role="region" aria-label="Modo somente leitura">
        <div className="row-between">
          <h3>Console SQL</h3>
          <Estado estado="ativo">Somente leitura (SELECT)</Estado>
        </div>
        <p className="muted">Use SELECT e EXPLAIN para investigar. Comandos INSERT, UPDATE e DELETE estão bloqueados.</p>
      </div>

      <div className="painel-bloco sql-schema-panel" role="region" aria-label={T.regiaoSchema}>
        <h3>Schema e dataset sintético</h3>
        {schema.map((tabela) => (
          <div key={tabela.nome} className="table-schema" role="article" aria-label={`Tabela ${tabela.nome}`}>
            <div className="table-header">
              <code className="table-name">{tabela.nome}</code>
              <span className="muted">{tabela.registros} registros</span>
            </div>
            <ul className="columns-list" role="list" aria-label={`Colunas da tabela ${tabela.nome}`}>
              {tabela.colunas.map((col) => (
                <li key={col.nome} className="column-item" role="listitem">
                  <code>{col.nome}</code>
                  <span className="col-type">{col.tipo}</span>
                  {col.pk && <span className="coluna-chave">PK</span>}
                  {col.fk && <span className="coluna-chave" title={`Referencia ${col.fk}`}>FK para {col.fk}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="painel-bloco" role="region" aria-label="Consultas sugeridas">
        <h3>Consultas sugeridas</h3>
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
  const [conectadoPeloAluno, setConectado] = useState(false)
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
  const cenarioId = sessao.meta.cenarioId
  // Sem acesso remoto (reset-senha-desbloqueio), o console do diretório já abre conectado.
  const conectado = conectadoPeloAluno || semAcessoRemoto(cenarioId)
  const alvo = descreverConsole(cenarioId)
  const externo = servicoExterno(sessao)
  // Nenhum comando do console do diretório exige prompt elevado.
  const exigeElevacao = cenarioId !== 'reset-senha-desbloqueio'
  // O botão de grupo só faz sentido para a pasta do Financeiro; reset e backup não usam grupos.
  const oferecePastaFinanceiro = cenarioId !== 'reset-senha-desbloqueio' && cenarioId !== 'falha-backup-restore'
  const isSreCenario = cenarioId === 'sre-cloud-latencia'
  const isSqlCenario = cenarioId === 'diagnostico-sql-readonly'

  if (!conectado) {
    const liberado = sessao.dialogo.acessoRemotoLiberado
    return (
      <section className="panel simudesk-conexao" aria-label="Conexão SimuDesk">
        <h2>
          <Icone nome="remoto" tamanho={20} />
          <span>SimuDesk: acesso remoto corporativo</span>
        </h2>
        <p className="muted simudesk-dica">
          {liberado
            ? `Credenciais liberadas: ID ${sessao.dialogo.idAcessoRemoto}, PIN ${sessao.dialogo.pinAcessoRemoto}.`
            : 'Valide a identidade da usuária no Comunicador (chat) para obter o ID e o PIN.'}
        </p>
        <p className="muted simudesk-dica">
          O ID da estação e o PIN aparecem no Comunicador, na verificação de identidade, depois que matrícula e ramal são confirmados.
        </p>
        <form
          className="form-stack simudesk-form"
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
            ID da estação
            <input autoComplete="off" placeholder={T.placeholderId} value={idInput} onChange={(e) => { setIdInput(e.target.value); setErroCredenciais(false) }} />
          </label>
          <label>
            PIN
            <input autoComplete="off" inputMode="numeric" placeholder={T.placeholderPin} value={pinInput} onChange={(e) => { setPinInput(e.target.value); setErroCredenciais(false) }} />
          </label>
          {erroCredenciais && <p role="alert" className="simudesk-erro">{T.idInvalido}</p>}
          <div className="actions-bar">
            <button type="submit" className="btn-primary" disabled={!liberado}>
              {T.conectar}
            </button>
            {liberado && (
              <button
                type="button"
                className="btn-neutro"
                onClick={() => {
                  setIdInput(sessao.dialogo.idAcessoRemoto ?? '')
                  setPinInput(sessao.dialogo.pinAcessoRemoto ?? '')
                  setConectado(true)
                }}
              >
                {T.preencherConectar}
              </button>
            )}
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="panel simudesk" aria-label={`${alvo.rotulo} ${alvo.host}`}>
      <header className="simudesk-topo">
        <div className="simudesk-host">
          <h2>
            <Icone nome="remoto" tamanho={20} />
            <span>
              {alvo.rotulo} <span className="dado-mono">{alvo.host}</span>
            </span>
          </h2>
          <dl className="simudesk-meta">
            <div>
              <dt>Ambiente</dt>
              <dd>{descreverAmbiente(cenarioId)}</dd>
            </div>
            <div>
              <dt>Conexão</dt>
              <dd>
                <Estado estado="ok">Conectado</Estado>
              </dd>
            </div>
            <div>
              <dt>Contexto</dt>
              <dd>
                <div role="status" className="simudesk-estados">
                  <Estado estado={elevado ? 'atencao' : 'neutro'}>
                    Contexto: {elevado ? 'prompt elevado (admin)' : T.usuarioPadrao}
                  </Estado>
                  {cenarioId === 'reset-senha-desbloqueio' ? (
                    <Estado estado={sessao.estacao.compartilhamentoAcessivel ? 'ok' : 'perigo'}>
                      {T.acessoDaConta(sessao.estacao.compartilhamentoAcessivel)}
                    </Estado>
                  ) : cenarioId === 'falha-backup-restore' ? (
                    <Estado estado={sessao.estacao.compartilhamentoAcessivel ? 'ok' : 'perigo'}>
                      {T.backupFinanceiro(sessao.estacao.compartilhamentoAcessivel)}
                    </Estado>
                  ) : cenarioId === 'incidente-massivo' && externo ? (
                    <Estado estado={externo.status === 'Restabelecido' ? 'ok' : 'perigo'}>
                      {externo.nome}: {externo.status}
                    </Estado>
                  ) : cenarioId === 'incidente-massivo' ? (
                    <Estado
                      estado={sessao.estacao.servicos.some((s) => s.nome === 'AuroraGateway' && s.status === 'Running') ? 'ok' : 'perigo'}
                    >
                      AuroraGateway: {sessao.estacao.servicos.find((s) => s.nome === 'AuroraGateway')?.status ?? 'Stopped'}
                    </Estado>
                  ) : isSreCenario ? (
                    <Estado estado={sessao.estacao.compartilhamentoAcessivel ? 'ok' : 'perigo'}>
                      Cluster Cloud: {sessao.estacao.compartilhamentoAcessivel ? 'Healthy' : 'Degraded'}
                    </Estado>
                  ) : isSqlCenario ? (
                    <Estado estado="ativo">SQL Console: somente leitura (SELECT)</Estado>
                  ) : cenarioId !== 'triagem-engenharia-social' ? (
                    <Estado estado={sessao.estacao.compartilhamentoAcessivel ? 'ok' : 'perigo'}>
                      {T.pastaFinanceiro(sessao.estacao.compartilhamentoAcessivel)}
                    </Estado>
                  ) : null}
                </div>
              </dd>
            </div>
          </dl>
          {!elevado && exigeElevacao && (
            <span id="simudesk-requer-admin" className="simudesk-aviso">
              {T.requerPromptElevado}
            </span>
          )}
        </div>
        <div className="actions-bar simudesk-acoes">
          {exigeElevacao && (
            <button
              type="button"
              className="btn-neutro"
              disabled={ocupado}
              onClick={() => onAcao(elevado ? 'estacao.reduzir_privilegio' : 'estacao.elevar_privilegio')}
            >
              {elevado ? 'Voltar para usuário padrão' : T.elevarPrivilegio}
            </button>
          )}
          <button type="button" aria-pressed={subAba === 'terminal'} className={subAba === 'terminal' ? 'btn-primary' : ''} onClick={() => setSubAba('terminal')}>
            {T.terminal}
          </button>
          <button type="button" aria-pressed={subAba === 'paineis'} className={subAba === 'paineis' ? 'btn-primary' : ''} onClick={() => setSubAba('paineis')}>
            {T.painelAdmin}
          </button>
        </div>
      </header>

      {subAba === 'terminal' ? (
        <div className="terminal-shell" data-superficie="terminal">
          <div className="terminal-header">
            <span className="dado-mono">simudesk@{alvo.host} ({elevado ? 'admin elevado' : 'usuário'})</span>
            <button type="button" className="btn-comando" disabled={ocupado} onClick={() => onAcao('estacao.ler_logs')}>
              {T.lerLogs}
            </button>
          </div>
          {isSreCenario && (
            <div className="terminal-barra" role="toolbar" aria-label={T.comandosSre}>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('kubectl get pods -n pedidos')}>kubectl get pods</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('kubectl logs api-pedidos-7f8b6 --tail=50')}>kubectl logs</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('kubectl describe ingress pedidos-ingress')}>kubectl describe ingress</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('curl -I https://api.pedidos.aurora.local/health')}>curl -I (health)</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('psql -c "SELECT * FROM pg_stat_activity WHERE state != \'idle\'"')}>pg_stat_activity</button>
            </div>
          )}
          {isSqlCenario && (
            <div className="terminal-barra" role="toolbar" aria-label={T.consultasSql}>
              <span className="terminal-rotulo">Somente leitura</span>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('SELECT COUNT(*) FROM pedidos')}>SELECT COUNT pedidos</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('SELECT SUM(valor) FROM pagamentos')}>SUM pagamentos</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('EXPLAIN SELECT p.id, pg.valor FROM pedidos p JOIN pagamentos pg ON p.id = pg.pedido_id')}>EXPLAIN JOIN</button>
              <button type="button" className="btn-comando" onClick={() => sugerirComando('SELECT id, total FROM pedidos WHERE status = \'processado\' LIMIT 10')}>pedidos processados</button>
            </div>
          )}
          <div className="terminal-barra" role="toolbar" aria-label={T.comandosSugeridos}>
            {sessao.estacao.comandosSuportados.map((cmd) => (
              <button
                key={cmd}
                type="button"
                className="btn-comando"
                onClick={() => sugerirComando(comandoSugerido(cenarioId, cmd))}
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="terminal-output" role="log" aria-live="polite" aria-label="Saída do terminal" tabIndex={0}>
            {historicoTerminal.length === 0 ? (
              <div className="muted">Digite um comando suportado para investigar a estação.</div>
            ) : (
              historicoTerminal.map((item, idx) => (
                <div key={idx} className="term-entry">
                  <div>
                    <span className="term-prompt">[{item.priv}]{'>'}</span> <code>{item.cmd}</code>
                  </div>
                  <pre>{item.saida}</pre>
                </div>
              ))
            )}
          </div>

          <form
            className="terminal-form"
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
              aria-describedby="terminal-dica"
              placeholder={placeholderDoTerminal(cenarioId)}
              value={comando}
              onChange={(e) => setComando(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={ocupado || !comando.trim()}>
              Executar
            </button>
          </form>
          <p id="terminal-dica" className="terminal-dica">
            Este terminal simula só os comandos sugeridos acima. Qualquer outro comando recebe a resposta de que não é suportado e não altera a estação.
          </p>
        </div>
      ) : (
        <div className="panels-grid">
          {isSreCenario && <SrePainelCluster cluster={getClusterState(sessao)} elevado={elevado} ocupado={ocupado} onAcao={onAcao} />}
          {isSqlCenario && <SqlPainelSchema schema={getSchemaDataset()} />}

          <div className="painel-bloco" role="region" aria-label={T.regiaoDiretorio}>
            <h3>Diretório e grupos</h3>
            {Object.entries(sessao.estacao.gruposPorUsuario).map(([u, grupos]) => (
              <div key={u} className="kv-row">
                <strong>{u}:</strong> <span>{grupos.join(', ')}</span>
              </div>
            ))}
            {oferecePastaFinanceiro && (
              <button
                type="button"
                className="btn-neutro"
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
            )}
            {Object.values(sessao.estacao.gruposPorUsuario).every((grupos) => grupos.length === 0) && <p className="muted">{T.semGrupos}</p>}
          </div>

          <div className="painel-bloco" role="region" aria-label="Serviços da estação">
            <h3>Serviços da estação</h3>
            {sessao.estacao.servicos.map((s) => (
              <div key={s.nome} className="row-between">
                <span>
                  {s.nome}: <strong>{s.status}</strong>
                </span>
                {s.status === 'Stopped' && (
                  <button
                    type="button"
                    className="btn-neutro"
                    disabled={ocupado || !elevado}
                    aria-describedby={!elevado ? 'simudesk-requer-admin' : undefined}
                    aria-label={`Iniciar serviço ${s.nome}`}
                    onClick={() => onAcao('estacao.reiniciar_servico', { servico: s.nome })}
                  >
                    Iniciar
                  </button>
                )}
              </div>
            ))}
            {sessao.estacao.servicos.length === 0 && <p className="muted">{T.semServicos}</p>}
          </div>

          <div className="painel-bloco" role="region" aria-label="DNS somente leitura">
            <h3>DNS (somente leitura no N1)</h3>
            {Object.values(sessao.estacao.dnsServidor).map((d) => (
              <div key={d.host}>
                <code>{d.host}</code> aponta para <strong className="dado-mono">{d.ip}</strong>
              </div>
            ))}
            {Object.keys(sessao.estacao.dnsServidor).length === 0 && <p className="muted">{T.semDns}</p>}
          </div>

          <div className="painel-bloco" role="region" aria-label="Logs da estação">
            <h3>Logs da estação</h3>
            <ul className="notes-list">
              {sessao.estacao.logs.map((l, i) => (
                <li key={i}>
                  <code>{l}</code>
                </li>
              ))}
            </ul>
            {sessao.estacao.logs.length === 0 && <p className="muted">{`${T.semLogs} Use "${T.lerLogs}" no terminal.`}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
