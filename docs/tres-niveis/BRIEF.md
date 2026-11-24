# Três níveis de aprendizado: Teórico, Prático e Lab

Branch `feat/tres-niveis` (worktree `D:/Projetos/Ativos/it-career-simulator-niveis`), criada de `main` (548027e). Prazo duro: congelamento do hackathon em 27/11/2026 (vídeo até 30/11). Hoje é 24/11.

## Decisões do dono (24/11)
- O layout é o do Figma, página "Layout CertSim" (arquivo `rJVyYNumIZ8VgukhoMgtDH`): tema claro, sidebar 240px `#F3F4F6`, fundo `#F8FAFC`, azul `#2563EB`, cards raio 24 com sombra, Inter. Inspiração máxima no CertSim, mas os nomes de menu são nossos.
- Três níveis: **Teórico** (questionário com alternativas), **Prático** (lab guiado: chamado com pistas e feedback imediato) e **Lab** (atendimento ao chamado como teste prático, sem apoio, avaliado pelo Juiz 360).
- Para atestar conhecimento: **Prova teórica** e **Prova de Lab**. Para reforço: **Simulado teórico** e **Simulado de Lab**.
- IAs com fallback: toda explicação por IA tem versão estática; o app funciona com `Dialogo:HabilitarLlm=false`.
- Sem login. Histórico em `localStorage` (mesmo padrão de `itfs_registros_missao`). Gabarito fica no servidor, nunca no bundle.

## Menu (nomes nossos)
```
Estudo
  Início
  Carreira            jornada + plano de estudo + diagnóstico   (/carreira)
  Aprender            nível Teórico: trilhas e questões por tópico, com feedback (/aprender)
  Praticar            nível Prático: chamados guiados com pistas (/praticar)
  Biblioteca          catálogo de conteúdo                       (/biblioteca)
  Reforço diário      revisão espaçada dos erros                 (/reforco)
Avaliar
  Simulados           Teórico | Lab                              (/simulados)
  Provas              Prova teórica | Prova de Lab               (/provas)
Progresso
  Painel              dashboard                                  (/painel)
  Histórico           simulados, provas e labs                   (/historico)
  Portfólio           (já existe)
  Mentor              (já existe)
```
Rotas antigas (`/plano-de-carreira`, `/mesa-de-trabalho/:missao`, `/revisao/:sessao`, `/catalogo`, `/diagnostico`) continuam funcionando por redirecionamento. Não quebrar os testes E2E.

## Simulados (mesma tela de configuração do Figma, para Teórico e para Lab)
Dois modos, cada um com dois formatos:
- **Padrão** (cronometrado, resultado só no fim): *Completo* (quantidade padrão, todos os tópicos, nota de aprovação 70%) ou *Personalizado* (escolhe tópicos e número de questões).
- **Prática** (sem cronômetro, feedback imediato): *Completa* (todos os tópicos e níveis) ou *Personalizada* (escolhe quantidade, nível e tópicos).
Padrão do Teórico: 40 questões, 60 min. Padrão do Lab: 4 chamados, 40 min. Domínios: Acesso e contas, Redes, Hardware, Sistemas e ERP, Segurança, Backup e continuidade.
Prova = simulado padrão completo que atesta: gera registro no Portfólio.

## Estado do backend (verificado em 24/11)
Pronto: sessões de lab (`POST /api/sessoes`, ações, avaliação do Juiz 360, replay), 7 cenários, Pistas por cenário (máx. 3), `DialogoComFallback`.
**Falta**: banco de questões teóricas, correção, explicações com fallback, catálogo de cenários com domínio e nível, e o `Dialogo` para explicações de questão. Cronômetro, mapa, filtros, histórico e resultados são do frontend.

