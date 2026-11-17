import type {
  AvaliacaoResponse,
  CarreiraResumoResponse,
  CriarSessaoRequest,
  CriarSessaoResponse,
  EventoDto,
  ReplayResponse,
  SessaoProjecao,
} from './types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export class ConflitoSeqError extends Error {
  readonly ultimoSeq: number
  constructor(ultimoSeq: number) {
    super('Sessao atualizada em outra requisicao; estado sincronizado.')
    this.ultimoSeq = ultimoSeq
  }
}

/** 404 (sessao_nao_encontrada) ou 410 (sessao_expirada): a sessão não existe mais no servidor. */
export class SessaoIndisponivelError extends Error {
  readonly status: 404 | 410
  constructor(status: 404 | 410) {
    super(
      status === 410
        ? 'Sessao expirada (TTL de 30 dias atingido). Inicie uma nova sessao.'
        : 'Esta sessão não está mais disponível no servidor.',
    )
    this.status = status
  }
}

/** Falha final de rede depois das tentativas: fetch recusado ou 502, 503 e 504 repetidos. */
export class ErroDeRede extends Error {
  constructor(causa: unknown) {
    super(causa instanceof Error ? causa.message : 'Falha de rede ao falar com o servidor.', { cause: causa })
  }
}

export type ClasseFalha = 'sessao-indisponivel' | 'rede' | 'conflito' | 'outro'

export function classificarFalha(erro: unknown): ClasseFalha {
  if (erro instanceof SessaoIndisponivelError) return 'sessao-indisponivel'
  if (erro instanceof ErroDeRede) return 'rede'
  if (erro instanceof ConflitoSeqError) return 'conflito'
  return 'outro'
}

async function fetchComRetry(url: string, init?: RequestInit, tentativas = 3): Promise<Response> {
  let ultimoErro: unknown
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(url, init)
      if (resp.status !== 502 && resp.status !== 503 && resp.status !== 504) return resp
      ultimoErro = new Error(`Servidor acordando (HTTP ${resp.status}, tentativa ${i + 1})`)
    } catch (err) {
      ultimoErro = err
    }
    await new Promise((r) => setTimeout(r, 400 * 2 ** i))
  }
  throw new ErroDeRede(ultimoErro)
}

async function getComRetry(url: string, tentativas = 3): Promise<Response> {
  return fetchComRetry(url, undefined, tentativas)
}

async function extrairErro(resp: Response): Promise<never> {
  const texto = await resp.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(texto)
  } catch {
    // ignore non-json
  }
  const ext = data.extensions as Record<string, unknown> | undefined
  const ultimoSeq = typeof data.ultimoSeq === 'number'
    ? data.ultimoSeq
    : typeof ext?.ultimoSeq === 'number'
      ? ext.ultimoSeq
      : undefined
  if (resp.status === 409 && typeof ultimoSeq === 'number') {
    throw new ConflitoSeqError(ultimoSeq)
  }
  if (resp.status === 404 || resp.status === 410) {
    throw new SessaoIndisponivelError(resp.status)
  }
  const msg = (data.detail as string) || (data.mensagem as string) || `Erro HTTP ${resp.status}`
  throw new Error(msg)
}

export const apiClient = {
  async verificarSaude(): Promise<boolean> {
    try {
      const resp = await fetchComRetry(apiUrl('/health/live'), undefined, 2)
      return resp.ok
    } catch {
      return false
    }
  },

  async criarSessao(body: CriarSessaoRequest = {}): Promise<CriarSessaoResponse> {
    const resp = await fetchComRetry(apiUrl('/api/sessoes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async obterSessao(id: string): Promise<SessaoProjecao> {
    const resp = await getComRetry(apiUrl(`/api/sessoes/${id}`))
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async executarAcao(
    id: string,
    tipo: string,
    seqEsperado: number,
    dados?: Record<string, unknown>,
  ): Promise<{ eventos: EventoDto[]; projecao: SessaoProjecao }> {
    const resp = await fetch(apiUrl(`/api/sessoes/${id}/acoes`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, dados, seqEsperado }),
    })
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async enviarChat(
    id: string,
    persona: 'cliente' | 'techlead',
    mensagem: string,
    seqEsperado: number,
  ): Promise<{ eventos: EventoDto[]; projecao: SessaoProjecao }> {
    const resp = await fetch(apiUrl(`/api/sessoes/${id}/chat`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, mensagem, seqEsperado }),
    })
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async obterAvaliacao(id: string): Promise<AvaliacaoResponse> {
    const resp = await getComRetry(apiUrl(`/api/sessoes/${id}/avaliacao`))
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async obterReplay(id: string): Promise<ReplayResponse> {
    const resp = await getComRetry(apiUrl(`/api/sessoes/${id}/replay`))
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },

  async obterResumoCarreira(sessaoIds: string[], apelido?: string): Promise<CarreiraResumoResponse> {
    const resp = await fetch(apiUrl('/api/carreira/resumo'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessaoIds, apelido }),
    })
    if (!resp.ok) await extrairErro(resp)
    return resp.json()
  },
}
