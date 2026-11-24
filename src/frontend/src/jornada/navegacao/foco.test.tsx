import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { useAnuncioJornada } from './anuncioJornada'
import { LinkInterno } from './LinkInterno'
import { navegar, reiniciarLocalAtual } from './navegador'
import { Roteador } from './Roteador'
import { NOME_PAGINA, type RotaResolvida } from './rotas'

function PaginaComErro(): never {
  throw new Error('falha simulada da página')
}

function BotaoAnunciarENavegar() {
  const { anunciar } = useAnuncioJornada()
  return (
    <button
      type="button"
      onClick={() => {
        anunciar('Cartão de Perfil emitido.')
        navegar('/plano-de-voo')
      }}
    >
      Emitir cartão
    </button>
  )
}

function PaginaDeTeste({ rota }: { rota: RotaResolvida }) {
  if (rota.pagina === 'hangar') return <PaginaComErro />
  return (
    <>
      <h1>{NOME_PAGINA[rota.pagina]}</h1>
      <LinkInterno href="/breve">Ir para o Portfólio</LinkInterno>
      <LinkInterno href="/hangar">Ir para o Catálogo</LinkInterno>
      <LinkInterno href="/caderno">Ir para o Caderno</LinkInterno>
      <BotaoAnunciarENavegar />
    </>
  )
}

function renderizar() {
  // Cartão semeado: o Plano de Carreira, destino do anúncio, passa pelo portão de cartão.
  const armazenamento = criarArmazenamentoFalso({ [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE) })
  return render(
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <Roteador renderizarPagina={(rota) => <PaginaDeTeste rota={rota} />} />
    </ProvedorArmazenamentoJornada>,
  )
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  reiniciarLocalAtual()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Roteador, foco e região viva', () => {
  it('não move o foco na carga inicial e define o título', () => {
    renderizar()
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).not.toHaveFocus()
    expect(document.title).toBe('Início, IT Career Simulator')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-pagina')
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo-pagina')
  })

  it('leva o foco ao h1 depois de navegação interna e atualiza o título', () => {
    renderizar()
    fireEvent.click(screen.getByRole('link', { name: 'Ir para o Portfólio' }))
    const titulo = screen.getByRole('heading', { level: 1, name: 'Portfólio' })
    expect(titulo).toHaveFocus()
    expect(titulo).toHaveAttribute('tabindex', '-1')
    expect(document.title).toBe('Portfólio, IT Career Simulator')
  })

  it('reescreve a barra final sem contar como navegação', () => {
    window.history.replaceState(null, '', '/breve/')
    reiniciarLocalAtual()
    renderizar()
    expect(window.location.pathname).toBe('/breve')
    expect(screen.getByRole('heading', { level: 1, name: 'Portfólio' })).not.toHaveFocus()
  })

  it('mantém a região viva entre navegações e limpa o anúncio ao sair da página de destino', () => {
    renderizar()
    const regiao = screen.getByRole('status')
    expect(regiao).toHaveAttribute('aria-live', 'polite')
    expect(regiao).toHaveTextContent('')
    fireEvent.click(screen.getByRole('button', { name: 'Emitir cartão' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Plano de Carreira' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(regiao)
    expect(regiao).toHaveTextContent('Cartão de Perfil emitido.')
    fireEvent.click(screen.getByRole('link', { name: 'Ir para o Caderno' }))
    expect(screen.getByRole('status')).toBe(regiao)
    expect(regiao).toHaveTextContent('')
  })

  it('isola o erro de uma página sem derrubar a moldura e limpa na próxima navegação', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderizar()
    const regiao = screen.getByRole('status')
    fireEvent.click(screen.getByRole('link', { name: 'Ir para o Catálogo' }))
    expect(screen.getByRole('alert')).toHaveTextContent('falha simulada da página')
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(regiao)
    act(() => navegar('/caderno'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Caderno de estudos' })).toBeInTheDocument()
  })
})
