import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaBreve } from './PaginaBreve'

function abrir(registrados: readonly IdMissao[] = []) {
  const registros = registrados.map((missao, indice) => registroDeTeste(missao, `sessao-${indice}`))
  const armazenamento = criarArmazenamentoFalso(
    registros.length > 0 ? { [CHAVE_REGISTROS_VOO]: serializarRegistros(registros) } : {},
  )
  render(
    <ProvedorJornada armazenamento={armazenamento}>
      <PaginaBreve />
    </ProvedorJornada>,
  )
}

function secaoBreve(): HTMLElement {
  return screen.getByRole('heading', { name: 'Brevê de piloto' }).closest('section') as HTMLElement
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Brevê', () => {
  it('sem registros mostra o estado vazio com link para o Plano de voo e um único h1', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Brevê' })).toBeInTheDocument()
    expect(screen.getByText(/Você ainda não tem voos registrados/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Plano de voo/ })).toHaveAttribute('href', '/plano-de-voo')
  })

  it('agrupa os registros por escala e, na N3 Sênior, por Vertente, com o resultado como recebido e o link da sessão', () => {
    abrir(['pasta-rede-inacessivel', 'sre-cloud-latencia', 'diagnostico-sql-readonly'])
    expect(screen.getByRole('heading', { level: 3, name: 'Service Desk N1 Jr' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'N3 Sênior' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'N3-C Segurança e Dados' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'N3-B Data Center e Backup' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    const grupoA = screen.getByRole('group', { name: 'N3-A Redes e Nuvem' })
    expect(within(grupoA).getByText('Resultado do Juiz 360º: Atendimento concluído.')).toBeInTheDocument()
    expect(within(grupoA).getByRole('link', { name: /Abrir a Caixa-preta/ })).toHaveAttribute('href', '/caixa-preta/sessao-1')
    expect(screen.queryByText(/Você ainda não tem voos registrados/)).not.toBeInTheDocument()
  })

  it('mostra as quatro exigências pendentes, sem texto de aguardo', () => {
    abrir()
    const secao = secaoBreve()
    expect(within(secao).getByText('Brevê de piloto pendente')).toBeInTheDocument()
    const itens = within(secao).getAllByRole('listitem')
    expect(itens).toHaveLength(4)
    for (const item of itens) expect(within(item).getByText('Pendente')).toBeInTheDocument()
    for (const item of itens) expect(within(item).queryByText('Aguarda missão em preparação no simulador.')).not.toBeInTheDocument()
  })

  it('mostra o Brevê de piloto conquistado, com texto, quando as quatro exigências estão cumpridas', () => {
    abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel', 'incidente-massivo', 'sre-cloud-latencia'])
    const secao = secaoBreve()
    expect(within(secao).getByText('Brevê de piloto conquistado')).toBeInTheDocument()
    for (const item of within(secao).getAllByRole('listitem')) expect(within(item).getByText('Cumprida')).toBeInTheDocument()
  })

  it('não faz nenhuma chamada a fetch', () => {
    const rede = vi.spyOn(globalThis, 'fetch')
    abrir(['pasta-rede-inacessivel'])
    expect(rede).not.toHaveBeenCalled()
  })

  it('mostra a Credencial com título de nível 2 e o Comandante no papel Mentor', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 2, name: 'Credencial' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Comandante, papel Mentor/ })).toBeInTheDocument()
  })
})

describe('Credencial: atalhos de prática respeitam os portões', () => {
  function linhaDoNivel(nome: string): HTMLElement {
    return screen.getByText(nome, { selector: 'strong' }).closest('li') as HTMLElement
  }

  it('lista os seis níveis da trilha, na ordem do Catálogo de Rotas', () => {
    abrir()
    const nomes = screen.getAllByText(/^Teoria \d+%, Fixação \d+%, Prática \d+%$/).map((item) => item.previousElementSibling?.textContent)
    expect(nomes).toEqual([
      'Help Desk N1',
      'Service Desk N1 Jr',
      'N2 Pleno',
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
  })

  it('escala liberada: Praticar leva à Cabine da missão', () => {
    abrir()
    fireEvent.click(within(linhaDoNivel('Help Desk N1')).getByRole('button', { name: 'Praticar' }))
    expect(window.location.pathname).toBe('/cabine/reset-senha-desbloqueio')
  })

  it('escala bloqueada: mostra o estado e leva ao Plano de voo, nunca à Cabine', () => {
    window.history.replaceState(null, '', '/breve')
    abrir()
    const linha = linhaDoNivel('N2 Pleno')
    expect(within(linha).queryByRole('button', { name: 'Praticar' })).not.toBeInTheDocument()
    expect(within(linha).getByText(/A escala N2 Pleno ainda não está liberada/)).toBeInTheDocument()
    const botao = within(linha).getByRole('button', { name: 'Ver o Plano de voo' })
    expect(botao).toHaveAccessibleDescription(/ainda não está liberada/)
    fireEvent.click(botao)
    expect(window.location.pathname).toBe('/plano-de-voo')
  })

  it('com os registros anteriores, a N2 Pleno passa a levar à Cabine', () => {
    abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel'])
    const linha = linhaDoNivel('N2 Pleno')
    expect(within(linha).queryByText(/ainda não está liberada/)).not.toBeInTheDocument()
    fireEvent.click(within(linha).getByRole('button', { name: 'Praticar' }))
    expect(window.location.pathname).toBe('/cabine/incidente-massivo')
  })
})