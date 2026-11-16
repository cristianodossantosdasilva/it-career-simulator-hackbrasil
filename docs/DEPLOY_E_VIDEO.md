# Guia de Deploy e Roteiro de Vídeo — IT Flight Simulator (Hack Brasil 2026)

## 1. Estratégia de Deploy

Requisito do regulamento Hack Brasil 2026: aplicação acessível publicamente para avaliação entre **30/nov/2026 e 15/dez/2026**, sem barreira de login, sem uso de dados pessoais reais e com execução estável.

| Critério | **Render** (Web Service + Managed Postgres) | **Railway** (Service + Postgres) |
| :--- | :--- | :--- |
| **Perfil de custo (até 15/dez)** | Free Web Service (\$0) + Postgres gratuito externo (Neon/Supabase) sem expiração em 30 dias, ou Starter (\$7/mês). | Trial / Hobby (\$5 crédito/mês). |
| **Cold start** | Plano Free hiberna após 15 min de inatividade (~30–50s para acordar). Plano Starter não hiberna. | Sem hibernação no plano Hobby. |
| **Postgres e TTL 30 dias** | Compatível; o backend aplica `Sessao:TtlDias=30` na leitura e limpeza. | Compatível com volume persistente. |
| **Redeploy e Health Check** | Auto-deploy no branch `main` + health check em `/health/live`. | Auto-deploy no branch `main` + restart automático em falha. |

### Passo a Passo Custo Zero (\$0): Neon + Render + Vercel

