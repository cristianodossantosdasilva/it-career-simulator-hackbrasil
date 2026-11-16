import { Icone } from '../ui/Icone'
import { useShell } from './contextoShell'
import { ROTULOS_TEMA, type TemaShell } from './tema'

const OPCOES: { tema: TemaShell; icone: 'tema-tatico' | 'tema-corporativo' }[] = [
  { tema: 'tactical', icone: 'tema-tatico' },
  { tema: 'corporate', icone: 'tema-corporativo' },
]

interface AlternadorTemaProps {
  /** compacto: so icones com dica (rail). completo: icone e texto (menu de perfil no celular). */
  variante?: 'compacto' | 'completo'
  className?: string
}

export function AlternadorTema({ variante = 'compacto', className }: AlternadorTemaProps) {
  const { tema, definirTema } = useShell()
  const classes = ['alternador-tema', `alternador-tema-${variante}`, className].filter(Boolean).join(' ')

  return (
    <div className={classes} role="group" aria-label="Tema da interface">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.tema}
          type="button"
          className="alternador-tema-opcao"
          aria-pressed={tema === opcao.tema}
          onClick={() => definirTema(opcao.tema)}
        >
          <Icone nome={opcao.icone} />
          <span className={variante === 'compacto' ? 'dica' : 'alternador-tema-texto'}>{ROTULOS_TEMA[opcao.tema]}</span>
        </button>
      ))}
    </div>
  )
}
