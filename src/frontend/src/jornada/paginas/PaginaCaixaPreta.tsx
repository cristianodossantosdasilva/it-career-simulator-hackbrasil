import { useEffect, useState } from 'react'
import { apiClient, classificarFalha } from '../../api/client'
import type { CriterioAvaliacaoDto, ReplayResponse } from '../../api/types'
import { IntranetApp } from '../../apps/IntranetApp/IntranetApp'
import { ReplayView } from '../../replay/ReplayView'
import { Icone } from '../../ui/Icone'
import { PainelComandante } from '../comandante/PainelComandante'
import { type IdMissao, ehIdMissao } from '../catalogos/catalogoRotas'
import { type AcaoAviso, AvisoHonesto } from '../componentes/AvisoHonesto'
import { ResumoLocalDoVoo } from '../componentes/ResumoLocalDoVoo'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, type RotaResolvida, enderecoDe } from '../navegacao/rotas'

type RotaCaixaPreta = Extract<RotaResolvida, { pagina: 'caixa-preta' }>

type EstadoReplay =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; replay: ReplayResponse }
  | { tipo: 'indisponivel' }
  | { tipo: 'falha'; mensagem: string }

export const TEXTO_CAIXA_PRETA_INDISPONIVEL = 'Esta sessão não está mais disponível no servidor.'

/** Botão que abre uma sessão nova da missão do registro local. */
function refazer(missao: IdMissao): AcaoAviso {
  return {
    tipo: 'botao',
    rotulo: 'Refazer a missão',
    aoClicar: () => navegar(enderecoDe({ pagina: 'cabine', missao, semente: null, causa: null, nova: true })),
  }
}

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Falha ao falar com o servidor.'
}

function classificarCompetencia(criterio: CriterioAvaliacaoDto): string {
  const texto = `${criterio.id} ${criterio.descricao}`.toLowerCase()
  if (/identidade|segur|token|politica|política|privileg|acesso/.test(texto)) {
    return 'Identidade e segurança'
  }
  if (/diagnost|dns|servi|simudesk|pod|log|sql|backup|causa|investiga/.test(texto)) {
    return 'Diagnóstico técnico'
  }
  if (/comunic|usuario|usuário|nota|registr|chamado|problema/.test(texto)) {
    return 'Comunicação e registro'
  }
  return 'Procedimento e operação'
}

interface GrupoCompetencia {
  nome: string
  atendidos: number
  total: number
  percentual: number
}

function agruparPorCompetencia(criterios: readonly CriterioAvaliacaoDto[]): GrupoCompetencia[] {
  const mapa = new Map<string, { atendidos: number; total: number }>()
  for (const criterio of criterios) {
    const nome = classificarCompetencia(criterio)
    const atual = mapa.get(nome) ?? { atendidos: 0, total: 0 }
    mapa.set(nome, {
      atendidos: atual.atendidos + (criterio.atendido ? 1 : 0),
      total: atual.total + 1,
    })
  }
  return [...mapa.entries()].map(([nome, dados]) => ({
    nome,
    atendidos: dados.atendidos,
    total: dados.total,
    percentual: dados.total > 0 ? Math.round((dados.atendidos / dados.total) * 100) : 0,
  }))
}

interface PropsResultadoMissao {
  replay: ReplayResponse
  aoAbrirKb: (artigoId: string, origem: HTMLElement) => void
}

