import type { NomeIcone } from '../ui/Icone'
import type { RegistroDeMissao } from './armazenamento/registrosMissao'
import { type Certificacao, CATALOGO_CERTIFICACOES } from './catalogos/catalogoCertificacoes'
import { type Parceiro, TITULO_TIPO_PARCEIRO } from './catalogos/catalogoParceiros'
import { type Etapa, type IdMissao, type Missao, type Rota, type Vertente, missoesDaEtapa } from './catalogos/catalogoRotas'
import { APRESENTACAO_STATUS, type StatusDisponibilidade } from './catalogos/status'
import { textosDaMissao } from './componentes/textosDaMissao'
import { enderecoDe } from './navegacao/rotas'

export type EstadoEtapa = 'liberada' | 'bloqueada' | 'concluida'
export type EstadoMissao = 'disponivel' | 'em-preparacao' | 'bloqueada' | 'concluida'

export interface ContagemCausas {
  disponiveis: number
  emPreparacao: number
}

export interface VisaoMissao {
  missao: IdMissao
  vertenteId: Vertente['id'] | null
  estado: EstadoMissao
  podeIniciar: boolean
  /** Só a contagem. Nomes e códigos de Causa não saem do catálogo. */
  causas: ContagemCausas
}

export interface VisaoGrupoMissoes {
  /** Nula nas etapas 1 a 3. Um grupo por Vertente na N3 Sênior. */
  vertente: Vertente | null
  missoes: readonly VisaoMissao[]
}

/** Item de catálogo já com o status em texto e ícone, vindo de APRESENTACAO_STATUS do próprio item. */
export interface VisaoItemCatalogo {
  id: string
  titulo: string
  descricao: string
  status: StatusDisponibilidade
  statusTexto: string
  statusIcone: NomeIcone
}
export interface VisaoEtapa {
  etapa: Etapa
  /** Estado exibido. Com o modo de demonstração ativo nenhuma etapa fica bloqueada. */
  estado: EstadoEtapa
  /** Estado calculado só pelos Registros_de_Missão, igual a `estado` com o modo inativo. */
  estadoPorRegistros: EstadoEtapa
  /** Verdadeiro quando o modo ativo liberou uma etapa que os registros mantêm bloqueada. */
  liberadaPorDemonstracao: boolean
  /** Verdadeiro em toda etapa com o modo ativo, inclusive nas concluídas. */
  seloDemonstracao: boolean
  /** Etapa_Cumprida: toda Missão disponível tem registro, inclusive quando não há nenhuma. */
  cumprida: boolean
  semMissaoDisponivel: boolean
  /** Liberada e a etapa anterior sem Missão disponível (Requirement 5.9). */
  liberadaPorPreparacao: boolean
  /** Preenchida só quando o estado é bloqueada. */
  etapaNecessaria: Etapa | null
  grupos: readonly VisaoGrupoMissoes[]
  /** Certificações de referência desta etapa, na ordem do catálogo. */
  certificacoes: readonly VisaoItemCatalogo[]
}

function missaoDisponivel(missao: Missao): boolean {
  return missao.status === 'disponivel'
}

function gruposDaEtapa(etapa: Etapa): { vertente: Vertente | null; missoes: readonly Missao[] }[] {
  if (etapa.vertentes.length > 0) {
    return etapa.vertentes.map((vertente) => ({ vertente, missoes: vertente.missoes }))
  }
  return [{ vertente: null, missoes: etapa.missoes }]
}

function contarCausas(missao: Missao): ContagemCausas {
  return {
    disponiveis: missao.causas.filter((causa) => causa.status === 'disponivel').length,
    emPreparacao: missao.causas.filter((causa) => causa.status !== 'disponivel').length,
  }
}

function itemDoCatalogo(
  item: { id: string; status: StatusDisponibilidade },
  titulo: string,
  descricao: string,
): VisaoItemCatalogo {
  const { texto, icone } = APRESENTACAO_STATUS[item.status]
  return { id: item.id, titulo, descricao, status: item.status, statusTexto: texto, statusIcone: icone }
}

function missoesComRegistro(registros: readonly RegistroDeMissao[]): ReadonlySet<string> {
  return new Set(registros.map((registro) => registro.missao))
}

