import type { RegistroDeMissao } from '../armazenamento/registrosMissao'
import { type IdEtapa, type IdMissao, etapaDaMissao } from '../catalogos/catalogoRotas'
import { decidirPortaoDaMissao } from './portoes'
import { enderecoDe } from './rotas'

export const TEXTO_MISSAO_EM_PREPARACAO = 'Este cenário ainda está em preparação no simulador.'

/** Para onde um atalho de prática (Aulas, Credencial) leva o aluno, com o mesmo portão da Mesa de Trabalho. */
export type DestinoDaPratica =
  | { tipo: 'mesa-de-trabalho'; endereco: string }
  /** Missão ainda bloqueada ou em preparação: o atalho mostra o aviso e leva ao Plano de Carreira, nunca à Mesa de Trabalho. */
  | { tipo: 'plano-de-carreira'; endereco: string; aviso: string }

/** Texto do aviso de etapa bloqueada, igual na Mesa de Trabalho e nos atalhos de prática. */
export function textoEtapaBloqueada(missao: string, etapaNecessaria: IdEtapa): string {
  const local = etapaDaMissao(missao)
  const anterior = local?.rota.etapas.find((etapa) => etapa.id === etapaNecessaria)?.nome ?? 'a etapa anterior'
  return `A etapa ${local?.etapa.nome} ainda não está liberada. Conclua as missões disponíveis de ${anterior} no Plano de Carreira.`
}

/**
 * Pura. Com o portão da Missão aberto (etapa liberada pelos registros ou modo de demonstração ativo), o
 * destino é a Mesa de Trabalho da missão. Etapa bloqueada ou missão em preparação leva ao Plano de Carreira com o aviso.
 */
export function destinoDaPratica(
  missao: IdMissao,
  registros: readonly RegistroDeMissao[],
  modoDemonstracao: boolean,
): DestinoDaPratica {
  const decisao = decidirPortaoDaMissao(missao, registros, modoDemonstracao)
  if (decisao.tipo === 'exibir') {
    return { tipo: 'mesa-de-trabalho', endereco: enderecoDe({ pagina: 'mesa-de-trabalho', missao, semente: null, causa: null, nova: false }) }
  }
  const endereco = enderecoDe({ pagina: 'plano-de-carreira' })
  if (decisao.tipo === 'aviso-etapa-bloqueada') {
    return { tipo: 'plano-de-carreira', endereco, aviso: textoEtapaBloqueada(missao, decisao.etapaNecessaria) }
  }
  return { tipo: 'plano-de-carreira', endereco, aviso: TEXTO_MISSAO_EM_PREPARACAO }
}
