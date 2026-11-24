# Guia de Deploy e Roteiro de Vídeo — IT Career Simulator (Hack Brasil 2026)

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

### Armazenamento das sessões
- Cada ação do participante vira um evento imutável no **Event Store em PostgreSQL** (Neon no passo a passo acima). A sessão expira **30 dias** depois, conforme Sessao__TtlDias em [render.yaml](../render.yaml). O que fica só no navegador é o Cartão de Perfil, os Registros de Missão, o progresso de estudo e o modo de demonstração, em localStorage.

### Segurança e Variáveis de Ambiente

- **Execução determinística sem custo de API:** `Dialogo:HabilitarLlm=false` vem desligado por padrão, garantindo respostas imediatas e zero dependência de cota externa durante a avaliação da banca.
- **Variáveis principais do servidor:** `ConnectionStrings__Postgres`, `Sessao__TtlDias=30`, `ASPNETCORE_ENVIRONMENT=Production`, `Dialogo__HabilitarLlm=false`, `Demo__PermitirParametrosDeTeste` (default `true` para permitir semente fixa na demo pública do Hackathon; definir `false` em avaliações fechadas sem parâmetros explícitos), `Curriculo__ChavePrivadaPem` e `Curriculo__KeyId` (assinatura ECDSA P-256).
- **Frontend (`Vercel`):** `VITE_API_BASE_URL` e opcionalmente `VITE_CURRICULO_PUBLIC_KEY_JWK`. Chaves privadas ou de IA nunca usam prefixo `VITE_` nem são incluídas no bundle frontend (verificado automaticamente em `npm run build` via `scripts/check-bundle-secrets.mjs`).

---

## 2. Roteiro Cronometrado do Vídeo Demo (2m50s)

> **Diretrizes do vídeo:** 100% dados sintéticos e sessões anônimas na empresa fictícia **Aurora Logística**; o **Currículo Vivo** é apresentado como resumo operacional com verificação de integridade **JCS/SHA-256 e assinatura ECDSA P-256** (não como diploma formal). Textos de tela e legendas sem E comercial e sem emoji.

### Como a jornada está organizada

A aplicação tem endereços próprios: Início `/`, Diagnóstico `/diagnostico`, Plano de Carreira `/plano-de-carreira`, Mesa de Trabalho `/mesa-de-trabalho/:missao`, Revisão `/revisao/:sessao`, Portfólio `/portfolio`, Catálogo `/catalogo`, Aulas, Treino, Caderno e Mentor `/mentor`. O endereço `/verificar` **não existe**: o **Verificador offline** do Currículo Vivo fica no **Portfólio**. A **Missão 0 guiada** e o **Glossário rápido** ficam no **Plano de Carreira**, não no início.

Os antigos "Nível 1" a "Nível 4b" aparecem como etapas: **Help Desk N1**, **Service Desk N1 Jr**, **N2 Pleno** e **N3 Sênior**. A N3 Sênior tem três Vertentes: **N3-A Redes e Nuvem** (`sre-cloud-latencia`), **N3-B Data Center e Backup** e **N3-C Segurança e Dados**, que reúne a triagem de engenharia social (`triagem-engenharia-social`) e o diagnóstico SQL somente leitura (`diagnostico-sql-readonly`). As Aulas seguem a mesma trilha, na mesma ordem e com os mesmos nomes (seis níveis: Help Desk N1, Service Desk N1 Jr, N2 Pleno, N3-A, N3-B e N3-C). O Praticar das Aulas e da Credencial respeita o portão da Mesa de Trabalho: com a etapa bloqueada, mostra o aviso e leva ao Plano de Carreira.

### Preparação antes de gravar

- Janela anônima ou perfil limpo, para começar com `localStorage` vazio e mostrar o portão de cartão e as etapas bloqueadas.
- Tema claro, largura 1440 px (a mesma do projeto Playwright `desktop-1440`).
- Abrir antes o `/health/live` da API publicada, para que o servidor não esteja acordando durante a gravação (o plano Free da Render hiberna).
- Gravar cada bloco separadamente e montar na edição. Para que cada missão saia igual em uma nova tomada, abrir as missões pelas opções avançadas do Plano de Carreira com semente fixa, o que exige `Demo__PermitirParametrosDeTeste` ligado na API (padrão `true`).
- Todos os dados são da Aurora Logística, fictícia.

### Roteiro (2m50s)

- **0:00 – 0:15 | Início `/`**
  - Time **CVE-K**, trilha *Acesso à educação* e o problema do primeiro emprego em TI. Produto como orientador de carreira pela prática, limites do Mentor e dados sintéticos.
  - Apontar "Refazer o diagnóstico" ou "Fazer diagnóstico" e "Experimentar uma missão agora", dizendo que o segundo é o atalho para a banca.
- **0:15 – 0:35 | Diagnóstico `/diagnostico`**
  - Três perguntas, uma por vez, com volta à pergunta anterior. Indicação **Suporte de TI** com a regra em tela: pontos fixos por resposta, sem IA, a decisão é do aluno.
  - Confirmar e mostrar o Cartão de Perfil.
