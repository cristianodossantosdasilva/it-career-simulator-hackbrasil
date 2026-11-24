import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessaoProjecao } from '../api/types'
import { ChatApp } from '../apps/ChatApp/ChatApp'
import { SimuDeskApp } from '../apps/SimuDeskApp/SimuDeskApp'
import { nivelPorCenarioId } from '../educacao/catalogoEducacional'
import { CATALOGO_ROTAS, missoesDaEtapa } from '../jornada/catalogos/catalogoRotas'
import { rotuloDoEvento } from '../replay/rotulosEvento'
import { projecaoDeTeste } from '../testes/apiDeTeste'
import { obterProximaDicaMissao } from './dicaMissao'
import { primeiroNomeDoCliente, semAcessoRemoto } from './estadoDoCenario'
import { roteiroDoCenario } from './roteiros'

afterEach(cleanup)

const CAUSAS = [
  'SENHA_ESQUECIDA',
  'CONTA_BLOQUEADA',
  'SENHA_EXPIRADA',
  'REPOSITORIO_CHEIO',
  'CADEIA_CORROMPIDA',
  'EMAIL_PROVEDOR',
  'DOMINIO_SUSPENSO',
  'PATCH_MASSIVO',
  'GATEWAY',
]

/** Projeção de teste com o chamado principal no status pedido e os campos que o roteiro lê. */
function sessaoDe(
  cenarioId: string,
  ajuste: {
    status?: string
    solicitante?: string
    identidadeValidada?: boolean
    acessoRemotoLiberado?: boolean
    compartilhamentoAcessivel?: boolean
    servicos?: { nome: string; status: string }[]
    comandos?: string[]
  } = {},
): SessaoProjecao {
  const base = projecaoDeTeste(cenarioId, ajuste.status ?? 'Novo')
  base.chamados[0].solicitante = ajuste.solicitante ?? 'Maria Souza'
  base.dialogo.identidadeValidada = ajuste.identidadeValidada ?? false
  base.dialogo.acessoRemotoLiberado = ajuste.acessoRemotoLiberado ?? false
  base.estacao.compartilhamentoAcessivel = ajuste.compartilhamentoAcessivel ?? false
  base.estacao.servicos = (ajuste.servicos ?? []).map((servico) => ({ ...servico, critico: false }))
  base.estacao.comandosSuportados = ajuste.comandos ?? []
  return base
}

function passosFeitos(sessao: SessaoProjecao): number {
  const contexto = { sessao, passosTriagem: { politica: false, token: false, recusado: false } }
  return roteiroDoCenario(sessao.meta.cenarioId).passos.filter((passo) => passo.concluido(contexto)).length
}

describe('Níveis de aulas dos cenários', () => {
  it('nivelPorCenarioId devolve o nível da etapa do catálogo, inclusive para os cenários novos', () => {
    expect(nivelPorCenarioId('reset-senha-desbloqueio')?.id).toBe('help-desk-n1')
    expect(nivelPorCenarioId('pasta-rede-inacessivel')?.id).toBe('service-desk-n1-jr')
    expect(nivelPorCenarioId('incidente-massivo')?.id).toBe('n2-pleno')
    expect(nivelPorCenarioId('sre-cloud-latencia')?.id).toBe('n3-a-redes-nuvem')
    expect(nivelPorCenarioId('falha-backup-restore')?.id).toBe('n3-b-data-center-backup')
    expect(nivelPorCenarioId('triagem-engenharia-social')?.id).toBe('n3-c-seguranca-dados')
    expect(nivelPorCenarioId('diagnostico-sql-readonly')?.id).toBe('n3-c-seguranca-dados')
  })
  it('um identificador desconhecido não cai no primeiro nível', () => {
    expect(nivelPorCenarioId('desconhecido')).toBeNull()
  })
  it('toda Missão do catálogo tem título e descrição próprios', () => {
    for (const rota of CATALOGO_ROTAS) {
      for (const etapa of rota.etapas) {
        for (const { missao } of missoesDaEtapa(etapa)) {
          expect(missao.titulo, missao.id).toBeTruthy()
          expect(missao.descricao, missao.id).toBeTruthy()
        }
      }
    }
  })
})

