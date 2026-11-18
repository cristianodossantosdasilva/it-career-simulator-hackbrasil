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
  it('Feature: jornada-de-voo, Property 13: Portões da jornada (com o modo de demonstração gerado)', () => {
    paraTodo(
      'portões',
      (g) => ({ rota: gerarRota(g), cartao: g.inteiro(0, 2) === 0 ? null : gerarCartao(g), registros: gerarRegistros(g), modo: g.inteiro(0, 1) === 1 }),
      ({ rota, cartao, registros, modo }) => {
        const decisao = decidirPortao(rota, cartao, registros, modo)
        // O cartão e a Missão em preparação decidem igual com o modo ativo e inativo.
        const semModo = decidirPortao(rota, cartao, registros, false)
        const comModo = decidirPortao(rota, cartao, registros, true)
        expect(comModo.tipo === 'redirecionar').toBe(semModo.tipo === 'redirecionar')
        expect(comModo.tipo === 'aviso-missao-em-preparacao').toBe(semModo.tipo === 'aviso-missao-em-preparacao')
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
        const bloqueada =
          calcularProgressoRota(ROTA_SUPORTE, registros, { modoDemonstracao: false })[local?.indice ?? 0].estado ===
          'bloqueada'
        expect(decisao.tipo === 'aviso-escala-bloqueada').toBe(!modo && !emPreparacao && bloqueada)
        expect(decisao.tipo === 'exibir').toBe(!emPreparacao && (modo || !bloqueada))
      },
    )
  })

  it('com o modo ativo e cartão válido, toda Cabine de Missão disponível exibe', () => {
    paraTodo(
      'cabine de missão disponível com o modo',
      (g) => ({ missao: g.escolher(MISSOES_CATALOGO), cartao: gerarCartao(g), registros: gerarRegistros(g) }),
      ({ missao, cartao, registros }) => {
        const rota: RotaResolvida = { pagina: 'cabine', missao, semente: null, causa: null, nova: false }
        const decisao = decidirPortao(rota, cartao, registros, true)
        const disponivel = escalaDaMissao(missao)?.missao.status === 'disponivel'
        expect(decisao.tipo).toBe(disponivel ? 'exibir' : 'aviso-missao-em-preparacao')
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
    // Com o catálogo atual todas as Missões estão disponíveis; a Help Desk N1 abre a cadeia.
    expect(decidirPortao(cabine('reset-senha-desbloqueio'), CARTAO_DE_TESTE, [])).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(cabine('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [])).toEqual({
      tipo: 'aviso-escala-bloqueada',
      escalaNecessaria: 'help-desk-n1',
    })
    expect(decidirPortao(cabine('incidente-massivo'), CARTAO_DE_TESTE, [])).toEqual({
      tipo: 'aviso-escala-bloqueada',
      escalaNecessaria: 'service-desk-n1-jr',
    })
    const comRegistro = [registroDeTeste('reset-senha-desbloqueio', 's-0'), registroDeTeste('pasta-rede-inacessivel', 's-1')]
    expect(decidirPortao(cabine('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [registroDeTeste('reset-senha-desbloqueio', 's-0')])).toEqual({
      tipo: 'exibir',
    })
    expect(decidirPortao(cabine('incidente-massivo'), CARTAO_DE_TESTE, comRegistro)).toEqual({ tipo: 'exibir' })
    // Com o modo ativo, a Cabine de escala bloqueada abre.
    expect(decidirPortao(cabine('incidente-massivo'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(cabine('sre-cloud-latencia'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(cabine('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao({ pagina: 'plano-de-voo' }, null, [], true)).toEqual({ tipo: 'redirecionar', para: DESTINO_SEM_CARTAO })
    // A Causa pedida (C4) não muda a decisão: só o status da Missão e a escala contam.
    expect(decidirPortao({ ...cabine('pasta-rede-inacessivel'), causa: 'C4' }, CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
  })
})
