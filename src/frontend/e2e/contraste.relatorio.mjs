// Gera a linha de base de contraste e contorno dos temas a partir dos JSON gravados por
// e2e/contraste.spec.ts em test-results/contraste/ (um por projeto, tema, contraste e grupo).
//
// Uso (na pasta src/frontend, depois de uma rodada do Playwright):
//   node e2e/contraste.relatorio.mjs
//
// Arquivos gerados: docs/auditoria-ui-ux/temas/LINHA_DE_BASE_TEMAS.md e LINHA_DE_BASE_TEMAS.json.
// O script não mede nada. Só consolida o que a spec gravou.

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CATALOGO_TEMAS } from '../src/tema/catalogo.ts'

const ENTRADA = fileURLToPath(new URL('../test-results/contraste/', import.meta.url))
const DESTINO = fileURLToPath(new URL('../../../docs/auditoria-ui-ux/temas/', import.meta.url))
const E_COMERCIAL = String.fromCharCode(38)

const ORDEM_VIEWPORT = [375, 768, 1280, 1440]
const ORDEM_ID_TEMA = CATALOGO_TEMAS.map((tema) => tema.id)
const ORDEM_CONTRASTE = ['padrao', 'alto']
/** Rótulo de coluna: tema e contraste. Todas as agregações abaixo agrupam por esse rótulo. */
const rotuloTema = (id, contraste) => `${id} (${contraste})`
const idDoRotulo = (rotulo) => rotulo.split(' ')[0]
const altoDoRotulo = (rotulo) => rotulo.endsWith('(alto)')
const FUNDOS = ['surface', 'canvas', 'elevated', 'hover']

function lerJson(caminho) {
  return JSON.parse(readFileSync(caminho, 'utf8'))
}

function limpar(texto) {
  return String(texto).split(E_COMERCIAL).join(' e ')
}

function arred(x) {
  return Math.round(x * 100) / 100
}

function fmt(x) {
  return x === null || x === undefined ? '-' : String(x).replace('.', ',')
}

function celula(texto) {
  return limpar(texto).replaceAll('|', '/').replaceAll('\n', ' ')
}

// ---------- leitura ----------
if (!existsSync(ENTRADA)) {
  console.error(`Pasta ${ENTRADA} não existe. Rode a spec antes.`)
  process.exit(1)
}
const arquivos = readdirSync(ENTRADA).filter((f) => f.endsWith('.json')).sort()
if (arquivos.length === 0) {
  console.error('Nenhum JSON de medição encontrado.')
  process.exit(1)
}
const entradas = arquivos.map((f) => ({ arquivo: f, ...lerJson(ENTRADA + f) }))
const celulas = entradas.flatMap((e) =>
  e.celulas.map((c) => ({ ...c, tema: rotuloTema(c.tema, c.contraste ?? e.contraste ?? 'padrao'), chromium: e.chromium, node: e.node })),
)
const ORDEM_TEMA = ORDEM_ID_TEMA.flatMap((id) => ORDEM_CONTRASTE.map((contraste) => rotuloTema(id, contraste))).filter((rotulo) =>
  celulas.some((c) => c.tema === rotulo),
)
const chromium = [...new Set(entradas.map((e) => e.chromium).filter(Boolean))].join(', ')
const nodeVersao = [...new Set(entradas.map((e) => e.node).filter(Boolean))].join(', ')
const projetos = [...new Set(entradas.map((e) => e.projeto))]

const raizRepo = fileURLToPath(new URL('../../../', import.meta.url))
function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: raizRepo, encoding: 'utf8' }).trim()
  } catch {
    return 'indisponível'
  }
}
const playwrightVersao = JSON.parse(
  readFileSync(fileURLToPath(new URL('../node_modules/@playwright/test/package.json', import.meta.url)), 'utf8'),
).version
const axeVersao = JSON.parse(
  readFileSync(fileURLToPath(new URL('../node_modules/axe-core/package.json', import.meta.url)), 'utf8'),
).version

