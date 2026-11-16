# Ciclo 2, E7: relatório de validação

Data: 2026-11-16. Branch ux-ciclo-2, HEAD 7f1cba1 (commits das etapas E1 a E6). Esta etapa só relata: não alterou código nem fez commit. Arquivos gravados: este relatório e a linha da E7 em 09_REGISTRO_PROGRESSO.md. Os resultados de medição ficam em src/frontend/test-results (ignorado pelo Git).

## 1. Veredito

**Reprovado.** Os portões automáticos passam e não há regressão frente à linha de base (10_LINHA_DE_BASE.md). A reprovação vem de dois itens do limiar de alvos de 44 px (seção 4 do 07_PLANO_FINAL.md). Os dois já existiam na baseline e a E5 e a E6 não os trataram. A correção cabe numa etapa E6b pequena, em um único arquivo (src/frontend/src/index.css). Depois dela, a E7 precisa ser repetida inteira, porque a rodada do Playwright regenera os PNG.

## 2. Portões

| Portão | Comando | Status | Contagem |
|---|---|---|---|
| Lint | npm.cmd run lint | aprovado | 0 avisos, 0 erros (62 arquivos, 116 regras) |
| Vitest | npm.cmd test -- --run | aprovado | 109 de 109 testes em 13 arquivos |
| Build | npm.cmd run build (tsc -b, vite build, verificação de segredos) | aprovado | 2127 módulos; verificação de segredos ok em 14 arquivos |
| dotnet build (integração) | dotnet build src/backend/src/Simulador.Api | aprovado | 0 avisos, 0 erros |
| Playwright | npx.cmd playwright test, uma rodada nos 5 projetos | aprovado | 43 de 43 em 4,3 min: chromium 11, mobile-375 8, tablet-768 8, desktop-1280 8, desktop-1440 8 |
| Visual | e2e/visual.spec.ts nos 4 projetos visuais, 2 temas, 2 grupos | aprovado | 16 de 16 |
| Contraste (medição) | e2e/contraste.spec.ts, mesma matriz | sem violação | 16 de 16 testes; 120 de 120 células medidas; 0 células não calculáveis |
| Caractere E comercial | varredura do diff e de docs/auditoria-ui-ux/ciclo2 (28 arquivos) | aprovado | 0 ocorrências fora de operador lógico duplo; 29 linhas com operador lógico duplo, permitidas |
| Formas passadas de sair | varredura do diff e de ciclo2 | aprovado | 0 |
| Emojis | varredura do diff | aprovado | 0 |
| style={{ | varredura dos tsx e ts do diff, sem testes | aprovado | 0 |
| Limiares da seção 4 | tabela da seção 4 deste relatório | **reprovado** | 2 itens reais de alvo abaixo de 44 px |

Escopo de projetos: a configuração do Playwright exclui as specs visual e contraste do projeto chromium (testIgnore). Por isso o chromium roda só as jornadas, e os outros 4 projetos rodam visual e contraste. A rodada cobriu os 5 projetos, cada um com o conjunto que a configuração define.

## 3. Comparação com a linha de base

Contagem de elementos distintos com limiar falho, por tema e viewport (linha de base → atual). A métrica é a mesma da baseline: elementos com atende igual a falso, por categoria.

| Tema | Viewport | Texto | Container | Divisor | Controle | Foco | Hover (controle e divisor) |
|---|---|---|---|---|---|---|---|
| tactical | 375 | 1 → 0 | 19 → 0 | 0 → 0 | 12 → 0 | 0 → 0 | 5 → 0 |
| tactical | 768 | 1 → 0 | 19 → 0 | 0 → 0 | 12 → 0 | 0 → 0 | 3 → 0 |
| tactical | 1280 | 1 → 0 | 19 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 3 → 0 |
| tactical | 1440 | 1 → 0 | 19 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 3 → 0 |
| corporate | 375 | 0 → 0 | 19 → 0 | 2 → 0 | 12 → 0 | 0 → 0 | 8 → 0 |
| corporate | 768 | 0 → 0 | 19 → 0 | 2 → 0 | 12 → 0 | 0 → 0 | 4 → 0 |
| corporate | 1280 | 0 → 0 | 19 → 0 | 2 → 0 | 3 → 0 | 0 → 0 | 4 → 0 |
| corporate | 1440 | 0 → 0 | 19 → 0 | 2 → 0 | 3 → 0 | 0 → 0 | 4 → 0 |

Métricas informativas (valores somados sobre as 15 células de cada tema e viewport):

| Tema | Viewport | Alvos menores que 44 px | Textos menores que 12 px | Rolagem horizontal | Aprovações do axe (com hover) | Elementos não calculáveis |
|---|---|---|---|---|---|---|
| tactical | 375 | 44 → 13 | 109 → 0 | 0 → 0 | 956 → 950 | 324 → 320 |
| tactical | 768 | 71 → 40 | 34 → 0 | 0 → 0 | 969 → 963 | 292 → 294 |
| tactical | 1280 | 53 → 13 | 58 → 0 | 0 → 0 | 978 → 972 | 292 → 294 |
| tactical | 1440 | 53 → 13 | 58 → 0 | 0 → 0 | 1006 → 1000 | 291 → 294 |
| corporate | 375 | 44 → 13 | 109 → 0 | 0 → 0 | 957 → 950 | 324 → 320 |
| corporate | 768 | 71 → 40 | 34 → 0 | 0 → 0 | 970 → 963 | 292 → 294 |
| corporate | 1280 | 53 → 13 | 58 → 0 | 0 → 0 | 979 → 972 | 292 → 294 |
| corporate | 1440 | 53 → 13 | 58 → 0 | 0 → 0 | 1007 → 1000 | 291 → 294 |

**Regressões: nenhuma.** Todas as categorias de contraste e contorno caíram a zero, e nenhuma linha atual falha sem existir na baseline (chave tema, viewport, tela, estado, categoria, interação e seletor).

Variações que não são regressão:

- Aprovações do axe: 6 a 7 nós a menos por viewport. Por tela, a diferença é de ±2 nós em 32 das 120 células, sem violação. Causa provável: mudança de conteúdo das telas nas E2 a E4 (missão 0 recolhida, seleção inicial vazia, rótulos novos) e nos ajustes da E6.
- Elementos não calculáveis: diferença de até 3 por viewport, pelo mesmo motivo.

## 4. Limiares da seção 4 do plano

| Limiar | Menor medida, tactical | Menor medida, corporate | Situação |
|---|---|---|---|
| Texto 4,5:1 (axe, estático e hover, 4 viewports) | sem violação | sem violação | cumpre |
| Controle 3:1 | 3,07 (button.lesson-item.active, 1280) | 4,34 (button.btn.btn-secondary.btn-sm, 1280); hover 4,76 | cumpre |
| Foco 3:1 | 6,83 | 5,31 | cumpre |
| Container 2,0:1 | 2,36 (li.step-box, 1280) | 2,06 (details.glossary-details, 1280) | cumpre |
| Divisor (corporate 1,4:1; tactical 1,71 e 1,81) | 1,72 (surface) | 1,48 (surface) | cumpre |
| Texto auxiliar 12 px | nenhum texto abaixo de 12 px | nenhum texto abaixo de 12 px | cumpre |
| Alvos 44 px | 2 itens reais (achados 1 e 2) | 2 itens reais (achados 1 e 2) | **não cumpre** |
| Rolagem horizontal em 375 px | 0 células | 0 células | cumpre |

Os limiares de container e divisor e o de texto estão nos testes de tokens (tokensContraste.test.ts, 27 testes verdes). A spec de contraste mede os elementos reais e não afirma limiares. Por isso a leitura dos limiares vem do JSON gravado pela spec: nenhuma entrada tem atende igual a falso.

## 5. Falhas

Nenhum teste, comando ou build falhou. Não há erro a transcrever.

## 6. Achados por prioridade

**P1: reprovam o limiar de alvo de 44 px**

1. `button.botao-contexto`, 31 por 44 px (largura de 31 px), em 768 px. Aparece em 27 células: o botão de perfil da barra de contexto do laboratório (src/frontend/src/shell/MenuPerfil.tsx:50). Causa provável: a regra `min-width: var(--touch-target)` está dentro do bloco `@media (max-width: 767.98px)` (src/frontend/src/index.css:553), e por isso não vale em 768 px. Pré-existente: a baseline já registrava o mesmo tamanho (54 entradas de 31 por 44 px). A E6 só mediu 375 e 1440 px. Correção: mover a regra de largura mínima para a base, fora do bloco de largura.
2. `a.skip` (link Pular), 146 por 20 px quando recebe foco, em 6 células de cada tema. Causa provável: `.skip:focus` (src/frontend/src/index.css:217) não define altura mínima. Pré-existente: a baseline tinha o mesmo tamanho. Correção: `min-height` de 44 px no foco.

**P2: decisão sua**

3. `input[type=checkbox]` do Caderno, 20 por 20 px, 5 por célula. O rótulo ao redor mede 44 px e é a área de toque. A E6 registrou essa exceção. Se você aceitar, ela fica como exceção documentada. Se não aceitar, a caixa precisa ocupar a área de 44 px.

**P3: medição ou registro, sem ação obrigatória**

4. `input[type=file]` da Credencial, medido como 1 por 44 px. É o input real com classe sr-only. O rótulo visível do seletor mede 44 px. Artefato da medição.
5. Textos sem acento vindos do backend (Nível Estagiario no topo do laboratório e critérios do Juiz 360). A E6 registrou como fora de escopo. Não foi reverificado nesta etapa.

Correção proposta, em E6b (um arquivo, src/frontend/src/index.css, itens 1 e 2): mover a largura mínima de `.botao-contexto` para fora do bloco de largura e definir `min-height` de 44 px em `.skip:focus`. Depois, repetir a E7 inteira. A E8 só começa com a E7 aprovada.

## 7. Verificações manuais não bloqueantes, pendentes

- Zoom de 200 por cento e reflow (WCAG 1.4.4 e 1.4.10): não feito.
- Leitor de tela em pelo menos uma tela de cada tema: não feito.
- Inspeção visual dos PNG de depois da E6 (pendência já registrada na E6): não feita. Esta etapa não abriu nenhum PNG, pelo escopo do pedido.

## 8. PNG e JSON gerados (não abertos)

- src/frontend/test-results/visual: 80 PNG. Nome: `{projeto}__{tema}__{tela}.png`. Projetos: mobile-375, tablet-768, desktop-1280, desktop-1440. Temas: corporate, tactical. Telas: missoes, aulas, caderno, mentor, credencial, laboratorio-itsm, laboratorio-chat, laboratorio-simudesk, laboratorio-kb, replay.
- src/frontend/test-results/contraste: 16 JSON de medição (projeto, tema e grupo estudo ou laboratório).

## 9. Veredito final

Reprovado. Não há regressão. Dois alvos reais abaixo de 44 px (achados 1 e 2) impedem a aprovação. Próximos passos: E6b com os achados 1 e 2; decisão sua sobre o achado 3; E7 repetida; depois E8.
