import { type NomeIcone, ehNomeIcone } from '../ui/catalogoIcones'

export type NivelId = 'estagiario' | 'n1' | 'n2' | 'n3' | 'esp'

export interface NivelEducacional {
  id: NivelId
  cenarioId: string
  icon: NomeIcone
  cargo: string
  nome: string
  titulo: string
  sub: string
  desc: string
  competencias: string
  tag?: string
}

export interface MicroAula {
  id: string
  title: string
  min: number
  analogy: string
  paragraphs: { text: string; bold?: string[] }[]
  keys: string[]
  flow: string[]
  quiz: {
    q: string
    opts: string[]
    ok: number
    why: string
  }
}

export interface FlashCard {
  id: string
  f: string
  b: string
}

export interface FlashCardComNivel extends FlashCard {
  level: NivelId
}

export interface ConceitoFeynman {
  level: NivelId
  name: string
}

export interface TarefaPlano {
  t: string
  done: boolean
}

export interface PaginaCaderno {
  id: string
  /** Identificador do modulo de icones. Paginas salvas com emoji sao convertidas ao carregar. */
  icon: NomeIcone
  title: string
  level: NivelId | null
  type: 'todo' | 'cornell' | 'free'
  todos?: TarefaPlano[]
  cues?: string
  notes?: string
  summary?: string
  text?: string
}

export interface PitchStar {
  s: string
  t: string
  a: string
  r: string
}

export interface EstadoAcademia {
  xp: number
  streak: number
  weekMin: number
  weekGoal: number
  focus: NivelId
  lessonsDone: string[]
  cards: Record<string, { due: number }>
  pages: PaginaCaderno[]
  activePage: string
  pitches: { text: string; at: string }[]
  feynman: NivelId[]
  labsDone: NivelId[]
}

/**
 * Correspondencia entre ids e rotulos exibidos (os ids ficam salvos no navegador, nao renomear):
 * estagiario = Nivel 1, n1 = Nivel 2, n2 = Nivel 3, n3 = Nivel 4, esp = Nivel 4b.
 */
export const LEVELS: NivelEducacional[] = [
  {
    id: 'estagiario',
    cenarioId: 'triagem-engenharia-social',
    icon: 'nivel-estagiario',
    cargo: 'Nível 1: Estagiário',
    nome: 'Estagiário',
    titulo: 'Triagem e Defesa contra Engenharia Social',
    sub: 'Fundamentos do suporte e segurança',
    desc: 'Atenda um pedido urgente de suposto diretor sem token. Consulte a política, registre nota interna e proteja a empresa.',
    competencias: 'Segurança, Política KB, Triagem ITSM',
    tag: 'Comece aqui',
  },
  {
    id: 'n1',
    cenarioId: 'pasta-rede-inacessivel',
    icon: 'nivel-n1',
    cargo: 'Nível 2: Analista Jr (N1)',
    nome: 'Analista Jr (N1)',
    titulo: 'Pasta de Rede Inacessível (Simulador de Causas)',
    sub: 'Redes, usuários e acesso remoto',
    desc: '3 causas sorteadas por semente (Grupo AD, DNS ou Serviço parado). Valide identidade, conecte no SimuDesk e resolva.',
    competencias: 'AD, DNS, Serviços, SimuDesk',
  },
  {
    id: 'n2',
    cenarioId: 'incidente-massivo',
    icon: 'nivel-n2',
    cargo: 'Nível 3: Analista Pleno (N2)',
    nome: 'Analista Pleno (N2)',
    titulo: 'Incidente Massivo e Problema ITIL',
    sub: 'ITIL, incidentes em massa e logs',
    desc: '3 chamados simultâneos após atualização. Crie um Problema ITIL, investigue logs, restaure o AuroraGateway e resolva em lote.',
    competencias: 'Problema ITIL, Causa Raiz, Logs',
  },
  {
    id: 'n3',
    cenarioId: 'sre-cloud-latencia',
    icon: 'nivel-n3',
    cargo: 'Nível 4 (V2): SRE e Cloud',
    nome: 'SRE e Cloud (N3)',
    titulo: 'Incidente Cloud e Kubernetes (Simulador)',
    sub: 'Cloud, Kubernetes e observabilidade SRE',
    desc: '3 causas raiz simuladas (OOMKilled, Pool Postgres ou TLS expirado). Investigue pods e logs no SimuDesk e mitigue com segurança.',
    competencias: 'Kubernetes, Observabilidade, SRE',
  },
  {
    id: 'esp',
    cenarioId: 'diagnostico-sql-readonly',
    icon: 'nivel-esp',
    cargo: 'Nível 4b (V2): SQL Read-Only',
    nome: 'Especialista SQL',
    titulo: 'Auditoria SQL Somente Leitura',
    sub: 'Dados e auditoria SQL fail-closed',
    desc: 'Investigue divergência de faturamento no conjunto de dados sintético via SELECT e EXPLAIN. Escrita e injeção SQL são bloqueadas.',
    competencias: 'SQL Analítico, Auditoria, Segurança',
  },
]

