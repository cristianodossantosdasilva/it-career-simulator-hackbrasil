import type { StatusDisponibilidade } from './status'

/** Identificadores de cenário do backend distribuídos pelas escalas da rota Suporte de TI. */
export type IdMissao =
  | 'reset-senha-desbloqueio'
  | 'pasta-rede-inacessivel'
  | 'incidente-massivo'
  | 'sre-cloud-latencia'
  | 'falha-backup-restore'
  | 'triagem-engenharia-social'
  | 'diagnostico-sql-readonly'

export type IdVertente = 'n3-a-redes-nuvem' | 'n3-b-data-center-backup' | 'n3-c-seguranca-dados'

export type IdEscala = 'help-desk-n1' | 'service-desk-n1-jr' | 'n2-pleno' | 'n3-senior'

export interface Causa {
  /** Código do cenário no backend, por exemplo C1 ou GATEWAY. Nunca exibido no Plano de voo. */
  codigo: string
  status: StatusDisponibilidade
}

export interface Missao {
  /** Identificador de cenário do backend. */
  id: IdMissao
  /** Disponível: o backend oferece hoje. Em preparação: ainda não. */
  status: StatusDisponibilidade
  /** Vazio quando o catálogo não registra Causas da Missão. */
  causas: readonly Causa[]
  /** Obrigatórios quando LEVELS não tem nível para o cenário. */
  titulo?: string
  descricao?: string
}

export interface Vertente {
  id: IdVertente
  nome: string
  missoes: readonly Missao[]
}

export interface Escala {
  id: IdEscala
  nome: string
  descricao: string
  /** Escalas 1 a 3. Vazio na N3 Sênior. */
  missoes: readonly Missao[]
  /** Só na N3 Sênior, na ordem N3-A, N3-B, N3-C. Vazio nas demais. */
  vertentes: readonly Vertente[]
}

export interface Rota {
  id: string
  nome: string
  descricao: string
  status: StatusDisponibilidade
  /** A ordem do array é a ordem da rota. */
  escalas: readonly Escala[]
}

