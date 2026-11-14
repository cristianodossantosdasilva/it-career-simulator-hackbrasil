export interface CriarSessaoRequest {
  cenarioId?: string
  semente?: number
}

export interface CriarSessaoResponse {
  sessaoId: string
  semente: number
  ultimoSeq: number
}

export interface ExecutarAcaoRequest {
  tipo: string
  dados?: Record<string, unknown>
  seqEsperado: number
}

export interface EventoDto {
  seq: number
  tipo: string
  dados: Record<string, unknown>
  ocorridoEm: string
}

export interface CriterioAvaliacaoDto {
  id: string
  descricao: string
  atendido: boolean
  eventoSeq: number | null
}

export interface AvaliacaoResponse {
  concluida: boolean
  criterios: CriterioAvaliacaoDto[]
  incidenteSeguranca: boolean
  resumo: string
}
