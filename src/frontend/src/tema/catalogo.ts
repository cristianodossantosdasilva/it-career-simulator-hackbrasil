/**
 * Catalogo de temas do produto. O identificador e o nome visivel em minusculas, sem acento, com hifen
 * no lugar de espaco. A ordem da lista e a ordem do seletor e da regra de esquema de cor.
 */
export type EsquemaCor = 'claro' | 'escuro'

export interface Tema {
  readonly id: string
  readonly nome: string
  readonly esquema: EsquemaCor
}

export const CATALOGO_TEMAS = [
  { id: 'operacao', nome: 'Operação', esquema: 'escuro' },
  { id: 'corporativo', nome: 'Corporativo', esquema: 'claro' },
  { id: 'editorial', nome: 'Editorial', esquema: 'escuro' },
  { id: 'acolhedor', nome: 'Acolhedor', esquema: 'claro' },
] as const satisfies readonly Tema[]

export type IdTema = (typeof CATALOGO_TEMAS)[number]['id']

export const TEMA_PADRAO_PRODUTO: IdTema = 'operacao'
export const TEMA_DO_TERMINAL: IdTema = 'operacao'

/** Comparacao exata com os identificadores do catalogo, sem normalizar maiusculas nem espacos. */
export function ehIdTema(valor: unknown): valor is IdTema {
  return CATALOGO_TEMAS.some((tema) => tema.id === valor)
}

export function obterTema(id: IdTema): Tema {
  const tema = CATALOGO_TEMAS.find((candidato) => candidato.id === id)
  if (tema === undefined) throw new Error(`Tema fora do catálogo: ${String(id)}`)
  return tema
}

export type CampoCatalogo = 'id' | 'nome' | 'esquema'

export interface ErroCatalogo {
  readonly indice: number
  readonly id: string | null
  readonly campo: CampoCatalogo
  readonly motivo: 'ausente' | 'repetido' | 'formato'
}

const FORMATO_ID = /^[a-z][a-z0-9-]{2,31}$/
const SIMBOLO_PROIBIDO = String.fromCharCode(38)

function lerCampo(entrada: unknown, campo: CampoCatalogo): unknown {
  if (typeof entrada !== 'object' || entrada === null) return undefined
  return (entrada as Record<string, unknown>)[campo]
}

/** Regras do catalogo. Lista vazia de erros significa catalogo valido. Um erro por campo defeituoso. */
export function validarCatalogo(lista: readonly unknown[]): ErroCatalogo[] {
  const erros: ErroCatalogo[] = []
  const vistos = new Set<string>()
  lista.forEach((entrada, indice) => {
    const id = lerCampo(entrada, 'id')
    const nome = lerCampo(entrada, 'nome')
    const esquema = lerCampo(entrada, 'esquema')
    const idLegivel = typeof id === 'string' ? id : null
    if (typeof id !== 'string') {
      erros.push({ indice, id: null, campo: 'id', motivo: 'ausente' })
    } else if (!FORMATO_ID.test(id)) {
      erros.push({ indice, id: idLegivel, campo: 'id', motivo: 'formato' })
    } else if (vistos.has(id)) {
      erros.push({ indice, id: idLegivel, campo: 'id', motivo: 'repetido' })
    } else {
      vistos.add(id)
    }
    if (typeof nome !== 'string') {
      erros.push({ indice, id: idLegivel, campo: 'nome', motivo: 'ausente' })
    } else if (nome.length < 1 || nome.length > 40 || nome.includes(SIMBOLO_PROIBIDO)) {
      erros.push({ indice, id: idLegivel, campo: 'nome', motivo: 'formato' })
    }
    if (typeof esquema !== 'string') {
      erros.push({ indice, id: idLegivel, campo: 'esquema', motivo: 'ausente' })
    } else if (esquema !== 'claro' && esquema !== 'escuro') {
      erros.push({ indice, id: idLegivel, campo: 'esquema', motivo: 'formato' })
    }
  })
  return erros
}
