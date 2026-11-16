# Diagnostico anti cara de IA e benchmark

## Veredito executivo

O produto ja tem um conceito forte: ensinar suporte de TI por meio de chamados, evidencia, simulacao e replay auditavel. A interface, porem, ainda comunica prototipo educacional montado por componentes genericos. O problema nao e falta de cor ou de funcionalidade. E falta de hierarquia, ritmo visual e uma linguagem propria de ferramenta operacional.

Na captura de referencia, a home e mais clara que a versao publicada, mas ainda parece uma pagina de cards de onboarding. Na versao publicada em 1440 px, a barra superior, a legenda de quatro cores, os chips, os paineis brancos e os emojis competem pela atencao. Em 375 px, a navegacao quebra em varias linhas antes de o conteudo principal comecar. Isso faz o primeiro voo parecer um painel responsivo improvisado, nao um produto que sabe qual e a proxima acao.

O caminho recomendado e reduzir elementos decorativos, preservar o tema de operacoes e tornar a jornada uma linha continua: escolher missao, estudar a unidade, executar o turno, revisar evidencias e emitir uma credencial.

## Evidencias observadas

| Tela ou fonte | Evidencia | Impacto |
|---|---|---|
| Painel 1440 | Header escuro alto, cinco links, quatro indicadores e legenda cromatica | A navegacao tem o mesmo peso visual que o trabalho |
| Painel 1440 | Muitos cards, barras, chips e botoes no mesmo viewport | O aluno nao identifica uma acao principal |
| Aulas 1440 | Tres colunas funcionais corretas, mas notas e conteudo parecem paineis equivalentes | A leitura perde foco e a anotacao parece um segundo produto |
| Mentor 1440 | Chat amplo e lista de sugestoes em pills | Comunica bot generico, nao mentor pedagogico deterministico |
| Painel 375 | Header ocupa quase metade da primeira tela | O mobile e uma adaptacao tardia do desktop |
| Prototipo local | Estrutura mais coerente, com tokens e split de laboratorio | Boa base para evoluir, mas ainda usa emojis, gradiente arco iris e cards uniformes |
| Producao | HTML carrega bundle Vite e CSS estatico, sem evidencia de um sistema visual separado | A consistencia depende de regras espalhadas no CSS e nos componentes |

## Vicios de IA encontrados

| Vicio no codigo atual | Arquivo ou local | Por que empobrece o produto | Como o mercado resolve |
|---|---|---|---|
| Emoji como iconografia estrutural | `BarraSuperior.tsx`, `TelaInicial.tsx`, `AulasView.tsx`, `MentorView.tsx`, apps | Mistura estilos, depende da plataforma e tira seriedade de uma ferramenta tecnica | Icones SVG com familia unica, tamanho e peso constantes |
| Faixa arco iris permanente | `index.css`, seletor `.topnav::after` | Parece ornamento automatico e nao informa estado | Uma unica cor de produto, com cores semanticas usadas apenas quando necessario |
| Tudo vira card arredondado | `index.css`, classes `.edu-card`, `.panel`, `.card` | Sem contraste de superficie, a pagina vira uma grade de caixas | Linear e Cloudscape combinam superficie, divisor, tabela e painel contextual |
| Pills e badges em excesso | `index.css`, navegacao, trilha e aulas | Cada metadado vira ruido e reduz a importancia de estados reais | Badges discretas apenas para estado, prioridade, ambiente ou permissao |
| ALL CAPS e middle dot em metadados | Eyebrows, subtitulos, labels e strings de navegacao | Marca texto de template e aumenta a carga de leitura | Titulos em frase, labels curtas e separacao por espaco ou linha |
| Copy explicativa demais | Home, Mentor, cards de nivel | O produto fala sobre si em vez de orientar a proxima tarefa | Microsoft Learn usa unidade, objetivo, tempo e progresso sem discurso promocional |
| Cinco cores fortes no mesmo nivel | Tokens de teoria, fixacao, pratica e dominio | O aluno precisa decodificar uma legenda antes de agir | Uma cor de acao e estados semanticos controlados |
| Separacao artificial entre Academia e Workstation | `App.tsx`, `BarraSuperior.tsx`, `TelaInicial.tsx` | Estudar e praticar parecem produtos distintos | Curso e sandbox convivem no mesmo shell e preservam contexto |
| Mentor com aparencia de chat de IA | `MentorView.tsx` | Sugestoes em pills e avatar bot lembram demo de assistente | Interface de exercicio com pergunta, resposta, criterio e feedback |
| Operacao ainda em paineis genericos | `ItsmApp.tsx`, `SimuDeskApp.tsx`, `ReplayView.tsx` | Um service desk precisa de fila, SLA, detalhe e timeline, nao apenas cards | JSM, Linear e Datadog priorizam densidade, estados e rastreabilidade |
| Estado de carregamento pouco visivel | shell e chamadas de dados | Cold start parece falha ou tela vazia | Skeleton contextual, status de sessao e retry acionavel |

