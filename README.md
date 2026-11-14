# IT Flight Simulator — Simulador Prático de Carreira em TI (Hack Brasil 2026)

Plataforma interativa de simulação prática de carreira em TI desenvolvida pelo time **CVE-K** para o **Hack Brasil 2026** (Trilha: **Acesso à educação**).

Em vez de aulas passivas ou quizzes genéricos de múltipla escolha, o participante atua em uma **Workstation Corporativa Unificada** dentro do navegador na empresa fictícia **Aurora Logística** (`aurora.local`), evoluindo por níveis reais de atuação em TI e operando:

- **ITSM Próprio:** fila de chamados, SLA em tempo real, classificação, notas públicas/internas, solicitações de aprovação, escalonamento e vinculação de Problemas ITIL.
- **Comunicador Corporativo:** atendimento a usuários simulados e orientação em 3 atos via Tech Lead (consulta livre à Base de Conhecimento, pedido de pista sem punição automática e escalonamento com evidência).
- **SimuDesk (Acesso Remoto):** terminal interativo com separação de contexto (sessão do usuário vs. privilégio elevado) e painéis administrativos (Diretório, Serviços, DNS, Logs, Cluster Kubernetes simulado e Console SQL somente leitura), todos governados por um **motor determinístico puro**.
- **Chaos Injector:** causas raiz sorteadas por semente e eventos de engenharia social para exigir investigação real em vez de receitas decoradas.
- **Juiz 360º, Replay & Currículo Vivo:** avaliação auditável por critérios binários observáveis na trilha de eventos (*Event Sourcing*), linha do tempo navegável e exportação de portfólio verificável offline via **JCS (RFC 8785) + SHA-256**.

---

## Cenários e Progressão de Carreira

