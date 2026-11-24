import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'
import { type ChamadaDeTeste, simularApi } from '../../testes/apiDeTeste'
import { CARTAO_DE_TESTE, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../armazenamento/cartaoPerfil'
import { CHAVE_MODO_DEMONSTRACAO, serializarModoDemonstracao } from '../armazenamento/modoDemonstracao'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../armazenamento/registrosMissao'
import { DIAGNOSTICO_RAPIDO, ROTEIRO_DIAGNOSTICO, rotuloDaResposta } from '../catalogos/catalogoVocacional'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { reiniciarLocalAtual } from '../navegacao/navegador'

const NOME_CONTROLE = 'Liberar todas as etapas para demonstração'
const MODO_ATIVO = serializarModoDemonstracao({
  versao: 1,
  ativo: true,
  origem: 'plano-de-carreira',
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

describe('Plano de Carreira: controle do modo de demonstração', () => {
  it('o switch começa desativado, com nome igual ao rótulo e explicação ligada por aria-describedby', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    const controle = screen.getByRole('switch', { name: NOME_CONTROLE })
    expect(controle).toHaveAttribute('aria-checked', 'false')
    expect(controle).toHaveTextContent('Desativado')
    expect(controle).toHaveAccessibleDescription(/Atalho para conhecer todas as etapas/)
    expect(controle).toHaveAccessibleDescription(/não conta como missão concluída/)
    expect(screen.getByRole('heading', { level: 2, name: 'Modo de demonstração' })).toBeInTheDocument()
    expect(screen.queryByText('Liberada para demonstração')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Modo de demonstração ativo' })).not.toBeInTheDocument()
  })

  it('ativa por clique e por teclado, mostra os quatro selos e anuncia o estado em role status', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    const controle = screen.getByRole('switch', { name: NOME_CONTROLE })
    ativarPeloTeclado(controle)
    expect(controle).toHaveAttribute('aria-checked', 'true')
    expect(controle).toHaveTextContent('Ativado')
    expect(screen.getAllByText('Liberada para demonstração')).toHaveLength(4)
    const anuncios = screen.getAllByRole('status').map((regiao) => regiao.textContent ?? '')
    expect(anuncios.some((texto) => texto.includes('Modo de demonstração ativado'))).toBe(true)
    expect(modoGravado()).toMatchObject({ versao: 1, ativo: true, origem: 'plano-de-carreira' })
    // Clique de novo: o controle alterna.
    fireEvent.click(controle)
    expect(controle).toHaveAttribute('aria-checked', 'false')
  })

  it('libera o Iniciar das missões disponíveis de Service Desk N1 Jr, N2 Pleno e das Vertentes da N3 Sênior', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    for (const missao of [
      'reset-senha-desbloqueio',
      'pasta-rede-inacessivel',
      'incidente-massivo',
      'sre-cloud-latencia',
      'falha-backup-restore',
      'triagem-engenharia-social',
      'diagnostico-sql-readonly',
    ] as const) {
      expect(within(cartaoDa(missao)).getByRole('link', { name: /Iniciar/ })).toHaveAttribute(
        'href',
        `/mesa-de-trabalho/${missao}`,
      )
      expect(within(cartaoDa(missao)).queryByText('Em preparação')).not.toBeInTheDocument()
    }
  })
  it('"Concluída" só aparece com registro de missão', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument()
    cleanup()
    const registro = serializarRegistros([registroDeTeste('pasta-rede-inacessivel', 'sessao-1')])
    abrirApp('/plano-de-carreira', {
      [CHAVE_CARTAO_PERFIL]: CARTAO,
      [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO,
      [CHAVE_REGISTROS_MISSAO]: registro,
    })
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('Concluída')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).queryByText('Concluída')).not.toBeInTheDocument()
  })

  it('com a chave semeada como ativa a página abre com o controle ativado', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'true')
  })

  it('desativar volta a Bloqueada, grava ativo falso e não apaga a chave', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(within(cartaoDa('incidente-massivo')).getByRole('link', { name: /Iniciar/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: NOME_CONTROLE }))
    expect(within(cartaoDa('incidente-massivo')).getByText('Bloqueada')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).getByRole('button', { name: /Iniciar/ })).toBeDisabled()
    expect(screen.queryByText('Liberada para demonstração')).not.toBeInTheDocument()
    expect(modoGravado()).toMatchObject({ versao: 1, ativo: false })
    expect(window.localStorage.getItem(CHAVE_REGISTROS_MISSAO)).toBeNull()
  })

  it('valor corrompido na chave do modo abre desativado e não grava nada', () => {
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: '{' })
    expect(screen.getByRole('switch', { name: NOME_CONTROLE })).toHaveAttribute('aria-checked', 'false')
    expect(window.localStorage.getItem(CHAVE_MODO_DEMONSTRACAO)).toBe('{')
  })

  it('cartão gerado pelo diagnóstico rápido mostra o aviso e o link para o diagnóstico completo', () => {
    const rapido = serializarCartao({ ...CARTAO_DE_TESTE, origem: 'diagnostico-rapido' })
    abrirApp('/plano-de-carreira', { [CHAVE_CARTAO_PERFIL]: rapido })
    expect(screen.getByText('Cartão gerado pelo diagnóstico rápido, com respostas padrão.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o diagnóstico completo' })).toHaveAttribute('href', '/diagnostico')
  })
})

