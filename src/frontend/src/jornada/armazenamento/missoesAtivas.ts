import { type IdMissao, ehIdMissao } from '../catalogos/catalogoRotas'
import { PADRAO_SESSAO } from '../navegacao/rotas'
import { analisarObjetoJson, ehObjeto, gravarChave, lerChave } from './leituraSegura'

export const CHAVE_MISSOES_ATIVAS = 'itfs_missoes_ativas'

/** Sessão aberta por missão, para que a Mesa de Trabalho retome a missão em vez de criar outro (Requirement 7.2). */
export interface MissoesAtivas {
  versao: 1
  ultimaMissao: IdMissao | null
  porMissao: Partial<Record<IdMissao, string>>
}

export const MISSOES_ATIVAS_VAZIO: MissoesAtivas = { versao: 1, ultimaMissao: null, porMissao: {} }

/** Pura e total: mantém só as entradas válidas. Texto inválido equivale a nenhum missão ativa. */
export function analisarMissoesAtivas(texto: string | null): MissoesAtivas {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1) return MISSOES_ATIVAS_VAZIO
  const porMissao: Partial<Record<IdMissao, string>> = {}
  if (ehObjeto(dado.porMissao)) {
    for (const [missao, sessaoId] of Object.entries(dado.porMissao)) {
      if (ehIdMissao(missao) && typeof sessaoId === 'string' && PADRAO_SESSAO.test(sessaoId)) {
        porMissao[missao] = sessaoId
      }
    }
  }
  const ultima = dado.ultimaMissao
  const ultimaMissao = typeof ultima === 'string' && ehIdMissao(ultima) ? ultima : null
  return { versao: 1, ultimaMissao, porMissao }
}

export function serializarMissoesAtivas(missoesAtivas: MissoesAtivas): string {
  return JSON.stringify(missoesAtivas)
}

export function lerMissoesAtivas(armazenamento: Pick<Storage, 'getItem'>): MissoesAtivas {
  return analisarMissoesAtivas(lerChave(armazenamento, CHAVE_MISSOES_ATIVAS))
}

export function gravarMissoesAtivas(armazenamento: Pick<Storage, 'setItem'>, missoesAtivas: MissoesAtivas): boolean {
  return gravarChave(armazenamento, CHAVE_MISSOES_ATIVAS, serializarMissoesAtivas(missoesAtivas))
}

/** Pura: marca a sessão como missão ativa da missão e como último missão. */
export function comMissaoAtiva(missoesAtivas: MissoesAtivas, missao: IdMissao, sessaoId: string): MissoesAtivas {
  return { versao: 1, ultimaMissao: missao, porMissao: { ...missoesAtivas.porMissao, [missao]: sessaoId } }
}
