# Ciclo 2: registro de progresso

Branch: ux-ciclo-2 (a criar na E1, a partir da main em a88988c). Plano: 07_PLANO_FINAL.md. Cada etapa acrescenta uma linha: arquivos tocados, verificações e resultado, pendências e próxima ação.

## Decisões do usuário (aprovadas em 2026-11-16)

1. Nenhuma missão selecionada ao abrir.
2. A alteração local da etapa 10 entra em commit próprio de documentação, antes da E1.
3. Os 4 itens alheios ficam fora do ciclo: README.md, docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md, docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md e docs/consultor-vocacional/.
4. Quem já tem focus n1 salvo permanece em n1, sem migração.
5. Limiares: contorno de container 2,0:1, divisor 1,4:1, controles e foco 3:1.
6. Itens por padrão mantidos: correção do F 20% e rótulos por extenso (E3) e seletor de arquivo em português (E6).

Observação sobre a decisão 1 a 5: o usuário respondeu "aprovado" ao plano final, que trazia a recomendação em cada pergunta. As recomendações foram adotadas como respostas.

## Etapas

| Etapa | Agente | Status | Linha de registro |
|---|---|---|---|
| E1 | sim2-medicao | concluída (commit local, sem push) | ver Registro, E1 |
| E2 | sim2-implementador | concluída (commit local, sem push) | ver Registro, E2 |
| E3 | sim2-implementador | concluída (commit local, sem push) | ver Registro, E3 |
| E4 | sim2-implementador | concluída (commit local, sem push) | ver Registro, E4 |
| E5 | sim2-implementador | concluída (2 commits locais, sem push) | ver Registro, E5 |
| E6 | sim2-implementador | concluída (2 commits locais, sem push) | ver Registro, E6 |
| E7 | sim2-validador | pendente | |
| E8 | sim2-fechamento | pendente | |

## Registro

### E1, base de medição (2026-11-16)

- Arquivos: src/frontend/e2e/contraste.spec.ts, contraste.helper.ts e contraste.relatorio.mjs (novos); src/frontend/e2e/visual.spec.ts (só higiene de captura: mouse fora, foco removido, fixos e sticky neutralizados e tooltips ocultos durante a captura, com a folha de estilo removida depois); src/frontend/playwright.config.ts (a spec nova passa a rodar nos 4 projetos visuais, sem mudar projetos nem viewports); docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e 10_linha_de_base.json; este registro.
- Verificações: git status e HEAD conferidos na retomada (branch ux-ciclo-2, base 7907bda); portas 8080 e 5173 sem listener antes da rodada e depois; npm.cmd run lint sem avisos e sem erros; uma rodada completa de e2e/contraste.spec.ts, 16 testes verdes em 2,0 min (4 projetos x 2 temas x estudo e laboratório); depuração anterior em desktop-1440 já feita na sessão interrompida; relatório regerado com 120 de 120 células medidas e 0 não calculáveis; varredura do caractere E comercial (montado por [char]38) e das formas passadas de sair nos arquivos da etapa: zero ocorrências; git diff mostra só e2e, playwright.config.ts e docs; nenhum arquivo de src/frontend/src alterado; nenhum pacote instalado.
- Resultado (soma dos 4 viewports): tactical, texto 4, container 76, divisor 0, controle 30, foco 0, hover 14; corporate, texto 0, container 76, divisor 8, controle 30, foco 0, hover 20. Sem rolagem horizontal em nenhuma célula. Não calculáveis: 892 elementos, por motivo no relatório (seção 6).
- Observações: (1) o plano cita 5 projetos, mas o projeto chromium ignora as specs visuais, então a rodada tem 4 projetos de medição (mobile-375, tablet-768, desktop-1280, desktop-1440). (2) A matriz de tokens do tactical usa o piso 1,71 e 1,81 (em vez de 1,72 e 1,82) para o divisor sem regressão, porque 1,8196 arredonda para 1,82 e aparecia como falha falsa. (3) A coluna de contagem por viewport mostra mais violações de controle em 375 e 768 (12) do que em 1280 e 1440 (3), por causa de button.lab-guia-alternar, visível só nessas larguras. (4) Os 4 itens alheios continuam sem commit. (5) Zoom em 200 por cento e leitor de tela ficam para a E7.
- Pendências: inspeção visual dos PNG do tactical e do corporate (E6); o teste de tokens que leia index.css (E5); decisão do agente da E5 sobre o menor deslocamento de border-strong e border-subtle do corporate.
- Próxima ação: E2 (nenhuma missão pré-selecionada, focus inicial estagiario, botão Decolar com guarda), em sessão nova, partindo do commit local da E1.

### E2, selecao inicial e focus (2026-11-16)