export const LESSONS: Record<NivelId, MicroAula[]> = {
  estagiario: [
    {
      id: 'est-1',
      title: 'O que faz o Suporte de TI (e o que é um chamado)',
      min: 6,
      analogy:
        'Pense no Suporte de TI como o pronto-socorro da empresa: todo paciente passa pela triagem, recebe uma ficha e é atendido por ordem de gravidade.',
      paragraphs: [
        {
          text: 'Quando alguém na empresa tem um problema com computador, sistema ou acesso, não sai procurando um técnico pelos corredores: abre um chamado (ticket). O chamado é a ficha oficial que registra quem pediu, o que aconteceu e quando.',
        },
        {
          text: 'A ferramenta onde ficam os chamados se chama ITSM (Gestão de Serviços de TI). É nela que o time organiza a fila, define prioridades e prova o que foi feito.',
        },
      ],
      keys: [
        'Todo pedido vira um chamado registrado.',
        'Assumir o chamado mostra quem é o responsável.',
        'O ITSM é a memória oficial do suporte.',
      ],
      flow: ['Usuário relata', 'Chamado aberto no ITSM', 'Analista assume', 'Diagnóstico e solução', 'Chamado encerrado'],
      quiz: {
        q: 'A Maria do Financeiro te para no corredor pedindo ajuda. O que é mais correto?',
        opts: [
          'Resolver na hora sem registrar, para ganhar tempo',
          'Abrir (ou pedir que ela abra) um chamado antes de agir',
          'Ignorar até ela mandar um e-mail',
        ],
        ok: 1,
        why: 'Sem chamado não há registro, prioridade nem histórico. Abrir o chamado protege você e a usuária.',
      },
    },
    {
      id: 'est-2',
      title: 'Prioridade: urgência e impacto (SLA)',
      min: 5,
      analogy:
        'No pronto-socorro, um corte no dedo espera; um infarto entra na frente. Na TI, a prioridade nasce da combinação entre urgência e impacto.',
      paragraphs: [
        {
          text: 'Urgência é a pressa: quanto tempo dá para esperar antes de virar prejuízo? Impacto é o alcance: quantas pessoas ou processos pararam?',
        },
        {
          text: 'Cruzando os dois chegamos à Prioridade (P1 a P4). Cada prioridade tem um prazo combinado chamado SLA — o tempo máximo para responder e resolver.',
        },
      ],
      keys: [
        'Urgência = pressa.',
        'Impacto = quantas pessoas foram afetadas.',
        'SLA = prazo combinado para cada prioridade.',
      ],
      flow: ['Urgência', '+ Impacto', '= Prioridade (P1–P4)', 'Prazo SLA'],
      quiz: {
        q: 'O sistema de faturamento parou para a empresa inteira no fechamento do mês. Qual a prioridade?',
        opts: ['P4: Baixa', 'P2: Alta', 'P1: Crítica'],
        ok: 2,
        why: 'Urgência crítica somada a impacto generalizado resulta em P1. Isso pede ação imediata.',
      },
    },
    {
      id: 'est-3',
      title: 'Engenharia social: o golpe que não usa vírus',
      min: 7,
      analogy:
        'É o golpista que liga dizendo ser do banco: ele não invade o sistema, ele convence você a abrir a porta.',
      paragraphs: [
        {
          text: 'Engenharia social é quando alguém manipula pessoas — com pressa, autoridade ou simpatia — para conseguir senhas e acessos. É uma das portas de entrada mais comuns em ataques.',
        },
        {
          text: 'Por isso as empresas têm políticas de verificação: antes de trocar uma senha, o suporte confirma a identidade (matrícula, ramal) e um token corporativo, um código temporário que só o dono tem.',
        },
      ],
      keys: [
        'Pressa e autoridade são sinais de alerta.',
        'Nunca troque senha sem verificar identidade.',
        'Registre a tentativa em nota interna.',
      ],
      flow: ['Pedido urgente', 'Consultar política (KB)', 'Verificar identidade e token', 'Sem token? Recusar e registrar'],
      quiz: {
        q: 'Alguém diz ser diretor, está sem token e exige troca de senha imediata. O que fazer?',
        opts: [
          'Trocar a senha, afinal é um diretor',
          'Recusar com educação, seguir a política e registrar nota interna',
          'Passar a senha atual por telefone',
        ],
        ok: 1,
        why: 'A política vale para todos. Recusar e documentar é exatamente o que um profissional faz.',
      },
    },
  ],
  n1: [
    {
      id: 'n1-1',
      title: 'Rede, IP e DNS: a agenda da rede',
      min: 7,
      analogy:
        'O IP é o número de telefone de cada computador; o DNS é a agenda que traduz "AURORA-SRV01" para esse número.',
      paragraphs: [
        {
          text: 'Computadores conversam usando endereços numéricos (IP), como 10.20.1.15. Como ninguém decora números, usamos nomes — e o DNS faz a tradução.',
        },
        {
          text: 'Se o DNS aponta para o número errado, o nome existe, mas leva ao lugar errado: a pasta parece ter sumido mesmo estando no ar.',
        },
      ],
      keys: [
        'IP = endereço numérico.',
        'DNS = tradução de nome para IP.',
        'DNS errado parece sistema fora do ar.',
      ],
      flow: ['Usuário digita o nome', 'DNS traduz para o IP', 'Computador conecta', 'Pasta abre'],
      quiz: {
        q: 'A pasta não abre pelo nome, mas abre pelo IP. Quem é o suspeito principal?',
        opts: ['O monitor', 'O DNS', 'O teclado'],
        ok: 1,
        why: 'Se pelo IP funciona e pelo nome não, a tradução (DNS) é que falhou.',
      },
    },
    {
      id: 'n1-2',
      title: 'Usuários, grupos e permissões (Active Directory)',
      min: 6,
      analogy:
        'O Active Directory é a portaria do prédio: tem a lista de quem trabalha ali e quais andares cada crachá abre.',
      paragraphs: [
        {
          text: 'Em vez de dar permissão pessoa por pessoa, as empresas criam grupos (por exemplo, Financeiro-Leitura) e colocam os usuários neles.',
        },
        {
          text: 'Se alguém sai do grupo por engano, o crachá deixa de abrir aquela porta: a pasta aparece como acesso negado.',
        },
      ],
      keys: [
        'AD = cadastro central de usuários.',
        'Permissões são dadas a grupos.',
        'Sem o grupo certo resulta em acesso negado.',
      ],
      flow: ['Usuário', 'Grupo Financeiro', 'Permissão na pasta', 'Acesso liberado'],
      quiz: {
        q: 'A Maria recebe "Acesso negado" e os colegas do setor acessam normalmente. Primeiro passo?',
        opts: [
          'Reinstalar o Windows',
          'Conferir se ela está no grupo correto do AD',
          'Formatar o servidor',
        ],
        ok: 1,
        why: 'Se só ela falha, o problema provavelmente é individual: grupo ou permissão.',
      },
    },
    {
      id: 'n1-3',
      title: 'Acesso remoto com ética: diagnosticar antes de mexer',
      min: 6,
      analogy:
        'O médico não opera antes do exame. O técnico não altera nada antes do diagnóstico — e só entra na máquina com autorização.',
      paragraphs: [
        {
          text: 'O acesso remoto permite ver e operar o computador do usuário à distância. Por segurança, só conectamos depois de confirmar identidade e obter autorização.',
        },
        {
          text: 'Dentro da máquina, a regra de ouro é coletar evidência primeiro (serviços, logs, DNS, grupos) e só então corrigir — com o menor privilégio possível.',
        },
      ],
      keys: [
        'Autorização antes da conexão.',
        'Diagnóstico antes da correção.',
        'Menor privilégio necessário.',
      ],
      flow: ['Confirmar identidade', 'Conectar com autorização', 'Diagnosticar', 'Corrigir e validar'],
      quiz: {
        q: 'Você conectou remotamente. Qual a primeira ação?',
        opts: [
          'Reiniciar tudo para garantir',
          'Coletar evidências (serviços, DNS, grupos)',
          'Virar administrador por padrão',
        ],
        ok: 1,
        why: 'Reiniciar no escuro apaga pistas. Primeiro evidência, depois ação.',
      },
    },
  ],
  n2: [
    {
      id: 'n2-1',
      title: 'Incidente versus Problema (ITIL)',
      min: 6,
      analogy:
        'Se três vizinhos ficam sem luz, não adianta trocar a lâmpada de cada um: o problema é o poste da rua.',
      paragraphs: [
        {
          text: 'Incidente é cada interrupção sentida pelo usuário. Problema é a causa raiz por trás de vários incidentes.',
        },
        {
          text: 'Quando muitos chamados parecidos chegam juntos, o N2 abre um registro de Problema, vincula os incidentes e resolve a causa uma vez só.',
        },
      ],
      keys: [
        'Incidente = sintoma.',
        'Problema = causa raiz.',
        'Resolver a causa fecha vários chamados.',
      ],
      flow: ['3 chamados iguais', 'Abrir Problema ITIL', 'Vincular incidentes', 'Resolver a causa em lote'],
      quiz: {
        q: 'Faturamento, Estoque e Expedição relatam o mesmo erro 502 ao mesmo tempo. O que fazer?',
        opts: [
          'Atender um por um sem relacionar',
          'Abrir um Problema e vincular os chamados',
          'Fechar como duplicados sem investigar',
        ],
        ok: 1,
        why: 'Mesmo sintoma, mesmo momento: forte indício de causa comum.',
      },
    },
    {
      id: 'n2-2',
      title: 'Logs: o diário de bordo dos sistemas',
      min: 5,
      analogy:
        'A caixa-preta do avião registra tudo o que aconteceu antes da pane. Os logs fazem o mesmo nos sistemas.',
      paragraphs: [
        {
          text: 'Logs são registros com data e hora de cada evento: inicializações, erros, acessos.',
        },
        {
          text: 'Ler logs é procurar a primeira mensagem de erro próxima do horário em que o problema começou.',
        },
      ],
      keys: [
        'Log = diário com data e hora.',
        'Comece pelo horário do problema.',
        'O primeiro erro é a melhor pista.',
      ],
      flow: ['Horário do problema', 'Filtrar logs', 'Achar o primeiro erro', 'Formular hipótese'],
      quiz: {
        q: 'O erro começou às 08h00. Onde focar a leitura dos logs?',
        opts: [
          'Logs de ontem à tarde',
          'Mensagens de erro próximas das 08h00',
          'Qualquer linha aleatória',
        ],
        ok: 1,
        why: 'O primeiro erro perto do início do problema costuma ser a pista mais valiosa.',
      },
    },
  ],
  n3: [
    {
      id: 'n3-1',
      title: 'Nuvem e containers sem mistério',
      min: 6,
      analogy:
        'Containers são marmitas padronizadas: cada serviço vai na sua caixa. O Kubernetes é a cozinha que decide onde cada marmita fica e repõe as que caem.',
      paragraphs: [
        {
          text: 'Na nuvem, as aplicações rodam em containers: pacotes que levam o programa e tudo de que ele precisa, funcionando igual em qualquer lugar.',
        },
        {
          text: 'O Kubernetes organiza esses containers em pods: liga, desliga, distribui e reinicia quando algo falha.',
        },
      ],
      keys: [
        'Container = programa empacotado.',
        'Pod = onde os containers rodam.',
        'Kubernetes = orquestrador automático.',
      ],
      flow: ['Aplicação', 'Container', 'Pod', 'Cluster Kubernetes'],
      quiz: {
        q: 'O Kubernetes percebeu que um pod caiu. O que ele costuma fazer sozinho?',
        opts: ['Apagar o banco de dados', 'Tentar reiniciar o pod', 'Desligar a internet'],
        ok: 1,
        why: 'Reiniciar é papel do orquestrador — mas se cair sempre, é hora de investigar a causa.',
      },
    },
    {
      id: 'n3-2',
      title: 'Observabilidade e mitigação segura (SRE)',
      min: 7,
      analogy:
        'O painel do carro avisa temperatura e combustível antes de o motor fundir. Métricas, logs e alertas são o painel dos sistemas.',
      paragraphs: [
        {
          text: 'SRE (Engenharia de Confiabilidade) cuida para que os sistemas fiquem de pé, observando métricas (tempo de resposta, erros), logs e eventos.',
        },
        {
          text: 'Diante de um alerta, o SRE coleta evidência, aplica a mitigação menos arriscada e depois escreve um post-mortem sem culpados.',
        },
      ],
      keys: [
        'Observe antes de agir.',
        'Mitigação sem ações destrutivas.',
        'Post-mortem evita repetição.',
      ],
      flow: ['Alerta', 'Métricas e eventos', 'Causa provável', 'Mitigação segura', 'Post-mortem'],
      quiz: {
        q: 'Um pod reinicia sem parar com o motivo OOMKilled. O que isso indica?',
        opts: [
          'Faltou memória para o processo',
          'O usuário errou a senha',
          'O monitor está desligado',
        ],
        ok: 0,
        why: 'OOM significa Out Of Memory: o processo passou do limite de memória e foi encerrado.',
      },
    },
  ],
  esp: [
    {
      id: 'esp-1',
      title: 'Bancos de dados e SQL em linguagem simples',
      min: 6,
      analogy:
        'Um banco de dados é um conjunto de planilhas organizadas; o SQL é o jeito de fazer perguntas a elas.',
      paragraphs: [
        {
          text: 'Os dados ficam em tabelas (pedidos, notas fiscais), com linhas e colunas. As tabelas se relacionam por códigos em comum.',
        },
        {
          text: 'Com SELECT você só lê. Comandos como UPDATE e DELETE alteram dados — por isso exigem muito mais cuidado e autorização.',
        },
      ],
      keys: [
        'Tabela = planilha organizada.',
        'SELECT = apenas leitura.',
        'Alterar dados exige autorização.',
      ],
      flow: ['Pergunta de negócio', 'Consulta SELECT', 'Resultado', 'Evidência'],
      quiz: {
        q: 'Qual comando apenas lê dados?',
        opts: ['DELETE', 'SELECT', 'UPDATE'],
        ok: 1,
        why: 'SELECT consulta sem modificar nada.',
      },
    },
    {
      id: 'esp-2',
      title: 'Auditoria somente leitura e evidência',
      min: 6,
      analogy: 'O auditor examina os livros contábeis sem rasurar uma linha sequer.',
      paragraphs: [
        {
          text: 'Em auditoria, o objetivo é encontrar e provar a divergência — não corrigi-la por conta própria.',
        },
        {
          text: 'A entrega é a evidência: a consulta usada, o resultado e a explicação, para que o responsável decida a correção.',
        },
      ],
      keys: ['Investigar é diferente de corrigir.', 'Evidência reproduzível.', 'Encaminhar ao responsável.'],
      flow: ['Escopo aprovado', 'Consulta somente leitura', 'Evidência', 'Encaminhamento'],
      quiz: {
        q: 'Você achou 12 pedidos sem nota fiscal. O que fazer?',
        opts: [
          'Corrigir direto no banco',
          'Documentar a evidência e encaminhar ao responsável',
          'Apagar os 12 pedidos',
        ],
        ok: 1,
        why: 'Auditoria entrega evidência; a correção segue o processo do dono dos dados.',
      },
    },
  ],
}

