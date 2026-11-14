export interface CriarSessaoRequest {
  cenarioId?: string
  versaoManifesto?: string
  causaForcada?: string
  semente?: number
}

export interface CriarSessaoResponse {
  sessaoId: string
  semente: number
  ultimoSeq: number
}

export interface NotaChamadoDto {
  seq: number
  tipo: string
  autor: string
  texto: string
  minutoSimulado: number
}

export interface ChamadoDto {
  id: string
  titulo: string
  descricao: string
  solicitante: string
  status: string
  categoria: string | null
  urgencia: string | null
  impacto: string | null
  prioridade: string | null
  abertoEmMinuto: number
  slaAlvoMinuto: number | null
  resolvidoEmMinuto: number | null
  slaVencido: boolean
  responsavel: string | null
  nivelAtendimento: string | null
  problemaId: string | null
  notas: NotaChamadoDto[]
}

export interface ServicoEstacaoDto {
  nome: string
  status: string
  critico: boolean
}

export interface EstacaoDto {
  privilegio: string
  gruposPorUsuario: Record<string, string[]>
  dnsServidor: Record<string, { host: string; ip: string; ipEsperado: string }>
  dnsCacheEstacao: Record<string, string>
  servicos: ServicoEstacaoDto[]
  compartilhamentoAcessivel: boolean
  firewallAtivo: boolean
  logs: string[]
  comandosSuportados: string[]
}

export interface MensagemDialogoDto {
  seq: number
  remetente: string
  conteudo: string
  minutoSimulado: number
}

export interface DialogoDto {
  acessoRemotoLiberado: boolean
  idAcessoRemoto: string | null
  pinAcessoRemoto: string | null
  identidadeValidada: boolean
  pistasSolicitadas: number
  usuarioConfirmouFuncionamento: boolean
  mensagens: MensagemDialogoDto[]
}

export interface SessaoProjecao {
  carreira: { cargoAtual: string; xpTotal: number; missoesConcluidas: string[] }
  chamados: ChamadoDto[]
  problemas: { id: string; titulo: string; causaRaiz: string | null; resolvido: boolean; chamadosVinculados: string[] }[]
  estacao: EstacaoDto
  dialogo: DialogoDto
  meta: {
    cenarioId: string
    semente: number
    nivel: string
    versaoManifesto: string
    minutoSimulado: number
    ultimoSeq: number
  }
  ultimoSeq: number
}

export interface EventoDto {
  seq: number
  tipo: string
  minutoSimulado: number
  dados?: Record<string, unknown>
  payload?: Record<string, unknown>
  criterios?: string[]
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
  xpTotal: number
  resumo: string
}

export interface ReplayResponse {
  sessaoId: string
  meta: {
    cenarioId: string
    causa: string | null
    nivel: string
    semente: number
    versaoManifesto: string
  }
  ultimoSeq: number
  eventos: EventoDto[]
  avaliacao: AvaliacaoResponse
  curriculo: {
    competencias: string[]
    hash: string
    algoritmo: string
    versaoManifesto: string
  } | null
}
