import { describe, expect, it } from 'vitest'

/**
 * Conformidade textual da jornada e do sistema de temas: varre os fontes por import.meta.glob e falha se aparecer E comercial
 * em texto ou nome de arquivo, emoji, atributo style em .tsx de produção, cor hexadecimal fora de index.css ou a chave do modo
 * de demonstração fora do módulo dele.
 */
const FONTES = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

const ALTERADOS_FORA_DA_JORNADA = [
  '/src/educacao/BarraSuperior.tsx',
  '/src/ui/catalogoIcones.ts',
  '/src/educacao/AulasView.tsx',
  '/src/educacao/MentorView.tsx',
  '/src/workstation/CredencialView.tsx',
  '/src/shell/AppShell.tsx',
  '/src/shell/BotaoAparencia.tsx',
  '/src/shell/PainelAparencia.tsx',
  '/src/shell/MenuPerfil.tsx',
  '/src/apps/SimuDeskApp/SimuDeskApp.tsx',
]

const ehTeste = (caminho: string) => /\.test\.tsx?$/.test(caminho)

const noEscopo = (caminho: string) =>
  caminho.startsWith('/src/jornada/') || caminho.startsWith('/src/tema/') || ALTERADOS_FORA_DA_JORNADA.includes(caminho)

/** Fontes de produção da jornada, do sistema de temas e dos arquivos alterados por eles. */
const ESCOPO = Object.entries(FONTES).filter(([caminho]) => !ehTeste(caminho) && noEscopo(caminho))
const ESCOPO_COM_TESTES = Object.entries(FONTES).filter(([caminho]) => noEscopo(caminho))

// Montados por código para o próprio arquivo não conter o caractere proibido.
const E_COMERCIAL = String.fromCharCode(38)
const OPERADOR_LOGICO = E_COMERCIAL + E_COMERCIAL

function linhasQue(texto: string, criterio: (linha: string) => boolean): number[] {
  return texto
    .split('\n')
    .map((linha, indice) => (criterio(linha) ? indice + 1 : 0))
    .filter((numero) => numero > 0)
}

describe('Conformidade da jornada', () => {
  it('a varredura encontra os arquivos que deveria vigiar', () => {
    const caminhos = ESCOPO.map(([caminho]) => caminho)
    expect(ESCOPO.length).toBeGreaterThan(50)
    expect(caminhos).toContain('/src/jornada/ProvedorJornada.tsx')
    expect(caminhos).toContain('/src/jornada/paginas/PaginaMesa.tsx')
    expect(caminhos).toContain('/src/tema/resolvedor.ts')
    for (const alterado of ALTERADOS_FORA_DA_JORNADA) expect(caminhos, alterado).toContain(alterado)
  })

  it('nenhum nome de arquivo do projeto tem E comercial', () => {
    for (const caminho of Object.keys(FONTES)) expect(caminho.includes(E_COMERCIAL), caminho).toBe(false)
  })

  it('nenhum fonte de produção tem E comercial fora do operador lógico duplo', () => {
    for (const [caminho, texto] of ESCOPO) {
      const linhas = linhasQue(texto, (linha) => linha.split(OPERADOR_LOGICO).join('').includes(E_COMERCIAL))
      expect(linhas, `${caminho} tem E comercial nas linhas ${linhas.join(', ')}`).toEqual([])
    }
  })

  it('nenhum fonte da jornada, nem teste, tem emoji', () => {
    for (const [caminho, texto] of ESCOPO_COM_TESTES) {
      const linhas = linhasQue(texto, (linha) => /\p{Extended_Pictographic}/u.test(linha))
      expect(linhas, `${caminho} tem emoji nas linhas ${linhas.join(', ')}`).toEqual([])
    }
  })

  it('nenhum .tsx de produção do projeto tem o atributo style', () => {
    const producao = Object.entries(FONTES).filter(([caminho]) => caminho.endsWith('.tsx') && !ehTeste(caminho))
    expect(producao.length).toBeGreaterThan(50)
    for (const [caminho, texto] of producao) {
      const linhas = linhasQue(texto, (linha) => /\bstyle\s*=/.test(linha))
      expect(linhas, `${caminho} tem style= nas linhas ${linhas.join(', ')}`).toEqual([])
    }
  })

  it('não há cor hexadecimal nos fontes (as cores ficam nos tokens de index.css)', () => {
    for (const [caminho, texto] of ESCOPO) {
      const linhas = linhasQue(texto, (linha) => /#[0-9a-fA-F]{3,8}\b/.test(linha))
      expect(linhas, `${caminho} tem cor hexadecimal nas linhas ${linhas.join(', ')}`).toEqual([])
    }
  })

  it('a chave itfs_modo_demonstracao só aparece em modoDemonstracao.ts e nos testes', () => {
    const achados = Object.entries(FONTES)
      .filter(([caminho, texto]) => !ehTeste(caminho) && texto.includes('itfs_modo_demonstracao'))
      .map(([caminho]) => caminho)
    expect(achados).toEqual(['/src/jornada/armazenamento/modoDemonstracao.ts'])
  })
})
