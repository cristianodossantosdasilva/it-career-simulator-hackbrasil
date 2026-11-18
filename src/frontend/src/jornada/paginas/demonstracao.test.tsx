import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'
import { type ChamadaDeTeste, simularApi } from '../../testes/apiDeTeste'
import { CARTAO_DE_TESTE, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import { CHECKIN_RAPIDO, ROTEIRO_CHECKIN, rotuloDaResposta } from '../catalogos/catalogoVocacional'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { reiniciarLocalAtual } from '../navegacao/navegador'

const NOME_CONTROLE = 'Liberar todas as escalas para demonstração'
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-voo',
  alteradoEm: '2026-11-20T12:00:00.000Z',
})
const CARTAO = serializarCartao(CARTAO_DE_TESTE)

function abrirApp(endereco: string, semeado: Record<string, string> = {}) {
  window.localStorage.clear()
  for (const [chave, valor] of Object.entries(semeado)) window.localStorage.setItem(chave, valor)
  window.history.replaceState(null, '', endereco)
  reiniciarLocalAtual()
  return render(<App />)
}

function enderecoAtual() {
  return window.location.pathname + window.location.search
}

function modoGravado(): { ativo: boolean } | null {
  const texto = window.localStorage.getItem(CHAVE_MODO_DEMONSTRACAO)
  return texto ? (JSON.parse(texto) as { ativo: boolean }) : null
}

/** O jsdom não gera clique a partir de Espaço. Garante o que o teclado exige (foco e ordem de tabulação) e ativa. */
function ativarPeloTeclado(elemento: HTMLElement) {
  expect(elemento.tabIndex).toBeGreaterThanOrEqual(0)
  elemento.focus()
  expect(elemento).toHaveFocus()
  fireEvent.keyDown(elemento, { key: ' ' })
  fireEvent.keyUp(elemento, { key: ' ' })
  fireEvent.click(elemento)
}

function cartaoDa(missao: IdMissao): HTMLElement {
  const cartao = screen.getByRole('heading', { name: textosDaMissao(missao).titulo }).closest('li')
  if (!cartao) throw new Error(`sem cartão para ${missao}`)
  return cartao
}

function posts(chamadas: readonly ChamadaDeTeste[]) {
  return chamadas.filter((chamada) => chamada.metodo === 'POST' && chamada.url.endsWith('/api/sessoes'))
}

beforeEach(() => {
  window.localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('Plano de voo: controle do modo de demonstração', () => {
  it('o switch começa desativado, com nome igual ao rótulo e explicação ligada por aria-describedby', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    const controle = screen.getByRole('switch', { name: NOME_CONTROLE })
    expect(controle).toHaveAttribute('aria-checked', 'false')
    expect(controle).toHaveTextContent('Desativado')
    expect(controle).toHaveAccessibleDescription(/Atalho de avaliação para a banca do Hack Brasil 2026/)
    expect(controle).toHaveAccessibleDescription(/não conta como voo concluído/)
    expect(screen.getByRole('heading', { level: 2, name: 'Modo de demonstração' })).toBeInTheDocument()
    expect(screen.queryByText('Liberada para demonstração')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Modo de demonstração ativo' })).not.toBeInTheDocument()
  })

  it('ativa por clique e por teclado, mostra os quatro selos e anuncia o estado em role status', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    const controle = screen.getByRole('switch', { name: NOME_CONTROLE })
    ativarPeloTeclado(controle)
    expect(controle).toHaveAttribute('aria-checked', 'true')
    expect(controle).toHaveTextContent('Ativado')
    expect(screen.getAllByText('Liberada para demonstração')).toHaveLength(4)
    const anuncios = screen.getAllByRole('status').map((regiao) => regiao.textContent ?? '')
    expect(anuncios.some((texto) => texto.includes('Modo de demonstração ativado'))).toBe(true)
    expect(modoGravado()).toMatchObject({ versao: 1, ativo: true, origem: 'plano-de-voo' })
    // Clique de novo: o controle alterna.
    fireEvent.click(controle)
    expect(controle).toHaveAttribute('aria-checked', 'false')
  })

  it('libera o Embarcar das missões disponíveis de N2 Pleno e das Vertentes da N3 Sênior, sem liberar as em preparação', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    for (const missao of [
      'incidente-massivo',
      'sre-cloud-latencia',
      'triagem-engenharia-social',
      'diagnostico-sql-readonly',
    ] as const) {
      expect(within(cartaoDa(missao)).getByRole('link', { name: /Embarcar/ })).toHaveAttribute(
        'href',
        `/cabine/${missao}`,
      )
    }
    for (const missao of ['reset-senha-desbloqueio', 'falha-backup-restore'] as const) {
      const cartao = cartaoDa(missao)
      expect(within(cartao).queryByRole('link', { name: /Embarcar/ })).not.toBeInTheDocument()
      expect(within(cartao).queryByRole('button', { name: /Embarcar/ })).not.toBeInTheDocument()
      expect(within(cartao).getByText('Em preparação')).toBeInTheDocument()
    }
  })

  it('"Concluída" só aparece com registro de voo', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument()
    cleanup()
    const registro = serializarRegistros([registroDeTeste('pasta-rede-inacessivel', 'sessao-1')])
    abrirApp('/plano-de-voo', {
      [CHAVE_CARTAO_EMBARQUE]: CARTAO,
      [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO,
      [CHAVE_REGISTROS_VOO]: registro,
    })
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('Concluída')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).queryByText('Concluída')).not.toBeInTheDocument()
  })

  it('com a chave semeada como ativa a página abre com o controle ativado', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'true')
  })

  it('desativar volta a Bloqueada, grava ativo falso e não apaga a chave', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(within(cartaoDa('incidente-massivo')).getByRole('link', { name: /Embarcar/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: NOME_CONTROLE }))
    expect(within(cartaoDa('incidente-massivo')).getByText('Bloqueada')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).getByRole('button', { name: /Embarcar/ })).toBeDisabled()
    expect(screen.queryByText('Liberada para demonstração')).not.toBeInTheDocument()
    expect(modoGravado()).toMatchObject({ versao: 1, ativo: false })
    expect(window.localStorage.getItem(CHAVE_REGISTROS_VOO)).toBeNull()
  })

  it('valor corrompido na chave do modo abre desativado e não grava nada', () => {
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: '{' })
    expect(screen.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'false')
    expect(window.localStorage.getItem(CHAVE_MODO_DEMONSTRACAO)).toBe('{')
  })

  it('cartão gerado pelo check-in rápido mostra o aviso e o link para o check-in completo', () => {
    const rapido = serializarCartao({ ...CARTAO_DE_TESTE, origem: 'checkin-rapido' })
    abrirApp('/plano-de-voo', { [CHAVE_CARTAO_EMBARQUE]: rapido })
    expect(screen.getByText('Cartão gerado pelo check-in rápido, com respostas padrão.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o check-in completo' })).toHaveAttribute('href', '/check-in')
  })
})

