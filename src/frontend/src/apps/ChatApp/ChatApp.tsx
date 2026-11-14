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

  return (
    <div className="app-split" aria-label="Comunicador Corporativo">
      <section className="panel" aria-label="Conversa">
        <div className="row-between">
          <h2>Comunicador Corporativo</h2>
          <div role="tablist" aria-label="Contatos">
            <button
              type="button"
              role="tab"
              aria-selected={persona === 'cliente'}
              className={persona === 'cliente' ? 'btn-primary' : ''}
              onClick={() => setPersona('cliente')}
            >
              Cliente (Maria)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={persona === 'techlead'}
              className={persona === 'techlead' ? 'btn-primary' : ''}
              onClick={() => setPersona('techlead')}
            >
              Tech Lead IA
            </button>
          </div>
        </div>

        <div className="chat-log" role="log" aria-live="polite" aria-label="Mensagens da conversa">
          {sessao.dialogo.mensagens.length === 0 ? (
            <p className="muted">
              Inicie o atendimento cumprimentando a usuaria ou peca orientacao ao Tech Lead.
            </p>
          ) : (
            sessao.dialogo.mensagens.map((m) => (
              <div key={m.seq} className={`chat-msg msg-${m.remetente}`}>
                <span className="chat-sender">
                  {m.remetente === 'analista' ? 'Voce' : m.remetente === 'techlead' ? 'Tech Lead' : 'Maria'} ({m.minutoSimulado}m)
                </span>
                <p>{m.conteudo}</p>
              </div>
            ))
          )}
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
            maxLength={500}
            placeholder={persona === 'cliente' ? 'Pergunte sobre o erro ou peca matricula e ramal...' : 'Peca orientacao ao Tech Lead...'}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={ocupado || !mensagem.trim()}>
            Enviar
          </button>
        </form>
      </section>

      <section className="panel" aria-label="Verificacao de identidade e pistas">
        <div className="card-section">
          <h3>Verificacao de Identidade (SimuDesk)</h3>
          {sessao.dialogo.acessoRemotoLiberado ? (
            <div className="alert-success" role="status">
              <strong>Identidade Verificada!</strong>
              <div>ID SimuDesk: <code>{sessao.dialogo.idAcessoRemoto}</code></div>
              <div>PIN: <code>{sessao.dialogo.pinAcessoRemoto}</code></div>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault()
                await onAcao('dialogo.verificar_identidade', { matricula, ramal })
              }}
            >
              <p className="muted">Assuma o chamado no ITSM e valide matricula e ramal da usuaria para liberar o acesso remoto.</p>
              <label>
                Matricula
                <input placeholder="Ex: AUR-1042" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
              </label>
              <label>
                Ramal
                <input placeholder="Ex: 2042" value={ramal} onChange={(e) => setRamal(e.target.value)} />
              </label>
              <button type="submit" className="btn-primary" disabled={ocupado || !matricula.trim() || !ramal.trim()}>
                Validar Identidade
              </button>
            </form>
          )}
        </div>

        <div className="card-section">
          <h3>Mentoria &amp; Pistas (D3)</h3>
          <p className="muted">Pistas usadas: <strong>{sessao.dialogo.pistasSolicitadas}/3</strong> (sem punicao de tempo)</p>
          <button
            type="button"
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