- **0:35 – 0:50 | Plano de Carreira `/plano-de-carreira`**
  - As 4 etapas: Help Desk N1 com a missão Reset de senha e desbloqueio disponível, Service Desk N1 Jr, N2 Pleno e N3 Sênior com "Bloqueada", ícone e a etapa necessária. As três Vertentes da N3 e a contagem de Causas. Certificações como referência de mercado.
  - Missão 0 guiada e Glossário rápido, que estão nesta página.
  - Ativar "Liberar todas as etapas para demonstração": selos "Liberada para demonstração" nas 3 etapas que estavam bloqueadas, indicador na barra de contexto e o aviso de que a liberação não conta como missão concluída.
- **0:50 – 1:10 | Mesa de Trabalho, Service Desk N1 Jr**
  - `pasta-rede-inacessivel`: validar a identidade da Maria (`AUR-1042`) no Comunicador para liberar o SimuDesk remoto, diagnosticar antes de alterar, corrigir a causa e resolver o chamado. Mentor no papel Copiloto.
- **1:10 – 1:30 | Mesa de Trabalho, N2 Pleno**
  - `incidente-massivo`, liberado pelo modo: Problema ITIL com 3 chamados vinculados, `AuroraGateway` restaurado e resolução em lote.
- **1:30 – 1:50 | Mesa de Trabalho, N3-C Segurança e Dados**
  - `triagem-engenharia-social`: chamado da suposta Diretoria pedindo reset sem token, KB-001, nota interna e recusa segura.
- **1:50 – 2:05 | Mesa de Trabalho, N3-A e N3-C**
  - `sre-cloud-latencia` (N3-A) com `kubectl` e `curl -I` devolvendo `200`.
  - `diagnostico-sql-readonly` (N3-C) com `SELECT` em `pedidos` e `pagamentos` achando `DUPLICADO` em `PED-1002` e o bloqueio *fail-closed* de escrita e injeção.
- **2:05 – 2:30 | Revisão `/revisao/:sessao` e Portfólio `/portfolio`**
  - Recarregar a Revisão para mostrar o endereço próprio. Replay cronológico e Juiz 360º, com o Mentor no papel Mentor: "Quem avalia é o Juiz 360º da plataforma, não este guia".
  - No Portfólio, só as missões concluídas, agrupadas por etapa, e o **Verificador offline** do Currículo Vivo (JCS RFC 8785, SHA-256 e ECDSA P-256 no navegador, sem rede), incluindo a detecção de JSON adulterado.
- **2:30 – 2:50 | Arquitetura, testes e encerramento**
  - Motor determinístico com Event Sourcing em `.NET 10` e `PostgreSQL 17`, frontend em `React 19` e `TypeScript`, modo de demonstração só no navegador e sem efeito na avaliação.
  - Contagem de testes lida do CI no dia da gravação (ver a medição abaixo) e links do repositório e da demo pública (`https://it-flight-simulator-hackbrasil.vercel.app`).
  - Destacar o custo zero em IA externa (`Dialogo:HabilitarLlm=false`).

### Caminho curto para a banca

Para o texto de submissão e o README, fora do vídeo:

1. Abrir a demo pública e acionar "Experimentar uma missão agora".
2. No Diagnóstico rápido, conferir as respostas padrão e acionar "Confirmar e iniciar". A Mesa de Trabalho de `pasta-rede-inacessivel` abre com o modo de demonstração ativo.
3. Concluir o chamado e abrir a Revisão pelo link do aviso. O modo de demonstração não cria Registro de Missão por si só, mas uma missão concluída grava Registro de Missão (visível no Portfólio), com o modo ligado ou não.
4. Ir ao Plano de Carreira: N2 Pleno e N3 Sênior já estão liberadas para visualização.
5. Para ver os portões funcionando, desativar o controle no Plano de Carreira: as etapas voltam a seguir as missões concluídas.

### Testes (medição de 17/nov/2026, branch `jornada-de-voo`)

Os números mudam a cada commit. A referência é o CI; no dia da gravação, ler o último run verde.

| Suíte | Resultado | Comando |
| :--- | :--- | :--- |
| xUnit (.NET 10) | Contagem atual no README (2344 aprovados em 18/nov/2026) e no CI, 0 falhas | `dotnet test src/backend/Simulador.slnx` |
| Vitest, jsdom e axe-core | Contagem atual no README (385 aprovados em 49 arquivos em 18/nov/2026) e no CI, 0 falhas | `npm test -- --run` em `src/frontend` (`npm.cmd` no Windows) |
| Playwright | 99 aprovados e 6 ignorados por desenho, 0 falhas, em 5 projetos (chromium 37, mobile-375 16, tablet-768 15, desktop-1280 16, desktop-1440 15) | `npx playwright test --project=<projeto>` (`npx.cmd` no Windows) |

Os 6 testes ignorados são os que só fazem sentido em uma largura (celular de 375 px e zoom no desktop-1280). Os testes de integração com PostgreSQL rodam só no CI.