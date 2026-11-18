# Linha de base de contraste e contorno dos temas

Gerado em 2026-11-18T11:27:11.955Z por e2e/contraste.relatorio.mjs, a partir dos JSON de test-results/contraste/. A Spec_de_Contraste falha por violação nas categorias da WCAG 2.2 AA abaixo, então este relatório descreve o estado medido, não pendências aceitas. Branch jornada-de-voo, commit 65bfea4.

## 1. Ambiente e método

| Item | Valor |
|---|---|
| Chromium | 159.0.8154.6 |
| Node | v24.19.0 |
| Playwright | 1.65.1 |
| axe-core | 4.14.0 (regra color-contrast no contraste padrão e color-contrast-enhanced no alto contraste, injetado por page.addScriptTag) |
| Projetos | desktop-1280, desktop-1440, mobile-375, tablet-768 |
| Telas | 18 (Início, Plano de voo, Check-in, Check-in rápido, Brevê, Hangar, Aulas, Treino de explicação, Caderno, Comandante, Página não encontrada, Painel de Aparência, Cabine: ITSM, Cabine: Chat, Cabine: SimuDesk, Cabine: KB, Caixa-preta, Cabine: SimuDesk com terminal) |
| Estados | limpo, modo de demonstração ativo, painel de aparência aberto, missão iniciada e turno concluído |
| Temas | operacao, corporativo, editorial, acolhedor, cada um com contraste padrão e, em mobile-375 e desktop-1440, alto contraste |
| Viewports | 375, 768, 1280 e 1440 de largura |

Método:

- Texto: regra color-contrast do axe-core no Chromium real (color-contrast-enhanced, 7:1, no alto contraste), na página inteira e de novo na subárvore de cada elemento sob hover. Elementos que o axe não consegue avaliar (incomplete) vão para a lista de não calculáveis com o motivo do axe.
- Contorno: getComputedStyle da borda contra o fundo opaco efetivo do ancestral, compondo camadas translúcidas. Containers: .edu-card, .panel, .glossary-details, .card-section, table e os cartões da jornada. Divisores: th, td e .itsm-nota. Controles: button, input, select, textarea e summary.
- Foco: até 12 elementos distintos por célula, conteúdo antes da casca. Foco programático depois de uma tecla, para que :focus-visible case. Mede a cor do anel (outline) contra o fundo do ancestral.
- Hover: até 6 elementos distintos por célula, mouse sobre o centro do elemento, sem transições, medindo borda e preenchimento e rodando o axe na subárvore.
- Texto abaixo de 12 px, status sem texto nem svg.icone e cores do terminal (.terminal-shell e .terminal-output contra --bg-canvas e --text-primary do bloco operacao ou do conjunto escuro de alto contraste) também falham a spec.
- Páginas reutilizadas: uma página por projeto, tema, contraste e grupo. Backend local com limite de 5000 requisições por minuto só no processo dele.
- Limiares: texto 4,5:1 (grande 3:1, vindo do axe; 7:1 no alto contraste); controles e foco 3:1; contorno de container 2,0:1 sobre surface e canvas; divisor 1,4:1 e, no operacao com contraste padrão, sem regressão (1,71 surface e 1,81 canvas); fundo elevated e hover só informativo para container e divisor.
- Papel por seletor, não por token: o contorno de container é avaliado pelo papel do elemento, seja qual for o token que a regra CSS usa.

## 2. Totais por tema e viewport

Contagem de elementos distintos por célula (tela e estado). O mesmo componente que aparece em duas telas conta nas duas. Linhas informativas são as sem limiar aplicável (fundo elevated ou hover, controle só com preenchimento).

