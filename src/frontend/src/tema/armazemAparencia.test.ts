import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { type Gerador, paraTodo } from '../testes/propriedade'
import { CATALOGO_TEMAS, type IdTema } from './catalogo.ts'
import { ID_BLOCO_CONFIGURACAO } from './configuracaoCliente.ts'
import { criarEnvelope, serializarParaHtml } from './envelopeConfiguracao.ts'
import { criarArmazemAparencia } from './armazemAparencia.ts'
import type { AmbienteAparencia } from './inicializacao.ts'
import { CHAVE_CONTRASTE, CHAVE_TEMA, type ArmazenamentoChaveValor } from './persistencia.ts'
import type { EsquemaNavegador } from './resolvedor.ts'

function novoDocumento(configuracao?: string, tema = 'operacao'): Document {
  const documento = document.implementation.createHTMLDocument('t')
  documento.documentElement.dataset.theme = tema
  documento.documentElement.classList.toggle('dark', CATALOGO_TEMAS.find((t) => t.id === tema)?.esquema === 'escuro')
  if (configuracao !== undefined) {
    const bloco = documento.createElement('script')
    bloco.type = 'application/json'
    bloco.id = ID_BLOCO_CONFIGURACAO
    bloco.textContent = serializarParaHtml(criarEnvelope(configuracao))
    documento.head.append(bloco)
  }
  return documento
}

function ambiente(documento: Document, armazenamento: ArmazenamentoChaveValor | null, esquema: EsquemaNavegador = null): AmbienteAparencia {
  return { documento, armazenamento, consultarEsquema: () => esquema, registrar: () => undefined }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('armazém de aparência, exemplos', () => {
  it('na criação adota o que está no html e não grava nada', () => {
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'corporativo' })
    const documento = novoDocumento(undefined, 'editorial')
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento, 'light'))
    expect(armazem.obter()).toMatchObject({ tema: 'editorial', contraste: 'padrao', modoSeletor: 'livre' })
    expect(armazenamento.gravacoes).toEqual([])
    expect(documento.documentElement.dataset.theme).toBe('editorial')
  })

  it('sem tema permitido no html calcula e aplica, ainda sem gravar no armazenamento', () => {
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'acolhedor' })
    const documento = novoDocumento('{"temasPermitidos":["acolhedor","corporativo"]}', 'operacao')
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento))
    expect(armazem.obter().tema).toBe('acolhedor')
    expect(documento.documentElement.dataset.theme).toBe('acolhedor')
    expect(armazenamento.gravacoes).toEqual([])
  })

  it('com trava, escolherTema devolve false e não muda o html nem o armazenamento', () => {
    const armazenamento = criarArmazenamentoFalso()
    const documento = novoDocumento('{"temasPermitidos":["corporativo","acolhedor"],"travado":true}', 'corporativo')
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento))
    expect(armazem.obter().modoSeletor).toBe('travado')
    expect(armazem.escolherTema('acolhedor')).toBe(false)
    expect(documento.documentElement.dataset.theme).toBe('corporativo')
    expect(armazenamento.gravacoes).toEqual([])
  })

  it('tema fora da lista de permitidos é recusado', () => {
    const documento = novoDocumento('{"temasPermitidos":["corporativo","acolhedor"]}', 'corporativo')
    const armazem = criarArmazemAparencia(ambiente(documento, criarArmazenamentoFalso()))
    expect(armazem.escolherTema('operacao')).toBe(false)
    expect(armazem.obter().tema).toBe('corporativo')
    expect(armazem.obter().temasOferecidos.map((tema) => tema.id)).toEqual(['corporativo', 'acolhedor'])
  })

  it('um só tema permitido vira o modo unico', () => {
    const documento = novoDocumento('{"temasPermitidos":["acolhedor"]}', 'acolhedor')
    expect(criarArmazemAparencia(ambiente(documento, null)).obter().modoSeletor).toBe('unico')
  })

  it('escolher grava no html de forma síncrona, persiste e notifica uma vez; a leitura devolve o mesmo objeto', () => {
    const armazenamento = criarArmazenamentoFalso()
    const documento = novoDocumento()
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento))
    const ouvinte = vi.fn()
    const cancelar = armazem.assinar(ouvinte)
    const antes = armazem.obter()
    expect(armazem.obter()).toBe(antes)
    expect(armazem.escolherTema('editorial')).toBe(true)
    expect(documento.documentElement.dataset.theme).toBe('editorial')
    expect(armazenamento.dados.get(CHAVE_TEMA)).toBe('editorial')
    expect(ouvinte).toHaveBeenCalledTimes(1)
    expect(armazem.obter()).not.toBe(antes)
    cancelar()
    armazem.escolherTema('acolhedor')
    expect(ouvinte).toHaveBeenCalledTimes(1)
  })

  it('contraste não toca no tema nem em itfs_tema', () => {
    const armazenamento = criarArmazenamentoFalso({ [CHAVE_TEMA]: 'editorial' })
    const documento = novoDocumento(undefined, 'editorial')
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento))
    armazem.definirContraste(true)
    expect(documento.documentElement.getAttribute('data-contraste')).toBe('alto')
    expect(documento.documentElement.dataset.theme).toBe('editorial')
    expect(armazenamento.dados.get(CHAVE_TEMA)).toBe('editorial')
    expect(armazenamento.dados.get(CHAVE_CONTRASTE)).toBe('alto')
    armazem.definirContraste(false)
    expect(documento.documentElement.hasAttribute('data-contraste')).toBe(false)
  })

  it('falha de gravação não desfaz o tema aplicado', () => {
    const armazenamento = criarArmazenamentoFalso({}, { falharGravacao: true })
    const documento = novoDocumento()
    const armazem = criarArmazemAparencia(ambiente(documento, armazenamento))
    expect(armazem.escolherTema('acolhedor')).toBe(true)
    expect(documento.documentElement.dataset.theme).toBe('acolhedor')
  })
})

