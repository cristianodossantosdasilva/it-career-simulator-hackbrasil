import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { SimuDeskApp } from './SimuDeskApp'

afterEach(cleanup)

const sessao = ({} as SessaoProjecao)
Object.assign(sessao, {
  dialogo: { acessoRemotoLiberado: true, idAcessoRemoto: '123456789', pinAcessoRemoto: '1234' },
  estacao: { privilegio: 'Padrao', gruposPorUsuario: {}, dnsServidor: {}, servicos: [], compartilhamentoAcessivel: false, logs: [], comandosSuportados: ['whoami', 'nslookup'] },
  meta: { cenarioId: 'demo' },
})
const baseProps = { sessao, historicoTerminal: [], onComando: vi.fn(async () => {}), onAcao: vi.fn(async () => {}), ocupado: false }

describe('SimuDeskApp W18', () => {
  it('mostra erro de credenciais inválidas e limpa ao editar; configura os campos', () => {
    render(<SimuDeskApp {...baseProps} />)
    const id = screen.getByPlaceholderText('NNN NNN NNN')
    const pin = screen.getByPlaceholderText('4 digitos')
    expect(id).toHaveAttribute('autocomplete', 'off')
    expect(pin).toHaveAttribute('autocomplete', 'off')
    expect(pin).toHaveAttribute('inputmode', 'numeric')
    fireEvent.change(id, { target: { value: '000000000' } })
    fireEvent.change(pin, { target: { value: '0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Conectar na Estacao' }))
    expect(screen.getByRole('alert')).toHaveTextContent('ID ou PIN invalido.')
    fireEvent.change(id, { target: { value: '123456789' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('suporta subabas, chips com foco, estado admin e mensagens vazias', async () => {
    render(<SimuDeskApp {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher e Conectar' }))
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'nslookup' }))
    expect(screen.getByLabelText('Comando do terminal')).toHaveFocus()
    expect(screen.getByRole('toolbar', { name: 'Comandos sugeridos' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Usuario Padrao')
    fireEvent.click(screen.getByRole('button', { name: 'Paineis Admin' }))
    expect(screen.getByRole('button', { name: 'Paineis Admin' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Nenhum grupo carregado.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum servico carregado.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum registro DNS carregado.')).toBeInTheDocument()
    expect(screen.getByText(/Nenhum log carregado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar maria/ })).toHaveAttribute('aria-describedby', 'simudesk-requer-admin')
    expect(screen.getByText('Requer Prompt Elevado')).toHaveAttribute('id', 'simudesk-requer-admin')
  })

  it('não tem violações axe-core na conexão, terminal e painéis', async () => {
    const first = render(<SimuDeskApp {...baseProps} />)
    expect((await axe.run(first.container)).violations).toEqual([])
    first.unmount()
    const second = render(<SimuDeskApp {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher e Conectar' }))
    expect((await axe.run(second.container)).violations).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Paineis Admin' }))
    expect((await axe.run(second.container)).violations).toEqual([])
  })

  it.each([
    ['N4', 'sre-cloud-latencia', ['Painel de Cluster Kubernetes', 'Pool PgBouncer', 'Ingress TLS', 'Acoes de mitigacao SRE'], 'Comandos de diagnostico SRE'],
    ['N4b', 'diagnostico-sql-readonly', ['Modo somente leitura', 'Schema do Dataset Sintetico', 'Consultas sugeridas'], 'Consultas SQL somente leitura'],
  ])('não tem violações axe-core no cenário %s (%s) com painéis montados', async (_nivel, cenarioId, regioes, toolbar) => {
    const sessaoCenario = { ...sessao, meta: { ...sessao.meta, cenarioId } } as SessaoProjecao
    const { container } = render(<SimuDeskApp {...baseProps} sessao={sessaoCenario} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher e Conectar' }))
    expect(screen.getByRole('toolbar', { name: toolbar })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Paineis Admin' }))
    for (const nome of regioes) expect(screen.getByRole('region', { name: nome })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
