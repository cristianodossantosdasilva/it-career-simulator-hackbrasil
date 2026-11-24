import type { ProvaTeorica } from '../api/teorico'
import { ExplicacaoEstruturada } from './CartaoQuestao'
import { formatarTempo } from './estadoProva'
import type { ResultadoFinal } from './useProvaTeorica'

interface Props {
  prova: ProvaTeorica
  resultado: ResultadoFinal
  respostas: Readonly<Record<string, readonly string[]>>
  titulo: string
  aoRefazer: () => void
  aoNovo: () => void
  aoSair: () => void
}

const LIMITE_FORTE = 70

/** Resultado da prova: nota, tempo, desempenho por domínio, fortes e fracos e revisão questão a questão. */
export function ResultadoTeorico({ prova, resultado, respostas, titulo, aoRefazer, aoNovo, aoSair }: Props) {
  const { correcao, duracaoSeg, encerradaPorTempo } = resultado
  const medio = correcao.total > 0 ? Math.round(duracaoSeg / correcao.total) : 0
  const dominios = correcao.porDominio.map((d) => ({ ...d, pct: d.total > 0 ? Math.round((100 * d.corretas) / d.total) : 0 }))
  const fortes = dominios.filter((d) => d.pct >= LIMITE_FORTE)
  const fracos = dominios.filter((d) => d.pct < LIMITE_FORTE)

  return (
    <div className="teorico-resultado">
      <header className="teorico-resultado-topo">
        <h1 tabIndex={-1} id="teorico-titulo-resultado">
          Resultado: {titulo}
        </h1>
        {encerradaPorTempo && <p role="status" className="teorico-dica">O tempo acabou e a prova foi encerrada.</p>}
      </header>

      <section className="teorico-cartao-nota" aria-label="Nota">
        <p className="teorico-percentual" data-aprovado={correcao.aprovado}>
          {Math.round(correcao.percentual)}%
        </p>
        <p>
          <span className="dado-mono">{correcao.corretas}</span> de <span className="dado-mono">{correcao.total}</span> questões
        </p>
        <p className="teorico-selo teorico-selo-grande" data-selo={correcao.aprovado ? 'correta' : 'incorreta'}>
          {correcao.aprovado ? 'APROVADO' : 'NÃO APROVADO'} <span className="teorico-nota-corte">({prova.notaAprovacao}% necessário)</span>
        </p>
        <p className="teorico-dica">
          Tempo gasto {formatarTempo(duracaoSeg)}. Média de {medio} s por questão.
        </p>
      </section>

      <section aria-labelledby="teorico-dominios" className="teorico-bloco">
        <h2 id="teorico-dominios">Desempenho por domínio</h2>
        <ul className="teorico-dominios">
          {dominios.map((d) => (
            <li key={d.dominio}>
              <div className="teorico-dominio-linha">
                <span>{d.dominio}</span>
                <span className="dado-mono">
                  {d.corretas}/{d.total} ({d.pct}%)
                </span>
              </div>
              <progress className="teorico-barra" value={d.pct} max={100} aria-label={`${d.dominio}: ${d.pct}% de acerto`} />
            </li>
          ))}
        </ul>
      </section>

      <div className="teorico-duas-colunas">
        <section className="teorico-bloco" aria-labelledby="teorico-fortes">
          <h2 id="teorico-fortes">Pontos fortes</h2>
          {fortes.length === 0 ? <p className="teorico-dica">Nenhum domínio acima de {LIMITE_FORTE}% ainda.</p> : (
            <ul>{fortes.map((d) => <li key={d.dominio}>{d.dominio}</li>)}</ul>
          )}
        </section>
        <section className="teorico-bloco" aria-labelledby="teorico-fracos">
          <h2 id="teorico-fracos">Áreas a melhorar</h2>
          {fracos.length === 0 ? <p className="teorico-dica">Nenhum domínio abaixo de {LIMITE_FORTE}%.</p> : (
            <ul>{fracos.map((d) => <li key={d.dominio}>{d.dominio}</li>)}</ul>
          )}
        </section>
      </div>

      <section className="teorico-bloco" aria-labelledby="teorico-revisao">
        <h2 id="teorico-revisao">Revisão questão a questão</h2>
        <ol className="teorico-revisao">
          {prova.questoes.map((q, i) => {
            const r = correcao.questoes.find((x) => x.id === q.id)
            if (!r) return null
            const dadas = respostas[q.id] ?? []
            return (
              <li key={q.id}>
                <details>
                  <summary>
                    <span className="dado-mono">{i + 1}.</span> {q.enunciado}{' '}
                    <span className="teorico-selo" data-selo={r.correta ? 'correta' : dadas.length === 0 ? 'branco' : 'incorreta'}>
                      {r.correta ? 'Correta' : dadas.length === 0 ? 'Em branco' : 'Incorreta'}
                    </span>
                  </summary>
                  <ul className="teorico-revisao-alts">
                    {q.alternativas.map((a) => (
                      <li key={a.id} data-gabarito={r.gabarito.includes(a.id)} data-escolhida={dadas.includes(a.id)}>
                        {a.texto}
                        {r.gabarito.includes(a.id) && <span className="teorico-selo" data-selo="correta">Gabarito</span>}
                        {dadas.includes(a.id) && <span className="teorico-selo" data-selo="atual">Sua resposta</span>}
                      </li>
                    ))}
                  </ul>
                  <ExplicacaoEstruturada questao={q} verificacao={r} />
                </details>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="teorico-acoes">
        <button type="button" className="teorico-botao teorico-botao-primario" onClick={aoRefazer}>Refazer</button>
        <button type="button" className="teorico-botao teorico-botao-secundario" onClick={aoNovo}>Novo simulado</button>
        <button type="button" className="teorico-botao teorico-botao-secundario" onClick={aoSair}>Sair</button>
      </div>
    </div>
  )
}
