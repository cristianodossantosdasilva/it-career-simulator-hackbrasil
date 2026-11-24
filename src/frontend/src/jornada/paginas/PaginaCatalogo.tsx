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
  type VisaoGrupoCatalogo,
  type VisaoItemCatalogo,
  type VisaoMissaoCatalogo,
  textoCausas,
  visaoDoCatalogo,
} from '../progressoRota'

const VISAO = visaoDoCatalogo(CATALOGO_ROTAS, CATALOGO_CERTIFICACOES, CATALOGO_PARCEIROS)

function ListaMissoes({ itens }: { itens: readonly VisaoMissaoCatalogo[] }) {
  return (
    <ul className="lista-rotas-catalogo">
      {itens.map((item) => {
        const causas = textoCausas(item.causas)
        return (
          <li key={item.id} className="rota-catalogo">
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

/** Junta os grupos seguidos da mesma etapa, na ordem do catálogo. */
function agruparPorEtapa(grupos: readonly VisaoGrupoCatalogo[]): { id: string; grupos: VisaoGrupoCatalogo[] }[] {
  const resultado: { id: string; grupos: VisaoGrupoCatalogo[] }[] = []
  for (const grupo of grupos) {
    const ultimo = resultado[resultado.length - 1]
    if (ultimo && ultimo.id === grupo.etapa.id) ultimo.grupos.push(grupo)
    else resultado.push({ id: grupo.etapa.id, grupos: [grupo] })
  }
  return resultado
}

function ListaItens({ itens }: { itens: readonly VisaoItemCatalogo[] }) {
  return (
    <ul className="lista-rotas-catalogo">
      {itens.map((item) => (
        <li key={item.id} className="rota-catalogo">
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
 * Catálogo: tudo o que o catálogo registra, com o status em texto e ícone. Rotas, Missões de Suporte de TI
 * por etapa e Vertente (inclusive as em preparação), certificações de referência, parceiros e a
 * transparência do escopo. Os dados vêm de `visaoDoCatalogo`, sem lista no componente.
 */
export function PaginaCatalogo() {
  const etapas = agruparPorEtapa(VISAO.missoes)
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['catalogo']}</h1>
        <p className="pagina-jornada-texto">
          O que existe hoje e o que está previsto. Cada item mostra o status em texto: disponível, em preparação ou
          futuro.
        </p>
        <p>
          <LinkInterno href={enderecoDe({ pagina: 'plano-de-carreira' })} className="btn btn-secondary btn-sm">
            Ver o Plano de Carreira
          </LinkInterno>
        </p>
      </header>
      <section className="secao-jornada" aria-labelledby="catalogo-rotas">
        <h2 id="catalogo-rotas">Rotas</h2>
        <ul className="lista-rotas-catalogo">
          {VISAO.rotas.map((rota) => (
            <li key={rota.id} className="rota-catalogo">
              <h3>{rota.titulo}</h3>
              <p>{rota.descricao}</p>
              <p>
                <SeloStatus status={rota.status} />
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="secao-jornada" aria-labelledby="catalogo-missoes">
        <h2 id="catalogo-missoes">Missões de Suporte de TI</h2>
        {etapas.map((etapa) => (
          <div key={etapa.id} className="etapa-catalogo">
            <h3>{etapa.grupos[0].etapa.nome}</h3>
            {etapa.grupos.map((grupo) =>
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
      <section className="secao-jornada" aria-labelledby="catalogo-parceiros">
        <h2 id="catalogo-parceiros">Parceiros</h2>
        <p className="etapa-nota">Nenhum acordo existe hoje. Os itens abaixo são tipos de parceria que o projeto quer buscar.</p>
        <ListaItens itens={VISAO.parceiros} />
      </section>
      <TransparenciaEscopo />
    </div>
  )
}
