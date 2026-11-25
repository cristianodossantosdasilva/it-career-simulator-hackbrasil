import { describe, expect, it } from 'vitest'
import { paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS, obterTema } from './catalogo.ts'
import { aplicarAparencia, lerAparenciaDoDocumento } from './documento.ts'
import type { EstadoContraste } from './persistencia.ts'

function novaRaiz(): HTMLElement {
  return document.implementation.createHTMLDocument('t').documentElement
}

describe('aplicação no documento, exemplos', () => {
  it('grava tema escuro com a classe dark e sem contraste', () => {
    const raiz = novaRaiz()
    expect(aplicarAparencia(raiz, 'editorial', 'padrao')).toBe('editorial')
    expect(raiz.dataset.theme).toBe('editorial')
    expect(raiz.classList.contains('dark')).toBe(true)
    expect(raiz.hasAttribute('data-contraste')).toBe(false)
  })

  it('tema claro tira a classe dark e alto contraste grava o atributo', () => {
    const raiz = novaRaiz()
    aplicarAparencia(raiz, 'operacao', 'padrao')
    aplicarAparencia(raiz, 'acolhedor', 'alto')
    expect(raiz.classList.contains('dark')).toBe(false)
    expect(raiz.getAttribute('data-contraste')).toBe('alto')
  })

  it('identificador inválido vira corporativo', () => {
    const raiz = novaRaiz()
    expect(aplicarAparencia(raiz, 'sepia', 'padrao')).toBe('corporativo')
    expect(raiz.dataset.theme).toBe('corporativo')
    expect(raiz.classList.contains('dark')).toBe(false)
  })

  it('lê o estado deixado no html', () => {
    const raiz = novaRaiz()
    expect(lerAparenciaDoDocumento(raiz)).toEqual({ tema: null, contraste: 'padrao' })
    aplicarAparencia(raiz, 'corporativo', 'alto')
    expect(lerAparenciaDoDocumento(raiz)).toEqual({ tema: 'corporativo', contraste: 'alto' })
  })
})

// Feature: temas-selecionaveis, Property 5: Aplicação no documento
describe('aplicação no documento, propriedade', () => {
  it('termina com tema, classe dark e contraste do último par e sem atributo style', () => {
    paraTodo(
      'aplicação no documento',
      (g) =>
        g.lista(
          (h) => ({
            tema: h.escolher<string>([...CATALOGO_TEMAS.map((tema) => tema.id), h.texto(10), 'Operacao']),
            contraste: h.escolher<EstadoContraste>(['alto', 'padrao']),
          }),
          10,
        ),
      (sequencia) => {
        const raiz = novaRaiz()
        for (const passo of sequencia) aplicarAparencia(raiz, passo.tema, passo.contraste)
        const ultimo = sequencia[sequencia.length - 1]
        if (ultimo === undefined) return
        const valido = CATALOGO_TEMAS.find((tema) => tema.id === ultimo.tema)
        const esperado = valido === undefined ? 'corporativo' : valido.id
        expect(raiz.dataset.theme).toBe(esperado)
        const classes = raiz.className.split(/\s+/).filter((classe) => classe === 'dark')
        expect(classes).toHaveLength(obterTema(esperado).esquema === 'escuro' ? 1 : 0)
        expect(raiz.getAttribute('data-contraste') === 'alto').toBe(ultimo.contraste === 'alto')
        expect(raiz.hasAttribute('style')).toBe(false)
      },
    )
  })
})
