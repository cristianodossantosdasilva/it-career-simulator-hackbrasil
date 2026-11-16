import { useState } from 'react'
import { type EstadoAcademia, type PaginaCaderno, nivelPorId } from './catalogoEducacional'

interface CadernoViewProps {
  estado: EstadoAcademia
  onAtualizarEstado: (updater: (prev: EstadoAcademia) => EstadoAcademia) => void
}

export function CadernoView({ estado, onAtualizarEstado }: CadernoViewProps) {
  const [busca, setBusca] = useState('')
  const [novaMeta, setNovaMeta] = useState('')

  const paginaAtiva = estado.pages.find((p) => p.id === estado.activePage) ?? estado.pages[0]
  const q = busca.toLowerCase()
  const paginasFiltradas = estado.pages.filter(
    (p) => !q || p.title.toLowerCase().includes(q) || (p.notes ?? p.text ?? '').toLowerCase().includes(q),
  )

  const tipoLabel = {
    cornell: 'Método Cornell',
    todo: 'Plano de estudos',
    free: 'Página livre',
  }[paginaAtiva.type]

  function atualizarPagina(id: string, patch: Partial<PaginaCaderno>) {
    onAtualizarEstado((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }

  function criarPagina(tpl: 'cornell' | 'todo' | 'free') {
    const id = `pg-${Date.now()}`
    const focusLvl = nivelPorId(estado.focus)
    const nova: PaginaCaderno =
      tpl === 'cornell'
        ? {
            id,
            icon: '📝',
            title: `Novas anotações · ${focusLvl.nome}`,
            level: estado.focus,
            type: 'cornell',
            cues: '',
            notes: '',
            summary: '',
          }
        : tpl === 'todo'
          ? { id, icon: '🎯', title: 'Novo plano de estudos', level: null, type: 'todo', todos: [] }
          : { id, icon: '📄', title: 'Página sem título', level: null, type: 'free', text: '' }

    onAtualizarEstado((prev) => ({
      ...prev,
      pages: [...prev.pages, nova],
      activePage: id,
    }))
  }

  function excluirPagina(id: string) {
    if (id === 'plano') return
    onAtualizarEstado((prev) => ({
      ...prev,
      pages: prev.pages.filter((p) => p.id !== id),
      activePage: 'plano',
    }))
  }

  function alternarTodo(index: number) {
    const list = paginaAtiva.todos ?? []
    atualizarPagina(
      paginaAtiva.id,
      { todos: list.map((td, idx) => (idx === index ? { ...td, done: !td.done } : td)) },
    )
  }

  function adicionarTodo() {
    const txt = novaMeta.trim()
    if (!txt) return
    atualizarPagina(paginaAtiva.id, { todos: [...(paginaAtiva.todos ?? []), { t: txt, done: false }] })
    setNovaMeta('')
  }

  function removerTodo(index: number) {
    const list = paginaAtiva.todos ?? []
    atualizarPagina(paginaAtiva.id, { todos: list.filter((_, idx) => idx !== index) })
  }

  return (
    <div className="page">
      <div className="page-head">
        <p className="eyebrow">Fixação</p>
        <h1 className="h1">📓 Caderno de estudos</h1>
        <p className="lead">
          Seu espaço estilo Notion: anotações por nível no Método Cornell, plano de estudos e dúvidas. Ele também abre ao lado das aulas e do laboratório.
        </p>
      </div>

      <div className="grid-notes">
        <aside className="edu-card card-b" aria-label="Páginas do caderno">
          <label className="block-label" htmlFor="cad-q" style={{ marginTop: 0 }}>
            Buscar
          </label>
          <input
            id="cad-q"
            type="text"
            className="text"
            placeholder="Buscar nas páginas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="stack-xs" style={{ marginTop: '12px' }}>
            {paginasFiltradas.length === 0 ? (
              <p className="muted" style={{ padding: '8px' }}>
                Nenhuma página encontrada.
              </p>
            ) : (
              paginasFiltradas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`tree-item ${p.id === paginaAtiva.id ? 'active' : ''}`}
                  onClick={() => onAtualizarEstado((prev) => ({ ...prev, activePage: p.id }))}
                >
                  <span aria-hidden="true">{p.icon}</span>
                  <span className="tree-title">{p.title || 'Sem título'}</span>
                </button>
              ))
            )}
          </div>

          <hr className="divider" />
          <p className="block-label" style={{ marginTop: 0 }}>
            Nova página
          </p>
          <div className="stack-xs">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('cornell')}>
              + Anotações (Cornell)
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('todo')}>
              + Plano de estudos
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('free')}>
              + Página livre
            </button>
          </div>
        </aside>

        <article className="edu-card editor" aria-label="Editor da página">
          <div className="row wrap gap">
            <span className="chip c-fix">{tipoLabel}</span>
            {paginaAtiva.level && (
              <span className="chip">
                {nivelPorId(paginaAtiva.level).icon} {nivelPorId(paginaAtiva.level).nome}
              </span>
            )}
            <span className="muted">✓ Salvo automaticamente</span>
          </div>

          <label className="skip" htmlFor="ed-title">
            Título da página
          </label>
          <input
            id="ed-title"
            type="text"
            className="title-input"
            value={paginaAtiva.title}
            onChange={(e) => atualizarPagina(paginaAtiva.id, { title: e.target.value })}
          />

          {paginaAtiva.type === 'cornell' ? (
            <>
              <div className="hint">
                📐 <strong>Método Cornell:</strong> perguntas à esquerda, anotações à direita e um resumo embaixo. Para revisar, cubra as anotações e tente responder às perguntas.
              </div>
              <div className="cornell">
                <div>
                  <label className="block-label" htmlFor="ed-cues">
                    Perguntas-chave (pistas)
                  </label>
                  <textarea
                    id="ed-cues"
                    className="block"
                    value={paginaAtiva.cues ?? ''}
                    onChange={(e) => atualizarPagina(paginaAtiva.id, { cues: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block-label" htmlFor="ed-notes">
                    Anotações
                  </label>
                  <textarea
                    id="ed-notes"
                    className="block"
                    value={paginaAtiva.notes ?? ''}
                    onChange={(e) => atualizarPagina(paginaAtiva.id, { notes: e.target.value })}
                  />
                </div>
              </div>
              <label className="block-label" htmlFor="ed-sum">
                Resumo em até 3 linhas
              </label>
              <textarea
                id="ed-sum"
                className="block sm"
                value={paginaAtiva.summary ?? ''}
                onChange={(e) => atualizarPagina(paginaAtiva.id, { summary: e.target.value })}
              />
            </>
          ) : paginaAtiva.type === 'todo' ? (
            <>
              <div className="hint">
                🎯 Metas pequenas e específicas funcionam melhor. Exemplo: &quot;15 min de flashcards&quot; em vez de &quot;estudar redes&quot;.
              </div>
              {(paginaAtiva.todos ?? []).map((td, idx) => (
                <div key={idx} className={`todo ${td.done ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    id={`td-${idx}`}
                    checked={td.done}
                    onChange={() => alternarTodo(idx)}
                  />
                  <label htmlFor={`td-${idx}`}>{td.t}</label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label="Remover tarefa"
                    onClick={() => removerTodo(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <form
                className="row gap mt"
                onSubmit={(e) => {
                  e.preventDefault()
                  adicionarTodo()
                }}
              >
                <label className="skip" htmlFor="todo-new">
                  Nova meta de estudo
                </label>
                <input
                  id="todo-new"
                  type="text"
                  className="text"
                  placeholder="Nova meta de estudo..."
                  value={novaMeta}
                  onChange={(e) => setNovaMeta(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Adicionar
                </button>
              </form>
            </>
          ) : (
            <>
              <label className="block-label" htmlFor="ed-free">
                Conteúdo
              </label>
              <textarea
                id="ed-free"
                className="block"
                style={{ minHeight: '340px' }}
                value={paginaAtiva.text ?? ''}
                onChange={(e) => atualizarPagina(paginaAtiva.id, { text: e.target.value })}
              />
            </>
          )}

          {paginaAtiva.id !== 'plano' && (
            <div className="mt">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => excluirPagina(paginaAtiva.id)}>
                🗑️ Excluir página
              </button>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
