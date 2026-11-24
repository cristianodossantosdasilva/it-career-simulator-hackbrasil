import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AvaliacaoResponse, SessaoProjecao } from '../../api/types'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_REGISTROS_MISSAO, lerRegistros } from '../armazenamento/registrosMissao'
import { CHAVE_MISSOES_ATIVAS, lerMissoesAtivas, serializarMissoesAtivas } from '../armazenamento/missoesAtivas'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { type ResultadoAberturaMissao, type ValorMissao, useMissao } from '../contextosJornada'
import { ProvedorJornada } from '../ProvedorJornada'

function projecao(cenarioId: string, statusChamado = 'Aberto'): SessaoProjecao {
  return {
    carreira: { cargoAtual: 'N1', xpTotal: 0, missoesConcluidas: [] },
    chamados: [
      {
        id: 'INC-1',
        titulo: 'Chamado',
        descricao: '',
        solicitante: 'Ana',
        status: statusChamado,
        categoria: null,
        urgencia: null,
        impacto: null,
        prioridade: null,
        abertoEmMinuto: 0,
        slaAlvoMinuto: null,
        resolvidoEmMinuto: null,
        slaVencido: false,
        responsavel: null,
        nivelAtendimento: null,
        problemaId: null,
        notas: [],
      },
    ],
    problemas: [],
    estacao: {
      privilegio: 'usuario',
      gruposPorUsuario: {},
      dnsServidor: {},
      dnsCacheEstacao: {},
      servicos: [],
      compartilhamentoAcessivel: false,
      firewallAtivo: true,
      logs: [],
      comandosSuportados: [],
    },
    dialogo: {
      acessoRemotoLiberado: false,
      idAcessoRemoto: null,
      pinAcessoRemoto: null,
      identidadeValidada: false,
      pistasSolicitadas: 0,
      usuarioConfirmouFuncionamento: false,
      mensagens: [],
    },
    meta: { cenarioId, semente: 1, nivel: 'N1', versaoManifesto: '1.2.0', minutoSimulado: 0, ultimoSeq: 1 },
    ultimoSeq: 1,
  }
}

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

interface Chamada {
  metodo: string
  url: string
  corpo: string | null
}

/** fetch simulado por rota da API, registrando cada chamada. */
function simularApi(opcoes: { missao: string; obterStatus?: number; avaliacao?: AvaliacaoResponse }) {
  const chamadas: Chamada[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (entrada, init) => {
    const url = String(entrada)
    const metodo = init?.method ?? 'GET'
    chamadas.push({ metodo, url, corpo: typeof init?.body === 'string' ? init.body : null })
    if (metodo === 'POST' && url.endsWith('/api/sessoes')) return json({ sessaoId: 'sessao-nova', semente: 1, ultimoSeq: 0 })
    if (url.endsWith('/acoes')) return json({ eventos: [], projecao: projecao(opcoes.missao, 'Resolvido') })
    if (url.endsWith('/avaliacao')) return json(opcoes.avaliacao ?? { concluida: false, criterios: [], incidenteSeguranca: false, xpTotal: 0, resumo: '' })
    if (url.includes('/api/carreira/resumo')) return json({}, 500)
    if (opcoes.obterStatus && opcoes.obterStatus !== 200) return json({ detail: 'Sessao nao encontrada.' }, opcoes.obterStatus)
    return json(projecao(opcoes.missao))
  })
  return chamadas
}

function AbrirAoMontar({ missao, aoResultado, aoValor }: {
  missao: IdMissao
  aoResultado: (r: ResultadoAberturaMissao) => void
  aoValor?: (v: ValorMissao) => void
}) {
  const missaoAberta = useMissao()
  aoValor?.(missaoAberta)
  const { abrirMissao } = missaoAberta
  useEffect(() => {
    void abrirMissao(missao, { nova: false }).then(aoResultado)
  }, [abrirMissao, missao, aoResultado])
  return null
}

function montar(missao: IdMissao, armazenamento: Storage, aoValor?: (v: ValorMissao) => void) {
  const resultados: ResultadoAberturaMissao[] = []
  const aoResultado = (r: ResultadoAberturaMissao) => resultados.push(r)
  render(
    <StrictMode>
      <ProvedorJornada armazenamento={armazenamento}>
        <AbrirAoMontar missao={missao} aoResultado={aoResultado} aoValor={aoValor} />
      </ProvedorJornada>
    </StrictMode>,
  )
  return resultados
}

