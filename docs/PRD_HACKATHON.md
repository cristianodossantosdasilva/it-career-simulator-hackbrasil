# PRD — IT Flight Simulator (Edição Hack Brasil 2026)

**Produto:** IT Flight Simulator — Simulador Prático de Carreira em TI  
**Time:** CVE-K (Cristiano Silva, Enzo Santos, Kauan Dantas · Victória Silva — *formação original; participação encerrada em 14/11/2026 por inviabilidade logística para a etapa presencial*)  
**Trilha:** Acesso à educação (Hack Brasil 2026)  
**Prazo de entrega:** 30/nov/2026 às 23h59 (BRT)  

---

## 1. Visão do Produto e Problema

Milhares de estudantes e profissionais em transição estudam teoria de TI, mas esbarram no **"paradoxo do júnior"**: não conseguem a primeira vaga porque não têm experiência prática em ambiente corporativo real (ITSM, SLA, atendimento sob pressão, diagnóstico de causa raiz, postura de segurança).

O **IT Flight Simulator** resolve essa lacuna transformando o navegador em uma **Workstation Corporativa Simulada** (um "simulador de voo" para carreiras de TI). Em vez de assistir aulas passivas ou responder quizzes, o participante assume cargos progressivos, atende chamados em fila com SLA, conversa com usuários e líderes técnicos simulados, acessa estações e ambientes remotamente, diagnostica falhas injetadas dinamicamente e recebe uma **avaliação auditável 360º com Replay em linha do tempo** e um **Currículo Vivo** verificável offline.

---

## 2. Objetivos da Versão Hackathon

1. **Experiência completa ponta a ponta sem login obrigatório:** qualquer avaliador acessa a demonstração com 1 clique (sessão anônima com semente configurável), escolhe iniciar a trilha ou testar diretamente um nível específico.
2. **Os 4 Motores funcionando de ponta a ponta:**
   - **Workstation Unificada:** Desktop corporativo no navegador com 4 apps integrados (**ITSM**, **Comunicador/Chat**, **SimuDesk Acesso Remoto**, **Intranet/KB**).
   - **Clientes Sintéticos & Tech Lead (Máquina de Estados + Sistema em 3 Atos):** Personas distintas com gatilho determinístico de liberação de acesso remoto e diálogo roteirizado sem dependência de chave externa.
   - **Chaos Injector (Injeção de Falhas):** Cenários parametrizados por semente para impedir "receita decorada".
   - **Juiz 360º, Replay & Currículo Vivo:** Avaliação determinística por critérios binários observáveis na trilha de eventos + linha do tempo navegável + **Currículo Vivo** verificável por **JCS (RFC 8785) + SHA-256**.
3. **Progressão de Carreira Jogável:** Jornada em **5 níveis/cenários** demonstrando a evolução do profissional (**Estagiário → Analista Jr N1 → Analista Pleno N2 → SRE/Cloud N4 → SQL Audit N4b**), com XP, promoção, Modo Guiado vs. Autônomo e eventos de caos corporativo.

---

## 3. Escopo Funcional — Os 5 Níveis da Jornada

### Nível 1: Estagiário (`triagem-engenharia-social`) — *Triagem, Atendimento e Segurança*
- **Foco:** Acolhimento do usuário, classificação no ITSM, consulta à Base de Conhecimento (`KB-001`) e política de verificação de identidade.
- **Mecânica:** Modo guiado com checklist de boas práticas.
- **Evento Surpresa (Caos Corporativo):** Um "suposto Diretor/VIP" entra no chat pedindo reset de senha urgente sem passar pelo protocolo de verificação.
  - Validar pela política da KB e recusar/escalar corretamente resulta em aprovação de segurança.
  - Ceder à pressão e resetar sem validar gera incidente de segurança registrado pelo Juiz.

### Nível 2: Analista Jr N1 (`pasta-rede-inacessivel`) — *Diagnóstico Técnico com Chaos Injector*
- **Foco:** Investigação em ambiente remoto (`SimuDesk`), correlação de chamados e uso disciplinado de privilégio (sessão da usuária vs. prompt elevado).
- **Fila ITSM:** Chamado principal da usuária Maria + chamados correlatos/ruído na fila com SLA ativo.
- **Chaos Injector (3 causas raiz sorteadas por semente):**
  - **C1:** Usuária fora do grupo de acesso no diretório fictício (exige aprovação do gestor antes da inclusão e novo logon).
  - **C2:** Registro DNS apontando para IP incorreto (exige escalonamento com evidência para N2 + `ipconfig /flushdns` elevado após correção).
  - **C3:** Serviço `LanmanWorkstation` parado na estação (exige diagnóstico, elevação, reinício do serviço correto e registro do programa suspeito).
