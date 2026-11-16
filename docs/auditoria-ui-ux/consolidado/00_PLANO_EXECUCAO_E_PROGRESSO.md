# Plano de execucao multiagente e registro de progresso

Arquivo de contexto compartilhado. Todo agente `sim-*` carrega este arquivo na partida. Ele substitui a releitura do handoff completo e do banco DevLedger. Ao terminar sua etapa, o agente acrescenta uma linha na secao Registro de progresso e marca a etapa na tabela.

## Projeto

- Slug DevLedger: `simulador-carreira-ti`. Raiz: `D:\Projetos\Ativos\it-flight-simulator-hackbrasil`.
- Banco DevLedger: `D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db` (so a etapa de fechamento escreve nele).
- Estado de partida (2026-11-15): branch `main`, HEAD `6b43745`, `src/` limpo, unica entrada nao rastreada `docs/auditoria-ui-ux/`.
- Grafo Graphify atualizado em `graphify-out/` no HEAD `6b437451` (2387 nos). Consultar com `graphify query "<pergunta>" --budget 1500`. Nao reconstruir.
- Producao: `https://it-flight-simulator-hackbrasil.vercel.app`. Meta: URL pronta no painel Hack Brasil antes de 30/nov/2026 e video de ate 3 minutos.
- Handoff completo (consultar so se faltar informacao): `docs/auditoria-ui-ux/consolidado/HANDOFF_PASSAGEM_DE_BASTAO_KIRO.md`.

## Regras inegociaveis

1. Preservar contratos da API C# (`src/backend`), `src/frontend/src/api/**`, `src/frontend/src/utils/jcs.ts` (JCS RFC 8785) e a assinatura ECDSA P-256. Nao editar esses arquivos sem pedido explicito do usuario.
2. Preservar seletores de testes (role, aria-label, textos acionaveis). Se o texto mudar de proposito, atualizar o teste correspondente no mesmo passo.
3. Acessibilidade WCAG AA: contraste minimo 4.5:1, foco visivel, alvos de toque de 44px, sem scroll horizontal em 375px, modos claro e escuro.
4. Zero caractere E comercial (U+0026) em `.md`, `.csv`, `.html` e em textos visiveis da UI (JSX, strings, entidades como a forma `amp;`). O operador logico duplo do codigo TypeScript e permitido.
5. Zero uso da forma passada do verbo sair em docs e UI.
6. Economia: ler somente os arquivos da etapa, usar o grafo antes de varrer, rodar o menor conjunto de testes que cobre a mudanca (lint, `tsc -b` e os testes dos arquivos tocados). Suite completa e Playwright so na etapa de validacao.
7. Sem `git push`, merge em main, deploy, `npm install` de pacote novo sem confirmacao do usuario. Commits locais apenas na branch `redesign-ui-ux`.
8. Comandos de shell no Windows usam `npm.cmd` e `npx.cmd`.

## Mapa do codigo (frontend, tamanho em KB, emojis, estilos inline)

| Arquivo | KB | Emojis | style inline |
|---|---|---|---|
| src/index.css | 47 | 0 | 0 |
| src/App.tsx | 24 | 8 | 1 |
| src/workstation/TelaInicial.tsx | 38 | 12 | 17 |
| src/educacao/BarraSuperior.tsx | 4 | 11 | 0 |
| src/educacao/AulasView.tsx | 19 | 21 | 7 |
| src/educacao/CadernoView.tsx | 10 | 9 | 5 |
| src/educacao/MentorView.tsx | 20 | 19 | 6 |
| src/educacao/catalogoEducacional.ts | 38 | 9 | 0 |
| src/apps/ItsmApp/ItsmApp.tsx | 14 | 0 | 0 |
| src/apps/SimuDeskApp/SimuDeskApp.tsx | 21 | 0 | 6 |
| src/apps/ChatApp/ChatApp.tsx | 7 | 0 | 0 |
| src/apps/IntranetApp/IntranetApp.tsx | 4 | 0 | 0 |
| src/replay/ReplayView.tsx | 8 | 0 | 0 |

