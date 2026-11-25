import { analisarObjetoJson, ehDataIso, ehObjeto, ehTexto, gravarChave, lerChave } from '../armazenamento/leituraSegura'

export const CHAVE_HISTORICO = 'itfs_historico_v1'

export type TipoHistorico = 'teorico' | 'lab'
export type FormatoHistorico = 'padrao' | 'pratica'
export type EscopoHistorico = 'completo' | 'personalizado'
export type OrigemHistorico = 'simulado' | 'prova' | 'pratica'

export interface DominioHistorico {
  dominio: string
  total: number
  corretas: number
}

export interface EntradaHistorico {
  id: string
  tipo: TipoHistorico
  formato: FormatoHistorico
  escopo: EscopoHistorico
  quando: string
  duracaoSeg: number
  percentual: number
  aprovado: boolean
  porDominio: readonly DominioHistorico[]
  origem: OrigemHistorico
}

export interface NovaEntradaHistorico extends Omit<EntradaHistorico, 'id' | 'quando'> {
  id?: string
  quando?: string
}

interface ArquivoHistorico {
  versao: 1
  itens: readonly EntradaHistorico[]
}

function analisarDominio(valor: unknown): DominioHistorico | null {
  if (!ehObjeto(valor)) return null
  const { dominio, total, corretas } = valor
  if (!ehTexto(dominio) || typeof total !== 'number' || typeof corretas !== 'number') return null
  if (!Number.isFinite(total) || !Number.isFinite(corretas)) return null
  return { dominio, total, corretas }
}

function analisarEntrada(valor: unknown): EntradaHistorico | null {
  if (!ehObjeto(valor)) return null
  const { id, tipo, formato, escopo, quando, duracaoSeg, percentual, aprovado, porDominio, origem } = valor
  if (!ehTexto(id) || id.length === 0) return null
  if (tipo !== 'teorico' && tipo !== 'lab') return null
  if (formato !== 'padrao' && formato !== 'pratica') return null
  if (escopo !== 'completo' && escopo !== 'personalizado') return null
  if (!ehDataIso(quando)) return null
  if (typeof duracaoSeg !== 'number' || !Number.isFinite(duracaoSeg)) return null
  if (typeof percentual !== 'number' || !Number.isFinite(percentual)) return null
  if (typeof aprovado !== 'boolean') return null
  if (!Array.isArray(porDominio)) return null
  const dominios = porDominio.map(analisarDominio)
  if (dominios.some((d) => d === null)) return null
  if (origem !== 'simulado' && origem !== 'prova' && origem !== 'pratica') return null
  return {
    id,
    tipo,
    formato,
    escopo,
    quando,
    duracaoSeg,
    percentual,
    aprovado,
    porDominio: dominios as DominioHistorico[],
    origem,
  }
}

export function analisarHistorico(texto: string | null): EntradaHistorico[] {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1 || !Array.isArray(dado.itens)) return []
  return dado.itens.map(analisarEntrada).filter((item): item is EntradaHistorico => item !== null)
}

export function lerHistorico(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): EntradaHistorico[] {
  if (!armazenamento) return []
  return analisarHistorico(lerChave(armazenamento, CHAVE_HISTORICO))
}

function gerarIdHistorico(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Grava uma nova entrada no histórico unificado (`itfs_historico_v1`), mantendo as mais recentes
 * primeiro e substituindo por `id` se já existir.
 */
export function registrarHistorico(
  nova: NovaEntradaHistorico,
  armazenamento: Pick<Storage, 'getItem' | 'setItem'> | null =
    typeof window !== 'undefined' ? window.localStorage : null,
): EntradaHistorico {
  const entrada: EntradaHistorico = {
    ...nova,
    id: nova.id && nova.id.length > 0 ? nova.id : gerarIdHistorico(),
    quando: nova.quando && ehDataIso(nova.quando) ? nova.quando : new Date().toISOString(),
  }
  if (!armazenamento) return entrada
  const atuais = lerHistorico(armazenamento).filter((item) => item.id !== entrada.id)
  const arquivo: ArquivoHistorico = { versao: 1, itens: [entrada, ...atuais] }
  gravarChave(armazenamento, CHAVE_HISTORICO, JSON.stringify(arquivo))
  return entrada
}
