# 02. Arquitetura UX, jornadas e wireframes

## Princípio de produto

Uma missão tem quatro verbos visíveis: **Aprender, Praticar, Revisar, Comprovar**. O shell acompanha o aluno enquanto o contexto muda. Abrir o laboratório não deve parecer sair da academia.

## Mapa de informação

```text
IT Flight Simulator
├── Início
│   ├── Retomar
│   └── Próxima missão
├── Trilhas
│   ├── Níveis e cenários
│   └── Aulas da missão
├── Laboratório ativo
│   ├── Guia da missão
│   ├── ITSM
│   ├── Chat
│   ├── SimuDesk
│   ├── Base de conhecimento
│   └── Replay
├── Caderno
└── Progresso
    ├── Competências
    └── Currículo Vivo
```

O Tutor de estudo entra como apoio contextual na aula ou no painel da missão, não como destino de topo. No celular, navegação inferior: Início, Trilhas, Caderno e Progresso. No laboratório, “Ferramentas” abre uma lista de apps; não manter dez itens numa barra estreita.

## Jornada

1. **Primeira visita:** explicar em uma frase que o aluno vai atender um chamado fictício e tomar decisões técnicas. Exibir botão “Começar primeira missão”. Disponibilizar “Como funciona” em quatro passos curtos, recolhido por padrão.
2. **Escolha:** selecionar trilha com nome, pré-requisito, tempo estimado e objetivo. Mostrar progresso já iniciado e uma ação primária por trilha.
3. **Preparação:** abrir uma unidade breve, informar a ferramenta que será usada e o critério de conclusão. O aluno pode ir direto à missão se já conhece o conteúdo.
4. **Turno:** fixar guia e estado da missão ao lado da ferramenta ativa. Instrução atual, evidência esperada, ação segura e progresso ficam visíveis sem voltar à aula.
5. **Revisão:** após resolver o cenário, apresentar Replay de eventos. Cada critério aponta para o evento que o prova ou para a etapa que faltou.
6. **Comprovação:** mostrar a competência registrada, origem, data e integridade criptográfica. Distinguir currículo exportado de certificação formal.

## Wireframe desktop, 1440 px

### 1. Início e catálogo

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ IT Flight Simulator     Início   Trilhas   Caderno   Progresso       Perfil   │ 56
├──────────────────────────────────────────────────────────────────────────────┤
│ Retomar missão                                                                │
│ Pasta de rede inacessível                                      [Continuar]     │
│ Etapa 2 de 5   ·   12 min restantes estimados                                │
├─────────────────────────────────────────────────────┬────────────────────────┤
│ Próxima missão                                       │ Sua trilha             │
│ Nível 1 · Engenharia social                         │ 2 de 5 etapas feitas   │
│ Verifique a identidade antes de liberar acesso.     │ [───────     ]         │
│ [Começar missão]  [Ver aula de 6 min]               │ Competências: triagem  │
├─────────────────────────────────────────────────────┴────────────────────────┤
│ Todas as missões       [Por nível ▾] [Continuar de onde parei ▢]             │
│ N1  Triagem e engenharia social             15 min     Começar               │
│ N2  Pasta de rede inacessível               20 min     Ver progresso         │
│ N3  Incidente em vários serviços            30 min     Bloqueado: conclua N2  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2. Player de aula

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Trilha N2   Rede, IP e DNS                         Unidade 1 de 3     7 min │
├──────────────────────┬────────────────────────────────────┬──────────────────┤
│ Nesta aula           │ O DNS traduz nomes em endereços IP │ Ajuda            │
│ 1 Rede e DNS     ●   │                                    │ Objetivo         │
│ 2 Grupos AD      ○   │ Texto com largura de leitura 68ch  │ Entender por que │
│ 3 Acesso remoto  ○   │                                    │ o nome abre o    │
│                      │ Diagrama simples: nome → DNS → IP   │ destino certo.  │
│ Progresso 1/3        │                                    │                  │
│                      │ Verifique o que entendeu            │ [Tutor]          │
│                      │ [Pergunta e resposta curta]         │ [Minhas notas]   │
│                      │                                    │                  │
│                      │ [Salvar nota] [Praticar no lab]     │                  │
└──────────────────────┴────────────────────────────────────┴──────────────────┘
```

### 3. Turno em split-screen

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Missão N2  Pasta de rede inacessível   Etapa 2/5   Salvo   [Encerrar turno]  │
├──────────────────────────┬───────────────────────────────────────────────────┤
│ GUIA DA MISSÃO            │ Aurora ITSM        Chat       SimuDesk      KB    │
│ Validar identidade        ├───────────────────────────────────────────────────┤
│ Antes de abrir o acesso,  │ Fila de chamados              Detalhe do chamado │
│ confirme matrícula e      │ CH-1042  Alta  SLA 08:20       Pasta de rede...  │
│ ramal pelo Chat.          │ CH-1043  Média                 Solicitante       │
│                           │                               Ação: assumir     │
│ ✓ Assumir o chamado      │                               Nota interna      │
│ ● Validar pelo Chat       │                               Resposta pública  │
│ ○ Consultar KB            │                               Linha do tempo    │
│ ○ Investigar no SimuDesk  │                                                   │
│                           │                                                   │
│ [Pedir uma pista]         │                                                   │
│ Artigo recomendado: KB-01 │                                                   │
└──────────────────────────┴───────────────────────────────────────────────────┘
```

