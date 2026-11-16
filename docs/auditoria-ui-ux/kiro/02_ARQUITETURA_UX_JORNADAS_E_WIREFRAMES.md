# 02. Arquitetura UX, jornadas e wireframes

## 1. Princípio de estrutura

O produto tem um único ciclo: **Aprender, Praticar, Revisar, Comprovar**. Hoje cada passo é uma "aba" e a Workstation é outro modo, com outra barra. A proposta é um shell único, sempre com a mesma navegação, em que o aluno percebe em que ponto do ciclo está.

Regra de ouro: **o aluno nunca perde de vista o objetivo da missão**. Na Workstation, o guia da missão fica fixo à esquerda.

## 2. Sitemap enxuto

```
/                       Missões (home, catálogo de trilhas e cenários)
/trilha/:nivel          Detalhe da trilha: aulas, laboratório, credencial do nível
/aula/:id               Player de aula (texto, analogia, quiz, anotações, abrir laboratório)
/lab/:cenario           Workstation em turno (split: guia + ferramentas)
  ?app=itsm|chat|simudesk|kb
/replay/:sessao         Caixa-Preta: linha do tempo, critérios, credencial
/caderno                Caderno (lista, editor Cornell)
/mentor                 Mentor IA (explicar, revisar, treinar)
/credencial             Currículo Vivo (verificador, exportar, compartilhar)
```

Observação técnica: hoje não existe roteador, a troca é por estado (`visaoAtual`). O custo de adotar `react-router` é pequeno, mas o mínimo para a banca é manter o estado atual e apenas trocar o shell. Ver arquivo 05.

### Navegação global (barra lateral, 56 px recolhida, 220 px expandida)

| Item | Ícone Lucide | Destino |
|---|---|---|
| Missões | `Compass` | Home |
| Aulas | `BookOpen` | Último módulo aberto |
| Laboratório | `Terminal` | Última sessão ou "Iniciar turno" |
| Caderno | `NotebookPen` | Caderno |
| Mentor | `MessagesSquare` | Mentor |
| Credencial | `BadgeCheck` | Currículo Vivo |

No rodapé da barra: tema (`Moon`/`Sun`), ajuda (`CircleHelp`), atalhos (`Command`). Streak e XP saem do topo; ficam em um bloco "Seu progresso" na Home e no menu de perfil.

Barra superior de contexto (40 px): breadcrumb à esquerda (por exemplo `Missões / Analista Jr / Pasta de rede inacessível`), busca `Ctrl+K` à direita, e na Workstation o relógio de turno.

### Mobile
Barra inferior fixa de 56 px com 5 ícones (Missões, Aulas, Laboratório, Caderno, Mentor). Credencial no menu de perfil.

## 3. Jornada do primeiro voo (0 a 30 segundos)

Hoje: título, rótulo de conformidade, banner, trilha de 5 níveis com 15 barras, anel de meta, Pomodoro, plano de estudos, "Missão 0" em quatro passos. O jurado vê 6 blocos sem saber o que clicar.

Proposta: um **único** gesto principal.

1. 0 a 5 s: cabeçalho de produto ("IT Flight Simulator") e uma frase de 14 palavras. Botão primário "Iniciar primeiro voo (8 min)".
2. 5 a 15 s: ao lado, um painel "O que você vai fazer" com três linhas (ler o chamado, confirmar identidade, registrar a decisão).
3. 15 a 30 s: abaixo, a trilha como lista simples. O restante (Pomodoro, plano de estudos) entra na área "Seu progresso" só depois do primeiro turno.

O "primeiro voo" é o cenário 1 (Triagem e defesa contra engenharia social) com o guia da Missão 0 já aberto no painel esquerdo da Workstation, sem passar por Aulas.

Para o vídeo de 3 minutos: abrir `/`, clicar "Iniciar primeiro voo", assumir chamado, recusar o reset, encerrar, abrir Replay, mostrar a credencial verificada. São 6 cliques.

## 4. Wireframes

### 4.1 Home / Catálogo de missões (1440 px)

