# Prompt Mestre de Auditoria Independente Multi-IA — IT Career Simulator (Hack Brasil 2026)

> **Uso:** Aplicável em pé de igualdade ao **Kiro CLI**, **Codex CLI** e **GitHub Copilot CLI**.  
> **Postura Esperada:** Pesquisa 100% independente, pensamento crítico autônomo e zero alinhamento automático com decisões anteriores deste projeto. Questione premissas, aponte erros, proponha inclusões, cortes, correções e novas ideias em todas as frentes.

---

## 1. Mandato de Autonomia e Regras Operacionais

Você foi convocado como **banca multidisciplinar independente** para auditar integralmente o projeto **IT Career Simulator** — desde o regulamento oficial do **Hack Brasil 2026** até a governança, arquitetura de código, banco de dados, infraestrutura em nuvem, experiência de usuário, proposta pedagógica, viabilidade financeira, contabilidade e blindagem jurídica.

### Invariantes de Execução
1. **Autonomia de Pesquisa e Opinião Própria:**
   - Você tem liberdade total para ler arquivos locais, consultar bancos em modo somente leitura, inspecionar configurações de nuvem via CLIs instaladas, rodar testes/análises de leitura e pesquisar legislação, mercado e regulamento na web.
   - **Não aceite nenhum documento atual do repositório como verdade pronta.** Valide cada afirmação na prática (no código, nas CLIs, na legislação vigente e no site do Hackathon).
2. **Modo Estritamente Somente Leitura no Projeto e na Infraestrutura:**
   - **NÃO modifique nenhum arquivo em `src/`, nenhuma configuração de deploy, nenhum recurso no Vercel/Render/Neon/Cloudflare/GitHub e nenhum dado no banco DevLedger ou PostgreSQL.**
   - Toda ação em CLIs externas, Git e SQLite deve ser exclusivamente de consulta/leitura (ex.: `sqlite3 -readonly`, `git status`, `git log`, `ls`/`list`, `inspect`, `get`).
   - Apenas **grave os seus relatórios** dentro da sua pasta designada:
     - Kiro CLI: `D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\kiro\`
     - Codex CLI: `D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\codex\`
     - GitHub Copilot CLI: `D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\copilot\`
3. **Privacidade em Bases de Conhecimento Históricas:**
   - Ao consultar repositórios e snapshots de suporte para inspiração de cenários e incidentes, utilize apenas padrões técnicos, fluxos e categorias de falha. **Nunca copie nem registre em seus relatórios nomes de pessoas reais, CPFs/CNPJs reais, credenciais, tokens ou nomes de empresas clientes reais.**
4. **Regra Editorial do Repositório (Proibição de E Comercial):**
   - Por diretriz expressa do autor do projeto (conforme `AGENTS.md`), **jamais utilize o caractere E comercial** em títulos, textos, tabelas Markdown, nomes de módulos propostos ou arquivos `.csv`. Use sempre a palavra `"e"` ou vírgula.

---

## 2. Mapa Completo de Recursos, Caminhos e CLIs Disponíveis

### 2.1. Repositório Principal do Projeto (Hack Brasil 2026)
- **Raiz:** `D:\Projetos\Ativos\it-career-simulator-hackbrasil`
- **Regras e Documentação Estratégica:**
  - `README.md` e `AGENTS.md`
  - `docs/CONTEXTO_HACK_BRASIL_2026.md`
  - `docs/PRD_HACKATHON.md`
  - `docs/ARQUITETURA_HACKATHON.md`
  - `docs/CRONOGRAMA_HACKATHON.md`
  - `docs/DEPLOY_E_VIDEO.md`
  - `docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`
  - `docs/vetores-jcs-sha256.json`
  - `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md`
  - `docs/rfc/MANIFESTO_PASTA_REDE_INACESSIVEL_v1.1.md`
- **Código-Fonte Backend (`.NET 10` / C#):** `D:\Projetos\Ativos\it-career-simulator-hackbrasil\src\backend`
  - Solution `Simulador.slnx` com `Simulador.Dominio`, `Simulador.Cenarios`, `Simulador.Itsm`, `Simulador.Avaliacao`, `Simulador.Dialogo`, `Simulador.Infra`, `Simulador.Api` e suíte `tests/` (`xUnit`).
- **Código-Fonte Frontend (`React 19` + `TypeScript` + `Vite`):** `D:\Projetos\Ativos\it-career-simulator-hackbrasil\src\frontend`
  - Código da Workstation em `src/`, testes `Vitest + axe-core`, testes E2E `Playwright` em `e2e/jornadas.spec.ts` e `scripts/check-bundle-secrets.mjs`.
- **Grafo de Conhecimento de Código (Graphify):** `D:\Projetos\Ativos\it-career-simulator-hackbrasil\graphify-out`
- **Protótipo Visual UX Redesign (em revisão):**
  - Arquivos estáticos: `C:\Users\Black\.gemini\antigravity\brain\7af3228f-a969-42a1-a65d-becbf5a06ae0\scratch\prototipo-redesign\index.html`
  - Servidor local ativo (quando disponível): `http://127.0.0.1:4180`
