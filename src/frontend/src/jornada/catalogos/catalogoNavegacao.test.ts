import { describe, expect, it } from 'vitest'
import { MISSOES_CATALOGO } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import { type IdPagina, NOME_PAGINA, resolverEndereco } from '../navegacao/rotas'
import { ITENS_MENU, hrefDoItem, itemAtivoDoMenu } from './catalogoNavegacao'

const PAGINAS = Object.keys(NOME_PAGINA) as IdPagina[]

describe('catalogoNavegacao', () => {
  it('Feature: jornada-de-missao, Property 19: Item ativo do menu', () => {
    paraTodo(
      'item ativo do menu',
      (g) => ({ pagina: g.escolher(PAGINAS), missaoAtiva: g.escolher(MISSOES_CATALOGO) }),
      ({ pagina, missaoAtiva }) => {
        const ativo = itemAtivoDoMenu(pagina)
        expect(ITENS_MENU.filter((item) => item.pagina === pagina).length).toBeLessThanOrEqual(1)
        if (ativo === null) return
        const item = ITENS_MENU.find((i) => i.id === ativo)
        const href = item ? hrefDoItem(item, { missaoAtiva }) : null
        expect(href).not.toBeNull()
        const [caminho, busca = ''] = (href ?? '').split('?')
        expect(resolverEndereco(caminho, busca ? `?${busca}` : '').pagina).toBe(pagina)
      },
    )
  })

  it('páginas de fluxo não marcam item, e os 4 itens principais estão presentes', () => {
    for (const pagina of ['diagnostico', 'revisao', 'treino', 'mesa-de-trabalho', 'nao-encontrada'] as const) {
      expect(itemAtivoDoMenu(pagina)).toBeNull()
    }
    expect(ITENS_MENU.filter((item) => item.grupo === 'principal').map((item) => item.id)).toEqual([
      'inicio',
      'carreira',
      'simulados',
      'painel',
    ])
    expect(ITENS_MENU.every((item) => !item.rotulo.includes('&'))).toBe(true)
  })
})