```
+------+------------------------------------------------------------------------------+
| LOGO | Missões                                       [ Buscar  Ctrl+K ]   (Ana) (Sol)|
|      +------------------------------------------------------------------------------+
| Mis. |  Seu primeiro turno na Aurora Logística                                       |
| Aul. |  Atenda chamados reais simulados, aprenda com o Replay e gere sua credencial. |
| Lab. |                                                                               |
| Cad. |  [ Iniciar primeiro voo, 8 min ]   [ Ver como funciona ]                      |
| Men. |                                                                               |
| Cred.|  ----------------------------------------------------------------------------|
|      |  Trilha de suporte                                         Progresso 0 de 5   |
|      |                                                                               |
|      |  | # | Nível               | Cenário                           | Tempo | Estado||
|      |  |---+---------------------+-----------------------------------+-------+-------||
|      |  | 1 | Estagiário          | Triagem e defesa contra engenharia| 15 min| Começar||
|      |  |   |                     | social                            |       |        ||
|      |  | 2 | Analista Jr (N1)    | Pasta de rede inacessível         | 25 min| Bloqueado||
|      |  | 3 | Analista Pleno (N2) | Incidente massivo e problema ITIL | 35 min| Bloqueado||
|      |  | 4 | Engenheiro (N3, N4) | Incidente cloud e Kubernetes      | 40 min| Bloqueado||
|      |  | 5 | Especialista        | Em breve                          |   --  | Em breve||
|      |                                                                               |
|      |  Competências avaliadas   Triagem  Segurança  Diagnóstico  Comunicação        |
|      |  (lista de 4 itens com barra fina de 4 px, sem cor por item)                 |
+------+------------------------------------------------------------------------------+
```

Notas:
- Tabela em vez de cinco cartões. Linha de 56 px, divisor de 1 px, a linha inteira é clicável.
- "Bloqueado" aparece com ícone de cadeado e dica: "Conclua o cenário 1". Hoje o código diz que todos os níveis ficam abertos; manter a regra atual (abertos) e trocar o rótulo por "Disponível". O que importa é a recomendação de ordem, não o bloqueio.
- Estado de cada linha tem texto simples: `Começar`, `Continuar (3 de 6 critérios)`, `Concluído`.
- Pomodoro, plano de estudos e anel de meta saem da Home. Se o aluno quiser, ficam no menu de perfil, em "Meta semanal".

### 4.2 Home em 375 px

```
+---------------------------------+
| IT Flight Simulator    (Sol)    |
+---------------------------------+
| Seu primeiro turno na Aurora    |
| Atenda chamados simulados e     |
| veja o que fez no Replay.       |
| [ Iniciar primeiro voo, 8 min ] |
+---------------------------------+
| Trilha de suporte        0 de 5 |
| 1 Estagiário                    |
|   Triagem e defesa contra       |
|   engenharia social   15 min  > |
| ------------------------------- |
| 2 Analista Jr (N1)              |
|   Pasta de rede inacessível     |
|   25 min                      > |
| ... (3 linhas)                  |
+---------------------------------+
| Missões Aulas Lab Caderno Mentor|
+---------------------------------+
```
Altura prevista: menos de 1700 px contra 7056 px hoje.

### 4.3 Course Player e guia da lição (1440 px)

```
+------+-----------------------------------------------------+---------------------+
| rail | Missões / Analista Jr / Aula 1 de 3        [Ctrl+K] | Conteúdo do módulo  |
|      +-----------------------------------------------------+---------------------+
|      | Rede, IP e DNS: a agenda da rede                    | v Módulo 2          |
|      | 7 min de leitura  |  Salvo no Caderno               |   (ok) 1 Rede, IP.. |
|      |                                                     |   ( ) 2 Usuários..  |
|      | Computadores conversam usando endereços             |   ( ) 3 Acesso..    |
|      | numéricos, como 10.20.1.15. Como ninguém decora     | > Módulo 3          |
|      | números, usamos nomes. O DNS faz a tradução.        |                     |
|      |                                                     | Progresso 1 de 3    |
|      | +-------------------------------------------+       | [=====-----------]  |
|      | | Em uma frase: IP é o número, DNS é a agenda|      |                     |
|      | +-------------------------------------------+       | [ Praticar este     |
|      | Usuário digita o nome > DNS traduz > conecta        |   conteúdo no lab ] |
|      |                                                     |                     |
|      | Teste rápido (1 de 2)                               |                     |
|      | O que o DNS faz?  ( ) .. ( ) .. ( ) ..              |                     |
|      +-----------------------------------------------------+---------------------+
|      | Visão geral | Anotações | Base de conhecimento | Mentor      [ Anterior ][ Próxima ]|
+------+-----------------------------------------------------------------------------+
```
Largura do texto: 68ch. Anotações ficam em aba inferior e também em gaveta, sincronizadas com o Caderno. "Praticar este conteúdo no lab" abre a Workstation com o cenário vinculado à aula.

### 4.4 Workstation split-screen em turno (1440 px)

