import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { type Gerador, paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS } from './catalogo.ts'
import { ID_BLOCO_CONFIGURACAO } from './configuracaoCliente.ts'
import { criarEnvelope, serializarParaHtml } from './envelopeConfiguracao.ts'
import { type AmbienteAparencia, calcularAparencia, inicializarAparencia } from './inicializacao.ts'
import { CHAVE_CONTRASTE, CHAVE_TEMA, type ArmazenamentoChaveValor } from './persistencia.ts'
import type { EsquemaNavegador } from './resolvedor.ts'

function novoDocumento(configuracao?: string): Document {
  const documento = document.implementation.createHTMLDocument('t')
  documento.documentElement.dataset.theme = 'operacao'
  documento.documentElement.classList.add('dark')
  if (configuracao !== undefined) {
    const bloco = documento.createElement('script')
    bloco.type = 'application/json'
    bloco.id = ID_BLOCO_CONFIGURACAO
    bloco.textContent = serializarParaHtml(criarEnvelope(configuracao))
    documento.head.append(bloco)
  }
  return documento
}

function ambiente(
  documento: Document,
  armazenamento: ArmazenamentoChaveValor | null,
  esquema: EsquemaNavegador = null,
  avisos: string[] = [],
): AmbienteAparencia {
  return { documento, armazenamento, consultarEsquema: () => esquema, registrar: (m) => avisos.push(m) }
}

describe('inicialização da aparência, exemplos', () => {
  it('sem bloco de configuração não avisa e usa o esquema do navegador', () => {
    const avisos: string[] = []
    const documento = novoDocumento()
    const estado = inicializarAparencia(ambiente(documento, criarArmazenamentoFalso(), 'light', avisos))
    expect(estado?.tema).toBe('corporativo')
    expect(documento.documentElement.dataset.theme).toBe('corporativo')
    expect(documento.documentElement.classList.contains('dark')).toBe(false)
    expect(avisos).toEqual([])
  })

  it('lê o bloco do documento antes do resolvedor e a trava vence a preferência', () => {
    const documento = novoDocumento('{"temasPermitidos":["acolhedor","corporativo"],"travado":true}')
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'corporativo' })
    const estado = inicializarAparencia(ambiente(documento, armazenamento, 'dark'))
    expect(estado?.tema).toBe('acolhedor')
  })

  it('aplica o contraste salvo sem tocar no tema', () => {
    const documento = novoDocumento()
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'editorial', [CHAVE_CONTRASTE]: 'alto' })
    inicializarAparencia(ambiente(documento, armazenamento))
    expect(documento.documentElement.dataset.theme).toBe('editorial')
    expect(documento.documentElement.getAttribute('data-contraste')).toBe('alto')
  })

  it('calcularAparencia não grava nada', () => {
    const documento = novoDocumento()
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'acolhedor' })
    calcularAparencia(ambiente(documento, armazenamento))
    expect(armazenamento.gravacoes).toEqual([])
    expect(documento.documentElement.dataset.theme).toBe('operacao')
  })

  it('não deixa atributo style no html', () => {
    const documento = novoDocumento()
    inicializarAparencia(ambiente(documento, criarArmazenamentoFalso(), 'light'))
    expect(documento.documentElement.hasAttribute('style')).toBe(false)
  })

  it('exceção interna mantém os atributos do index.html e devolve null', () => {
    const documento = novoDocumento()
    const quebrado: AmbienteAparencia = {
      documento,
      armazenamento: null,
      consultarEsquema: () => {
        throw new Error('sem matchMedia')
      },
      registrar: () => undefined,
    }
    expect(inicializarAparencia(quebrado)).toBeNull()
    expect(documento.documentElement.dataset.theme).toBe('operacao')
    expect(documento.documentElement.classList.contains('dark')).toBe(true)
  })
})

// Feature: temas-selecionaveis, Property 13: Inicialização com armazenamento indisponível
describe('inicialização sem armazenamento, propriedade', () => {
  function gerarConfiguracao(g: Gerador): string | undefined {
    if (g.inteiro(0, 2) === 0) return undefined
    const ids = CATALOGO_TEMAS.map((tema) => tema.id as string)
    return JSON.stringify({ temasPermitidos: g.lista((h) => h.escolher(ids), 4), travado: g.inteiro(0, 1) === 1 })
  }

  it('não lança exceção, deixa o contraste em padrao e aplica o mesmo tema que com armazenamento vazio', () => {
    paraTodo(
      'armazenamento indisponível',
      (g) => ({
        configuracao: gerarConfiguracao(g),
        esquema: g.escolher<EsquemaNavegador>(['light', 'dark', 'no-preference', null]),
        modo: g.escolher(['nulo', 'leitura-falha'] as const),
      }),
      ({ configuracao, esquema, modo }) => {
        const referencia = novoDocumento(configuracao)
        inicializarAparencia(ambiente(referencia, criarArmazenamentoFalso(), esquema))
        const documento = novoDocumento(configuracao)
        const armazenamento = modo === 'nulo' ? null : criarArmazenamentoFalso({}, { falharLeitura: true, falharGravacao: true })
        expect(() => inicializarAparencia(ambiente(documento, armazenamento, esquema))).not.toThrow()
        expect(documento.documentElement.dataset.theme).toBe(referencia.documentElement.dataset.theme)
        expect(documento.documentElement.hasAttribute('data-contraste')).toBe(false)
      },
    )
  })
})
