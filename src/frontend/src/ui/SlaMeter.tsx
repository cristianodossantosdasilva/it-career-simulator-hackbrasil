interface SlaMeterProps {
  /** Minuto simulado em que o chamado foi aberto. */
  abertoEmMinuto: number
  /** Minuto simulado do prazo, como entregue pela API (ou nulo quando o chamado nao foi classificado). */
  alvoMinuto: number | null
  /** Minuto simulado atual da sessao. */
  minutoAtual: number
  /** Marca de SLA vencido calculada pelo motor. O cliente nao decide violacao. */
  vencido: boolean
  /** Chamado resolvido ou encerrado: o prazo deixa de correr. */
  encerrado: boolean
}

type NivelSla = 'ok' | 'urgente' | 'vencido' | 'sem-prazo'

const LIMITE_URGENTE = 0.25

function calcular({ abertoEmMinuto, alvoMinuto, minutoAtual, vencido, encerrado }: SlaMeterProps) {
  if (alvoMinuto === null) {
    return { nivel: 'sem-prazo' as NivelSla, texto: 'Sem SLA', consumido: 0 }
  }
  if (encerrado) {
    return vencido
      ? { nivel: 'vencido' as NivelSla, texto: 'Resolvido fora do prazo', consumido: 1 }
      : { nivel: 'ok' as NivelSla, texto: 'Resolvido no prazo', consumido: 1 }
  }
  const duracao = Math.max(1, alvoMinuto - abertoEmMinuto)
  const restante = alvoMinuto - minutoAtual
  const consumido = Math.min(1, Math.max(0, (minutoAtual - abertoEmMinuto) / duracao))
  if (vencido) {
    const atraso = minutoAtual - alvoMinuto
    return {
      nivel: 'vencido' as NivelSla,
      texto: atraso > 0 ? `Vencido há ${atraso} min` : 'Vencido',
      consumido: 1,
    }
  }
  const nivel: NivelSla = (duracao - Math.max(0, minutoAtual - abertoEmMinuto)) / duracao < LIMITE_URGENTE ? 'urgente' : 'ok'
  return { nivel, texto: `Restam ${Math.max(0, restante)} min`, consumido }
}

/**
 * Indicador de SLA com dado real da API. O estado sempre aparece em texto; a barra e a cor so reforcam.
 */
export function SlaMeter(props: SlaMeterProps) {
  const { nivel, texto, consumido } = calcular(props)
  return (
    <span className="sla" data-nivel={nivel}>
      {nivel !== 'sem-prazo' && (
        <span className="sla-barra" aria-hidden="true">
          <span className="sla-barra-nivel" style={{ width: `${Math.round(consumido * 100)}%` }} />
        </span>
      )}
      <span className="sla-texto dado-mono">{texto}</span>
    </span>
  )
}
