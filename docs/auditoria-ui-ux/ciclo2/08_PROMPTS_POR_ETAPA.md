# Ciclo 2: prompts por etapa

Uma etapa por sessão. Abra o terminal na raiz D:\Projetos\Ativos\it-flight-simulator-hackbrasil e execute o comando indicado. Todos os prompts apontam para 07_PLANO_FINAL.md e registram o progresso em 09_REGISTRO_PROGRESSO.md. Participam apenas Kiro CLI, Codex e Copilot.

| Etapa | Agente | Modelo | Sessão nova | Resultado esperado |
|---|---|---|---|---|
| E1 | sim2-medicao | claude-sonnet-5.5 | sim | branch, 2 commits de docs, grafo, spec de contraste, linha de base |
| E2 | sim2-implementador | claude-sonnet-5.5 | sim | nenhuma missão pré-selecionada, focus estagiario, botão com guarda |
| E3 | sim2-implementador | claude-sonnet-5.5 | sim | progresso real e rótulos por extenso |
| E4 | sim2-implementador | claude-sonnet-5.5 | sim | Missão 0 antes das missões |
| E5 | sim2-implementador | claude-sonnet-5.5 | sim | tokens, literais e teste de tokens real |
| E6 | sim2-implementador | claude-sonnet-5.5 | sim | ajustes por tela nos dois temas |
| E7 | sim2-validador | claude-haiku-5.5 | sim | relatório de validação e comparação com a baseline |
| E8 | sim2-fechamento | claude-sonnet-5.5 | sim | commits, merge fast-forward, push, CI e DevLedger |

Regras comuns a todos os prompts: parar após duas falhas pela mesma causa; sem push, merge, deploy ou npm install sem confirmação; caminhos explícitos em todo git add; os 4 itens alheios nunca entram em commit; sem E comercial e sem forma passada do verbo sair.

---

## E1. Base de medição

Comando: `kiro-cli chat --agent sim2-medicao`

```text
Execute a etapa E1 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

1. Carregue a skill economia-desenvolvimento. Leia docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md, somente a seção "E1. Base de medição" e a seção 4 (limiares), e docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md.
2. Registre o estado inicial (git status, HEAD, lista dos 4 itens alheios). A main deve estar em a88988c. Se não estiver, pare e informe.
3. Crie a branch com git switch -c ux-ciclo-2 main. Em seguida faça os dois commits de documentação descritos no seu procedimento (passo 3b), cada um com git add de caminho explícito e git diff --cached --stat conferido.
4. Reconstrua o grafo com graphify --code-only. Confirme as portas 8080 e 5173 livres antes de qualquer Playwright.
5. Crie src/frontend/e2e/contraste.spec.ts, ajuste a higiene de captura em src/frontend/e2e/visual.spec.ts e gere docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e 10_linha_de_base.json, conforme o plano. Cobertura: 9 telas, 2 temas, 4 viewports, cada célula "medida" ou "não calculável" com motivo, e rótulo de estado (limpo ou turno concluído).
6. Verificações mínimas: npm.cmd run lint no frontend, uma depuração em desktop-1440, uma rodada nos 5 projetos, e git diff --stat mostrando somente e2e e docs. Nenhum arquivo de produção alterado.
7. Atualize 09_REGISTRO_PROGRESSO.md (linha da E1 e status da tabela) e faça o commit "test(ux): base de medicao de contraste e contorno".
8. Resposta final: resumo da baseline (violações por tema e viewport), elementos não calculáveis, estado da árvore e a próxima etapa (E2, em sessão nova).

Não corrija código de produção. Não faça push nem merge.
```

---

## E2. Seleção inicial e focus

Comando: `kiro-cli chat --agent sim2-implementador`

