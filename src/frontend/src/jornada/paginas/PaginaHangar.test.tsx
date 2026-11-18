import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AVISO_CERTIFICACOES, CATALOGO_CERTIFICACOES } from '../catalogos/catalogoCertificacoes'
import { CATALOGO_PARCEIROS } from '../catalogos/catalogoParceiros'
import { CATALOGO_ROTAS, type IdMissao } from '../catalogos/catalogoRotas'
import { APRESENTACAO_STATUS } from '../catalogos/status'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { PaginaHangar } from './PaginaHangar'

function secao(titulo: string | RegExp): HTMLElement {
  const encontrada = screen.getByRole('heading', { level: 2, name: titulo }).closest('section, [role="group"]')
  if (!encontrada) throw new Error(`sem seção para ${String(titulo)}`)
  return encontrada
}

function cartaoDaMissao(missao: IdMissao): HTMLElement {
  const item = screen.getByText(textosDaMissao(missao).titulo).closest('li')
  if (!item) throw new Error(`sem item para ${missao}`)
  return item
}

beforeEach(() => {
  window.history.replaceState(null, '', '/hangar')
})

afterEach(() => {
  cleanup()
})

describe('Página Hangar', () => {
  it('tem um único h1 e os grupos de catálogo como h2, na ordem', () => {
    render(<PaginaHangar />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Hangar' })).toBeInTheDocument()
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((titulo) => titulo.textContent)
    expect(titulos.slice(0, 4)).toEqual([
      'Rotas',
      'Missões de Suporte de TI',
      'Certificações de referência (mapeamento de conteúdo)',
      'Parceiros',
    ])
    expect(titulos[4]).toMatch(/^Transparência do escopo/)
  })

  it('lista as rotas do catálogo com o status em texto', () => {
    render(<PaginaHangar />)
    const rotas = within(secao('Rotas'))
    for (const rota of CATALOGO_ROTAS) {
      const item = rotas.getByRole('heading', { level: 3, name: rota.nome }).closest('li') as HTMLElement
      expect(within(item).getByText(APRESENTACAO_STATUS[rota.status].texto)).toBeInTheDocument()
    }
  })

  it('agrupa as Missões por escala e Vertente, com as em preparação e o status em texto', () => {
    render(<PaginaHangar />)
    const missoes = secao('Missões de Suporte de TI')
    const escalas = within(missoes)
      .getAllByRole('heading', { level: 3 })
      .map((titulo) => titulo.textContent)
    expect(escalas).toEqual(['Help Desk N1', 'Service Desk N1 Jr', 'N2 Pleno', 'N3 Sênior'])

    const vertentes = within(missoes).getAllByRole('group')
    expect(vertentes.map((grupo) => within(grupo).getByRole('heading', { level: 4 }).textContent)).toEqual([
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
    const grupoC = vertentes[2]
    expect(within(grupoC).getAllByRole('listitem')).toHaveLength(2)
    expect(within(grupoC).getByText(textosDaMissao('triagem-engenharia-social').titulo)).toBeInTheDocument()
    expect(within(grupoC).getByText(textosDaMissao('diagnostico-sql-readonly').titulo)).toBeInTheDocument()
    expect(within(vertentes[1]).getByText(textosDaMissao('falha-backup-restore').titulo)).toBeInTheDocument()

    const emPreparacao = cartaoDaMissao('reset-senha-desbloqueio')
    expect(within(emPreparacao).getByText('Em preparação')).toBeInTheDocument()
    expect(within(emPreparacao).getByText('3 causas em preparação')).toBeInTheDocument()
    const disponivel = cartaoDaMissao('pasta-rede-inacessivel')
    expect(within(disponivel).getByText('Disponível')).toBeInTheDocument()
    expect(within(disponivel).getByText('3 causas disponíveis e 1 em preparação')).toBeInTheDocument()
    expect(within(missoes).getAllByRole('listitem')).toHaveLength(7)
  })

  it('não mostra código de Causa nem botão de embarque nas Missões', () => {
    render(<PaginaHangar />)
    const missoes = secao('Missões de Suporte de TI')
    expect(missoes.textContent).not.toMatch(/SENHA_ESQUECIDA|GATEWAY|OOM_KILLED|\bC[1-4]\b/)
    expect(within(missoes).queryByRole('link')).not.toBeInTheDocument()
    expect(within(missoes).queryByRole('button')).not.toBeInTheDocument()
  })

  it('mostra as certificações com o aviso fixo e o status em texto', () => {
    render(<PaginaHangar />)
    const certificacoes = secao(/^Certificações de referência/)
    expect(within(certificacoes).getByText(AVISO_CERTIFICACOES)).toBeInTheDocument()
    expect(within(certificacoes).getAllByRole('listitem')).toHaveLength(CATALOGO_CERTIFICACOES.length)
    for (const item of CATALOGO_CERTIFICACOES) {
      const linha = within(certificacoes).getByText(item.nome).closest('li') as HTMLElement
      expect(within(linha).getByText(APRESENTACAO_STATUS[item.status].texto)).toBeInTheDocument()
    }
  })

  it('mostra os parceiros só como tipos genéricos, com status futuro', () => {
    render(<PaginaHangar />)
    const parceiros = secao('Parceiros')
    for (const item of CATALOGO_PARCEIROS) {
      const linha = within(parceiros).getByText(item.descricao).closest('li') as HTMLElement
      expect(within(linha).getByText('Futuro')).toBeInTheDocument()
    }
    expect(parceiros.textContent?.toLowerCase()).not.toContain('senai')
  })

  it('traz a Transparência do escopo', () => {
    render(<PaginaHangar />)
    expect(secao(/^Transparência do escopo/)).toBeInTheDocument()
  })

  it('não usa tabindex positivo e o único controle é um link alcançável pelo teclado', () => {
    const { container } = render(<PaginaHangar />)
    for (const elemento of container.querySelectorAll('[tabindex]')) {
      expect(Number(elemento.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
    const controles = container.querySelectorAll('a[href], button, input, select, textarea, summary')
    expect(controles).toHaveLength(1)
    const link = screen.getByRole('link', { name: 'Ver o Plano de voo' })
    expect(link.tabIndex).toBeGreaterThanOrEqual(0)
    link.focus()
    expect(link).toHaveFocus()
    fireEvent.click(link)
    expect(window.location.pathname).toBe('/plano-de-voo')
  })
})
