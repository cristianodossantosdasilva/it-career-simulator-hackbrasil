import { analisarObjetoJson, ehDataIso, ehObjeto, ehTexto, gravarChave, lerChave } from '../armazenamento/leituraSegura'

export const CHAVE_REVISAO_ESPACADA = 'itfs_revisao_espacada_v1'

export const CAIXAS_REVISAO = [1, 3, 7, 14] as const
export type CaixaRevisao = (typeof CAIXAS_REVISAO)[number]

export const LIMITE_FILA_HOJE = 10

export type OrigemQuestaoReforco = 'teorico' | 'simulado'

export interface CartaoRevisaoEspacada {
  questaoId: string
  dominio: string
  topico: string
  enunciado: string
  respostaCorreta: string
  explicacao: string
  origem: OrigemQuestaoReforco
  caixa: CaixaRevisao
  /** Data YYYY-MM-DD (UTC) em que o cartão entra na fila "para hoje". */
  proximaRevisao: string
  ultimoErroEm: string
  ultimaRevisaoEm: string | null
  acertosSeguidos: number
}

export interface EstadoRevisaoEspacada {
  versao: 1
  cartoes: readonly CartaoRevisaoEspacada[]
  sequenciaDias: number
  /** Data YYYY-MM-DD (UTC) da última revisão concluída. */
  ultimoDiaRevisao: string | null
}

export interface NovoErroQuestao {
  questaoId: string
  dominio: string
  topico?: string
  enunciado: string
  respostaCorreta?: string
  explicacao?: string
  origem: OrigemQuestaoReforco
}

const PADRAO_DIA = /^\d{4}-\d{2}-\d{2}$/
const MS_POR_DIA = 86_400_000

export function estadoRevisaoVazio(): EstadoRevisaoEspacada {
  return {
    versao: 1,
    cartoes: [],
    sequenciaDias: 0,
    ultimoDiaRevisao: null,
  }
}

/** Converte uma data para a chave diária YYYY-MM-DD em UTC, sem depender de fuso local. */
export function chaveDia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Soma `dias` (pode ser negativo) a uma data sem mutar a instância original. */
export function adicionarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * MS_POR_DIA)
}

/** Calcula a próxima caixa Leitner (1 -> 3 -> 7 -> 14; erro volta para 1). */
export function proximaCaixa(caixaAtual: CaixaRevisao, acertou: boolean): CaixaRevisao {
  if (!acertou) return 1
  const idx = CAIXAS_REVISAO.indexOf(caixaAtual)
  if (idx < 0 || idx >= CAIXAS_REVISAO.length - 1) return 14
  return CAIXAS_REVISAO[idx + 1]
}

function ehCaixaRevisao(valor: unknown): valor is CaixaRevisao {
  return valor === 1 || valor === 3 || valor === 7 || valor === 14
}

function analisarCartao(valor: unknown): CartaoRevisaoEspacada | null {
  if (!ehObjeto(valor)) return null
  const {
    questaoId,
    dominio,
    topico,
    enunciado,
    respostaCorreta,
    explicacao,
    origem,
    caixa,
    proximaRevisao,
    ultimoErroEm,
    ultimaRevisaoEm,
    acertosSeguidos,
  } = valor

  if (!ehTexto(questaoId) || questaoId.length === 0) return null
  if (!ehTexto(dominio) || dominio.length === 0) return null
  if (!ehTexto(enunciado) || enunciado.length === 0) return null
  if (origem !== 'teorico' && origem !== 'simulado') return null
  if (!ehCaixaRevisao(caixa)) return null
  if (!ehTexto(proximaRevisao) || !PADRAO_DIA.test(proximaRevisao)) return null
  if (!ehDataIso(ultimoErroEm)) return null
  if (ultimaRevisaoEm !== null && !ehDataIso(ultimaRevisaoEm)) return null
  if (typeof acertosSeguidos !== 'number' || !Number.isFinite(acertosSeguidos) || acertosSeguidos < 0) return null

  return {
    questaoId,
    dominio,
    topico: ehTexto(topico) ? topico : '',
    enunciado,
    respostaCorreta: ehTexto(respostaCorreta) ? respostaCorreta : '',
    explicacao: ehTexto(explicacao) ? explicacao : '',
    origem,
    caixa,
    proximaRevisao,
    ultimoErroEm,
    ultimaRevisaoEm,
    acertosSeguidos: Math.floor(acertosSeguidos),
  }
}

export function analisarRevisaoEspacada(texto: string | null): EstadoRevisaoEspacada {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1 || !Array.isArray(dado.cartoes)) return estadoRevisaoVazio()
  const cartoes = dado.cartoes.map(analisarCartao).filter((c): c is CartaoRevisaoEspacada => c !== null)
  const sequenciaDias =
    typeof dado.sequenciaDias === 'number' && Number.isFinite(dado.sequenciaDias) && dado.sequenciaDias >= 0
      ? Math.floor(dado.sequenciaDias)
      : 0
  const ultimoDiaRevisao =
    ehTexto(dado.ultimoDiaRevisao) && PADRAO_DIA.test(dado.ultimoDiaRevisao) ? dado.ultimoDiaRevisao : null
  return {
    versao: 1,
    cartoes,
    sequenciaDias,
    ultimoDiaRevisao,
  }
}

export function lerRevisaoEspacada(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): EstadoRevisaoEspacada {
  if (!armazenamento) return estadoRevisaoVazio()
  return analisarRevisaoEspacada(lerChave(armazenamento, CHAVE_REVISAO_ESPACADA))
}

