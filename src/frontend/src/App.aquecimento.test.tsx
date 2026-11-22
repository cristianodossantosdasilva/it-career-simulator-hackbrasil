import '@testing-library/jest-dom/vitest'
import { cleanup, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { abrirAplicacao, limparNavegador } from './testes/abrirAplicacao'

afterEach(() => {
  cleanup()
  limparNavegador()
  vi.restoreAllMocks()
})

describe('Aquecimento da API', () => {
  it('ao abrir o app chama a saúde da API uma vez e ignora a falha', async () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    abrirAplicacao('/')
    await waitFor(() => expect(espiao).toHaveBeenCalled())
    const urls = espiao.mock.calls.map(([entrada]) => String(entrada))
    expect(urls.some((url) => url.endsWith('/health/live'))).toBe(true)
    expect(urls.every((url) => url.endsWith('/health/live'))).toBe(true)
  })
})
