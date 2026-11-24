import { describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso } from '../../testes/armazenamentoFalso'
import { gerarCartao, gerarDataIso } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import { CHAVE_CARTAO_PERFIL, analisarCartao, serializarCartao } from '../armazenamento/cartaoPerfil'
import { DIAGNOSTICO_RAPIDO } from '../catalogos/catalogoVocacional'
import { indicarRota } from '../catalogos/regrasIndicacao'
import { resolverEndereco } from '../navegacao/rotas'
import { executarPlanoDemonstracao, planejarAtalho, planejarConclusaoDiagnosticoRapido } from './planoDemonstracao'

function resolver(destino: string) {
  const [caminho, busca = ''] = destino.split('?')
  return resolverEndereco(caminho, busca ? `?${busca}` : '')
}

describe('planoDemonstracao', () => {
  it('Feature: jornada-de-missao, Property 24: Planejamento do atalho e do Diagnóstico_Rápido (atalho)', () => {
    paraTodo(
      'planejarAtalho',
      (g) => {
        const modo = g.inteiro(0, 2)
        // 0: ausente. 1: cartão válido. 2: texto inválido, que a análise trata como ausente.
        if (modo === 1) return gerarCartao(g)
        return modo === 0 ? null : analisarCartao(g.texto(30))
      },
      (cartao) => {
        const plano = planejarAtalho(cartao)
        expect(plano.gravarCartao).toBeNull()
        expect(plano.substituirHistorico).toBe(false)
        expect(plano.ativarModo).toBe(cartao !== null)
        expect(plano.destino).toBe(cartao ? '/mesa-de-trabalho/pasta-rede-inacessivel' : '/diagnostico?modo=rapido')
        expect(resolver(plano.destino).pagina).not.toBe('nao-encontrada')
      },
    )
  })

  it('Feature: jornada-de-missao, Property 24: Planejamento do atalho e do Diagnóstico_Rápido (conclusão)', () => {
    paraTodo(
      'planejarConclusaoDiagnosticoRapido',
      (g) => new Date(gerarDataIso(g)),
      (agora) => {
        const plano = planejarConclusaoDiagnosticoRapido(agora)
        expect(plano.ativarModo).toBe(true)
        expect(plano.substituirHistorico).toBe(true)
        expect(plano.destino).toBe('/mesa-de-trabalho/pasta-rede-inacessivel')
        expect(resolver(plano.destino).pagina).toBe('mesa-de-trabalho')
        const cartao = plano.gravarCartao
        expect(cartao).not.toBeNull()
        if (!cartao) return
        expect(analisarCartao(serializarCartao(cartao))).toEqual(cartao)
        expect(cartao.rotaId).toBe('suporte-ti')
        expect(cartao.rotaIndicadaId).toBe(indicarRota(DIAGNOSTICO_RAPIDO.respostas).rotaId)
        expect(cartao.respostas).toEqual(DIAGNOSTICO_RAPIDO.respostas)
        expect(cartao.origem).toBe('diagnostico-rapido')
        expect(cartao.emitidoEm).toBe(agora.toISOString())
      },
    )
  })

  it('o destino do Diagnóstico_Rápido resolve para a página de diagnóstico no modo rápido', () => {
    const rota = resolver(planejarAtalho(null).destino)
    expect(rota).toMatchObject({ pagina: 'diagnostico', rapido: true })
  })

  it('executa na ordem: gravar o cartão, ativar o modo e navegar', () => {
    const chamadas: string[] = []
    const armazenamento = {
      definirCartao: vi.fn(() => (chamadas.push('cartao'), true)),
      definirModoDemonstracao: vi.fn(() => (chamadas.push('modo'), true)),
    }
    const navegarPara = vi.fn(() => void chamadas.push('navegar'))
    const plano = planejarConclusaoDiagnosticoRapido(new Date('2026-11-20T12:00:00.000Z'))
    executarPlanoDemonstracao(plano, armazenamento, navegarPara)
    expect(chamadas).toEqual(['cartao', 'modo', 'navegar'])
    expect(armazenamento.definirModoDemonstracao).toHaveBeenCalledWith(true, 'atalho-experimentar')
    expect(navegarPara).toHaveBeenCalledWith('/mesa-de-trabalho/pasta-rede-inacessivel', { substituir: true })
  })

  it('o atalho sem cartão só navega, sem gravar cartão nem ativar o modo', () => {
    const armazenamento = { definirCartao: vi.fn(() => true), definirModoDemonstracao: vi.fn(() => true) }
    const navegarPara = vi.fn()
    executarPlanoDemonstracao(planejarAtalho(null), armazenamento, navegarPara)
    expect(armazenamento.definirCartao).not.toHaveBeenCalled()
    expect(armazenamento.definirModoDemonstracao).not.toHaveBeenCalled()
    expect(navegarPara).toHaveBeenCalledWith('/diagnostico?modo=rapido', { substituir: false })
  })

  it('o planejamento não toca no armazenamento', () => {
    const armazenamento = criarArmazenamentoFalso()
    planejarAtalho(null)
    planejarConclusaoDiagnosticoRapido(new Date())
    expect(armazenamento.gravacoes).toHaveLength(0)
    expect(armazenamento.dados.has(CHAVE_CARTAO_PERFIL)).toBe(false)
  })
})