import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso } from '../testes/armazenamentoFalso'
import { MISSOES_CATALOGO, ROTA_SUPORTE, gerarAvaliacao, gerarRegistro, gerarRegistros } from '../testes/geradoresJornada'
import { paraTodo } from '../testes/propriedade'
import { criarRegistro, gravarRegistro, lerRegistros } from './armazenamento/registrosVoo'
import { escalaDaMissao } from './catalogos/catalogoRotas'
import { agruparRegistros } from './progressoRota'

const AGORA = new Date('2026-11-20T15:00:00.000Z')

describe('Registro_de_Voo e agrupamento do Brevê', () => {
  it('Feature: jornada-de-voo, Property 16: Registro fiel ao Juiz e idempotente (fidelidade)', () => {
    paraTodo(
      'registro copia a avaliação campo a campo',
      (g) => ({ avaliacao: gerarAvaliacao(g), missao: g.escolher(MISSOES_CATALOGO), versao: g.texto(6) }),
      ({ avaliacao, missao, versao }) => {
        const projecao = { meta: { cenarioId: missao, versaoManifesto: versao } } as Parameters<typeof criarRegistro>[1]
        const registro = criarRegistro('sessao-1', projecao, avaliacao, AGORA)
        const local = escalaDaMissao(missao)
        expect(registro).not.toBeNull()
        expect(registro?.resultado).toEqual({
          concluida: true,
          resumo: avaliacao.resumo,
          xpTotal: avaliacao.xpTotal,
          incidenteSeguranca: avaliacao.incidenteSeguranca,
          criterios: avaliacao.criterios.map(({ id, descricao, atendido }) => ({ id, descricao, atendido })),
        })
        expect(registro?.escalaId).toBe(local?.escala.id)
        expect(registro?.vertenteId).toBe(local?.vertente?.id ?? null)
        expect(registro?.versaoCenario).toBe(versao)
        expect(registro?.concluidoEm).toBe(AGORA.toISOString())
        expect(criarRegistro('sessao-1', projecao, { ...avaliacao, concluida: false }, AGORA)).toBeNull()
      },
    )
  })

  it('Feature: jornada-de-voo, Property 16: Registro fiel ao Juiz e idempotente (idempotência)', () => {
    paraTodo(
      'no máximo um registro por sessão, igual ao último gravado',
      (g) => {
        const sessoes = ['s-a', 's-b', 's-c']
        return Array.from({ length: g.inteiro(1, 10) }, () => gerarRegistro(g, g.escolher(sessoes)))
      },
      (sequencia) => {
        const armazenamento = criarArmazenamentoFalso()
        for (const registro of sequencia) gravarRegistro(armazenamento, registro)
        const lidos = lerRegistros(armazenamento)
        const sessoes = new Set(sequencia.map((r) => r.sessaoId))
        expect(lidos).toHaveLength(sessoes.size)
        for (const sessaoId of sessoes) {
          const ultimo = sequencia.filter((r) => r.sessaoId === sessaoId).at(-1)
          expect(lidos.find((r) => r.sessaoId === sessaoId)).toEqual(ultimo)
        }
      },
    )
  })

  it('Feature: jornada-de-voo, Property 17: Agrupamento do Brevê', () => {
    const ordemGrupos = ROTA_SUPORTE.escalas.flatMap((escala) =>
      escala.vertentes.length > 0 ? escala.vertentes.map((v) => `${escala.id}/${v.id}`) : [`${escala.id}/`],
    )
    paraTodo('agrupamento pelo catálogo atual', (g) => gerarRegistros(g, 12), (registros) => {
      const grupos = agruparRegistros(ROTA_SUPORTE, registros)
      expect(grupos.reduce((soma, grupo) => soma + grupo.registros.length, 0)).toBe(registros.length)
      const chaves = grupos.map((grupo) => `${grupo.escala.id}/${grupo.vertente?.id ?? ''}`)
      const indices = chaves.map((chave) => ordemGrupos.indexOf(chave))
      expect(indices.every((indice) => indice >= 0)).toBe(true)
      expect([...indices].sort((a, b) => a - b)).toEqual(indices)
      for (const grupo of grupos) {
        for (const registro of grupo.registros) {
          const local = escalaDaMissao(registro.missao)
          expect(grupo.escala.id).toBe(local?.escala.id)
          expect(grupo.vertente?.id ?? null).toBe(local?.vertente?.id ?? null)
          expect(grupo.linkCaixaPreta(registro)).toBe(`/caixa-preta/${registro.sessaoId}`)
        }
      }
    })
  })
})