- **Transferência de aprendizado:** Permite executar novas sementes para comprovar investigação genuína em vez de sequência memorizada.

### Nível 3: Analista Pleno N2 (`incidente-massivo`) — *Incidente Massivo e Análise de Causa Raiz (RCA)*
- **Foco:** Correlação de múltiplos incidentes em um Problema ITIL, leitura de logs da estação e contenção sem ações destrutivas.
- **Cenário:** Atualização recente derruba conectividade/serviço em múltiplos usuários da empresa fictícia *Aurora Logística*. O participante identifica o padrão nos logs, cria o Problema ITIL vinculando os incidentes, restaura `AuroraGateway`, documenta a causa raiz e encerra os chamados.

### Nível 4: SRE / Cloud (`sre-cloud-latencia`) — *Diagnóstico Cloud e Kubernetes Simulado*
- **Foco:** Investigação de degradação de disponibilidade em ambiente cloud simulado em memória, com **3 causas raiz sorteadas por semente** (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`).
- **Mecânica:** Comandos declarados (`kubectl get pods`, `kubectl logs`, `kubectl describe ingress`, `pg_stat_activity`, `curl -I`, `kubectl set resources`, `kubectl rollout restart`), mitigação com privilégio elevado e painéis de cluster/pool/ingress, recusando comandos destrutivos.

### Nível 4b: SQL Read-Only (`diagnostico-sql-readonly`) — *Auditoria SQL Fail-Closed*
- **Foco:** Investigação de divergência de fechamento entre `pedidos` e `pagamentos` sobre dataset sintético imutável mantido em memória.
- **Mecânica:** Parser *fail-closed* restrito a `SELECT` e `EXPLAIN SELECT` sobre allowlist explícita, bloqueando DDL/DML e tentativas de injeção SQL.

---

## 4. Requisitos dos 4 Apps da Workstation Unificada

1. **ITSM (Ticket Manager):**
   - Fila com status, SLA em tempo real, categoria, prioridade (Urgência × Impacto), linha do tempo de notas (públicas e internas), criação/vinculação de Problema, solicitação de aprovação, escalonamento (N2) e resolução do chamado.
2. **Comunicador Corporativo (Chat):**
   - Aba com o **Cliente Simulado** (personalidades distintas por cenário; só libera o ID/PIN do acesso remoto após triagem e identificação).
   - Aba com o **Tech Lead** (botão explícito de "Pedir Pista", registrado sem penalidade automática; oferece orientação contextual).
3. **SimuDesk (Acesso Remoto à Estação / Console Fictício):**
   - Conexão via ID/PIN recebido no chat.
   - **Terminal interativo** com dois contextos explícitos (usuário vs. elevado) e comandos declarados por cenário (respostas honestas para comandos não suportados).
   - **Painéis Operacionais (visual próprio, sem copiar marcas proprietárias):** Usuários & Grupos, Serviços, DNS, Logs, Cluster Kubernetes/PgBouncer/Ingress (N4) e Console SQL Read-Only (N4b).
4. **Intranet / KB, Replay & Currículo Vivo:**
   - Base de Conhecimento pesquisável com procedimentos padrão, topologia da *Aurora Logística* e política de segurança.
   - **Tela de Avaliação 360º + Replay:** Linha do tempo passo a passo de todas as ações e eventos, checklist de critérios observáveis e exportação do **Currículo Vivo** verificável offline em `/verificar` via **JCS (RFC 8785) + SHA-256**.

---

## 5. Requisitos Não-Funcionais e Conformidade (Hack Brasil 2026)

- **Código autoral para o Hackathon:** Todo o código (backend, motor, ITSM, cenários, frontend) foi escrito especificamente neste repositório público para o Hack Brasil 2026.
- **100% Dados Sintéticos:** Nenhuma coleta de dados pessoais reais; empresa fictícia (*Aurora Logística*), usuários sintéticos e sessões anônimas com TTL automático.
- **Acessibilidade:** Navegação por teclado, foco visível, semântica ARIA e contraste validado por testes automatizados (`axe-core`).
- **Disponibilidade e Custo Zero:** Execução determinística habilitada por padrão (`Dialogo:HabilitarLlm=false`), garantindo zero custo externo de API e 100% de disponibilidade para avaliação.
