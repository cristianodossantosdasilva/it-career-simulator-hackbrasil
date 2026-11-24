# Documento de Concepção Técnica e RFC: Plataforma de Simulação Prática de Carreira em TI ("IT Career Simulator")

> **Escopo:** Documento de concepção pedagógica, arquitetura técnica e registro consolidado das decisões estruturais que fundamentam o **IT Career Simulator** (Edição Hack Brasil 2026).

---

## 1. Visão do Projeto e Conceito Central

O projeto nasceu para transformar a formação prática em Tecnologia da Informação — partindo do **Suporte Técnico (Help Desk / Service Desk)** até operações de **Infraestrutura, Data Center, Cibersegurança, SRE e Auditoria de Dados** — em uma vivência imersiva e verificável.

### Conceito Central
- **Simulação de Ambiente Operacional Real:** O participante não apenas lê conteúdo teórico; ele atua em uma operação de TI simulada na empresa fictícia **Aurora Logística** (`aurora.local`), evoluindo de **Estagiário e Field Service** a **Técnico de Suporte Jr (N1)**, **Técnico Pleno (N2)** e **3 Vertentes Técnicas N3**.
- **Teoria Just-in-Time integrada à Prática:** A Base de Conhecimento (Intranet/KB) apresenta políticas e procedimentos exatamente quando o atendimento exige consulta.
- **Fluxo Operacional Completo (ITSM):**
  1. Um módulo **ITSM próprio** apresenta fila de chamados, categoria, urgência, impacto e SLA em tempo real.
  2. O participante realiza a triagem e entra em contato com o usuário no **Comunicador Corporativo**, investigando sintomas e solicitando permissão para acesso remoto.
  3. Após cumprir os critérios de triagem e segurança, o ambiente libera as credenciais do **SimuDesk**.
  4. No **SimuDesk**, o participante diagnostica por terminal (contexto de usuário vs. contexto elevado) e painéis administrativos, identifica a causa raiz e aplica a correção sem causar regressões.
  5. **Modo Guiado vs. Modo Autônomo:** Missões iniciais oferecem apoio guiado; níveis seguintes exigem investigação autônoma sob múltiplos sinais.
  6. **Fechamento e Governança:** Toda ação gera eventos auditáveis (*Event Sourcing*), culminando em documentação técnica, análise do **Juiz 360º**, **Replay em linha do tempo** e atualização do **Currículo Vivo**.

---

## 2. Propósito e Diferencial Competitivo

Há um abismo entre assistir aulas teóricas sobre redes/sistemas e atuar em uma mesa de Service Desk ou incidente crítico com SLA correndo e múltiplas variáveis em jogo.

- **Analogia de Produto:** Um *"Career Simulator"* para carreiras de TI, focado em **Suporte Técnico, Operações, ITSM/ITIL, Data Center, Cibersegurança, SRE e Diagnóstico de Dados**.
- **Diferencial — Avaliação da Tríade Real de TI:**
  1. **Hard Skills:** Diagnóstico técnico correto da causa raiz e execução segura sem danos colaterais.
  2. **Comunicação e Investigação:** Clareza, identificação, confirmação do problema, solicitação educada de acesso e validação pós-correção.
  3. **Processos e Governança (ITIL/ITSM):** Classificação adequada, cumprimento de SLA, uso disciplinado de privilégio, escalonamento com evidência e vinculação de Problemas.

---

## 3. Arquitetura de Simulação para o Hackathon (Estado Determinístico no Navegador)

Executar máquinas virtuais completas por sessão exige alto custo computacional e latência de provisionamento, enquanto simulações puramente estáticas não ensinam investigação real de causa raiz.

