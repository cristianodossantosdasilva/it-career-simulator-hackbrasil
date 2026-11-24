import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_PERFIL, serializarCartao } from '../armazenamento/cartaoPerfil'
import { CHAVE_REGISTROS_MISSAO, serializarRegistros } from '../armazenamento/registrosMissao'
import { AVISO_CERTIFICACOES } from '../catalogos/catalogoCertificacoes'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaPlanoDeCarreira } from './PaginaPlanoDeCarreira'

function abrir(registrados: readonly IdMissao[] = []) {
  const registros = registrados.map((missao, indice) => registroDeTeste(missao, `sessao-${indice}`))
  const armazenamento = criarArmazenamentoFalso({
    [CHAVE_CARTAO_PERFIL]: serializarCartao(CARTAO_DE_TESTE),
    ...(registros.length > 0 ? { [CHAVE_REGISTROS_MISSAO]: serializarRegistros(registros) } : {}),
  })
  render(
    <ProvedorJornada armazenamento={armazenamento}>
      <PaginaPlanoDeCarreira />
    </ProvedorJornada>,
  )
}

function cartaoDa(missao: IdMissao): HTMLElement {
  const titulo = screen.getByRole('heading', { name: textosDaMissao(missao).titulo })
  const cartao = titulo.closest('li')
  if (!cartao) throw new Error(`sem cartão para ${missao}`)
  return cartao
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/plano-de-carreira')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Plano de Carreira', () => {
  it('tem um único h1 e as etapas na ordem da rota, cada uma com h2', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Plano de Carreira' })).toBeInTheDocument()
    const nomes = ['Help Desk N1', 'Service Desk N1 Jr', 'N2 Pleno', 'N3 Sênior']
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((titulo) => titulo.textContent)
    const posicoes = nomes.map((nome) => titulos.indexOf(nome))
    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('etapa bloqueada mostra o ícone, a etapa necessária e o Iniciar desabilitado', () => {
    abrir()
    const cartao = cartaoDa('incidente-massivo')
    expect(within(cartao).getByText('Bloqueada')).toBeInTheDocument()
    const iniciar = within(cartao).getByRole('button', { name: /Iniciar/ })
    expect(iniciar).toBeDisabled()
    expect(within(cartao).queryByRole('link', { name: /Iniciar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Para liberar esta etapa, conclua as missões disponíveis de Service Desk N1 Jr\./)).toBeInTheDocument()
  })

  it('a etapa seguinte libera depois dos registros da anterior', () => {
    abrir(['pasta-rede-inacessivel'])
    const cartao = cartaoDa('incidente-massivo')
    expect(within(cartao).queryByRole('button', { name: /Iniciar/ })).not.toBeInTheDocument()
    expect(within(cartao).getByRole('link', { name: /Iniciar/ })).toHaveAttribute('href', '/mesa-de-trabalho/incidente-massivo')
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('Concluída')).toBeInTheDocument()
  })

  it('Service Desk N1 Jr abre bloqueada e libera depois do registro da Help Desk N1, sem texto de preparação', () => {
    abrir()
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('Bloqueada')).toBeInTheDocument()
    expect(screen.queryByText(/estão em preparação/)).not.toBeInTheDocument()
    expect(within(cartaoDa('reset-senha-desbloqueio')).getByRole('link', { name: /Iniciar/ })).toHaveAttribute(
      'href',
      '/mesa-de-trabalho/reset-senha-desbloqueio',
    )
    cleanup()
    abrir(['reset-senha-desbloqueio'])
    expect(within(cartaoDa('reset-senha-desbloqueio')).getByText('Concluída')).toBeInTheDocument()
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByRole('link', { name: /Iniciar/ })).toBeInTheDocument()
  })

  it('mostra as três Vertentes da N3 Sênior como grupos, na ordem N3-A, N3-B, N3-C', () => {
    abrir()
    const nomes = ['N3-A Redes e Nuvem', 'N3-B Data Center e Backup', 'N3-C Segurança e Dados']
    const grupos = nomes.map((nome) => screen.getByRole('group', { name: nome }))
    for (let i = 1; i < grupos.length; i += 1) {
      expect(grupos[i - 1].compareDocumentPosition(grupos[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(within(grupos[2]).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('heading', { level: 3, name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
  })

  it.each(['reset-senha-desbloqueio', 'falha-backup-restore'] as const)(
    '%s aparece disponível, com Iniciar e sem aviso de preparação',
    (missao) => {
      abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel', 'incidente-massivo'])
      const cartao = cartaoDa(missao)
      expect(within(cartao).queryByText('Em preparação')).not.toBeInTheDocument()
      expect(within(cartao).queryByText('Este cenário ainda não está disponível no simulador.')).not.toBeInTheDocument()
      expect(within(cartao).getByRole('link', { name: /Iniciar/ })).toHaveAttribute('href', `/mesa-de-trabalho/${missao}`)
    },
  )

  it('mostra só a contagem de Causas, sem os códigos das Causas', () => {
    abrir()
    expect(within(cartaoDa('reset-senha-desbloqueio')).getByText('3 causas disponíveis')).toBeInTheDocument()
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('4 causas disponíveis')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).getByText('3 causas disponíveis')).toBeInTheDocument()
    expect(within(cartaoDa('falha-backup-restore')).getByText('2 causas disponíveis')).toBeInTheDocument()
    const texto = document.body.textContent ?? ''
    expect(texto).not.toMatch(/\bC4\b/)
    expect(texto).not.toContain('EMAIL_PROVEDOR')
    expect(texto).not.toContain('DOMINIO_SUSPENSO')
  })

  it('o Iniciar leva à Mesa de Trabalho sem causa nem semente', () => {
    abrir(['reset-senha-desbloqueio', 'pasta-rede-inacessivel', 'incidente-massivo'])
    for (const missao of ['reset-senha-desbloqueio', 'pasta-rede-inacessivel', 'incidente-massivo', 'sre-cloud-latencia'] as const) {
      const href = within(cartaoDa(missao)).getByRole('link', { name: /Iniciar/ }).getAttribute('href')
      expect(href).toBe(`/mesa-de-trabalho/${missao}`)
      expect(href).not.toMatch(/causa|semente/)
    }
  })

  it('as opções avançadas só oferecem links de etapas liberadas e pedem uma semente válida', () => {
    abrir()
    const semRegistro = screen.getByText('Opções avançadas para teste').closest('details') as HTMLElement
    expect(within(semRegistro).queryByRole('link', { name: /Demo rápida/ })).not.toBeInTheDocument()
    fireEvent.change(within(semRegistro).getByLabelText('Semente (número opcional)'), { target: { value: '7' } })
    expect(within(semRegistro).getAllByRole('link', { name: /, semente 7/ }).map((link) => link.getAttribute('href'))).toEqual([
      '/mesa-de-trabalho/reset-senha-desbloqueio?semente=7&nova=1',
    ])
    cleanup()
    abrir(['reset-senha-desbloqueio'])
    const opcoes = screen.getByText('Opções avançadas para teste').closest('details') as HTMLElement
    const demo = within(opcoes).getByRole('link', { name: /Demo rápida/ })
    expect(demo.getAttribute('href')).toMatch(/^\/mesa-de-trabalho\/pasta-rede-inacessivel\?semente=42&causa=C1&nova=1$/)
    expect(within(opcoes).queryAllByRole('link', { name: /, semente \d/ })).toHaveLength(0)
    fireEvent.change(within(opcoes).getByLabelText('Semente (número opcional)'), { target: { value: '7' } })
    const links = within(opcoes).getAllByRole('link', { name: /, semente 7/ })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/mesa-de-trabalho/reset-senha-desbloqueio?semente=7&nova=1',
      '/mesa-de-trabalho/pasta-rede-inacessivel?semente=7&nova=1',
    ])
  })

  it('o convite ao mentor não tem campo nem faz requisição', () => {
    const rede = vi.spyOn(globalThis, 'fetch')
    abrir()
    const convite = screen.getByRole('heading', { name: 'Seja mentor do projeto' }).closest('section') as HTMLElement
    expect(within(convite).queryByRole('textbox')).not.toBeInTheDocument()
    expect(convite.querySelector('form, input, textarea, select, button')).toBeNull()
    expect(rede).not.toHaveBeenCalled()
  })

  it('mostra o Mentor no papel Instrutor', () => {
    abrir()
    expect(screen.getByRole('heading', { name: /Mentor, papel Instrutor/ })).toBeInTheDocument()
  })
  it('mostra as certificações de cada etapa com o status em texto e o aviso fixo', () => {
    abrir()
    const etapa = (nome: string) => screen.getByRole('heading', { level: 2, name: nome }).closest('section') as HTMLElement
    const certificacoesDe = (nome: string) =>
      within(etapa(nome)).getByRole('group', { name: 'Certificações de referência' })

    const helpDesk = certificacoesDe('Help Desk N1')
    expect(within(helpDesk).getByRole('heading', { level: 3, name: 'Certificações de referência' })).toBeInTheDocument()
    expect(within(helpDesk).getByText(AVISO_CERTIFICACOES)).toBeInTheDocument()
    expect(within(within(helpDesk).getByText('CompTIA A+').closest('li') as HTMLElement).getByText('Disponível')).toBeInTheDocument()

    const serviceDesk = certificacoesDe('Service Desk N1 Jr')
    expect(within(serviceDesk).getAllByRole('listitem')).toHaveLength(2)
    expect(within(within(serviceDesk).getByText('CompTIA Network+').closest('li') as HTMLElement).getByText('Em preparação')).toBeInTheDocument()
    expect(within(certificacoesDe('N2 Pleno')).getByText('ITIL 4 Foundation')).toBeInTheDocument()

    const n3 = certificacoesDe('N3 Sênior')
    expect(within(n3).getByText('CompTIA Security+')).toBeInTheDocument()
    expect(within(within(n3).getByText('CompTIA Security+').closest('li') as HTMLElement).getByText('Futuro')).toBeInTheDocument()
    expect(screen.getAllByText(AVISO_CERTIFICACOES)).toHaveLength(4)
  })

  it('permite alternar entre Modo Treino e Modo Missão, filtrar domínios com peso e exibe as 5 regras', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 2, name: 'Configuração da missão' })).toBeInTheDocument()
    const grupoModo = screen.getByRole('group', { name: 'Modo de operação' })
    const treino = within(grupoModo).getByRole('button', { name: /Modo Treino/ })
    const missao = within(grupoModo).getByRole('button', { name: /Modo Missão/ })
    expect(treino).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(missao)
    expect(missao).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('itfs_modo_mesa')).toBe('missao')
    expect(screen.getByRole('button', { name: 'Iniciar em Modo Missão' })).toBeInTheDocument()

    const regras = screen.getByRole('region', { name: 'Pronto para começar?' })
    expect(within(regras).getAllByRole('listitem')).toHaveLength(5)

    const chipHelpDesk = screen.getByRole('button', { name: /Help Desk N1/ })
    expect(within(chipHelpDesk).getByText('15%')).toBeInTheDocument()
    expect(within(chipHelpDesk).getByText('Recomendado')).toBeInTheDocument()

    fireEvent.click(chipHelpDesk)
    expect(screen.queryByRole('heading', { level: 2, name: 'Help Desk N1' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar todos' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Help Desk N1' })).toBeInTheDocument()
  })
})
