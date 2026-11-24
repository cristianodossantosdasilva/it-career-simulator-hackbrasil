import { type NivelId, LEVELS, aulaPorId } from '../../educacao/catalogoEducacional'
import { type IdMissao, etapaDaMissao } from '../catalogos/catalogoRotas'

export type IdPagina =
  | 'inicio'
  | 'carreira'
  | 'aprender'
  | 'praticar'
  | 'biblioteca'
  | 'reforco'
  | 'simulados'
  | 'provas'
  | 'painel'
  | 'historico'
  | 'diagnostico'
  | 'plano-de-carreira'
  | 'mesa-de-trabalho'
  | 'revisao'
  | 'portfolio'
  | 'catalogo'
  | 'aulas'
  | 'treino'
  | 'caderno'
  | 'mentor'
  | 'nao-encontrada'

export type RotaResolvida =
  | { pagina: 'inicio' }
  | { pagina: 'carreira' }
  | { pagina: 'aprender' }
  | { pagina: 'praticar' }
  | { pagina: 'biblioteca' }
  | { pagina: 'reforco' }
  | { pagina: 'simulados' }
  | { pagina: 'provas' }
  | { pagina: 'painel' }
  | { pagina: 'historico' }
  | { pagina: 'diagnostico'; motivo: 'sem-cartao' | null; rapido: boolean }
  | { pagina: 'plano-de-carreira' }
  | { pagina: 'mesa-de-trabalho'; missao: IdMissao; semente: number | null; causa: string | null; nova: boolean }
  | { pagina: 'revisao'; sessao: string }
  | { pagina: 'portfolio' }
  | { pagina: 'catalogo' }
  | { pagina: 'aulas'; nivel: NivelId | null; modo: 'lesson' | 'cards'; aula: string | null }
  | { pagina: 'treino' }
  | { pagina: 'caderno' }
  | { pagina: 'mentor' }
  | { pagina: 'nao-encontrada'; caminho: string; missaoDesconhecida: string | null }

export const NOME_PAGINA: Record<IdPagina, string> = {
  inicio: 'Início',
  carreira: 'Carreira',
  aprender: 'Aprender',
  praticar: 'Praticar',
  biblioteca: 'Biblioteca',
  reforco: 'Reforço diário',
  simulados: 'Simulados',
  provas: 'Provas',
  painel: 'Painel',
  historico: 'Histórico',
  'diagnostico': 'Diagnóstico',
  'plano-de-carreira': 'Plano de Carreira',
  'mesa-de-trabalho': 'Mesa de Trabalho',
  'revisao': 'Revisão',
  'portfolio': 'Portfólio',
  'catalogo': 'Catálogo',
  aulas: 'Aulas',
  treino: 'Treino de explicação',
  caderno: 'Caderno de estudos',
  'mentor': 'Mentor',
  'nao-encontrada': 'Página não encontrada',
}

export const PADRAO_SESSAO = /^[A-Za-z0-9-]{1,64}$/

const PAGINAS_FIXAS: Record<string, RotaResolvida> = {
  '/': { pagina: 'inicio' },
  '/carreira': { pagina: 'carreira' },
  '/aprender': { pagina: 'aprender' },
  '/praticar': { pagina: 'praticar' },
  '/biblioteca': { pagina: 'biblioteca' },
  '/reforco': { pagina: 'reforco' },
  '/simulados': { pagina: 'simulados' },
  '/provas': { pagina: 'provas' },
  '/painel': { pagina: 'painel' },
  '/historico': { pagina: 'historico' },
  '/plano-de-carreira': { pagina: 'plano-de-carreira' },
  '/portfolio': { pagina: 'portfolio' },
  '/catalogo': { pagina: 'catalogo' },
  '/aulas/treino': { pagina: 'treino' },
  '/caderno': { pagina: 'caderno' },
  '/mentor': { pagina: 'mentor' },
}

/** Remove uma barra final, exceto na raiz. `/portfolio/` vira `/portfolio`. */
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

  if (canonico === '/diagnostico') {
    return {
      pagina: 'diagnostico',
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

  const mesa = /^\/mesa-de-trabalho\/([^/]+)$/.exec(canonico)
  if (mesa) {
    const identificador = mesa[1]
    const local = etapaDaMissao(identificador)
    if (!local) return { pagina: 'nao-encontrada', caminho, missaoDesconhecida: identificador }
    const causa = parametros.get('causa')
    const causaDisponivel = local.missao.causas.some((c) => c.codigo === causa && c.status === 'disponivel')
    return {
      pagina: 'mesa-de-trabalho',
      missao: local.missao.id,
      semente: lerSemente(parametros.get('semente')),
      causa: causaDisponivel ? causa : null,
      nova: parametros.get('nova') === '1',
    }
  }

  const revisao = /^\/revisao\/([^/]+)$/.exec(canonico)
  if (revisao && PADRAO_SESSAO.test(revisao[1])) {
    return { pagina: 'revisao', sessao: revisao[1] }
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
    case 'carreira':
      return '/carreira'
    case 'aprender':
      return '/aprender'
    case 'praticar':
      return '/praticar'
    case 'biblioteca':
      return '/biblioteca'
    case 'reforco':
      return '/reforco'
    case 'simulados':
      return '/simulados'
    case 'provas':
      return '/provas'
    case 'painel':
      return '/painel'
    case 'historico':
      return '/historico'
    case 'diagnostico':
      return comBusca('/diagnostico', [
        ['motivo', rota.motivo],
        ['modo', rota.rapido ? 'rapido' : null],
      ])
    case 'plano-de-carreira':
      return '/plano-de-carreira'
    case 'mesa-de-trabalho':
      return comBusca(`/mesa-de-trabalho/${rota.missao}`, [
        ['semente', rota.semente === null ? null : String(rota.semente)],
        ['causa', rota.causa],
        ['nova', rota.nova ? '1' : null],
      ])
    case 'revisao':
      return `/revisao/${encodeURIComponent(rota.sessao)}`
    case 'portfolio':
      return '/portfolio'
    case 'catalogo':
      return '/catalogo'
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
    case 'mentor':
      return '/mentor'
    case 'nao-encontrada':
      return rota.caminho
  }
}

export function tituloDocumento(nome: string): string {
  return `${nome}, IT Career Simulator`
}
