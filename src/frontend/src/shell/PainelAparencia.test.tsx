import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextoAnuncioJornada } from '../jornada/navegacao/anuncioJornada'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { paraTodo } from '../testes/propriedade'
import { type ArmazemAparencia, criarArmazemAparencia } from '../tema/armazemAparencia'
import { CATALOGO_TEMAS } from '../tema/catalogo'
import { ID_BLOCO_CONFIGURACAO } from '../tema/configuracaoCliente'
import { criarEnvelope, serializarParaHtml } from '../tema/envelopeConfiguracao'
import { CHAVE_TEMA } from '../tema/persistencia'
import { BotaoAparencia } from './BotaoAparencia'
import { PainelAparencia } from './PainelAparencia'

function novoDocumento(configuracao: string | undefined, tema: string, contraste = false): Document {
  const documento = document.implementation.createHTMLDocument('t')
  documento.documentElement.dataset.theme = tema
  documento.documentElement.classList.toggle('dark', CATALOGO_TEMAS.find((t) => t.id === tema)?.esquema === 'escuro')
  if (contraste) documento.documentElement.setAttribute('data-contraste', 'alto')
  if (configuracao !== undefined) {
    const bloco = documento.createElement('script')
    bloco.type = 'application/json'
    bloco.id = ID_BLOCO_CONFIGURACAO
    bloco.textContent = serializarParaHtml(criarEnvelope(configuracao))
    documento.head.append(bloco)
  }
  return documento
}

function novoArmazem(configuracao?: string, tema = 'operacao', contraste = false) {
  const documento = novoDocumento(configuracao, tema, contraste)
  const armazenamento = criarArmazenamentoFalso()
  const armazem = criarArmazemAparencia({ documento, armazenamento, consultarEsquema: () => null, registrar: () => undefined })
  return { armazem, documento, armazenamento }
}

function painel(armazem: ArmazemAparencia, anunciar: (texto: string) => void = () => undefined) {
  return render(
    <ContextoAnuncioJornada.Provider value={{ anunciar }}>
      <PainelAparencia id="painel-teste" aoAnunciar={anunciar} armazem={armazem} />
    </ContextoAnuncioJornada.Provider>,
  )
}

