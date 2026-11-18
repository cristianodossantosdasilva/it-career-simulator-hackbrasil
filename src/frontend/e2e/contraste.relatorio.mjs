// Gera a linha de base de contraste e contorno (ciclo 2, E1) a partir dos JSON gravados por
// e2e/contraste.spec.ts em test-results/contraste/.
//
// Uso (na pasta src/frontend, depois de uma rodada do Playwright):
//   node e2e/contraste.relatorio.mjs
//
// Arquivos gerados: docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e 10_linha_de_base.json.
// O script não mede nada. Só consolida o que a spec gravou.

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ENTRADA = fileURLToPath(new URL('../test-results/contraste/', import.meta.url))
const DESTINO = fileURLToPath(new URL('../../../docs/auditoria-ui-ux/ciclo2/', import.meta.url))
const E_COMERCIAL = String.fromCharCode(38)

const ORDEM_VIEWPORT = [375, 768, 1280, 1440]
const ORDEM_TEMA = ['tactical', 'corporate']
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
const celulas = entradas.flatMap((e) => e.celulas.map((c) => ({ ...c, chromium: e.chromium, node: e.node })))
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
    alvos_menores_44px: 0, texto_menor_12px: 0,
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
  for (const nome of Object.keys(tk.textos)) for (const f of FUNDOS) par('textos', nome, f, 4.5, 'texto 4,5:1')
  for (const nome of ['border-control', 'focus-ring']) for (const f of FUNDOS) par('bordas', nome, f, 3, 'controle e foco 3:1')
  for (const f of FUNDOS) par('bordas', 'border-strong', f, f === 'surface' || f === 'canvas' ? 2 : null, f === 'surface' || f === 'canvas' ? 'contorno de container 2,0:1' : 'informativo')
  for (const f of FUNDOS) {
    const base = f === 'surface' || f === 'canvas'
    const lim = !base ? null : tema === 'corporate' ? 1.4 : f === 'surface' ? 1.71 : 1.81
    par('bordas', 'border-subtle', f, lim, !base ? 'informativo' : tema === 'corporate' ? 'divisor 1,4:1' : 'divisor sem regressão')
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
for (const tema of ORDEM_TEMA) for (const v of ORDEM_VIEWPORT) colunas.push({ tema, v })
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
md += '# Ciclo 2, E1: linha de base de contraste e contorno\n\n'
md += `Gerado em ${data} por e2e/contraste.relatorio.mjs, a partir dos JSON de test-results/contraste/. Não corrige produto. Mede o estado da branch ${ramo} no commit ${commitBase} (produto idêntico ao da main em a88988c, os commits da branch até aqui só mudam documentação).\n\n`
md += '## 1. Ambiente e método\n\n'
md += `| Item | Valor |\n|---|---|\n| Chromium | ${chromium} |\n| Node | ${nodeVersao} |\n| Playwright | ${playwrightVersao} |\n| axe-core | ${axeVersao} (regra color-contrast, injetado por page.addScriptTag) |\n| Projetos | ${projetos.join(', ')} |\n| Telas | ${cobertura.telas_distintas} (${[...new Set(celulas.map((c) => c.tela))].join(', ')}) |\n| Estados | limpo (sem missão iniciada), missão iniciada (laboratório logo após Decolar), turno concluído (depois de resolver o chamado do Nível 1) |\n| Temas | tactical e corporate |\n| Viewports | 375, 768, 1280 e 1440 de largura |\n\n`
md += 'Observação sobre a contagem de telas: o plano cita 9 telas, a lista do procedimento tem 10 (Missões, Aulas, Caderno, Mentor, Credencial, ITSM, Chat, KB, SimuDesk e Juiz 360 com Replay, que é uma tela só). O relatório cobre as 10.\n\n'
md += 'Método:\n\n'
md += '- Texto: regra color-contrast do axe-core no Chromium real, na página inteira e de novo na subárvore de cada elemento sob hover. Elementos que o axe não consegue avaliar (incomplete) vão para a lista de não calculáveis com o motivo do axe.\n'
md += '- Contorno: getComputedStyle da borda contra o fundo opaco efetivo do ancestral, compondo camadas translúcidas. Containers: .edu-card, .panel, .glossary-details, .card-section e table. Divisores: th, td e .itsm-nota. Controles: button, input, select, textarea e summary. Registra também a razão contra o fundo interno do próprio elemento e, para controles, contra o preenchimento.\n'
md += '- Foco: até 12 elementos distintos por célula, conteúdo antes da casca (trilho e barra de contexto). Foco programático depois de uma tecla, para que :focus-visible case. Mede a cor do anel (outline) contra o fundo do ancestral.\n'
md += '- Hover: até 6 elementos distintos por célula, mouse sobre o centro do elemento, sem transições, medindo borda e preenchimento e rodando o axe na subárvore.\n'
md += '- Páginas reutilizadas: uma página por projeto, tema e grupo (estudo, laboratório). Só um backend, porta 8080, com limite de 5000 requisições por minuto definido pelo playwright.config.ts.\n'
md += '- Limiares (seção 4 do plano final): texto 4,5:1 (grande 3:1, vindo do axe); controles e foco 3:1; contorno de container 2,0:1 sobre surface e canvas; divisor 1,4:1 no corporate e, no tactical, sem regressão (1,72 surface e 1,82 canvas); fundo elevated e hover só informativo para container e divisor.\n'
md += '- Papel por seletor, não por token: o contorno de container é avaliado pelo papel do elemento (.edu-card, .panel etc.), seja qual for o token que a regra CSS usa. Hoje essas regras usam var(--border), alias de --border-subtle. O plano trata o contorno de container como border-strong, então a violação de container abaixo mostra a distância entre o que o CSS usa e o que o limiar de 2,0:1 pede.\n\n'

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
  ['texto_menor_12px', 'Textos menores que 12 px (informativo)'],
]
md += `| Métrica | ${colunas.map((c) => `${c.tema} ${c.v}`).join(' | ')} |\n|---|${colunas.map(() => '---:').join('|')}|\n`
for (const [chave, rotulo] of campos) {
  md += `| ${rotulo} | ${colunas.map((c) => totais[c.tema][c.v][chave]).join(' | ')} |\n`
}
md += '\n'
const somaTema = (tema, chave) => ORDEM_VIEWPORT.reduce((s, v) => s + totais[tema][v][chave], 0)
md += '| Tema | Texto (estático e hover) | Container | Divisor | Controle | Foco | Hover (controle ou divisor) |\n|---|---:|---:|---:|---:|---:|---:|\n'
for (const tema of ORDEM_TEMA) {
  md += `| ${tema} | ${somaTema(tema, 'texto_axe_violacoes') + somaTema(tema, 'hover_violacoes_texto')} | ${somaTema(tema, 'container_violacoes')} | ${somaTema(tema, 'divisor_violacoes')} | ${somaTema(tema, 'controle_violacoes')} | ${somaTema(tema, 'foco_violacoes')} | ${somaTema(tema, 'hover_violacoes_borda_ou_fundo')} |\n`
}
md += '\n(Soma dos quatro viewports de cada tema.)\n\n'

