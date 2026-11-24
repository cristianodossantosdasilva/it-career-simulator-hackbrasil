import type { CartaoPerfil } from '../armazenamento/cartaoPerfil'
import type { RegistroDeMissao } from '../armazenamento/registrosMissao'
import { type IdEtapa, etapaDaMissao } from '../catalogos/catalogoRotas'
import { calcularProgressoRota } from '../progressoRota'
import { type RotaResolvida, enderecoDe } from './rotas'

export type DecisaoPortao =
  | { tipo: 'exibir' }
  /** Sempre com substituição de histórico. */
  | { tipo: 'redirecionar'; para: string }
  | { tipo: 'aviso-missao-em-preparacao' }
  | { tipo: 'aviso-etapa-bloqueada'; etapaNecessaria: IdEtapa }

export const DESTINO_SEM_CARTAO = enderecoDe({ pagina: 'diagnostico', motivo: 'sem-cartao', rapido: false })

/**
 * Pura. Regras em ordem: sem cartão válido no Plano de Carreira ou na Mesa de Trabalho redireciona para o Diagnóstico;
 * Mesa de Trabalho de Missão em preparação mostra aviso (o status das Causas não entra); Mesa de Trabalho de etapa
 * bloqueada pelos registros mostra aviso só com o modo de demonstração inativo; as demais exibem. Os
 * portões do cartão e da Missão em preparação valem com o modo ativo ou inativo.
 */
export function decidirPortao(
  rota: RotaResolvida,
  cartao: CartaoPerfil | null,
  registros: readonly RegistroDeMissao[],
  modoDemonstracao = false,
): DecisaoPortao {
  if ((rota.pagina === 'plano-de-carreira' || rota.pagina === 'mesa-de-trabalho') && !cartao) {
    return { tipo: 'redirecionar', para: DESTINO_SEM_CARTAO }
  }
  if (rota.pagina !== 'mesa-de-trabalho') return { tipo: 'exibir' }
  return decidirPortaoDaMissao(rota.missao, registros, modoDemonstracao)
}

/**
 * Pura. A parte do portão que depende só da Missão: em preparação mostra aviso, e a etapa bloqueada
 * pelos registros mostra aviso só com o modo de demonstração inativo. Quem leva o aluno à Mesa de Trabalho por
 * outro caminho (Aulas, Credencial) usa a mesma decisão da Mesa de Trabalho.
 */
export function decidirPortaoDaMissao(
  missao: string,
  registros: readonly RegistroDeMissao[],
  modoDemonstracao = false,
): DecisaoPortao {
  const local = etapaDaMissao(missao)
  if (!local) return { tipo: 'exibir' }
  if (local.missao.status !== 'disponivel') return { tipo: 'aviso-missao-em-preparacao' }

  if (modoDemonstracao) return { tipo: 'exibir' }
  const visao = calcularProgressoRota(local.rota, registros, { modoDemonstracao: false })[local.indice]
  if (visao.estado === 'bloqueada' && visao.etapaNecessaria) {
    return { tipo: 'aviso-etapa-bloqueada', etapaNecessaria: visao.etapaNecessaria.id }
  }
  return { tipo: 'exibir' }
}
