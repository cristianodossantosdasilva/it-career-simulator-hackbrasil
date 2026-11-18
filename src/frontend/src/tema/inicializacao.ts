/** Inicializacao da aparencia: o mesmo codigo roda no script inline do head e na aplicacao. */
import type { IdTema } from './catalogo.ts'
import {
  type ConfiguracaoNormalizada,
  type Registrar,
  lerEnvelopeDoDocumento,
  normalizarConfiguracao,
} from './configuracaoCliente.ts'
import { aplicarAparencia } from './documento.ts'
import {
  type ArmazenamentoChaveValor,
  type EstadoContraste,
  lerContraste,
  lerPreferenciaTema,
  obterArmazenamento,
} from './persistencia.ts'
import { type EsquemaNavegador, resolverTema } from './resolvedor.ts'

export interface AmbienteAparencia {
  readonly documento: Document
  readonly armazenamento: ArmazenamentoChaveValor | null
  readonly consultarEsquema: () => EsquemaNavegador
  readonly registrar: Registrar
}

export interface EstadoAparencia {
  readonly tema: IdTema
  readonly contraste: EstadoContraste
  readonly configuracao: ConfiguracaoNormalizada
}

/** So le e calcula. Nao grava nada, nem no armazenamento nem no documento. */
export function calcularAparencia(ambiente: AmbienteAparencia): EstadoAparencia {
  const configuracao = normalizarConfiguracao(lerEnvelopeDoDocumento(ambiente.documento), ambiente.registrar)
  const preferencia = lerPreferenciaTema(ambiente.armazenamento)
  const tema = resolverTema({ configuracao, preferencia, esquemaNavegador: ambiente.consultarEsquema() })
  return { tema, contraste: lerContraste(ambiente.armazenamento), configuracao }
}

/** Calcula e aplica no html. Qualquer excecao mantem os atributos estaticos do index.html. */
export function inicializarAparencia(ambiente: AmbienteAparencia): EstadoAparencia | null {
  try {
    const estado = calcularAparencia(ambiente)
    aplicarAparencia(ambiente.documento.documentElement, estado.tema, estado.contraste)
    return estado
  } catch {
    return null
  }
}

export function criarAmbienteDoNavegador(janela: Window, registrar: Registrar): AmbienteAparencia {
  return {
    documento: janela.document,
    armazenamento: obterArmazenamento(janela),
    consultarEsquema: () => {
      if (typeof janela.matchMedia !== 'function') return null
      if (janela.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      if (janela.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
      return 'no-preference'
    },
    registrar,
  }
}
