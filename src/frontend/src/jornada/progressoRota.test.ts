import { describe, expect, it } from 'vitest'
import { registroDeTeste } from '../testes/armazenamentoFalso'
import {
  ROTA_SUPORTE,
  comCausasDisponiveis,
  gerarRegistro,
  gerarRotaComStatus,
} from '../testes/geradoresJornada'
import { type Gerador, paraTodo } from '../testes/propriedade'
import type { RegistroDeVoo } from './armazenamento/registrosVoo'
import { type Certificacao, CATALOGO_CERTIFICACOES } from './catalogos/catalogoCertificacoes'
import { type Parceiro, CATALOGO_PARCEIROS } from './catalogos/catalogoParceiros'
import { type Escala, type Missao, type Rota, missoesDaEscala } from './catalogos/catalogoRotas'
import { APRESENTACAO_STATUS, type StatusDisponibilidade } from './catalogos/status'
import { textosDaMissao } from './componentes/textosDaMissao'
import { calcularBrevePiloto, calcularProgressoRota, textoCausas, visaoDoHangar } from './progressoRota'

function disponiveisDa(escala: Escala) {
  return missoesDaEscala(escala).filter((item) => item.missao.status === 'disponivel')
}

/** Registros só de missões da rota gerada, com sessões distintas. */
function gerarRegistrosDaRota(g: Gerador, rota: Rota, maximo = 7): RegistroDeVoo[] {
  const missoes = rota.escalas.flatMap((escala) => missoesDaEscala(escala).map((item) => item.missao.id))
  return Array.from({ length: g.inteiro(0, maximo) }, (_, i) => gerarRegistro(g, `s-${i}`, g.escolher(missoes)))
}

function gerarCenario(g: Gerador) {
  const rota = gerarRotaComStatus(g)
  return { rota, registros: gerarRegistrosDaRota(g, rota) }
}

const CODIGOS_CAUSA = ROTA_SUPORTE.escalas.flatMap((escala) =>
  missoesDaEscala(escala).flatMap((item) => item.missao.causas.map((causa) => causa.codigo)),
)