describe('Roteiro e dica de reset-senha-desbloqueio', () => {
  it('avança com o estado da projeção, sem marcação do aluno', () => {
    expect(passosFeitos(sessaoDe('reset-senha-desbloqueio'))).toBe(0)
    expect(passosFeitos(sessaoDe('reset-senha-desbloqueio', { status: 'EmAtendimento' }))).toBe(1)
    expect(passosFeitos(sessaoDe('reset-senha-desbloqueio', { status: 'EmAtendimento', identidadeValidada: true }))).toBe(2)
    expect(
      passosFeitos(
        sessaoDe('reset-senha-desbloqueio', { status: 'EmAtendimento', identidadeValidada: true, compartilhamentoAcessivel: true }),
      ),
    ).toBe(3)
    expect(
      passosFeitos(
        sessaoDe('reset-senha-desbloqueio', { status: 'Resolvido', identidadeValidada: true, compartilhamentoAcessivel: true }),
      ),
    ).toBe(4)
  })
  it('a dica acompanha os quatro passos e termina na conclusão', () => {
    const dica = (ajuste: Parameters<typeof sessaoDe>[1]) => obterProximaDicaMissao(sessaoDe('reset-senha-desbloqueio', ajuste))
    expect(dica({})).toMatch(/^1\) Assuma/)
    expect(dica({ status: 'EmAtendimento' })).toMatch(/^2\) Confirme quem é a dona da conta/)
    expect(dica({ status: 'EmAtendimento', identidadeValidada: true })).toMatch(/^3\) No SimuDesk, consulte o estado da conta/)
    expect(dica({ status: 'EmAtendimento', identidadeValidada: true, compartilhamentoAcessivel: true })).toMatch(/^4\) Resolva/)
    expect(dica({ status: 'Resolvido', identidadeValidada: true, compartilhamentoAcessivel: true })).toMatch(/concluído/)
  })
  it('o passo de identidade não pede acesso remoto, que o motor nunca libera neste cenário', () => {
    const passo = roteiroDoCenario('reset-senha-desbloqueio').passos.find((item) => item.id === 'identidade-titular')
    const contexto = {
      sessao: sessaoDe('reset-senha-desbloqueio', { identidadeValidada: true, acessoRemotoLiberado: false }),
      passosTriagem: { politica: false, token: false, recusado: false },
    }
    expect(passo?.concluido(contexto)).toBe(true)
  })
})

describe('Roteiro e dica de falha-backup-restore', () => {
  it('avança com o estado da projeção', () => {
    expect(passosFeitos(sessaoDe('falha-backup-restore'))).toBe(0)
    expect(passosFeitos(sessaoDe('falha-backup-restore', { status: 'EmAtendimento' }))).toBe(1)
    expect(passosFeitos(sessaoDe('falha-backup-restore', { status: 'EmAtendimento', acessoRemotoLiberado: true }))).toBe(2)
    expect(
      passosFeitos(
        sessaoDe('falha-backup-restore', { status: 'EmAtendimento', acessoRemotoLiberado: true, compartilhamentoAcessivel: true }),
      ),
    ).toBe(3)
    expect(
      passosFeitos(
        sessaoDe('falha-backup-restore', { status: 'Encerrado', acessoRemotoLiberado: true, compartilhamentoAcessivel: true }),
      ),
    ).toBe(4)
  })
  it('a dica manda ler o job e o log antes de corrigir, com privilégio elevado', () => {
    const dica = obterProximaDicaMissao(sessaoDe('falha-backup-restore', { status: 'EmAtendimento', acessoRemotoLiberado: true }))
    expect(dica).toMatch(/log do job/)
    expect(dica).toMatch(/privilégio elevado/)
  })
})

describe('Roteiro e dica de incidente-massivo com a Causa externa', () => {
  const servicoExterno = (nome: string, status: string) => [{ nome: 'AuroraGateway', status: 'Running' }, { nome, status }]
  function sessaoMassiva(servicos: { nome: string; status: string }[]) {
    const sessao = sessaoDe('incidente-massivo', { status: 'EmAtendimento', acessoRemotoLiberado: true, servicos })
    sessao.problemas = [{ id: 'PRB-1', titulo: 'Falha', causaRaiz: null, resolvido: false, chamadosVinculados: ['INC-1'] }]
    return sessao
  }
  const passoServico = (sessao: SessaoProjecao) =>
    roteiroDoCenario('incidente-massivo').passos.find((passo) => passo.id === 'servico')?.concluido({
      sessao,
      passosTriagem: { politica: false, token: false, recusado: false },
    })

  it.each([
    ['ProvedorEmail', 'Indisponivel'],
    ['DominioPublico', 'Suspenso'],
  ])('com o serviço externo %s o AuroraGateway em execução não conclui o passo do serviço', (nome, status) => {
    expect(passoServico(sessaoMassiva(servicoExterno(nome, status)))).toBe(false)
    expect(passoServico(sessaoMassiva(servicoExterno(nome, 'Restabelecido')))).toBe(true)
  })
  it('com o AuroraGateway parado o passo só conclui quando ele volta a executar', () => {
    expect(passoServico(sessaoMassiva([{ nome: 'AuroraGateway', status: 'Stopped' }]))).toBe(false)
    expect(passoServico(sessaoMassiva([{ nome: 'AuroraGateway', status: 'Running' }]))).toBe(true)
  })
  it('a dica do passo 4 não pula a investigação quando o AuroraGateway já executa e o serviço externo está parado', () => {
    const dica = obterProximaDicaMissao(sessaoMassiva(servicoExterno('ProvedorEmail', 'Indisponivel')))
    expect(dica).toMatch(/^4\) No SimuDesk, investigue/)
    const depois = obterProximaDicaMissao(sessaoMassiva(servicoExterno('ProvedorEmail', 'Restabelecido')))
    expect(depois).toMatch(/^5\) Informe os solicitantes/)
  })
})