```text
Execute a etapa E2 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e que a E1 está concluída em docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md. Leia somente a seção "E2" e a seção 4 de docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md.

Objetivo: nenhuma missão selecionada ao abrir, focus inicial coerente com o Primeiro Voo e botão Decolar com guarda real.

Arquivos permitidos: src/frontend/src/workstation/TelaInicial.tsx, src/frontend/src/workstation/TabelaMissoes.tsx, src/frontend/src/educacao/catalogoEducacional.ts, src/frontend/src/App.test.tsx e, se um seletor quebrar, src/frontend/e2e/jornadas.spec.ts.

Faça:
- TelaInicial.tsx:73: estado inicial de cenario vazio; guarda no onDecolar que não faz nada sem cenário.
- TabelaMissoes.tsx: botão "Decolar no Simulador" com aria-disabled verdadeiro enquanto não houver seleção (não usar o atributo disabled para esse caso), texto de apoio visível "Escolha uma missão" ligado por aria-describedby; o clique e a tecla Enter não iniciam missão nesse estado.
- catalogoEducacional.ts:761: focus inicial estagiario. Não migrar quem já tem n1 salvo (carregarEstadoAcademia continua respeitando o valor salvo). Não renomear ids. Acrescente um comentário curto documentando a correspondência dos ids estagiario, n1, n2, n3, esp com Nível 1, 2, 3, 4 e 4b.
- Testes Vitest: sem rádio marcado em estado limpo; aria-disabled e texto de apoio; clique e Enter sem chamada de início; seleção libera o início; Demo rápida inicia Nível 2 com C1; focus inicial estagiario e Aulas abre em Estagiário; carregamento com n1 salvo permanece n1.

Verificações mínimas: npm.cmd test -- --run src/App.test.tsx e o arquivo de teste novo; npm.cmd run lint; e, em src/frontend, npx.cmd playwright test e2e/jornadas.spec.ts -g "Feliz 1" nos projetos chromium e mobile-375 (confira as portas antes). Sem suíte completa.

Commit "fix(ux): estado inicial sem missao selecionada e focus coerente" com caminhos explícitos. Atualize 09_REGISTRO_PROGRESSO.md. Resposta final: arquivos, resultados, pendências e a próxima etapa (E3, sessão nova).
```

---

## E3. Progresso real e rótulos

Comando: `kiro-cli chat --agent sim2-implementador`

```text
Execute a etapa E3 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e a E2 concluída no registro. Leia somente a seção "E3" do plano final (docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md).

Objetivo: o texto semeado de DEFAULT_PAGES não conta como progresso do aluno, e a tabela de missões usa os mesmos rótulos da Credencial.

Arquivos permitidos: src/frontend/src/educacao/catalogoEducacional.ts, src/frontend/src/workstation/TabelaMissoes.tsx, testes em src/frontend/src/App.test.tsx ou arquivo novo em src/frontend/src/educacao/, e a spec que citar o texto "T 0%" (procure com Select-String antes de editar).

Faça:
- calcularProgressoNivel (catalogoEducacional.ts, por volta de 857 a 870): hasNotes passa a exigir mais de 20 caracteres E texto diferente do texto semeado da página Cornell do mesmo nível (comparação normalizada com trim). Não altere o esquema salvo nem DEFAULT_PAGES.
- TabelaMissoes.tsx: trocar "T 0%, F 20%, P 0%" por "Teoria 0%, Fixação 0%, Prática 0%" no mesmo padrão da Credencial, mantendo legibilidade em 375 px.
- Testes: estado limpo devolve t 0, f 0 e p 0 nos 5 níveis e a tabela mostra "Não iniciada" nos 5; notas semeadas sem edição não contam; notas editadas contam; texto igual ao semeado não conta; nota apagada ou com menos de 20 caracteres não conta; dado legado salvo carrega sem quebrar e recalcula.

Verificações mínimas: o arquivo de teste e App.test.tsx; npm.cmd run lint. Sem Playwright.

Commit "fix(ux): progresso real sem notas semeadas e rotulos por extenso". Atualize 09_REGISTRO_PROGRESSO.md. Resposta final: resultados, risco residual da comparação (edição mínima do exemplo conta como progresso) e a próxima etapa (E4).
```

---

## E4. Missão 0

Comando: `kiro-cli chat --agent sim2-implementador`

```text
Execute a etapa E4 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e a E3 concluída no registro. Leia somente a seção "E4" do plano final (docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md).

Objetivo: a Missão 0 aparece logo depois do Primeiro Voo e antes da tabela de missões.

Arquivos permitidos: src/frontend/src/workstation/TelaInicial.tsx, opcionalmente src/frontend/src/workstation/MissaoZero.tsx, src/frontend/src/index.css (só se faltar estilo, reutilizando tokens) e src/frontend/src/App.test.tsx.

Faça:
- Ordem no DOM: Primeiro Voo, Missão 0, Missões, Glossário, Transparência.
- Missão 0 em details: aberta quando temProgresso é falso (a mesma variável de TelaInicial.tsx, por volta das linhas 161 a 165) e recolhida quando é verdadeiro. Não persistir a escolha manual (documente isso em comentário curto).
- Título e texto de apoio que diferenciem da seção Primeiro Voo: a Missão 0 orienta o que fazer dentro do chamado.
- Testes: ordem dos headings, abertura conforme progresso, Tab percorre Primeiro Voo, Missão 0 e Missões nessa ordem, sem rolagem horizontal em 375 px. A altura total é só registrada, sem limite.

Verificações mínimas: App.test.tsx; npm.cmd run lint; npx.cmd playwright test e2e/visual.spec.ts -g "missoes" nos projetos desktop-1440 e mobile-375, nos dois temas (confira as portas antes). Abra no máximo os 4 PNG resultantes e cite os nomes.

Commit "feat(ux): Missao 0 antes das missoes". Atualize 09_REGISTRO_PROGRESSO.md. Resposta final: resultados, altura medida antes e depois (informativa) e a próxima etapa (E5).
```