O guia usa 300 a 340 px em 1440; a ferramenta fica com o restante. O divisor pode ser arrastado e a largura fica salva. Em ITSM, a fila é uma tabela agrupada e a seleção abre detalhe no painel direito. O guia não compete com a fila: ele contextualiza a tarefa.

### 4. Replay e Currículo Vivo

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Turno concluído · Pasta de rede inacessível             [Voltar às missões]  │
├───────────────────────────────────────┬──────────────────────────────────────┤
│ Resultado por critério                │ Linha do tempo                       │
│ Triagem             Concluída         │ 09:02 Chamado assumido              │
│ Segurança           Concluída         │ 09:04 Identidade validada           │
│ Diagnóstico         Rever             │ 09:06 Consulta somente leitura      │
│ Comunicação         Concluída         │ 09:09 Serviço restaurado             │
├───────────────────────────────────────┴──────────────────────────────────────┤
│ Evento selecionado: consulta de evidência                                    │
│ Você fez / Prática esperada / Evidência que atende ao critério               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Competência registrada                                                       │
│ Triagem e acesso seguro · Aurora Logística · ECDSA P-256 · Verificar arquivo │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Wireframes mobile, 375 px

### 1. Início e catálogo

```text
┌───────────────────────────────┐
│ IT Flight Simulator       ☰   │
├───────────────────────────────┤
│ Retomar missão                │
│ Pasta de rede inacessível     │
│ Etapa 2 de 5                  │
│ [Continuar]                   │
├───────────────────────────────┤
│ Próxima missão                │
│ Verifique identidade antes    │
│ de liberar acesso.            │
│ [Começar] [Ver aula]          │
├───────────────────────────────┤
│ Missões                       │
│ N1  Engenharia social   15 min│
│     Começar                   │
│ N2  Pasta de rede        20 min│
│     Continuar                 │
├───────────────────────────────┤
│ Início  Trilhas  Caderno  Eu  │
└───────────────────────────────┘
```

### 2. Player de aula

```text
┌───────────────────────────────┐
│ ← Trilha N2         1 de 3   │
├───────────────────────────────┤
│ Rede, IP e DNS                │
│ 7 min                         │
│                               │
│ O DNS traduz nomes em IP.     │
│                               │
│ [Diagrama em uma coluna]      │
│                               │
│ Confira o que entendeu        │
│ [Responder pergunta]          │
│                               │
│ [Salvar nota]                 │
│ [Praticar no laboratório]     │
├───────────────────────────────┤
│ Conteúdo  Notas  Ajuda        │
└───────────────────────────────┘
```

### 3. Turno

```text
┌───────────────────────────────┐
│ N2 · Pasta de rede       ⋯   │
│ Etapa 2 de 5                  │
├───────────────────────────────┤
│ GUIA       FERRAMENTA         │
├───────────────────────────────┤
│ Validar matrícula e ramal     │
│ antes de abrir acesso.        │
│                               │
│ ✓ Chamado assumido            │
│ ● Validar identidade          │
│ ○ Consultar base               │
│                               │
│ [Pedir uma pista]             │
├───────────────────────────────┤
│ [Abrir Chat]                  │
│ A ferramenta usa a tela toda. │
├───────────────────────────────┤
│ Missão   Ferramentas   Notas  │
└───────────────────────────────┘
```

No celular, alternar Guia e Ferramenta. A ferramenta ocupa a tela inteira; o contexto da missão fica acessível por botão persistente e folha inferior. Não tentar miniaturizar o layout 30/70.

### 4. Replay

```text
┌───────────────────────────────┐
│ ← Missões   Replay            │
├───────────────────────────────┤
│ Turno concluído               │
│ Triagem             Concluída │
│ Segurança           Concluída │
│ Diagnóstico         Rever     │
│ Comunicação         Concluída│
├───────────────────────────────┤
│ Eventos                       │
│ 09:02 Chamado assumido        │
│ 09:04 Identidade validada     │
│ 09:06 Consulta                │
├───────────────────────────────┤
│ Competência registrada        │
│ [Verificar integridade]       │
└───────────────────────────────┘
```

## Microcopy antes e depois

| Antes | Depois |
|---|---|
| “Do zero ao especialista em suporte de TI” | “Aprenda a atender chamados de TI.” |
| “Decole no Simulador” | “Começar missão” |
| “Continue de onde parou” | “Retomar missão” |
| “Nunca atuou em TI? Comece aqui” | “Primeira vez? Siga estes quatro passos.” |
| “Mentor IA” | “Tutor de estudo” |
| “Modo determinístico roteirizado ativo por padrão” | “O tutor usa respostas guiadas pelos conteúdos da trilha.” |
| “Juiz 360º” | “Avaliação do turno” |
| “Currículo Vivo” sem contexto | “Competências registradas” |
| “Acordando servidor da API na nuvem...” | “Preparando o laboratório. A primeira conexão pode levar alguns segundos.” |
| “Dados 100% sintéticos, sem login” repetido em várias telas | “Empresa e dados fictícios” junto ao nome do cenário, com detalhes na primeira visita. |
