# Documento de Concepção Técnica e RFC: Plataforma de Simulação Prática de Carreira em TI ("IT Flight Simulator")

> **Escopo:** Documento de concepção pedagógica, arquitetura técnica e registro consolidado das decisões estruturais que fundamentam o **IT Flight Simulator** (Edição Hack Brasil 2026).

---

## 1. Visão do Projeto e Conceito Central

O projeto nasceu para transformar a formação prática em Tecnologia da Informação — partindo do **Suporte Técnico (Help Desk / Service Desk)** até operações de **Infraestrutura, SRE e Auditoria de Dados** — em uma vivência imersiva e verificável.

### Conceito Central
- **Simulação de Ambiente Operacional Real:** O participante não apenas lê conteúdo teórico; ele atua em uma operação de TI simulada na empresa fictícia **Aurora Logística** (`aurora.local`), evoluindo de **Estagiário (N1)** a **Analista Jr**, **Analista Pleno (N2)**, **SRE / Cloud (N4)** e **Auditoria SQL (N4b)**.
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

- **Analogia de Produto:** Um *"Flight Simulator"* para carreiras de TI, focado em **Suporte Técnico, Operações, ITSM/ITIL, SRE e Diagnóstico de Dados**.
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
- **Custo de Infraestrutura Mínimo & Disponibilidade Integral:** Toda a simulação roda em container leve `.NET 10` + `React 19` + `PostgreSQL` (com fallback `InMemory`), respondendo em milissegundos e permitindo acesso sem barreira de login para avaliadores.

---

## 4. Os 4 Motores do Ecossistema

### 4.1. Workstation Corporativa Unificada
Desktop corporativo no navegador composto por quatro aplicativos integrados:
- **Intranet / Base de Conhecimento (KB):** Políticas de segurança (`KB-001`, `KB-012`), topologia da *Aurora Logística*, procedimentos de diagnóstico e catálogo de comandos declarados.
- **ITSM Próprio (Ticket Manager):** Fila com chamados reais e chamados de ruído, SLA em tempo real, classificação, matriz de Urgência × Impacto, notas públicas/internas, solicitação de aprovação formal, escalonamento para N2 e gestão de Problema ITIL.
- **Comunicador Corporativo:** Chat com usuários solicitantes e orientação em 3 atos com Tech Lead.
- **SimuDesk (Acesso Remoto & Consoles):** Acesso via ID/PIN liberado pelo motor, terminal com dois contextos explícitos (usuário vs. elevado) e painéis operacionais por cenário.

### 4.2. Motor de Clientes Sintéticos e Mentoria em 3 Atos
- O diálogo responde exclusivamente com base nos fatos estruturados fornecidos pelo motor para o estado corrente da sessão (evitando dessincronia em que o chat afirma que funcionou enquanto o problema persiste).
- **Gatilho Determinístico de Acesso Remoto:** A liberação de acesso depende de regras verificadas no servidor (identificação, confirmação do sintoma e solicitação explícita), sendo imune a manipulações textuais (*prompt injection*).
- **Dicas em 3 Atos (D3):** Consultar a KB é livre; pedir pista ao Tech Lead é registrado sem penalidade automática; escalonar é avaliado pela adequação e qualidade da evidência anexada.

### 4.3. Motor de Injeção de Falhas ("Chaos Injector")
Para impedir memorização mecânica de cliques, cenários como `pasta-rede-inacessivel` e `sre-cloud-latencia` sorteiam a causa raiz por semente (`SplitMix64`):
- Em **N2 (`pasta-rede-inacessivel`)**, um mesmo chamado de falha de acesso à pasta alterna entre grupo ausente no diretório, registro DNS incorreto e serviço `LanmanWorkstation` parado.
- Em **N4 (`sre-cloud-latencia`)**, uma degradação de disponibilidade alterna entre `OOM_KILLED`, `POOL_EXHAUSTED` e `CERT_EXPIRED`.
- A causa sorteada permanece oculta na API e no Replay até a conclusão do atendimento.

### 4.4. Motor de Avaliação Automática 360º ("Juiz 360º") & Replay
Ao encerrar o chamado, o Juiz avalia determinísticamente a trilha imutável de eventos (*Event Sourcing*):
- **Veredito em três desfechos claros:** *Resolvido em conformidade*, *Resolvido com ressalva* ou *Não resolvido ou agravado* — acompanhado de checklist binário observável (sem escalas subjetivas opacas).
- **Penalização explícita de regressões de segurança:** Concessão indevida de privilégios, desativação de firewall, gambiarras em arquivo `hosts` ou vazamento de engenharia social são capturados como ações prejudiciais no replay.
- **Replay & Currículo Vivo Auditável:** Linha do tempo cronológica de cada ação e consolidação de portfólio verificável offline via canonicalização **JCS (RFC 8785) + SHA-256** em `/verificar`.

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

## 7. Registro Consolidado de Decisões Arquiteturais

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