- **Repositório Precursor (Histórico de Referência — Somente Leitura):**
  - `D:\Projetos\Ativos\simulador-carreira-ti`

### 2.2. Governança e Contexto no DevLedger (Somente Leitura)
- **Repositório DevLedger:** `D:\GitHub\cristianodossantosdasilva\DevLedger`
- **Banco SQLite:** `D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db`
- **Skill de consulta segura já instalada por agente:**
  - `C:\Users\Black\.kiro\skills\devledger-retomar\SKILL.md`
  - `C:\Users\Black\.codex\skills\devledger-retomar\SKILL.md`
  - `C:\Users\Black\.copilot\skills\devledger-retomar\SKILL.md`
- **Forma de acesso recomendada:**
  - Consultar com `sqlite3 -readonly -bail -json "D:/GitHub/cristianodossantosdasilva/DevLedger/data/devledger.db" "<SELECT ...>"` (sem registrar estados, sem compilar e sem alterar o banco).
  - Verificar `project`, `v_project_state_current`, `v_stage_current`, `v_sovereign_rule_active`, `v_decision_effective`, checkpoints, handoffs e eventuais divergências entre o banco e o Git local.

### 2.3. CLIs de Nuvem, Banco, Deploy e Git (Inspeção Real do Ambiente)
Todas as ferramentas abaixo estão instaladas no ambiente do autor; **verifique se há sessão autenticada, projetos publicados, bancos e variáveis configuradas** usando apenas comandos de leitura (`status`, `list`, `inspect`, `env ls`, `whoami`). No PowerShell com `ExecutionPolicy` restrita a scripts `.ps1`, invoque sempre os wrappers `.cmd` ou binários `.exe` abaixo:
- **GitHub CLI (`gh.exe`):** `C:\Program Files\GitHub CLI\gh.exe` (`gh auth status`, `gh repo view`, branches, workflows/actions)
- **Vercel CLI (`vercel.cmd`):** `C:\Users\Black\AppData\Roaming\npm\vercel.cmd` (referência de rewrite em `src/frontend/vercel.json`)
- **Render CLI (`render.exe`):** `C:\Users\Black\AppData\Local\Microsoft\WinGet\Links\render.exe` (blueprint em `render.yaml`)
- **Neon CLI (`neonctl.cmd` / `neon.cmd`):** `C:\Users\Black\AppData\Roaming\npm\neonctl.cmd` (projetos/branches PostgreSQL)
- **Cloudflare CLI (`cloudflare.cmd`):** `C:\Users\Black\AppData\Roaming\npm\cloudflare.cmd`
- **Infraestrutura Docker Local:** `D:\Projetos\Ativos\it-career-simulator-hackbrasil\docker-compose.yml` (`postgres:17-alpine` na porta `5432`, API na `8080`, frontend na `5173`).

### 2.4. Bases de Conhecimento de Suporte Reais e Sanitizadas (Somente Leitura)
Use para avaliar a aderência dos cenários propostos à realidade do suporte de TI no Brasil e sugerir novos incidentes, preventivas e procedimentos técnicos:
- `D:\GitHub\cristianodossantosdasilva\Arquivos-Suporte`
- `D:\GitHub\cristianodossantosdasilva\Consultoria-Modernizacao-Conformidade-Suporte-Tecnico`
- `D:\GitHub\cristianodossantosdasilva\Modernizacao-Suporte-Legado`
- `D:\Backups\ContinuidadeRecuperada\Antigravity\skills-historicas\mentor-senior-ti\references`
- `D:\Backups\ContinuidadeRecuperada\_CONSOLIDADO_OPTEC\_OPTEC_KB_SNAPSHOT`
- `D:\Projetos\Ativos\DeskManager` *(atenção redobrada à privacidade caso haja registros não sanitizados — extrair apenas taxonomia de incidentes sem citar entidades ou pessoas)*

