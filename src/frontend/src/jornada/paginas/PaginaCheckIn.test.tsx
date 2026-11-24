import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, analisarCartao, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { TEXTO_PONTO_DE_PARTIDA, TEXTO_REGRA_INDICACAO } from '../catalogos/catalogoVocacional'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { PaginaCheckIn } from './PaginaCheckIn'

const ROTA_NORMAL = { pagina: 'check-in', motivo: null, rapido: false } as const
const ROTA_SEM_CARTAO = { pagina: 'check-in', motivo: 'sem-cartao', rapido: false } as const

function abrir(rota: typeof ROTA_NORMAL | typeof ROTA_SEM_CARTAO = ROTA_NORMAL, inicial: Record<string, string> = {}) {
  const armazenamento = criarArmazenamentoFalso(inicial)
  render(
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <PaginaCheckIn rota={rota} />
    </ProvedorArmazenamentoJornada>,
  )
  return armazenamento
}

/** Alcança o controle como o teclado faria: precisa estar na ordem de tabulação, recebe o foco e é ativado. */
function ativarPeloTeclado(elemento: HTMLElement) {
  expect(elemento.tabIndex).toBeGreaterThanOrEqual(0)
  expect(elemento).not.toBeDisabled()
  elemento.focus()
  expect(elemento).toHaveFocus()
  fireEvent.click(elemento)
}

function responder(rotulo: string, botao: RegExp) {
  ativarPeloTeclado(screen.getByRole('radio', { name: rotulo }))
  ativarPeloTeclado(screen.getByRole('button', { name: botao }))
}

function checkInDeSuporte() {
  responder('Ajudar pessoas com tecnologia', /Continuar/)
  responder('Pergunto o que aparece na tela e desde quando', /Continuar/)
  responder('Indo direto para o chamado', /Ver indicação/)
}

