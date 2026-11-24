# Passagem Oficial de Bastao para o Kiro CLI — Auditoria e Redesign UI/UX

**Data de emissao:** `2026-11-15T22:44-03:00` (`2026-11-16T01:44Z`)  
**Origem:** Sessao anterior Antigravity (creditos encerrando)  
**Destino:** **Kiro CLI** (`kiro-cli`) assumindo continuidade integral  
**Projeto no DevLedger:** slug `simulador-carreira-ti` | raiz `D:\Projetos\Ativos\it-career-simulator-hackbrasil`

---

## 1. Fotografia Exata do Estado Atual

### 1.1. Repositorio Git
- **Caminho local:** `D:\Projetos\Ativos\it-career-simulator-hackbrasil`
- **Branch atual:** `main`
- **Ultimo commit (`HEAD`):** `6b437451c14b434f73693c91713b643cb4e243d0` (`fix(ui,a11y): corrigir quebra de linha da navegacao mobile 375px`)
- **Commits recentes relevantes:**
  - `549f76a`: port do Prototipo v3 para o React
  - `ac25fff`: correcao dos testes de integracao PostgreSQL 17 no CI
  - `9c2a54e`: correcoes P0 de seguranca, JCS RFC 8785, ECDSA P-256, tema claro e docs
- **Arvore de trabalho atual (`git status --short`):**
  - `src/` esta **limpo** (zero alteracoes pendentes em codigo-fonte).
  - Unica entrada nao rastreada: `?? docs/auditoria-ui-ux/` contendo as 3 auditorias completas de UI/UX recem-concluidas.

### 1.2. Infraestrutura e Producao no Ar
- **Frontend Vercel:** `https://it-flight-simulator-hackbrasil.vercel.app` (`Ready` no commit `6b43745`).
- **Backend Render API:** `it-flight-simulator-api` (`srv-dbs9ltjrjlhs73djaqd0`, deploy `dep-dbt55j67bikc73d2tdag`), respondendo em `https://it-flight-simulator-api.onrender.com/health/ready` com Postgres ativo.
- **Servicos auxiliares Render:** `vitru-agent-gateway` (`srv-dbhthue7bikc73fufi4g`) suspenso preventivamente com backup salvo em `docs\auditoria-independente\consolidado\BACKUP_RENDER_VITRU_GATEWAY.json`.
- **Banco DevLedger:** `D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db` integro (`Test-DevLedger` retornou `ok=True`, `integrity=ok`, `foreign_key_violations=0`).

---

## 2. Inventario das 3 Auditorias de UI/UX Concluidas

Os tres agentes CLI finalizaram de forma independente todos os entregaveis pedidos em `docs\auditoria-ui-ux\PROMPT_AUDITORIA_UI_UX_MULTI_IA.md`:

