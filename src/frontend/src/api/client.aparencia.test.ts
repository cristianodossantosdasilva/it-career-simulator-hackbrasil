import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { EXECUCOES_PADRAO, SEMENTE_PADRAO, criarGerador } from '../testes/propriedade'
import { criarArmazemAparencia } from '../tema/armazemAparencia'
import { CATALOGO_TEMAS } from '../tema/catalogo'
import { apiClient } from './client'

interface Requisicao {
  readonly url: string
  readonly metodo: string
  readonly cabecalhos: string
  readonly corpo: string
}

function instalarFetchFalso(): Requisicao[] {
  const capturadas: Requisicao[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      capturadas.push({
        url: String(url),
        metodo: init?.method ?? 'GET',
        cabecalhos: JSON.stringify(init?.headers ?? {}),
        corpo: String(init?.body ?? ''),
      })
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }),
  )
  return capturadas
}

type ChamadaApi = () => Promise<unknown>
const CHAMADAS: readonly ChamadaApi[] = [
  () => apiClient.verificarSaude(),
  () => apiClient.criarSessao({}),
  () => apiClient.obterSessao('sessao-fixa'),
  () => apiClient.executarAcao('sessao-fixa', 'consultar_kb', 3, { termo: 'vpn' }),
  () => apiClient.enviarChat('sessao-fixa', 'cliente', 'Olá, preciso de ajuda', 4),
  () => apiClient.obterAvaliacao('sessao-fixa'),
  () => apiClient.obterReplay('sessao-fixa'),
  () => apiClient.obterResumoCarreira(['sessao-fixa'], 'Aluno'),
]

afterEach(() => {
  vi.unstubAllGlobals()
})

// Feature: temas-selecionaveis, Property 17: Requisições sem dados de aparência
describe('requisições do cliente da API sem dados de aparência', () => {
  it('a lista de requisições é igual com e sem ações de aparência no meio', async () => {
    const gerador = criarGerador(SEMENTE_PADRAO)
    const ids = CATALOGO_TEMAS.map((tema) => tema.id)
    for (let execucao = 0; execucao < EXECUCOES_PADRAO; execucao += 1) {
      const sequencia = gerador.lista((g) => g.inteiro(0, CHAMADAS.length - 1), 6)
      const acoes = sequencia.map(() => gerador.lista((g) => g.inteiro(0, ids.length + 1), 3))

      const semAparencia = instalarFetchFalso()
      for (const indice of sequencia) await CHAMADAS[indice]()
      vi.unstubAllGlobals()

      const comAparencia = instalarFetchFalso()
      const documento = document.implementation.createHTMLDocument('t')
      const armazem = criarArmazemAparencia({
        documento,
        armazenamento: criarArmazenamentoFalso(),
        consultarEsquema: () => null,
        registrar: () => undefined,
      })
      for (const [posicao, indice] of sequencia.entries()) {
        for (const passo of acoes[posicao]) {
          if (passo < ids.length) armazem.escolherTema(ids[passo])
          else armazem.definirContraste(passo === ids.length)
        }
        await CHAMADAS[indice]()
      }
      vi.unstubAllGlobals()

      expect(comAparencia, `execução ${execucao + 1} de ${EXECUCOES_PADRAO} (semente ${SEMENTE_PADRAO})`).toEqual(semAparencia)
      const texto = JSON.stringify(comAparencia)
      for (const proibido of [...ids, 'itfs_tema', 'itfs_contraste', 'data-contraste']) expect(texto).not.toContain(proibido)
    }
  }, 60_000)
})

describe('cliente da API, exemplo', () => {
  it('a criação de sessão envia só o corpo da missão, sem tema', async () => {
    const capturadas = instalarFetchFalso()
    await apiClient.criarSessao({})
    expect(capturadas).toHaveLength(1)
    expect(capturadas[0].corpo).toBe('{}')
  })
})
