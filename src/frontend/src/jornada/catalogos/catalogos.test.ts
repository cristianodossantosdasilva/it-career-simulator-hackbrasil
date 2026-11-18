import { describe, expect, it } from 'vitest'
import { LEVELS } from '../../educacao/catalogoEducacional'
import {
  CATALOGO_ROTAS,
  MISSAO_DEMONSTRACAO,
  type IdMissao,
  type Rota,
  escalaDaMissao,
  missoesDaEscala,
  rotaPorId,
} from './catalogoRotas'
import { AVISO_CERTIFICACOES, CATALOGO_CERTIFICACOES } from './catalogoCertificacoes'
import { CATALOGO_PARCEIROS } from './catalogoParceiros'
import { APRESENTACAO_STATUS } from './status'

const ROTAS: readonly Rota[] = CATALOGO_ROTAS
const suporte = rotaPorId('suporte-ti')!

const DISTRIBUICAO: Record<IdMissao, { escala: string; vertente: string | null }> = {
  'reset-senha-desbloqueio': { escala: 'Help Desk N1', vertente: null },
  'pasta-rede-inacessivel': { escala: 'Service Desk N1 Jr', vertente: null },
  'incidente-massivo': { escala: 'N2 Pleno', vertente: null },
  'sre-cloud-latencia': { escala: 'N3 Sênior', vertente: 'N3-A Redes e Nuvem' },
  'falha-backup-restore': { escala: 'N3 Sênior', vertente: 'N3-B Data Center e Backup' },
  'triagem-engenharia-social': { escala: 'N3 Sênior', vertente: 'N3-C Segurança e Dados' },
  'diagnostico-sql-readonly': { escala: 'N3 Sênior', vertente: 'N3-C Segurança e Dados' },
}

function todasAsMissoes() {
  return ROTAS.flatMap((rota) => rota.escalas.flatMap((escala) => missoesDaEscala(escala)))
}

