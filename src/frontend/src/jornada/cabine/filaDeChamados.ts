import type { ChamadoDto } from '../../api/types'

export type ModoCabine = 'treino' | 'missao'
export type FiltroMapa = 'todos' | 'abertos' | 'resolvidos' | 'revisar'

export const CHAVE_MODO_CABINE = 'itfs_modo_cabine'
export const PREFIXO_REVISAR_CABINE = 'itfs_cabine_revisar:'

export const FILTROS_MAPA: readonly { id: FiltroMapa; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'abertos', rotulo: 'Abertos' },
  { id: 'resolvidos', rotulo: 'Resolvidos' },
  { id: 'revisar', rotulo: 'Para revisar' },
]

export function chamadoEncerrado(chamado: ChamadoDto): boolean {
  return chamado.status === 'Resolvido' || chamado.status === 'Encerrado'
}

/** Lê o modo salvo. Sem valor válido, o padrão é Treino (feedback imediato). */
export function lerModoCabine(): ModoCabine {
  try {
    return window.localStorage.getItem(CHAVE_MODO_CABINE) === 'missao' ? 'missao' : 'treino'
  } catch {
    return 'treino'
  }
}

export function gravarModoCabine(modo: ModoCabine): void {
  try {
    window.localStorage.setItem(CHAVE_MODO_CABINE, modo)
  } catch {
    // armazenamento indisponível: o modo vale só para esta visita
  }
}

export function lerMarcasRevisar(sessaoId: string): readonly string[] {
  try {
    const bruto = window.localStorage.getItem(PREFIXO_REVISAR_CABINE + sessaoId)
    const dado: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(dado) ? dado.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function gravarMarcasRevisar(sessaoId: string, marcas: readonly string[]): void {
  try {
    window.localStorage.setItem(PREFIXO_REVISAR_CABINE + sessaoId, JSON.stringify(marcas))
  } catch {
    // armazenamento indisponível: as marcas valem só para esta visita
  }
}

/** Chamado em foco: o escolhido no mapa, senão o primeiro ainda aberto, senão o primeiro da fila. */
export function chamadoEmFoco(chamados: readonly ChamadoDto[], focoId: string | null): ChamadoDto | undefined {
  return chamados.find((c) => c.id === focoId) ?? chamados.find((c) => !chamadoEncerrado(c)) ?? chamados[0]
}

export function filtrarChamados(
  chamados: readonly ChamadoDto[],
  filtro: FiltroMapa,
  marcas: readonly string[],
): readonly ChamadoDto[] {
  switch (filtro) {
    case 'abertos':
      return chamados.filter((c) => !chamadoEncerrado(c))
    case 'resolvidos':
      return chamados.filter(chamadoEncerrado)
    case 'revisar':
      return chamados.filter((c) => marcas.includes(c.id))
    default:
      return chamados
  }
}

export function contagemPorFiltro(
  chamados: readonly ChamadoDto[],
  marcas: readonly string[],
): Record<FiltroMapa, number> {
  return {
    todos: chamados.length,
    abertos: filtrarChamados(chamados, 'abertos', marcas).length,
    resolvidos: filtrarChamados(chamados, 'resolvidos', marcas).length,
    revisar: filtrarChamados(chamados, 'revisar', marcas).length,
  }
}

export interface SeloDoChamado {
  id: 'atual' | 'resolvido' | 'sla-vencido' | 'revisar' | 'aberto'
  rotulo: string
}

/** Selos do item no mapa. O estado de SLA vem do motor (`slaVencido`); aqui só se exibe. */
export function selosDoChamado(chamado: ChamadoDto, atual: boolean, marcado: boolean): readonly SeloDoChamado[] {
  const selos: SeloDoChamado[] = []
  if (atual) selos.push({ id: 'atual', rotulo: 'Chamado atual' })
  selos.push(chamadoEncerrado(chamado) ? { id: 'resolvido', rotulo: 'Resolvido' } : { id: 'aberto', rotulo: 'Aberto' })
  if (chamado.slaVencido) selos.push({ id: 'sla-vencido', rotulo: 'SLA vencido' })
  if (marcado) selos.push({ id: 'revisar', rotulo: 'Para revisar' })
  return selos
}
