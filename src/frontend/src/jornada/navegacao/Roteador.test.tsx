import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { reiniciarLocalAtual } from './navegador'
import type { DecisaoPortao } from './portoes'
import { Roteador } from './Roteador'
import { NOME_PAGINA, type RotaResolvida } from './rotas'

function PaginaDeTeste({ rota, portao }: { rota: RotaResolvida; portao: DecisaoPortao }) {
  return (
    <>
      <h1>{NOME_PAGINA[rota.pagina]}</h1>
      <p>Portão: {portao.tipo}</p>
    </>
  )
}

function abrir(endereco: string, inicial: Record<string, string> = {}) {
  window.history.replaceState(null, '', endereco)
  reiniciarLocalAtual()
  const armazenamento = criarArmazenamentoFalso(inicial)
  render(
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <Roteador renderizarPagina={(rota, portao) => <PaginaDeTeste rota={rota} portao={portao} />} />
    </ProvedorArmazenamentoJornada>,
  )
  return armazenamento
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  reiniciarLocalAtual()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Roteador com portões', () => {
  it('sem cartão, /plano-de-voo termina em /check-in?motivo=sem-cartao sem aumentar o histórico', () => {
    const tamanhoAntes = window.history.length
    abrir('/plano-de-voo')
    expect(window.location.pathname).toBe('/check-in')
    expect(window.location.search).toBe('?motivo=sem-cartao')
    expect(window.history.length).toBe(tamanhoAntes)
    expect(screen.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Plano de Carreira' })).not.toBeInTheDocument()
  })

  it('cartão corrompido equivale a ausente, sem erro não tratado', () => {
    const erro = vi.spyOn(console, 'error')
    abrir('/cabine/pasta-rede-inacessivel', { [CHAVE_CARTAO_EMBARQUE]: '{"versao":1,"rotaId":' })
    expect(window.location.pathname).toBe('/check-in')
    expect(screen.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeInTheDocument()
    expect(erro).not.toHaveBeenCalled()
  })

  it('com cartão, exibe o Plano de Carreira e repassa o aviso de etapa bloqueada à Mesa de Trabalho', () => {
    const cartao = { [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE) }
    abrir('/plano-de-voo', cartao)
    expect(screen.getByRole('heading', { level: 1, name: 'Plano de Carreira' })).toBeInTheDocument()
    cleanup()
    abrir('/cabine/incidente-massivo', cartao)
    expect(window.location.pathname).toBe('/cabine/incidente-massivo')
    expect(screen.getByText('Portão: aviso-escala-bloqueada')).toBeInTheDocument()
  })
})
