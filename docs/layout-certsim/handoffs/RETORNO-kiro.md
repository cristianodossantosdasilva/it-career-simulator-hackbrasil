# RETORNO kiro: Cabine no esquema CertSim

## Arquivos alterados (src/frontend/src/jornada)
- paginas/PaginaCabine.tsx: renderiza `CabineAtiva` quando pronto; cabecalho simples (h1 "Cabine") antes disso.
- paginas/PaginaCabine.test.tsx: +1 teste (cabecalho, mapa, filtros, Treino/Missao, Sair).
- cabine/TurnoDaCabine.tsx: recebe `estado`; guia da missao + MapaDeChamados na coluna esquerda; em Missao oculta o proximo passo e a dica do Comandante.
- Novos: cabine/CabineAtiva.tsx, CabecalhoDaCabine.tsx, MapaDeChamados.tsx, useEstadoCabine.ts, filaDeChamados.ts (+ .test.ts), cabine.css (so tokens de index.css; sem hex).

## O que foi feito
- Cabecalho: "Chamado X de N", barra fina (`progress`, resolvidos/total), SLA do chamado em foco (SlaMeter, so no modo Missao), alternador Treino/Missao, botao "Sair e salvar progresso" (vai a /plano-de-voo; sessao segue em itfs_voos_ativos), botoes Minhas notas/Comandante mantidos.
- Mapa lateral: "X de N resolvidos", filtros Todos/Abertos/Resolvidos/Para revisar com contagem, selos (Chamado atual, Aberto/Resolvido, SLA vencido do motor, Para revisar), marcar para revisar (localStorage `itfs_cabine_revisar:<sessaoId>`).
- Modo: localStorage `itfs_modo_cabine` = `treino` (padrao) ou `missao`. AGY pode gravar essa chave no Plano de Voo/Check-in para pre-selecionar.
- Funcoes atuais mantidas (ITSM, Chat, SimuDesk, KB, notas, Comandante, Juiz 360 e Replay, avisos).

## Comandos
- `npm.cmd run lint`: 0 erros; regras de estilo OK.
- `npm.cmd run build`: OK (check de segredos OK).
- `vitest run src/jornada`: 251 passam. `npm.cmd test -- --run` completo: 582 passam, 2 falham, ambos de Plano de voo (area do AGY, alteracoes em andamento): `App.test.tsx > Plano de voo mostra as escalas, a Missao 0...` e `workstation/EstadoInicial.test.tsx > abre sem escolha livre de missao, sem Decolar...`. Numa rodada anterior houve falhas intermitentes por timeout sob carga paralela; passaram ao repetir.

## Pendencias
- Clicar num chamado no mapa abre a aba ITSM e muda o "Chamado X", mas o ItsmApp (apps/ItsmApp, fora da minha area) guarda a selecao internamente. Para sincronizar: aceitar props `chamadoSelecionadoId` e `onSelecionar`.
- Pausa por inatividade, finalizacao com confirmacao e filtro "Sem resposta" do CertSim nao se aplicam (nao ha respostas por chamado); nao inventei mecanica.
- Nao conferi visualmente 375/768/1280 (sem screenshot); CSS usa flex-wrap e min-width:0, alvos de 44px.
- Arquivo cabine/filaDeChamados.ts: nome evita colisao de caixa com MapaDeChamados.tsx no Windows.