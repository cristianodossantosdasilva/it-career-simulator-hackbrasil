import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { CHAVE_HISTORICO, lerHistorico, registrarHistorico } from './historico'

describe('historico de simulados e provas', () => {
  it('registra e lê entradas ordenadas da mais recente para a mais antiga', () => {
    const armazenamento = criarArmazenamentoFalso()
    const primeira = registrarHistorico(
      {
        id: 'h-1',
        tipo: 'teorico',
        formato: 'padrao',
        escopo: 'completo',
        quando: '2026-11-24T10:00:00.000Z',
        duracaoSeg: 1200,
        percentual: 75,
        aprovado: true,
        porDominio: [{ dominio: 'Redes', total: 10, corretas: 8 }],
        origem: 'prova',
      },
      armazenamento,
    )
    const segunda = registrarHistorico(
      {
        tipo: 'lab',
        formato: 'pratica',
        escopo: 'personalizado',
        duracaoSeg: 420,
        percentual: 60,
        aprovado: false,
        porDominio: [{ dominio: 'Acesso e contas', total: 2, corretas: 1 }],
        origem: 'simulado',
      },
      armazenamento,
    )

    expect(primeira.id).toBe('h-1')
    const lidas = lerHistorico(armazenamento)
    expect(lidas).toHaveLength(2)
    expect(lidas[0].id).toBe(segunda.id)
    expect(lidas[1].id).toBe('h-1')
  })

  it('ignora JSON inválido no armazenamento', () => {
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_HISTORICO]: '{invalido' })
    expect(lerHistorico(armazenamento)).toEqual([])
  })
})
