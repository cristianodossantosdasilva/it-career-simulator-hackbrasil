import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { SimuDeskApp } from './SimuDeskApp'

const T = TEXTOS_WORKSTATION.simudesk

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
    const id = screen.getByPlaceholderText(T.placeholderId)
    const pin = screen.getByPlaceholderText(T.placeholderPin)
    expect(id).toHaveAttribute('autocomplete', 'off')
    expect(pin).toHaveAttribute('autocomplete', 'off')
    expect(pin).toHaveAttribute('inputmode', 'numeric')
    fireEvent.change(id, { target: { value: '000000000' } })
    fireEvent.change(pin, { target: { value: '0000' } })
    fireEvent.click(screen.getByRole('button', { name: T.conectar }))
    expect(screen.getByRole('alert')).toHaveTextContent(T.idInvalido)
    fireEvent.change(id, { target: { value: '123456789' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('suporta subabas, chips com foco, estado admin e mensagens vazias', async () => {
    render(<SimuDeskApp {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: T.preencherConectar }))
    expect(screen.getByRole('button', { name: T.terminal })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'nslookup' }))
    expect(screen.getByLabelText('Comando do terminal')).toHaveFocus()
    expect(screen.getByRole('toolbar', { name: T.comandosSugeridos })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(T.usuarioPadrao)
    fireEvent.click(screen.getByRole('button', { name: T.painelAdmin }))
    expect(screen.getByRole('button', { name: T.painelAdmin })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(T.semGrupos)).toBeInTheDocument()
    expect(screen.getByText(T.semServicos)).toBeInTheDocument()
    expect(screen.getByText(T.semDns)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(T.semLogs))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar maria/ })).toHaveAttribute('aria-describedby', 'simudesk-requer-admin')
    expect(screen.getByText(T.requerPromptElevado)).toHaveAttribute('id', 'simudesk-requer-admin')
  })

  it('explica onde obter ID e PIN, mostra o cabeçalho do host e avisa o que o terminal aceita, sem estilo inline', () => {
    const { container } = render(<SimuDeskApp {...baseProps} />)
    expect(screen.getByText(/depois que matrícula e ramal são confirmados/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: T.preencherConectar }))
    expect(screen.getByRole('heading', { name: /EST-FIN-042/ })).toBeInTheDocument()
    expect(screen.getByText('Estação Windows corporativa')).toBeInTheDocument()
    expect(screen.getByText('Conectado')).toBeInTheDocument()
    const campo = screen.getByLabelText('Comando do terminal')
    expect(campo).toHaveAttribute('aria-describedby', 'terminal-dica')
    expect(container.querySelector('#terminal-dica')).toHaveTextContent(/não é suportado/)
    expect(container.querySelectorAll('[style]')).toHaveLength(0)
  })

  it('não tem violações axe-core na conexão, terminal e painéis', async () => {
    const first = render(<SimuDeskApp {...baseProps} />)
    expect((await axe.run(first.container)).violations).toEqual([])
    first.unmount()
    const second = render(<SimuDeskApp {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: T.preencherConectar }))
    expect((await axe.run(second.container)).violations).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: T.painelAdmin }))
    expect((await axe.run(second.container)).violations).toEqual([])
  })

  it.each([
    ['N4', 'sre-cloud-latencia', ['Painel de Cluster Kubernetes', 'Pool PgBouncer', 'Ingress TLS', T.regiaoSreMitigacao], T.comandosSre],
    ['N4b', 'diagnostico-sql-readonly', ['Modo somente leitura', T.regiaoSchema, 'Consultas sugeridas'], T.consultasSql],
  ])('não tem violações axe-core no cenário %s (%s) com painéis montados', async (_nivel, cenarioId, regioes, toolbar) => {
    const sessaoCenario = { ...sessao, meta: { ...sessao.meta, cenarioId } } as SessaoProjecao
    const { container } = render(<SimuDeskApp {...baseProps} sessao={sessaoCenario} />)
    fireEvent.click(screen.getByRole('button', { name: T.preencherConectar }))
    expect(screen.getByRole('toolbar', { name: toolbar })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: T.painelAdmin }))
    for (const nome of regioes) expect(screen.getByRole('region', { name: nome })).toBeInTheDocument()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
