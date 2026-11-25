import {
  analisarObjetoJson,
  ehDataIso,
  ehObjeto,
  ehTexto,
  gravarChave,
  lerChave,
} from '../armazenamento/leituraSegura'
import type { CriterioCopiado, RegistroDeMissao } from '../armazenamento/registrosMissao'
import { type IdMissao, ehIdMissao } from '../catalogos/catalogoRotas'
import { textosDaMissao } from '../componentes/textosDaMissao'

export const CHAVE_PORTFOLIO_LAB = 'itfs_portfolio_lab_v1'
export const CHAVE_PROVA_LAB_PENDENTE = 'itfs_prova_lab_pendente_v1'

export interface EntradaPortfolioLab {
  id: string
  sessaoId: string
  cenarioId: IdMissao
  cenarioTitulo: string
  nota: number
  data: string
  criteriosAtendidos: readonly string[]
  criteriosPendentes: readonly string[]
  oQueFoiFeito: string
}

export interface ProvaLabPendente {
  missao: IdMissao
  iniciadaEm: string
}

interface ArquivoPortfolioLab {
  versao: 1
  itens: readonly EntradaPortfolioLab[]
}

/** Calcula a nota (0 a 100) a partir dos critérios atendidos pelo Juiz 360º. */
export function calcularNotaCriterios(criterios: readonly CriterioCopiado[]): number {
  if (criterios.length === 0) return 100
  const atendidos = criterios.filter((c) => c.atendido).length
  return Math.round((atendidos / criterios.length) * 100)
}

/** Constrói uma entrada de portfólio de Prova de Lab a partir de um Registro_de_Missão. */
export function criarEntradaPortfolioLab(registro: RegistroDeMissao): EntradaPortfolioLab {
  const criteriosAtendidos = registro.resultado.criterios.filter((c) => c.atendido).map((c) => c.descricao)
  const criteriosPendentes = registro.resultado.criterios.filter((c) => !c.atendido).map((c) => c.descricao)
  return {
    id: registro.sessaoId,
    sessaoId: registro.sessaoId,
    cenarioId: registro.missao,
    cenarioTitulo: textosDaMissao(registro.missao).titulo,
    nota: calcularNotaCriterios(registro.resultado.criterios),
    data: registro.concluidoEm,
    criteriosAtendidos,
    criteriosPendentes,
    oQueFoiFeito: registro.resultado.resumo,
  }
}

function analisarEntrada(valor: unknown): EntradaPortfolioLab | null {
  if (!ehObjeto(valor)) return null
  const { id, sessaoId, cenarioId, cenarioTitulo, nota, data, criteriosAtendidos, criteriosPendentes, oQueFoiFeito } =
    valor
  if (!ehTexto(id) || id.length === 0) return null
  if (!ehTexto(sessaoId) || sessaoId.length === 0) return null
  if (!ehTexto(cenarioId) || !ehIdMissao(cenarioId)) return null
  if (!ehTexto(cenarioTitulo) || cenarioTitulo.length === 0) return null
  if (typeof nota !== 'number' || !Number.isFinite(nota) || nota < 0 || nota > 100) return null
  if (!ehDataIso(data)) return null
  if (!Array.isArray(criteriosAtendidos) || !criteriosAtendidos.every(ehTexto)) return null
  if (!Array.isArray(criteriosPendentes) || !criteriosPendentes.every(ehTexto)) return null
  if (!ehTexto(oQueFoiFeito)) return null

  return {
    id,
    sessaoId,
    cenarioId,
    cenarioTitulo,
    nota: Math.round(nota),
    data,
    criteriosAtendidos,
    criteriosPendentes,
    oQueFoiFeito,
  }
}

export function analisarPortfolioLab(texto: string | null): EntradaPortfolioLab[] {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1 || !Array.isArray(dado.itens)) return []
  return dado.itens.map(analisarEntrada).filter((item): item is EntradaPortfolioLab => item !== null)
}

