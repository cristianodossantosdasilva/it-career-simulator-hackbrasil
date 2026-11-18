import type { ReplayResponse } from '../api/types'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { Icone } from '../ui/Icone'

type Curriculo = NonNullable<ReplayResponse['curriculo']>

interface Props {
  curriculo: Curriculo
  nivel: string
}

/**
 * Selo técnico do Currículo Vivo da sessão. Mostra o hash de auditoria devolvido pelo servidor.
 * A verificação da assinatura ECDSA P-256 do arquivo exportado fica no Verificador offline do
 * destino Credencial (utils/jcs.ts), que não é alterado aqui.
 */
export function CredentialCard({ curriculo, nivel }: Props) {
  const competencias = curriculo.competencias.join(', ')
  return (
    <section className="selo" aria-labelledby="selo-titulo">
      <div className="selo-marca" aria-hidden="true">
        <Icone nome="credencial" tamanho={24} />
      </div>
      <div className="selo-corpo">
        <p className="selo-tipo">Credencial verificável</p>
        <h2 id="selo-titulo" className="selo-titulo">
          {TEXTOS_WORKSTATION.replay.credencial}
        </h2>
        <dl className="selo-dados">
          <div>
            <dt>Escala</dt>
            <dd>{nivel}</dd>
          </div>
          <div>
            <dt>Competências comprovadas</dt>
            <dd>{competencias || 'Nenhuma nesta sessão'}</dd>
          </div>
          <div>
            <dt>Algoritmo do hash</dt>
            <dd className="dado-mono">{curriculo.algoritmo}</dd>
          </div>
          <div>
            <dt>Hash de auditoria</dt>
            <dd className="dado-mono selo-hash">{curriculo.hash}</dd>
          </div>
          <div>
            <dt>Versão do manifesto</dt>
            <dd className="dado-mono">{curriculo.versaoManifesto}</dd>
          </div>
        </dl>
        <p className="selo-nota">
          <Icone nome="verificar" tamanho={16} />
          <span>
            A assinatura ECDSA P-256 do arquivo exportado é conferida no Verificador offline, no destino Credencial. O selo
            não é diploma nem certificação de terceiros.
          </span>
        </p>
      </div>
    </section>
  )
}
