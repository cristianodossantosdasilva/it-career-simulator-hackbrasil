import type { SessaoProjecao } from '../api/types'
import { chamadoFechado, incidenteMassivoRestabelecido } from './estadoDoCenario'

export type FerramentaLab = 'itsm' | 'chat' | 'simudesk'

/** Passos que o App ja deriva dos eventos do motor (politica, token e recusa do reset). */
export interface PassosTriagem {
  politica: boolean
  token: boolean
  recusado: boolean
}

export interface ContextoRoteiro {
  sessao: SessaoProjecao
  passosTriagem: PassosTriagem
}

export interface PassoRoteiro {
  id: string
  titulo: string
  detalhe: string
  ferramenta: FerramentaLab
  /** Calculado so a partir da projecao do motor. Nenhum passo e marcado pelo aluno. */
  concluido: (ctx: ContextoRoteiro) => boolean
}

export interface Roteiro {
  objetivo: string
  passos: PassoRoteiro[]
}

export const ROTULO_FERRAMENTA: Record<FerramentaLab, string> = {
  itsm: 'ITSM',
  chat: 'Comunicador',
  simudesk: 'SimuDesk',
}

function primeiroChamado(ctx: ContextoRoteiro) {
  return ctx.sessao.chamados[0]
}


const assumirChamado: PassoRoteiro = {
  id: 'assumir',
  titulo: 'Assumir e classificar o chamado',
  detalhe: 'Abra o chamado na fila do ITSM e confira solicitante, urgência e SLA.',
  ferramenta: 'itsm',
  concluido: (ctx) => primeiroChamado(ctx)?.status !== 'Novo',
}

const validarIdentidade: PassoRoteiro = {
  id: 'identidade',
  titulo: 'Validar a identidade do usuário',
  detalhe: 'Confirme matrícula e ramal no Comunicador. Isso libera o acesso remoto.',
  ferramenta: 'chat',
  concluido: (ctx) => ctx.sessao.dialogo.acessoRemotoLiberado,
}

const resolverChamado: PassoRoteiro = {
  id: 'resolver',
  titulo: 'Resolver o chamado com nota pública',
  detalhe: 'Registre o que foi feito em linguagem clara para o solicitante.',
  ferramenta: 'itsm',
  concluido: (ctx) => chamadoFechado(primeiroChamado(ctx)?.status),
}

