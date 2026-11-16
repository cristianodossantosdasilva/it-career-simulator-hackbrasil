import type { ReactNode } from 'react'
import { AlternadorTema } from '../shell/AlternadorTema'
import { useShell } from '../shell/contextoShell'
import { type ApiMenuPerfil, MenuPerfil } from '../shell/MenuPerfil'
import { Icone, type NomeIcone } from '../ui/Icone'
import type { EstadoAcademia, NivelId } from './catalogoEducacional'

export type VisaoAcademia = 'home' | 'aulas' | 'caderno' | 'mentor'

type Destino = VisaoAcademia | 'lab' | 'credencial'

const DESTINOS: { id: Destino; rotulo: string; icone: NomeIcone }[] = [
  { id: 'home', rotulo: 'Missões', icone: 'missoes' },
  { id: 'aulas', rotulo: 'Aulas', icone: 'aulas' },
  { id: 'lab', rotulo: 'Laboratório', icone: 'laboratorio' },
  { id: 'caderno', rotulo: 'Caderno', icone: 'caderno' },
  { id: 'mentor', rotulo: 'Mentor', icone: 'mentor' },
  { id: 'credencial', rotulo: 'Credencial', icone: 'credencial' },
]

const ROTULO_VISAO: Record<VisaoAcademia | 'lab', string> = {
  home: 'Missões',
  aulas: 'Aulas',
  caderno: 'Caderno',
  mentor: 'Mentor',
  lab: 'Laboratório',
}

interface BarraSuperiorProps {
  visaoAtual: VisaoAcademia | 'lab'
  estado: EstadoAcademia
  xpOficial?: number
  onSelecionarVisao?: (visao: VisaoAcademia) => void
  onEntrarLaboratorio?: () => void
  onMudarFoco?: (nivel: NivelId) => void
  onAbrirCurriculo?: () => void
  /** Destaca o destino Credencial (por exemplo, quando o Replay da sessao esta aberto). */
  credencialAtiva?: boolean
  /** Dados e acoes da sessao exibidos na barra de contexto (Workstation). */
  slotDireitoSessao?: ReactNode
  /** Conteudo extra do menu de perfil. */
  conteudoPerfil?: ReactNode | ((api: ApiMenuPerfil) => ReactNode)
  /** Substitui o rotulo do local atual na barra de contexto (por exemplo, Credencial). */
  rotuloLocal?: string
}

/**
 * Navegacao principal do shell: rail de 56 px no desktop, barra inferior abaixo de 768 px
 * (o mesmo elemento nav, reposicionado por CSS) e barra de contexto de 44 px.
 */
export function BarraSuperior({
  visaoAtual,
  estado,
  xpOficial,
  onSelecionarVisao,
  onEntrarLaboratorio,
  onMudarFoco,
  onAbrirCurriculo,
  credencialAtiva = false,
  slotDireitoSessao,
  conteudoPerfil,
  rotuloLocal,
}: BarraSuperiorProps) {
  const shell = useShell()
  const xpTotal = xpOficial ?? estado.xp

  function entrarLaboratorio() {
    if (visaoAtual === 'lab') return
    if (shell.sessaoAtiva && shell.retomarLaboratorio) {
      shell.retomarLaboratorio()
      return
    }
    onEntrarLaboratorio?.()
  }

  function acionar(destino: Destino) {
    if (destino === 'lab') entrarLaboratorio()
    else if (destino === 'credencial') onAbrirCurriculo?.()
    else onSelecionarVisao?.(destino)
  }

  function estaAtivo(destino: Destino) {
    if (destino === 'credencial') return credencialAtiva
    return !credencialAtiva && destino === visaoAtual
  }

  return (
    <>
      <div className="shell-rail">
        <div className="shell-rail-marca" aria-hidden="true">
          <Icone nome="marca" />
        </div>

        <nav className="nav-principal" aria-label="Navegação principal">
          <ul className="nav-principal-lista">
            {DESTINOS.filter((d) => d.id !== 'credencial' || onAbrirCurriculo).map((destino) => {
              const ativo = estaAtivo(destino.id)
              return (
                <li key={destino.id} className={destino.id === 'credencial' ? 'so-desktop' : undefined}>
                  <button
                    type="button"
                    className={`nav-item ${ativo ? 'active' : ''}`}
                    aria-current={ativo ? 'page' : undefined}
                    onClick={() => acionar(destino.id)}
                  >
                    <Icone nome={destino.icone} />
                    <span className="nav-item-rotulo">{destino.rotulo}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shell-rail-rodape">
          <AlternadorTema />
        </div>
      </div>

      <header className="barra-contexto">
        <p className="barra-contexto-trilha">
          <span className="barra-contexto-marca">IT Flight Simulator</span>
          <span className="barra-contexto-separador" aria-hidden="true">
            /
          </span>
          <span className="barra-contexto-local">{rotuloLocal ?? ROTULO_VISAO[visaoAtual]}</span>
        </p>
        <div className="barra-contexto-acoes">
          {slotDireitoSessao}
          <MenuPerfil
            estado={estado}
            xpTotal={xpTotal}
            onMudarFoco={visaoAtual !== 'lab' ? onMudarFoco : undefined}
            onAbrirCurriculo={onAbrirCurriculo}
          >
            {conteudoPerfil}
          </MenuPerfil>
        </div>
      </header>
    </>
  )
}
