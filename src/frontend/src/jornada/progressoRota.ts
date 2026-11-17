import type { RegistroDeVoo } from './armazenamento/registrosVoo'
import { type Escala, type IdMissao, type Missao, type Rota, type Vertente, missoesDaEscala } from './catalogos/catalogoRotas'
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
  /** Nula nas escalas 1 a 3. Um grupo por Vertente na N3 Sênior. */
  vertente: Vertente | null
  missoes: readonly VisaoMissao[]
}

export interface VisaoEscala {
  escala: Escala
  estado: EstadoEscala
  /** Escala_Cumprida: toda Missão disponível tem registro, inclusive quando não há nenhuma. */
  cumprida: boolean
  semMissaoDisponivel: boolean
  /** Liberada e a escala anterior sem Missão disponível (Requirement 5.9). */
  liberadaPorPreparacao: boolean
  /** Preenchida só quando o estado é bloqueada. */
  escalaNecessaria: Escala | null
  grupos: readonly VisaoGrupoMissoes[]
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

function missoesComRegistro(registros: readonly RegistroDeVoo[]): ReadonlySet<string> {
  return new Set(registros.map((registro) => registro.missao))
}

/**
 * Pura. Estado de cada escala calculado só pelos Registros_de_Voo e pelo status das Missões. Escala e
 * Vertente de um registro vêm do catálogo pela `missao`, não dos campos gravados no registro.
 */
export function calcularProgressoRota(rota: Rota, registros: readonly RegistroDeVoo[]): readonly VisaoEscala[] {
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
    const bloqueada = indice > 0 && !resumo[indice - 1].cumprida
    const { semMissaoDisponivel, cumprida } = resumo[indice]
    const estado: EstadoEscala = bloqueada
      ? 'bloqueada'
      : !semMissaoDisponivel && cumprida
        ? 'concluida'
        : 'liberada'
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
      cumprida,
      semMissaoDisponivel,
      liberadaPorPreparacao: !bloqueada && indice > 0 && resumo[indice - 1].semMissaoDisponivel,
      escalaNecessaria: bloqueada ? anterior : null,
      grupos,
    }
  })
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

/** Pura. Grupos não vazios na ordem das escalas e, na N3 Sênior, das Vertentes. */
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
  /** Uma exigência por escala da rota, na ordem do catálogo. */
  escalaId: string
  rotulo: string
  cumprida: boolean
  /** Pendente e a escala sem Missão disponível (Requirement 9.9). */
  aguardaPreparacao: boolean
}

export interface VisaoBrevePiloto {
  conquistado: boolean
  exigencias: readonly ExigenciaBreve[]
}

function rotuloExigencia(escala: Escala): string {
  return escala.vertentes.length > 0
    ? `Ao menos um voo em uma das vertentes da ${escala.nome}`
    : `Ao menos um voo em ${escala.nome}`
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
