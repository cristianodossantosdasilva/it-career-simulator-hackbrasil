/** Lado do navegador: le o envelope do documento e normaliza a configuracao do cliente. */
import { CATALOGO_TEMAS, type IdTema, ehIdTema } from './catalogo.ts'
import { CAMPOS_DA_CONFIGURACAO, type EnvelopeConfiguracao } from './envelopeConfiguracao.ts'

export type Registrar = (mensagem: string) => void

export interface ConfiguracaoNormalizada {
  /** Nao vazia. Ordem informada pelo cliente, sem repeticao, so com temas do catalogo. */
  readonly temasPermitidos: readonly IdTema[]
  /** Sempre contido em temasPermitidos quando nao nulo. */
  readonly temaPadrao: IdTema | null
  readonly travado: boolean
}

export const CONFIGURACAO_AUSENTE: ConfiguracaoNormalizada = {
  temasPermitidos: CATALOGO_TEMAS.map((tema) => tema.id),
  temaPadrao: null,
  travado: false,
}

export const ID_BLOCO_CONFIGURACAO = 'itfs-config-cliente'

const PREFIXO = '[Aparência]'

/** Identificadores vem do arquivo do cliente e so servem de apresentacao: o texto e cortado. */
function cortar(texto: string): string {
  return texto.length > 32 ? texto.slice(0, 32) : texto
}

/** Le o bloco JSON do head. Retorna null se o bloco nao existe e `ilegivel` se o texto nao e um envelope. */
export function lerEnvelopeDoDocumento(documento: Document): EnvelopeConfiguracao | 'ilegivel' | null {
  const bloco = documento.getElementById(ID_BLOCO_CONFIGURACAO)
  if (bloco === null) return null
  try {
    const bruto: unknown = JSON.parse(bloco.textContent ?? '')
    if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) return 'ilegivel'
    const candidato = bruto as Record<string, unknown>
    if (candidato.versao !== 1 || !Array.isArray(candidato.camposIgnorados)) return 'ilegivel'
    return bruto as EnvelopeConfiguracao
  } catch {
    return 'ilegivel'
  }
}

function tipoCorreto(campo: (typeof CAMPOS_DA_CONFIGURACAO)[number], valor: unknown): boolean {
  if (campo === 'temasPermitidos') return Array.isArray(valor) && valor.every((item) => typeof item === 'string')
  if (campo === 'temaPadrao') return typeof valor === 'string'
  return typeof valor === 'boolean'
}

export function normalizarConfiguracao(
  envelope: EnvelopeConfiguracao | 'ilegivel' | null,
  registrar: Registrar,
): ConfiguracaoNormalizada {
  if (envelope === null) return CONFIGURACAO_AUSENTE
  if (envelope === 'ilegivel' || envelope.erro?.tipo === 'leitura') {
    registrar(`${PREFIXO} Configuração do cliente ilegível; todos os temas do catálogo ficam permitidos.`)
    return CONFIGURACAO_AUSENTE
  }
  const ignorados = Array.isArray(envelope.camposIgnorados) ? envelope.camposIgnorados : []
  for (const nome of ignorados) {
    registrar(`${PREFIXO} Campo ignorado na configuração do cliente: "${cortar(String(nome))}".`)
  }
  const configuracao: Record<string, unknown> =
    typeof envelope.configuracao === 'object' && envelope.configuracao !== null ? { ...envelope.configuracao } : {}
  let campoInvalido: string | null = envelope.erro?.tipo === 'campo' ? envelope.erro.campo : null
  if (campoInvalido === null) {
    for (const campo of CAMPOS_DA_CONFIGURACAO) {
      if (campo in configuracao && !tipoCorreto(campo, configuracao[campo])) {
        campoInvalido = campo
        break
      }
    }
  }
  if (campoInvalido !== null) {
    registrar(`${PREFIXO} Configuração do cliente ignorada: o campo "${campoInvalido}" tem tipo inválido.`)
    return CONFIGURACAO_AUSENTE
  }
  const informados = (configuracao.temasPermitidos as string[] | undefined) ?? []
  const lista: IdTema[] = []
  for (const candidato of informados) {
    if (!ehIdTema(candidato)) {
      registrar(`${PREFIXO} Tema "${cortar(candidato)}" descartado dos temas permitidos: não existe no catálogo.`)
    } else if (lista.includes(candidato)) {
      registrar(`${PREFIXO} Tema "${cortar(candidato)}" descartado dos temas permitidos: repetido.`)
    } else {
      lista.push(candidato)
    }
  }
  if (lista.length === 0) {
    registrar(`${PREFIXO} Nenhum tema permitido válido; todos os temas do catálogo ficam permitidos.`)
    return { ...CONFIGURACAO_AUSENTE }
  }
  const travado = configuracao.travado === true
  const padraoInformado = configuracao.temaPadrao as string | undefined
  let padrao: IdTema | null = null
  if (padraoInformado !== undefined) {
    if (ehIdTema(padraoInformado) && lista.includes(padraoInformado)) {
      padrao = padraoInformado
    } else {
      padrao = lista[0]
      registrar(`${PREFIXO} Tema padrão "${cortar(padraoInformado)}" fora dos temas permitidos; substituído por "${padrao}".`)
    }
  } else if (travado) {
    padrao = lista[0]
  }
  return { temasPermitidos: lista, temaPadrao: padrao, travado }
}