export function gravarRevisaoEspacada(
  estado: EstadoRevisaoEspacada,
  armazenamento: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined' ? window.localStorage : null,
): boolean {
  if (!armazenamento) return false
  return gravarChave(armazenamento, CHAVE_REVISAO_ESPACADA, JSON.stringify(estado))
}

/**
 * Registra questões erradas na revisão espaçada (caixa 1, disponíveis "para hoje").
 * Se a questão já existir, volta para a caixa 1 e atualiza os dados.
 */
export function registrarErros(
  estado: EstadoRevisaoEspacada,
  erros: readonly NovoErroQuestao[],
  agora: Date,
): EstadoRevisaoEspacada {
  if (erros.length === 0) return estado
  const hoje = chaveDia(agora)
  const agoraIso = agora.toISOString()
  const mapa = new Map<string, CartaoRevisaoEspacada>(estado.cartoes.map((c) => [c.questaoId, c]))

  for (const erro of erros) {
    if (!erro.questaoId || !erro.enunciado || !erro.dominio) continue
    mapa.set(erro.questaoId, {
      questaoId: erro.questaoId,
      dominio: erro.dominio,
      topico: erro.topico ?? '',
      enunciado: erro.enunciado,
      respostaCorreta: erro.respostaCorreta ?? '',
      explicacao: erro.explicacao ?? '',
      origem: erro.origem,
      caixa: 1,
      proximaRevisao: hoje,
      ultimoErroEm: agoraIso,
      ultimaRevisaoEm: mapa.get(erro.questaoId)?.ultimaRevisaoEm ?? null,
      acertosSeguidos: 0,
    })
  }

  return {
    ...estado,
    cartoes: [...mapa.values()],
  }
}

/** Atalho para persistir novas questões erradas no armazenamento local. */
export function registrarQuestoesErradas(
  erros: readonly NovoErroQuestao[],
  agora: Date,
  armazenamento: Pick<Storage, 'getItem' | 'setItem'> | null =
    typeof window !== 'undefined' ? window.localStorage : null,
): EstadoRevisaoEspacada {
  const atual = lerRevisaoEspacada(armazenamento)
  const proximo = registrarErros(atual, erros, agora)
  gravarRevisaoEspacada(proximo, armazenamento)
  return proximo
}

/**
 * Retorna a fila "para hoje" com no máximo `limite` itens (padrão 10),
 * ordenada das revisões mais antigas/atrasadas para as mais recentes.
 */
export function filaParaHoje(
  estado: EstadoRevisaoEspacada,
  agora: Date,
  limite = LIMITE_FILA_HOJE,
): readonly CartaoRevisaoEspacada[] {
  const hoje = chaveDia(agora)
  const teto = Math.max(0, Math.floor(limite))
  return estado.cartoes
    .filter((c) => c.proximaRevisao <= hoje)
    .sort((a, b) => {
      if (a.proximaRevisao !== b.proximaRevisao) return a.proximaRevisao.localeCompare(b.proximaRevisao)
      if (a.caixa !== b.caixa) return a.caixa - b.caixa
      return a.ultimoErroEm.localeCompare(b.ultimoErroEm)
    })
    .slice(0, teto)
}

/**
 * Registra o resultado da revisão de um cartão ('Acertei' sobe de caixa, 'Errei' volta à caixa 1)
 * e atualiza o contador de sequência de dias.
 */
export function responderCartao(
  estado: EstadoRevisaoEspacada,
  questaoId: string,
  acertou: boolean,
  agora: Date,
): EstadoRevisaoEspacada {
  const existe = estado.cartoes.some((c) => c.questaoId === questaoId)
  if (!existe) return estado

  const hoje = chaveDia(agora)
  const ontem = chaveDia(adicionarDias(agora, -1))
  const agoraIso = agora.toISOString()

  const cartoes = estado.cartoes.map((cartao) => {
    if (cartao.questaoId !== questaoId) return cartao
    const novaCaixa = proximaCaixa(cartao.caixa, acertou)
    return {
      ...cartao,
      caixa: novaCaixa,
      proximaRevisao: chaveDia(adicionarDias(agora, novaCaixa)),
      ultimaRevisaoEm: agoraIso,
      acertosSeguidos: acertou ? cartao.acertosSeguidos + 1 : 0,
    }
  })

  let sequenciaDias = estado.sequenciaDias
  let ultimoDiaRevisao = estado.ultimoDiaRevisao

  if (ultimoDiaRevisao === hoje) {
    sequenciaDias = Math.max(1, sequenciaDias)
  } else if (ultimoDiaRevisao === ontem) {
    sequenciaDias = sequenciaDias + 1
    ultimoDiaRevisao = hoje
  } else {
    sequenciaDias = 1
    ultimoDiaRevisao = hoje
  }

  return {
    ...estado,
    cartoes,
    sequenciaDias,
    ultimoDiaRevisao,
  }
}

/** Retorna a sequência de dias ativa na data informada (zera se passou de 1 dia sem revisar). */
export function sequenciaAtiva(estado: EstadoRevisaoEspacada, agora: Date): number {
  if (!estado.ultimoDiaRevisao || estado.sequenciaDias <= 0) return 0
  const hoje = chaveDia(agora)
  const ontem = chaveDia(adicionarDias(agora, -1))
  if (estado.ultimoDiaRevisao === hoje || estado.ultimoDiaRevisao === ontem) {
    return estado.sequenciaDias
  }
  return 0
}