md += '## 3. Matriz de cobertura\n\n'
md += `${cobertura.combinacoes_tela_estado} combinações de tela e estado por ${colunas.length} colunas de tema e viewport: ${cobertura.celulas_esperadas} células esperadas, ${cobertura.celulas_medidas} medidas e ${cobertura.celulas_nao_calculaveis} não calculáveis.\n\n`
md += cabMatriz + corpoMatriz + '\n\n'
if (notasMotivo.length > 0) {
  md += 'Motivos das células não calculáveis:\n\n' + notasMotivo.map((n, i) => `${i + 1}. ${celula(n)}`).join('\n') + '\n\n'
}

md += '## 4. Violações medidas\n\n'
md += 'Cada grupo reúne elementos com o mesmo tema, seletor, par de cores e razão. O arquivo 10_linha_de_base.json traz todas as linhas, uma por elemento distinto, tela, estado, tema e viewport.\n\n'
md += tabelaViolacoes('4.1 Texto (axe)', violTexto) + '\n'
md += tabelaViolacoes('4.2 Contorno de container', violContainer) + '\n'
md += tabelaViolacoes('4.3 Divisor', violDivisor) + '\n'
md += tabelaViolacoes('4.4 Controle (borda ou preenchimento)', violControle) + '\n'
md += tabelaViolacoes('4.5 Foco', violFoco) + '\n'
md += tabelaViolacoes('4.6 Controle e divisor sob hover', violHover) + '\n'

md += '## 5. Matriz de tokens\n\n'
md += 'Razões calculadas a partir dos valores dos tokens lidos da página em cada tema (getComputedStyle da raiz). Referência para a E5.\n\n'
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
md += '- O tactical foi medido de forma completa nesta etapa, mas só dois PNG dele foram inspecionados no ciclo 1. A inspeção visual dos dois temas fica para a E6.\n'
md += '- Zoom em 200 por cento e leitor de tela não fazem parte desta etapa (verificação manual da E7).\n'

mkdirSync(DESTINO, { recursive: true })
writeFileSync(`${DESTINO}10_LINHA_DE_BASE.md`, limpar(md), 'utf8')

const json = {
  etapa: 'E1',
  gerado_em: data,
  branch: ramo,
  commit: git('rev-parse HEAD'),
  base_produto: 'a88988c',
  ambiente: { chromium, node: nodeVersao, playwright: playwrightVersao, axe_core: axeVersao, projetos },
  limiares: {
    texto: 4.5, texto_grande: 3, controle_e_foco: 3, container: 2,
    divisor_corporate: 1.4, divisor_tactical: 'sem regressão (1,72 surface, 1,82 canvas)',
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
writeFileSync(`${DESTINO}10_linha_de_base.json`, limpar(JSON.stringify(json, null, 1)), 'utf8')

console.log(`Relatório gerado em ${DESTINO}`)
console.log(JSON.stringify({ cobertura, violacoes: violacoes.length, linhas: linhas.length, nao_calculaveis: naoCalc.length }))
