import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../../api/types'
import { ChatApp } from './ChatApp'

afterEach(cleanup)

const sessao = ({} as SessaoProjecao)
Object.assign(sessao, {
  carreira: { cargoAtual: 'Analista Jr', xpTotal: 0, missoesConcluidas: [] }, chamados: [], problemas: [], estacao: {},
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

    fireEvent.click(screen.getByRole('button', { name: 'Tech Lead IA' }))
    expect(screen.getByRole('button', { name: 'Tech Lead IA' })).toHaveAttribute('aria-pressed', 'true')
    expect((await axe.run(container)).violations).toEqual([])
  })
})
