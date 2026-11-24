import { type Dispatch, type SetStateAction, createContext, useContext } from 'react'
import type { CarreiraResumoResponse, SessaoProjecao } from '../api/types'
import type { EstadoAcademia } from '../educacao/catalogoEducacional'
import type { usePomodoro } from '../workstation/usePomodoro'
import type { RegistroDeVoo } from './armazenamento/registrosVoo'
import type { IdMissao } from './catalogos/catalogoRotas'

export type Aba = 'itsm' | 'chat' | 'simudesk' | 'kb'


export interface PassosTriagem {
  politica: boolean
  token: boolean
  recusado: boolean
}

export interface OpcoesAberturaVoo {
  semente?: number
  causa?: string
  /** Verdadeiro sempre cria uma sessão nova. */
  nova: boolean
}

export type ResultadoAberturaVoo =
  | { tipo: 'pronto'; sessaoId: string; retomada: boolean }
  | { tipo: 'sessao-indisponivel'; sessaoId: string }
  | { tipo: 'rede'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }

export interface ValorAcademia {
  estadoAcademia: EstadoAcademia
  atualizarEstadoAcademia: (updater: (prev: EstadoAcademia) => EstadoAcademia) => void
  resumoCarreira: CarreiraResumoResponse | null
  apelido: string
  setApelido: Dispatch<SetStateAction<string>>
  atualizarResumoCarreira: (ids?: string[], nome?: string) => Promise<void>
  pomodoro: ReturnType<typeof usePomodoro>
}

export interface ValorVoo {
  sessaoId: string | null
  sessao: SessaoProjecao | null
  aba: Aba
  setAba: Dispatch<SetStateAction<Aba>>
  gaveta: 'notas' | 'tutor' | null
  setGaveta: Dispatch<SetStateAction<'notas' | 'tutor' | null>>
  ocupado: boolean
  aviso: string | null
  setAviso: Dispatch<SetStateAction<string | null>>
  passosTriagem: PassosTriagem
  historicoTerminal: { cmd: string; saida: string; priv: string }[]
  artigoKbSelecionado: string | null
  abrirKbDoItsm: (artigoId: string) => void
  fecharArtigoKb: () => void
  /** Usa a sessão em memória, retoma a registrada em `itfs_voos_ativos` ou cria outra. */
  abrirVoo: (missao: IdMissao, opcoes: OpcoesAberturaVoo) => Promise<ResultadoAberturaVoo>
  /** Último Registro_de_Voo gravado a partir da avaliação do Juiz 360º nesta sessão. */
  registroRecente: RegistroDeVoo | null
  /** A consulta da avaliação no fim da missão falhou. O turno continua. */
  falhaRegistro: boolean
  tentarRegistrarDeNovo: () => Promise<void>
  executarAcao: (tipo: string, dados?: Record<string, unknown>) => Promise<void>
  enviarChat: (persona: 'cliente' | 'techlead', mensagem: string) => Promise<void>
}

export const ContextoAcademia = createContext<ValorAcademia | null>(null)
export const ContextoVoo = createContext<ValorVoo | null>(null)

export function useAcademia(): ValorAcademia {
  const valor = useContext(ContextoAcademia)
  if (!valor) throw new Error('useAcademia precisa estar dentro de ProvedorJornada')
  return valor
}

export function useVoo(): ValorVoo {
  const valor = useContext(ContextoVoo)
  if (!valor) throw new Error('useVoo precisa estar dentro de ProvedorJornada')
  return valor
}
