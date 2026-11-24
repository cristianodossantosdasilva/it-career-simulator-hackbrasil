/** Cliente da API do nível Teórico (/api/teorico/*). O gabarito só chega depois de verificar ou corrigir. */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export type FormatoProva = 'padrao' | 'pratica'
export type EscopoProva = 'completo' | 'personalizado'
export type EstiloExplicacao = 'simples' | 'exemplo' | 'por-que-erradas'

export interface PedidoProva {
  formato: FormatoProva
  escopo: EscopoProva
  topicos?: string[]
  nivel?: 1 | 2 | 3
  quantidade?: number
  semente?: number
}

export interface AlternativaPublica {
  id: string
  texto: string
}

export interface QuestaoPublica {
  id: string
  dominio: string
  topico: string
  nivel: number
  enunciado: string
  alternativas: AlternativaPublica[]
  selecao: 'unica' | 'multipla'
}

export interface ProvaTeorica {
  provaId: string
  semente: number
  duracaoSegundos: number | null
  notaAprovacao: number
  questoes: QuestaoPublica[]
}

export interface ExplicacaoEstruturada {
  correta: string
  incorretas: { alternativaId: string; texto: string }[]
  referencia: string
}

export interface VerificacaoQuestao {
  correta: boolean
  gabarito: string[]
  explicacao: ExplicacaoEstruturada
}

export interface RespostaDaQuestao {
  questaoId: string
  respostas: string[]
}

export interface ResultadoQuestaoApi {
  id: string
  correta: boolean
  gabarito: string[]
  explicacao: ExplicacaoEstruturada
}

export interface CorrecaoProva {
  total: number
  corretas: number
  percentual: number
  aprovado: boolean
  porDominio: { dominio: string; total: number; corretas: number }[]
  questoes: ResultadoQuestaoApi[]
}

export interface TextoExplicado {
  texto: string
  origem: 'ia' | 'fallback'
}

export interface TopicoCatalogo {
  dominio: string
  topico: string
  questoes: number
  niveis: number[]
}

export interface DominioCatalogo {
  id: string
  nome: string
  questoes: number
  topicos: TopicoCatalogo[]
}

export interface CatalogoTopicos {
  dominios: DominioCatalogo[]
  total: number
}

export class ErroTeoricoApi extends Error {
  readonly status: number
  readonly tipo: string
  constructor(status: number, tipo: string, mensagem: string) {
    super(mensagem)
    this.status = status
    this.tipo = tipo
  }
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resp: Response
  try {
    resp = await fetch(`${API_BASE}${caminho}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ErroTeoricoApi(0, 'rede', 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.')
  }
  if (!resp.ok) {
    let tipo = 'erro'
    let detalhe = `O servidor respondeu com erro ${resp.status}.`
    try {
      const corpo = (await resp.json()) as { type?: string; detail?: string }
      tipo = corpo.type ?? tipo
      detalhe = corpo.detail ?? detalhe
    } catch {
      // corpo sem JSON: fica a mensagem padrão
    }
    throw new ErroTeoricoApi(resp.status, tipo, detalhe)
  }
  return (await resp.json()) as T
}

function post<T>(caminho: string, corpo: unknown): Promise<T> {
  return chamar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) })
}

export const apiTeorico = {
  topicos: () => chamar<CatalogoTopicos>('/api/teorico/topicos'),
  criarProva: (pedido: PedidoProva) => post<ProvaTeorica>('/api/teorico/provas', pedido),
  verificar: (questaoId: string, respostas: string[]) =>
    post<VerificacaoQuestao>(`/api/teorico/questoes/${encodeURIComponent(questaoId)}/verificar`, { respostas }),
  corrigir: (pedido: { semente: number; formato: FormatoProva; escopo: EscopoProva; respostas: RespostaDaQuestao[] }) =>
    post<CorrecaoProva>('/api/teorico/provas/corrigir', pedido),
  explicar: (questaoId: string, estilo: EstiloExplicacao) =>
    post<TextoExplicado>(`/api/teorico/questoes/${encodeURIComponent(questaoId)}/explicar`, { estilo }),
}

export type ApiTeorico = typeof apiTeorico
