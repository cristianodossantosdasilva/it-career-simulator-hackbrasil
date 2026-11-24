import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { paraTodo } from '../../testes/propriedade'
import { PERGUNTA_FOCO, RESPOSTAS_FOCO } from '../catalogos/catalogoVocacional'
import { ProvedorArmazenamentoJornada } from '../ProvedorArmazenamentoJornada'
import { DemonstracaoDiagnostico } from './DemonstracaoDiagnostico'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Feature: jornada-de-missao, Property 9: Demonstração do diagnóstico no Início não grava nada', () => {
  it('para toda sequência de escolhas, o armazenamento falso não recebe setItem', () => {
    paraTodo(
      'demonstracao sem gravacao',
      (g) => g.lista((h) => h.escolher(PERGUNTA_FOCO.opcoes).id, 12),
      (sequencia) => {
        const armazenamento = criarArmazenamentoFalso()
        const removerItem = vi.spyOn(armazenamento, 'removeItem')
        const { unmount } = render(
          <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
            <DemonstracaoDiagnostico />
          </ProvedorArmazenamentoJornada>,
        )
        for (const id of sequencia) {
          const opcao = PERGUNTA_FOCO.opcoes.find((item) => item.id === id)!
          fireEvent.click(screen.getByRole('radio', { name: opcao.rotulo }))
          expect(screen.getByText(RESPOSTAS_FOCO[id])).toBeInTheDocument()
        }
        expect(armazenamento.gravacoes).toHaveLength(0)
        expect(armazenamento.dados.size).toBe(0)
        expect(removerItem).not.toHaveBeenCalled()
        unmount()
      },
      { execucoes: 25 },
    )
  })

  it('não faz requisição e começa sem resposta escolhida', () => {
    const espiao = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede'))
    render(<DemonstracaoDiagnostico />)
    for (const opcao of PERGUNTA_FOCO.opcoes) expect(screen.getByRole('radio', { name: opcao.rotulo })).not.toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: PERGUNTA_FOCO.opcoes[0].rotulo }))
    expect(espiao).not.toHaveBeenCalled()
  })
})