Playwright hoje tem so o projeto `chromium` desktop (`src/frontend/playwright.config.ts`) e uma spec `e2e/jornadas.spec.ts`. O servidor E2E usa `dotnet run --no-build`, entao o backend precisa estar compilado antes.

## Etapas

Cada etapa roda em uma sessao nova: `kiro-cli chat --agent <agente>` na raiz do projeto.

| # | Agente | Modelo | Resultado | Status |
|---|---|---|---|---|
| 0 | sim-retomada | claude-haiku-5.5 | Estado conferido, branch `redesign-ui-ux` criada | concluida |
| 1 | sim-consolidador | claude-sonnet-5.5 | Documentos 01 e 02 consolidados e lista de decisoes abertas | concluida |
| G | usuario | n/a | Alinhamento rapido das decisoes esteticas | concluida |
| 2 | sim-arquiteto-ui | claude-opus-5.5 | Tokens, index.css, icones SVG, AppShell e BarraSuperior | concluida |
| 3 | sim-implementador-ui | claude-sonnet-5.5 | TelaInicial (Primeiro Voo) e Split-Screen Lab | concluida |
| 4 | sim-implementador-ui | claude-sonnet-5.5 | AulasView, CadernoView, MentorView | concluida |
| 5 | sim-implementador-ui | claude-sonnet-5.5 | ItsmApp, SimuDeskApp, ChatApp, IntranetApp | pendente |
| 6 | sim-implementador-ui | claude-sonnet-5.5 | ReplayView, credencial ECDSA e projetos Playwright 375/768/1280/1440 com `e2e/visual.spec.ts` | pendente |
| 7 | sim-validador | claude-haiku-5.5 | Relatorio de lint, testes, build, Playwright e varreduras | pendente |
| 8 | sim-implementador-ui | claude-sonnet-5.5 | Correcoes do relatorio e inspecao visual dos screenshots | pendente |
| 9 | sim-validador | claude-haiku-5.5 | Revalidacao final (so se a etapa 8 mudou codigo) | pendente |
| 10 | sim-fechamento | claude-haiku-5.5 | Commit, push com confirmacao, CI e DevLedger | pendente |

## Decisoes do usuario (alinhamento G concluido em 2026-11-16)

O usuario aprovou as propostas da etapa 1 com a diretriz de temas abaixo. Argumentos e riscos originais: `01_CONSOLIDADO_UI_UX_E_PLANO_IMPLEMENTACAO.md` secao 4.

