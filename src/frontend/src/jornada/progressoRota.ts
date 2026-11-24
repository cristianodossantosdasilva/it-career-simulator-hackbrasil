import type { NomeIcone } from '../ui/Icone'
import type { RegistroDeVoo } from './armazenamento/registrosVoo'
import { type Certificacao, CATALOGO_CERTIFICACOES } from './catalogos/catalogoCertificacoes'
import { type Parceiro, TITULO_TIPO_PARCEIRO } from './catalogos/catalogoParceiros'
import { type Escala, type IdMissao, type Missao, type Rota, type Vertente, missoesDaEscala } from './catalogos/catalogoRotas'
import { APRESENTACAO_STATUS, type StatusDisponibilidade } from './catalogos/status'
import { textosDaMissao } from './componentes/textosDaMissao'
import { enderecoDe } from './navegacao/rotas'

export type EstadoEscala = 'liberada' | 'bloqueada' | 'concluida'
export type EstadoMissao = 'disponivel' | 'em-preparacao' | 'bloqueada' | 'concluida'

export interface ContagemCausas {
  disponiveis: number
  emPreparacao: number
}

export interface VisaoMissao {
  missao: IdMissao
  vertenteId: Vertente['id'] | null
  estado: EstadoMissao
  podeEmbarcar: boolean
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
export interface VisaoEscala {
  escala: Escala
  /** Estado exibido. Com o modo de demonstração ativo nenhuma etapa fica bloqueada. */
  estado: EstadoEscala
  /** Estado calculado só pelos Registros_de_Voo, igual a `estado` com o modo inativo. */
  estadoPorRegistros: EstadoEscala
  /** Verdadeiro quando o modo ativo liberou uma etapa que os registros mantêm bloqueada. */
  liberadaPorDemonstracao: boolean
  /** Verdadeiro em toda etapa com o modo ativo, inclusive nas concluídas. */
  seloDemonstracao: boolean
  /** Escala_Cumprida: toda Missão disponível tem registro, inclusive quando não há nenhuma. */
  cumprida: boolean
  semMissaoDisponivel: boolean
  /** Liberada e a etapa anterior sem Missão disponível (Requirement 5.9). */
  liberadaPorPreparacao: boolean
  /** Preenchida só quando o estado é bloqueada. */
  escalaNecessaria: Escala | null
  grupos: readonly VisaoGrupoMissoes[]
  /** Certificações de referência desta etapa, na ordem do catálogo. */
  certificacoes: readonly VisaoItemCatalogo[]
}

function missaoDisponivel(missao: Missao): boolean {
  return missao.status === 'disponivel'
}

function gruposDaEscala(escala: Escala): { vertente: Vertente | null; missoes: readonly Missao[] }[] {
  if (escala.vertentes.length > 0) {
    return escala.vertentes.map((vertente) => ({ vertente, missoes: vertente.missoes }))
  }
  return [{ vertente: null, missoes: escala.missoes }]
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

function missoesComRegistro(registros: readonly RegistroDeVoo[]): ReadonlySet<string> {
  return new Set(registros.map((registro) => registro.missao))
}

export interface OpcoesProgressoRota {
  certificacoes?: readonly Certificacao[]
  /** Muda só o estado exibido e a permissão de perfil. Padrão: inativo. Nunca muda o cálculo por registros. */
  modoDemonstracao?: boolean
}

/**
 * Pura. O estado por registros de cada etapa vem só dos Registros_de_Voo e do status das Missões. Etapa e
 * Vertente de um registro vêm do catálogo pela `missao`, não dos campos gravados no registro. O modo de
 * demonstração libera o perfil nas etapas bloqueadas, mas uma Missão só fica concluída com registro.
 */
export function calcularProgressoRota(
  rota: Rota,
  registros: readonly RegistroDeVoo[],
  opcoes: OpcoesProgressoRota = {},
): readonly VisaoEscala[] {
  const certificacoes = opcoes.certificacoes ?? CATALOGO_CERTIFICACOES
  const modo = opcoes.modoDemonstracao === true
  const comRegistro = missoesComRegistro(registros)
  const resumo = rota.escalas.map((escala) => {
    const disponiveis = missoesDaEscala(escala).filter((item) => missaoDisponivel(item.missao))
    return {
      semMissaoDisponivel: disponiveis.length === 0,
      cumprida: disponiveis.every((item) => comRegistro.has(item.missao.id)),
    }
  })

  return rota.escalas.map((escala, indice) => {
    const anterior = indice > 0 ? rota.escalas[indice - 1] : null
    const bloqueadaPorRegistros = indice > 0 && !resumo[indice - 1].cumprida
    const bloqueada = bloqueadaPorRegistros && !modo
    const { semMissaoDisponivel, cumprida } = resumo[indice]
    const estadoPorRegistros: EstadoEscala = bloqueadaPorRegistros
      ? 'bloqueada'
      : !semMissaoDisponivel && cumprida
        ? 'concluida'
        : 'liberada'
    const estado: EstadoEscala = estadoPorRegistros === 'bloqueada' && modo ? 'liberada' : estadoPorRegistros
    const grupos = gruposDaEscala(escala).map(({ vertente, missoes }) => ({
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
          podeEmbarcar: disponivel && !bloqueada,
          causas: contarCausas(missao),
        }
      }),
    }))
    return {
      escala,
      estado,
      estadoPorRegistros,
      liberadaPorDemonstracao: modo && bloqueadaPorRegistros,
      seloDemonstracao: modo,
      cumprida,
      semMissaoDisponivel,
      liberadaPorPreparacao: !modo && !bloqueada && indice > 0 && resumo[indice - 1].semMissaoDisponivel,
      escalaNecessaria: bloqueada ? anterior : null,
      grupos,
      certificacoes: certificacoes
        .filter((item) => item.rotaId === rota.id && item.escalaIds.includes(escala.id))
        .map((item) => itemDoCatalogo(item, item.nome, item.descricao)),
    }
  })
}

