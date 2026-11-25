import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import {
  CHAVE_PORTFOLIO_LAB,
  calcularNotaCriterios,
  criarEntradaPortfolioLab,
  filtrarPortfolioLabPorCenario,
  lerPortfolioLab,
  registrarEntradaPortfolioLab,
  registrarInicioProvaLab,
  sincronizarProvasLabDeRegistros,
} from './portfolioLab'

describe('portfolioLab', () => {
  it('calcula nota pelos critérios atendidos e cria entrada completa', () => {
    const base = registroDeTeste('reset-senha-desbloqueio', 'sessao-prova-1')
    const registro = {
      ...base,
      concluidoEm: '2026-11-25T14:00:00.000Z',
      resultado: {
        ...base.resultado,
        resumo: 'Bloqueio identificado e reset recusado com segurança.',
        criterios: [
          { id: 'c1', descricao: 'Consultar política KB-001', atendido: true },
          { id: 'c2', descricao: 'Verificar token corporativo', atendido: true },
          { id: 'c3', descricao: 'Registrar nota pública completa', atendido: false },
        ],
      },
    }

    expect(calcularNotaCriterios(registro.resultado.criterios)).toBe(67)

    const entrada = criarEntradaPortfolioLab(registro)
    expect(entrada.cenarioId).toBe('reset-senha-desbloqueio')
    expect(entrada.nota).toBe(67)
    expect(entrada.criteriosAtendidos).toEqual(['Consultar política KB-001', 'Verificar token corporativo'])
    expect(entrada.criteriosPendentes).toEqual(['Registrar nota pública completa'])
    expect(entrada.oQueFoiFeito).toBe('Bloqueio identificado e reset recusado com segurança.')
  })

  it('sincroniza Prova de Lab pendente quando o registro correspondente é concluído', () => {
    const armazenamento = criarArmazenamentoFalso()
    const inicio = new Date('2026-11-25T13:50:00.000Z')
    registrarInicioProvaLab('pasta-rede-inacessivel', inicio, armazenamento)

    const base = registroDeTeste('pasta-rede-inacessivel', 'sessao-lab-99')
    const concluido = {
      ...base,
      concluidoEm: '2026-11-25T14:10:00.000Z',
    }

    const sincronizado = sincronizarProvasLabDeRegistros([concluido], armazenamento)
    expect(sincronizado).toHaveLength(1)
    expect(sincronizado[0].sessaoId).toBe('sessao-lab-99')
    expect(sincronizado[0].cenarioId).toBe('pasta-rede-inacessivel')
    expect(lerPortfolioLab(armazenamento)).toHaveLength(1)
  })

  it('filtra entradas por cenário e ignora JSON inválido', () => {
    const armazenamento = criarArmazenamentoFalso()
    const e1 = criarEntradaPortfolioLab(registroDeTeste('reset-senha-desbloqueio', 's-1'))
    const e2 = criarEntradaPortfolioLab(registroDeTeste('pasta-rede-inacessivel', 's-2'))
    registrarEntradaPortfolioLab(e1, armazenamento)
    const todas = registrarEntradaPortfolioLab(e2, armazenamento)

    expect(filtrarPortfolioLabPorCenario(todas, 'todos')).toHaveLength(2)
    expect(filtrarPortfolioLabPorCenario(todas, 'pasta-rede-inacessivel')).toHaveLength(1)

    const invalido = criarArmazenamentoFalso({ [CHAVE_PORTFOLIO_LAB]: '{erro' })
    expect(lerPortfolioLab(invalido)).toEqual([])
  })
})
