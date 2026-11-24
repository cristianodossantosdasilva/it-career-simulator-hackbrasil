# Ciclo 2: plano do Kiro CLI

Autor: sim2-planejador (Kiro CLI). Data de observação: 2026-11-16. Participam apenas Kiro CLI, Codex e Copilot. Nada foi implementado, nenhum agente foi criado, nenhuma branch foi criada, nenhum commit foi feito, nenhum servidor nem Playwright foi executado.

## 1. Estado observado

| Item | Documento de contexto | Observado agora | Divergência |
|---|---|---|---|
| Branch e HEAD local | main, a88988c | main, a88988c0007f1cb1cf1f4873ca5dde0208b65c66 | nenhuma |
| main contra origin/main | 0 e 0 | 0 e 0 (após git fetch) | nenhuma |
| CI da main | run 43833833580 verde | run 43833833580 completed success | nenhuma |
| Status do commit (Vercel) | success | success | nenhuma |
| DevLedger, estado atual | 01a1e38d-d617-76f7-aa20-42355fd03e50, 13 entradas sujas | mesmo state_id, HEAD igual, 13 entradas no registro | A árvore tem hoje 15 entradas sujas por causa dos dois arquivos novos em docs/auditoria-ui-ux/ciclo2. Coerente. |
| Último checkpoint | Vitest 58 de 58, Playwright 27 de 27 | checkpoint 01a1e38d-00e7-7d05-9a3c-c7eab34d8559, kind functional, 58 de 58 | nenhuma |
| Handoff ativo | etapa 10 concluída | handoff 01a1e38d-41a4-7d4d-af06-6be54eddfeb2 de 2026-11-16 | nenhuma |

Entradas locais alheias confirmadas na árvore: README.md, docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md, docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md e docs/consultor-vocacional/. Também modificado: docs/auditoria-ui-ux/consolidado/00_PLANO_EXECUCAO_E_PROGRESSO.md.

## 2. Verificação independente dos fatos

Caminhos relativos a src/frontend/src. Razões de contraste calculadas por mim com script temporário em TEMP (apagado), usando a fórmula WCAG 2.x sobre os valores de index.css linhas 69 a 155.

### P1. Pré-seleção do Nível 2

| Afirmação | Veredito | Evidência |
|---|---|---|
| useState inicial do cenário é pasta-rede-inacessivel | confirmado | workstation/TelaInicial.tsx:73 |
| Esse cenário é o nível n1, rotulado Nível 2 | confirmado | educacao/catalogoEducacional.ts (LEVELS) e print desktop-1440__corporate__missoes.png, linha 2 marcada |
| Estado inicial da Academia tem focus n1 | confirmado | educacao/catalogoEducacional.ts:761 |
| focus alimenta menu de perfil, Mentor e Caderno | confirmado | shell/MenuPerfil.tsx:86, educacao/MentorView.tsx:67, 103, 440, 445 |
| Dois botões primários com destinos diferentes | confirmado | TelaInicial.tsx:276 (Estagiário) e TabelaMissoes.tsx:117 (cenário selecionado) |
| É estado e não CSS, igual nos dois temas | confirmado | print tactical__missoes e corporate__missoes mostram a linha 2 selecionada |
| focus é persistido em localStorage | confirmado | catalogoEducacional.ts:753 (chave itfs_academia_v3), 792 a 814: carregarEstadoAcademia faz spread de parsed sobre base. Quem já salvou n1 continua com n1. Não há como distinguir escolha deliberada de padrão antigo sem uma versão ou um marcador. |
| Todo E2E clica em um rádio antes de Iniciar, exceto Demo rápida | confirmado | e2e/jornadas.spec.ts:11 a 20, 29, 121, 153, 192, 241, 305, 349 e visual.spec.ts:77. App.test.tsx:123 também clica. |
| Remover a pré-seleção não quebra os testes | confirmado com ressalva | jornadas.spec.ts:14 e 15 usam iniciar.focus() e Enter. Funciona porque o rádio é ativado antes. Se o botão ficar com o atributo disabled, só funciona depois da seleção. Está compatível, mas o atributo disabled tira o botão do foco do teclado e do leitor de tela, ver crítica C2. |

Achado novo, não está no documento de contexto: o print desktop-1440__corporate__aulas.png abre a Academia em Analista Jr (N1), Módulo 2 de 5, com Teoria 0%. Um aluno novo cai no segundo nível, não no primeiro. A causa é o mesmo focus n1. Já obterProximaAcao (catalogoEducacional.ts:877) percorre os níveis a partir do Estagiário, então o Primeiro Missão manda para o Estagiário e a Aula manda para o N1. Duas fontes de verdade contradizem uma à outra.

### P2. Missão 0 abaixo das missões

