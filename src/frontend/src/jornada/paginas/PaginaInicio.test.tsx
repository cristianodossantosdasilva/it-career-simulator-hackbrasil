import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../armazenamento/cartaoPerfil'
import { CHAVE_MISSOES_ATIVAS, serializarMissoesAtivas } from '../armazenamento/missoesAtivas'
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
  it('sem cartão: um único h1 Início, botão para o diagnóstico e nenhum botão para o Plano de Carreira', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fazer o diagnóstico/ })).toHaveAttribute('href', '/diagnostico')
    expect(screen.queryByRole('link', { name: /Ir para o Plano de Carreira/ })).not.toBeInTheDocument()
  })

  it('com cartão válido: botão para o Plano de Carreira e opção de refazer o diagnóstico', () => {
    abrir({ [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE) })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toHaveAttribute('href', '/plano-de-carreira')
    expect(screen.getByRole('link', { name: /Refazer o diagnóstico/ })).toHaveAttribute('href', '/diagnostico')
  })

  it('com cartão inválido no armazenamento, trata como sem cartão', () => {
    abrir({ [CHAVE_CARTAO_PERFIL]: '{"versao":2}' })
    expect(screen.queryByRole('link', { name: /Ir para o Plano de Carreira/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fazer o diagnóstico/ })).toBeInTheDocument()
  })

  it('mostra a demonstração, os limites do guia e o painel do Mentor Consultor', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 2, name: 'Veja uma pergunta do diagnóstico' })).toBeInTheDocument()
    for (const limite of TEXTOS_HOME.limites) expect(screen.getByText(limite)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mentor, papel Consultor/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(TEXTOS_HOME.limites.length)
  })

  it('não grava nada ao abrir e não faz requisição', () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    const armazenamento = abrir()
    expect(armazenamento.gravacoes).toHaveLength(0)
    expect(espiao).not.toHaveBeenCalled()
  })

  it('mostra Continuar missão quando há missão ativa e exibe os atalhos rápidos', () => {
    abrir({
      [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE),
      [CHAVE_MISSOES_ATIVAS]: serializarMissoesAtivas({
        versao: 1,
        ultimaMissao: 'pasta-rede-inacessivel',
        porMissao: { 'pasta-rede-inacessivel': 'sessao-ativa-1' },
      }),
    })
    expect(screen.getByRole('heading', { level: 2, name: 'Continuar missão' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar missão' })).toHaveAttribute(
      'href',
      '/mesa-de-trabalho/pasta-rede-inacessivel',
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Três níveis e acesso rápido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aprender' })).toHaveAttribute('href', '/aprender')
    expect(screen.getByRole('link', { name: 'Praticar' })).toHaveAttribute('href', '/praticar')
  })
})
