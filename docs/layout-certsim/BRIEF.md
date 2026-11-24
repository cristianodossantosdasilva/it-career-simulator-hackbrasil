# Layout inspirado no CertSim para o IT Flight Simulator

Worktree: D:/Projetos/Ativos/it-flight-simulator-hackbrasil-certsim (branch feat/layout-certsim, base fc0c571 = PR 3). Congelamento do projeto: 27/11/2026.
Referencia de estrutura: D:/Projetos/Ativos/Carreira-Internacional/simulado-clf/METODOLOGIA-CERTSIM.md (so organizacao da experiencia; NAO copiar textos, logos, marca ou cores literais do CertSim).

## Objetivo
Reorganizar a experiencia do simulador no mesmo esquema do CertSim (configuracao -> tela de trabalho com mapa lateral -> explicacao -> resultado -> plano/progresso), mantendo as funcionalidades do IT Flight Simulator (chamados ITSM, Cabine, motor deterministico, Juiz 360, Replay, dados sinteticos da Aurora Logistica).

## Mapa CertSim -> IT Flight Simulator
- Escolha de provedor/exame e "Quick access" -> Inicio (PaginaInicio) com continuar missao e atalhos
- Configuracao Standard (cronometrado) vs Practice -> Plano de Voo / Check-in: modo Treino (feedback imediato, sem cronometro) e modo Missao (SLA cronometrado, avaliacao so no fim)
- Tela da questao (cabecalho com progresso, cronometro, mapa) -> Cabine: cabecalho com "Chamado X de N", barra de progresso, SLA, mapa de chamados
- Mapa lateral com filtros -> lista de chamados da missao com filtros (Todos, Abertos, Resolvidos, Para revisar) e selos
- Explicacao estruturada -> Caixa Preta/Replay: o que o motor decidiu, o que estava certo, o que faltou, referencia
- Resultado (percentual, por dominio, fortes/fracos, revisao que abre) -> Caixa Preta: resultado da missao e Juiz 360 por competencia
- Plano de estudos, missoes, XP -> Comandante/Caderno (somente reorganizar, sem inventar mecanica nova)

## Regras fixas (AGENTS.md do repo)
- Proibido o simbolo E comercial em qualquer texto visivel, nome de componente ou doc: usar "e".
- Dados 100% sinteticos; nada de dados reais, credenciais ou segredos.
- O motor (Simulador.Dominio/Avaliacao) e a autoridade; so mexer no frontend. Nao alterar contratos de API.
- Reusar tokens de src/frontend/src/index.css (nao criar paleta paralela); contraste AA; alvo de toque 44px; sem overflow horizontal em 375, 768 e 1280 px.
- Nao quebrar testes existentes (Vitest 573). Rodar: cd src/frontend; npm.cmd run lint; npm.cmd test -- --run; npm.cmd run build.
- Git: NAO commitar, NAO dar push, NAO usar reset/clean/force. Eu (Claude) integro e commito. Dono unico por arquivo.
- Autonomia total, sem perguntas; se bloquear, registre no retorno.

## Donos de arquivos
- Claude: Figma (layouts), docs/layout-certsim/**, src/frontend/src/index.css, shell/AppShell.tsx, jornada/navegacao/**
- Kiro: jornada/paginas/PaginaCabine.tsx e jornada/cabine/** (+ testes respectivos)
- AGY: jornada/paginas/PaginaCaixaPreta.tsx, PaginaInicio.tsx, PaginaPlanoDeVoo.tsx, PaginaCheckIn.tsx, jornada/checkin/** (+ testes)
Se precisar de arquivo de outro dono, descreva a mudanca no retorno em vez de editar.

## Retorno
Gravar docs/layout-certsim/handoffs/RETORNO-<agente>.md (arquivos alterados, comandos rodados e resultado, pendencias) e depois `regente notify "<agente> concluiu"`.
