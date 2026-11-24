/**
 * Planejamento puro do Atalho_Experimentar e do Diagnóstico_Rápido. Nada aqui lê armazenamento, chama a API
 * ou grava Registro_de_Missão: o plano só descreve o que o componente deve fazer, nesta ordem (gravar o
 * cartão, ativar o modo, navegar).
 */
import type { CartaoPerfil } from '../armazenamento/cartaoPerfil'
import { MISSAO_DEMONSTRACAO, rotaPorId } from '../catalogos/catalogoRotas'
import { DIAGNOSTICO_RAPIDO, VERSAO_ROTEIRO } from '../catalogos/catalogoVocacional'
import { indicarRota } from '../catalogos/regrasIndicacao'
import type { ValorArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { navegar } from '../navegacao/navegador'
import { enderecoDe } from '../navegacao/rotas'

export interface PlanoDemonstracao {
  /** Nulo: não toca no cartão. */
  gravarCartao: CartaoPerfil | null
  ativarModo: boolean
  destino: string
  substituirHistorico: boolean
}

const DESTINO_DIAGNOSTICO_RAPIDO = enderecoDe({ pagina: 'diagnostico', motivo: null, rapido: true })
const DESTINO_MISSAO_DEMONSTRACAO = enderecoDe({
  pagina: 'mesa-de-trabalho',
  missao: MISSAO_DEMONSTRACAO,
  semente: null,
  causa: null,
  nova: false,
})

/** Atalho_Experimentar no Início, e no Diagnóstico_Rápido quando já existe cartão válido. Nunca grava cartão. */
export function planejarAtalho(cartao: CartaoPerfil | null): PlanoDemonstracao {
  if (!cartao) {
    return { gravarCartao: null, ativarModo: false, destino: DESTINO_DIAGNOSTICO_RAPIDO, substituirHistorico: false }
  }
  return { gravarCartao: null, ativarModo: true, destino: DESTINO_MISSAO_DEMONSTRACAO, substituirHistorico: false }
}

/** Conclusão do Diagnóstico_Rápido sem cartão válido. Substitui a entrada do histórico. */
export function planejarConclusaoDiagnosticoRapido(agora: Date): PlanoDemonstracao {
  const { rotaId } = indicarRota(DIAGNOSTICO_RAPIDO.respostas)
  const cartao: CartaoPerfil = {
    versao: 1,
    versaoRoteiro: VERSAO_ROTEIRO,
    rotaIndicadaId: rotaId,
    rotaId,
    primeiraEscalaId: rotaPorId(rotaId)?.etapas[0]?.id ?? '',
    respostas: { ...DIAGNOSTICO_RAPIDO.respostas },
    origem: 'checkin-rapido',
    emitidoEm: agora.toISOString(),
  }
  return { gravarCartao: cartao, ativarModo: true, destino: DESTINO_MISSAO_DEMONSTRACAO, substituirHistorico: true }
}

/**
 * Executa o plano no mesmo manipulador de evento, nesta ordem: gravar o cartão, ativar o modo e navegar.
 * Se a gravação falhar os valores continuam em memória e a missão abre do mesmo jeito.
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
