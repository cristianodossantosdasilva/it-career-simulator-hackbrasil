import { useEffect, useId, useState } from 'react'
import type { ApiTeorico, PerguntaPronta } from '../api/teorico'

interface Props {
  questaoId: string
  api: Pick<ApiTeorico, 'perguntas'>
}

/**
 * FAQ da questão: perguntas prontas como chips clicáveis. Cada chip é um botão que expande a resposta pronta
 * (texto estático do servidor, sem IA).
 */
export function PerguntasProntas({ questaoId, api }: Props) {
  const base = useId()
  const [perguntas, setPerguntas] = useState<PerguntaPronta[] | null>(null)
  const [falha, setFalha] = useState<string | null>(null)
  const [aberta, setAberta] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setPerguntas(null)
    setFalha(null)
    setAberta(null)
    api
      .perguntas(questaoId)
      .then((r) => {
        if (ativo) setPerguntas(r.perguntas)
      })
      .catch((e: unknown) => {
        if (ativo) setFalha(e instanceof Error ? e.message : 'Não foi possível carregar as perguntas prontas.')
      })
    return () => {
      ativo = false
    }
  }, [api, questaoId])

  if (falha) return <p role="alert" className="teorico-erro">{falha}</p>
  if (!perguntas || perguntas.length === 0) return null

  return (
    <section className="teorico-faq" aria-label="Perguntas prontas sobre esta questão">
      <h4 className="teorico-faq-titulo">Perguntas prontas</h4>
      <div className="teorico-faq-chips">
        {perguntas.map((p) => {
          const expandida = p.id === aberta
          return (
            <button
              key={p.id}
              type="button"
              className="teorico-chip"
              aria-expanded={expandida}
              aria-controls={`${base}-${p.id}`}
              onClick={() => setAberta(expandida ? null : p.id)}
            >
              {p.pergunta}
            </button>
          )
        })}
      </div>
      {perguntas.map((p) => (
        <div
          key={p.id}
          id={`${base}-${p.id}`}
          className="teorico-faq-resposta"
          role="region"
          aria-label={p.pergunta}
          hidden={p.id !== aberta}
        >
          <p className="teorico-quebra">{p.resposta}</p>
          <span className="teorico-etiqueta teorico-etiqueta-suave">Resposta pronta</span>
        </div>
      ))}
    </section>
  )
}