// ---------- linhas planas ----------
const largura = (c) => c.viewport.largura
const rotuloTela = (c) => `${c.tela} (${c.estado})`
const linhas = []
const naoCalc = []

for (const c of celulas) {
  const base = { tema: c.tema, viewport: largura(c), projeto: c.projeto, tela: c.tela, estado: c.estado }
  if (c.status !== 'medida') {
    naoCalc.push({ ...base, nivel: 'celula', categoria: 'celula', seletor: '(tela inteira)', motivo: c.motivo, ocorrencias: 1 })
    continue
  }
  for (const v of c.texto.violacoes) {
    linhas.push({
      ...base, categoria: 'texto', interacao: 'estatico', seletor: v.seletor,
      par: `texto ${v.cor_texto} sobre fundo ${v.cor_fundo}`, razao: v.razao, limiar: v.esperado, atende: false,
      detalhe: `${v.tamanho ?? ''} peso ${v.peso ?? ''}`.trim(),
    })
  }
  for (const v of c.texto.hover.violacoes) {
    linhas.push({
      ...base, categoria: 'texto', interacao: 'hover', seletor: v.seletor,
      par: `texto ${v.cor_texto} sobre fundo ${v.cor_fundo}`, razao: v.razao, limiar: v.esperado, atende: false,
      detalhe: `${v.tamanho ?? ''} peso ${v.peso ?? ''}`.trim(),
    })
  }
  for (const v of c.texto.incompletas) {
    naoCalc.push({ ...base, nivel: 'elemento', categoria: 'texto (axe)', seletor: v.seletor, motivo: v.motivo, ocorrencias: 1 })
  }
  for (const v of c.texto.hover.incompletas) {
    naoCalc.push({ ...base, nivel: 'elemento', categoria: 'texto (axe, hover)', seletor: v.seletor, motivo: v.motivo, ocorrencias: 1 })
  }
  for (const l of [...c.contornos, ...c.foco, ...c.hover]) {
    const categoria = l.interacao === 'hover' ? `${l.papel} (hover)` : l.papel
    const parBorda = l.cor_anel
      ? `anel ${l.cor_anel} sobre ${l.cor_fundo_externo} (${l.token_fundo_externo})`
      : l.cor_borda
        ? `borda ${l.cor_borda}${(l.token_borda ?? 'outro') !== 'outro' ? ` (${l.token_borda})` : ''} sobre ${l.cor_fundo_externo} (${l.token_fundo_externo})`
        : `preenchimento ${l.cor_preenchimento} sobre ${l.cor_fundo_externo} (${l.token_fundo_externo})`
    linhas.push({
      ...base, categoria, interacao: l.interacao, seletor: l.seletor, par: parBorda,
      razao: l.razao ?? l.razao_preenchimento, razao_interna: l.razao_interna ?? null,
      razao_preenchimento: l.razao_preenchimento ?? null, limiar: l.limiar, regra: l.regra,
      atende: l.atende, ocorrencias: l.ocorrencias,
    })
  }
  for (const n of c.naoCalculaveis) {
    naoCalc.push({ ...base, nivel: 'elemento', categoria: n.papel, interacao: n.interacao, seletor: n.seletor, motivo: n.motivo, ocorrencias: n.ocorrencias ?? 1 })
  }
}