1. **Neon Free (PostgreSQL):**
   - Criar projeto gratuito em [neon.tech](https://neon.tech).
   - Copiar a *Connection String* (`postgresql://...sslmode=require`). O backend normaliza o formato URI automaticamente em `PostgresEventStore`.
2. **Render Free (Backend `.NET 10` via `render.yaml`):**
   - Serviço ativo: `it-flight-simulator-api` conectado via [render.yaml](../render.yaml) (plano `free`, `runtime: docker`, health check `/health/live`). *(O serviço paralelo `vitru-agent-gateway` foi preventivamente suspenso na Render com backup versionado para concentrar 100% das horas gratuitas no backend da avaliação).*
   - Configurar `ConnectionStrings__Postgres` com a URL do Neon e `Cors__AllowedOrigins` com o domínio oficial do frontend: `https://it-flight-simulator-hackbrasil.vercel.app`.
3. **Vercel Free (Frontend React/Vite):**
   - Importar o diretório `src/frontend` no Vercel (utiliza [vercel.json](../src/frontend/vercel.json) para headers de segurança HTTP e fallback SPA).
   - URL pública oficial de submissão: `https://it-flight-simulator-hackbrasil.vercel.app` (com `VITE_API_BASE_URL` apontando para a URL pública do backend no Render).

### Segurança e Variáveis de Ambiente

- **Execução determinística sem custo de API:** `Dialogo:HabilitarLlm=false` vem desligado por padrão, garantindo respostas imediatas e zero dependência de cota externa durante a avaliação da banca.
- **Variáveis principais do servidor:** `ConnectionStrings__Postgres`, `Sessao__TtlDias=30`, `ASPNETCORE_ENVIRONMENT=Production`, `Dialogo__HabilitarLlm=false`, `Demo__PermitirParametrosDeTeste` (default `true` para permitir semente fixa na demo pública do Hackathon; definir `false` em avaliações fechadas sem parâmetros explícitos), `Curriculo__ChavePrivadaPem` e `Curriculo__KeyId` (assinatura ECDSA P-256).
- **Frontend (`Vercel`):** `VITE_API_BASE_URL` e opcionalmente `VITE_CURRICULO_PUBLIC_KEY_JWK`. Chaves privadas ou de IA nunca usam prefixo `VITE_` nem são incluídas no bundle frontend (verificado automaticamente em `npm run build` via `scripts/check-bundle-secrets.mjs`).

---

## 2. Roteiro Cronometrado do Vídeo Demo (2m50s)

> **Diretrizes do vídeo:** 100% dados sintéticos e sessões anônimas na empresa fictícia **Aurora Logística**; o **Currículo Vivo** é apresentado como resumo operacional com verificação de integridade **JCS/SHA-256 e assinatura ECDSA P-256** (não como diploma formal).

- **0:00 – 0:20 | O Problema, Time CVE-K, Tema Claro e Missão 0 (20s)**
  - Apresentar o Time **CVE-K** na trilha *Acesso à educação* e a lacuna prática do "paradoxo do júnior".
  - Abrir a URL oficial `https://it-flight-simulator-hackbrasil.vercel.app`, destacar o **Tema Claro Educacional** (com alternância para escuro), a **Missão 0 guiada em 4 passos**, o **Glossário rápido** e a matriz transparente **MVP vs. Roadmap**, ressaltando sessões anônimas e **dados 100% sintéticos**.

- **0:20 – 0:45 | Nível 1 (Estagiário) — Triagem e Defesa contra Engenharia Social (25s)**
  - Selecionar o **Nível 1 (Estagiário)** e iniciar a simulação.
  - No **ITSM**, assumir o chamado da suposta "Diretoria" pedindo reset urgente sem token.
  - Consultar a **KB-001** na Intranet, registrar nota interna e recusar o pedido com segurança.

- **0:45 – 1:10 | Nível 2 (Analista Jr N1) — Chaos Injector e SimuDesk Remoto (25s)**
  - Iniciar o **Nível 2** mostrando o *Chaos Injector* (3 causas raiz sintéticas: Grupo AD, DNS ou Serviço parado).
  - Validar a identidade da Maria (`AUR-1042`) no **Comunicador** para liberar o **SimuDesk Remoto**.
  - Executar diagnóstico antes de alterar o ambiente, corrigir a causa raiz e resolver o chamado no ITSM.

- **1:10 – 1:35 | Nível 3 (Analista Pleno N2) — Incidente Massivo e Problema ITIL (25s)**
  - Abrir o **Nível 3** com 3 chamados simultâneos após atualização.
  - Criar um **Problema ITIL** no ITSM, vincular os 3 chamados, elevar privilégio no **SimuDesk**, restaurar `AuroraGateway`, registrar a causa raiz e resolver em lote.

- **1:35 – 2:00 | Nível 4 (SRE/Cloud) e Nível 4b (SQL Read-Only) (25s)**
  - Mostrar rapidamente o **Nível 4 (SRE/Cloud)** mitigando causa raiz sorteada (`OOM_KILLED`, `POOL_EXHAUSTED` ou `CERT_EXPIRED`) com `kubectl` e confirmando `curl -I` (`200`).
  - No **Nível 4b**, executar `SELECT` limpo em `pedidos`/`pagamentos` localizando `DUPLICADO` em `PED-1002` e demonstrar o bloqueio *fail-closed* contra escrita/injeção.

- **2:00 – 2:35 | Caixa-Preta Replay, Debrief Didático, Currículo Vivo ECDSA e `/verificar` (35s)**
  - Exibir o **Juiz 360º e Replay**, destacando a **Caixa-Preta do Atendimento** e o **Debrief Didático** com evidências da trilha de eventos.
  - Exportar o **Currículo Vivo (JSON)** na tela inicial e abrir `/verificar` (**Verificador Offline**), validando **JCS (RFC 8785 UTF-8) + SHA-256 + assinatura ECDSA P-256** **100% no navegador, sem rede**, e mostrando a detecção imediata caso o JSON seja adulterado.

- **2:35 – 2:50 | Arquitetura, Testes e Encerramento (15s)**
  - Resumo técnico: Event Sourcing determinístico em `.NET 10` + `PostgreSQL 17`, Frontend em `React 19/TypeScript`, **69 testes `xUnit`** (+ integração PostgreSQL no CI), **25 testes `Vitest + axe-core`** e **11 jornadas `Playwright`**.
  - Destacar custo zero em IA externa (`Dialogo:HabilitarLlm=false`) e exibir o link oficial do repositório GitHub e da demo pública (`https://it-flight-simulator-hackbrasil.vercel.app`).
