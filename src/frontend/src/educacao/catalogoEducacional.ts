import {
  CATALOGO_ROTAS,
  type Etapa,
  type IdMissao,
  type IdVertente,
  ehIdMissao,
  etapaDaMissao,
} from '../jornada/catalogos/catalogoRotas'
import { type NomeIcone, ehNomeIcone } from '../ui/catalogoIcones'

/**
 * Nível de estudo: uma etapa do Catálogo de Rotas ou, na N3 Sênior, uma Vertente. O identificador é o do
 * catálogo: help-desk-n1, service-desk-n1-jr, n2-pleno, n3-a-redes-nuvem, n3-b-data-center-backup e
 * n3-c-seguranca-dados.
 */
export type NivelId = 'help-desk-n1' | 'service-desk-n1-jr' | 'n2-pleno' | IdVertente

export interface NivelEducacional {
  id: NivelId
  /** Nome exibido, igual ao da etapa ou da Vertente no Catálogo de Rotas. */
  nome: string
  /** Missões do catálogo que o nível pratica, na ordem do catálogo. */
  cenarioIds: readonly IdMissao[]
  /** Missão de prática padrão do nível: a primeira do catálogo. */
  cenarioId: IdMissao
  icon: NomeIcone
  sub: string
}

export interface MicroAula {
  id: string
  title: string
  min: number
  /** Missão que a aula pratica, quando difere da padrão do nível. */
  cenarioId?: IdMissao
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
  /** Missões concluídas no laboratório. Cada uma conta 60 XP uma única vez. */
  labsDone: IdMissao[]
}

const APRESENTACAO_DO_NIVEL: Record<NivelId, { icon: NomeIcone; sub: string }> = {
  'help-desk-n1': { icon: 'nivel-help-desk-n1', sub: 'Identidade, acesso e orientação básica' },
  'service-desk-n1-jr': { icon: 'nivel-service-desk-n1-jr', sub: 'Redes, usuários e acesso remoto' },
  'n2-pleno': { icon: 'nivel-n2-pleno', sub: 'ITIL, incidentes em massa e logs' },
  'n3-a-redes-nuvem': { icon: 'nivel-n3-a-redes-nuvem', sub: 'Cloud, Kubernetes e observabilidade SRE' },
  'n3-b-data-center-backup': { icon: 'nivel-n3-b-data-center-backup', sub: 'Backup, restauração e cópia imutável' },
  'n3-c-seguranca-dados': { icon: 'nivel-n3-c-seguranca-dados', sub: 'Engenharia social e auditoria SQL' },
}

function nivelDe(id: NivelId, nome: string, missoes: readonly { id: IdMissao }[]): NivelEducacional {
  const cenarioIds = missoes.map((missao) => missao.id)
  return { id, nome, cenarioIds, cenarioId: cenarioIds[0], ...APRESENTACAO_DO_NIVEL[id] }
}

function niveisDaEtapa(etapa: Etapa): NivelEducacional[] {
  if (etapa.vertentes.length > 0) return etapa.vertentes.map((vertente) => nivelDe(vertente.id, vertente.nome, vertente.missoes))
  return [nivelDe(etapa.id as NivelId, etapa.nome, etapa.missoes)]
}

/**
 * Trilha de estudo: uma entrada por etapa do Catálogo de Rotas, e uma por Vertente na N3 Sênior, na
 * ordem do catálogo. Etapa, nome e cenários vêm do catálogo; aqui só ficam ícone e subtítulo.
 */
export const LEVELS: NivelEducacional[] = CATALOGO_ROTAS[0].etapas.flatMap(niveisDaEtapa)

