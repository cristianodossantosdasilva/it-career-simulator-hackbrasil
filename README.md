# IT Flight Simulator — Simulador Prático de Carreira em TI (Hack Brasil 2026)

Plataforma interativa de simulação prática de carreira em TI desenvolvida pelo time **CVE-K** *(Cristiano dos Santos da Silva, Enzo Modesto Nascimento dos Santos e Kauan Soares Dantas)* para o **Hack Brasil 2026** (Trilha: **Acesso à educação**).

- **Demo Pública Oficial (sem login):** `https://it-flight-simulator-hackbrasil.vercel.app`
- **Licença:** [MIT](LICENSE) · **Integração Contínua:** [GitHub Actions CI](.github/workflows/ci.yml)

Em vez de aulas passivas ou quizzes genéricos de múltipla escolha, o participante atua em uma **Workstation Corporativa Unificada** com **Tema Claro Educacional** (e alternância para tema escuro), **Missão 0 guiada em 4 passos** e **Glossário rápido** dentro do navegador na empresa fictícia **Aurora Logística** (`aurora.local`), em uma jornada projetada para evolução de **Técnico de Suporte Júnior (4 meses / 280h)** até **Técnico Pleno N2 e 3 Vertentes N3 (8 meses / 560h)** e operando no MVP:

- **ITSM Próprio:** fila de chamados, SLA em tempo real, classificação, notas públicas/internas, solicitações de aprovação, escalonamento e vinculação de Problemas ITIL.
- **Comunicador Corporativo:** atendimento a usuários simulados e orientação em 3 atos via Tech Lead (consulta livre à Base de Conhecimento, pedido de pista sem punição automática e escalonamento com evidência).
- **SimuDesk (Acesso Remoto):** terminal interativo com separação de contexto (sessão do usuário vs. privilégio elevado) e painéis administrativos (Diretório, Serviços, DNS, Logs, Cluster Kubernetes simulado e Console SQL somente leitura), todos governados por um **motor determinístico puro**.
- **Chaos Injector:** causas raiz sorteadas por semente e eventos de engenharia social para exigir investigação real em vez de receitas decoradas.
- **Juiz 360º, Debrief da Caixa-Preta, Replay e Currículo Vivo:** avaliação auditável por critérios binários observáveis na trilha de eventos (*Event Sourcing*), linha do tempo navegável, resumo pedagógico pós-sessão e exportação de portfólio verificável offline via **JCS (RFC 8785) + SHA-256 + assinatura ECDSA P-256**.

---

## Implementado Hoje (MVP Hackathon) vs. Roadmap (Ondas 1–4)

| Camada / Capacidade | Status Atual (`main` / Produção Hackathon) | Roadmap Pós-Hackathon (Ondas 1–4) |
| :--- | :--- | :--- |
| **Motor Determinístico, ITSM, SimuDesk e Chaos Injector** | **Implementado e testado:** 5 cenários completos (`triagem-engenharia-social`, `pasta-rede-inacessivel`, `incidente-massivo`, `sre-cloud-latencia`, `diagnostico-sql-readonly`). | Expansão para **80 cenários** (`LAB-UC1-01` a `LAB-UC8-10`) e **8 Laboratórios Dedicados (`UC1` a `UC8`, 560h)**. |
| **Interface Educacional, Missão 0 e Acessibilidade** | **Implementado:** Tema Claro Educacional (com alternância Escuro), Missão 0 em 4 passos, Glossário rápido, Caixa-Preta Replay com Debrief e contraste WCAG AA (`>= 4.5:1`). | Microaulas interativas + Flashcards `SM-2`, Caderno Cornell, Mentor Feynman/STAR e `HardwareWorkbenchLab` / `NetworkCablingWifiDesignLab`. |
| **Integridade do Currículo Vivo e Segurança da API** | **Implementado:** JCS (RFC 8785 UTF-8) + SHA-256 + assinatura assimétrica **ECDSA P-256**, `UseForwardedHeaders`, limite de payload `32 KB` / dados `16 KB`, trava `Demo:PermitirParametrosDeTeste` e expurgo de sessões antigas. | Contas multi-tenant (SSO/OAuth), emissão de Certificado de Conclusão de Curso Livre e painel B2B para turmas. |
| **Simulador Multimodal (Voz/Vídeo IA)** | **Modo Determinístico (R\$ 0,00):** `Dialogo:HabilitarLlm=false` ativo por padrão para disponibilidade e custo zero à banca. | **Onda 4:** Chamada em vídeo/voz ao vivo com teto de minutos para usuários simulados, P1, *Vishing* e entrevistas STAR. |

