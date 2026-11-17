import { describe, expect, it } from 'vitest'
import { CARTAO_DE_TESTE, registroDeTeste } from '../../testes/armazenamentoFalso'
import { MISSOES_CATALOGO, ROTA_SUPORTE, gerarCartao, gerarRegistros } from '../../testes/geradoresJornada'
import { type Gerador, paraTodo } from '../../testes/propriedade'
import { escalaDaMissao } from '../catalogos/catalogoRotas'
import { calcularProgressoRota } from '../progressoRota'
import { DESTINO_SEM_CARTAO, decidirPortao } from './portoes'
import type { RotaResolvida } from './rotas'

function gerarRota(g: Gerador): RotaResolvida {
  const fixas: RotaResolvida[] = [
    { pagina: 'inicio' },
    { pagina: 'check-in', motivo: null, rapido: false },
    { pagina: 'check-in', motivo: 'sem-cartao', rapido: true },
    { pagina: 'plano-de-voo' },
    { pagina: 'caixa-preta', sessao: 'sessao-1' },
    { pagina: 'breve' },
    { pagina: 'hangar' },
    { pagina: 'aulas', nivel: null, modo: 'lesson', aula: null },
    { pagina: 'treino' },
    { pagina: 'caderno' },
    { pagina: 'comandante' },
    { pagina: 'nao-encontrada', caminho: '/x', missaoDesconhecida: null },
  ]
  if (g.inteiro(0, 1) === 0) return g.escolher(fixas)
  return {
    pagina: 'cabine',
    missao: g.escolher(MISSOES_CATALOGO),
    semente: g.inteiro(0, 1) === 0 ? null : g.inteiro(1, 999),
    causa: null,
    nova: g.inteiro(0, 1) === 1,
  }
}

describe('decidirPortao', () => {
  it('Feature: jornada-de-voo, Property 13: Portões da jornada (modo de demonstração inativo)', () => {
    paraTodo(
      'portões',
      (g) => ({ rota: gerarRota(g), cartao: g.inteiro(0, 2) === 0 ? null : gerarCartao(g), registros: gerarRegistros(g) }),
      ({ rota, cartao, registros }) => {
        const decisao = decidirPortao(rota, cartao, registros)
        const protegida = rota.pagina === 'plano-de-voo' || rota.pagina === 'cabine'
        expect(decisao.tipo === 'redirecionar').toBe(protegida && cartao === null)
        if (decisao.tipo === 'redirecionar') {
          expect(decisao.para).toBe('/check-in?motivo=sem-cartao')
          return
        }
        if (rota.pagina !== 'cabine') {
          expect(decisao).toEqual({ tipo: 'exibir' })
          return
        }
        const local = escalaDaMissao(rota.missao)
        const emPreparacao = local?.missao.status !== 'disponivel'
        expect(decisao.tipo === 'aviso-missao-em-preparacao').toBe(emPreparacao)
        const bloqueada = calcularProgressoRota(ROTA_SUPORTE, registros)[local?.indice ?? 0].estado === 'bloqueada'
        expect(decisao.tipo === 'aviso-escala-bloqueada').toBe(!emPreparacao && bloqueada)
        expect(decisao.tipo === 'exibir').toBe(!emPreparacao && !bloqueada)
      },
    )
  })

  it('exemplos com o catálogo atual', () => {
    const cabine = (missao: (typeof MISSOES_CATALOGO)[number]): RotaResolvida => ({
      pagina: 'cabine',
      missao,
      semente: null,
      causa: null,
      nova: false,
    })
    expect(DESTINO_SEM_CARTAO).toBe('/check-in?motivo=sem-cartao')
    expect(decidirPortao({ pagina: 'plano-de-voo' }, null, [])).toEqual({ tipo: 'redirecionar', para: DESTINO_SEM_CARTAO })
    expect(decidirPortao(cabine('reset-senha-desbloqueio'), CARTAO_DE_TESTE, [])).toEqual({ tipo: 'aviso-missao-em-preparacao' })
    expect(decidirPortao(cabine('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [])).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(cabine('incidente-massivo'), CARTAO_DE_TESTE, [])).toEqual({
      tipo: 'aviso-escala-bloqueada',
      escalaNecessaria: 'service-desk-n1-jr',
    })
    const comRegistro = [registroDeTeste('pasta-rede-inacessivel', 's-1')]
    expect(decidirPortao(cabine('incidente-massivo'), CARTAO_DE_TESTE, comRegistro)).toEqual({ tipo: 'exibir' })
    // Causa em preparação (C4) não muda a decisão: só o status da Missão conta.
    expect(decidirPortao({ ...cabine('pasta-rede-inacessivel'), causa: 'C4' }, CARTAO_DE_TESTE, [])).toEqual({ tipo: 'exibir' })
  })
})
