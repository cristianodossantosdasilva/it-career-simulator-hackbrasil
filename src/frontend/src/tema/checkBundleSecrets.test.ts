import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const script = join(raiz, 'scripts', 'check-bundle-secrets.mjs')
const pastas: string[] = []

function pastaTemporaria(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'itfs-dist-'))
  pastas.push(pasta)
  return pasta
}

function rodar(pasta: string): { codigo: number; saida: string } {
  try {
    const saida = execFileSync(process.execPath, [script, pasta], { cwd: raiz, encoding: 'utf8', stdio: 'pipe' })
    return { codigo: 0, saida }
  } catch (erro) {
    const falha = erro as { status?: number; stdout?: string; stderr?: string }
    return { codigo: falha.status ?? 1, saida: `${falha.stdout ?? ''}${falha.stderr ?? ''}` }
  }
}

afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

describe('verificação de segredos no dist', () => {
  it('um index.html limpo termina com código 0', () => {
    const pasta = pastaTemporaria()
    writeFileSync(join(pasta, 'index.html'), '<!doctype html><script type="application/json" id="itfs-config-cliente">{"versao":1}</script>')
    expect(rodar(pasta).codigo).toBe(0)
  })

  it('um padrão de segredo no index.html termina com código 1 e cita o arquivo', () => {
    const pasta = pastaTemporaria()
    // montado por concatenação para o próprio teste não conter o padrão
    const segredo = ['AK', 'IA', 'ABCDEFGHIJKLMNOP'].join('')
    writeFileSync(join(pasta, 'index.html'), `<!doctype html><script type="application/json" id="itfs-config-cliente">{"chave":"${segredo}"}</script>`)
    const resultado = rodar(pasta)
    expect(resultado.codigo).toBe(1)
    expect(resultado.saida).toContain('index.html')
  })

  it('também varre subpastas como config', () => {
    const pasta = pastaTemporaria()
    writeFileSync(join(pasta, 'index.html'), '<!doctype html>')
    mkdirSync(join(pasta, 'config'))
    writeFileSync(join(pasta, 'config', 'tema-cliente.json'), `{"x":"${['gh', 'p_'].join('')}${'a'.repeat(36)}"}`)
    const resultado = rodar(pasta)
    expect(resultado.codigo).toBe(1)
    expect(resultado.saida).toContain('tema-cliente.json')
  })
})
