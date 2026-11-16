# Ciclo 2, E7: relatório de validação

Data: 2026-11-16. Branch ux-ciclo-2, HEAD 694d3c1 (commit da E6b). Esta etapa só relata: não alterou código e não fez commit. Arquivos gravados: este relatório e a linha da E7 em 09_REGISTRO_PROGRESSO.md. As medições ficam em src/frontend/test-results (ignorado pelo Git).

## 1. Veredito

**Aprovado.** Todos os portões automáticos passam. Não há regressão frente à linha de base (10_LINHA_DE_BASE.md). Os limiares da seção 4 do 07_PLANO_FINAL.md são cumpridos. O único alvo abaixo de 44 px que resta são os 5 checkboxes do Caderno por tema e viewport, exceção aceita pelo usuário. Zoom em 200 por cento, leitor de tela e inspeção visual dos PNG continuam pendentes, sem bloquear a aprovação.

## 2. Rodada 1 (resumo)

A rodada 1 reprovou a E7 por dois alvos abaixo de 44 px, sem regressão:

- `button.botao-contexto` com 31 px de largura em 768 px, no laboratório.
- `a.skip` (link Pular) com 20 px de altura. A medição da rodada 1 pegou o link fora da tela, sem foco. Com foco real, o alvo já mede 170 por 44 px depois da E6b.

A E6b corrigiu os dois itens em `src/frontend/src/index.css`, e a correção do diagnóstico está no registro da E6b.

## 3. Rodada 2: portões

| Portão | Comando | Status | Contagem |
|---|---|---|---|
| Lint | `npm.cmd run lint` | aprovado | 0 avisos, 0 erros (62 arquivos, 116 regras) |
| Vitest | `npm.cmd test -- --run` | aprovado | 109 de 109 testes em 13 arquivos |
| Build | `npm.cmd run build` | aprovado | 2127 módulos; verificação de segredos ok em 14 arquivos |
| dotnet build (integração) | `dotnet build src/backend/src/Simulador.Api` | aprovado | 0 avisos, 0 erros |
| Playwright | `npx.cmd playwright test`, uma rodada, 5 projetos | aprovado | 43 de 43 em 3,8 min, 1 worker: chromium 11 (jornadas), mobile-375 8, tablet-768 8, desktop-1280 8, desktop-1440 8 |
| Visual | `e2e/visual.spec.ts`, 4 projetos visuais, 2 temas, 2 grupos | aprovado | 16 de 16 |
| Contraste | `e2e/contraste.spec.ts`, mesma matriz | aprovado | 16 de 16; 120 de 120 células medidas; 0 células não calculáveis; 2550 linhas com limiar, 0 falhas |
| Alvos de 44 px | medição da spec | exceção aceita | 5 por tema e viewport, todos checkbox do Caderno (40 ocorrências no total) |
| Rolagem horizontal | medição da spec, 4 viewports | aprovado | 0 células com rolagem |
| Varredura: caractere E comercial | diff da branch e docs/auditoria-ui-ux/ciclo2 | aprovado | 0 ocorrências fora de operador lógico duplo |
| Varredura: formas passadas de sair | mesmo escopo | aprovado | 0 |
| Varredura: emojis | mesmo escopo | aprovado | 0 |
| Varredura: `style={{` | mesmo escopo | aprovado | 0 em código; 5 em texto de documentação que cita o padrão |

Escopo das varreduras: 29 arquivos do `git diff --name-only main...ux-ciclo-2`, incluindo os 13 arquivos de docs/auditoria-ui-ux/ciclo2 (todos estão no diff).

Ocorrências de execução. O Vitest foi executado duas vezes. A primeira terminou com código 1, causado pelo PowerShell, que tratou a saída de erro do npm como erro nativo. A segunda, com saída gravada em arquivo, terminou com código 0 e o mesmo resultado (109 de 109). Não houve falha de teste. O Playwright rodou uma única vez.

## 4. Comparação com a linha de base

Cada célula mostra linha de base → rodada 2, por tema e viewport. A linha de base é 10_linha_de_base.json.

