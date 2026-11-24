# 01. Diagnóstico anti-cara de IA e benchmark

## Parecer

O produto já tem uma ideia própria: uma jornada de suporte que começa no chamado, exige validação de identidade, coleta evidências, aplica uma ação simulada e termina em replay auditável. A interface não deixa essa ideia liderar. O painel tenta mostrar academia, gamificação, timer, currículo, progresso, trilha, glossário e laboratórios no mesmo fluxo. O resultado parece um template de dashboard educacional ao qual foram adicionadas ferramentas corporativas.

O risco maior não é uma cor isolada. É a repetição de recursos sem hierarquia: cards com o mesmo peso, pills para metadados, emojis para identidade, títulos e descrições que explicam muitas vezes a mesma coisa. A faixa colorida de quatro etapas no topo promete um sistema de fases que não tem relação clara com a navegação. A tela principal parece feita de blocos independentes, embora os cenários sejam uma sequência operacional.

## Evidências e limites

- Examinei os screenshots fornecidos: Painel 1440, Aulas 1440, Mentor 1440, Painel 375 e a referência crítica do protótipo. Os achados visuais abaixo se referem a essas imagens, não a estados que elas não mostram.
- `http://127.0.0.1:4180` respondeu HTTP 200 e entregou HTML. Não consegui capturar uma nova imagem renderizada: o navegador integrado não estava disponível nesta sessão. A referência visual fornecida mostra a página do protótipo em desktop.
- A URL pública respondeu HTTP 200 e entregou o shell HTML do Vite com bundles. Sem navegador disponível, não confirmei hidratação, chamadas à API, erros no console, comportamento das rotas ou aparência atual em desktop e celular. Os screenshots de “live” são evidência fornecida, não captura desta sessão.
- Não foi possível abrir Painel, Aulas, Caderno, Mentor, ITSM, Chat, SimuDesk, Intranet e Replay interativamente. Avaliei a estrutura dessas telas no código. Contraste e conformidade WCAG não foram medidos por ferramenta; precisam de validação automatizada e manual.

## O que parece gerado por IA