---

## E5. Tokens, literais e teste real

Comando: `kiro-cli chat --agent sim2-implementador`

```text
Execute a etapa E5 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e a E4 concluída no registro (a E1 também, pois você usa a linha de base). Leia a seção "E5" e a seção 4 do plano final (docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md) e docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md.

Objetivo: corrigir os pares abaixo do limiar, trocar cores literais por tokens e fazer o teste de contraste derivar dos tokens reais.

Arquivos permitidos: src/frontend/src/index.css (tokens por volta das linhas 69 a 155; .btn-white 249 e 250; seletor de arquivo 732 e 733; overrides 1056 a 1061), src/frontend/src/App.test.tsx e arquivo de teste novo se necessário.

Limiares: texto 4,5:1 nos dois temas sobre surface, canvas, elevated e hover; controles e foco 3:1 sobre surface, canvas e elevated; border-strong 2,0:1 sobre surface e canvas nos dois temas; border-subtle 1,4:1 sobre surface e canvas no corporate (tactical sem regressão); text-secondary continua mais distante do fundo que text-muted.

Faça:
1. ANTES de editar, calcule e registre em 09_REGISTRO_PROGRESSO.md a matriz completa dos pares atuais e dos candidatos, em todos os fundos relevantes dos dois temas (script temporário em TEMP, apagado depois). Candidatos de partida: corporate border-strong #9AA8BB, corporate border-subtle #CBD5E1, corporate text-muted #586980, tactical text-muted #94A1B5. Escolha o menor deslocamento visual que cumpre todos os limiares.
2. Commit 1, tokens: "fix(ux): tokens de contorno e texto dos temas".
3. Commit 2, literais e teste: trocar .btn-white, o seletor de arquivo e os valores dos overrides de .banner-notice, .alert-success e .alert-danger por tokens sem reduzir o contraste (hoje todos acima de 8:1); manter o terminal do SimuDesk forçado em tactical e medi-lo à parte; substituir o bloco de hexadecimais obsoletos de App.test.tsx por asserções que leem os tokens de index.css (importação com sufixo ?raw, confirme que funciona no Vitest sem pacote novo). Mensagem: "test(ux): contraste derivado dos tokens e literais trocados por tokens".

Verificações mínimas: App.test.tsx; npm.cmd run lint; npm.cmd run build; npx.cmd playwright test e2e/contraste.spec.ts nos projetos desktop-1440 e mobile-375, nos dois temas (portas conferidas antes). Compare com a linha de base: nenhuma violação nova e redução nas de contorno e de text-muted.

Atualize 09_REGISTRO_PROGRESSO.md. Resposta final: matriz final dos pares, comparação com a baseline, risco visual (contorno mais escuro) e a próxima etapa (E6).
```

---

## E6. Ajustes por tela

Comando: `kiro-cli chat --agent sim2-implementador`

