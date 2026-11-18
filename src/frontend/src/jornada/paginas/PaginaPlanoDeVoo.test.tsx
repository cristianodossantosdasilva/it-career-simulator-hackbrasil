import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE, criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { CHAVE_CARTAO_EMBARQUE, serializarCartao } from '../armazenamento/cartaoEmbarque'
import { CHAVE_REGISTROS_VOO, serializarRegistros } from '../armazenamento/registrosVoo'
import { AVISO_CERTIFICACOES } from '../catalogos/catalogoCertificacoes'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { ProvedorJornada } from '../ProvedorJornada'
import { PaginaPlanoDeVoo } from './PaginaPlanoDeVoo'

function abrir(registrados: readonly IdMissao[] = []) {
  const registros = registrados.map((missao, indice) => registroDeTeste(missao, `sessao-${indice}`))
  const armazenamento = criarArmazenamentoFalso({
    [CHAVE_CARTAO_EMBARQUE]: serializarCartao(CARTAO_DE_TESTE),
    ...(registros.length > 0 ? { [CHAVE_REGISTROS_VOO]: serializarRegistros(registros) } : {}),
  })
  render(
    <ProvedorJornada armazenamento={armazenamento}>
      <PaginaPlanoDeVoo />
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
  window.history.replaceState(null, '', '/plano-de-voo')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Página Plano de voo', () => {
  it('tem um único h1 e as escalas na ordem da rota, cada uma com h2', () => {
    abrir()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Plano de voo' })).toBeInTheDocument()
    const nomes = ['Help Desk N1', 'Service Desk N1 Jr', 'N2 Pleno', 'N3 Sênior']
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((titulo) => titulo.textContent)
    const posicoes = nomes.map((nome) => titulos.indexOf(nome))
    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('escala bloqueada mostra o ícone, a escala necessária e o Embarcar desabilitado', () => {
    abrir()
    const cartao = cartaoDa('incidente-massivo')
    expect(within(cartao).getByText('Bloqueada')).toBeInTheDocument()
    const embarcar = within(cartao).getByRole('button', { name: /Embarcar/ })
    expect(embarcar).toBeDisabled()
    expect(within(cartao).queryByRole('link', { name: /Embarcar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Para liberar esta escala, conclua as missões disponíveis de Service Desk N1 Jr\./)).toBeInTheDocument()
  })

  it('a escala seguinte libera depois dos registros da anterior', () => {
    abrir(['pasta-rede-inacessivel'])
    const cartao = cartaoDa('incidente-massivo')
    expect(within(cartao).queryByRole('button', { name: /Embarcar/ })).not.toBeInTheDocument()
    expect(within(cartao).getByRole('link', { name: /Embarcar/ })).toHaveAttribute('href', '/cabine/incidente-massivo')
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('Concluída')).toBeInTheDocument()
  })

  it('libera Service Desk N1 Jr com o texto de liberação por preparação', () => {
    abrir()
    expect(screen.getByText('Liberada porque as missões de Help Desk N1 estão em preparação.')).toBeInTheDocument()
    expect(screen.getByText('As missões desta escala estão em preparação no simulador.')).toBeInTheDocument()
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByRole('link', { name: /Embarcar/ })).toBeInTheDocument()
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
    '%s aparece em preparação, com o aviso honesto e sem Embarcar',
    (missao) => {
      abrir(['pasta-rede-inacessivel', 'incidente-massivo'])
      const cartao = cartaoDa(missao)
      expect(within(cartao).getAllByText('Em preparação').length).toBeGreaterThan(0)
      expect(within(cartao).getByText('Este cenário ainda não está disponível no simulador.')).toBeInTheDocument()
      expect(within(cartao).queryByRole('link', { name: /Embarcar/ })).not.toBeInTheDocument()
      expect(within(cartao).queryByRole('button', { name: /Embarcar/ })).not.toBeInTheDocument()
    },
  )

  it('mostra só a contagem de Causas, sem os nomes das Causas em preparação', () => {
    abrir()
    expect(within(cartaoDa('pasta-rede-inacessivel')).getByText('3 causas disponíveis e 1 em preparação')).toBeInTheDocument()
    expect(within(cartaoDa('incidente-massivo')).getByText('1 causa disponível e 2 em preparação')).toBeInTheDocument()
    const texto = document.body.textContent ?? ''
    expect(texto).not.toMatch(/\bC4\b/)
    expect(texto).not.toContain('EMAIL_PROVEDOR')
    expect(texto).not.toContain('DOMINIO_SUSPENSO')
  })

  it('o Embarcar leva à Cabine sem causa nem semente', () => {
    abrir(['pasta-rede-inacessivel', 'incidente-massivo'])
    for (const missao of ['pasta-rede-inacessivel', 'incidente-massivo', 'sre-cloud-latencia'] as const) {
      const href = within(cartaoDa(missao)).getByRole('link', { name: /Embarcar/ }).getAttribute('href')
      expect(href).toBe(`/cabine/${missao}`)
      expect(href).not.toMatch(/causa|semente/)
    }
  })

  it('as opções avançadas só oferecem links de escalas liberadas e pedem uma semente válida', () => {
    abrir()
    const opcoes = screen.getByText('Opções avançadas para teste').closest('details') as HTMLElement
    const demo = within(opcoes).getByRole('link', { name: /Demo rápida/ })
    expect(demo.getAttribute('href')).toMatch(/^\/cabine\/pasta-rede-inacessivel\?semente=42&causa=C1&nova=1$/)
    expect(within(opcoes).queryAllByRole('link', { name: /, semente \d/ })).toHaveLength(0)
    fireEvent.change(within(opcoes).getByLabelText('Semente (número opcional)'), { target: { value: '7' } })
    const links = within(opcoes).getAllByRole('link', { name: /, semente 7/ })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/cabine/pasta-rede-inacessivel?semente=7&nova=1'])
  })

  it('o convite ao copiloto não tem campo nem faz requisição', () => {
    const rede = vi.spyOn(globalThis, 'fetch')
    abrir()
    const convite = screen.getByRole('heading', { name: 'Seja copiloto do projeto' }).closest('section') as HTMLElement
    expect(within(convite).queryByRole('textbox')).not.toBeInTheDocument()
    expect(convite.querySelector('form, input, textarea, select, button')).toBeNull()
    expect(rede).not.toHaveBeenCalled()
  })

  it('mostra o Comandante no papel Instrutor', () => {
    abrir()
    expect(screen.getByRole('heading', { name: /Comandante, papel Instrutor/ })).toBeInTheDocument()
  })
  it('mostra as certificações de cada escala com o status em texto e o aviso fixo', () => {
    abrir()
    const escala = (nome: string) => screen.getByRole('heading', { level: 2, name: nome }).closest('section') as HTMLElement
    const certificacoesDe = (nome: string) =>
      within(escala(nome)).getByRole('group', { name: 'Certificações de referência' })

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
})
