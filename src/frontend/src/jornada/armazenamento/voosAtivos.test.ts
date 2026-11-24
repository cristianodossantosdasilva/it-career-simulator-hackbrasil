import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { gerarIdSessao, gerarVoosAtivos } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import {
  VOOS_ATIVOS_VAZIO,
  analisarVoosAtivos,
  comVooAtivo,
  gravarVoosAtivos,
  lerVoosAtivos,
  serializarVoosAtivos,
} from './voosAtivos'

describe('voosAtivos', () => {
  it('Feature: jornada-de-voo, Property 6: Ida e volta do armazenamento (missões ativos)', () => {
    paraTodo('ida e volta das missões ativos', gerarVoosAtivos, (voos) => {
      expect(analisarVoosAtivos(serializarVoosAtivos(voos))).toEqual(voos)
      const armazenamento = criarArmazenamentoFalso()
      expect(gravarVoosAtivos(armazenamento, voos)).toBe(true)
      expect(lerVoosAtivos(armazenamento)).toEqual(voos)
    })
  })

  it('Feature: jornada-de-voo, Property 7: Dado inválido é tratado como ausente (missões ativos)', () => {
    paraTodo(
      'só entradas válidas sobrevivem',
      (g) => ({ voos: gerarVoosAtivos(g), lixo: g.texto(12), sessaoInvalida: `${gerarIdSessao(g)} /` }),
      ({ voos, lixo, sessaoInvalida }) => {
        const texto = JSON.stringify({
          ...voos,
          porMissao: { ...voos.porMissao, [`fora-${lixo}`]: 'sessao-1', 'incidente-massivo-x': 'abc' },
        })
        expect(analisarVoosAtivos(texto)).toEqual(voos)
        const comSessaoRuim = JSON.stringify({ ...voos, porMissao: { 'pasta-rede-inacessivel': sessaoInvalida } })
        expect(analisarVoosAtivos(comSessaoRuim).porMissao).toEqual({})
        expect(analisarVoosAtivos(lixo)).toEqual(VOOS_ATIVOS_VAZIO)
      },
    )
    expect(analisarVoosAtivos('{"versao":2,"porMissao":{}}')).toEqual(VOOS_ATIVOS_VAZIO)
    expect(analisarVoosAtivos(JSON.stringify({ versao: 1, ultimaMissao: 'nada', porMissao: [] }))).toEqual(VOOS_ATIVOS_VAZIO)
  })

  it('comVooAtivo marca a missão e falhas de armazenamento não lançam', () => {
    const voos = comVooAtivo(VOOS_ATIVOS_VAZIO, 'incidente-massivo', 'sessao-9')
    expect(voos).toEqual({ versao: 1, ultimaMissao: 'incidente-massivo', porMissao: { 'incidente-massivo': 'sessao-9' } })
    expect(gravarVoosAtivos(criarArmazenamentoFalso({}, { falharGravacao: true }), voos)).toBe(false)
    expect(lerVoosAtivos(criarArmazenamentoFalso({}, { falharLeitura: true }))).toEqual(VOOS_ATIVOS_VAZIO)
  })
})
