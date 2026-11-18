import { afterEach, describe, expect, it } from 'vitest'
import { CATALOGO_ROTAS, escalaDaMissao, missoesDaEscala } from '../jornada/catalogos/catalogoRotas'
import {
  AI_KB,
  CARDS,
  CHAVE_ARMAZENAMENTO_ACADEMIA,
  CONCEPTS,
  DEFAULT_PAGES,
  LESSONS,
  LEVELS,
  STAR_PREFILLS,
  calcularProgressoNivel,
  carregarEstadoAcademia,
  criarEstadoInicialAcademia,
  nivelPorCenarioId,
  obterPatente,
  obterProximaAcao,
} from './catalogoEducacional'

afterEach(() => {
  window.localStorage.clear()
})

const ROTA = CATALOGO_ROTAS[0]
const NOMES_DA_TRILHA = [
  'Help Desk N1',
  'Service Desk N1 Jr',
  'N2 Pleno',
  'N3-A Redes e Nuvem',
  'N3-B Data Center e Backup',
  'N3-C Segurança e Dados',
]

describe('Trilha educacional derivada do Catálogo de Rotas', () => {
  it('segue as escalas e as Vertentes do catálogo, na mesma ordem e com os mesmos nomes', () => {
    expect(LEVELS.map((nivel) => nivel.nome)).toEqual(NOMES_DA_TRILHA)
    const esperados = ROTA.escalas.flatMap((escala) =>
      escala.vertentes.length > 0 ? escala.vertentes.map((vertente) => vertente.id) : [escala.id],
    )
    expect(LEVELS.map((nivel) => nivel.id)).toEqual(esperados)
  })

  it('para cada nível, o cenário de prática pertence à escala (ou Vertente) de mesmo nome', () => {
    for (const nivel of LEVELS) {
      const local = escalaDaMissao(nivel.cenarioId)
      expect(local, nivel.id).not.toBeNull()
      expect(local?.vertente?.nome ?? local?.escala.nome, nivel.id).toBe(nivel.nome)
      for (const cenarioId of nivel.cenarioIds) {
        const doCenario = escalaDaMissao(cenarioId)
        expect(doCenario?.vertente?.nome ?? doCenario?.escala.nome, cenarioId).toBe(nivel.nome)
      }
    }
  })

  it('cada Missão do catálogo pertence a exatamente um nível', () => {
    const todas = ROTA.escalas.flatMap((escala) => missoesDaEscala(escala).map((item) => item.missao.id))
    expect(todas.length).toBeGreaterThan(0)
    for (const missao of todas) {
      expect(LEVELS.filter((nivel) => nivel.cenarioIds.includes(missao)), missao).toHaveLength(1)
      expect(nivelPorCenarioId(missao), missao).not.toBeNull()
    }
    expect(LEVELS.flatMap((nivel) => nivel.cenarioIds).sort()).toEqual([...todas].sort())
  })

  it('a primeira aula pratica uma missão da primeira escala', () => {
    const primeiraEscala = ROTA.escalas[0]
    const primeiraAula = LESSONS[LEVELS[0].id][0]
    expect(primeiraAula.title).toBe('O que faz o Suporte de TI (e o que é um chamado)')
    const cenario = primeiraAula.cenarioId ?? LEVELS[0].cenarioId
    expect(cenario).toBe('reset-senha-desbloqueio')
    expect(escalaDaMissao(cenario)?.escala.id).toBe(primeiraEscala.id)
    expect(escalaDaMissao(cenario)?.indice).toBe(0)
  })

  it('toda aula pratica uma missão do próprio nível', () => {
    for (const nivel of LEVELS) {
      expect(LESSONS[nivel.id].length, nivel.id).toBeGreaterThan(0)
      expect(CARDS[nivel.id].length, nivel.id).toBeGreaterThan(0)
      for (const aula of LESSONS[nivel.id]) {
        expect(nivel.cenarioIds, aula.id).toContain(aula.cenarioId ?? nivel.cenarioId)
      }
    }
  })

  it('identificadores de aulas, flashcards e níveis em uso existem e não se repetem', () => {
    const aulas = LEVELS.flatMap((nivel) => LESSONS[nivel.id].map((aula) => aula.id))
    const cartoes = LEVELS.flatMap((nivel) => CARDS[nivel.id].map((cartao) => cartao.id))
    expect(new Set(aulas).size).toBe(aulas.length)
    expect(new Set(cartoes).size).toBe(cartoes.length)
    const ids = new Set<string>(LEVELS.map((nivel) => nivel.id))
    for (const conceito of CONCEPTS) expect(ids.has(conceito.level), conceito.name).toBe(true)
    for (const nivel of LEVELS) expect(STAR_PREFILLS[nivel.id], nivel.id).toBeDefined()
    for (const pagina of DEFAULT_PAGES) if (pagina.level) expect(ids.has(pagina.level), pagina.id).toBe(true)
  })

  it('o conteúdo novo cobre reset e desbloqueio na Help Desk N1 e backup na N3-B, e a engenharia social vai para a N3-C', () => {
    const titulos = (nivel: (typeof LEVELS)[number]['id']) => LESSONS[nivel].map((aula) => aula.title).join('|')
    expect(titulos('help-desk-n1')).toMatch(/identidade/i)
    expect(titulos('help-desk-n1')).toMatch(/troca obrigat/i)
    expect(titulos('help-desk-n1')).toMatch(/bloqueada/i)
    expect(titulos('help-desk-n1')).toMatch(/expirada/i)
    expect(titulos('help-desk-n1')).not.toMatch(/engenharia social/i)
    expect(titulos('n3-b-data-center-backup')).toMatch(/log do job/i)
    expect(titulos('n3-b-data-center-backup')).toMatch(/imutável/i)
    expect(titulos('n3-c-seguranca-dados')).toMatch(/engenharia social/i)
    expect(CARDS['n3-c-seguranca-dados'].some((cartao) => /engenharia social/i.test(cartao.f))).toBe(true)
    expect(CARDS['help-desk-n1'].some((cartao) => /engenharia social/i.test(cartao.f))).toBe(false)
  })

  it('o texto do catálogo educacional não traz os rótulos da escada antiga', () => {
    const texto = JSON.stringify({ LEVELS, LESSONS, CARDS, CONCEPTS, STAR_PREFILLS, AI_KB, DEFAULT_PAGES })
    expect(texto).not.toMatch(/Estagiário|Nível [0-9]|Nivel [0-9]|Nível 4b|Analista Jr|Analista Pleno|Especialista SQL/)
  })

})