export const CARDS: Record<NivelId, FlashCard[]> = {
  estagiario: [
    {
      id: 'c-est-1',
      f: 'O que é um chamado (ticket)?',
      b: 'A ficha oficial de um pedido de ajuda no ITSM: quem pediu, o que aconteceu, quando e o que foi feito.',
    },
    {
      id: 'c-est-2',
      f: 'Como se calcula a prioridade de um chamado?',
      b: 'Urgência (quanta pressa) somada ao Impacto (quantas pessoas pararam) gera a Prioridade (P1 a P4), que define o prazo SLA.',
    },
    {
      id: 'c-est-3',
      f: 'Quais sinais indicam engenharia social?',
      b: 'Pressa extrema, apelo à autoridade ("sou diretor") e pedido para pular a verificação (sem token).',
    },
  ],
  n1: [
    {
      id: 'c-n1-1',
      f: 'O que o DNS faz?',
      b: 'Traduz nomes (AURORA-SRV01) em endereços IP — é a agenda de contatos da rede.',
    },
    {
      id: 'c-n1-2',
      f: 'Só uma pessoa recebe "acesso negado" numa pasta. Primeiro suspeito?',
      b: 'Grupo ou permissão no Active Directory: ela pode ter perdido o vínculo com o grupo correto.',
    },
    {
      id: 'c-n1-3',
      f: 'Qual a regra de ouro do acesso remoto?',
      b: 'Autorização antes de conectar e diagnóstico antes de corrigir, com o menor privilégio necessário.',
    },
  ],
  n2: [
    {
      id: 'c-n2-1',
      f: 'Qual a diferença entre incidente e problema?',
      b: 'Incidente é a interrupção sentida pelo usuário; problema é a causa raiz por trás de vários incidentes.',
    },
    {
      id: 'c-n2-2',
      f: 'Onde procurar a causa num log?',
      b: 'Perto do horário em que o problema começou: a primeira mensagem de erro costuma apontar a causa.',
    },
  ],
  n3: [
    {
      id: 'c-n3-1',
      f: 'O que é um pod no Kubernetes?',
      b: 'A menor unidade que roda um ou mais containers — como uma marmita com o serviço dentro.',
    },
    {
      id: 'c-n3-2',
      f: 'O que significa OOMKilled?',
      b: 'O processo passou do limite de memória e foi encerrado automaticamente.',
    },
  ],
  esp: [
    {
      id: 'c-esp-1',
      f: 'Qual comando SQL apenas lê dados?',
      b: 'SELECT. UPDATE e DELETE alteram dados e não são usados em auditoria.',
    },
    {
      id: 'c-esp-2',
      f: 'O que entregar ao fim de uma auditoria?',
      b: 'Evidência clara e reproduzível (consulta e resultado), sem alterar nenhum dado.',
    },
  ],
}

