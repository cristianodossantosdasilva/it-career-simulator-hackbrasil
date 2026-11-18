/**
 * Plugin do Vite para a aparencia inicial. No build e no servidor de desenvolvimento ele:
 * 1. le a configuracao opcional do cliente (config/tema-cliente.json) e embute um envelope higienizado
 *    no head, em um bloco JSON;
 * 2. gera, a partir de src/tema/scriptInicial.ts, um script inline sincrono (IIFE) que aplica tema e
 *    contraste antes da primeira pintura;
 * 3. publica a mesma configuracao higienizada em /config/tema-cliente.json.
 * Trocar o arquivo publicado sem refazer o build nao muda o tema: o bloco do index.html e a fonte.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type HtmlTagDescriptor, type Plugin, build } from 'vite'
import { type EnvelopeConfiguracao, criarEnvelope, serializarParaHtml } from '../src/tema/envelopeConfiguracao.ts'

export interface OpcoesAparenciaInicial {
  /** Padrao: 'config/tema-cliente.json', relativo a raiz do projeto frontend. */
  readonly arquivoConfiguracao?: string
  /** Padrao: 'src/tema/scriptInicial.ts'. */
  readonly entradaScript?: string
}

const ID_BLOCO = 'itfs-config-cliente'
const ROTA_PUBLICADA = '/config/tema-cliente.json'
const ARQUIVO_PUBLICADO = 'config/tema-cliente.json'

/** Pura. Monta o bloco JSON (quando ha envelope) e o script, nesta ordem, para 'head-prepend'. */
export function montarTagsAparencia(codigoScript: string, envelope: EnvelopeConfiguracao | null): HtmlTagDescriptor[] {
  if (codigoScript.toLowerCase().includes('</script')) throw new Error('aparenciaInicial: o script inicial não pode conter a sequência de fechamento de script')
  const tags: HtmlTagDescriptor[] = []
  if (envelope !== null) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/json', id: ID_BLOCO },
      children: serializarParaHtml(envelope),
      injectTo: 'head-prepend',
    })
  }
  tags.push({ tag: 'script', children: codigoScript, injectTo: 'head-prepend' })
  return tags
}

/** Envelope so com os tres campos conhecidos, para publicar em /config/tema-cliente.json. */
function fonteHigienizada(envelope: EnvelopeConfiguracao): string | null {
  if (envelope.erro !== null || envelope.configuracao === null) return null
  const { temasPermitidos, temaPadrao, travado } = envelope.configuracao
  const publicada: Record<string, unknown> = {}
  if (temasPermitidos !== undefined) publicada.temasPermitidos = temasPermitidos
  if (temaPadrao !== undefined) publicada.temaPadrao = temaPadrao
  if (travado !== undefined) publicada.travado = travado
  return `${JSON.stringify(publicada, null, 2)}\n`
}

function assinaturaDaPasta(pasta: string): string {
  const partes: string[] = []
  for (const nome of readdirSync(pasta).sort()) {
    if (/\.test\.tsx?$/.test(nome) || !/\.tsx?$/.test(nome)) continue
    partes.push(`${nome}:${statSync(join(pasta, nome)).mtimeMs}`)
  }
  return partes.join('|')
}

export function aparenciaInicial(opcoes: OpcoesAparenciaInicial = {}): Plugin {
  let raiz = process.cwd()
  let emBuild = false
  let cache: { assinatura: string; codigo: string } | null = null
  let ultimoScript: string | null = null

  const caminhoConfiguracao = () => resolve(raiz, opcoes.arquivoConfiguracao ?? 'config/tema-cliente.json')
  const entradaScript = () => resolve(raiz, opcoes.entradaScript ?? 'src/tema/scriptInicial.ts')
  const pastaTema = () => resolve(raiz, 'src/tema')

  function lerEnvelope(): EnvelopeConfiguracao | null {
    const arquivo = caminhoConfiguracao()
    if (!existsSync(arquivo)) return null
    return criarEnvelope(readFileSync(arquivo, 'utf8'))
  }

  async function gerarScript(): Promise<string> {
    const assinatura = assinaturaDaPasta(pastaTema())
    if (cache !== null && cache.assinatura === assinatura) return cache.codigo
    try {
      const resultado = await build({
        configFile: false,
        root: raiz,
        logLevel: 'silent',
        publicDir: false,
        build: {
          write: false,
          minify: true,
          target: 'es2019',
          lib: { entry: entradaScript(), formats: ['iife'], name: 'AparenciaInicial' },
        },
      })
      const saidas = (Array.isArray(resultado) ? resultado : [resultado]).flatMap((item) => ('output' in item ? item.output : []))
      const pedaco = saidas.find((item) => item.type === 'chunk')
      if (pedaco === undefined || pedaco.type !== 'chunk') throw new Error('o build aninhado não gerou código')
      cache = { assinatura, codigo: pedaco.code.trim() }
      return cache.codigo
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      throw new Error(`aparenciaInicial: falha ao gerar o script inicial a partir de ${opcoes.entradaScript ?? 'src/tema/scriptInicial.ts'}: ${motivo}`, {
        cause: erro,
      })
    }
  }

  return {
    name: 'aparencia-inicial',
    configResolved(config) {
      raiz = config.root
      emBuild = config.command === 'build'
    },
    async transformIndexHtml() {
      const codigo = await gerarScript()
      ultimoScript = codigo
      return montarTagsAparencia(codigo, lerEnvelope())
    },
    generateBundle() {
      const envelope = lerEnvelope()
      if (envelope === null) return
      const fonte = fonteHigienizada(envelope)
      if (fonte === null) {
        this.warn('aparenciaInicial: configuração do cliente inválida; /config/tema-cliente.json não foi publicado.')
        return
      }
      this.emitFile({ type: 'asset', fileName: ARQUIVO_PUBLICADO, source: fonte })
    },
    configureServer(servidor) {
      servidor.watcher.add([caminhoConfiguracao(), pastaTema()])
      const aoMudar = (arquivo: string) => {
        const normalizado = resolve(arquivo)
        if (normalizado === caminhoConfiguracao() || normalizado.startsWith(pastaTema())) servidor.ws.send({ type: 'full-reload' })
      }
      servidor.watcher.on('change', aoMudar)
      servidor.watcher.on('add', aoMudar)
      servidor.watcher.on('unlink', aoMudar)
      servidor.middlewares.use(ROTA_PUBLICADA, (_requisicao, resposta) => {
        const envelope = lerEnvelope()
        const fonte = envelope === null ? null : fonteHigienizada(envelope)
        if (fonte === null) {
          resposta.statusCode = 404
          resposta.end()
          return
        }
        resposta.setHeader('Content-Type', 'application/json; charset=utf-8')
        resposta.end(fonte)
      })
    },
    closeBundle() {
      if (!emBuild || ultimoScript === null) return
      const bytes = Buffer.byteLength(ultimoScript, 'utf8')
      const hash = createHash('sha256').update(ultimoScript, 'utf8').digest('base64')
      console.log(`Aparência: script inicial com ${bytes} bytes, hash sha256-${hash}`)
    },
  }
}