export interface OpcoesProgressoRota {
  certificacoes?: readonly Certificacao[]
  /** Muda só o estado exibido e a permissão de perfil. Padrão: inativo. Nunca muda o cálculo por registros. */
  modoDemonstracao?: boolean
}

/**
 * Pura. O estado por registros de cada etapa vem só dos Registros_de_Missão e do status das Missões. Etapa e
 * Vertente de um registro vêm do catálogo pela `missao`, não dos campos gravados no registro. O modo de
 * demonstração libera o perfil nas etapas bloqueadas, mas uma Missão só fica concluída com registro.
 */
export function calcularProgressoRota(
  rota: Rota,
  registros: readonly RegistroDeMissao[],
  opcoes: OpcoesProgressoRota = {},
): readonly VisaoEtapa[] {
  const certificacoes = opcoes.certificacoes ?? CATALOGO_CERTIFICACOES
  const modo = opcoes.modoDemonstracao === true
  const comRegistro = missoesComRegistro(registros)
  const resumo = rota.etapas.map((etapa) => {
    const disponiveis = missoesDaEtapa(etapa).filter((item) => missaoDisponivel(item.missao))
    return {
      semMissaoDisponivel: disponiveis.length === 0,
      cumprida: disponiveis.every((item) => comRegistro.has(item.missao.id)),
    }
  })

  return rota.etapas.map((etapa, indice) => {
    const anterior = indice > 0 ? rota.etapas[indice - 1] : null
    const bloqueadaPorRegistros = indice > 0 && !resumo[indice - 1].cumprida
    const bloqueada = bloqueadaPorRegistros && !modo
    const { semMissaoDisponivel, cumprida } = resumo[indice]
    const estadoPorRegistros: EstadoEtapa = bloqueadaPorRegistros
      ? 'bloqueada'
      : !semMissaoDisponivel && cumprida
        ? 'concluida'
        : 'liberada'
    const estado: EstadoEtapa = estadoPorRegistros === 'bloqueada' && modo ? 'liberada' : estadoPorRegistros
    const grupos = gruposDaEtapa(etapa).map(({ vertente, missoes }) => ({
      vertente,
      missoes: missoes.map((missao): VisaoMissao => {
        const disponivel = missaoDisponivel(missao)
        const registrada = comRegistro.has(missao.id)
        const estadoMissao: EstadoMissao = !disponivel
          ? 'em-preparacao'
          : registrada
            ? 'concluida'
            : bloqueada
              ? 'bloqueada'
              : 'disponivel'
        return {
          missao: missao.id,
          vertenteId: vertente?.id ?? null,
          estado: estadoMissao,
          podeIniciar: disponivel && !bloqueada,
          causas: contarCausas(missao),
        }
      }),
    }))
    return {
      etapa,
      estado,
      estadoPorRegistros,
      liberadaPorDemonstracao: modo && bloqueadaPorRegistros,
      seloDemonstracao: modo,
      cumprida,
      semMissaoDisponivel,
      liberadaPorPreparacao: !modo && !bloqueada && indice > 0 && resumo[indice - 1].semMissaoDisponivel,
      etapaNecessaria: bloqueada ? anterior : null,
      grupos,
      certificacoes: certificacoes
        .filter((item) => item.rotaId === rota.id && item.etapaIds.includes(etapa.id))
        .map((item) => itemDoCatalogo(item, item.nome, item.descricao)),
    }
  })
}

export interface VisaoMissaoCatalogo extends VisaoItemCatalogo {
  /** Só a contagem. Nomes e códigos de Causa não saem do catálogo. */
  causas: ContagemCausas
}
export interface VisaoGrupoCatalogo {
  etapa: Etapa
  vertente: Vertente | null
  itens: readonly VisaoMissaoCatalogo[]
}
export interface VisaoCatalogo {
  rotas: readonly VisaoItemCatalogo[]
  /** Todas as Missões, inclusive as em preparação, uma vez cada, por etapa e Vertente. */
  missoes: readonly VisaoGrupoCatalogo[]
  certificacoes: readonly VisaoItemCatalogo[]
  parceiros: readonly VisaoItemCatalogo[]
}
/** Pura. Reflete os catálogos recebidos, sem lista própria e sem cópia de texto de status. */
export function visaoDoCatalogo(
  rotas: readonly Rota[],
  certificacoes: readonly Certificacao[],
  parceiros: readonly Parceiro[],
): VisaoCatalogo {
  return {
    rotas: rotas.map((rota) => itemDoCatalogo(rota, rota.nome, rota.descricao)),
    missoes: rotas.flatMap((rota) =>
      rota.etapas.flatMap((etapa) =>
        gruposDaEtapa(etapa).map(({ vertente, missoes }) => ({
          etapa,
          vertente,
          itens: missoes.map((missao): VisaoMissaoCatalogo => {
            const { titulo, descricao } = textosDaMissao(missao.id)
            return { ...itemDoCatalogo(missao, titulo, descricao ?? ''), causas: contarCausas(missao) }
          }),
        })),
      ),
    ),
    certificacoes: certificacoes.map((item) => itemDoCatalogo(item, item.nome, item.descricao)),
    parceiros: parceiros.map((item) => itemDoCatalogo(item, TITULO_TIPO_PARCEIRO[item.tipo], item.descricao)),
  }
}