describe('calcularProgressoRota', () => {
  it('com o catálogo atual e sem registros: só a Help Desk N1 liberada, as demais bloqueadas em cadeia', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [])
    expect(visao.map((v) => [v.escala.id, v.estado])).toEqual([
      ['help-desk-n1', 'liberada'],
      ['service-desk-n1-jr', 'bloqueada'],
      ['n2-pleno', 'bloqueada'],
      ['n3-senior', 'bloqueada'],
    ])
    expect(visao[0].semMissaoDisponivel).toBe(false)
    expect(visao[0].cumprida).toBe(false)
    expect(visao[1].liberadaPorPreparacao).toBe(false)
    expect(visao[1].escalaNecessaria?.id).toBe('help-desk-n1')
    expect(visao[2].escalaNecessaria?.id).toBe('service-desk-n1-jr')
    expect(visao[3].grupos.map((grupo) => grupo.vertente?.nome)).toEqual([
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
  })

  it('o registro de pasta-rede-inacessivel sozinho não libera o embarque da Service Desk N1 Jr: a Help Desk N1 vem antes', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [registroDeTeste('pasta-rede-inacessivel', 's-1')])
    expect(visao[0].estado).toBe('liberada')
    expect(visao[1].estado).toBe('bloqueada')
    expect(visao[1].escalaNecessaria?.id).toBe('help-desk-n1')
  })
  it('os registros de reset-senha-desbloqueio e de pasta-rede-inacessivel concluem as duas primeiras escalas e liberam a N2 Pleno', () => {
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

  it('Feature: jornada-de-voo, Property 11: Progresso da rota', () => {
    paraTodo('progresso da rota', gerarCenario, ({ rota, registros }) => {
      const visao = calcularProgressoRota(rota, registros)
      const comRegistro = new Set(registros.map((r) => r.missao))
      expect(visao.map((v) => v.escala.id)).toEqual(rota.escalas.map((e) => e.id))
      expect(visao[0].estado).not.toBe('bloqueada')

      visao.forEach((v, i) => {
        const disponiveis = disponiveisDa(v.escala)
        const cumprida = disponiveis.every((item) => comRegistro.has(item.missao.id))
        expect(v.cumprida).toBe(cumprida)
        expect(v.semMissaoDisponivel).toBe(disponiveis.length === 0)
        if (i > 0) {
          expect(v.estado === 'bloqueada').toBe(!visao[i - 1].cumprida)
          expect(v.escalaNecessaria?.id ?? null).toBe(v.estado === 'bloqueada' ? rota.escalas[i - 1].id : null)
          expect(v.liberadaPorPreparacao).toBe(v.estado !== 'bloqueada' && visao[i - 1].semMissaoDisponivel)
        } else {
          expect(v.liberadaPorPreparacao).toBe(false)
        }
        if (v.estado === 'concluida') expect(disponiveis.length > 0 && cumprida).toBe(true)

        const esperadoGrupos = v.escala.vertentes.length > 0 ? v.escala.vertentes.map((x) => x.id) : [null]
        expect(v.grupos.map((grupo) => grupo.vertente?.id ?? null)).toEqual(esperadoGrupos)

        const missoes = v.grupos.flatMap((grupo) => grupo.missoes)
        const catalogo = missoesDaEscala(v.escala)
        for (const visaoMissao of missoes) {
          const missao = catalogo.find((item) => item.missao.id === visaoMissao.missao)?.missao
          if (missao?.status !== 'disponivel') {
            expect(visaoMissao.estado).toBe('em-preparacao')
            expect(visaoMissao.podeEmbarcar).toBe(false)
          } else if (comRegistro.has(visaoMissao.missao)) {
            expect(visaoMissao.estado).toBe('concluida')
          } else if (v.estado === 'bloqueada') {
            expect(visaoMissao.estado).toBe('bloqueada')
            expect(visaoMissao.podeEmbarcar).toBe(false)
          }
          if (missao?.status === 'disponivel') expect(visaoMissao.podeEmbarcar).toBe(v.estado !== 'bloqueada')
        }
        const pendentes = missoes.filter((m) => m.estado === 'disponivel' || m.estado === 'bloqueada')
        expect(new Set(pendentes.map((m) => m.podeEmbarcar)).size).toBeLessThanOrEqual(1)
      })
    })
  })

  it('Feature: jornada-de-voo, Property 12: Liberação monotônica', () => {
    paraTodo(
      'um registro novo nunca bloqueia escala liberada',
      (g) => {
        const cenario = gerarCenario(g)
        const missoes = cenario.rota.escalas.flatMap((escala) => missoesDaEscala(escala).map((item) => item.missao.id))
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

  it('Feature: jornada-de-voo, Property 26: Causas não mudam o embarque', () => {
    paraTodo(
      'status das Causas só muda a contagem',
      (g) => {
        const rotaMissoes = gerarRotaComStatus(g, { missoes: true, causas: false })
        // Mesmos status de Missão, Causas sorteadas.
        const rota: Rota = {
          ...rotaMissoes,
          escalas: rotaMissoes.escalas.map((escala) => ({
            ...escala,
            missoes: escala.missoes.map((m) => ({ ...m, causas: m.causas.map((c) => ({ ...c, status: g.escolher(['disponivel', 'em-preparacao'] as const) })) })),
            vertentes: escala.vertentes.map((v) => ({
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
          const catalogo = missoesDaEscala(v.escala)
          missoes.forEach((m, j) => {
            expect(m.estado).toBe(missoesRef[j].estado)
            expect(m.podeEmbarcar).toBe(missoesRef[j].podeEmbarcar)
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

describe('calcularBrevePiloto', () => {
  it('com o catálogo atual: pendente e nenhuma exigência aguarda preparação', () => {
    const todas = ROTA_SUPORTE.escalas
      .slice(1)
      .map((escala, i) => registroDeTeste(disponiveisDa(escala)[0].missao.id, `s-${i}`))
    const breve = calcularBrevePiloto(ROTA_SUPORTE, todas)
    expect(breve.conquistado).toBe(false)
    expect(breve.exigencias.map((e) => e.escalaId)).toEqual(ROTA_SUPORTE.escalas.map((e) => e.id))
    expect(breve.exigencias[0]).toMatchObject({ cumprida: false, aguardaPreparacao: false })
    expect(breve.exigencias.slice(1).every((e) => e.cumprida)).toBe(true)
    expect(breve.exigencias[3].rotulo).toBe('Ao menos um voo em uma das vertentes da N3 Sênior')
  })

  it('Feature: jornada-de-voo, Property 25: Brevê de piloto', () => {
    paraTodo('brevê de piloto', gerarCenario, ({ rota, registros }) => {
      const breve = calcularBrevePiloto(rota, registros)
      const comRegistro = new Set(registros.map((r) => r.missao))
      expect(breve.exigencias.map((e) => e.escalaId)).toEqual(rota.escalas.map((e) => e.id))
      breve.exigencias.forEach((exigencia, i) => {
        const escala = rota.escalas[i]
        const cumprida = missoesDaEscala(escala).some((item) => comRegistro.has(item.missao.id))
        expect(exigencia.cumprida).toBe(cumprida)
        expect(exigencia.aguardaPreparacao).toBe(!cumprida && disponiveisDa(escala).length === 0)
      })
      expect(breve.conquistado).toBe(breve.exigencias.every((e) => e.cumprida))
      expect(calcularBrevePiloto(rota, registros)).toEqual(breve)
    })
  })
})

const TRES_STATUS: readonly StatusDisponibilidade[] = ['disponivel', 'em-preparacao', 'futuro']

function comTresStatus(g: Gerador, rota: Rota): Rota {
  const sortear = (missao: Missao): Missao => ({ ...missao, status: g.escolher(TRES_STATUS) })
  return {
    ...rota,
    status: g.escolher(TRES_STATUS),
    escalas: rota.escalas.map((escala) => ({
      ...escala,
      missoes: escala.missoes.map(sortear),
      vertentes: escala.vertentes.map((vertente) => ({ ...vertente, missoes: vertente.missoes.map(sortear) })),
    })),
  }
}

function gerarCatalogos(g: Gerador) {
  const rota = comTresStatus(g, ROTA_SUPORTE)
  const rotaSemEscalas: Rota = { ...rota, id: 'rota-extra', nome: 'Rota extra', status: g.escolher(TRES_STATUS), escalas: [] }
  const certificacoes: Certificacao[] = CATALOGO_CERTIFICACOES.map((item) => ({ ...item, status: g.escolher(TRES_STATUS) }))
  const parceiros: Parceiro[] = CATALOGO_PARCEIROS.map((item) => ({ ...item, status: g.escolher(TRES_STATUS) }))
  return { rotas: [rota, rotaSemEscalas], certificacoes, parceiros }
}

function textoEIconeDefinidos(item: { statusTexto: string; statusIcone: string }, status: StatusDisponibilidade) {
  expect(item.statusTexto).toBeTruthy()
  expect(item.statusIcone).toBeTruthy()
  expect(item.statusTexto).toBe(APRESENTACAO_STATUS[status].texto)
  expect(item.statusIcone).toBe(APRESENTACAO_STATUS[status].icone)
}

describe('visaoDoHangar e certificações por escala', () => {
  it('Feature: jornada-de-voo, Property 18: Catálogo refletido sem cópia', () => {
    paraTodo(
      'o Hangar e as escalas refletem o status de cada item do catálogo',
      gerarCatalogos,
      ({ rotas, certificacoes, parceiros }) => {
        const visao = visaoDoHangar(rotas, certificacoes, parceiros)

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

        // Toda Missão, inclusive as em preparação, uma vez só, no grupo da sua escala e Vertente.
        const esperadas = rotas.flatMap((rota) => rota.escalas.flatMap((escala) => missoesDaEscala(escala).map((item) => ({ ...item, escala }))))
        const exibidas = visao.missoes.flatMap((grupo) => grupo.itens.map((item) => ({ item, grupo })))
        expect(exibidas.map(({ item }) => item.id).sort()).toEqual(esperadas.map(({ missao }) => missao.id).sort())
        for (const { missao, escala, vertente } of esperadas) {
          const ocorrencias = exibidas.filter(({ item }) => item.id === missao.id)
          expect(ocorrencias).toHaveLength(1)
          const { item, grupo } = ocorrencias[0]
          expect(grupo.escala.id).toBe(escala.id)
          expect(grupo.vertente?.id ?? null).toBe(vertente?.id ?? null)
          textoEIconeDefinidos(item, missao.status)
          expect(item.titulo).toBe(textosDaMissao(missao.id).titulo)
        }

        // As certificações de cada escala vêm do mesmo catálogo, na ordem dele, sem lista própria.
        const rota = rotas[0]
        const porEscala = calcularProgressoRota(rota, [], { certificacoes })
        for (const escalaVisao of porEscala) {
          const esperadasDaEscala = certificacoes.filter((item) => item.escalaIds.includes(escalaVisao.escala.id))
          expect(escalaVisao.certificacoes.map((item) => item.id)).toEqual(esperadasDaEscala.map((item) => item.id))
          escalaVisao.certificacoes.forEach((item, i) => textoEIconeDefinidos(item, esperadasDaEscala[i].status))
        }
      },
    )
  })

  it('o catálogo atual põe cada certificação na escala do design e aceita um catálogo vazio', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [])
    expect(visao.map((escala) => escala.certificacoes.map((item) => item.titulo))).toEqual([
      ['CompTIA A+'],
      ['ITIL 4 Foundation', 'CompTIA Network+'],
      ['ITIL 4 Foundation'],
      ['CompTIA Security+', 'Fundamentos de nuvem de provedores públicos (referência genérica)'],
    ])
    expect(calcularProgressoRota(ROTA_SUPORTE, [], { certificacoes: [] }).every((escala) => escala.certificacoes.length === 0)).toBe(true)
  })
})
describe('calcularProgressoRota com o modo de demonstração', () => {
  it('Feature: jornada-de-voo, Property 22: Progresso com o modo de demonstração', () => {
    paraTodo('progresso com o modo', gerarCenario, ({ rota, registros }) => {
      const comRegistro = new Set(registros.map((r) => r.missao))
      const inativo = calcularProgressoRota(rota, registros, { modoDemonstracao: false })
      const ativo = calcularProgressoRota(rota, registros, { modoDemonstracao: true })
      expect(ativo.map((v) => v.escala.id)).toEqual(inativo.map((v) => v.escala.id))
      ativo.forEach((v, i) => {
        // O modo não muda o cálculo por registros.
        expect(v.estadoPorRegistros).toBe(inativo[i].estado)
        expect(inativo[i].estadoPorRegistros).toBe(inativo[i].estado)
        expect(inativo[i].liberadaPorDemonstracao).toBe(false)
        expect(inativo[i].seloDemonstracao).toBe(false)
        expect(v.cumprida).toBe(inativo[i].cumprida)
        // Com o modo ativo nenhuma escala fica bloqueada e o selo vale para todas.
        expect(v.estado).not.toBe('bloqueada')
        expect(v.seloDemonstracao).toBe(true)
        expect(v.escalaNecessaria).toBeNull()
        expect(v.liberadaPorPreparacao).toBe(false)
        expect(v.liberadaPorDemonstracao).toBe(v.estadoPorRegistros === 'bloqueada')
        expect(v.estado).toBe(v.estadoPorRegistros === 'bloqueada' ? 'liberada' : v.estadoPorRegistros)
        const catalogo = missoesDaEscala(v.escala)
        for (const visaoMissao of v.grupos.flatMap((grupo) => grupo.missoes)) {
          const missao = catalogo.find((item) => item.missao.id === visaoMissao.missao)?.missao
          const disponivel = missao?.status === 'disponivel'
          expect(visaoMissao.podeEmbarcar).toBe(disponivel)
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
    expect(visao.map((v) => [v.escala.id, v.estado, v.liberadaPorDemonstracao])).toEqual([
      ['help-desk-n1', 'liberada', false],
      ['service-desk-n1-jr', 'liberada', true],
      ['n2-pleno', 'liberada', true],
      ['n3-senior', 'liberada', true],
    ])
    const missoes = visao.flatMap((v) => v.grupos.flatMap((grupo) => grupo.missoes))
    expect(missoes.some((missao) => missao.estado === 'concluida')).toBe(false)
    expect(missoes.filter((missao) => missao.podeEmbarcar).length).toBeGreaterThan(0)
  })

  it('o Brevê de piloto não recebe o modo', () => {
    expect(calcularBrevePiloto.length).toBe(2)
    expect(calcularBrevePiloto(ROTA_SUPORTE, []).conquistado).toBe(false)
  })
})