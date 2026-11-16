# Ciclo 2: plano final (consolidação Kiro, Codex e Copilot)

Autor: sim2-planejador (Kiro CLI). Entradas: 00_CONTEXTO_E_PLANO_BASE.md, 02_PLANO_KIRO.md, 05_REVISAO_CODEX.md e 06_REVISAO_COPILOT.md. Estado conferido antes de consolidar: main igual a origin/main em a88988c (0 e 0 após git fetch), sem mudança desde o commit de partida. A árvore continua com as entradas alheias e com docs/auditoria-ui-ux/ciclo2/ não rastreado. Status: aguardando aprovação do usuário. Nenhum agente foi criado.

## 1. Fatos: correções e arbitragem

Medições recalculadas por mim nesta consolidação (script temporário em TEMP, apagado), além das da seção 2 do 02_PLANO_KIRO.md.

| Tema | Kiro | Codex | Copilot | Arbitragem |
|---|---|---|---|---|
| P1 (rádio n1 e focus n1, estado e não CSS) | confirmado | confirmado | confirmado | Fato firme. |
| focus persistido e n1 salvo permanece | confirmado | confirmado | confirmado | Fato firme. |
| Aulas abre em N1, Primeiro Voo em Estagiário | confirmado | confirmado | confirmado | Fato firme. Duas fontes de verdade. |
| P2 ordem | confirmado | confirmado | confirmado | Fato firme. |
| F 20% por notas semeadas | confirmado | confirmado | confirmado | Fato firme. |
| text-muted sobre hover abaixo de 4,5 em corporate e tactical | confirmado | confirmado | confirmado | Fato firme (4,22 e 4,02). |
| Alertas têm override tactical | confirmado | confirmado | confirmado | Fato firme. O problema é manutenção, não contraste (8,2 a 17,3). |
| Teste de tokens com hexadecimais obsoletos | confirmado | confirmado em parte | confirmado | Codex tem razão em parte: App.test.tsx:32 a 59 usa valores atuais. Só o bloco de 19 a 30 é obsoleto e nenhum trecho lê index.css. Corrijo a redação: "o teste não deriva dos tokens e parte dele é obsoleta". |
| axe no jsdom não prova contraste | confirmado | confirmado | confirmado | Fato firme. |
| Tooltip e barra fixa são artefato de captura | confirmado | confirmado | confirmado | Fato firme. Vira requisito da spec (E1). |
| Prints de laboratório e credencial não são estado limpo | confirmado | confirmado | confirmado | Fato firme. A baseline rotula o estado. |
| border-control sobre elevated "falha" | não afirmou | não afirmou | afirmou "refutado" | REFUTADO o Copilot. 4,34 e 4,76 passam 3,0. O Copilot confundiu o limiar de texto com o de controle. A única lacuna real é tactical sobre hover (2,64) e corporate sobre hover (3,86). |
| border-strong tactical sobre elevated | não medido | não medido | 1,93 | CONFIRMADO o Copilot (recalculei 1,93). Tactical sobre canvas é 2,48 e sobre hover 1,66. Define a regra de fundos do limiar (seção 4). |
| Trailer de coautoria exigido pelo repositório | não citou | não citou | citou | REFUTADO. Nenhum dos últimos 30 commits tem Co-authored-by e AGENTS.md não pede. Sem trailer. |
| Candidato #CBD5E1 não cumpre 1,4 em todos os fundos | não citou | afirmou | não citou | Refutado em parte. O limiar do plano é 1,4 sobre surface (1,48) e canvas (1,42). Sobre elevated (1,36) o limiar não se aplica. Fica explícito na seção 4. |
| Candidato border-strong #A9B6C7 | 2,06 surface, 1,97 canvas | cita falha | cita falha | Confirmado: falha no canvas. Candidato de partida passa a ser #9AA8BB (2,42, 2,31). |
| Tactical visualmente validado | parcial (2 prints) | parcial | não verificável | Fato firme: tactical só tem 2 prints inspecionados. Fica para a E1 e a E6. |

## 2. Convergências e divergências de decisão

