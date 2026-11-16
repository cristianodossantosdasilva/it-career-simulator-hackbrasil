import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react'
import { Icone } from '../ui/Icone'

export const CHAVE_LARGURA_GUIA = 'itfs_guia_pct'
const LARGURA_MIN = 20
const LARGURA_MAX = 50
const LARGURA_PADRAO = 32
const PASSO_TECLADO = 2

function limitar(valor: number): number {
  return Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, Math.round(valor)))
}

function carregarLargura(): number {
  try {
    const salvo = Number(window.localStorage.getItem(CHAVE_LARGURA_GUIA))
    return salvo >= LARGURA_MIN && salvo <= LARGURA_MAX ? salvo : LARGURA_PADRAO
  } catch {
    return LARGURA_PADRAO
  }
}

function salvarLargura(valor: number) {
  try {
    window.localStorage.setItem(CHAVE_LARGURA_GUIA, String(valor))
  } catch {
    // armazenamento indisponivel: a largura vale so para esta sessao
  }
}

interface SplitLabWorkspaceProps {
  /** Guia da missao (coluna da esquerda). */
  guia: ReactNode
  /** Console operacional: abas de ferramenta e a ferramenta ativa. */
  consola: ReactNode
  /** Gaveta opcional (notas ou mentor) a direita do console. */
  gaveta?: ReactNode
  /** Resumo curto do andamento mostrado no botao que abre o guia em telas estreitas. */
  resumoGuia: string
}

/**
 * Split-Screen Lab: guia da missao a esquerda, console a direita, divisoria arrastavel e acessivel
 * por teclado. Abaixo de 1024 px o guia vira um painel recolhivel acima do console.
 */
export function SplitLabWorkspace({ guia, consola, gaveta, resumoGuia }: SplitLabWorkspaceProps) {
  const [largura, setLargura] = useState(carregarLargura)
  const [guiaAberto, setGuiaAberto] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const grade = useRef<HTMLDivElement>(null)

  function aoIniciarArraste(evento: PointerEvent<HTMLDivElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    setArrastando(true)
  }

  function aoArrastar(evento: PointerEvent<HTMLDivElement>) {
    if (!arrastando || !grade.current) return
    const caixa = grade.current.getBoundingClientRect()
    if (caixa.width === 0) return
    setLargura(limitar(((evento.clientX - caixa.left) / caixa.width) * 100))
  }

  function aoTerminarArraste(evento: PointerEvent<HTMLDivElement>) {
    if (!arrastando) return
    evento.currentTarget.releasePointerCapture(evento.pointerId)
    setArrastando(false)
    salvarLargura(largura)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const proximos: Record<string, number> = {
      ArrowLeft: largura - PASSO_TECLADO,
      ArrowRight: largura + PASSO_TECLADO,
      Home: LARGURA_MIN,
      End: LARGURA_MAX,
    }
    if (!(evento.key in proximos)) return
    evento.preventDefault()
    const novo = limitar(proximos[evento.key])
    setLargura(novo)
    salvarLargura(novo)
  }

  const estilo = { '--guia-largura': `${largura}%` } as CSSProperties

  return (
    <div className={`lab-split ${gaveta ? 'com-gaveta' : ''}`} ref={grade} style={estilo} data-arrastando={arrastando}>
      <button
        type="button"
        className="lab-guia-alternar"
        aria-expanded={guiaAberto}
        aria-controls="lab-guia-painel"
        onClick={() => setGuiaAberto((aberto) => !aberto)}
      >
        <Icone nome="missoes" />
        <span>Guia da missão</span>
        <span className="lab-guia-alternar-resumo dado-mono">{resumoGuia}</span>
        <Icone nome="expandir" tamanho={16} />
      </button>

      <div id="lab-guia-painel" className="lab-guia-coluna" data-aberto={guiaAberto}>
        {guia}
      </div>

      <div
        className="lab-divisor"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar o guia da missão"
        aria-controls="lab-guia-painel"
        aria-valuenow={largura}
        aria-valuemin={LARGURA_MIN}
        aria-valuemax={LARGURA_MAX}
        tabIndex={0}
        onPointerDown={aoIniciarArraste}
        onPointerMove={aoArrastar}
        onPointerUp={aoTerminarArraste}
        onPointerCancel={aoTerminarArraste}
        onKeyDown={aoTeclar}
      />

      <div className="lab-console">{consola}</div>

      {gaveta}
    </div>
  )
}
