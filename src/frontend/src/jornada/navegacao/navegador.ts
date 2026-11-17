import { useSyncExternalStore } from 'react'

/** Inicial: primeira carga. Interna: navegação feita pela aplicação. Histórico: voltar ou avançar do navegador. */
export type OrigemNavegacao = 'inicial' | 'interna' | 'historico'

export interface LocalAtual {
  caminho: string
  busca: string
  origem: OrigemNavegacao
  /** Incrementa a cada navegação. Usada para o foco e para reiniciar o limite de erro da página. */
  chave: number
}

let instantaneo: LocalAtual | null = null
const ouvintes = new Set<() => void>()

function lerJanela(origem: OrigemNavegacao, chave: number): LocalAtual {
  return { caminho: window.location.pathname, busca: window.location.search, origem, chave }
}

export function obterLocalAtual(): LocalAtual {
  if (!instantaneo) instantaneo = lerJanela('inicial', 0)
  return instantaneo
}

function publicar(proximo: LocalAtual) {
  instantaneo = proximo
  for (const ouvinte of ouvintes) ouvinte()
}

function aoVoltarOuAvancar() {
  const atual = obterLocalAtual()
  // Link de salto e outras mudanças só de fragmento também disparam popstate. Não são troca de página.
  if (window.location.pathname === atual.caminho && window.location.search === atual.busca) return
  publicar(lerJanela('historico', atual.chave + 1))
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  if (ouvintes.size === 1) window.addEventListener('popstate', aoVoltarOuAvancar)
  return () => {
    ouvintes.delete(ouvinte)
    if (ouvintes.size === 0) window.removeEventListener('popstate', aoVoltarOuAvancar)
  }
}

/** Acrescenta (ou substitui) uma entrada no histórico e rola a página para o topo. */
export function navegar(href: string, opcoes: { substituir?: boolean } = {}): void {
  if (opcoes.substituir) window.history.replaceState(null, '', href)
  else window.history.pushState(null, '', href)
  publicar(lerJanela('interna', obterLocalAtual().chave + 1))
  const rolagem = document.scrollingElement ?? document.documentElement
  rolagem.scrollTop = 0
}

/**
 * Corrige a forma do endereço atual (por exemplo, sem a barra final) sem contar como navegação:
 * mantém a origem e a chave, então não move o foco nem reinicia a página.
 */
export function reescreverEndereco(href: string): void {
  window.history.replaceState(window.history.state, '', href)
  const atual = obterLocalAtual()
  publicar(lerJanela(atual.origem, atual.chave))
}

/** Só para testes: volta ao estado de primeira carga a partir do endereço atual da janela. */
export function reiniciarLocalAtual(): void {
  instantaneo = lerJanela('inicial', 0)
}

export function useLocalAtual(): LocalAtual {
  return useSyncExternalStore(assinar, obterLocalAtual, obterLocalAtual)
}