function plural(quantidade: number, singular: string, varias: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : varias}`
}

/** Ex.: "3 causas disponíveis e 1 em preparação". Sem código de Causa e sem o símbolo E comercial. */
export function textoCausas(contagem: ContagemCausas): string {
  const { disponiveis, emPreparacao } = contagem
  if (disponiveis > 0 && emPreparacao > 0) {
    return `${plural(disponiveis, 'causa disponível', 'causas disponíveis')} e ${emPreparacao} em preparação`
  }
  if (disponiveis > 0) return plural(disponiveis, 'causa disponível', 'causas disponíveis')
  if (emPreparacao > 0) return `${plural(emPreparacao, 'causa', 'causas')} em preparação`
  return ''
}

export interface GrupoPortfolio {
  etapa: Etapa
  /** Um grupo por Vertente na N3 Sênior. */
  vertente: Vertente | null
  registros: readonly RegistroDeMissao[]
  linkRevisao: (registro: RegistroDeMissao) => string
}

function linkRevisao(registro: RegistroDeMissao): string {
  return enderecoDe({ pagina: 'revisao', sessao: registro.sessaoId })
}

/** Pura. Grupos não vazios na ordem das etapas e, na N3 Sênior, das Vertentes. */
export function agruparRegistros(rota: Rota, registros: readonly RegistroDeMissao[]): readonly GrupoPortfolio[] {
  const grupos: GrupoPortfolio[] = []
  for (const etapa of rota.etapas) {
    for (const { vertente, missoes } of gruposDaEtapa(etapa)) {
      const ids = new Set<string>(missoes.map((missao) => missao.id))
      const doGrupo = registros.filter((registro) => ids.has(registro.missao))
      if (doGrupo.length > 0) grupos.push({ etapa, vertente, registros: doGrupo, linkRevisao })
    }
  }
  return grupos
}

export interface ExigenciaPortfolio {
  /** Uma exigência por etapa da rota, na ordem do catálogo. */
  escalaId: string
  rotulo: string
  cumprida: boolean
  /** Pendente e a etapa sem Missão disponível (Requirement 9.9). */
  aguardaPreparacao: boolean
}

export interface VisaoPortfolioAnalista {
  conquistado: boolean
  exigencias: readonly ExigenciaPortfolio[]
}

function rotuloExigencia(etapa: Etapa): string {
  return etapa.vertentes.length > 0
    ? `Ao menos uma missão em uma das vertentes da ${etapa.nome}`
    : `Ao menos uma missão em ${etapa.nome}`
}

/** Pura. Não recebe o Modo_de_Demonstração e não lê armazenamento (Requirement 9.10). */
export function calcularPortfolioAnalista(rota: Rota, registros: readonly RegistroDeMissao[]): VisaoPortfolioAnalista {
  const comRegistro = missoesComRegistro(registros)
  const exigencias = rota.etapas.map((etapa): ExigenciaPortfolio => {
    const missoes = missoesDaEtapa(etapa)
    const cumprida = missoes.some((item) => comRegistro.has(item.missao.id))
    const semDisponivel = !missoes.some((item) => missaoDisponivel(item.missao))
    return { escalaId: etapa.id, rotulo: rotuloExigencia(etapa), cumprida, aguardaPreparacao: !cumprida && semDisponivel }
  })
  return { conquistado: exigencias.length > 0 && exigencias.every((item) => item.cumprida), exigencias }
}
