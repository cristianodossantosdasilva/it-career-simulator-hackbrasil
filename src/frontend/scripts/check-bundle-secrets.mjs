import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Varre todo o dist (index.html, assets e demais arquivos de texto). Um diretório pode ser passado
// como argumento, o que permite testar o script sem rodar o build.
const raiz = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../dist/', import.meta.url))

// Arquivos binários não são lidos como texto.
const binarios = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot'])

const padroes = [
  // Nomes de variáveis de chave de provedores de LLM.
  /LLM_API_KEY/i,
  /OPENAI_API_KEY/i,
  /ANTHROPIC_API_KEY/i,
  /GEMINI_API_KEY/i,
  /sk-proj-[A-Za-z0-9_-]{12,}/,
  // Formatos comuns de credenciais.
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, // AWS, chave de acesso
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/, // chave privada PEM ou PGP
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, // GitHub, token pessoal, OAuth, usuário, servidor e refresh
  /\bgithub_pat_[A-Za-z0-9_]{22,}\b/, // GitHub, token de granularidade fina
  /\bAIza[0-9A-Za-z_-]{35}\b/, // Google, chave de API
  /\bsk-ant-[A-Za-z0-9_-]{20,}/, // Anthropic
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/, // Slack
]

async function arquivos(dir) {
  const encontrados = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name)
    if (item.isDirectory()) encontrados.push(...(await arquivos(caminho)))
    else if (!binarios.has(extname(item.name).toLowerCase())) encontrados.push(caminho)
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
if (ativos.length === 0) {
  console.error(`Nenhum arquivo encontrado em ${raiz}; a verificação de segredos não cobriu nada.`)
  process.exitCode = 1
}
if (process.exitCode !== 1) console.log(`Build sem padrões de chave ou credencial (${ativos.length} arquivo(s) de texto verificado(s) em dist).`)
