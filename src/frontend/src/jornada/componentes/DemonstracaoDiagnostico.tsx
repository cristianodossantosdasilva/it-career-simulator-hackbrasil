import { useId, useState } from 'react'
import { PERGUNTA_FOCO, RESPOSTAS_FOCO } from '../catalogos/catalogoVocacional'

/**
 * Exemplo de pergunta do diagnóstico para quem ainda não fez o diagnóstico. Não recebe nem usa o
 * Armazenamento_Local: a escolha vive só neste componente e some ao sair da página.
 */
export function DemonstracaoDiagnostico() {
  const idTitulo = useId()
  const [escolhida, setEscolhida] = useState<string | null>(null)
  return (
    <section className="demonstracao-diagnostico" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Veja uma pergunta do diagnóstico</h2>
      <p className="pagina-jornada-texto">
        É só um exemplo. Nada do que você escolher aqui é guardado neste navegador. O diagnóstico de verdade fica em outra página.
      </p>
      <fieldset className="diagnostico-pergunta">
        <legend>{PERGUNTA_FOCO.enunciado}</legend>
        <div className="opcoes-diagnostico">
          {PERGUNTA_FOCO.opcoes.map((opcao) => (
            <label key={opcao.id} className="opcao-diagnostico">
              <input
                type="radio"
                name={`demonstracao-${PERGUNTA_FOCO.id}`}
                value={opcao.id}
                checked={escolhida === opcao.id}
                onChange={() => setEscolhida(opcao.id)}
              />
              <span>{opcao.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div role="status" aria-live="polite">
        {escolhida !== null && <p className="demonstracao-diagnostico-resposta">{RESPOSTAS_FOCO[escolhida]}</p>}
      </div>
    </section>
  )
}
