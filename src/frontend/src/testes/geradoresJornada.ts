import type { AvaliacaoResponse } from '../api/types'
import type { CartaoPerfil } from '../jornada/armazenamento/cartaoPerfil'
import type { RegistroDeMissao } from '../jornada/armazenamento/registrosMissao'
import type { MissoesAtivas } from '../jornada/armazenamento/missoesAtivas'
import {
  CATALOGO_ROTAS,
  type IdMissao,
  type Missao,
  type Rota,
  etapaDaMissao,
  missoesDaEtapa,
  rotaPorId,
} from '../jornada/catalogos/catalogoRotas'
import type { StatusDisponibilidade } from '../jornada/catalogos/status'
import type { Gerador } from './propriedade'

export const ROTA_SUPORTE: Rota = rotaPorId('suporte-ti') as Rota
export const MISSOES_CATALOGO: readonly IdMissao[] = ROTA_SUPORTE.etapas.flatMap((etapa) =>
  missoesDaEtapa(etapa).map((item) => item.missao.id),
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

export function gerarCartao(g: Gerador): CartaoPerfil {
  return {
    versao: 1,
    versaoRoteiro: g.escolher(['diagnostico-v1', 'diagnostico-v2']),
    rotaIndicadaId: g.escolher(IDS_ROTA),
    rotaId: 'suporte-ti',
    primeiraEtapaId: g.escolher(ROTA_SUPORTE.etapas).id,
    respostas: { interesse: g.texto(12), situacao: g.texto(12), ritmo: g.texto(12) },
    origem: g.escolher(['diagnostico', 'diagnostico-rapido'] as const),
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

export function gerarRegistro(g: Gerador, sessaoId: string, missao: IdMissao = g.escolher(MISSOES_CATALOGO)): RegistroDeMissao {
  const local = etapaDaMissao(missao)
  const avaliacao = gerarAvaliacao(g)
  // Etapa e Vertente gravadas às vezes divergem do catálogo atual, como num registro antigo.
  const divergente = g.inteiro(0, 3) === 0
  return {
    versao: 1,
    sessaoId,
    missao,
    versaoCenario: g.escolher(['1.0.0', '2.1.0']),
    rotaId: 'suporte-ti',
    etapaId: divergente ? 'help-desk-n1' : (local?.etapa.id ?? 'help-desk-n1'),
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
export function gerarRegistros(g: Gerador, maximo = 8): RegistroDeMissao[] {
  const quantidade = g.inteiro(0, maximo)
  return Array.from({ length: quantidade }, (_, i) => gerarRegistro(g, `sessao-${i}-${g.inteiro(0, 9999)}`))
}

export function gerarMissoesAtivas(g: Gerador): MissoesAtivas {
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
    etapas: ROTA_SUPORTE.etapas.map((etapa) => ({
      ...etapa,
      missoes: etapa.missoes.map((missao) => comStatus(g, missao, opcoes)),
      vertentes: etapa.vertentes.map((vertente) => ({
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
    etapas: rota.etapas.map((etapa) => ({
      ...etapa,
      missoes: etapa.missoes.map(disponivel),
      vertentes: etapa.vertentes.map((vertente) => ({ ...vertente, missoes: vertente.missoes.map(disponivel) })),
    })),
  }
}