describe('Início: Atalho_Experimentar', () => {
  it('sem cartão leva ao Diagnóstico_Rápido sem gravar cartão nem modo', () => {
    abrirApp('/')
    const atalho = screen.getByRole('button', { name: 'Atender meu primeiro chamado' })
    expect(atalho).toHaveAccessibleDescription(/diagnóstico rápido, com respostas padrão/)
    fireEvent.click(atalho)
    expect(enderecoAtual()).toBe('/diagnostico?modo=rapido')
    expect(screen.getByRole('heading', { level: 2, name: 'Diagnóstico rápido' })).toBeInTheDocument()
    expect(window.localStorage.getItem(CHAVE_CARTAO_PERFIL)).toBeNull()
    expect(window.localStorage.getItem(CHAVE_MODO_DEMONSTRACAO)).toBeNull()
  })

  it('com cartão ativa o modo, abre a Mesa de Trabalho e deixa o cartão exatamente como estava', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    fireEvent.click(screen.getByRole('button', { name: 'Atender meu primeiro chamado' }))
    expect(enderecoAtual()).toBe('/mesa-de-trabalho/pasta-rede-inacessivel')
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(window.localStorage.getItem(CHAVE_CARTAO_PERFIL)).toBe(CARTAO)
    expect(modoGravado()).toMatchObject({ ativo: true, origem: 'atalho-experimentar' })
    expect(posts(chamadas)).toHaveLength(1)
  })
})

