/**
 * Perfis tematicos do shell. O valor vai para o atributo data-theme do elemento html.
 * tactical: Cockpit Tatico (escuro, padrao). corporate: Console Corporativo (claro).
 */
export type TemaShell = 'tactical' | 'corporate'

export const CHAVE_TEMA = 'itfs_theme'
export const TEMA_PADRAO: TemaShell = 'tactical'

export const ROTULOS_TEMA: Record<TemaShell, string> = {
  tactical: 'Modo Cockpit Tático - Treinamento',
  corporate: 'Console Corporativo - Auditoria B2B',
}

function ehTemaValido(valor: unknown): valor is TemaShell {
  return valor === 'tactical' || valor === 'corporate'
}

export function carregarTema(): TemaShell {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA)
    return ehTemaValido(salvo) ? salvo : TEMA_PADRAO
  } catch {
    return TEMA_PADRAO
  }
}

export function salvarTema(tema: TemaShell): void {
  try {
    window.localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // armazenamento indisponivel: o tema vale so para a sessao atual
  }
}

/** Aplica data-theme e a classe .dark (compatibilidade com utilitarios no padrao Tailwind). */
export function aplicarTema(tema: TemaShell, raiz: HTMLElement = document.documentElement): void {
  raiz.dataset.theme = tema
  raiz.classList.toggle('dark', tema === 'tactical')
}