| Métrica | operacao (padrao) 375 | operacao (padrao) 768 | operacao (padrao) 1280 | operacao (padrao) 1440 | operacao (alto) 375 | operacao (alto) 1440 | corporativo (padrao) 375 | corporativo (padrao) 768 | corporativo (padrao) 1280 | corporativo (padrao) 1440 | corporativo (alto) 375 | corporativo (alto) 1440 | editorial (padrao) 375 | editorial (padrao) 768 | editorial (padrao) 1280 | editorial (padrao) 1440 | editorial (alto) 375 | editorial (alto) 1440 | acolhedor (padrao) 375 | acolhedor (padrao) 768 | acolhedor (padrao) 1280 | acolhedor (padrao) 1440 | acolhedor (alto) 375 | acolhedor (alto) 1440 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Células medidas | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 | 25 |
| Células não calculáveis | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de texto (axe, estático) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de texto (axe, hover) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de contorno de container | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de divisor | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de controle | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de foco | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Violações de controle ou divisor sob hover | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Linhas medidas com limiar | 555 | 543 | 547 | 547 | 476 | 470 | 526 | 516 | 520 | 520 | 476 | 470 | 555 | 543 | 547 | 547 | 476 | 470 | 526 | 516 | 520 | 520 | 476 | 470 |
| Linhas informativas | 38 | 36 | 36 | 36 | 116 | 112 | 67 | 63 | 63 | 63 | 116 | 112 | 38 | 36 | 36 | 36 | 116 | 112 | 67 | 63 | 63 | 63 | 116 | 112 |
| Nós de texto aprovados (axe) | 1699 | 1673 | 1759 | 1763 | 1709 | 1763 | 1699 | 1673 | 1759 | 1763 | 1709 | 1763 | 1699 | 1670 | 1733 | 1753 | 1709 | 1756 | 1700 | 1671 | 1745 | 1757 | 1710 | 1757 |
| Elementos não calculáveis | 302 | 290 | 287 | 287 | 292 | 287 | 302 | 290 | 287 | 287 | 292 | 287 | 302 | 293 | 296 | 290 | 292 | 287 | 301 | 292 | 287 | 287 | 291 | 287 |
| Células com rolagem horizontal | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Alvos menores que 44 px (informativo) | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 | 23 |
| Textos menores que 12 px | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Status sem texto nem ícone | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Cores do terminal fora do esperado | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

| Tema (contraste) | Texto (estático e hover) | Container | Divisor | Controle | Foco | Hover (controle ou divisor) |
|---|---:|---:|---:|---:|---:|---:|
| operacao (padrao) | 0 | 0 | 0 | 0 | 0 | 0 |
| operacao (alto) | 0 | 0 | 0 | 0 | 0 | 0 |
| corporativo (padrao) | 0 | 0 | 0 | 0 | 0 | 0 |
| corporativo (alto) | 0 | 0 | 0 | 0 | 0 | 0 |
| editorial (padrao) | 0 | 0 | 0 | 0 | 0 | 0 |
| editorial (alto) | 0 | 0 | 0 | 0 | 0 | 0 |
| acolhedor (padrao) | 0 | 0 | 0 | 0 | 0 | 0 |
| acolhedor (alto) | 0 | 0 | 0 | 0 | 0 | 0 |

(Soma dos viewports medidos de cada tema e contraste.)

## 3. Matriz de cobertura

25 combinações de tela e estado por 24 colunas de tema e viewport: 600 células esperadas, 600 medidas e 0 não calculáveis.

