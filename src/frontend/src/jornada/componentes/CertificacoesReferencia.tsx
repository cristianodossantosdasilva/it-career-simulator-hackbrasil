import { useId } from 'react'
import { AVISO_CERTIFICACOES } from '../catalogos/catalogoCertificacoes'
import type { VisaoItemCatalogo } from '../progressoRota'
import { SeloStatus } from './SeloStatus'

interface PropsCertificacoesReferencia {
  itens: readonly VisaoItemCatalogo[]
  /** Texto do título da lista. */
  titulo?: string
  /** h3 no Plano de Carreira, h2 na seção própria do Catálogo. */
  nivelTitulo: 2 | 3
}

/**
 * Certificações de referência de mercado com o status do mapeamento de conteúdo em texto e ícone e o
 * aviso fixo de que não há parceria, equivalência nem emissão. Não renderiza nada sem itens. É um grupo e
 * não uma região, porque o Plano de Carreira repete a lista em cada etapa e landmarks de mesmo nome violam o axe.
 */
export function CertificacoesReferencia({
  itens,
  titulo = 'Certificações de referência',
  nivelTitulo,
}: PropsCertificacoesReferencia) {
  const idTitulo = useId()
  if (itens.length === 0) return null
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h3'
  return (
    <div className="certificacoes-referencia" role="group" aria-labelledby={idTitulo}>
      <Titulo id={idTitulo}>{titulo}</Titulo>
      <p className="escala-nota">{AVISO_CERTIFICACOES}</p>
      <ul className="lista-certificacoes">
        {itens.map((item) => (
          <li key={item.id} className="item-certificacao">
            <span className="item-certificacao-nome">{item.titulo}</span>
            <SeloStatus status={item.status} />
            <p className="item-certificacao-texto">{item.descricao}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
