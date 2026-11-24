import { describe, expect, it } from 'vitest'
import { registroDeTeste } from '../testes/armazenamentoFalso'
import {
  ROTA_SUPORTE,
  comCausasDisponiveis,
  gerarRegistro,
  gerarRotaComStatus,
} from '../testes/geradoresJornada'
import { type Gerador, paraTodo } from '../testes/propriedade'
import type { RegistroDeMissao } from './armazenamento/registrosMissao'
import { type Certificacao, CATALOGO_CERTIFICACOES } from './catalogos/catalogoCertificacoes'
import { type Parceiro, CATALOGO_PARCEIROS } from './catalogos/catalogoParceiros'
import { type Etapa, type Missao, type Rota, missoesDaEtapa } from './catalogos/catalogoRotas'
import { APRESENTACAO_STATUS, type StatusDisponibilidade } from './catalogos/status'
import { textosDaMissao } from './componentes/textosDaMissao'
import { calcularPortfolioAnalista, calcularProgressoRota, textoCausas, visaoDoCatalogo } from './progressoRota'

function disponiveisDa(etapa: Etapa) {
  return missoesDaEtapa(etapa).filter((item) => item.missao.status === 'disponivel')
}

/** Registros só de missões da rota gerada, com sessões distintas. */
function gerarRegistrosDaRota(g: Gerador, rota: Rota, maximo = 7): RegistroDeMissao[] {
  const missoes = rota.etapas.flatMap((etapa) => missoesDaEtapa(etapa).map((item) => item.missao.id))
  return Array.from({ length: g.inteiro(0, maximo) }, (_, i) => gerarRegistro(g, `s-${i}`, g.escolher(missoes)))
}

function gerarCenario(g: Gerador) {
  const rota = gerarRotaComStatus(g)
  return { rota, registros: gerarRegistrosDaRota(g, rota) }
}

const CODIGOS_CAUSA = ROTA_SUPORTE.etapas.flatMap((etapa) =>
  missoesDaEtapa(etapa).flatMap((item) => item.missao.causas.map((causa) => causa.codigo)),
)

