import { Icone } from '../../ui/Icone'
import { LinkInterno } from '../navegacao/LinkInterno'
import { TEXTO_INDICADOR_MODO } from './textosDemonstracao'

/** Estado do modo na barra de contexto, em texto e ícone. Leva ao Plano de Carreira, onde fica o controle. */
export function IndicadorModoDemonstracao() {
  return (
    <LinkInterno href="/plano-de-carreira" className="indicador-modo-demonstracao">
      <Icone nome="demonstracao" tamanho={16} />
      <span>{TEXTO_INDICADOR_MODO}</span>
    </LinkInterno>
  )
}