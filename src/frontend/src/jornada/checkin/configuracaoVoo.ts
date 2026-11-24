import type { RegistroDeVoo } from '../armazenamento/registrosVoo'
import { type IdEscala, type Rota, missoesDaEscala } from '../catalogos/catalogoRotas'

export type ModoCabine = 'treino' | 'missao'
export const CHAVE_MODO_CABINE = 'itfs_modo_cabine'

export function lerModoCabine(): ModoCabine {
  try {
    return window.localStorage.getItem(CHAVE_MODO_CABINE) === 'missao' ? 'missao' : 'treino'
  } catch {
    return 'treino'
  }
}

export function gravarModoCabine(modo: ModoCabine): void {
  try {
    window.localStorage.setItem(CHAVE_MODO_CABINE, modo)
  } catch {
    // armazenamento indisponível: o modo vale só para esta visita
  }
}

export interface DescricaoModoVoo {
  id: ModoCabine
  titulo: string
  subtitulo: string
  descricao: string
  destaques: readonly string[]
}

export const MODOS_VOO: readonly DescricaoModoVoo[] = [
  {
    id: 'treino',
    titulo: 'Modo Treino',
    subtitulo: 'Sem cronômetro e com apoio imediato',
    descricao: 'Ideal para aprender a rotina de atendimento no seu ritmo, com dicas liberadas e consulta livre.',
    destaques: [
      'Feedback imediato a cada decisão',
      'Sem contagem regressiva de SLA',
      'Progresso salvo para continuar depois',
    ],
  },
  {
    id: 'missao',
    titulo: 'Modo Missão',
    subtitulo: 'SLA cronometrado e avaliação só no fim',
    descricao: 'Simula a pressão real da operação na Aurora Logística. O Juiz 360º revela o resultado ao concluir.',
    destaques: [
      'Cronômetro de SLA ativo durante a missão',
      'Sem dicas automáticas durante o chamado',
      'Relatório completo na Caixa-preta ao final',
    ],
  },
] as const

export const REGRAS_PRONTO_PARA_COMECAR: readonly string[] = [
  'Seu progresso é salvo automaticamente neste navegador a cada ação.',
  'Você pode marcar chamados para revisar antes de encerrar a missão.',
  'Navegue livremente entre chamados, estação SimuDesk e base de conhecimento.',
  'Consulte o Mentor para receber orientação sem entregar a resposta pronta.',
  'No Modo Missão o cronômetro de SLA acompanha o turno e a nota sai apenas ao concluir.',
] as const

const PESOS_POR_ESCALA: Readonly<Record<IdEscala, number>> = {
  'help-desk-n1': 15,
  'service-desk-n1-jr': 20,
  'n2-pleno': 25,
  'n3-senior': 40,
}

export interface DominioConfig {
  id: IdEscala
  nome: string
  peso: number
  missoesTotal: number
  missoesConcluidas: number
  recomendado: boolean
}

/**
 * Calcula os domínios (etapas) da rota com peso percentual e indica o domínio com menor
 * conclusão como recomendado para o próximo foco.
 */
export function calcularDominiosDaRota(rota: Rota, registros: readonly RegistroDeVoo[]): DominioConfig[] {
  const concluidas = new Set(registros.map((r) => r.missao))
  const itens = rota.escalas.map((escala) => {
    const missoes = missoesDaEscala(escala)
    const total = missoes.length
    const feitas = missoes.filter((item) => concluidas.has(item.missao.id)).length
    return {
      id: escala.id,
      nome: escala.nome,
      peso: PESOS_POR_ESCALA[escala.id] ?? Math.round(100 / Math.max(1, rota.escalas.length)),
      missoesTotal: total,
      missoesConcluidas: feitas,
    }
  })

  let indiceRecomendado = -1
  let menorTaxa = 2
  itens.forEach((item, indice) => {
    const taxa = item.missoesTotal > 0 ? item.missoesConcluidas / item.missoesTotal : 1
    if (taxa < 1 && taxa < menorTaxa) {
      menorTaxa = taxa
      indiceRecomendado = indice
    }
  })

  return itens.map((item, indice) => ({
    ...item,
    recomendado: indice === indiceRecomendado,
  }))
}
