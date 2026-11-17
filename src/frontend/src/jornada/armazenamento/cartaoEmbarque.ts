import { CATALOGO_ROTAS, type IdRota, rotaPorId } from '../catalogos/catalogoRotas'
import { analisarObjetoJson, ehDataIso, ehObjeto, ehTexto, gravarChave, lerChave } from './leituraSegura'

export const CHAVE_CARTAO_EMBARQUE = 'itfs_cartao_embarque'

export type PerguntaCheckIn = 'interesse' | 'situacao' | 'ritmo'
export type OrigemCartao = 'checkin' | 'checkin-rapido'

export interface CartaoEmbarque {
  versao: 1
  /** Versão do roteiro do check-in, por exemplo `checkin-v1`. */
  versaoRoteiro: string
  /** Resultado de indicarRota, inclusive rota ainda indisponível. */
  rotaIndicadaId: IdRota
  /** Rota de embarque, sempre com status disponível. */
  rotaId: IdRota
  primeiraEscalaId: string
  respostas: Readonly<Record<PerguntaCheckIn, string>>
  /** checkin-rapido: respostas padrão do Check-in_Rápido. */
  origem: OrigemCartao
  /** ISO 8601. */
  emitidoEm: string
}

const PERGUNTAS: readonly PerguntaCheckIn[] = ['interesse', 'situacao', 'ritmo']
const ORIGENS: readonly OrigemCartao[] = ['checkin', 'checkin-rapido']

function ehIdRota(valor: unknown): valor is IdRota {
  return CATALOGO_ROTAS.some((rota) => rota.id === valor)
}

/** Pura e total: texto ausente, JSON inválido, versão desconhecida ou campo inválido devolvem nulo. */
export function analisarCartao(texto: string | null): CartaoEmbarque | null {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1) return null
  const { versaoRoteiro, rotaIndicadaId, rotaId, primeiraEscalaId, respostas, origem, emitidoEm } = dado
  if (!ehTexto(versaoRoteiro) || versaoRoteiro.length === 0) return null
  if (!ehIdRota(rotaIndicadaId) || !ehIdRota(rotaId)) return null
  const rota = rotaPorId(rotaId)
  if (!rota || rota.status !== 'disponivel') return null
  if (!ehTexto(primeiraEscalaId) || !rota.escalas.some((escala) => escala.id === primeiraEscalaId)) return null
  if (!ehObjeto(respostas) || !PERGUNTAS.every((pergunta) => ehTexto(respostas[pergunta]))) return null
  if (!ORIGENS.some((item) => item === origem)) return null
  if (!ehDataIso(emitidoEm)) return null
  return {
    versao: 1,
    versaoRoteiro,
    rotaIndicadaId,
    rotaId,
    primeiraEscalaId,
    respostas: {
      interesse: respostas.interesse as string,
      situacao: respostas.situacao as string,
      ritmo: respostas.ritmo as string,
    },
    origem: origem as OrigemCartao,
    emitidoEm,
  }
}

export function serializarCartao(cartao: CartaoEmbarque): string {
  return JSON.stringify(cartao)
}

export function lerCartao(armazenamento: Pick<Storage, 'getItem'>): CartaoEmbarque | null {
  return analisarCartao(lerChave(armazenamento, CHAVE_CARTAO_EMBARQUE))
}

/** Grava só a chave do cartão. Os Registros_de_Voo ficam como estão (Requirement 4.9). */
export function gravarCartao(armazenamento: Pick<Storage, 'setItem'>, cartao: CartaoEmbarque): boolean {
  return gravarChave(armazenamento, CHAVE_CARTAO_EMBARQUE, serializarCartao(cartao))
}