// Feature: temas-selecionaveis, Property 10: Modelo do armazém de aparência
describe('modelo do armazém de aparência, propriedade', () => {
  type Acao = { tipo: 'tema'; id: IdTema } | { tipo: 'contraste'; ativo: boolean }
  const IDS = CATALOGO_TEMAS.map((tema) => tema.id)

  function gerar(g: Gerador) {
    const ids = IDS as readonly string[]
    const lista = g.lista((h) => h.escolher(ids), 4)
    const configuracao =
      g.inteiro(0, 2) === 0
        ? undefined
        : JSON.stringify({ temasPermitidos: lista, travado: g.inteiro(0, 2) === 0 })
    return {
      configuracao,
      funciona: g.inteiro(0, 3) !== 0,
      esquema: g.escolher<EsquemaNavegador>(['light', 'dark', 'no-preference', null]),
      acoes: g.lista<Acao>(
        (h) => (h.inteiro(0, 1) === 0 ? { tipo: 'tema', id: h.escolher(IDS) } : { tipo: 'contraste', ativo: h.inteiro(0, 1) === 1 }),
        12,
      ),
    }
  }

  it('segue o modelo de referência depois de cada ação, sem chamar fetch', () => {
    const fetchProibido = vi.fn(() => {
      throw new Error('fetch nao deve ser chamado')
    })
    vi.stubGlobal('fetch', fetchProibido)
    paraTodo('modelo do armazém', gerar, ({ configuracao, funciona, esquema, acoes }) => {
      const documento = novoDocumento(configuracao, 'operacao')
      const armazenamento = funciona ? criarArmazenamentoFalso() : criarArmazenamentoFalso({}, { falharGravacao: true })
      const armazem = criarArmazemAparencia(ambiente(documento, armazenamento, esquema))
      const oferecidos = armazem.obter().temasOferecidos.map((tema) => tema.id)
      const travado = armazem.obter().modoSeletor === 'travado'
      let temaModelo = armazem.obter().tema
      let contrasteModelo = false
      let ultimoTemaAceito: string | null = null
      let ultimoContraste: string | null = null
      expect(oferecidos).toContain(temaModelo)
      for (const acao of acoes) {
        if (acao.tipo === 'tema') {
          const aceito = armazem.escolherTema(acao.id)
          expect(aceito).toBe(!travado && oferecidos.includes(acao.id))
          if (aceito) {
            temaModelo = acao.id
            ultimoTemaAceito = acao.id
          }
        } else {
          const antes = documento.documentElement.dataset.theme
          armazem.definirContraste(acao.ativo)
          contrasteModelo = acao.ativo
          ultimoContraste = acao.ativo ? 'alto' : 'padrao'
          expect(documento.documentElement.dataset.theme).toBe(antes)
        }
        expect(documento.documentElement.dataset.theme).toBe(temaModelo)
        expect(armazem.obter().tema).toBe(temaModelo)
        expect(documento.documentElement.getAttribute('data-contraste') === 'alto').toBe(contrasteModelo)
        if (funciona) {
          expect(armazenamento.dados.get(CHAVE_TEMA) ?? null).toBe(ultimoTemaAceito)
          expect(armazenamento.dados.get(CHAVE_CONTRASTE) ?? null).toBe(ultimoContraste)
        }
      }
      expect(fetchProibido).not.toHaveBeenCalled()
    })
  })
})