describe('Início: Atalho_Experimentar', () => {
  it('sem cartão leva ao Check-in_Rápido sem gravar cartão nem modo', () => {
    abrirApp('/')
    const atalho = screen.getByRole('button', { name: 'Experimentar um voo agora' })
    expect(atalho).toHaveAccessibleDescription(/Atalho para a banca/)
    fireEvent.click(atalho)
    expect(enderecoAtual()).toBe('/check-in?modo=rapido')
    expect(screen.getByRole('heading', { level: 2, name: 'Check-in rápido' })).toBeInTheDocument()
    expect(window.localStorage.getItem(CHAVE_CARTAO_EMBARQUE)).toBeNull()
    expect(window.localStorage.getItem(CHAVE_MODO_DEMONSTRACAO)).toBeNull()
  })

  it('com cartão ativa o modo, abre a Cabine e deixa o cartão exatamente como estava', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    fireEvent.click(screen.getByRole('button', { name: 'Experimentar um voo agora' }))
    expect(enderecoAtual()).toBe('/cabine/pasta-rede-inacessivel')
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(window.localStorage.getItem(CHAVE_CARTAO_EMBARQUE)).toBe(CARTAO)
    expect(modoGravado()).toMatchObject({ ativo: true, origem: 'atalho-experimentar' })
    expect(posts(chamadas)).toHaveLength(1)
  })
})