| Padrão observado | Local e evidência | Por que enfraquece o produto | Direção de correção |
|---|---|---|---|
| Emojis ocupam o lugar de ícones de navegação e estado | `BarraSuperior.tsx:38,53–105`; `TelaInicial.tsx:218,242–250,359,371,541`; `AulasView.tsx:168,199,285,331,433,449`; `CadernoView.tsx:91,212`; `MentorView.tsx:174,225,280`; `App.tsx:415,423,542,575`. | Forma, cor e alinhamento variam por sistema operacional. A sequência de robô, livro, mochila, fogo e medalha dá tom de painel genérico gamificado, sem linguagem vetorial consistente. | Adotar uma única família SVG com traço 1.75 px, caixa 20 px e nome acessível quando necessário. Reservar símbolos de marca a uma peça proprietária, não a cada controle. Mapear os ícones por função no arquivo 03. |
| Faixa de quatro cores atravessa a navegação | `index.css:177–184`, regra `.topnav::after`. | Repete as cores de Teoria, Fixação, Prática e Domínio como decoração global. Não informa estado, localização ou progresso. | Remover a faixa. Mostrar progresso do ciclo no conteúdo da trilha, junto da etapa correspondente. |
| Cards e contornos têm peso parecido | `index.css:154,266,284–300,407–409`; `.card`, `.chip`, `.cycle-step`, `.card-section`. | A mesma borda, sombra e raio agrupam informação de naturezas diferentes. O olho não sabe qual superfície é a tarefa principal. | Usar linhas e espaço para listas e divisões; deixar superfície preenchida para a missão ativa, editor ou alerta. Reservar sombra para popover e drawer. |
| Chips coloridas para conteúdo que poderia ser texto | `BarraSuperior.tsx:50–107`, `AulasView.tsx:168,285–290`, `TelaInicial.tsx:287–292,444–474`; no screenshot aparecem etapa, nível, foco, status e tipo como chips. | Muitos elementos curtos competem com títulos e ações. A cor passa a significar simultaneamente categoria, progresso, prioridade e decoração. | Tornar metadados em texto secundário. Manter badge só para estado operacional curto, com rótulo e cor semântica estável. |
| Tipografia pesada e muito texto introdutório | Screenshot do painel; `index.css:4,266`; `TelaInicial.tsx:218–219,495–510,694–706`. `BarraSuperior.tsx:41` mantém subtítulo da marca em todas as telas. | Cabeçalho, título, card e botão disputam a primeira leitura. A proposta do produto fica enterrada sob sua própria explicação. | Uma manchete por tela, uma frase de contexto e uma ação principal. Usar peso 600 para títulos, 400 para texto corrido e limitar explicações ao ponto em que o aluno precisa agir. |
| Sinalização em caixa alta e rótulos pequenos acima de todo título | `index.css:266`, `.eyebrow`; screenshots mostram “CONTINUE DE ONDE PAROU”, “EXPLICAR” e “PONTOS-CHAVE”. | O rótulo decorativo vira ruído. É um padrão recorrente em layouts gerados de SaaS. | Usar rótulo apenas quando ele informa módulo, etapa ou contexto que o título sozinho não dá. Sentence case e sem tracking decorativo. |
| Metadados unidos por ponto médio | `App.tsx:406–408,437–441`; `TelaInicial.tsx:218,541,614`; `ReplayView.tsx:137`. | Strings densas parecem preenchimento de template e ficam difíceis de escanear em celular. | Separar metadados em colunas nomeadas ou em linhas curtas. Usar o separador apenas em texto corrido inevitável. |
| Paleta de fase usada em vários papéis | `index.css:25–50,154,184,297,324,363–378`; tokens `--theory`, `--fix`, `--practice`, `--mastery`. | Azul, roxo, laranja e verde viram quatro cores de marca sem distinção clara de estado e prioridade. | Uma cor de ação, neutros e semânticas de sucesso, aviso e erro. Usar cores do ciclo só em uma visualização de progresso que tenha legenda. |
| Métricas e mecânicas de streak competem com tarefa | `TelaInicial.tsx:527–557` e screenshots do painel mostram meta, Pomodoro, streak, revisões e XP no primeiro viewport. | O produto parece tentar aumentar engajamento com widgets em vez de ajudar a escolher uma missão. | No primeiro viewport, exibir retomada, próxima missão e três passos da jornada. Mover timer e XP para utilidades secundárias ou deixar o aluno ocultá-los. |
| “Mentor IA” passa uma promessa que o comportamento atual não cumpre | `MentorView.tsx:24,174,225,280`; `App.tsx:130–140` chama `responderMentor`. O screenshot mostra conversa vazia com sugestões extensas. | O aluno não sabe se está usando um modelo generativo ou um tutor limitado. A transparência do custo não corrige a expectativa criada pelo nome. | Renomear para “Tutor de estudo” e dizer “Respostas guiadas pelos conteúdos da trilha”. Se IA real for adicionada, explicar o que ela faz, o que envia e quais dados ficam no navegador. |
| A mesma marca “Aurora” e os disclaimers ocupam espaço de navegação | `TelaInicial.tsx:218,494–510`; screenshot mostra subtítulo da academia, eyebrow do painel e textos sobre dados sintéticos e login no topo. | Transparência é essencial, mas repetida em linha de marca, eyebrow e corpo perde força e ocupa o topo. | Manter um selo simples “Dados fictícios” junto ao contexto do cenário. Explicar privacidade no primeiro acesso e em ajuda, sem repetir em cada tela. |
| O aluno vê duas arquiteturas concorrentes | `TelaInicial.tsx:215–220,239–270`; `App.tsx:404–453,510–530`. | “Laboratório” parece outro produto. As notas e o tutor entram como drawers diferentes, fora da sequência da aula. | Um shell global persistente. Ao iniciar a missão, manter a lição e checklist em um painel lateral, e trocar apenas a ferramenta ativa no painel de trabalho. |
| Erros e estados vazios não têm linguagem de tarefa consistente | `ReplayView.tsx:23–35` mostra “Nenhum replay carregado” e botão “Carregar Replay e Avaliação”; `IntranetApp.tsx:59–77` mostra contagem e artigos. | A tela não diz quando o estado é esperado, o que falta ou qual é o próximo passo. | Estados vazios com condição e ação: “Seu turno ainda não tem eventos. Resolva o primeiro chamado para montar o Replay.” Erro deve nomear tentativa, causa conhecida e recuperação. |