export const CONCEPTS: ConceitoFeynman[] = [
  { level: 'estagiario', name: 'Chamado e ITSM' },
  { level: 'estagiario', name: 'Prioridade e SLA' },
  { level: 'estagiario', name: 'Engenharia social' },
  { level: 'n1', name: 'DNS' },
  { level: 'n1', name: 'Grupos do Active Directory' },
  { level: 'n1', name: 'Acesso remoto seguro' },
  { level: 'n2', name: 'Incidente versus Problema' },
  { level: 'n2', name: 'Logs' },
  { level: 'n3', name: 'Containers e Kubernetes' },
  { level: 'n3', name: 'OOMKilled' },
  { level: 'esp', name: 'SQL somente leitura' },
]

export const STAR_PREFILLS: Record<NivelId, PitchStar> = {
  estagiario: {
    s: 'No meu primeiro dia simulado no suporte da Aurora Logística, chegou um pedido urgente de troca de senha de alguém que dizia ser diretor, sem token.',
    t: 'Eu precisava atender rápido sem colocar a conta e a empresa em risco.',
    a: 'Eu assumi o chamado, consultei a política KB-001, solicitei matrícula e token corporativo no chat e, como não havia token válido, recusei a troca com educação e registrei nota interna.',
    r: 'A conta ficou protegida, a tentativa de golpe foi documentada em menos de 10 minutos e minha avaliação 360º atingiu 100% nos critérios de segurança.',
  },
  n1: {
    s: 'No laboratório de suporte N1, a analista do Financeiro não conseguia abrir a pasta de rede no dia do fechamento fiscal.',
    t: 'Eu precisava restabelecer o acesso antes do prazo SLA sem causar novos problemas.',
    a: 'Eu confirmei a identidade dela com matrícula e ramal, conectei com autorização no SimuDesk, testei DNS, grupos do AD e serviços e identifiquei a causa raiz antes de aplicar a correção.',
    r: 'A pasta voltou em cerca de 15 minutos, dentro do SLA, e documentei a causa raiz e a validação no chamado.',
  },
  n2: {
    s: 'No laboratório N2, três setores ficaram sem ERP após uma atualização noturna.',
    t: 'Eu precisava restaurar a operação e encontrar a causa comum sem encerrar chamados às escuras.',
    a: 'Eu agrupei os chamados num Problema ITIL, confirmei a autorização, li os logs do horário da falha, elevei privilégio e restaurei o serviço AuroraGateway com validação.',
    r: 'Os três setores voltaram a operar em menos de 20 minutos e a causa raiz ficou registrada para a equipe de mudanças.',
  },
  n3: {
    s: 'No laboratório de SRE, a API de rastreamento ficou degradada e com falhas em produção.',
    t: 'Eu precisava mitigar sem ações destrutivas e entender a causa.',
    a: 'Eu inspecionei os pods e logs no cluster Kubernetes simulado, identifiquei o motivo raiz no evento do sistema, elevei privilégio e apliquei mitigação segura.',
    r: 'A disponibilidade do cluster voltou para Healthy (HTTP 200) sem perda de dados e documentei o post-mortem.',
  },
  esp: {
    s: 'No laboratório de auditoria SQL, a Controladoria encontrou divergência entre entregas e pagamentos.',
    t: 'Eu precisava localizar a divergência sem alterar nenhum dado em produção.',
    a: 'Eu confirmei o escopo somente leitura, executei consultas SELECT seguras validando as tabelas pedidos e pagamentos e documentei a evidência reproduzível.',
    r: 'Identifiquei a linha divergente sem executar escrita e entreguei o relatório auditável dentro do prazo.',
  },
}

