function canonicalizarValor(valor: unknown): string {
  if (valor === null || typeof valor !== 'object') {
    return JSON.stringify(valor)
  }
  if (Array.isArray(valor)) {
    return `[${valor.map((item) => (item === undefined ? 'null' : canonicalizarValor(item))).join(',')}]`
  }
  const obj = valor as Record<string, unknown>
  const chaves = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const pares = chaves.map((k) => `${JSON.stringify(k)}:${canonicalizarValor(obj[k])}`)
  return `{${pares.join(',')}}`
}

export function canonicalizarJcs(valor: unknown): string {
  return canonicalizarValor(valor)
}

export async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface ResultadoVerificacaoCurriculo {
  status: 'integro' | 'divergente' | 'nao_verificavel'
  motivo: string
  hashCalculado?: string
  hashInformado?: string
}

export async function verificarCurriculoVivoJson(rawJson: string): Promise<ResultadoVerificacaoCurriculo> {
  let dados: Record<string, unknown>
  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { status: 'nao_verificavel', motivo: 'JSON invalido: esperado um objeto de Curriculo Vivo.' }
    }
    dados = parsed as Record<string, unknown>
  } catch {
    return { status: 'nao_verificavel', motivo: 'Nao foi possivel interpretar o texto como JSON valido.' }
  }

  const integridade = dados.integridade as Record<string, unknown> | undefined
  const hashInformado = typeof integridade?.hash === 'string' ? integridade.hash.trim().toLowerCase() : ''
  if (
    !hashInformado ||
    typeof dados.cargoAtual !== 'string' ||
    typeof dados.xpTotal !== 'number' ||
    !Array.isArray(dados.competencias) ||
    !Array.isArray(dados.sessoesConfirmadas)
  ) {
    return {
      status: 'nao_verificavel',
      motivo: 'Campos obrigatorios ausentes (cargoAtual, xpTotal, competencias, sessoesConfirmadas ou integridade.hash).',
    }
  }

  // Mesma estrutura canonica do backend (sem apelido, sem hash, sem exportadoEm)
  const nucleo = {
    cargoAtual: dados.cargoAtual,
    xpTotal: dados.xpTotal,
    competencias: [...dados.competencias].map(String).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    sessoesConfirmadas: dados.sessoesConfirmadas,
  }

  const jcs = canonicalizarJcs(nucleo)
  const hashCalculado = await sha256Hex(jcs)

  if (hashCalculado === hashInformado) {
    return {
      status: 'integro',
      motivo: 'Integro: o hash SHA-256/JCS-RFC8785 calculado localmente confere com o arquivo exportado.',
      hashCalculado,
      hashInformado,
    }
  }

  return {
    status: 'divergente',
    motivo: 'Divergente: o conteudo foi alterado apos a exportacao (hash nao confere).',
    hashCalculado,
    hashInformado,
  }
}
