import { Icone } from '../../ui/Icone'
import { TEXTO_SELO_DEMONSTRACAO } from './textosDemonstracao'

/**
 * Selo de uma Etapa com o modo de demonstração ativo. Mesma estrutura de `SeloStatus`, com ícone e
 * texto, e cor de informação: não usa a cor de sucesso para não ser confundido com Etapa concluída.
 */
export function SeloDemonstracao() {
  return (
    <span className="selo-status selo-demonstracao">
      <Icone nome="demonstracao" tamanho={16} />
      <span>{TEXTO_SELO_DEMONSTRACAO}</span>
    </span>
  )
}