describe('calcularProgressoRota', () => {
  it('com o catálogo atual e sem registros: só a Help Desk N1 liberada, as demais bloqueadas em cadeia', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [])
    expect(visao.map((v) => [v.etapa.id, v.estado])).toEqual([
      ['help-desk-n1', 'liberada'],
      ['service-desk-n1-jr', 'bloqueada'],
      ['n2-pleno', 'bloqueada'],
      ['n3-senior', 'bloqueada'],
    ])
    expect(visao[0].semMissaoDisponivel).toBe(false)
    expect(visao[0].cumprida).toBe(false)
    expect(visao[1].liberadaPorPreparacao).toBe(false)
    expect(visao[1].etapaNecessaria?.id).toBe('help-desk-n1')
    expect(visao[2].etapaNecessaria?.id).toBe('service-desk-n1-jr')
    expect(visao[3].grupos.map((grupo) => grupo.vertente?.nome)).toEqual([
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
  })

  it('o registro de pasta-rede-inacessivel sozinho não libera o perfil da Service Desk N1 Jr: a Help Desk N1 vem antes', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [registroDeTeste('pasta-rede-inacessivel', 's-1')])
    expect(visao[0].estado).toBe('liberada')
    expect(visao[1].estado).toBe('bloqueada')
    expect(visao[1].etapaNecessaria?.id).toBe('help-desk-n1')
  })
  it('os registros de reset-senha-desbloqueio e de pasta-rede-inacessivel concluem as duas primeiras etapas e liberam a N2 Pleno', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [
      registroDeTeste('reset-senha-desbloqueio', 's-0'),
      registroDeTeste('pasta-rede-inacessivel', 's-1'),
    ])
    expect(visao[0].estado).toBe('concluida')
    expect(visao[1].estado).toBe('concluida')
    expect(visao[2].estado).toBe('liberada')
    expect(visao[2].liberadaPorPreparacao).toBe(false)
    expect(visao[3].estado).toBe('bloqueada')
  })

  it('Feature: jornada-de-missao, Property 11: Progresso da rota', () => {
    paraTodo('progresso da rota', gerarCenario, ({ rota, registros }) => {
      const visao = calcularProgressoRota(rota, registros)
      const comRegistro = new Set(registros.map((r) => r.missao))
      expect(visao.map((v) => v.etapa.id)).toEqual(rota.etapas.map((e) => e.id))
      expect(visao[0].estado).not.toBe('bloqueada')

      visao.forEach((v, i) => {
        const disponiveis = disponiveisDa(v.etapa)
        const cumprida = disponiveis.every((item) => comRegistro.has(item.missao.id))
        expect(v.cumprida).toBe(cumprida)
        expect(v.semMissaoDisponivel).toBe(disponiveis.length === 0)
        if (i > 0) {
          expect(v.estado === 'bloqueada').toBe(!visao[i - 1].cumprida)
          expect(v.etapaNecessaria?.id ?? null).toBe(v.estado === 'bloqueada' ? rota.etapas[i - 1].id : null)
          expect(v.liberadaPorPreparacao).toBe(v.estado !== 'bloqueada' && visao[i - 1].semMissaoDisponivel)
        } else {
          expect(v.liberadaPorPreparacao).toBe(false)
        }
        if (v.estado === 'concluida') expect(disponiveis.length > 0 && cumprida).toBe(true)

        const esperadoGrupos = v.etapa.vertentes.length > 0 ? v.etapa.vertentes.map((x) => x.id) : [null]
        expect(v.grupos.map((grupo) => grupo.vertente?.id ?? null)).toEqual(esperadoGrupos)

        const missoes = v.grupos.flatMap((grupo) => grupo.missoes)
        const catalogo = missoesDaEtapa(v.etapa)
        for (const visaoMissao of missoes) {
          const missao = catalogo.find((item) => item.missao.id === visaoMissao.missao)?.missao
          if (missao?.status !== 'disponivel') {
            expect(visaoMissao.estado).toBe('em-preparacao')
            expect(visaoMissao.podeIniciar).toBe(false)
          } else if (comRegistro.has(visaoMissao.missao)) {
            expect(visaoMissao.estado).toBe('concluida')
          } else if (v.estado === 'bloqueada') {
            expect(visaoMissao.estado).toBe('bloqueada')
            expect(visaoMissao.podeIniciar).toBe(false)
          }
          if (missao?.status === 'disponivel') expect(visaoMissao.podeIniciar).toBe(v.estado !== 'bloqueada')
        }
        const pendentes = missoes.filter((m) => m.estado === 'disponivel' || m.estado === 'bloqueada')
        expect(new Set(pendentes.map((m) => m.podeIniciar)).size).toBeLessThanOrEqual(1)
      })
    })
  })

  it('Feature: jornada-de-missao, Property 12: Liberação monotônica', () => {
    paraTodo(
      'um registro novo nunca bloqueia etapa liberada',
      (g) => {
        const cenario = gerarCenario(g)
        const missoes = cenario.rota.etapas.flatMap((etapa) => missoesDaEtapa(etapa).map((item) => item.missao.id))
        return { ...cenario, novo: gerarRegistro(g, 'sessao-nova', g.escolher(missoes)) }
      },
      ({ rota, registros, novo }) => {
        const antes = calcularProgressoRota(rota, registros)
        const depois = calcularProgressoRota(rota, [...registros, novo])
        antes.forEach((v, i) => {
          if (v.estado !== 'bloqueada') expect(depois[i].estado).not.toBe('bloqueada')
          if (!v.cumprida && depois[i].cumprida && i + 1 < depois.length) {
            expect(depois[i + 1].estado).not.toBe('bloqueada')
          }
        })
      },
    )
  })

  it('Feature: jornada-de-missao, Property 26: Causas não mudam o perfil', () => {
    paraTodo(
      'status das Causas só muda a contagem',
      (g) => {
        const rotaMissoes = gerarRotaComStatus(g, { missoes: true, causas: false })
        // Mesmos status de Missão, Causas sorteadas.
        const rota: Rota = {
          ...rotaMissoes,
          etapas: rotaMissoes.etapas.map((etapa) => ({
            ...etapa,
            missoes: etapa.missoes.map((m) => ({ ...m, causas: m.causas.map((c) => ({ ...c, status: g.escolher(['disponivel', 'em-preparacao'] as const) })) })),
            vertentes: etapa.vertentes.map((v) => ({
              ...v,
              missoes: v.missoes.map((m) => ({ ...m, causas: m.causas.map((c) => ({ ...c, status: g.escolher(['disponivel', 'em-preparacao'] as const) })) })),
            })),
          })),
        }
        return { rota, registros: gerarRegistrosDaRota(g, rota) }
      },
      ({ rota, registros }) => {
        const comCausas = calcularProgressoRota(rota, registros)
        const referencia = calcularProgressoRota(comCausasDisponiveis(rota), registros)
        comCausas.forEach((v, i) => {
          const missoes = v.grupos.flatMap((grupo) => grupo.missoes)
          const missoesRef = referencia[i].grupos.flatMap((grupo) => grupo.missoes)
          const catalogo = missoesDaEtapa(v.etapa)
          missoes.forEach((m, j) => {
            expect(m.estado).toBe(missoesRef[j].estado)
            expect(m.podeIniciar).toBe(missoesRef[j].podeIniciar)
            const causas = catalogo.find((item) => item.missao.id === m.missao)?.missao.causas ?? []
            expect(m.causas.disponiveis).toBe(causas.filter((c) => c.status === 'disponivel').length)
            expect(m.causas.emPreparacao).toBe(causas.filter((c) => c.status === 'em-preparacao').length)
            const texto = textoCausas(m.causas)
            expect(texto).not.toContain('&')
            for (const codigo of CODIGOS_CAUSA) expect(texto).not.toContain(codigo)
          })
        })
      },
    )
  })

  it('textoCausas usa "e" e não mostra código', () => {
    expect(textoCausas({ disponiveis: 3, emPreparacao: 1 })).toBe('3 causas disponíveis e 1 em preparação')
    expect(textoCausas({ disponiveis: 1, emPreparacao: 2 })).toBe('1 causa disponível e 2 em preparação')
    expect(textoCausas({ disponiveis: 0, emPreparacao: 3 })).toBe('3 causas em preparação')
    expect(textoCausas({ disponiveis: 0, emPreparacao: 0 })).toBe('')
  })
})