## Identidade visual proposta

Nome visual: **cockpit de suporte Aurora**. A referencia nao deve ser aviao decorativo. Deve ser a linguagem de uma equipe que recebe sinais, classifica risco, investiga e registra evidencias.

- Fundo editorial claro: cinza frio quase branco.
- Fundo operacional: azul grafite muito escuro.
- Acento de acao: azul Aurora, reservado a links, foco e botoes primarios.
- Laranja somente para intervencao, alerta ou pratica ativa.
- Verde somente para validacao concluida.
- Roxo somente para aprendizagem ativa, nunca como cor de toda a IA.
- Tipografia de interface: Inter ou Plus Jakarta Sans.
- Tipografia tecnica: IBM Plex Mono ou JetBrains Mono.
- Icones: lucide-react ou sprite SVG proprio, stroke 1.75, sem emoji.
- Forma: raio 6 para controles, 8 para paineis, 0 para tabelas e divisores. Pildoras apenas para filtros ou estados compactos.

## Benchmark e decisoes objetivas

### AWS Skill Builder e Cloudscape

**Adotar:** planos de aprendizagem com uma acao de retomada, cards de trilha com objetivo, duracao e estado, barra de progresso discreta, laboratorio tratado como ambiente separado e confiavel.

**Adaptar:** usar catalogo gratuito com cinco missoes e explicitar o proximo passo sem sugerir assinatura ou pontuacao vazia.

**Evitar:** copiar gamificacao, botoes ou nomenclatura AWS. O diferencial deve ser o trabalho de suporte Aurora.

### Microsoft Learn

**Adotar:** unidade curta, sumario lateral, largura de leitura entre 65 e 72 caracteres, progresso por unidade e acao de abrir sandbox junto da licao.

**Adaptar:** o checkpoint vira uma tarefa observavel do laboratorio, com evidencia que aparece no replay.

**Evitar:** transformar cada paragrafo em etapa ou esconder o objetivo da unidade.

### Udemy e Coursera

**Adotar:** course player persistente, curriculum colapsavel, retomada exata, notas e recursos associados ao contexto da licao.

**Adaptar:** notas Cornell ficam como painel lateral recolhivel e o mentor recebe apenas o conceito atual.

**Evitar:** barra de curso gigante, autoplay e excesso de abas concorrentes.

### TryHackMe e Hack The Box Academy

**Adotar:** split screen com roteiro a esquerda e bancada a direita, passo atual evidente, checks de conclusao e barra de sessao compacta.

**Adaptar:** a bancada pode ser um ITSM, Chat ou SimuDesk, sem exigir terminal real. O valor esta na ordem das decisoes e na evidencia.

**Evitar:** painel com muitas abas simultaneas, terminal decorativo e bloqueios sem explicar o motivo.

### Linear e Jira Service Management

**Adotar:** tipografia precisa, divisores suaves, listas densas, atalhos, filtros persistentes, detalhe contextual e timeline auditavel.

**Adaptar:** a fila de chamados precisa funcionar com poucos dados, mas deve parecer uma fila real: prioridade, SLA, solicitante, ultima atividade e proxima acao.

**Evitar:** copiar visual de Jira ou criar um clone de SaaS generico. Aurora precisa ter voz propria.

## Prioridade franca

1. Remover emojis estruturais, faixa arco iris e excesso de pills.
2. Construir um shell unico com rail lateral e contexto persistente.
3. Converter a Workstation em split screen real, com fila e detalhe.
4. Fazer o Replay ser o produto final da aprendizagem, nao uma pagina de resumo.
5. So depois ampliar gradientes, ilustracoes ou novas cores.

Fontes consultadas: Microsoft Learn content types, TryHackMe AttackBox e Windows Command Line, AWS Training and Certification, AWS Builder Center, Linear design refresh e capturas locais do produto.
