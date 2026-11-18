import { describe, expect, it } from 'vitest'
import { aparenciaInicial, montarTagsAparencia } from '../../plugins/aparenciaInicial'
import { criarEnvelope, serializarParaHtml } from './envelopeConfiguracao.ts'

describe('plugin aparenciaInicial, funções puras', () => {
  it('sem envelope só há o script, no início do head', () => {
    const tags = montarTagsAparencia('(function(){})()', null)
    expect(tags).toHaveLength(1)
    expect(tags[0]).toMatchObject({ tag: 'script', children: '(function(){})()', injectTo: 'head-prepend' })
    expect(tags[0].attrs).toBeUndefined()
  })

  it('com envelope o bloco JSON vem antes do script', () => {
    const envelope = criarEnvelope('{"temasPermitidos":["acolhedor"],"travado":true}')
    const tags = montarTagsAparencia('(function(){})()', envelope)
    expect(tags.map((tag) => tag.attrs?.id ?? 'script')).toEqual(['itfs-config-cliente', 'script'])
    expect(tags[0].attrs).toMatchObject({ type: 'application/json' })
    expect(JSON.parse(tags[0].children as string)).toMatchObject({ versao: 1, configuracao: { travado: true } })
    expect(tags.every((tag) => tag.injectTo === 'head-prepend')).toBe(true)
  })

  it('o JSON embutido nunca contém o sinal de menor', () => {
    const envelope = criarEnvelope(JSON.stringify({ temaPadrao: '</script><b>', campoExtra: '</script>' }))
    const tags = montarTagsAparencia('x', envelope)
    expect(String(tags[0].children)).not.toContain('<')
    expect(serializarParaHtml(envelope)).not.toContain('<')
  })

  it('recusa um script que feche a própria tag', () => {
    expect(() => montarTagsAparencia('var a = "</script>"', null)).toThrow(/aparenciaInicial/)
  })

  it('o plugin tem nome e os ganchos esperados', () => {
    const plugin = aparenciaInicial()
    expect(plugin.name).toBe('aparencia-inicial')
    expect(typeof plugin.transformIndexHtml).toBe('function')
    expect(typeof plugin.generateBundle).toBe('function')
    expect(typeof plugin.configureServer).toBe('function')
  })
})
