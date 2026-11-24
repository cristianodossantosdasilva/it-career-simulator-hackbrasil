import { useId } from 'react'
import { Icone, type NomeIcone } from '../../ui/Icone'
import { SeloDemonstracao } from '../demonstracao/SeloDemonstracao'
import { textoLiberadaSoParaDemonstracao } from '../demonstracao/textosDemonstracao'
import type { VisaoEtapa } from '../progressoRota'
import { CartaoMissao } from './CartaoMissao'
import { CertificacoesReferencia } from './CertificacoesReferencia'
import { GrupoVertente } from './GrupoVertente'

const ESTADO_ETAPA: Record<VisaoEtapa['estado'], { texto: string; icone: NomeIcone }> = {
  liberada: { texto: 'Liberada', icone: 'status-disponivel' },
  bloqueada: { texto: 'Bloqueada', icone: 'bloqueada' },
  concluida: { texto: 'Concluída', icone: 'confirmar' },
}

export const TEXTO_ETAPA_EM_PREPARACAO = 'As missões desta etapa estão em preparação no simulador.'

function EtapaDoPlano({ visao, anterior }: { visao: VisaoEtapa; anterior: VisaoEtapa | null }) {
  const idTitulo = useId()
  const estado = ESTADO_ETAPA[visao.estado]
  const bloqueada = visao.estado === 'bloqueada'
  return (
    <section className={bloqueada ? 'etapa etapa-bloqueada' : 'etapa'} aria-labelledby={idTitulo}>
      <div className="etapa-cabecalho">
        <h2 id={idTitulo}>{visao.etapa.nome}</h2>
        <span className="etapa-estado">
          <Icone nome={estado.icone} tamanho={16} />
          <span>{estado.texto}</span>
        </span>
        {visao.seloDemonstracao && <SeloDemonstracao />}
      </div>
      <p className="etapa-nota">{visao.etapa.descricao}</p>
      {bloqueada && visao.etapaNecessaria && (
        <p className="etapa-nota">
          Para liberar esta etapa, conclua as missões disponíveis de {visao.etapaNecessaria.nome}.
        </p>
      )}
      {visao.liberadaPorDemonstracao && anterior && (
        <p className="etapa-nota">{textoLiberadaSoParaDemonstracao(anterior.etapa.nome)}</p>
      )}
      {visao.semMissaoDisponivel && <p className="etapa-nota">{TEXTO_ETAPA_EM_PREPARACAO}</p>}
      {visao.liberadaPorPreparacao && anterior && (
        <p className="etapa-nota">Liberada porque as missões de {anterior.etapa.nome} estão em preparação.</p>
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
      <CertificacoesReferencia itens={visao.certificacoes} nivelTitulo={3} />
    </section>
  )
}

/** Etapas da rota na ordem do catálogo, cada uma como `section` com h2. */
export function ListaEtapas({ visoes }: { visoes: readonly VisaoEtapa[] }) {
  return (
    <ol className="lista-etapas">
      {visoes.map((visao, indice) => (
        <li key={visao.etapa.id}>
          <EtapaDoPlano visao={visao} anterior={indice > 0 ? visoes[indice - 1] : null} />
        </li>
      ))}
    </ol>
  )
}