Para o escopo do **Hack Brasil 2026**, a solução adotou uma **Arquitetura de Motor Determinístico em Subsistemas Isolados**:
- **Estado do Mundo como Fonte Única da Verdade:** O backend em `.NET 10` (`Simulador.Dominio`) modela explicitamente diretório, sessões/tokens, registros e cache DNS, serviços da estação, firewall, logs, cluster Kubernetes simulado em memória e dataset SQL imutável.
- **Equivalência Interface Gráfica ↔ Terminal:** Painéis administrativos do **SimuDesk** e comandos do **Terminal** operam sobre as mesmas camadas de estado via eventos determinísticos, sem propagação mágica entre camadas (ex.: incluir usuário em grupo no diretório exige novo logon da usuária para refletir em `whoami /groups`).
- **Custo de Infraestrutura Mínimo e Disponibilidade Integral:** Toda a simulação roda em container leve `.NET 10` + `React 19` + `PostgreSQL` (com fallback `InMemory`), respondendo em milissegundos e permitindo acesso sem barreira de login para avaliadores.

---

## 4. Os 4 Motores do Ecossistema

### 4.1. Workstation Corporativa Unificada
Desktop corporativo no navegador composto por quatro aplicativos integrados:
- **Intranet / Base de Conhecimento (KB):** Políticas de segurança (`KB-001`, `KB-012`), topologia da *Aurora Logística*, procedimentos de diagnóstico e catálogo de comandos declarados.
- **ITSM Próprio (Ticket Manager):** Fila com chamados reais e chamados de ruído, SLA em tempo real, classificação, matriz de Urgência x Impacto, notas públicas/internas, solicitação de aprovação formal, escalonamento para N2 e gestão de Problema ITIL.
- **Comunicador Corporativo:** Chat com usuários solicitantes e orientação em 3 atos com Tech Lead.
- **SimuDesk (Acesso Remoto e Consoles):** Acesso via ID/PIN liberado pelo motor, terminal com dois contextos explícitos (usuário vs. elevado) e painéis operacionais por cenário.

### 4.2. Motor de Clientes Sintéticos e Mentoria em 3 Atos
- O diálogo responde exclusivamente com base nos fatos estruturados fornecidos pelo motor para o estado corrente da sessão (evitando dessincronia em que o chat afirma que funcionou enquanto o problema persiste).
- **Gatilho Determinístico de Acesso Remoto:** A liberação de acesso depende de regras verificadas no servidor (identificação, confirmação do sintoma e solicitação explícita), sendo imune a manipulações textuais (*prompt injection*).
- **Dicas em 3 Atos (D3):** Consultar a KB é livre; pedir pista ao Tech Lead é registrado sem penalidade automática; escalonar é avaliado pela adequação e qualidade da evidência anexada.

### 4.3. Motor de Injeção de Falhas ("Chaos Injector")
Para impedir memorização mecânica de cliques, cenários como `pasta-rede-inacessivel` e `sre-cloud-latencia` sorteiam a causa raiz por semente (`SplitMix64`):
- Em **N2 (`pasta-rede-inacessivel`)**, um mesmo chamado de falha de acesso à pasta alterna entre grupo ausente no diretório, registro DNS incorreto e serviço `LanmanWorkstation` parado.
- Em **N4 (`sre-cloud-latencia`)**, uma degradação de disponibilidade alterna entre `OOM_KILLED`, `POOL_EXHAUSTED` e `CERT_EXPIRED`.
- A causa sorteada permanece oculta na API e no Replay até a conclusão do atendimento.

### 4.4. Motor de Avaliação Automática 360º ("Juiz 360º") e Replay
Ao encerrar o chamado, o Juiz avalia deterministicamente a trilha imutável de eventos (*Event Sourcing*):
- **Veredito em três desfechos claros:** *Resolvido em conformidade*, *Resolvido com ressalva* ou *Não resolvido ou agravado* — acompanhado de checklist binário observável (sem etapas subjetivas opacas).
- **Penalização explícita de regressões de segurança:** Concessão indevida de privilégios, desativação de firewall, gambiarras em arquivo `hosts` ou vazamento de engenharia social são capturados como ações prejudiciais no replay.
- **Replay e Currículo Vivo Auditável:** Linha do tempo cronológica de cada ação e consolidação de portfólio verificável offline via canonicalização **JCS (RFC 8785) + SHA-256** em `/verificar`.

