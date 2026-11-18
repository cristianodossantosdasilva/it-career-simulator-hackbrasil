/**
 * Armazem de aparencia: estado unico da aplicacao, fora da arvore do React. A criacao so le o que o
 * script inicial deixou no html. Gravar so acontece por acao do aluno, nunca na montagem.
 */
import { CATALOGO_TEMAS, type IdTema, type Tema } from './catalogo.ts'
import { lerEnvelopeDoDocumento, normalizarConfiguracao } from './configuracaoCliente.ts'
import { aplicarAparencia, lerAparenciaDoDocumento } from './documento.ts'
import { type AmbienteAparencia, calcularAparencia, criarAmbienteDoNavegador } from './inicializacao.ts'
import { type EstadoContraste, salvarContraste, salvarPreferenciaTema } from './persistencia.ts'
import { permissoesEfetivas } from './resolvedor.ts'

export type ModoSeletor = 'livre' | 'travado' | 'unico'

export interface InstantaneoAparencia {
  readonly tema: IdTema
  readonly contraste: EstadoContraste
  /** Temas permitidos, na ordem do catalogo. */
  readonly temasOferecidos: readonly Tema[]
  readonly modoSeletor: ModoSeletor
}

export interface ArmazemAparencia {
  obter(): InstantaneoAparencia
  assinar(ouvinte: () => void): () => void
  /** Retorna false e nao muda nada quando a trava esta ativa ou o tema nao e permitido. */
  escolherTema(id: IdTema): boolean
  definirContraste(ativo: boolean): void
}

const SILENCIO = (): void => undefined

export function criarArmazemAparencia(ambiente: AmbienteAparencia): ArmazemAparencia {
  const silencioso: AmbienteAparencia = { ...ambiente, registrar: SILENCIO }
  const raiz = ambiente.documento.documentElement
  const configuracao = normalizarConfiguracao(lerEnvelopeDoDocumento(ambiente.documento), SILENCIO)
  const { permitidos, travado } = permissoesEfetivas(configuracao)
  const temasOferecidos = CATALOGO_TEMAS.filter((tema) => permitidos.includes(tema.id))
  const modoSeletor: ModoSeletor = travado ? 'travado' : permitidos.length === 1 ? 'unico' : 'livre'

  let tema: IdTema
  let contraste: EstadoContraste
  const noDocumento = lerAparenciaDoDocumento(raiz)
  if (noDocumento.tema !== null && permitidos.includes(noDocumento.tema)) {
    tema = noDocumento.tema
    contraste = noDocumento.contraste
  } else {
    const calculado = calcularAparencia(silencioso)
    tema = calculado.tema
    contraste = calculado.contraste
    aplicarAparencia(raiz, tema, contraste)
  }

  const ouvintes = new Set<() => void>()
  let instantaneo: InstantaneoAparencia = { tema, contraste, temasOferecidos, modoSeletor }

  function publicar(): void {
    instantaneo = { tema, contraste, temasOferecidos, modoSeletor }
    for (const ouvinte of [...ouvintes]) ouvinte()
  }

  return {
    obter: () => instantaneo,
    assinar(ouvinte) {
      ouvintes.add(ouvinte)
      return () => {
        ouvintes.delete(ouvinte)
      }
    },
    escolherTema(id) {
      if (modoSeletor === 'travado' || !permitidos.includes(id)) return false
      const mudou = id !== tema
      tema = id
      aplicarAparencia(raiz, tema, contraste)
      salvarPreferenciaTema(id, ambiente.armazenamento)
      if (mudou) publicar()
      return true
    },
    definirContraste(ativo) {
      const novo: EstadoContraste = ativo ? 'alto' : 'padrao'
      const mudou = novo !== contraste
      contraste = novo
      aplicarAparencia(raiz, tema, contraste)
      salvarContraste(novo, ambiente.armazenamento)
      if (mudou) publicar()
    },
  }
}

let instancia: ArmazemAparencia | null = null

/** Instancia unica da aplicacao, criada sob demanda com o ambiente do navegador e registro silencioso. */
export function obterArmazemAparencia(): ArmazemAparencia {
  if (instancia === null) instancia = criarArmazemAparencia(criarAmbienteDoNavegador(window, SILENCIO))
  return instancia
}
