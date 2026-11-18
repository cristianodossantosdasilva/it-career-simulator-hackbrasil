import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
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

  it('mostra as quatro exigências pendentes, com o texto de aguardo da Help Desk N1', () => {
    abrir()
    const secao = secaoBreve()
    expect(within(secao).getByText('Brevê de piloto pendente')).toBeInTheDocument()
    const itens = within(secao).getAllByRole('listitem')
    expect(itens).toHaveLength(4)
    for (const item of itens) expect(within(item).getByText('Pendente')).toBeInTheDocument()
    expect(within(itens[0]).getByText('Aguarda missão em preparação no simulador.')).toBeInTheDocument()
    expect(within(itens[1]).queryByText('Aguarda missão em preparação no simulador.')).not.toBeInTheDocument()
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
