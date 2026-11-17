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
import { type Escala, type Rota, missoesDaEscala } from './catalogos/catalogoRotas'
import { calcularBrevePiloto, calcularProgressoRota, textoCausas } from './progressoRota'

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
  it('com o catálogo atual e sem registros: Service Desk N1 Jr liberada por preparação, N2 e N3 bloqueadas', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [])
    expect(visao.map((v) => [v.escala.id, v.estado])).toEqual([
      ['help-desk-n1', 'liberada'],
      ['service-desk-n1-jr', 'liberada'],
      ['n2-pleno', 'bloqueada'],
      ['n3-senior', 'bloqueada'],
    ])
    expect(visao[0].semMissaoDisponivel).toBe(true)
    expect(visao[0].cumprida).toBe(true)
    expect(visao[1].liberadaPorPreparacao).toBe(true)
    expect(visao[2].escalaNecessaria?.id).toBe('service-desk-n1-jr')
    expect(visao[3].grupos.map((grupo) => grupo.vertente?.nome)).toEqual([
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
  })

  it('um registro de pasta-rede-inacessivel conclui o Service Desk N1 Jr e libera a N2 Pleno', () => {
    const visao = calcularProgressoRota(ROTA_SUPORTE, [registroDeTeste('pasta-rede-inacessivel', 's-1')])
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
  it('com o catálogo atual: pendente e Help Desk N1 aguardando preparação', () => {
    const todas = ROTA_SUPORTE.escalas
      .slice(1)
      .map((escala, i) => registroDeTeste(disponiveisDa(escala)[0].missao.id, `s-${i}`))
    const breve = calcularBrevePiloto(ROTA_SUPORTE, todas)
    expect(breve.conquistado).toBe(false)
    expect(breve.exigencias.map((e) => e.escalaId)).toEqual(ROTA_SUPORTE.escalas.map((e) => e.id))
    expect(breve.exigencias[0]).toMatchObject({ cumprida: false, aguardaPreparacao: true })
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
