import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { type ChamadaDeTeste, simularApi } from '../../testes/apiDeTeste'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { CHAVE_REGISTROS_VOO, analisarRegistros, serializarRegistros } from '../armazenamento/registrosVoo'
import { CHAVE_VOOS_ATIVOS, serializarVoosAtivos } from '../armazenamento/voosAtivos'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { decidirPortao } from '../navegacao/portoes'
import { resolverEndereco } from '../navegacao/rotas'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaCabine } from './PaginaCabine'

function criacoes(chamadas: readonly ChamadaDeTeste[]) {
  return chamadas.filter((chamada) => chamada.metodo === 'POST' && chamada.url.endsWith('/api/sessoes'))
}

function pagina(missao: IdMissao, busca = '', armazenamentoInicial: Record<string, string> = {}) {
  const armazenamento = criarArmazenamentoFalso({
    [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE),
    ...armazenamentoInicial,
  })
  const rota = resolverEndereco(`/cabine/${missao}`, busca)
  if (rota.pagina !== 'cabine') throw new Error('rota inesperada')
  const portao = decidirPortao(rota, CARTAO_DE_TESTE, analisarRegistros(armazenamento.getItem(CHAVE_REGISTROS_VOO)))
  return { armazenamento, rota, portao }
}

function montar(missao: IdMissao, busca = '', armazenamentoInicial: Record<string, string> = {}) {
  const { armazenamento, rota, portao } = pagina(missao, busca, armazenamentoInicial)
  window.history.replaceState(null, '', `/cabine/${missao}${busca}`)
  return render(
    <StrictMode>
      <ProvedorJornada armazenamento={armazenamento}>
        <PaginaCabine rota={rota} portao={portao} />
      </ProvedorJornada>
    </StrictMode>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Cabine', () => {
  it('em StrictMode cria uma única sessão com o corpo só com o identificador da Missão e mostra o turno', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    montar('pasta-rede-inacessivel')
    // O h1 existe antes de qualquer resposta do servidor.
    expect(screen.getByRole('heading', { level: 1, name: 'Cabine' })).toBeInTheDocument()
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    const posts = criacoes(chamadas)
    expect(posts).toHaveLength(1)
    expect(JSON.parse(posts[0].corpo ?? '')).toEqual({ cenarioId: 'pasta-rede-inacessivel' })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Juiz 360º e Replay/ })).toHaveAttribute('href', '/caixa-preta/sessao-nova')
  })

  it('reescreve o endereço sem os parâmetros de teste depois de criar a sessão', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    montar('pasta-rede-inacessivel', '?semente=42&causa=C1&nova=1')
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(JSON.parse(criacoes(chamadas)[0]?.corpo ?? '')).toEqual({
      cenarioId: 'pasta-rede-inacessivel',
      semente: 42,
      causaForcada: 'C1',
    })
    expect(window.location.pathname + window.location.search).toBe('/cabine/pasta-rede-inacessivel')
  })

  it('Missão em preparação mostra o aviso e não chama o servidor', () => {
    const chamadas = simularApi({ missao: 'reset-senha-desbloqueio' })
    montar('reset-senha-desbloqueio')
    expect(screen.getByText('Este cenário ainda está em preparação no simulador.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao Plano de voo' })).toHaveAttribute('href', '/plano-de-voo')
    expect(screen.queryByRole('navigation', { name: 'Aplicativos da Cabine' })).not.toBeInTheDocument()
    expect(chamadas).toHaveLength(0)
  })

  it('escala bloqueada mostra o aviso com a escala necessária e não chama o servidor', () => {
    const chamadas = simularApi({ missao: 'incidente-massivo' })
    montar('incidente-massivo')
    expect(screen.getByText(/A escala N2 Pleno ainda não está liberada\. Conclua as missões disponíveis de Service Desk N1 Jr/)).toBeInTheDocument()
    expect(chamadas).toHaveLength(0)
  })

  it('404 na retomada mostra o aviso e o botão refaz a missão substituindo o histórico', async () => {
    const chamadas = simularApi({ missao: 'incidente-massivo', statusSessao: 404 })
    const antes = window.history.length
    montar('incidente-massivo', '', {
      [CHAVE_REGISTROS_VOO]: serializarRegistros([registroDeTeste('pasta-rede-inacessivel', 'sessao-0')]),
      [CHAVE_VOOS_ATIVOS]: serializarVoosAtivos({
        versao: 1,
        ultimaMissao: 'incidente-massivo',
        porMissao: { 'incidente-massivo': 'sessao-velha' },
      }),
    })
    expect(await screen.findByText('Esta sessão não está mais disponível no servidor.')).toBeInTheDocument()
    expect(criacoes(chamadas)).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Refazer a missão' }))
    expect(window.location.pathname + window.location.search).toBe('/cabine/incidente-massivo?nova=1')
    expect(window.history.length).toBe(antes)
  })

  it('erro de rede mostra a mensagem e permite tentar de novo', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel', statusSessao: 'rede' })
    const { armazenamento, rota, portao } = pagina('pasta-rede-inacessivel')
    render(
      <ProvedorJornada armazenamento={armazenamento}>
        <PaginaCabine rota={rota} portao={portao} />
      </ProvedorJornada>,
    )
    expect(await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 5000 })).toBeInTheDocument()
  })

  it('voltar de Aulas não cria outra sessão', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    const { armazenamento, rota, portao } = pagina('pasta-rede-inacessivel')
    const arvore = (comCabine: boolean) => (
      <ProvedorJornada armazenamento={armazenamento}>
        {comCabine ? <PaginaCabine rota={rota} portao={portao} /> : <p>Aulas</p>}
      </ProvedorJornada>
    )
    const { rerender } = render(arvore(true))
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    rerender(arvore(false))
    expect(screen.queryByRole('navigation', { name: 'Aplicativos da Cabine' })).not.toBeInTheDocument()
    rerender(arvore(true))
    // A sessão em memória é reaproveitada: o turno volta sem tela de espera.
    expect(screen.getByRole('navigation', { name: 'Aplicativos da Cabine' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Cabine' })).toBeInTheDocument())
    expect(criacoes(chamadas)).toHaveLength(1)
  })

  it('a gaveta do Comandante usa o papel Copiloto', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel' })
    montar('pasta-rede-inacessivel')
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    fireEvent.click(screen.getByRole('button', { name: /Comandante/ }))
    expect(await screen.findByRole('heading', { name: /Comandante, papel Copiloto/ })).toBeInTheDocument()
  })
})
