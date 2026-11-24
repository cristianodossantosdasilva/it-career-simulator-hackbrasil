import { useId, useState } from 'react'
import { Icone } from '../../ui/Icone'
import type { IdPagina } from '../navegacao/rotas'
import { AVISO_JUIZ, PAPEIS, type PapelMentor } from './catalogoMentor'
import { responderComoMentor } from './responderMentor'

interface Mensagem {
  autor: 'pessoa' | 'mentor'
  texto: string
}

interface PropsPainelMentor {
  papel: PapelMentor
  pagina: IdPagina
  /** Só na Mesa de Trabalho. */
  dicaMissao?: string | null
}

/**
 * Área do Mentor: mostra o papel ativo em texto e responde só com textos locais. Não recebe
 * funções de ação, de chat nem de gravação, então não gera evento no backend.
 */
export function PainelMentor({ papel, pagina, dicaMissao = null }: PropsPainelMentor) {
  const definicao = PAPEIS[papel]
  const contexto = { pagina, dicaMissao }
  const idTitulo = useId()
  const idCampo = useId()
  const [pergunta, setPergunta] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [
    { autor: 'mentor', texto: responderComoMentor(papel, '', contexto) },
  ])

  function perguntar(texto: string) {
    const limpa = texto.trim()
    if (!limpa) return
    setMensagens((atuais) => [
      ...atuais,
      { autor: 'pessoa', texto: limpa },
      { autor: 'mentor', texto: responderComoMentor(papel, limpa, contexto) },
    ])
    setPergunta('')
  }

  return (
    <section className="edu-card card-b" aria-labelledby={idTitulo}>
      <h2 className="h3 row gap" id={idTitulo}>
        <Icone nome="mentor" />
        <span>Mentor, papel {definicao.nome}</span>
      </h2>
      <p className="muted mt-1">{definicao.resumo}</p>
      {papel === 'mentor' && <p className="mt-1">{AVISO_JUIZ}.</p>}
      <div className="chat short mt" aria-live="polite">
        {mensagens.map((mensagem, indice) => (
          <div key={indice} className={`bubble ${mensagem.autor === 'mentor' ? 'ai' : 'me'}`}>
            {mensagem.autor === 'mentor' && <div className="who">Mentor</div>}
            {mensagem.texto}
          </div>
        ))}
      </div>
      <div className="suggest mt">
        {papel === 'acompanhante' && dicaMissao && (
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
          Pergunta ao Mentor
        </label>
        <input
          id={idCampo}
          type="text"
          className="text grow"
          placeholder="Pergunte ao Mentor..."
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
