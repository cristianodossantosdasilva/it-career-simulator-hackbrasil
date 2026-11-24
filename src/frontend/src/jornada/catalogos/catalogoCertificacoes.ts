import type { IdRota } from './catalogoRotas'
import type { StatusDisponibilidade } from './status'

export interface Certificacao {
  id: string
  /** Nome público da certificação, usado só como referência de mercado. */
  nome: string
  /** O que a etapa exercita que se relaciona com a referência. */
  descricao: string
  rotaId: IdRota
  escalaIds: readonly string[]
  /** Estado do mapeamento de conteúdo neste produto, não de uma prova ou de um acordo. */
  status: StatusDisponibilidade
}

export const AVISO_CERTIFICACOES =
  'Referências de mercado. Os nomes pertencem aos respectivos emissores. O IT Career Simulator não tem parceria com emissores, não equivale a nenhuma prova e não emite certificado.'

export const CATALOGO_CERTIFICACOES: readonly Certificacao[] = [
  {
    id: 'comptia-a-plus',
    nome: 'CompTIA A+',
    descricao: 'Atendimento de primeiro contato, identidade e acesso, e suporte básico a estações de trabalho.',
    rotaId: 'suporte-ti',
    escalaIds: ['help-desk-n1'],
    status: 'disponivel',
  },
  {
    id: 'itil-4-foundation',
    nome: 'ITIL 4 Foundation',
    descricao: 'Gestão de incidentes e problemas, registro de chamados e comunicação com o usuário.',
    rotaId: 'suporte-ti',
    escalaIds: ['service-desk-n1-jr', 'n2-pleno'],
    status: 'disponivel',
  },
  {
    id: 'comptia-network-plus',
    nome: 'CompTIA Network+',
    descricao: 'Diagnóstico de rede local, nomes e acesso a pastas compartilhadas.',
    rotaId: 'suporte-ti',
    escalaIds: ['service-desk-n1-jr'],
    status: 'em-preparacao',
  },
  {
    id: 'comptia-security-plus',
    nome: 'CompTIA Security+',
    descricao: 'Triagem de engenharia social, proteção de dados e resposta a incidentes de segurança.',
    rotaId: 'suporte-ti',
    escalaIds: ['n3-senior'],
    status: 'futuro',
  },
  {
    id: 'fundamentos-nuvem',
    nome: 'Fundamentos de nuvem de provedores públicos (referência genérica)',
    descricao: 'Latência, certificados e limites de recursos em serviços hospedados na nuvem.',
    rotaId: 'suporte-ti',
    escalaIds: ['n3-senior'],
    status: 'futuro',
  },
]
