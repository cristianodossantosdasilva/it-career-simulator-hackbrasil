import { responderMentor } from '../../educacao/catalogoEducacional'
import type { IdPagina } from '../navegacao/rotas'
import { PAPEIS, type PapelComandante } from './catalogoComandante'

export interface ContextoComandante {
  readonly pagina: IdPagina
  /** Só na Mesa de Trabalho: próximo passo lido da projeção que o backend já devolveu. */
  readonly dicaMissao: string | null
}

export const PREFIXO_PROXIMO_PASSO = 'Próximo passo: '

const PEDE_PROXIMO_PASSO = /(agora|próximo|proximo|travei|passo)/i

function normalizar(texto: string): string {
  return texto.trim().toLocaleLowerCase('pt-BR')
}

/**
 * Pura: não lê nem grava armazenamento e não chama a API. Devolve só texto de catálogo (abertura,
 * sugestão ou resposta local de responderMentor) ou o próximo passo da missão.
 */
export function responderComandante(papel: PapelComandante, pergunta: string, contexto: ContextoComandante): string {
  const definicao = PAPEIS[papel]
  const texto = normalizar(pergunta)
  if (texto.length === 0) return definicao.abertura[contexto.pagina] ?? responderMentor(pergunta)
  if (contexto.dicaMissao && PEDE_PROXIMO_PASSO.test(texto)) return `${PREFIXO_PROXIMO_PASSO}${contexto.dicaMissao}`
  const sugestao = definicao.sugestoes.find((item) => normalizar(item.pergunta) === texto)
  if (sugestao) return sugestao.resposta
  return responderMentor(pergunta)
}