- Arquivos: src/frontend/src/workstation/TelaInicial.tsx (cenario inicial vazio, guarda no onDecolar, entrada do laboratorio pela barra superior cai no cenario do nivel em foco quando nada foi escolhido); src/frontend/src/workstation/TabelaMissoes.tsx (aria-disabled, texto de apoio "Escolha uma missão" ligado por aria-describedby, guarda no clique); src/frontend/src/educacao/catalogoEducacional.ts (focus inicial estagiario, comentario com a tabela de ids e rotulos); src/frontend/src/index.css (regra .btn-indisponivel, so tokens existentes); src/frontend/src/App.test.tsx (a aba Aulas agora abre na primeira aula do Estagiario); src/frontend/src/workstation/EstadoInicial.test.tsx (novo, 7 testes); este registro.
- Verificacoes: npm.cmd test -- --run src/App.test.tsx src/workstation/EstadoInicial.test.tsx: 23 de 23 verdes; npm.cmd run lint: 0 avisos e 0 erros; Playwright (portas 8080 e 5173 livres antes de cada execucao) jornadas.spec.ts "Feliz 1" no projeto chromium: verde; "W10" (375, 768 e 1280 px, teclado) no projeto chromium: verde.
- Desvios: (1) index.css nao estava na lista de arquivos da etapa, mas o estado indisponivel por classe exigia uma regra; foi uma unica regra com tokens existentes (text-secondary sobre bg-elevated, border-control). (2) O projeto mobile-375 so executa as specs visual e contraste (playwright.config.ts), entao "Feliz 1" nao existe nele; a cobertura de 375 px da jornada vem do teste W10 no chromium, que muda o viewport. (3) Enter no botao: o jsdom nao gera clique a partir de keydown, entao o teste dispara keydown e clique em sequencia, como o navegador faz; o Enter real fica coberto pela guarda no handler.
- Pendencias: contraste da regra .btn-indisponivel nao medido no navegador (a medicao no navegador fica para a E5 e a E7; pelos tokens, text-secondary sobre bg-elevated passa de 4,5 nos dois temas); usuario com focus n1 salvo continua em n1 (decisao 4).
- Proxima acao: E3 (progresso real das notas semeadas e rotulos Teoria, Fixacao e Pratica por extenso), partindo do commit local da E2.

### E3, progresso real e rotulos (2026-11-16)

- Arquivos: src/frontend/src/educacao/catalogoEducacional.ts (calcularProgressoNivel usa notaContaComoProgresso: mais de 20 caracteres e texto diferente do texto semeado de DEFAULT_PAGES do mesmo nivel, comparacao com trim e CRLF normalizado; esquema salvo e DEFAULT_PAGES intactos, sem duplicar a string); src/frontend/src/workstation/TabelaMissoes.tsx (rotulo "Teoria X%, Fixação X%, Prática X%", igual ao da Credencial); src/frontend/src/index.css (uma regra: .missao-progresso de font-size-xs, 11 px, para font-size-sm, 13 px); src/frontend/src/educacao/progressoNivel.test.tsx (novo, 9 testes); este registro.
- Verificacoes: npm.cmd test -- --run src/educacao/progressoNivel.test.tsx src/App.test.tsx src/workstation/EstadoInicial.test.tsx: 32 de 32 verdes; npm.cmd run lint: 0 avisos e 0 erros; sem Playwright (a E4 captura). Varredura do caractere E comercial e das formas passadas de sair nas linhas adicionadas: zero.
- Casos cobertos: estado limpo t 0, f 0 e p 0 nos 5 niveis; tabela com "Não iniciada" nos 5; semeado sem edicao nao conta; editado conta 20; igual ao semeado (inclusive com espacos e CRLF) nao conta; apagado, indefinido, 20 caracteres nao contam e 21 contam; dado legado (icone emoji, focus n1) carrega, recalcula e regrava; legado sem paginas nao quebra.
- Desvios: (1) index.css nao estava na lista, mas o texto novo e mais longo e o 11 px da regra violava o minimo de 12 px computado; troca de um token existente por outro. (2) .missao-competencias tambem usa font-size-xs (11 px): fora do escopo, fica para a E6. (3) O texto "T 0%, F 20%, P 0%" so aparecia na tabela; nao havia teste nem spec que o citasse.
- Risco residual: uma edicao minima do exemplo (mais de 20 caracteres e diferente do semeado) conta como progresso; nota que o aluno copia ou restaura para o texto semeado volta a contar zero. Dados salvos com uma versao antiga do texto semeado, se houver, contariam como edicao.
- Pendencias: contraste do .missao-progresso (text-muted) no navegador fica para a E5 e a E7; legibilidade do rotulo longo em 375 px sera vista na captura da E4.
- Proxima acao: E4 (Missao 0 depois do Primeiro Voo e antes das missoes), partindo do commit local da E3.

