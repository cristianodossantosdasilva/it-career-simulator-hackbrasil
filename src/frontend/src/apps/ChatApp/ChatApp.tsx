import { useState } from 'react'
import type { SessaoProjecao } from '../../api/types'

interface Props {
  sessao: SessaoProjecao
  onChat: (persona: 'cliente' | 'techlead', mensagem: string) => Promise<void>
  onAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  ocupado: boolean
}

export function ChatApp({ sessao, onChat, onAcao, ocupado }: Props) {
  const [persona, setPersona] = useState<'cliente' | 'techlead'>('cliente')
  const [mensagem, setMensagem] = useState('')
  const [matricula, setMatricula] = useState('')
  const [ramal, setRamal] = useState('')
  const [tentouValidar, setTentouValidar] = useState(false)
  const cenario = sessao.meta.cenarioId
  const perguntasRapidas = cenario === 'sre-cloud-latencia'
    ? persona === 'cliente'
      ? ['Quando a lentidão começou?', 'O que acontece com os pedidos?', 'Há impacto para Operações?']
      : ['Como comparar pods e reinícios?', 'O que observar no pool e no TLS?', 'Como estruturar o post-mortem?']
    : cenario === 'diagnostico-sql-readonly'
      ? persona === 'cliente'
        ? ['Qual relatório diverge?', 'Há registros de auditoria?', 'Posso investigar em modo somente leitura?']
        : ['Como começar uma auditoria SELECT?', 'Como conferir a granularidade das chaves?', 'Como limitar o resultado?']
      : persona === 'cliente'
        ? ['Qual erro aparece?', 'Quando começou?', 'Pode informar matrícula e ramal?']
        : ['Que evidências devo coletar?', 'Como validar a identidade?', 'Quando devo escalar?']

  return (
    <div className="app-split" aria-label="Comunicador Corporativo">
      <section className="panel" aria-label="Conversa">
        <div className="row-between">
          <h2>Comunicador Corporativo</h2>
          <div className="actions-bar" aria-label="Selecionar contato">
            <button
              type="button"
              aria-pressed={persona === 'cliente'}
              className={persona === 'cliente' ? 'btn-primary' : ''}
              onClick={() => setPersona('cliente')}
            >
              Cliente (Maria)
            </button>
            <button
              type="button"
              aria-pressed={persona === 'techlead'}
              className={persona === 'techlead' ? 'btn-primary' : ''}
              onClick={() => setPersona('techlead')}
            >
              Tech Lead IA
            </button>
          </div>
        </div>

        <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Mensagens da conversa">
          {sessao.dialogo.mensagens.length === 0 ? (
            <p className="muted">
              Inicie o atendimento cumprimentando a usuária ou peça orientação ao Tech Lead.
            </p>
          ) : (
            sessao.dialogo.mensagens.map((m) => (
              <div key={m.seq} className={`chat-msg msg-${m.remetente}`}>
                <span className="chat-sender">
                  {m.remetente === 'analista' ? 'Você' : m.remetente === 'techlead' ? 'Tech Lead' : 'Maria'} ({m.minutoSimulado}m)
                </span>
                <p>{m.conteudo}</p>
              </div>
            ))
          )}
        </div>

        <div className="card-section" aria-label="Perguntas rápidas">
          <p className="muted">Sugestões para {persona === 'cliente' ? 'a cliente' : 'o Tech Lead'}:</p>
          <div className="actions-bar">
            {perguntasRapidas.map((pergunta) => (
              <button key={pergunta} type="button" disabled={ocupado} onClick={() => setMensagem(pergunta)}>
                {pergunta}
              </button>
            ))}
          </div>
        </div>

        <form
          className="form-row"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!mensagem.trim()) return
            const txt = mensagem
            setMensagem('')
            await onChat(persona, txt)
          }}
        >
          <input
            aria-label="Mensagem do chat"
            aria-describedby="chat-dica-teclado"
            maxLength={500}
            placeholder={persona === 'cliente' ? 'Pergunte sobre o erro ou peca matricula e ramal...' : 'Peca orientacao ao Tech Lead...'}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={ocupado || !mensagem.trim()}>
            Enviar
          </button>
        </form>
        <p id="chat-dica-teclado" className="muted">Use Tab para escolher contato e pergunta; Enter envia a mensagem.</p>
      </section>

      <section className="panel" aria-label="Verificacao de identidade e pistas">
        <div className="card-section">
          <h3>Verificação de identidade (SimuDesk)</h3>
          {sessao.dialogo.acessoRemotoLiberado ? (
            <div className="alert-success" role="status">
              <strong>Identidade Verificada!</strong>
              <div>ID SimuDesk: <code>{sessao.dialogo.idAcessoRemoto}</code></div>
              <div>PIN: <code>{sessao.dialogo.pinAcessoRemoto}</code></div>
            </div>
          ) : (
            <>
            <p role="status" aria-live="polite" className="muted">
              {sessao.dialogo.identidadeValidada
                ? 'Identidade confirmada; o acesso remoto está liberado.'
                : tentouValidar
                  ? 'Identidade ainda não confirmada. Confira matrícula e ramal e tente novamente.'
                  : 'Aguardando triagem do chamado e validação de matrícula e ramal.'}
            </p>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault()
                setTentouValidar(true)
                await onAcao('dialogo.verificar_identidade', { matricula, ramal })
              }}
            >
              <p className="muted">Assuma o chamado no ITSM e valide matrícula e ramal da usuária para liberar o acesso remoto.</p>
              <label>
                Matrícula
                <input aria-label="Matrícula da usuária" autoComplete="off" placeholder="Ex: AUR-1042" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
              </label>
              <label>
                Ramal
                <input aria-label="Ramal da usuária" inputMode="numeric" autoComplete="off" placeholder="Ex: 2042" value={ramal} onChange={(e) => setRamal(e.target.value)} />
              </label>
              <button type="submit" className="btn-primary" disabled={ocupado || !matricula.trim() || !ramal.trim()}>
                Validar Identidade
              </button>
            </form>
            </>
          )}
        </div>

        <div className="card-section">
          <h3>Mentoria &amp; Pistas (D3)</h3>
          <p className="muted">Pistas usadas: <strong>{sessao.dialogo.pistasSolicitadas}/3</strong> (sem punição de tempo)</p>
          <button
            type="button"
            aria-label={`Pedir pista ao Tech Lead. ${3 - sessao.dialogo.pistasSolicitadas} pistas restantes`}
            disabled={ocupado || sessao.dialogo.pistasSolicitadas >= 3}
            onClick={() => onAcao('dialogo.pedir_pista')}
          >
            {sessao.dialogo.pistasSolicitadas >= 3 ? 'Pistas esgotadas' : 'Pedir Pista ao Tech Lead'}
          </button>
        </div>
      </section>
    </div>
  )
}
