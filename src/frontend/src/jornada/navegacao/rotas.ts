import { type NivelId, LEVELS, aulaPorId } from '../../educacao/catalogoEducacional'
import { type IdMissao, escalaDaMissao } from '../catalogos/catalogoRotas'

export type IdPagina =
  | 'inicio'
  | 'check-in'
  | 'plano-de-voo'
  | 'cabine'
  | 'caixa-preta'
  | 'breve'
  | 'hangar'
  | 'aulas'
  | 'treino'
  | 'caderno'
  | 'comandante'
  | 'nao-encontrada'

export type RotaResolvida =
  | { pagina: 'inicio' }
  | { pagina: 'check-in'; motivo: 'sem-cartao' | null; rapido: boolean }
  | { pagina: 'plano-de-voo' }
  | { pagina: 'cabine'; missao: IdMissao; semente: number | null; causa: string | null; nova: boolean }
  | { pagina: 'caixa-preta'; sessao: string }
  | { pagina: 'breve' }
  | { pagina: 'hangar' }
  | { pagina: 'aulas'; nivel: NivelId | null; modo: 'lesson' | 'cards'; aula: string | null }
  | { pagina: 'treino' }
  | { pagina: 'caderno' }
  | { pagina: 'comandante' }
  | { pagina: 'nao-encontrada'; caminho: string; missaoDesconhecida: string | null }

export const NOME_PAGINA: Record<IdPagina, string> = {
  inicio: 'Início',
  'check-in': 'Check-in',
  'plano-de-voo': 'Plano de voo',
  cabine: 'Cabine',
  'caixa-preta': 'Caixa-preta',
  breve: 'Brevê',
  hangar: 'Hangar',
  aulas: 'Aulas',
  treino: 'Treino de explicação',
  caderno: 'Caderno de estudos',
  comandante: 'Comandante',
  'nao-encontrada': 'Página não encontrada',
}

export const PADRAO_SESSAO = /^[A-Za-z0-9-]{1,64}$/

const PAGINAS_FIXAS: Record<string, RotaResolvida> = {
  '/': { pagina: 'inicio' },
  '/plano-de-voo': { pagina: 'plano-de-voo' },
  '/breve': { pagina: 'breve' },
  '/hangar': { pagina: 'hangar' },
  '/aulas/treino': { pagina: 'treino' },
  '/caderno': { pagina: 'caderno' },
  '/comandante': { pagina: 'comandante' },
}

/** Remove uma barra final, exceto na raiz. `/breve/` vira `/breve`. */
export function caminhoCanonico(caminho: string): string {
  return caminho.length > 1 && caminho.endsWith('/') ? caminho.slice(0, -1) : caminho
}

function lerSemente(valor: string | null): number | null {
  if (valor === null || !/^\d{1,15}$/.test(valor)) return null
  return Number(valor)
}

function lerNivel(valor: string | null): NivelId | null {
  return LEVELS.find((nivel) => nivel.id === valor)?.id ?? null
}

/** Total: todo par (caminho, busca) resolve para exatamente uma rota, sem lançar erro. */
export function resolverEndereco(caminho: string, busca: string): RotaResolvida {
  const canonico = caminhoCanonico(caminho)
  const parametros = new URLSearchParams(busca)

  const fixa = Object.hasOwn(PAGINAS_FIXAS, canonico) ? PAGINAS_FIXAS[canonico] : undefined
  if (fixa) return fixa

  if (canonico === '/check-in') {
    return {
      pagina: 'check-in',
      motivo: parametros.get('motivo') === 'sem-cartao' ? 'sem-cartao' : null,
      rapido: parametros.get('modo') === 'rapido',
    }
  }

  if (canonico === '/aulas') {
    const aula = parametros.get('aula')
    return {
      pagina: 'aulas',
      nivel: lerNivel(parametros.get('nivel')),
      modo: parametros.get('modo') === 'cards' ? 'cards' : 'lesson',
      aula: aula !== null && aulaPorId(aula) ? aula : null,
    }
  }

  const cabine = /^\/cabine\/([^/]+)$/.exec(canonico)
  if (cabine) {
    const identificador = cabine[1]
    const local = escalaDaMissao(identificador)
    if (!local) return { pagina: 'nao-encontrada', caminho, missaoDesconhecida: identificador }
    const causa = parametros.get('causa')
    const causaDisponivel = local.missao.causas.some((c) => c.codigo === causa && c.status === 'disponivel')
    return {
      pagina: 'cabine',
      missao: local.missao.id,
      semente: lerSemente(parametros.get('semente')),
      causa: causaDisponivel ? causa : null,
      nova: parametros.get('nova') === '1',
    }
  }

  const caixaPreta = /^\/caixa-preta\/([^/]+)$/.exec(canonico)
  if (caixaPreta && PADRAO_SESSAO.test(caixaPreta[1])) {
    return { pagina: 'caixa-preta', sessao: caixaPreta[1] }
  }

  return { pagina: 'nao-encontrada', caminho, missaoDesconhecida: null }
}

function comBusca(caminho: string, pares: [string, string | null][]): string {
  const parametros = new URLSearchParams()
  for (const [chave, valor] of pares) if (valor !== null) parametros.set(chave, valor)
  const texto = parametros.toString()
  return texto ? `${caminho}?${texto}` : caminho
}

/** Inversa de resolverEndereco para rotas válidas. Omite parâmetros nulos ou padrão. */
export function enderecoDe(rota: RotaResolvida): string {
  switch (rota.pagina) {
    case 'inicio':
      return '/'
    case 'check-in':
      return comBusca('/check-in', [
        ['motivo', rota.motivo],
        ['modo', rota.rapido ? 'rapido' : null],
      ])
    case 'plano-de-voo':
      return '/plano-de-voo'
    case 'cabine':
      return comBusca(`/cabine/${rota.missao}`, [
        ['semente', rota.semente === null ? null : String(rota.semente)],
        ['causa', rota.causa],
        ['nova', rota.nova ? '1' : null],
      ])
    case 'caixa-preta':
      return `/caixa-preta/${encodeURIComponent(rota.sessao)}`
    case 'breve':
      return '/breve'
    case 'hangar':
      return '/hangar'
    case 'aulas':
      return comBusca('/aulas', [
        ['nivel', rota.nivel],
        ['modo', rota.modo === 'cards' ? 'cards' : null],
        ['aula', rota.aula],
      ])
    case 'treino':
      return '/aulas/treino'
    case 'caderno':
      return '/caderno'
    case 'comandante':
      return '/comandante'
    case 'nao-encontrada':
      return rota.caminho
  }
}

export function tituloDocumento(nome: string): string {
  return `${nome}, IT Flight Simulator`
}