export const AI_KB: { k: string[]; a: string }[] = [
  {
    k: ['dns'],
    a: 'DNS é a agenda de contatos da rede: você digita um nome (AURORA-SRV01) e ele devolve o número (IP) do computador. Se o DNS aponta para o número errado, parece que o sistema caiu — mas ele só está discando errado.\nAula recomendada: N1, Rede, IP e DNS.',
  },
  {
    k: ['sla', 'prioridade', 'urgência', 'urgencia', 'impacto'],
    a: 'Prioridade combina Urgência (pressa) com Impacto (quantas pessoas pararam). Exemplo: faturamento parado para a empresa toda no fechamento gera prioridade P1. Cada prioridade tem um prazo combinado, o SLA.\nAula recomendada: Estagiário, Prioridade.',
  },
  {
    k: ['token', 'engenharia', 'golpe', 'senha', 'phishing'],
    a: 'Engenharia social é convencer pessoas a quebrar regras usando pressa, autoridade ou simpatia. Sinais: urgência extrema, "sou diretor", pedido para pular a verificação. Resposta profissional: seguir a política KB-001, pedir token e matrícula, recusar com educação e registrar nota interna.',
  },
  {
    k: ['ad', 'active directory', 'grupo', 'permiss'],
    a: 'O Active Directory é a portaria da empresa: lista quem trabalha ali e quais portas cada crachá abre. Permissões são dadas a grupos; quem sai do grupo recebe acesso negado.\nAula recomendada: N1, Usuários, grupos e permissões.',
  },
  {
    k: ['incidente', 'itil'],
    a: 'Incidente é cada interrupção que o usuário sente; Problema é a causa raiz por trás de vários incidentes. Três setores com o mesmo erro ao mesmo tempo? Abra um Problema e resolva a causa uma vez só.',
  },
  {
    k: ['log'],
    a: 'Logs são o diário de bordo do sistema. Vá ao horário em que o problema começou e procure a primeira mensagem de erro — ela costuma apontar a causa.',
  },
  {
    k: ['kubernetes', 'pod', 'container', 'oom', 'cloud', 'nuvem'],
    a: 'Containers são marmitas padronizadas e o Kubernetes é a cozinha que distribui e repõe as marmitas. OOMKilled quer dizer que o processo passou do limite de memória e foi desligado. O SRE investiga a causa antes de reiniciar.',
  },
  {
    k: ['sql', 'select', 'banco'],
    a: 'SQL é a forma de fazer perguntas a um banco de dados. SELECT só lê; UPDATE e DELETE alteram — por isso a auditoria usa apenas leitura e documenta a evidência.',
  },
  {
    k: ['chamado', 'ticket', 'itsm'],
    a: 'Chamado é a ficha oficial de um pedido de ajuda, registrada no ITSM. Assumir o chamado mostra quem é o responsável e evita retrabalho.',
  },
  {
    k: ['estudar', 'esqueç', 'esquec', 'memoriz', 'revis', 'foco', 'concentr'],
    a: 'Três técnicas com forte evidência científica:\n1) Recordação ativa — tente lembrar antes de reler;\n2) Repetição espaçada — revise em 1, 3 e 7 dias (os flashcards agendam isso);\n3) Técnica de Feynman — explique com palavras simples.\nUse também o timer de foco 25/5 no Painel.',
  },
  {
    k: ['entrevista', 'pitch', 'vaga', 'currículo', 'curriculo', 'recrutador'],
    a: 'Use o método STAR: Situação, Tarefa, Ação e Resultado. Fale de um chamado que você resolveu no laboratório, destaque o que você fez e termine com um resultado concreto (tempo, números). A aba Pitch STAR monta isso com você.',
  },
  {
    k: ['problema'],
    a: 'Se vários usuários têm o mesmo sintoma, trate como Problema (ITIL): vincule os chamados e resolva a causa raiz. Se é um caso isolado, siga o roteiro do nível: identidade, diagnóstico, correção e explicação.',
  },
]

