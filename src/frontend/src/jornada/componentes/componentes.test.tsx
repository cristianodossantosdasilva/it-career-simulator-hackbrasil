import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CARTAO_DE_TESTE } from '../../testes/armazenamentoFalso'
import { AvisoHonesto } from './AvisoHonesto'
import { CartaoEmbarque } from './CartaoEmbarque'
import { GrupoVertente } from './GrupoVertente'
import { SecaoBrevePiloto } from './SecaoBrevePiloto'
import { SeloStatus } from './SeloStatus'

afterEach(cleanup)

describe('AvisoHonesto', () => {
  it('anuncia como status educado e executa a ação', () => {
    const aoClicar = vi.fn()
    render(<AvisoHonesto acoes={[{ tipo: 'botao', rotulo: 'Entendi', aoClicar }]}>Texto do aviso.</AvisoHonesto>)
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveAttribute('aria-live', 'polite')
    expect(aviso).toHaveTextContent('Texto do aviso.')
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('falha que bloqueia usa role alert e oferece link', () => {
    render(
      <AvisoHonesto bloqueante acoes={[{ tipo: 'link', rotulo: 'Voltar ao plano', href: '/plano-de-voo' }]}>
        Não foi possível abrir.
      </AvisoHonesto>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir.')
    expect(screen.getByRole('link', { name: 'Voltar ao plano' })).toHaveAttribute('href', '/plano-de-voo')
  })
})

describe('SeloStatus e GrupoVertente', () => {
  it('o selo diz o status em texto', () => {
    render(
      <>
        <SeloStatus status="disponivel" />
        <SeloStatus status="em-preparacao" />
        <SeloStatus status="futuro" />
      </>,
    )
    for (const texto of ['Disponível', 'Em preparação', 'Futuro']) expect(screen.getByText(texto)).toBeInTheDocument()
  })

  it('o grupo tem nome acessível igual ao título visível, em h3 ou h4', () => {
    render(
      <>
        <GrupoVertente nome="N3-A Redes e Nuvem" nivelTitulo={3}>
          <p>a</p>
        </GrupoVertente>
        <GrupoVertente nome="N3-B Data Center e Backup" nivelTitulo={4}>
          <p>b</p>
        </GrupoVertente>
      </>,
    )
    expect(screen.getByRole('group', { name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'N3-A Redes e Nuvem' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'N3-B Data Center e Backup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'N3-B Data Center e Backup' })).toBeInTheDocument()
  })
})

describe('SecaoBrevePiloto e CartaoEmbarque', () => {
  const exigencias = [
    { escalaId: 'help-desk-n1', rotulo: 'Ao menos uma missão em Help Desk N1', cumprida: false, aguardaPreparacao: true },
    { escalaId: 'service-desk-n1-jr', rotulo: 'Ao menos uma missão em Service Desk N1 Jr', cumprida: true, aguardaPreparacao: false },
  ]

  it('pendente: texto, exigências cumprida e pendente e o aguardo da missão em preparação', () => {
    render(<SecaoBrevePiloto visao={{ conquistado: false, exigencias }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Portfólio de analista' })).toBeInTheDocument()
    expect(screen.getByText('Portfólio de analista pendente')).toBeInTheDocument()
    expect(screen.getByText('Cumprida')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getAllByText('Aguarda missão em preparação no simulador.')).toHaveLength(1)
  })

  it('conquistado: texto de conquista', () => {
    render(<SecaoBrevePiloto visao={{ conquistado: true, exigencias: [exigencias[1]] }} nivelTitulo={3} />)
    expect(screen.getByText('Portfólio de analista conquistado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Portfólio de analista' })).toBeInTheDocument()
  })

  it('o cartão mostra rota, primeira etapa e as respostas por extenso', () => {
    render(<CartaoEmbarque cartao={CARTAO_DE_TESTE}>{<a href="/plano-de-voo">Plano</a>}</CartaoEmbarque>)
    expect(screen.getByText('Suporte de TI')).toBeInTheDocument()
    expect(screen.getByText('Help Desk N1')).toBeInTheDocument()
    expect(screen.getByText('Ajudar pessoas com tecnologia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plano' })).toBeInTheDocument()
  })
})
