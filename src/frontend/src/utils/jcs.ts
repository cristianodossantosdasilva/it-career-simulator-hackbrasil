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

const ITFS_DEMO_KEY_ID = 'itfs-hackbrasil-2026-es256-v1'
const ITFS_DEMO_PUBLIC_KEY_JWK: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'CedCYtD0INBOXIC2Ll-VahSmYb878G5YHM1hIcv3N8M',
  y: 'A2buqMGA6qHYDKUFzgXJgP8P8MaWkcZofOcRd9a5W4o',
}

function obterChavePublicaJwk(kid?: string): JsonWebKey | null {
  const envRaw = import.meta.env?.VITE_CURRICULO_PUBLIC_KEY_JWK
  if (typeof envRaw === 'string' && envRaw.trim().length > 0) {
    try {
      return JSON.parse(envRaw) as JsonWebKey
    } catch {
      return null
    }
  }
  if (!kid || kid === ITFS_DEMO_KEY_ID) return ITFS_DEMO_PUBLIC_KEY_JWK
  return null
}

function hexParaBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]{128}$/.test(hex)) return null
  const out = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export interface ResultadoVerificacaoCurriculo {
  status: 'integro' | 'divergente' | 'nao_verificavel'
  motivo: string
  hashCalculado?: string
  hashInformado?: string
  assinaturaVerificada?: boolean
  kid?: string
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

  if (hashCalculado !== hashInformado) {
    return {
      status: 'divergente',
      motivo: 'Divergente: o conteudo foi alterado apos a exportacao (hash nao confere).',
      hashCalculado,
      hashInformado,
      assinaturaVerificada: false,
    }
  }

  const assinaturaHex = typeof integridade?.assinatura === 'string' ? integridade.assinatura.trim().toLowerCase() : ''
  const kid = typeof integridade?.kid === 'string' ? integridade.kid.trim() : undefined

  if (assinaturaHex) {
    const sigBytes = hexParaBytes(assinaturaHex)
    const jwk = obterChavePublicaJwk(kid)
    if (!sigBytes || !jwk || !globalThis.crypto?.subtle) {
      return {
        status: 'divergente',
        motivo: 'Divergente: assinatura ECDSA-P256-SHA256 ausente de chave publica reconhecida ou malformada.',
        hashCalculado,
        hashInformado,
        assinaturaVerificada: false,
        kid,
      }
    }

    try {
      const chavePublica = await globalThis.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify'],
      )
      const valida = await globalThis.crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        chavePublica,
        sigBytes,
        new TextEncoder().encode(jcs),
      )
      if (!valida) {
        return {
          status: 'divergente',
          motivo: 'Divergente: hash confere localmente, mas a assinatura criptografica ECDSA-P256-SHA256 do servidor e invalida (possivel forja).',
          hashCalculado,
          hashInformado,
          assinaturaVerificada: false,
          kid,
        }
      }
      return {
        status: 'integro',
        motivo: 'Integro e Autentico: assinatura criptografica ECDSA-P256-SHA256 e hash SHA-256/JCS-RFC8785 validados localmente.',
        hashCalculado,
        hashInformado,
        assinaturaVerificada: true,
        kid: kid ?? ITFS_DEMO_KEY_ID,
      }
    } catch {
      return {
        status: 'divergente',
        motivo: 'Divergente: falha ao validar a assinatura criptografica ECDSA-P256-SHA256.',
        hashCalculado,
        hashInformado,
        assinaturaVerificada: false,
        kid,
      }
    }
  }

  return {
    status: 'integro',
    motivo: 'Integro: o hash SHA-256/JCS-RFC8785 calculado localmente confere com o arquivo exportado.',
    hashCalculado,
    hashInformado,
    assinaturaVerificada: false,
  }
}
