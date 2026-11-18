import { useState } from 'react'
import { Icone } from '../ui/Icone'
import {
  CARDS,
  CONCEPTS,
  LEVELS,
  STAR_PREFILLS,
  type EstadoAcademia,
  type FlashCard,
  type PitchStar,
  type ResultadoFeynman,
  type ResultadoPitchStar,
  avaliarFeynman,
  avaliarPitchStar,
  nivelPorId,
  obterCardsParaHoje,
  responderMentor,
} from './catalogoEducacional'

interface MentorViewProps {
  estado: EstadoAcademia
  onAtualizarEstado: (updater: (prev: EstadoAcademia) => EstadoAcademia) => void
  /** Nível do título. A página Treino tem o próprio h1 e passa 2. */
  nivelTitulo?: 1 | 2
}

export function MentorView({ estado, onAtualizarEstado, nivelTitulo = 1 }: MentorViewProps) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h1'
  const [aba, setAba] = useState<'ask' | 'fey' | 'pitch'>('ask')
  const [inputChat, setInputChat] = useState('')
  const [pendenteQuiz, setPendenteQuiz] = useState<FlashCard | null>(null)
  const [mensagens, setMensagens] = useState<{ who: 'me' | 'ai'; text: string }[]>([
    {
      who: 'ai',
      text: 'Escolha uma pergunta sugerida, digite uma palavra-chave (por exemplo DNS, SLA ou SQL) ou peça para ser testado. As respostas vêm do conteúdo da trilha.',
    },
  ])

  const [feyConceito, setFeyConceito] = useState('')
  const [feyTexto, setFeyTexto] = useState('')
  const [feyRes, setFeyRes] = useState<ResultadoFeynman | null>(null)

  const [pitch, setPitch] = useState<PitchStar>({ s: '', t: '', a: '', r: '' })
  const [pitchRes, setPitchRes] = useState<ResultadoPitchStar | null>(null)
  const [avisoMentor, setAvisoMentor] = useState<string | null>(null)

  function enviarPergunta(textoRaw: string) {
    const v = textoRaw.trim()
    if (!v) return
    if (pendenteQuiz) {
      const ref = pendenteQuiz.b
      setMensagens((m) => [
        ...m,
        { who: 'me', text: v },
        {
          who: 'ai',
          text: `Resposta de referência: ${ref}\n\nCompare com a sua. Se faltou algo, anote no Caderno e marque o flashcard como difícil para revisar amanhã.`,
        },
      ])
      setPendenteQuiz(null)
    } else {
      const resp = responderMentor(v)
      setMensagens((m) => [...m, { who: 'me', text: v }, { who: 'ai', text: resp }])
    }
    setInputChat('')
  }

  function testarConhecimento() {
    const due = obterCardsParaHoje(estado)
    const pool = due.length > 0 ? due : CARDS[estado.focus]
    const escolhido = pool[Math.floor(Math.random() * pool.length)]
    setPendenteQuiz(escolhido)
    setMensagens((m) => [
      ...m,
      { who: 'me', text: 'Me teste sobre o que estudei' },
      {
        who: 'ai',
        text: `Pergunta: ${escolhido.f}\n\nResponda aqui com suas palavras. Depois mostro a resposta de referência.`,
      },
    ])
  }

  function rodarFeynman() {
    if (!feyConceito) {
      setAvisoMentor('Escolha um conceito para explicar.')
      return
    }
    if (feyTexto.trim().length < 10) {
      setAvisoMentor('Escreva sua explicação antes de avaliar.')
      return
    }
    setAvisoMentor(null)
    const res = avaliarFeynman(feyTexto)
    setFeyRes(res)
    const c = CONCEPTS.find((x) => x.name === feyConceito)
    if (res.score >= 55 && c && !estado.feynman.includes(c.level)) {
      onAtualizarEstado((prev) =>
        prev.feynman.includes(c.level) ? prev : { ...prev, feynman: [...prev.feynman, c.level], xp: prev.xp + 30 },
      )
      setAvisoMentor(`Explicação aprovada. +30 XP na fixação de ${nivelPorId(c.level).nome}.`)
    }
  }

  function salvarFeynmanNoCaderno() {
    const c = CONCEPTS.find((x) => x.name === feyConceito)
    const lvlId = c ? c.level : estado.focus
    const L = nivelPorId(lvlId)
    onAtualizarEstado((prev) => {
      const targetId = `pg-${lvlId}`
      const existe = prev.pages.some((p) => p.id === targetId)
      const entrada = `[Feynman: ${feyConceito}]\n${feyTexto.trim()}`
      const pages = existe
        ? prev.pages.map((p) =>
            p.id === targetId ? { ...p, notes: `${(p.notes ?? '').trim()}\n${entrada}`.trim() } : p,
          )
        : [
            ...prev.pages,
            {
              id: targetId,
              icon: L.icon,
              title: `${L.nome}: Anotações`,
              level: lvlId,
              type: 'cornell' as const,
              cues: '',
              notes: entrada,
              summary: '',
            },
          ]
      return { ...prev, pages }
    })
    setAvisoMentor(`Explicação salva no caderno de ${L.nome}.`)
  }

  function adicionarPitchAoCurriculo() {
    if (!pitchRes) return
    onAtualizarEstado((prev) => {
      if (prev.pitches.some((p) => p.text === pitchRes.text)) return prev
      return {
        ...prev,
        pitches: [...prev.pitches, { text: pitchRes.text, at: new Date().toISOString() }],
        xp: prev.xp + 20,
      }
    })
    setAvisoMentor('Pitch adicionado ao seu Currículo Vivo.')
  }

  function salvarPitchNoCaderno() {
    if (!pitchRes) return
    onAtualizarEstado((prev) => {
      const existe = prev.pages.some((p) => p.id === 'pg-pitch')
      const entry = `— ${new Date().toLocaleDateString('pt-BR')}\n${pitchRes.text}\n`
      const pages = existe
        ? prev.pages.map((p) =>
            p.id === 'pg-pitch' ? { ...p, text: `${(p.text ?? '').trim()}\n${entry}`.trim() } : p,
          )
        : [
            ...prev.pages,
            {
              id: 'pg-pitch',
              icon: 'pitch' as const,
              title: 'Meus pitches STAR',
              level: null,
              type: 'free' as const,
              text: entry,
            },
          ]
      return { ...prev, pages }
    })
    setAvisoMentor('Pitch salvo no Caderno.')
  }

  const feyWords = feyTexto.trim() ? feyTexto.trim().split(/\s+/).length : 0

  return (
    <div className="page">
      <div className="page-head">
        <Titulo className={nivelTitulo === 2 ? 'h2' : 'h1'}>Mentor</Titulo>
        <p className="lead">Respostas guiadas pelo conteúdo da trilha.</p>
        <p className="nota-transparencia">
          <Icone nome="info" tamanho={16} />
          <span>
            O Mentor não é um chat de inteligência artificial aberto. As respostas vêm de uma base escrita para esta trilha,
            e a avaliação de explicações e de pitches segue regras fixas. O mesmo texto sempre recebe o mesmo resultado.
          </span>
        </p>
      </div>

      {avisoMentor && (
        <div className="banner-notice aviso-estudo">
          <span>{avisoMentor}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAvisoMentor(null)}>
            Fechar
          </button>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'ask'}
          className={`tab ${aba === 'ask' ? 'active' : ''}`}
          onClick={() => setAba('ask')}
        >
          <Icone nome="conversa" tamanho={16} />
          Perguntas da trilha
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'fey'}
          className={`tab ${aba === 'fey' ? 'active' : ''}`}
          onClick={() => setAba('fey')}
        >
          <Icone nome="feynman" tamanho={16} />
          Técnica de Feynman
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'pitch'}
          className={`tab ${aba === 'pitch' ? 'active' : ''}`}
          onClick={() => setAba('pitch')}
        >
          <Icone nome="pitch" tamanho={16} />
          Pitch STAR para entrevistas
        </button>
      </div>

      {aba === 'ask' && (
        <div className="grid-2">
          <section className="edu-card card-b">
            <div className="chat" aria-live="polite">
              {mensagens.map((m, i) => (
                <div key={i} className={`bubble ${m.who}`}>
                  {m.who === 'ai' && <div className="who">Mentor</div>}
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="row gap mt"
              onSubmit={(e) => {
                e.preventDefault()
                enviarPergunta(inputChat)
              }}
            >
              <label className="skip" htmlFor="m-in">
                Pergunta ou palavra-chave
              </label>
              <input
                id="m-in"
                type="text"
                className="text grow"
                placeholder="Digite uma palavra-chave, como DNS, SLA ou SQL"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Enviar
              </button>
            </form>
          </section>

          <aside className="edu-card card-b">
            <h2 className="h3">Perguntas sugeridas</h2>
            <div className="suggest mt">
              {[
                'O que é DNS?',
                'Como calcular prioridade e SLA?',
                'Como reconhecer engenharia social?',
                'Como estudar sem esquecer?',
                'Como me preparar para uma entrevista de suporte?',
              ].map((q) => (
                <button key={q} type="button" onClick={() => enviarPergunta(q)}>
                  {q}
                </button>
              ))}
              <button type="button" onClick={testarConhecimento}>
                <Icone nome="meta" tamanho={16} />
                Me teste sobre o que estudei
              </button>
            </div>
            <hr className="divider" />
            <h2 className="h3">Exercício guiado: estude, teste, anote</h2>
            <ol className="steps4">
              <li>Escolha uma pergunta sugerida e leia a resposta.</li>
              <li>Use Me teste sobre o que estudei e responda de cabeça.</li>
              <li>Compare com a resposta de referência e anote o que faltou no Caderno.</li>
            </ol>
            <p className="muted mt">
              Perguntas fora da base recebem a lista de assuntos cobertos. Nenhuma pergunta é enviada a um serviço externo.
            </p>
          </aside>
        </div>
      )}

      {aba === 'fey' && (
        <div className="grid-2">
          <section className="edu-card card-b">
            <h2 className="h2">Ensine para aprender</h2>
            <p className="muted texto-apoio">
              Explique o conceito como se fosse para alguém que nunca trabalhou com TI. O avaliador aponta onde ficou técnico demais.
            </p>
            <label className="f" htmlFor="fey-c">
              Conceito
              <select
                id="fey-c"
                className="text"
                value={feyConceito}
                onChange={(e) => setFeyConceito(e.target.value)}
              >
                <option value="">Escolha um conceito</option>
                {LEVELS.map((L) => (
                  <optgroup key={L.id} label={L.nome}>
                    {CONCEPTS.filter((c) => c.level === L.id).map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block-label" htmlFor="fey-t">
              Sua explicação
            </label>
            <textarea
              id="fey-t"
              className="block"
              placeholder="Exemplo: o DNS é como a agenda do celular"
              value={feyTexto}
              onChange={(e) => setFeyTexto(e.target.value)}
            />
            <div className="row-between mt">
              <span className="muted">{feyWords} palavras</span>
              <button type="button" className="btn btn-primary" onClick={rodarFeynman}>
                Avaliar minha explicação
              </button>
            </div>
          </section>

          <aside className="edu-card card-b" aria-live="polite">
            {!feyRes ? (
              <>
                <h2 className="h3">Os 4 passos da Técnica de Feynman</h2>
                <ol className="steps4">
                  <li>Escolha um conceito que você estudou.</li>
                  <li>Explique com palavras simples, como para um iniciante.</li>
                  <li>Descubra as lacunas: onde travou ou usou jargão?</li>
                  <li>Volte à aula, simplifique e explique de novo.</li>
                </ol>
                <p className="muted mt">
                  Explicar o que se aprendeu, com as próprias palavras, consolida a compreensão profunda.
                </p>
              </>
            ) : (
              <>
                <h2 className="h3">Resultado da explicação</h2>
                <div className="row-between mt">
                  <strong>Clareza</strong>
                  <strong>{feyRes.score}/100</strong>
                </div>
                <meter
                  className="meter mt"
                  aria-label="Clareza da explicação"
                  value={feyRes.score}
                  min={0}
                  max={100}
                  low={55}
                  high={80}
                  optimum={100}
                />
                <p className="mt">
                  <strong>
                    {feyRes.score >= 80
                      ? 'Explicação clara. Você domina o conceito.'
                      : feyRes.score >= 55
                        ? 'Bom caminho — ajuste os pontos abaixo.'
                        : 'Ainda confusa. Revise a aula e tente de novo.'}
                  </strong>
                </p>
                <div className="mt">
                  <div className="check">
                    <span className={`check-ic ${feyRes.analogy ? 'ok' : 'no'}`}><Icone nome={feyRes.analogy ? 'confirmar' : 'alerta'} tamanho={16} /></span>
                    <span>{feyRes.analogy ? 'Usou analogia.' : 'Faltou uma analogia do dia a dia.'}</span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.example ? 'ok' : 'no'}`}><Icone nome={feyRes.example ? 'confirmar' : 'alerta'} tamanho={16} /></span>
                    <span>{feyRes.example ? 'Trouxe um exemplo concreto.' : 'Faltou um exemplo concreto.'}</span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.unexplained.length ? 'no' : 'ok'}`}>
                      <Icone nome={feyRes.unexplained.length ? 'alerta' : 'confirmar'} tamanho={16} />
                    </span>
                    <span>
                      {feyRes.unexplained.length
                        ? `Jargão sem explicação: ${feyRes.unexplained.join(', ')}`
                        : 'Sem jargão solto.'}
                    </span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.avg > 22 ? 'no' : 'ok'}`}>
                      <Icone nome={feyRes.avg > 22 ? 'alerta' : 'confirmar'} tamanho={16} />
                    </span>
                    <span>
                      Média de {feyRes.avg} palavras por frase{feyRes.avg > 22 ? ' (tente frases menores).' : '.'}
                    </span>
                  </div>
                </div>
                {feyRes.qs.length > 0 && (
                  <>
                    <h3 className="h3 mt">Perguntas de um aluno iniciante</h3>
                    {feyRes.qs.map((q, idx) => (
                      <div key={idx} className="bubble ai pergunta-aluno">
                        {q}
                      </div>
                    ))}
                  </>
                )}
                <button type="button" className="btn btn-secondary mt" onClick={salvarFeynmanNoCaderno}>
                  <Icone nome="notas" tamanho={16} />
                  Salvar explicação no Caderno
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {aba === 'pitch' && (
        <div className="grid-2">
          <section className="edu-card card-b">
            <div className="row-between">
              <h2 className="h2">Monte seu Pitch STAR</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPitch(STAR_PREFILLS[estado.focus])
                  setPitchRes(null)
                }}
              >
                <Icone nome="praticar" tamanho={16} />
                Preencher com o laboratório de {nivelPorId(estado.focus).nome}
              </button>
            </div>
            <p className="muted mt-1">
              Transforme o que você praticou numa história curta para entrevistas.
            </p>
            <label className="block-label" htmlFor="pt-s">
              Situação (S)
            </label>
            <textarea
              id="pt-s"
              className="block xs"
              placeholder="Onde e quando aconteceu? Qual era o contexto?"
              value={pitch.s}
              onChange={(e) => setPitch((p) => ({ ...p, s: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-t">
              Tarefa (T)
            </label>
            <textarea
              id="pt-t"
              className="block xs"
              placeholder="O que precisava ser resolvido?"
              value={pitch.t}
              onChange={(e) => setPitch((p) => ({ ...p, t: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-a">
              Ação (A)
            </label>
            <textarea
              id="pt-a"
              className="block xs"
              placeholder='O que VOCÊ fez, passo a passo? Use "eu".'
              value={pitch.a}
              onChange={(e) => setPitch((p) => ({ ...p, a: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-r">
              Resultado (R)
            </label>
            <textarea
              id="pt-r"
              className="block xs"
              placeholder="Qual foi o resultado? Use números: tempo, percentual, pessoas."
              value={pitch.r}
              onChange={(e) => setPitch((p) => ({ ...p, r: e.target.value }))}
            />
            <button type="button" className="btn btn-primary mt" onClick={() => setPitchRes(avaliarPitchStar(pitch))}>
              Avaliar meu pitch
            </button>
          </section>

          <aside className="edu-card card-b" aria-live="polite">
            {!pitchRes ? (
              <>
                <h2 className="h3">O que é o método STAR?</h2>
                <ol className="steps4">
                  <li>
                    <strong>Situação:</strong> o contexto.
                  </li>
                  <li>
                    <strong>Tarefa:</strong> o desafio.
                  </li>
                  <li>
                    <strong>Ação:</strong> o que você fez.
                  </li>
                  <li>
                    <strong>Resultado:</strong> o impacto, com números.
                  </li>
                </ol>
                <p className="muted mt">
                  Recrutadores de suporte valorizam histórias objetivas sobre como você diagnosticou e resolveu um chamado.
                </p>
              </>
            ) : (
              <>
                <div className="row-between">
                  <h2 className="h3">Avaliação do pitch</h2>
                  <span className="meta-item">{pitchRes.score} de 4 critérios</span>
                </div>
                {pitchRes.checks.map((c, idx) => (
                  <div key={idx} className="check">
                    <span className={`check-ic ${c.ok ? 'ok' : 'no'}`}><Icone nome={c.ok ? 'confirmar' : 'alerta'} tamanho={16} /></span>
                    <span>{c.ok ? c.good : c.bad}</span>
                  </div>
                ))}
                <h3 className="h3 mt">Seu pitch, cerca de {pitchRes.secs} segundos falando</h3>
                <div className="preview mt">{pitchRes.text || 'Nenhum texto informado.'}</div>
                <div className="row wrap gap mt">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={pitchRes.score < 3}
                    onClick={adicionarPitchAoCurriculo}
                  >
                    <Icone nome="credencial" tamanho={16} />
                    Adicionar ao Currículo Vivo
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={salvarPitchNoCaderno}>
                    <Icone nome="notas" tamanho={16} />
                    Salvar no Caderno
                  </button>
                </div>
                {pitchRes.score < 3 && (
                  <p className="muted mt">Atinja pelo menos 3 critérios para adicionar ao Currículo Vivo.</p>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
