import { describe, expect, it } from 'vitest'
import { criarArmazenamentoFalso, registroDeTeste } from '../../testes/armazenamentoFalso'
import { gerarRegistro, gerarRegistros } from '../../testes/geradoresJornada'
import { paraTodo } from '../../testes/propriedade'
import {
  CHAVE_REGISTROS_VOO,
  analisarRegistros,
  gravarRegistro,
  gravarRegistros,
  lerRegistros,
  serializarRegistros,
} from './registrosVoo'

const CORRUPCOES: readonly ((registro: Record<string, unknown>) => void)[] = [
  (r) => (r.versao = 0),
  (r) => (r.sessaoId = 'com espaço'),
  (r) => (r.sessaoId = ''),
  (r) => (r.missao = 'missao-fora-do-catalogo'),
  (r) => (r.rotaId = 'rota-fora'),
  (r) => (r.versaoCenario = null),
  (r) => (r.vertenteId = 3),
  (r) => (r.concluidoEm = 'depois'),
  (r) => (r.resultado = { concluida: false }),
  (r) => ((r.resultado as Record<string, unknown>).concluida = false),
  (r) => ((r.resultado as Record<string, unknown>).xpTotal = '10'),
  (r) => ((r.resultado as Record<string, unknown>).criterios = [{ id: 1 }]),
]

describe('registrosVoo', () => {
  it('Feature: jornada-de-voo, Property 6: Ida e volta do armazenamento (registros)', () => {
    paraTodo('ida e volta dos registros', (g) => gerarRegistros(g), (registros) => {
      expect(analisarRegistros(serializarRegistros(registros))).toEqual(registros)
      const armazenamento = criarArmazenamentoFalso()
      expect(gravarRegistros(armazenamento, registros)).toBe(true)
      expect(lerRegistros(armazenamento)).toEqual(registros)
    })
  })

  it('Feature: jornada-de-voo, Property 7: Dado inválido é tratado como ausente (registros item a item)', () => {
    paraTodo(
      'itens inválidos são descartados e os válidos mantidos',
      (g) => {
        const validos = gerarRegistros(g, 5)
        const invalidos = Array.from({ length: g.inteiro(1, 4) }, (_, i) => ({
          registro: gerarRegistro(g, `invalido-${i}`),
          corrupcao: g.inteiro(0, CORRUPCOES.length - 1),
        }))
        return { validos, invalidos, lixo: g.texto(8) }
      },
      ({ validos, invalidos, lixo }) => {
        const corrompidos = invalidos.map(({ registro, corrupcao }) => {
          const copia = JSON.parse(JSON.stringify(registro)) as Record<string, unknown>
          CORRUPCOES[corrupcao](copia)
          return copia
        })
        const texto = JSON.stringify({ versao: 1, registros: [...corrompidos, ...validos, lixo, null, 7] })
        expect(analisarRegistros(texto)).toEqual(validos)
      },
    )
  })

  it('Feature: jornada-de-voo, Property 7: Dado inválido é tratado como ausente (arquivo inteiro)', () => {
    paraTodo(
      'texto arbitrário vira lista vazia',
      (g) => g.escolher([g.texto(40), '{', '[]', '{"versao":2,"registros":[]}', '{"versao":1}']),
      (texto) => {
        expect(() => analisarRegistros(texto)).not.toThrow()
        expect(analisarRegistros(texto)).toEqual([])
      },
    )
  })

  it('mantém o registro mesmo com escala e Vertente divergentes do catálogo atual', () => {
    const antigo = { ...registroDeTeste('triagem-engenharia-social', 'sessao-antiga'), escalaId: 'help-desk-n1', vertenteId: null }
    expect(analisarRegistros(serializarRegistros([antigo]))).toEqual([antigo])
  })

  it('gravarRegistro é idempotente por sessão e devolve falso quando setItem lança', () => {
    const armazenamento = criarArmazenamentoFalso()
    const primeiro = registroDeTeste('pasta-rede-inacessivel', 'sessao-1')
    expect(gravarRegistro(armazenamento, primeiro)).toBe(true)
    expect(gravarRegistro(armazenamento, { ...primeiro, versaoCenario: '9.9.9' })).toBe(true)
    expect(lerRegistros(armazenamento)).toEqual([{ ...primeiro, versaoCenario: '9.9.9' }])
    expect(armazenamento.gravacoes.every((g) => g.chave === CHAVE_REGISTROS_VOO)).toBe(true)
    expect(gravarRegistro(criarArmazenamentoFalso({}, { falharGravacao: true }), primeiro)).toBe(false)
    expect(lerRegistros(criarArmazenamentoFalso({}, { falharLeitura: true }))).toEqual([])
  })
})
