import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

/**
 * Base de medição de contraste e contorno (ciclo 2, E1).
 *
 * Mede, sem corrigir nada:
 * - texto: regra color-contrast do axe-core, injetada no navegador real (o jsdom não calcula cor);
 * - contorno de containers, divisores e controles: cor da borda contra o fundo opaco efetivo;
 * - foco: cor do anel contra o fundo;
 * - hover: amostra de controles e linhas com o mouse sobre o elemento;
 * - informativas: rolagem horizontal, alvos menores que 44 px e texto menor que 12 px.
 *
 * Tudo que não pode ser calculado (gradiente, opacidade, pseudo-elemento, oculto, controle nativo)
 * vai para a lista de "não calculáveis" com o motivo.
 */

export const CAMINHO_AXE = fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url))

export const LIMIARES = {
  texto: 4.5,
  textoGrande: 3,
  controleEFoco: 3,
  container: 2,
  divisorCorporate: 1.4,
} as const

export type Estado = 'limpo' | 'modo de demonstração ativo' | 'missão iniciada' | 'turno concluído'

export interface MetaCelula {
  projeto: string
  tema: string
  viewport: { largura: number; altura: number }
  tela: string
  estado: Estado
}

export interface ResultadoCelula extends MetaCelula {
  status: 'medida' | 'não calculável'
  motivo?: string
  tokens?: unknown
  texto?: {
    violacoes: unknown[]
    incompletas: unknown[]
    passes: number
    hover: { violacoes: unknown[]; incompletas: unknown[]; passes: number }
  }
  contornos?: unknown[]
  foco?: unknown[]
  hover?: unknown[]
  naoCalculaveis?: unknown[]
  informativas?: unknown
}