function botao(armazem: ArmazemAparencia, anunciar: (texto: string) => void = () => undefined) {
  return render(
    <ContextoAnuncioJornada.Provider value={{ anunciar }}>
      <button type="button">Fora</button>
      <BotaoAparencia armazem={armazem} />
    </ContextoAnuncioJornada.Provider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('PainelAparencia no modo livre', () => {
  it('mostra o grupo Tema com os quatro temas na ordem do catálogo e só o ativo marcado', () => {
    const { armazem } = novoArmazem(undefined, 'editorial')
    painel(armazem)
    const grupo = screen.getByRole('group', { name: 'Tema' })
    const opcoes = within(grupo).getAllByRole('radio')
    expect(opcoes.map((opcao) => (opcao as HTMLInputElement).value)).toEqual(['operacao', 'corporativo', 'editorial', 'acolhedor'])
    expect(opcoes.filter((opcao) => (opcao as HTMLInputElement).checked).map((opcao) => (opcao as HTMLInputElement).value)).toEqual(['editorial'])
    const rotulos = Array.from(grupo.querySelectorAll('label')).map((rotulo) => rotulo.textContent)
    expect(rotulos).toEqual(['OperaçãoEscuro', 'CorporativoClaro', 'EditorialEscuro', 'AcolhedorClaro'])
    expect(grupo.querySelectorAll('svg.icone')).toHaveLength(1)
    expect(screen.getByRole('switch', { name: 'Alto contraste' })).not.toBeChecked()
  })

  it('escolher um tema aplica no html, persiste, anuncia uma vez e não move o foco', () => {
    const { armazem, documento, armazenamento } = novoArmazem(undefined, 'operacao')
    const anunciar = vi.fn()
    painel(armazem, anunciar)
    const acolhedor = screen.getByRole('radio', { name: /Acolhedor/ })
    acolhedor.focus()
    fireEvent.click(acolhedor)
    expect(documento.documentElement.dataset.theme).toBe('acolhedor')
    expect(armazenamento.dados.get(CHAVE_TEMA)).toBe('acolhedor')
    expect(anunciar).toHaveBeenCalledTimes(1)
    expect(anunciar).toHaveBeenCalledWith('Tema ativo: Acolhedor')
    expect(acolhedor).toHaveFocus()
    expect(acolhedor).toBeChecked()
  })

  it('o interruptor de alto contraste liga e desliga sem mudar o tema', () => {
    const { armazem, documento } = novoArmazem(undefined, 'corporativo')
    painel(armazem)
    const interruptor = screen.getByRole('switch', { name: 'Alto contraste' })
    fireEvent.click(interruptor)
    expect(interruptor).toBeChecked()
    expect(documento.documentElement.getAttribute('data-contraste')).toBe('alto')
    expect(documento.documentElement.dataset.theme).toBe('corporativo')
    fireEvent.click(interruptor)
    expect(documento.documentElement.hasAttribute('data-contraste')).toBe(false)
  })

  it('não tem emoji e usa só ícones de 16 ou 20 px', () => {
    const { armazem } = novoArmazem(undefined, 'operacao', true)
    const { container } = painel(armazem)
    expect(container.textContent ?? '').not.toMatch(/\p{Extended_Pictographic}/u)
    for (const icone of container.querySelectorAll('svg')) expect(['16', '20']).toContain(icone.getAttribute('width'))
  })
})

describe('PainelAparencia nos modos travado e unico', () => {
  it('travado mostra o tema e a origem, sem rádios', () => {
    const { armazem } = novoArmazem('{"temasPermitidos":["corporativo","acolhedor"],"travado":true}', 'corporativo')
    painel(armazem)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByText('Tema: Corporativo')).toBeInTheDocument()
    expect(screen.getByText('Definido pela empresa cliente')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alto contraste' })).toBeInTheDocument()
  })

  it('unico mostra só o nome do tema, sem rádios', () => {
    const { armazem } = novoArmazem('{"temasPermitidos":["acolhedor"]}', 'acolhedor')
    painel(armazem)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByText('Tema: Acolhedor')).toBeInTheDocument()
    expect(screen.queryByText('Definido pela empresa cliente')).not.toBeInTheDocument()
  })

  it('a lista do cliente limita as opções', () => {
    const { armazem } = novoArmazem('{"temasPermitidos":["acolhedor","corporativo"]}', 'corporativo')
    painel(armazem)
    expect(screen.getAllByRole('radio').map((opcao) => (opcao as HTMLInputElement).value)).toEqual(['corporativo', 'acolhedor'])
  })
})

describe('BotaoAparencia', () => {
  it('aria-expanded e aria-controls só aparecem com o painel aberto', () => {
    const { armazem } = novoArmazem()
    botao(armazem)
    const gatilho = screen.getByRole('button', { name: 'Aparência' })
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
    expect(gatilho).not.toHaveAttribute('aria-controls')
    fireEvent.click(gatilho)
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')
    const id = gatilho.getAttribute('aria-controls')
    expect(id).toBeTruthy()
    expect(document.getElementById(id as string)).toBe(screen.getByRole('region', { name: 'Aparência' }))
  })

  it('Escape fecha o painel e devolve o foco ao botão', () => {
    const { armazem } = novoArmazem()
    botao(armazem)
    const gatilho = screen.getByRole('button', { name: 'Aparência' })
    fireEvent.click(gatilho)
    screen.getByRole('radio', { name: /Editorial/ }).focus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Aparência' })).not.toBeInTheDocument()
    expect(gatilho).toHaveFocus()
  })

  it('o foco que sai para fora do contêiner fecha o painel sem mover o foco', () => {
    const { armazem } = novoArmazem()
    botao(armazem)
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    const radio = screen.getByRole('radio', { name: /Editorial/ })
    radio.focus()
    const fora = screen.getByRole('button', { name: 'Fora' })
    fireEvent.blur(radio, { relatedTarget: fora })
    expect(screen.queryByRole('region', { name: 'Aparência' })).not.toBeInTheDocument()
  })

  it('o foco que fica dentro do contêiner não fecha', () => {
    const { armazem } = novoArmazem()
    botao(armazem)
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    const radio = screen.getByRole('radio', { name: /Editorial/ })
    fireEvent.blur(radio, { relatedTarget: screen.getByRole('switch', { name: 'Alto contraste' }) })
    expect(screen.getByRole('region', { name: 'Aparência' })).toBeInTheDocument()
  })

  it('apontar fora fecha o painel e apontar dentro não', () => {
    const { armazem } = novoArmazem()
    botao(armazem)
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    fireEvent.pointerDown(screen.getByRole('radio', { name: /Editorial/ }))
    expect(screen.getByRole('region', { name: 'Aparência' })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fora' }))
    expect(screen.queryByRole('region', { name: 'Aparência' })).not.toBeInTheDocument()
  })

  it('o tema continua ativo depois de fechar o painel', () => {
    const { armazem, documento } = novoArmazem()
    botao(armazem)
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    fireEvent.click(screen.getByRole('radio', { name: /Editorial/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    expect(screen.queryByRole('region', { name: 'Aparência' })).not.toBeInTheDocument()
    expect(documento.documentElement.dataset.theme).toBe('editorial')
  })
})

describe('acessibilidade do painel (axe)', () => {
  it.each([
    ['livre', undefined, 'operacao'],
    ['travado', '{"temasPermitidos":["corporativo","acolhedor"],"travado":true}', 'corporativo'],
    ['unico', '{"temasPermitidos":["acolhedor"]}', 'acolhedor'],
  ] as const)('modo %s não tem violações', async (_modo, configuracao, tema) => {
    const { armazem } = novoArmazem(configuracao, tema)
    const { container } = botao(armazem)
    fireEvent.click(screen.getByRole('button', { name: 'Aparência' }))
    const resultado = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(resultado.violations.map((violacao) => violacao.id)).toEqual([])
  })
})

// Feature: temas-selecionaveis, Property 16: Renderização do painel de aparência
describe('renderização do painel, propriedade', () => {
  it('reflete modo, opções, tema ativo e contraste para qualquer configuração', () => {
    const ids = CATALOGO_TEMAS.map((tema) => tema.id as string)
    paraTodo(
      'renderização do painel',
      (g) => {
        const lista = Array.from(new Set(g.lista((h) => h.escolher(ids), 5)))
        const permitidos = lista.length === 0 ? ids : lista
        return {
          lista,
          travado: lista.length > 0 && g.inteiro(0, 2) === 0,
          ativo: g.escolher(permitidos),
          contraste: g.inteiro(0, 1) === 1,
        }
      },
      ({ lista, travado, ativo, contraste }) => {
        const configuracao = lista.length === 0 ? undefined : JSON.stringify({ temasPermitidos: lista, travado })
        const { armazem } = novoArmazem(configuracao, ativo, contraste)
        const { unmount } = painel(armazem)
        try {
          const permitidos = lista.length === 0 ? ids : lista
          const esperadosNaOrdem = ids.filter((id) => permitidos.includes(id))
          const chave = screen.getByRole('switch', { name: 'Alto contraste' })
          expect((chave as HTMLInputElement).checked).toBe(contraste)
          if (travado) {
            expect(screen.queryAllByRole('radio')).toHaveLength(0)
            expect(screen.getByText('Definido pela empresa cliente')).toBeInTheDocument()
          } else if (permitidos.length === 1) {
            expect(screen.queryAllByRole('radio')).toHaveLength(0)
            expect(screen.queryByText('Definido pela empresa cliente')).not.toBeInTheDocument()
          } else {
            const grupo = screen.getByRole('group', { name: 'Tema' })
            const radios = within(grupo).getAllByRole('radio') as HTMLInputElement[]
            expect(radios.map((radio) => radio.value)).toEqual(esperadosNaOrdem)
            expect(radios.filter((radio) => radio.checked).map((radio) => radio.value)).toEqual([ativo])
            expect(grupo.querySelectorAll('svg.icone')).toHaveLength(1)
            for (const radio of radios) {
              const tema = CATALOGO_TEMAS.find((candidato) => candidato.id === radio.value)
              expect(radio.closest('label')?.textContent).toBe(`${tema?.nome}${tema?.esquema === 'claro' ? 'Claro' : 'Escuro'}`)
            }
          }
          if (travado || permitidos.length === 1) {
            const nome = CATALOGO_TEMAS.find((candidato) => candidato.id === ativo)?.nome
            expect(screen.getByText(`Tema: ${nome}`)).toBeInTheDocument()
          }
        } finally {
          unmount()
        }
      },
    )
  })
})