export interface VisaoMissaoHangar extends VisaoItemCatalogo {
  /** Só a contagem. Nomes e códigos de Causa não saem do catálogo. */
  causas: ContagemCausas
}
export interface VisaoGrupoHangar {
  escala: Escala
  vertente: Vertente | null
  itens: readonly VisaoMissaoHangar[]
}
export interface VisaoHangar {
  rotas: readonly VisaoItemCatalogo[]
  /** Todas as Missões, inclusive as em preparação, uma vez cada, por etapa e Vertente. */
  missoes: readonly VisaoGrupoHangar[]
  certificacoes: readonly VisaoItemCatalogo[]
  parceiros: readonly VisaoItemCatalogo[]
}
/** Pura. Reflete os catálogos recebidos, sem lista própria e sem cópia de texto de status. */
export function visaoDoHangar(
  rotas: readonly Rota[],
  certificacoes: readonly Certificacao[],
  parceiros: readonly Parceiro[],
): VisaoHangar {
  return {
    rotas: rotas.map((rota) => itemDoCatalogo(rota, rota.nome, rota.descricao)),
    missoes: rotas.flatMap((rota) =>
      rota.escalas.flatMap((escala) =>
        gruposDaEscala(escala).map(({ vertente, missoes }) => ({
          escala,
          vertente,
          itens: missoes.map((missao): VisaoMissaoHangar => {
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

export interface GrupoBreve {
  escala: Escala
  /** Um grupo por Vertente na N3 Sênior. */
  vertente: Vertente | null
  registros: readonly RegistroDeVoo[]
  linkCaixaPreta: (registro: RegistroDeVoo) => string
}

function linkCaixaPreta(registro: RegistroDeVoo): string {
  return enderecoDe({ pagina: 'caixa-preta', sessao: registro.sessaoId })
}

/** Pura. Grupos não vazios na ordem das etapas e, na N3 Sênior, das Vertentes. */
export function agruparRegistros(rota: Rota, registros: readonly RegistroDeVoo[]): readonly GrupoBreve[] {
  const grupos: GrupoBreve[] = []
  for (const escala of rota.escalas) {
    for (const { vertente, missoes } of gruposDaEscala(escala)) {
      const ids = new Set<string>(missoes.map((missao) => missao.id))
      const doGrupo = registros.filter((registro) => ids.has(registro.missao))
      if (doGrupo.length > 0) grupos.push({ escala, vertente, registros: doGrupo, linkCaixaPreta })
    }
  }
  return grupos
}

export interface ExigenciaBreve {
  /** Uma exigência por etapa da rota, na ordem do catálogo. */
  escalaId: string
  rotulo: string
  cumprida: boolean
  /** Pendente e a etapa sem Missão disponível (Requirement 9.9). */
  aguardaPreparacao: boolean
}

export interface VisaoBrevePiloto {
  conquistado: boolean
  exigencias: readonly ExigenciaBreve[]
}

function rotuloExigencia(escala: Escala): string {
  return escala.vertentes.length > 0
    ? `Ao menos uma missão em uma das vertentes da ${escala.nome}`
    : `Ao menos uma missão em ${escala.nome}`
}

/** Pura. Não recebe o Modo_de_Demonstração e não lê armazenamento (Requirement 9.10). */
export function calcularBrevePiloto(rota: Rota, registros: readonly RegistroDeVoo[]): VisaoBrevePiloto {
  const comRegistro = missoesComRegistro(registros)
  const exigencias = rota.escalas.map((escala): ExigenciaBreve => {
    const missoes = missoesDaEscala(escala)
    const cumprida = missoes.some((item) => comRegistro.has(item.missao.id))
    const semDisponivel = !missoes.some((item) => missaoDisponivel(item.missao))
    return { escalaId: escala.id, rotulo: rotuloExigencia(escala), cumprida, aguardaPreparacao: !cumprida && semDisponivel }
  })
  return { conquistado: exigencias.length > 0 && exigencias.every((item) => item.cumprida), exigencias }
}
