import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../armazenamento/cartaoPerfil'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { resolverEndereco } from '../navegacao/rotas'
import { Pagina404 } from './Pagina404'

function abrir(caminho: string, comCartao: boolean) {
  const rota = resolverEndereco(caminho, '')
  if (rota.pagina !== 'nao-encontrada') throw new Error(`o endereço ${caminho} deveria cair na 404`)
  const armazenamento = criarArmazenamentoFalso(comCartao ? { [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE) } : {})
  render(
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <Pagina404 rota={rota} />
    </ProvedorArmazenamentoJornada>,
  )
}

afterEach(cleanup)

describe('Página 404', () => {
  it('mostra o caminho pedido e só o link para o Início quando não há cartão', () => {
    abrir('/nao-existe', false)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByText('/nao-existe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Início/ })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: /Plano de Carreira/ })).not.toBeInTheDocument()
  })

  it('com cartão válido oferece também o link para o Plano de Carreira', () => {
    abrir('/nao-existe', true)
    expect(screen.getByRole('link', { name: /Ir para o Início/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toHaveAttribute('href', '/plano-de-carreira')
  })

  it('missão desconhecida mostra o identificador informado e o link para o Plano de Carreira', () => {
    abrir('/mesa-de-trabalho/inexistente', false)
    expect(screen.getByText('inexistente')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toHaveAttribute('href', '/plano-de-carreira')
    expect(screen.getByRole('link', { name: /Ir para o Início/ })).toHaveAttribute('href', '/')
  })
})