| Ponto | Kiro | Codex | Copilot | Decisão | Risco | Custo de mudar depois |
|---|---|---|---|---|---|---|
| Botão sem seleção | aria-disabled com texto de apoio | exige bloqueio real e teste | exige bloqueio e teste de teclado | Aceito integralmente: aria-disabled, aria-describedby, handler com guarda, teste de clique e de Enter sem chamada de rede. | Baixo | Baixo |
| Separar P1 e P2 | sim | sim | sim | Mantido. Além disso, o progresso falso passa para outra etapa, separada da seleção (ver abaixo). | Baixo | Baixo |
| F 20%: como corrigir | comparar com o texto semeado | prefere marcador de edição | prefere marcador ou regra por ação | Mantenho a comparação com o texto semeado, sem alterar o esquema salvo. Justificativa: texto igual ao exemplo não é progresso do aluno, então o caso "copiou o exemplo" e o caso "restaurou o exemplo" devem mesmo contar zero. Apagar a nota também conta zero (menos de 20 caracteres). Um marcador novo exigiria versão de esquema e migração, mais custo sem ganho de comportamento. Critérios de teste: limpo, semeado sem edição, editado, igual ao semeado, apagado e dado legado salvo. | Médio: uma edição mínima do exemplo conta como progresso | Médio (marcador depois exige esquema) |
| Dividir E2 | E2 junta seleção e progresso | recomenda dividir | recomenda dividir | Aceito: seleção e focus numa etapa, progresso e rótulos T, F, P noutra. Isola regressões. | Baixo | Baixo |
| Rótulos T 0%, F 20%, P 0% | listado nas lacunas | listado | listado | Aceito: trocar por Teoria, Fixação e Prática por extenso (igual à Credencial) na etapa de progresso, porque mexe no mesmo componente. | Baixo | Baixo |
| Missão 0: critério de altura de 5% | proposto | contra | contra | Aceito: remover como gate. A altura vira só medida informativa. Gates: ordem DOM e de headings, abertura conforme temProgresso (a mesma variável do Primeiro Voo), foco e teclado, sem rolagem horizontal em 375 px. | Baixo | Baixo |
| Definição de progresso na Missão 0 | não definido | pede definição única | não citou | Aceito: usar exatamente a variável temProgresso de TelaInicial.tsx:161 a 165. | Baixo | Baixo |
| Limiares 2,0 e 1,4 | critérios de projeto | política precisa de aprovação | concorda | Mantidos, submetidos à pergunta 5. Gate de fundos fechado na seção 4 (surface e canvas nos dois temas; elevated só informativo). | Baixo | Baixo |
| Separar controle de texto | não separado no aceite | pede | pede | Aceito, ver seção 4. | Baixo | Baixo |
| Seletor de arquivo em português | em E4 | texto nativo segue a localização do navegador | exige teste do nome acessível | Dividido: a E5 só troca cores por tokens. O texto em português vai para a E6 (telas), como item opcional, com o input real preservado e teste do nome acessível. Se não for possível sem prejudicar o teclado, fica o texto nativo e se registra a limitação. | Médio | Baixo |
| Baseline: cobertura e método | cálculo genérico de borda | exige cobertura e casos não calculáveis | exige estado, ambiente e versão | Aceito: o relatório da E1 traz matriz tela, tema, viewport e estado, lista de elementos não calculáveis com motivo (transparência, gradiente, pseudo-elemento, elemento oculto), rótulo "limpo" ou "turno concluído", versão do Chromium e do Node. | Baixo | Baixo |
| Higiene de captura | requisito | requisito | requisito | Aceito como gate da E1: mouse fora, foco removido, reducedMotion, e na captura de rolagem longa neutralizar elementos fixos e tooltips com addStyleTag. Altera e2e/visual.spec.ts (somente captura). | Baixo | Baixo |
| Modelo do fechamento | haiku | questiona | questiona | Parcialmente aceito: o fechamento passa para claude-sonnet-5.5, porque revisa diff, árvore suja e o DevLedger. Validação continua em haiku (mecânica). | Baixo | Baixo |
| Disponibilidade dos modelos | assumida | não comprovada | não comprovada | Os ids claude-sonnet-5.5 e claude-haiku-5.5 já são usados pelos agentes sim-* do ciclo 1, que rodaram. Comprovado pelos arquivos em C:\Users\Black\.kiro\agents. | Baixo | Baixo |
| Commits menores dentro da etapa | por etapa | pede | concorda | Aceito: uma etapa pode ter mais de um commit (E5: tokens, depois literais mais teste). | Baixo | Baixo |
| dotnet build na validação | incluído | não citou | questiona | Mantido, como portão de integração: o servidor do Playwright usa dotnet run com a opção de não compilar, então o binário precisa existir. Rotulado como tal no relatório. | Baixo | Baixo |
| Mensagens de commit sem acento | seguir histórico | prefere acentos | não citou | Mantido sem acento, para ficar coerente com o histórico (por exemplo "validacao"). Custo trivial. | Baixo | Baixo |
| Cobertura de teclado, zoom e leitor de tela | não citado | pede | cita teclado | Parcial: gates automáticos de teclado nos fluxos tocados (Enter e Tab no botão Decolar, foco visível). Zoom e leitor de tela ficam como verificação manual não bloqueante, registrada na E7. | Baixo | Baixo |
| Tactical sem inspeção visual | parcial | parcial | não verificável | Aceito: E1 e E6 geram e inspecionam tactical e corporate, nunca só um tema. | Baixo | Baixo |