export const CATALOGO_ROTAS = [
  {
    id: 'suporte-ti',
    nome: 'Suporte de TI',
    descricao: 'Atendimento de chamados, investigação de causa e comunicação com o usuário na Aurora Logística.',
    status: 'disponivel',
    escalas: [
      {
        id: 'help-desk-n1',
        nome: 'Help Desk N1',
        descricao: 'Primeiro contato com o usuário: identidade, acesso e orientação básica.',
        vertentes: [],
        missoes: [
          {
            id: 'reset-senha-desbloqueio',
            status: 'disponivel',
            titulo: 'Reset de senha e desbloqueio de conta',
            descricao: 'Verificar a identidade antes de agir.',
            causas: [
              { codigo: 'SENHA_ESQUECIDA', status: 'disponivel' },
              { codigo: 'CONTA_BLOQUEADA', status: 'disponivel' },
              { codigo: 'SENHA_EXPIRADA', status: 'disponivel' },
            ],
          },
        ],
      },
      {
        id: 'service-desk-n1-jr',
        nome: 'Service Desk N1 Jr',
        descricao: 'Diagnóstico de estação e rede local antes de escalar o chamado.',
        vertentes: [],
        missoes: [
          {
            id: 'pasta-rede-inacessivel',
            status: 'disponivel',
            causas: [
              { codigo: 'C1', status: 'disponivel' },
              { codigo: 'C2', status: 'disponivel' },
              { codigo: 'C3', status: 'disponivel' },
              { codigo: 'C4', status: 'disponivel' },
            ],
          },
        ],
      },
      {
        id: 'n2-pleno',
        nome: 'N2 Pleno',
        descricao: 'Incidentes que afetam vários usuários, com problema ITIL e causa raiz.',
        vertentes: [],
        missoes: [
          {
            id: 'incidente-massivo',
            status: 'disponivel',
            causas: [
              { codigo: 'GATEWAY', status: 'disponivel' },
              { codigo: 'EMAIL_PROVEDOR', status: 'disponivel' },
              { codigo: 'DOMINIO_SUSPENSO', status: 'disponivel' },
            ],
          },
        ],
      },
      {
        id: 'n3-senior',
        nome: 'N3 Sênior',
        descricao: 'Especialização em três vertentes: redes e nuvem, data center e backup, segurança e dados.',
        missoes: [],
        vertentes: [
          {
            id: 'n3-a-redes-nuvem',
            nome: 'N3-A Redes e Nuvem',
            missoes: [
              {
                id: 'sre-cloud-latencia',
                status: 'disponivel',
                causas: [
                  { codigo: 'OOM_KILLED', status: 'disponivel' },
                  { codigo: 'POOL_EXHAUSTED', status: 'disponivel' },
                  { codigo: 'CERT_EXPIRED', status: 'disponivel' },
                ],
              },
            ],
          },
          {
            id: 'n3-b-data-center-backup',
            nome: 'N3-B Data Center e Backup',
            missoes: [
              {
                id: 'falha-backup-restore',
                status: 'disponivel',
                titulo: 'Falha de backup e restauração',
                descricao: 'Investigar a rotina de backup e restaurar os dados com segurança.',
                causas: [
                  { codigo: 'REPOSITORIO_CHEIO', status: 'disponivel' },
                  { codigo: 'CADEIA_CORROMPIDA', status: 'disponivel' },
                ],
              },
            ],
          },
          {
            id: 'n3-c-seguranca-dados',
            nome: 'N3-C Segurança e Dados',
            missoes: [
              { id: 'triagem-engenharia-social', status: 'disponivel', causas: [] },
              { id: 'diagnostico-sql-readonly', status: 'disponivel', causas: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'infraestrutura-nuvem',
    nome: 'Infraestrutura e nuvem',
    descricao: 'Servidores, redes corporativas e serviços em nuvem.',
    status: 'em-preparacao',
    escalas: [],
  },
  {
    id: 'desenvolvimento',
    nome: 'Desenvolvimento de software',
    descricao: 'Construção, testes e manutenção de aplicações.',
    status: 'futuro',
    escalas: [],
  },
  {
    id: 'dados',
    nome: 'Dados e análise',
    descricao: 'Consultas, modelagem e análise de dados para decisões.',
    status: 'futuro',
    escalas: [],
  },
] as const satisfies readonly Rota[]

export type IdRota = (typeof CATALOGO_ROTAS)[number]['id']

/** Missão_de_Demonstração, aberta pelo Atalho_Experimentar (Requirement 17.13 e 17.14). */
export const MISSAO_DEMONSTRACAO = 'pasta-rede-inacessivel' as const satisfies IdMissao

const ROTAS: readonly Rota[] = CATALOGO_ROTAS

export function rotaPorId(id: string): Rota | null {
  return ROTAS.find((rota) => rota.id === id) ?? null
}

/** Missões da Escala na ordem do catálogo, com a Vertente de cada uma (nula nas Escalas 1 a 3). */
export function missoesDaEscala(escala: Escala): readonly { missao: Missao; vertente: Vertente | null }[] {
  return [
    ...escala.missoes.map((missao) => ({ missao, vertente: null })),
    ...escala.vertentes.flatMap((vertente) => vertente.missoes.map((missao) => ({ missao, vertente }))),
  ]
}

export function escalaDaMissao(
  missao: string,
): { rota: Rota; escala: Escala; indice: number; vertente: Vertente | null; missao: Missao } | null {
  for (const rota of ROTAS) {
    for (const [indice, escala] of rota.escalas.entries()) {
      const encontrada = missoesDaEscala(escala).find((item) => item.missao.id === missao)
      if (encontrada) return { rota, escala, indice, vertente: encontrada.vertente, missao: encontrada.missao }
    }
  }
  return null
}

export function ehIdMissao(valor: string): valor is IdMissao {
  return escalaDaMissao(valor) !== null
}