describe('Catálogo de rotas', () => {
  it('distribui os 7 cenários em exatamente uma escala e, na N3 Sênior, em exatamente uma Vertente', () => {
    const missoes = todasAsMissoes()
    expect(missoes).toHaveLength(7)
    for (const [id, esperado] of Object.entries(DISTRIBUICAO)) {
      const ocorrencias = missoes.filter((item) => item.missao.id === id)
      expect(ocorrencias).toHaveLength(1)
      const local = escalaDaMissao(id)
      expect(local?.escala.nome).toBe(esperado.escala)
      expect(local?.vertente?.nome ?? null).toBe(esperado.vertente)
    }
  })

  it('mantém as escalas na ordem da rota', () => {
    expect(suporte.escalas.map((e) => e.nome)).toEqual(['Help Desk N1', 'Service Desk N1 Jr', 'N2 Pleno', 'N3 Sênior'])
  })

  it('atribui os status das Missões conforme o Requirement 6.4', () => {
    const status = Object.fromEntries(todasAsMissoes().map(({ missao }) => [missao.id, missao.status]))
    expect(status).toEqual({
      'reset-senha-desbloqueio': 'em-preparacao',
      'pasta-rede-inacessivel': 'disponivel',
      'incidente-massivo': 'disponivel',
      'sre-cloud-latencia': 'disponivel',
      'falha-backup-restore': 'em-preparacao',
      'triagem-engenharia-social': 'disponivel',
      'diagnostico-sql-readonly': 'disponivel',
    })
  })

  it('registra as Causas conforme o Requirement 6.5', () => {
    const causas = Object.fromEntries(
      todasAsMissoes().map(({ missao }) => [missao.id, missao.causas.map((c) => `${c.codigo}:${c.status}`)]),
    )
    expect(causas).toEqual({
      'reset-senha-desbloqueio': [
        'SENHA_ESQUECIDA:em-preparacao',
        'CONTA_BLOQUEADA:em-preparacao',
        'SENHA_EXPIRADA:em-preparacao',
      ],
      'pasta-rede-inacessivel': ['C1:disponivel', 'C2:disponivel', 'C3:disponivel', 'C4:em-preparacao'],
      'incidente-massivo': ['GATEWAY:disponivel', 'EMAIL_PROVEDOR:em-preparacao', 'DOMINIO_SUSPENSO:em-preparacao'],
      'sre-cloud-latencia': ['OOM_KILLED:disponivel', 'POOL_EXHAUSTED:disponivel', 'CERT_EXPIRED:disponivel'],
      'falha-backup-restore': ['REPOSITORIO_CHEIO:em-preparacao', 'CADEIA_CORROMPIDA:em-preparacao'],
      'triagem-engenharia-social': [],
      'diagnostico-sql-readonly': [],
    })
  })

  it('ordena as Vertentes da N3 Sênior como N3-A, N3-B e N3-C', () => {
    const n3 = suporte.escalas.find((e) => e.id === 'n3-senior')!
    expect(n3.vertentes.map((v) => v.nome)).toEqual([
      'N3-A Redes e Nuvem',
      'N3-B Data Center e Backup',
      'N3-C Segurança e Dados',
    ])
  })

  it('preenche missoes ou vertentes em cada escala, nunca os dois', () => {
    for (const rota of ROTAS) {
      for (const escala of rota.escalas) {
        expect(escala.missoes.length === 0 || escala.vertentes.length === 0).toBe(true)
      }
    }
  })

  it('registra ao menos uma Missão em cada escala de rota disponível', () => {
    for (const rota of ROTAS.filter((r) => r.status === 'disponivel')) {
      expect(rota.escalas.length).toBeGreaterThan(0)
      for (const escala of rota.escalas) expect(missoesDaEscala(escala).length).toBeGreaterThan(0)
    }
  })

  it('dá a cada Missão um nível em LEVELS ou título e descrição próprios', () => {
    for (const { missao } of todasAsMissoes()) {
      const nivel = LEVELS.find((l) => l.cenarioId === missao.id)
      if (!nivel) {
        expect(missao.titulo, missao.id).toBeTruthy()
        expect(missao.descricao, missao.id).toBeTruthy()
      }
    }
  })

  it('deixa só a rota Suporte de TI disponível', () => {
    expect(ROTAS.filter((r) => r.status === 'disponivel').map((r) => r.id)).toEqual(['suporte-ti'])
    for (const rota of ROTAS.filter((r) => r.status !== 'disponivel')) expect(rota.escalas).toHaveLength(0)
    expect(rotaPorId('inexistente')).toBeNull()
  })

  it('aponta a Missão de demonstração para uma Missão disponível do catálogo', () => {
    const local = escalaDaMissao(MISSAO_DEMONSTRACAO)
    expect(local).not.toBeNull()
    expect(local?.missao.status).toBe('disponivel')
    expect(escalaDaMissao('cenario-inexistente')).toBeNull()
  })

  it('não usa E comercial nem emoji nos textos do catálogo e dos status', () => {
    const textos = JSON.stringify([CATALOGO_ROTAS, APRESENTACAO_STATUS])
    expect(textos).not.toContain('&')
    expect(textos).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})

const TERMOS_PROIBIDOS_EM_CERTIFICACAO = ['oficial', 'parceiro', 'equivalente', 'credenciado', 'certificado pelo']
const EMPRESAS_REAIS = ['senai', 'microsoft', 'google', 'amazon', 'aws', 'cisco', 'oracle', 'ibm', 'linkedin', 'totvs']

describe('Catálogo de certificações', () => {
  it('dá a cada item um status do catálogo e uma escala existente na rota', () => {
    const escalas = new Set(suporte.escalas.map((escala) => escala.id))
    expect(new Set(CATALOGO_CERTIFICACOES.map((item) => item.id)).size).toBe(CATALOGO_CERTIFICACOES.length)
    for (const item of CATALOGO_CERTIFICACOES) {
      expect(Object.keys(APRESENTACAO_STATUS), item.id).toContain(item.status)
      expect(rotaPorId(item.rotaId), item.id).not.toBeNull()
      expect(item.escalaIds.length, item.id).toBeGreaterThan(0)
      for (const escala of item.escalaIds) expect(escalas.has(escala), `${item.id}: ${escala}`).toBe(true)
    }
  })
  it('atribui os status e as escalas do design', () => {
    expect(CATALOGO_CERTIFICACOES.map((item) => [item.nome, item.escalaIds, item.status])).toEqual([
      ['CompTIA A+', ['help-desk-n1'], 'disponivel'],
      ['ITIL 4 Foundation', ['service-desk-n1-jr', 'n2-pleno'], 'disponivel'],
      ['CompTIA Network+', ['service-desk-n1-jr'], 'em-preparacao'],
      ['CompTIA Security+', ['n3-senior'], 'futuro'],
      ['Fundamentos de nuvem de provedores públicos (referência genérica)', ['n3-senior'], 'futuro'],
    ])
  })
  it('não usa oficial, parceiro, equivalente, credenciado nem certificado pelo nos itens', () => {
    const textos = CATALOGO_CERTIFICACOES.map((item) => `${item.nome} ${item.descricao}`.toLowerCase())
    for (const texto of textos) {
      for (const termo of TERMOS_PROIBIDOS_EM_CERTIFICACAO) expect(texto, termo).not.toContain(termo)
    }
  })
  it('traz o aviso fixo de que não há parceria, equivalência nem emissão', () => {
    expect(AVISO_CERTIFICACOES).toContain('não tem parceria')
    expect(AVISO_CERTIFICACOES).toContain('não equivale')
    expect(AVISO_CERTIFICACOES).toContain('não emite certificado')
  })
})

describe('Catálogo de parceiros', () => {
  it('tem os 3 itens genéricos, todos com status futuro e sem campo de nome', () => {
    expect(CATALOGO_PARCEIROS.map((item) => item.tipo)).toEqual(['ensino', 'empregador', 'comunidade'])
    for (const item of CATALOGO_PARCEIROS) {
      expect(item.status, item.id).toBe('futuro')
      expect(Object.keys(item).sort()).toEqual(['descricao', 'id', 'status', 'tipo'])
    }
  })
  it('não cita nome de empresa real nem a marca SENAI', () => {
    const texto = JSON.stringify(CATALOGO_PARCEIROS).toLowerCase()
    for (const nome of EMPRESAS_REAIS) expect(texto, nome).not.toMatch(new RegExp(`\\b${nome}\\b`))
  })
})

describe('Textos dos catálogos de certificações e parceiros', () => {
  it('não usam E comercial nem emoji', () => {
    const textos = JSON.stringify([CATALOGO_CERTIFICACOES, AVISO_CERTIFICACOES, CATALOGO_PARCEIROS])
    expect(textos).not.toContain('&')
    expect(textos).not.toMatch(/\p{Extended_Pictographic}/u)
  })
})
