import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { criarEstadoInicialAcademia } from '../educacao/catalogoEducacional'
import { CredencialView } from './CredencialView'

afterEach(cleanup)

const NOME_ACESSIVEL = 'Selecionar arquivo JSON do Currículo Vivo'

function renderizar() {
  return render(
    <CredencialView
      estado={criarEstadoInicialAcademia()}
      xpTotal={0}
      apelido=""
      onPraticar={() => undefined}
    />,
  )
}

describe('Verificador offline: seletor de arquivo em portugues', () => {
  it('mantem o input real com nome acessivel e sem texto nativo em ingles', () => {
    renderizar()
    const entrada = screen.getByLabelText(NOME_ACESSIVEL) as HTMLInputElement
    expect(entrada.tagName).toBe('INPUT')
    expect(entrada.type).toBe('file')
    expect(entrada).toHaveAccessibleName(NOME_ACESSIVEL)
    expect(screen.queryByText(/choose file|no file chosen/i)).toBeNull()
  })

  it('o texto visivel do botao esta contido no nome acessivel', () => {
    renderizar()
    const rotulo = screen.getByText('Selecionar arquivo JSON', { selector: 'label' })
    const entrada = screen.getByLabelText(NOME_ACESSIVEL)
    expect(rotulo).toHaveAttribute('for', entrada.id)
    expect(entrada).toHaveAccessibleName(expect.stringContaining(rotulo.textContent ?? ''))
  })

  it('o input segue na ordem de foco do teclado, sem tabindex negativo nem hidden', () => {
    renderizar()
    const entrada = screen.getByLabelText(NOME_ACESSIVEL)
    expect(entrada).not.toHaveAttribute('tabindex', '-1')
    expect(entrada).not.toHaveAttribute('hidden')
    expect(entrada).toBeEnabled()
    entrada.focus()
    expect(document.activeElement).toBe(entrada)
  })

  it('mostra Nenhum arquivo selecionado e depois o nome do arquivo escolhido', async () => {
    renderizar()
    const entrada = screen.getByLabelText(NOME_ACESSIVEL) as HTMLInputElement
    expect(screen.getByText('Nenhum arquivo selecionado')).toBeInTheDocument()
    expect(entrada).toHaveAccessibleDescription('Nenhum arquivo selecionado')

    const arquivo = new File(['{}'], 'curriculo-vivo-itfs.json', { type: 'application/json' })
    Object.defineProperty(arquivo, 'text', { value: async () => '{}' })
    fireEvent.change(entrada, { target: { files: [arquivo] } })

    expect(await screen.findByText('curriculo-vivo-itfs.json', { selector: '#verificador-arquivo-nome' })).toBeInTheDocument()
    expect(screen.queryByText('Nenhum arquivo selecionado')).toBeNull()
    expect(await screen.findByRole('status')).toBeInTheDocument()
  })
})
