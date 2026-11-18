import { fireEvent, render, screen, within } from '@testing-library/react'
import { App } from '../App'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../jornada/armazenamento/cartaoEmbarque'
import { reiniciarLocalAtual } from '../jornada/navegacao/navegador'
import { CARTAO_DE_TESTE } from './armazenamentoFalso'

/**
 * Abre o App no endereço dado. Por padrão semeia o Cartão_de_Embarque no armazenamento do navegador,
 * porque `/plano-de-voo` e `/cabine/:missao` exigem o cartão e sem ele terminam no Check-in.
 */
export function abrirAplicacao(endereco = '/', opcoes: { comCartao?: boolean } = {}) {
  const { comCartao = true } = opcoes
  if (comCartao) window.localStorage.setItem(CHAVE_CARTAO_EMBARQUE, serializarCartao(CARTAO_DE_TESTE))
  window.history.replaceState(null, '', endereco)
  reiniciarLocalAtual()
  return render(<App />)
}

export function menuPrincipal(): HTMLElement {
  return screen.getByRole('navigation', { name: /Navegação principal/i })
}

/** Segue um item do menu principal pelo link, como a pessoa faz. */
export function irPeloMenu(nome: string): void {
  fireEvent.click(within(menuPrincipal()).getByRole('link', { name: nome }))
}

/** Limpa o que os testes de navegação deixam no navegador simulado. */
export function limparNavegador(): void {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
  reiniciarLocalAtual()
}
