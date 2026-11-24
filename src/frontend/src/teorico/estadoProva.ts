import type { EscopoProva, FormatoProva, PedidoProva, QuestaoPublica, VerificacaoQuestao } from '../api/teorico'

export const CHAVE_ANDAMENTO_TEORICO = 'itfs_teorico_andamento'

export type OrigemProva = 'simulado' | 'prova' | 'pratica'

/** Configuração da prova. A semente fixa o sorteio, então a mesma prova pode ser reconstruída ao retomar. */
export interface ConfigProva {
  formato: FormatoProva
  escopo: EscopoProva
  topicos?: string[]
  nivel?: 1 | 2 | 3
  quantidade?: number
  semente?: number
  origem: OrigemProva
}

export type FiltroMapa = 'todas' | 'revisar' | 'branco' | 'incorretas' | 'marcadas' | 'sem-resposta'

export const FILTROS_PRATICA: readonly { id: FiltroMapa; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'revisar', rotulo: 'Para revisar' },
  { id: 'branco', rotulo: 'Em branco' },
  { id: 'incorretas', rotulo: 'Incorretas' },
]

export const FILTROS_PADRAO: readonly { id: FiltroMapa; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'marcadas', rotulo: 'Marcadas' },
  { id: 'sem-resposta', rotulo: 'Sem resposta' },
]

export type SeloQuestao = 'atual' | 'correta' | 'incorreta' | 'branco' | 'revisar' | 'respondida'

export interface InstantaneoProva {
  respostas: Readonly<Record<string, readonly string[]>>
  marcadas: readonly string[]
  verificacoes: Readonly<Record<string, VerificacaoQuestao>>
}

export function pedidoDaConfig(config: ConfigProva): PedidoProva {
  const { formato, escopo, topicos, nivel, quantidade, semente } = config
  return { formato, escopo, topicos, nivel, quantidade, semente }
}

export function estaRespondida(inst: InstantaneoProva, id: string): boolean {
  return (inst.respostas[id]?.length ?? 0) > 0
}

export function contarRespondidas(questoes: readonly QuestaoPublica[], inst: InstantaneoProva): number {
  return questoes.filter((q) => estaRespondida(inst, q.id)).length
}

/** Selos de uma questão no mapa. Na Prática, a verificação decide Correta ou Incorreta. */
export function selosDaQuestao(id: string, atual: boolean, inst: InstantaneoProva): SeloQuestao[] {
  const selos: SeloQuestao[] = []
  if (atual) selos.push('atual')
  const verificada = inst.verificacoes[id]
  if (verificada) selos.push(verificada.correta ? 'correta' : 'incorreta')
  else if (estaRespondida(inst, id)) selos.push('respondida')
  else selos.push('branco')
  if (inst.marcadas.includes(id)) selos.push('revisar')
  return selos
}

export function filtrarQuestoes(
  questoes: readonly QuestaoPublica[],
  filtro: FiltroMapa,
  inst: InstantaneoProva,
): QuestaoPublica[] {
  switch (filtro) {
    case 'revisar':
    case 'marcadas':
      return questoes.filter((q) => inst.marcadas.includes(q.id))
    case 'branco':
    case 'sem-resposta':
      return questoes.filter((q) => !estaRespondida(inst, q.id))
    case 'incorretas':
      return questoes.filter((q) => inst.verificacoes[q.id]?.correta === false)
    default:
      return [...questoes]
  }
}

export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function alternarSelecao(
  atuais: readonly string[],
  alternativaId: string,
  selecao: 'unica' | 'multipla',
): string[] {
  if (selecao === 'unica') return [alternativaId]
  return atuais.includes(alternativaId) ? atuais.filter((x) => x !== alternativaId) : [...atuais, alternativaId]
}

export interface Andamento {
  versao: 1
  config: ConfigProva & { semente: number }
  indice: number
  respostas: Record<string, string[]>
  marcadas: string[]
  verificacoes: Record<string, VerificacaoQuestao>
  restanteSeg: number | null
  decorridoSeg: number
}

export function lerAndamento(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): Andamento | null {
  try {
    const bruto = armazenamento?.getItem(CHAVE_ANDAMENTO_TEORICO)
    if (!bruto) return null
    const dado = JSON.parse(bruto) as Partial<Andamento>
    if (dado.versao !== 1 || !dado.config || typeof dado.config.semente !== 'number') return null
    if (!dado.respostas || typeof dado.respostas !== 'object' || !Array.isArray(dado.marcadas)) return null
    return dado as Andamento
  } catch {
    return null
  }
}

export function gravarAndamento(
  andamento: Andamento,
  armazenamento: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): void {
  try {
    armazenamento?.setItem(CHAVE_ANDAMENTO_TEORICO, JSON.stringify(andamento))
  } catch {
    // armazenamento indisponível: o andamento vale só nesta visita
  }
}

export function limparAndamento(
  armazenamento: Pick<Storage, 'removeItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): void {
  try {
    armazenamento?.removeItem(CHAVE_ANDAMENTO_TEORICO)
  } catch {
    // sem armazenamento, nada a limpar
  }
}
