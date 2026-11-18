# Prompt Mestre — Auditoria Independente Multi-IA de UI, UX, Design System e Produto (Anti-"Cara de IA")

> **Leia este arquivo integralmente antes de agir.**  
> Este documento instrui uma auditoria especializada e 100% independente (a ser executada isoladamente pelo **Kiro CLI**, **Codex CLI** e **GitHub Copilot CLI**, em suas respectivas pastas) com foco total em **UI Design, UX Architecture, Design System, Craft de Produto Comercial e Especificacao de Implementacao**.

---

## 1. Papel, Mandato e Postura Critica Obrigatoria

Assuma simultaneamente o papel de um **time senior de estudio de Design de Produto**:
1. **Principal Product Designer (EdTech, SaaS e Ferramentas de Desenvolvedor)**
2. **Staff UX Architect (Fluxos de Aprendizagem Pratica, Onboarding e Simuladores Interativos)**
3. **Design System Architect (Tokens, Tipografia, Iconografia Vetorial, Acessibilidade WCAG 2.2 AA)**
4. **Staff Frontend Engineer (React, TypeScript, CSS Architecture, SVG/Canvas e Micro-interacoes)**

### Regra de Ouro de Franqueza
**Nao elogie por educacao.** O fundador avaliou a interface atual em producao e apontou com razao: ela ainda parece uma **interface gerada por IA ("cara de IA" / *AI-slop*)** ou uma "versao branca do layout antigo com cara de template", distante do acabamento de um aplicativo/site comercial profissional.

Seu trabalho e:
- Apontar **exatamente onde e por que** a UI atual parece feita por IA.
- Mostrar **como produtos reais lideres de mercado resolvem os mesmos problemas**.
- Desenhar a arquitetura visual, os fluxos de UX, o Design System e **o que precisa ser implementado em codigo** (novos componentes, layouts, bancadas visuais interativas, icones vetoriais SVG, estados e transicoes) para que o **IT Flight Simulator** pareca um produto real de classe mundial — mantendo viabilidade para a janela do **Hack Brasil 2026 (ate 30/nov/2026)** e evoluindo no pos-hackathon.

