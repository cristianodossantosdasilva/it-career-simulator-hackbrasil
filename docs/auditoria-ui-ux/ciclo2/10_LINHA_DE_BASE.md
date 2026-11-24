# Ciclo 2, E1: linha de base de contraste e contorno

Gerado em 2026-11-16T10:56:51.113Z por e2e/contraste.relatorio.mjs, a partir dos JSON de test-results/contraste/. Não corrige produto. Mede o estado da branch ux-ciclo-2 no commit 7907bda (produto idêntico ao da main em a88988c, os commits da branch até aqui só mudam documentação).

## 1. Ambiente e método

| Item | Valor |
|---|---|
| Chromium | 159.0.8154.6 |
| Node | v24.19.0 |
| Playwright | 1.65.1 |
| axe-core | 4.14.0 (regra color-contrast, injetado por page.addScriptTag) |
| Projetos | desktop-1280, desktop-1440, mobile-375, tablet-768 |
| Telas | 10 (Missões, Aulas, Caderno, Mentor, Credencial, Laboratório: ITSM, Laboratório: Chat, Laboratório: SimuDesk, Laboratório: KB, Juiz 360 e Replay) |
| Estados | limpo (sem missão iniciada), missão iniciada (laboratório logo após Iniciar), turno concluído (depois de resolver o chamado do Nível 1) |
| Temas | tactical e corporate |
| Viewports | 375, 768, 1280 e 1440 de largura |

Observação sobre a contagem de telas: o plano cita 9 telas, a lista do procedimento tem 10 (Missões, Aulas, Caderno, Mentor, Credencial, ITSM, Chat, KB, SimuDesk e Juiz 360 com Replay, que é uma tela só). O relatório cobre as 10.

Método:

- Texto: regra color-contrast do axe-core no Chromium real, na página inteira e de novo na subárvore de cada elemento sob hover. Elementos que o axe não consegue avaliar (incomplete) vão para a lista de não calculáveis com o motivo do axe.
- Contorno: getComputedStyle da borda contra o fundo opaco efetivo do ancestral, compondo camadas translúcidas. Containers: .edu-card, .panel, .glossary-details, .card-section e table. Divisores: .missao-linha, th, td e .itsm-nota. Controles: button, input, select, textarea e summary. Registra também a razão contra o fundo interno do próprio elemento e, para controles, contra o preenchimento.
- Foco: até 12 elementos distintos por célula, conteúdo antes da casca (trilho e barra de contexto). Foco programático depois de uma tecla, para que :focus-visible case. Mede a cor do anel (outline) contra o fundo do ancestral.
- Hover: até 6 elementos distintos por célula, mouse sobre o centro do elemento, sem transições, medindo borda e preenchimento e rodando o axe na subárvore.
- Páginas reutilizadas: uma página por projeto, tema e grupo (estudo, laboratório). Só um backend, porta 8080, com limite de 5000 requisições por minuto definido pelo playwright.config.ts.
- Limiares (seção 4 do plano final): texto 4,5:1 (grande 3:1, vindo do axe); controles e foco 3:1; contorno de container 2,0:1 sobre surface e canvas; divisor 1,4:1 no corporate e, no tactical, sem regressão (1,72 surface e 1,82 canvas); fundo elevated e hover só informativo para container e divisor.
- Papel por seletor, não por token: o contorno de container é avaliado pelo papel do elemento (.edu-card, .panel etc.), seja qual for o token que a regra CSS usa. Hoje essas regras usam var(--border), alias de --border-subtle. O plano trata o contorno de container como border-strong, então a violação de container abaixo mostra a distância entre o que o CSS usa e o que o limiar de 2,0:1 pede.

## 2. Totais por tema e viewport

Contagem de elementos distintos por célula (tela e estado). O mesmo componente que aparece em duas telas conta nas duas. Linhas informativas são as sem limiar aplicável (fundo elevated ou hover, controle só com preenchimento).

