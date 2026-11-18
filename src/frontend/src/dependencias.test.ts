import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const pacote = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

const PROIBIDAS = [
  /^tailwindcss$/,
  /^@tailwindcss\//,
  /^shadcn/,
  /^@shadcn\//,
  /^class-variance-authority$/,
  /^framer-motion$/,
  /^motion$/,
  /^@react-spring\//,
  /^react-spring$/,
  /^gsap$/,
  /^animejs$/,
  /^lottie/,
  /^react-transition-group$/,
  /^@formkit\/auto-animate$/,
  /^@radix-ui\//,
  /^react-aria/,
  /^@react-aria\//,
  /^@headlessui\//,
]

const PRODUCAO_ESPERADA = ['@fontsource/inter', '@fontsource/jetbrains-mono', 'lucide-react', 'react', 'react-dom']

describe('dependências do frontend', () => {
  it('não há Tailwind, shadcn, biblioteca de animação, Radix nem React Aria', () => {
    const todas = [...Object.keys(pacote.dependencies), ...Object.keys(pacote.devDependencies)]
    for (const nome of todas) {
      for (const proibida of PROIBIDAS) expect(proibida.test(nome), `dependência proibida: ${nome}`).toBe(false)
    }
  })

  it('não há dependência de produção nova', () => {
    expect(Object.keys(pacote.dependencies).sort()).toEqual(PRODUCAO_ESPERADA)
  })

  it('o único script novo é o postlint da varredura de estilo', () => {
    expect(pacote.scripts.postlint).toBe('node scripts/check-regras-estilo.ts')
  })
})
