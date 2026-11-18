import { createContext, useContext } from 'react'
import type { CartaoEmbarque } from './armazenamento/cartaoEmbarque'
import type { OrigemModoDemonstracao } from './armazenamento/modoDemonstracao'
import type { RegistroDeVoo } from './armazenamento/registrosVoo'
import type { VoosAtivos } from './armazenamento/voosAtivos'
import type { IdMissao } from './catalogos/catalogoRotas'
export const AVISO_FALHA_GRAVACAO =
  'Não foi possível guardar neste navegador. Você pode continuar, mas o Brevê não vai lembrar deste voo.'

export interface ValorArmazenamentoJornada {
  cartao: CartaoEmbarque | null
  registros: readonly RegistroDeVoo[]
  voosAtivos: VoosAtivos
  /** Grava o cartão sem tocar nos registros. O valor novo vale em memória mesmo se a gravação falhar. */
  definirCartao: (cartao: CartaoEmbarque) => boolean
  /** Idempotente por `sessaoId`. */
  registrarVoo: (registro: RegistroDeVoo) => boolean
  registrarVooAtivo: (missao: IdMissao, sessaoId: string) => boolean
  /** Modo_de_Demonstração lido uma vez. Inativo em qualquer falha de leitura. */
  modoDemonstracao: boolean
  /**
   * Atualiza a memória, grava só a chave do modo e anuncia o novo estado. Devolve falso se a gravação
   * falhou; o valor novo vale em memória mesmo assim.
   */
  definirModoDemonstracao: (ativo: boolean, origem: OrigemModoDemonstracao) => boolean
  /** O Roteador registra aqui a região viva; devolve a função que desfaz o registro. */
  registrarAnunciador: (anunciar: (texto: string) => void) => () => void
  /** Leitura síncrona do valor mais recente, para quem está fora do ciclo de renderização. */
  lerVoosAtivosAtuais: () => VoosAtivos
  /** Aviso não bloqueante da última gravação que falhou. Nulo quando tudo foi guardado. */
  avisoGravacao: string | null
  dispensarAvisoGravacao: () => void
}

export const ContextoArmazenamentoJornada = createContext<ValorArmazenamentoJornada | null>(null)

export function useArmazenamentoJornada(): ValorArmazenamentoJornada {
  const valor = useContext(ContextoArmazenamentoJornada)
  if (!valor) throw new Error('useArmazenamentoJornada precisa estar dentro de ProvedorArmazenamentoJornada')
  return valor
}
