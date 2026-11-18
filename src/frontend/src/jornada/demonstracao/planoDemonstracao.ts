/**
 * Planejamento puro do Atalho_Experimentar e do Check-in_Rápido. Nada aqui lê armazenamento, chama a API
 * ou grava Registro_de_Voo: o plano só descreve o que o componente deve fazer, nesta ordem (gravar o
 * cartão, ativar o modo, navegar).
 */
import type { CartaoEmbarque } from '../armazenamento/cartaoEmbarque'
import { MISSAO_DEMONSTRACAO, rotaPorId } from '../catalogos/catalogoRotas'
import { CHECKIN_RAPIDO, VERSAO_ROTEIRO } from '../catalogos/catalogoVocacional'
import { indicarRota } from '../catalogos/regrasIndicacao'
import type { ValorArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { navegar } from '../navegacao/navegador'
import { enderecoDe } from '../navegacao/rotas'

export interface PlanoDemonstracao {
  /** Nulo: não toca no cartão. */
  gravarCartao: CartaoEmbarque | null
  ativarModo: boolean
  destino: string
  substituirHistorico: boolean
}

const DESTINO_CHECKIN_RAPIDO = enderecoDe({ pagina: 'check-in', motivo: null, rapido: true })
const DESTINO_MISSAO_DEMONSTRACAO = enderecoDe({
  pagina: 'cabine',
  missao: MISSAO_DEMONSTRACAO,
  semente: null,
  causa: null,
  nova: false,
})

/** Atalho_Experimentar no Início, e no Check-in_Rápido quando já existe cartão válido. Nunca grava cartão. */
export function planejarAtalho(cartao: CartaoEmbarque | null): PlanoDemonstracao {
  if (!cartao) {
    return { gravarCartao: null, ativarModo: false, destino: DESTINO_CHECKIN_RAPIDO, substituirHistorico: false }
  }
  return { gravarCartao: null, ativarModo: true, destino: DESTINO_MISSAO_DEMONSTRACAO, substituirHistorico: false }
}

/** Conclusão do Check-in_Rápido sem cartão válido. Substitui a entrada do histórico. */
export function planejarConclusaoCheckInRapido(agora: Date): PlanoDemonstracao {
  const { rotaId } = indicarRota(CHECKIN_RAPIDO.respostas)
  const cartao: CartaoEmbarque = {
    versao: 1,
    versaoRoteiro: VERSAO_ROTEIRO,
    rotaIndicadaId: rotaId,
    rotaId,
    primeiraEscalaId: rotaPorId(rotaId)?.escalas[0]?.id ?? '',
    respostas: { ...CHECKIN_RAPIDO.respostas },
    origem: 'checkin-rapido',
    emitidoEm: agora.toISOString(),
  }
  return { gravarCartao: cartao, ativarModo: true, destino: DESTINO_MISSAO_DEMONSTRACAO, substituirHistorico: true }
}

/**
 * Executa o plano no mesmo manipulador de evento, nesta ordem: gravar o cartão, ativar o modo e navegar.
 * Se a gravação falhar os valores continuam em memória e o voo abre do mesmo jeito.
 */
export function executarPlanoDemonstracao(
  plano: PlanoDemonstracao,
  armazenamento: Pick<ValorArmazenamentoJornada, 'definirCartao' | 'definirModoDemonstracao'>,
  navegarPara: (destino: string, opcoes: { substituir: boolean }) => void = navegar,
): void {
  if (plano.gravarCartao) armazenamento.definirCartao(plano.gravarCartao)
  if (plano.ativarModo) armazenamento.definirModoDemonstracao(true, 'atalho-experimentar')
  navegarPara(plano.destino, { substituir: plano.substituirHistorico })
}
