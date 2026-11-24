import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXECUCOES_PADRAO, SEMENTE_PADRAO, criarGerador } from '../testes/propriedade'
import { ConflitoSeqError, ErroDeRede, SessaoIndisponivelError, apiClient, classificarFalha } from './client'

function resposta(status: number, corpo: unknown = {}): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Executa a promessa avançando os temporizadores falsos das novas tentativas. */
async function capturarErro(promessa: Promise<unknown>): Promise<unknown> {
  const resultado = promessa.then(
    () => null,
    (erro: unknown) => erro,
  )
  await vi.runAllTimersAsync()
  return resultado
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('cliente da API, erros', () => {
  it('404 e 410 viram SessaoIndisponivelError, mantendo a mensagem de 410', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(resposta(404, { detail: 'Sessao nao encontrada.' }))
    const erro404 = await capturarErro(apiClient.obterSessao('sessao-1'))
    expect(erro404).toBeInstanceOf(SessaoIndisponivelError)
    expect((erro404 as SessaoIndisponivelError).status).toBe(404)
    expect((erro404 as Error).message).toBe('Esta sessão não está mais disponível no servidor.')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(resposta(410))
    const erro410 = await capturarErro(apiClient.obterAvaliacao('sessao-1'))
    expect(erro410).toBeInstanceOf(SessaoIndisponivelError)
    expect((erro410 as Error).message).toBe('Sessao expirada (TTL de 30 dias atingido). Inicie uma nova sessao.')
    expect(classificarFalha(erro410)).toBe('sessao-indisponivel')
  })

  it('falha de rede depois das tentativas vira ErroDeRede', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const erro = await capturarErro(apiClient.obterSessao('sessao-1'))
    expect(erro).toBeInstanceOf(ErroDeRede)
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(classificarFalha(erro)).toBe('rede')
  })

  it('409 com ultimoSeq continua como ConflitoSeqError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(resposta(409, { ultimoSeq: 7 }))
    const erro = await capturarErro(apiClient.executarAcao('sessao-1', 'itsm.abrir', 3))
    expect(erro).toBeInstanceOf(ConflitoSeqError)
    expect((erro as ConflitoSeqError).ultimoSeq).toBe(7)
    expect(classificarFalha(erro)).toBe('conflito')
  })

  it('Feature: jornada-de-missao, Property 15: Classificação de falha', async () => {
    const g = criarGerador(SEMENTE_PADRAO)
    for (let execucao = 1; execucao <= EXECUCOES_PADRAO; execucao += 1) {
      const status = g.inteiro(400, 599)
      const lancarTypeError = g.inteiro(0, 9) === 0
      const comSeq = g.inteiro(0, 1) === 1
      vi.restoreAllMocks()
      const fetch = vi.spyOn(globalThis, 'fetch')
      if (lancarTypeError) fetch.mockRejectedValue(new TypeError('Failed to fetch'))
      else fetch.mockImplementation(async () => resposta(status, comSeq ? { ultimoSeq: 2 } : { detail: 'x' }))
      const erro = await capturarErro(apiClient.obterSessao('sessao-1'))
      const esperado = lancarTypeError || [502, 503, 504].includes(status)
        ? 'rede'
        : status === 404 || status === 410
          ? 'sessao-indisponivel'
          : status === 409 && comSeq
            ? 'conflito'
            : 'outro'
      const contexto = `execução ${execucao}, semente ${SEMENTE_PADRAO}, status ${status}, TypeError ${lancarTypeError}`
      expect(classificarFalha(erro), contexto).toBe(esperado)
      expect(erro instanceof ErroDeRede, contexto).toBe(esperado === 'rede')
    }
    expect(classificarFalha(new Error('qualquer'))).toBe('outro')
    expect(classificarFalha('texto')).toBe('outro')
  })
})
