import type { CartaoEmbarque } from '../armazenamento/cartaoEmbarque'
import type { RegistroDeVoo } from '../armazenamento/registrosVoo'
import { type IdEscala, escalaDaMissao } from '../catalogos/catalogoRotas'
import { calcularProgressoRota } from '../progressoRota'
import { type RotaResolvida, enderecoDe } from './rotas'

export type DecisaoPortao =
  | { tipo: 'exibir' }
  /** Sempre com substituição de histórico. */
  | { tipo: 'redirecionar'; para: string }
  | { tipo: 'aviso-missao-em-preparacao' }
  | { tipo: 'aviso-escala-bloqueada'; escalaNecessaria: IdEscala }

export const DESTINO_SEM_CARTAO = enderecoDe({ pagina: 'check-in', motivo: 'sem-cartao', rapido: false })

/**
 * Pura. Regras em ordem: sem cartão válido no Plano de voo ou na Cabine redireciona para o Check-in;
 * Cabine de Missão em preparação mostra aviso (o status das Causas não entra); Cabine de escala
 * bloqueada pelos registros mostra aviso só com o modo de demonstração inativo; as demais exibem. Os
 * portões do cartão e da Missão em preparação valem com o modo ativo ou inativo.
 */
export function decidirPortao(
  rota: RotaResolvida,
  cartao: CartaoEmbarque | null,
  registros: readonly RegistroDeVoo[],
  modoDemonstracao = false,
): DecisaoPortao {
  if ((rota.pagina === 'plano-de-voo' || rota.pagina === 'cabine') && !cartao) {
    return { tipo: 'redirecionar', para: DESTINO_SEM_CARTAO }
  }
  if (rota.pagina !== 'cabine') return { tipo: 'exibir' }
  return decidirPortaoDaMissao(rota.missao, registros, modoDemonstracao)
}

/**
 * Pura. A parte do portão que depende só da Missão: em preparação mostra aviso, e a escala bloqueada
 * pelos registros mostra aviso só com o modo de demonstração inativo. Quem leva o aluno à Cabine por
 * outro caminho (Aulas, Credencial) usa a mesma decisão da Cabine.
 */
export function decidirPortaoDaMissao(
  missao: string,
  registros: readonly RegistroDeVoo[],
  modoDemonstracao = false,
): DecisaoPortao {
  const local = escalaDaMissao(missao)
  if (!local) return { tipo: 'exibir' }
  if (local.missao.status !== 'disponivel') return { tipo: 'aviso-missao-em-preparacao' }

  if (modoDemonstracao) return { tipo: 'exibir' }
  const visao = calcularProgressoRota(local.rota, registros, { modoDemonstracao: false })[local.indice]
  if (visao.estado === 'bloqueada' && visao.escalaNecessaria) {
    return { tipo: 'aviso-escala-bloqueada', escalaNecessaria: visao.escalaNecessaria.id }
  }
  return { tipo: 'exibir' }
}
