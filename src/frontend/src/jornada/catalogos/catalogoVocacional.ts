/**
 * Conteúdo do Início e do Diagnóstico. Tudo aqui é texto escrito e estático: sem rede, sem IA, sem motor,
 * sem Event Store e sem Juiz 360º. O Mentor explica e encaminha; quem avalia o aluno é o motor
 * determinístico do backend.
 *
 * Os textos de apresentação (`TEXTOS_HOME`, `JORNADA`, `RESPOSTAS_FOCO`) vêm do catálogo da home
 * vocacional. O roteiro do diagnóstico é novo e soma pontos fixos por resposta.
 */
import type { PerguntaCheckIn as IdPerguntaCheckIn } from '../armazenamento/cartaoEmbarque'
import type { IdRota } from './catalogoRotas'

export const TEXTOS_HOME = {
  marca: 'IT Career Simulator',
  contexto: 'Aurora Logística, empresa fictícia com dados sintéticos',
  titulo: 'Descubra uma profissão fazendo o trabalho',
  lead:
    'Antes de escolher uma formação, experimente a rotina de uma profissão em um ambiente simulado, com chamados, ferramentas e decisões que você revê depois.',
  comecar: 'Começar a experiência de Suporte Técnico',
  irDireto: 'Ir direto ao laboratório',
  jornadaTitulo: 'Uma jornada em cinco passos',
  areasTitulo: 'Áreas e níveis',
  areasTexto:
    'Nesta edição, o primeiro percurso disponível é Suporte Técnico em TI. As demais áreas ainda não estão disponíveis.',
  guiaTitulo: 'Guia de orientação',
  guiaRotulo: 'Respostas escritas para esta plataforma. Não é um chat de IA nem um teste vocacional.',
  limitesTitulo: 'O que este guia não faz',
  limites: [
    'Não faz diagnóstico psicológico nem decide a carreira por você.',
    'Não promete emprego, salário nem resultado.',
    'Não avalia o seu desempenho. A avaliação técnica vem de critérios observáveis calculados pela plataforma.',
    'Não substitui um orientador humano.',
  ],
} as const

export interface PassoJornada {
  id: string
  titulo: string
  texto: string
}

export const JORNADA: readonly PassoJornada[] = [
  { id: 'descobrir', titulo: 'Descobrir', texto: 'Entenda o que a plataforma oferece e como a experiência funciona.' },
  {
    id: 'escolher',
    titulo: 'Escolher uma experiência',
    texto: 'Nesta edição, o primeiro percurso disponível é Suporte Técnico em TI.',
  },
  {
    id: 'experimentar',
    titulo: 'Experimentar o trabalho',
    texto: 'Atenda um chamado da Aurora Logística com ITSM, chat com usuários simulados e acesso remoto simulado.',
  },
  {
    id: 'orientacao',
    titulo: 'Receber orientação',
    texto:
      'Revise suas decisões na Caixa-preta. O Juiz 360º avalia por critérios observáveis e o Portfólio registra o que você fez.',
  },
  {
    id: 'decidir',
    titulo: 'Decidir o próximo passo',
    texto: 'Com o que você observou, escolha o que estudar a seguir. A decisão continua sendo sua.',
  },
]

export interface OpcaoDemonstracao {
  id: string
  rotulo: string
}

export interface PerguntaDemonstracao {
  id: 'foco'
  enunciado: string
  opcoes: readonly OpcaoDemonstracao[]
}

/** Pergunta de exemplo do Início. A resposta é só leitura: nada é gravado. */
export const PERGUNTA_FOCO: PerguntaDemonstracao = {
  id: 'foco',
  enunciado: 'O que você quer entender primeiro?',
  opcoes: [
    { id: 'rotina', rotulo: 'Como é a rotina de quem trabalha com suporte técnico' },
    { id: 'competencias', rotulo: 'Quais competências a experiência exercita' },
    { id: 'avaliacao', rotulo: 'Como a plataforma mostra o que eu fiz' },
  ],
}

export const RESPOSTAS_FOCO: Readonly<Record<string, string>> = {
  rotina:
    'Em Suporte Técnico você recebe pedidos de usuários, confere a política da empresa, investiga com cuidado e registra o que fez. Na Mesa de Trabalho isso acontece em um chamado simulado da Aurora Logística.',
  competencias:
    'A experiência exercita a leitura do chamado, a comunicação com o usuário, a verificação de identidade, a investigação antes de alterar qualquer coisa e o registro claro do que foi feito.',
  avaliacao:
    'Ao final da missão você vê a linha do tempo das suas decisões e a avaliação por critérios. Quem avalia é o Juiz 360º da plataforma, não este guia.',
}

/** Versão gravada no Cartão_de_Embarque. Muda quando perguntas, opções ou pesos mudam. */
export const VERSAO_ROTEIRO = 'checkin-v1'

export interface OpcaoCheckIn {
  id: string
  rotulo: string
  pesos: Partial<Record<IdRota, number>>
}

export interface PerguntaRoteiro {
  id: IdPerguntaCheckIn
  enunciado: string
  opcoes: readonly OpcaoCheckIn[]
}

