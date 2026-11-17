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
 * bloqueada pelos registros mostra aviso; as demais exibem.
 */
export function decidirPortao(
  rota: RotaResolvida,
  cartao: CartaoEmbarque | null,
  registros: readonly RegistroDeVoo[],
): DecisaoPortao {
  if ((rota.pagina === 'plano-de-voo' || rota.pagina === 'cabine') && !cartao) {
    return { tipo: 'redirecionar', para: DESTINO_SEM_CARTAO }
  }
  if (rota.pagina !== 'cabine') return { tipo: 'exibir' }

  const local = escalaDaMissao(rota.missao)
  if (!local) return { tipo: 'exibir' }
  if (local.missao.status !== 'disponivel') return { tipo: 'aviso-missao-em-preparacao' }

  const visao = calcularProgressoRota(local.rota, registros)[local.indice]
  if (visao.estado === 'bloqueada' && visao.escalaNecessaria) {
    return { tipo: 'aviso-escala-bloqueada', escalaNecessaria: visao.escalaNecessaria.id }
  }
  return { tipo: 'exibir' }
}
