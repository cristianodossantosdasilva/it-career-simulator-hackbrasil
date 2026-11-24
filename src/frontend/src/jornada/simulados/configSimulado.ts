import type { EscopoProva, FormatoProva } from '../../api/teorico'
import type { ConfigProva } from '../../teorico/estadoProva'

export type TipoSimulado = 'teorico' | 'lab'

export const DOMINIOS_SIMULADO: readonly string[] = [
  'Acesso e contas',
  'Redes',
  'Hardware',
  'Sistemas e ERP',
  'Segurança',
  'Backup e continuidade',
]

export const REGRAS_SIMULADO: readonly string[] = [
  'Suas respostas ficam salvas automaticamente neste navegador durante a sessão.',
  'Marque itens para revisar antes de finalizar a tentativa.',
  'Navegue livremente entre as questões ou chamados pelo mapa lateral.',
  'No formato Prática você confere a explicação na hora; no Padrão o resultado sai ao concluir.',
  'A nota mínima de aprovação nas provas completas é 70%.',
]

export interface ConfiguracaoSimuladoEscolhida {
  tipo: TipoSimulado
  formato: FormatoProva
  escopo: EscopoProva
  dominios: string[]
  nivel?: 1 | 2 | 3
  quantidade: number
}

/** Converte a seleção da tela de configuração no `ConfigProva` esperado por `TelaProvaTeorica`. */
export function paraConfigProva(config: ConfiguracaoSimuladoEscolhida): ConfigProva {
  return {
    formato: config.formato,
    escopo: config.escopo,
    topicos: config.escopo === 'personalizado' ? config.dominios : undefined,
    nivel: config.escopo === 'personalizado' ? config.nivel : undefined,
    quantidade: config.escopo === 'personalizado' ? config.quantidade : 40,
    origem: config.formato === 'pratica' ? 'pratica' : 'simulado',
  }
}
