import { CATALOGO_ROTAS, type IdRota, rotaPorId } from '../catalogos/catalogoRotas'
import { analisarObjetoJson, ehDataIso, ehObjeto, ehTexto, gravarChave, lerChave } from './leituraSegura'

export const CHAVE_CARTAO_PERFIL = 'itfs_cartao_embarque'

export type PerguntaDiagnostico = 'interesse' | 'situacao' | 'ritmo'
export type OrigemCartao = 'diagnostico' | 'diagnostico-rapido'

export interface CartaoPerfil {
  versao: 1
  /** Versão do roteiro do diagnóstico, por exemplo `diagnostico-v1`. */
  versaoRoteiro: string
  /** Resultado de indicarRota, inclusive rota ainda indisponível. */
  rotaIndicadaId: IdRota
  /** Rota de perfil, sempre com status disponível. */
  rotaId: IdRota
  primeiraEtapaId: string
  respostas: Readonly<Record<PerguntaDiagnostico, string>>
  /** diagnostico-rapido: respostas padrão do Diagnóstico_Rápido. */
  origem: OrigemCartao
  /** ISO 8601. */
  emitidoEm: string
}

const PERGUNTAS: readonly PerguntaDiagnostico[] = ['interesse', 'situacao', 'ritmo']
const ORIGENS: readonly OrigemCartao[] = ['diagnostico', 'diagnostico-rapido']

function ehIdRota(valor: unknown): valor is IdRota {
  return CATALOGO_ROTAS.some((rota) => rota.id === valor)
}

/** Pura e total: texto ausente, JSON inválido, versão desconhecida ou campo inválido devolvem nulo. */
export function analisarCartao(texto: string | null): CartaoPerfil | null {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1) return null
  const { versaoRoteiro, rotaIndicadaId, rotaId, primeiraEtapaId, respostas, origem, emitidoEm } = dado
  if (!ehTexto(versaoRoteiro) || versaoRoteiro.length === 0) return null
  if (!ehIdRota(rotaIndicadaId) || !ehIdRota(rotaId)) return null
  const rota = rotaPorId(rotaId)
  if (!rota || rota.status !== 'disponivel') return null
  if (!ehTexto(primeiraEtapaId) || !rota.etapas.some((etapa) => etapa.id === primeiraEtapaId)) return null
  if (!ehObjeto(respostas) || !PERGUNTAS.every((pergunta) => ehTexto(respostas[pergunta]))) return null
  if (!ORIGENS.some((item) => item === origem)) return null
  if (!ehDataIso(emitidoEm)) return null
  return {
    versao: 1,
    versaoRoteiro,
    rotaIndicadaId,
    rotaId,
    primeiraEtapaId,
    respostas: {
      interesse: respostas.interesse as string,
      situacao: respostas.situacao as string,
      ritmo: respostas.ritmo as string,
    },
    origem: origem as OrigemCartao,
    emitidoEm,
  }
}

export function serializarCartao(cartao: CartaoPerfil): string {
  return JSON.stringify(cartao)
}

export function lerCartao(armazenamento: Pick<Storage, 'getItem'>): CartaoPerfil | null {
  return analisarCartao(lerChave(armazenamento, CHAVE_CARTAO_PERFIL))
}

/** Grava só a chave do cartão. Os Registros_de_Missão ficam como estão (Requirement 4.9). */
export function gravarCartao(armazenamento: Pick<Storage, 'setItem'>, cartao: CartaoPerfil): boolean {
  return gravarChave(armazenamento, CHAVE_CARTAO_PERFIL, serializarCartao(cartao))
}
