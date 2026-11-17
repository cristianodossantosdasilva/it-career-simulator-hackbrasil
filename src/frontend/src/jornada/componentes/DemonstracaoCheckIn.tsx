import { useId, useState } from 'react'
import { PERGUNTA_FOCO, RESPOSTAS_FOCO } from '../catalogos/catalogoVocacional'

/**
 * Exemplo de pergunta do check-in para quem ainda não fez o check-in. Não recebe nem usa o
 * Armazenamento_Local: a escolha vive só neste componente e some ao sair da página.
 */
export function DemonstracaoCheckIn() {
  const idTitulo = useId()
  const [escolhida, setEscolhida] = useState<string | null>(null)
  return (
    <section className="demonstracao-checkin" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Veja uma pergunta do check-in</h2>
      <p className="pagina-jornada-texto">
        É só um exemplo. Nada do que você escolher aqui é guardado neste navegador. O check-in de verdade fica em outra página.
      </p>
      <fieldset className="checkin-pergunta">
        <legend>{PERGUNTA_FOCO.enunciado}</legend>
        <div className="opcoes-checkin">
          {PERGUNTA_FOCO.opcoes.map((opcao) => (
            <label key={opcao.id} className="opcao-checkin">
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
        {escolhida !== null && <p className="demonstracao-checkin-resposta">{RESPOSTAS_FOCO[escolhida]}</p>}
      </div>
    </section>
  )
}