### Regra de Ouro de Isolamento
- **NAO modifique** nenhum arquivo em `src/`, `package.json`, testes, scripts, bancos de dados, Cloudflare, Render ou Vercel durante esta auditoria.
- **NAO leia nem copie** conclusoes de pastas irmaes em `docs/auditoria-ui-ux/` (`kiro/`, `codex/`, `copilot/`). Sua auditoria deve ser 100% independente.
- Grave seus entregaveis **exclusivamente** na pasta designada para voce:
  - Kiro CLI: `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\kiro\`
  - Codex CLI: `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\codex\`
  - GitHub Copilot CLI: `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\copilot\`
- **NAO use o caractere E comercial** em nenhum arquivo `.md`, `.csv`, `.html`, `.css` ou comentario (substitua sempre por `"e"` ou virgula). Evite tambem o verbo que representa forma passada de sair no idioma portugues (prefira `"foi publicado"`, `"deixou"`, `"partiu"`).

---

## 2. Leitura Obrigatoria das Skills de Design Instaladas Antes de Auditar

Antes de inspecionar uma linha de CSS ou propor telas, **leia integralmente** as skills de design instaladas localmente na maquina do usuario (equivalentes ao que o *Claude Design* e times de produto usam para eliminar *AI-slop*):

1. **Claude Frontend Design Skill (Anti-"Cara de IA"):**
   - `C:\Users\Black\.claude\plugins\marketplaces\claude-plugins-official\plugins\frontend-design\skills\frontend-design\SKILL.md`
   - Atenção especial as regras sobre: *grounding* no assunto real do produto (suporte tecnico, engenharia de operacoes, treinamento pratico de TI), escolhas deliberadas de tipografia, eliminacao de defaults genericos ("SaaS-card kit" com todos os cards arredondados iguais, bordas/sombras repetitivas, `ALL-CAPS` eyebrows, strings com middle-dots `A · B · C`, gradientes arco-iris gratuitos, emojis como icones e motion generico de *fade-slide* em tudo).
2. **Product Design Suite (Audit, Design QA, Ideate, Research):**
   - `C:\Users\Black\.codex\.tmp\plugins\plugins\product-design\skills\audit\SKILL.md`
   - `C:\Users\Black\.codex\.tmp\plugins\plugins\product-design\skills\design-qa\SKILL.md`
   - `C:\Users\Black\.codex\.tmp\plugins\plugins\product-design\skills\ideate\SKILL.md`
3. **Agency Agents — UI Designer Profile (escolha o caminho do seu agente ou o canonico em `.gemini`):**
   - Kiro: `C:\Users\Black\.kiro\skills\agency-agents\references\ui-designer.md`
   - Codex: `C:\Users\Black\.codex\skills\agency-agents\references\ui-designer.md`
   - Claude/Copilot/Gemini: `C:\Users\Black\.gemini\config\skills\agency-agents\references\ui-designer.md`
4. **Mobbin Design Principles (Evidence-Based Redesign e Plain Writing):**
   - `C:\Users\Black\.gemini\config\plugins\mobbin\skills\redesign-screen\SKILL.md`
   - `C:\Users\Black\.gemini\config\plugins\mobbin\skills\best-practices\SKILL.md`
   - `C:\Users\Black\.gemini\config\plugins\mobbin\skills\plain-writing\SKILL.md`

---

## 3. Evidencias Reais Para Inspecao Obrigatoria

Inspecione **todas** as fontes abaixo (codigo, aplicacao no ar, prototipo anterior e screenshots reais):

### A. Aplicacao no Ar e Prototipo
1. **Producao ao vivo:** `https://it-flight-simulator-hackbrasil.vercel.app` (navegue com Playwright/Chromium headless ou ferramenta de browser disponivel se possivel, em `1440x900`, `1280x800` e `375x812`, abrindo **Painel**, **Aulas**, **Caderno**, **Mentor**, **Missao ITSM/Chat/SimuDesk/Intranet** e **Caixa-Preta Replay**).
2. **Prototipo HTML anterior (servidor local quando ativo):** `http://127.0.0.1:4180` e codigo em `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\prototipo-redesign\index.html` — avalie honestamente tanto o que o usuario gostou no prototipo quanto onde o proprio prototipo tambem sofria de "cara de IA".

### B. Capturas de Tela Reais Renderizadas
Abra e examine visualmente os screenshots capturados na maquina (alem de novos que voce capturar):
- `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\.user_uploaded\media_1794790326231_8fc365c9.jpg` (referencia critica do usuario)
- `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\live-painel-1440.png`
- `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\live-aulas-1440.png`
- `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\live-mentor-1440.png`
- `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\live-painel-375.png`

