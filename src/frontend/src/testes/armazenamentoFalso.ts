import type { CartaoEmbarque } from '../jornada/armazenamento/cartaoEmbarque'
import type { RegistroDeVoo } from '../jornada/armazenamento/registrosVoo'
import { type IdMissao, escalaDaMissao } from '../jornada/catalogos/catalogoRotas'

/** Storage em memória para testes, com contagem das gravações. */
export interface ArmazenamentoFalso extends Storage {
  readonly gravacoes: { chave: string; texto: string }[]
  readonly dados: Map<string, string>
}

export function criarArmazenamentoFalso(
  inicial: Record<string, string> = {},
  opcoes: { falharLeitura?: boolean; falharGravacao?: boolean } = {},
): ArmazenamentoFalso {
  const dados = new Map(Object.entries(inicial))
  const gravacoes: { chave: string; texto: string }[] = []
  return {
    dados,
    gravacoes,
    get length() {
      return dados.size
    },
    clear() {
      dados.clear()
    },
    key(indice: number) {
      return [...dados.keys()][indice] ?? null
    },
    getItem(chave: string) {
      if (opcoes.falharLeitura) throw new Error('leitura recusada')
      return dados.get(chave) ?? null
    },
    removeItem(chave: string) {
      dados.delete(chave)
    },
    setItem(chave: string, texto: string) {
      if (opcoes.falharGravacao) throw new Error('cota esgotada')
      gravacoes.push({ chave, texto })
      dados.set(chave, String(texto))
    },
  }
}

export const CARTAO_DE_TESTE: CartaoEmbarque = {
  versao: 1,
  versaoRoteiro: 'checkin-v1',
  rotaIndicadaId: 'suporte-ti',
  rotaId: 'suporte-ti',
  primeiraEscalaId: 'help-desk-n1',
  respostas: { interesse: 'ajudar-pessoas', situacao: 'comecando', ritmo: 'praticar' },
  origem: 'checkin',
  emitidoEm: '2026-11-20T12:00:00.000Z',
}

/** Registro válido da missão, com escala e Vertente do catálogo atual. */
export function registroDeTeste(missao: IdMissao, sessaoId: string): RegistroDeVoo {
  const local = escalaDaMissao(missao)
  if (!local) throw new Error(`missão fora do catálogo: ${missao}`)
  return {
    versao: 1,
    sessaoId,
    missao,
    versaoCenario: '1.0.0',
    rotaId: 'suporte-ti',
    escalaId: local.escala.id,
    vertenteId: local.vertente?.id ?? null,
    concluidoEm: '2026-11-20T12:30:00.000Z',
    resultado: {
      concluida: true,
      resumo: 'Atendimento concluído.',
      xpTotal: 120,
      incidenteSeguranca: false,
      criterios: [{ id: 'c1', descricao: 'Validou a identidade', atendido: true }],
    },
  }
}
