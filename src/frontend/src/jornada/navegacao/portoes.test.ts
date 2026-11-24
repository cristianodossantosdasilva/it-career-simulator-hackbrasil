import { describe, expect, it } from 'vitest'
import { CARTAO_DE_TESTE, registroDeTeste } from '../../testes/armazenamentoFalso'
import { MISSOES_CATALOGO, ROTA_SUPORTE, gerarCartao, gerarRegistros } from '../../testes/geradoresJornada'
import { type Gerador, paraTodo } from '../../testes/propriedade'
import { etapaDaMissao } from '../catalogos/catalogoRotas'
import { calcularProgressoRota } from '../progressoRota'
import { DESTINO_SEM_CARTAO, decidirPortao } from './portoes'
import type { RotaResolvida } from './rotas'

function gerarRota(g: Gerador): RotaResolvida {
  const fixas: RotaResolvida[] = [
    { pagina: 'inicio' },
    { pagina: 'diagnostico', motivo: null, rapido: false },
    { pagina: 'diagnostico', motivo: 'sem-cartao', rapido: true },
    { pagina: 'plano-de-carreira' },
    { pagina: 'revisao', sessao: 'sessao-1' },
    { pagina: 'portfolio' },
    { pagina: 'catalogo' },
    { pagina: 'aulas', nivel: null, modo: 'lesson', aula: null },
    { pagina: 'treino' },
    { pagina: 'caderno' },
    { pagina: 'mentor' },
    { pagina: 'nao-encontrada', caminho: '/x', missaoDesconhecida: null },
  ]
  if (g.inteiro(0, 1) === 0) return g.escolher(fixas)
  return {
    pagina: 'mesa-de-trabalho',
    missao: g.escolher(MISSOES_CATALOGO),
    semente: g.inteiro(0, 1) === 0 ? null : g.inteiro(1, 999),
    causa: null,
    nova: g.inteiro(0, 1) === 1,
  }
}

describe('decidirPortao', () => {
  it('Feature: jornada-de-missao, Property 13: Portões da jornada (com o modo de demonstração gerado)', () => {
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
        const protegida = rota.pagina === 'plano-de-carreira' || rota.pagina === 'mesa-de-trabalho'
        expect(decisao.tipo === 'redirecionar').toBe(protegida && cartao === null)
        if (decisao.tipo === 'redirecionar') {
          expect(decisao.para).toBe('/diagnostico?motivo=sem-cartao')
          return
        }
        if (rota.pagina !== 'mesa-de-trabalho') {
          expect(decisao).toEqual({ tipo: 'exibir' })
          return
        }
        const local = etapaDaMissao(rota.missao)
        const emPreparacao = local?.missao.status !== 'disponivel'
        expect(decisao.tipo === 'aviso-missao-em-preparacao').toBe(emPreparacao)
        const bloqueada =
          calcularProgressoRota(ROTA_SUPORTE, registros, { modoDemonstracao: false })[local?.indice ?? 0].estado ===
          'bloqueada'
        expect(decisao.tipo === 'aviso-etapa-bloqueada').toBe(!modo && !emPreparacao && bloqueada)
        expect(decisao.tipo === 'exibir').toBe(!emPreparacao && (modo || !bloqueada))
      },
    )
  })

  it('com o modo ativo e cartão válido, toda Mesa de Trabalho de Missão disponível exibe', () => {
    paraTodo(
      'mesa de trabalho de missão disponível com o modo',
      (g) => ({ missao: g.escolher(MISSOES_CATALOGO), cartao: gerarCartao(g), registros: gerarRegistros(g) }),
      ({ missao, cartao, registros }) => {
        const rota: RotaResolvida = { pagina: 'mesa-de-trabalho', missao, semente: null, causa: null, nova: false }
        const decisao = decidirPortao(rota, cartao, registros, true)
        const disponivel = etapaDaMissao(missao)?.missao.status === 'disponivel'
        expect(decisao.tipo).toBe(disponivel ? 'exibir' : 'aviso-missao-em-preparacao')
      },
    )
  })
  it('exemplos com o catálogo atual', () => {
    const mesa = (missao: (typeof MISSOES_CATALOGO)[number]): RotaResolvida => ({
      pagina: 'mesa-de-trabalho',
      missao,
      semente: null,
      causa: null,
      nova: false,
    })
    expect(DESTINO_SEM_CARTAO).toBe('/diagnostico?motivo=sem-cartao')
    expect(decidirPortao({ pagina: 'plano-de-carreira' }, null, [])).toEqual({ tipo: 'redirecionar', para: DESTINO_SEM_CARTAO })
    // Com o catálogo atual todas as Missões estão disponíveis; a Help Desk N1 abre a cadeia.
    expect(decidirPortao(mesa('reset-senha-desbloqueio'), CARTAO_DE_TESTE, [])).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(mesa('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [])).toEqual({
      tipo: 'aviso-etapa-bloqueada',
      etapaNecessaria: 'help-desk-n1',
    })
    expect(decidirPortao(mesa('incidente-massivo'), CARTAO_DE_TESTE, [])).toEqual({
      tipo: 'aviso-etapa-bloqueada',
      etapaNecessaria: 'service-desk-n1-jr',
    })
    const comRegistro = [registroDeTeste('reset-senha-desbloqueio', 's-0'), registroDeTeste('pasta-rede-inacessivel', 's-1')]
    expect(decidirPortao(mesa('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [registroDeTeste('reset-senha-desbloqueio', 's-0')])).toEqual({
      tipo: 'exibir',
    })
    expect(decidirPortao(mesa('incidente-massivo'), CARTAO_DE_TESTE, comRegistro)).toEqual({ tipo: 'exibir' })
    // Com o modo ativo, a Mesa de Trabalho de etapa bloqueada abre.
    expect(decidirPortao(mesa('incidente-massivo'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(mesa('sre-cloud-latencia'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao(mesa('pasta-rede-inacessivel'), CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
    expect(decidirPortao({ pagina: 'plano-de-carreira' }, null, [], true)).toEqual({ tipo: 'redirecionar', para: DESTINO_SEM_CARTAO })
    // A Causa pedida (C4) não muda a decisão: só o status da Missão e a etapa contam.
    expect(decidirPortao({ ...mesa('pasta-rede-inacessivel'), causa: 'C4' }, CARTAO_DE_TESTE, [], true)).toEqual({ tipo: 'exibir' })
  })
})
