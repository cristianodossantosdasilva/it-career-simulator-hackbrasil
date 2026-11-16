import { useState } from 'react'
import { Icone } from '../ui/Icone'
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
            icon: 'notas',
            title: `Novas anotações: ${focusLvl.nome}`,
            level: estado.focus,
            type: 'cornell',
            cues: '',
            notes: '',
            summary: '',
          }
        : tpl === 'todo'
          ? { id, icon: 'meta', title: 'Novo plano de estudos', level: null, type: 'todo', todos: [] }
          : { id, icon: 'pagina', title: 'Página sem título', level: null, type: 'free', text: '' }

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
        <h1 className="h1">Caderno de estudos</h1>
        <p className="lead">
          Anotações por nível no Método Cornell, plano de estudos e dúvidas. O caderno também abre ao lado das aulas e do laboratório.
        </p>
      </div>

      <div className="grid-notes">
        <aside className="edu-card card-b" aria-label="Páginas do caderno">
          <label className="block-label primeiro" htmlFor="cad-q">
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

          <div className="stack-xs mt">
            {paginasFiltradas.length === 0 ? (
              <p className="muted vazio-lista">
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
                  <Icone nome={p.icon} tamanho={16} />
                  <span className="tree-title">{p.title || 'Sem título'}</span>
                </button>
              ))
            )}
          </div>

          <hr className="divider" />
          <p className="block-label primeiro">
            Nova página
          </p>
          <div className="stack-xs">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('cornell')}>
              <Icone nome="adicionar" tamanho={16} />
              Anotações (Cornell)
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('todo')}>
              <Icone nome="adicionar" tamanho={16} />
              Plano de estudos
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => criarPagina('free')}>
              <Icone nome="adicionar" tamanho={16} />
              Página livre
            </button>
          </div>
        </aside>

        <article className="edu-card editor" aria-label="Editor da página">
          <p className="meta-linha">
            <span className="meta-item">{tipoLabel}</span>
            {paginaAtiva.level && (
              <span className="meta-item">
                <Icone nome={nivelPorId(paginaAtiva.level).icon} tamanho={16} />
                {nivelPorId(paginaAtiva.level).nome}
              </span>
            )}
            <span className="meta-item">
              <Icone nome="confirmar" tamanho={16} />
              Salvo automaticamente
            </span>
          </p>

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
                <Icone nome="info" tamanho={16} />
                <span>
                  <strong>Método Cornell:</strong> perguntas à esquerda, anotações à direita e um resumo embaixo. Para revisar, cubra as anotações e tente responder às perguntas.
                </span>
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
                <Icone nome="meta" tamanho={16} />
                <span>
                  Metas pequenas e específicas funcionam melhor. Exemplo: “15 min de flashcards” em vez de “estudar redes”.
                </span>
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
                    <Icone nome="fechar" tamanho={16} />
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
                className="block alto"
                value={paginaAtiva.text ?? ''}
                onChange={(e) => atualizarPagina(paginaAtiva.id, { text: e.target.value })}
              />
            </>
          )}

          {paginaAtiva.id !== 'plano' && (
            <div className="mt">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => excluirPagina(paginaAtiva.id)}>
                <Icone nome="excluir" tamanho={16} />
                Excluir página
              </button>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
