import type { ApiTeorico, QuestaoPublica, VerificacaoQuestao } from '../api/teorico'
import { PerguntasProntas } from './PerguntasProntas'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

interface Props {
  questao: QuestaoPublica
  posicao: number
  total: number
  selecionadas: readonly string[]
  /** Só existe na Prática, depois de verificar. */
  verificacao?: VerificacaoQuestao
  pratica: boolean
  marcada: boolean
  ocupado: boolean
  api: ApiTeorico
  aoSelecionar: (alternativaId: string) => void
  aoVerificar: () => void
  aoMarcar: () => void
  aoAnterior: () => void
  aoProxima: () => void
}

/** Tela de uma questão. Na Prática verifica e explica na hora. Na prova, só destaca a escolha. */
export function CartaoQuestao({
  questao, posicao, total, selecionadas, verificacao, pratica, marcada, ocupado, api,
  aoSelecionar, aoVerificar, aoMarcar, aoAnterior, aoProxima,
}: Props) {
  const multipla = questao.selecao === 'multipla'
  const ultima = posicao === total - 1
  const nomeGrupo = `alternativas-${questao.id}`

  return (
    <article className="teorico-questao" aria-labelledby="teorico-enunciado">
      <div className="teorico-questao-topo">
        <span className="teorico-etiqueta">{questao.topico}</span>
        <span className="teorico-etiqueta teorico-etiqueta-suave">Nível {questao.nivel}</span>
        {marcada && <span className="teorico-selo" data-selo="revisar">Marcada para revisar</span>}
        <button type="button" className="teorico-botao teorico-botao-link" aria-pressed={marcada} onClick={aoMarcar}>
          {marcada ? 'Desmarcar revisão' : 'Marcar para revisar'}
        </button>
      </div>

      <h2 id="teorico-enunciado" className="teorico-enunciado">
        {questao.enunciado}
      </h2>
      {multipla && <p className="teorico-dica">Selecione todas as corretas.</p>}

      <fieldset className="teorico-alternativas" disabled={Boolean(verificacao)}>
        <legend className="sr-only">Alternativas da questão {posicao + 1}</legend>
        {questao.alternativas.map((alt, i) => {
          const marcadaAlt = selecionadas.includes(alt.id)
          const ehGabarito = verificacao?.gabarito.includes(alt.id) ?? false
          const estado = verificacao
            ? ehGabarito
              ? 'correta'
              : marcadaAlt
                ? 'errada'
                : 'neutra'
            : marcadaAlt
              ? 'escolhida'
              : 'neutra'
          return (
            <label key={alt.id} className="teorico-alternativa" data-estado={estado}>
              <input
                type={multipla ? 'checkbox' : 'radio'}
                name={nomeGrupo}
                value={alt.id}
                checked={marcadaAlt}
                onChange={() => aoSelecionar(alt.id)}
              />
              <span className="teorico-letra" aria-hidden="true">{LETRAS[i] ?? i + 1}</span>
              <span className="teorico-alternativa-texto">{alt.texto}</span>
              {verificacao && ehGabarito && <span className="teorico-selo" data-selo="correta">Correta</span>}
              {verificacao && !ehGabarito && marcadaAlt && <span className="teorico-selo" data-selo="incorreta">Sua resposta</span>}
            </label>
          )
        })}
      </fieldset>

      {verificacao && <Feedback questao={questao} verificacao={verificacao} api={api} />}

      <div className="teorico-acoes">
        <button type="button" className="teorico-botao teorico-botao-secundario" onClick={aoAnterior} disabled={posicao === 0}>
          Anterior
        </button>
        {pratica && !verificacao && (
          <button
            type="button"
            className="teorico-botao teorico-botao-primario"
            onClick={aoVerificar}
            disabled={selecionadas.length === 0 || ocupado}
          >
            Verificar resposta
          </button>
        )}
        <button type="button" className="teorico-botao teorico-botao-secundario" onClick={aoProxima} disabled={ultima}>
          {pratica && !verificacao ? 'Pular' : 'Próxima'}
        </button>
      </div>
    </article>
  )
}

function Feedback({ questao, verificacao, api }: { questao: QuestaoPublica; verificacao: VerificacaoQuestao; api: ApiTeorico }) {
  return (
    <section
      className="teorico-feedback"
      data-resultado={verificacao.correta ? 'correta' : 'incorreta'}
      aria-label="Explicação da questão"
      aria-live="polite"
    >
      <h3 className="teorico-feedback-titulo">{verificacao.correta ? 'Correto!' : 'Incorreto'}</h3>
      <ExplicacaoEstruturada questao={questao} verificacao={verificacao} />
      <PerguntasProntas questaoId={questao.id} api={api} />
    </section>
  )
}
export function ExplicacaoEstruturada({ questao, verificacao }: { questao: QuestaoPublica; verificacao: Pick<VerificacaoQuestao, 'explicacao'> }) {
  const textoDe = (id: string) => questao.alternativas.find((a) => a.id === id)?.texto ?? id
  const { explicacao } = verificacao
  return (
    <div className="teorico-explicacao">
      <h4>Opção correta</h4>
      <p>{explicacao.correta}</p>
      <h4>Opções incorretas</h4>
      <ul>
        {explicacao.incorretas.map((i) => (
          <li key={i.alternativaId}>
            <strong>{textoDe(i.alternativaId)}:</strong> {i.texto}
          </li>
        ))}
      </ul>
      <h4>Referência</h4>
      <p>
        <a href={explicacao.referencia} target="_blank" rel="noreferrer noopener">
          Abrir documentação
        </a>
      </p>
    </div>
  )
}
