import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { executarPlanoDemonstracao, planejarAtalho } from './planoDemonstracao'
import { APOIO_ATALHO_EXPERIMENTAR, ROTULO_ATALHO_EXPERIMENTAR } from './textosDemonstracao'

/**
 * Atalho_Experimentar da Página Início. É botão e não link porque, com cartão, a ação também ativa o
 * modo. Sem cartão, leva ao Check-in_Rápido. Nunca troca o cartão.
 */
export function BotaoExperimentar() {
  const armazenamento = useArmazenamentoJornada()
  const idApoio = useId()
  return (
    <div className="atalho-experimentar">
      <button
        type="button"
        className="btn btn-secondary btn-lg"
        aria-describedby={idApoio}
        onClick={() => executarPlanoDemonstracao(planejarAtalho(armazenamento.cartao), armazenamento)}
      >
        <Icone nome="embarcar" tamanho={20} />
        <span>{ROTULO_ATALHO_EXPERIMENTAR}</span>
      </button>
      <p id={idApoio} className="muted atalho-experimentar-apoio">
        {APOIO_ATALHO_EXPERIMENTAR}
      </p>
    </div>
  )
}