| Nível / Cargo | ID do Cenário | Foco Pedagógico & Técnico |
| :--- | :--- | :--- |
| **Nível 1 · Estagiário** | `triagem-engenharia-social` | Triagem inicial, consulta à política interna (`KB-001`) e defesa contra tentativa de engenharia social (pedido urgente sem token). |
| **Nível 2 · Analista Jr (N1)** | `pasta-rede-inacessivel` | *Chaos Injector* com 3 causas raiz por semente (**C1** grupo ausente no diretório, **C2** DNS incorreto + escalonamento N2 + `flushdns` elevado, **C3** serviço `LanmanWorkstation` parado), diferenciando sinais no terminal e nos painéis. |
| **Nível 3 · Analista Pleno (N2)** | `incidente-massivo` | Correlação de 3 incidentes simultâneos em um Problema ITIL, análise de logs, restauração do serviço `AuroraGateway`, documentação de RCA e encerramento em lote. |
| **Nível 4 · SRE / Cloud** | `sre-cloud-latencia` | Investigação em cluster Kubernetes simulado em memória com 3 causas raiz por semente (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`), comandos `kubectl` declarados, `pg_stat_activity`, `curl -I` e mitigação com privilégio elevado. |
| **Nível 4b · SQL Read-Only** | `diagnostico-sql-readonly` | Auditoria de divergência de faturamento em dataset sintético imutável (`pedidos` e `pagamentos`) via parser *fail-closed* restrito a `SELECT` / `EXPLAIN SELECT` (bloqueando escrita e injeção SQL). |

---

## Arquitetura e Stack Tecnológica

- **Backend (`.NET 10`, C#):** Monólito modular separado em:
  - `Simulador.Dominio` — Motor puro (`Aplicar`) e subsistemas isolados com Event Sourcing.
  - `Simulador.Cenarios` — Catálogo de cenários, sementes (`SplitMix64`) e estado inicial determinístico.
  - `Simulador.Itsm` — Gestão enxuta de chamados, SLA, notas, escalonamento e Problemas ITIL.
  - `Simulador.Avaliacao` — Juiz 360º determinístico, projeção de Replay e geração de hash JCS (RFC 8785) + SHA-256.
  - `Simulador.Dialogo` — Interface `IClienteDialogo` com modo roteirizado determinístico por padrão (`Dialogo:HabilitarLlm=false`).
  - `Simulador.Infra` — Persistência em PostgreSQL (`JSONB` *append-only* com TTL configurável) e provedor `InMemory` para execução leve e testes.
  - `Simulador.Api` — API REST, health checks (`/health/live`, `/health/ready`) e rate limiting.
- **Frontend (`React 19` + `TypeScript` + `Vite`):** Workstation Corporativa, 4 aplicativos integrados (`ItsmApp`, `ChatApp`, `SimuDeskApp`, `IntranetApp`), visualizador de Replay/Avaliação e Verificador Offline de Currículo Vivo em `/verificar`.
- **Banco de Dados:** `PostgreSQL 17` (via Docker Compose ou serviço gerenciado) ou modo em memória para desenvolvimento e demonstração rápida.

---

## Como Executar Localmente

### Opção 1: Execução Direta (Backend + Frontend)

#### Backend (.NET 10)
```bash
cd src/backend
dotnet test Simulador.slnx
dotnet run --project src/Simulador.Api --urls http://localhost:8080
```
- **Health checks:** `GET /health/live` e `GET /health/ready`
- **TTL de Sessão:** `Sessao:TtlDias` (padrão `30` dias)
- **Rate Limit:** 120 req/min por IP (`429 Too Many Requests`, isentando `/health/*`)
- **Integridade do Currículo Vivo:** `POST /api/carreira/resumo` calcula `SHA-256` sobre JSON canônico **JCS (RFC 8785)** (`{cargoAtual, xpTotal, competencias[], sessoesConfirmadas[]}` sem `apelido` e sem `hash`), verificável offline na rota `/verificar` com os vetores em `docs/vetores-jcs-sha256.json`.

#### Frontend (React 19 + TypeScript + Vite)
```bash
cd src/frontend
npm.cmd install
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run dev
```

### Opção 2: Docker Compose (PostgreSQL 17 + Backend + Frontend)
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

---

## Suítes de Testes

- **Backend (`xUnit`):** `dotnet test src/backend/Simulador.slnx` cobre o motor determinístico, os 5 cenários, ações prejudiciais, gramática SQL fail-closed, contratos da API REST e consistência dos vetores JCS/SHA-256.
- **Frontend (`Oxlint` + `Vitest` + `axe-core` + `check-bundle-secrets`):** valida componentes dos aplicativos, verificação JCS offline, acessibilidade automatizada (`axe-core`) e ausência de chaves no bundle compilado.
- **E2E (`Playwright`):** `src/frontend/e2e/jornadas.spec.ts` cobre 11 jornadas de ponta a ponta (fluxos felizes N1–N4b, prompt injection bloqueado, verificação de JSON adulterado/incompleto, bloqueio de `DROP`/`UNION` em SQL e navegação por teclado/responsividade).

---

## Documentação

- [Contexto e Compliance — Hack Brasil 2026](docs/CONTEXTO_HACK_BRASIL_2026.md)
- [PRD — Product Requirements Document](docs/PRD_HACKATHON.md)
- [Arquitetura Técnica](docs/ARQUITETURA_HACKATHON.md)
- [Cronograma de Execução](docs/CRONOGRAMA_HACKATHON.md)
- [Guia de Deploy e Roteiro de Vídeo](docs/DEPLOY_E_VIDEO.md)
- [Concepção e RFC Consolidado](docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md)
- [Manifesto N2: Pasta de Rede Inacessível (`v1.1`)](docs/rfc/MANIFESTO_PASTA_REDE_INACESSIVEL_v1.1.md)
- [Manifesto N4: Diagnóstico SRE/Cloud](docs/rfc/MANIFESTO_N4_SRE.md)
- [Manifesto N4b: Diagnóstico SQL Read-Only](docs/rfc/MANIFESTO_N4B_SQL.md)

---

## Conformidade

- Repositório criado especificamente para o **Hack Brasil 2026**, sem aproveitamento de código privado anterior.
- Dados **100% sintéticos** e empresa fictícia (**Aurora Logística**), com sessões anônimas e sem coleta de dados pessoais reais.
- Custo de IA externo **zero por padrão** (`Dialogo:HabilitarLlm=false`), garantindo disponibilidade integral para a banca avaliadora.
