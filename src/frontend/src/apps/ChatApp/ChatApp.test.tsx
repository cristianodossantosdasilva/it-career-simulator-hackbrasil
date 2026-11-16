import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { TEXTOS_WORKSTATION } from '../../textos/workstation'
import { ChatApp } from './ChatApp'

const T = TEXTOS_WORKSTATION.chat

afterEach(cleanup)

const sessao = ({} as SessaoProjecao)
Object.assign(sessao, {
  carreira: { cargoAtual: 'Analista Jr', xpTotal: 0, missoesConcluidas: [] }, chamados: [{ id: 'CH-0001', solicitante: 'Maria Souza' }], problemas: [], estacao: {},
  dialogo: {
    acessoRemotoLiberado: false, idAcessoRemoto: null, pinAcessoRemoto: null, identidadeValidada: false,
    pistasSolicitadas: 0, usuarioConfirmouFuncionamento: false,
    mensagens: [
      { seq: 1, remetente: 'cliente', conteudo: 'Não consigo acessar a pasta compartilhada.', minutoSimulado: 1 },
      { seq: 2, remetente: 'analista', conteudo: 'Quando o problema começou?', minutoSimulado: 2 },
      { seq: 3, remetente: 'techlead', conteudo: 'Confirme primeiro a conexão de rede.', minutoSimulado: 3 },
    ],
  },
  meta: { cenarioId: 'demo', semente: 1, nivel: 'N1', versaoManifesto: '1', minutoSimulado: 3, ultimoSeq: 3 }, ultimoSeq: 3,
})

describe('ChatApp W22', () => {
  it('distingue remetentes, permite alternar contato e não apresenta violações axe-core', async () => {
    const { container } = render(<ChatApp sessao={sessao} onChat={vi.fn(async () => {})} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByRole('log', { name: 'Mensagens da conversa' })).toBeInTheDocument()
    expect(container.querySelector('#chat-dica-teclado')).toBeInTheDocument()
    expect(container.querySelector('.msg-cliente')).toBeInTheDocument()
    expect(container.querySelector('.msg-analista')).toBeInTheDocument()
    expect(container.querySelector('.msg-techlead')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: T.techLeadIa }))
    expect(screen.getByRole('button', { name: T.techLeadIa })).toHaveAttribute('aria-pressed', 'true')
    expect((await axe.run(container)).violations).toEqual([])
  })

  it('mostra cartão do solicitante com estado da verificação, transcrição sem balões e atualiza ao falhar', () => {
    const onAcao = vi.fn(async () => {})
    const { container } = render(<ChatApp sessao={sessao} onChat={vi.fn(async () => {})} onAcao={onAcao} ocupado={false} />)
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(container.querySelector('.chat-msg')).not.toHaveClass('badge')

    fireEvent.change(screen.getByLabelText('Matrícula da usuária'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Ramal da usuária'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: T.validarIdentidade }))
    expect(onAcao).toHaveBeenCalledWith('dialogo.verificar_identidade', { matricula: 'X', ramal: '1' })
    expect(screen.getByText('Não confirmada')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/ainda não confirmada/)
  })

  it('mostra a identidade verificada quando o acesso remoto é liberado', () => {
    const liberada = { ...sessao, dialogo: { ...sessao.dialogo, acessoRemotoLiberado: true, identidadeValidada: true, idAcessoRemoto: '123 456 789', pinAcessoRemoto: '1234' } } as SessaoProjecao
    render(<ChatApp sessao={liberada} onChat={vi.fn(async () => {})} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByText(T.identidadeVerificada)).toBeInTheDocument()
    expect(screen.getByText('Verificada')).toBeInTheDocument()
  })
})