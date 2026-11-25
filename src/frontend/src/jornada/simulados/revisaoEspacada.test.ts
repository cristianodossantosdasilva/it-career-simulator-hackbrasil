import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import {
  CHAVE_REVISAO_ESPACADA,
  LIMITE_FILA_HOJE,
  adicionarDias,
  analisarRevisaoEspacada,
  chaveDia,
  estadoRevisaoVazio,
  filaParaHoje,
  gravarRevisaoEspacada,
  lerRevisaoEspacada,
  proximaCaixa,
  registrarErros,
  registrarQuestoesErradas,
  responderCartao,
  sequenciaAtiva,
} from './revisaoEspacada'

const DIA_1 = new Date('2026-11-25T12:00:00.000Z')
const DIA_2 = adicionarDias(DIA_1, 1)
const DIA_4 = adicionarDias(DIA_1, 3)

describe('revisaoEspacada', () => {
  it('avança nas caixas 1 -> 3 -> 7 -> 14 ao acertar e volta para 1 ao errar', () => {
    expect(proximaCaixa(1, true)).toBe(3)
    expect(proximaCaixa(3, true)).toBe(7)
    expect(proximaCaixa(7, true)).toBe(14)
    expect(proximaCaixa(14, true)).toBe(14)
    expect(proximaCaixa(14, false)).toBe(1)
    expect(proximaCaixa(3, false)).toBe(1)
  })

  it('limita a fila para hoje a no máximo 10 itens e ordena pelos mais atrasados', () => {
    const erros = Array.from({ length: 14 }, (_, i) => ({
      questaoId: `q-${i + 1}`,
      dominio: 'Redes',
      enunciado: `Questão ${i + 1}`,
      origem: 'simulado' as const,
    }))

    const estado = registrarErros(estadoRevisaoVazio(), erros, DIA_1)
    const fila = filaParaHoje(estado, DIA_1)

    expect(LIMITE_FILA_HOJE).toBe(10)
    expect(fila).toHaveLength(10)
    expect(fila[0].questaoId).toBe('q-1')
  })

  it('ao clicar em Acertei sobe a caixa e agenda para +3/+7/+14 dias; ao clicar em Errei volta à caixa 1 (+1 dia)', () => {
    let estado = registrarErros(
      estadoRevisaoVazio(),
      [
        {
          questaoId: 'q-dns',
          dominio: 'Redes',
          enunciado: 'Qual porta o DNS utiliza por padrão?',
          respostaCorreta: 'UDP/TCP 53',
          explicacao: 'Consultas DNS padrão usam UDP 53.',
          origem: 'teorico',
        },
      ],
      DIA_1,
    )

    // Dia 1: entra na fila para hoje na caixa 1
    expect(filaParaHoje(estado, DIA_1)).toHaveLength(1)

    // Acertei no dia 1 -> vai para caixa 3, agendada para DIA_1 + 3 dias
    estado = responderCartao(estado, 'q-dns', true, DIA_1)
    expect(estado.cartoes[0].caixa).toBe(3)
    expect(estado.cartoes[0].proximaRevisao).toBe(chaveDia(DIA_4))
    expect(filaParaHoje(estado, DIA_1)).toHaveLength(0)
    expect(filaParaHoje(estado, DIA_2)).toHaveLength(0)
    expect(filaParaHoje(estado, DIA_4)).toHaveLength(1)

    // Errei no dia 4 -> volta para caixa 1, agendada para DIA_4 + 1 dia
    estado = responderCartao(estado, 'q-dns', false, DIA_4)
    expect(estado.cartoes[0].caixa).toBe(1)
    expect(estado.cartoes[0].proximaRevisao).toBe(chaveDia(adicionarDias(DIA_4, 1)))
    expect(estado.cartoes[0].acertosSeguidos).toBe(0)
  })

  it('mantém o contador de sequência de dias consecutivos e zera após hiato maior que 1 dia', () => {
    let estado = registrarErros(
      estadoRevisaoVazio(),
      [
        { questaoId: 'q-1', dominio: 'Segurança', enunciado: 'Questão 1', origem: 'teorico' },
        { questaoId: 'q-2', dominio: 'Segurança', enunciado: 'Questão 2', origem: 'simulado' },
      ],
      DIA_1,
    )

    expect(sequenciaAtiva(estado, DIA_1)).toBe(0)

    // Dia 1: revisa q-1 -> sequência = 1; revisa q-2 no mesmo dia -> continua 1
    estado = responderCartao(estado, 'q-1', true, DIA_1)
    expect(sequenciaAtiva(estado, DIA_1)).toBe(1)
    estado = responderCartao(estado, 'q-2', false, DIA_1)
    expect(sequenciaAtiva(estado, DIA_1)).toBe(1)

    // Dia 2: revisa q-2 (que voltou à caixa 1 para +1 dia) -> sequência = 2
    estado = responderCartao(estado, 'q-2', true, DIA_2)
    expect(sequenciaAtiva(estado, DIA_2)).toBe(2)

    // Dia 3 (ontem foi Dia 2): sequência ainda está ativa
    expect(sequenciaAtiva(estado, adicionarDias(DIA_2, 1))).toBe(2)

    // Dia 4 (pulou Dia 3): sequência ativa zera
    expect(sequenciaAtiva(estado, adicionarDias(DIA_2, 2))).toBe(0)
  })

  it('persiste e lê com segurança no armazenamento local e ignora JSON inválido', () => {
    const armazenamento = criarArmazenamentoFalso()
    const atualizado = registrarQuestoesErradas(
      [
        {
          questaoId: 'q-persist',
          dominio: 'Sistemas Operacionais',
          enunciado: 'O que significa OOM?',
          origem: 'simulado',
        },
      ],
      DIA_1,
      armazenamento,
    )

    expect(gravarRevisaoEspacada(atualizado, armazenamento)).toBe(true)
    const lido = lerRevisaoEspacada(armazenamento)
    expect(lido.cartoes).toHaveLength(1)
    expect(lido.cartoes[0].questaoId).toBe('q-persist')

    expect(analisarRevisaoEspacada('{quebrado')).toEqual(estadoRevisaoVazio())
    const corrompido = criarArmazenamentoFalso({ [CHAVE_REVISAO_ESPACADA]: 'null' })
    expect(lerRevisaoEspacada(corrompido)).toEqual(estadoRevisaoVazio())
  })
})
