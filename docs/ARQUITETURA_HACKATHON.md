# Arquitetura Técnica — IT Career Simulator (Edição Hack Brasil 2026)

## 1. Visão Geral e Princípio Central

A aplicação adota uma arquitetura de **Simulação Web Determinística + Camada Pedagógica Desacoplada + Diálogo Auditável**:
- **O Motor Determinístico é a única autoridade** sobre o estado da estação simulada, privilégios, acesso remoto, SLA e avaliação.
- **O Diálogo (`Simulador.Dialogo`) não lê nem altera o estado diretamente**, não inventa saídas de terminal e não atribui notas arbitrárias: ele apenas conduz a interação a partir dos fatos liberados pelo motor. Esse princípio permanece inviolável na **Onda 4** com o módulo de **Chamada em Vídeo e Voz ao Vivo com Agentes de IA**.
- **Estado reconstruível por eventos (*Event Sourcing* leve):** toda ação do usuário no laboratório gera eventos imutáveis (*append-only*), permitindo **Replay exato (Revisão + Debrief Didático)** na interface e auditoria determinística pelo **Juiz 360º**.
- **Arquitetura Aditiva de Não-Regressão:** a interface educacional implementada no MVP (**Tema Claro Educacional com alternância para modo escuro, Missão 0 guiada em 4 passos, Glossário rápido, Matriz transparente de Escopo MVP vs. Roadmap e verificação assimétrica ECDSA P-256**) e os módulos futuros (*Aulas com SM-2, 8 Laboratórios Dedicados UC1 a UC8, Centro de Simulados, Caderno estilo Notion/Cornell e Mentor IA*) preservam os contratos REST sem quebrar os seletores, as suítes `xUnit` (mais integração `PostgreSQL 17` no CI), `Vitest + axe-core` e `Playwright` (contagens medidas no [README](../README.md#como-testar) e no CI).

---

## 2. Regra Arquitetural de Nomenclatura: Proibição de E Comercial em Código e Interface

Fica estabelecido como padrão arquitetural inegociável que **nenhuma página, aba, título visível, nome de componente, nome de competência exibida ao aluno ou documentação pode conter o símbolo E comercial** — devendo utilizar exclusivamente a conjunção **"e"** (ou vírgula quando aplicável).

A migração sincronizada abaixo já foi **implementada em `src/`** e validada com **0 regressões** nas suítes `xUnit`, `Vitest`, `oxlint` e `Playwright`:

| Arquivo em `src/` | Texto Atual (com E comercial) | Texto Alvo (Sem E comercial — Migração Sincronizada) |
| :--- | :--- | :--- |
| `src/frontend/src/App.tsx` (L58, L72, L79, L85, L231, L378) | `Juiz 360º [E comercial] Replay` | `Juiz 360º e Replay` |
| `src/frontend/src/replay/ReplayView.tsx` (L25) | `Avaliacao 360º, Replay [E comercial] Curriculo Vivo` | `Avaliacao 360º, Replay e Curriculo Vivo` |
| `src/frontend/src/workstation/TelaInicial.tsx` (L19) | `Triagem [E comercial] Defesa contra Engenharia Social` | `Triagem e Defesa contra Engenharia Social` |
| `src/frontend/src/workstation/TelaInicial.tsx` (L33) | `Incidente Massivo [E comercial] Problema ITIL` | `Incidente Massivo e Problema ITIL` |
| `src/frontend/src/workstation/TelaInicial.tsx` (L40) | `Incidente Cloud [E comercial] Kubernetes (Chaos)` | `Incidente Cloud e Kubernetes (Chaos)` |
| `src/frontend/src/apps/ChatApp/ChatApp.tsx` (L152) | `Mentoria [E comercial] Pistas (D3)` | `Mentoria e Pistas (D3)` |
| `src/frontend/src/apps/ItsmApp/ItsmApp.tsx` (L116) | `Classificacao [E comercial] SLA` | `Classificacao e SLA` |
| `src/frontend/src/apps/SimuDeskApp/SimuDeskApp.tsx` (L153) | `Schema [E comercial] Dataset Sintetico` | `Schema e Dataset Sintetico` |
| `src/frontend/src/apps/SimuDeskApp/SimuDeskApp.tsx` (L391) | `Diretorio [E comercial] Grupos` | `Diretorio e Grupos` |
| `src/backend/src/Simulador.Avaliacao/Juiz360.cs` (L93, L298, L299) | `Conformidade [E comercial] Governanca`; `Observabilidade [E comercial] Logs Cloud`; `SRE [E comercial] Mitigacao Kubernetes` | `Conformidade e Governanca`; `Observabilidade e Logs Cloud`; `SRE e Mitigacao Kubernetes` |
| `src/frontend/src/App.test.tsx` e `src/frontend/e2e/jornadas.spec.ts` | Seletores/Regexes que apontam para os textos anteriores | Atualizar seletores e assertions em paralelo no mesmo commit |

*(Observação: operadores lógicos da linguagem C# e TypeScript continuam sendo sintaxe válida de programação; a proibição incide sobre strings de UI, títulos, abas, páginas, nomes de módulos e documentação).*

---

## 3. Stack Tecnológica

- **Backend:** ASP.NET Core (`.NET 10`), monólito modular em C#, com `UseForwardedHeaders` (`ForwardLimit=2` para proxy reverso Render/Vercel), limite de payload de requisição (`32 KB`), limite de `Dados` em `/acoes` (`16 KB`), guarda `Demo:PermitirParametrosDeTeste`, assinatura assimétrica **ECDSA P-256 (`SHA256`, formato IEEE P1363)** e canonicalização **JCS (RFC 8785 UTF-8)**.
- **Frontend:** `React 19` + `TypeScript` + `Vite`, com Design System Claro/Escuro em CSS custom properties, **Missão 0 guiada em 4 passos**, **Glossário rápido**, **Debrief Didático da Revisão**, **Matriz transparente MVP vs. Roadmap**, verificação automatizada de contraste (`contraste.ts`) e acessibilidade (`axe-core`), verificação offline `JCS (RFC 8785 UTF-8) + SHA-256 + ECDSA P-256` (`Web Crypto API`) e testes E2E (`Playwright`).
- **Banco de Dados:** `PostgreSQL 17` (persistência de sessões anônimas e trilha de eventos em `JSONB` com TTL configurável e expurgo automático de sessões expiradas há `> 2 dias`) — com abstração `IEventStore` e provedor `InMemoryEventStore` para execução leve e testes sem banco externo.
- **Persistência Pedagógica Local (MVP) → Multi-Tenant (Produto Real):** Anotações Cornell, flashcards SM-2, progresso de aulas nas 8 Unidades Curriculares (`UC1` a `UC8`, 560h), plano de estudos e missões das Bancadas Físicas persistem em `localStorage` no navegador durante o Hackathon (zero fricção de login), com previsão de sincronização por usuário/instituição no PostgreSQL na Onda 1/2.
- **Diálogo e IA (`IClienteDialogo` + Arquitetura Híbrida 80/20 + Futura Chamada em Vídeo Onda 4):**
  - Modo determinístico roteirizado por padrão (`Dialogo:HabilitarLlm=false`), garantindo R\$ 0,00 de custo e 100% de disponibilidade na avaliação;
  - Em produção comercial (Onda 1–3), heurísticas locais executam 80% das verificações antes de chamadas LLM econômicas em cache (*Context Caching*);
  - Na **Onda 4**, o gateway multimodal WebRTC conecta áudio/vídeo do aluno ao agente em vídeo em tempo real consumindo *Snapshot Read-Only* do `.NET 10` e devolvendo apenas transcrição auditável para rubrica de comunicação no Juiz 360º.

---

## 4. Estrutura do Monólito Modular e Camada Pedagógica (Atual + Roadmap 560h)

```text
src/
├── backend/
│   ├── Simulador.slnx
│   ├── src/
│   │   ├── Simulador.Dominio/        # Motor puro: aplicar eventos sobre subsistemas + estado imutável
│   │   ├── Simulador.Cenarios/       # Catálogo de cenários (Ciclo 1 UC1-UC4 + Ciclo 2 UC5-UC8) + Chaos Injector
│   │   ├── Simulador.Itsm/           # Módulo próprio de chamados, SLA, notas, aprovação e Problemas ITIL
│   │   ├── Simulador.Avaliacao/      # Juiz 360 determinístico + Replay + JCS (RFC 8785 UTF-8) / SHA-256 / ECDSA P-256
│   │   ├── Simulador.Dialogo/        # IClienteDialogo (roteirizado / híbrido 80-20 / futuro Gateway Live Vídeo)
│   │   ├── Simulador.Infra/          # PostgreSQL (sessões, eventos append-only e expurgo >2d) + InMemoryEventStore
│   │   └── Simulador.Api/            # API REST + /health/* + CORS + UseForwardedHeaders + rate limit por IP real
│   └── tests/                        # testes xUnit (contagem no README) + Simulador.Infra.IntegrationTests (CI)
└── frontend/
    ├── vercel.json                   # Headers de segurança HTTP (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) + fallback SPA
    ├── e2e/                          # Suíte Playwright (jornadas e telas em 375/768/1280/1440px; contagem no README)
    ├── scripts/                      # check-bundle-secrets.mjs (garante zero segredos no build)
    └── src/
        ├── api/                      # Cliente HTTP e contratos tipados
        ├── apps/
        │   ├── ItsmApp/              # Fila de chamados, SLA, categoria/prioridade, notas, escalonamento
        │   ├── ChatApp/              # Comunicador (Cliente + Tech Lead + botão Pedir Pista)
        │   ├── SimuDeskApp/          # Terminal (2 contextos) + Painéis AD/DNS/Serviços/Logs/K8s/SQL
        │   └── IntranetApp/          # Base de Conhecimento (KB) + Topologia Aurora Logística
        ├── educacao/                 # Roadmap Ondas 1-4: Aulas SM-2 + Caderno + Mentor + 8 Laboratorios Dedicados + Certificacoes + Video Onda 4
        │   ├── HardwareWorkbenchLab/             # UC1: Desktop/Notebook/UPS 2D, ESD, POST, SMART e pasta termica
        │   ├── OsSystemAdminLab/                 # UC2: WinRE/bcdedit, BitLocker, Registro, Sysinternals, BSOD e Linux SSH
        │   ├── NetworkCablingWifiDesignLab/      # UC3: Bancada RJ-45 T568A/B, Rack U/PoE + Estudio Wi-Fi Design (UniFi)
        │   ├── CorporateWorkspaceLab/            # UC4: AD dsa.msc, M365/Exchange, Impressoras/Scanner SMB, A1/A3 e ITSM
        │   ├── ServerSustainmentLab/             # UC5: GPO LSDOU, Share vs. NTFS, DHCP/DNS, Event Viewer 4740 e RCA
        │   ├── MultiVendorNetworkFirewallLab/    # UC6: Cisco IOS XE, MikroTik RouterOS/WinBox, UniFi, NGFW Fortinet (GeoIP/Web Filter/Gateway AV/IPsec) + Zabbix/K8s
        │   ├── DataCenterStorageCloudBackupLab/  # UC7: Rack 42U/PDU A+B, RAID/SMART, SAN iSCSI, Hypervisor, Cloud Backup WORM 3-2-1-1-0
        │   ├── CyberBlueTeamSqlLab/              # UC8: IAM/Conditional Access, SPF/DKIM/DMARC/BEC, Console Antivirus/EDR e SQL Read-Only
        │   └── CertificationPracticeCenter/      # Pos-Hackathon: Simulados autorais (PBQs) e integracao Vendor Academies
        ├── replay/                   # Revisão do Atendimento + Debrief Didático + Relatório do Juiz 360
        ├── utils/                    # Canonicalização JCS (RFC 8785 UTF-8) + SHA-256 + ECDSA P-256 + contraste WCAG
        └── workstation/              # Shell unificado (Tema Claro/Escuro), Missão 0, Glossário, Escopo MVP vs. Roadmap e Verificador /verificar
```

---

## 5. Design System Educacional e Modelo de Estado Cognitivo

### 5.1. Tokens Visuais (Tema Claro AWS Skill Builder + Modo Escuro Opcional + WCAG AA)
- **Tema Claro Padrão:** Cabeçalho escuro institucional (`#0f1b2d`), fundo de leitura anti-fadiga (`#f3f5f8`), cards brancos (`#ffffff`) e bordas suaves (`#d5dbdb`). O Terminal CLI do `SimuDesk` permanece com fundo escuro (`#0f172a`) por familiaridade operacional.
- **Codificação Semântica por Etapa de Estudo:**
  - `Teoria`: `#0a66c2` (Azul técnico)
  - `Fixação, IA e Caderno`: `#6d28d9` (Roxo cognitivo)
  - `Prática, Bancadas e Laboratório`: `#c2410c` (Laranja operacional)
  - `Domínio e Currículo Vivo`: `#15803d` (Verde certificação)
- **Conformidade Automática:** Todos os pares texto/fundo passam pela função `razaoContraste` (`>= 4.5:1` para texto normal, `>= 3.0:1` para componentes/bordas) e pela suíte `axe-core`.

### 5.2. Modelo de Estado por Subsistemas (`Simulador.Dominio`)
O estado de cada sessão é dividido em subsistemas independentes e auditáveis (sem propagação mágica entre camadas):
1. **Carreira e Sessão:** nível/cenário atual, semente, causa raiz sorteada (oculta até a conclusão), XP acumulado.
2. **ITSM (`Simulador.Itsm`):** lista de chamados, status, categoria, prioridade, SLA, notas públicas/internas, solicitações de aprovação, problema ITIL vinculado, escalonamento.
3. **Diálogo:** validação de identidade, liberação do acesso remoto (`sim/nao`, `id`, `pin`), histórico de pistas solicitadas.
4. **Estação e Ambiente (`estacao`):**
   - `privilegio`: `UsuarioPadrao` | `Elevado`
   - `diretorio`: usuários, grupos e alterações por painel administrativo
   - `dns` e `cache_dns`: registros de nome → IP e cache local (`ipconfig /flushdns`)
   - `servicos`: status dos serviços da estação (`Workstation`/`LanmanWorkstation`, `AuroraGateway`, etc.)
   - `logs`, ambiente Cloud/Infra simulado (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`) e dataset SQL imutável (`pedidos`, `pagamentos`), com arquitetura preparada para os subsistemas Multi-Vendor Firewall/Network (**Cisco IOS, MikroTik WinBox, UniFi, Fortinet NGFW GeoIP/Content Filter/AV**), **Design RF Wi-Fi**, **Data Center e Storage** (`Rack 42U`, `VSS`, `SMART`, `RAID`, `iSCSI`, `Cloud Backup WORM 3-2-1-1-0`, `Restore`) e **Console Antivírus/EDR**.

---

## 6. Contratos de API Principais (`Simulador.Api`)

- `GET /health/live` e `GET /health/ready` — Verificação de disponibilidade da API e conexão com PostgreSQL.
- `POST /api/sessoes` — Cria sessão anônima (escolhe cenário e semente aleatória ou fixa).
- `GET /api/sessoes/{id}` — Retorna projeção atual da Workstation (chamados, carreira, acesso remoto, histórico de chat).
- `POST /api/sessoes/{id}/acoes` — Executa ação determinística (ITSM, terminal, painel, KB, pedido de pista, SQL, resolução).
- `POST /api/sessoes/{id}/chat` — Envia mensagem ao Cliente Simulado ou Tech Lead.
- `GET /api/sessoes/{id}/avaliacao` — Retorna o veredito determinístico do Juiz 360º e critérios auditados.
- `GET /api/sessoes/{id}/replay` — Retorna a sequência completa de eventos na linha do tempo.
- `POST /api/carreira/resumo` — Consolida o **Currículo Vivo** com integridade **JCS (RFC 8785 UTF-8) + SHA-256 + assinatura assimétrica ECDSA P-256** (`kid` + `chavePublicaJwk`), verificável offline em `/verificar`.

---

## 7. Estratégia de Deploy, Segurança e Custos

- **Containerização e CI:** `Dockerfile` para backend `.NET 10` e frontend `React/Vite` (Nginx), `docker-compose.yml` para execução local (`PostgreSQL 17` + Backend + Frontend) e workflow [GitHub Actions CI](../.github/workflows/ci.yml) validando `xUnit`, integração `PostgreSQL 17`, `oxlint`, `Vitest`, build e `Playwright`.
- **Hospedagem Oficial (MVP):** Frontend público no Vercel em `https://it-flight-simulator-hackbrasil.vercel.app` (`src/frontend/vercel.json` com headers de segurança HTTP e rewrite SPA), backend `.NET 10` na Render (`it-flight-simulator-api`, via `render.yaml`) e `PostgreSQL 17` gerenciado no Neon (`vitru-agent-gateway` preventivamente suspenso na Render com backup versionado para preservar 100% da cota gratuita durante a avaliação).
- **Custo:** o hackathon roda a custo zero, porque toda a simulação opera em motor de estado leve, sem VMs individuais na nuvem. O modelo de negócio é tratado fora do repositório público.