// ---------- totais por tema e viewport ----------
function vazio() {
  return {
    celulas_medidas: 0, celulas_nao_calculaveis: 0, texto_axe_violacoes: 0, texto_axe_aprovados: 0,
    container_violacoes: 0, divisor_violacoes: 0, controle_violacoes: 0, foco_violacoes: 0,
    hover_violacoes_borda_ou_fundo: 0, hover_violacoes_texto: 0, linhas_medidas_com_limiar: 0,
    linhas_informativas: 0, elementos_nao_calculaveis: 0, celulas_com_rolagem_horizontal: 0,
    alvos_menores_44px: 0, texto_menor_12px: 0, status_sem_cor: 0, terminal_violacoes: 0,
  }
}
const totais = {}
for (const tema of ORDEM_TEMA) {
  totais[tema] = {}
  for (const v of ORDEM_VIEWPORT) totais[tema][v] = vazio()
}
for (const c of celulas) {
  const t = totais[c.tema]?.[largura(c)]
  if (!t) continue
  if (c.status !== 'medida') {
    t.celulas_nao_calculaveis += 1
    continue
  }
  t.celulas_medidas += 1
  t.texto_axe_violacoes += c.texto.violacoes.length
  t.hover_violacoes_texto += c.texto.hover.violacoes.length
  t.texto_axe_aprovados += c.texto.passes + c.texto.hover.passes
  if (c.informativas.rolagem_horizontal) t.celulas_com_rolagem_horizontal += 1
  t.alvos_menores_44px += c.informativas.alvos_menores_44
  t.texto_menor_12px += c.informativas.texto_menor_12px
  t.status_sem_cor += (c.statusSemCor ?? []).length
  if (c.terminal) t.terminal_violacoes += Object.values(c.terminal).filter((par) => par.obtido !== par.esperado).length
  t.elementos_nao_calculaveis += c.texto.incompletas.length + c.texto.hover.incompletas.length
  for (const n of c.naoCalculaveis) t.elementos_nao_calculaveis += n.ocorrencias ?? 1
  const contar = (lista, chave) => {
    for (const l of lista) {
      if (l.limiar === null || l.limiar === undefined || l.atende === null) {
        t.linhas_informativas += 1
        continue
      }
      t.linhas_medidas_com_limiar += 1
      if (l.atende === false) t[chave(l)] += 1
    }
  }
  contar(c.contornos, (l) => (l.papel === 'container' ? 'container_violacoes' : l.papel === 'divisor' ? 'divisor_violacoes' : 'controle_violacoes'))
  contar(c.foco, () => 'foco_violacoes')
  contar(c.hover, () => 'hover_violacoes_borda_ou_fundo')
}