```
+------+------------------------------------+---------------------------------------+
| rail | Lab / Triagem e defesa    Turno 00:00 simulado   SLA 0:45   [Pausar][Sair]   |
|      +------------------------------------+---------------------------------------+
|      | GUIA DA MISSÃO (32%)               | FERRAMENTAS (68%)                      |
|      |                                    | [ITSM 1] [Chat 0] [SimuDesk] [KB] [Replay]
|      | Objetivo                           +---------------------------------------+
|      | Decidir se o pedido do Diretor é   | Fila     | CH-0001  Urgente  SLA 0:45  |
|      | legítimo.                          |----------| Reset de senha da Diretoria  |
|      |                                    | CH-0001  | Solicitante: Roberto         |
|      | Tarefas                            | Novo     | (não verificado)             |
|      | [x] 1 Assumir o chamado            |          |------------------------------|
|      | [ ] 2 Consultar KB-001             |          | [Assumir chamado]            |
|      | [ ] 3 Pedir token corporativo      |          | Atividade                    |
|      | [ ] 4 Registrar nota interna       |          |  00:00 Chamado aberto        |
|      | [ ] 5 Recusar o reset              |          | Resposta  | Nota interna     |
|      | [ ] 6 Resolver com nota pública    |          | [__________________________] |
|      |                                    |          | [Enviar resposta]            |
|      | Dica (usada 0 de 3)                |          +------------------------------+
|      | [ Pedir dica ]                     |                                          |
|      | Ordem sugerida: ver KB-001         |                                          |
+------+------------------------------------+------------------------------------------+
```
Regras:
- A divisória entre guia e ferramentas é arrastável (largura mínima 280 px do guia).
- O guia lê os eventos do motor (os critérios S1 a S4 já existem na resposta de avaliação). Cada tarefa vira marca quando o evento correspondente é gravado; **não** avalia por conta própria. O motor segue como única autoridade.
- Tarefas não revelam "o que clicar", apenas o objetivo. O texto "Assuma, consulte, solicite..." que hoje está corrido no ITSM vira essa lista.
- Em 1280 px o guia vira coluna de 300 px; abaixo de 1024 px vira gaveta recolhível com botão "Missão" fixo no topo.

### 4.5 Workstation em 375 px

```
+---------------------------------+
| < Lab  Triagem   SLA 0:45  [i]  |
+---------------------------------+
| Tarefa 2 de 6: Consultar KB-001 |
| [==----] [Ver missão]           |
+---------------------------------+
| ITSM | Chat | SimuDesk | KB     |  (abas roláveis)
+---------------------------------+
| CH-0001  Urgente   SLA 0:45     |
| Reset de senha da Diretoria     |
| ...                             |
+---------------------------------+
| Missões Aulas Lab Caderno Mentor|
+---------------------------------+
```
A faixa "Tarefa atual" substitui o texto da faixa azul "Missão Atual". "Ver missão" abre o guia em folha deslizante (bottom sheet).

### 4.6 Caixa-Preta Replay e credencial (1440 px)

```
+------+------------------------------------------------------------------------------+
| rail | Replay / Sessão 1794792387855        Resultado: 3 de 4 critérios     [Refazer]|
|      +---------------------------------------+--------------------------------------+
|      | LINHA DO TEMPO                        | CRITÉRIOS                            |
|      |  00:00  o  Sessão iniciada            |  Triagem        ok  Atendido        |
|      |  00:00  o  Chamado aberto             |  Segurança      ok  Atendido        |
|      |  02:10  o  Assumiu o chamado          |  Diagnóstico    --  Não se aplica   |
|      |  03:40  *  Consultou KB-001  [S1 ok]  |  Comunicação    !!  Pendente        |
|      |  05:05  o  Pediu token                |                                     |
|      |  06:12  *  Recusou reset     [S2 ok]  |  Você fez            Recomendado     |
|      |  07:30  !  Nota pública vazia         |  Resolveu sem        Registrar nota  |
|      |  [---------o---------------]  Passo 5 |  nota ao solicitante pública clara  |
|      |  Evento 5, detalhe: [Ver bruto]       |  [Abrir KB-004]                     |
|      +---------------------------------------+--------------------------------------+
|      | CREDENCIAL DO CURRÍCULO VIVO                                                 |
|      | +--------------------------------------------------------------------------+ |
|      | | (selo)  Triagem e defesa contra engenharia social                         | |
|      | |         Emitido para: Aluno (sem login)   Data: 15/11/2026                | |
|      | |         Competências: Triagem, Segurança                                  | |
|      | |         Verificação: assinatura ECDSA P-256 válida                        | |
|      | |         [Baixar JSON] [Verificar] [Detalhes técnicos v]                   | |
|      | +--------------------------------------------------------------------------+ |
+------+------------------------------------------------------------------------------+
```
- Linha do tempo vertical, minuto simulado em fonte mono à esquerda, ícone por tipo de evento. Eventos que satisfazem critério mostram uma marca com o ID (`S1`).
- Clicar no critério leva ao evento (comportamento já existente com o botão "Ver seq").
- O JSON do payload fica atrás de "Ver bruto".
- Hash e algoritmo ficam em "Detalhes técnicos".

