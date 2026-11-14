# Arquitetura Técnica — IT Flight Simulator (Edição Hack Brasil 2026)

## 1. Visão Geral e Princípio Central

A aplicação adota uma arquitetura de **Simulação Web Determinística + Diálogo Desacoplado**:
- **O Motor Determinístico é a única autoridade** sobre o estado da estação simulada, privilégios, acesso remoto, SLA e avaliação.
- **O Diálogo (`Simulador.Dialogo`) não lê nem altera o estado diretamente**, não inventa saídas de terminal e não atribui notas arbitrárias: ele apenas conduz a interação a partir dos fatos liberados pelo motor.
- **Estado reconstruível por eventos (*Event Sourcing* leve):** toda ação do usuário gera eventos imutáveis (*append-only*), permitindo **Replay exato** na interface e auditoria determinística pelo Juiz 360º.

---

## 2. Stack Tecnológica

- **Backend:** ASP.NET Core (`.NET 10`), monólito modular em C#.
- **Frontend:** `React 19` + `TypeScript` + `Vite` (Workstation Corporativa em janela única com apps integrados e verificador offline).
- **Banco de Dados:** `PostgreSQL 17` (persistência de sessões anônimas e trilha de eventos em `JSONB` com TTL configurável) — com abstração `IEventStore` e provedor `InMemoryEventStore` para execução leve e testes sem banco externo.
- **Diálogo (`IClienteDialogo`):** Implementação determinística roteirizada por padrão (`Dialogo:HabilitarLlm=false`), garantindo disponibilidade integral e zero custo externo durante a avaliação.

---

## 3. Estrutura do Monólito Modular

```text
src/
├── backend/
│   ├── Simulador.slnx
│   ├── src/
│   │   ├── Simulador.Dominio/        # Motor puro: aplicar eventos sobre subsistemas + estado imutável
│   │   ├── Simulador.Cenarios/       # Catálogo dos 5 níveis (Estagiário a N4b) + Chaos Injector (SplitMix64)
│   │   ├── Simulador.Itsm/           # Módulo próprio de chamados, SLA, notas, aprovação e Problemas ITIL
│   │   ├── Simulador.Avaliacao/      # Juiz 360º determinístico + Replay + hash JCS (RFC 8785) / SHA-256
│   │   ├── Simulador.Dialogo/        # IClienteDialogo (roteirizado determinístico)
│   │   ├── Simulador.Infra/          # PostgreSQL (sessões e eventos append-only) + InMemoryEventStore
│   │   └── Simulador.Api/            # API REST + /health/* + CORS + rate limit por IP
│   └── tests/
│       ├── Simulador.Dominio.Tests/
│       ├── Simulador.Api.Tests/
│       └── Simulador.Infra.IntegrationTests/
└── frontend/
    ├── e2e/                          # Suíte Playwright (11 jornadas ponta a ponta)
    ├── scripts/                      # check-bundle-secrets.mjs (garante zero segredos no build)
    └── src/
        ├── api/                      # Cliente HTTP e contratos tipados
        ├── apps/
        │   ├── ItsmApp/              # Fila de chamados, SLA, categoria/prioridade, notas, escalonamento
        │   ├── ChatApp/              # Comunicador (Cliente + Tech Lead + botão Pedir Pista)
        │   ├── SimuDeskApp/          # Terminal (2 contextos) + Painéis AD/DNS/Serviços/Logs/K8s/SQL
        │   └── IntranetApp/          # Base de Conhecimento (KB) + Topologia Aurora Logística
        ├── replay/                   # Linha do tempo navegável + Relatório do Juiz 360º
        ├── utils/                    # Canonicalização JCS (RFC 8785) + SHA-256 offline no navegador
        └── workstation/              # Shell da Workstation, Tela Inicial, XP e Verificador /verificar
```

---

## 4. Modelo de Estado por Subsistemas (`Simulador.Dominio`)

O estado de cada sessão é dividido em subsistemas independentes e auditáveis (sem propagação mágica entre camadas):
1. **Carreira e Sessão:** nível/cenário atual, semente, causa raiz sorteada (oculta até a conclusão), XP acumulado.
2. **ITSM (`Simulador.Itsm`):** lista de chamados, status, categoria, prioridade, SLA, notas públicas/internas, solicitações de aprovação, problema ITIL vinculado, escalonamento.
3. **Diálogo:** validação de identidade, liberação do acesso remoto (`sim/nao`, `id`, `pin`), histórico de pistas solicitadas.
4. **Estação / Ambiente (`estacao`):**
   - `privilegio`: `UsuarioPadrao` | `Elevado`
   - `diretorio`: usuários, grupos e alterações por painel administrativo
   - `dns` e `cache_dns`: registros de nome → IP e cache local (`ipconfig /flushdns`)
   - `servicos`: status dos serviços da estação (`Workstation`/`LanmanWorkstation`, `AuroraGateway`, etc.)
   - `logs`, ambiente Cloud/K8s simulado (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`) e dataset SQL imutável (`pedidos`, `pagamentos`).

Tanto os **comandos do Terminal** quanto os **cliques nos Painéis Administrativos** disparam ações no mesmo modelo de estado via eventos imutáveis.

---

## 5. Contratos de API Principais (`Simulador.Api`)

- `GET /health/live` e `GET /health/ready` — Verificação de disponibilidade da API e conexão com PostgreSQL.
- `POST /api/sessoes` — Cria sessão anônima (escolhe cenário e semente aleatória ou fixa).
- `GET /api/sessoes/{id}` — Retorna projeção atual da Workstation (chamados, carreira, acesso remoto, histórico de chat).
- `POST /api/sessoes/{id}/acoes` — Executa ação determinística (ITSM, terminal, painel, KB, pedido de pista, SQL, resolução).
- `POST /api/sessoes/{id}/chat` — Envia mensagem ao Cliente Simulado ou Tech Lead.
- `GET /api/sessoes/{id}/avaliacao` — Retorna o veredito determinístico do Juiz 360º e critérios auditados.
- `GET /api/sessoes/{id}/replay` — Retorna a sequência completa de eventos na linha do tempo.
- `POST /api/carreira/resumo` — Consolida o **Currículo Vivo** com hash de integridade **JCS (RFC 8785) + SHA-256**, verificável offline em `/verificar`.

---

## 6. Estratégia de Deploy e Disponibilidade

- **Containerização:** `Dockerfile` para backend `.NET 10` e frontend `React/Vite` (servido via Nginx) + `docker-compose.yml` para execução local completa (`PostgreSQL 17` + Backend + Frontend) com um comando.
- **Hospedagem Recomendada:** Render (Web Service Docker via `render.yaml`) + PostgreSQL gerenciado (ex.: Neon) + Vercel (`src/frontend/vercel.json`) ou Cloudflare Pages para o frontend estático.