---

## Matriz Formativa e Progressão de Carreira (560h em até 8 Meses · Prontidão Jr em 4 Meses)

O estudo de caso inaugural segue densidade técnica equivalente a um curso técnico profissionalizante em **2 Ciclos Formativos** (**260h Teoria e Fixação + 300h Laboratórios Práticos = 560h / 80 laboratórios**), combinando o **Ciclo Cognitivo de 4 Etapas** (*Aprender → Fixar → Praticar → Explicar*), **8 Laboratórios Interativos Dedicados** (1 por UC: Hardware/UPS, Multi-OS, Cabeamento/Rack `U` + Estúdio Wi-Fi inspirado no UniFi Design, Corporativo M365/AD/ICP-Brasil, Servidores/GPO, Multi-Vendor Cisco/MikroTik/UniFi + Firewall Fortinet NGFW com GeoIP/Content Filter/Gateway AV + Zabbix/K8s, Data Center 42U/RAID/iSCSI + Cloud Backup WORM, e Blue Team IAM/Antivírus-EDR/SQL) e **trilha preparatória de certificações de mercado**. Na edição Hackathon, 5 cenários-chefe executam de ponta a ponta no motor determinístico:

| Ciclo / Unidade Curricular (CBO) | Cenário MVP / Foco | Foco Pedagógico e Técnico |
| :--- | :--- | :--- |
| **Ciclo 1 — Meses 1 a 4 (280h): Prontidão Rápida Júnior e Field Service** | | |
| **UC1 — Bancada Física, Hardware e Energia (70h)**<br>*(`CBO 3132-20`)* | `Bancada Física 2D` (`LAB-UC1-01` a `LAB-UC1-10`) | Segurança ESD, fontes ATX e UPS/Nobreaks, placa-mãe/POST/UEFI, RAM DDR4/5, SSD NVMe/SMART, preventiva térmica de desktop/notebook e montagem completa. |
| **UC2 — Sistemas Operacionais Windows e Linux (70h)**<br>*(`CBO 3172-10`)* | `Simulador OS` (`LAB-UC2-01` a `LAB-UC2-10`) | Boot GPT/UEFI/BCD, BitLocker, Registro, Perfil Temporário, Sysinternals, `DISM`/`SFC`, diagnóstico de BSOD, PowerShell e Linux (`systemd`, SSH, disco). |
| **UC3 — Redes TCP/IP, Cabeamento, Wi-Fi e VPN (70h)**<br>*(`CBO 3172-10 / 3132-20`)* | `pasta-rede-inacessivel` (`LAB-UC3-01` a `LAB-UC3-10`) | Crimpagem RJ-45 T568A/B, Patch Panel e PoE; *Chaos Injector* com 3 causas raiz por semente (Grupo AD, DNS + escalonamento N2 + `flushdns`, serviço `LanmanWorkstation`), DHCP/APIPA, Wi-Fi e VPN. |
| **UC4 — Ambientes Corporativos, M365, Impressão, A1/A3 e ITIL/LGPD (70h)**<br>*(`CBO 3172-10`)* | `triagem-engenharia-social` (`LAB-UC4-01` a `LAB-UC4-10`) | AD N1, Microsoft 365 (`.ost`/OneDrive), Spooler/Scanner SMB, Certificados ICP-Brasil A1/A3, matriz Urgência x Impacto, LGPD e defesa contra engenharia social + **Capstone Jr**. |
| **Ciclo 2 — Meses 5 a 8 (+280h = 560h): Técnico Pleno N2 e 3 Vertentes N3** | | |
| **UC5 — Técnico Pleno N2: Sustentação, Servidores e GPO (80h)**<br>*(`CBO 2124-20`)* | `incidente-massivo` (`LAB-UC5-01` a `LAB-UC5-10`) | Correlação de múltiplos incidentes em Problema ITIL, análise de logs, restauração de `AuroraGateway`, RCA, File Server Share/NTFS, GPO (`LSDOU`), Lockout `4740` e PowerShell. |
| **UC6 — Vertente N3-A: Infraestrutura, Redes, Zabbix e Cloud (65h)**<br>*(`CBO 2124-10 / 3171-05`)* | `sre-cloud-latencia` (`LAB-UC6-01` a `LAB-UC6-10`) | Switches VLAN `802.1Q`/STP/LACP, Firewall/NAT, VPN IPsec, Zabbix, cluster Cloud/Kubernetes (`OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED`), comandos `kubectl`, `curl -I` e GMUD. |
| **UC7 — Vertente N3-B: Data Center, Storage, RAID e Backup (70h)**<br>*(`CBO 3172-05 / 2124-20`)* | *Matriz 560h (`LAB-UC7-01` a `LAB-UC7-10` · Onda 1–3)* | Rack `U`/PDUs A+B, discos S.M.A.R.T., RAID `0/1/5/6/10` + Hot Spare, SAN iSCSI (`SAN Policy`/MPIO), Datastores e Snapshots VM, Backup **3-2-1-1-0**, VSS, `RPO`/`RTO`, WORM e Teste de Restore/DRP. |
| **UC8 — Vertente N3-C: Cibersegurança Blue Team e Auditoria SQL (65h)**<br>*(`CBO 2123-05 / 3172-10`)* | `diagnostico-sql-readonly` (`LAB-UC8-01` a `LAB-UC8-10`) | IAM/MFA/Acesso Condicional, OAuth, SPF/DKIM/DMARC, BEC/*Inbox Rules*, EDR/NIST e auditoria financeira via parser SQL *fail-closed* restrito a `SELECT` / `EXPLAIN SELECT` (anti-injeção) + **Capstone Final**. |

> **Evolução Futura (Onda 4):** Módulo de **Chamada em Vídeo e Voz ao Vivo com Agentes de IA** interpretando clientes ansiosos, gestores P1, tentativas de *Vishing* em vídeo e bancas de entrevista técnica baseadas no Currículo Vivo.

---

## Arquitetura e Stack Tecnológica

- **Backend (`.NET 10`, C#):** Monólito modular separado em:
  - `Simulador.Dominio` — Motor puro (`Aplicar`) e subsistemas isolados com Event Sourcing.
  - `Simulador.Cenarios` — Catálogo de cenários, sementes (`SplitMix64`) e estado inicial determinístico.
  - `Simulador.Itsm` — Gestão enxuta de chamados, SLA, notas, escalonamento e Problemas ITIL.
  - `Simulador.Avaliacao` — Juiz 360º determinístico, projeção de Replay, canonicalização **JCS (RFC 8785 UTF-8)** + `SHA-256` e assinatura **ECDSA P-256**.
  - `Simulador.Dialogo` — Interface `IClienteDialogo` com modo roteirizado determinístico por padrão (`Dialogo:HabilitarLlm=false`).
  - `Simulador.Infra` — Persistência em PostgreSQL (`JSONB` *append-only* com TTL e expurgo de sessões expiradas `> 2 dias`) e provedor `InMemory` para execução leve e testes.
  - `Simulador.Api` — API REST, health checks (`/health/live`, `/health/ready`), `UseForwardedHeaders`, limites de body (`32 KB`) / dados (`16 KB`), guarda `Demo:PermitirParametrosDeTeste` e rate limiting por IP real.
- **Frontend (`React 19` + `TypeScript` + `Vite`):** Workstation Corporativa em Tema Claro Educacional (e modo escuro opcional), **Missão 0 guiada**, **Glossário rápido**, 4 aplicativos integrados (`ItsmApp`, `ChatApp`, `SimuDeskApp`, `IntranetApp`), visualizador de Replay/Debrief da Caixa-Preta e Verificador Offline de Currículo Vivo em `/verificar` (JCS + SHA-256 + ECDSA P-256 via WebCrypto).
- **Banco de Dados:** `PostgreSQL 17` (via Docker Compose ou serviço gerenciado) ou modo em memória para desenvolvimento e demonstração rápida.

---

## Como Executar Localmente

### Opção 1: Execução Direta (Backend e Frontend)

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

- **Backend (`xUnit`):** `dotnet test src/backend/Simulador.slnx` (**69 casos** ativos na solução: `50` em `Simulador.Dominio.Tests` + `19` em `Simulador.Api.Tests`, além da suíte de integração `Simulador.Infra.IntegrationTests` executada no CI contra `PostgreSQL 17`) cobre o motor determinístico, os 5 cenários, ações prejudiciais, gramática SQL fail-closed, assinatura ECDSA P-256, rate limit via `X-Forwarded-For`, bloqueio de parâmetros de teste e vetores JCS/SHA-256 em UTF-8.
- **Frontend (`Oxlint` + `Vitest` + `axe-core` + `check-bundle-secrets`):** (**25 casos Vitest** em `7` arquivos + `0` avisos/erros no `oxlint`) valida componentes dos aplicativos, verificação JCS/ECDSA P-256 offline, contraste WCAG AA em Tema Claro/Escuro, acessibilidade automatizada (`axe-core`) e ausência de chaves no bundle compilado.
- **E2E (`Playwright`):** `src/frontend/e2e/jornadas.spec.ts` cobre **11 jornadas** de ponta a ponta (fluxos felizes N1–N4b, prompt injection bloqueado, verificação de JSON adulterado/incompleto, bloqueio de `DROP`/`UNION` em SQL e navegação por teclado/responsividade nos viewports `375px`, `768px` e `1280px`).

---

## Documentação

- [Planejamento Pedagógico, Regulação MEC/CBO/LPI, Certificações, Custos e Matriz Curricular 560h (8 Laboratórios e 80 Cenários)](docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md)
- [Contexto e Compliance — Hack Brasil 2026](docs/CONTEXTO_HACK_BRASIL_2026.md)
- [PRD — Product Requirements Document](docs/PRD_HACKATHON.md)
- [Arquitetura Técnica](docs/ARQUITETURA_HACKATHON.md)
- [Cronograma de Execução e Roadmap](docs/CRONOGRAMA_HACKATHON.md)
- [Guia de Deploy e Roteiro de Vídeo](docs/DEPLOY_E_VIDEO.md)
- [Licença MIT](LICENSE)
- [Workflow de Integração Contínua (GitHub Actions)](.github/workflows/ci.yml)
- [Concepção e RFC Consolidado](docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md)
- [Manifesto N2: Pasta de Rede Inacessível (`v1.1`)](docs/rfc/MANIFESTO_PASTA_REDE_INACESSIVEL_v1.1.md)
- [Manifesto N4: Diagnóstico SRE/Cloud](docs/rfc/MANIFESTO_N4_SRE.md)
- [Manifesto N4b: Diagnóstico SQL Read-Only](docs/rfc/MANIFESTO_N4B_SQL.md)

---

## Conformidade

- Repositório criado especificamente para o **Hack Brasil 2026**, sem aproveitamento de código privado anterior.
- Dados **100% sintéticos** e empresa fictícia (**Aurora Logística**), com sessões anônimas e sem coleta de dados pessoais reais.
- Custo de IA externo **zero por padrão** (`Dialogo:HabilitarLlm=false`), garantindo disponibilidade integral para a banca avaliadora.
