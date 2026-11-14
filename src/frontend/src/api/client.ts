import type {
  AvaliacaoResponse,
  CriarSessaoRequest,
  CriarSessaoResponse,
  ExecutarAcaoRequest,
} from './types'

async function fetchComRetry(url: string, init?: RequestInit, tentativas = 3): Promise<Response> {
  let ultimoErro: unknown
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(url, init)
      if (resp.status !== 503) return resp
      ultimoErro = new Error(`Upstream 503 na tentativa ${i + 1}`)
    } catch (err) {
      ultimoErro = err
    }
    await new Promise((r) => setTimeout(r, 200 * 2 ** i))
  }
  throw ultimoErro
}

export const apiClient = {
  async criarSessao(body: CriarSessaoRequest = {}): Promise<CriarSessaoResponse> {
    const resp = await fetchComRetry('/api/sessoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) throw new Error(`Falha ao criar sessao: ${resp.status}`)
    return resp.json()
  },

  async obterSessao(id: string): Promise<Record<string, unknown>> {
    const resp = await fetchComRetry(`/api/sessoes/${id}`)
    if (!resp.ok) throw new Error(`Falha ao obter sessao: ${resp.status}`)
    return resp.json()
  },

  async executarAcao(id: string, body: ExecutarAcaoRequest): Promise<Record<string, unknown>> {
    const resp = await fetchComRetry(`/api/sessoes/${id}/acoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) throw new Error(`Falha ao executar acao: ${resp.status}`)
    return resp.json()
  },

  async obterAvaliacao(id: string): Promise<AvaliacaoResponse> {
    const resp = await fetchComRetry(`/api/sessoes/${id}/avaliacao`)
    if (!resp.ok) throw new Error(`Falha ao obter avaliacao: ${resp.status}`)
    return resp.json()
  },
}
