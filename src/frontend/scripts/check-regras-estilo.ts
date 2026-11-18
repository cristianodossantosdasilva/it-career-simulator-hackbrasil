/**
 * Varredura de estilo chamada pelo script postlint. Falha com codigo 1 se achar cor hexadecimal fora dos
 * blocos de token ou seletor de tema fora de bloco. Exige Node 22.18 ou mais novo (remocao nativa de tipos).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { hexForaDeBlocos, seletoresComTemaForaDeBloco, type Ocorrencia } from '../src/tema/regrasEstilo.ts'

const RAIZ = process.cwd()
const PASTA_FONTES = join(RAIZ, 'src')

function listar(pasta: string): string[] {
  const arquivos: string[] = []
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name)
    if (entrada.isDirectory()) arquivos.push(...listar(caminho))
    else if (/\.(ts|tsx|css)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) arquivos.push(caminho)
  }
  return arquivos
}

const ocorrencias: Ocorrencia[] = []
for (const caminho of listar(PASTA_FONTES)) {
  const nome = relative(RAIZ, caminho).split('\\').join('/')
  const texto = readFileSync(caminho, 'utf8')
  ocorrencias.push(...hexForaDeBlocos(nome, texto))
  if (nome.endsWith('.css')) ocorrencias.push(...seletoresComTemaForaDeBloco(texto, nome))
}

if (ocorrencias.length > 0) {
  for (const ocorrencia of ocorrencias) console.error(`${ocorrencia.arquivo}:${ocorrencia.linha}: ${ocorrencia.trecho}`)
  console.error(`Regras de estilo: ${ocorrencias.length} ocorrência(s). Cores ficam só nos blocos de token de src/index.css.`)
  process.exit(1)
}
console.log('Regras de estilo: nenhuma cor fora dos blocos de token.')