| Tema | Viewport | Texto | Container | Divisor | Controle | Foco | Hover | Alvos < 44 px | Texto < 12 px | Rolagem | Não calculáveis (info) | Aprovações axe (info) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tactical | 375 | 1 → 0 | 19 → 0 | 0 → 0 | 12 → 0 | 0 → 0 | 5 → 0 | 44 → 5 | 109 → 0 | 0 → 0 | 324 → 327 | 956 → 950 |
| tactical | 768 | 1 → 0 | 19 → 0 | 0 → 0 | 12 → 0 | 0 → 0 | 3 → 0 | 71 → 5 | 34 → 0 | 0 → 0 | 292 → 295 | 969 → 963 |
| tactical | 1280 | 1 → 0 | 19 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 3 → 0 | 53 → 5 | 58 → 0 | 0 → 0 | 292 → 295 | 978 → 972 |
| tactical | 1440 | 1 → 0 | 19 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 3 → 0 | 53 → 5 | 58 → 0 | 0 → 0 | 291 → 294 | 1006 → 1000 |
| corporate | 375 | 0 → 0 | 19 → 0 | 2 → 0 | 12 → 0 | 0 → 0 | 8 → 0 | 44 → 5 | 109 → 0 | 0 → 0 | 324 → 327 | 957 → 950 |
| corporate | 768 | 0 → 0 | 19 → 0 | 2 → 0 | 12 → 0 | 0 → 0 | 4 → 0 | 71 → 5 | 34 → 0 | 0 → 0 | 292 → 295 | 970 → 963 |
| corporate | 1280 | 0 → 0 | 19 → 0 | 2 → 0 | 3 → 0 | 0 → 0 | 4 → 0 | 53 → 5 | 58 → 0 | 0 → 0 | 292 → 295 | 979 → 972 |
| corporate | 1440 | 0 → 0 | 19 → 0 | 2 → 0 | 3 → 0 | 0 → 0 | 4 → 0 | 53 → 5 | 58 → 0 | 0 → 0 | 291 → 294 | 1007 → 1000 |

Os números de contagem vêm do mesmo critério da linha de base: elementos com limiar falho, por categoria. Alvos menores que 44 px são informativos, e a coluna mostra só os 5 checkboxes aceitos.

**Regressões: nenhuma.** Texto, container, divisor, controle, foco e hover estão em zero nos 4 viewports. Nenhuma linha atual falha sem existir na baseline.

Variações informativas que não são regressão:

- Elementos não calculáveis: +3 por viewport. Não há limiar associado. A causa não foi verificada nesta rodada.
- Aprovações do axe: 6 a 7 nós a menos por viewport, sem violação. Mesmo padrão da rodada 1, provavelmente pela mudança de conteúdo das telas nas E2 a E4 e E6.

Menores razões medidas (linha de base e rodada 2 iguais nos limiares):

| Limiar | Menor medida, tactical | Menor medida, corporate |
|---|---|---|
| Controle 3:1 | 3,07 (button.lesson-item.active, Aulas, 1280 px; também button.btn-ghost.btn-sm no hover) | 4,34 (button.btn.btn-secondary.btn-sm, ITSM, 1280 px); hover 4,76 |
| Foco 3:1 | 6,83 | 5,31 |
| Container 2,0:1 | 2,36 (li.step-box, Missões, 1280 px) | 2,06 (details.glossary-details, Missões, 1280 px) |
| Divisor | 1,72 (piso do plano para o tactical; medido 1,72) | 1,48 (div.missao-linha, Missões, 1280 px), limiar 1,4 |

## 5. Limiares da seção 4 do plano

