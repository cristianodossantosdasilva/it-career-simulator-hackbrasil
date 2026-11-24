import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { CHAVE_VOOS_ATIVOS, serializarVoosAtivos } from '../armazenamento/voosAtivos'
import { TEXTOS_HOME } from '../catalogos/catalogoVocacional'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { PaginaInicio } from './PaginaInicio'

function abrir(inicial: Record<string, string> = {}) {
  const armazenamento = criarArmazenamentoFalso(inicial)
  render(
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <PaginaInicio />
    </ProvedorArmazenamentoJornada>,
  )
  return armazenamento
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Início', () => {
  it('sem cartão: um único h1 Início, botão para o check-in e nenhum botão para o Plano de voo', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fazer o check-in/ })).toHaveAttribute('href', '/check-in')
    expect(screen.queryByRole('link', { name: /Ir para o Plano de voo/ })).not.toBeInTheDocument()
  })

  it('com cartão válido: botão para o Plano de voo e opção de refazer o check-in', () => {
    abrir({ [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE) })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Ir para o Plano de voo/ })).toHaveAttribute('href', '/plano-de-voo')
    expect(screen.getByRole('link', { name: /Refazer o check-in/ })).toHaveAttribute('href', '/check-in')
  })

  it('com cartão inválido no armazenamento, trata como sem cartão', () => {
    abrir({ [CHAVE_CARTAO_EMBARQUE]: '{"versao":2}' })
    expect(screen.queryByRole('link', { name: /Ir para o Plano de voo/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fazer o check-in/ })).toBeInTheDocument()
  })

  it('mostra a demonstração, os limites do guia e o painel do Comandante Consultor', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 2, name: 'Veja uma pergunta do check-in' })).toBeInTheDocument()
    for (const limite of TEXTOS_HOME.limites) expect(screen.getByText(limite)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Comandante, papel Consultor/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(TEXTOS_HOME.limites.length)
  })

  it('não grava nada ao abrir e não faz requisição', () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    const armazenamento = abrir()
    expect(armazenamento.gravacoes).toHaveLength(0)
    expect(espiao).not.toHaveBeenCalled()
  })

  it('mostra Continuar missão quando há voo ativo e exibe os atalhos rápidos', () => {
    abrir({
      [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE),
      [CHAVE_VOOS_ATIVOS]: serializarVoosAtivos({
        versao: 1,
        ultimaMissao: 'pasta-rede-inacessivel',
        porMissao: { 'pasta-rede-inacessivel': 'sessao-ativa-1' },
      }),
    })
    expect(screen.getByRole('heading', { level: 2, name: 'Continuar missão' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar missão' })).toHaveAttribute(
      'href',
      '/cabine/pasta-rede-inacessivel',
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Atalhos rápidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aulas e fundamentos' })).toHaveAttribute('href', '/aulas')
    expect(screen.getByRole('link', { name: 'Brevê e histórico' })).toHaveAttribute('href', '/breve')
  })
})