Confirmado. TelaInicial.tsx: PrimeiroVoo (269), TabelaMissoes (282), seção Missão 0 (295 a 310), Glossário (312), Transparência (323). O print mede 1440 por 2004 px, e a Missão 0 começa em torno de y 1340. Os 4 passos da Missão 0 repetem em parte os 3 passos do Primeiro Missão (Estudar, Praticar, Revisar), com objetivo diferente: o Primeiro Missão descreve a jornada da Academia e a Missão 0 descreve o que fazer dentro do chamado.

### P3. Contraste e contornos do corporate

Razões recalculadas. Valores do documento de contexto reproduzidos exatamente.

| Par | Corporate | Tactical |
|---|---|---|
| border-subtle sobre surface | 1,23 | 1,72 |
| border-subtle sobre canvas | 1,18 | 1,82 |
| border-subtle sobre elevated | 1,13 | 1,41 |
| border-strong sobre surface | 1,48 | 2,36 |
| border-strong sobre canvas | 1,42 | não medido |
| border-strong sobre elevated | 1,36 | não medido |
| border-control sobre surface | 4,76 | 3,75 |
| border-control sobre elevated | 4,34 | 3,07 |
| text-muted sobre surface | 5,20 | 5,73 |
| text-muted sobre elevated | 4,75 | 4,69 |
| text-muted sobre hover | 4,22 (abaixo de 4,5) | 4,02 (abaixo de 4,5) |
| text-secondary sobre hover | 6,15 | 4,89 |
| accent-primary sobre surface | 5,81 | não aplicável |

Correções e acréscimos ao documento de contexto:

