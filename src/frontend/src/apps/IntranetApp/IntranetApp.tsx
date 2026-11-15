import { useEffect, useRef, useState } from 'react'
import { KB_CATALOGO, type ArtigoKb } from '../../data/kbCatalogo'

interface Props {
  artigoSelecionadoId?: string | null
  onArtigoFechado?: () => void
}

export function IntranetApp({ artigoSelecionadoId, onArtigoFechado }: Props) {
  const [busca, setBusca] = useState('')
  const [artigoExpandido, setArtigoExpandido] = useState<string | null>(artigoSelecionadoId ?? null)
  const tituloRefs = useRef<Record<string, HTMLHeadingElement | null>>({})
  const ultimoFocoRef = useRef<HTMLElement | null>(null)

  const filtrados = KB_CATALOGO.filter(
    (a) =>
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
      a.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      a.id.toLowerCase().includes(busca.toLowerCase()),
  )

  useEffect(() => {
    if (artigoSelecionadoId) {
      requestAnimationFrame(() => {
        const el = tituloRefs.current[artigoSelecionadoId]
        if (el) {
          el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
          el.focus()
        }
      })
    }
  }, [artigoSelecionadoId])

  function handleFecharArtigo() {
    setArtigoExpandido(null)
    onArtigoFechado?.()
    if (ultimoFocoRef.current) {
      ultimoFocoRef.current.focus()
      ultimoFocoRef.current = null
    }
  }

  function handleExpandir(artigo: ArtigoKb, evento: React.MouseEvent | React.KeyboardEvent) {
    ultimoFocoRef.current = evento.currentTarget as HTMLElement
    setArtigoExpandido(artigo.id)
    requestAnimationFrame(() => {
      const el = tituloRefs.current[artigo.id]
      if (el) {
        el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
    })
  }

  return (
    <section className="panel" aria-label="Intranet e Base de Conhecimento">
      <div className="row-between">
        <h2>Intranet — Base de Conhecimento (Aurora Logistica)</h2>
        <input
          aria-label="Buscar na Base de Conhecimento"
          placeholder="Buscar procedimento, categoria ou ID..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <p className="muted">{filtrados.length} artigo(s) encontrado(s)</p>

      <div className="kb-list" role="list" aria-label="Artigos da Base de Conhecimento">
        {filtrados.map((a) => {
          const expandido = artigoExpandido === a.id
          return (
            <div key={a.id} role="listitem">
              <article className={`card-section kb-article ${expandido ? 'kb-expanded' : ''}`}>
              <h3
                ref={(el) => {
                  tituloRefs.current[a.id] = el
                }}
                tabIndex={-1}
                id={`kb-titulo-${a.id}`}
              >
                <button
                  type="button"
                  className="kb-titulo-btn"
                  aria-expanded={expandido}
                  aria-controls={`kb-conteudo-${a.id}`}
                  onClick={(e) => { if (expandido) handleFecharArtigo(); else handleExpandir(a, e) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (expandido) handleFecharArtigo()
                      else handleExpandir(a, e)
                    }
                  }}
                >
                  <span className="kb-id">{a.id}</span>
                  <span className="kb-titulo-text">{a.titulo}</span>
                  <span className="kb-categoria badge">{a.categoria}</span>
                  <span className="kb-nivel badge badge-info">{a.nivel.join(', ')}</span>
                </button>
              </h3>
              {expandido && (
                <div id={`kb-conteudo-${a.id}`} className="kb-conteudo" role="region" aria-labelledby={`kb-titulo-${a.id}`}>
                  <p>{a.conteudo}</p>
                  <button type="button" className="chip" onClick={handleFecharArtigo}>
                    Fechar artigo
                  </button>
                </div>
              )}
              </article>
            </div>
          )
        })}
      </div>
    </section>
  )
}
