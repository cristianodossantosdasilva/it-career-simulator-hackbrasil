import { TransparenciaEscopo } from '../../workstation/TransparenciaEscopo'
import { CATALOGO_CERTIFICACOES } from '../catalogos/catalogoCertificacoes'
import { CATALOGO_PARCEIROS } from '../catalogos/catalogoParceiros'
import { CATALOGO_ROTAS } from '../catalogos/catalogoRotas'
import { CertificacoesReferencia } from '../componentes/CertificacoesReferencia'
import { GrupoVertente } from '../componentes/GrupoVertente'
import { SeloStatus } from '../componentes/SeloStatus'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import {
  type VisaoGrupoHangar,
  type VisaoItemCatalogo,
  type VisaoMissaoHangar,
  textoCausas,
  visaoDoHangar,
} from '../progressoRota'

const VISAO = visaoDoHangar(CATALOGO_ROTAS, CATALOGO_CERTIFICACOES, CATALOGO_PARCEIROS)

function ListaMissoes({ itens }: { itens: readonly VisaoMissaoHangar[] }) {
  return (
    <ul className="lista-rotas-hangar">
      {itens.map((item) => {
        const causas = textoCausas(item.causas)
        return (
          <li key={item.id} className="rota-hangar">
            <strong>{item.titulo}</strong>
            <p>
              <SeloStatus status={item.status} />
            </p>
            {item.descricao && <p>{item.descricao}</p>}
            {causas && <p>{causas}</p>}
          </li>
        )
      })}
    </ul>
  )
}

/** Junta os grupos seguidos da mesma escala, na ordem do catálogo. */
function agruparPorEscala(grupos: readonly VisaoGrupoHangar[]): { id: string; grupos: VisaoGrupoHangar[] }[] {
  const resultado: { id: string; grupos: VisaoGrupoHangar[] }[] = []
  for (const grupo of grupos) {
    const ultimo = resultado[resultado.length - 1]
    if (ultimo && ultimo.id === grupo.escala.id) ultimo.grupos.push(grupo)
    else resultado.push({ id: grupo.escala.id, grupos: [grupo] })
  }
  return resultado
}

function ListaItens({ itens }: { itens: readonly VisaoItemCatalogo[] }) {
  return (
    <ul className="lista-rotas-hangar">
      {itens.map((item) => (
        <li key={item.id} className="rota-hangar">
          <strong>{item.titulo}</strong>
          <p>{item.descricao}</p>
          <p>
            <SeloStatus status={item.status} />
          </p>
        </li>
      ))}
    </ul>
  )
}

/**
 * Hangar: tudo o que o catálogo registra, com o status em texto e ícone. Rotas, Missões de Suporte de TI
 * por escala e Vertente (inclusive as em preparação), certificações de referência, parceiros e a
 * transparência do escopo. Os dados vêm de `visaoDoHangar`, sem lista no componente.
 */
export function PaginaHangar() {
  const escalas = agruparPorEscala(VISAO.missoes)
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.hangar}</h1>
        <p className="pagina-jornada-texto">
          O que existe hoje e o que está previsto. Cada item mostra o status em texto: disponível, em preparação ou
          futuro.
        </p>
        <p>
          <LinkInterno href={enderecoDe({ pagina: 'plano-de-voo' })} className="btn btn-secondary btn-sm">
            Ver o Plano de voo
          </LinkInterno>
        </p>
      </header>
      <section className="secao-jornada" aria-labelledby="hangar-rotas">
        <h2 id="hangar-rotas">Rotas</h2>
        <ul className="lista-rotas-hangar">
          {VISAO.rotas.map((rota) => (
            <li key={rota.id} className="rota-hangar">
              <h3>{rota.titulo}</h3>
              <p>{rota.descricao}</p>
              <p>
                <SeloStatus status={rota.status} />
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="secao-jornada" aria-labelledby="hangar-missoes">
        <h2 id="hangar-missoes">Missões de Suporte de TI</h2>
        {escalas.map((escala) => (
          <div key={escala.id} className="escala-hangar">
            <h3>{escala.grupos[0].escala.nome}</h3>
            {escala.grupos.map((grupo) =>
              grupo.vertente ? (
                <GrupoVertente key={grupo.vertente.id} nome={grupo.vertente.nome} nivelTitulo={4}>
                  <ListaMissoes itens={grupo.itens} />
                </GrupoVertente>
              ) : (
                <ListaMissoes key="missoes" itens={grupo.itens} />
              ),
            )}
          </div>
        ))}
      </section>
      <CertificacoesReferencia
        itens={VISAO.certificacoes}
        titulo="Certificações de referência (mapeamento de conteúdo)"
        nivelTitulo={2}
      />
      <section className="secao-jornada" aria-labelledby="hangar-parceiros">
        <h2 id="hangar-parceiros">Parceiros</h2>
        <p className="escala-nota">Nenhum acordo existe hoje. Os itens abaixo são tipos de parceria que o projeto quer buscar.</p>
        <ListaItens itens={VISAO.parceiros} />
      </section>
      <TransparenciaEscopo />
    </div>
  )
}