describe('calcularPortfolioAnalista', () => {
  it('com o catálogo atual: pendente e nenhuma exigência aguarda preparação', () => {
    const todas = ROTA_SUPORTE.etapas
      .slice(1)
      .map((etapa, i) => registroDeTeste(disponiveisDa(etapa)[0].missao.id, `s-${i}`))
    const portfolio = calcularPortfolioAnalista(ROTA_SUPORTE, todas)
    expect(portfolio.conquistado).toBe(false)
    expect(portfolio.exigencias.map((e) => e.escalaId)).toEqual(ROTA_SUPORTE.etapas.map((e) => e.id))
    expect(portfolio.exigencias[0]).toMatchObject({ cumprida: false, aguardaPreparacao: false })
    expect(portfolio.exigencias.slice(1).every((e) => e.cumprida)).toBe(true)
    expect(portfolio.exigencias[3].rotulo).toBe('Ao menos uma missão em uma das vertentes da N3 Sênior')
  })

  it('Feature: jornada-de-missao, Property 25: Portfólio de analista', () => {
    paraTodo('portfólio de analista', gerarCenario, ({ rota, registros }) => {
      const portfolio = calcularPortfolioAnalista(rota, registros)
      const comRegistro = new Set(registros.map((r) => r.missao))
      expect(portfolio.exigencias.map((e) => e.escalaId)).toEqual(rota.etapas.map((e) => e.id))
      portfolio.exigencias.forEach((exigencia, i) => {
        const etapa = rota.etapas[i]
        const cumprida = missoesDaEtapa(etapa).some((item) => comRegistro.has(item.missao.id))
        expect(exigencia.cumprida).toBe(cumprida)
        expect(exigencia.aguardaPreparacao).toBe(!cumprida && disponiveisDa(etapa).length === 0)
      })
      expect(portfolio.conquistado).toBe(portfolio.exigencias.every((e) => e.cumprida))
      expect(calcularPortfolioAnalista(rota, registros)).toEqual(portfolio)
    })
  })
})

const TRES_STATUS: readonly StatusDisponibilidade[] = ['disponivel', 'em-preparacao', 'futuro']

function comTresStatus(g: Gerador, rota: Rota): Rota {
  const sortear = (missao: Missao): Missao => ({ ...missao, status: g.escolher(TRES_STATUS) })
  return {
    ...rota,
    status: g.escolher(TRES_STATUS),
    etapas: rota.etapas.map((etapa) => ({
      ...etapa,
      missoes: etapa.missoes.map(sortear),
      vertentes: etapa.vertentes.map((vertente) => ({ ...vertente, missoes: vertente.missoes.map(sortear) })),
    })),
  }
}

