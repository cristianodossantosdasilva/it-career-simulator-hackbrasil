import { Icone } from '../../ui/Icone'
import { escalaDaMissao } from '../catalogos/catalogoRotas'
import { LinkInterno } from '../navegacao/LinkInterno'
import { enderecoDe } from '../navegacao/rotas'
import { type VisaoMissao, textoCausas } from '../progressoRota'
import { SeloStatus } from './SeloStatus'
import { textosDaMissao } from './textosDaMissao'

interface PropsCartaoMissao {
  visao: VisaoMissao
  /** h3 nas etapas 1 a 3. h4 dentro de uma Vertente da N3 Sênior. */
  nivelTitulo: 3 | 4
}

export const TEXTO_MISSAO_EM_PREPARACAO = 'Este cenário ainda não está disponível no simulador.'

function EstadoDaMissao({ estado }: { estado: VisaoMissao['estado'] }) {
  switch (estado) {
    case 'em-preparacao':
      return <SeloStatus status="em-preparacao" />
    case 'disponivel':
      return <SeloStatus status="disponivel" />
    case 'bloqueada':
      return (
        <span className="escala-estado">
          <Icone nome="bloqueada" tamanho={16} />
          <span>Bloqueada</span>
        </span>
      )
    case 'concluida':
      return (
        <span className="escala-estado">
          <Icone nome="confirmar" tamanho={16} />
          <span>Concluída</span>
        </span>
      )
  }
}

/**
 * Missão do Plano de Carreira. Nome, etapa, Vertente e estado em texto. O Embarcar é um link para a Mesa de Trabalho
 * sem Causa nem semente, e só existe quando `podeEmbarcar`. Missão em preparação nunca tem Embarcar.
 */
export function CartaoMissao({ visao, nivelTitulo }: PropsCartaoMissao) {
  const local = escalaDaMissao(visao.missao)
  if (!local) return null
  const { titulo, descricao } = textosDaMissao(visao.missao)
  const Titulo = nivelTitulo === 3 ? 'h3' : 'h4'
  const href = enderecoDe({ pagina: 'cabine', missao: visao.missao, semente: null, causa: null, nova: false })
  const causas = textoCausas(visao.causas)
  const emPreparacao = visao.estado === 'em-preparacao'
  return (
    <li className="cartao-missao">
      <Titulo className="cartao-missao-titulo">{titulo}</Titulo>
      <p className="cartao-missao-meta">
        <EstadoDaMissao estado={visao.estado} />
        <span>Escala: {local.escala.nome}</span>
        {local.vertente && <span>Vertente: {local.vertente.nome}</span>}
      </p>
      {descricao && <p className="cartao-missao-texto">{descricao}</p>}
      {emPreparacao && <p className="cartao-missao-texto">{TEXTO_MISSAO_EM_PREPARACAO}</p>}
      {causas && <p className="cartao-missao-texto">{causas}</p>}
      {!emPreparacao && (
        <div className="cartao-missao-acoes">
          {visao.podeEmbarcar ? (
            <LinkInterno href={href} className="btn btn-primary btn-sm">
              <Icone nome="embarcar" tamanho={16} />
              <span>
                Embarcar<span className="sr-only"> em {titulo}</span>
              </span>
            </LinkInterno>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" disabled>
              <Icone nome="bloqueada" tamanho={16} />
              <span>
                Embarcar<span className="sr-only"> em {titulo}, bloqueada</span>
              </span>
            </button>
          )}
        </div>
      )}
    </li>
  )
}
