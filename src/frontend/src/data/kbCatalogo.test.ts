import { describe, expect, it } from 'vitest'
import { KB_CATALOGO, buscarArtigoPorId, buscarArtigoPorUri, resolverUriParaId } from './kbCatalogo'

describe('catalogo sintetico da KB', () => {
  it('resolve todos os ids e URIs para artigos unicos', () => {
    expect(new Set(KB_CATALOGO.map((artigo) => artigo.id)).size).toBe(KB_CATALOGO.length)
    for (const artigo of KB_CATALOGO) {
      expect(buscarArtigoPorId(artigo.id)).toBe(artigo)
      expect(resolverUriParaId(artigo.uri)).toBe(artigo.id)
      expect(buscarArtigoPorUri(artigo.uri)).toBe(artigo)
      expect(artigo.conteudo).not.toMatch(/dados reais de clientes|credenciais corporativas reais/i)
    }
  })

  it('orienta a investigacao da pasta sem revelar valores ou causas internas do cenario', () => {
    const artigo = buscarArtigoPorId('KB-006')!
    expect(artigo.conteudo).not.toMatch(/10\.10\.20\.15|GRP_FINANCEIRO_PASTA|Workstation parado|causa raiz.*(DNS|grupo|servico)/i)
  })
})