describe('Textos de guia sem revelar a Causa', () => {
  it('nenhum roteiro nem dica cita um identificador de Causa ou o nome do serviço quebrado', () => {
    const textos: string[] = []
    for (const cenario of ['reset-senha-desbloqueio', 'falha-backup-restore', 'incidente-massivo', 'pasta-rede-inacessivel']) {
      const roteiro = roteiroDoCenario(cenario)
      textos.push(roteiro.objetivo, ...roteiro.passos.flatMap((passo) => [passo.titulo, passo.detalhe]))
      for (const status of ['Novo', 'EmAtendimento', 'Resolvido']) {
        for (const flag of [false, true]) {
          textos.push(
            obterProximaDicaMissao(
              sessaoDe(cenario, { status, identidadeValidada: flag, acessoRemotoLiberado: flag, compartilhamentoAcessivel: flag }),
            ),
          )
        }
      }
    }
    for (const texto of textos) {
      for (const causa of CAUSAS) expect(texto).not.toContain(causa)
      expect(texto).not.toMatch(/AuroraGateway|ProvedorEmail|DominioPublico|imutavel|C4/)
    }
  })
})

describe('Rótulos dos eventos novos no Replay', () => {
  it.each([
    'TitularContatado',
    'AcaoSensivelSemVerificacao',
    'AcaoDesnecessariaRegistrada',
    'OrigemBloqueioIdentificada',
    'SenhaTemporariaDefinida',
    'ContaDesbloqueada',
    'ContaBloqueadaNovamente',
    'SenhaTrocadaPelaPessoa',
    'OrientacaoRegistrada',
    'AcessoContaRestabelecido',
    'UnidadeRedeMapeada',
    'RepositorioExpandido',
    'BackupConcluido',
    'PastaFinanceiroRestaurada',
    'EvidenciaExternaConfirmada',
    'AreaAcionada',
    'AcompanhamentoRegistrado',
    'ServicoExternoRestabelecido',
  ])('%s tem rótulo em português, diferente do nome técnico', (tipo) => {
    const rotulo = rotuloDoEvento(tipo)
    expect(rotulo).not.toBe(tipo)
    expect(rotulo).toMatch(/\s/)
  })
})