### E4, Missao 0 antes das missoes (2026-11-16)

- Arquivos: src/frontend/src/workstation/TelaInicial.tsx (Missao 0 passa a ser um details logo depois do Primeiro Voo e antes da tabela de missoes; open={!temProgresso}, a mesma variavel do Primeiro Voo; comentario curto: a escolha manual nao e persistida, a abertura segue temProgresso a cada visita; id missao-zero-titulo mantido, agora no h2 dentro do summary, com aria-labelledby no details; novo titulo "Missão 0: o que fazer dentro do chamado" e texto de apoio "O Primeiro Voo abre o chamado. Este roteiro mostra o que fazer depois que ele estiver aberto."); src/frontend/src/index.css (3 regras: .missao-zero-resumo com min-height de var(--touch-target), h2 em linha ao lado do marcador, texto de apoio em bloco; so tokens existentes); src/frontend/src/workstation/EstadoInicial.test.tsx (5 testes novos, 12 no arquivo); este registro. MissaoZero.tsx nao foi criado.
- Verificacoes: npm.cmd test -- --run EstadoInicial.test.tsx, App.test.tsx e progressoNivel.test.tsx: 37 de 37 verdes (EstadoInicial reexecutado depois do ajuste final do teste: 12 de 12); npm.cmd run lint: 0 avisos e 0 erros; Playwright visual.spec.ts -g "estudo" (o titulo do teste e "estudo: missões, aulas, caderno e mentor", entao -g "missoes" nao casa nenhum teste) nos projetos desktop-1440 e mobile-375, 2 temas cada, portas 8080 e 5173 livres antes de cada execucao, 4 de 4 verdes, sem rolagem horizontal (verificacao soft da propria spec). Varredura do caractere E comercial e das formas passadas de sair nas linhas adicionadas: zero (um operador bit a bit no teste foi trocado por comparacao).
- Testes novos: ordem no DOM Primeiro Voo, Missao 0, Missoes, Glossario, Transparencia; texto de apoio diferencia do Primeiro Voo; sem progresso abre aberta; com progresso abre recolhida e, depois de abrir manualmente e remontar o App, volta recolhida; ordem de Tab (sem tabindex positivo e posicao no DOM: botao do Primeiro Voo, resumo da Missao 0, primeiro radio de missao).
- Altura total da pagina de missoes (PNG de captura, mesma spec): 1440 px, antes 2004 px, depois 1991 px (menos 13 px; a Missao 0 deixou de ser um card com paragrafo e passou a ter padding do details). 375 px: depois 4287 px de CSS (11253 px de imagem com fator 2,625); sem medida de antes em 375, porque a E1 nao registrou e git stash e bloqueado por regra. Estado com progresso (medicao temporaria, arquivo apagado): 1440 px 1869 px e 375 px 3774 px, com a Missao 0 recolhida (resumo de 44 px em 1440 e 108 px em 375).
- PNG abertos (4): mobile-375__tactical__missoes.png (antes do ajuste do marcador, que ficava sozinho numa linha), desktop-1440__tactical__missoes.png, mobile-375__corporate__missoes.png e um recorte temporario da tabela de missoes em 375 px com progresso (tmp-e4-tabela-mobile-375.png, tactical). Desktop corporate nao foi aberto (limite de 4); so sua altura foi medida (1991 px, igual ao tactical).
- Rotulos da E3 em 375 px: "Teoria 67%, Fixação 0%, Prática 0%" em uma linha, 13 px computados, sem estouro (scrollWidth 305 igual a clientWidth 305). Em 1440 quebra em 2 linhas na coluna estreita (150 px), legivel.
- Defeito achado e corrigido: com h2 em bloco dentro do summary o marcador do details ficava sozinho numa linha em 375 px (mobile-375__tactical__missoes.png). Corrigido com h2 em linha; conferido em desktop-1440__tactical__missoes.png e mobile-375__corporate__missoes.png.
- Observacoes: (1) A barra inferior fixa de 375 px e a barra lateral de 1440 px aparecem no meio ou cortadas nas capturas de pagina inteira, resultado da neutralizacao de elementos fixos da E1; nao e defeito do produto e nao foi tocado. (2) Tab: o jsdom nao simula Tab, entao o teste prova a ordem do DOM sem tabindex positivo; a navegacao real por teclado em navegador nao foi automatizada nesta etapa. (3) Details sem estado persistido reabre a cada visita (risco aceito no plano). (4) 375 px sem rolagem horizontal tambem confirmado pela medicao temporaria (scrollWidth 375 igual a innerWidth).
- Pendencias: contraste da regra .missao-zero-resumo .muted (text-muted sobre bg-surface) e do .btn-indisponivel no navegador fica para a E5 e a E7; .missao-competencias com 11 px segue para a E6.
- Proxima acao: E5 (tokens de contorno e texto, cores literais, teste de tokens que leia index.css), partindo do commit local da E4.