// ---------- tokens ----------
function hexParaRgb(h) {
  const n = parseInt(h.slice(1), 16)
  return { r: (n >> 16) % 256, g: (n >> 8) % 256, b: n % 256 }
}
function lum({ r, g, b }) {
  const f = (x) => {
    const v = x / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function razaoHex(a, b) {
  const la = lum(hexParaRgb(a))
  const lb = lum(hexParaRgb(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
const tokensPorTema = {}
for (const c of celulas) {
  if ([c.status === 'medida', Boolean(c.tokens), !tokensPorTema[c.tema]].every(Boolean)) tokensPorTema[c.tema] = c.tokens
}
const matrizTokens = []
for (const tema of ORDEM_TEMA) {
  const tk = tokensPorTema[tema]
  if (!tk) continue
  const alto = altoDoRotulo(tema)
  const operacaoPadrao = idDoRotulo(tema) === 'operacao' && !alto
  const par = (grupo, nome, fundo, limiar, regra) => {
    const cor = tk[grupo][nome]
    const bg = tk.fundos[fundo]
    if (!cor || !bg) return
    const r = razaoHex(cor, bg)
    matrizTokens.push({
      tema, token: nome, cor, fundo, cor_fundo: bg, razao: arred(r), limiar: limiar,
      regra, atende: limiar === null ? null : r >= limiar,
    })
  }
  for (const nome of Object.keys(tk.textos)) for (const f of FUNDOS) par('textos', nome, f, alto ? 7 : 4.5, alto ? 'texto 7:1 (alto contraste)' : 'texto 4,5:1')
  for (const nome of ['border-control', 'focus-ring']) for (const f of FUNDOS) par('bordas', nome, f, 3, 'controle e foco 3:1')
  for (const f of FUNDOS) par('bordas', 'border-strong', f, f === 'surface' || f === 'canvas' ? 2 : null, f === 'surface' || f === 'canvas' ? 'contorno de container 2,0:1' : 'informativo')
  for (const f of FUNDOS) {
    const base = f === 'surface' || f === 'canvas'
    const lim = !base ? null : !operacaoPadrao ? 1.4 : f === 'surface' ? 1.71 : 1.81
    par('bordas', 'border-subtle', f, lim, !base ? 'informativo' : !operacaoPadrao ? 'divisor 1,4:1' : 'divisor sem regressão')
  }
}

// ---------- agrupamentos para o relatório ----------
function agrupar(lista, chaveFn) {
  const mapa = new Map()
  for (const item of lista) {
    const k = chaveFn(item)
    if (!mapa.has(k)) mapa.set(k, { itens: [], telas: new Set(), viewports: new Set(), total: 0 })
    const g = mapa.get(k)
    g.itens.push(item)
    g.telas.add(rotuloTela(item))
    g.viewports.add(item.viewport)
    g.total += item.ocorrencias ?? 1
  }
  return [...mapa.values()]
}
const ordenarVp = (s) => [...s].sort((a, b) => a - b).join(', ')

function tabelaViolacoes(titulo, lista) {
  if (lista.length === 0) return `### ${titulo}\n\nNenhuma violação medida.\n`
  const grupos = agrupar(lista, (l) => [l.tema, l.categoria, l.interacao, l.seletor, l.par, l.razao, l.limiar].join('#'))
  grupos.sort((a, b) => (a.itens[0].tema + a.itens[0].categoria).localeCompare(b.itens[0].tema + b.itens[0].categoria) || (a.itens[0].razao ?? 0) - (b.itens[0].razao ?? 0))
  const cab = '| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |\n|---|---|---|---|---|---|---|---|\n'
  const corpo = grupos
    .map((g) => {
      const i = g.itens[0]
      return `| ${i.tema} | ${ordenarVp(g.viewports)} | ${celula([...g.telas].join('; '))} | ${celula(i.seletor)} | ${celula(i.par)} | ${fmt(i.razao)} | ${fmt(i.limiar)} | ${g.total} |`
    })
    .join('\n')
  return `### ${titulo}\n\n${grupos.length} grupos distintos (${lista.length} linhas, uma por elemento distinto por célula).\n\n${cab}${corpo}\n`
}

const violacoes = linhas.filter((l) => l.atende === false)
const violTexto = violacoes.filter((l) => l.categoria === 'texto')
const violContainer = violacoes.filter((l) => l.categoria === 'container')
const violDivisor = violacoes.filter((l) => l.categoria === 'divisor')
const violControle = violacoes.filter((l) => l.categoria === 'controle')
const violFoco = violacoes.filter((l) => l.categoria === 'foco')
const violHover = violacoes.filter((l) => l.categoria.endsWith('(hover)'))

// ---------- matriz de cobertura ----------
const colunas = []
for (const tema of ORDEM_TEMA) {
  for (const v of ORDEM_VIEWPORT) if (celulas.some((c) => c.tema === tema && largura(c) === v)) colunas.push({ tema, v })
}
const chavesTela = []
for (const c of celulas) {
  const k = `${c.tela}|${c.estado}`
  if (!chavesTela.includes(k)) chavesTela.push(k)
}
const notasMotivo = []
function textoCelula(tela, estado, col) {
  const c = celulas.find((x) => [x.tela === tela, x.estado === estado, x.tema === col.tema, largura(x) === col.v].every(Boolean))
  if (!c) return 'não calculável (célula ausente)'
  if (c.status === 'medida') return 'medida'
  notasMotivo.push(`${tela} (${estado}), ${col.tema} ${col.v}: ${c.motivo}`)
  return `não calculável (nota ${notasMotivo.length})`
}
const cabMatriz = `| Tela (estado) | ${colunas.map((c) => `${c.tema} ${c.v}`).join(' | ')} |\n|---|${colunas.map(() => '---').join('|')}|\n`
const corpoMatriz = chavesTela
  .map((k) => {
    const [tela, estado] = k.split('|')
    return `| ${tela} (${estado}) | ${colunas.map((col) => textoCelula(tela, estado, col)).join(' | ')} |`
  })
  .join('\n')
const cobertura = {
  telas_distintas: [...new Set(celulas.map((c) => c.tela))].length,
  combinacoes_tela_estado: chavesTela.length,
  celulas_esperadas: chavesTela.length * colunas.length,
  celulas_medidas: celulas.filter((c) => c.status === 'medida').length,
  celulas_nao_calculaveis: celulas.filter((c) => c.status !== 'medida').length,
}

// ---------- não calculáveis agregados ----------
function tabelaNaoCalc() {
  const elementos = naoCalc.filter((n) => n.nivel === 'elemento')
  const grupos = agrupar(elementos, (n) => [n.categoria, n.motivo, n.seletor].join('#'))
  grupos.sort((a, b) => b.total - a.total)
  const porMotivo = new Map()
  for (const n of elementos) porMotivo.set(n.motivo, (porMotivo.get(n.motivo) ?? 0) + (n.ocorrencias ?? 1))
  const resumo = [...porMotivo.entries()].sort((a, b) => b[1] - a[1])
  let md = '### Por motivo\n\n| Motivo | Elementos (soma sobre as células) |\n|---|---|\n'
  md += resumo.map(([m, n]) => `| ${celula(m)} | ${n} |`).join('\n') + '\n\n'
  md += `### Por elemento\n\n${grupos.length} grupos distintos (categoria, motivo e seletor), do mais frequente ao menos frequente.\n\n`
  md += '| Categoria | Seletor | Motivo | Temas | Viewports | Telas (estado) | Elementos |\n|---|---|---|---|---|---|---|\n'
  md += grupos
    .map((g) => {
      const i = g.itens[0]
      const temas = [...new Set(g.itens.map((x) => x.tema))].join(', ')
      const telas = [...g.telas]
      const textoTelas = telas.length > 4 ? `${telas.slice(0, 4).join('; ')}; e mais ${telas.length - 4}` : telas.join('; ')
      return `| ${celula(i.categoria)} | ${celula(i.seletor)} | ${celula(i.motivo)} | ${temas} | ${ordenarVp(g.viewports)} | ${celula(textoTelas)} | ${g.total} |`
    })
    .join('\n')
  return { md, resumo, grupos: grupos.length }
}
const nc = tabelaNaoCalc()

// ---------- informativas ----------
const rolagem = celulas.filter((c) => (c.status === 'medida' ? c.informativas.rolagem_horizontal : false))

// ---------- markdown ----------
const data = new Date().toISOString()
const commitBase = git('rev-parse --short HEAD')
const ramo = git('branch --show-current')
let md = ''
md += '# Linha de base de contraste e contorno dos temas\n\n'
md += `Gerado em ${data} por e2e/contraste.relatorio.mjs, a partir dos JSON de test-results/contraste/. A Spec_de_Contraste falha por violação nas categorias da WCAG 2.2 AA abaixo, então este relatório descreve o estado medido, não pendências aceitas. Branch ${ramo}, commit ${commitBase}.\n\n`
md += '## 1. Ambiente e método\n\n'
md += `| Item | Valor |\n|---|---|\n| Chromium | ${chromium} |\n| Node | ${nodeVersao} |\n| Playwright | ${playwrightVersao} |\n| axe-core | ${axeVersao} (regra color-contrast no contraste padrão e color-contrast-enhanced no alto contraste, injetado por page.addScriptTag) |\n| Projetos | ${projetos.join(', ')} |\n| Telas | ${cobertura.telas_distintas} (${[...new Set(celulas.map((c) => c.tela))].join(', ')}) |\n| Estados | limpo, modo de demonstração ativo, painel de aparência aberto, missão iniciada e turno concluído |\n| Temas | ${ORDEM_ID_TEMA.join(', ')}, cada um com contraste padrão e, em mobile-375 e desktop-1440, alto contraste |\n| Viewports | 375, 768, 1280 e 1440 de largura |\n\n`
md += 'Método:\n\n'
md += '- Texto: regra color-contrast do axe-core no Chromium real (color-contrast-enhanced, 7:1, no alto contraste), na página inteira e de novo na subárvore de cada elemento sob hover. Elementos que o axe não consegue avaliar (incomplete) vão para a lista de não calculáveis com o motivo do axe.\n'
md += '- Contorno: getComputedStyle da borda contra o fundo opaco efetivo do ancestral, compondo camadas translúcidas. Containers: .edu-card, .panel, .glossary-details, .card-section, table e os cartões da jornada. Divisores: th, td e .itsm-nota. Controles: button, input, select, textarea e summary.\n'
md += '- Foco: até 12 elementos distintos por célula, conteúdo antes da casca. Foco programático depois de uma tecla, para que :focus-visible case. Mede a cor do anel (outline) contra o fundo do ancestral.\n'
md += '- Hover: até 6 elementos distintos por célula, mouse sobre o centro do elemento, sem transições, medindo borda e preenchimento e rodando o axe na subárvore.\n'
md += '- Texto abaixo de 12 px, status sem texto nem svg.icone e cores do terminal (.terminal-shell e .terminal-output contra --bg-canvas e --text-primary do bloco operacao ou do conjunto escuro de alto contraste) também falham a spec.\n'
md += '- Páginas reutilizadas: uma página por projeto, tema, contraste e grupo. Backend local com limite de 5000 requisições por minuto só no processo dele.\n'
md += '- Limiares: texto 4,5:1 (grande 3:1, vindo do axe; 7:1 no alto contraste); controles e foco 3:1; contorno de container 2,0:1 sobre surface e canvas; divisor 1,4:1 e, no operacao com contraste padrão, sem regressão (1,71 surface e 1,81 canvas); fundo elevated e hover só informativo para container e divisor.\n'
md += '- Papel por seletor, não por token: o contorno de container é avaliado pelo papel do elemento, seja qual for o token que a regra CSS usa.\n\n'
md += '## 2. Totais por tema e viewport\n\n'
md += 'Contagem de elementos distintos por célula (tela e estado). O mesmo componente que aparece em duas telas conta nas duas. Linhas informativas são as sem limiar aplicável (fundo elevated ou hover, controle só com preenchimento).\n\n'
const campos = [
  ['celulas_medidas', 'Células medidas'],
  ['celulas_nao_calculaveis', 'Células não calculáveis'],
  ['texto_axe_violacoes', 'Violações de texto (axe, estático)'],
  ['hover_violacoes_texto', 'Violações de texto (axe, hover)'],
  ['container_violacoes', 'Violações de contorno de container'],
  ['divisor_violacoes', 'Violações de divisor'],
  ['controle_violacoes', 'Violações de controle'],
  ['foco_violacoes', 'Violações de foco'],
  ['hover_violacoes_borda_ou_fundo', 'Violações de controle ou divisor sob hover'],
  ['linhas_medidas_com_limiar', 'Linhas medidas com limiar'],
  ['linhas_informativas', 'Linhas informativas'],
  ['texto_axe_aprovados', 'Nós de texto aprovados (axe)'],
  ['elementos_nao_calculaveis', 'Elementos não calculáveis'],
  ['celulas_com_rolagem_horizontal', 'Células com rolagem horizontal'],
  ['alvos_menores_44px', 'Alvos menores que 44 px (informativo)'],
  ['texto_menor_12px', 'Textos menores que 12 px'],
  ['status_sem_cor', 'Status sem texto nem ícone'],
  ['terminal_violacoes', 'Cores do terminal fora do esperado'],
]
md += `| Métrica | ${colunas.map((c) => `${c.tema} ${c.v}`).join(' | ')} |\n|---|${colunas.map(() => '---:').join('|')}|\n`
for (const [chave, rotulo] of campos) {
  md += `| ${rotulo} | ${colunas.map((c) => totais[c.tema][c.v][chave]).join(' | ')} |\n`
}
md += '\n'
const somaTema = (tema, chave) => ORDEM_VIEWPORT.reduce((s, v) => s + totais[tema][v][chave], 0)
md += '| Tema (contraste) | Texto (estático e hover) | Container | Divisor | Controle | Foco | Hover (controle ou divisor) |\n|---|---:|---:|---:|---:|---:|---:|\n'
for (const tema of ORDEM_TEMA) {
  md += `| ${tema} | ${somaTema(tema, 'texto_axe_violacoes') + somaTema(tema, 'hover_violacoes_texto')} | ${somaTema(tema, 'container_violacoes')} | ${somaTema(tema, 'divisor_violacoes')} | ${somaTema(tema, 'controle_violacoes')} | ${somaTema(tema, 'foco_violacoes')} | ${somaTema(tema, 'hover_violacoes_borda_ou_fundo')} |\n`
}
md += '\n(Soma dos viewports medidos de cada tema e contraste.)\n\n'

md += '## 3. Matriz de cobertura\n\n'
md += `${cobertura.combinacoes_tela_estado} combinações de tela e estado por ${colunas.length} colunas de tema e viewport: ${cobertura.celulas_esperadas} células esperadas, ${cobertura.celulas_medidas} medidas e ${cobertura.celulas_nao_calculaveis} não calculáveis.\n\n`
md += cabMatriz + corpoMatriz + '\n\n'
if (notasMotivo.length > 0) {
  md += 'Motivos das células não calculáveis:\n\n' + notasMotivo.map((n, i) => `${i + 1}. ${celula(n)}`).join('\n') + '\n\n'
}

md += '## 4. Violações medidas\n\n'
md += 'Cada grupo reúne elementos com o mesmo tema, seletor, par de cores e razão. O arquivo LINHA_DE_BASE_TEMAS.json traz todas as linhas, uma por elemento distinto, tela, estado, tema e viewport.\n\n'
md += tabelaViolacoes('4.1 Texto (axe)', violTexto) + '\n'
md += tabelaViolacoes('4.2 Contorno de container', violContainer) + '\n'
md += tabelaViolacoes('4.3 Divisor', violDivisor) + '\n'
md += tabelaViolacoes('4.4 Controle (borda ou preenchimento)', violControle) + '\n'
md += tabelaViolacoes('4.5 Foco', violFoco) + '\n'
md += tabelaViolacoes('4.6 Controle e divisor sob hover', violHover) + '\n'
const extras = []
for (const c of celulas) {
  if (c.status !== 'medida') continue
  const base = `${c.tema}, ${largura(c)} px, ${rotuloTela(c)}`
  if (c.informativas.texto_menor_12px > 0) {
    extras.push(`${base}: ${c.informativas.texto_menor_12px} nó(s) de texto abaixo de 12 px (${c.informativas.exemplos_texto.join('; ')})`)
  }
  for (const s of c.statusSemCor ?? []) extras.push(`${base}: status sem texto nem ícone ${s}`)
  for (const [nome, par] of Object.entries(c.terminal ?? {})) {
    if (par.obtido !== par.esperado) extras.push(`${base}: terminal ${nome} obtido ${par.obtido}, esperado ${par.esperado}`)
  }
}
md += '### 4.7 Texto abaixo de 12 px, status sem cor e terminal\n\n'
md += extras.length === 0 ? 'Nenhuma violação medida.\n\n' : extras.map((e) => `- ${celula(e)}`).join('\n') + '\n\n'

md += '## 5. Matriz de tokens\n\n'
md += 'Razões calculadas a partir dos valores dos tokens lidos da página em cada tema e contraste (getComputedStyle da raiz).\n\n'
md += '| Tema | Token | Cor | Fundo | Cor do fundo | Razão | Limiar | Situação |\n|---|---|---|---|---|---:|---:|---|\n'
for (const m of matrizTokens) {
  md += `| ${m.tema} | ${m.token} | ${m.cor} | ${m.fundo} | ${m.cor_fundo} | ${fmt(m.razao)} | ${fmt(m.limiar)} | ${m.atende === null ? 'informativo' : m.atende ? 'atende' : 'não atende'} (${celula(m.regra)}) |\n`
}
md += '\n'

md += '## 6. Elementos não calculáveis\n\n'
md += 'Elementos que a medição não consegue avaliar, com o motivo. Não são aprovações nem reprovações.\n\n'
md += nc.md + '\n\n'

md += '## 7. Medidas informativas\n\n'
md += rolagem.length === 0
  ? 'Rolagem horizontal: nenhuma célula medida tem rolagem horizontal.\n\n'
  : `Rolagem horizontal em ${rolagem.length} células: ${rolagem.map((c) => `${c.tema} ${largura(c)} ${rotuloTela(c)}`).join('; ')}.\n\n`
md += 'Alvos menores que 44 px e textos menores que 12 px estão por célula no JSON (campo informativas, com exemplos). Os totais por tema e viewport estão na seção 2.\n\n'

md += '## 8. Limitações\n\n'
md += '- Hover e foco são amostras (6 e 12 elementos distintos por célula, conteúdo primeiro), não varredura completa.\n'
md += '- Axe mede o estado da página no instante da medição. Menus, diálogos e estados de erro fora do roteiro não são cobertos.\n'
md += '- Controle só com preenchimento (sem borda) é informativo: o limiar de 3:1 só vale para controles que têm borda visível. O mesmo vale para rádio e caixa de seleção nativos, cuja borda não aparece no estilo computado.\n'
md += '- O fundo de elemento com opacidade menor que 1, imagem ou gradiente não é calculado, vai para a lista de não calculáveis.\n'
md += '- Pseudo-elementos (por exemplo o botão do seletor de arquivo) não entram no estilo computado do elemento. O axe os trata como conteúdo de pseudo-elemento quando os encontra.\n'
md += '- Zoom em 200 por cento é coberto pela Spec_Visual (640 por 450 px). Leitor de tela real não faz parte da medição.\n'

mkdirSync(DESTINO, { recursive: true })
writeFileSync(`${DESTINO}LINHA_DE_BASE_TEMAS.md`, limpar(md), 'utf8')

const json = {
  gerado_em: data,
  branch: ramo,
  commit: git('rev-parse HEAD'),
  ambiente: { chromium, node: nodeVersao, playwright: playwrightVersao, axe_core: axeVersao, projetos },
  limiares: {
    texto: 4.5, texto_grande: 3, controle_e_foco: 3, container: 2,
    texto_alto_contraste: 7, divisor: 1.4, divisor_operacao_padrao: 'sem regressão (1,71 surface, 1,81 canvas)',
    observacao: 'fundos elevated e hover são só informativos para container e divisor',
  },
  cobertura,
  totais_por_tema_e_viewport: totais,
  matriz_celulas: celulas.map((c) => ({
    tema: c.tema, viewport: largura(c), projeto: c.projeto, tela: c.tela, estado: c.estado, status: c.status,
    motivo: c.motivo ?? null,
    resumo: c.status === 'medida'
      ? {
          texto_violacoes: c.texto.violacoes.length, texto_hover_violacoes: c.texto.hover.violacoes.length,
          texto_aprovados: c.texto.passes, contornos: c.contornos.length, foco: c.foco.length, hover: c.hover.length,
          nao_calculaveis: c.naoCalculaveis.length + c.texto.incompletas.length + c.texto.hover.incompletas.length,
          informativas: c.informativas,
        }
      : null,
  })),
  tokens: tokensPorTema,
  matriz_tokens: matrizTokens,
  linhas,
  nao_calculaveis: naoCalc,
}
writeFileSync(`${DESTINO}LINHA_DE_BASE_TEMAS.json`, limpar(JSON.stringify(json, null, 1)), 'utf8')

console.log(`Relatório gerado em ${DESTINO}`)
console.log(JSON.stringify({ cobertura, violacoes: violacoes.length, linhas: linhas.length, nao_calculaveis: naoCalc.length }))
