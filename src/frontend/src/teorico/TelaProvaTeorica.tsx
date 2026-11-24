import { useEffect, useRef, useState } from 'react'
import { type ApiTeorico, apiTeorico } from '../api/teorico'
import { CartaoQuestao } from './CartaoQuestao'
import { MapaQuestoes } from './MapaQuestoes'
import { ResultadoTeorico } from './ResultadoTeorico'
import { type ConfigProva, contarRespondidas, formatarTempo } from './estadoProva'
import { useProvaTeorica } from './useProvaTeorica'
import './teorico.css'

export interface PropsTelaProvaTeorica {
  config: ConfigProva
  titulo: string
  /** Retoma o andamento salvo em vez de sortear outra prova. */
  retomar?: boolean
  /** Sair: o andamento fica salvo e pode ser retomado. */
  aoSair: () => void
  aoNovo?: () => void
  api?: ApiTeorico
}

/**
 * Tela de trabalho do nível Teórico: cabeçalho com "Questão X de N", barra de progresso fina, cronômetro
 * (prova padrão), mapa lateral e finalização com confirmação. Na Prática, o feedback é imediato.
 */
export function TelaProvaTeorica({ config, titulo, retomar = false, aoSair, aoNovo, api = apiTeorico }: PropsTelaProvaTeorica) {
  const p = useProvaTeorica({ config, retomar, api })
  const [confirmando, setConfirmando] = useState(false)
  const titulos = useRef<HTMLHeadingElement>(null)
  const pratica = p.config.formato === 'pratica'

  // Foco no h1 ao entrar e ao mudar de fase, para leitores de tela.
  useEffect(() => {
    if (p.fase === 'resultado') document.getElementById('teorico-titulo-resultado')?.focus()
    else titulos.current?.focus()
  }, [p.fase])

  if (p.fase === 'resultado' && p.resultado && p.prova) {
    return (
      <main className="teorico-tela" aria-labelledby="teorico-titulo-resultado">
        <ResultadoTeorico
          prova={p.prova}
          resultado={p.resultado}
          respostas={p.instantaneo.respostas}
          titulo={titulo}
          aoRefazer={p.refazer}
          aoNovo={aoNovo ?? aoSair}
          aoSair={aoSair}
        />
      </main>
    )
  }

  if (p.fase === 'carregando' || p.fase === 'enviando') {
    return (
      <main className="teorico-tela">
        <h1 ref={titulos} tabIndex={-1}>{titulo}</h1>
        <p role="status">{p.fase === 'carregando' ? 'Preparando as questões.' : 'Corrigindo a prova.'}</p>
      </main>
    )
  }

  if (p.fase === 'erro' || !p.prova || !p.questao) {
    return (
      <main className="teorico-tela">
        <h1 ref={titulos} tabIndex={-1}>{titulo}</h1>
        <p role="alert" className="teorico-erro">{p.erro ?? 'Não foi possível abrir a prova.'}</p>
        <div className="teorico-acoes">
          <button type="button" className="teorico-botao teorico-botao-primario" onClick={p.refazer}>Tentar de novo</button>
          <button type="button" className="teorico-botao teorico-botao-secundario" onClick={aoSair}>Voltar</button>
        </div>
      </main>
    )
  }

  const { prova, questao, indice, instantaneo } = p
  const total = prova.questoes.length
  const respondidas = contarRespondidas(prova.questoes, instantaneo)
  const todasRespondidas = respondidas === total
  const pct = Math.round((100 * respondidas) / total)

  return (
    <main className="teorico-tela">
      <header className="teorico-cabecalho">
        <div className="teorico-cabecalho-linha">
          <h1 ref={titulos} tabIndex={-1} className="teorico-h1">{titulo}</h1>
          <span className="teorico-etiqueta">{pratica ? 'Prática' : 'Padrão'}</span>
          <span className="teorico-posicao">
            Questão <span className="dado-mono">{indice + 1}</span> de <span className="dado-mono">{total}</span>
          </span>
          {!pratica && p.restanteSeg !== null && (
            <span
              className="teorico-cronometro dado-mono"
              data-urgente={p.restanteSeg <= 300}
              role="timer"
              aria-label={`Tempo restante ${formatarTempo(p.restanteSeg)}`}
            >
              {formatarTempo(p.restanteSeg)}
            </span>
          )}
          <button type="button" className="teorico-botao teorico-botao-secundario teorico-sair" onClick={aoSair}>
            Sair
          </button>
        </div>
        <progress className="teorico-barra teorico-barra-fina" value={pct} max={100} aria-label={`${respondidas} de ${total} questões respondidas`} />
        <p className="teorico-dica">
          {pratica
            ? 'Prática: sem cronômetro, com feedback imediato. Seu progresso é salvo ao sair.'
            : 'Prova cronometrada: o resultado e a explicação só aparecem no fim. Seu progresso é salvo ao sair.'}
        </p>
        {p.erro && (
          <p role="alert" className="teorico-erro">
            {p.erro}{' '}
            <button type="button" className="teorico-botao teorico-botao-link" onClick={p.descartarErro}>Fechar</button>
          </p>
        )}
      </header>

      <div className="teorico-corpo">
        <CartaoQuestao
          key={questao.id}
          questao={questao}
          posicao={indice}
          total={total}
          selecionadas={instantaneo.respostas[questao.id] ?? []}
          verificacao={instantaneo.verificacoes[questao.id]}
          pratica={pratica}
          marcada={instantaneo.marcadas.includes(questao.id)}
          ocupado={p.ocupado}
          api={api}
          aoSelecionar={(alt) => p.selecionar(questao.id, alt)}
          aoVerificar={() => void p.verificar(questao.id)}
          aoMarcar={() => p.alternarMarca(questao.id)}
          aoAnterior={() => p.irPara(indice - 1)}
          aoProxima={() => p.irPara(indice + 1)}
        />
        <MapaQuestoes
          questoes={prova.questoes}
          indice={indice}
          instantaneo={instantaneo}
          pratica={pratica}
          aoIr={p.irPara}
          aoFinalizar={() => setConfirmando(true)}
          finalizarDesabilitado={pratica ? respondidas === 0 : false}
        />
      </div>

      {confirmando && (
        <div className="teorico-modal-fundo">
          <div className="teorico-modal" role="dialog" aria-modal="true" aria-labelledby="teorico-modal-titulo">
            <h2 id="teorico-modal-titulo">Finalizar {pratica ? 'a prática' : 'a prova'}?</h2>
            <p>
              Total de questões: <span className="dado-mono">{total}</span>. Respondidas: <span className="dado-mono">{respondidas}</span>.
            </p>
            {!todasRespondidas && <p className="teorico-aviso">Questões sem resposta contam como erradas.</p>}
            <p>Esta ação não pode ser desfeita.</p>
            <div className="teorico-acoes">
              <button type="button" className="teorico-botao teorico-botao-secundario" onClick={() => setConfirmando(false)}>
                Continuar
              </button>
              <button
                type="button"
                className="teorico-botao teorico-botao-sucesso"
                onClick={() => {
                  setConfirmando(false)
                  void p.finalizar()
                }}
              >
                Finalizar agora
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