describe('Check-in_Rápido', () => {
  it('mostra as três respostas padrão por extenso e a indicação', () => {
    abrirApp('/check-in?modo=rapido')
    expect(screen.getByRole('heading', { level: 1, name: 'Check-in' })).toBeInTheDocument()
    expect(screen.getByText(CHECKIN_RAPIDO.explicacao)).toBeInTheDocument()
    for (const pergunta of ROTEIRO_CHECKIN.perguntas) {
      expect(screen.getByText(pergunta.enunciado)).toBeInTheDocument()
      expect(screen.getByText(rotuloDaResposta(pergunta.id, CHECKIN_RAPIDO.respostas[pergunta.id]) ?? '')).toBeInTheDocument()
    }
    expect(screen.getByText(/Rota indicada: Suporte de TI/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o check-in completo' })).toHaveAttribute('href', '/check-in')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('Confirmar e embarcar grava o cartão rápido, ativa o modo e termina na Cabine sem passar pelo portão', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/')
    fireEvent.click(screen.getByRole('button', { name: 'Experimentar um voo agora' }))
    const enderecos: string[] = []
    for (const metodo of ['pushState', 'replaceState'] as const) {
      const original = window.history[metodo].bind(window.history)
      vi.spyOn(window.history, metodo).mockImplementation((estado, titulo, url) => {
        enderecos.push(String(url))
        original(estado, titulo, url)
      })
    }
    const entradas = window.history.length
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e embarcar' }))
    expect(enderecoAtual()).toBe('/cabine/pasta-rede-inacessivel')
    expect(window.history.length).toBe(entradas)
    expect(enderecos.some((endereco) => endereco.includes('motivo=sem-cartao'))).toBe(false)
    const cartao = JSON.parse(window.localStorage.getItem(CHAVE_CARTAO_EMBARQUE) ?? 'null') as { origem: string; rotaId: string }
    expect(cartao).toMatchObject({ origem: 'checkin-rapido', rotaId: 'suporte-ti' })
    expect(modoGravado()).toMatchObject({ ativo: true, origem: 'atalho-experimentar' })
    expect(window.localStorage.getItem(CHAVE_REGISTROS_VOO)).toBeNull()
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(posts(chamadas)).toHaveLength(1)
    const anuncios = screen.getAllByRole('status').map((regiao) => regiao.textContent ?? '')
    expect(anuncios.some((texto) => texto.includes('Modo de demonstração ativado'))).toBe(true)
  })

  it('com cartão válido não troca o cartão: avisa e oferece o atalho', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/check-in?modo=rapido', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    expect(screen.getByText(/Você já tem cartão de embarque\. Para experimentar um voo sem trocar o cartão/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar e embarcar' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Experimentar um voo agora' }))
    expect(enderecoAtual()).toBe('/cabine/pasta-rede-inacessivel')
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(window.localStorage.getItem(CHAVE_CARTAO_EMBARQUE)).toBe(CARTAO)
  })
})

describe('Brevê, Cabine e barra de contexto com o modo ativo', () => {
  it('o Brevê sem registros mostra o estado vazio e nada é gravado em registros', () => {
    abrirApp('/breve', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByText(/Você ainda não tem voos registrados/)).toBeInTheDocument()
    expect(window.localStorage.getItem(CHAVE_REGISTROS_VOO)).toBeNull()
  })

  it('Cabine de incidente-massivo sem registros cria uma sessão com o modo ativo e nenhuma com o inativo', async () => {
    const ativo = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/cabine/incidente-massivo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(posts(ativo)).toHaveLength(1)
    cleanup()
    vi.restoreAllMocks()
    const inativo = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/cabine/incidente-massivo', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    expect(screen.getByText(/ainda não está liberada/)).toBeInTheDocument()
    await waitFor(() => expect(posts(inativo)).toHaveLength(0))
  })

  it('Cabine de reset-senha-desbloqueio mostra o aviso de preparação e não cria sessão, com o modo ativo e inativo', () => {
    const chamadas = simularApi({ missao: 'reset-senha-desbloqueio' })
    abrirApp('/cabine/reset-senha-desbloqueio', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByText('Este cenário ainda está em preparação no simulador.')).toBeInTheDocument()
    cleanup()
    abrirApp('/cabine/reset-senha-desbloqueio', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    expect(screen.getByText('Este cenário ainda está em preparação no simulador.')).toBeInTheDocument()
    expect(chamadas).toHaveLength(0)
  })

  it('portão do cartão vale com o modo ativo: sem cartão a Cabine vai ao check-in e não cria sessão', () => {
    const chamadas = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/cabine/incidente-massivo', { [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(enderecoAtual()).toBe('/check-in?motivo=sem-cartao')
    expect(posts(chamadas)).toHaveLength(0)
  })

  it.each([
    '/',
    '/check-in',
    '/plano-de-voo',
    '/breve',
    '/hangar',
    '/aulas',
    '/caderno',
    '/comandante',
    '/nao-existe',
  ])('a barra de contexto mostra "Modo de demonstração ativo" em %s', (endereco) => {
    abrirApp(endereco, { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByRole('link', { name: 'Modo de demonstração ativo' })).toHaveAttribute('href', '/plano-de-voo')
  })

  it('a barra de contexto mostra o indicador também na Cabine', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/cabine/pasta-rede-inacessivel', { [CHAVE_CARTAO_EMBARQUE]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Cabine' })
    expect(screen.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeInTheDocument()
  })

  it('o indicador some com o modo inativo', () => {
    abrirApp('/', { [CHAVE_CARTAO_EMBARQUE]: CARTAO })
    expect(screen.queryByRole('link', { name: 'Modo de demonstração ativo' })).not.toBeInTheDocument()
  })
})