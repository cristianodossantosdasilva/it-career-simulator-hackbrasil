import { vi } from 'vitest'
import type { AvaliacaoResponse, ReplayResponse, SessaoProjecao } from '../api/types'

/** Projeção mínima e válida de uma sessão, para testes das páginas da jornada. */
export function projecaoDeTeste(cenarioId: string, statusChamado = 'Aberto'): SessaoProjecao {
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

export function respostaJson(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

export interface ChamadaDeTeste {
  metodo: string
  url: string
  corpo: string | null
}

export const AVALIACAO_EM_ANDAMENTO: AvaliacaoResponse = {
  concluida: false,
  criterios: [],
  incidenteSeguranca: false,
  xpTotal: 0,
  resumo: '',
}

export function replayDeTeste(sessaoId: string, cenarioId: string): ReplayResponse {
  return {
    sessaoId,
    meta: { cenarioId, causa: null, nivel: 'N1', semente: 1, versaoManifesto: '1.2.0' },
    ultimoSeq: 1,
    eventos: [],
    avaliacao: {
      concluida: true,
      resumo: 'Atendimento concluído.',
      xpTotal: 120,
      incidenteSeguranca: false,
      criterios: [
        { id: 'k1', descricao: 'Validou a identidade', atendido: true, eventoSeq: 1, motivo: null, praticaEsperada: null, linkKb: null },
      ],
    },
    curriculo: null,
  }
}

/**
 * fetch simulado por rota da API, registrando cada chamada. `obterSessao` e `replay` aceitam um status
 * de falha (404, 410) ou 'rede' para recusar a conexão.
 */
export function simularApi(opcoes: {
  missao: string
  statusSessao?: number | 'rede'
  statusReplay?: number | 'rede'
  replay?: ReplayResponse
}): ChamadaDeTeste[] {
  const chamadas: ChamadaDeTeste[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (entrada, init) => {
    const url = String(entrada)
    const metodo = init?.method ?? 'GET'
    chamadas.push({ metodo, url, corpo: typeof init?.body === 'string' ? init.body : null })
    if (metodo === 'POST' && url.endsWith('/api/sessoes')) {
      return respostaJson({ sessaoId: 'sessao-nova', semente: 1, ultimoSeq: 0 })
    }
    if (url.endsWith('/avaliacao')) return respostaJson(AVALIACAO_EM_ANDAMENTO)
    if (url.includes('/api/carreira/resumo')) return respostaJson({}, 500)
    if (url.endsWith('/replay')) {
      if (opcoes.statusReplay === 'rede') throw new TypeError('rede recusada')
      if (opcoes.statusReplay && opcoes.statusReplay !== 200) return respostaJson({ detail: 'Sessao nao encontrada.' }, opcoes.statusReplay)
      return respostaJson(opcoes.replay ?? replayDeTeste('sessao-x', opcoes.missao))
    }
    if (opcoes.statusSessao === 'rede') throw new TypeError('rede recusada')
    if (opcoes.statusSessao && opcoes.statusSessao !== 200) {
      return respostaJson({ detail: 'Sessao nao encontrada.' }, opcoes.statusSessao)
    }
    return respostaJson(projecaoDeTeste(opcoes.missao))
  })
  return chamadas
}