| Métrica | tactical 375 | tactical 768 | tactical 1280 | tactical 1440 | corporate 375 | corporate 768 | corporate 1280 | corporate 1440 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Células medidas | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 |
| Células não calculáveis | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de texto (axe, estático) | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 |
| Violações de texto (axe, hover) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de contorno de container | 19 | 19 | 19 | 19 | 19 | 19 | 19 | 19 |
| Violações de divisor | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 2 |
| Violações de controle | 12 | 12 | 3 | 3 | 12 | 12 | 3 | 3 |
| Violações de foco | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de controle ou divisor sob hover | 5 | 3 | 3 | 3 | 8 | 4 | 4 | 4 |
| Linhas medidas com limiar | 295 | 320 | 326 | 326 | 295 | 320 | 326 | 326 |
| Linhas informativas | 33 | 43 | 43 | 43 | 33 | 43 | 43 | 43 |
| Nós de texto aprovados (axe) | 956 | 969 | 978 | 1006 | 957 | 970 | 979 | 1007 |
| Elementos não calculáveis | 324 | 292 | 292 | 291 | 324 | 292 | 292 | 291 |
| Células com rolagem horizontal | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Alvos menores que 44 px (informativo) | 44 | 71 | 53 | 53 | 44 | 71 | 53 | 53 |
| Textos menores que 12 px (informativo) | 109 | 34 | 58 | 58 | 109 | 34 | 58 | 58 |

| Tema | Texto (estático e hover) | Container | Divisor | Controle | Foco | Hover (controle ou divisor) |
|---|---:|---:|---:|---:|---:|---:|
| tactical | 4 | 76 | 0 | 30 | 0 | 14 |
| corporate | 0 | 76 | 8 | 30 | 0 | 20 |

(Soma dos quatro viewports de cada tema.)

## 3. Matriz de cobertura

15 combinações de tela e estado por 8 colunas de tema e viewport: 120 células esperadas, 120 medidas e 0 não calculáveis.