beforeEach(() => {
  window.history.replaceState(null, '', '/check-in')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Diagnóstico', () => {
  it('diagnóstico completo só com teclado: indicação, confirmação, cartão gravado e link para o Plano de Carreira', () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    const armazenamento = abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeInTheDocument()
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument()

    responder('Ajudar pessoas com tecnologia', /Continuar/)
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument()
    // O foco acompanha a pergunta nova.
    expect(document.activeElement?.textContent).toMatch(/pasta da equipe/)

    responder('Pergunto o que aparece na tela e desde quando', /Continuar/)
    responder('Indo direto para o chamado', /Ver indicação/)

    expect(screen.getByRole('heading', { level: 2, name: 'Rota indicada: Suporte de TI' })).toHaveFocus()
    expect(screen.getByText(TEXTO_PONTO_DE_PARTIDA)).toBeInTheDocument()
    expect(screen.getByText(TEXTO_REGRA_INDICACAO)).toBeInTheDocument()
    expect(armazenamento.gravacoes).toHaveLength(0)

    ativarPeloTeclado(screen.getByRole('button', { name: /Confirmar e gerar o cartão de perfil/ }))

    expect(screen.getByRole('heading', { level: 2, name: 'Cartão de Perfil' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toHaveAttribute('href', '/plano-de-voo')
    expect(armazenamento.gravacoes.map((g) => g.chave)).toEqual([CHAVE_CARTAO_EMBARQUE])
    const gravado = analisarCartao(armazenamento.dados.get(CHAVE_CARTAO_EMBARQUE) ?? null)
    expect(gravado).toMatchObject({ rotaId: 'suporte-ti', rotaIndicadaId: 'suporte-ti', origem: 'checkin' })
    expect(gravado?.respostas).toEqual({
      interesse: 'ajudar-pessoas',
      situacao: 'perguntar-o-que-aparece',
      ritmo: 'praticar',
    })
    expect(espiao).not.toHaveBeenCalled()
  })

  it('não avança sem escolher e mantém a resposta ao voltar', () => {
    abrir()
    const continuar = screen.getByRole('button', { name: /Continuar/ })
    expect(continuar).toHaveAttribute('aria-disabled', 'true')
    expect(continuar).toHaveAccessibleDescription('Escolha uma opção para continuar.')
    fireEvent.click(continuar)
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument()

    responder('Construir programas', /Continuar/)
    ativarPeloTeclado(screen.getByRole('button', { name: /Voltar/ }))
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Construir programas' })).toBeChecked()
    expect(screen.getByRole('button', { name: /Continuar/ })).toHaveAttribute('aria-disabled', 'false')
  })

  it('refazer o diagnóstico substitui o cartão e mantém os registros', () => {
    const registros = serializarRegistros([registroDeTeste('pasta-rede-inacessivel', 'sessao-1')])
    const armazenamento = abrir(ROTA_NORMAL, {
      [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE),
      [CHAVE_REGISTROS_VOO]: registros,
    })
    expect(screen.getByRole('status')).toHaveTextContent(/Você já tem um cartão de perfil/)

    // Rota indicada indisponível: o texto diz o status e oferece Suporte de TI.
    responder('Construir programas', /Continuar/)
    responder('Penso em automatizar a verificação', /Continuar/)
    responder('Estudando um pouco antes', /Ver indicação/)
    expect(screen.getByRole('heading', { level: 2, name: 'Rota indicada: Desenvolvimento de software' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/está com o status futuro/)
    ativarPeloTeclado(screen.getByRole('button', { name: 'Embarcar em Suporte de TI' }))

    const novo = analisarCartao(armazenamento.dados.get(CHAVE_CARTAO_EMBARQUE) ?? null)
    expect(novo).toMatchObject({ rotaIndicadaId: 'desenvolvimento', rotaId: 'suporte-ti', primeiraEscalaId: 'help-desk-n1' })
    expect(novo?.respostas.ritmo).toBe('estudar')
    expect(armazenamento.dados.get(CHAVE_REGISTROS_VOO)).toBe(registros)
    expect(armazenamento.gravacoes.every((g) => g.chave === CHAVE_CARTAO_EMBARQUE)).toBe(true)
  })

  it('motivo sem-cartao mostra o aviso em role status e some depois do cartão gravado', () => {
    abrir(ROTA_SEM_CARTAO)
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveAttribute('aria-live', 'polite')
    expect(aviso).toHaveTextContent('Para abrir o Plano de Carreira, faça primeiro o diagnóstico.')
    ativarPeloTeclado(screen.getByRole('button', { name: 'Ir para a primeira pergunta' }))
    expect(document.activeElement?.tagName).toBe('LEGEND')

    checkInDeSuporte()
    ativarPeloTeclado(screen.getByRole('button', { name: /Confirmar e gerar o cartão de perfil/ }))
    expect(screen.queryByText(/faça primeiro o diagnóstico/)).not.toBeInTheDocument()
  })

  it('com cartão, o motivo sem-cartao não aparece', () => {
    abrir(ROTA_SEM_CARTAO, { [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE) })
    expect(screen.queryByText(/faça primeiro o diagnóstico/)).not.toBeInTheDocument()
  })

  it('avisa quando o armazenamento recusa a gravação, sem perder o cartão em memória', () => {
    const armazenamento = criarArmazenamentoFalso({}, { falharGravacao: true })
    render(
      <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
        <PaginaCheckIn rota={ROTA_NORMAL} />
      </ProvedorArmazenamentoJornada>,
    )
    checkInDeSuporte()
    ativarPeloTeclado(screen.getByRole('button', { name: /Confirmar e gerar o cartão de perfil/ }))
    expect(screen.getByText(/Não foi possível guardar neste navegador/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Plano de Carreira/ })).toBeInTheDocument()
  })

  it('ao concluir o diagnóstico mostra configuração Treino vs Missão, domínios com peso e as 5 regras', () => {
    abrir()
    checkInDeSuporte()
    ativarPeloTeclado(screen.getByRole('button', { name: /Confirmar e gerar o cartão de perfil/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Configuração da missão' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modo Treino/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modo Missão/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Pronto para começar?' })).toBeInTheDocument()
  })
})
