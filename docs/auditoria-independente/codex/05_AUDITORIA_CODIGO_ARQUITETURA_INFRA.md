# Auditoria de código, arquitetura e infraestrutura

## Estado da auditoria

Branch `main`, HEAD `e6aae5c`, árvore de trabalho já suja por alterações documentais e artefatos preexistentes; não atribuí essas mudanças à auditoria. Snapshot DevLedger de 15/11 às 04:40 UTC aponta checkout correto limpo em `4f2c756`. Divergência de HEAD e sujeira confirmadas. Snapshot adicional aponta o mesmo slug para a raiz DevLedger. SQLite `integrity_check` retornou `ok`; `foreign_key_check` não retornou violações.

Graphify preexistente reportava 729 nós, usado só como índice complementar. Código foi conferido diretamente. Testes e builds não executados para evitar artefatos em `src/`; contagens documentadas não são validação desta auditoria.

## Achados por arquivo e linha

| Prioridade | Evidência | Achado |
|---|---|---|
| P0 produto | `src/frontend/src/App.tsx:11-12`; `src/frontend/src/index.css:1-20`; `docs/PRD_HACKATHON.md:26-40` | Frontend é workstation escura sem páginas educacionais. PRD promete fluxo de aulas e oito laboratórios. |
| P1 autorização | `src/backend/src/Simulador.Api/Program.cs:146-225,231-259,268-305` | Rotas por GUID não mostram identidade ou autorização. GUID é bearer capability: quem o obtém pode ler e alterar sessão. |
| P1 assinatura | `src/backend/src/Simulador.Api/Program.cs:409-424`; `src/frontend/src/utils/jcs.ts:1-25` | SHA-256/JCS detecta mudança relativa ao digest, mas qualquer pessoa pode fabricar JSON e hash. Não autentica emissor ou competência. |
| P1 retenção | `Program.cs:165-181,191-192`; `schema.sql:1-25` | TTL de 30 dias bloqueia acesso, mas nenhum expurgo foi observado. Dados expirados podem acumular. |
| P1 schema | `Program.cs:96-101`; `PostgresEventStore.cs:63-86`; `schema.sql` | Startup executa SQL de criação e inserção de versão. Não é pipeline de migrations versionado e controlado. |
| P1 imutabilidade | `schema.sql:17-25`; `PostgresEventStore.cs:116-206` | Aplicação só insere no fluxo normal, mas banco não tem hash chain ou política que impeça UPDATE/DELETE. Append-only é convenção, não garantia física. |
| P2 concorrência | `Program.cs:210-225`; `PostgresEventStore.cs:154-205` | Store Postgres bloqueia sessão e compara sequência. Resposta assume que lista de eventos novos não está vazia; confirmar invariantes em testes. |
| P2 SQL | `Motor.cs:764-847,923-963` | Parser restrito rejeita tokens fora da gramática e consulta dados sintéticos em memória. Adequado como simulação, não prova isolamento read-only de banco real. |
| P2 memória | `EventStore.cs:25-71` | Lock protege lista, mas restart perde sessões e instâncias não compartilham estado. Não anunciar como persistência. |
| P2 limites | `Program.cs:79-93,107-109` | Rate limit global 120/min por IP, sem limite dedicado à criação. Validar IP confiável de proxy e partição. CORS não substitui autenticação. |
| P2 conexão | `PostgresEventStore.cs:35-60` | Normalização de URI e SSL Require; verificar validação de certificado, pool e conexão sob carga no provedor. |
| P2 browser | `App.tsx:100-130` | IDs de sessão ficam em localStorage. Perfil local compartilhado ou XSS expõe capability. Minimizar retenção. |
| P2 interface | `TelaInicial.tsx:15-55`; `index.css:1-20,341-354` | Catálogo de níveis e workstation; tema escuro fixo e responsividade básica. Não corresponde ao tema educacional claro prometido. |
| P2 JCS | `src/frontend/src/utils/jcs.ts:1-18`; `src/backend/src/Simulador.Avaliacao/Juiz360.cs:410-470` | Verificar vetores RFC para números, Unicode e limites. Manter `docs/vetores-jcs-sha256.json` sincronizado. |
| P2 segredo | `src/frontend/scripts/check-bundle-secrets.mjs`; `package.json:7-14` | Build chama script de segredo. Nenhuma execução foi feita nesta auditoria. Fazer gate em release autorizada. |

## Comportamento observado em código

`CatalogoCenarios.cs` aceita cinco IDs e versões. `Motor.cs` transforma comando em estado e eventos; `Projecao.cs` verifica sequência e minuto simulado. PostgreSQL parametriza valores e grava em transação; chave primária `(sessao_id, seq)` impede repetição. API tem health live e ready, exception handler, CORS configurável e rate limiting.

A arquitetura distingue `InMemoryEventStore` e Postgres. Blueprint de produção configura Postgres, mas o in-memory perde dados. Schema inicializa no startup. O banco não tem trilha criptográfica de integridade nem política de imutabilidade.

## Protótipo educacional

O HTML local é independente, renderiza páginas via `innerHTML`, guarda estado no browser e exporta currículo. Tutor é roteirizado, progresso é local e avaliador é heurístico. Isso serve para avaliar fluxo e conteúdo, não integração, sincronização, IA, certificação ou algoritmo adaptativo. Navegador indisponível impediu sessão interativa, mas screenshots preexistentes de 375 px foram lidos. O protótipo apresenta navegação superior com overflow horizontal visível e opções parcialmente ocultas; o app real usa cartões empilhados, mas conserva tema escuro e linguagem técnica. Snapshots não substituem teste interativo nem certificam acessibilidade.

## Serviços externos e CLIs

- **GitHub CLI:** autenticado. Repo público criado em 14/11/2026. Sem push ou inspeção profunda de workflows.
- **Vercel CLI:** lista projeto e domínio de produção; `inspect` marcou deployment production como `Ready`, criado em 15/11. Não presumir que isso comprova estado do banco.
- **Render CLI:** lista um web service da API. Nenhum deploy, restart, update ou leitura de variáveis.
- **Neon CLI:** listagem pediu escolha de organização; consulta com organização inexistente falhou. Não selecionei contexto ambíguo. Banco e métricas não confirmados.
- **Cloudflare CLI:** `whoami` confirmou autenticação. Não houve consulta a zone, DNS, WAF ou variáveis.
- **DevLedger:** consulta somente leitura. Projeto tem snapshot conflitante com checkout; sem escrita.

## Ordem técnica antes de novas telas educacionais

1. Fechar escopo da demo e separar produto funcional de mock e roadmap.
2. Definir autorização por sessão, expiração, limpeza, limites e testes de concorrência.
3. Versionar migrations e separar permissões de runtime e schema.
4. Definir assinatura, rotação, revogação e minimização no Currículo Vivo.
5. Verificar acessibilidade em mobile, teclado e leitor de tela no produto integrado.
6. Executar suites e builds em ambiente isolado quando houver autorização para gravar artefatos de build em `src/`.


