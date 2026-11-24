import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { gerarIdSessao, gerarMissoesAtivas } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import {
  MISSOES_ATIVAS_VAZIO,
  analisarMissoesAtivas,
  comMissaoAtiva,
  gravarMissoesAtivas,
  lerMissoesAtivas,
  serializarMissoesAtivas,
} from './missoesAtivas'

describe('missoesAtivas', () => {
  it('Feature: jornada-de-missao, Property 6: Ida e volta do armazenamento (missões ativas)', () => {
    paraTodo('ida e volta das missões ativas', gerarMissoesAtivas, (missoesAtivas) => {
      expect(analisarMissoesAtivas(serializarMissoesAtivas(missoesAtivas))).toEqual(missoesAtivas)
      const armazenamento = criarArmazenamentoFalso()
      expect(gravarMissoesAtivas(armazenamento, missoesAtivas)).toBe(true)
      expect(lerMissoesAtivas(armazenamento)).toEqual(missoesAtivas)
    })
  })

  it('Feature: jornada-de-missao, Property 7: Dado inválido é tratado como ausente (missões ativas)', () => {
    paraTodo(
      'só entradas válidas sobrevivem',
      (g) => ({ missoesAtivas: gerarMissoesAtivas(g), lixo: g.texto(12), sessaoInvalida: `${gerarIdSessao(g)} /` }),
      ({ missoesAtivas, lixo, sessaoInvalida }) => {
        const texto = JSON.stringify({
          ...missoesAtivas,
          porMissao: { ...missoesAtivas.porMissao, [`fora-${lixo}`]: 'sessao-1', 'incidente-massivo-x': 'abc' },
        })
        expect(analisarMissoesAtivas(texto)).toEqual(missoesAtivas)
        const comSessaoRuim = JSON.stringify({ ...missoesAtivas, porMissao: { 'pasta-rede-inacessivel': sessaoInvalida } })
        expect(analisarMissoesAtivas(comSessaoRuim).porMissao).toEqual({})
        expect(analisarMissoesAtivas(lixo)).toEqual(MISSOES_ATIVAS_VAZIO)
      },
    )
    expect(analisarMissoesAtivas('{"versao":2,"porMissao":{}}')).toEqual(MISSOES_ATIVAS_VAZIO)
    expect(analisarMissoesAtivas(JSON.stringify({ versao: 1, ultimaMissao: 'nada', porMissao: [] }))).toEqual(MISSOES_ATIVAS_VAZIO)
  })

  it('comMissaoAtiva marca a missão e falhas de armazenamento não lançam', () => {
    const missoesAtivas = comMissaoAtiva(MISSOES_ATIVAS_VAZIO, 'incidente-massivo', 'sessao-9')
    expect(missoesAtivas).toEqual({ versao: 1, ultimaMissao: 'incidente-massivo', porMissao: { 'incidente-massivo': 'sessao-9' } })
    expect(gravarMissoesAtivas(criarArmazenamentoFalso({}, { falharGravacao: true }), missoesAtivas)).toBe(false)
    expect(lerMissoesAtivas(criarArmazenamentoFalso({}, { falharLeitura: true }))).toEqual(MISSOES_ATIVAS_VAZIO)
  })
})
