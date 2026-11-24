import type { NomeIcone } from '../../ui/catalogoIcones'

/** Disponível: o backend oferece hoje. Em preparação: visível, sem perfil. Futuro: só anunciado. */
export type StatusDisponibilidade = 'disponivel' | 'em-preparacao' | 'futuro'

export const APRESENTACAO_STATUS: Record<StatusDisponibilidade, { texto: string; icone: NomeIcone }> = {
  disponivel: { texto: 'Disponível', icone: 'status-disponivel' },
  'em-preparacao': { texto: 'Em preparação', icone: 'status-preparacao' },
  futuro: { texto: 'Futuro', icone: 'status-futuro' },
}