### E5, matriz de pares antes de editar (2026-11-16)

Calculada com script temporário em TEMP (node, fórmula WCAG igual a src/utils/contraste.ts), apagado depois. Cada célula mostra atual → novo. Limiares: texto 4,5; controle e foco 3,0; border-strong 2,0 sobre surface e canvas; border-subtle 1,4 no corporate e sem regressão no tactical (1,71 e 1,81). Elevated, hover e accent-surface fora dos limiares de contorno são informativos.

Valores escolhidos (menor deslocamento que cumpre todos os limiares, com folga mínima de 0,05 sobre o piso):

| Tema | Token | Atual | Novo | Por quê |
|---|---|---|---|---|
| corporate | border-strong | #CBD5E1 | #A5B2C4 | canvas 2,06 (o candidato #AAB7C8 dá 1,95 e falha; #9AA8BB dá 2,31, mais pesado que o necessário) |
| corporate | border-subtle | #E2E8F0 | #CBD5E1 | surface 1,48 e canvas 1,42 (piso 1,4); #D2DBE6 dá 1,34 no canvas e falha |
| corporate | text-muted | #5E6E84 | #586980 | hover 4,55 (o atual dá 4,22); continua mais claro que text-secondary #475569 |
| tactical | text-muted | #8593A8 | #8E9DB2 | hover 4,55 (o atual dá 4,02); o candidato #94A1B5 quase iguala text-secondary #94A3B8 e foi descartado, #8E9DB2 mantém secondary 4,89 acima de muted 4,55 |
| tactical | border-strong, border-subtle, border-control | sem mudança | sem mudança | já cumprem (2,36 e 2,48; 1,72 e 1,82; 3,75 e 3,96) |

Matriz de texto (razão, atual → novo):

| Tema | Token | surface | canvas | elevated | hover | accent-surface |
|---|---|---|---|---|---|---|
| corporate | text-primary | 17,85 | 17,06 | 16,30 | 14,48 | 15,56 |
| corporate | text-secondary | 7,58 | 7,24 | 6,92 | 6,15 | 6,60 |
| corporate | text-muted | 5,20 → 5,60 | 4,97 → 5,36 | 4,75 → 5,12 | 4,22 → 4,55 | 4,53 → 4,88 |
| corporate | accent-text | 5,81 | 5,56 | 5,31 | 4,72 | 5,07 |
| tactical | text-primary | 17,06 | 18,00 | 13,98 | 11,99 | 9,04 |
| tactical | text-secondary | 6,96 | 7,34 | 5,71 | 4,89 | 3,69 (informativo) |
| tactical | text-muted | 5,73 → 6,47 | 6,04 → 6,83 | 4,69 → 5,31 | 4,02 → 4,55 | 3,03 → 3,43 (informativo) |
| tactical | accent-text | 10,71 | 11,29 | 8,77 | 7,53 | 5,67 |

Matriz de contorno e controle (razão, atual → novo):

| Tema | Token | Limiar | surface | canvas | elevated | hover |
|---|---|---|---|---|---|---|
| corporate | border-control | 3,0 | 4,76 | 4,55 | 4,34 | 3,86 (info) |
| corporate | focus-ring | 3,0 | 5,81 | 5,56 | 5,31 | 4,72 (info) |
| corporate | border-strong | 2,0 | 1,48 → 2,15 | 1,42 → 2,06 | 1,36 → 1,96 (info) | 1,20 → 1,74 (info) |
| corporate | border-subtle | 1,4 | 1,23 → 1,48 | 1,18 → 1,42 | 1,13 → 1,36 (info) | 1,00 → 1,20 (info) |
| tactical | border-control | 3,0 | 3,75 | 3,96 | 3,07 | 2,64 (info) |
| tactical | focus-ring | 3,0 | 8,33 | 8,79 | 6,83 | 5,86 (info) |
| tactical | border-strong | 2,0 | 2,36 | 2,48 | 1,93 (info) | 1,66 (info) |
| tactical | border-subtle | 1,71 e 1,81 | 1,72 | 1,82 | 1,41 (info) | 1,21 (info) |

