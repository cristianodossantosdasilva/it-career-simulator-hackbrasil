import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const padroes = [/LLM_API_KEY/i, /OPENAI_API_KEY/i, /ANTHROPIC_API_KEY/i, /GEMINI_API_KEY/i, /sk-proj-[A-Za-z0-9_-]{12,}/]

async function arquivos(dir) {
  const encontrados = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name)
    if (item.isDirectory()) encontrados.push(...await arquivos(caminho))
    else encontrados.push(caminho)
  }
  return encontrados
}

const ativos = await arquivos(raiz)
for (const caminho of ativos) {
  const conteudo = await readFile(caminho, 'utf8')
  const achado = padroes.find((padrao) => padrao.test(conteudo))
  if (achado) {
    console.error(`Possível segredo (${achado}) encontrado em ${caminho}`)
    process.exitCode = 1
  }
}
if (process.exitCode !== 1) console.log(`Bundle sem padrões de chave LLM (${ativos.length} arquivo(s) verificado(s)).`)