export function lerPortfolioLab(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): EntradaPortfolioLab[] {
  if (!armazenamento) return []
  return analisarPortfolioLab(lerChave(armazenamento, CHAVE_PORTFOLIO_LAB))
}

export function gravarPortfolioLab(
  itens: readonly EntradaPortfolioLab[],
  armazenamento: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): boolean {
  if (!armazenamento) return false
  const arquivo: ArquivoPortfolioLab = { versao: 1, itens }
  return gravarChave(armazenamento, CHAVE_PORTFOLIO_LAB, JSON.stringify(arquivo))
}

/** Grava uma entrada de Portfólio da Prova de Lab (idempotente por `sessaoId`, mais recente primeiro). */
export function registrarEntradaPortfolioLab(
  entrada: EntradaPortfolioLab,
  armazenamento: Pick<Storage, 'getItem' | 'setItem'> | null =
    typeof window !== 'undefined' ? window.localStorage : null,
): EntradaPortfolioLab[] {
  const atuais = lerPortfolioLab(armazenamento).filter((item) => item.sessaoId !== entrada.sessaoId)
  const proximos = [entrada, ...atuais]
  gravarPortfolioLab(proximos, armazenamento)
  return proximos
}

export function filtrarPortfolioLabPorCenario(
  entradas: readonly EntradaPortfolioLab[],
  cenarioId: string,
): EntradaPortfolioLab[] {
  if (!cenarioId || cenarioId === 'todos') return [...entradas]
  return entradas.filter((e) => e.cenarioId === cenarioId)
}

/** Marca que o usuário iniciou uma Prova de Lab (modo prova) para vincular quando concluir na Mesa. */
export function registrarInicioProvaLab(
  missao: IdMissao,
  agora: Date,
  armazenamento: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): boolean {
  if (!armazenamento) return false
  const pendente: ProvaLabPendente = { missao, iniciadaEm: agora.toISOString() }
  return gravarChave(armazenamento, CHAVE_PROVA_LAB_PENDENTE, JSON.stringify(pendente))
}

export function lerProvaLabPendente(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): ProvaLabPendente | null {
  if (!armazenamento) return null
  const dado = analisarObjetoJson(lerChave(armazenamento, CHAVE_PROVA_LAB_PENDENTE))
  if (!dado) return null
  if (!ehTexto(dado.missao) || !ehIdMissao(dado.missao)) return null
  if (!ehDataIso(dado.iniciadaEm)) return null
  return { missao: dado.missao, iniciadaEm: dado.iniciadaEm }
}

/**
 * Verifica se há uma Prova de Lab pendente já concluída nos `registros` e a promove
 * para o Portfólio da Prova de Lab (`itfs_portfolio_lab_v1`), limpando a pendência.
 */
export function sincronizarProvasLabDeRegistros(
  registros: readonly RegistroDeMissao[],
  armazenamento: { getItem: Storage['getItem']; setItem: Storage['setItem']; removeItem?: Storage['removeItem'] } | null =
    typeof window !== 'undefined' ? window.localStorage : null,
): EntradaPortfolioLab[] {
  const atuais = lerPortfolioLab(armazenamento)
  const pendente = lerProvaLabPendente(armazenamento)
  if (!pendente || !armazenamento) return atuais

  const jaRegistrados = new Set(atuais.map((item) => item.sessaoId))
  const concluida = registros.find(
    (reg) =>
      reg.missao === pendente.missao &&
      reg.concluidoEm >= pendente.iniciadaEm &&
      !jaRegistrados.has(reg.sessaoId),
  )

  if (!concluida) return atuais

  const entrada = criarEntradaPortfolioLab(concluida)
  const proximos = registrarEntradaPortfolioLab(entrada, armazenamento)
  if (typeof armazenamento.removeItem === 'function') {
    armazenamento.removeItem(CHAVE_PROVA_LAB_PENDENTE)
  } else {
    gravarChave(armazenamento, CHAVE_PROVA_LAB_PENDENTE, '')
  }
  return proximos
}
