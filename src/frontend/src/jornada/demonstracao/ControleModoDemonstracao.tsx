import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import {
  ESTADO_MODO_ATIVADO,
  ESTADO_MODO_DESATIVADO,
  EXPLICACAO_MODO,
  ROTULO_CONTROLE_MODO,
  TITULO_SECAO_MODO,
} from './textosDemonstracao'

/**
 * Seção do Plano de Carreira com o interruptor do modo de demonstração. O clique e as teclas Espaço e Enter
 * (ativação nativa do botão) alternam o modo. O estado vai em texto, ícone e `aria-checked`.
 */
export function ControleModoDemonstracao() {
  const { modoDemonstracao, definirModoDemonstracao } = useArmazenamentoJornada()
  const idTitulo = useId()
  const idExplicacao = useId()
  const idRotulo = useId()
  return (
    <section id="modo-demonstracao" className="secao-jornada" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{TITULO_SECAO_MODO}</h2>
      <button
        type="button"
        role="switch"
        aria-checked={modoDemonstracao}
        aria-labelledby={idRotulo}
        aria-describedby={idExplicacao}
        className="controle-modo-demonstracao"
        onClick={() => definirModoDemonstracao(!modoDemonstracao, 'plano-de-voo')}
      >
        <Icone nome={modoDemonstracao ? 'modo-ativo' : 'modo-inativo'} tamanho={20} />
        <span id={idRotulo} className="controle-modo-demonstracao-rotulo">
          {ROTULO_CONTROLE_MODO}
        </span>
        <span className="controle-modo-demonstracao-estado">
          {modoDemonstracao ? ESTADO_MODO_ATIVADO : ESTADO_MODO_DESATIVADO}
        </span>
      </button>
      <p id={idExplicacao} className="escala-nota">
        {EXPLICACAO_MODO}
      </p>
    </section>
  )
}