export const LESSONS: Record<NivelId, MicroAula[]> = {
  'help-desk-n1': [
    {
      id: 'help-desk-n1-1',
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
      id: 'help-desk-n1-2',
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
      id: 'help-desk-n1-3',
      title: 'Verificar a identidade antes de agir',
      min: 6,
      analogy: 'É o porteiro que confere o crachá antes de abrir a porta: simpatia não substitui o documento.',
      paragraphs: [
        {
          text: 'Antes de redefinir uma senha ou liberar uma conta, o suporte precisa ter certeza de quem está pedindo. Na Aurora Logística, isso significa confirmar matrícula e ramal da titular e ler o estado da conta no console, sem agir ainda.',
        },
        {
          text: 'Quando o pedido vem de outra pessoa, por exemplo o gestor da titular, a identidade só vale depois de contatar a própria titular pelo ramal do diretório. Um número passado por quem pede não serve: pode ser de um golpista.',
        },
      ],
      keys: [
        'Confirme quem é a titular antes de qualquer ação sensível.',
        'Pedido por terceiro: ligue para a titular pelo ramal do diretório.',
        'Ação sem identidade verificada fica registrada como erro.',
      ],
      flow: ['Pedido recebido', 'Ler o estado da conta', 'Confirmar a identidade da titular', 'Escolher a menor ação', 'Registrar no chamado'],
      quiz: {
        q: 'O gestor da Fernanda pede o reset da senha dela e passa um número de telefone para você confirmar. O que fazer?',
        opts: [
          'Ligar para o número que o gestor passou e resetar se atenderem',
          'Procurar o ramal da Fernanda no diretório, ligar para ela e só então agir',
          'Resetar logo, porque o gestor tem autoridade',
        ],
        ok: 1,
        why: 'O contato vem do diretório da empresa, não de quem pede. Só assim a identidade da titular fica confirmada.',
      },
    },
    {
      id: 'help-desk-n1-4',
      title: 'Reset com senha temporária e troca obrigatória',
      min: 5,
      analogy: 'É a chave reserva do hotel: abre a porta uma vez, e na primeira entrada você escolhe a sua.',
      paragraphs: [
        {
          text: 'Quando a pessoa esqueceu a senha e a identidade foi confirmada, o suporte define uma senha temporária e marca a troca obrigatória no primeiro acesso. Assim, nem o analista conhece a senha definitiva.',
        },
        {
          text: 'A senha temporária nunca vai escrita no chamado nem em um chat aberto. Ela segue por um canal já confirmado, e a nota pública diz o que foi feito sem repetir a senha.',
        },
      ],
      keys: [
        'Reset gera uma senha temporária.',
        'A troca no primeiro acesso é obrigatória.',
        'Nunca escreva a senha no chamado.',
      ],
      flow: ['Senha esquecida', 'Identidade confirmada', 'Senha temporária', 'Troca obrigatória no primeiro acesso', 'Nota pública sem a senha'],
      quiz: {
        q: 'Depois de resetar a senha da Fernanda, o que deve constar na nota pública do chamado?',
        opts: [
          'A senha temporária, para ela não esquecer',
          'O que foi feito e que a troca é obrigatória no primeiro acesso',
          'Nada: reset não precisa de nota',
        ],
        ok: 1,
        why: 'A nota registra a ação e orienta a pessoa, sem expor credencial.',
      },
    },
    {
      id: 'help-desk-n1-5',
      title: 'Conta bloqueada: descubra a origem antes de desbloquear',
      min: 6,
      analogy: 'Se o alarme dispara toda noite, silenciar não resolve: é preciso achar quem mexe na porta.',
      paragraphs: [
        {
          text: 'Uma conta bloqueia depois de várias tentativas erradas. Se a titular garante que não errou a senha, as tentativas podem vir de outro lugar, como um aplicativo antigo com a senha salva ou um celular com o e-mail desatualizado.',
        },
        {
          text: 'Por isso o analista olha os eventos de segurança da conta e identifica a origem antes de desbloquear. Desbloquear sem tratar a origem faz a conta bloquear de novo minutos depois.',
        },
      ],
      keys: [
        'Bloqueio vem de tentativas erradas.',
        'Procure a origem nos eventos de segurança.',
        'Desbloquear sem tratar a origem repete o problema.',
      ],
      flow: ['Conta bloqueada', 'Eventos de segurança', 'Origem identificada', 'Desbloqueio', 'Orientar a titular'],
      quiz: {
        q: 'A conta bloqueou três vezes hoje e a titular diz que não digitou nada errado. Qual o próximo passo?',
        opts: [
          'Desbloquear de novo e encerrar o chamado',
          'Ver nos eventos de segurança de onde vêm as tentativas',
          'Resetar a senha sem verificar nada',
        ],
        ok: 1,
        why: 'Sem achar a origem das tentativas, o bloqueio volta. O reset também seria uma ação desnecessária.',
      },
    },
    {
      id: 'help-desk-n1-6',
      title: 'Senha expirada: oriente, não resete',
      min: 5,
      analogy: 'É o documento vencido: a pessoa o renova no balcão de autoatendimento, ninguém emite outro por ela.',
      paragraphs: [
        {
          text: 'Senha expirada é diferente de senha esquecida. A pessoa sabe a senha atual e só precisa trocá-la. O autoatendimento de troca de senha existe para isso.',
        },
        {
          text: 'Resetar nesse caso é uma ação desnecessária: dá ao suporte mais poder do que o problema exige e fica registrada na trilha do atendimento. O correto é orientar o caminho e confirmar que a pessoa conseguiu entrar.',
        },
      ],
      keys: [
        'Senha expirada pede troca, não reset.',
        'Use a menor ação que resolve.',
        'Registre a orientação no chamado.',
      ],
      flow: ['Senha expirada', 'Confirmar a identidade', 'Orientar a troca pelo autoatendimento', 'Pessoa troca a senha', 'Chamado resolvido'],
      quiz: {
        q: 'A Fernanda recebeu o aviso de senha expirada ao entrar e lembra a senha atual. O que o suporte faz?',
        opts: [
          'Resetar a senha e passar uma temporária',
          'Orientar a troca pelo autoatendimento e confirmar o acesso',
          'Desbloquear a conta',
        ],
        ok: 1,
        why: 'Ela só precisa renovar a senha. A menor ação que resolve é orientar.',
      },
    },
  ],
  'service-desk-n1-jr': [
    {
      id: 'service-desk-n1-jr-1',
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
      id: 'service-desk-n1-jr-2',
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
      id: 'service-desk-n1-jr-3',
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
  'n2-pleno': [
    {
      id: 'n2-pleno-1',
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
      id: 'n2-pleno-2',
      title: 'Logs: o diário de bordo dos sistemas',
      min: 5,
      analogy:
        'A revisao do avião registra tudo o que aconteceu antes da pane. Os logs fazem o mesmo nos sistemas.',
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
  'n3-a-redes-nuvem': [
    {
      id: 'n3-a-redes-nuvem-1',
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
      id: 'n3-a-redes-nuvem-2',
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
  'n3-b-data-center-backup': [
    {
      id: 'n3-b-data-center-backup-1',
      title: 'Backup falhou: leia o log do job antes de mexer',
      min: 6,
      analogy:
        'É o diário do caminhão de entregas: antes de culpar o motorista, leia por que ele voltou com a carga.',
      paragraphs: [
        {
          text: 'Quando um job de backup falha, o log do job diz o que o impediu de rodar. Uma causa comum é o repositório cheio: não há espaço para gravar a nova cópia.',
        },
        {
          text: 'O diagnóstico segue uma ordem: estado do job, log do job e, depois, o estado do repositório e da cadeia de cópias. Só então se corrige. Ampliar a capacidade e executar o job de novo exigem privilégio elevado, e o resultado é confirmado antes de resolver o chamado.',
        },
      ],
      keys: [
        'Leia o log do job antes de qualquer mudança.',
        'Repositório cheio impede a nova cópia.',
        'Confirme o resultado antes de resolver.',
      ],
      flow: ['Job falhou', 'Estado e log do job', 'Comparar repositório e cadeia', 'Corrigir com privilégio elevado', 'Executar o job e confirmar'],
      quiz: {
        q: 'O log do job de backup do Financeiro diz "sem espaço no repositório". Qual a ordem certa?',
        opts: [
          'Apagar pontos de restauração antigos para liberar espaço',
          'Conferir repositório e cadeia, ampliar a capacidade com privilégio elevado e rodar o job de novo',
          'Ignorar e esperar a próxima janela de backup',
        ],
        ok: 1,
        why: 'Apagar pontos de restauração compromete a retenção. A correção é ampliar o espaço e confirmar com uma nova execução.',
      },
    },
    {
      id: 'n3-b-data-center-backup-2',
      title: 'Cópia imutável, cadeia e restore',
      min: 6,
      analogy: 'A cópia imutável é o cofre do banco: depois de guardada, nem o dono altera até o prazo vencer.',
      paragraphs: [
        {
          text: 'A cópia imutável não pode ser alterada nem apagada durante a retenção. É a última linha de defesa dos dados. A cadeia incremental depende de cada ponto anterior: um ponto inválido compromete os seguintes.',
        },
        {
          text: 'Antes de restaurar, verifique a integridade da cadeia e das cópias para escolher uma origem íntegra. Nunca restaure sobre dados íntegros, porque isso sobrescreve o trabalho do dia, e confirme com o dono da pasta antes de encerrar.',
        },
      ],
      keys: [
        'Cópia imutável protege contra alteração e apagamento.',
        'Verifique a cadeia antes de restaurar.',
        'Não restaure sobre dados íntegros.',
      ],
      flow: ['Cadeia verificada', 'Origem íntegra escolhida', 'Restore', 'Dono da pasta confirma', 'Chamado resolvido'],
      quiz: {
        q: 'A pasta Financeiro foi corrompida e a cadeia tem um ponto inválido. O que fazer antes do restore?',
        opts: [
          'Restaurar do último ponto sem conferir nada',
          'Verificar a integridade da cadeia e escolher uma origem íntegra',
          'Apagar a cadeia inteira e começar do zero',
        ],
        ok: 1,
        why: 'Restaurar de um ponto inválido propaga o problema. Primeiro escolha uma origem comprovadamente íntegra.',
      },
    },
  ],
  'n3-c-seguranca-dados': [
    {
      id: 'n3-c-seguranca-dados-1',
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
    {
      id: 'n3-c-seguranca-dados-2',
      title: 'Bancos de dados e SQL em linguagem simples',
      min: 6,
      cenarioId: 'diagnostico-sql-readonly',
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
      id: 'n3-c-seguranca-dados-3',
      title: 'Auditoria somente leitura e evidência',
      min: 6,
      cenarioId: 'diagnostico-sql-readonly',
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
  'help-desk-n1': [
    {
      id: 'c-help-desk-n1-1',
      f: 'O que é um chamado (ticket)?',
      b: 'A ficha oficial de um pedido de ajuda no ITSM: quem pediu, o que aconteceu, quando e o que foi feito.',
    },
    {
      id: 'c-help-desk-n1-2',
      f: 'Como se calcula a prioridade de um chamado?',
      b: 'Urgência (quanta pressa) somada ao Impacto (quantas pessoas pararam) gera a Prioridade (P1 a P4), que define o prazo SLA.',
    },
    {
      id: 'c-help-desk-n1-4',
      f: 'Por que confirmar a identidade antes de resetar uma senha?',
      b: 'Porque o reset dá acesso à conta. Sem confirmar matrícula e ramal da titular, o suporte pode entregar a conta a um golpista.',
    },
    {
      id: 'c-help-desk-n1-5',
      f: 'O gestor pede o reset da senha de outra pessoa. Como confirmar a identidade?',
      b: 'Ligando para a titular pelo ramal do diretório da empresa, nunca por um número passado por quem pede.',
    },
    {
      id: 'c-help-desk-n1-6',
      f: 'O que é uma senha temporária com troca obrigatória?',
      b: 'Uma senha provisória definida pelo suporte. No primeiro acesso a pessoa escolhe a definitiva, que o suporte nunca conhece.',
    },
    {
      id: 'c-help-desk-n1-7',
      f: 'A conta bloqueou de novo logo depois do desbloqueio. O que faltou?',
      b: 'Achar a origem das tentativas erradas nos eventos de segurança antes de desbloquear.',
    },
    {
      id: 'c-help-desk-n1-8',
      f: 'Senha expirada pede reset?',
      b: 'Não. A pessoa troca a senha pelo autoatendimento. O reset seria uma ação desnecessária, registrada na trilha do atendimento.',
    },
  ],
  'service-desk-n1-jr': [
    {
      id: 'c-service-desk-n1-jr-1',
      f: 'O que o DNS faz?',
      b: 'Traduz nomes (AURORA-SRV01) em endereços IP — é a agenda de contatos da rede.',
    },
    {
      id: 'c-service-desk-n1-jr-2',
      f: 'Só uma pessoa recebe "acesso negado" numa pasta. Primeiro suspeito?',
      b: 'Grupo ou permissão no Active Directory: ela pode ter perdido o vínculo com o grupo correto.',
    },
    {
      id: 'c-service-desk-n1-jr-3',
      f: 'Qual a regra de ouro do acesso remoto?',
      b: 'Autorização antes de conectar e diagnóstico antes de corrigir, com o menor privilégio necessário.',
    },
  ],
  'n2-pleno': [
    {
      id: 'c-n2-pleno-1',
      f: 'Qual a diferença entre incidente e problema?',
      b: 'Incidente é a interrupção sentida pelo usuário; problema é a causa raiz por trás de vários incidentes.',
    },
    {
      id: 'c-n2-pleno-2',
      f: 'Onde procurar a causa num log?',
      b: 'Perto do horário em que o problema começou: a primeira mensagem de erro costuma apontar a causa.',
    },
  ],
  'n3-a-redes-nuvem': [
    {
      id: 'c-n3-a-redes-nuvem-1',
      f: 'O que é um pod no Kubernetes?',
      b: 'A menor unidade que roda um ou mais containers — como uma marmita com o serviço dentro.',
    },
    {
      id: 'c-n3-a-redes-nuvem-2',
      f: 'O que significa OOMKilled?',
      b: 'O processo passou do limite de memória e foi encerrado automaticamente.',
    },
  ],
  'n3-b-data-center-backup': [
    {
      id: 'c-n3-b-data-center-backup-1',
      f: 'O que o log de um job de backup mostra?',
      b: 'O motivo da falha, como repositório cheio. É a primeira leitura, antes de qualquer correção.',
    },
    {
      id: 'c-n3-b-data-center-backup-2',
      f: 'Repositório cheio: posso apagar pontos de restauração para ganhar espaço?',
      b: 'Não. Isso compromete a retenção. A correção é ampliar a capacidade, com privilégio elevado, e rodar o job de novo.',
    },
    {
      id: 'c-n3-b-data-center-backup-3',
      f: 'O que é uma cópia imutável?',
      b: 'Uma cópia que não pode ser alterada nem apagada durante a retenção. É a última linha de defesa dos dados.',
    },
    {
      id: 'c-n3-b-data-center-backup-4',
      f: 'Por que verificar a cadeia antes de restaurar?',
      b: 'Cada ponto da cadeia incremental depende do anterior. Um ponto inválido compromete os seguintes.',
    },
  ],
  'n3-c-seguranca-dados': [
    {
      id: 'c-n3-c-seguranca-dados-1',
      f: 'Quais sinais indicam engenharia social?',
      b: 'Pressa extrema, apelo à autoridade ("sou diretor") e pedido para pular a verificação (sem token).',
    },
    {
      id: 'c-n3-c-seguranca-dados-2',
      f: 'Qual comando SQL apenas lê dados?',
      b: 'SELECT. UPDATE e DELETE alteram dados e não são usados em auditoria.',
    },
    {
      id: 'c-n3-c-seguranca-dados-3',
      f: 'O que entregar ao fim de uma auditoria?',
      b: 'Evidência clara e reproduzível (consulta e resultado), sem alterar nenhum dado.',
    },
  ],
}

export const CONCEPTS: ConceitoFeynman[] = [
  { level: 'help-desk-n1', name: 'Chamado e ITSM' },
  { level: 'help-desk-n1', name: 'Prioridade e SLA' },
  { level: 'help-desk-n1', name: 'Verificação de identidade' },
  { level: 'help-desk-n1', name: 'Reset e desbloqueio de conta' },
  { level: 'service-desk-n1-jr', name: 'DNS' },
  { level: 'service-desk-n1-jr', name: 'Grupos do Active Directory' },
  { level: 'service-desk-n1-jr', name: 'Acesso remoto seguro' },
  { level: 'n2-pleno', name: 'Incidente versus Problema' },
  { level: 'n2-pleno', name: 'Logs' },
  { level: 'n3-a-redes-nuvem', name: 'Containers e Kubernetes' },
  { level: 'n3-a-redes-nuvem', name: 'OOMKilled' },
  { level: 'n3-b-data-center-backup', name: 'Log do job de backup' },
  { level: 'n3-b-data-center-backup', name: 'Cópia imutável e restore' },
  { level: 'n3-c-seguranca-dados', name: 'Engenharia social' },
  { level: 'n3-c-seguranca-dados', name: 'SQL somente leitura' },
]

export const STAR_PREFILLS: Record<NivelId, PitchStar> = {
  'help-desk-n1': {
    s: 'No laboratório de Help Desk N1, a Fernanda Lima, da Aurora Logística, não conseguia entrar na conta no dia do fechamento fiscal.',
    t: 'Eu precisava devolver o acesso sem entregar a conta a quem não fosse a titular.',
    a: 'Eu li o estado da conta no console, confirmei a identidade pela matrícula e pelo ramal do diretório, escolhi a menor ação que resolvia o sintoma e escrevi uma nota pública sem expor a senha.',
    r: 'O acesso voltou em cerca de 10 minutos, sem ação desnecessária registrada, e o chamado ficou documentado para auditoria.',
  },
  'service-desk-n1-jr': {
    s: 'No laboratório do Service Desk N1 Jr, a analista do Financeiro não conseguia abrir a pasta de rede no dia do fechamento fiscal.',
    t: 'Eu precisava restabelecer o acesso antes do prazo SLA sem causar novos problemas.',
    a: 'Eu confirmei a identidade dela com matrícula e ramal, conectei com autorização no SimuDesk, testei DNS, grupos do AD e serviços e identifiquei a causa raiz antes de aplicar a correção.',
    r: 'A pasta voltou em cerca de 15 minutos, dentro do SLA, e documentei a causa raiz e a validação no chamado.',
  },
  'n2-pleno': {
    s: 'No laboratório N2 Pleno, três setores ficaram sem ERP após uma atualização noturna.',
    t: 'Eu precisava restaurar a operação e encontrar a causa comum sem encerrar chamados às escuras.',
    a: 'Eu agrupei os chamados num Problema ITIL, confirmei a autorização, li os logs do horário da falha, elevei privilégio e restaurei o serviço AuroraGateway com validação.',
    r: 'Os três setores voltaram a operar em menos de 20 minutos e a causa raiz ficou registrada para a equipe de mudanças.',
  },
  'n3-a-redes-nuvem': {
    s: 'No laboratório N3-A de Redes e Nuvem, a API de rastreamento ficou degradada e com falhas em produção.',
    t: 'Eu precisava mitigar sem ações destrutivas e entender a causa.',
    a: 'Eu inspecionei os pods e logs no cluster Kubernetes simulado, identifiquei o motivo raiz no evento do sistema, elevei privilégio e apliquei mitigação segura.',
    r: 'A disponibilidade do cluster voltou para Healthy (HTTP 200) sem perda de dados e documentei o post-mortem.',
  },
  'n3-b-data-center-backup': {
    s: 'No laboratório N3-B de Data Center e Backup, o job de backup da pasta Financeiro falhou na madrugada e a equipe ficou sem cópia recente.',
    t: 'Eu precisava restabelecer o backup sem comprometer a retenção nem sobrescrever dados íntegros.',
    a: 'Eu li o log do job, comparei o repositório e a cadeia de cópias, ampliei a capacidade com privilégio elevado, executei o job de novo e confirmei o resultado com o dono da pasta.',
    r: 'O backup voltou a concluir em menos de 30 minutos, nenhum ponto de restauração foi apagado e o chamado foi resolvido com nota pública.',
  },
  'n3-c-seguranca-dados': {
    s: 'No laboratório N3-C de Segurança e Dados, chegou um pedido urgente de troca de senha de alguém que dizia ser diretor, sem token.',
    t: 'Eu precisava atender rápido sem colocar a conta e a empresa em risco.',
    a: 'Eu assumi o chamado, consultei a política KB-001, solicitei matrícula e token corporativo no chat e, como não havia token válido, recusei a troca com educação e registrei nota interna.',
    r: 'A conta ficou protegida, a tentativa de golpe foi documentada em menos de 10 minutos e minha avaliação 360º atingiu 100% nos critérios de segurança.',
  },
}

export const AI_KB: { k: string[]; a: string }[] = [
  {
    k: ['dns'],
    a: 'DNS é a agenda de contatos da rede: você digita um nome (AURORA-SRV01) e ele devolve o número (IP) do computador. Se o DNS aponta para o número errado, parece que o sistema caiu — mas ele só está discando errado.\nAula recomendada: Service Desk N1 Jr, Rede, IP e DNS.',
  },
  {
    k: ['sla', 'prioridade', 'urgência', 'urgencia', 'impacto'],
    a: 'Prioridade combina Urgência (pressa) com Impacto (quantas pessoas pararam). Exemplo: faturamento parado para a empresa toda no fechamento gera prioridade P1. Cada prioridade tem um prazo combinado, o SLA.\nAula recomendada: Help Desk N1, Prioridade.',
  },
  {
    k: ['token', 'engenharia', 'golpe', 'phishing'],
    a: 'Engenharia social é convencer pessoas a quebrar regras usando pressa, autoridade ou simpatia. Sinais: urgência extrema, "sou diretor", pedido para pular a verificação. Resposta profissional: seguir a política KB-001, pedir token e matrícula, recusar com educação e registrar nota interna.\nAula recomendada: N3-C Segurança e Dados, Engenharia social: o golpe que não usa vírus.',
  },
  {
    k: ['senha', 'reset', 'desbloque', 'bloquead', 'expirad', 'identidade'],
    a: 'Antes de resetar ou desbloquear, confirme a identidade da titular: matrícula, ramal e, se o pedido veio de outra pessoa, contato pelo ramal do diretório. Depois escolha a menor ação: senha esquecida pede reset com senha temporária e troca obrigatória; conta bloqueada pede achar a origem das tentativas antes de desbloquear; senha expirada pede orientar a troca pelo autoatendimento.\nAula recomendada: Help Desk N1, Verificar a identidade antes de agir.',
  },
  {
    k: ['backup', 'restore', 'restaur', 'repositório', 'repositorio', 'imutável', 'imutavel'],
    a: 'Quando um job de backup falha, leia o log do job antes de mexer: ele diz o motivo, como repositório cheio. Compare com o estado do repositório e da cadeia de cópias, corrija com privilégio elevado e rode o job de novo. Nunca apague pontos de restauração para ganhar espaço e nunca restaure sobre dados íntegros.\nAula recomendada: N3-B Data Center e Backup, Backup falhou: leia o log do job antes de mexer.',
  },
  {
    k: ['ad', 'active directory', 'grupo', 'permiss'],
    a: 'O Active Directory é a portaria da empresa: lista quem trabalha ali e quais portas cada crachá abre. Permissões são dadas a grupos; quem sai do grupo recebe acesso negado.\nAula recomendada: Service Desk N1 Jr, Usuários, grupos e permissões.',
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
    a: 'SQL é a forma de fazer perguntas a um banco de dados. SELECT só lê; UPDATE e DELETE alteram — por isso a auditoria usa apenas leitura e documenta a evidência.\nAula recomendada: N3-C Segurança e Dados, Bancos de dados e SQL em linguagem simples.',
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
      { t: 'Concluir as aulas do Help Desk N1', done: false },
      { t: 'Revisar flashcards (5 min por dia)', done: false },
      { t: 'Fazer a missão de reset de senha e desbloqueio (Help Desk N1)', done: false },
      { t: 'Explicar a verificação de identidade com a Técnica de Feynman', done: false },
      { t: 'Montar meu primeiro Pitch STAR', done: false },
    ],
  },
  {
    id: 'pg-help-desk-n1',
    icon: 'nivel-help-desk-n1',
    title: 'Help Desk N1: Chamados, prioridade e identidade',
    level: 'help-desk-n1',
    type: 'cornell',
    cues: 'O que é um chamado?\nComo calcular a prioridade?\nPor que confirmar a identidade antes de agir?',
    notes:
      '• Todo pedido vira chamado no ITSM — é a memória oficial do suporte.\n• Prioridade = urgência (pressa) somada ao impacto (quantas pessoas).\n• Antes de resetar ou desbloquear, confirmar quem é a titular. Escolher a menor ação que resolve (KB-027).',
    summary: 'O suporte trabalha com registro, prioridade e verificação. Identidade vale para todos, inclusive gestores.',
  },
  {
    id: 'pg-service-desk-n1-jr',
    icon: 'nivel-service-desk-n1-jr',
    title: 'Service Desk N1 Jr: Redes, DNS e acesso remoto',
    level: 'service-desk-n1-jr',
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
    termo: 'Revisão (Replay)',
    definicao: 'Gravação passo a passo da sua missão mostrando o que o Juiz 360º avaliou e por quê.',
  },
  {
    termo: 'Semente e Chaos Injector',
    definicao: 'Número opcional que sorteia qual defeito real aconteceu nos bastidores para evitar resposta decorada.',
  },
]

/** Roteiro da Missão 0: o que fazer dentro do chamado depois que ele estiver aberto. */
export const ETAPAS_MISSAO_ZERO = [
  {
    titulo: 'Leia o chamado no ITSM',
    texto: 'Clique em Assumir chamado e confira quem pediu ajuda e qual é a urgência (SLA).',
  },
  {
    titulo: 'Valide identidade no Chat',
    texto: 'Antes de mexer no computador ou resetar senha, confirme matrícula e ramal com segurança.',
  },
  {
    titulo: 'Investigue antes de alterar',
    texto: 'Use o SimuDesk para observar pistas reais antes de trocar qualquer configuração.',
  },
  {
    titulo: 'Registre nota e veja a Revisão',
    texto: 'Documente o que fez em linguagem clara e abra o Replay para conferir acertos e melhorias.',
  },
]

/** Chave do estado da Academia no navegador. A versão 4 usa os ids de nível do Catálogo de Rotas. */
export const CHAVE_ARMAZENAMENTO_ACADEMIA = 'itfs_academia_v4'

function ehNivelId(valor: unknown): valor is NivelId {
  return LEVELS.some((nivel) => nivel.id === valor)
}

export function criarEstadoInicialAcademia(): EstadoAcademia {
  return {
    xp: 0,
    streak: 1,
    weekMin: 0,
    weekGoal: 90,
    focus: LEVELS[0].id,
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
  '\u{1F392}': 'nivel-help-desk-n1',
  '\u{1F3A7}': 'nivel-service-desk-n1-jr',
  '\u{1F9E9}': 'nivel-n2-pleno',
  '\u2601\uFE0F': 'nivel-n3-a-redes-nuvem',
  '\u{1F3C5}': 'nivel-n3-c-seguranca-dados',
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
    const raw = window.localStorage.getItem(CHAVE_ARMAZENAMENTO_ACADEMIA)
    if (!raw) return criarEstadoInicialAcademia()
    const parsed = JSON.parse(raw) as Partial<EstadoAcademia>
    const base = criarEstadoInicialAcademia()
    return {
      ...base,
      ...parsed,
      focus: ehNivelId(parsed.focus) ? parsed.focus : base.focus,
      pages:
        Array.isArray(parsed.pages) && parsed.pages.length > 0
          ? parsed.pages.map((pagina) => ({ ...pagina, icon: normalizarIconePagina(pagina.icon) }))
          : base.pages,
      lessonsDone: Array.isArray(parsed.lessonsDone) ? parsed.lessonsDone : base.lessonsDone,
      pitches: Array.isArray(parsed.pitches) ? parsed.pitches : base.pitches,
      feynman: Array.isArray(parsed.feynman) ? parsed.feynman.filter(ehNivelId) : base.feynman,
      labsDone: Array.isArray(parsed.labsDone)
        ? parsed.labsDone.filter((id): id is IdMissao => typeof id === 'string' && ehIdMissao(id))
        : base.labsDone,
      cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : base.cards,
    }
  } catch {
    return criarEstadoInicialAcademia()
  }
}

export function salvarEstadoAcademia(estado: EstadoAcademia) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO_ACADEMIA, JSON.stringify(estado))
  } catch {
    // ignore storage quota errors
  }
}

/** Título da Missão no Catálogo de Rotas. Identificador desconhecido devolve o próprio id. */
function textosDoCenario(cenarioId: string): { titulo: string } {
  return { titulo: etapaDaMissao(cenarioId)?.missao.titulo ?? cenarioId }
}

export function nivelPorId(id: NivelId): NivelEducacional {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}

/**
 * Nível de estudo que contém o cenário. Toda Missão do Catálogo de Rotas tem nível; só um identificador
 * desconhecido devolve null, e quem chama não deve assumir o primeiro módulo.
 */
export function nivelPorCenarioId(cenarioId: string): NivelEducacional | null {
  return LEVELS.find((l) => l.cenarioIds.some((id) => id === cenarioId)) ?? null
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
  const missoes = nivelPorId(id).cenarioIds
  const p = Math.round((missoes.filter((missao) => estado.labsDone.includes(missao)).length / missoes.length) * 100)
  return { t, f, p }
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
      const cenarioId = L.cenarioIds.find((missao) => !estado.labsDone.includes(missao)) ?? L.cenarioId
      return {
        phase: 'practice' as const,
        level: L.id,
        cenarioId,
        title: `Laboratório: ${textosDoCenario(cenarioId).titulo}`,
        meta: `Prática guiada na Mesa de Trabalho, ${L.nome}, cerca de 15 min`,
        act: 'lab' as const,
        cta: 'Entrar no laboratório',
      }
    }
  }
  return {
    phase: 'mastery' as const,
    level: LEVELS[LEVELS.length - 1].id,
    title: `Jornada completa! Você dominou os ${LEVELS.length} níveis do MVP.`,
    meta: 'Exporte e valide seu Currículo Vivo (ECDSA P-256)',
    act: 'cv' as const,
    cta: 'Abrir Currículo Vivo',
  }
}

export function obterPatente(estado: EstadoAcademia): string {
  let patente = 'Cadete (iniciante)'
  for (const L of LEVELS) {
    if (calcularProgressoNivel(estado, L.id).p === 100) patente = L.nome
  }
  return patente
}

export function responderMentor(raw: string): string {
  const t = raw.toLowerCase()
  for (const item of AI_KB) {
    if (item.k.some((k) => (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(t) : t.includes(k)))) return item.a
  }
  return 'Essa pergunta está fora da base desta trilha. O Mentor responde sobre chamados, prioridade e SLA, reset e desbloqueio de conta, engenharia social, DNS, Active Directory, logs, Kubernetes, backup e restore, SQL, técnicas de estudo e entrevistas.'
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