1. **Kiro CLI (`docs\auditoria-ui-ux\kiro\`):**
   - `01_DIAGNOSTICO_ANTI_CARA_DE_IA_E_BENCHMARK.md` (141 linhas, inclui metricas medidas via Playwright/Chromium)
   - `02_ARQUITETURA_UX_JORNADAS_E_WIREFRAMES.md` (262 linhas)
   - `03_DESIGN_SYSTEM_TOKENS_E_PADROES_COMPONENTES.md` (293 linhas)
   - `04_BACKLOG_O_QUE_IMPLEMENTAR_UI_UX.csv` (51 linhas)
   - `05_ESPECIFICACAO_CODIGO_E_PROTOTIPO_ALTA_FIDELIDADE.md` (645 linhas)
   - `05_MOCKUP_ALTA_FIDELIDADE.html` (455 linhas, mockup interativo de alta fidelidade)
   - Pasta `evidencias\` com capturas reais de producao, prototipo e mockup em `375px`, `1280px` e `1440px`.

2. **Codex CLI (`docs\auditoria-ui-ux\codex\`):**
   - `01_DIAGNOSTICO_ANTI_CARA_DE_IA_E_BENCHMARK.md` (87 linhas)
   - `02_ARQUITETURA_UX_JORNADAS_E_WIREFRAMES.md` (241 linhas)
   - `03_DESIGN_SYSTEM_TOKENS_E_PADROES_COMPONENTES.md` (182 linhas)
   - `04_BACKLOG_O_QUE_IMPLEMENTAR_UI_UX.csv` (28 linhas)
   - `05_ESPECIFICACAO_CODIGO_E_PROTOTIPO_ALTA_FIDELIDADE.md` (170 linhas)

3. **GitHub Copilot CLI (`docs\auditoria-ui-ux\copilot\`):**
   - `01_DIAGNOSTICO_ANTI_CARA_DE_IA_E_BENCHMARK.md` (104 linhas)
   - `02_ARQUITETURA_UX_JORNADAS_E_WIREFRAMES.md` (198 linhas)
   - `03_DESIGN_SYSTEM_TOKENS_E_PADROES_COMPONENTES.md` (189 linhas)
   - `04_BACKLOG_O_QUE_IMPLEMENTAR_UI_UX.csv` (23 linhas)
   - `05_ESPECIFICACAO_CODIGO_E_PROTOTIPO_ALTA_FIDELIDADE.md` (200 linhas)

### Consensos Criticos Ja Identificados Nas 3 Auditorias
- **Erradicar os "tells" de interface gerada por IA:** remover os **81 emojis estruturais** (substituir por icones SVG consistentes / `lucide-react`), eliminar a **faixa arco-iris `.topnav::after`** de 4 cores, remover *eyebrows* em caixa alta, strings com pontos medios (`A · B · C`), proliferacao de chips/pills coloridas, e eliminar os 42 `style={{...}}` inline em favor de tokens semanticos limpos.
- **Tornar o "Primeiro Missão" o objeto central (acima da dobra):** em vez de abrir com widgets de Pomodoro, streak e barras 0% em 5 cards iguais (ou scroll de 7056px no mobile), destacar retomada, proxima missao / Primeiro Missão e fluxo claro **Estudar -> Praticar no Split-Screen -> Revisar na Revisão**.
- **Unificar Academia e Workstation:** sair do sentimento de "dois sites diferentes" para um **AppShell coeso** com barra superior limpa (ou sidebar colapsavel) e **Split-Screen Lab** (roteiro/checklist da missao lado a lado com o console operacional).
- **Transformar as ferramentas em software real:**
  - **Aurora ITSM:** fila e detalhe estilo Jira Service Management / Linear com **SLA visivel**, prioridade real, separacao entre resposta publica e nota interna.
  - **SimuDesk:** painel mesa de trabalho tecnico legivel (em vez de 2 inputs largos antes da conexao).
  - **Revisão Replay:** sair do `<pre>` com JSON bruto para **timeline visual estilo Datadog/Vercel Logs**, comparativo de decisoes e **Credencial Verificavel ECDSA P-256** com cara de badge tecnico oficial (estilo Credly/AWS).
  - **Tutor / Mentor:** transparencia no rotulo e exercicio guiado sem promessa enganosa de chat LLM generico.

---

## 3. O Que o Kiro CLI Deve Fazer na Continuidade (Em Ordem)

### Etapa 1 — Consolidacao em `docs\auditoria-ui-ux\consolidado\`
1. Ler integralmente os entregaveis de `kiro\`, `codex\` e `copilot\` (com foco nos arquivos `01` a `05` de cada agente e no `05_MOCKUP_ALTA_FIDELIDADE.html`).
2. Gerar na pasta `docs\auditoria-ui-ux\consolidado\`:
   - `01_CONSOLIDADO_UI_UX_E_PLANO_IMPLEMENTACAO.md`: sintese das convergencias, arbitragem das divergencias (tipografia, layout da home, navegacao mobile/desktop, densidade de ITSM/SimuDesk/Replay), e escopo fechado **Pre-Banca Hack Brasil 2026 (`PRE_BANCA_HACKATHON`)** vs. **Ondas Pos-Hackathon**.
   - `02_BACKLOG_UNIFICADO_UI_UX.csv`: consolidacao priorizada sem duplicatas do que sera implementado em codigo agora vs. depois.
3. Apresentar o plano consolidado ao usuario para alinhamento rapido antes (ou junto) do inicio da implementacao em `src\frontend\`, se houver alguma escolha estetica aberta (ex.: manter `05_MOCKUP_ALTA_FIDELIDADE.html` como referencia visual principal ou combinar algum detalhe do Codex/Copilot).

### Etapa 2 — Implementacao no React (`src\frontend\src\`) Sem Quebrar Contratos
1. Aplicar o novo Design System e componentes em `src\frontend\src\` (`index.css`, tokens, iconografia SVG com `lucide-react` ou SVGs dedicados, fontes via `@fontsource` ou CSS seguro, `BarraSuperior`, `TelaInicial`, `AulasView`, `CadernoView`, `MentorView`, `ItsmApp`, `ChatApp`, `SimuDeskApp`, `IntranetApp`, `ReplayView`).
2. Preservar **100% dos contratos da API C#** (`src\backend`), a verificacao criptografica `ECDSA P-256` (`JCS RFC 8785`), e os seletores semanticos (`role`, `aria-label`, textos acionaveis) usados nos testes unitarios e E2E.
3. Respeitar a meta de zero scroll horizontal (`overflow375=false`), contraste WCAG AA >= 4.5:1 e suporte limpo aos modos claro e escuro.

### Etapa 3 — Validacao Completa Local
Executar dentro de `D:\Projetos\Ativos\it-career-simulator-hackbrasil\src\frontend` (usando `.cmd` no Windows):
- `npm.cmd run lint` (exigir 0 erros e 0 warnings)
- `npm.cmd test -- --run` (`Vitest + axe-core`, corrigindo ou atualizando seletores apenas se o copy mudar intencionalmente, mantendo cobertura integral)
- `npm.cmd run build` (`tsc -b`, `vite build` e `check-bundle-secrets.mjs`)
- `npx.cmd playwright test` (desktop `1280px`/`1440px`, tablet `768px` e mobile `375px`, inspecionando screenshots reais gerados!)

### Etapa 4 — Regras Inegociaveis, Git, Deploy e DevLedger
- **Zero E comercial:** verificar com PowerShell que nao existe o caractere E comercial em `.md`, `.csv`, `.html`, textos UI ou docs (exceto sintaxe estrita de codigo/URLs quando tecnicamente inevitavel em TSX/CSS).
- **Zero palavra proibida:** manter zero ocorrencias da forma passada de sair nos documentos e UI.
- **Git e Deploy:** revisar `git diff`, commitar na branch `main` (incluindo `docs/auditoria-ui-ux/` e as alteracoes validadas de `src/frontend/`), fazer `git push`, aguardar GitHub Actions CI verde e validar visualmente com screenshots em `https://it-flight-simulator-hackbrasil.vercel.app`.
- **DevLedger:** atualizar checkpoint, note de handoff e `Add-DevLedgerProjectState` no projeto `simulador-carreira-ti` via `pwsh -NoProfile -ExecutionPolicy Bypass` usando `D:\GitHub\cristianodossantosdasilva\DevLedger\module\DevLedger.psm1`.
- **Meta final de hackathon:** antes de `30/nov/2026`, deixar o usuario pronto para atualizar a URL `https://it-flight-simulator-hackbrasil.vercel.app` no painel do Hack Brasil 2026 e gravar o video de ate 3 minutos.

---

## 4. Limite Honesto Sobre O Estado Temporario da Maquina
- O servidor estatico temporario do prototipo antigo na porta `127.0.0.1:4180` pertencia a sessao anterior e pode se encerrar quando a janela/sessao Antigravity fechar; se precisar abri-lo novamente para comparacao visual, basta servir `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\prototipo-redesign`.
- Para visualizar o novo mockup do Kiro diretamente no navegador, abra `D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-ui-ux\kiro\05_MOCKUP_ALTA_FIDELIDADE.html`.
