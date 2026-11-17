import { type IdMissao, ehIdMissao } from '../catalogos/catalogoRotas'
import { PADRAO_SESSAO } from '../navegacao/rotas'
import { analisarObjetoJson, ehObjeto, gravarChave, lerChave } from './leituraSegura'

export const CHAVE_VOOS_ATIVOS = 'itfs_voos_ativos'

/** Sessão aberta por missão, para que a Cabine retome o voo em vez de criar outro (Requirement 7.2). */
export interface VoosAtivos {
  versao: 1
  ultimaMissao: IdMissao | null
  porMissao: Partial<Record<IdMissao, string>>
}

export const VOOS_ATIVOS_VAZIO: VoosAtivos = { versao: 1, ultimaMissao: null, porMissao: {} }

/** Pura e total: mantém só as entradas válidas. Texto inválido equivale a nenhum voo ativo. */
export function analisarVoosAtivos(texto: string | null): VoosAtivos {
  const dado = analisarObjetoJson(texto)
  if (!dado || dado.versao !== 1) return VOOS_ATIVOS_VAZIO
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

export function serializarVoosAtivos(voos: VoosAtivos): string {
  return JSON.stringify(voos)
}

export function lerVoosAtivos(armazenamento: Pick<Storage, 'getItem'>): VoosAtivos {
  return analisarVoosAtivos(lerChave(armazenamento, CHAVE_VOOS_ATIVOS))
}

export function gravarVoosAtivos(armazenamento: Pick<Storage, 'setItem'>, voos: VoosAtivos): boolean {
  return gravarChave(armazenamento, CHAVE_VOOS_ATIVOS, serializarVoosAtivos(voos))
}

/** Pura: marca a sessão como voo ativo da missão e como último voo. */
export function comVooAtivo(voos: VoosAtivos, missao: IdMissao, sessaoId: string): VoosAtivos {
  return { versao: 1, ultimaMissao: missao, porMissao: { ...voos.porMissao, [missao]: sessaoId } }
}