## Leitura tela a tela

### Painel

No screenshot 1440, o aluno encontra topo escuro, segunda faixa de foco e legenda, chamada de retomada, cinco cenários com três barras cada, além de widgets de timer, meta, plano e carreira. Cada módulo tem botões próprios. A frase “Do zero ao especialista” e as cinco trilhas levam mais espaço que a decisão imediata. Remover tudo abaixo da primeira missão do primeiro viewport. Organizar a home em “Retomar turno”, “Próxima missão” e “Todas as missões”. A trilha pode ser lista de linhas, sem um cartão por nível.

No screenshot 375, o cabeçalho ocupa aproximadamente 30% da altura antes de o conteúdo principal aparecer. A marca, cinco itens de navegação, ações XP e tema, currículo, seleção de nível e legenda se acumulam. A ação primária de estudo fica abaixo da dobra. Em celular, usar topo compacto com menu e uma barra de navegação inferior com até quatro destinos; mover seleção de nível para filtro dentro de Trilhas.

### Aulas

O screenshot 1440 tem boa separação entre sumário, leitura e caderno, mas três colunas começam com peso semelhante. A aula fica em uma coluna central com analogia, explicação, diagrama, pontos-chave e caderno aberto na lateral. O painel de notas mostra caixas de texto grandes antes de ser necessário escrever. A aula deve dominar a largura; o sumário pode recolher e as notas ficam em uma aba ou drawer. A largura do corpo de leitura deve ficar entre 65 e 72 caracteres. Em celular, preservar a ordem aula, atividade, notas; nunca reduzir três colunas lado a lado.

### Caderno

`CadernoView.tsx` mantém conteúdo de método Cornell, páginas, metas e exemplos. O valor pedagógico está no vínculo com a aula. A interface deve abrir a nota do ponto estudado, mostrar o momento de criação e oferecer retorno ao módulo. Não transformar cada página em cartão independente; usar índice à esquerda, editor no centro e metadados discretos.

### Mentor

No screenshot 1440, há uma grande caixa vazia à esquerda e muitas sugestões, instruções e uma declaração técnica à direita. A conversa não ancora o que o aluno está estudando. Fixar o contexto da lição, limitar três sugestões à dúvida atual e colocar “Tutor de estudo” como apoio da aula. Feynman e Pitch são exercícios diferentes, não abas equivalentes de um chat.

### Workstation e ferramentas

O código faz o dock de aplicativos e a missão serem regiões separadas. A faixa de missão mostra uma instrução em texto corrido, mas não lista passos ou critérios da atividade. ITSM usa uma lista de chamados e um painel amplo de detalhe; a base é boa, mas o SLA aparece como minuto absoluto e não como tempo restante calculado. Chat mistura troca com cliente, validação e ajuda do Tech Lead na mesma grade. SimuDesk já diferencia cluster SRE de painel SQL e terminal, mas a ação não tem contexto de evidência junto ao controle. Intranet tem busca e expansão de artigo, sem índice ou procedimento acionável. Preservar os contratos `onAcao`, `onChat` e os modelos de sessão.

### Revisão e Replay

`ReplayView.tsx` já permite selecionar eventos e mostrar payload. Essa é uma base real, não uma ilustração de telemetria. Dar hierarquia ao resumo por critério, ao trilho de eventos e ao detalhe do evento. O payload bruto vai para “Dados do evento”. Comparação de prática esperada só pode ser mostrada quando o avaliador já fornecer esse critério. O currículo é evidência assinada, não um selo decorativo: mostrar emissor, competência, data, algoritmo, impressão digital abreviada e ação de verificar JSON.