export const DEFAULT_PAGES: PaginaCaderno[] = [
  {
    id: 'plano',
    icon: 'plano',
    title: 'Plano de estudos da semana',
    level: null,
    type: 'todo',
    todos: [
      { t: 'Concluir as 3 aulas do Estagiário', done: false },
      { t: 'Revisar flashcards (5 min por dia)', done: false },
      { t: 'Fazer o laboratório Nível 1 (Engenharia Social)', done: false },
      { t: 'Explicar engenharia social com a Técnica de Feynman', done: false },
      { t: 'Montar meu primeiro Pitch STAR', done: false },
    ],
  },
  {
    id: 'pg-estagiario',
    icon: 'nivel-estagiario',
    title: 'Estagiário: Chamados, prioridade e golpes',
    level: 'estagiario',
    type: 'cornell',
    cues: 'O que é um chamado?\nComo calcular a prioridade?\nComo reconhecer engenharia social?',
    notes:
      '• Todo pedido vira chamado no ITSM — é a memória oficial do suporte.\n• Prioridade = urgência (pressa) somada ao impacto (quantas pessoas).\n• Pressa e autoridade sem token = sinal de golpe. Seguir a política KB-001.',
    summary: 'O suporte trabalha com registro, prioridade e verificação. Segurança vale para todos, inclusive diretores.',
  },
  {
    id: 'pg-n1',
    icon: 'nivel-n1',
    title: 'N1: Redes, DNS e acesso remoto',
    level: 'n1',
    type: 'cornell',
    cues: 'O que o DNS faz?',
    notes: '• IP = endereço numérico. DNS = agenda que traduz nome para IP.',
    summary: '',
  },
  {
    id: 'duvidas',
    icon: 'ideia',
    title: 'Dúvidas para levar ao mentor',
    level: null,
    type: 'free',
    text: '- Qual a diferença entre incidente e problema?\n- Como explicar SLA numa entrevista?',
  },
]

export const GLOSSARIO_INICIANTE = [
  {
    termo: 'ITSM (Fila de Chamados)',
    definicao: 'Sistema onde o técnico registra, prioriza (SLA) e documenta cada atendimento.',
  },
  {
    termo: 'SimuDesk (Acesso Remoto)',
    definicao: 'Ferramenta de acesso remoto corporativo que só libera conexão após validar matrícula e ramal do solicitante.',
  },
  {
    termo: 'KB (Base de Conhecimento)',
    definicao: 'Manual interno de procedimentos aprovados da Aurora Logística para agir com segurança.',
  },
  {
    termo: 'Caixa-Preta (Replay)',
    definicao: 'Gravação passo a passo da sua missão mostrando o que o Juiz 360º avaliou e por quê.',
  },
  {
    termo: 'Semente e Chaos Injector',
    definicao: 'Número opcional que sorteia qual defeito real aconteceu nos bastidores para evitar resposta decorada.',
  },
]

const ACADEMIA_STORAGE_KEY = 'itfs_academia_v3'

export function criarEstadoInicialAcademia(): EstadoAcademia {
  return {
    xp: 0,
    streak: 1,
    weekMin: 0,
    weekGoal: 90,
    focus: 'estagiario',
    lessonsDone: [],
    cards: {},
    pages: JSON.parse(JSON.stringify(DEFAULT_PAGES)) as PaginaCaderno[],
    activePage: 'plano',
    pitches: [],
    feynman: [],
    labsDone: [],
  }
}

