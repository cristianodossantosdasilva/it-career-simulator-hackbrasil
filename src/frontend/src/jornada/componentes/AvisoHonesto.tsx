import type { ReactNode } from 'react'
import { Icone } from '../../ui/Icone'
import { LinkInterno } from '../navegacao/LinkInterno'

export type AcaoAviso =
  | { tipo: 'link'; rotulo: string; href: string; substituir?: boolean }
  | { tipo: 'botao'; rotulo: string; aoClicar: () => void }

interface PropsAvisoHonesto {
  /** Falha que bloqueia o que a pessoa tentava fazer. Anuncia como alerta e usa o ícone de alerta. */
  bloqueante?: boolean
  titulo?: string
  children: ReactNode
  /** Todo aviso oferece ao menos um caminho para a pessoa seguir. */
  acoes: readonly [AcaoAviso, ...AcaoAviso[]]
}

/**
 * Aviso que diz o que aconteceu e o que fazer. Sem a região viva o leitor de tela não sabe que o aviso
 * apareceu: `role="status"` com `aria-live="polite"`, ou `role="alert"` quando bloqueia.
 */
export function AvisoHonesto({ bloqueante = false, titulo, children, acoes }: PropsAvisoHonesto) {
  const papel = bloqueante ? { role: 'alert' as const } : { role: 'status' as const, 'aria-live': 'polite' as const }
  return (
    <div className={bloqueante ? 'aviso-honesto aviso-honesto-bloqueante' : 'aviso-honesto'} {...papel}>
      <Icone nome={bloqueante ? 'alerta' : 'info'} tamanho={20} />
      <div className="aviso-honesto-corpo">
        {titulo && <p className="aviso-honesto-titulo">{titulo}</p>}
        <div className="aviso-honesto-texto">{children}</div>
        <div className="aviso-honesto-acoes">
          {acoes.map((acao) =>
            acao.tipo === 'link' ? (
              <LinkInterno
                key={acao.rotulo}
                href={acao.href}
                substituir={acao.substituir}
                className="btn btn-secondary btn-sm"
              >
                {acao.rotulo}
              </LinkInterno>
            ) : (
              <button key={acao.rotulo} type="button" className="btn btn-secondary btn-sm" onClick={acao.aoClicar}>
                {acao.rotulo}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
