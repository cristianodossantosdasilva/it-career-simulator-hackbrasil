import type { StatusDisponibilidade } from './status'

/**
 * Sem campo de nome: um nome real só pode entrar com uma mudança de tipo depois de acordo registrado,
 * fora deste escopo.
 */
export interface Parceiro {
  id: string
  tipo: 'ensino' | 'empregador' | 'comunidade'
  /** Genérica, sem nome de empresa. */
  descricao: string
  status: StatusDisponibilidade
}

export const TITULO_TIPO_PARCEIRO: Record<Parceiro['tipo'], string> = {
  ensino: 'Ensino',
  empregador: 'Empregadores',
  comunidade: 'Comunidade',
}

export const CATALOGO_PARCEIROS: readonly Parceiro[] = [
  { id: 'ensino-tecnico', tipo: 'ensino', descricao: 'Instituições de ensino técnico em TI', status: 'futuro' },
  {
    id: 'empregadores-estagio',
    tipo: 'empregador',
    descricao: 'Empresas com vagas de estágio em suporte',
    status: 'futuro',
  },
  {
    id: 'comunidades-suporte',
    tipo: 'comunidade',
    descricao: 'Comunidades de profissionais de suporte',
    status: 'futuro',
  },
]