describe('Diagnóstico_Rápido', () => {
  it('mostra as três respostas padrão por extenso e a indicação', () => {
    abrirApp('/diagnostico?modo=rapido')
    expect(screen.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeInTheDocument()
    expect(screen.getByText(DIAGNOSTICO_RAPIDO.explicacao)).toBeInTheDocument()
    for (const pergunta of ROTEIRO_DIAGNOSTICO.perguntas) {
      expect(screen.getByText(pergunta.enunciado)).toBeInTheDocument()
      expect(screen.getByText(rotuloDaResposta(pergunta.id, DIAGNOSTICO_RAPIDO.respostas[pergunta.id]) ?? '')).toBeInTheDocument()
    }
    expect(screen.getByText(/Rota indicada: Suporte de TI/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o diagnóstico completo' })).toHaveAttribute('href', '/diagnostico')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('Confirmar e iniciar grava o cartão rápido, ativa o modo e termina na Mesa de Trabalho sem passar pelo portão', async () => {
    const chamadas = simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/')
    fireEvent.click(screen.getByRole('button', { name: 'Atender meu primeiro chamado' }))
    const enderecos: string[] = []
    for (const metodo of ['pushState', 'replaceState'] as const) {
      const original = window.history[metodo].bind(window.history)
      vi.spyOn(window.history, metodo).mockImplementation((estado, titulo, url) => {
        enderecos.push(String(url))
        original(estado, titulo, url)
      })
    }
    const entradas = window.history.length
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e iniciar' }))
    expect(enderecoAtual()).toBe('/mesa-de-trabalho/pasta-rede-inacessivel')
    expect(window.history.length).toBe(entradas)
    expect(enderecos.some((endereco) => endereco.includes('motivo=sem-cartao'))).toBe(false)
    const cartao = JSON.parse(window.localStorage.getItem(CHAVE_CARTAO_PERFIL) ?? 'null') as { origem: string; rotaId: string }
    expect(cartao).toMatchObject({ origem: 'diagnostico-rapido', rotaId: 'suporte-ti' })
    expect(modoGravado()).toMatchObject({ ativo: true, origem: 'atalho-experimentar' })
    expect(window.localStorage.getItem(CHAVE_REGISTROS_MISSAO)).toBeNull()
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(posts(chamadas)).toHaveLength(1)
    const anuncios = screen.getAllByRole('status').map((regiao) => regiao.textContent ?? '')
    expect(anuncios.some((texto) => texto.includes('Modo de demonstração ativado'))).toBe(true)
  })

  it('com cartão válido não troca o cartão: avisa e oferece o atalho', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/diagnostico?modo=rapido', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    expect(screen.getByText(/Você já tem cartão de perfil\. Para experimentar uma missão sem trocar o cartão/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar e iniciar' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Atender meu primeiro chamado' }))
    expect(enderecoAtual()).toBe('/mesa-de-trabalho/pasta-rede-inacessivel')
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(window.localStorage.getItem(CHAVE_CARTAO_PERFIL)).toBe(CARTAO)
  })
})

describe('Portfólio, Mesa de Trabalho e barra de contexto com o modo ativo', () => {
  it('o Portfólio sem registros mostra o estado vazio e nada é gravado em registros', () => {
    abrirApp('/portfolio', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByText(/Você ainda não tem missões registradas/)).toBeInTheDocument()
    expect(window.localStorage.getItem(CHAVE_REGISTROS_MISSAO)).toBeNull()
  })

  it('Mesa de Trabalho de incidente-massivo sem registros cria uma sessão com o modo ativo e nenhuma com o inativo', async () => {
    const ativo = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/mesa-de-trabalho/incidente-massivo', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(posts(ativo)).toHaveLength(1)
    cleanup()
    vi.restoreAllMocks()
    const inativo = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/mesa-de-trabalho/incidente-massivo', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    expect(screen.getByText(/ainda não está liberada/)).toBeInTheDocument()
    await waitFor(() => expect(posts(inativo)).toHaveLength(0))
  })

  it('Mesa de Trabalho de reset-senha-desbloqueio, da Help Desk N1, cria uma sessão com o modo ativo e com o inativo', async () => {
    const ativo = simularApi({ missao: 'reset-senha-desbloqueio' })
    abrirApp('/mesa-de-trabalho/reset-senha-desbloqueio', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(posts(ativo)).toHaveLength(1)
    cleanup()
    vi.restoreAllMocks()
    const inativo = simularApi({ missao: 'reset-senha-desbloqueio' })
    abrirApp('/mesa-de-trabalho/reset-senha-desbloqueio', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(posts(inativo)).toHaveLength(1)
  })
  it('portão do cartão vale com o modo ativo: sem cartão a Mesa de Trabalho vai ao diagnóstico e não cria sessão', () => {
    const chamadas = simularApi({ missao: 'incidente-massivo' })
    abrirApp('/mesa-de-trabalho/incidente-massivo', { [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(enderecoAtual()).toBe('/diagnostico?motivo=sem-cartao')
    expect(posts(chamadas)).toHaveLength(0)
  })

  it.each([
    '/',
    '/diagnostico',
    '/plano-de-carreira',
    '/portfolio',
    '/catalogo',
    '/aulas',
    '/caderno',
    '/mentor',
    '/nao-existe',
  ])('a barra de contexto mostra "Modo de demonstração ativo" em %s', (endereco) => {
    abrirApp(endereco, { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    expect(screen.getByRole('link', { name: 'Modo de demonstração ativo' })).toHaveAttribute('href', '/plano-de-carreira')
  })

  it('a barra de contexto mostra o indicador também na Mesa de Trabalho', async () => {
    simularApi({ missao: 'pasta-rede-inacessivel' })
    abrirApp('/mesa-de-trabalho/pasta-rede-inacessivel', { [CHAVE_CARTAO_PERFIL]: CARTAO, [CHAVE_MODO_DEMONSTRACAO]: MODO_ATIVO })
    await screen.findByRole('navigation', { name: 'Aplicativos da Mesa de Trabalho' })
    expect(screen.getByRole('link', { name: 'Modo de demonstração ativo' })).toBeInTheDocument()
  })

  it('o indicador some com o modo inativo', () => {
    abrirApp('/', { [CHAVE_CARTAO_PERFIL]: CARTAO })
    expect(screen.queryByRole('link', { name: 'Modo de demonstração ativo' })).not.toBeInTheDocument()
  })
})