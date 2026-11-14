# Guia de Deploy e Roteiro de Vídeo — IT Flight Simulator (Hack Brasil 2026)

## 1. Estratégia de Deploy

Requisito do regulamento Hack Brasil 2026: aplicação acessível publicamente para avaliação entre **30/nov/2026 e 15/dez/2026**, sem barreira de login, sem uso de dados pessoais reais e com execução estável.

| Critério | **Render** (Web Service + Managed Postgres) | **Railway** (Service + Postgres) |
| :--- | :--- | :--- |
| **Perfil de custo (até 15/dez)** | Free Web Service (\$0) + Postgres gratuito externo (Neon/Supabase) sem expiração em 30 dias, ou Starter (\$7/mês). | Trial / Hobby (\$5 crédito/mês). |
| **Cold start** | Plano Free hiberna após 15 min de inatividade (~30–50s para acordar). Plano Starter não hiberna. | Sem hibernação no plano Hobby. |
| **Postgres & TTL 30 dias** | Compatível; o backend aplica `Sessao:TtlDias=30` na leitura e limpeza. | Compatível com volume persistente. |
| **Redeploy & Health Check** | Auto-deploy no branch `main` + health check em `/health/live`. | Auto-deploy no branch `main` + restart automático em falha. |

### Passo a Passo Custo Zero (\$0): Neon + Render + Vercel

1. **Neon Free (PostgreSQL):**
   - Criar projeto gratuito em [neon.tech](https://neon.tech).
   - Copiar a *Connection String* (`postgresql://...sslmode=require`). O backend normaliza o formato URI automaticamente em `PostgresEventStore`.
2. **Render Free (Backend `.NET 10` via `render.yaml`):**
   - Conectar o repositório no Render utilizando [render.yaml](../render.yaml) (plano `free`, `runtime: docker`, health check `/health/live`).
   - Configurar `ConnectionStrings__Postgres` com a URL do Neon e `Cors__AllowedOrigins` com o domínio do frontend (ex.: `https://it-flight-simulator.vercel.app`).
3. **Vercel Free (Frontend React/Vite):**
   - Importar o diretório `src/frontend` no Vercel (utiliza [vercel.json](../src/frontend/vercel.json) para fallback SPA).
   - Definir a variável de ambiente `VITE_API_BASE_URL` apontando para a URL pública do backend no Render.

### Segurança e Variáveis de Ambiente

- **Execução determinística sem custo de API:** `Dialogo:HabilitarLlm=false` vem desligado por padrão, garantindo respostas imediatas e zero dependência de cota externa durante a avaliação da banca.
- **Variáveis principais do servidor:** `ConnectionStrings__Postgres`, `Sessao__TtlDias=30`, `ASPNETCORE_ENVIRONMENT=Production`, `Dialogo__HabilitarLlm=false`.
- Caso chaves de API venham a ser habilitadas no servidor no futuro, nunca devem usar prefixo `VITE_` nem ser incluídas no bundle frontend (verificado automaticamente em `npm run build` via `scripts/check-bundle-secrets.mjs`).

---

## 2. Roteiro Cronometrado do Vídeo Demo (2m50s)

> **Diretrizes do vídeo:** 100% dados sintéticos e sessões anônimas na empresa fictícia **Aurora Logística**; o **Currículo Vivo** é apresentado como resumo operacional com verificação de integridade **JCS/SHA-256** (não como certificado formal).

- **0:00 – 0:15 | O Problema, Time CVE-K e Dados Sintéticos (15s)**
  - Apresentar o Time **CVE-K** na trilha *Acesso à educação* e a lacuna entre cursos teóricos e o primeiro dia em um Service Desk real.
  - Mostrar a tela inicial do **IT Flight Simulator** (empresa fictícia **Aurora Logística**), destacando sessões **anônimas** e **dados 100% sintéticos**.

- **0:15 – 0:35 | Nível 1 (Estagiário) — Triagem & Defesa contra Engenharia Social (20s)**
  - Selecionar o **Nível 1 (Estagiário)** e iniciar a simulação.
  - No **ITSM**, assumir o chamado da suposta "Diretoria" pedindo reset urgente sem token.
  - Consultar a **KB-001** na Intranet, registrar nota interna e recusar o pedido com segurança.

- **0:35 – 1:00 | Nível 2 (Analista Jr N1) — Chaos Injector & SimuDesk Remoto (25s)**
  - Iniciar o **Nível 2** com semente fixa mostrando o *Chaos Injector* (3 causas raiz sintéticas: Grupo AD, DNS ou Serviço parado).
  - Validar a identidade da Maria (`AUR-1042`) no **Comunicador** para liberar o **SimuDesk Remoto**.
  - Executar diagnóstico antes de alterar o ambiente, corrigir a causa raiz e resolver o chamado no ITSM.

- **1:00 – 1:25 | Nível 3 (Analista Pleno N2) — Incidente Massivo & Problema ITIL (25s)**
  - Abrir o **Nível 3** com 3 chamados simultâneos após atualização.
  - Criar um **Problema ITIL** no ITSM e vincular os 3 chamados.
  - No **SimuDesk**, elevar privilégio, iniciar `AuroraGateway`, registrar a causa raiz e resolver em lote.

- **1:25 – 1:50 | Nível 4 (SRE/Cloud) — Diagnóstico em Cluster K8s Simulado (25s)**
  - Abrir o **Nível 4 (SRE/Cloud)**: investigar degradação de disponibilidade no console Kubernetes simulado em memória (`kubectl get pods`, `kubectl logs` / `kubectl describe ingress` / `pg_stat_activity`).
  - Identificar a causa raiz sorteada (`OOM_KILLED`, `POOL_EXHAUSTED` ou `CERT_EXPIRED`), elevar privilégio, aplicar a mitigação, confirmar `curl -I` retornando `200` e encerrar o incidente.

- **1:50 – 2:10 | Nível 4b (SQL Read-Only) — Investigação Fail-Closed (20s)**
  - Abrir o **Nível 4b (SQL somente leitura)** sobre o dataset sintético imutável (`pedidos` e `pagamentos`).
  - Executar consultas `SELECT` para localizar a divergência de fechamento (linha `DUPLICADO` em `PED-1002`), mostrando que a gramática *fail-closed* bloqueia qualquer escrita ou comando fora da allowlist, e resolver o chamado com evidência.

- **2:10 – 2:35 | Juiz 360º, Currículo Vivo & Verificador Offline JCS/SHA-256 (25s)**
  - Exibir o **Juiz 360º & Replay** (critérios auditados por evento) e voltar à tela inicial para exportar o **Currículo Vivo (JSON)**.
  - Abrir a rota `/verificar` (**Verificador Offline JCS/SHA-256**), colar/carregar o JSON exportado e mostrar que a verificação de integridade (RFC 8785, sem `hash` e sem `apelido`) roda **100% no navegador, sem rede**, exibindo o resultado de integridade.

- **2:35 – 2:50 | Arquitetura, Segurança e Links Finais (15s)**
  - Resumo técnico: Event Sourcing determinístico em `.NET 10` + `PostgreSQL`, Workstation em `React/TypeScript`, suíte automatizada backend/frontend/E2E e acessibilidade verificada por testes automatizados.
  - Destacar custo zero em IA externa (modo determinístico ativo por padrão) e exibir link do repositório público e da demonstração no ar.