| Limiar | Situação | Observação |
|---|---|---|
| Texto 4,5:1 (axe, estático e hover, 4 viewports) | cumpre | 0 violações |
| Controle e foco 3:1 | cumpre | menores razões acima |
| Container 2,0:1 (border-strong sobre surface e canvas) | cumpre | 0 violações; sobre elevated é só informativo |
| Divisor: corporate 1,4:1, tactical 1,72 | cumpre | tactical no piso de 1,72 do plano |
| Texto auxiliar 12 px | cumpre | 0 texto abaixo de 12 px em todas as células |
| Alvos 44 px | cumpre com exceção aceita | 5 checkboxes do Caderno, ver seção 7 |
| Rolagem horizontal em 375 px | cumpre | 0 células com rolagem |

## 6. Rolagem horizontal e laboratório

Nenhuma célula tem rolagem horizontal em 375, 768, 1280 ou 1440 px. As telas do laboratório (Chat, ITSM, KB e SimuDesk) em ambos os temas têm largura de conteúdo igual à largura do viewport. Em 768 px, a largura é 768, sem rolagem.

## 7. Exceções aceitas

- Checkbox do Caderno (`input#td-0` a `input#td-4`, 20 por 20 px). O rótulo em volta mede 44 px e é a área de toque. O usuário aceitou essa exceção, que não conta como reprovação. A spec continua listando esses 5 checkboxes como alvos menores, apenas como informação.
- `input[type=file]` da Credencial, medido como 1 por 44 px. É o input real, com classe sr-only. O rótulo visível "Selecionar arquivo JSON" mede 44 por 44 px e é o alvo de toque. Artefato de medição, que o helper ignora desde a E6b.

## 8. Achados por prioridade

**P1 (bloqueia): nenhum.**

**P2 (não bloqueia; acompanhar):**

1. Inspeção visual dos PNG gerados depois da E6 e da E6b: não feita nesta rodada, porque o pedido proíbe abrir os PNG. Pontos a verificar, já listados nos registros da E6 e da E6b: título do laboratório na barra de contexto a 768 px (66 px contra 72 px antes, com reticências se o texto crescer), Credencial, Caderno e laboratório ITSM.
2. Elementos não calculáveis: +3 por viewport frente à linha de base (ver seção 4). Métrica informativa, sem limiar.

**P3 (fora do escopo; registrado):**

3. Textos sem acento vindos do backend: "Nível Estagiario" no topo do laboratório e critérios do Juiz 360 ("Consultou politica", "criterios"). Foram registrados na E6. Não foram reverificados nesta rodada, porque a E7 não altera src/backend.
4. Botão desabilitado "Conectar na estação" no SimuDesk corporate aparece claro. Controle desabilitado é isento de contraste pela WCAG 1.4.3 e 1.4.11. Registrado na E6, sem ação.

## 9. Verificações manuais não bloqueantes, pendentes

- Zoom de 200 por cento e reflow (WCAG 1.4.4 e 1.4.10): não feito.
- Leitor de tela em pelo menos uma tela de cada tema: não feito.
- Inspeção visual dos PNG depois da E6 e da E6b (achado P2, item 1): não feita, por instrução.

## 10. PNG e JSON gerados (não abertos)

- `src/frontend/test-results/visual`: 80 PNG, gerados por esta rodada e mantidos sem apagar ou regenerar. Nome: `{projeto}__{tema}__{tela}.png`. Projetos: mobile-375, tablet-768, desktop-1280, desktop-1440. Temas: corporate, tactical. Telas: missoes, aulas, caderno, mentor, credencial, laboratorio-itsm, laboratorio-chat, laboratorio-simudesk, laboratorio-kb, replay.
- `src/frontend/test-results/contraste`: 16 JSON de medição (4 projetos, 2 temas, 2 grupos: estudo e laboratório).

## 11. Veredito final

**Aprovado.** Todos os portões passam, sem regressão e com o único alvo abaixo de 44 px sendo a exceção aceita pelo usuário. Próximos passos: aceite do usuário para seguir à E8 (fechamento). As verificações manuais e a inspeção visual dos PNG ficam como pendências não bloqueantes.

## Rodada 1 (resumo)

Veredito anterior: reprovado por 2 alvos abaixo de 44 px (`button.botao-contexto` em 768 px e `a.skip` com foco). Sem regressão. Corrigidos na E6b.