describe('Progresso e estado salvo', () => {
  it('a prática de um nível com duas missões conta a fração concluída', () => {
    const estado = criarEstadoInicialAcademia()
    expect(calcularProgressoNivel(estado, 'n3-c-seguranca-dados').p).toBe(0)
    estado.labsDone = ['triagem-engenharia-social']
    expect(calcularProgressoNivel(estado, 'n3-c-seguranca-dados').p).toBe(50)
    expect(obterPatente(estado)).toBe('Cadete (iniciante)')
    estado.labsDone = ['triagem-engenharia-social', 'diagnostico-sql-readonly']
    expect(calcularProgressoNivel(estado, 'n3-c-seguranca-dados').p).toBe(100)
    expect(obterPatente(estado)).toBe('N3-C Segurança e Dados')
  })

  it('os cenários novos contam como laboratório concluído', () => {
    const estado = criarEstadoInicialAcademia()
    estado.labsDone = ['reset-senha-desbloqueio', 'falha-backup-restore']
    expect(calcularProgressoNivel(estado, 'help-desk-n1').p).toBe(100)
    expect(calcularProgressoNivel(estado, 'n3-b-data-center-backup').p).toBe(100)
  })

  it('a próxima ação de prática aponta a primeira missão que falta no nível', () => {
    const estado = criarEstadoInicialAcademia()
    const nivel = LEVELS[LEVELS.length - 1]
    estado.lessonsDone = LEVELS.flatMap((item) => LESSONS[item.id].map((aula) => aula.id))
    estado.cards = Object.fromEntries(LEVELS.flatMap((item) => CARDS[item.id].map((cartao) => [cartao.id, { due: 3 }])))
    estado.feynman = LEVELS.map((item) => item.id)
    estado.labsDone = LEVELS.slice(0, -1).flatMap((item) => [...item.cenarioIds])
    const proxima = obterProximaAcao(estado)
    expect(proxima.act).toBe('lab')
    expect(proxima.level).toBe(nivel.id)
    if (proxima.act === 'lab') expect(proxima.cenarioId).toBe('triagem-engenharia-social')
    estado.labsDone = [...estado.labsDone, 'triagem-engenharia-social']
    const seguinte = obterProximaAcao(estado)
    if (seguinte.act === 'lab') expect(seguinte.cenarioId).toBe('diagnostico-sql-readonly')
  })

  it('estado salvo com ids de nível desconhecidos volta ao nível inicial e descarta laboratórios inválidos', () => {
    window.localStorage.setItem(
      CHAVE_ARMAZENAMENTO_ACADEMIA,
      JSON.stringify({ focus: 'estagiario', feynman: ['n1', 'n2-pleno'], labsDone: ['esp', 'reset-senha-desbloqueio', 7] }),
    )
    const estado = carregarEstadoAcademia()
    expect(estado.focus).toBe(LEVELS[0].id)
    expect(estado.feynman).toEqual(['n2-pleno'])
    expect(estado.labsDone).toEqual(['reset-senha-desbloqueio'])
  })

  it('o estado inicial abre no Help Desk N1', () => {
    expect(criarEstadoInicialAcademia().focus).toBe('help-desk-n1')
  })
})