## Benchmark e decisões

| Referência observada | O que copiar estruturalmente | Adaptar ao simulador gratuito | Evitar |
|---|---|---|---|
| AWS Skill Builder e Cloudscape | Planos agrupam cursos e laboratórios por papel ou domínio. Cloudscape define App layout com navegação lateral recolhível, drawer, painel dividido e tabela com filtro, seleção e estados vazios. | Uma trilha sequencial curta, exercícios com tempo estimado e cenário sintético. Reaproveitar os padrões, sem impor a biblioteca Cloudscape inteira ao produto. | Quest ou gamificação como requisito pago; misturar painéis e superfícies sem critério. AWS diferencia cursos gratuitos de experiências imersivas por assinatura. |
| Microsoft Learn | Unidade curta dentro de módulo e trilha maior; progresso por unidade. A página oficial documenta conteúdo e sandbox lado a lado. | Manter guia da missão ao lado da ferramenta. Cada etapa conclui por ação verificável. | Copiar dependência do Azure Sandbox: a FAQ oficial informa que os sandboxes foram descontinuados. Copiar a estrutura didática, não o serviço. |
| Udemy | Player deixa currículo, notas, recursos e perguntas e respostas acessíveis no contexto do curso. O suporte oficial descreve esses controles no topo do player. | A lição atual permanece aberta ao iniciar o laboratório; notas e artigo KB são painéis contextuais. Persistir módulo e unidade localmente. | Copiar assistente IA, recursos de curso pagos ou um player de vídeo sem mídia real. |
| TryHackMe e HTB Academy | Tarefa é composta de blocos e perguntas, com máquina ou alvo de prática associado. HTB descreve seções, exercícios, checkpoints e workstation embutida em módulos interativos. | Checklist à esquerda e laboratório simulado à direita; cada check deve corresponder a uma ação de domínio observável. | Terminal que finge ser um sistema operacional sem informar comandos suportados. Não expor credenciais ou infraestrutura real. |
| Linear e Jira Service Management | Inbox separa prioridade de outras notificações e oferece busca por campos. Jira agrupa solicitações em filas e torna SLA critério de ordenação. Vercel organiza logs em eventos pesquisáveis, filtros e detalhe contextual. | Fila compacta, painel de chamado e trilho de eventos. Timer de SLA só quando houver regra de relógio definida pelo motor. | Copiar estética escura do Linear ou densidade de produto empresarial inteira. O público iniciante precisa de nomes explícitos e orientação contextual. |

Fontes verificadas em 15 de novembro de 2026:

- [AWS Skill Builder: treinamento digital](https://aws.amazon.com/training/digital/)
- [AWS: perguntas sobre treinamento e planos](https://aws.amazon.com/training/faqs/)
- [Cloudscape: App layout](https://cloudscape.design/components/app-layout/)
- [Cloudscape: Table](https://cloudscape.design/components/table/)
- [Microsoft Learn: tipos de conteúdo e unidades](https://learn.microsoft.com/en-us/training/support/learn-content-types)
- [Microsoft Learn: FAQ de sandbox](https://learn.microsoft.com/en-us/training/support/faq?pivots=sandbox)
- [Udemy: Course player](https://support.udemy.com/hc/en-us/sections/206457187-Course-player)
- [TryHackMe: Rooms](https://help.tryhackme.com/en/articles/6611837-rooms)
- [HTB Academy: FAQ](https://academy.hackthebox.com/faq)
- [Linear: Inbox](https://linear.app/docs/inbox)
- [Atlassian: Jira Service Management queues](https://support.atlassian.com/jira-service-management-cloud/docs/what-are-queues/)
- [Vercel: Runtime Logs](https://vercel.com/docs/logs/runtime)

As referências mostram padrões atuais, não medem resultado de produto. Adote estrutura e comportamento; não reproduza marca, paleta ou texto.
