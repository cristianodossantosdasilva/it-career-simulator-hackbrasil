import type { PerguntaDiagnostico } from '../armazenamento/cartaoPerfil'
import { ROTEIRO_DIAGNOSTICO } from '../catalogos/catalogoVocacional'

export interface EstadoDiagnostico {
  /** Pergunta atual. Na indicação e no cartão, fica na última pergunta. */
  indice: number
  respostas: Partial<Record<PerguntaDiagnostico, string>>
  fase: 'perguntas' | 'indicacao' | 'cartao'
}

export type AcaoDiagnostico =
  | { tipo: 'responder'; opcaoId: string }
  | { tipo: 'voltar' }
  | { tipo: 'confirmar' }
  | { tipo: 'reiniciar' }

export const ESTADO_INICIAL_DIAGNOSTICO: EstadoDiagnostico = { indice: 0, respostas: {}, fase: 'perguntas' }

const TOTAL_PERGUNTAS = ROTEIRO_DIAGNOSTICO.perguntas.length

/**
 * Puro. Só `responder` com opção da pergunta atual tem efeito, e só na fase das perguntas. `voltar` na
 * indicação retorna à última pergunta com as respostas mantidas. `confirmar` só vale na indicação. A
 * gravação do cartão acontece no componente, depois de `confirmar`.
 */
export function reduzirDiagnostico(estado: EstadoDiagnostico, acao: AcaoDiagnostico): EstadoDiagnostico {
  switch (acao.tipo) {
    case 'responder': {
      if (estado.fase !== 'perguntas') return estado
      const pergunta = ROTEIRO_DIAGNOSTICO.perguntas[estado.indice]
      if (!pergunta || !pergunta.opcoes.some((opcao) => opcao.id === acao.opcaoId)) return estado
      const respostas = { ...estado.respostas, [pergunta.id]: acao.opcaoId }
      const ultima = estado.indice === TOTAL_PERGUNTAS - 1
      return ultima
        ? { indice: estado.indice, respostas, fase: 'indicacao' }
        : { indice: estado.indice + 1, respostas, fase: 'perguntas' }
    }
    case 'voltar':
      if (estado.fase === 'indicacao') return { ...estado, fase: 'perguntas', indice: TOTAL_PERGUNTAS - 1 }
      if (estado.fase === 'perguntas' && estado.indice > 0) return { ...estado, indice: estado.indice - 1 }
      return estado
    case 'confirmar':
      return estado.fase === 'indicacao' ? { ...estado, fase: 'cartao' } : estado
    case 'reiniciar':
      return ESTADO_INICIAL_DIAGNOSTICO
  }
}

/** Respostas completas, ou nulo enquanto falta alguma. */
export function respostasCompletas(estado: EstadoDiagnostico): Record<PerguntaDiagnostico, string> | null {
  const { interesse, situacao, ritmo } = estado.respostas
  return interesse !== undefined && situacao !== undefined && ritmo !== undefined
    ? { interesse, situacao, ritmo }
    : null
}
