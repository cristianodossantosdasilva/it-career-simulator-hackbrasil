/** Lado do build: le o texto do arquivo do cliente e produz um envelope higienizado. Sem DOM, nunca lanca excecao. */
export const CAMPOS_DA_CONFIGURACAO = ['temasPermitidos', 'temaPadrao', 'travado'] as const
export type CampoConfiguracao = (typeof CAMPOS_DA_CONFIGURACAO)[number]

export interface ConfiguracaoTipada {
  readonly temasPermitidos?: readonly string[]
  readonly temaPadrao?: string
  readonly travado?: boolean
}

export type ErroEnvelope =
  | { readonly tipo: 'leitura' }
  | { readonly tipo: 'campo'; readonly campo: CampoConfiguracao }

export interface EnvelopeConfiguracao {
  readonly versao: 1
  readonly configuracao: ConfiguracaoTipada | null
  readonly camposIgnorados: readonly string[]
  readonly erro: ErroEnvelope | null
}

function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false
  const prototipo = Object.getPrototypeOf(valor)
  return prototipo === Object.prototype || prototipo === null
}

function tipoValido(campo: CampoConfiguracao, valor: unknown): boolean {
  if (campo === 'temasPermitidos') return Array.isArray(valor) && valor.every((item) => typeof item === 'string')
  if (campo === 'temaPadrao') return typeof valor === 'string'
  return typeof valor === 'boolean'
}

/** O valor de um campo desconhecido nunca entra no envelope: so o nome. */
export function criarEnvelope(texto: string): EnvelopeConfiguracao {
  const erroDeLeitura: EnvelopeConfiguracao = { versao: 1, configuracao: null, camposIgnorados: [], erro: { tipo: 'leitura' } }
  try {
    const bruto: unknown = JSON.parse(texto)
    if (!ehObjetoSimples(bruto)) return erroDeLeitura
    const ignorados = Object.keys(bruto)
      .filter((nome) => !(CAMPOS_DA_CONFIGURACAO as readonly string[]).includes(nome))
      .sort()
    for (const campo of CAMPOS_DA_CONFIGURACAO) {
      if (Object.prototype.hasOwnProperty.call(bruto, campo) && !tipoValido(campo, bruto[campo])) {
        return { versao: 1, configuracao: null, camposIgnorados: ignorados, erro: { tipo: 'campo', campo } }
      }
    }
    const configuracao: { -readonly [K in keyof ConfiguracaoTipada]: ConfiguracaoTipada[K] } = {}
    if (Object.prototype.hasOwnProperty.call(bruto, 'temasPermitidos')) configuracao.temasPermitidos = [...(bruto.temasPermitidos as string[])]
    if (Object.prototype.hasOwnProperty.call(bruto, 'temaPadrao')) configuracao.temaPadrao = bruto.temaPadrao as string
    if (Object.prototype.hasOwnProperty.call(bruto, 'travado')) configuracao.travado = bruto.travado as boolean
    return { versao: 1, configuracao, camposIgnorados: ignorados, erro: null }
  } catch {
    return erroDeLeitura
  }
}

/** JSON.stringify com cada sinal de menor trocado por \u003c, para embutir o texto em uma tag de script. */
export function serializarParaHtml(valor: unknown): string {
  return (JSON.stringify(valor) ?? 'null').replace(/</g, '\\u003c')
}