---

## 5. Progressão de Carreira Implementada no Hackathon

| Nível / Cenário | Competências Principais | Destaques Técnicos |
| :--- | :--- | :--- |
| **1. Estagiário (`triagem-engenharia-social`)** | Atendimento, triagem no ITSM e defesa contra engenharia social | Recusa segura de pedido urgente sem validação de token conforme KB |
| **2. Analista Jr N1 (`pasta-rede-inacessivel`)** | Diagnóstico em camadas (AD, DNS, Serviços, SMB), uso de privilégio | *Chaos Injector* com 3 causas raiz por semente e fila anti-spoiler |
| **3. Analista Pleno N2 (`incidente-massivo`)** | Correlação de múltiplos incidentes em Problema ITIL e RCA | Leitura de logs, criação de Problema, restauração de serviço e resolução em lote |
| **4. SRE / Cloud (`sre-cloud-latencia`)** | Observabilidade cloud e mitigação segura sob pressão | 3 causas raiz (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`) e gramática `kubectl` |
| **4b. Auditoria SQL (`diagnostico-sql-readonly`)** | Investigação financeira em dados imutáveis sem risco de escrita | Parser *fail-closed* restrito a `SELECT` / `EXPLAIN SELECT` contra injeção SQL |

---

## 6. Síntese de Riscos Técnicos e Mitigações de Engenharia

| Risco Identificado | Estratégia de Mitigação Adotada |
| :--- | :--- |
| **Alucinação ou manipulação via chat (*prompt injection*)** | Motor determinístico detém autoridade absoluta sobre estado, acesso remoto e avaliação; tentativas de manipulação no chat são registradas e não liberam acesso nem aprovam chamados. |
| **Dessincronia entre conversa e estado técnico** | Cada resposta reflete estritamente a projeção atual do motor; o sistema nunca declara sucesso se o estado técnico ainda apresentar falha. |
| **Decoreba de cenários (*spoiler*)** | Sementes determinísticas (`SplitMix64`) variam a causa raiz mantendo fila inicial, KB e abertura idênticas até a investigação discriminante. |
| **Risco de marca e expectativa falsa de emulador completo** | Interface visual própria para a empresa fictícia *Aurora Logística*; terminal e SQL adotam catálogo declarado com respostas honestas (sem saídas inventadas) para comandos fora do escopo. |
| **Opacidade na avaliação** | Critérios binários auditáveis vinculados diretamente aos eventos registrados no *Event Sourcing*, permitindo contestação visual no Replay e checagem de integridade por SHA-256 (JCS). |
| **Exposição de segredos ou dependência frágil de API externa** | Modo determinístico ativo por padrão (`Dialogo:HabilitarLlm=false`) e verificação automática no build frontend (`check-bundle-secrets.mjs`) garantindo zero segredos no cliente. |

---

## 7. Registro Consolidado de Decisões Arquiteturais Base

| ID | Decisão Arquitetural | Justificativa Técnica |
| :--- | :--- | :--- |
| **Arquitetura Base** | Motor determinístico é a autoridade única sobre estado, acesso e sucesso; o diálogo não altera estado diretamente. | Elimina alucinações técnicas, dessincronia entre UI/chat e vulnerabilidade a *prompt injection*. |
| **Subsistemas** | Estado dividido em camadas independentes (sessão, diretório, DNS, rede, serviços, ITSM) alteradas pelos mesmos eventos via painel ou terminal. | Garante coerência entre interface gráfica e CLI sem criar emulador completo de SO. |
| **Avaliação (Juiz)** | Avaliação por critérios binários observáveis com Replay cronológico, sem nota subjetiva arbitrária. | Assegura transparência pedagógica, auditabilidade e explicabilidade do feedback. |
| **D1 — ITSM** | Módulo ITSM próprio e enxuto no MVP, alinhado a práticas reconhecíveis de Service Desk. | Facilita a instrumentação limpa da trilha imutável de eventos (*append-only*). |
| **D2 — Fidelidade** | Interface visual fictícia (*Aurora Logística*), sem copiar marcas proprietárias, com catálogo explícito de comandos suportados. | Evita problemas de propriedade intelectual e mantém previsibilidade honesta nos comandos. |
| **D3 — Mentoria** | Sistema de apoio em 3 atos avaliados separadamente (KB livre, pedido de pista registrado sem bloqueio de timer, escalonamento avaliado por evidência). | Mede autonomia real pela ordem de investigação sem penalizar pedidos legítimos de ajuda. |
| **D6 — Chaos N2** | Três causas raiz distintas e verificáveis por semente em `pasta-rede-inacessivel` (grupo ausente, DNS incorreto, serviço parado). | Torna o diagnóstico genuíno obrigatório e didaticamente contrastado. |
| **D7 — Stack** | Aplicação independente com `.NET 10` (backend), `React 19 + TypeScript + Vite` (frontend) e `PostgreSQL` (eventos *append-only* + fallback *InMemory*). | Separação modular clara, tipagem forte, alta performance e facilidade de execução local e em container. |
| **D9 — Manifesto v1.1** | Especificação formal do cenário `pasta-rede-inacessivel` reproduzindo uma configuração de referência documentada com testes anti-spoiler e de ações prejudiciais. | Estabelece contrato verificável entre domínio, cenários, testes automatizados e Replay. |

---

## 8. Deliberação Estratégica e Pedagógica — Sessão 1 (15/nov/2026): Cristiano Silva + Antigravity e Orchestrator (Argon)

Após revisão do posicionamento educacional, UX para iniciantes absolutos e sustentabilidade como aplicação real no Brasil, a bancada técnico-pedagógica (**Cristiano dos Santos da Silva + Antigravity e Orchestrator (Argon)**) estabeleceu as decisões `D10` a `D14`:

| ID | Decisão Estratégica / Pedagógica | Justificativa e Impacto |
| :--- | :--- | :--- |
| **D10 — Calibração Realista de Carreira (Técnico de Suporte)** | Posicionar o estudo de caso inaugural como **Formação Prática de Técnico de Suporte em TI** (**Estagiário → Técnico Jr N1 → Técnico Pleno N2 → 3 Vertentes de Técnico N3**), evitando prometer titulação de "Engenheiro" ou "Especialista Sênior" sem lastro, mas preservando arquitetura aberta para futuras carreiras da área de TI. | Aumenta a honestidade institucional (alinhamento ao **CDC**, **LDB Art. 42**, **Decreto nº 5.154/2004** e **CBO/MTE**) e conecta diretamente o aluno iniciante às vagas reais de entrada no mercado. |
| **D11 — Três Vertentes de Especialização no Nível 3 (N3)** | Agrupar competências operacionais que caminham juntas no mercado real em três vertentes modulares no Nível 3: **N3 Infra, Redes e Cloud** (`CBO 2124-10`), **N3 Data Center, Storage e Backup** (`CBO 3172-05`) e **N3 Ciber, Identidade e Auditoria de Dados** (`CBO 2123-05`). | Reflete fielmente a divisão de equipes de sustentação corporativa no Brasil, unindo Storage, RAID, iSCSI, Backup 3-2-1-1-0 e DRP em vertente própria de Data Center. |
| **D12 — Módulo Gamificado de Bancada Física (`CBO 3132-20`)** | Incorporar a **Bancada Física Interativa** logo no início da jornada para ensinar identificação de componentes, ferramentas ESD, manutenção preventiva física (limpeza, álcool isopropílico 99,8%, troca de pasta térmica), diagnóstico de POST e upgrade RAM/NVMe antes da preventiva lógica. | Cobre a lacuna física real de Field Service / Bancada que simuladores puramente em software ignoram, atendendo alunos sem experiência prévia. |
| **D13 — UX Educacional Clara e Ciclo Cognitivo de 4 Etapas** | Adotar **Tema Claro Educacional** inspirado no *AWS Skill Builder / Cloudscape* (com modo escuro opcional e terminal CLI escuro), estruturando a jornada em **6 ambientes** (`Painel`, `Aulas`, `Bancadas Físicas`, `Caderno estilo Notion/Cornell`, `Mentor IA` com Técnica de Feynman + Pitch STAR e `Laboratório Workstation` com gaveta lateral de notas). | Reduz fadiga visual e sobrecarga cognitiva para iniciantes, aplicando ciência da aprendizagem (*Recordação Ativa*, *Repetição Espaçada SM-2*, *Método Cornell*, *Pomodoro 25/5*, *Feynman* e *STAR*). |
| **D14 — Arquitetura Aditiva de Não-Regressão e Custo 80/20** | Envolver a Workstation e o motor `.NET 10` sem alterar contratos REST existentes nem quebrar os seletores/regras de `xUnit` (41 casos), `Vitest + axe-core` (22 casos) e `Playwright` (11 jornadas); operar heurísticas locais (80%) antes de chamadas LLM econômicas em cache (20%). | Preserva 100% de estabilidade para o Hack Brasil 2026 (custo zero no MVP). O modelo de negócio é tratado fora do repositório público. |

---

## 9. Adendo Arquitetural e Curricular — Rodada 19 (15/nov/2026): Profundidade de Curso Técnico (560h / 8 Meses), Zero E Comercial e Chamada em Vídeo com Agentes

Em segunda e terceira deliberações na mesma jornada (**Cristiano dos Santos da Silva + Antigravity e Orchestrator (Argon)**), identificou-se que uma grade de 200h–240h ainda concentrava conteúdo resumido frente à amplitude exigida de um profissional técnico completo, além da necessidade de dar laboratório prático dedicado a todas as 8 UCs, estruturar certificação/parcerias e validar custos e modelos comerciais sem especulação. Consolidaram-se então as decisões estruturais `D15` a `D20`:

| ID | Decisão das Rodadas 19 e 20 | Especificação Técnica e Impacto no Produto |
| :--- | :--- | :--- |
| **D15 — Proibição Definitiva do Caractere E Comercial** | Nenhuma função descrita, página, aba, título de tela, competência do currículo ou arquivo de documentação do repositório pode conter o símbolo E comercial — devendo empregar sempre a conjunção **"e"** (ou vírgula). | Padroniza clareza editorial em português profissional na documentação e define tabela exata em [ARQUITETURA_HACKATHON.md](../ARQUITETURA_HACKATHON.md) para atualizar os rótulos da UI e seus testes em sincronia durante a próxima etapa de código. |
| **D16 — Expansão da Matriz Curricular para Profundidade Técnica Real (560h em até 8 Meses · 2 Ciclos · 80 Laboratórios)** | Elevar a matriz para **560 horas em até 32 semanas (8 Unidades Curriculares `UC1` a `UC8`, com 80 cenários práticos `LAB-UC1-01` a `LAB-UC8-10`)** e densidade técnica comparável à de um Curso Técnico profissionalizante (operado sob formato ágil de Qualificação FIC LDB Art. 42):<br>1. **Ciclo 1 (Meses 1 a 4 · 280h):** *Prontidão Rápida Júnior e Field Service* (Eletricidade/ESD/Bancada Desktop e Notebook/UPS, Windows 10/11 e Linux Profundos, Redes TCP/IP + **Bancada de Cabeamento T568A/B, Rack PoE e Estúdio Wi-Fi Design**, AD N1, Microsoft 365, Impressoras/Scanners SMB, Certificados ICP-Brasil A1/A3, ITIL 4, LGPD e Defesa contra Engenharia Social + Capstone Jr).<br>2. **Ciclo 2 (Meses 5 a 8 · +280h = 560h):** *Técnico Pleno N2 e 3 Vertentes N3* (Windows/Linux Server, NTFS/Share, GPO LSDOU, Lockout `4740`, PowerShell/Bash, RCA; + `UC6` N3-A Multi-Vendor Switches/Firewall/IPsec/Zabbix/K8s; `UC7` N3-B Data Center/PDU/RAID/iSCSI/Datastores/Cloud Backup WORM 3-2-1-1-0/VSS/DRP; `UC8` N3-C IAM/Conditional Access/SPF-DKIM-DMARC/BEC/Antivírus-EDR/SQL Read-Only e Anti-Injection). | Resolve duas necessidades reais simultâneas: coloca o iniciante pronto para vaga Júnior em até **4 meses** sem sacrificar profundidade, e entrega base técnica robusta equivalente à de um técnico completo ao atingir **8 meses**. |
| **D17 — Evolução Avançada (Onda 4): Simulador de Chamada em Vídeo e Voz ao Vivo com Agentes de IA (`VideoCallSimulator`)** | Projetar o módulo futuro de **Chamada em Vídeo e Voz ao Vivo** embutido no Mesa de Trabalho (interface inspirada em reuniões corporativas com WebRTC + Multimodal Live API + Avatar Expressivo 2.5D/3D + Compartilhamento de Tela Simulado), cobrindo 4 personas situacionais: **Usuário Leigo Ansioso**, **Gestor de Crise P1 sob Pressão**, **Engenharia Social Ao Vivo (*Vishing* em Vídeo)** e **Banca de Entrevista Técnica/RH baseada no Currículo Vivo**. | **Invariante mantido:** O Agente em vídeo consome *Snapshot Read-Only* do `.NET 10` e nunca altera o estado técnico nem julga a solução técnica sozinho; o motor determinístico continua soberano, recebendo da chamada a transcrição auditável para pontuação comunicacional e fallback transparente para Voz ou Chat em conexões móveis. |
| **D18 — Arquitetura de 1 Laboratório Interativo Dedicado por UC (`UC1` a `UC8`), Multi-Vendor e Segurança NGFW/EDR/WORM** | Estabelecer que nenhuma Unidade Curricular ficará sem laboratório dedicado: `HardwareWorkbenchLab` (UC1), `OsSystemAdminLab` (UC2), `NetworkCablingWifiDesignLab` com Bancada RJ-45/Rack `U`/PoE + **Estúdio Visual de Design Wi-Fi inspirado no *Ubiquiti UniFi Design Center*** (UC3), `CorporateWorkspaceLab` (UC4), `ServerSustainmentLab` (UC5), `MultiVendorNetworkFirewallLab` com **Cisco IOS XE, MikroTik RouterOS/WinBox, Ubiquiti UniFi e Simulador de Firewall NGFW/UTM estilo Fortinet (GeoIP, Content Filter, Gateway Antivirus, IPS, IPsec) + Zabbix/K8s** (UC6), `DataCenterStorageCloudBackupLab` com **Rack `42U`, RAID, SAN iSCSI e Backup Local e em Nuvem WORM `3-2-1-1-0`** (UC7), e `CyberBlueTeamSqlLab` com **Console Central de Antivírus/EDR Corporativo** e SQL *Fail-Closed* (UC8). | Transforma toda a grade técnica de 560h em vivência prática fiel ao mercado corporativo brasileiro sem custo de máquinas virtuais individuais por aluno, mantendo validação determinística no `.NET 10`. |
| **D19 — Centro de Simulados de Certificações Oficiais, Parcerias *Vendor Academies* e Blindagem Jurídica** | Mapear `UC1–UC8` para certificações consolidadas (**CompTIA Tech+/A+/Network+/Server+/Security+**, **Cisco CCST/CCNA**, **MikroTik MTCNA/MTCRE**, **Fortinet FCF/FCA/FCP**, **Ubiquiti UWA/UBRSS**, **Microsoft MS-900/MD-102/AZ-800/SC-900/SC-200**, **LPI**, **Zabbix**, **Veeam VMCE**, **ITIL 4**), planejar banco autoral de simulados práticos (PBQs) e convênios futuros (**NetAcad, Fortinet Academic, MikroTik Academy, MSLE, AWS Academy**) para vouchers e acesso futuro a sistemas oficiais/kits educacionais. | **Validação Jurídica:** Amparado pela **LDB Art. 42**, **Decreto nº 5.154/2004**, **LPI Art. 132** (uso nominativo lícito de marcas com aviso de independência), **Lei nº 9.609/1998** (código simulador 100% autoral sem pirataria de firmware), **Lei nº 9.610/1998** (proibição total de *brain dumps*) e **CDC Art. 30–31** (clareza entre FIC e exame externo). |
| **D20 — Modelo de Negócio e Créditos Oficiais do Hack Brasil 2026** | No Hackathon o custo é **R\$ 0,00**, com elegibilidade aos benefícios oficiais do `hackbrasil.com`. | Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele. |

> **Documento detalhado:** A grade semana a semana completa de 560 horas (`UC1` a `UC8`, `LAB-UC1-01` a `LAB-UC8-10`), a especificação dos **8 Laboratórios Interativos Dedicados**, a arquitetura da **Onda 4 em Vídeo**, a **Trilha de Certificações e Parecer Jurídico**, os **Créditos Oficiais do Hack Brasil 2026** e a **Modelagem Financeira Real** encontram-se em [PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md](../PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md).

---

## 10. Adendo de Auditoria Independente — Rodada 21 (15/nov/2026): Revisão Multi-IA (`GitHub Copilot CLI`, `Codex CLI` e `Kiro CLI`) e Plano P0–P2

Após a consolidação da matriz de 560h, o projeto foi submetido a uma **banca multidisciplinar independente** composta por **GitHub Copilot CLI**, **Codex CLI** e **Kiro CLI** em ambiente com leitura irrestrita do código-fonte, DevLedger, CLIs de produção (GitHub, Vercel, Render, Neon e Cloudflare), bases de conhecimento de suporte e regulamento oficial do Hack Brasil 2026 (arquivos completos em [01_CONSOLIDADO_COMPARATIVO_3_IAS.md](../auditoria-independente/consolidado/01_CONSOLIDADO_COMPARATIVO_3_IAS.md) e [02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv](../auditoria-independente/consolidado/02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv)).

As três IAs apontaram consensos críticos (`3/3`) que passam a reger as decisões **`D21` a `D27`** antes de qualquer implementação de novas telas em `src/`:

| ID | Decisão Consolidada da Rodada 21 | Achado da Banca Multi-IA e Diretriz Obrigatória |
| :--- | :--- | :--- |
| **D21 — Correção JCS RFC 8785, Assinatura `Ed25519` no Currículo Vivo e Remoção Atômica de E Comercial/Acentos** | **Bloqueador P0 provado por Kiro e apontado por Copilot/Codex:** `Juiz360.cs` usa `Utf8JsonWriter` padrão que escapa E comercial (`\u0026`) e acentos (`\u00E3`), divergindo de `jcs.ts` no navegador, e o SHA-256 sozinho não impede forja de JSON por terceiros. | Escrever serializador JCS estrito em C# + ampliar vetores UTF-8/símbolos em `docs/vetores-jcs-sha256.json`; assinar o núcleo do **Currículo Vivo** no backend com **Ed25519** (`kid`, `emitidoEm`, algoritmo e chave pública em `/verificar`); remover E comercial e restaurar acentuação portuguesa em `src/` atomicamente. |
| **D22 — Exposição Pública sem Login, Proxy Rate Limit e Higiene do Hackathon** | `itflight.nascia.ia.br` exibe barreira Cloudflare Access (violando item 7.2 do regulamento), enquanto `it-flight-simulator-hackbrasil.vercel.app` responde `200` público. Além disso, faltam `UseForwardedHeaders` para `120 req/min` na Render, proteção em `CausaForcada`/`Semente`, limite de payload JSONB, `LICENSE` e CI no GitHub. | Submeter link `.vercel.app` (ou liberar Cloudflare Access); configurar `ForwardedHeadersOptions`, flag para parâmetros de teste, `MaxRequestBodySize`, arquivo `LICENSE`, CI GitHub Actions com Postgres, remoção de dados pessoais da equipe em docs e nenhuma reescrita adicional de histórico Git (atualizando também `DevLedger` e composição no `hackbrasil.com`). |
| **D23 — Posicionamento Anti-Vaporware, Missão 0 Guiada e Revisão Replay** | Todas as 3 IAs alertaram que prometer 560h / 80 laboratórios / vídeo IA no presente quando `src/` possui 5 cenários determinísticos e tema escuro gera risco perante a banca. | Adotar matriz explícita **"Implementado Hoje (MVP) vs. Em Construção vs. Roadmap"**; adicionar **Missão 0 (4 passos para o leigo)**, glossário contextual, opções avançadas recolhidas (`Chaos Injector`/`semente`), *debrief* didático no Replay ("**Revisão do Atendimento**") e **analista com 5 a 10 iniciantes reais** antes do vídeo final de 3 minutos. |
| **D24 — Revisão da Matriz Curricular: Base Júnior N1 Separada de N2/N3 e Lacunas Reais de Service Desk** | A matriz de 560h mistura fundamentos de entrada com Kubernetes, RAID, iSCSI, WORM, EDR e NGFW sem *gates* e omite rotinas de maior volume das KBs brasileiras. | Separar núcleo essencial **Júnior (N1)** dos módulos **N2/N3** com pré-requisitos e **tempo ativo medido por evento**; incorporar lacunas reais (**Impressão/Scanner em rede, M365 operacional, Mobile Android/iOS e MDM, VoIP/Softphone, Linux Desktop básico, Redação de Chamados, Cliente Difícil, Inglês Técnico e LGPD no balcão**), usar **Leitner/FSRS** e construir **PBQs** como mini-cenários do motor. |
| **D25 — Endurecimento Pos-Hackathon (Persistência, Regiões Cloud e Cabeçalhos)** | Faltam rotina de expurgo para `ix_sessoes_expira`, migrations versionadas fora do startup multi-réplica, posse/autenticação de sessão, TTL em `InMemoryEventStore`, região alinhada (Render Oregon vs. Neon Ohio) e `CSP`/`X-Content-Type-Options` em `vercel.json`. | Executar o endurecimento estrutural e de segurança (`CON-11`) antes da abertura de cadastro multi-tenant e das telas persistentes nas Ondas 1 a 3. |
| **D26 — Revisão Financeira e Contábil** | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) |
| **D27 — Blindagem Jurídica: Curso Livre, Marcas/Trade Dress (`LPI Art. 195`) e ECA Digital (`Lei 15.211/2025`)** | Risco em promessas como `"Júnior em 4 meses"`, `"FIC Decreto 5.154"`, `"Microcertificado de Empregabilidade"`, fundamentação frágil em `LPI Art. 132 I/II`, imitação de consoles comerciais e ausência de regras para menores sob **ECA Digital** (vigente desde março/2026) e `LGPD Art. 14`. | Emitir **"Certificado de Conclusão de Curso Livre"** com carga horária medida; usar interfaces genéricas sem logotipos nem *trade dress* de fabricantes até assinatura formal de *Vendor Academy*; limitar público comercial a **18+ ou fluxo parental auditável**; aplicar pseudônimo e opt-in no Currículo Vivo; manter **Termos, Política de Privacidade e Anti-Dump** publicados antes de qualquer cobrança. |
