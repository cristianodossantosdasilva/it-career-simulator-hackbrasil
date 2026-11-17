import type { AvaliacaoResponse } from '../api/types'
import type { CartaoEmbarque } from '../jornada/armazenamento/cartaoEmbarque'
import type { RegistroDeVoo } from '../jornada/armazenamento/registrosVoo'
import type { VoosAtivos } from '../jornada/armazenamento/voosAtivos'
import {
  CATALOGO_ROTAS,
  type IdMissao,
  type Missao,
  type Rota,
  escalaDaMissao,
  missoesDaEscala,
  rotaPorId,
} from '../jornada/catalogos/catalogoRotas'
import type { StatusDisponibilidade } from '../jornada/catalogos/status'
import type { Gerador } from './propriedade'

export const ROTA_SUPORTE: Rota = rotaPorId('suporte-ti') as Rota
export const MISSOES_CATALOGO: readonly IdMissao[] = ROTA_SUPORTE.escalas.flatMap((escala) =>
  missoesDaEscala(escala).map((item) => item.missao.id),
)
const IDS_ROTA = CATALOGO_ROTAS.map((rota) => rota.id)

export function gerarIdSessao(g: Gerador): string {
  const alfabeto = 'abcdef0123456789-'
  let texto = ''
  const tamanho = g.inteiro(1, 36)
  for (let i = 0; i < tamanho; i += 1) texto += g.escolher([...alfabeto])
  return texto
}

export function gerarDataIso(g: Gerador): string {
  return new Date(Date.UTC(2026, g.inteiro(0, 11), g.inteiro(1, 28), g.inteiro(0, 23), g.inteiro(0, 59))).toISOString()
}

export function gerarCartao(g: Gerador): CartaoEmbarque {
  return {
    versao: 1,
    versaoRoteiro: g.escolher(['checkin-v1', 'checkin-v2']),
    rotaIndicadaId: g.escolher(IDS_ROTA),
    rotaId: 'suporte-ti',
    primeiraEscalaId: g.escolher(ROTA_SUPORTE.escalas).id,
    respostas: { interesse: g.texto(12), situacao: g.texto(12), ritmo: g.texto(12) },
    origem: g.escolher(['checkin', 'checkin-rapido'] as const),
    emitidoEm: gerarDataIso(g),
  }
}

export function gerarAvaliacao(g: Gerador, concluida = true): AvaliacaoResponse {
  return {
    concluida,
    resumo: g.texto(30),
    xpTotal: g.inteiro(0, 500),
    incidenteSeguranca: g.inteiro(0, 1) === 1,
    criterios: g.lista(
      (h) => ({
        id: `crit-${h.inteiro(1, 99)}`,
        descricao: h.texto(20),
        atendido: h.inteiro(0, 1) === 1,
        eventoSeq: h.inteiro(0, 1) === 1 ? h.inteiro(1, 50) : null,
        motivo: h.inteiro(0, 1) === 1 ? h.texto(10) : null,
        praticaEsperada: null,
        linkKb: null,
      }),
      5,
    ),
  }
}

export function gerarRegistro(g: Gerador, sessaoId: string, missao: IdMissao = g.escolher(MISSOES_CATALOGO)): RegistroDeVoo {
  const local = escalaDaMissao(missao)
  const avaliacao = gerarAvaliacao(g)
  // Escala e Vertente gravadas às vezes divergem do catálogo atual, como num registro antigo.
  const divergente = g.inteiro(0, 3) === 0
  return {
    versao: 1,
    sessaoId,
    missao,
    versaoCenario: g.escolher(['1.0.0', '2.1.0']),
    rotaId: 'suporte-ti',
    escalaId: divergente ? 'help-desk-n1' : (local?.escala.id ?? 'help-desk-n1'),
    vertenteId: divergente ? null : (local?.vertente?.id ?? null),
    concluidoEm: gerarDataIso(g),
    resultado: {
      concluida: true,
      resumo: avaliacao.resumo,
      xpTotal: avaliacao.xpTotal,
      incidenteSeguranca: avaliacao.incidenteSeguranca,
      criterios: avaliacao.criterios.map(({ id, descricao, atendido }) => ({ id, descricao, atendido })),
    },
  }
}

/** Registros com `sessaoId` distintos e missões sorteadas do catálogo. */
export function gerarRegistros(g: Gerador, maximo = 8): RegistroDeVoo[] {
  const quantidade = g.inteiro(0, maximo)
  return Array.from({ length: quantidade }, (_, i) => gerarRegistro(g, `sessao-${i}-${g.inteiro(0, 9999)}`))
}

export function gerarVoosAtivos(g: Gerador): VoosAtivos {
  const porMissao: Partial<Record<IdMissao, string>> = {}
  for (const missao of MISSOES_CATALOGO) if (g.inteiro(0, 1) === 1) porMissao[missao] = gerarIdSessao(g)
  return { versao: 1, ultimaMissao: g.inteiro(0, 2) === 0 ? null : g.escolher(MISSOES_CATALOGO), porMissao }
}

const STATUS_GERADOS: readonly StatusDisponibilidade[] = ['disponivel', 'em-preparacao']

function comStatus(g: Gerador, missao: Missao, opcoes: { missoes: boolean; causas: boolean }): Missao {
  return {
    ...missao,
    status: opcoes.missoes ? g.escolher(STATUS_GERADOS) : missao.status,
    causas: missao.causas.map((causa) => ({
      ...causa,
      status: opcoes.causas ? g.escolher(STATUS_GERADOS) : causa.status,
    })),
  }
}

/** Rota Suporte de TI com status sorteados para Missões e Causas, mantendo a distribuição. */
export function gerarRotaComStatus(g: Gerador, opcoes = { missoes: true, causas: true }): Rota {
  return {
    ...ROTA_SUPORTE,
    escalas: ROTA_SUPORTE.escalas.map((escala) => ({
      ...escala,
      missoes: escala.missoes.map((missao) => comStatus(g, missao, opcoes)),
      vertentes: escala.vertentes.map((vertente) => ({
        ...vertente,
        missoes: vertente.missoes.map((missao) => comStatus(g, missao, opcoes)),
      })),
    })),
  }
}

/** Mesma rota com todas as Causas disponíveis. */
export function comCausasDisponiveis(rota: Rota): Rota {
  const disponivel = (missao: Missao): Missao => ({
    ...missao,
    causas: missao.causas.map((causa) => ({ ...causa, status: 'disponivel' })),
  })
  return {
    ...rota,
    escalas: rota.escalas.map((escala) => ({
      ...escala,
      missoes: escala.missoes.map(disponivel),
      vertentes: escala.vertentes.map((vertente) => ({ ...vertente, missoes: vertente.missoes.map(disponivel) })),
    })),
  }
}
