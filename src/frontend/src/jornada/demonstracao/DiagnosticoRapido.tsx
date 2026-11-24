import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import { rotaPorId } from '../catalogos/catalogoRotas'
import {
  DIAGNOSTICO_RAPIDO,
  ROTEIRO_DIAGNOSTICO,
  TEXTO_PONTO_DE_PARTIDA,
  rotuloDaResposta,
} from '../catalogos/catalogoVocacional'
import { indicarRota } from '../catalogos/regrasIndicacao'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { executarPlanoDemonstracao, planejarAtalho, planejarConclusaoDiagnosticoRapido } from './planoDemonstracao'
import {
  AVISO_CARTAO_NO_DIAGNOSTICO_RAPIDO,
  ROTULO_ATALHO_EXPERIMENTAR,
  ROTULO_DIAGNOSTICO_COMPLETO,
  ROTULO_CONFIRMAR_DIAGNOSTICO_RAPIDO,
  TITULO_DIAGNOSTICO_RAPIDO,
} from './textosDemonstracao'

/**
 * Conteúdo do Diagnóstico_Rápido (`/diagnostico?modo=rapido`): as três respostas padrão por extenso e uma
 * confirmação. Sem cartão válido, grava o cartão rápido e inicia. Com cartão, nunca o troca: o botão
 * vira o Atalho_Experimentar. A escolha das respostas não existe aqui, e o texto diz isso.
 */
export function DiagnosticoRapido() {
  const armazenamento = useArmazenamentoJornada()
  const idTitulo = useId()
  const indicacao = indicarRota(DIAGNOSTICO_RAPIDO.respostas)
  const rota = rotaPorId(indicacao.rotaId)
  const comCartao = armazenamento.cartao !== null
  function confirmar() {
    const plano = comCartao ? planejarAtalho(armazenamento.cartao) : planejarConclusaoDiagnosticoRapido(new Date())
    executarPlanoDemonstracao(plano, armazenamento)
  }
  return (
    <section className="secao-jornada indicacao-diagnostico" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{TITULO_DIAGNOSTICO_RAPIDO}</h2>
      {comCartao && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Ir para o Plano de Carreira', href: '/plano-de-carreira' }]}>
          {AVISO_CARTAO_NO_DIAGNOSTICO_RAPIDO}
        </AvisoHonesto>
      )}
      <p className="pagina-jornada-texto">{DIAGNOSTICO_RAPIDO.explicacao}</p>
      <dl className="respostas-diagnostico-rapido">
        {ROTEIRO_DIAGNOSTICO.perguntas.map((pergunta) => (
          <div key={pergunta.id} className="resposta-diagnostico-rapido">
            <dt>{pergunta.enunciado}</dt>
            <dd>{rotuloDaResposta(pergunta.id, DIAGNOSTICO_RAPIDO.respostas[pergunta.id])}</dd>
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
          <Icone nome="iniciar" tamanho={20} />
          <span>{comCartao ? ROTULO_ATALHO_EXPERIMENTAR : ROTULO_CONFIRMAR_DIAGNOSTICO_RAPIDO}</span>
        </button>
        <LinkInterno href="/diagnostico" className="btn btn-secondary btn-lg">
          <Icone nome="diagnostico" tamanho={20} />
          <span>{ROTULO_DIAGNOSTICO_COMPLETO}</span>
        </LinkInterno>
      </div>
    </section>
  )
}