export const ROTEIRO_CHECKIN: { versao: string; perguntas: readonly PerguntaRoteiro[] } = {
  versao: VERSAO_ROTEIRO,
  perguntas: [
    {
      id: 'interesse',
      enunciado: 'Que tipo de problema você gosta de resolver?',
      opcoes: [
        { id: 'ajudar-pessoas', rotulo: 'Ajudar pessoas com tecnologia', pesos: { 'suporte-ti': 2 } },
        { id: 'construir-programas', rotulo: 'Construir programas', pesos: { desenvolvimento: 2 } },
        { id: 'encontrar-padroes', rotulo: 'Encontrar padrões em números', pesos: { dados: 2 } },
        {
          id: 'manter-servidores-redes',
          rotulo: 'Manter servidores e redes funcionando',
          pesos: { 'infraestrutura-nuvem': 2 },
        },
      ],
    },
    {
      id: 'situacao',
      enunciado: 'Um colega não consegue abrir a pasta da equipe. O que você faz primeiro?',
      opcoes: [
        {
          id: 'perguntar-o-que-aparece',
          rotulo: 'Pergunto o que aparece na tela e desde quando',
          pesos: { 'suporte-ti': 2 },
        },
        {
          id: 'automatizar-verificacao',
          rotulo: 'Penso em automatizar a verificação',
          pesos: { desenvolvimento: 2 },
        },
        {
          id: 'procurar-registros',
          rotulo: 'Procuro registros do que mudou',
          pesos: { dados: 1, 'infraestrutura-nuvem': 1 },
        },
        {
          id: 'verificar-servidor-rede',
          rotulo: 'Verifico o servidor e a rede',
          pesos: { 'infraestrutura-nuvem': 2 },
        },
      ],
    },
    {
      id: 'ritmo',
      enunciado: 'Como você prefere começar?',
      opcoes: [
        { id: 'estudar', rotulo: 'Estudando um pouco antes', pesos: {} },
        { id: 'praticar', rotulo: 'Indo direto para o chamado', pesos: {} },
      ],
    },
  ],
}

/**
 * Check-in_Rápido: respostas padrão que indicam Suporte de TI, a rota disponível. Os identificadores
 * existem em ROTEIRO_CHECKIN. Quem confirma não escolhe nada, e o texto abaixo diz isso.
 */
export const CHECKIN_RAPIDO: {
  respostas: Readonly<Record<IdPerguntaCheckIn, string>>
  explicacao: string
} = {
  respostas: { interesse: 'ajudar-pessoas', situacao: 'perguntar-o-que-aparece', ritmo: 'praticar' },
  explicacao:
    'O diagnóstico rápido usa as respostas padrão abaixo para levar você a uma missão em um passo. Você pode refazer o diagnóstico completo quando quiser, e o cartão novo substitui este.',
}

/** Texto fixo por rota, o começo da justificativa da indicação. */
export const JUSTIFICATIVAS: Readonly<Record<IdRota, string>> = {
  'suporte-ti':
    'A rota Suporte de TI atende pessoas, investiga a causa de um problema e registra o que foi feito, na rotina da Aurora Logística.',
  'infraestrutura-nuvem':
    'A rota Infraestrutura e nuvem cuida de servidores, redes e serviços que precisam ficar no ar.',
  desenvolvimento: 'A rota Desenvolvimento de software constrói e automatiza programas.',
  dados: 'A rota Dados e análise procura padrões e explicações em números e registros.',
}

/** Complemento da justificativa conforme o ritmo escolhido. */
export const TEXTOS_RITMO: Readonly<Record<'estudar' | 'praticar', string>> = {
  estudar: 'Você prefere estudar antes: as Aulas ajudam a se preparar e o Plano de Carreira espera por você.',
  praticar: 'Você prefere ir direto ao chamado: o Plano de Carreira mostra a primeira missão da rota.',
}

export const TEXTO_REGRA_INDICACAO = 'A indicação soma pontos fixos por resposta. Não usa IA e não avalia você.'

export const TEXTO_PONTO_DE_PARTIDA =
  'Esta indicação é um ponto de partida. A decisão de por onde seguir continua sendo sua.'

/** Rótulo da opção escolhida, ou nulo quando o identificador não existe nesta versão do roteiro. */
export function rotuloDaResposta(pergunta: IdPerguntaCheckIn, opcaoId: string): string | null {
  const alvo = ROTEIRO_CHECKIN.perguntas.find((item) => item.id === pergunta)
  return alvo?.opcoes.find((opcao) => opcao.id === opcaoId)?.rotulo ?? null
}

/** Convite_Copiloto: bloco informativo do Plano de Carreira, sem formulário e sem envio de dados. */
export const CONVITE_COPILOTO = {
  titulo: 'Seja copiloto do projeto',
  texto:
    'O IT Career Simulator procura pessoas que queiram ajudar a escrever cenários, revisar textos e testar missões. Este convite é só informativo: não há formulário e nada sai deste navegador.',
} as const