const ICONE_LEGADO: Record<string, NomeIcone> = {
  '\u{1F392}': 'nivel-estagiario',
  '\u{1F3A7}': 'nivel-n1',
  '\u{1F9E9}': 'nivel-n2',
  '\u2601\uFE0F': 'nivel-n3',
  '\u{1F3C5}': 'nivel-esp',
  '\u{1F5D3}\uFE0F': 'plano',
  '\u{1F4A1}': 'ideia',
  '\u{1F3A4}': 'pitch',
  '\u{1F4DD}': 'notas',
  '\u{1F3AF}': 'meta',
  '\u{1F4C4}': 'pagina',
}

/** Converte o icone de uma pagina salva (inclusive emoji de versoes antigas) em um identificador valido. */
export function normalizarIconePagina(valor: unknown): NomeIcone {
  if (ehNomeIcone(valor)) return valor
  return (typeof valor === 'string' && ICONE_LEGADO[valor]) || 'pagina'
}

export function carregarEstadoAcademia(): EstadoAcademia {
  try {
    const raw = window.localStorage.getItem(ACADEMIA_STORAGE_KEY)
    if (!raw) return criarEstadoInicialAcademia()
    const parsed = JSON.parse(raw) as Partial<EstadoAcademia>
    const base = criarEstadoInicialAcademia()
    return {
      ...base,
      ...parsed,
      pages:
        Array.isArray(parsed.pages) && parsed.pages.length > 0
          ? parsed.pages.map((pagina) => ({ ...pagina, icon: normalizarIconePagina(pagina.icon) }))
          : base.pages,
      lessonsDone: Array.isArray(parsed.lessonsDone) ? parsed.lessonsDone : base.lessonsDone,
      pitches: Array.isArray(parsed.pitches) ? parsed.pitches : base.pitches,
      feynman: Array.isArray(parsed.feynman) ? parsed.feynman : base.feynman,
      labsDone: Array.isArray(parsed.labsDone) ? parsed.labsDone : base.labsDone,
      cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : base.cards,
    }
  } catch {
    return criarEstadoInicialAcademia()
  }
}

export function salvarEstadoAcademia(estado: EstadoAcademia) {
  try {
    window.localStorage.setItem(ACADEMIA_STORAGE_KEY, JSON.stringify(estado))
  } catch {
    // ignore storage quota errors
  }
}

export function nivelPorId(id: NivelId): NivelEducacional {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}

export function nivelPorCenarioId(cenarioId: string): NivelEducacional {
  return LEVELS.find((l) => l.cenarioId === cenarioId) ?? LEVELS[0]
}

export function aulaPorId(id: string): { lesson: MicroAula; level: NivelId } | null {
  for (const L of LEVELS) {
    const l = LESSONS[L.id].find((x) => x.id === id)
    if (l) return { lesson: l, level: L.id }
  }
  return null
}

export function isCardDue(estado: EstadoAcademia, cardId: string): boolean {
  return !estado.cards[cardId] || estado.cards[cardId].due <= 0
}

export function obterCardsParaHoje(estado: EstadoAcademia): FlashCardComNivel[] {
  const out: FlashCardComNivel[] = []
  for (const L of LEVELS) {
    const started = LESSONS[L.id].some((l) => estado.lessonsDone.includes(l.id))
    if (started) {
      for (const c of CARDS[L.id]) {
        if (isCardDue(estado, c.id)) out.push({ ...c, level: L.id })
      }
    }
  }
  return out
}

function normalizarNota(texto: string | undefined): string {
  return (texto ?? '').replace(/\r\n/g, '\n').trim()
}

/** Nota do aluno conta como progresso so se tiver mais de 20 caracteres e diferir do texto semeado do nivel. */
function notaContaComoProgresso(pagina: PaginaCaderno | undefined, id: NivelId): boolean {
  if (!pagina) return false
  const nota = normalizarNota(pagina.notes)
  if (nota.length <= 20) return false
  const semeada = DEFAULT_PAGES.find((x) => x.level === id && x.type === 'cornell')
  return nota !== normalizarNota(semeada?.notes)
}

export function calcularProgressoNivel(estado: EstadoAcademia, id: NivelId) {
  const ls = LESSONS[id]
  const t = Math.round((ls.filter((l) => estado.lessonsDone.includes(l.id)).length / ls.length) * 100)
  const cs = CARDS[id]
  const rated = cs.filter((c) => Boolean(estado.cards[c.id])).length
  const pg = estado.pages.find((x) => x.level === id && x.type === 'cornell')
  const hasNotes = notaContaComoProgresso(pg, id)
  const f = Math.min(
    100,
    Math.round((rated / cs.length) * 50 + (estado.feynman.includes(id) ? 30 : 0) + (hasNotes ? 20 : 0)),
  )
  const p = estado.labsDone.includes(id) ? 100 : 0
  return { t, f, p }
}

export function primeiraAulaNivel(estado: EstadoAcademia, id: NivelId): string {
  const ls = LESSONS[id]
  return (ls.find((l) => !estado.lessonsDone.includes(l.id)) ?? ls[0]).id
}

