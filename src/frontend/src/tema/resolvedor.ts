/**
 * Resolvedor de tema: funcao pura das tres entradas. O contraste nao e parametro (o modo de alto
 * contraste nunca muda o tema) e nada aqui le armazenamento, relogio ou DOM.
 */
import { CATALOGO_TEMAS, type EsquemaCor, type IdTema, TEMA_PADRAO_PRODUTO, ehIdTema } from './catalogo.ts'
import type { ConfiguracaoNormalizada } from './configuracaoCliente.ts'

export type EsquemaNavegador = 'light' | 'dark' | 'no-preference' | null

export interface EntradasResolvedor {
  readonly configuracao: ConfiguracaoNormalizada | null
  readonly preferencia: string | null
  readonly esquemaNavegador: EsquemaNavegador
}

export interface PermissoesEfetivas {
  readonly permitidos: readonly IdTema[]
  readonly travado: boolean
  readonly padrao: IdTema | null
}

/** Defensiva: nao confia que a configuracao ja foi normalizada. */
export function permissoesEfetivas(configuracao: ConfiguracaoNormalizada | null): PermissoesEfetivas {
  const todos = CATALOGO_TEMAS.map((tema) => tema.id)
  if (configuracao === null || configuracao === undefined) return { permitidos: todos, travado: false, padrao: null }
  const lista: IdTema[] = []
  const bruta: readonly unknown[] = Array.isArray(configuracao.temasPermitidos) ? configuracao.temasPermitidos : []
  for (const candidato of bruta) {
    if (ehIdTema(candidato) && !lista.includes(candidato)) lista.push(candidato)
  }
  if (lista.length === 0) return { permitidos: todos, travado: false, padrao: null }
  const padrao = ehIdTema(configuracao.temaPadrao) && lista.includes(configuracao.temaPadrao) ? configuracao.temaPadrao : null
  return { permitidos: lista, travado: configuracao.travado === true, padrao }
}

export function resolverTema({ configuracao, preferencia, esquemaNavegador }: EntradasResolvedor): IdTema {
  const { permitidos, travado, padrao } = permissoesEfetivas(configuracao)
  const naOrdemDoCatalogo = CATALOGO_TEMAS.filter((tema) => permitidos.includes(tema.id))
  const preferenciaValida = preferencia !== null ? (permitidos.find((id) => id === preferencia) ?? null) : null
  if (travado) {
    if (padrao !== null) return padrao
  } else {
    if (preferenciaValida !== null) return preferenciaValida
    if (padrao !== null) return padrao
  }
  if (esquemaNavegador === 'light' || esquemaNavegador === 'dark') {
    const esquema: EsquemaCor = esquemaNavegador === 'dark' ? 'escuro' : 'claro'
    const porEsquema = naOrdemDoCatalogo.find((tema) => tema.esquema === esquema)
    if (porEsquema !== undefined) return porEsquema.id
  }
  if (permitidos.includes(TEMA_PADRAO_PRODUTO)) return TEMA_PADRAO_PRODUTO
  return naOrdemDoCatalogo[0].id
}
