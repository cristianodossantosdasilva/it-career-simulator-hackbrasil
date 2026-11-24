import { describe, expect, it } from 'vitest'
import { registroDeTeste } from '../../testes/armazenamentoFalso'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { MODOS_VOO, REGRAS_PRONTO_PARA_COMECAR, calcularDominiosDaRota } from './configuracaoVoo'

describe('configuracaoVoo', () => {
  it('define os dois modos (treino e missão) e exatamente cinco regras de preparo', () => {
    expect(MODOS_VOO.map((m) => m.id)).toEqual(['treino', 'missao'])
    expect(REGRAS_PRONTO_PARA_COMECAR).toHaveLength(5)
  })

  it('calcula domínios da rota com soma de pesos igual a 100 e recomenda o primeiro domínio incompleto', () => {
    const rota = rotaPorId('suporte-ti')
    if (!rota) throw new Error('rota suporte-ti ausente')

    const semRegistros = calcularDominiosDaRota(rota, [])
    expect(semRegistros.reduce((soma, item) => soma + item.peso, 0)).toBe(100)
    expect(semRegistros.find((item) => item.recomendado)?.id).toBe('help-desk-n1')

    const comPrimeiroFeito = calcularDominiosDaRota(rota, [registroDeTeste('reset-senha-desbloqueio', 'sessao-1')])
    expect(comPrimeiroFeito.find((item) => item.id === 'help-desk-n1')?.missoesConcluidas).toBe(1)
    expect(comPrimeiroFeito.find((item) => item.recomendado)?.id).toBe('service-desk-n1-jr')
  })
})
