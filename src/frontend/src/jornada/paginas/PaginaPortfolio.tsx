import { useId, useMemo, useState } from 'react'
import { Icone } from '../../ui/Icone'
import { CredencialView } from '../../workstation/CredencialView'
import type { NivelEducacional } from '../../educacao/catalogoEducacional'
import type { RegistroDeMissao } from '../armazenamento/registrosMissao'
import { type Etapa, rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { PainelMentor } from '../mentor/PainelMentor'
import { GrupoVertente } from '../componentes/GrupoVertente'
import { formatarDataDoRegistro } from '../componentes/formatarDataDoRegistro'
import { SecaoPortfolioAnalista } from '../componentes/SecaoPortfolioAnalista'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { useAcademia } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { useDestinoDaPratica } from '../navegacao/usarDestinoDaPratica'
import { type GrupoPortfolio, agruparRegistros, calcularPortfolioAnalista } from '../progressoRota'
import { filtrarPortfolioLabPorCenario, sincronizarProvasLabDeRegistros } from '../simulados/portfolioLab'

function RegistroNoPortfolio({ registro, link }: { registro: RegistroDeMissao; link: string }) {
  const { titulo } = textosDaMissao(registro.missao)
  const { resultado } = registro
  return (
    <li className="registro-missao">
      <div className="registro-missao-dados">
        <span className="registro-missao-titulo">{titulo}</span>
        <span className="registro-missao-meta">
          Concluído em {formatarDataDoRegistro(registro.concluidoEm)}. XP {resultado.xpTotal}.
          {resultado.incidenteSeguranca ? ' Incidente de segurança registrado.' : ''}
        </span>
        <span className="registro-missao-meta">Resultado do Juiz 360º: {resultado.resumo}</span>
      </div>
      <LinkInterno href={link} className="btn btn-secondary btn-sm">
        <Icone nome="credencial" tamanho={16} />
        <span>
          Abrir a Revisão<span className="sr-only"> de {titulo}</span>
        </span>
      </LinkInterno>
    </li>
  )
}

function ListaDeRegistros({ grupo }: { grupo: GrupoPortfolio }) {
  return (
    <ul className="lista-registros">
      {grupo.registros.map((registro) => (
        <RegistroNoPortfolio key={registro.sessaoId} registro={registro} link={grupo.linkRevisao(registro)} />
      ))}
    </ul>
  )
}

function EtapaDoPortfolio({ etapa, grupos }: { etapa: Etapa; grupos: readonly GrupoPortfolio[] }) {
  const idTitulo = useId()
  return (
    <section className="secao-jornada" aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>{etapa.nome}</h3>
      {grupos.map((grupo) =>
        grupo.vertente ? (
          <GrupoVertente key={grupo.vertente.id} nome={grupo.vertente.nome} nivelTitulo={4}>
            <ListaDeRegistros grupo={grupo} />
          </GrupoVertente>
        ) : (
          <ListaDeRegistros key={etapa.id} grupo={grupo} />
        ),
      )}
    </section>
  )
}

/** Um bloco por etapa, na ordem da rota. A N3 Sênior ganha um subgrupo por Vertente. */
function agruparPorEtapa(grupos: readonly GrupoPortfolio[]) {
  const porEtapa: { etapa: Etapa; grupos: GrupoPortfolio[] }[] = []
  for (const grupo of grupos) {
    const existente = porEtapa.find((item) => item.etapa.id === grupo.etapa.id)
    if (existente) existente.grupos.push(grupo)
    else porEtapa.push({ etapa: grupo.etapa, grupos: [grupo] })
  }
  return porEtapa
}

/**
 * Portfólio: Portfólio de analista, missões registradas e Credencial. Tudo vem do Armazenamento_Local e do estado da
 * Academia, sem requisição ao servidor e sem ler o Modo_de_Demonstração. O resultado de cada missão é o
 * texto do Juiz 360º, copiado como foi recebido.
 */
export function PaginaPortfolio() {
  const { registros } = useArmazenamentoJornada()
  const { estadoAcademia, resumoCarreira, apelido, setApelido, atualizarResumoCarreira } = useAcademia()
  const rota = rotaPorId(ROTA_PADRAO_DE_PERFIL)
  const grupos = rota ? agruparRegistros(rota, registros) : []
  const visao = rota ? calcularPortfolioAnalista(rota, registros) : null
  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp

  const destinoDaPratica = useDestinoDaPratica()
  const idFiltroCenario = useId()
  const [cenarioSelecionado, setCenarioSelecionado] = useState('todos')
  const entradasProvaLab = useMemo(() => sincronizarProvasLabDeRegistros(registros), [registros])
  const cenariosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const entrada of entradasProvaLab) {
      if (!mapa.has(entrada.cenarioId)) mapa.set(entrada.cenarioId, entrada.cenarioTitulo)
    }
    return [...mapa.entries()]
  }, [entradasProvaLab])
  const entradasProvaFiltradas = useMemo(
    () => filtrarPortfolioLabPorCenario(entradasProvaLab, cenarioSelecionado),
    [entradasProvaLab, cenarioSelecionado],
  )

  /** Etapa liberada (ou modo de demonstração): Mesa de Trabalho da missão. Bloqueada: Plano de Carreira, nunca a Mesa de Trabalho. */
  function praticar(nivel: NivelEducacional) {
    navegar(destinoDaPratica(nivel.cenarioId).endereco)
  }

  function avisoDaPratica(nivel: NivelEducacional): string | null {
    const destino = destinoDaPratica(nivel.cenarioId)
    return destino.tipo === 'plano-de-carreira' ? destino.aviso : null
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['portfolio']}</h1>
        <p className="pagina-jornada-texto">
          Suas missões concluídas, guardados neste navegador, e o que falta para o Portfólio de analista.
        </p>
      </header>
      {visao && <SecaoPortfolioAnalista visao={visao} nivelTitulo={2} />}
      <section className="secao-jornada" aria-labelledby="portfolio-missoes">
        <h2 id="portfolio-missoes">Missões registradas</h2>
        {grupos.length === 0 ? (
          <div className="estado-vazio">
            <p>Você ainda não tem missões registradas. Conclua uma missão na Mesa de Trabalho e ela aparece aqui.</p>
            <LinkInterno href="/plano-de-carreira" className="btn btn-primary">
              <Icone nome="plano-de-carreira" tamanho={20} />
              <span>Ir para o Plano de Carreira</span>
            </LinkInterno>
          </div>
        ) : (
          agruparPorEtapa(grupos).map((item) => <EtapaDoPortfolio key={item.etapa.id} etapa={item.etapa} grupos={item.grupos} />)
        )}
      </section>
      <section className="secao-jornada" aria-labelledby="portfolio-prova-lab">
        <div className="certsim-cartao-topo">
          <h2 id="portfolio-prova-lab">Portfólio da Prova de Lab</h2>
          {cenariosDisponiveis.length > 0 && (
            <div className="certsim-filtros">
              <label htmlFor={idFiltroCenario} className="muted">
                Cenário:
              </label>
              <select
                id={idFiltroCenario}
                className="certsim-select"
                value={cenarioSelecionado}
                onChange={(e) => setCenarioSelecionado(e.target.value)}
              >
                <option value="todos">Todos os cenários</option>
                {cenariosDisponiveis.map(([id, titulo]) => (
                  <option key={id} value={id}>
                    {titulo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {entradasProvaLab.length === 0 ? (
          <div className="estado-vazio">
            <p>
              Você ainda não concluiu nenhuma Prova de Lab. Inicie uma avaliação prática em Provas para registrar seu
              desempenho aqui.
            </p>
            <LinkInterno href="/provas" className="btn btn-primary">
              <Icone nome="provas" tamanho={20} />
              <span>Ir para Provas</span>
            </LinkInterno>
          </div>
        ) : entradasProvaFiltradas.length === 0 ? (
          <div className="estado-vazio">
            <p>Nenhuma Prova de Lab encontrada para o cenário selecionado.</p>
          </div>
        ) : (
          <ul className="lista-simples">
            {entradasProvaFiltradas.map((entrada) => (
              <li key={entrada.id} className="certsim-cartao">
                <div className="certsim-cartao-topo">
                  <h3 className="h3">{entrada.cenarioTitulo}</h3>
                  <div className="acoes-linha">
                    <span className="selo-status dado-mono">{entrada.nota}%</span>
                    <span className="muted">{formatarDataDoRegistro(entrada.data)}</span>
                  </div>
                </div>
                <p className="pagina-jornada-texto">
                  <strong>O que foi feito:</strong> {entrada.oQueFoiFeito}
                </p>
                <div className="certsim-grade-2">
                  <div>
                    <p className="eyebrow">Critérios atendidos ({entrada.criteriosAtendidos.length})</p>
                    {entrada.criteriosAtendidos.length === 0 ? (
                      <p className="muted">Nenhum critério atendido.</p>
                    ) : (
                      <ul className="certsim-lista-regras">
                        {entrada.criteriosAtendidos.map((criterio, idx) => (
                          <li key={idx}>{criterio}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="eyebrow">Critérios pendentes ({entrada.criteriosPendentes.length})</p>
                    {entrada.criteriosPendentes.length === 0 ? (
                      <p className="muted">Todos os critérios foram atendidos.</p>
                    ) : (
                      <ul className="certsim-lista-regras">
                        {entrada.criteriosPendentes.map((criterio, idx) => (
                          <li key={idx}>{criterio}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="acoes-linha">
                  <LinkInterno
                    href={enderecoDe({ pagina: 'revisao', sessao: entrada.sessaoId })}
                    className="btn btn-secondary btn-sm"
                  >
                    <Icone nome="credencial" tamanho={16} />
                    <span>
                      Abrir a Revisão<span className="sr-only"> de {entrada.cenarioTitulo}</span>
                    </span>
                  </LinkInterno>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <CredencialView
        estado={estadoAcademia}
        xpTotal={xpExibido}
        resumoCarreira={resumoCarreira}
        apelido={apelido}
        onApelidoChange={setApelido}
        onAtualizarCarreira={(nome) => void atualizarResumoCarreira(undefined, nome)}
        onPraticar={praticar}
        avisoDaPratica={avisoDaPratica}
        nivelTitulo={2}
      />
      <PainelMentor papel="mentor" pagina="portfolio" />
    </div>
  )
}