```text
Execute a etapa E6 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e as etapas E4 e E5 concluídas no registro. Leia a seção "E6" e a seção 4 do plano final (docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md) e docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md.

Objetivo: inspecionar os PNG dos dois temas e corrigir defeitos pontuais em Aulas, Caderno, Mentor, ITSM, SimuDesk, Chat, Intranet (KB), Replay e Credencial.

Passos:
1. Gere os PNG com e2e/visual.spec.ts (com a higiene de captura da E1) em desktop-1440 e mobile-375, nos dois temas, uma execução por vez, portas conferidas antes. Abra no máximo 10 PNG por sessão, escolhendo os que a baseline marcou com mais violações, sempre citando o nome do arquivo.
2. Antes de corrigir, registre cada defeito em 09_REGISTRO_PROGRESSO.md com tela, tema, viewport, seletor, medição e nome do PNG. Limite de 6 arquivos de componente por sessão; o excedente vira E6b e é registrado como pendência.
3. Corrija reutilizando tokens e classes existentes. Critérios: sem violação nova na spec de contraste em relação à E5; sem rolagem horizontal em 375 px; alvos de 44 px nos controles tocados; texto auxiliar com no mínimo 12 px computado e 4,5:1; os dois temas inspecionados.
4. Item incluído por padrão: texto do seletor de arquivo da Credencial em português, mantendo o input real acessível por teclado, com teste do nome acessível. Se não for possível sem prejudicar o teclado, registre a limitação e mantenha o nativo.
5. Verificações mínimas: testes Vitest dos componentes tocados; npm.cmd run lint; visual.spec.ts e contraste.spec.ts em desktop-1440 e mobile-375 apenas para as telas tocadas, nos dois temas.

Commits pequenos, um por tela ou por grupo coeso, mensagem "fix(ux): <tela>", caminhos explícitos. Atualize 09_REGISTRO_PROGRESSO.md. Resposta final: tabela de defeitos com antes e depois por nome de PNG, pendências (E6b) e a próxima etapa (E7).
```

---

## E7. Revalidação

Comando: `kiro-cli chat --agent sim2-validador`

```text
Execute a etapa E7 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot. Você só relata, não corrige.

Carregue economia-desenvolvimento. Confirme a branch ux-ciclo-2 e a E6 concluída em docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md. Leia a seção "E7" e a seção 4 de docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md, mais 10_LINHA_DE_BASE.md e 10_linha_de_base.json.

Execute, uma vez cada, com as portas 8080 e 5173 conferidas antes:
1. npm.cmd run lint, npm.cmd test -- --run e npm.cmd run build em src/frontend.
2. dotnet build src/backend/src/Simulador.Api na raiz (portão de integração).
3. npx.cmd playwright test nos 5 projetos, incluindo e2e/contraste.spec.ts, em uma única execução.
4. Comparação com a baseline em tabela por tema e viewport; toda regressão com causa provável.
5. Limiares da seção 4 do plano.
6. Varreduras do caractere E comercial (padrão montado com [char]38), formas passadas do verbo sair, emojis e style={{ remanescentes, nos arquivos do diff da branch.

Escreva docs/auditoria-ui-ux/ciclo2/11_RELATORIO_VALIDACAO.md: tabela de portões, comparação com a baseline, falhas (no máximo 25 linhas de erro cada), achados por prioridade, verificações manuais não bloqueantes (zoom em 200 por cento e leitor de tela) e veredito aprovado ou reprovado. Atualize 09_REGISTRO_PROGRESSO.md. Não faça commit. Resposta final: veredito, tabela de portões e a próxima etapa (E8 se aprovado; senão o que corrigir e em qual etapa).
```

---

## E8. Fechamento

Comando: `kiro-cli chat --agent sim2-fechamento`

```text
Execute a etapa E8 do ciclo 2 do simulador-carreira-ti. Responda em português. Participam apenas Kiro CLI, Codex e Copilot.

Carregue economia-desenvolvimento e devledger-encerrar (somente Git e DevLedger). Pré-condição: docs/auditoria-ui-ux/ciclo2/11_RELATORIO_VALIDACAO.md com veredito aprovado. Se não, pare.

1. git status e git diff --stat main...ux-ciclo-2. Confirme que não há segredos, test-results, node_modules nem temporários, e que nenhum dos 4 itens alheios está no stage ou nos commits.
2. Varra o diff pelo caractere E comercial (montado com [char]38) e pelas formas passadas do verbo sair.
3. Para cada commit pendente, mostre git diff --cached --stat e a lista exata de arquivos e peça a minha confirmação textual antes do git commit. Sem trailer de coautoria.
4. git fetch origin e git rev-list --left-right --count main...origin/main. Com a minha confirmação: git switch main e git merge --ff-only ux-ciclo-2. Se não for avanço rápido, pare.
5. Com a minha confirmação: git push origin main. Acompanhe o CI com gh run list e gh run watch e confira o status do commit na Vercel com gh api.
6. DevLedger do projeto simulador-carreira-ti: checkpoint, handoff e estado, append-only, com pwsh -NoProfile -ExecutionPolicy Bypass e o módulo D:\GitHub\cristianodossantosdasilva\DevLedger\module\DevLedger.psm1. Descubra os parâmetros com Get-Command e Get-Help. Verifique o código de saída.
7. Informe os passos manuais que me cabem e atualize 09_REGISTRO_PROGRESSO.md.
```