Pares de estado e alertas (sem mudança, todos atendem): status-success-text sobre status-success-surface 5,21 corporate e 7,70 tactical; warning 4,84 e 9,70; danger 5,91 e 6,31; text-primary sobre as três superfícies de alerta de 14,14 a 17,22 (piso 8,0, usado pelos alertas migrados para tokens); text-primary sobre accent-surface 15,56 corporate e 9,04 tactical (banner); accent-contrast sobre accent-primary, accent-hover e accent-solid de 5,81 a 8,79. Hierarquia (secondary mais distante que muted): atende em todos os fundos dos dois temas com os valores novos (corporate 7,58 contra 5,60 até 6,15 contra 4,55; tactical 6,96 contra 6,47 até 4,89 contra 4,55).

Tratamento do text-muted sobre accent-surface no tactical: nenhum token de texto neutro chega a 4,5 sobre #0C4A6E sem colidir com a hierarquia (secondary dá 3,69). O item ativo de Aulas passa a usar accent-text (5,67 no tactical, 5,07 no corporate), o par já usado por .dock-btn.active. O fundo selecionado não muda.

Alvos de edição em src/frontend/src/index.css (listados antes de editar, nenhum componente TSX será tocado):

- Tokens (linhas 76, 77, 82, 127).
- Contorno de container passa de var(--border) ou var(--border-subtle) para var(--border-strong): .edu-card, .glossary-details, .panel, .kb-article (o hover do kb-article passa a border-control para manter o sinal), mais os cartões de página da mesma função, para não misturar pesos de contorno na mesma tela: .missoes, .credencial-bloco, .itsm-fila, .itsm-detalhe, .replay-resumo, .replay-criterios, .replay-tempo, .replay-vazio. Ficam como estão: .card-section não flagrado, .painel-bloco, .itsm-nota, divisores internos.
- Controle para var(--border-control): textarea.block (Aulas), .suggest button (botões do Mentor), hover de .missao-escolha e .dock-btn (hoje border-strong), e a borda inferior de .lab-guia-alternar (375 e 768 px).
- Divisores (.missao-linha, tr, td) continuam em border-subtle, que no corporate passa a #CBD5E1.
- Item ativo de Aulas: nova regra .lesson-item.active .muted, .lesson-item.active-fix .muted com accent-text.
- Literais (commit 2): .btn-white, ::file-selector-button e os três alertas, com a remoção dos três overrides tactical (os tokens já mudam por tema).

### E5, tokens, literais e teste real (2026-11-16)