describe('Ferramentas do laboratório nos cenários novos', () => {
  const propsBase = { historicoTerminal: [], onComando: vi.fn(async () => {}), onAcao: vi.fn(async () => {}), ocupado: false }

  it('semAcessoRemoto vale só para reset-senha-desbloqueio, e o primeiro nome do cliente vem do chamado', () => {
    expect(semAcessoRemoto('reset-senha-desbloqueio')).toBe(true)
    expect(semAcessoRemoto('falha-backup-restore')).toBe(false)
    expect(semAcessoRemoto('pasta-rede-inacessivel')).toBe(false)
    expect(primeiroNomeDoCliente(sessaoDe('reset-senha-desbloqueio', { solicitante: 'Fernanda Lima' }))).toBe('Fernanda')
    expect(primeiroNomeDoCliente(sessaoDe('falha-backup-restore', { solicitante: 'Marcos Teixeira (Gerente do Financeiro)' }))).toBe('Marcos')
    expect(primeiroNomeDoCliente(sessaoDe('incidente-massivo', { solicitante: 'Carlos Mendes' }))).toBe('Maria')
  })

  it('o SimuDesk de reset-senha-desbloqueio abre no console do diretório, sem ID, PIN nem prompt elevado', () => {
    const sessao = sessaoDe('reset-senha-desbloqueio', {
      comandos: ['net user', 'eventos-seguranca', 'diretorio', 'discar', 'redefinir-senha', 'desbloquear-conta', 'enviar-link-troca'],
    })
    render(<SimuDeskApp {...propsBase} sessao={sessao} />)
    expect(screen.queryByPlaceholderText('NNN NNN NNN')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Console do diretório/ })).toBeInTheDocument()
    expect(screen.getByText('Acesso da conta: pendente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Elevar privilégio' })).not.toBeInTheDocument()
    expect(screen.queryByText('Requer prompt elevado')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'net user' }))
    expect(screen.getByLabelText('Comando do terminal')).toHaveValue('net user fernanda.lima')
    fireEvent.click(screen.getByRole('button', { name: 'discar' }))
    expect(screen.getByLabelText('Comando do terminal')).toHaveValue('discar')
  })

  it('o SimuDesk de reset-senha-desbloqueio não oferece grupo da pasta nem iniciar serviço de conta', () => {
    const sessao = sessaoDe('reset-senha-desbloqueio', { servicos: [{ nome: 'ContaAD', status: 'Bloqueada' }] })
    render(<SimuDeskApp {...propsBase} sessao={sessao} />)
    fireEvent.click(screen.getByRole('button', { name: 'Painéis admin' }))
    expect(screen.getByText('ContaAD:')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar maria/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Iniciar serviço/ })).not.toBeInTheDocument()
  })

  it('o SimuDesk de falha-backup-restore pede ID e PIN, mostra o servidor de backup e não oferece iniciar o job', () => {
    const sessao = sessaoDe('falha-backup-restore', {
      acessoRemotoLiberado: true,
      servicos: [{ nome: 'JobBackupFinanceiro', status: 'Failed' }],
      comandos: ['backup status', 'backup log'],
    })
    sessao.dialogo.idAcessoRemoto = '123456789'
    sessao.dialogo.pinAcessoRemoto = '1234'
    render(<SimuDeskApp {...propsBase} sessao={sessao} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher e conectar' }))
    expect(screen.getByRole('heading', { name: /Servidor de backup/ })).toBeInTheDocument()
    expect(screen.getByText('Backup do Financeiro: com falha')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'backup log' }))
    expect(screen.getByLabelText('Comando do terminal')).toHaveValue('backup log')
    fireEvent.click(screen.getByRole('button', { name: 'Painéis admin' }))
    expect(screen.queryByRole('button', { name: /Iniciar serviço/ })).not.toBeInTheDocument()
  })

  it('o SimuDesk de incidente-massivo mostra o serviço externo no lugar do AuroraGateway', () => {
    const sessao = sessaoDe('incidente-massivo', {
      acessoRemotoLiberado: true,
      servicos: [
        { nome: 'AuroraGateway', status: 'Running' },
        { nome: 'DominioPublico', status: 'Suspenso' },
      ],
    })
    sessao.dialogo.idAcessoRemoto = '123456789'
    sessao.dialogo.pinAcessoRemoto = '1234'
    render(<SimuDeskApp {...propsBase} sessao={sessao} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher e conectar' }))
    expect(screen.getByText('DominioPublico: Suspenso')).toBeInTheDocument()
    expect(screen.queryByText(/AuroraGateway:/)).not.toBeInTheDocument()
  })

  it('o Comunicador de reset-senha-desbloqueio usa o nome do solicitante e confirma a identidade sem ID nem PIN', () => {
    const pendente = sessaoDe('reset-senha-desbloqueio', { status: 'EmAtendimento', solicitante: 'Paulo Andrade' })
    const { rerender } = render(<ChatApp sessao={pendente} onChat={vi.fn(async () => {})} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByRole('button', { name: 'Cliente (Paulo)' })).toBeInTheDocument()
    expect(screen.getByLabelText('Matrícula da usuária')).toHaveAttribute('placeholder', 'Matrícula da titular')
    expect(screen.getByText(/ações sensíveis no console/)).toBeInTheDocument()
    const confirmada = sessaoDe('reset-senha-desbloqueio', { status: 'EmAtendimento', solicitante: 'Paulo Andrade', identidadeValidada: true })
    rerender(<ChatApp sessao={confirmada} onChat={vi.fn(async () => {})} onAcao={vi.fn(async () => {})} ocupado={false} />)
    expect(screen.getByText('As ações sensíveis estão liberadas no console do SimuDesk.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Matrícula da usuária')).not.toBeInTheDocument()
    expect(screen.queryByText(/ID SimuDesk/)).not.toBeInTheDocument()
  })
})