### 2.5. Regulamento Oficial e Ecossistema do Hack Brasil 2026 (Pesquisa Web)
Pesquise diretamente nas páginas oficiais do evento (`https://www.hackbrasil.com/` e subpáginas de regulamento, FAQ, cronograma, critérios de avaliação e parceiros) para validar:
- Regras oficiais do Hack Brasil 2026, elegibilidade individual/time, regras sobre autoria/código inédito, trilha **"Acesso à educação"**, formato da submissão (prazo `30/nov/2026`), regras do vídeo pitch, critérios da banca para a final presencial (`12/dez/2026` no Google for Startups em São Paulo) e créditos/benefícios reais oferecidos pelos patrocinadores.

---

## 3. As 7 Frentes Obrigatórias de Auditoria (Assuma Cada Papel com Rigor Máximo)

### Frente 1 — Consultor de Produto e Estratégia para Hackathon
- O projeto realmente resolve a dor do iniciante ("cru") e cumpre a trilha **"Acesso à educação"** do Hack Brasil 2026?
- Qual a distância real entre o **código implementado hoje** (`src/`) e a **ambição documentada** (`PRD_HACKATHON.md` e `PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`)? Há risco de parecer *vaporware* ou "documentação grande para pouco produto entregue" até `30/nov/2026`?
- Quais recursos são indispensáveis para ganhar o Hackathon até `30/nov/2026` (MVP demonstrável no vídeo de 3 min e clicável pela banca) versus o que deve ficar claramente demarcado como roadmap pós-Hackathon?
- Como melhorar a história, o posicionamento, a narrativa de impacto social e o vídeo pitch de 3 minutos?

### Frente 2 — Consultor de UX, UI e Acessibilidade
- Audite o `src/frontend` atual e o protótipo `prototipo-redesign/index.html` (`http://127.0.0.1:4180`).
- Um usuário 100% leigo que acabou de se matricular consegue navegar intuitivamente sem se perder entre abas, conceitos técnicos e terminais?
- Avalie responsividade (desktop, tablet, celular), clareza visual, sobrecarga cognitiva, tema claro educacional vs. terminal, acessibilidade WCAG AA, fluxos de erro e qualidade real dos protótipos interativos (bancadas de hardware, cabeamento, Design Wi-Fi, Firewall NGFW, etc.).
- Aponte falhas visuais, pontos confusos e melhorias concretas de usabilidade.

### Frente 3 — Consultor Educacional e Pedagógico
- Avalie criticamente a matriz de **560h em 8 meses (Ciclo 1 Júnior 280h + Ciclo 2 Pleno/N3 280h)**, as 8 Unidades Curriculares (`UC1` a `UC8`), os 80 laboratórios listados e os 8 laboratórios dedicados propostos.
- A carga horária, sequência didática e profundidade realmente tornam um leigo apto ao mercado como **Técnico de Suporte Júnior em até 4 meses** e com nível técnico sólido em **8 meses**? Falta algum conteúdo essencial de entrada no suporte no Brasil (ex.: Linux desktop, Android/iOS corporativo/MDM, VoIP/telefonia IP, automação básica, atendimento ao cliente difícil, LGPD operacional)? Há conteúdo avançado demais misturado na base?
- Avalie as ferramentas de estudo propostas (Recordação Ativa, Repetição Espaçada SM-2, Método Cornell, Técnica de Feynman, Pitch STAR, Pomodoro, futuro VideoCall com Agentes IA) e sugira novas dinâmicas de fixação e cenários a partir das KBs reais disponíveis.
- Avalie a validade pedagógica da **trilha de certificações** e como estruturar simulados práticos (PBQs) realmente eficazes.

### Frente 4 — Consultor Financeiro
Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.

