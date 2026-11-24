import type { CartaoEmbarque, PerguntaCheckIn } from '../armazenamento/cartaoEmbarque'
import { CATALOGO_ROTAS, type IdRota, rotaPorId } from './catalogoRotas'
import {
  JUSTIFICATIVAS,
  ROTEIRO_CHECKIN,
  TEXTOS_RITMO,
  VERSAO_ROTEIRO,
} from './catalogoVocacional'

export type RespostasCheckIn = Readonly<Record<PerguntaCheckIn, string>>

export interface Indicacao {
  rotaId: IdRota
  justificativa: string
  ritmo: 'estudar' | 'praticar'
}

/** Rota que sempre existe e está disponível: o destino de quem recebe uma indicação ainda indisponível. */
export const ROTA_PADRAO_DE_EMBARQUE: IdRota = 'suporte-ti'

function opcaoEscolhida(pergunta: PerguntaCheckIn, opcaoId: string) {
  const alvo = ROTEIRO_CHECKIN.perguntas.find((item) => item.id === pergunta)
  return alvo?.opcoes.find((opcao) => opcao.id === opcaoId) ?? null
}

/**
 * Soma os pesos. Maior soma vence; empate pela ordem de CATALOGO_ROTAS (Suporte de TI primeiro).
 * Pura e total: sem rede, sem IA e sem aleatoriedade. Identificador de resposta desconhecido não soma.
 */
export function indicarRota(respostas: RespostasCheckIn): Indicacao {
  const opcoes = (['interesse', 'situacao', 'ritmo'] as const).map((pergunta) => ({
    pergunta,
    opcao: opcaoEscolhida(pergunta, respostas[pergunta]),
  }))
  const pontosDe = (rotaId: IdRota) => opcoes.reduce((soma, { opcao }) => soma + (opcao?.pesos[rotaId] ?? 0), 0)
  let vencedora = CATALOGO_ROTAS[0].id as IdRota
  let maiorSoma = pontosDe(vencedora)
  for (const rota of CATALOGO_ROTAS) {
    const soma = pontosDe(rota.id)
    if (soma > maiorSoma) {
      vencedora = rota.id
      maiorSoma = soma
    }
  }
  const ritmo = respostas.ritmo === 'estudar' ? 'estudar' : 'praticar'
  const pesaram = opcoes
    .filter(({ opcao }) => (opcao?.pesos[vencedora] ?? 0) > 0)
    .map(({ opcao }) => `"${opcao?.rotulo}"`)
  const trechoRespostas = pesaram.length > 0 ? ` Pesaram na indicação: ${pesaram.join(' e ')}.` : ''
  return {
    rotaId: vencedora,
    justificativa: `${JUSTIFICATIVAS[vencedora]}${trechoRespostas} ${TEXTOS_RITMO[ritmo]}`,
    ritmo,
  }
}

/** A rota indicada, ou a rota padrão quando a indicada ainda não está disponível. */
export function rotaDeEmbarque(indicada: IdRota): IdRota {
  return rotaPorId(indicada)?.status === 'disponivel' ? indicada : ROTA_PADRAO_DE_EMBARQUE
}

/**
 * Cartão_de_Embarque do Diagnóstico comum, montado depois da confirmação. `emitidoEm` é ISO 8601.
 * A rota de perfil sempre está disponível e a primeira etapa é a primeira da rota.
 */
export function montarCartaoDoCheckIn(respostas: RespostasCheckIn, emitidoEm: string): CartaoEmbarque {
  const { rotaId: rotaIndicadaId } = indicarRota(respostas)
  const rotaId = rotaDeEmbarque(rotaIndicadaId)
  const primeiraEscalaId = rotaPorId(rotaId)?.escalas[0]?.id ?? ''
  return {
    versao: 1,
    versaoRoteiro: VERSAO_ROTEIRO,
    rotaIndicadaId,
    rotaId,
    primeiraEscalaId,
    respostas: {
      interesse: respostas.interesse,
      situacao: respostas.situacao,
      ritmo: respostas.ritmo,
    },
    origem: 'checkin',
    emitidoEm,
  }
}