/** Instala as funções de medição em window.__ct. Executa uma vez por página. */
async function instalarAuxiliares(page: Page) {
  await page.evaluate(() => {
    const ct: Record<string, any> = {}

    ct.parse = (valor: string) => {
      if (!valor) return null
      const s = valor.trim()
      if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
      const rgb = s.match(/^rgba?\(([^)]+)\)$/)
      if (rgb) {
        const p = rgb[1].split(/[\s,/]+/).filter(Boolean)
        const num = (x: string) => (x.endsWith('%') ? (parseFloat(x) * 255) / 100 : parseFloat(x))
        const alfa = p.length > 3 ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1
        return { r: num(p[0]), g: num(p[1]), b: num(p[2]), a: alfa }
      }
      const srgb = s.match(/^color\(srgb\s+([^)]+)\)$/)
      if (srgb) {
        const p = srgb[1].split(/[\s/]+/).filter(Boolean)
        return { r: parseFloat(p[0]) * 255, g: parseFloat(p[1]) * 255, b: parseFloat(p[2]) * 255, a: p.length > 3 ? parseFloat(p[3]) : 1 }
      }
      return null
    }

    ct.hex = (c: { r: number; g: number; b: number }) =>
      '#' + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()

    ct.lum = (c: { r: number; g: number; b: number }) => {
      const f = (x: number) => {
        const v = x / 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
    }

    ct.ratio = (a: any, b: any) => {
      const la = ct.lum(a)
      const lb = ct.lum(b)
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
    }

    ct.compor = (topo: any, base: any) => ({
      r: topo.r * topo.a + base.r * (1 - topo.a),
      g: topo.g * topo.a + base.g * (1 - topo.a),
      b: topo.b * topo.a + base.b * (1 - topo.a),
      a: 1,
    })

    ct.desc = (el: Element) => {
      let s = el.tagName.toLowerCase()
      if (el.id) s += '#' + el.id
      const classes = Array.from(el.classList).slice(0, 3)
      if (classes.length > 0) s += '.' + classes.join('.')
      const tipo = el.getAttribute('type')
      if (s.startsWith('input') ? Boolean(tipo) : false) s += '[type=' + tipo + ']'
      const papel = el.getAttribute('role')
      if (papel) s += '[role=' + papel + ']'
      return s
    }

    ct.visivel = (el: Element) => {
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return false
      const anyEl = el as any
      if (typeof anyEl.checkVisibility === 'function') {
        return anyEl.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      }
      return getComputedStyle(el).visibility !== 'hidden'
    }

    /** Fundo opaco efetivo: percorre os ancestrais compondo camadas translúcidas. */
    ct.fundo = (el: Element | null) => {
      const camadas: any[] = []
      let n: Element | null = el
      while (n) {
        const cs = getComputedStyle(n)
        if (parseFloat(cs.opacity) < 1) return { motivo: 'opacidade menor que 1 em ' + ct.desc(n) }
        if (cs.backgroundImage !== 'none') return { motivo: 'imagem ou gradiente de fundo em ' + ct.desc(n) }
        const c = ct.parse(cs.backgroundColor)
        if (!c) return { motivo: 'formato de cor não suportado: ' + cs.backgroundColor }
        if (c.a > 0) {
          camadas.push(c)
          if (c.a >= 1) break
        }
        n = n.parentElement
      }
      let base = { r: 255, g: 255, b: 255, a: 1 }
      if ((camadas.at(-1)?.a ?? 0) >= 1) base = camadas.pop()
      for (let i = camadas.length - 1; i >= 0; i--) base = ct.compor(camadas[i], base)
      return { cor: base }
    }

    ct.tokens = () => {
      const raiz = getComputedStyle(document.documentElement)
      const ler = (nome: string) => {
        const c = ct.parse(raiz.getPropertyValue(nome).trim()) || ct.parseHex(raiz.getPropertyValue(nome).trim())
        return c ? ct.hex(c) : null
      }
      return {
        fundos: {
          surface: ler('--bg-surface'),
          canvas: ler('--bg-canvas'),
          elevated: ler('--bg-elevated'),
          hover: ler('--bg-hover'),
        },
        bordas: {
          'border-subtle': ler('--border-subtle'),
          'border-strong': ler('--border-strong'),
          'border-control': ler('--border-control'),
          'focus-ring': ler('--focus-ring'),
        },
        textos: {
          'text-primary': ler('--text-primary'),
          'text-secondary': ler('--text-secondary'),
          'text-muted': ler('--text-muted'),
          'accent-text': ler('--accent-text'),
        },
      }
    }
    ct.parseHex = (s: string) => {
      const m = s.match(/^#([0-9a-fA-F]{6})$/)
      if (!m) return null
      const n = parseInt(m[1], 16)
      return { r: (n >> 16) % 256, g: (n >> 8) % 256, b: n % 256, a: 1 }
    }
    ct.nomeToken = (cor: any, grupo: Record<string, string | null>) => {
      const h = ct.hex(cor)
      for (const [nome, valor] of Object.entries(grupo)) if (valor === h) return nome
      return 'outro'
    }

    const arred = (x: number) => Math.round(x * 100) / 100

    /** Limiar por papel, tema e fundo externo. null = só informativo. */
    ct.limiar = (papel: string, tema: string, fundo: string) => {
      const base = fundo === 'surface' || fundo === 'canvas'
      if (papel === 'container') return base ? { valor: 2, regra: 'contorno de container 2,0:1 sobre surface e canvas' } : null
      if (papel === 'divisor') {
        if (!base) return null
        if (tema === 'corporate') return { valor: 1.4, regra: 'divisor 1,4:1 no corporate' }
        return { valor: fundo === 'surface' ? 1.72 : 1.82, regra: 'divisor tactical sem regressão (1,72 surface, 1,82 canvas)' }
      }
      if (papel === 'controle' || papel === 'foco') {
        return fundo === 'outro' || fundo === 'hover'
          ? { valor: 3, regra: 'controle e foco 3:1 (fundo ' + fundo + ', registrado)' }
          : { valor: 3, regra: 'controle e foco 3:1' }
      }
      return null
    }

    const LADOS = ['Top', 'Right', 'Bottom', 'Left']
    ct.ladoBorda = (cs: CSSStyleDeclaration) => {
      for (const lado of LADOS) {
        const largura = parseFloat((cs as any)['border' + lado + 'Width'])
        const estilo = (cs as any)['border' + lado + 'Style']
        if (largura > 0 ? !['none', 'hidden'].includes(estilo) : false) {
          return { lado: lado.toLowerCase(), cor: (cs as any)['border' + lado + 'Color'] as string, largura }
        }
      }
      return null
    }

    /** Mede um elemento: devolve { linha } ou { nc } (não calculável com motivo). */
    ct.medirElemento = (el: Element, papel: string, tema: string, interacao: string, tokens: any) => {
      const seletor = el.tagName === 'TH' || el.tagName === 'TD'
        ? ct.desc(el.closest('table') || el) + ' > ' + ct.desc(el)
        : ct.desc(el)
      const nc = (motivo: string) => ({ nc: { papel, seletor, motivo, interacao } })
      if (!ct.visivel(el)) return nc('oculto (display, visibility, opacidade 0 ou tamanho zero)')
      const cs = getComputedStyle(el)
      const tipo = (el.getAttribute('type') || '').toLowerCase()
      if (papel === 'controle') {
        if ((el as any).disabled) return nc('desabilitado (isento de contraste)')
        if (['radio', 'checkbox', 'file', 'range', 'color'].includes(tipo)) {
          return nc('controle nativo (' + tipo + '), borda e preenchimento não calculáveis pelo estilo computado')
        }
      }
      const ext = ct.fundo(el.parentElement)
      if (!ext.cor) return nc(ext.motivo)
      const lado = ct.ladoBorda(cs)
      let corBorda: any = null
      if (lado) {
        corBorda = ct.parse(lado.cor)
        if (!corBorda) return nc('formato de cor de borda não suportado: ' + lado.cor)
      }
      const propria = ct.parse(cs.backgroundColor)
      const preenchimentoVisivel = (propria?.a ?? 0) > 0 ? cs.backgroundImage === 'none' : false
      const bordaVisivel = (corBorda?.a ?? 0) > 0
      if ([papel === 'controle', !bordaVisivel, !preenchimentoVisivel].every(Boolean)) {
        return nc('sem borda nem preenchimento próprios (identificado por texto ou ícone)')
      }
      if ([papel !== 'controle', !bordaVisivel].every(Boolean)) {
        return nc(lado ? 'borda transparente' : 'sem borda computada (largura 0)')
      }
      let razaoBorda: number | null = null
      let razaoInterna: number | null = null
      if (bordaVisivel) {
        const corReal = corBorda.a < 1 ? ct.compor(corBorda, ext.cor) : corBorda
        razaoBorda = ct.ratio(corReal, ext.cor)
        const int = ct.fundo(el)
        if (int.cor) razaoInterna = ct.ratio(corReal, int.cor)
      }
      let razaoPreenchimento: number | null = null
      if (preenchimentoVisivel) {
        const fill = propria.a < 1 ? ct.compor(propria, ext.cor) : propria
        razaoPreenchimento = ct.ratio(fill, ext.cor)
      }
      const fundoNome = ct.nomeToken(ext.cor, tokens.fundos)
      const lim = ct.limiar(papel, tema, fundoNome)
      const melhor = Math.max(razaoBorda ?? 0, papel === 'controle' ? razaoPreenchimento ?? 0 : 0)
      const corBordaReal = bordaVisivel ? (corBorda.a < 1 ? ct.compor(corBorda, ext.cor) : corBorda) : null
      const corBordaHex = corBordaReal ? ct.hex(corBordaReal) : null
      // Controle só com preenchimento (sem borda): identificado pelo texto, o limiar de 3:1 não se aplica.
      const soPreenchimento = [papel === 'controle', !bordaVisivel].every(Boolean)
      return {
        linha: {
          papel,
          seletor,
          interacao,
          lado: bordaVisivel ? lado.lado : null,
          token_borda: corBordaReal ? ct.nomeToken(corBordaReal, tokens.bordas) : null,
          cor_borda: corBordaHex,
          cor_fundo_externo: ct.hex(ext.cor),
          token_fundo_externo: fundoNome,
          cor_preenchimento: preenchimentoVisivel ? ct.hex(propria.a < 1 ? ct.compor(propria, ext.cor) : propria) : null,
          razao: razaoBorda === null ? null : arred(razaoBorda),
          razao_interna: razaoInterna === null ? null : arred(razaoInterna),
          razao_preenchimento: razaoPreenchimento === null ? null : arred(razaoPreenchimento),
          limiar: soPreenchimento ? null : lim ? lim.valor : null,
          regra: soPreenchimento
            ? 'controle só com preenchimento, sem borda: informativo'
            : lim ? lim.regra : 'informativo (fundo ' + fundoNome + ')',
          atende: soPreenchimento ? null : lim ? melhor >= lim.valor : null,
          ocorrencias: 1,
        },
      }
    }

    ct.papeis = [
      ['container', '.edu-card, .panel, .glossary-details, .card-section, table, .painel-bloco, .step-box, .chat, .chat-log, .passo-jornada, .estado-vazio, .resposta-checkin-rapido, .escala, .grupo-vertente, .cartao-missao, .convite-copiloto, .opcoes-avancadas, .indicacao-checkin, .demonstracao-checkin, .cartao-embarque, .breve-piloto, .registro-voo, .resumo-local, .rota-hangar, .papel-comandante'],
      ['divisor', 'table th, table td, .itsm-nota'],
      ['controle', 'button, input:not([type=hidden]), select, textarea, summary'],
    ]

    ct.contornos = (tema: string) => {
      const tokens = ct.tokens()
      const mapa = new Map<string, any>()
      const ncs = new Map<string, any>()
      for (const [papel, seletor] of ct.papeis) {
        for (const el of Array.from(document.querySelectorAll(seletor))) {
          const r = ct.medirElemento(el, papel, tema, 'estatico', tokens)
          if (r.linha) {
            const l = r.linha
            const chave = [l.papel, l.seletor, l.lado, l.cor_borda, l.cor_fundo_externo, l.cor_preenchimento].join('|')
            const existente = mapa.get(chave)
            if (existente) existente.ocorrencias += 1
            else mapa.set(chave, l)
          } else {
            const chave = [r.nc.papel, r.nc.seletor, r.nc.motivo].join('|')
            const existente = ncs.get(chave)
            if (existente) existente.ocorrencias += 1
            else ncs.set(chave, { ...r.nc, ocorrencias: 1 })
          }
        }
      }
      return { linhas: Array.from(mapa.values()), naoCalculaveis: Array.from(ncs.values()) }
    }

    /** Conteúdo da tela antes da casca (trilho, barra de contexto), para a amostra cobrir a tela e não só a navegação. */
    ct.conteudoPrimeiro = (lista: Element[]) => {
      const casca = (el: Element) => (el.closest('.shell-rail, .barra-contexto, nav, a.skip') ? 1 : 0)
      return lista
        .map((el, i) => ({ el, i }))
        .sort((a, b) => casca(a.el) - casca(b.el) || a.i - b.i)
        .map((x) => x.el)
    }

    ct.focoSeletor =
      'button, a[href], input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"])'

    ct.foco = (tema: string, limite: number) => {
      const tokens = ct.tokens()
      const vistos = new Set<string>()
      const linhas: any[] = []
      const ncs: any[] = []
      for (const el of ct.conteudoPrimeiro(Array.from(document.querySelectorAll(ct.focoSeletor))) as HTMLElement[]) {
        if (linhas.length + ncs.length >= limite) break
        const sel = ct.desc(el)
        if (vistos.has(sel)) continue
        if (!ct.visivel(el) || (el as any).disabled) continue
        vistos.add(sel)
        el.focus({ preventScroll: true })
        if (document.activeElement !== el) {
          ncs.push({ papel: 'foco', seletor: sel, motivo: 'elemento não recebeu foco programático', interacao: 'foco' })
          continue
        }
        const cs = getComputedStyle(el)
        const ext = ct.fundo(el.parentElement)
        const larg = parseFloat(cs.outlineWidth)
        if (!el.matches(':focus-visible')) {
          ncs.push({ papel: 'foco', seletor: sel, motivo: ':focus-visible não ativado pelo foco programático', interacao: 'foco' })
        } else if (!ext.cor) {
          ncs.push({ papel: 'foco', seletor: sel, motivo: ext.motivo, interacao: 'foco' })
        } else if (cs.outlineStyle === 'none' || !(larg > 0)) {
          if (cs.boxShadow !== 'none') {
            ncs.push({ papel: 'foco', seletor: sel, motivo: 'foco indicado por box-shadow, cor não medida', interacao: 'foco' })
          } else {
            linhas.push({
              papel: 'foco', seletor: sel, interacao: 'foco', cor_anel: null, cor_fundo_externo: ct.hex(ext.cor),
              token_fundo_externo: ct.nomeToken(ext.cor, tokens.fundos), razao: 0, limiar: 3, atende: false,
              regra: 'sem indicador de foco detectado', ocorrencias: 1,
            })
          }
        } else {
          const anel = ct.parse(cs.outlineColor)
          if (!anel) {
            ncs.push({ papel: 'foco', seletor: sel, motivo: 'formato de cor do anel não suportado: ' + cs.outlineColor, interacao: 'foco' })
          } else {
            const real = anel.a < 1 ? ct.compor(anel, ext.cor) : anel
            const r = ct.ratio(real, ext.cor)
            linhas.push({
              papel: 'foco', seletor: sel, interacao: 'foco', cor_anel: ct.hex(real), largura_anel: larg,
              deslocamento_anel: cs.outlineOffset, cor_fundo_externo: ct.hex(ext.cor),
              token_fundo_externo: ct.nomeToken(ext.cor, tokens.fundos), razao: arred(r), limiar: 3, atende: r >= 3,
              regra: 'controle e foco 3:1', ocorrencias: 1,
            })
          }
        }
        el.blur()
      }
      return { linhas, naoCalculaveis: ncs }
    }

    /** Marca candidatos a hover e devolve a quantidade. */
    ct.marcarHover = (limite: number) => {
      for (const el of Array.from(document.querySelectorAll('[data-ct-h]'))) el.removeAttribute('data-ct-h')
      const vistos = new Set<string>()
      let i = 0
      const candidatos = document.querySelectorAll(
        'button:not(:disabled), a[href]:not(.skip), summary, tbody tr, [role=tab], input:not([type=hidden]):not(:disabled), select, textarea',
      )
      for (const el of ct.conteudoPrimeiro(Array.from(candidatos))) {
        if (i >= limite) break
        const sel = ct.desc(el)
        if (vistos.has(sel) || !ct.visivel(el)) continue
        vistos.add(sel)
        el.setAttribute('data-ct-h', String(i))
        i += 1
      }
      return i
    }

    ct.medirHover = (indice: number, tema: string) => {
      const el = document.querySelector('[data-ct-h="' + indice + '"]')
      if (!el) return { motivo: 'candidato removido da página' }
      const tokens = ct.tokens()
      const divisor = el.matches('tr, th, td')
      const papel = divisor ? 'divisor' : 'controle'
      const r = ct.medirElemento(el, papel, tema, 'hover', tokens)
      const fundoProprio = ct.fundo(el)
      return {
        linha: r.linha || null,
        nc: r.nc || null,
        fundo_hover: fundoProprio.cor ? ct.hex(fundoProprio.cor) : null,
        token_fundo_hover: fundoProprio.cor ? ct.nomeToken(fundoProprio.cor, tokens.fundos) : null,
      }
    }

    const MOTIVOS: Record<string, string> = {
      bgImage: 'imagem ou gradiente de fundo',
      bgGradient: 'gradiente de fundo',
      bgOverlap: 'sobreposição por outro elemento',
      fgAlpha: 'cor do texto com transparência',
      elmPartiallyObscured: 'elemento parcialmente coberto',
      elmPartiallyObscuring: 'elemento cobre outro elemento',
      outsideViewport: 'fora da área visível',
      equalRatio: 'texto e fundo com a mesma cor',
      shortTextContent: 'texto curto demais para avaliar',
      nonBgColor: 'fundo não determinável',
      pseudoContent: 'conteúdo de pseudo-elemento',
    }

    ct.axe = async (escopo: string | null) => {
      const alvo = escopo ? document.querySelector(escopo) : document
      const axe = (window as any).axe
      const r = await axe.run(alvo, {
        runOnly: { type: 'rule', values: ['color-contrast'] },
        resultTypes: ['violations', 'incomplete', 'passes'],
      })
      const dado = (no: any) => no.any?.[0]?.data ?? {}
      const alvoTxt = (no: any) => (Array.isArray(no.target) ? no.target.flat().join(' ') : String(no.target))
      const violacoes: any[] = []
      const incompletas: any[] = []
      for (const v of r.violations) {
        for (const no of v.nodes) {
          const d = dado(no)
          violacoes.push({
            seletor: alvoTxt(no), cor_texto: d.fgColor || null, cor_fundo: d.bgColor || null,
            razao: typeof d.contrastRatio === 'number' ? arred(d.contrastRatio) : null,
            esperado: d.expectedContrastRatio || null, tamanho: d.fontSize || null, peso: d.fontWeight || null,
            trecho: String(no.html).slice(0, 140),
          })
        }
      }
      for (const v of r.incomplete) {
        for (const no of v.nodes) {
          const d = dado(no)
          const chave = d.messageKey || 'indeterminado'
          incompletas.push({
            seletor: alvoTxt(no), motivo: MOTIVOS[chave] || 'indeterminado (' + chave + ')', chave,
            cor_texto: d.fgColor || null, cor_fundo: d.bgColor || null,
          })
        }
      }
      let passes = 0
      for (const p of r.passes) passes += p.nodes.length
      return { violacoes, incompletas, passes }
    }

    ct.informativas = () => {
      const alvos: string[] = []
      let totalAlvos = 0
      for (const el of Array.from(document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, summary, [role=tab]'))) {
        if (!ct.visivel(el) || (el as any).disabled) continue
        let r = el.getBoundingClientRect()
        // Link Pular: fica fora da tela ate receber foco, entao o alvo real e o do estado focado.
        if (el.matches('a.skip') && r.right < 0) {
          const anterior = document.activeElement as HTMLElement | null
          ;(el as HTMLElement).focus()
          r = el.getBoundingClientRect()
          ;(el as HTMLElement).blur()
          if (anterior && anterior !== document.body) anterior.focus()
        }
        // input de arquivo oculto de forma acessivel: o alvo de toque e o rotulo visivel associado.
        if (el instanceof HTMLInputElement && el.type === 'file') {
          const rotulos = Array.from(el.labels || [])
          if (rotulos.length > 0 && rotulos.some(l => ct.visivel(l) && l.getBoundingClientRect().width >= 44 && l.getBoundingClientRect().height >= 44)) continue
        }
        if (r.width < 44 || r.height < 44) {
          totalAlvos += 1
          if (alvos.length < 12) alvos.push(ct.desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
        }
      }
      const pequenos: string[] = []
      let totalPequenos = 0
      const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const contados = new Set<Element>()
      while (andador.nextNode()) {
        const no = andador.currentNode
        const pai = no.parentElement
        if (!pai || contados.has(pai) || !(no.textContent || '').trim()) continue
        contados.add(pai)
        if (!ct.visivel(pai)) continue
        const tam = parseFloat(getComputedStyle(pai).fontSize)
        if (tam < 12) {
          totalPequenos += 1
          if (pequenos.length < 12) pequenos.push(ct.desc(pai) + ' ' + tam + 'px')
        }
      }
      return {
        rolagem_horizontal: document.documentElement.scrollWidth > window.innerWidth,
        largura_conteudo: document.documentElement.scrollWidth,
        alvos_menores_44: totalAlvos,
        exemplos_alvos: alvos,
        texto_menor_12px: totalPequenos,
        exemplos_texto: pequenos,
      }
    }

    ;(window as any).__ct = ct
  })
}

async function prepararPagina(page: Page) {
  const instalado = await page.evaluate(() => Boolean((window as any).axe ? (window as any).__ct : null))
  if (instalado) return
  if (!existsSync(CAMINHO_AXE)) throw new Error(`axe-core não encontrado em ${CAMINHO_AXE}`)
  const axeCarregado = await page.evaluate(() => Boolean((window as any).axe))
  if (!axeCarregado) await page.addScriptTag({ path: CAMINHO_AXE })
  // Sem transições: o computed style de hover e foco é lido já no valor final.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  })
  await instalarAuxiliares(page)
}

async function ociosa(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(-10, -10)
  await page.evaluate(() => {
    const ativo = document.activeElement
    if (ativo instanceof HTMLElement) ativo.blur()
    window.scrollTo(0, 0)
  })
}

const LIMITE_FOCO = 12
const LIMITE_HOVER = 6

/** Mede uma tela já aberta. Reutiliza a página (sem novas requisições além da navegação). */
export async function medirCelula(page: Page, meta: MetaCelula): Promise<ResultadoCelula> {
  await prepararPagina(page)
  await ociosa(page)

  const texto = await page.evaluate(() => (window as any).__ct.axe(null))
  const estatico = await page.evaluate((tema) => (window as any).__ct.contornos(tema), meta.tema)
  const informativas = await page.evaluate(() => (window as any).__ct.informativas())

  // O teclado precisa ter sido usado para que :focus-visible case com foco programático.
  await page.keyboard.press('Shift')
  const foco = await page.evaluate(([tema, limite]) => (window as any).__ct.foco(tema, limite), [meta.tema, LIMITE_FOCO] as const)
  await ociosa(page)

  const total = await page.evaluate((limite) => (window as any).__ct.marcarHover(limite), LIMITE_HOVER)
  const hoverLinhas: any[] = []
  const hoverNc: any[] = []
  const hoverTexto = { violacoes: [] as any[], incompletas: [] as any[], passes: 0 }
  for (let i = 0; i < total; i++) {
    try {
      await page.locator(`[data-ct-h="${i}"]`).hover({ timeout: 3000 })
    } catch {
      hoverNc.push({ papel: 'hover', seletor: `candidato ${i}`, motivo: 'elemento não recebeu hover (coberto ou fora da tela)', interacao: 'hover', ocorrencias: 1 })
      continue
    }
    const medida = await page.evaluate(([indice, tema]) => (window as any).__ct.medirHover(indice, tema), [i, meta.tema] as const)
    if (medida.linha) hoverLinhas.push({ ...medida.linha, fundo_hover: medida.fundo_hover, token_fundo_hover: medida.token_fundo_hover })
    if (medida.nc) hoverNc.push({ ...medida.nc, ocorrencias: 1 })
    const t = await page.evaluate((indice) => (window as any).__ct.axe(`[data-ct-h="${indice}"]`), i)
    hoverTexto.violacoes.push(...t.violacoes.map((v: any) => ({ ...v, interacao: 'hover' })))
    hoverTexto.incompletas.push(...t.incompletas.map((v: any) => ({ ...v, interacao: 'hover' })))
    hoverTexto.passes += t.passes
  }
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('[data-ct-h]'))) el.removeAttribute('data-ct-h')
  })
  await ociosa(page)

  return {
    ...meta,
    status: 'medida',
    tokens: await page.evaluate(() => (window as any).__ct.tokens()),
    texto: { ...texto, hover: hoverTexto },
    contornos: estatico.linhas,
    foco: foco.linhas,
    hover: hoverLinhas,
    naoCalculaveis: [...estatico.naoCalculaveis, ...foco.naoCalculaveis, ...hoverNc],
    informativas,
  }
}

export function celulaNaoCalculavel(meta: MetaCelula, motivo: string): ResultadoCelula {
  return { ...meta, status: 'não calculável', motivo }
}

export function gravarJson(caminho: string, dados: unknown) {
  mkdirSync(dirname(caminho), { recursive: true })
  writeFileSync(caminho, JSON.stringify(dados, null, 1), 'utf8')
}
