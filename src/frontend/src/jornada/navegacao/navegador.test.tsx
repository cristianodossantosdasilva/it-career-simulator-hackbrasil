import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LinkInterno } from './LinkInterno'
import { navegar, reiniciarLocalAtual, useLocalAtual } from './navegador'

function MostrarLocal() {
  const local = useLocalAtual()
  return (
    <p data-testid="local">
      {local.caminho}
      {local.busca}|{local.origem}|{local.chave}
    </p>
  )
}

/** Registra se a aplicação interceptou o clique e impede a navegação real do jsdom. */
let interceptado: boolean | null = null
function aoClicarNoDocumento(evento: MouseEvent) {
  interceptado = evento.defaultPrevented
  evento.preventDefault()
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  reiniciarLocalAtual()
  interceptado = null
  document.addEventListener('click', aoClicarNoDocumento)
})

afterEach(() => {
  document.removeEventListener('click', aoClicarNoDocumento)
  cleanup()
})

describe('navegador', () => {
  it('começa com origem inicial e acrescenta entrada no histórico com pushState', () => {
    render(<MostrarLocal />)
    expect(screen.getByTestId('local')).toHaveTextContent('/|inicial|0')
    const tamanhoAntes = window.history.length
    act(() => navegar('/breve'))
    expect(window.history.length).toBe(tamanhoAntes + 1)
    expect(window.location.pathname).toBe('/breve')
    expect(screen.getByTestId('local')).toHaveTextContent('/breve|interna|1')
  })

  it('substitui a entrada atual quando pedido', () => {
    render(<MostrarLocal />)
    const tamanhoAntes = window.history.length
    act(() => navegar('/check-in?motivo=sem-cartao', { substituir: true }))
    expect(window.history.length).toBe(tamanhoAntes)
    expect(screen.getByTestId('local')).toHaveTextContent('/check-in?motivo=sem-cartao|interna|1')
  })

  it('muda a origem para histórico no popstate', () => {
    render(<MostrarLocal />)
    act(() => navegar('/hangar'))
    act(() => {
      window.history.replaceState(null, '', '/caderno')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByTestId('local')).toHaveTextContent('/caderno|historico|2')
  })

  it('ignora popstate de mudança só de fragmento', () => {
    render(<MostrarLocal />)
    act(() => {
      window.history.replaceState(null, '', '/#conteudo-pagina')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByTestId('local')).toHaveTextContent('/|inicial|0')
  })
})

describe('LinkInterno', () => {
  function renderizarLink(props: Partial<Parameters<typeof LinkInterno>[0]> = {}) {
    render(
      <>
        <LinkInterno href="/plano-de-voo" aria-current="page" {...props}>
          Plano de Carreira
        </LinkInterno>
        <MostrarLocal />
      </>,
    )
    return screen.getByRole('link', { name: 'Plano de Carreira' })
  }

  it('tem href real, repassa aria-current e navega no clique principal', () => {
    const link = renderizarLink()
    expect(link).toHaveAttribute('href', '/plano-de-voo')
    expect(link).toHaveAttribute('aria-current', 'page')
    fireEvent.click(link)
    expect(interceptado).toBe(true)
    expect(screen.getByTestId('local')).toHaveTextContent('/plano-de-voo|interna|1')
  })

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']])('não intercepta clique com %s', (tecla) => {
    const link = renderizarLink()
    fireEvent.click(link, { [tecla]: true })
    expect(interceptado).toBe(false)
    expect(screen.getByTestId('local')).toHaveTextContent('/|inicial|0')
  })

  it('não intercepta botão do meio, link com target nem origem externa', () => {
    const link = renderizarLink()
    fireEvent.click(link, { button: 1 })
    expect(interceptado).toBe(false)
    cleanup()
    fireEvent.click(renderizarLink({ target: '_blank' }))
    expect(interceptado).toBe(false)
    cleanup()
    fireEvent.click(renderizarLink({ href: 'https://exemplo.invalid/plano-de-voo' }))
    expect(interceptado).toBe(false)
    cleanup()
    fireEvent.click(renderizarLink({ href: '//exemplo.invalid/plano-de-voo' }))
    expect(interceptado).toBe(false)
    expect(window.location.pathname).toBe('/')
  })
})
