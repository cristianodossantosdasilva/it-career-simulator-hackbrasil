import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../armazenamento/registrosMissao'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { ProvedorJornada } from '../ProvedorJornada'
import { criarEntradaPortfolioLab, registrarEntradaPortfolioLab } from '../simulados/portfolioLab'
import { PaginaPortfolio } from './PaginaPortfolio'

function abrir(registrados: readonly IdMissao[] = []) {
  const registros = registrados.map((missao, indice) => registroDeTeste(missao, `sessao-${indice}`))
  const armazenamento = criarArmazenamentoFalso(
    registros.length > 0 ? { [CHAVE_REGISTROS_MISSAO]: serializarRegistros(registros) } : {},
  )
  render(
    <ProvedorJornada armazenamento={armazenamento}>
      <PaginaPortfolio />
    </ProvedorJornada>,
  )
}

function secaoPortfolio(): HTMLElement {
  return screen.getByRole('heading', { name: 'Portfólio de analista' }).closest('section') as HTMLElement
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Portfólio', () => {
  it('sem registros mostra o estado vazio com link para o Plano de Carreira e um único h1', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Portfólio' })).toBeInTheDocument()
    expect(screen.getByText(/Você ainda não tem missões registradas/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toHaveAttribute('href', '/plano-de-carreira')
  })

  it('agrupa os registros por etapa e, na N3 Sênior, por Vertente, com o resultado como recebido e o link da sessão', () => {
    abrir(['pasta-rede-inacessivel', 'sre-cloud-latencia', 'diagnostico-sql-readonly'])
    expect(screen.getByRole('heading', { level: 3, name: 'Service Desk N1 Jr' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'N3 Sênior' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'N3-C Segurança e Dados' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'N3-B Data Center e Backup' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    const grupoA = screen.getByRole('group', { name: 'N3-A Redes e Nuvem' })
    expect(within(grupoA).getByText('Resultado do Juiz 360º: Atendimento concluído.')).toBeInTheDocument()
    expect(within(grupoA).getByRole('link', { name: /Abrir a Revisão/ })).toHaveAttribute('href', '/revisao/sessao-1')
    expect(screen.queryByText(/Você ainda não tem missões registradas/)).not.toBeInTheDocument()
  })

  it('mostra as quatro exigências pendentes, sem texto de aguardo', () => {
    abrir()
    const secao = secaoPortfolio()
    expect(within(secao).getByText('Portfólio de analista pendente')).toBeInTheDocument()
    const itens = within(secao).getAllByRole('listitem')
    expect(itens).toHaveLength(4)
    for (const item of itens) expect(within(item).getByText('Pendente')).toBeInTheDocument()
    for (const item of itens) expect(within(item).queryByText('Aguarda missão em preparação no simulador.')).not.toBeInTheDocument()
  })

  it('mostra o Portfólio de analista conquistado, com texto, quando as quatro exigências estão cumpridas', () => {
    abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel', 'incidente-massivo', 'sre-cloud-latencia'])
    const secao = secaoPortfolio()
    expect(within(secao).getByText('Portfólio de analista conquistado')).toBeInTheDocument()
    for (const item of within(secao).getAllByRole('listitem')) expect(within(item).getByText('Cumprida')).toBeInTheDocument()
  })

  it('não faz nenhuma chamada a fetch', () => {
    const rede = vi.spyOn(globalThis, 'fetch')
    abrir(['pasta-rede-inacessivel'])
    expect(rede).not.toHaveBeenCalled()
  })

  it('mostra a Credencial com título de nível 2 e o Mentor no papel Mentor', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 2, name: 'Credencial' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mentor, papel Mentor/ })).toBeInTheDocument()
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

  it('etapa liberada: Praticar leva à Mesa de Trabalho da missão', () => {
    abrir()
    fireEvent.click(within(linhaDoNivel('Help Desk N1')).getByRole('button', { name: 'Praticar' }))
    expect(window.location.pathname).toBe('/mesa-de-trabalho/reset-senha-desbloqueio')
  })

  it('etapa bloqueada: mostra o estado e leva ao Plano de Carreira, nunca à Mesa de Trabalho', () => {
    window.history.replaceState(null, '', '/portfolio')
    abrir()
    const linha = linhaDoNivel('N2 Pleno')
    expect(within(linha).queryByRole('button', { name: 'Praticar' })).not.toBeInTheDocument()
    expect(within(linha).getByText(/A etapa N2 Pleno ainda não está liberada/)).toBeInTheDocument()
    const botao = within(linha).getByRole('button', { name: 'Ver o Plano de Carreira' })
    expect(botao).toHaveAccessibleDescription(/ainda não está liberada/)
    fireEvent.click(botao)
    expect(window.location.pathname).toBe('/plano-de-carreira')
  })

  it('com os registros anteriores, a N2 Pleno passa a levar à Mesa de Trabalho', () => {
    abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel'])
    const linha = linhaDoNivel('N2 Pleno')
    expect(within(linha).queryByText(/ainda não está liberada/)).not.toBeInTheDocument()
    fireEvent.click(within(linha).getByRole('button', { name: 'Praticar' }))
    expect(window.location.pathname).toBe('/mesa-de-trabalho/incidente-massivo')
  })
})

describe('Portfólio da Prova de Lab', () => {
  it('exibe estado vazio claro quando não há Provas de Lab concluídas', () => {
    abrir()
    const secao = screen.getByRole('heading', { level: 2, name: 'Portfólio da Prova de Lab' }).closest('section') as HTMLElement
    expect(within(secao).getByText(/Você ainda não concluiu nenhuma Prova de Lab/)).toBeInTheDocument()
    expect(within(secao).getByRole('link', { name: /Ir para Provas/ })).toHaveAttribute('href', '/provas')
  })

  it('exibe entradas da Prova de Lab com nota, critérios atendidos/pendentes, o que foi feito e filtra por cenário', () => {
    const base1 = registroDeTeste('reset-senha-desbloqueio', 'sessao-prova-a')
    const base2 = registroDeTeste('pasta-rede-inacessivel', 'sessao-prova-b')
    registrarEntradaPortfolioLab(
      criarEntradaPortfolioLab({
        ...base1,
        resultado: {
          ...base1.resultado,
          resumo: 'Reset fraudulento recusado com segurança.',
          criterios: [
            { id: 'c1', descricao: 'Validar matrícula e token', atendido: true },
            { id: 'c2', descricao: 'Registrar evidência no chamado', atendido: false },
          ],
        },
      }),
    )
    registrarEntradaPortfolioLab(
      criarEntradaPortfolioLab({
        ...base2,
        resultado: {
          ...base2.resultado,
          resumo: 'DNS corrigido e cache limpo.',
          criterios: [{ id: 'c3', descricao: 'Executar flushdns', atendido: true }],
        },
      }),
    )

    abrir()
    const secao = screen.getByRole('heading', { level: 2, name: 'Portfólio da Prova de Lab' }).closest('section') as HTMLElement
    expect(within(secao).getByText('50%')).toBeInTheDocument()
    expect(within(secao).getByText('100%')).toBeInTheDocument()
    expect(within(secao).getByText(/Reset fraudulento recusado com segurança/)).toBeInTheDocument()
    expect(within(secao).getByText('Validar matrícula e token')).toBeInTheDocument()
    expect(within(secao).getByText('Registrar evidência no chamado')).toBeInTheDocument()

    const filtro = within(secao).getByLabelText('Cenário:')
    fireEvent.change(filtro, { target: { value: 'pasta-rede-inacessivel' } })
    expect(within(secao).queryByText(/Reset fraudulento recusado com segurança/)).not.toBeInTheDocument()
    expect(within(secao).getByText(/DNS corrigido e cache limpo/)).toBeInTheDocument()
  })
})