import { useId } from 'react'
import { Icone, type NomeIcone } from '../../ui/Icone'
import type { VisaoEscala } from '../progressoRota'
import { CartaoMissao } from './CartaoMissao'
import { GrupoVertente } from './GrupoVertente'

const ESTADO_ESCALA: Record<VisaoEscala['estado'], { texto: string; icone: NomeIcone }> = {
  liberada: { texto: 'Liberada', icone: 'status-disponivel' },
  bloqueada: { texto: 'Bloqueada', icone: 'bloqueada' },
  concluida: { texto: 'Concluída', icone: 'confirmar' },
}

export const TEXTO_ESCALA_EM_PREPARACAO = 'As missões desta escala estão em preparação no simulador.'

function EscalaDoPlano({ visao, anterior }: { visao: VisaoEscala; anterior: VisaoEscala | null }) {
  const idTitulo = useId()
  const estado = ESTADO_ESCALA[visao.estado]
  const bloqueada = visao.estado === 'bloqueada'
  return (
    <section className={bloqueada ? 'escala escala-bloqueada' : 'escala'} aria-labelledby={idTitulo}>
      <div className="escala-cabecalho">
        <h2 id={idTitulo}>{visao.escala.nome}</h2>
        <span className="escala-estado">
          <Icone nome={estado.icone} tamanho={16} />
          <span>{estado.texto}</span>
        </span>
      </div>
      <p className="escala-nota">{visao.escala.descricao}</p>
      {bloqueada && visao.escalaNecessaria && (
        <p className="escala-nota">
          Para liberar esta escala, conclua as missões disponíveis de {visao.escalaNecessaria.nome}.
        </p>
      )}
      {visao.semMissaoDisponivel && <p className="escala-nota">{TEXTO_ESCALA_EM_PREPARACAO}</p>}
      {visao.liberadaPorPreparacao && anterior && (
        <p className="escala-nota">Liberada porque as missões de {anterior.escala.nome} estão em preparação.</p>
      )}
      {visao.grupos.map((grupo) =>
        grupo.vertente ? (
          <GrupoVertente key={grupo.vertente.id} nome={grupo.vertente.nome} nivelTitulo={3}>
            <ul className="lista-cartoes">
              {grupo.missoes.map((missao) => (
                <CartaoMissao key={missao.missao} visao={missao} nivelTitulo={4} />
              ))}
            </ul>
          </GrupoVertente>
        ) : (
          <ul className="lista-cartoes" key="missoes">
            {grupo.missoes.map((missao) => (
              <CartaoMissao key={missao.missao} visao={missao} nivelTitulo={3} />
            ))}
          </ul>
        ),
      )}
    </section>
  )
}

/** Escalas da rota na ordem do catálogo, cada uma como `section` com h2. */
export function ListaEscalas({ visoes }: { visoes: readonly VisaoEscala[] }) {
  return (
    <ol className="lista-escalas">
      {visoes.map((visao, indice) => (
        <li key={visao.escala.id}>
          <EscalaDoPlano visao={visao} anterior={indice > 0 ? visoes[indice - 1] : null} />
        </li>
      ))}
    </ol>
  )
}