## 3. Plano final

Convenção: cada etapa é uma sessão nova. Branch ux-ciclo-2, criada a partir da main na E1. Comandos npm.cmd e npx.cmd. Sem git push, merge, deploy ou npm install sem confirmação. Sem git add -A nem git add ponto: sempre caminhos explícitos e conferência de git diff --cached --stat. Não editar src/backend, src/frontend/src/api/** nem src/frontend/src/utils/jcs.ts. Registro de progresso em docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md. Parar após duas falhas pela mesma causa.

| Etapa | Conteúdo | Agente | Modelo | Depende de |
|---|---|---|---|---|
| E1 | Branch, grafo, higiene de captura, spec de contraste e contorno, linha de base | sim2-medicao | claude-sonnet-5.5 | nada |
| E2 | Nenhuma missão pré-selecionada, focus inicial, botão com guarda | sim2-implementador | claude-sonnet-5.5 | E1, pergunta 1 |
| E3 | Progresso real (notas semeadas) e rótulos Teoria, Fixação, Prática | sim2-implementador | claude-sonnet-5.5 | E2 |
| E4 | Missão 0 depois do Primeiro Voo e antes das missões | sim2-implementador | claude-sonnet-5.5 | E3 |
| E5 | Tokens de contorno e texto, cores literais, teste de tokens real | sim2-implementador | claude-sonnet-5.5 | E1, pergunta 5 |
| E6 | Ajustes por tela guiados pelos PNG dos dois temas | sim2-implementador | claude-sonnet-5.5 | E4, E5 |
| E7 | Revalidação completa e comparação com a baseline, só relata | sim2-validador | claude-haiku-5.5 | E6 |
| E8 | Fechamento: commits, merge fast-forward, push, CI, DevLedger | sim2-fechamento | claude-sonnet-5.5 | E7 aprovada |

### E1. Base de medição

- Objetivo: preparar o ambiente e medir. Não corrige produto.
- Passos: git status e lista dos arquivos alheios registrados no início; git switch -c ux-ciclo-2 main; reconstruir o grafo com graphify em modo code-only; verificar portas 8080 e 5173 livres com Get-NetTCPConnection; criar 09_REGISTRO_PROGRESSO.md.
- Arquivos exatos: criar src/frontend/e2e/contraste.spec.ts e, se preciso, src/frontend/e2e/contraste.helper.ts; editar src/frontend/e2e/visual.spec.ts somente para a higiene de captura; editar src/frontend/playwright.config.ts somente se a spec nova não rodar nos projetos existentes; gerar docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e 10_linha_de_base.json.
- Método: axe-core injetado com page.addScriptTag a partir de node_modules/axe-core/axe.min.js (verificar o caminho antes), regra color-contrast; contornos por page.evaluate com getComputedStyle, fundo opaco efetivo percorrendo os ancestrais; seletores de container .edu-card, .panel, .glossary-details, .missao-linha, tabelas e campos; foco medido por regra própria. Elementos não calculáveis vão para uma lista com o motivo.
- Aceite mensurável: a matriz do relatório cobre 9 telas (Missões, Aulas, Caderno, Mentor, Credencial, ITSM, Chat, KB e SimuDesk, Juiz 360 e Replay, ver lista exata no relatório) por 2 temas por 4 viewports, e cada célula diz "medida" ou "não calculável com motivo"; cada linha traz tema, viewport, tela, estado (limpo ou turno concluído), seletor, par de cores e razão; o JSON tem totais por tema e viewport; versões do Chromium e do Node registradas; nenhum arquivo de produção alterado (git diff mostra só e2e e docs); sem pacote novo; lint do frontend sem erro.
- Testes: playwright test e2e/contraste.spec.ts no projeto desktop-1440 para depurar, depois uma rodada nos 5 projetos. Nada além.
- Riscos: porta ocupada, HTTP 429, tooltip e barra fixa nas capturas.

### E2. Seleção inicial e focus

- Arquivos exatos: src/frontend/src/workstation/TelaInicial.tsx (estado cenario inicial vazio, guarda no onDecolar), src/frontend/src/workstation/TabelaMissoes.tsx (aria-disabled, texto de apoio "Escolha uma missão", id e aria-describedby), src/frontend/src/educacao/catalogoEducacional.ts (focus inicial estagiario), src/frontend/src/App.test.tsx e, se algum seletor quebrar, src/frontend/e2e/jornadas.spec.ts.
- Aceite mensurável: em estado limpo nenhum rádio de missão fica marcado; o botão Decolar tem aria-disabled igual a true, texto de apoio visível e referenciado por aria-describedby; clique e tecla Enter com o botão nessa condição não iniciam missão (teste prova que não houve chamada de início); depois de escolher um rádio, aria-disabled some e o início funciona; Demo rápida continua iniciando Nível 2 com C1; Primeiro Voo continua iniciando Estagiário; focus inicial estagiario e a aba Aulas abre em Estagiário em estado limpo; usuário com n1 salvo continua em n1 (teste de carregamento); ids dos níveis intactos; um comentário no código documenta a tabela de ids e rótulos (estagiario, n1, n2, n3, esp contra Nível 1, 2, 3, 4, 4b).
- Testes: npm.cmd test -- --run src/App.test.tsx e o arquivo de teste novo; npm.cmd run lint; playwright jornadas.spec.ts nos testes "Feliz 1" e no de 375 px, no projeto chromium e no mobile-375.
- Riscos: seletores por role e texto; foco do teclado.

### E3. Progresso real e rótulos

- Arquivos exatos: src/frontend/src/educacao/catalogoEducacional.ts (hasNotes compara com o texto semeado da página), src/frontend/src/workstation/TabelaMissoes.tsx (rótulos por extenso), testes em src/frontend/src/App.test.tsx ou arquivo novo em src/frontend/src/educacao/, e a spec que referenciar o texto "T 0%" se existir.
- Aceite mensurável: em estado limpo calcularProgressoNivel devolve t 0, f 0 e p 0 para os 5 níveis e a tabela mostra "Não iniciada" nos 5; casos de teste: notas semeadas sem edição (f sem os 20), notas editadas pelo aluno (f com os 20), texto igual ao semeado (f sem os 20), nota apagada ou com menos de 20 caracteres (f sem os 20), dado legado salvo (não quebra e recalcula); rótulos Teoria, Fixação e Prática por extenso, no mesmo padrão da Credencial.
- Testes: o arquivo novo, App.test.tsx, lint.
- Riscos: o rótulo antigo pode estar em teste; procurar com Select-String antes de editar.

### E4. Missão 0

- Arquivos exatos: src/frontend/src/workstation/TelaInicial.tsx (ordem), opcional src/frontend/src/workstation/MissaoZero.tsx, src/frontend/src/index.css só se faltar estilo, testes em src/frontend/src/App.test.tsx.
- Aceite mensurável: ordem no DOM Primeiro Voo, Missão 0, Missões, Glossário, Transparência (teste lê a ordem dos headings); sem progresso (temProgresso falso) a Missão 0 vem aberta; com progresso vem recolhida, sem persistir a escolha manual; título e texto de apoio diferenciam de "Iniciar primeiro voo" (orientação dentro do chamado); navegação por Tab percorre Primeiro Voo, Missão 0 e Missões nessa ordem; sem rolagem horizontal em 375 px. A altura total é só registrada, sem limite.
- Testes: App.test.tsx; lint; playwright visual.spec.ts do projeto desktop-1440 e do mobile-375, tela "missoes", nos dois temas.
- Riscos: testes que dependem de posição; details sem estado persistido reabre a cada visita (aceito e documentado).

### E5. Tokens, literais e teste real

- Arquivos exatos: src/frontend/src/index.css (tokens linhas 69 a 155; .btn-white 249 e 250; seletor de arquivo 732 e 733; overrides 1056 a 1061), src/frontend/src/App.test.tsx (trocar o bloco de hexadecimais por leitura dos tokens de index.css com importação ?raw, a confirmar no Vitest).
- Aceite mensurável: ver seção 4. Cada limiar é uma asserção do teste de tokens (pares de token, deriva de index.css) mais a spec de contraste no navegador (elementos reais). Valores candidatos já medidos: corporate border-strong #9AA8BB (surface 2,42, canvas 2,31), corporate border-subtle #CBD5E1 (surface 1,48, canvas 1,42), corporate text-muted #586980 (hover 4,55, elevated 5,12), tactical text-muted #94A1B5 (hover 4,79, elevated 5,59). O agente escolhe o menor deslocamento que cumpre e registra a matriz completa dos pares, em todos os fundos relevantes, no 09_REGISTRO_PROGRESSO.md antes de editar. text-secondary deve continuar mais escuro (corporate) ou mais claro (tactical) que text-muted em todos os fundos. Cores literais de botão branco, seletor de arquivo e overrides dos alertas passam a tokens, sem mudar o contraste (todos acima de 8). SimuDesk forçado em tactical dentro do corporate é mantido e medido à parte.
- Commits: um para os tokens, outro para literais e teste.
- Testes: App.test.tsx, lint, build, spec de contraste em desktop-1440 e mobile-375, nos 2 temas.
- Riscos: contorno mais escuro altera a aparência do corporate inteiro; muted mais escuro aproxima da hierarquia do secondary.

### E6. Ajustes por tela

- Objetivo: inspecionar os PNG dos dois temas (até 10 por sessão, citando nomes) e corrigir defeitos pontuais de Aulas, Caderno, Mentor, ITSM, SimuDesk, Chat, Intranet, Replay e Credencial.
- Arquivos exatos: definidos pela inspeção, com limite de 6 arquivos de componente por sessão. O excedente vira E6b. Todo defeito entra antes na lista do 09_REGISTRO_PROGRESSO.md com tela, tema, viewport, seletor, medição e arquivo do PNG.
- Item incluído por padrão: texto do seletor de arquivo em português, com input real e teste do nome acessível; se prejudicar o teclado, registrar a limitação e manter o nativo.
- Aceite mensurável: cada defeito tem antes e depois por nome de PNG; spec de contraste sem violação nova em relação à E5; sem rolagem horizontal em 375 px; alvos de 44 px nos controles tocados; texto auxiliar com no mínimo 12 px computado e 4,5:1; os dois temas inspecionados.
- Testes: testes Vitest dos componentes tocados e visual.spec.ts em desktop-1440 e mobile-375 para as telas tocadas, nos dois temas.

### E7. Revalidação

- Escreve só docs/auditoria-ui-ux/ciclo2/11_RELATORIO_VALIDACAO.md e o registro de progresso.
- Aceite: lint, Vitest, build, dotnet build (portão de integração), Playwright nos 5 projetos e spec de contraste, todos verdes; comparação com a baseline em tabela, em que cada regressão tem causa e aceite explícito; varreduras de E comercial (montado por [char]38) e de formas passadas de sair zeradas nos arquivos do diff; verificação manual não bloqueante de zoom em 200 por cento e de leitor de tela, registrada; portas conferidas antes e uma única execução de Playwright.

### E8. Fechamento

- Aceite: o agente mostra git status, git diff --cached --stat e a lista exata de arquivos de cada commit, e confirma que nenhum arquivo alheio entra; cada commit, o merge fast-forward e o push dependem de confirmação textual do usuário; CI verde; Vercel em success; DevLedger atualizado por fluxo append-only. Sem trailer de coautoria.

## 4. Validação visual do corporate: limiares fechados

| Categoria | Pares | Limiar | Nota |
|---|---|---|---|
| Texto | text-primary, text-secondary, text-muted e accent-text sobre surface, canvas, elevated e hover; status-*-text sobre status-*-surface; accent-contrast sobre accent-primary, hover e solid | 4,5:1, nos dois temas | WCAG 1.4.3 |
| Texto grande | 18 pt ou 14 pt em negrito | 3:1 | WCAG 1.4.3 |
| Controles e foco | border-control e focus-ring sobre surface, canvas e elevated | 3:1, nos dois temas | WCAG 1.4.11. Estado hover é medido e registrado; o tactical sobre hover mede 2,64, mas o botão troca a borda para accent-primary no hover, a confirmar no navegador. |
| Contorno de container | border-strong sobre surface e canvas | 2,0:1, nos dois temas. Sobre elevated é só informativo (corporate hoje 1,36, tactical 1,93). | Critério de projeto, não exigido pelo WCAG para card decorativo. |
| Divisor interno | border-subtle sobre surface e canvas | 1,4:1 no corporate. No tactical, sem regressão (hoje 1,72 e 1,82). | Critério de projeto. |
| Texto auxiliar | metadados, estados, instruções | 12 px mínimo computado e 4,5:1 | Texto de leitura segue o tamanho base. |
| Alvos | controles interativos | 44 px | Regra do projeto. |
| Rolagem | 375 px | sem rolagem horizontal | Regra do projeto. |

Telas e métodos: seção 5 do 02_PLANO_KIRO.md e seção 3 da E1 acima. Antes de rodar, portas 8080 e 5173 livres; uma execução por vez com workers 1; não reaproveitar backend preexistente, porque ele limita em 120 requisições por minuto e causa HTTP 429; reaproveitar a mesma página por tela e tema.

## 5. Decisões do usuário ainda abertas

Os três agentes concordam em 1, 3, 4 e 5. Na 2 há divergência de ênfase, mas todos aceitam commit isolado condicionado à sua escolha.

1. Pré-seleção ao abrir.
   - Recomendação: nenhuma missão selecionada, com botão bloqueado de fato e texto de apoio. Alternativa: pré-selecionar o Nível 1.
   - Custo de mudar depois: baixo.
2. A alteração local da etapa 10 em docs/auditoria-ui-ux/consolidado/00_PLANO_EXECUCAO_E_PROGRESSO.md entra no ciclo?
   - Recomendação do Kiro e do Copilot: sim, em commit próprio de documentação antes da E1. O Codex recomenda deixar fora até a sua decisão explícita. Como é seu arquivo, a escolha é sua. Se disser não, ele fica sem commit como as demais entradas alheias.
   - Custo de mudar depois: baixo.
3. Os 4 itens alheios (README.md, docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md, docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md, docs/consultor-vocacional/) ficam fora do ciclo?
   - Recomendação: sim. Os três concordam.
   - Custo de mudar depois: nenhum.
4. Quem já tem focus n1 salvo: respeitar ou migrar?
   - Recomendação: respeitar, sem migração. Os três concordam. A incoerência permanece para quem já usou o produto e isso fica registrado na E2.
   - Custo de mudar depois: médio (esquema e teste).
5. Limiar de contorno de container no corporate.
   - Recomendação: 2,0:1 para container, 3:1 só para controles e foco, 1,4:1 para divisores. Os três concordam. É política de projeto, não exigência do WCAG.
   - Custo de mudar depois: baixo no código e médio na revalidação visual.

Incluídos por padrão e removíveis por você: correção de F 20% e dos rótulos Teoria, Fixação e Prática (E3), e texto do seletor de arquivo em português (E6, com a condição de não prejudicar o teclado).

## 6. Pendências para depois da aprovação

Criar os agentes sim2-medicao (sonnet), sim2-implementador (sonnet), sim2-validador (haiku) e sim2-fechamento (sonnet) em C:\Users\Black\.kiro\agents\, mostrando a lista antes; escrever 08_PROMPTS_POR_ETAPA.md com um prompt por etapa, de E1 a E8; criar 09_REGISTRO_PROGRESSO.md. Nada disso foi feito.
