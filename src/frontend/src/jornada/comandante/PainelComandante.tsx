import { useId, useState } from 'react'
import { Icone } from '../../ui/Icone'
import type { IdPagina } from '../navegacao/rotas'
import { AVISO_JUIZ, PAPEIS, type PapelComandante } from './catalogoComandante'
import { responderComandante } from './responderComandante'

interface Mensagem {
  autor: 'pessoa' | 'comandante'
  texto: string
}

interface PropsPainelComandante {
  papel: PapelComandante
  pagina: IdPagina
  /** Só na Cabine. */
  dicaMissao?: string | null
}

/**
 * Área do Comandante: mostra o papel ativo em texto e responde só com textos locais. Não recebe
 * funções de ação, de chat nem de gravação, então não gera evento no backend.
 */
export function PainelComandante({ papel, pagina, dicaMissao = null }: PropsPainelComandante) {
  const definicao = PAPEIS[papel]
  const contexto = { pagina, dicaMissao }
  const idTitulo = useId()
  const idCampo = useId()
  const [pergunta, setPergunta] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [
    { autor: 'comandante', texto: responderComandante(papel, '', contexto) },
  ])

  function perguntar(texto: string) {
    const limpa = texto.trim()
    if (!limpa) return
    setMensagens((atuais) => [
      ...atuais,
      { autor: 'pessoa', texto: limpa },
      { autor: 'comandante', texto: responderComandante(papel, limpa, contexto) },
    ])
    setPergunta('')
  }

  return (
    <section className="edu-card card-b" aria-labelledby={idTitulo}>
      <h2 className="h3 row gap" id={idTitulo}>
        <Icone nome="mentor" />
        <span>Comandante, papel {definicao.nome}</span>
      </h2>
      <p className="muted mt-1">{definicao.resumo}</p>
      {papel === 'mentor' && <p className="mt-1">{AVISO_JUIZ}.</p>}
      <div className="chat short mt" aria-live="polite">
        {mensagens.map((mensagem, indice) => (
          <div key={indice} className={`bubble ${mensagem.autor === 'comandante' ? 'ai' : 'me'}`}>
            {mensagem.autor === 'comandante' && <div className="who">Comandante</div>}
            {mensagem.texto}
          </div>
        ))}
      </div>
      <div className="suggest mt">
        {papel === 'copiloto' && dicaMissao && (
          <button type="button" onClick={() => perguntar('O que faço agora?')}>
            O que faço agora?
          </button>
        )}
        {definicao.sugestoes.map((sugestao) => (
          <button key={sugestao.pergunta} type="button" onClick={() => perguntar(sugestao.pergunta)}>
            {sugestao.pergunta}
          </button>
        ))}
      </div>
      <form
        className="row gap mt"
        onSubmit={(evento) => {
          evento.preventDefault()
          perguntar(pergunta)
        }}
      >
        <label className="sr-only" htmlFor={idCampo}>
          Pergunta ao Comandante
        </label>
        <input
          id={idCampo}
          type="text"
          className="text grow"
          placeholder="Pergunte ao Comandante..."
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Enviar
        </button>
      </form>
    </section>
  )
}