| Tela (estado) | operacao (padrao) 375 | operacao (padrao) 768 | operacao (padrao) 1280 | operacao (padrao) 1440 | operacao (alto) 375 | operacao (alto) 1440 | corporativo (padrao) 375 | corporativo (padrao) 768 | corporativo (padrao) 1280 | corporativo (padrao) 1440 | corporativo (alto) 375 | corporativo (alto) 1440 | editorial (padrao) 375 | editorial (padrao) 768 | editorial (padrao) 1280 | editorial (padrao) 1440 | editorial (alto) 375 | editorial (alto) 1440 | acolhedor (padrao) 375 | acolhedor (padrao) 768 | acolhedor (padrao) 1280 | acolhedor (padrao) 1440 | acolhedor (alto) 375 | acolhedor (alto) 1440 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Início (modo de demonstração ativo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Plano de voo (modo de demonstração ativo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Início (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Check-in (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Check-in rápido (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Plano de voo (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Brevê (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Hangar (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Aulas (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Treino de explicação (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Caderno (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Comandante (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Página não encontrada (limpo) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Painel de Aparência (painel de aparência aberto) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: ITSM (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: Chat (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: SimuDesk (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: KB (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: ITSM (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: Chat (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: SimuDesk (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: KB (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Caixa-preta (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Brevê (turno concluído) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |
| Cabine: SimuDesk com terminal (missão iniciada) | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida | medida |

## 4. Violações medidas

Cada grupo reúne elementos com o mesmo tema, seletor, par de cores e razão. O arquivo LINHA_DE_BASE_TEMAS.json (cerca de 8 MB, gerado localmente por este script e fora do Git) traz todas as linhas, uma por elemento distinto, tela, estado, tema e viewport.

### 4.1 Texto (axe)

Nenhuma violação medida.

### 4.2 Contorno de container

Nenhuma violação medida.

### 4.3 Divisor

Nenhuma violação medida.

### 4.4 Controle (borda ou preenchimento)

Nenhuma violação medida.

### 4.5 Foco

Nenhuma violação medida.

### 4.6 Controle e divisor sob hover

Nenhuma violação medida.

### 4.7 Texto abaixo de 12 px, status sem cor e terminal

Nenhuma violação medida.

## 5. Matriz de tokens

Razões calculadas a partir dos valores dos tokens lidos da página em cada tema e contraste (getComputedStyle da raiz).

| Tema | Token | Cor | Fundo | Cor do fundo | Razão | Limiar | Situação |
|---|---|---|---|---|---:|---:|---|
| operacao (padrao) | text-primary | #F8FAFC | surface | #0F172A | 17,06 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-primary | #F8FAFC | canvas | #0B1120 | 18 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-primary | #F8FAFC | elevated | #1E293B | 13,98 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-primary | #F8FAFC | hover | #273449 | 11,99 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-secondary | #94A3B8 | surface | #0F172A | 6,96 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-secondary | #94A3B8 | canvas | #0B1120 | 7,34 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-secondary | #94A3B8 | elevated | #1E293B | 5,71 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-secondary | #94A3B8 | hover | #273449 | 4,89 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-muted | #8E9DB2 | surface | #0F172A | 6,47 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-muted | #8E9DB2 | canvas | #0B1120 | 6,83 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-muted | #8E9DB2 | elevated | #1E293B | 5,31 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | text-muted | #8E9DB2 | hover | #273449 | 4,55 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | accent-text | #7DD3FC | surface | #0F172A | 10,71 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | accent-text | #7DD3FC | canvas | #0B1120 | 11,29 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | accent-text | #7DD3FC | elevated | #1E293B | 8,77 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | accent-text | #7DD3FC | hover | #273449 | 7,53 | 4,5 | atende (texto 4,5:1) |
| operacao (padrao) | border-control | #858E99 | surface | #0F172A | 5,38 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | border-control | #858E99 | canvas | #0B1120 | 5,67 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | border-control | #858E99 | elevated | #1E293B | 4,41 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | border-control | #858E99 | hover | #273449 | 3,78 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | focus-ring | #38BDF8 | surface | #0F172A | 8,33 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | focus-ring | #38BDF8 | canvas | #0B1120 | 8,79 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | focus-ring | #38BDF8 | elevated | #1E293B | 6,83 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | focus-ring | #38BDF8 | hover | #273449 | 5,86 | 3 | atende (controle e foco 3:1) |
| operacao (padrao) | border-strong | #717C8C | surface | #0F172A | 4,22 | 2 | atende (contorno de container 2,0:1) |
| operacao (padrao) | border-strong | #717C8C | canvas | #0B1120 | 4,45 | 2 | atende (contorno de container 2,0:1) |
| operacao (padrao) | border-strong | #717C8C | elevated | #1E293B | 3,46 | - | informativo (informativo) |
| operacao (padrao) | border-strong | #717C8C | hover | #273449 | 2,97 | - | informativo (informativo) |
| operacao (padrao) | border-subtle | #677588 | surface | #0F172A | 3,81 | 1,71 | atende (divisor sem regressão) |
| operacao (padrao) | border-subtle | #677588 | canvas | #0B1120 | 4,01 | 1,81 | atende (divisor sem regressão) |
| operacao (padrao) | border-subtle | #677588 | elevated | #1E293B | 3,12 | - | informativo (informativo) |
| operacao (padrao) | border-subtle | #677588 | hover | #273449 | 2,67 | - | informativo (informativo) |
| operacao (alto) | text-secondary | #EDEDED | elevated | #141414 | 15,74 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | text-secondary | #EDEDED | hover | #262626 | 12,93 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | text-muted | #D6D6D6 | elevated | #141414 | 12,68 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | text-muted | #D6D6D6 | hover | #262626 | 10,41 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | accent-text | #A6DCFF | elevated | #141414 | 12,55 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | accent-text | #A6DCFF | hover | #262626 | 10,31 | 7 | atende (texto 7:1 (alto contraste)) |
| operacao (alto) | focus-ring | #FFD24D | elevated | #141414 | 12,79 | 3 | atende (controle e foco 3:1) |
| operacao (alto) | focus-ring | #FFD24D | hover | #262626 | 10,51 | 3 | atende (controle e foco 3:1) |
| operacao (alto) | border-strong | #B3B3B3 | elevated | #141414 | 8,79 | - | informativo (informativo) |
| operacao (alto) | border-strong | #B3B3B3 | hover | #262626 | 7,22 | - | informativo (informativo) |
| operacao (alto) | border-subtle | #8C8C8C | elevated | #141414 | 5,48 | - | informativo (informativo) |
| operacao (alto) | border-subtle | #8C8C8C | hover | #262626 | 4,5 | - | informativo (informativo) |
| corporativo (padrao) | text-primary | #0F172A | canvas | #F8FAFC | 17,06 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-primary | #0F172A | elevated | #F1F5F9 | 16,3 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-primary | #0F172A | hover | #E2E8F0 | 14,48 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-secondary | #475569 | canvas | #F8FAFC | 7,24 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-secondary | #475569 | elevated | #F1F5F9 | 6,92 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-secondary | #475569 | hover | #E2E8F0 | 6,15 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-muted | #586980 | canvas | #F8FAFC | 5,36 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-muted | #586980 | elevated | #F1F5F9 | 5,12 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | text-muted | #586980 | hover | #E2E8F0 | 4,55 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | accent-text | #0B6E8A | canvas | #F8FAFC | 5,56 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | accent-text | #0B6E8A | elevated | #F1F5F9 | 5,31 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | accent-text | #0B6E8A | hover | #E2E8F0 | 4,72 | 4,5 | atende (texto 4,5:1) |
| corporativo (padrao) | border-control | #64748B | canvas | #F8FAFC | 4,55 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | border-control | #64748B | elevated | #F1F5F9 | 4,34 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | border-control | #64748B | hover | #E2E8F0 | 3,86 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | focus-ring | #0B6E8A | canvas | #F8FAFC | 5,56 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | focus-ring | #0B6E8A | elevated | #F1F5F9 | 5,31 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | focus-ring | #0B6E8A | hover | #E2E8F0 | 4,72 | 3 | atende (controle e foco 3:1) |
| corporativo (padrao) | border-strong | #7A8595 | canvas | #F8FAFC | 3,57 | 2 | atende (contorno de container 2,0:1) |
| corporativo (padrao) | border-strong | #7A8595 | elevated | #F1F5F9 | 3,41 | - | informativo (informativo) |
| corporativo (padrao) | border-strong | #7A8595 | hover | #E2E8F0 | 3,03 | - | informativo (informativo) |
| corporativo (padrao) | border-subtle | #7D8D9F | canvas | #F8FAFC | 3,25 | 1,4 | atende (divisor 1,4:1) |
| corporativo (padrao) | border-subtle | #7D8D9F | elevated | #F1F5F9 | 3,1 | - | informativo (informativo) |
| corporativo (padrao) | border-subtle | #7D8D9F | hover | #E2E8F0 | 2,76 | - | informativo (informativo) |
| corporativo (alto) | text-secondary | #1A1A1A | elevated | #F2F2F2 | 15,55 | 7 | atende (texto 7:1 (alto contraste)) |
| corporativo (alto) | text-secondary | #1A1A1A | hover | #E6E6E6 | 13,94 | 7 | atende (texto 7:1 (alto contraste)) |
| corporativo (alto) | accent-text | #003E6B | elevated | #F2F2F2 | 9,87 | 7 | atende (texto 7:1 (alto contraste)) |
| corporativo (alto) | accent-text | #003E6B | hover | #E6E6E6 | 8,85 | 7 | atende (texto 7:1 (alto contraste)) |
| corporativo (alto) | border-strong | #4D4D4D | elevated | #F2F2F2 | 7,55 | - | informativo (informativo) |
| corporativo (alto) | border-strong | #4D4D4D | hover | #E6E6E6 | 6,77 | - | informativo (informativo) |
| corporativo (alto) | border-subtle | #6E6E6E | elevated | #F2F2F2 | 4,55 | - | informativo (informativo) |
| corporativo (alto) | border-subtle | #6E6E6E | hover | #E6E6E6 | 4,09 | - | informativo (informativo) |
| editorial (padrao) | text-primary | #F5F2EB | surface | #1C1B1A | 15,38 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-primary | #F5F2EB | canvas | #141414 | 16,48 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-primary | #F5F2EB | elevated | #262523 | 13,7 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-primary | #F5F2EB | hover | #302E2B | 12,11 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-secondary | #C9C2B6 | surface | #1C1B1A | 9,73 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-secondary | #C9C2B6 | canvas | #141414 | 10,42 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-secondary | #C9C2B6 | elevated | #262523 | 8,66 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-secondary | #C9C2B6 | hover | #302E2B | 7,66 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-muted | #ADA597 | surface | #1C1B1A | 7,05 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-muted | #ADA597 | canvas | #141414 | 7,55 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-muted | #ADA597 | elevated | #262523 | 6,28 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | text-muted | #ADA597 | hover | #302E2B | 5,55 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | accent-text | #F0C27F | surface | #1C1B1A | 10,42 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | accent-text | #F0C27F | canvas | #141414 | 11,17 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | accent-text | #F0C27F | elevated | #262523 | 9,28 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | accent-text | #F0C27F | hover | #302E2B | 8,2 | 4,5 | atende (texto 4,5:1) |
| editorial (padrao) | border-control | #8A8681 | surface | #1C1B1A | 4,76 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | border-control | #8A8681 | canvas | #141414 | 5,09 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | border-control | #8A8681 | elevated | #262523 | 4,24 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | border-control | #8A8681 | hover | #302E2B | 3,74 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | focus-ring | #F0C27F | surface | #1C1B1A | 10,42 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | focus-ring | #F0C27F | canvas | #141414 | 11,17 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | focus-ring | #F0C27F | elevated | #262523 | 9,28 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | focus-ring | #F0C27F | hover | #302E2B | 8,2 | 3 | atende (controle e foco 3:1) |
| editorial (padrao) | border-strong | #7A7772 | surface | #1C1B1A | 3,86 | 2 | atende (contorno de container 2,0:1) |
| editorial (padrao) | border-strong | #7A7772 | canvas | #141414 | 4,13 | 2 | atende (contorno de container 2,0:1) |
| editorial (padrao) | border-strong | #7A7772 | elevated | #262523 | 3,43 | - | informativo (informativo) |
| editorial (padrao) | border-strong | #7A7772 | hover | #302E2B | 3,04 | - | informativo (informativo) |
| editorial (padrao) | border-subtle | #73706B | surface | #1C1B1A | 3,49 | 1,4 | atende (divisor 1,4:1) |
| editorial (padrao) | border-subtle | #73706B | canvas | #141414 | 3,74 | 1,4 | atende (divisor 1,4:1) |
| editorial (padrao) | border-subtle | #73706B | elevated | #262523 | 3,11 | - | informativo (informativo) |
| editorial (padrao) | border-subtle | #73706B | hover | #302E2B | 2,75 | - | informativo (informativo) |
| editorial (alto) | text-secondary | #EDEDED | elevated | #141414 | 15,74 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | text-secondary | #EDEDED | hover | #262626 | 12,93 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | text-muted | #D6D6D6 | elevated | #141414 | 12,68 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | text-muted | #D6D6D6 | hover | #262626 | 10,41 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | accent-text | #A6DCFF | elevated | #141414 | 12,55 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | accent-text | #A6DCFF | hover | #262626 | 10,31 | 7 | atende (texto 7:1 (alto contraste)) |
| editorial (alto) | focus-ring | #FFD24D | elevated | #141414 | 12,79 | 3 | atende (controle e foco 3:1) |
| editorial (alto) | focus-ring | #FFD24D | hover | #262626 | 10,51 | 3 | atende (controle e foco 3:1) |
| editorial (alto) | border-strong | #B3B3B3 | elevated | #141414 | 8,79 | - | informativo (informativo) |
| editorial (alto) | border-strong | #B3B3B3 | hover | #262626 | 7,22 | - | informativo (informativo) |
| editorial (alto) | border-subtle | #8C8C8C | elevated | #141414 | 5,48 | - | informativo (informativo) |
| editorial (alto) | border-subtle | #8C8C8C | hover | #262626 | 4,5 | - | informativo (informativo) |
| acolhedor (padrao) | text-primary | #2A2420 | canvas | #FBF8F3 | 14,45 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-primary | #2A2420 | elevated | #F4EFE7 | 13,38 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-primary | #2A2420 | hover | #EAE3D8 | 12,01 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-secondary | #574E45 | canvas | #FBF8F3 | 7,68 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-secondary | #574E45 | elevated | #F4EFE7 | 7,11 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-secondary | #574E45 | hover | #EAE3D8 | 6,38 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-muted | #6A6056 | canvas | #FBF8F3 | 5,8 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-muted | #6A6056 | elevated | #F4EFE7 | 5,36 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | text-muted | #6A6056 | hover | #EAE3D8 | 4,82 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | accent-text | #1A5F59 | canvas | #FBF8F3 | 7,02 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | accent-text | #1A5F59 | elevated | #F4EFE7 | 6,49 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | accent-text | #1A5F59 | hover | #EAE3D8 | 5,83 | 4,5 | atende (texto 4,5:1) |
| acolhedor (padrao) | border-control | #7A6F60 | canvas | #FBF8F3 | 4,64 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | border-control | #7A6F60 | elevated | #F4EFE7 | 4,3 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | border-control | #7A6F60 | hover | #EAE3D8 | 3,86 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | focus-ring | #1F6F68 | canvas | #FBF8F3 | 5,61 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | focus-ring | #1F6F68 | elevated | #F4EFE7 | 5,19 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | focus-ring | #1F6F68 | hover | #EAE3D8 | 4,67 | 3 | atende (controle e foco 3:1) |
| acolhedor (padrao) | border-strong | #887F71 | canvas | #FBF8F3 | 3,73 | 2 | atende (contorno de container 2,0:1) |
| acolhedor (padrao) | border-strong | #887F71 | elevated | #F4EFE7 | 3,45 | - | informativo (informativo) |
| acolhedor (padrao) | border-strong | #887F71 | hover | #EAE3D8 | 3,1 | - | informativo (informativo) |
| acolhedor (padrao) | border-subtle | #938673 | canvas | #FBF8F3 | 3,36 | 1,4 | atende (divisor 1,4:1) |
| acolhedor (padrao) | border-subtle | #938673 | elevated | #F4EFE7 | 3,11 | - | informativo (informativo) |
| acolhedor (padrao) | border-subtle | #938673 | hover | #EAE3D8 | 2,79 | - | informativo (informativo) |
| acolhedor (alto) | text-secondary | #1A1A1A | elevated | #F2F2F2 | 15,55 | 7 | atende (texto 7:1 (alto contraste)) |
| acolhedor (alto) | text-secondary | #1A1A1A | hover | #E6E6E6 | 13,94 | 7 | atende (texto 7:1 (alto contraste)) |
| acolhedor (alto) | accent-text | #003E6B | elevated | #F2F2F2 | 9,87 | 7 | atende (texto 7:1 (alto contraste)) |
| acolhedor (alto) | accent-text | #003E6B | hover | #E6E6E6 | 8,85 | 7 | atende (texto 7:1 (alto contraste)) |
| acolhedor (alto) | border-strong | #4D4D4D | elevated | #F2F2F2 | 7,55 | - | informativo (informativo) |
| acolhedor (alto) | border-strong | #4D4D4D | hover | #E6E6E6 | 6,77 | - | informativo (informativo) |
| acolhedor (alto) | border-subtle | #6E6E6E | elevated | #F2F2F2 | 4,55 | - | informativo (informativo) |
| acolhedor (alto) | border-subtle | #6E6E6E | hover | #E6E6E6 | 4,09 | - | informativo (informativo) |

## 6. Elementos não calculáveis

Elementos que a medição não consegue avaliar, com o motivo. Não são aprovações nem reprovações.

### Por motivo

| Motivo | Elementos (soma sobre as células) |
|---|---|
| sem borda nem preenchimento próprios (identificado por texto ou ícone) | 4944 |
| oculto (display, visibility, opacidade 0 ou tamanho zero) | 664 |
| controle nativo (radio), borda e preenchimento não calculáveis pelo estilo computado | 504 |
| desabilitado (isento de contraste) | 360 |
| controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | 168 |
| sem borda computada (largura 0) | 160 |
| controle nativo (file), borda e preenchimento não calculáveis pelo estilo computado | 48 |
| controle nativo (range), borda e preenchimento não calculáveis pelo estilo computado | 48 |
| elemento parcialmente coberto | 37 |
| elemento não recebeu hover (coberto ou fora da tela) | 28 |
| sobreposição por outro elemento | 28 |
| conteúdo de pseudo-elemento | 6 |

### Por elemento

50 grupos distintos (categoria, motivo e seletor), do mais frequente ao menos frequente.

| Categoria | Seletor | Motivo | Temas | Viewports | Telas (estado) | Elementos |
|---|---|---|---|---|---|---|
| controle | button.botao-contexto | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Início (modo de demonstração ativo); Plano de voo (modo de demonstração ativo); Início (limpo); Check-in (limpo); e mais 21 | 1608 |
| controle | button.kb-titulo-btn | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Cabine: KB (missão iniciada); Cabine: KB (turno concluído) | 1584 |
| controle | button.dock-btn | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Cabine: ITSM (missão iniciada); Cabine: Chat (missão iniciada); Cabine: SimuDesk (missão iniciada); Cabine: KB (missão iniciada); e mais 5 | 648 |
| controle | input[type=radio] | controle nativo (radio), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Início (modo de demonstração ativo); Início (limpo); Check-in (limpo); Painel de Aparência (painel de aparência aberto) | 504 |
| controle | button.nav-item | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 768, 1280, 1440 | Início (modo de demonstração ativo); Plano de voo (modo de demonstração ativo); Início (limpo); Check-in (limpo); e mais 17 | 336 |
| controle | summary | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Plano de voo (modo de demonstração ativo); Plano de voo (limpo); Caixa-preta (turno concluído); Brevê (turno concluído) | 240 |
| controle | button.tempo-botao | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caixa-preta (turno concluído) | 192 |
| controle | button.btn.btn-ghost.btn-sm | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Aulas (limpo); Caderno (limpo) | 168 |
| controle | button.btn-primary | desabilitado (isento de contraste) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Cabine: Chat (missão iniciada); Cabine: SimuDesk (missão iniciada); Cabine: Chat (turno concluído); Cabine: SimuDesk (turno concluído); e mais 1 | 168 |
| controle | button.nav-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (alto), acolhedor (padrao), corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375 | Início (modo de demonstração ativo); Plano de voo (modo de demonstração ativo); Início (limpo); Check-in (limpo); e mais 17 | 168 |
| controle | button.btn.btn-secondary.btn-sm | desabilitado (isento de contraste) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Plano de voo (limpo) | 144 |
| controle | button.lab-guia-alternar | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 1280, 1440 | Cabine: ITSM (missão iniciada); Cabine: Chat (missão iniciada); Cabine: SimuDesk (missão iniciada); Cabine: KB (missão iniciada); e mais 5 | 108 |
| controle | summary.missao-zero-resumo | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Plano de voo (modo de demonstração ativo); Plano de voo (limpo) | 96 |
| controle | button.lesson-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Aulas (limpo) | 72 |
| controle | button.tree-item | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 72 |
| controle | button.nav-item.active | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 768, 1280, 1440 | Hangar (limpo); Aulas (limpo); Caderno (limpo); Comandante (limpo) | 64 |
| divisor | table.tabela-dados.fila-chamados > td | sem borda computada (largura 0) | acolhedor (alto), acolhedor (padrao), corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375 | Cabine: ITSM (missão iniciada); Cabine: ITSM (turno concluído) | 64 |
| controle | button.btn.btn-secondary.btn-sm | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (alto), acolhedor (padrao), corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375, 768 | Cabine: ITSM (missão iniciada); Cabine: Chat (missão iniciada); Cabine: SimuDesk (missão iniciada); Cabine: KB (missão iniciada); e mais 1 | 60 |
| controle | input#_r_h_.text[type=text] | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Plano de voo (modo de demonstração ativo); Plano de voo (limpo) | 48 |
| controle | input#verificador-arquivo.verifier-file-entrada.sr-only[type=file] | controle nativo (file), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Brevê (limpo); Brevê (turno concluído) | 48 |
| controle | button.tab[role=tab] | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Treino de explicação (limpo) | 48 |
| controle | input#ed-title.title-input[type=text] | sem borda nem preenchimento próprios (identificado por texto ou ícone) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 48 |
| controle | input#td-0[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 48 |
| container | table.tabela-dados.fila-chamados | sem borda computada (largura 0) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Cabine: ITSM (missão iniciada); Cabine: ITSM (turno concluído) | 48 |
| controle | button.btn-neutro | desabilitado (isento de contraste) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Cabine: ITSM (missão iniciada); Cabine: ITSM (turno concluído) | 48 |
| controle | input#replay-range[type=range] | controle nativo (range), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caixa-preta (turno concluído) | 48 |
| controle | button.btn.btn-primary.btn-sm | oculto (display, visibility, opacidade 0 ou tamanho zero) | acolhedor (alto), acolhedor (padrao), corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375, 768 | Cabine: ITSM (turno concluído); Cabine: Chat (turno concluído); Cabine: SimuDesk (turno concluído); Cabine: KB (turno concluído) | 48 |
| divisor | tr | sem borda computada (largura 0) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 768, 1280, 1440 | Cabine: ITSM (missão iniciada); Cabine: ITSM (turno concluído) | 32 |
| hover | candidato 3 | elemento não recebeu hover (coberto ou fora da tela) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Brevê (limpo) | 24 |
| controle | input#td-1[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 24 |
| controle | input#td-2[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 24 |
| controle | input#td-3[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 24 |
| controle | input#td-4[type=checkbox] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Caderno (limpo) | 24 |
| controle | input[type=checkbox][role=switch] | controle nativo (checkbox), borda e preenchimento não calculáveis pelo estilo computado | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao), acolhedor (alto), corporativo (alto), editorial (alto), operacao (alto) | 375, 768, 1280, 1440 | Painel de Aparência (painel de aparência aberto) | 24 |
| divisor | table.tabela-dados.fila-chamados > td.dado-mono | sem borda computada (largura 0) | acolhedor (alto), acolhedor (padrao), corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375 | Cabine: ITSM (missão iniciada); Cabine: ITSM (turno concluído) | 16 |
| texto (axe) | .dock-btn[type="button"]:nth-child(2) > span:nth-child(2) | elemento parcialmente coberto | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Cabine: SimuDesk (missão iniciada); Cabine: SimuDesk (turno concluído); Cabine: SimuDesk com terminal (missão iniciada) | 12 |
| texto (axe) | header > .pagina-jornada-texto | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375, 768 | Painel de Aparência (painel de aparência aberto) | 8 |
| texto (axe) | .lab-guia-titulo | elemento parcialmente coberto | editorial (padrao) | 1280, 1440 | Cabine: Chat (turno concluído); Cabine: SimuDesk (turno concluído); Cabine: KB (turno concluído) | 6 |
| texto (axe) | .tempo-item:nth-child(4) > .tempo-botao[type="button"] > .tempo-minuto.dado-mono | conteúdo de pseudo-elemento | corporativo (alto), corporativo (padrao), editorial (alto), editorial (padrao), operacao (alto), operacao (padrao) | 375 | Caixa-preta (turno concluído) | 6 |
| texto (axe) | .tab[role="tab"][type="button"]:nth-child(3) | elemento parcialmente coberto | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375, 768 | Treino de explicação (limpo) | 5 |
| texto (axe) | .tab[role="tab"][type="button"]:nth-child(2) | elemento parcialmente coberto | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Treino de explicação (limpo) | 4 |
| texto (axe) | .eyebrow | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Painel de Aparência (painel de aparência aberto) | 4 |
| texto (axe) | h1 | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Painel de Aparência (painel de aparência aberto) | 4 |
| texto (axe) | .h2 | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Painel de Aparência (painel de aparência aberto) | 4 |
| texto (axe) | header > .muted | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 375 | Painel de Aparência (painel de aparência aberto) | 4 |
| texto (axe) | a[href$="check-in"] > span | sobreposição por outro elemento | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 768 | Painel de Aparência (painel de aparência aberto) | 4 |
| hover | candidato 1 | elemento não recebeu hover (coberto ou fora da tela) | acolhedor (padrao), corporativo (padrao), editorial (padrao), operacao (padrao) | 768 | Painel de Aparência (painel de aparência aberto) | 4 |
| texto (axe) | .dock-btn:nth-child(1) > span:nth-child(2) | elemento parcialmente coberto | acolhedor (padrao), editorial (padrao) | 768 | Cabine: KB (missão iniciada); Cabine: KB (turno concluído) | 4 |
| texto (axe) | .lab-guia-missao | elemento parcialmente coberto | editorial (padrao) | 1280 | Cabine: Chat (turno concluído); Cabine: SimuDesk (turno concluído); Cabine: KB (turno concluído) | 3 |
| texto (axe) | .lab-guia-objetivo | elemento parcialmente coberto | editorial (padrao) | 1280 | Cabine: Chat (turno concluído); Cabine: SimuDesk (turno concluído); Cabine: KB (turno concluído) | 3 |

## 7. Medidas informativas

Rolagem horizontal: nenhuma célula medida tem rolagem horizontal.

Alvos menores que 44 px e textos menores que 12 px estão por célula no JSON (campo informativas, com exemplos). Os totais por tema e viewport estão na seção 2.

## 8. Limitações

- Hover e foco são amostras (6 e 12 elementos distintos por célula, conteúdo primeiro), não varredura completa.
- Axe mede o estado da página no instante da medição. Menus, diálogos e estados de erro fora do roteiro não são cobertos.
- Controle só com preenchimento (sem borda) é informativo: o limiar de 3:1 só vale para controles que têm borda visível. O mesmo vale para rádio e caixa de seleção nativos, cuja borda não aparece no estilo computado.
- O fundo de elemento com opacidade menor que 1, imagem ou gradiente não é calculado, vai para a lista de não calculáveis.
- Pseudo-elementos (por exemplo o botão do seletor de arquivo) não entram no estilo computado do elemento. O axe os trata como conteúdo de pseudo-elemento quando os encontra.
- Zoom em 200 por cento é coberto pela Spec_Visual (640 por 450 px). Leitor de tela real não faz parte da medição.