- Commits locais: 25b59c7 "fix(ux): tokens de contorno e texto dos temas" (somente src/frontend/src/index.css) e o commit de literais e teste (index.css, App.test.tsx, tokensContraste.test.ts e este registro). Nenhum componente TSX foi tocado.
- Arquivos: src/frontend/src/index.css (tokens corporate border-subtle #CBD5E1, border-strong #A5B2C4, text-muted #586980 e tactical text-muted #8E9DB2; contorno de container em border-strong para .edu-card, .glossary-details, .panel, .kb-article, .missoes, .credencial-bloco, .itsm-fila, .itsm-detalhe e .replay-*; border-control em textarea.block, .suggest button, hover de .missao-escolha e .dock-btn e na borda inferior de .lab-guia-alternar; regra .lesson-item.active .muted com accent-text; .btn-white, ::file-selector-button, .banner-notice, .alert-success e .alert-danger em tokens, sem os três overrides tactical); src/frontend/src/App.test.tsx (bloco de hexadecimais obsoletos e o teste de tokens com hexadecimais fixos removidos, resta o teste da fórmula); src/frontend/src/tokensContraste.test.ts (novo, 26 testes).
- Teste de tokens: lê os blocos de tema de index.css e cobre texto 4,5 em cinco fundos, hierarquia secondary acima de muted, estado e acento, controle e foco 3,0, border-strong 2,0, divisor 1,4 (corporate) e 1,71 e 1,81 (tactical), pares dos componentes migrados de literal para token (piso 8,0), regras de CSS (sem literais nos avisos, container em border-strong, controle em border-control, hover do botão troca a borda para o acento, item ativo de Aulas em accent-text) e o terminal do SimuDesk em tactical medido à parte, incluindo a borda dele sobre a página corporate (2,0 ou mais).
- Desvio: a importação com sufixo ?raw volta vazia no Vitest (a opção css.include padrão é vazia e o plugin zera o CSS, comprovado com um teste temporário, apagado). O teste lê index.css com node:fs a partir do caminho do próprio arquivo, sem pacote novo e sem tocar em vite.config.ts. new URL falha no ambiente jsdom, por isso fileURLToPath da string de import.meta.url. Uma tentativa por causa, nenhuma repetida.
- Verificações: npm.cmd test -- --run src/App.test.tsx src/tokensContraste.test.ts, 41 de 41 verdes (15 e 26); npm.cmd run lint, 0 avisos e 0 erros; npm.cmd run build, ok e varredura de segredos ok; Playwright e2e/contraste.spec.ts com portas 8080 e 5173 livres antes de cada rodada, uma execução por vez, workers 1: desktop-1440 (4 de 4) e mobile-375 (4 de 4), nos dois temas. Varredura do caractere E comercial e das formas passadas de sair nas linhas adicionadas: zero.
- Comparação com a linha de base (E1), contagem de elementos distintos por célula, baseline → E5:

| Coluna | texto | container | divisor | controle | foco | hover |
|---|---|---|---|---|---|---|
| tactical 375 | 1 → 0 | 19 → 0 | 0 → 0 | 12 → 0 | 0 → 0 | 5 → 0 |
| tactical 1440 | 1 → 0 | 19 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 3 → 0 |
| corporate 375 | 0 → 0 | 19 → 0 | 2 → 0 | 12 → 0 | 0 → 0 | 8 → 0 |
| corporate 1440 | 0 → 0 | 19 → 0 | 2 → 0 | 3 → 0 | 0 → 0 | 4 → 0 |

  Nenhuma violação nova. 768 e 1280 não foram rodados nesta etapa (o pedido nomeia desktop-1440 e mobile-375); a regressão neles fica para a E7. As linhas medidas com limiar variam de 295 para 293 (375) e de 326 para 324 (1440) e os nós de texto aprovados de 956 para 948 (375) e de 1006 para 998 (1440): a linha de base é anterior à E2, E3 e E4, que mudaram a tela de Missões (sem seleção inicial, Missão 0 recolhível), então parte da diferença de contagem vem delas, não dos tokens.
- Menores razões medidas no navegador (E5): corporate container 2,06 (details.glossary-details sobre canvas), divisor 1,48 e 1,42, controle 4,34; tactical container 2,36, divisor 1,72, controle 3,07 (button.lesson-item.active, borda accent-solid). Sob hover, o menor controle medido é 3,07 no tactical. A linha "border-control sobre bg-hover 2,64" da matriz de tokens do tactical segue como informativa: o botão troca a borda para accent-primary no hover (button:hover:not(:disabled) com border-color var(--accent), verificado por teste e pelas amostras de hover sem violação).
- Spec de contraste: não foi alterada, nenhum limiar afrouxado.
- Risco visual: (1) o contorno dos cartões passa de #E2E8F0 para #A5B2C4 no corporate e de #334155 para #475569 no tactical, então a tela inteira fica com moldura mais marcada nos dois temas; divisores internos do corporate passam de #E2E8F0 para #CBD5E1. (2) O banner de aviso no tactical passa de um azul translúcido de 16 por cento para o fundo sólido #0C4A6E, e os alertas de sucesso e de erro ganham fundo sólido de status; o contraste sobe (texto 9,04 a 16,95) e a aparência muda. (3) O texto auxiliar do tactical fica mais claro (#8E9DB2), 0,7 ponto de razão acima de antes sobre surface, mas ainda abaixo de text-secondary. (4) .btn-white não tem uso no TSX; virou botão invertido (texto primario como fundo). Não foi aberto nenhum PNG nesta etapa: a inspeção visual dos dois temas é da E6.
- Cartões não medidos pela spec e fora da lista de containers (.painel-bloco, .itsm-nota, .card-section não flagrado, .step-box, .chat) continuam em border-subtle; a E6 decide, olhando os PNG, se algum precisa de border-strong para não destoar.
- Pendências: .missao-competencias com 11 px (E6); 768 e 1280 px na E7; texto do seletor de arquivo em português (E6).
- Próxima ação: E6 (ajustes por tela guiados pelos PNG dos dois temas), partindo do segundo commit local da E5.

### E6, defeitos registrados antes de corrigir (2026-11-16)

Método: PNG gerados com e2e/visual.spec.ts em desktop-1440 e mobile-375, nos dois temas (portas 8080 e 5173 livres antes de cada execução, uma por vez). Como o Playwright limpa test-results a cada execução, os 40 PNG foram copiados para uma pasta temporária fora do repositório antes da segunda rodada. Abertos 10 PNG: desktop-1440__corporate__aulas, desktop-1440__tactical__aulas, desktop-1440__corporate__caderno, desktop-1440__tactical__mentor, desktop-1440__tactical__laboratorio-itsm, desktop-1440__corporate__laboratorio-simudesk, desktop-1440__corporate__replay, desktop-1440__tactical__credencial, mobile-375__tactical__caderno e mobile-375__corporate__credencial (todos .png). Os valores numéricos vêm de uma medição temporária no DOM (spec e2e/tmp-e6-contraste.spec.ts, apagada ao fim): fonte computada abaixo de 12 px e controles abaixo de 44 px, por tela e tema, nos dois viewports. Telas sem PNG aberto (Missões, Chat, KB, SimuDesk tactical, Replay tactical, Credencial corporate 1440) têm só a medição de DOM.

Higiene de captura confirmada: a barra inferior fixa de 375 px aparece no meio das capturas de página inteira (mobile-375__tactical__caderno.png, mobile-375__corporate__credencial.png) e os rótulos da navegação ficam ocultos; é artefato da neutralização de fixos e do CSS de captura (E1), não defeito de produto. Tooltips ausentes. Nenhum PNG tinha rolagem horizontal (hscroll falso em todas as 40 células medidas).

| Id | Tela e tema | Viewport | Seletor | Medição | PNG |
|---|---|---|---|---|---|
| D1 | Missões, dois temas | 1440 e 375 | span.missao-competencias | 11 px computado, 5 por tela | sem PNG aberto (limite de 10); medição de DOM |
| D2 | Laboratório (todas as abas e o Replay), dois temas | 1440 e 375 | span.dock-contagem, span.dado-mono, contadores das abas e marcas do guia | 11 px computado (n=1 a 6 por tela) | desktop-1440__tactical__laboratorio-itsm.png, desktop-1440__corporate__laboratorio-simudesk.png |
| D3 | Navegação inferior, dois temas | 375 | span.nav-item-rotulo | 11 px computado, 5 itens, em todas as telas | rótulo oculto nas capturas pela higiene de captura; medição de DOM |
| D4 | Credencial, dois temas | 1440 e 375 | code (hash de integridade) | 11,44 px computado | desktop-1440__tactical__credencial.png |
| D5 | Credencial, dois temas | 1440 e 375 | input[type=file] do Verificador offline | texto nativo em inglês (Choose File, No file chosen) | desktop-1440__tactical__credencial.png, mobile-375__corporate__credencial.png |
| D6 | Missões, Aulas, Caderno, Credencial, Replay, dois temas | 1440 e 375 | button.btn-sm (Aulas, Praticar, Enviar ao meu caderno, Abrir no Caderno, Anotações, Atualizar resumo) | 40 px de altura (mínimo 44) | desktop-1440__corporate__aulas.png, desktop-1440__corporate__caderno.png, desktop-1440__tactical__credencial.png |
| D7 | Caderno (plano de estudos), dois temas | 1440 e 375 | .todo input[type=checkbox] e .todo button (remover) | caixa de 20 por 20 px; botão de remover 42 por 40 px | desktop-1440__corporate__caderno.png, mobile-375__tactical__caderno.png |
| D8 | Missões, dois temas | 1440 e 375 | .glossary-details summary (Glossário rápido) | 28 px de altura em 1440 (41 em 375) | sem PNG aberto; medição de DOM |
| D9 | Mentor, ITSM, Chat, Missão do laboratório, dois temas | 1440 e 375 | .chat, .step-box, .painel-bloco, .chat-log em border-subtle | contorno 1,48 e 1,42 (corporate) e 1,41 sobre elevated (tactical); abaixo de 2,0 de container | desktop-1440__tactical__mentor.png, desktop-1440__corporate__laboratorio-simudesk.png |

Não são defeitos de produto do frontend (só registro): (a) o topo do laboratório mostra "Nível Estagiario" sem acento, valor de sessao.meta.nivel vindo do backend (desktop-1440__tactical__laboratorio-itsm.png); (b) o Juiz 360 mostra critérios e práticas sem acento ("Consultou politica", "criterios"), textos do backend (desktop-1440__corporate__replay.png); ambos ficam fora do escopo e da edição de src/backend. (c) Botão desabilitado "Conectar na estação" no SimuDesk corporate aparece claro (desktop-1440__corporate__laboratorio-simudesk.png); controle desabilitado é isento de contraste na WCAG 1.4.3 e 1.4.11, sem ação. (d) "Choose File" do input usa o idioma do navegador; só o texto do botão será trocado, com o input real preservado.

Aulas (desktop-1440__corporate__aulas.png e desktop-1440__tactical__aulas.png) e Mentor (desktop-1440__tactical__mentor.png) sem defeito de layout além dos itens acima.

### E6, ajustes por tela (2026-11-16)

- Commits locais: 743d918 "fix(ux): texto auxiliar de 12 px, alvos de 44 px e contornos de container" (src/frontend/src/index.css, src/frontend/src/tokensContraste.test.ts, src/frontend/e2e/contraste.helper.ts) e o commit "fix(ux): credencial, seletor de arquivo em portugues" (CredencialView.tsx, CredencialArquivo.test.tsx e este registro). Um único arquivo de componente (CredencialView.tsx) foi tocado, dentro do limite de 6.
- Correções: D1, D2, D3 e D4 por um token: --font-size-xs de 11 px para 12 px (afeta .missao-competencias, .dock-contagem, marcas do guia, .nav-item-rotulo em 375 px e .coluna-chave) e code com max(0.88em, var(--font-size-xs)); D6 .btn-sm com min-height var(--touch-target); D7 .todo label com min-height de 44 px (a caixa nativa fica com 20 px e o rótulo inteiro é a área de toque) e .todo .btn com largura mínima de 44 px; D8 .glossary-details summary com 44 px (padding vertical, o resumo da Missão 0 mantém a regra própria); D9 .step-box, .chat, .painel-bloco e .chat-log passam de border-subtle para border-strong; D5 seletor de arquivo da Credencial: input real mantido (classe sr-only, id verificador-arquivo, aria-label "Selecionar arquivo JSON do Currículo Vivo" e aria-describedby no nome do arquivo), label visual "Selecionar arquivo JSON" em .btn .btn-secondary (44 px), texto "Nenhum arquivo selecionado" ou o nome do arquivo escolhido, foco do teclado desenhado no label por input:focus-visible + label.
- Verificações: npm.cmd test -- --run CredencialArquivo.test.tsx, App.test.tsx, tokensContraste.test.ts, EstadoInicial.test.tsx e progressoNivel.test.tsx: 67 de 67 verdes (4 testes novos de nome acessível e teclado, 1 novo de tokens); npm.cmd run lint: 0 avisos e 0 erros; Playwright e2e/contraste.spec.ts em desktop-1440 e mobile-375, 4 de 4 verdes em cada, portas 8080 e 5173 livres antes de cada execução, uma execução por vez; resumo dos JSON gerados: 15 células por tema e viewport, todas medidas, 0 violações de texto, container, divisor, controle e foco (a spec também passou a medir .painel-bloco, .step-box, .chat e .chat-log como container); visual.spec.ts em desktop-1440 e mobile-375, 4 de 4 verdes em cada, sem rolagem horizontal; medição de DOM depois das correções nas 10 telas, dois temas e dois viewports: 0 texto abaixo de 12 px, 0 controle visível abaixo de 44 px exceto a caixa nativa do Caderno (rótulo de 44 px) e o link Pular (fora da tela até receber foco), 0 elemento cortado ou fora da largura; verificação real em navegador do seletor: Tab chega ao input, o rótulo mostra anel sólido de 2 px, o rótulo mede 44 px de altura, setInputFiles mostra o nome do arquivo e o resultado, e clique no rótulo abre o seletor nativo de arquivo. Varredura do caractere E comercial e das formas passadas de sair nas linhas adicionadas: zero.
- Antes e depois por PNG: antes = os 10 PNG listados acima (copiados para pasta temporária); depois = PNG regenerados com o mesmo nome em test-results/visual (e cópia temporária). Como o limite é de 10 PNG abertos por sessão e ele já foi usado na inspeção inicial, os PNG de depois não foram abertos; o depois está comprovado por medição de DOM e pela spec de contraste. Inspeção visual dos PNG de depois (no mínimo desktop-1440__tactical__credencial.png, mobile-375__corporate__credencial.png, desktop-1440__corporate__caderno.png e desktop-1440__tactical__laboratorio-itsm.png) fica como primeira tarefa da E7 ou de uma E6b.
- Desvios: (1) index.css não tinha lista fechada e foi o arquivo de estilo único das correções. (2) O token --font-size-xs sobe para 12 px em vez de trocar cada regra por --font-size-sm: menor mudança e atende o mínimo; os textos xs ficam 1 px maiores em todas as telas. (3) .btn-sm sobe de 40 para 44 px em toda a aplicação (Missões, Aulas, Caderno, Credencial, Replay), mudança visível de densidade. (4) Uma falha pela mesma causa não ocorreu; erros de comando (cd relativo, ReadAllText sem caminho absoluto) foram do shell e não repetidos.
- Pendências (E6b e registro): (a) inspeção visual dos PNG de depois; (b) Chat, KB, Replay tactical, Missões e SimuDesk tactical só tiveram medição de DOM e spec de contraste, sem PNG aberto; (c) textos sem acento vindos do backend (Nível Estagiario no topo do laboratório e critérios do Juiz 360), fora de escopo; (d) caixa nativa do checkbox do Caderno segue com 20 px (área de toque pelo rótulo); (e) 768 e 1280 px não rodados nesta etapa (E7); (f) botão desabilitado Conectar na estação fica claro por ser desabilitado, isento pela WCAG; (g) zoom em 200 por cento e leitor de tela reais, não bloqueantes, na E7.
- Próxima ação: E7 (revalidação completa e comparação com a linha de base), partindo do segundo commit local da E6.
