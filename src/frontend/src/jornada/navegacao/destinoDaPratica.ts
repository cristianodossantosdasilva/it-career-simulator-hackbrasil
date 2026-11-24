import type { RegistroDeVoo } from '../armazenamento/registrosVoo'
import { type IdEscala, type IdMissao, escalaDaMissao } from '../catalogos/catalogoRotas'
import { decidirPortaoDaMissao } from './portoes'
import { enderecoDe } from './rotas'

export const TEXTO_MISSAO_EM_PREPARACAO = 'Este cenário ainda está em preparação no simulador.'

/** Para onde um atalho de prática (Aulas, Credencial) leva o aluno, com o mesmo portão da Mesa de Trabalho. */
export type DestinoDaPratica =
  | { tipo: 'cabine'; endereco: string }
  /** Missão ainda bloqueada ou em preparação: o atalho mostra o aviso e leva ao Plano de Carreira, nunca à Mesa de Trabalho. */
  | { tipo: 'plano-de-voo'; endereco: string; aviso: string }

/** Texto do aviso de etapa bloqueada, igual na Mesa de Trabalho e nos atalhos de prática. */
export function textoEscalaBloqueada(missao: string, escalaNecessaria: IdEscala): string {
  const local = escalaDaMissao(missao)
  const anterior = local?.rota.escalas.find((escala) => escala.id === escalaNecessaria)?.nome ?? 'a etapa anterior'
  return `A etapa ${local?.escala.nome} ainda não está liberada. Conclua as missões disponíveis de ${anterior} no Plano de Carreira.`
}

/**
 * Pura. Com o portão da Missão aberto (etapa liberada pelos registros ou modo de demonstração ativo), o
 * destino é a Mesa de Trabalho da missão. Etapa bloqueada ou missão em preparação leva ao Plano de Carreira com o aviso.
 */
export function destinoDaPratica(
  missao: IdMissao,
  registros: readonly RegistroDeVoo[],
  modoDemonstracao: boolean,
): DestinoDaPratica {
  const decisao = decidirPortaoDaMissao(missao, registros, modoDemonstracao)
  if (decisao.tipo === 'exibir') {
    return { tipo: 'cabine', endereco: enderecoDe({ pagina: 'cabine', missao, semente: null, causa: null, nova: false }) }
  }
  const endereco = enderecoDe({ pagina: 'plano-de-voo' })
  if (decisao.tipo === 'aviso-escala-bloqueada') {
    return { tipo: 'plano-de-voo', endereco, aviso: textoEscalaBloqueada(missao, decisao.escalaNecessaria) }
  }
  return { tipo: 'plano-de-voo', endereco, aviso: TEXTO_MISSAO_EM_PREPARACAO }
}