const AVALIACAO_CONCLUIDA: AvaliacaoResponse = {
  concluida: true,
  resumo: 'Latência resolvida com evidência.',
  xpTotal: 300,
  incidenteSeguranca: false,
  criterios: [{ id: 'k1', descricao: 'Leu os logs', atendido: true, eventoSeq: 4, motivo: null, praticaEsperada: null, linkKb: null }],
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('abrirMissao', () => {
  it('em StrictMode faz um único POST /api/sessoes com corpo só com o identificador da Missão', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    const armazenamento = criarArmazenamentoFalso()
    const resultados = montar('pasta-rede-inacessivel', armazenamento)
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    const posts = chamadas.filter((c) => c.metodo === 'POST' && c.url.endsWith('/api/sessoes'))
    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0].corpo ?? '')).toEqual({ cenarioId: 'pasta-rede-inacessivel' })
    expect(resultados.every((r) => r.tipo === 'pronto' && !r.retomada)).toBe(true)
    expect(lerMissoesAtivas(armazenamento).porMissao['pasta-rede-inacessivel']).toBe('sessao-nova')
    expect(JSON.parse(window.localStorage.getItem('itfs_jornada_sessoes') ?? '[]')).toEqual(['sessao-nova'])
  })

  it('retoma a sessão registrada sem POST', async () => {
    const chamadas = simularApi({ missao: 'incidente-massivo' })
    const armazenamento = criarArmazenamentoFalso({
      [CHAVE_MISSOES_ATIVAS]: serializarMissoesAtivas({
        versao: 1,
        ultimaMissao: 'incidente-massivo',
        porMissao: { 'incidente-massivo': 'sessao-antiga' },
      }),
    })
    const resultados = montar('incidente-massivo', armazenamento)
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    expect(chamadas.some((c) => c.metodo === 'POST')).toBe(false)
    expect(chamadas.some((c) => c.url.endsWith('/api/sessoes/sessao-antiga'))).toBe(true)
    expect(resultados[0]).toEqual({ tipo: 'pronto', sessaoId: 'sessao-antiga', retomada: true })
  })

  it('404 na retomada devolve sessao-indisponivel', async () => {
    const chamadas = simularApi({ missao: 'incidente-massivo', obterStatus: 404 })
    const armazenamento = criarArmazenamentoFalso({
      [CHAVE_MISSOES_ATIVAS]: serializarMissoesAtivas({ versao: 1, ultimaMissao: null, porMissao: { 'incidente-massivo': 'sessao-x' } }),
    })
    const resultados = montar('incidente-massivo', armazenamento)
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    expect(resultados[0]).toEqual({ tipo: 'sessao-indisponivel', sessaoId: 'sessao-x' })
    expect(chamadas.some((c) => c.metodo === 'POST')).toBe(false)
  })

  it('grava o Registro_de_Missão com a Vertente da Missão só quando a avaliação está concluída', async () => {
    simularApi({ missao: 'sre-cloud-latencia', avaliacao: AVALIACAO_CONCLUIDA })
    const armazenamento = criarArmazenamentoFalso()
    let missaoAberta: ValorMissao | null = null
    const resultados = montar('sre-cloud-latencia', armazenamento, (v) => (missaoAberta = v))
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    await act(async () => {
      await missaoAberta?.executarAcao('itsm.resolver', { nota: 'ok' })
    })
    await waitFor(() => expect(lerRegistros(armazenamento)).toHaveLength(1))
    const [registro] = lerRegistros(armazenamento)
    expect(registro).toMatchObject({
      sessaoId: 'sessao-nova',
      missao: 'sre-cloud-latencia',
      etapaId: 'n3-senior',
      vertenteId: 'n3-a-redes-nuvem',
      versaoCenario: '1.2.0',
    })
    expect(registro.resultado).toEqual({
      concluida: true,
      resumo: AVALIACAO_CONCLUIDA.resumo,
      xpTotal: 300,
      incidenteSeguranca: false,
      criterios: [{ id: 'k1', descricao: 'Leu os logs', atendido: true }],
    })
    await waitFor(() => expect(missaoAberta?.registroRecente?.sessaoId).toBe('sessao-nova'))
  })

  it('atualiza o resumo da carreira sozinho depois de gravar o Registro_de_Missão, e só nesse caso', async () => {
    const chamadas = simularApi({ missao: 'sre-cloud-latencia', avaliacao: AVALIACAO_CONCLUIDA })
    const armazenamento = criarArmazenamentoFalso()
    let missaoAberta: ValorMissao | null = null
    const resultados = montar('sre-cloud-latencia', armazenamento, (v) => (missaoAberta = v))
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    const resumos = () => chamadas.filter((c) => c.url.includes('/api/carreira/resumo'))
    // A abertura da missão já pede o resumo uma vez.
    await waitFor(() => expect(resumos()).toHaveLength(1))
    await act(async () => {
      await missaoAberta?.executarAcao('itsm.resolver', { nota: 'ok' })
    })
    await waitFor(() => expect(lerRegistros(armazenamento)).toHaveLength(1))
    await waitFor(() => expect(resumos()).toHaveLength(2))
    const ultima = resumos()[1]
    expect(ultima.metodo).toBe('POST')
    expect(JSON.parse(ultima.corpo ?? '{}').sessaoIds).toEqual(['sessao-nova'])
    // O pedido vem depois da avaliação que autorizou a gravação.
    const indiceAvaliacao = chamadas.findIndex((c) => c.url.endsWith('/avaliacao'))
    expect(chamadas.indexOf(ultima)).toBeGreaterThan(indiceAvaliacao)
  })

  it('não pede o resumo de novo quando a avaliação não está concluída', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    const armazenamento = criarArmazenamentoFalso()
    let missaoAberta: ValorMissao | null = null
    const resultados = montar('pasta-rede-inacessivel', armazenamento, (v) => (missaoAberta = v))
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    await act(async () => {
      await missaoAberta?.executarAcao('itsm.resolver')
    })
    await waitFor(() => expect(chamadas.some((c) => c.url.endsWith('/avaliacao'))).toBe(true))
    expect(chamadas.filter((c) => c.url.includes('/api/carreira/resumo'))).toHaveLength(1)
  })

  it('não grava registro quando a avaliação não está concluída', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    const armazenamento = criarArmazenamentoFalso()
    let missaoAberta: ValorMissao | null = null
    const resultados = montar('pasta-rede-inacessivel', armazenamento, (v) => (missaoAberta = v))
    await waitFor(() => expect(resultados.length).toBeGreaterThan(0))
    await act(async () => {
      await missaoAberta?.executarAcao('itsm.resolver')
    })
    await waitFor(() => expect(chamadas.some((c) => c.url.endsWith('/avaliacao'))).toBe(true))
    expect(armazenamento.gravacoes.some((g) => g.chave === CHAVE_REGISTROS_MISSAO)).toBe(false)
    expect(missaoAberta?.registroRecente).toBeNull()
  })
})
