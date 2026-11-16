import { useState } from 'react'
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
}

export function MentorView({ estado, onAtualizarEstado }: MentorViewProps) {
  const [aba, setAba] = useState<'ask' | 'fey' | 'pitch'>('ask')
  const [inputChat, setInputChat] = useState('')
  const [pendenteQuiz, setPendenteQuiz] = useState<FlashCard | null>(null)
  const [mensagens, setMensagens] = useState<{ who: 'me' | 'ai'; text: string }[]>([
    {
      who: 'ai',
      text: 'Oi! Sou seu mentor de estudos. Posso explicar conceitos com analogias, te testar sobre o que você estudou e ajudar a preparar seu pitch para entrevistas. Por onde começamos?',
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
        text: `Pergunta: ${escolhido.f}\n\nResponda aqui com suas palavras — depois te mostro a resposta de referência.`,
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
      setAvisoMentor(`Explicação aprovada! +30 XP na fixação de ${nivelPorId(c.level).nome}.`)
    }
  }

  function salvarFeynmanNoCaderno() {
    const c = CONCEPTS.find((x) => x.name === feyConceito)
    const lvlId = c ? c.level : estado.focus
    const L = nivelPorId(lvlId)
    onAtualizarEstado((prev) => {
      const targetId = `pg-${lvlId}`
      const existe = prev.pages.some((p) => p.id === targetId)
      const entrada = `[Feynman · ${feyConceito}]\n${feyTexto.trim()}`
      const pages = existe
        ? prev.pages.map((p) =>
            p.id === targetId ? { ...p, notes: `${(p.notes ?? '').trim()}\n${entrada}`.trim() } : p,
          )
        : [
            ...prev.pages,
            {
              id: targetId,
              icon: L.icon,
              title: `${L.nome} · Anotações`,
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
    setAvisoMentor('Pitch adicionado ao seu Currículo Vivo!')
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
              icon: '🎤',
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
        <p className="eyebrow">Explicar</p>
        <h1 className="h1">🤖 Mentor IA</h1>
        <p className="lead">
          Tire dúvidas, ensine com suas palavras (Técnica de Feynman) e prepare o pitch para sua primeira vaga.
        </p>
      </div>

      {avisoMentor && (
        <div className="banner-notice" style={{ marginBottom: '14px' }}>
          <span>{avisoMentor}</span>
          <button type="button" className="chip" onClick={() => setAvisoMentor(null)}>
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
          💬 Tirar dúvidas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'fey'}
          className={`tab ${aba === 'fey' ? 'active' : ''}`}
          onClick={() => setAba('fey')}
        >
          🧑‍🏫 Técnica de Feynman
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'pitch'}
          className={`tab ${aba === 'pitch' ? 'active' : ''}`}
          onClick={() => setAba('pitch')}
        >
          🎤 Pitch STAR para entrevistas
        </button>
      </div>

      {aba === 'ask' && (
        <div className="grid-2">
          <section className="edu-card card-b">
            <div className="chat" aria-live="polite">
              {mensagens.map((m, i) => (
                <div key={i} className={`bubble ${m.who}`}>
                  {m.who === 'ai' && <div className="who">🤖 Mentor IA</div>}
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
                Mensagem para o mentor
              </label>
              <input
                id="m-in"
                type="text"
                className="text grow"
                placeholder="Pergunte qualquer coisa sobre o que está estudando..."
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
              />
              <button type="submit" className="btn btn-ai">
                Enviar
              </button>
            </form>
          </section>

          <aside className="edu-card card-b">
            <h2 className="h3">Sugestões</h2>
            <div className="suggest mt">
              {[
                'O que é DNS?',
                'Como calcular prioridade e SLA?',
                'Como reconhecer engenharia social?',
                'Como estudar sem esquecer?',
                'Como me sair numa entrevista de suporte?',
              ].map((q) => (
                <button key={q} type="button" onClick={() => enviarPergunta(q)}>
                  {q}
                </button>
              ))}
              <button type="button" onClick={testarConhecimento}>
                🎯 Me teste sobre o que estudei
              </button>
            </div>
            <hr className="divider" />
            <h2 className="h3">Como tirar o máximo do mentor</h2>
            <ul className="muted" style={{ paddingLeft: '18px', margin: '8px 0 0' }}>
              <li>Pergunte &quot;por quê?&quot; e peça analogias.</li>
              <li>Peça para ser testado antes de reler a aula.</li>
              <li>Leve para cá as dúvidas anotadas no Caderno.</li>
            </ul>
            <p className="muted mt">
              🤖 Modo determinístico roteirizado ativo por padrão (custo zero de API na avaliação).
            </p>
          </aside>
        </div>
      )}

      {aba === 'fey' && (
        <div className="grid-2">
          <section className="edu-card card-b">
            <h2 className="h2">Ensine para aprender</h2>
            <p className="muted" style={{ margin: '4px 0 12px' }}>
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
                <option value="">Escolha um conceito...</option>
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
              placeholder="Exemplo: O DNS é como a agenda do celular..."
              value={feyTexto}
              onChange={(e) => setFeyTexto(e.target.value)}
            />
            <div className="row-between mt">
              <span className="muted">{feyWords} palavras</span>
              <button type="button" className="btn btn-ai" onClick={rodarFeynman}>
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
                <div
                  className="meter mt"
                  role="progressbar"
                  aria-label="Clareza da explicação"
                  aria-valuenow={feyRes.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    style={{
                      width: `${feyRes.score}%`,
                      background:
                        feyRes.score >= 80
                          ? 'var(--mastery-solid)'
                          : feyRes.score >= 55
                            ? 'var(--warn-solid)'
                            : 'var(--danger)',
                    }}
                  />
                </div>
                <p className="mt">
                  <strong>
                    {feyRes.score >= 80
                      ? 'Claro como água — você domina o conceito!'
                      : feyRes.score >= 55
                        ? 'Bom caminho — ajuste os pontos abaixo.'
                        : 'Ainda confuso — revise a aula e tente de novo.'}
                  </strong>
                </p>
                <div className="mt">
                  <div className="check">
                    <span className={`check-ic ${feyRes.analogy ? 'ok' : 'no'}`}>{feyRes.analogy ? '✓' : '!'}</span>
                    <span>{feyRes.analogy ? 'Usou analogia.' : 'Faltou uma analogia do dia a dia.'}</span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.example ? 'ok' : 'no'}`}>{feyRes.example ? '✓' : '!'}</span>
                    <span>{feyRes.example ? 'Trouxe um exemplo concreto.' : 'Faltou um exemplo concreto.'}</span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.unexplained.length ? 'no' : 'ok'}`}>
                      {feyRes.unexplained.length ? '!' : '✓'}
                    </span>
                    <span>
                      {feyRes.unexplained.length
                        ? `Jargão sem explicação: ${feyRes.unexplained.join(', ')}`
                        : 'Sem jargão solto.'}
                    </span>
                  </div>
                  <div className="check">
                    <span className={`check-ic ${feyRes.avg > 22 ? 'no' : 'ok'}`}>
                      {feyRes.avg > 22 ? '!' : '✓'}
                    </span>
                    <span>
                      Média de {feyRes.avg} palavras por frase{feyRes.avg > 22 ? ' (tente frases menores).' : '.'}
                    </span>
                  </div>
                </div>
                {feyRes.qs.length > 0 && (
                  <>
                    <h3 className="h3 mt">🙋 Perguntas do aluno-IA</h3>
                    {feyRes.qs.map((q, idx) => (
                      <div key={idx} className="bubble ai" style={{ maxWidth: '100%', marginTop: '8px' }}>
                        {q}
                      </div>
                    ))}
                  </>
                )}
                <button type="button" className="btn btn-secondary mt" onClick={salvarFeynmanNoCaderno}>
                  📓 Salvar explicação no Caderno
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
                ⚡ Usar o laboratório de {nivelPorId(estado.focus).nome}
              </button>
            </div>
            <p className="muted" style={{ marginTop: '4px' }}>
              Transforme o que você praticou numa história curta para entrevistas.
            </p>
            <label className="block-label" htmlFor="pt-s">
              S · Situação
            </label>
            <textarea
              id="pt-s"
              className="block xs"
              placeholder="Onde e quando aconteceu? Qual era o contexto?"
              value={pitch.s}
              onChange={(e) => setPitch((p) => ({ ...p, s: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-t">
              T · Tarefa
            </label>
            <textarea
              id="pt-t"
              className="block xs"
              placeholder="O que precisava ser resolvido?"
              value={pitch.t}
              onChange={(e) => setPitch((p) => ({ ...p, t: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-a">
              A · Ação
            </label>
            <textarea
              id="pt-a"
              className="block xs"
              placeholder='O que VOCÊ fez, passo a passo? Use "eu".'
              value={pitch.a}
              onChange={(e) => setPitch((p) => ({ ...p, a: e.target.value }))}
            />
            <label className="block-label" htmlFor="pt-r">
              R · Resultado
            </label>
            <textarea
              id="pt-r"
              className="block xs"
              placeholder="Qual foi o resultado? Use números: tempo, percentual, pessoas."
              value={pitch.r}
              onChange={(e) => setPitch((p) => ({ ...p, r: e.target.value }))}
            />
            <button type="button" className="btn btn-ai mt" onClick={() => setPitchRes(avaliarPitchStar(pitch))}>
              Receber feedback do recrutador IA
            </button>
          </section>

          <aside className="edu-card card-b" aria-live="polite">
            {!pitchRes ? (
              <>
                <h2 className="h3">O que é o método STAR?</h2>
                <ol className="steps4">
                  <li>
                    <strong>Situação</strong> — o contexto.
                  </li>
                  <li>
                    <strong>Tarefa</strong> — o desafio.
                  </li>
                  <li>
                    <strong>Ação</strong> — o que você fez.
                  </li>
                  <li>
                    <strong>Resultado</strong> — o impacto, com números.
                  </li>
                </ol>
                <p className="muted mt">
                  Recrutadores de suporte valorizam histórias objetivas sobre como você diagnosticou e resolveu um chamado.
                </p>
              </>
            ) : (
              <>
                <div className="row-between">
                  <h2 className="h3">Feedback do recrutador IA</h2>
                  <span className={`chip ${pitchRes.score === 4 ? 'c-mastery' : 'c-warn'}`}>
                    {pitchRes.score}/4 critérios
                  </span>
                </div>
                {pitchRes.checks.map((c, idx) => (
                  <div key={idx} className="check">
                    <span className={`check-ic ${c.ok ? 'ok' : 'no'}`}>{c.ok ? '✓' : '!'}</span>
                    <span>{c.ok ? c.good : c.bad}</span>
                  </div>
                ))}
                <h3 className="h3 mt">Seu pitch (≈ {pitchRes.secs} segundos falando)</h3>
                <div className="preview mt">{pitchRes.text || '—'}</div>
                <div className="row wrap gap mt">
                  <button
                    type="button"
                    className="btn btn-mastery"
                    disabled={pitchRes.score < 3}
                    onClick={adicionarPitchAoCurriculo}
                  >
                    📜 Adicionar ao Currículo Vivo
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={salvarPitchNoCaderno}>
                    📓 Salvar no Caderno
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
