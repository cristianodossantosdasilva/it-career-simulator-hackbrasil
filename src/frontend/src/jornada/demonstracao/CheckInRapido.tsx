import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import { rotaPorId } from '../catalogos/catalogoRotas'
import {
  CHECKIN_RAPIDO,
  ROTEIRO_CHECKIN,
  TEXTO_PONTO_DE_PARTIDA,
  rotuloDaResposta,
} from '../catalogos/catalogoVocacional'
import { indicarRota } from '../catalogos/regrasIndicacao'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { executarPlanoDemonstracao, planejarAtalho, planejarConclusaoCheckInRapido } from './planoDemonstracao'
import {
  AVISO_CARTAO_NO_CHECKIN_RAPIDO,
  ROTULO_ATALHO_EXPERIMENTAR,
  ROTULO_CHECKIN_COMPLETO,
  ROTULO_CONFIRMAR_CHECKIN_RAPIDO,
  TITULO_CHECKIN_RAPIDO,
} from './textosDemonstracao'

/**
 * Conteúdo do Check-in_Rápido (`/check-in?modo=rapido`): as três respostas padrão por extenso e uma
 * confirmação. Sem cartão válido, grava o cartão rápido e embarca. Com cartão, nunca o troca: o botão
 * vira o Atalho_Experimentar. A escolha das respostas não existe aqui, e o texto diz isso.
 */
export function CheckInRapido() {
  const armazenamento = useArmazenamentoJornada()
  const idTitulo = useId()
  const indicacao = indicarRota(CHECKIN_RAPIDO.respostas)
  const rota = rotaPorId(indicacao.rotaId)
  const comCartao = armazenamento.cartao !== null
  function confirmar() {
    const plano = comCartao ? planejarAtalho(armazenamento.cartao) : planejarConclusaoCheckInRapido(new Date())
    executarPlanoDemonstracao(plano, armazenamento)
  }
  return (
    <section className="secao-jornada indicacao-checkin" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{TITULO_CHECKIN_RAPIDO}</h2>
      {comCartao && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Ir para o Plano de voo', href: '/plano-de-voo' }]}>
          {AVISO_CARTAO_NO_CHECKIN_RAPIDO}
        </AvisoHonesto>
      )}
      <p className="pagina-jornada-texto">{CHECKIN_RAPIDO.explicacao}</p>
      <dl className="respostas-checkin-rapido">
        {ROTEIRO_CHECKIN.perguntas.map((pergunta) => (
          <div key={pergunta.id} className="resposta-checkin-rapido">
            <dt>{pergunta.enunciado}</dt>
            <dd>{rotuloDaResposta(pergunta.id, CHECKIN_RAPIDO.respostas[pergunta.id])}</dd>
          </div>
        ))}
      </dl>
      <p className="pagina-jornada-texto">
        {rota ? `Rota indicada: ${rota.nome}. ` : ''}
        {indicacao.justificativa}
      </p>
      <p className="pagina-jornada-texto">{TEXTO_PONTO_DE_PARTIDA}</p>
      <div className="acoes-linha">
        <button type="button" className="btn btn-primary btn-lg" onClick={confirmar}>
          <Icone nome="embarcar" tamanho={20} />
          <span>{comCartao ? ROTULO_ATALHO_EXPERIMENTAR : ROTULO_CONFIRMAR_CHECKIN_RAPIDO}</span>
        </button>
        <LinkInterno href="/check-in" className="btn btn-secondary btn-lg">
          <Icone nome="check-in" tamanho={20} />
          <span>{ROTULO_CHECKIN_COMPLETO}</span>
        </LinkInterno>
      </div>
    </section>
  )
}