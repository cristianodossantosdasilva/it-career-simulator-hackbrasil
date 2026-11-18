import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { ITENS_MENU, type ItemMenu, hrefDoItem, itemAtivoDoMenu } from '../jornada/catalogos/catalogoNavegacao'
import type { IdMissao } from '../jornada/catalogos/catalogoRotas'
import { IndicadorModoDemonstracao } from '../jornada/demonstracao/IndicadorModoDemonstracao'
import { LinkInterno } from '../jornada/navegacao/LinkInterno'
import { type IdPagina, NOME_PAGINA } from '../jornada/navegacao/rotas'
import { BotaoAparencia } from '../shell/BotaoAparencia'
import { type ApiMenuPerfil, MenuPerfil } from '../shell/MenuPerfil'
import { Icone } from '../ui/Icone'
import type { EstadoAcademia, NivelId } from './catalogoEducacional'

export const ID_NAV_MAIS = 'nav-mais'

interface BarraSuperiorProps {
  paginaAtual: IdPagina
  /** Missão do voo ativo. Sem ela, o item Cabine não aparece. */
  missaoAtiva: IdMissao | null
  /** Modo de demonstração ativo: a barra de contexto mostra o indicador em toda página. */
  modoDemonstracao?: boolean
  estado: EstadoAcademia
  xpOficial?: number
  onMudarFoco?: (nivel: NivelId) => void
  onAbrirCurriculo?: () => void
  /** Dados e ações da sessão exibidos na barra de contexto (Cabine). */
  slotDireitoSessao?: ReactNode
  /** Conteúdo extra do menu de perfil. */
  conteudoPerfil?: ReactNode | ((api: ApiMenuPerfil) => ReactNode)
  /** Substitui o nome da página na barra de contexto. */
  rotuloLocal?: string
}

interface ItemVisivel {
  item: ItemMenu
  href: string
  ativo: boolean
}

interface PropsLinkDoMenu extends ItemVisivel {
  aoSeguir?: () => void
}

function LinkDoMenu({ item, href, ativo, aoSeguir }: PropsLinkDoMenu) {
  return (
    <LinkInterno
      href={href}
      className={`nav-item ${ativo ? 'active' : ''}`}
      aria-current={ativo ? 'page' : undefined}
      onClick={aoSeguir}
    >
      <Icone nome={item.icone} />
      <span className="nav-item-rotulo">{item.rotulo}</span>
    </LinkInterno>
  )
}

/**
 * Navegação principal por links: trilho de 56 px no desktop com os dois grupos separados, e barra
 * inferior abaixo de 768 px com os itens principais e o botão Mais, que abre os demais.
 */
export function BarraSuperior({
  paginaAtual,
  missaoAtiva,
  modoDemonstracao = false,
  estado,
  xpOficial,
  onMudarFoco,
  onAbrirCurriculo,
  slotDireitoSessao,
  conteudoPerfil,
  rotuloLocal,
}: BarraSuperiorProps) {
  const xpTotal = xpOficial ?? estado.xp
  const ativo = itemAtivoDoMenu(paginaAtual)
  const visiveis: ItemVisivel[] = ITENS_MENU.flatMap((item) => {
    const href = hrefDoItem(item, { missaoAtiva })
    return href ? [{ item, href, ativo: item.id === ativo }] : []
  })
  const principais = visiveis.filter((v) => v.item.grupo === 'principal')
  const demais = visiveis.filter((v) => v.item.grupo === 'mais')
  const maisAtivo = demais.some((v) => v.ativo)

  const [maisAberto, setMaisAberto] = useState(false)
  const botaoMaisRef = useRef<HTMLButtonElement>(null)
  const listaMaisRef = useRef<HTMLUListElement>(null)
  const idRotuloMais = useId()

  useEffect(() => {
    if (!maisAberto) return
    listaMaisRef.current?.querySelector<HTMLElement>('a[href]')?.focus()
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return
      setMaisAberto(false)
      botaoMaisRef.current?.focus()
    }
    function aoClicarFora(evento: PointerEvent) {
      const alvo = evento.target as Node
      if (listaMaisRef.current?.contains(alvo) || botaoMaisRef.current?.contains(alvo)) return
      setMaisAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('pointerdown', aoClicarFora)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('pointerdown', aoClicarFora)
    }
  }, [maisAberto])

  return (
    <>
      <div className="shell-rail">
        <div className="shell-rail-marca" aria-hidden="true">
          <Icone nome="marca" />
        </div>
        <nav className="nav-principal" aria-label="Navegação principal">
          <ul className="nav-principal-lista">
            {principais.map((v) => (
              <li key={v.item.id}>
                <LinkDoMenu {...v} />
              </li>
            ))}
            <li className="nav-separador so-desktop" aria-hidden="true" />
            {demais.map((v) => (
              <li key={v.item.id} className="so-desktop">
                <LinkDoMenu {...v} />
              </li>
            ))}
            <li className="so-mobile nav-mais-celula">
              <button
                ref={botaoMaisRef}
                type="button"
                className={`nav-item ${maisAtivo ? 'active' : ''}`}
                aria-expanded={maisAberto}
                aria-controls={ID_NAV_MAIS}
                onClick={() => setMaisAberto((aberto) => !aberto)}
              >
                <Icone nome="mais" />
                <span className="nav-item-rotulo" id={idRotuloMais}>
                  Mais
                </span>
              </button>
              <ul
                id={ID_NAV_MAIS}
                ref={listaMaisRef}
                className="nav-mais"
                aria-labelledby={idRotuloMais}
                hidden={!maisAberto}
              >
                {demais.map((v) => (
                  <li key={v.item.id}>
                    <LinkDoMenu {...v} aoSeguir={() => setMaisAberto(false)} />
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      <header className="barra-contexto">
        <p className="barra-contexto-trilha">
          <span className="barra-contexto-marca">IT Flight Simulator</span>
          <span className="barra-contexto-separador" aria-hidden="true">
            /
          </span>
          <span className="barra-contexto-local">{rotuloLocal ?? NOME_PAGINA[paginaAtual]}</span>
        </p>
        <div className="barra-contexto-acoes">
          {modoDemonstracao && <IndicadorModoDemonstracao />}
          {slotDireitoSessao}
          <BotaoAparencia />
          <MenuPerfil
            estado={estado}
            xpTotal={xpTotal}
            onMudarFoco={paginaAtual !== 'cabine' ? onMudarFoco : undefined}
            onAbrirCurriculo={onAbrirCurriculo}
          >
            {conteudoPerfil}
          </MenuPerfil>
        </div>
      </header>
    </>
  )
}