export function obterProximaAcao(estado: EstadoAcademia) {
  for (const L of LEVELS) {
    const pr = calcularProgressoNivel(estado, L.id)
    const nl = LESSONS[L.id].find((l) => !estado.lessonsDone.includes(l.id))
    if (nl) {
      return {
        phase: 'theory' as const,
        level: L.id,
        title: nl.title,
        meta: `Aula de ${L.nome}, ${nl.min} min`,
        act: 'lesson' as const,
        lessonId: nl.id,
        cta: 'Começar a aula',
      }
    }
    if (pr.f < 60) {
      return {
        phase: 'fix' as const,
        level: L.id,
        title: `Revisar os flashcards de ${L.nome}`,
        meta: 'Repetição espaçada, 5 min',
        act: 'cards' as const,
        cta: 'Revisar agora',
      }
    }
    if (pr.p < 100) {
      return {
        phase: 'practice' as const,
        level: L.id,
        title: `Laboratório: ${L.titulo}`,
        meta: `Prática guiada no cockpit, ${L.nome}, cerca de 15 min`,
        act: 'lab' as const,
        cta: 'Entrar no laboratório',
      }
    }
  }
  return {
    phase: 'mastery' as const,
    level: 'esp' as NivelId,
    title: 'Jornada completa! Você dominou os 5 níveis do MVP.',
    meta: 'Exporte e valide seu Currículo Vivo (ECDSA P-256)',
    act: 'cv' as const,
    cta: 'Abrir Currículo Vivo',
  }
}

export function obterPatente(estado: EstadoAcademia): string {
  let patente = 'Cadete (iniciante)'
  for (const L of LEVELS) {
    if (estado.labsDone.includes(L.id)) patente = L.nome
  }
  return patente
}

export function responderMentor(raw: string): string {
  const t = raw.toLowerCase()
  for (const item of AI_KB) {
    if (item.k.some((k) => (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(t) : t.includes(k)))) return item.a
  }
  return 'Essa pergunta está fora da base desta trilha. O Mentor responde sobre chamados, prioridade e SLA, engenharia social, DNS, Active Directory, logs, Kubernetes, SQL, técnicas de estudo e entrevistas.'
}

const JARGON = [
  'protocolo',
  'ip',
  'dns',
  'servidor',
  'autenticação',
  'autenticacao',
  'cluster',
  'pod',
  'container',
  'query',
  'latência',
  'latencia',
  'sla',
  'itsm',
  'gateway',
  'endpoint',
  'ldap',
  'smb',
  'tcp',
  'http',
  'api',
  'hash',
  'token',
  'privilégio',
  'privilegio',
  'oom',
  'réplica',
  'replica',
  'schema',
  'kubernetes',
  'active directory',
]

export interface ResultadoFeynman {
  score: number
  words: number
  avg: number
  found: string[]
  unexplained: string[]
  analogy: boolean
  example: boolean
  qs: string[]
}

export function avaliarFeynman(text: string): ResultadoFeynman {
  const t = text.toLowerCase()
  const words = text.trim() ? text.trim().split(/\s+/) : []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim())
  const avg = words.length / Math.max(1, sentences.length)
  const found = JARGON.filter((j) => (j.length <= 4 ? new RegExp(`\\b${j}\\b`).test(t) : t.includes(j)))
  const unexplained = found.filter((j) => !new RegExp(`${j}\\s*(é|e|\\(|significa|quer dizer|funciona como)`).test(t))
  const analogy = /(é como|parece|imagine|igual a|tipo uma|tipo um|como se|funciona como)/.test(t)
  const example = /(por exemplo|exemplo|quando a |quando o |aconteceu)/.test(t)
  let score =
    100 -
    unexplained.length * 12 -
    (avg > 22 ? 15 : 0) +
    (analogy ? 5 : -15) +
    (example ? 5 : -10) -
    (words.length < 25 ? 25 : 0)
  score = Math.max(0, Math.min(100, score))
  const qs: string[] = []
  for (const j of unexplained) qs.push(`Desculpa, o que é "${j}"? Dá para explicar sem esse termo?`)
  if (!analogy) qs.push('Consegue comparar com algo do dia a dia?')
  if (!example) qs.push('Pode dar um exemplo concreto, tipo algo que aconteceu na Aurora Logística?')
  if (avg > 22) qs.push('Suas frases estão longas. Pode dividir em frases menores?')
  if (words.length < 25) qs.push('Ficou curtinho. O que acontece antes e depois?')
  return { score, words: words.length, avg: Math.round(avg), found, unexplained, analogy, example, qs }
}

export interface ResultadoPitchStar {
  checks: { ok: boolean; good: string; bad: string }[]
  text: string
  secs: number
  score: number
}

export function avaliarPitchStar(p: PitchStar): ResultadoPitchStar {
  const w = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)
  const checks = [
    { ok: w(p.s) >= 8, good: 'Situação com contexto claro.', bad: 'Descreva melhor a situação (onde, quando, quem).' },
    { ok: w(p.t) >= 5, good: 'Tarefa bem definida.', bad: 'Diga qual era o desafio a resolver.' },
    {
      ok:
        w(p.a) >= 15 &&
        /(\beu\b|verifiquei|validei|consultei|diagnostiquei|identifiquei|corrigi|apliquei|confirmei|iniciei|escrevi|pedi)/i.test(
          p.a,
        ),
      good: 'Ação detalhada e em primeira pessoa.',
      bad: 'Detalhe o que você fez, usando "eu" e verbos de ação.',
    },
    {
      ok: /\d|reduz|restabel|resolvid|evit|protegi|protegida|minutos|%/i.test(p.r) && w(p.r) >= 6,
      good: 'Resultado concreto e mensurável.',
      bad: 'Inclua um resultado com número (tempo, percentual, pessoas).',
    },
  ]
  const text = (['s', 't', 'a', 'r'] as const).map((k) => p[k].trim()).filter(Boolean).join(' ')
  const secs = Math.round(w(text) / 2.3)
  return { checks, text, secs, score: checks.filter((c) => c.ok).length }
}