| Tela (estado) | tactical 375 | tactical 768 | tactical 1280 | tactical 1440 | corporate 375 | corporate 768 | corporate 1280 | corporate 1440 |
|---|---|---|---|---|---|---|---|---|
| Missões (limpo) | medida | medida | medida | medida | medida | medida | medida | medida |
| Aulas (limpo) | medida | medida | medida | medida | medida | medida | medida | medida |
| Caderno (limpo) | medida | medida | medida | medida | medida | medida | medida | medida |
| Mentor (limpo) | medida | medida | medida | medida | medida | medida | medida | medida |
| Credencial (limpo) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: ITSM (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: Chat (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: SimuDesk (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: KB (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: ITSM (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: Chat (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: SimuDesk (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |
| Laboratório: KB (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |
| Juiz 360 e Replay (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |
| Credencial (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida |

## 4. Violações medidas

Cada grupo reúne elementos com o mesmo tema, seletor, par de cores e razão. O arquivo 10_linha_de_base.json traz todas as linhas, uma por elemento distinto, tela, estado, tema e viewport. Esse JSON (1,7 MB) deixa de ser versionado no fechamento do ciclo 2 e continua no histórico do commit 2d29ef6; para regerá-lo, rode a spec de contraste e depois node e2e/contraste.relatorio.mjs.

### 4.1 Texto (axe)

1 grupos distintos (4 linhas, uma por elemento distinto por célula).

| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |
|---|---|---|---|---|---|---|---|
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | button[aria-current="true"] > span:nth-child(2) > .d-block.muted | texto #8593a8 sobre fundo #0c4a6e | 3,03 | 4,5:1 | 4 |

### 4.2 Contorno de container

24 grupos distintos (152 linhas, uma por elemento distinto por célula).

| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |
|---|---|---|---|---|---|---|---|
| corporate | 375, 768, 1280, 1440 | Missões (limpo); Mentor (limpo) | section.edu-card.card-b | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 12 |
| corporate | 375, 768, 1280, 1440 | Missões (limpo) | details.glossary-details | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 4 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | nav.edu-card.card-b | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 4 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | article.edu-card | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 4 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | aside.edu-card.card-b.notes-col | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 4 |
| corporate | 375, 768, 1280, 1440 | Caderno (limpo); Mentor (limpo) | aside.edu-card.card-b | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 8 |
| corporate | 375, 768, 1280, 1440 | Caderno (limpo) | article.edu-card.editor | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 4 |
| corporate | 375, 768, 1280, 1440 | Laboratório: Chat (missão iniciada); Laboratório: Chat (turno concluído) | section.panel.chat-conversa | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 8 |
| corporate | 375, 768, 1280, 1440 | Laboratório: Chat (missão iniciada); Laboratório: Chat (turno concluído) | section.panel.chat-lateral | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 8 |
| corporate | 375, 768, 1280, 1440 | Laboratório: SimuDesk (missão iniciada); Laboratório: SimuDesk (turno concluído) | section.panel.simudesk-conexao | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 8 |
| corporate | 375, 768, 1280, 1440 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | section.panel | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 2 | 8 |
| corporate | 375, 768, 1280, 1440 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | article.card-section.kb-article | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 2 | 208 |
| tactical | 375, 768, 1280, 1440 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | article.card-section.kb-article | borda #334155 (border-subtle) sobre #0F172A (surface) | 1,72 | 2 | 208 |
| tactical | 375, 768, 1280, 1440 | Missões (limpo); Mentor (limpo) | section.edu-card.card-b | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 12 |
| tactical | 375, 768, 1280, 1440 | Missões (limpo) | details.glossary-details | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 4 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | nav.edu-card.card-b | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 4 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | article.edu-card | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 4 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | aside.edu-card.card-b.notes-col | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 4 |
| tactical | 375, 768, 1280, 1440 | Caderno (limpo); Mentor (limpo) | aside.edu-card.card-b | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 8 |
| tactical | 375, 768, 1280, 1440 | Caderno (limpo) | article.edu-card.editor | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 4 |
| tactical | 375, 768, 1280, 1440 | Laboratório: Chat (missão iniciada); Laboratório: Chat (turno concluído) | section.panel.chat-conversa | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 8 |
| tactical | 375, 768, 1280, 1440 | Laboratório: Chat (missão iniciada); Laboratório: Chat (turno concluído) | section.panel.chat-lateral | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 8 |
| tactical | 375, 768, 1280, 1440 | Laboratório: SimuDesk (missão iniciada); Laboratório: SimuDesk (turno concluído) | section.panel.simudesk-conexao | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 8 |
| tactical | 375, 768, 1280, 1440 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | section.panel | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 2 | 8 |

### 4.3 Divisor

2 grupos distintos (8 linhas, uma por elemento distinto por célula).

| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |
|---|---|---|---|---|---|---|---|
| corporate | 375, 768, 1280, 1440 | Missões (limpo) | div.missao-linha.current | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 1,4 | 4 |
| corporate | 375, 768, 1280, 1440 | Missões (limpo) | div.missao-linha | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 1,4 | 12 |

### 4.4 Controle (borda ou preenchimento)

8 grupos distintos (60 linhas, uma por elemento distinto por célula).

| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |
|---|---|---|---|---|---|---|---|
| corporate | 375, 768 | Laboratório: ITSM (missão iniciada); Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: KB (missão iniciada); Laboratório: ITSM (turno concluído); Laboratório: Chat (turno concluído); Laboratório: SimuDesk (turno concluído); Laboratório: KB (turno concluído); Juiz 360 e Replay (turno concluído) | button.lab-guia-alternar | borda #E2E8F0 (border-subtle) sobre #F8FAFC (canvas) | 1,18 | 3 | 18 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-cues.block.xs | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 3 | 4 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-notes.block | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 3 | 4 |
| corporate | 375, 768, 1280, 1440 | Mentor (limpo) | button | borda #CBD5E1 (border-strong) sobre #FFFFFF (surface) | 1,48 | 3 | 24 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-cues.block.xs | borda #334155 (border-subtle) sobre #0F172A (surface) | 1,72 | 3 | 4 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-notes.block | borda #334155 (border-subtle) sobre #0F172A (surface) | 1,72 | 3 | 4 |
| tactical | 375, 768 | Laboratório: ITSM (missão iniciada); Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: KB (missão iniciada); Laboratório: ITSM (turno concluído); Laboratório: Chat (turno concluído); Laboratório: SimuDesk (turno concluído); Laboratório: KB (turno concluído); Juiz 360 e Replay (turno concluído) | button.lab-guia-alternar | borda #334155 (border-subtle) sobre #0B1120 (canvas) | 1,82 | 3 | 18 |
| tactical | 375, 768, 1280, 1440 | Mentor (limpo) | button | borda #475569 (border-strong) sobre #0F172A (surface) | 2,36 | 3 | 24 |

### 4.5 Foco

Nenhuma violação medida.

### 4.6 Controle e divisor sob hover

10 grupos distintos (34 linhas, uma por elemento distinto por célula).

| Tema | Viewports | Telas (estado) | Seletor | Par de cores | Razão | Limiar | Elementos |
|---|---|---|---|---|---|---|---|
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-cues.block.xs | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 3 | 4 |
| corporate | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-notes.block | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 3 | 4 |
| corporate | 375, 768, 1280, 1440 | Missões (limpo) | button.missao-escolha[role=radio] | borda #CBD5E1 (border-strong) sobre #FFFFFF (surface) | 1,48 | 3 | 4 |
| corporate | 375 | Laboratório: SimuDesk (missão iniciada); Laboratório: SimuDesk (turno concluído) | button.dock-btn | borda #CBD5E1 (border-strong) sobre #FFFFFF (surface) | 1,48 | 3 | 2 |
| corporate | 375, 768, 1280, 1440 | Missões (limpo) | div.missao-linha.current | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 1,4 | 4 |
| corporate | 375 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | tr | borda #E2E8F0 (border-subtle) sobre #FFFFFF (surface) | 1,23 | 1,4 | 2 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-cues.block.xs | borda #334155 (border-subtle) sobre #0F172A (surface) | 1,72 | 3 | 4 |
| tactical | 375, 768, 1280, 1440 | Aulas (limpo) | textarea#as-notes.block | borda #334155 (border-subtle) sobre #0F172A (surface) | 1,72 | 3 | 4 |
| tactical | 375, 768, 1280, 1440 | Missões (limpo) | button.missao-escolha[role=radio] | borda #475569 (border-strong) sobre #0F172A (surface) | 2,36 | 3 | 4 |
| tactical | 375 | Laboratório: SimuDesk (missão iniciada); Laboratório: SimuDesk (turno concluído) | button.dock-btn | borda #475569 (border-strong) sobre #0F172A (surface) | 2,36 | 3 | 2 |

## 5. Matriz de tokens

Razões calculadas a partir dos valores dos tokens lidos da página em cada tema (getComputedStyle da raiz). Referência para a E5.

| Tema | Token | Cor | Fundo | Cor do fundo | Razão | Limiar | Situação |
|---|---|---|---|---|---:|---:|---|
| tactical | text-primary | #F8FAFC | surface | #0F172A | 17,06 | 4,5 | atende (texto 4,5:1) |
| tactical | text-primary | #F8FAFC | canvas | #0B1120 | 18 | 4,5 | atende (texto 4,5:1) |
| tactical | text-primary | #F8FAFC | elevated | #1E293B | 13,98 | 4,5 | atende (texto 4,5:1) |
| tactical | text-primary | #F8FAFC | hover | #273449 | 11,99 | 4,5 | atende (texto 4,5:1) |
| tactical | text-secondary | #94A3B8 | surface | #0F172A | 6,96 | 4,5 | atende (texto 4,5:1) |
| tactical | text-secondary | #94A3B8 | canvas | #0B1120 | 7,34 | 4,5 | atende (texto 4,5:1) |
| tactical | text-secondary | #94A3B8 | elevated | #1E293B | 5,71 | 4,5 | atende (texto 4,5:1) |
| tactical | text-secondary | #94A3B8 | hover | #273449 | 4,89 | 4,5 | atende (texto 4,5:1) |
| tactical | text-muted | #8593A8 | surface | #0F172A | 5,73 | 4,5 | atende (texto 4,5:1) |
| tactical | text-muted | #8593A8 | canvas | #0B1120 | 6,04 | 4,5 | atende (texto 4,5:1) |
| tactical | text-muted | #8593A8 | elevated | #1E293B | 4,69 | 4,5 | atende (texto 4,5:1) |
| tactical | text-muted | #8593A8 | hover | #273449 | 4,02 | 4,5 | não atende (texto 4,5:1) |
| tactical | accent-text | #7DD3FC | surface | #0F172A | 10,71 | 4,5 | atende (texto 4,5:1) |
| tactical | accent-text | #7DD3FC | canvas | #0B1120 | 11,29 | 4,5 | atende (texto 4,5:1) |
| tactical | accent-text | #7DD3FC | elevated | #1E293B | 8,77 | 4,5 | atende (texto 4,5:1) |
| tactical | accent-text | #7DD3FC | hover | #273449 | 7,53 | 4,5 | atende (texto 4,5:1) |
| tactical | border-control | #64748B | surface | #0F172A | 3,75 | 3 | atende (controle e foco 3:1) |
| tactical | border-control | #64748B | canvas | #0B1120 | 3,96 | 3 | atende (controle e foco 3:1) |
| tactical | border-control | #64748B | elevated | #1E293B | 3,07 | 3 | atende (controle e foco 3:1) |
| tactical | border-control | #64748B | hover | #273449 | 2,64 | 3 | não atende (controle e foco 3:1) |
| tactical | focus-ring | #38BDF8 | surface | #0F172A | 8,33 | 3 | atende (controle e foco 3:1) |
| tactical | focus-ring | #38BDF8 | canvas | #0B1120 | 8,79 | 3 | atende (controle e foco 3:1) |
| tactical | focus-ring | #38BDF8 | elevated | #1E293B | 6,83 | 3 | atende (controle e foco 3:1) |
| tactical | focus-ring | #38BDF8 | hover | #273449 | 5,86 | 3 | atende (controle e foco 3:1) |
| tactical | border-strong | #475569 | surface | #0F172A | 2,36 | 2 | atende (contorno de container 2,0:1) |
| tactical | border-strong | #475569 | canvas | #0B1120 | 2,48 | 2 | atende (contorno de container 2,0:1) |
| tactical | border-strong | #475569 | elevated | #1E293B | 1,93 | - | informativo (informativo) |
| tactical | border-strong | #475569 | hover | #273449 | 1,66 | - | informativo (informativo) |
| tactical | border-subtle | #334155 | surface | #0F172A | 1,72 | 1,71 | atende (divisor sem regressão) |
| tactical | border-subtle | #334155 | canvas | #0B1120 | 1,82 | 1,81 | atende (divisor sem regressão) |
| tactical | border-subtle | #334155 | elevated | #1E293B | 1,41 | - | informativo (informativo) |
| tactical | border-subtle | #334155 | hover | #273449 | 1,21 | - | informativo (informativo) |
| corporate | text-primary | #0F172A | surface | #FFFFFF | 17,85 | 4,5 | atende (texto 4,5:1) |
| corporate | text-primary | #0F172A | canvas | #F8FAFC | 17,06 | 4,5 | atende (texto 4,5:1) |
| corporate | text-primary | #0F172A | elevated | #F1F5F9 | 16,3 | 4,5 | atende (texto 4,5:1) |
| corporate | text-primary | #0F172A | hover | #E2E8F0 | 14,48 | 4,5 | atende (texto 4,5:1) |
| corporate | text-secondary | #475569 | surface | #FFFFFF | 7,58 | 4,5 | atende (texto 4,5:1) |
| corporate | text-secondary | #475569 | canvas | #F8FAFC | 7,24 | 4,5 | atende (texto 4,5:1) |
| corporate | text-secondary | #475569 | elevated | #F1F5F9 | 6,92 | 4,5 | atende (texto 4,5:1) |
| corporate | text-secondary | #475569 | hover | #E2E8F0 | 6,15 | 4,5 | atende (texto 4,5:1) |
| corporate | text-muted | #5E6E84 | surface | #FFFFFF | 5,2 | 4,5 | atende (texto 4,5:1) |
| corporate | text-muted | #5E6E84 | canvas | #F8FAFC | 4,97 | 4,5 | atende (texto 4,5:1) |
| corporate | text-muted | #5E6E84 | elevated | #F1F5F9 | 4,75 | 4,5 | atende (texto 4,5:1) |
| corporate | text-muted | #5E6E84 | hover | #E2E8F0 | 4,22 | 4,5 | não atende (texto 4,5:1) |
| corporate | accent-text | #0B6E8A | surface | #FFFFFF | 5,81 | 4,5 | atende (texto 4,5:1) |
| corporate | accent-text | #0B6E8A | canvas | #F8FAFC | 5,56 | 4,5 | atende (texto 4,5:1) |
| corporate | accent-text | #0B6E8A | elevated | #F1F5F9 | 5,31 | 4,5 | atende (texto 4,5:1) |
| corporate | accent-text | #0B6E8A | hover | #E2E8F0 | 4,72 | 4,5 | atende (texto 4,5:1) |
| corporate | border-control | #64748B | surface | #FFFFFF | 4,76 | 3 | atende (controle e foco 3:1) |
| corporate | border-control | #64748B | canvas | #F8FAFC | 4,55 | 3 | atende (controle e foco 3:1) |
| corporate | border-control | #64748B | elevated | #F1F5F9 | 4,34 | 3 | atende (controle e foco 3:1) |
| corporate | border-control | #64748B | hover | #E2E8F0 | 3,86 | 3 | atende (controle e foco 3:1) |
| corporate | focus-ring | #0B6E8A | surface | #FFFFFF | 5,81 | 3 | atende (controle e foco 3:1) |
| corporate | focus-ring | #0B6E8A | canvas | #F8FAFC | 5,56 | 3 | atende (controle e foco 3:1) |
| corporate | focus-ring | #0B6E8A | elevated | #F1F5F9 | 5,31 | 3 | atende (controle e foco 3:1) |
| corporate | focus-ring | #0B6E8A | hover | #E2E8F0 | 4,72 | 3 | atende (controle e foco 3:1) |
| corporate | border-strong | #CBD5E1 | surface | #FFFFFF | 1,48 | 2 | não atende (contorno de container 2,0:1) |
| corporate | border-strong | #CBD5E1 | canvas | #F8FAFC | 1,42 | 2 | não atende (contorno de container 2,0:1) |
| corporate | border-strong | #CBD5E1 | elevated | #F1F5F9 | 1,36 | - | informativo (informativo) |
| corporate | border-strong | #CBD5E1 | hover | #E2E8F0 | 1,2 | - | informativo (informativo) |
| corporate | border-subtle | #E2E8F0 | surface | #FFFFFF | 1,23 | 1,4 | não atende (divisor 1,4:1) |
| corporate | border-subtle | #E2E8F0 | canvas | #F8FAFC | 1,18 | 1,4 | não atende (divisor 1,4:1) |
| corporate | border-subtle | #E2E8F0 | elevated | #F1F5F9 | 1,13 | - | informativo (informativo) |
| corporate | border-subtle | #E2E8F0 | hover | #E2E8F0 | 1 | - | informativo (informativo) |

## 6. Elementos não calculáveis

Elementos que a medição não consegue avaliar, com o motivo. Não são aprovações nem reprovações.

### Por motivo

| Motivo | Elementos (soma sobre as células) |
|---|---|
| sem borda nem preenchimento próprios (identificado por texto ou ícone) | 1994 |
| oculto (display, visibility, opacidade 0 ou tamanho zero) | 162 |
| sem borda computada (largura 0) | 64 |
| desabilitado (isento de contraste) | 64 |
| controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | 48 |
| controle nativo (file), borda e preenchimento não calculáveis pelo estilo computado | 32 |
| elemento parcialmente coberto | 16 |
| controle nativo (range), borda e preenchimento não calculáveis pelo estilo computado | 16 |
| texto curto demais para avaliar | 2 |

### Por elemento

40 grupos distintos (categoria, motivo e seletor), do mais frequente ao menos frequente.

| Categoria | Seletor | Motivo | Temas | Viewports | Telas (estado) | Elementos |
|---|---|---|---|---|---|---|
| controle | button.nav-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Missões (limpo); Aulas (limpo); Caderno (limpo); Mentor (limpo); e mais 11 | 576 |
| controle | button.kb-titulo-btn | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | 432 |
| controle | button.botao-contexto | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Missões (limpo); Aulas (limpo); Caderno (limpo); Mentor (limpo); e mais 11 | 336 |
| controle | button.dock-btn | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Laboratório: ITSM (missão iniciada); Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: KB (missão iniciada); e mais 5 | 288 |
| controle | button.alternador-tema-opcao | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 768, 1280, 1440 | Missões (limpo); Aulas (limpo); Caderno (limpo); Mentor (limpo); e mais 11 | 90 |
| controle | button.tempo-botao | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Juiz 360 e Replay (turno concluído) | 64 |
| controle | button.alternador-tema-opcao | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 375 | Missões (limpo); Aulas (limpo); Caderno (limpo); Mentor (limpo); e mais 11 | 60 |
| controle | button.btn.btn-ghost.btn-sm | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Aulas (limpo); Caderno (limpo) | 56 |
| controle | button.btn-primary | desabilitado (isento de contraste) | corporate, tactical | 375, 768, 1280, 1440 | Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: Chat (turno concluído); Laboratório: SimuDesk (turno concluído) | 48 |
| controle | summary | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Missões (limpo); Juiz 360 e Replay (turno concluído); Credencial (turno concluído) | 40 |
| controle | button.lab-guia-alternar | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 1280, 1440 | Laboratório: ITSM (missão iniciada); Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: KB (missão iniciada); e mais 5 | 36 |
| controle | button.missao-escolha[role=radio] | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Missões (limpo) | 32 |
| controle | input[type=file] | controle nativo (file), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Credencial (limpo); Credencial (turno concluído) | 32 |
| controle | button.lesson-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Aulas (limpo) | 24 |
| controle | button.tree-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 24 |
| controle | button.nav-item | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 375 | Missões (limpo); Aulas (limpo); Caderno (limpo); Mentor (limpo); e mais 8 | 24 |
| controle | button.btn.btn-primary.btn-sm | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 375, 768 | Laboratório: ITSM (turno concluído); Laboratório: Chat (turno concluído); Laboratório: SimuDesk (turno concluído); Laboratório: KB (turno concluído); e mais 1 | 20 |
| divisor | div.missao-linha | sem borda computada (largura 0) | corporate, tactical | 375, 768, 1280, 1440 | Missões (limpo) | 16 |
| controle | input#ed-title.title-input[type=text] | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 16 |
| controle | input#td-0[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 16 |
| controle | button.tab[role=tab] | sem borda nem preenchimento próprios (identificado por texto ou ícone) | corporate, tactical | 375, 768, 1280, 1440 | Mentor (limpo) | 16 |
| container | table.tabela-dados.fila-chamados | sem borda computada (largura 0) | corporate, tactical | 375, 768, 1280, 1440 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | 16 |
| controle | button.btn-neutro | desabilitado (isento de contraste) | corporate, tactical | 375, 768, 1280, 1440 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | 16 |
| controle | input#replay-range[type=range] | controle nativo (range), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Juiz 360 e Replay (turno concluído) | 16 |
| divisor | table.tabela-dados.fila-chamados > td | sem borda computada (largura 0) | corporate, tactical | 375 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | 16 |
| controle | button.btn.btn-secondary.btn-sm | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 375, 768 | Laboratório: ITSM (missão iniciada); Laboratório: Chat (missão iniciada); Laboratório: SimuDesk (missão iniciada); Laboratório: KB (missão iniciada) | 16 |
| divisor | tr | sem borda computada (largura 0) | corporate, tactical | 768, 1280, 1440 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | 12 |
| controle | input#td-1[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 8 |
| controle | input#td-2[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 8 |
| controle | input#td-3[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 8 |
| controle | input#td-4[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | corporate, tactical | 375, 768, 1280, 1440 | Caderno (limpo) | 8 |
| controle | button.nav-item.active | oculto (display, visibility, opacidade 0 ou tamanho zero) | corporate, tactical | 375 | Credencial (limpo); Juiz 360 e Replay (turno concluído); Credencial (turno concluído) | 6 |
| divisor | table.tabela-dados.fila-chamados > td.dado-mono | sem borda computada (largura 0) | corporate, tactical | 375 | Laboratório: ITSM (missão iniciada); Laboratório: ITSM (turno concluído) | 4 |
| texto (axe) | .dock-btn[type="button"]:nth-child(2) > span:nth-child(2) | elemento parcialmente coberto | corporate, tactical | 375 | Laboratório: SimuDesk (missão iniciada); Laboratório: SimuDesk (turno concluído) | 4 |
| texto (axe) | .dock-btn:nth-child(3) > span:nth-child(2) | elemento parcialmente coberto | corporate, tactical | 375 | Laboratório: KB (missão iniciada); Laboratório: KB (turno concluído) | 4 |
| texto (axe) | .dock-btn:nth-child(1) > span:nth-child(2) | elemento parcialmente coberto | corporate, tactical | 1280 | Juiz 360 e Replay (turno concluído) | 2 |
| texto (axe) | .tab[role="tab"][type="button"]:nth-child(2) | elemento parcialmente coberto | corporate, tactical | 375 | Mentor (limpo) | 2 |
| texto (axe) | .tab[role="tab"][type="button"]:nth-child(3) | elemento parcialmente coberto | corporate, tactical | 375 | Mentor (limpo) | 2 |
| texto (axe) | .dock-btn:nth-child(3) > .dock-contagem | elemento parcialmente coberto | corporate, tactical | 375 | Juiz 360 e Replay (turno concluído) | 2 |
| texto (axe) | .dock-btn:nth-child(1) > .dock-contagem.dado-mono | texto curto demais para avaliar | corporate, tactical | 768 | Juiz 360 e Replay (turno concluído) | 2 |

## 7. Medidas informativas

Rolagem horizontal: nenhuma célula medida tem rolagem horizontal.

Alvos menores que 44 px e textos menores que 12 px estão por célula no JSON (campo informativas, com exemplos). Os totais por tema e viewport estão na seção 2.

## 8. Limitações

- Hover e foco são amostras (6 e 12 elementos distintos por célula, conteúdo primeiro), não varredura completa.
- Axe mede o estado da página no instante da medição. Menus, diálogos e estados de erro fora do roteiro não são cobertos.
- Controle só com preenchimento (sem borda) é informativo: o limiar de 3:1 só vale para controles que têm borda visível. O mesmo vale para rádio e caixa de seleção nativos, cuja borda não aparece no estilo computado.
- O fundo de elemento com opacidade menor que 1, imagem ou gradiente não é calculado, vai para a lista de não calculáveis.
- Pseudo-elementos (por exemplo o botão do seletor de arquivo) não entram no estilo computado do elemento. O axe os trata como conteúdo de pseudo-elemento quando os encontra.
- O tactical foi medido de forma completa nesta etapa, mas só dois PNG dele foram inspecionados no ciclo 1. A inspeção visual dos dois temas fica para a E6.
- Zoom em 200 por cento e leitor de tela não fazem parte desta etapa (verificação manual da E7).