1. O text-muted sobre bg-hover abaixo de 4,5:1 também ocorre no tactical (4,02). O documento só cita o corporate. Corrigir os dois temas. Onde isso aparece depende de haver texto muted sobre estado hover ou selecionado, a medir no navegador.
2. Cores fixas: refutado em parte. index.css:1059 a 1061 tem override de tactical para .banner-notice, .alert-success e .alert-danger. A afirmação "não acompanham o tema escuro" é falsa para esses três. Continuam fixos e sem token: .btn-white (249, 250), seletor de arquivo (732, 733), que no print corporate__credencial aparece como botão escuro com o rótulo nativo "Choose File" e "No file chosen" em inglês, e as cores dos próprios overrides (valores literais em vez de tokens). Corporate é o tema base do :root, tactical é aplicado por data-theme no html (index.html) e SimuDeskApp.tsx:371 força tactical dentro do terminal mesmo no corporate. Isso é intencional e deve constar nos critérios.
3. Contrastes dos fixos: banner 8,24, borda do banner 3,57, success 8,30, danger 8,20, btn-white 17,28, botão de arquivo 10,35. Nenhum falha. O problema deles é manutenção e tema, não contraste.
4. Teste de contraste existente (App.test.tsx:19 a 59) usa valores hexadecimais que não existem mais nos tokens (#0d1322, #131c31, #f3f5f8, #0369a1). Ele passa, mas não protege os tokens atuais. Confirmado, é uma lacuna maior do que a descrita no contexto.
5. axe nos testes: confirmado que nenhum teste configura color-contrast e que jsdom não calcula cores renderizadas. Os testes axe existentes (ChatApp, IntranetApp, ItsmApp, SimuDeskApp e outros) provam estrutura, rótulos e papéis, não contraste.

### Estado limpo, F 20% e Em andamento

Confirmado e causa encontrada. DEFAULT_PAGES (catalogoEducacional.ts:684) semeia duas páginas Cornell com notas já preenchidas, uma para estagiario (703 a 708) e outra para n1 (711 a 717). calcularProgressoNivel (857 a 870) soma 20 em f quando a página Cornell do nível tem mais de 20 caracteres de notas. Resultado em estado limpo: estagiario e n1 com f 20%, e descreverEstado (TabelaMissoes.tsx:22 a 26) devolve "Em andamento" porque f maior que 0. Só os níveis com página semeada ficam assim. É um defeito de dados, não de CSS: o texto de exemplo conta como progresso do aluno. Nos prints, Nível 1 e Nível 2 mostram "Em andamento, T 0%, F 20%, P 0%" e o Primeiro Missão diz "Teoria em 0%". Mesmo efeito na Credencial: "Estagiário Teoria 0%, Fixação 20%, Prática 100%".

Os prints de laboratório e credencial não são de estado limpo: a spec visual executa um turno do Estagiário antes (XP 60, Prática 100%). Isso é esperado, mas muda a leitura de "estado limpo" nos prints.

### Prints inspecionados (nenhum PNG novo gerado)

desktop-1440__corporate__missoes.png, desktop-1440__tactical__missoes.png, desktop-1440__corporate__laboratorio-itsm.png, desktop-1440__tactical__laboratorio-itsm.png, desktop-1440__corporate__aulas.png, desktop-1440__corporate__replay.png, desktop-1440__corporate__credencial.png e mobile-375__corporate__caderno.png. Caderno, Mentor, mobile e tablet restantes ficam para a etapa de inspeção.

Observações visuais:

- Corporate missoes: contorno dos cards e das linhas da tabela é perceptível mas fraco; cards "Missão 0" e "Transparência" ficam pouco separados do canvas. O foco visual da linha 2 (borda de acento) é a única marcação forte da página, o que reforça a falsa escolha.
- Texto auxiliar monoespaçado "T 0%, F 20%, P 0%" é pequeno e críptico. A Credencial usa "Teoria 0%, Fixação 20%, Prática 100%" por extenso. Rótulos inconsistentes.
- Corporate laboratorio-itsm: a tabela "Fila de chamados" e o cartão do chamado são legíveis, o contorno está discreto. O campo "Nível Estagiario" na barra superior aparece sem acento no print. A confirmar no código (pode vir de dado do backend, que não pode ser editado).
- Corporate aulas e credencial: o tooltip do ícone da barra lateral ("Aulas", "Credencial") ficou sobreposto ao conteúdo, porque o mouse permaneceu sobre o item durante a captura. É artefato do método de captura, não defeito de produto. A spec de linha de base deve mover o mouse para fora antes de capturar.
- Mobile-375 corporate caderno: o PNG tem 984 por 3722 e a navegação inferior fixa aparece no meio da página, por cima do conteúdo. É efeito de captura com fullPage e elemento fixo. Não usar fullPage com a barra fixa visível; capturar por viewport com rolagem ou esconder a barra fixa na captura.
- Tactical missoes: o botão primário tem o mesmo problema de seleção implícita. Contraste do texto do botão em tactical a medir no navegador (accent-contrast #0B1120 sobre #0EA5E9 calcula 6,6 em tokens, o print parece mostrar texto claro; conferir se algum seletor sobrescreve a cor).
- Credencial: seletor de arquivo nativo em inglês em uma interface em português.
- Textos sem acento no relatório do Juiz 360 (por exemplo "Consultou politica", "verificacao") vêm do backend (src/backend), que não pode ser editado. Registrar como observação fora de escopo.

## 3. O que ficou de fora (varredura dirigida)

Busca feita por leitura de index.css e dos arquivos citados. A confirmar no navegador na etapa E1.

1. Pré-seleção implícita secundária: focus n1 afeta Aulas (abre em N1), Mentor (flashcards e preenchimento STAR de n1) e menu de perfil. Entra em P1.
2. Duas fontes de verdade para "próximo passo": obterProximaAcao parte do Estagiário; focus parte do N1.
3. Progresso falso por dados semeados: F 20% em dois níveis. Entra em P1.
4. Teste de tokens obsoleto em App.test.tsx. Entra em E4.
5. Rótulo duplo "Nível 2: Analista Jr (N1)" vs id n1. O rótulo da interface já é consistente (Nível 1 a 5 mais sufixo entre parênteses), o id fica. Documentar em um comentário, sem renomear.
6. Seletor de arquivo com rótulo nativo em inglês e cor fixa. Corrigir com token e, se possível, rótulo próprio em português com o input real acessível por baixo.
7. Texto auxiliar pequeno e monoespaçado em linhas de missão e Credencial: medir o tamanho computado no navegador (limiar sugerido: 12 px mínimo para texto auxiliar, 14 px para texto de leitura).
8. Contornos fracos em corporate para todos os containers: .edu-card, .panel, .glossary-details, tabelas, campos de formulário do tipo .verifier-textarea (usa border-bright que aponta para border-control, ok).
9. Terminal do SimuDesk em tactical dentro do corporate: aceitável por design, mas o contraste do terminal precisa ser medido no navegador como superfície própria.
10. Sobreposição de tooltip e barra fixa nas capturas: ver seção 2.

## 4. Crítica ao plano-base

| Ponto | Crítica | Decisão |
|---|---|---|
| E1 sem corrigir nada | Correto, mas a baseline deve ser o único pré-requisito de E2 a E5 e deve rodar com método estável (mouse fora, sem fullPage com barra fixa). | Manter. Acrescentar: gravar JSON da linha de base para a comparação final. |
| E2 junta P1 e P2 | Mistura mudança de estado e mudança de ordem. Os testes afetados são diferentes e uma regressão fica difícil de isolar. | Separar: E2 (estado inicial, F 20%), E3 (ordem da Missão 0). |
| D1 usa o atributo disabled | O botão desabilitado some do foco do teclado e do leitor de tela, e o motivo só aparece em texto avulso. | Usar aria-disabled com texto de apoio ligado por aria-describedby e bloquear o clique. Não usar o atributo disabled para esse caso. |
| D1 muda focus padrão para estagiario | Correto, mas não resolve quem já tem n1 salvo. | Decisão do usuário (pergunta 4). Recomendação: não migrar. |
| D2 recolher com details quando há progresso | Tecnicamente ok. Risco: details sem estado persistido reabre a cada visita. | Calcular o atributo open só na montagem a partir de temProgresso e não persistir. |
| D2 sem tratar a sobreposição | O Primeiro Missão e a Missão 0 repetem a ideia de "como começar". | Manter as duas seções, mas Missão 0 logo depois do Primeiro Missão e antes da tabela, com título e texto que a diferenciam (o que fazer dentro do chamado). Não fundir agora. |
| E3 de tokens com modelo forte | A decisão de design fica fechada por limiares medidos neste plano. Com limiares fechados o modelo intermediário basta. Modelo forte só se a reiteração falhar duas vezes. | Rebaixar para sonnet. |
| E4 inspeção visual sem ordem | Pode competir com E3 (tokens) se as telas forem ajustadas antes dos tokens. | E5 só depois de E4. |
| E5 e E6 | Revalidação e fechamento corretos. | Renumerados como E6 e E7. |
| Falta | Teste de tokens real, método de captura, tratamento de focus salvo, rótulo do seletor de arquivo, F 20%. | Incluídos. |

Dependências ocultas:

- E2 depende da decisão do usuário (pergunta 1) e muda um valor que 4 componentes leem.
- E4 não pode começar antes de E1 (precisa da linha de base) e deve terminar antes de E5.
- Todas as capturas dependem do backend de teste na porta 8080. Rodar sempre uma suíte por vez.
- O teste de tokens por leitura de index.css exige importação com sufixo ?raw do Vite; funciona no Vitest sem pacote novo. A confirmar na E4.

## 5. Etapas

Convenção: cada etapa é uma sessão nova. Todas começam com economia-desenvolvimento e leitura dirigida. Comandos no frontend com npm.cmd e npx.cmd. Sem push, merge, deploy ou npm install sem confirmação. Branch ux-ciclo-2.

| Etapa | Agente | Modelo | Sessão nova |
|---|---|---|---|
| E1 base de medição | sim2-medicao | claude-sonnet-5.5 | sim |
| E2 estado inicial (P1) | sim2-implementador | claude-sonnet-5.5 | sim |
| E3 ordem da Missão 0 (P2) | sim2-implementador | claude-sonnet-5.5 | sim |
| E4 tokens e contornos (P3) | sim2-implementador | claude-sonnet-5.5 | sim |
| E5 ajustes por tela | sim2-implementador | claude-sonnet-5.5 | sim |
| E6 revalidação | sim2-validador | claude-haiku-5.5 | sim |
| E7 fechamento | sim2-fechamento | claude-haiku-5.5 | sim |

### E1. Base de medição (sim2-medicao)

- Objetivo: criar a branch, reconstruir o grafo, tratar a árvore, criar a spec de contraste e contorno e gerar a linha de base sem corrigir nada.
- Arquivos exatos:
  - criar src/frontend/e2e/contraste.spec.ts (e helper src/frontend/e2e/contraste.helper.ts se necessário);
  - gerar docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e o JSON docs/auditoria-ui-ux/ciclo2/10_linha_de_base.json;
  - editar src/frontend/playwright.config.ts somente se for preciso registrar a nova spec nos projetos existentes (preferir reaproveitar os 5 projetos sem projeto novo);
  - criar docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md.
- Critérios de aceite: spec roda nos 2 temas e 4 viewports sem erro de execução; relatório lista cada violação com seletor, par de cores e razão; valores de border-subtle, border-strong e border-control medidos nos elementos reais; o JSON contém totais por tema e viewport; nenhum arquivo de produção alterado (git diff mostra só e2e e docs); zero caractere E comercial; sem pacote novo.
- Menor conjunto de testes: npx.cmd playwright test e2e/contraste.spec.ts --project=desktop-1440 para depurar e depois uma rodada completa nos 5 projetos. Lint de src/frontend.
- Riscos: conflito de porta 8080 ou 5173; HTTP 429; flakiness do tooltip e da barra fixa.
- Dependência: nenhuma. Decisões do usuário 2 e 3 já respondidas.
- Sessão nova: sim.

### E2. Estado inicial: pré-seleção, focus e progresso falso (sim2-implementador)

- Objetivo: nenhuma missão selecionada ao abrir; focus inicial coerente com o Primeiro Missão; progresso do aluno sem contar notas semeadas.
- Arquivos exatos: src/frontend/src/workstation/TelaInicial.tsx (estado cenario como string vazia e seletor), src/frontend/src/workstation/TabelaMissoes.tsx (botão com aria-disabled, texto de apoio, ids com aria-describedby), src/frontend/src/educacao/catalogoEducacional.ts (focus inicial e hasNotes), testes src/frontend/src/App.test.tsx, src/frontend/src/educacao/*.test.* (criar teste de calcularProgressoNivel em estado limpo se não existir) e src/frontend/e2e/jornadas.spec.ts apenas se um seletor quebrar.
- Critérios de aceite: ao abrir em estado limpo nenhum rádio de missão marcado; botão Iniciar com aria-disabled verdadeiro, texto "Escolha uma missão" visível e associado; ao selecionar, aria-disabled some; Demo rápida continua iniciando Nível 2 com C1; focus inicial estagiario; calcularProgressoNivel em estado limpo devolve t 0, f 0, p 0 para todos os níveis e a tabela mostra "Não iniciada" nos 5; com notas editadas pelo aluno em página Cornell, f volta a subir; usuário com n1 salvo permanece em n1; ids intactos.
- Menor conjunto de testes: npm.cmd test -- --run src/App.test.tsx e o teste novo; npm.cmd run lint. E2E: apenas "Feliz 1" e o teste 375 de jornadas.spec.ts (npx.cmd playwright test e2e/jornadas.spec.ts -g "Feliz 1" --project=chromium e a variante 375), por serem os que clicam Iniciar.
- Riscos: seletores por role e texto; hasNotes precisa distinguir texto semeado do digitado (comparar com o valor de DEFAULT_PAGES ou marcar página editada); páginas do Caderno dependem de focus.
- Dependência: E1 (branch e grafo) e resposta à pergunta 1.
- Sessão nova: sim.

### E3. Ordem da Missão 0 (sim2-implementador)

- Objetivo: Missão 0 logo depois do Primeiro Missão e antes da tabela de missões.
- Arquivos exatos: src/frontend/src/workstation/TelaInicial.tsx; se virar componente, src/frontend/src/workstation/MissaoZero.tsx; CSS mínimo em src/frontend/src/index.css apenas se necessário; testes em App.test.tsx.
- Critérios de aceite: ordem DOM Primeiro Missão, Missão 0, Missões, Glossário, Transparência; sem progresso a Missão 0 vem aberta; com progresso vem recolhida (details sem atributo open); título e lead diferenciam da seção Primeiro Missão; sem rolagem horizontal em 375 px; altura total em 1440 px não aumenta mais que 5% (hoje 2004 px) quando recolhida.
- Menor conjunto de testes: npm.cmd test -- --run src/App.test.tsx; npm.cmd run lint; npx.cmd playwright test e2e/visual.spec.ts --project=desktop-1440 -g "missoes" só para ver o PNG (um projeto).
- Riscos: foco do teclado e ordem de leitura; testes que dependem de posição.
- Dependência: E2.
- Sessão nova: sim.

### E4. Tokens, contornos e cores fixas (sim2-implementador)

- Objetivo: corrigir os pares abaixo do limiar, trocar cores fixas por tokens e tornar o teste de contraste dependente dos tokens reais.
- Arquivos exatos: src/frontend/src/index.css (tokens linhas 69 a 155; .btn-white 249 e 250; seletor de arquivo 732 e 733; overrides 1056 a 1061), src/frontend/src/App.test.tsx (substituir o bloco de hexadecimais obsoletos por leitura dos tokens de index.css), eventualmente o componente do verificador de arquivo (Credencial) para o rótulo em português.
- Critérios de aceite (limiares da seção 6): todos os pares de texto dos tokens, nos dois temas, incluindo hover e elevated, com no mínimo 4,5:1; border-control com no mínimo 3:1 sobre surface e elevated nos dois temas; border-strong com no mínimo 2,0:1 sobre surface, canvas e elevated no corporate; border-subtle com no mínimo 1,4:1 sobre surface e canvas no corporate; tactical não regride em nenhum par; botão de arquivo e btn-white sem cor literal fora de token; baseline da E1 reexecutada com menos violações e nenhuma nova.
- Candidatos medidos: corporate border-strong #A9B6C7 (2,06 surface, 1,97 canvas, 1,88 elevated) fica no limite, #9AA8BB (2,42, 2,31, 2,21) cumpre com folga; border-subtle #CBD5E1 (1,48 surface); text-muted corporate #586980 (4,55 sobre hover, 5,12 sobre elevated); text-muted tactical #94A1B5 (4,79 sobre hover, 5,59 sobre elevated). O agente deve confirmar no navegador e escolher o menor deslocamento visual que cumpre.
- Menor conjunto de testes: npm.cmd test -- --run src/App.test.tsx; npm.cmd run lint; npm.cmd run build; a spec contraste.spec.ts em desktop-1440 e mobile-375, nos 2 temas.
- Riscos: contorno mais escuro muda a aparência de todo o corporate; mudar border-subtle afeta divisores internos; text-muted mais escuro reduz a hierarquia com text-secondary (4,89 a 6,92). Manter secondary mais escuro que muted em todos os fundos.
- Dependência: E1 (baseline) e pergunta 5.
- Sessão nova: sim.

### E5. Ajustes por tela com inspeção dos PNG (sim2-implementador)

- Objetivo: inspecionar os PNG de Aulas, Caderno, Mentor, ITSM, SimuDesk, Chat, Intranet (KB), Replay e Credencial nos dois temas e corrigir defeitos pontuais.
- Arquivos exatos: lista decidida pela inspeção. Limite: no máximo 6 arquivos de componente e index.css por sessão. Qualquer excesso vira E5b.
- Critérios de aceite: cada defeito corrigido tem antes e depois com nome do PNG; zero violação nova na spec de contraste; sem rolagem horizontal em 375 px; alvos de 44 px; foco visível; texto auxiliar com no mínimo 12 px computado.
- Menor conjunto de testes: testes Vitest do componente alterado e playwright visual de um projeto (desktop-1440) mais mobile-375 para as telas tocadas.
- Riscos: crescimento de escopo; cada correção precisa de evidência.
- Dependência: E4.
- Sessão nova: sim.

### E6. Revalidação (sim2-validador)

- Objetivo: lint, Vitest, build, dotnet build, Playwright nos 5 projetos, spec de contraste, varreduras. Só relata.
- Arquivos exatos: escreve apenas docs/auditoria-ui-ux/ciclo2/11_RELATORIO_VALIDACAO.md e 09_REGISTRO_PROGRESSO.md.
- Critérios de aceite: todos os portões verdes; contraste sem violação de texto; contornos nos limiares; comparação com a baseline da E1 em tabela; varredura de E comercial e de verbo sair zerada.
- Menor conjunto: o completo, uma vez. Rodar uma única execução de Playwright.
- Riscos: porta e limitador.
- Dependência: E5. Sessão nova: sim.

### E7. Fechamento (sim2-fechamento)

- Objetivo: revisar o diff, commits por etapa, merge fast-forward e push com confirmação, CI, DevLedger.
- Arquivos exatos: nenhum de código. Atualiza 09_REGISTRO_PROGRESSO.md e o DevLedger por fluxo append-only.
- Critérios de aceite: confirmações do usuário em commit, merge e push; CI verde; Vercel em success; DevLedger com estado novo.
- Dependência: E6 aprovado. Sessão nova: sim.

## 6. Plano de validação visual do corporate

Método:

1. Playwright em navegador real (Chromium) com a spec e2e/contraste.spec.ts, que reaproveita os 5 projetos existentes.
2. axe-core injetado sem pacote novo: page.addScriptTag com o arquivo axe.min.js de node_modules/axe-core (já é devDependency), e depois page.evaluate de axe.run restrito à regra color-contrast.
3. axe-core não avalia contraste de bordas. Para elas, page.evaluate percorre os seletores de container (.edu-card, .panel, .glossary-details, .missao-linha, tabelas, campos de formulário), lê getComputedStyle (border-top-color e a cor de fundo efetiva percorrendo os ancestrais até uma cor opaca) e calcula a razão. O resultado vai para o JSON.
4. Para cada tela, anotar tema, viewport, seletor, par, razão e limiar.

Telas: Missões, Aulas, Caderno, Mentor, Credencial, Laboratório com ITSM, Chat, KB, SimuDesk e Juiz 360 e Replay. Temas tactical e corporate. Viewports 375, 768, 1280 e 1440.

Pares e limiares (fechados):

| Categoria | Limiar | Justificativa |
|---|---|---|
| Texto de qualquer tamanho | 4,5:1 | WCAG 1.4.3, nível AA. |
| Texto grande (18 pt ou 14 pt em negrito) | 3:1 | WCAG 1.4.3. |
| Controles: border-control, foco, ícone isolado, rádio, caixa de seleção, campo de formulário | 3:1 sobre o fundo adjacente | WCAG 1.4.11, componentes de interface e objetos gráficos. |
| Contorno de container (card, painel, tabela): border-strong | 2,0:1 sobre surface, canvas e elevated | WCAG 1.4.11 não exige contorno em card decorativo, porque o card é identificado pelo título, pelo conteúdo e pela sombra. Mas um contorno abaixo de 1,5:1 some em tela com brilho alto ou projetor. 2:1 é o ponto em que o contorno passa a ser percebido sem competir com os controles (que ficam em 3:1 ou mais). É um critério de projeto, não um requisito do WCAG. |
| Divisor interno e linha de tabela: border-subtle | 1,4:1 sobre surface e canvas | Decorativo, o conteúdo da linha já separa. Evita o 1,23:1 atual que some. |
| Texto auxiliar | 12 px mínimo computado e 4,5:1 | Evita texto pequeno e fraco ao mesmo tempo. |
| Alvos | 44 px | Regra do projeto. |

Inspeção dos PNG: abrir no máximo 10 por sessão, preferir 1440 e 375, um por tela e tema, escolhendo os que a spec marcou com mais violação. Citar sempre o nome do arquivo. Antes de capturar: mover o mouse para fora (page.mouse.move(0, 0)), tirar o foco do elemento ativo, desativar animações (reducedMotion), e não usar fullPage com barra inferior fixa visível. Prints de laboratório e credencial dependem de um turno executado: rotular "estado com turno concluído".

Portas e limitador:

- Antes da rodada, Get-NetTCPConnection -LocalPort 8080,5173 para confirmar que estão livres. Se algum processo estiver ouvindo, parar e perguntar ao usuário.
- Uma execução de Playwright por vez, workers 1 (já é a configuração). Sem segunda sessão do Kiro, Codex ou Copilot rodando Playwright ao mesmo tempo.
- O limite de 5000 requisições por minuto só vale para o backend que o próprio Playwright inicia. Um backend preexistente na 8080 usa 120 por minuto e gera 429. Por isso a spec deve navegar menos (reutilizar a mesma página por tela e tema, sem recarregar) e a rodada completa não deve reusar servidor existente.

## 7. Estratégia de branch e commits

- Branch: git switch -c ux-ciclo-2 main. Não usar git switch para main depois.
- As entradas alheias (README.md, docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md, docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md, docs/consultor-vocacional/) acompanham a troca de branch porque são alterações locais. Nunca usar git add -A nem git add . : sempre git add com caminhos explícitos. Conferir git diff --cached --stat antes de cada commit. Nenhum git stash, git clean ou git checkout nos arquivos alheios.
- Commits pequenos por etapa, mensagens no estilo do repositório (tipo e escopo em minúsculas, descrição em português sem acento quando o histórico faz isso, sem E comercial):
  - chore(docs): plano e revisões do ciclo 2 (somente docs/auditoria-ui-ux/ciclo2)
  - docs(ciclo1): registrar fechamento da etapa 10 (somente se a pergunta 2 for sim)
  - test(ux): base de medicao de contraste e contorno (E1)
  - fix(ux): estado inicial sem missao selecionada e progresso real (E2)
  - feat(ux): Missao 0 antes das missoes (E3)
  - fix(ux): tokens de contorno e texto do tema corporate (E4)
  - fix(ux): ajustes por tela do ciclo 2 (E5, um por tela se grande)
- Merge fast-forward para main e push só no fechamento, com confirmação explícita do usuário.

## 8. Decisões do usuário

1. Pré-seleção ao abrir.
   - Recomendação: nenhuma missão selecionada, botão Iniciar com aria-disabled e texto "Escolha uma missão".
   - Alternativa: pré-selecionar o Nível 1.
   - Custo de mudar depois: baixo (um valor de useState e dois testes).
2. A linha final da etapa 10 em docs/auditoria-ui-ux/consolidado/00_PLANO_EXECUCAO_E_PROGRESSO.md entra em um commit separado de documentação no começo do ciclo?
   - Recomendação: sim, em commit próprio, antes da E1.
   - Custo de mudar depois: baixo (commit isolado, fácil de reverter ou deslocar).
3. Os 4 arquivos e pastas alheios ficam fora do ciclo?
   - Recomendação: sim, fora. Nunca versionados por este ciclo.
   - Custo de mudar depois: nenhum.
4. Quem já tem focus n1 salvo no navegador: migrar para estagiario ou respeitar o valor salvo?
   - Recomendação: respeitar (não migrar). Não há como distinguir escolha de padrão antigo sem introduzir versão de esquema, e o impacto é só em quem já usou o produto. A demo do hackathon usa navegador novo.
   - Custo de mudar depois: médio (exige versão de esquema e migração, mais um teste).
5. Limiar do contorno de container no corporate: 2,0:1 (recomendado) ou 3:1.
   - Recomendação: 2,0:1 para border-strong de containers e 3:1 só para controles. 3:1 em todo card escurece demais o tema claro e iguala os containers aos controles.
   - Custo de mudar depois: baixo (um token), mas exige nova inspeção visual.

Incluído por padrão, sem pergunta, e removível pelo usuário: correção do F 20% semeado na E2 e troca do rótulo nativo do seletor de arquivo na E4.

## 9. Especificação dos agentes sim2-* (não criados)

Formato igual aos sim-* existentes. Todos: branch ux-ciclo-2, nunca git push, merge ou git switch para main (exceto o fechamento, com confirmação), sem editar src/backend, src/frontend/src/api/** nem src/frontend/src/utils/jcs.ts, sem E comercial, sem forma passada do verbo sair, sem emoji.

### sim2-medicao

- name: sim2-medicao
- description: Etapa E1 do ciclo 2. Cria a branch ux-ciclo-2, reconstrói o grafo, trata a árvore e entrega a spec de contraste e a linha de base. Não corrige produto.
- model: claude-sonnet-5.5. Justificativa: escreve código de teste com cálculo de cor em page.evaluate e precisa de julgamento sobre falso positivo. Haiku tende a errar o cálculo e o escopo.
- tools: ["read", "write", "shell"]
- includeMcpJson: false
- resources: file://docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md
- permissions: fs_write permitido em src/frontend/e2e/contraste.spec.ts, src/frontend/e2e/contraste.helper.ts, src/frontend/playwright.config.ts e docs/auditoria-ui-ux/ciclo2/**. shell permitido: git --no-optional-locks *, git status*, git switch -c ux-ciclo-2 main, git add com caminhos explícitos, git commit, git diff*, git log*, graphify*, npm.cmd run lint*, npx.cmd playwright test*, Get-NetTCPConnection*, Select-String*, Get-Content*, Get-ChildItem*, Test-Path*. Negado: git push*, git reset*, git clean*, git merge*, git add -A*, git add .*, git stash*, npm.cmd install*.
- welcomeMessage: "Medicao: crio a base de contraste e contorno. Nao corrijo produto."
- Corpo: papel de engenheiro de QA visual; procedimento da E1 desta seção 5; parar após duas falhas pela mesma causa; registrar em 09_REGISTRO_PROGRESSO.md.

### sim2-implementador

- name: sim2-implementador
- description: Etapas E2 a E5 do ciclo 2. Implementa uma etapa por sessão, conforme o prompt, dentro do escopo de arquivos listado.
- model: claude-sonnet-5.5. Justificativa: melhor custo por tarefa de código de interface e leitura de PNG. Subir para opus só se a mesma causa falhar duas vezes e o usuário autorizar.
- tools: ["read", "write", "shell"]
- includeMcpJson: false
- resources: file://docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md
- permissions: fs_write permitido em src/frontend/src/** (exceto api e utils/jcs.ts, negados explicitamente), src/frontend/e2e/**, docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md. Negado fs_write em src/backend/**, src/frontend/src/api/**, src/frontend/src/utils/jcs.ts. Shell permitido: git --no-optional-locks *, git status*, git diff*, git log*, git add com caminhos explícitos, git commit, npm.cmd run lint*, npm.cmd test -- --run*, npm.cmd run build*, npx.cmd playwright test*, Get-NetTCPConnection*, Select-String*, Get-Content*, Get-ChildItem*, Test-Path*. Negado: git push*, git reset*, git clean*, git merge*, git switch*, git checkout*, git add -A*, git add .*, git stash*, npm.cmd install*.
- welcomeMessage: "Implementador: uma etapa por sessao, so nos arquivos da etapa."
- Corpo: ler somente os arquivos listados na etapa; menor conjunto de testes; atualizar teste no mesmo passo se um texto mudar de propósito; commit pequeno ao fim se o usuário pedir; parar após duas falhas pela mesma causa.

### sim2-validador

- name: sim2-validador
- description: Etapa E6 do ciclo 2. Executa lint, testes, build, Playwright, spec de contraste e varreduras. Não corrige código.
- model: claude-haiku-5.5. Justificativa: tarefa mecânica, saída em tabela.
- tools: ["read", "write", "shell"]
- includeMcpJson: false
- resources: file://docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md
- permissions: fs_write só em docs/auditoria-ui-ux/ciclo2/11_RELATORIO_VALIDACAO.md e 09_REGISTRO_PROGRESSO.md. Shell: igual ao sim-validador, sem git commit. Negado: git push*, git reset*, git clean*, git commit*, git merge*, npm.cmd install*.
- welcomeMessage: "Validador do ciclo 2: executo e relato. Nao corrijo."
- Corpo: igual ao sim-validador, com a branch ux-ciclo-2 e as varreduras de E comercial montadas por [char]38 e do verbo sair.

### sim2-fechamento

- name: sim2-fechamento
- description: Etapa E7 do ciclo 2. Revisa o diff, faz commit, merge fast-forward e push com confirmação, acompanha o CI e atualiza o Git e o DevLedger.
- model: claude-haiku-5.5. Justificativa: portões de confirmação do usuário tornam a tarefa de baixo risco.
- tools: ["read", "write", "shell"]
- includeMcpJson: false
- resources: file://docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md
- permissions: shell com git commit, git merge --ff-only, git push e gh run list permitidos, cada um mediante confirmação textual do usuário no chat. Negado: git push --force*, git reset --hard*, git clean*, git add -A*, git add .*.
- welcomeMessage: "Fechamento: so avanco com a sua confirmacao em commit, merge e push."
- Corpo: reproduzir os portões do sim-fechamento do ciclo 1, trocando a branch para ux-ciclo-2 e a mensagem do commit.

## 10. Observações de método

- Contraste calculado por mim: script temporário em TEMP, executado com node, apagado em seguida.
- O banco DevLedger foi aberto em somente leitura (sqlite3 -readonly) e nada foi escrito.
- Não foram executados Playwright, servidores, npm install, graphify, commits nem criados agentes ou branch.