const roteiroResetSenha: Roteiro = {
  objetivo:
    'Uma pessoa não consegue usar a conta. Confirme quem pede e quem é a dona da conta, entenda o estado dela e use a menor ação que resolve.',
  passos: [
    assumirChamado,
    {
      id: 'identidade-titular',
      titulo: 'Confirmar a identidade da dona da conta',
      detalhe:
        'Quem pede nem sempre é a dona da conta. Use o ramal do diretório e valide matrícula e ramal no Comunicador.',
      ferramenta: 'chat',
      concluido: (ctx) => ctx.sessao.dialogo.identidadeValidada,
    },
    {
      id: 'agir-no-console',
      titulo: 'Consultar a conta e agir no console',
      detalhe: 'No SimuDesk, veja o estado da conta e escolha a menor ação que resolve o sintoma.',
      ferramenta: 'simudesk',
      concluido: (ctx) => ctx.sessao.estacao.compartilhamentoAcessivel,
    },
    {
      ...resolverChamado,
      detalhe: 'Registre o que foi feito e por que foi a menor ação, em linguagem clara para quem pediu.',
    },
  ],
}
const roteiroBackup: Roteiro = {
  objetivo:
    'O backup do Financeiro falhou ou a pasta não abre. Diagnostique pelo log, compare repositório e cadeia e só então corrija.',
  passos: [
    assumirChamado,
    validarIdentidade,
    {
      id: 'corrigir-backup',
      titulo: 'Diagnosticar e corrigir no SimuDesk',
      detalhe:
        'Comece pelo estado do job e pelo log. Operações de backup exigem privilégio elevado e apagar pontos de restauração não é atalho.',
      ferramenta: 'simudesk',
      concluido: (ctx) => ctx.sessao.estacao.compartilhamentoAcessivel,
    },
    {
      ...resolverChamado,
      detalhe: 'Confirme com o dono da pasta e registre o que foi feito, em linguagem clara.',
    },
  ],
}
const ROTEIROS: Record<string, Roteiro> = {
  'triagem-engenharia-social': {
    objetivo: 'Um suposto diretor pede reset de senha sem token. Proteja a empresa seguindo a política.',
    passos: [
      assumirChamado,
      {
        id: 'politica',
        titulo: 'Consultar a política de segurança',
        detalhe: 'Leia a política KB-001 sobre reset de senha.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.passosTriagem.politica,
      },
      {
        id: 'token',
        titulo: 'Verificar o token do solicitante',
        detalhe: 'Peça o token corporativo antes de qualquer decisão.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.passosTriagem.token,
      },
      {
        id: 'nota-interna',
        titulo: 'Registrar uma nota interna',
        detalhe: 'Documente a tentativa para a equipe de segurança.',
        ferramenta: 'itsm',
        concluido: (ctx) => primeiroChamado(ctx)?.notas.some((n) => n.tipo === 'Interna') ?? false,
      },
      {
        id: 'decidir',
        titulo: 'Responder ao pedido de reset conforme a política',
        detalhe: 'Escolha a decisão no painel de segurança do ITSM.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.passosTriagem.recusado,
      },
      resolverChamado,
    ],
  },
  'incidente-massivo': {
    objetivo: 'Três chamados chegam depois de uma atualização. Ache a causa raiz e resolva em lote.',
    passos: [
      {
        id: 'assumir',
        titulo: 'Assumir um dos chamados',
        detalhe: 'Abra a fila e assuma um chamado.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.sessao.chamados.some((c) => c.status !== 'Novo'),
      },
      {
        id: 'problema',
        titulo: 'Criar um Problema ITIL',
        detalhe: 'Vincule os 3 chamados ao mesmo Problema.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.sessao.problemas.length > 0,
      },
      validarIdentidade,
      {
        id: 'servico',
        titulo: 'Investigar e restabelecer o serviço afetado',
        detalhe: 'Reúna evidências com os comandos do SimuDesk antes de alterar ou acionar alguém.',
        ferramenta: 'simudesk',
        concluido: (ctx) => incidenteMassivoRestabelecido(ctx.sessao),
      },
      {
        id: 'causa-raiz',
        titulo: 'Comunicar, registrar a causa raiz e resolver em lote',
        detalhe: 'Informe os solicitantes com nota pública, descreva a causa no Problema e resolva os chamados vinculados.',
        ferramenta: 'itsm',
        concluido: (ctx) => ctx.sessao.problemas.some((p) => p.resolvido),
      },
    ],
  },
  'sre-cloud-latencia': {
    objetivo: 'Um incidente de latência em cloud. Investigue pods e logs e mitigue com segurança.',
    passos: [
      assumirChamado,
      validarIdentidade,
      {
        id: 'mitigar',
        titulo: 'Diagnosticar e mitigar no SimuDesk',
        detalhe: 'Veja pods, logs e conexões antes de aplicar a mitigação.',
        ferramenta: 'simudesk',
        concluido: (ctx) => ctx.sessao.estacao.compartilhamentoAcessivel,
      },
      {
        ...resolverChamado,
        titulo: 'Resolver o chamado com nota de post-mortem',
        detalhe: 'Registre causa, mitigação e prevenção.',
      },
    ],
  },
  'reset-senha-desbloqueio': roteiroResetSenha,
  'falha-backup-restore': roteiroBackup,
  'diagnostico-sql-readonly': {
    objetivo: 'Auditoria de dados com acesso somente leitura. Consulte, sem escrever, e conclua o diagnóstico.',
    passos: [
      assumirChamado,
      validarIdentidade,
      {
        ...resolverChamado,
        titulo: 'Resolver o chamado com o diagnóstico',
        detalhe: 'Use consultas SELECT no SimuDesk e registre o resultado na nota.',
      },
    ],
  },
}

const ROTEIRO_PADRAO: Roteiro = {
  objetivo:
    'Uma pasta de rede ficou inacessível, ou o chamado pede um acesso. Valide a identidade, investigue e atenda o que o chamado exige.',
  passos: [
    {
      ...assumirChamado,
      detalhe:
        'Abra o chamado na fila do ITSM, confira solicitante, urgência e SLA e classifique: incidente ou solicitação de serviço.',
    },
    validarIdentidade,
    {
      id: 'corrigir',
      titulo: 'Diagnosticar e corrigir no SimuDesk',
      detalhe: 'Investigue no SimuDesk antes de alterar qualquer configuração e atenda o que o chamado pede.',
      ferramenta: 'simudesk',
      concluido: (ctx) => ctx.sessao.estacao.compartilhamentoAcessivel,
    },
    resolverChamado,
  ],
}

export function roteiroDoCenario(cenarioId: string): Roteiro {
  return ROTEIROS[cenarioId] ?? ROTEIRO_PADRAO
}