- Referencia visual principal: aprovada com ajuste. Dois perfis tematicos no atributo `data-theme` do elemento `html`, em vez de um alternador claro e escuro generico:
  - `tactical` (Cockpit Tatico, escuro, padrao): superficies ardosia e grafite (`#0B1120`, `#0F172A`, `#1E293B`), acento ciano `#0EA5E9`, estados `#10B981`, `#F59E0B`, `#EF4444`. Referencia: TryHackMe e consoles aeroespaciais.
  - `corporate` (Console Corporativo, claro): superficies `#F8FAFC`, `#FFFFFF`, `#F1F5F9`, acento azul-petroleo `#0B6E8A`, estados `#059669`, `#D97706`, `#DC2626`. Referencia: AWS Cloudscape e Linear.
  - Nomes de token definidos pelo usuario: `--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--border-subtle`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-primary`, `--accent-hover`, `--accent-surface`, `--status-success`, `--status-warning`, `--status-danger`, `--font-sans`, `--font-mono`. O seletor `.dark` acompanha `tactical` por compatibilidade.
  - Sem roxo de IA. Verde, ambar e vermelho so para estado. A etapa 2 mede cada par de contraste.
- Alternador de tema: no rodape do rail de 56 px. Icone `Crosshair` para Cockpit Tatico (dica "Modo Cockpit Tatico - Treinamento") e `Briefcase` para Console Corporativo (dica "Console Corporativo - Auditoria B2B"). Persistencia em `localStorage` na chave `itfs_theme`, padrao `tactical`. Ao alternar, aplica `data-theme` e a classe `.dark` condicional.
- Tipografia: aprovada. Inter e JetBrains Mono empacotadas via `@fontsource/inter` e `@fontsource/jetbrains-mono`.
- Navegacao desktop e mobile: aprovada. Rail de 56 px com 6 destinos e barra de contexto de 44 px. Abaixo de 768 px, barra inferior com 5 destinos (Credencial no menu de perfil). Um unico `nav` com itens `button` e `aria-current`, sem roteador.
- Home: aprovada. Bloco principal dinamico (Iniciar primeiro voo, ou Retomar missao) e tabela de 5 missoes. Pomodoro, XP e metas no menu de perfil. Carreira no destino Credencial.
- Densidade de ITSM, SimuDesk e Replay: aprovada. Pre-banca focado em ITSM em tabela com SLA real visivel, botoes de decisao neutros, abertura do artigo KB-001, cabecalho do SimuDesk e Replay completo (linha do tempo por eventos).
- Biblioteca de icones: aprovada. `lucide-react` com importacao por icone, isolada atras do componente `Icon`. Instalacao autorizada: `npm install lucide-react @fontsource/inter @fontsource/jetbrains-mono`.
- Nome do Mentor: aprovado como proposto.
- Acentuacao e textos de teste: aprovado como proposto.
- Escopo: aprovado. Toasts, terminal dedicado e command palette ficam para depois da banca (`POS`).

## Registro de progresso (acrescentar uma linha por etapa)

| Data e hora | Etapa | Agente | Resultado e evidencia | Proxima acao |
|---|---|---|---|---|
| 2026-11-15 23:21 -03:00 | 0 | sim-retomada | DevLedger somente leitura: integrity_check ok e foreign_key_check sem violacoes. Ultimo checkpoint 01a1e207-7715-7705-ad05-6d15f3916ba6 em commit 6b437451c14b434f73693c91713b643cb4e243d0 (2026-11-16T01:45:02Z). Handoff ativo 01a1e207-01b7-725d-a2b8-7fd969be8eef (2026-11-16T01:44:32Z). Git observado: branch main, HEAD 6b43745, 59 entradas sujas (contagem por arquivo, com --untracked-files=all), todas dentro de docs/auditoria-ui-ux/ e nenhuma em src/. O DevLedger registrou 52 entradas em 01:44Z; os 6 arquivos de docs/auditoria-ui-ux/lovable/ foram modificados depois do checkpoint (22:47 a 22:48 local) e a diferenca restante de 1 entrada nao foi explicada. Graphify: graph.json presente, GRAPH_REPORT cita 6b437451. Branch redesign-ui-ux criada a partir de 6b43745. | Etapa 1: sim-consolidador (consolidar docs/auditoria-ui-ux/{kiro,codex,copilot}/ nos documentos 01 e 02) |
| 2026-11-16 00:25 -03:00 | 1 | sim-consolidador | Branch redesign-ui-ux conferida (HEAD 6b43745). Lidas as auditorias kiro (01 a 04 e parte do 05), codex (01 a 04 e inicio do 05), copilot (01 a 04 e inicio do 05) e lovable (01 e 04). Mockup HTML e imagens nao abertos. Graphify consultado duas vezes e leituras dirigidas confirmaram no codigo: API ja traz prioridade e SLA por chamado, criterios trazem praticaEsperada e eventos trazem criterios, App.test.tsx usa botoes de navegacao com emoji no nome. Gerados 01_CONSOLIDADO_UI_UX_E_PLANO_IMPLEMENTACAO.md e 02_BACKLOG_UNIFICADO_UI_UX.csv (60 itens: 38 PRE_BANCA, 22 POS). Nenhum arquivo fora de docs/auditoria-ui-ux/consolidado/ alterado e nenhum commit. | Etapa G: usuario responde as 5 decisoes abertas. Depois, etapa 2: sim-arquiteto-ui |
| 2026-11-16 01:43 -03:00 | 2 | sim-arquiteto-ui | Branch redesign-ui-ux. Instalados com autorizacao `lucide-react` 1.73, `@fontsource/inter` 5.3 e `@fontsource/jetbrains-mono` 5.3 (subset latin 400 a 700 importado em `main.tsx`). Tokens no topo de `index.css`: base em `:root` (`--font-sans`, `--font-mono`, `--font-size-xs` a `--font-size-3xl`, `--font-weight-*`, `--line-height-tight/ui/read`, `--measure`, `--space-1` a `--space-12`, `--radius-sm/md/lg`, `--focus-ring-width`, `--focus-ring-offset`, `--touch-target`, `--rail-width`, `--context-bar-height`, `--bottom-bar-height`, `--z-shell/menu/modal`, `--duration-fast`, `--easing-standard`, `--row-height`, `--cell-padding-y`) e por tema em `[data-theme='corporate']` e `[data-theme='tactical'], .dark` (`--bg-canvas/surface/elevated/hover`, `--border-subtle/strong/control`, `--text-primary/secondary/muted`, `--accent-primary/hover/surface/text/contrast/solid`, `--status-success/warning/danger` com sufixos `-text`, `-surface`, `-solid`, `--status-warning-border`, `--focus-ring`, `--glow-accent`, `--shadow-sm/md/overlay`, `--overlay-scrim`). Densidade em `[data-density='operacional']`. Desvios medidos do briefing: `--text-muted` corporate #5E6E84 (o #64748B dava 4.34:1 em elevated) e tactical #8593A8 (o #64748B dava 3.07:1); status em texto usa os sufixos `-text`; botao primario tactical usa texto escuro (`--accent-contrast`), pois branco sobre #0EA5E9 da 2.77:1. Aliases antigos (`--border`, `--accent`, `--theory*`, `--fix*`, `--practice*`, `--mastery*`, `--warn*`, `--danger*`, `--mono`, `--shadow-card`) apontam para os tokens novos e o roxo deixou de existir. Seletores `[data-theme='dark']` renomeados para `tactical`. Removidos `.topnav` e a faixa `::after`, `.nav-links`, `.nav-link`, `.nav-chip`, `.nav-btn`, `.brand*`, `.subbar`, `.legend`, `.lg`. `.eyebrow` e `.block-label` sem caixa alta, classes mantidas. Componentes novos: `ui/Icone.tsx` (`Icone`, tipo `NomeIcone`, props `nome`, `tamanho` 16/20/24, `rotulo`; traco 1.75; nomes missoes, aulas, laboratorio, caderno, mentor, credencial, tema-tatico, tema-corporativo, perfil, marca, voltar, fechar, confirmar, expandir, sequencia, xp, conquista, info, relogio, notas, conversa, chamado, remoto, base, terminal, saude), `shell/tema.ts` (`TemaShell`, `CHAVE_TEMA` = itfs_theme, `carregarTema`, `salvarTema`, `aplicarTema`, `ROTULOS_TEMA`), `shell/contextoShell.ts` (`useShell`, `ContextoShell`, `DensidadeShell`), `shell/AppShell.tsx` (`AppShell` com `densidade`, `sessaoAtiva`, `onRetomarLaboratorio`), `shell/AlternadorTema.tsx` (`AlternadorTema`, variantes compacto e completo), `shell/MenuPerfil.tsx` (`MenuPerfil`, slot `children` para Pomodoro e metas). `BarraSuperior` virou rail de 56 px com um unico `nav` "Navegação principal" (6 `button` com `aria-current`, Credencial so no desktop) que vira barra inferior abaixo de 768 px, barra de contexto de 44 px e menu de perfil (patente, sequencia, XP, nivel em foco `#focus-select`). Props novas `credencialAtiva` e `conteudoPerfil`; `tema` e `onAlternarTema` ficaram opcionais e obsoletas. Classes CSS reutilizaveis: `.app-shell`, `.shell-rail`, `.nav-principal`, `.nav-item`, `.barra-contexto`, `.botao-contexto`, `.botao-contexto-texto`, `.dado-contexto`, `.dado-mono`, `.menu-perfil-painel`, `.sr-only`, `.so-mobile`, `.so-desktop`, `.mt-1`. `App.tsx` envolve Academia e Workstation no mesmo `AppShell`; a sessao fica em memoria e o destino Laboratorio retoma o turno. `TelaInicial` ganhou so a prop `visaoInicial`. App.tsx e BarraSuperior.tsx sem emoji e sem estilo inline; gaveta "Tutor IA" renomeada para "Mentor da missão"; botao "Voltar para a Tela Inicial" preservado para a spec E2E. `App.test.tsx`: nomes sem emoji e 4 testes novos (contraste dos tokens, nav unica com 6 destinos e tema persistido, menu de perfil com Escape e axe, `Icone`). Evidencia: `npm.cmd run lint` sem avisos, `npx.cmd tsc -b` exit 0, `npm.cmd test -- --run src/App.test.tsx` 14 de 14. Sem build, suite completa nem Playwright; inspecao visual pendente para a etapa 8. | Etapa 3: sim-implementador-ui (TelaInicial e Split-Screen Lab), reutilizando `Icone`, `MenuPerfil` via `conteudoPerfil` e os tokens acima |
| 2026-11-16 02:35 -03:00 | 3 | sim-implementador-ui | Branch redesign-ui-ux. Reaproveitados `Icone`, `MenuPerfil` (via `conteudoPerfil`), tokens e classes `.btn*`, `.field-stack`, `.banner-notice`, `.steps-grid`. Home: `TelaInicial.tsx` reescrita (sem emoji, sem estilo inline, sem cards de Pomodoro, streak ou barras na primeira dobra). Novos em `workstation/`: `PrimeiroVoo` (h2 "Iniciar primeiro voo" ou "Retomar missão", fluxo Estudar, Praticar no Split-Screen, Revisar na Caixa-Preta), `TabelaMissoes` (radiogroup de 5 linhas com estado em texto, botões Aulas e Praticar, semente, "Demo rápida: Nível 2, C1" e "Decolar no Simulador"), `PainelPerfilExtra` (meta semanal, Pomodoro, revisões e plano dentro do menu de perfil), `usePomodoro`, `CredencialView` (progresso, Currículo Vivo com detalhes técnicos recolhidos e verificador offline sempre visível; abre pelo destino Credencial e substitui o modal). Novos em `lab/`: `roteiros.ts` (passos por cenário, concluídos só pela projeção do motor), `MissionGuide` (checklist com `aria-current="step"`, próximo passo, botão que abre a ferramenta), `SplitLabWorkspace` (guia a 32% com mínimo 280 px e máximo 50%, divisória `role="separator"` com teclado e arraste, largura em `localStorage` `itfs_guia_pct`, abaixo de 1024 px o guia vira painel recolhível). `App.tsx`: faixa "Missão atual" removida, dock virou `nav` "Aplicativos da Workstation" em abas dentro do console, gavetas passadas como `gaveta`. `BarraSuperior`: removidas props obsoletas de tema, nova prop `rotuloLocal`; `MenuPerfil`: `children` aceita função com `fechar`. `Icone`: novos `avancar`, `baixar`, `verificar`, `cartoes`. CSS: removidos `.continue*`, `.lvl*`, `.launch-bar`, `.cycle*`, `.mission-zero-card`, `.ring`, `.pomo*`, `.stat-row`, `.cv-modal-*`, `.mission-strip`, `.cockpit-body`, `.app-dock`; novos blocos Split-Screen Lab e Home. Testes: `App.test.tsx` (carreira agora abre pelo destino Credencial, acentos da mensagem de sessões, 2 testes novos) e `lab/SplitLab.test.tsx` (7 testes). `e2e/jornadas.spec.ts` ajustada (botão de demo e destino Credencial), sem executar. Evidência: `npm.cmd run lint` sem avisos, `npx.cmd tsc -b` exit 0, `npm.cmd test -- --run src/App.test.tsx src/lab/SplitLab.test.tsx` 23 de 23. Sem build, suite completa nem Playwright. Deixado para depois: textos da dica da missão em `App.tsx` ainda sem acento (etapa 5, junto de `textos/workstation.ts`); `L.cargo` e `L.competencias` do catálogo mantêm o ponto médio (a spec E2E casa o nome do rádio "Nível 1 · Estagiário", a etapa 4 ajusta junto da spec); emojis de `L.icon` ficam no catálogo para a etapa 4; remover `.chip`, `.badge-*` e `.c-*` só depois da etapa 6; inspeção visual em 375 e 1440 fica para a etapa 8. | Etapa 4: sim-implementador-ui (AulasView, CadernoView, MentorView e campos de ícone do catálogo) |