## Contratos novos (dono: Kiro)
Todos sob `/api/`, JSON em camelCase, determinísticos por `semente` (padrão do projeto). Códigos de erro no formato `ErroProblema` existente.
- `GET /teorico/topicos` devolve domínios, tópicos, níveis (1 a 3) e contagem de questões por tópico.
- `POST /teorico/provas` com `{ formato: "padrao"|"pratica", escopo: "completo"|"personalizado", topicos?: string[], nivel?: 1|2|3, quantidade?: number, semente?: number }` devolve `{ provaId, semente, duracaoSegundos|null, notaAprovacao, questoes: [{ id, dominio, topico, nivel, enunciado, alternativas: [{ id, texto }], selecao: "unica"|"multipla" }] }`. Sem gabarito.
- `POST /teorico/questoes/{id}/verificar` com `{ respostas: string[] }` devolve `{ correta, gabarito: string[], explicacao: { correta, incorretas: [{ alternativaId, texto }], referencia } }`. Usado na Prática.
- `POST /teorico/provas/corrigir` com `{ semente, formato, escopo, respostas: [{ questaoId, respostas: string[] }] }` devolve `{ total, corretas, percentual, aprovado, porDominio: [{ dominio, total, corretas }], questoes: [{ id, correta, gabarito, explicacao }] }`.
- `POST /teorico/questoes/{id}/explicar` com `{ estilo: "simples"|"exemplo"|"por-que-erradas" }` devolve `{ texto, origem: "ia"|"fallback" }`. Usa o cliente de diálogo com fallback; sem chave ou com LLM desligado, devolve texto estático derivado da explicação estruturada.
- `GET /laboratorio/cenarios` devolve `[{ cenarioId, versaoManifesto, dominio, nivel, titulo, duracaoEstimadaMin, causas }]`.
- Lab guiado x lab prova: `POST /sessoes` passa a aceitar `modo: "guiado"|"prova"` (padrão `prova` para não quebrar clientes). Em `prova` as Pistas ficam indisponíveis; em `guiado` valem as 3 Pistas existentes.
Conteúdo: no mínimo 60 questões originais em PT-BR (10 por domínio, níveis 1 a 3), com explicação estruturada (correta, cada incorreta, referência). Nada de dump de exame, nada copiado do CertSim ou de bancos pagos. Referências apontam para documentação oficial pública.

## Divisão de trabalho (um dono por arquivo)
**Kiro** (backend + tela do teórico)
- `src/backend/src/Simulador.Teorico/**` (projeto novo, adicionar à `Simulador.slnx`), `src/backend/tests/**Teorico**`, trechos novos de `Simulador.Api/Program.cs` entre os comentários `// === teorico ===` e `// === /teorico ===` (o AGY e eu não editamos o Program.cs).
- Frontend do teórico: `src/frontend/src/teorico/**` (cliente da API, `useProvaTeorica`, tela de questão com mapa lateral, resultado) e `src/frontend/src/api/teorico.ts`.
- Testes: dotnet test e Vitest dos seus arquivos.
**AGY** (shell, tema e páginas)
- Tema claro "CertSim" como padrão em `src/frontend/src/index.css` e `src/frontend/src/tema/**` (manter os temas existentes; medir contraste em `e2e/contraste.spec.ts`), `src/frontend/src/shell/**`, menu novo e redirecionamentos, páginas `Início`, `Carreira`, `Simulados` (hub + configuração + "Pronto para começar" para Teórico e Lab), `Provas`, `Histórico`, `Painel`, `Reforço diário`, em `src/frontend/src/jornada/paginas/**` e `src/frontend/src/jornada/simulados/**`.
- Histórico em `localStorage` (`itfs_historico_v1`), formato unificado `{ id, tipo: "teorico"|"lab", formato, escopo, quando, duracaoSeg, percentual, aprovado, porDominio, origem }`. O Kiro grava no fim da prova teórica via `registrarHistorico()` exportado de `src/frontend/src/jornada/simulados/historico.ts` (AGY cria esse módulo primeiro e avisa).
**Claude** (eu): este brief, integração, catálogo/modo do Lab na `Mesa de Trabalho` (`src/frontend/src/jornada/mesa/**` e `Simulador.Api` só no endpoint de cenários e no `modo` de `POST /sessoes`, depois que o Kiro terminar o Program.cs), E2E, contraste, revisão e PR.

## Regras
- Autonomia total sem perguntas; decisões ficam registradas no retorno.
- Sem acentos novos quebrando `check-regras-estilo.ts`; tokens em vez de cores soltas; a11y com contraste 4.5:1 e foco no h1.
- Nada de `git push`, nada de force, nada de mexer fora dos seus arquivos. Commits na branch `feat/tres-niveis` com mensagem curta em português e a linha `Co-Authored-By` do seu agente.
- Entrega: `docs/tres-niveis/handoffs/RETORNO-<agente>.md` (o que fez, arquivos, testes e resultado, pendências) e `regente notify`.
- Ordem sugerida e corte de MVP: 1) shell/tema/menu e contratos; 2) Simulado Teórico (padrão completo + prática personalizada) ponta a ponta; 3) Lab guiado/prova; 4) Histórico e Painel; 5) Reforço diário, Provas e explicações por IA. Se faltar tempo, cortar do 5 para cima.
