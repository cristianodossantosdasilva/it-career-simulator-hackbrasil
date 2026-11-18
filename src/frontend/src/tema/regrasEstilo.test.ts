import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { type Gerador, paraTodo } from '../testes/propriedade'
import { hexForaDeBlocos, seletoresComTemaForaDeBloco } from './regrasEstilo.ts'

describe('varredura de cores hexadecimais, exemplos', () => {
  it('aceita cores dentro de blocos de tema e de alto contraste de index.css', () => {
    const css = [
      "[data-theme='operacao'] {",
      '  --bg-canvas: #0B1120;',
      '}',
      "html[data-contraste='alto']:not(.dark) {",
      '  --bg-canvas: #FFF;',
      '}',
    ].join('\n')
    expect(hexForaDeBlocos('src/index.css', css)).toEqual([])
  })

  it('acusa cor fora dos blocos com a linha', () => {
    const css = ["[data-theme='operacao'] {", '  --a: #0B1120;', '}', '.btn { color: #fff; }', '.x { color: #12345678; }'].join('\n')
    expect(hexForaDeBlocos('src/index.css', css).map((o) => o.linha)).toEqual([4, 5])
  })

  it('ignora comentários, comprimentos inválidos e âncoras', () => {
    const css = ['/* #0B1120 */', '.a { color: red; } /* #ABCDEF */', '.b { content: "#12345"; }', 'a[href="#topo"] {}'].join('\n')
    expect(hexForaDeBlocos('src/index.css', css)).toEqual([])
  })

  it('em TypeScript acusa cor em código e ignora comentário de linha e de bloco', () => {
    const ts = ["const a = '#0B1120'", '// cor #abcdef no comentario', '/* #fff */ const b = 1', 'const c = "#FFF"'].join('\n')
    expect(hexForaDeBlocos('src/x.ts', ts).map((o) => o.linha)).toEqual([1, 4])
  })

  it('uma aspa solta em comentário não esconde cores seguintes', () => {
    const ts = ["// não é nada, don't", "const a = '#0B1120'"].join('\n')
    expect(hexForaDeBlocos('src/x.ts', ts).map((o) => o.linha)).toEqual([2])
  })
})

describe('seletores de tema fora de bloco, exemplos', () => {
  it('aceita só o primeiro seletor de bloco de tema', () => {
    const css = "[data-theme='operacao'],\n[data-superficie='terminal'] { --a: 1; }\n[data-theme='acolhedor'] { --a: 2; }"
    expect(seletoresComTemaForaDeBloco(css)).toEqual([])
  })

  it('acusa seletor de tema usado em regra de componente', () => {
    const css = "[data-theme='operacao'] { --a: 1; }\n[data-theme='operacao'] .step-box strong { color: red; }"
    expect(seletoresComTemaForaDeBloco(css).map((o) => o.trecho)).toEqual(["[data-theme='operacao'] .step-box strong"])
  })

  it('acusa seletor de tema dentro de media query', () => {
    const css = "@media (max-width: 600px) {\n  [data-theme='operacao'] { --a: 1; }\n}"
    expect(seletoresComTemaForaDeBloco(css)).toHaveLength(1)
  })
})

// Feature: temas-selecionaveis, Property 4: Varredura de hexadecimais
describe('varredura de hexadecimais, propriedade', () => {
  const CORES = ['#0B1120', '#abc', '#ABCD', '#0EA5E959', '#ffffff']

  function montarCss(g: Gerador) {
    const linhas: string[] = []
    const esperadas: number[] = []
    const total = g.inteiro(2, 8)
    for (let i = 0; i < total; i += 1) {
      const tipo = g.escolher(['tema', 'alto', 'comum', 'comentario'] as const)
      if (tipo === 'tema' || tipo === 'alto') {
        linhas.push(tipo === 'tema' ? `[data-theme='${g.escolher(['operacao', 'editorial'])}'] {` : "html[data-contraste='alto'].dark {")
        for (let j = 0; j < g.inteiro(1, 3); j += 1) linhas.push(`  --t${j}: ${g.escolher(CORES)};`)
        linhas.push('}')
      } else if (tipo === 'comum') {
        linhas.push(`.regra-${i} {`)
        if (g.inteiro(0, 1) === 1) {
          linhas.push(`  color: ${g.escolher(CORES)};`)
          esperadas.push(linhas.length)
        } else linhas.push('  color: red;')
        linhas.push('}')
      } else {
        linhas.push(`/* ${g.escolher(CORES)} em comentario */`)
      }
    }
    return { texto: linhas.join('\n'), esperadas }
  }

  function montarTs(g: Gerador) {
    const linhas: string[] = []
    const esperadas: number[] = []
    const total = g.inteiro(2, 8)
    for (let i = 0; i < total; i += 1) {
      const tipo = g.escolher(['codigo', 'comentario-linha', 'comentario-bloco', 'limpo'] as const)
      if (tipo === 'codigo') {
        linhas.push(`const c${i} = '${g.escolher(CORES)}'`)
        esperadas.push(linhas.length)
      } else if (tipo === 'comentario-linha') linhas.push(`// cor ${g.escolher(CORES)} citada`)
      else if (tipo === 'comentario-bloco') linhas.push(`/* ${g.escolher(CORES)} */`)
      else linhas.push(`const l${i} = ${i}`)
    }
    return { texto: linhas.join('\n'), esperadas }
  }

  it('em CSS relata só as cores fora dos blocos de tema e de alto contraste', () => {
    paraTodo('hex em CSS', montarCss, ({ texto, esperadas }) => {
      expect(hexForaDeBlocos('src/index.css', texto).map((o) => o.linha)).toEqual(esperadas)
    })
  })

  it('em TypeScript relata todas as cores fora de comentários', () => {
    paraTodo('hex em TypeScript', montarTs, ({ texto, esperadas }) => {
      expect(hexForaDeBlocos('src/x.ts', texto).map((o) => o.linha)).toEqual(esperadas)
    })
  })
})

describe('nomes antigos de tema', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const EXCECOES = ['persistencia.test.ts', 'regrasEstilo.test.ts']
  const PADRAO = /corporate\b|tactical|itfs_theme/

  function listar(pasta: string): string[] {
    return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
      const caminho = join(pasta, entrada.name)
      if (entrada.isDirectory()) return listar(caminho)
      return /\.(ts|tsx|css|html|mjs)$/.test(entrada.name) ? [caminho] : []
    })
  }

  it('src, index.html, plugins e scripts não citam corporate, tactical nem itfs_theme fora das duas exceções', () => {
    const arquivos = [...listar(join(raiz, 'src')), ...listar(join(raiz, 'scripts')), ...listar(join(raiz, 'plugins')), join(raiz, 'index.html')]
    const achados: string[] = []
    for (const arquivo of arquivos) {
      if (EXCECOES.some((excecao) => arquivo.endsWith(excecao))) continue
      readFileSync(arquivo, 'utf8')
        .split('\n')
        .forEach((linha, indice) => {
          if (PADRAO.test(linha)) achados.push(`${relative(raiz, arquivo)}:${indice + 1}`)
        })
    }
    expect(achados).toEqual([])
  })
})