### Frente 5 — Contador (Tributação e Contabilidade no Brasil)
Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.

### Frente 6 — Advogado (Direito Educacional, Propriedade Industrial, Autoral, LGPD e Consumidor)
- **Direito Educacional (MEC / LDB Art. 42 / Decreto nº 5.154/2004 / Resolução CNE/CP nº 1/2021):** Quais termos são proibidos ou arriscados na comunicação (*ex.: risco de propaganda enganosa se o marketing insinuar "diploma técnico" ou "garantia de emprego"*)? Como blindar certificados FIC e microcertificados?
- **Propriedade Industrial e Direito de Software (LPI Lei nº 9.279/1996 Art. 132 e Lei nº 9.609/1998):** Quais riscos reais existem ao simular visualmente ou em CLI produtos de **Cisco, Fortinet (FortiGate), MikroTik (RouterOS/WinBox), Ubiquiti (UniFi Design Center / Controller), Microsoft 365, VMware/Hyper-V, Veeam, Zabbix**? Até onde vai o *trade dress* (aparência visual protegida) vs. interface funcional/CLI genérica e uso nominativo lícito antes de ter contrato oficial de *Vendor Academy*?
- **Certificações e Direitos Autorais (Lei nº 9.610/1998 e NDAs):** Como garantir governança anti-*brain dump* em questões autorais e explicitar no contrato que a plataforma prepara, mas não emite certificação de terceiros?
- **CDC (Lei nº 8.078/1990), Decreto nº 7.962/2013 e LGPD (Lei nº 13.709/2018):** Avalie termos de uso, política de privacidade, renovação automática de assinatura, política de 7 dias, menores de idade (jovens aprendizes/estudantes menores de 18 anos precisando consentimento dos pais no Art. 14 da LGPD!), armazenamento de áudio/vídeo/transcrições na Onda 4 e uso do **Currículo Vivo público com SHA-256** (dados pessoais expostos em link verificável).

### Frente 7 — Desenvolvedor Sênior / Staff Architect
- Faça revisão técnica real lendo o código-fonte em `src/backend` e `src/frontend`, o banco/infra (Docker, Neon, Render, Vercel, Cloudflare), os scripts e os testes:
  - Arquitetura `.NET 10` e `React 19`: coesão, acoplamento, modelagem de domínio, determinismo de eventos, possíveis bugs, *race conditions*, *memory leaks* ou gargalos em produção (especialmente no `InMemoryEventStore` vs. Postgres, `HttpClient`, cold start no plano Free da Render, conexão serverless Neon).
  - Segurança da aplicação: validação de SQL *Read-Only*, CORS, Rate Limiting, exposição de logs/erros, integridade real da canonicalização **JCS (RFC 8785) + SHA-256** (verificando se o cálculo pode ser fraudado sem assinatura digital assimétrica/chave privada do servidor! Atenção crítica a esse ponto: **hash SHA-256 sem assinatura criptográfica HMAC/Ed25519 garante apenas integridade do JSON, não autenticidade contra geração forjada por terceiros!** Audite e aponte isso se aplicável).
  - Auditoria das CLIs/ambientes publicados e estado do DevLedger: o que já está no ar, o que está pendente de configuração e que lacunas existem entre código local, GitHub e deploy.
  - Plano técnico concreto do que corrigir **antes** de começar a programar as novas telas educacionais em `src/`.

---

## 4. Entregáveis Obrigatórios (Arquivos na Sua Pasta de Relatórios)

