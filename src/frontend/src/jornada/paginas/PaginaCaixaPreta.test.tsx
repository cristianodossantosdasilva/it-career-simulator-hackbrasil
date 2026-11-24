import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { respostaJson, replayDeTeste, simularApi } from '../../testes/apiDeTeste'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaCaixaPreta } from './PaginaCaixaPreta'

function abrir(sessao: string, registradas: readonly { sessao: string; missao: Parameters<typeof registroDeTeste>[0] }[] = []) {
  const registros = registradas.map((item) => registroDeTeste(item.missao, item.sessao))
  const armazenamento = criarArmazenamentoFalso(
    registros.length > 0 ? { [CHAVE_REGISTROS_VOO]: serializarRegistros(registros) } : {},
  )
  window.history.replaceState(null, '', `/caixa-preta/${sessao}`)
  render(
    <ProvedorJornada armazenamento={armazenamento}>
      <PaginaCaixaPreta rota={{ pagina: 'caixa-preta', sessao }} />
    </ProvedorJornada>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Caixa-preta', () => {
  it('mostra o replay e a avaliação do servidor, com o Comandante no papel Mentor', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel', replay: replayDeTeste('sessao-x', 'pasta-rede-inacessivel') })
    abrir('sessao-x')
    expect(screen.getByRole('heading', { level: 1, name: 'Caixa-preta' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Relatório do Juiz 360º' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Comandante, papel Mentor/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('404 sem registro local avisa, oferece o Brevê e não mostra resumo nem botão de refazer', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel', statusReplay: 404 })
    abrir('sessao-x')
    expect(await screen.findByText('Esta sessão não está mais disponível no servidor.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o Brevê' })).toHaveAttribute('href', '/breve')
    expect(screen.queryByRole('button', { name: 'Refazer a missão' })).not.toBeInTheDocument()
    expect(screen.queryByText('Resumo guardado neste navegador')).not.toBeInTheDocument()
  })

  it('410 com registro local mostra o resumo local e o botão que refaz a missão', async () => {
    simularApi({ missao: 'incidente-massivo', statusReplay: 410 })
    abrir('sessao-9', [{ sessao: 'sessao-9', missao: 'incidente-massivo' }])
    expect(await screen.findByText('Esta sessão não está mais disponível no servidor.')).toBeInTheDocument()
    const resumo = screen.getByRole('heading', { name: 'Resumo guardado neste navegador' }).closest('section') as HTMLElement
    expect(within(resumo).getByText('Atendimento concluído.')).toBeInTheDocument()
    expect(within(resumo).getByText('Validou a identidade:', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o Brevê' })).toHaveAttribute('href', '/breve')
    fireEvent.click(screen.getByRole('button', { name: 'Refazer a missão' }))
    expect(window.location.pathname + window.location.search).toBe('/cabine/incidente-massivo?nova=1')
  })

  it('erro de rede mostra o aviso e tenta de novo com o mesmo pedido', async () => {
    let falhar = true
    const pedidos: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (entrada) => {
      pedidos.push(String(entrada))
      if (falhar) throw new TypeError('rede recusada')
      return respostaJson(replayDeTeste('sessao-x', 'pasta-rede-inacessivel'))
    })
    abrir('sessao-x')
    const tentar = await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 5000 })
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a Caixa-preta.')
    const tentativasAntes = pedidos.length
    falhar = false
    fireEvent.click(tentar)
    expect(await screen.findByRole('heading', { name: 'Relatório do Juiz 360º' })).toBeInTheDocument()
    expect(pedidos.slice(tentativasAntes).every((url) => url.endsWith('/api/sessoes/sessao-x/replay'))).toBe(true)
  })

  it('exibe resultado percentual, competências, fortes e fracos, revisão expansível e botões de ação', async () => {
    const replay = replayDeTeste('sessao-x', 'pasta-rede-inacessivel')
    replay.avaliacao.criterios = [
      {
        id: 'identidade',
        descricao: 'Validou a identidade do solicitante',
        atendido: true,
        eventoSeq: 1,
        motivo: 'Solicitou matrícula antes de agir.',
        praticaEsperada: null,
        linkKb: null,
      },
      {
        id: 'diagnostico',
        descricao: 'Verificou DNS na estação',
        atendido: false,
        eventoSeq: null,
        motivo: 'Não executou consulta DNS.',
        praticaEsperada: 'Executar nslookup no SimuDesk.',
        linkKb: 'kb-dns',
      },
    ]
    simularApi({ missao: 'pasta-rede-inacessivel', replay })
    abrir('sessao-x')

    const resultado = await screen.findByRole('region', { name: 'Resultado da missão' })
    expect(within(resultado).getByText('50%')).toBeInTheDocument()
    expect(within(resultado).getByText('1 de 2 critérios atendidos')).toBeInTheDocument()
    expect(within(resultado).getByRole('heading', { name: 'Desempenho por competência' })).toBeInTheDocument()
    expect(within(resultado).getByRole('heading', { name: 'Pontos fortes (1)' })).toBeInTheDocument()
    expect(within(resultado).getByRole('heading', { name: 'Áreas a melhorar (1)' })).toBeInTheDocument()
    expect(within(resultado).getByRole('heading', { name: 'Revisão critério a critério' })).toBeInTheDocument()
    expect(within(resultado).getByRole('button', { name: 'Refazer a missão' })).toBeInTheDocument()
    expect(within(resultado).getByRole('link', { name: 'Nova missão' })).toHaveAttribute('href', '/plano-de-voo')
  })
})