function gerarCatalogos(g: Gerador) {
  const rota = comTresStatus(g, ROTA_SUPORTE)
  const rotaSemEtapas: Rota = { ...rota, id: 'rota-extra', nome: 'Rota extra', status: g.escolher(TRES_STATUS), etapas: [] }
  const certificacoes: Certificacao[] = CATALOGO_CERTIFICACOES.map((item) => ({ ...item, status: g.escolher(TRES_STATUS) }))
  const parceiros: Parceiro[] = CATALOGO_PARCEIROS.map((item) => ({ ...item, status: g.escolher(TRES_STATUS) }))
  return { rotas: [rota, rotaSemEtapas], certificacoes, parceiros }
}

function textoEIconeDefinidos(item: { statusTexto: string; statusIcone: string }, status: StatusDisponibilidade) {
  expect(item.statusTexto).toBeTruthy()
  expect(item.statusIcone).toBeTruthy()
  expect(item.statusTexto).toBe(APRESENTACAO_STATUS[status].texto)
  expect(item.statusIcone).toBe(APRESENTACAO_STATUS[status].icone)
}

describe('visaoDoCatalogo e certificações por etapa', () => {
  it('Feature: jornada-de-missao, Property 18: Catálogo refletido sem cópia', () => {
    paraTodo(
      'o Catálogo e as etapas refletem o status de cada item do catálogo',
      gerarCatalogos,
      ({ rotas, certificacoes, parceiros }) => {
        const visao = visaoDoCatalogo(rotas, certificacoes, parceiros)

        expect(visao.rotas.map((item) => item.id)).toEqual(rotas.map((rota) => rota.id))
        visao.rotas.forEach((item, i) => {
          textoEIconeDefinidos(item, rotas[i].status)
          expect(item.titulo).toBe(rotas[i].nome)
        })
        visao.certificacoes.forEach((item, i) => {
          textoEIconeDefinidos(item, certificacoes[i].status)
          expect([item.id, item.titulo, item.descricao]).toEqual([
            certificacoes[i].id,
            certificacoes[i].nome,
            certificacoes[i].descricao,
          ])
        })
        expect(visao.certificacoes).toHaveLength(certificacoes.length)
        visao.parceiros.forEach((item, i) => {
          textoEIconeDefinidos(item, parceiros[i].status)
          expect(item.descricao).toBe(parceiros[i].descricao)
        })
        expect(visao.parceiros).toHaveLength(parceiros.length)

        // Toda Missão, inclusive as em preparação, uma vez só, no grupo da sua etapa e Vertente.
        const esperadas = rotas.flatMap((rota) => rota.etapas.flatMap((etapa) => missoesDaEtapa(etapa).map((item) => ({ ...item, etapa }))))
        const exibidas = visao.missoes.flatMap((grupo) => grupo.itens.map((item) => ({ item, grupo })))
        expect(exibidas.map(({ item }) => item.id).sort()).toEqual(esperadas.map(({ missao }) => missao.id).sort())
        for (const { missao, etapa, vertente } of esperadas) {
          const ocorrencias = exibidas.filter(({ item }) => item.id === missao.id)
          expect(ocorrencias).toHaveLength(1)
          const { item, grupo } = ocorrencias[0]
          expect(grupo.etapa.id).toBe(etapa.id)
          expect(grupo.vertente?.id ?? null).toBe(vertente?.id ?? null)
          textoEIconeDefinidos(item, missao.status)
          expect(item.titulo).toBe(textosDaMissao(missao.id).titulo)
        }

        // As certificações de cada etapa vêm do mesmo catálogo, na ordem dele, sem lista própria.
        const rota = rotas[0]
        const porEtapa = calcularProgressoRota(rota, [], { certificacoes })
        for (const etapaVisao of porEtapa) {
          const esperadasDaEtapa = certificacoes.filter((item) => item.etapaIds.includes(etapaVisao.etapa.id))
          expect(etapaVisao.certificacoes.map((item) => item.id)).toEqual(esperadasDaEtapa.map((item) => item.id))
          etapaVisao.certificacoes.forEach((item, i) => textoEIconeDefinidos(item, esperadasDaEtapa[i].status))
        }
      },
    )
  })

  it('o catálogo atual põe cada certificação na etapa do design e aceita um catálogo vazio', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [])
    expect(visao.map((etapa) => etapa.certificacoes.map((item) => item.titulo))).toEqual([
      ['CompTIA A+'],
      ['ITIL 4 Foundation', 'CompTIA Network+'],
      ['ITIL 4 Foundation'],
      ['CompTIA Security+', 'Fundamentos de nuvem de provedores públicos (referência genérica)'],
    ])
    expect(calcularProgressoRota(ROTA_SUPORTE, [], { certificacoes: [] }).every((etapa) => etapa.certificacoes.length === 0)).toBe(true)
  })
})
describe('calcularProgressoRota com o modo de demonstração', () => {
  it('Feature: jornada-de-missao, Property 22: Progresso com o modo de demonstração', () => {
    paraTodo('progresso com o modo', gerarCenario, ({ rota, registros }) => {
      const comRegistro = new Set(registros.map((r) => r.missao))
      const inativo = calcularProgressoRota(rota, registros, { modoDemonstracao: false })
      const ativo = calcularProgressoRota(rota, registros, { modoDemonstracao: true })
      expect(ativo.map((v) => v.etapa.id)).toEqual(inativo.map((v) => v.etapa.id))
      ativo.forEach((v, i) => {
        // O modo não muda o cálculo por registros.
        expect(v.estadoPorRegistros).toBe(inativo[i].estado)
        expect(inativo[i].estadoPorRegistros).toBe(inativo[i].estado)
        expect(inativo[i].liberadaPorDemonstracao).toBe(false)
        expect(inativo[i].seloDemonstracao).toBe(false)
        expect(v.cumprida).toBe(inativo[i].cumprida)
        // Com o modo ativo nenhuma etapa fica bloqueada e o selo vale para todas.
        expect(v.estado).not.toBe('bloqueada')
        expect(v.seloDemonstracao).toBe(true)
        expect(v.etapaNecessaria).toBeNull()
        expect(v.liberadaPorPreparacao).toBe(false)
        expect(v.liberadaPorDemonstracao).toBe(v.estadoPorRegistros === 'bloqueada')
        expect(v.estado).toBe(v.estadoPorRegistros === 'bloqueada' ? 'liberada' : v.estadoPorRegistros)
        const catalogo = missoesDaEtapa(v.etapa)
        for (const visaoMissao of v.grupos.flatMap((grupo) => grupo.missoes)) {
          const missao = catalogo.find((item) => item.missao.id === visaoMissao.missao)?.missao
          const disponivel = missao?.status === 'disponivel'
          expect(visaoMissao.podeIniciar).toBe(disponivel)
          if (!disponivel) expect(visaoMissao.estado).toBe('em-preparacao')
          // Concluída só com registro, com o modo ativo ou inativo.
          if (disponivel) expect(visaoMissao.estado === 'concluida').toBe(comRegistro.has(visaoMissao.missao))
        }
        for (const visaoMissao of inativo[i].grupos.flatMap((grupo) => grupo.missoes)) {
          const missao = catalogo.find((item) => item.missao.id === visaoMissao.missao)?.missao
          if (missao?.status === 'disponivel') {
            expect(visaoMissao.estado === 'concluida').toBe(comRegistro.has(visaoMissao.missao))
          }
        }
      })
    })
  })

  it('Property 22: sequência de valores do modo terminada em inativo equivale ao modo inativo', () => {
    paraTodo(
      'desativar volta ao cálculo por registros',
      (g) => ({ ...gerarCenario(g), sequencia: g.lista((h) => h.inteiro(0, 1) === 1, 6) }),
      ({ rota, registros, sequencia }) => {
        const esperado = calcularProgressoRota(rota, registros, { modoDemonstracao: false })
        for (const modoDemonstracao of [...sequencia, false]) calcularProgressoRota(rota, registros, { modoDemonstracao })
        expect(calcularProgressoRota(rota, registros, { modoDemonstracao: false })).toEqual(esperado)
        expect(calcularProgressoRota(rota, registros)).toEqual(esperado)
      },
    )
  })

  it('com o catálogo atual, o modo libera N2 Pleno e N3 Sênior sem concluir nenhuma missão', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [], { modoDemonstracao: true })
    expect(visao.map((v) => [v.etapa.id, v.estado, v.liberadaPorDemonstracao])).toEqual([
      ['help-desk-n1', 'liberada', false],
      ['service-desk-n1-jr', 'liberada', true],
      ['n2-pleno', 'liberada', true],
      ['n3-senior', 'liberada', true],
    ])
    const missoes = visao.flatMap((v) => v.grupos.flatMap((grupo) => grupo.missoes))
    expect(missoes.some((missao) => missao.estado === 'concluida')).toBe(false)
    expect(missoes.filter((missao) => missao.podeIniciar).length).toBeGreaterThan(0)
  })

  it('o Portfólio de analista não recebe o modo', () => {
    expect(calcularPortfolioAnalista.length).toBe(2)
    expect(calcularPortfolioAnalista(ROTA_SUPORTE, []).conquistado).toBe(false)
  })
})