Grave todos os arquivos abaixo na sua pasta atribuída (`docs\auditoria-independente\<kiro|codex|copilot>\`), lembrando da regra de **zero caractere E comercial** e **zero vazamento de dados pessoais de KBs**:

1. **`01_PARECER_GERAL_7_FRENTES.md`**
   - Resumo executivo franco (sem bajulação).
   - Diagnóstico completo separado pelas **7 Frentes**.
   - Seção explícita: **"O que DEVE mudar ou entrar JÁ para o Hackathon (até 30/nov/2026)"** vs. **"O que DEVE mudar no Produto Pós-Hackathon"**.
2. **`02_MATRIZ_MUDANCAS_E_PRIORIDADES.csv`**
   - CSV UTF-8 com cabeçalho exato:
     `id,frente,tipo,titulo,evidencia_observada,problema_ou_oportunidade,mudanca_proposta,horizonte,impacto,esforco`
   - Valores sugeridos para `horizonte`: `IMEDIATO_HACKATHON` | `ONDA_1` | `ONDA_2` | `ONDA_3` | `POS_HACKATHON_ONDA_4`.
3. **`03_NOVAS_IDEIAS_CONTEUDO_E_CENARIOS.md`** *(pode acompanhar `.csv` complementar)*
   - Novas ideias de produto, mecânicas de aprendizagem/gamificação, cenários extraídos por inspiração das KBs consultadas, melhorias nos 8 laboratórios e recomendações para o módulo futuro de VideoCall com Agentes IA.
4. **`04_AUDITORIA_FINANCEIRA_CONTABIL_JURIDICA.md`** *(pode acompanhar `.csv` de custos/tributos)*
   - Revisão detalhada de custos reais, unit economics, cenários de sensibilidade, parecer tributário/CNAE/ISS/IBS-CBS e parecer jurídico completo (Educacional, LPI/Trade Dress, Software, LGPD menores/vídeo, CDC e assinatura criptográfica do Currículo Vivo).
5. **`05_AUDITORIA_CODIGO_ARQUITETURA_INFRA.md`**
   - Achados por arquivo/linha em `src/backend`, `src/frontend`, testes, `render.yaml`, `vercel.json`, `docker-compose.yml`, DevLedger e estado inspecionado via CLIs (`gh`, `vercel`, `render`, `neonctl`, `cloudflare`).
6. **`06_REFERENCIAS_E_FONTES.md`**
   - Lista verificável de todas as URLs consultadas (regulamento Hack Brasil, legislações, tabelas de preços oficiais de fornecedores), arquivos locais, consultas `DevLedger` e saídas de CLIs utilizadas na auditoria.

---

## 5. Checklist de Conclusão do Agente Auditor

Antes de encerrar sua entrega, verifique:
- [ ] Pesquisei o regulamento atualizado do Hack Brasil 2026 na web?
- [ ] Consultei o banco `DevLedger` em modo somente leitura e chequei divergências com o Git?
- [ ] Inspecionei o código real em `src/backend` e `src/frontend`, o protótipo visual e as CLIs (`gh`, `vercel`, `render`, `neonctl`, `cloudflare`)?
- [ ] Consultei as KBs disponíveis para avaliar e sugerir cenários reais sem copiar dados pessoais ou de clientes?
- [ ] Cobri com profundidade independente todas as **7 frentes**?
- [ ] Salvei todos os 6 entregáveis na minha pasta em `docs/auditoria-independente/<ia>/` sem alterar nada em `src/`?
- [ ] Garanti **zero ocorrências do caractere E comercial** em todos os arquivos gerados?

---

## 6. Chamadas Prontas no Caminho do Repositório Local com Permissão e Acesso Total

Comandos prontos para PowerShell executando cada agente diretamente dentro de `D:\Projetos\Ativos\it-career-simulator-hackbrasil`, com permissão total de ferramentas, diretórios (`D:/` e `C:\Users\Black`), busca web e uso dos executáveis `.cmd`/`.exe` (evitando bloqueio de `.ps1`):

### 6.1. Kiro CLI (`kiro-cli`)
```powershell
Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; kiro-cli chat --trust-all-tools --trust-workspace "Leia integralmente D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\PROMPT_AUDITORIA_INDEPENDENTE_MULTI_IA.md e execute a auditoria completa de forma 100% independente, critica e sem vies previo. Voce tem acesso e autonomia total para ler o repositorio principal (D:\Projetos\Ativos\it-career-simulator-hackbrasil), consultar o DevLedger em somente leitura (D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db via skill C:\Users\Black\.kiro\skills\devledger-retomar\SKILL.md), inspecionar as KBs listadas, checar o prototipo visual (http://127.0.0.1:4180), rodar consultas de leitura nas CLIs instaladas usando .cmd/.exe (gh.exe, vercel.cmd, render.exe, neonctl.cmd, cloudflare.cmd) e pesquisar na web o regulamento oficial do Hack Brasil 2026 (https://www.hackbrasil.com/). Assuma as 7 frentes descritas no arquivo (Produto, UX/UI, Educacional, Financeiro, Contador, Advogado e Dev Senior/Arquiteto). Nao modifique nada em src/, bancos ou infraestrutura agora. Grave todos os 6 entregaveis obrigatorios (MDs e CSVs, respeitando zero caractere E comercial e privacidade das KBs) exclusivamente em: D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\kiro"
```
*(Para rodar sem interação na linha de comando, acrescente `--no-interactive` após `--trust-workspace`.)*

### 6.2. Codex CLI (`codex.cmd`)
```powershell
Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; codex.cmd -C "D:\Projetos\Ativos\it-career-simulator-hackbrasil" --dangerously-bypass-approvals-and-sandbox --search --add-dir "D:/" --add-dir "C:\Users\Black" "Leia integralmente D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\PROMPT_AUDITORIA_INDEPENDENTE_MULTI_IA.md e execute a auditoria completa de forma 100% independente, critica e sem vies previo. Voce tem acesso e autonomia total para ler o repositorio principal (D:\Projetos\Ativos\it-career-simulator-hackbrasil), consultar o DevLedger em somente leitura (D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db via skill C:\Users\Black\.codex\skills\devledger-retomar\SKILL.md), inspecionar as KBs listadas, checar o prototipo visual (http://127.0.0.1:4180), rodar consultas de leitura nas CLIs instaladas usando .cmd/.exe (gh.exe, vercel.cmd, render.exe, neonctl.cmd, cloudflare.cmd) e pesquisar na web o regulamento oficial do Hack Brasil 2026 (https://www.hackbrasil.com/). Assuma as 7 frentes descritas no arquivo (Produto, UX/UI, Educacional, Financeiro, Contador, Advogado e Dev Senior/Arquiteto). Nao modifique nada em src/, bancos ou infraestrutura agora. Grave todos os 6 entregaveis obrigatorios (MDs e CSVs, respeitando zero caractere E comercial e privacidade das KBs) exclusivamente em: D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\codex"
```
*(Para execução em lote não interativa, utilize `codex.cmd exec -C "D:\Projetos\Ativos\it-career-simulator-hackbrasil" --dangerously-bypass-approvals-and-sandbox --add-dir "D:/" --add-dir "C:\Users\Black" "<MESMO PROMPT>"`.)*

### 6.3. GitHub Copilot CLI (`copilot.cmd`)
```powershell
Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; copilot.cmd --yolo --add-dir "D:/" --add-dir "C:\Users\Black" -i "Leia integralmente D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\PROMPT_AUDITORIA_INDEPENDENTE_MULTI_IA.md e execute a auditoria completa de forma 100% independente, critica e sem vies previo. Voce tem acesso e autonomia total para ler o repositorio principal (D:\Projetos\Ativos\it-career-simulator-hackbrasil), consultar o DevLedger em somente leitura (D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db via skill C:\Users\Black\.copilot\skills\devledger-retomar\SKILL.md), inspecionar as KBs listadas, checar o prototipo visual (http://127.0.0.1:4180), rodar consultas de leitura nas CLIs instaladas usando .cmd/.exe (gh.exe, vercel.cmd, render.exe, neonctl.cmd, cloudflare.cmd) e pesquisar na web o regulamento oficial do Hack Brasil 2026 (https://www.hackbrasil.com/). Assuma as 7 frentes descritas no arquivo (Produto, UX/UI, Educacional, Financeiro, Contador, Advogado e Dev Senior/Arquiteto). Nao modifique nada em src/, bancos ou infraestrutura agora. Grave todos os 6 entregaveis obrigatorios (MDs e CSVs, respeitando zero caractere E comercial e privacidade das KBs) exclusivamente em: D:\Projetos\Ativos\it-career-simulator-hackbrasil\docs\auditoria-independente\copilot"
```
*(No GitHub Copilot CLI, `--trust-folder` vale apenas no modo não interativo `-p` e é incompatível com `-i`; `--yolo` já ativa `--allow-all-tools --allow-all-paths --allow-all-urls`. Para encerrar automaticamente ao finalizar sem sessão interativa, use `copilot.cmd --yolo --trust-folder --add-dir "D:/" --add-dir "C:\Users\Black" -p "<MESMO PROMPT>"`.)*