## 5. Revisão de micro-copy (antes e depois)

Regras (plain-writing): voz ativa, frase curta, sentença que diz o que acontece, termo único para cada coisa, sem ponto médio, sem emoji.

| Local | Antes | Depois |
|---|---|---|
| Marca | Academia de Suporte de TI · Hack Brasil 2026 | Simulador de suporte de TI |
| Rótulo do Painel | PAINEL DO ALUNO · AURORA LOGÍSTICA (100% DADOS SINTÉTICOS · SEM LOGIN) | (remover; mover para a página "Sobre os dados": "Todos os dados são fictícios. Nenhum login é necessário.") |
| Título do Painel | IT Flight Simulator — Academia de Suporte de TI | Seu primeiro turno na Aurora Logística |
| Subtítulo | Do zero ao especialista em suporte de TI: aprenda a teoria, fixe com técnicas comprovadas pela ciência e pratique num ambiente corporativo simulado. | Atenda chamados simulados, veja o que fez no Replay e gere uma credencial verificável. |
| Banner | Continue de onde parou / Começar a aula → | Continuar: Aula 1, O que faz o suporte de TI / Continuar |
| Saudação do protótipo | Olá! Bora para o próximo passo da sua carreira 👋 | Bom dia. Falta uma aula para fechar o módulo 1. |
| Missão 0 | Missão 0 - Como funciona em 4 passos (nunca atuou em TI? Comece aqui) | Como funciona |
| Passo 1 | Leia o chamado no ITSM. Clique em Assumir Chamado e confira quem pediu ajuda e qual é a urgência (SLA). | Assuma o chamado e veja quem pediu e qual é o prazo. |
| Passo 2 | Valide identidade no Chat. Antes de mexer no computador ou resetar senha, confirme matrícula e ramal com segurança. | Confirme a identidade no Chat antes de mexer em qualquer conta. |
| Passo 3 | Investigue antes de alterar. Use o SimuDesk para observar pistas reais antes de trocar qualquer configuração. | Olhe antes de mudar. Use o SimuDesk para ver o estado da máquina. |
| Passo 4 | Registre nota e veja a Caixa-Preta. | Registre sua decisão e abra o Replay. |
| Botões de nível | Aulas, Praticar | Estudar, Praticar (ícones `BookOpen` e `Play`) |
| Chip de patente | 🎖️ Cadete (iniciante) | Cadete |
| Streak | 🔥 1 dia(s) | 1 dia seguido |
| Tema | 🌙 Tema Escuro | (ícone `Moon`, `aria-label` "Tema escuro") |
| Mentor | 🤖 Mentor IA | Mentor (subtítulo: "Tire dúvidas sobre o que está estudando") |
| ITSM, ações | Acoes de Seguranca (Engenharia Social) / Passo a passo: 1) Assuma... | Verificação de identidade (checklist com 4 itens) |
| ITSM, botões | Resetar Senha Agora (Risco) | Resetar senha |
| ITSM, botões | Recusar Reset sem Validacao | Recusar reset |
| ITSM, nota | Linha do Tempo de Notas (0) / Nenhuma nota registrada ainda. | Atividade / Nenhuma atividade ainda. Assuma o chamado para começar. |
| SimuDesk bloqueado | Valide a identidade da usuaria no Comunicador (Chat) para obter o ID e o PIN. | Para conectar, peça o ID e o PIN no Chat depois de confirmar a identidade. |
| Replay vazio | Nenhum replay carregado. Carregue para ver criterios e linha do tempo. | Termine um turno para ver o Replay. |
| Replay, botão | Carregar Replay e Avaliacao | Ver Replay |
| Replay, título | Avaliação 360º, Replay e Currículo Vivo | Replay do turno |
| Replay, debrief | Debrief Didático da Caixa-Preta: 1 de 4 critérios atendidos. Próximo foco de aprendizado: ... | Você cumpriu 1 de 4 critérios. Próximo passo: consulte a política de segurança (KB-001) antes de decidir. |
| Currículo | Currículo Vivo (Portfolio Auditável) | Credencial verificável |
| Erro de rede (cold start) | (texto técnico do backend) | O servidor está acordando. Isso leva até 50 segundos na primeira vez. [Tentar de novo] |

Palavras a fixar no vocabulário (um termo por coisa): **chamado** (não ticket nem incidente quando for o item da fila), **turno** (sessão de trabalho), **Replay** (a Caixa-Preta passa a ser apenas o subtítulo "Caixa-preta do atendimento"), **credencial** (o Currículo Vivo é o nome do produto; o objeto é a credencial), **critério** (item do Juiz 360).