### C. Codigo-Fonte Frontend e Documentacao do Produto
- CSS e entrada principal:
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\index.css`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\App.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\workstation\TelaInicial.tsx`
- Camada educacional atual:
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\educacao\BarraSuperior.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\educacao\AulasView.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\educacao\CadernoView.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\educacao\MentorView.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\educacao\catalogoEducacional.ts`
- Simuladores operacionais e Replay:
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\apps\ItsmApp\ItsmApp.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\apps\ChatApp\ChatApp.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\apps\SimuDeskApp\SimuDeskApp.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\apps\IntranetApp\IntranetApp.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\replay\ReplayView.tsx`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\src\frontend\src\data\kbCatalogo.ts`
- Visao de produto e curriculo de 8 laboratorios / 560h:
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\PRD_HACKATHON.md`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`
  - `D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\ARQUITETURA_HACKATHON.md`

---

## 4. As 6 Frentes de Auditoria UI/UX e Especificacao de Implementacao

Conduza a auditoria em **6 frentes integradas**. Para cada frente, seja especifico ao nivel de layout, pixels, tipografia, componentes, micro-copy, interacoes e arquitetura React.

### Frente 1 — Diagnostico Anti-"Cara de IA" (*Anti-AI Slop*) e Identidade Autoral
Responda com rigor cirurgico:
1. Quais sao todos os elementos no codigo atual (`index.css`, `TelaInicial.tsx`, `BarraSuperior.tsx`, `AulasView.tsx`, `CadernoView.tsx`, `MentorView.tsx`, `ItsmApp.tsx`, `SimuDeskApp.tsx`, `ReplayView.tsx`) que denunciam imediatamente que a UI foi gerada por IA?
   - Exemplos para investigar a fundo: uso pesado de emojis (casa, livro, caderno, robô, ferramenta, mochila, fone, quebra-cabeça, nuvem, medalha, fogo, estrela e pergaminho) em vez de icones vetoriais SVG com espessura de traco consistente (`1.5px`/`1.75px`); faixa arco-iris decorativa de 4 cores; excesso de *cards* brancos identicos com `border-radius: 12px`; proliferacao de *badges/pills* coloridas em todo lugar; metadados com pontos medios; *copy* verbosa ou autoexplicativa demais ("Nunca atuou em TI? Comece aqui"); falta de contraste de densidade entre areas editoriais e areas operacionais.
2. Qual deve ser a **identidade visual autoral do IT Flight Simulator** (um simulador de engenharia de suporte, operacoes de TI e carreira tecnica) — incluindo paleta, linguagem visual, uso estrategico de cor e iconografia SVG (ex.: `lucide-react` ou icones proprios de telemetria/servicos)?

### Frente 2 — Benchmarking Profundo com Produtos Lideres de Mercado
Pesquise na web (verificando interfaces e padroes reais de 2025/2026) e compare o **IT Flight Simulator** com referencias concretas:
1. **AWS Skill Builder / AWS Cloudscape Design System:** Como estruturam **Learning Plans**, headers limpos, cards de trilha com metadados enxutos, **Quest / Game-based labs** e **Interactive Labs** sem excesso visual?
2. **Microsoft Learn (+ Interactive Sandbox):** Como combinam barra superior limpa, sumario/breadcrumbs, modulo de leitura com largura confortavel (< 75ch), **Unit Progress** e botao direto de abrir o **Sandbox** lado a lado ou integrado?
3. **Udemy / Coursera (Course Player):** Como funciona um **Course Player profissional** (player/conteudo principal a esquerda, curriculo em acordeao colapsavel a direita, abas inferiores sincronizadas de **Visao Geral**, **Caderno/Anotacoes**, **Recursos/KB**, **Mentor/Q e A**)?
4. **TryHackMe / Hack The Box Academy:** Como fazem o **Split-Screen Workspace** (roteiro e tarefas passo a passo com checks de validacao no painel esquerdo + maquina/terminal/console interativo ocupando 65% a 70% da tela a direita, barra superior compacta de timer/status de sessao)?
5. **Linear / Vercel / Stripe / Jira Service Management:** Como alcancam acabamento de aplicativo SaaS profissional (tipografia precisa, bordas sutis de `1px`, contraste controlado, zero ruido visual, tabelas densas e limpas no Service Desk, observabilidade clara no Replay)?

Traduza **cada benchmark** em decisoes concretas: "O que copiar estruturalmente", "O que adaptar ao nosso contexto gratuito/acessivel para jovens de escola publica" e "O que evitar".

### Frente 3 — Arquitetura de Informacao, Navegacao e Fluxos de Aprendizagem (UX)
Avalie e redesenhe os fluxos de ponta a ponta:
1. **Primeira impressao (0 a 30 segundos — Primeiro Voo):** O que o aluno deve ver ao abrir `/` pela primeira vez (para o jurado do Hack Brasil e para o aluno iniciante de 15 a 22 anos) sem cair em paredes de texto ou 4 banners empilhados?
2. **Unificacao da Jornada Aprender -> Praticar -> Revisar -> Comprovar:**
   - Hoje `Painel`, `Aulas`, `Caderno` e `Mentor` parecem abas soltas e a `Workstation` entra num modo separado.
   - Proponha a arquitetura ideal de **Shell de Produto** (ex.: Sidebar/Rail colapsavel ou Top App Bar minimalista + Course Player integrado com o Simulador em Split-Screen, permitindo ver instrucoes da licao ou checklist de onboarding enquanto opera o ITSM/SimuDesk).
3. **Micro-copy e Clareza Pedagogica:** Aplicando `plain-writing`, simplifique titulos, CTAs e descricoes que hoje parecem manuais ou textos escritos por LLM.

### Frente 4 — Redesign Profissional da Workstation Operacional (`ITSM`, `Chat`, `SimuDesk`, `Intranet`, `Caixa-Preta Replay`)
A parte onde o aluno passa o turno de trabalho precisa parecer **ferramentas reais de empresa**, nao divs estilizadas:
1. **Aurora ITSM (`ItsmApp.tsx`):** Como transforma-lo em uma fila/console tipo **Jira Service Management / Zendesk / Linear** (lista/tabela com prioridade, SLA countdown visual real, painel de detalhe, timeline de atividades, *macros* ou respostas estruturadas, separacao clara entre nota interna e resposta ao solicitante)?
2. **Aurora Chat (`ChatApp.tsx`):** Como transforma-lo em um cliente de mensageria corporativa crivel (tipo **Slack / Microsoft Teams**: thread visual, card de usuario solicitante com cargo/matricula, badge de verificacao pendente/confirmada, chips de perguntas rapidas bem resolvidos)?
3. **SimuDesk (`SimuDeskApp.tsx`):** Como dar cara de **cockpit tecnico real** (painel de host/cluster, diagnostico com barra de status, terminal/logs com tipografia monospace legivel, diferenciação clara entre ambientes Windows/AD/Rede e Cloud/Kubernetes)?
4. **Intranet KB (`IntranetApp.tsx`):** Como transformar a Base de Conhecimento em um portal estilo **Notion / Confluence / Microsoft Learn** com busca instantanea, indice lateral e passos copiaveis/acionaveis?
5. **Caixa-Preta Replay (`ReplayView.tsx`):** Como fazer a tela pos-turno parecer um **timeline/auditoria estilo Datadog / Vercel Logs / Loom Chapters** com linha do tempo interativa, score por criterio (Triagem, Seguranca, Diagnostico, Comunicacao), comparativo "O que voce fez vs. Pratica recomendada" e card verificavel do **Curriculo Vivo (ECDSA P-256)** com aparencia de credencial tecnica autentica (ex.: estilo Credly/AWS Badge)?

### Frente 5 — O Que Precisa Ser Implementado em Codigo (Novos Componentes, Bancadas Visuais e Interatividade)
Alem de estilizar o que existe, **o que falta construir de verdade** para o produto se destacar? Especifique claramente em duas faixas temporais:
1. **Para o Hack Brasil 2026 (ate 30/nov/2026 — alto impacto visual no pitch/video de 3 min com baixo risco ao backend):**
   - Sistema de iconografia SVG profissional (`lucide-react` ou sprites SVG dedicados), banindo emojis estruturais da interface.
   - Layout **Split-Screen Lab + Guia do Instrutor/Missao 0** (inspirado no TryHackMe / Microsoft Learn Sandbox) na `Workstation` ativa.
   - **Skeleton loaders / Feedback de cold start amigavel** (considerando a latencia de cold start do Render Free quando aplicavel) e toasts/estados de transicao limpos.
   - **Navegacao por teclado / Command Palette (`Ctrl+K` / `Cmd+K`)** opcional para alternar ferramentas e artigos da KB rapidamente como um analista real.
   - Visualizacao grafica do **Curriculo Vivo ECDSA P-256** e barra de **Progresso de Trilha** estilo AWS Skill Builder.
2. **Evolucao de Produto / Pos-Hackathon (Ondas 1 a 4 — diferenciadores de produto):**
   - **Bancada Interativa Visual 2D/SVG** para os novos laboratorios da matriz de 560h: inspetor visual de hardware/placa-mae, patch panel e cabo RJ-45 (`T568A/T568B`), diagrama topologico clicavel de rede (`PC -> Switch -> Roteador -> DNS -> Gateway`), fluxo de atendimento em **VideoCall com Agente IA / Avatar**, editor visual de scripts/queries e sistema de **Certificados / Micro-credenciais por Trilha**.
   - **Player Interativo de Licoes (estilo Udemy/Coursera)** com notas sincronizadas no Caderno, quiz contextual integrado e retomada exata do ponto em que parou.

### Frente 6 — Design System Completo e Guardrails Tecnicos (WCAG 2.2 AA + Zero Regressao em Testes)
Entregue a especificacao tecnica executavel para o time de engenharia implementar sem quebrar nada:
1. **Tokens CSS Semânticos (Claro como padrao principal + Escuro para modo Cockpit):**
   - Cores de superficie em niveis (`--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`), bordas (`--border-hairline`, `--border-strong`), texto com contraste >= 4.5:1 (`--text-primary`, `--text-secondary`, `--text-muted`), acento principal coeso (sem mistura gratuita de 5 cores vibrantes).
   - Escala tipografica (`Plus Jakarta Sans` ou `Inter` para UI + `JetBrains Mono` ou `IBM Plex Mono` para terminais/IDs/tickets), *line-height*, *letter-spacing* e limites de linha (`65ch` a `72ch` em leitura).
   - Escala de espacamento (`4px` base grid), raios consistentes por hierarquia (`4px`/`6px` controles densos, `8px`/`10px` paineis — sem "tudo pill" ou "tudo 16px") e sombras minimas (preferencia por borda de `1px` + leve contraste de fundo estilo Linear/Cloudscape).
2. **Anatomia de Componentes-Chave (Estados: default, hover, focus-visible, active, disabled, loading, error, empty):**
   - Barra de navegacao global, Cards de Cenario, Tabela/Fila ITSM, Terminal/SimuDesk, Modal/Drawer, Botoes (primario, secundario, ghost, destrutivo), Tabs e Badges semanticas discretas.
3. **Preservacao de Acessibilidade e Testes (`Vitest + axe-core` e `Playwright`):**
   - Mapeamento dos seletores semanticos (`role`, `aria-label`, textos de botao existentes em `App.test.tsx`, `*.test.tsx` e `e2e/*.spec.ts`) e responsividade obrigatoria em `375px`, `768px`, `1280px` e `1440px` com zero *horizontal overflow*.

---

## 5. Os 5 Entregaveis Obrigatorios (Por Agente)

Grave **exatamente estes 5 arquivos** (podendo adicionar o prototipo HTML opcional na itemizacao do entregavel 5) na sua pasta designada (`docs\auditoria-ui-ux\kiro\`, `docs\auditoria-ui-ux\codex\` ou `docs\auditoria-ui-ux\copilot\`):

1. **`01_DIAGNOSTICO_ANTI_CARA_DE_IA_E_BENCHMARK.md`**
   - Auditoria franca tela a tela do que esta no ar (`https://it-flight-simulator-hackbrasil.vercel.app`) e nos screenshots.
   - Tabela "Vicio de IA encontrado no codigo atual -> Arquivo/Linha -> Por que empobrece o produto -> Como o mercado resolve".
   - Benchmark detalhado (**AWS Skill Builder/Cloudscape**, **Microsoft Learn**, **Udemy**, **TryHackMe/HTB**, **Linear/JSM**) com decisoes objetivas do que adotar.

2. **`02_ARQUITETURA_UX_JORNADAS_E_WIREFRAMES.md`**
   - Nova Arquitetura de Informacao (sitemap enxuto, navegacao global e subnavegacao).
   - Wireframes ASCII detalhados (`1440px` desktop e `375px` mobile) das 4 telas principais:
     1) **Home / Catalogo de Missoes e Trilhas (estilo AWS Skill Builder)**
     2) **Course Player + Guia da Licao (estilo Udemy / Microsoft Learn)**
     3) **Workstation Split-Screen em Turno (Painel de Tarefa/Dicas + ITSM/Chat/SimuDesk/KB)**
     4) **Caixa-Preta Replay + Credencial Curriculo Vivo (estilo Datadog Timeline + Credly)**
   - Revisao de micro-copy (antes vs. depois, sem texto de LLM).

3. **`03_DESIGN_SYSTEM_TOKENS_E_PADROES_COMPONENTES.md`**
   - Especificacao completa do Design System (tokens `:root` claros e `[data-theme="dark"]`, tipografia, grid, bordas, sombras, mapa completo de substituicao de todos os emojis por icones vetoriais `lucide-react`/SVG).
   - Regras de densidade diferenciada (superficie editorial de estudo vs. superficie densa de operacao ITSM/SimuDesk).
   - Guia de acessibilidade WCAG 2.2 AA e responsividade (`375px` a `1920px`).

4. **`04_BACKLOG_O_QUE_IMPLEMENTAR_UI_UX.csv`**
   - CSV UTF-8 com cabecalho exato:
     `id,camada,tela_ou_componente,problema_atual_cara_de_ia,referencia_mercado,solucao_ui_ux_detalhada,o_que_implementar_em_codigo,horizonte,impacto,esforco`
   - Valores permitidos para `horizonte`:
     `PRE_BANCA_HACKATHON` | `ONDA_1_POS_HACKATHON` | `ONDA_2_LABS_VISUAIS` | `ONDA_3_ESCALA`
   - Inclua tanto melhorias visuais quanto **novas funcionalidades e componentes interativos a implementar** (ex.: bancada visual SVG de hardware/cabo/rede, split-pane redimensionavel, command palette, skeleton de cold start, timeline interativa).

5. **`05_ESPECIFICACAO_CODIGO_E_PROTOTIPO_ALTA_FIDELIDADE.md`** *(e opcionalmente um arquivo complementar `05_MOCKUP_ALTA_FIDELIDADE.html` autocontido na mesma pasta)*
   - Plano de refatoracao arquivo por arquivo dentro de `src/frontend/src/` preservando contratos da API C# e testes `Vitest`/`Playwright`.
   - Blocos prontos de CSS (tokens + layout) e JSX/TSX ilustrando os novos componentes principais (ex.: `AppShell`, `MissionCard`, `SplitLabWorkspace`, `ItsmConsole`, `TimelineReplay`).
   - Se gerar o `05_MOCKUP_ALTA_FIDELIDADE.html`, ele deve renderizar offline sem dependencias quebradas, usando icones SVG inline reais (zero emojis decorativos e zero caractere E comercial), demonstrando na pratica a diferenca entre "UI de IA" e "Produto Profissional".

---

## 6. Checklist Obrigatorio Antes de Concluir

- [ ] Li as skills `frontend-design` (Claude Design), `product-design` (`audit` / `design-qa`), `agency-agents/ui-designer.md` e `mobbin` (`redesign-screen` / `plain-writing`)?
- [ ] Inspecionei a aplicacao real no ar (`https://it-flight-simulator-hackbrasil.vercel.app`), os screenshots locais e o codigo em `src/frontend/src/`?
- [ ] Pesquisei referencias visuais e funcionais reais de AWS Skill Builder/Cloudscape, Microsoft Learn, Udemy, TryHackMe e Linear/JSM?
- [ ] Diagnostiquei explicitamente todos os padroes de "cara de IA" e propus tanto melhorias de UI/UX quanto novos componentes/funcionalidades para implementar?
- [ ] Gravei os 5 entregaveis (sem tocar em `src/`) exclusivamente na minha pasta dentro de `docs\auditoria-ui-ux\`?
- [ ] Verifiquei que existem **zero ocorrencias do caractere E comercial** e da palavra proibida em todos os arquivos que gerei?

---

## 7. Chamadas Prontas no PowerShell para Executar os 3 Agentes CLI

Comandos prontos para copiar e colar no PowerShell, executando cada agente dentro de `D:\Projetos\Ativos\it-flight-simulator-hackbrasil` com acesso total de leitura, skills, diretorios (`D:/` e `C:\Users\Black`) e web:

### 7.1. Kiro CLI (`kiro-cli`)
```powershell
Set-Location "D:\Projetos\Ativos\it-flight-simulator-hackbrasil"; kiro-cli chat --trust-all-tools --trust-workspace "Leia integralmente D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\PROMPT_AUDITORIA_UI_UX_MULTI_IA.md e todas as skills de UI/UX e Design listadas na Secao 2. Execute uma auditoria 100% independente, franca e profunda focada em UI Design, UX, Design System, eliminacao total de 'cara de IA' (anti-AI-slop) e especificacao do que implementar para o IT Flight Simulator atingir nivel de produto comercial (inspirado em AWS Skill Builder/Cloudscape, Microsoft Learn, Udemy, TryHackMe e Linear). Inspecione https://it-flight-simulator-hackbrasil.vercel.app, os screenshots indicados, o prototipo http://127.0.0.1:4180 e o codigo em src/frontend/src/. Nao modifique src/, bancos ou infraestrutura. Grave todos os 5 entregaveis obrigatorios (e opcionalmente o mockup HTML de alta fidelidade, com zero caractere E comercial) exclusivamente em: D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\kiro"
```
*(Para rodar sem interacao na linha de comando, acrescente `--no-interactive` apos `--trust-workspace`.)*

### 7.2. Codex CLI (`codex.cmd`)
```powershell
Set-Location "D:\Projetos\Ativos\it-flight-simulator-hackbrasil"; codex.cmd -C "D:\Projetos\Ativos\it-flight-simulator-hackbrasil" --dangerously-bypass-approvals-and-sandbox --search --add-dir "D:/" --add-dir "C:\Users\Black" "Leia integralmente D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\PROMPT_AUDITORIA_UI_UX_MULTI_IA.md e todas as skills de UI/UX e Design listadas na Secao 2. Execute uma auditoria 100% independente, franca e profunda focada em UI Design, UX, Design System, eliminacao total de 'cara de IA' (anti-AI-slop) e especificacao do que implementar para o IT Flight Simulator atingir nivel de produto comercial (inspirado em AWS Skill Builder/Cloudscape, Microsoft Learn, Udemy, TryHackMe e Linear). Inspecione https://it-flight-simulator-hackbrasil.vercel.app, os screenshots indicados, o prototipo http://127.0.0.1:4180 e o codigo em src/frontend/src/. Nao modifique src/, bancos ou infraestrutura. Grave todos os 5 entregaveis obrigatorios (e opcionalmente o mockup HTML de alta fidelidade, com zero caractere E comercial) exclusivamente em: D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\codex"
```
*(Para execucao em lote nao interativa, utilize `codex.cmd exec -C "D:\Projetos\Ativos\it-flight-simulator-hackbrasil" --dangerously-bypass-approvals-and-sandbox --add-dir "D:/" --add-dir "C:\Users\Black" "<MESMO PROMPT>"`.)*

### 7.3. GitHub Copilot CLI (`copilot.cmd`)
```powershell
Set-Location "D:\Projetos\Ativos\it-flight-simulator-hackbrasil"; copilot.cmd --yolo --add-dir "D:/" --add-dir "C:\Users\Black" -i "Leia integralmente D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\PROMPT_AUDITORIA_UI_UX_MULTI_IA.md e todas as skills de UI/UX e Design listadas na Secao 2. Execute uma auditoria 100% independente, franca e profunda focada em UI Design, UX, Design System, eliminacao total de 'cara de IA' (anti-AI-slop) e especificacao do que implementar para o IT Flight Simulator atingir nivel de produto comercial (inspirado em AWS Skill Builder/Cloudscape, Microsoft Learn, Udemy, TryHackMe e Linear). Inspecione https://it-flight-simulator-hackbrasil.vercel.app, os screenshots indicados, o prototipo http://127.0.0.1:4180 e o codigo em src/frontend/src/. Nao modifique src/, bancos ou infraestrutura. Grave todos os 5 entregaveis obrigatorios (e opcionalmente o mockup HTML de alta fidelidade, com zero caractere E comercial) exclusivamente em: D:\Projetos\Ativos\it-flight-simulator-hackbrasil\docs\auditoria-ui-ux\copilot"
```
*(Para encerrar automaticamente ao finalizar sem sessao interativa no Copilot CLI, troque `-i` por `--trust-folder -p`.)*