function ResultadoMissao({ replay, aoAbrirKb }: PropsResultadoMissao) {
  const { avaliacao, meta, curriculo } = replay
  const criterios = avaliacao.criterios
  const total = criterios.length
  const atendidos = criterios.filter((c) => c.atendido).length
  const percentual = total > 0 ? Math.round((atendidos / total) * 100) : 0
  const aprovado = avaliacao.concluida && !avaliacao.incidenteSeguranca && percentual >= 70
  const grupos = agruparPorCompetencia(criterios)
  const fortes = criterios.filter((c) => c.atendido)
  const melhorar = criterios.filter((c) => !c.atendido)
  const missaoValida = ehIdMissao(meta.cenarioId) ? meta.cenarioId : null

  return (
    <section className="secao-jornada" aria-labelledby="resultado-missao-titulo">
      <div className="resultado-cabecalho">
        <div>
          <h2 id="resultado-missao-titulo" className="h2">
            Resultado da missão
          </h2>
          <p className="muted">
            {avaliacao.concluida ? 'Missão concluída' : 'Missão em andamento'} · {avaliacao.xpTotal} XP
          </p>
        </div>
        <div className="resultado-placar">
          <span className="resultado-percentual dado-mono">{percentual}%</span>
          <span className="muted">
            {atendidos} de {total} critérios atendidos
          </span>
          <span className="selo-status">
            {avaliacao.incidenteSeguranca
              ? 'Incidente de segurança'
              : aprovado
                ? 'Aprovado (70%+)'
                : 'Em revisão'}
          </span>
        </div>
      </div>

      <div className="acoes-linha">
        {missaoValida && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navegar(enderecoDe({ pagina: 'cabine', missao: missaoValida, semente: null, causa: null, nova: true }))}
          >
            <Icone nome="virar" tamanho={20} />
            <span>Refazer a missão</span>
          </button>
        )}
        <LinkInterno href="/plano-de-voo" className="btn btn-secondary">
          <Icone nome="plano-de-voo" tamanho={20} />
          <span>Nova missão</span>
        </LinkInterno>
        <LinkInterno href="/breve" className="btn btn-secondary">
          <Icone nome="credencial" tamanho={20} />
          <span>Ver o Brevê</span>
        </LinkInterno>
      </div>

      {grupos.length > 0 && (
        <div className="resultado-competencias" aria-labelledby="resultado-competencias-titulo">
          <h3 id="resultado-competencias-titulo" className="h3">
            Desempenho por competência
          </h3>
          <ul className="lista-competencias">
            {grupos.map((grupo) => (
              <li key={grupo.nome} className="item-competencia">
                <div className="item-competencia-topo">
                  <span>{grupo.nome}</span>
                  <span className="dado-mono">
                    {grupo.atendidos}/{grupo.total} ({grupo.percentual}%)
                  </span>
                </div>
                <progress value={grupo.atendidos} max={grupo.total} aria-label={`${grupo.nome}: ${grupo.percentual}%`} />
              </li>
            ))}
          </ul>
          {curriculo && curriculo.competencias.length > 0 && (
            <p className="muted">
              Competências registradas: {curriculo.competencias.join(', ')}.
            </p>
          )}
        </div>
      )}

      <div className="grade-fortes-fracos">
        <section className="cartao-missao" aria-labelledby="resultado-fortes-titulo">
          <h3 id="resultado-fortes-titulo" className="h3">
            Pontos fortes ({fortes.length})
          </h3>
          {fortes.length === 0 ? (
            <p className="muted">Nenhum critério atendido até o momento.</p>
          ) : (
            <ul className="lista-simples">
              {fortes.map((criterio) => (
                <li key={criterio.id}>{criterio.descricao}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="cartao-missao" aria-labelledby="resultado-melhorar-titulo">
          <h3 id="resultado-melhorar-titulo" className="h3">
            Áreas a melhorar ({melhorar.length})
          </h3>
          {melhorar.length === 0 ? (
            <p className="muted">Todos os critérios observados foram atendidos.</p>
          ) : (
            <ul className="lista-simples">
              {melhorar.map((criterio) => (
                <li key={criterio.id}>
                  <strong>{criterio.descricao}:</strong> {criterio.praticaEsperada ?? criterio.motivo ?? 'Revisar na linha do tempo.'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="resultado-revisao" aria-labelledby="resultado-revisao-titulo">
        <h3 id="resultado-revisao-titulo" className="h3">
          Revisão critério a critério
        </h3>
        <div className="lista-revisao-criterios">
          {criterios.map((criterio) => (
            <details key={criterio.id} className="glossary-details">
              <summary className="revisao-criterio-resumo">
                <span className="selo-status">{criterio.atendido ? 'Atendido' : 'Não atendido'}</span>
                <span>{criterio.descricao}</span>
              </summary>
              <div className="revisao-criterio-corpo">
                {criterio.motivo && (
                  <p>
                    <strong>O que foi observado:</strong> {criterio.motivo}
                  </p>
                )}
                {criterio.praticaEsperada && (
                  <p>
                    <strong>Prática esperada:</strong> {criterio.praticaEsperada}
                  </p>
                )}
                {criterio.linkKb && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    data-kb-uri={criterio.linkKb}
                    onClick={(evento) => aoAbrirKb(criterio.linkKb ?? '', evento.currentTarget)}
                  >
                    <Icone nome="base" tamanho={16} />
                    <span>Consultar base de conhecimento</span>
                  </button>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </section>
  )
}

/**
 * Caixa-preta de uma sessão: resultado percentual, competências, fortes e fracos, revisão que abre
 * e fecha, replay cronológico e avaliação do Juiz 360º, lidos do servidor pelo identificador.
 */
export function PaginaCaixaPreta({ rota }: { rota: RotaCaixaPreta }) {
  const sessao = rota.sessao
  const { registros } = useArmazenamentoJornada()
  const [estado, setEstado] = useState<EstadoReplay>({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const [erroAtualizacao, setErroAtualizacao] = useState<string | null>(null)
  const [artigoKb, setArtigoKb] = useState<string | null>(null)
  const [kbRetornoLinkUri, setKbRetornoLinkUri] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    apiClient
      .obterReplay(sessao)
      .then((replay) => {
        if (ativo) setEstado({ tipo: 'pronto', replay })
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        setEstado(
          classificarFalha(erro) === 'sessao-indisponivel'
            ? { tipo: 'indisponivel' }
            : { tipo: 'falha', mensagem: mensagemDe(erro) },
        )
      })
    return () => {
      ativo = false
    }
  }, [sessao, tentativa])

  function tentarDeNovo() {
    setEstado({ tipo: 'carregando' })
    setTentativa((valor) => valor + 1)
  }

  async function atualizar() {
    setAtualizando(true)
    setErroAtualizacao(null)
    try {
      setEstado({ tipo: 'pronto', replay: await apiClient.obterReplay(sessao) })
    } catch (erro) {
      setErroAtualizacao(mensagemDe(erro))
    } finally {
      setAtualizando(false)
    }
  }

  function abrirArtigo(artigoId: string, origem: HTMLElement) {
    setKbRetornoLinkUri(
      origem.getAttribute('data-kb-uri') ?? origem.getAttribute('aria-label')?.replace(/^Consultar KB: /, '') ?? null,
    )
    setArtigoKb(artigoId)
  }

  const registro = registros.find((item) => item.sessaoId === sessao) ?? null
  const linkBreve = { tipo: 'link', rotulo: 'Ver o Brevê', href: enderecoDe({ pagina: 'breve' }) } as const

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['caixa-preta']}</h1>
        <p className="pagina-jornada-texto">
          Resultado da missão, competências avaliadas pelo Juiz 360º e linha do tempo do voo.
        </p>
      </header>
      {estado.tipo === 'carregando' && (
        <p className="muted" role="status">
          Carregando a Caixa-preta.
        </p>
      )}
      {estado.tipo === 'pronto' && (
        <>
          {erroAtualizacao && (
            <AvisoHonesto bloqueante acoes={[{ tipo: 'botao', rotulo: 'Tentar de novo', aoClicar: () => void atualizar() }]}>
              Não foi possível atualizar o relatório. {erroAtualizacao}
            </AvisoHonesto>
          )}
          {artigoKb ? (
            <IntranetApp
              key={artigoKb}
              artigoSelecionadoId={artigoKb}
              onArtigoFechado={() => setArtigoKb(null)}
            />
          ) : (
            <>
              <ResultadoMissao replay={estado.replay} aoAbrirKb={abrirArtigo} />
              <ReplayView
                replay={estado.replay}
                onAtualizar={atualizar}
                ocupado={atualizando}
                onNavegaKb={abrirArtigo}
                kbRetornoLinkUri={kbRetornoLinkUri}
              />
            </>
          )}
        </>
      )}
      {estado.tipo === 'indisponivel' && (
        <>
          <AvisoHonesto bloqueante acoes={registro ? [refazer(registro.missao), linkBreve] : [linkBreve]}>
            {TEXTO_CAIXA_PRETA_INDISPONIVEL}
          </AvisoHonesto>
          {registro && <ResumoLocalDoVoo registro={registro} />}
        </>
      )}
      {estado.tipo === 'falha' && (
        <AvisoHonesto
          bloqueante
          acoes={[{ tipo: 'botao', rotulo: 'Tentar de novo', aoClicar: tentarDeNovo }, linkBreve]}
        >
          Não foi possível carregar a Caixa-preta. {estado.mensagem}
        </AvisoHonesto>
      )}
      <PainelComandante papel="mentor" pagina="caixa-preta" />
    </div>
  )
}
