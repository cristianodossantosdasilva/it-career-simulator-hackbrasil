import type { AvaliacaoResponse, SessaoProjecao } from '../../api/types'
import {
  type IdMissao,
  type IdRota,
  type IdVertente,
  CATALOGO_ROTAS,
  ehIdMissao,
  etapaDaMissao,
} from '../catalogos/catalogoRotas'
import { PADRAO_SESSAO } from '../navegacao/rotas'
import { analisarObjetoJson, ehDataIso, ehObjeto, ehTexto, gravarChave, lerChave } from './leituraSegura'

export const CHAVE_REGISTROS_MISSAO = 'itfs_registros_voo'

export interface CriterioCopiado {
  id: string
  descricao: string
  atendido: boolean
}

/** Cópia campo a campo da avaliação do Juiz 360º. Nenhum campo é calculado no frontend. */
export interface ResultadoJuizCopiado {
  concluida: true
  resumo: string
  xpTotal: number
  incidenteSeguranca: boolean
  criterios: readonly CriterioCopiado[]
}

export interface RegistroDeMissao {
  versao: 1
  sessaoId: string
  missao: IdMissao
  /** meta.versaoManifesto da projeção. */
  versaoCenario: string
  rotaId: IdRota
  escalaId: string
  /** Preenchida quando a etapa é a N3 Sênior. */
  vertenteId: IdVertente | null
  /** ISO 8601. */
  concluidoEm: string
  resultado: ResultadoJuizCopiado
}

export interface ArquivoRegistros {
  versao: 1
  registros: readonly RegistroDeMissao[]
}

function analisarCriterio(valor: unknown): CriterioCopiado | null {
  if (!ehObjeto(valor)) return null
  const { id, descricao, atendido } = valor
  if (!ehTexto(id) || !ehTexto(descricao) || typeof atendido !== 'boolean') return null
  return { id, descricao, atendido }
}

function analisarResultado(valor: unknown): ResultadoJuizCopiado | null {
  if (!ehObjeto(valor) || valor.concluida !== true) return null
  const { resumo, xpTotal, incidenteSeguranca, criterios } = valor
  if (!ehTexto(resumo) || typeof xpTotal !== 'number' || !Number.isFinite(xpTotal)) return null
  if (typeof incidenteSeguranca !== 'boolean' || !Array.isArray(criterios)) return null
  const copiados = criterios.map(analisarCriterio)
  if (copiados.some((criterio) => criterio === null)) return null
  return { concluida: true, resumo, xpTotal, incidenteSeguranca, criterios: copiados as CriterioCopiado[] }
}

/**
 * Valida um item. A etapa e a Vertente gravadas não precisam bater com o catálogo atual: os cálculos
 * usam o catálogo pela `missao`. Missão fora do catálogo descarta o item.
 */
export function analisarRegistro(valor: unknown): RegistroDeMissao | null {
  if (!ehObjeto(valor) || valor.versao !== 1) return null
  const { sessaoId, missao, versaoCenario, rotaId, escalaId, vertenteId, concluidoEm } = valor
  if (!ehTexto(sessaoId) || !PADRAO_SESSAO.test(sessaoId)) return null
  if (!ehTexto(missao) || !ehIdMissao(missao)) return null
  if (!ehTexto(versaoCenario) || !ehTexto(escalaId)) return null
  if (!CATALOGO_ROTAS.some((rota) => rota.id === rotaId)) return null
  if (vertenteId !== null && !ehTexto(vertenteId)) return null
  if (!ehDataIso(concluidoEm)) return null
  const resultado = analisarResultado(valor.resultado)
  if (!resultado) return null
  return {
    versao: 1,
    sessaoId,
    missao,
    versaoCenario,
    rotaId: rotaId as IdRota,
    escalaId,
    vertenteId: vertenteId as IdVertente | null,
    concluidoEm,
    resultado,
  }
}

/** Mantém um registro por sessão. O de mesma `sessaoId` é substituído, na posição original. */
export function incluirRegistro(registros: readonly RegistroDeMissao[], registro: RegistroDeMissao): RegistroDeMissao[] {
  const indice = registros.findIndex((item) => item.sessaoId === registro.sessaoId)
  if (indice < 0) return [...registros, registro]
  return registros.map((item, i) => (i === indice ? registro : item))
}

/** Pura e total: devolve só os itens válidos, um por sessão. */
export function analisarRegistros(texto: string | null): RegistroDeMissao[] {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1 || !Array.isArray(dado.registros)) return []
  let validos: RegistroDeMissao[] = []
  for (const item of dado.registros) {
    const registro = analisarRegistro(item)
    if (registro) validos = incluirRegistro(validos, registro)
  }
  return validos
}

export function serializarRegistros(registros: readonly RegistroDeMissao[]): string {
  const arquivo: ArquivoRegistros = { versao: 1, registros }
  return JSON.stringify(arquivo)
}

export function lerRegistros(armazenamento: Pick<Storage, 'getItem'>): RegistroDeMissao[] {
  return analisarRegistros(lerChave(armazenamento, CHAVE_REGISTROS_MISSAO))
}

export function gravarRegistros(armazenamento: Pick<Storage, 'setItem'>, registros: readonly RegistroDeMissao[]): boolean {
  return gravarChave(armazenamento, CHAVE_REGISTROS_MISSAO, serializarRegistros(registros))
}

/** Idempotente por `sessaoId`: gravar de novo a mesma sessão substitui o registro anterior. */
export function gravarRegistro(armazenamento: Pick<Storage, 'getItem' | 'setItem'>, registro: RegistroDeMissao): boolean {
  return gravarRegistros(armazenamento, incluirRegistro(lerRegistros(armazenamento), registro))
}

/**
 * Cria o Registro_de_Missão a partir da avaliação do Juiz 360º, copiando os campos sem cálculo próprio.
 * Devolve nulo quando a avaliação não está concluída ou a missão não está no catálogo.
 */
export function criarRegistro(
  sessaoId: string,
  projecao: Pick<SessaoProjecao, 'meta'>,
  avaliacao: AvaliacaoResponse,
  agora: Date,
): RegistroDeMissao | null {
  if (avaliacao.concluida !== true) return null
  const local = etapaDaMissao(projecao.meta.cenarioId)
  if (!local) return null
  return {
    versao: 1,
    sessaoId,
    missao: local.missao.id,
    versaoCenario: projecao.meta.versaoManifesto,
    rotaId: local.rota.id as IdRota,
    escalaId: local.etapa.id,
    vertenteId: local.vertente?.id ?? null,
    concluidoEm: agora.toISOString(),
    resultado: {
      concluida: true,
      resumo: avaliacao.resumo,
      xpTotal: avaliacao.xpTotal,
      incidenteSeguranca: avaliacao.incidenteSeguranca,
      criterios: avaliacao.criterios.map((criterio) => ({
        id: criterio.id,
        descricao: criterio.descricao,
        atendido: criterio.atendido,
      })),
    },
  }
}
