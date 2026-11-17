/**
 * Auxiliar de teste de propriedade sem dependencia externa. Gera valores com mulberry32 a partir
 * de uma semente fixa, para que toda falha seja reproduzivel.
 */
export interface Gerador {
  inteiro(min: number, max: number): number
  escolher<T>(itens: readonly T[]): T
  /** Texto com ate `maximo` caracteres, incluindo acentos, barras, espacos e caracteres de controle. */
  texto(maximo: number): string
  lista<T>(gerar: (g: Gerador) => T, maximo: number): T[]
}

export const SEMENTE_PADRAO = 20261130
export const EXECUCOES_PADRAO = 100

const ALFABETO_TEXTO = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ...'áéíóúãõçêâÁÉÇ',
  '/', '/', '/', '-', '_', '.', '?', '=', '&', '%', '#', ':', ' ', '\t', '\n', '\u0000', '\u001f',
]

export function criarGerador(semente: number): Gerador {
  let estado = semente >>> 0
  function proximo(): number {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const gerador: Gerador = {
    inteiro(min, max) {
      return min + Math.floor(proximo() * (max - min + 1))
    },
    escolher(itens) {
      if (itens.length === 0) throw new Error('escolher recebeu lista vazia')
      return itens[gerador.inteiro(0, itens.length - 1)]
    },
    texto(maximo) {
      const tamanho = gerador.inteiro(0, maximo)
      let resultado = ''
      for (let i = 0; i < tamanho; i += 1) resultado += gerador.escolher(ALFABETO_TEXTO)
      return resultado
    },
    lista(gerar, maximo) {
      const tamanho = gerador.inteiro(0, maximo)
      const itens: ReturnType<typeof gerar>[] = []
      for (let i = 0; i < tamanho; i += 1) itens.push(gerar(gerador))
      return itens
    },
  }
  return gerador
}

function descrever(valor: unknown): string {
  try {
    return JSON.stringify(valor)
  } catch {
    return String(valor)
  }
}

/**
 * Executa `verificar` sobre `execucoes` valores gerados. Na primeira falha, lanca um erro com o nome
 * da propriedade, a execucao, a semente e o valor em JSON.
 */
export function paraTodo<T>(
  nome: string,
  gerar: (g: Gerador) => T,
  verificar: (valor: T) => void,
  opcoes: { execucoes?: number; semente?: number } = {},
): void {
  const execucoes = opcoes.execucoes ?? EXECUCOES_PADRAO
  const semente = opcoes.semente ?? SEMENTE_PADRAO
  const gerador = criarGerador(semente)
  for (let execucao = 1; execucao <= execucoes; execucao += 1) {
    const valor = gerar(gerador)
    try {
      verificar(valor)
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      throw new Error(
        `Propriedade "${nome}" falhou na execução ${execucao} de ${execucoes} (semente ${semente}). ` +
          `Valor: ${descrever(valor)}. Motivo: ${motivo}`,
        { cause: erro },
      )
    }
  }
}
