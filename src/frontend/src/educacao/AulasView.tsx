import { useState } from 'react'
import type { IdMissao } from '../jornada/catalogos/catalogoRotas'
import { Icone } from '../ui/Icone'
import {
  CARDS,
  LESSONS,
  LEVELS,
  type EstadoAcademia,
  type NivelId,
  calcularProgressoNivel,
  isCardDue,
  nivelPorId,
} from './catalogoEducacional'

interface AulasViewProps {
  estado: EstadoAcademia
  nivel: NivelId
  modoInicial?: 'lesson' | 'cards'
  aulaInicialId?: string
  onAtualizarEstado: (updater: (prev: EstadoAcademia) => EstadoAcademia) => void
  onIrParaCaderno: (paginaId: string) => void
  onIniciarLaboratorio: (cenarioId: IdMissao) => void
  /**
   * Aviso de que a prática da missão ainda não está liberada, ou null com o portão aberto. Com aviso, o
   * botão deixa de prometer a Mesa de Trabalho: mostra o estado e leva ao Plano de Carreira.
   */
  avisoDaPratica?: (cenarioId: IdMissao) => string | null
  /** Nível do título da aula. As páginas da jornada têm o próprio h1 e passam 2. */
  nivelTitulo?: 1 | 2
}

export function AulasView({
  estado,
  nivel,
  modoInicial = 'lesson',
  aulaInicialId,
  onAtualizarEstado,
  onIrParaCaderno,
  onIniciarLaboratorio,
  avisoDaPratica,
  nivelTitulo = 1,
}: AulasViewProps) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h1'
  const L = nivelPorId(nivel)
  const ls = LESSONS[nivel]
  const cs = CARDS[nivel]
  const idxModulo = LEVELS.findIndex((x) => x.id === nivel)

  const [modo, setModo] = useState<'lesson' | 'cards'>(modoInicial)
  const [aulaId, setAulaId] = useState<string>(
    aulaInicialId && ls.some((x) => x.id === aulaInicialId)
      ? aulaInicialId
      : (ls.find((l) => !estado.lessonsDone.includes(l.id)) ?? ls[0]).id,
  )
  const [revelado, setRevelado] = useState(false)
  const [respondido, setRespondido] = useState<number | null>(null)
  const [avaliado, setAvaliado] = useState(false)
  const [cardIdx, setCardIdx] = useState(() => Math.max(0, cs.findIndex((c) => isCardDue(estado, c.id))))
  const [flipped, setFlipped] = useState(false)
  const [avisoLocal, setAvisoLocal] = useState<string | null>(null)

  const aulaAtual = ls.find((x) => x.id === aulaId) ?? ls[0]
  const aulaIndex = ls.findIndex((x) => x.id === aulaAtual.id)
  const pr = calcularProgressoNivel(estado, nivel)
  const cenarioDaAula = aulaAtual.cenarioId ?? L.cenarioId
  const avisoDoNivel = avisoDaPratica?.(L.cenarioId) ?? null
  const avisoDaAula = avisoDaPratica?.(cenarioDaAula) ?? null
  const dueHere = cs.filter((c) => isCardDue(estado, c.id)).length

  let paginaCornell = estado.pages.find((x) => x.level === nivel && x.type === 'cornell')
  if (!paginaCornell) {
    paginaCornell = {
      id: `pg-${nivel}`,
      icon: L.icon,
      title: `${L.nome}: Anotações`,
      level: nivel,
      type: 'cornell',
      cues: '',
      notes: '',
      summary: '',
    }
  }

  function atualizarCampoCornell(campo: 'cues' | 'notes', valor: string) {
    onAtualizarEstado((prev) => {
      const existe = prev.pages.some((p) => p.id === paginaCornell!.id)
      const pages = existe
        ? prev.pages.map((p) => (p.id === paginaCornell!.id ? { ...p, [campo]: valor } : p))
        : [...prev.pages, { ...paginaCornell!, [campo]: valor }]
      return { ...prev, pages }
    })
  }

  function selecionarAula(id: string) {
    setModo('lesson')
    setAulaId(id)
    setRevelado(false)
    setRespondido(null)
    setAvaliado(false)
    setAvisoLocal(null)
  }

  function enviarPontosAoCaderno() {
    const bloco = `[${aulaAtual.title}]\n${aulaAtual.keys.map((k) => `• ${k}`).join('\n')}`
    onAtualizarEstado((prev) => {
      const existe = prev.pages.some((p) => p.id === paginaCornell!.id)
      const basePage = prev.pages.find((p) => p.id === paginaCornell!.id) ?? paginaCornell!
      const novasNotas = `${(basePage.notes ?? '').trim()}\n${bloco}`.trim()
      const novasCues = `${(basePage.cues ?? '').trim()}\n${aulaAtual.quiz.q}`.trim()
      const atualizada = { ...basePage, notes: novasNotas, cues: novasCues }
      const pages = existe
        ? prev.pages.map((p) => (p.id === atualizada.id ? atualizada : p))
        : [...prev.pages, atualizada]
      return { ...prev, pages }
    })
    setAvisoLocal('Pontos-chave enviados ao seu caderno Cornell.')
  }

  function avaliarAula(dias: number) {
    onAtualizarEstado((prev) => {
      const jaConcluida = prev.lessonsDone.includes(aulaAtual.id)
      return {
        ...prev,
        lessonsDone: jaConcluida ? prev.lessonsDone : [...prev.lessonsDone, aulaAtual.id],
        xp: jaConcluida ? prev.xp : prev.xp + 20,
        weekMin: jaConcluida ? prev.weekMin : prev.weekMin + aulaAtual.min,
      }
    })
    setAvaliado(true)
    setAvisoLocal(`Aula concluída! Revisão agendada para ${dias === 1 ? 'amanhã' : `daqui a ${dias} dias`}.`)
  }

  function avaliarFlashcard(cardId: string, dias: number) {
    onAtualizarEstado((prev) => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: { due: dias } },
    }))
    setFlipped(false)
    setCardIdx((i) => (i + 1) % cs.length)
    setAvisoLocal(`Próxima revisão deste cartão agendada para daqui a ${dias} dia(s).`)
  }

  const cardAtual = cs[cardIdx % cs.length]
  const cardStatus = estado.cards[cardAtual.id]

  return (
    <div className="page">
      <div className="grid-aula">
        <nav className="edu-card card-b" aria-label="Aulas do nível">
          <p className="eyebrow">Módulo {idxModulo + 1} de {LEVELS.length}</p>
          <h2 className="h2 titulo-com-icone">
            <Icone nome={L.icon} tamanho={24} />
            {L.nome}
          </h2>
          <p className="muted nivel-sub">{L.sub}</p>
          <div className="mini-top">
            <span>Teoria</span>
            <strong>{pr.t}%</strong>
          </div>
          <progress className="bar theory" aria-label="Progresso da teoria" value={pr.t} max={100} />

          <ol className="lesson-list">
            {ls.map((l, i) => {
              const done = estado.lessonsDone.includes(l.id)
              const active = modo === 'lesson' && aulaAtual.id === l.id
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    className={`lesson-item ${done ? 'done ' : ''}${active ? 'active' : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => selecionarAula(l.id)}
                  >
                    <span className="tick">{done ? <Icone nome="confirmar" tamanho={16} /> : i + 1}</span>
                    <span>
                      <strong>{l.title}</strong>
                      <span className="muted d-block">{l.min} min</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <hr className="divider" />

          <button
            type="button"
            className={`lesson-item ${modo === 'cards' ? 'active-fix' : ''}`}
            onClick={() => {
              setModo('cards')
              setFlipped(false)
              setAvisoLocal(null)
            }}
          >
            <span className="tick fix">
              <Icone nome="cartoes" tamanho={16} />
            </span>
            <span>
              <strong>Flashcards de revisão</strong>
              <span className="muted d-block">{dueHere} para revisar hoje</span>
            </span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-block mt"
            aria-describedby={avisoDoNivel ? 'aviso-pratica-nivel' : undefined}
            onClick={() => onIniciarLaboratorio(L.cenarioId)}
          >
            <Icone nome={avisoDoNivel ? 'plano-de-carreira' : 'praticar'} tamanho={16} />
            {avisoDoNivel ? 'Ver o Plano de Carreira' : 'Praticar no laboratório'}
          </button>
          {avisoDoNivel && (
            <p id="aviso-pratica-nivel" className="muted mt-1">
              {avisoDoNivel}
            </p>
          )}
        </nav>

        <div>
          {avisoLocal && (
            <div className="banner-notice aviso-estudo">
              <span>{avisoLocal}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAvisoLocal(null)}>
                Fechar
              </button>
            </div>
          )}

          {modo === 'cards' ? (
            <section className="edu-card card-b" aria-label="Flashcards">
              <p className="meta-linha">
                <span className="meta-item">
                  <Icone nome="cartoes" tamanho={16} />
                  Fixação
                </span>
                <span className="meta-item">Repetição espaçada</span>
                <span className="meta-item">
                  Cartão {(cardIdx % cs.length) + 1} de {cs.length}
                </span>
              </p>
              <Titulo className="lesson-title">Flashcards de {L.nome}</Titulo>
              <p className="muted">
                Leia a pergunta, responda de cabeça e só depois vire o cartão. Avalie com honestidade para agendar a revisão.
              </p>

              <div className={`flash ${flipped ? 'flipped' : ''}`}>
                <div className="flash-inner">
                  <div className="face front" aria-hidden={flipped}>
                    <span className="face-rotulo">Pergunta</span>
                    <p className="flash-q">{cardAtual.f}</p>
                  </div>
                  <div className="face back" aria-hidden={!flipped}>
                    <span className="face-rotulo">Resposta</span>
                    <p className="flash-a">{cardAtual.b}</p>
                  </div>
                </div>
              </div>

              {flipped ? (
                <>
                  <p className="center">
                    <strong>Como foi lembrar?</strong>
                  </p>
                  <div className="rate">
                    <button type="button" className="r-hard" onClick={() => avaliarFlashcard(cardAtual.id, 1)}>
                      Errei ou foi difícil
                      <small>volta amanhã</small>
                    </button>
                    <button type="button" className="r-good" onClick={() => avaliarFlashcard(cardAtual.id, 3)}>
                      Lembrei com esforço
                      <small>em 3 dias</small>
                    </button>
                    <button type="button" className="r-easy" onClick={() => avaliarFlashcard(cardAtual.id, 7)}>
                      Lembrei fácil
                      <small>em 7 dias</small>
                    </button>
                  </div>
                </>
              ) : (
                <div className="center">
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => setFlipped(true)}>
                    <Icone nome="virar" tamanho={16} />
                    Virar cartão
                  </button>
                </div>
              )}

              <p className="center muted mt">
                {cardStatus ? `Próxima revisão deste cartão: em ${cardStatus.due} dia(s)` : 'Cartão novo, primeira revisão'}
              </p>

              <div className="dots" aria-hidden="true">
                {cs.map((x, k) => (
                  <span
                    key={x.id}
                    className={`dot ${estado.cards[x.id] ? 'ok ' : ''}${k === cardIdx % cs.length ? 'cur' : ''}`}
                  />
                ))}
              </div>
            </section>
          ) : (
            <article className="edu-card" aria-labelledby="lesson-title">
              <div className="card-b">
                <p className="meta-linha">
                  <span className="meta-item">
                    <Icone nome="aulas" tamanho={16} />
                    Teoria
                  </span>
                  <span className="meta-item">
                    Aula {aulaIndex + 1} de {ls.length}
                  </span>
                  <span className="meta-item">
                    <Icone nome="relogio" tamanho={16} />
                    {aulaAtual.min} min
                  </span>
                  {estado.lessonsDone.includes(aulaAtual.id) && (
                    <span className="meta-item meta-ok">
                      <Icone nome="confirmar" tamanho={16} />
                      Concluída
                    </span>
                  )}
                </p>

                <Titulo id="lesson-title" className="lesson-title">
                  {aulaAtual.title}
                </Titulo>

                <div className="analogy">
                  <span className="analogy-ic">
                    <Icone nome="ideia" tamanho={24} />
                  </span>
                  <div>
                    <strong>Analogia do dia a dia</strong>
                    <p>{aulaAtual.analogy}</p>
                  </div>
                </div>

                {aulaAtual.paragraphs.map((p, i) => (
                  <p key={i} className="lesson-p">
                    {p.text}
                  </p>
                ))}

                <h2 className="h3">Como funciona, num olhar</h2>
                <div className="flow">
                  {aulaAtual.flow.map((step, k) => (
                    <span key={k} className="flow-passo">
                      {k > 0 && (
                        <Icone nome="avancar" tamanho={16} className="flow-arrow" />
                      )}
                      <span className="flow-node">{step}</span>
                    </span>
                  ))}
                </div>

                <div className="keys">
                  <div className="row-between">
                    <h2 className="h3">Pontos-chave</h2>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={enviarPontosAoCaderno}>
                      <Icone nome="notas" tamanho={16} />
                      Enviar ao meu caderno
                    </button>
                  </div>
                  <ul>
                    {aulaAtual.keys.map((k, idx) => (
                      <li key={idx}>{k}</li>
                    ))}
                  </ul>
                </div>

                <section className="recall" aria-live="polite">
                  <p className="meta-linha">
                    <span className="meta-item">
                      <Icone nome="cartoes" tamanho={16} />
                      Checkpoint de recordação ativa
                    </span>
                  </p>
                  <p className="recall-q">{aulaAtual.quiz.q}</p>
                  {!revelado ? (
                    <>
                      <p>
                        Antes de ver as alternativas, <strong>responda de cabeça</strong> (ou escreva nas anotações ao lado). Tentar lembrar é o que mais fixa a memória.
                      </p>
                      <button type="button" className="btn btn-primary mt" onClick={() => setRevelado(true)}>
                        Já pensei — mostrar alternativas
                      </button>
                    </>
                  ) : (
                    <>
                      {aulaAtual.quiz.opts.map((opt, k) => {
                        let cls = ''
                        if (respondido !== null) {
                          if (k === aulaAtual.quiz.ok) cls = 'correct'
                          else if (k === respondido) cls = 'wrong'
                        }
                        return (
                          <button
                            key={k}
                            type="button"
                            className={`opt ${cls}`}
                            disabled={respondido !== null}
                            onClick={() => setRespondido(k)}
                          >
                            {String.fromCharCode(65 + k)}) {opt}
                          </button>
                        )
                      })}

                      {respondido !== null && (
                        <>
                          <div className={`feedback ${respondido === aulaAtual.quiz.ok ? 'feedback-certo' : 'feedback-errado'}`}>
                            <strong>
                              {respondido === aulaAtual.quiz.ok
                                ? 'Isso mesmo!'
                                : `Quase! A resposta certa é a ${String.fromCharCode(65 + aulaAtual.quiz.ok)}.`}
                            </strong>{' '}
                            {aulaAtual.quiz.why}
                          </div>

                          {!avaliado ? (
                            <>
                              <p className="mt">
                                <strong>Quão fácil foi lembrar?</strong> Sua resposta define quando revisaremos este assunto.
                              </p>
                              <div className="rate">
                                <button type="button" className="r-hard" onClick={() => avaliarAula(1)}>
                                  Difícil
                                  <small>revisar amanhã</small>
                                </button>
                                <button type="button" className="r-good" onClick={() => avaliarAula(3)}>
                                  Bom
                                  <small>revisar em 3 dias</small>
                                </button>
                                <button type="button" className="r-easy" onClick={() => avaliarAula(7)}>
                                  Fácil
                                  <small>revisar em 7 dias</small>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="row wrap gap mt">
                              <span className="meta-item meta-ok">
                                <Icone nome="confirmar" tamanho={16} />
                                Aula concluída, +20 XP
                              </span>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                  if (aulaIndex < ls.length - 1) {
                                    selecionarAula(ls[aulaIndex + 1].id)
                                  } else {
                                    setModo('cards')
                                    setFlipped(false)
                                  }
                                }}
                              >
                                {aulaIndex < ls.length - 1 ? 'Próxima aula' : 'Ir para os flashcards'}
                                <Icone nome="avancar" tamanho={16} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                aria-describedby={avisoDaAula ? 'aviso-pratica-aula' : undefined}
                                onClick={() => onIniciarLaboratorio(cenarioDaAula)}
                              >
                                <Icone nome={avisoDaAula ? 'plano-de-carreira' : 'praticar'} tamanho={16} />
                                {avisoDaAula ? 'Ver o Plano de Carreira' : 'Praticar agora'}
                              </button>
                              {avisoDaAula && (
                                <p id="aviso-pratica-aula" className="muted">
                                  {avisoDaAula}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </section>
              </div>
            </article>
          )}
        </div>

        <aside className="edu-card card-b notes-col" aria-label="Minhas anotações">
          <div className="row-between">
            <h2 className="h3 titulo-com-icone">
              <Icone nome="notas" tamanho={20} />
              Minhas anotações
            </h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onIrParaCaderno(paginaCornell.id)}>
              Abrir no Caderno
              <Icone nome="avancar" tamanho={16} />
            </button>
          </div>
          <p className="muted mt-1">
            Método Cornell: escreva com suas palavras enquanto estuda. Salva automaticamente no navegador.
          </p>
          <label className="block-label" htmlFor="as-cues">
            Perguntas-chave
          </label>
          <textarea
            id="as-cues"
            className="block xs"
            value={paginaCornell.cues ?? ''}
            onChange={(e) => atualizarCampoCornell('cues', e.target.value)}
          />
          <label className="block-label" htmlFor="as-notes">
            Anotações
          </label>
          <textarea
            id="as-notes"
            className="block"
            value={paginaCornell.notes ?? ''}
            onChange={(e) => atualizarCampoCornell('notes', e.target.value)}
          />
          <p className="muted saved">
            <Icone nome="confirmar" tamanho={16} />
            Salvo automaticamente
          </p>
        </aside>
      </div>
    </div>
  )
}
