# Auditoria de Código, Arquitetura e Infraestrutura (Kiro CLI)

Estado auditado: `main` em `e6aae5c` (local igual ao remoto), 15/nov/2026. Leitura estática de `src/backend` e `src/frontend`, execução de testes de backend em cópia temporária fora do repositório, e consultas de leitura às CLIs. Gravidade: Crítico, Alto, Médio, Baixo.

## 1. Evidências de execução

| Verificação | Resultado |
| :--- | :--- |
| `dotnet test` em cópia temporária, sem testes de integração com Postgres, com `docs/vetores-jcs-sha256.json` e catálogo da KB copiados para a mesma estrutura | `Simulador.Dominio.Tests` 50 de 50, `Simulador.Api.Tests` 16 de 16 |
| Mesma execução sem os arquivos de apoio (cópia só do backend) | 2 falhas: `LinksJuiz360_ResolvemNoCatalogoCompartilhadoComFrontend` e `VetoresCompartilhados_JcsSha256_BatemComFonteUnica`. Causa: dependem do layout do repositório. Não é defeito, mas é acoplamento a caminho relativo |
| Contagem estática de atributos | 41 `[Fact]` e `[Theory]` em backend; 22 `it` e `test` no Vitest; 11 `test(` no Playwright. A documentação usa 41 para xUnit, mas os casos reais são 66 por causa das `Theory` |
| Frontend (`lint`, `vitest`, `build`, Playwright) | **Não reexecutado** (escreveria em `src/frontend`); DevLedger registra Vitest 24 e Playwright 11 |
| Testes de integração com Postgres (`Simulador.Infra.IntegrationTests`) | **Não executados**; DevLedger registra ressalva "Docker/Postgres local bloqueado". Caminho de produção (Postgres) sem prova recente |
| Sonda de canonicalização (projeto temporário em `%TEMP%`, fora do repositório, usando o código de `JcsCanonico`) | Saída: `{"acento":"Prontid\u00E3o","cargoAtual":"Analista Jr (N1)","competencias":["Conformidade \u0026 Governanca",...],"xpTotal":150}` |

## 2. Achados no backend

### B-01 Crítico. Canonicalização JCS fora do RFC 8785
- Arquivo: `src/backend/src/Simulador.Avaliacao/Juiz360.cs`, classe `JcsCanonico` (a partir da linha 410), método `EscreverElemento`.
- Causa: usa `Utf8JsonWriter` com codificador padrão, que escapa o símbolo E comercial, `<`, `>`, `'`, `+` e todo caractere não ASCII como `\uXXXX`. O RFC 8785 exige saída com escapes mínimos e caracteres literais. `jcs.ts` (linhas 1 a 20) usa `JSON.stringify`, que mantém o caractere literal.
- Efeito: hash de backend e hash do verificador divergem se qualquer string contiver esses caracteres. Isso já ocorre em três competências (`Juiz360.cs:93`, `:298`, `:299`) e ocorrerá com qualquer texto acentuado futuro (a interface atual evita acentos, o que mascara o problema).
- Por que os testes passam: `docs/vetores-jcs-sha256.json` só tem texto ASCII sem E comercial. Os vetores `Analista Jr (N1)` e `Defesa contra Engenharia Social` não exercitam o caso.
- Correção: serializar com `JavaScriptEncoder.UnsafeRelaxedJsonEscaping` somente não basta (ainda escapa alguns caracteres); escrever o serializador de strings do RFC 8785 ou usar `JsonWriterOptions { Encoder = JavaScriptEncoder.Create(UnicodeRanges.All) }` e validar com vetores. Números: usar a representação ECMAScript (`1.0` contra `1`). Acrescentar vetores com E comercial, `<`, aspas, barra invertida, acentos, emoji e números não inteiros.
- Gravidade acentuada pelo roteiro do vídeo, que termina no verificador.

### B-02 Crítico. Hash sem assinatura permite forjar Currículo Vivo
- Arquivos: `Program.cs:336` em diante (`/api/carreira/resumo`) e `src/frontend/src/utils/jcs.ts` (função `verificarCurriculoVivoJson`).
- O verificador recalcula o hash do **próprio JSON recebido** e o compara ao campo `integridade.hash` do **mesmo JSON**. Quem edita xp, cargo e competências recalcula o hash e o verificador responde "íntegro". Não há chave privada do servidor; não há registro server-side para consulta.
- O backend também não pode confirmar depois: sessões expiram em 30 dias (`Sessao:TtlDias`), então a verificação a partir de `sessoesConfirmadas` deixa de ser possível.
- Correção mínima (cerca de 1 dia): assinar o JCS do núcleo com Ed25519; chave privada em variável de ambiente do servidor, nunca em `VITE_`; publicar chave pública com `kid`; incluir `emitidoEm` e `algoritmo`. O verificador valida a assinatura com WebCrypto Ed25519 (disponível nos navegadores atuais) ou com biblioteca pequena de curva Ed25519. Manter o hash como checagem secundária.
- Correção de médio prazo: credencial no padrão Open Badges 3.0 ou Verifiable Credentials 2.0, com revogação e vínculo a titular opcional.

### B-03 Alto. Limitador de taxa baseado em IP da conexão
- `Program.cs:79` a `:94`. Usa `ctx.Connection.RemoteIpAddress`. Não há `UseForwardedHeaders` nem configuração de proxy confiável (busca por `Forwarded` não retornou nada em `Program.cs`).
- Atrás do balanceador da Render, o IP visto é do proxy; todos os usuários caem no mesmo balde (120 por minuto). Em avaliação por vários jurados e com recarga de projeção a cada ação, 429 é provável.
- Hipótese de alta probabilidade; **não testei em produção** para não prejudicar o serviço.
- Correção: `ForwardedHeadersOptions` com `XForwardedFor` e limpeza das redes e proxies conhecidos (a Render está na frente e o app só recebe tráfego dela), teste automatizado com dois cabeçalhos diferentes, e limite por IP e por sessão separados.

### B-04 Alto. Parâmetros de teste expostos a clientes anônimos
- `Program.cs:165` e `:166`, `CriarSessaoDto` em `:450`. `CausaForcada`, `Semente` e `VersaoManifesto` vêm do corpo da requisição.
- Efeito: o Chaos Injector pode ser contornado por qualquer usuário; XP do Currículo Vivo fica sem valor; qualquer um escolhe a causa mais fácil.
- Correção: aceitar só se `Demo:PermitirParametrosDeTeste=true`, desligado no ambiente de produção usado para avaliação, mantendo ligado em testes e em um botão "semente fixa" do vídeo.

### B-05 Médio. `POST /api/carreira/resumo` sem posse de sessão e com leitura múltipla
- `Program.cs:336` a `:440`. Aceita até 20 GUIDs de sessão arbitrários, reconstrói cada uma e avalia. Cada leitura faz duas consultas ao Postgres com conexão nova do pool.
- Efeito: qualquer um que conheça GUIDs inclui sessões alheias; amplificação de CPU e de rede em instância gratuita de 0,1 CPU.
- Correção: segredo por sessão emitido na criação e enviado no cabeçalho; ou limitar a uma chamada por segredo e por minuto.

### B-06 Médio. Corpo de ação sem limite
- `ExecutarAcaoDto.Dados` aceita dicionário arbitrário e é gravado como JSONB. Chat tem limite de 500 caracteres (`Program.cs`, verificado), mas ações não.
- Correção: `MaxRequestBodySize` de poucos KB e validação por tipo de ação.

### B-07 Médio. Sem limpeza de sessões expiradas
- `schema.sql` cria `ix_sessoes_expira`, mas não há `DELETE`, `BackgroundService` nem `IHostedService` (busca confirmou).
- Efeito: banco cresce; quota de armazenamento do plano gratuito.
- Correção: limpeza no início da aplicação e a cada hora com `DELETE FROM sessoes WHERE expira_em < now() - interval '1 day'` (eventos caem por `ON DELETE CASCADE`).

### B-08 Médio. Reconstrução completa do estado a cada requisição
- Cada leitura carrega todos os eventos e reconstrói a projeção (`Projecao.Reconstruir`). Para sessões curtas, está correto e simples; com 20 sessões por resumo e duas viagens ao banco por sessão, a latência soma entre regiões distintas.
- Correção quando necessário: snapshot a cada N eventos; por enquanto, medir.

### B-09 Médio. Postgres: round-trip JSON diferente do InMemory
- `PostgresEventStore.ConverterJsonElement` devolve `long` e `double` para números, `Dictionary<string, object?>` para objetos. O InMemory preserva os objetos originais. Qualquer código que faça cast direto (`(int)` sobre `object`) pode se comportar diferente entre provedores.
- Mitigação: testes de integração com Postgres e execução em CI (hoje bloqueados localmente).

### B-10 Baixo. Esquema com retentativas silenciosas
- `InicializarSchemaAsync` tenta 5 vezes com 1, 2, 4 e 8 segundos e propaga na última. Aceitável. Na frente de Neon com suspensão, o primeiro acesso pode somar 1 a 3 segundos.

### B-11 Baixo. Gramática SQL como simulação
- `Motor.cs:419` a `:430` (bloqueio) e `:923` a `:947` (respostas fixas). A gramática (linhas 766 a 846) é fechada e testada. As saídas são fixas por tabela e por `group by status`; não existe motor SQL. Isso é honesto como cenário, mas a interface deve declarar "consulta didática sobre dataset fixo" para não ser contestada em "execução técnica".

### B-12 Baixo. `DialogoComFallback` ignora chave e flag
- `ClienteDialogo.cs`: o construtor descarta `apiKey` e `habilitarLlm` (`_ = apiKey;`). Não há chamada de rede. Posicionar o produto como "diálogo roteirizado e auditável" e não como "agentes de IA" para evitar descompasso com a banca.
- Heurística de injeção por palavras-chave; inclui token canário `segredo_sintetico`. Útil como demonstração; não representa defesa real.

### B-13 Baixo. Dockerfile
- `src/backend/Dockerfile`: executa como root, sem `HEALTHCHECK`, usa `COPY . .` sem `.dockerignore`. Frontend usa Node 22 enquanto Vercel usa 26.
- Correção: usuário não privilegiado da imagem base, `HEALTHCHECK` em `/health/live`, `.dockerignore`.

### B-14 Baixo. Docker Compose
- Postgres expõe `127.0.0.1:5432` (adequado), senha de desenvolvimento padrão `simulador_dev_only` (ok para local). Nginx passa `X-Real-IP`, que o backend não lê, repetindo B-03 em ambiente local.

### Pontos positivos verificados no backend
- Consultas parametrizadas em todo o `PostgresEventStore`.
- Controle de concorrência: `SELECT ... FOR UPDATE`, comparação de `seq` e tratamento de violação de unicidade como conflito.
- `UseExceptionHandler` com `ProblemDetails`; OpenAPI e Swagger só em desenvolvimento.
- CORS com origens declaradas (testado: origem estranha sem cabeçalho de permissão).
- Determinismo: busca por `DateTime`, `Random`, `Guid.NewGuid` e `Stopwatch` em Domínio, ITSM e Avaliação não retornou nada. `SplitMix64` com semente.
- Esquema com `schema_versao` e criação idempotente.

## 3. Achados no frontend

### F-01 Alto. Interface exibe E comercial e texto sem acentos
- Demo publicado: três títulos com E comercial (Triagem, Incidente Massivo, Incidente Cloud). Fonte: `TelaInicial.tsx` (títulos dos níveis), `e2e/jornadas.spec.ts:311` (teste com o texto), comentários em `kbCatalogo.ts` e `KbCatalogo.cs`.
- Regra violada: `AGENTS.md`.
- Texto em português sem acentos em toda a interface.
- Correção: migração atômica incluindo seletores dos testes e competências do backend, em coordenação com B-01.

### F-02 Médio. Verificador sem validação de esquema interno
- `jcs.ts` ordena competências e usa `sessoesConfirmadas` tal como vem do JSON. Não valida tipos internos nem tamanho máximo do texto colado. Baixo risco (executa só no navegador), mas rejeitar entradas acima de 256 KB.

### F-03 Médio. Persistência local de sessões
- `App.tsx:98` a `:111` usa `localStorage` para lista de sessões. Cota e acesso por scripts de terceiros (inexistentes hoje). Sem versionamento do formato. Adicionar chave de versão e limpar sessões expiradas.

### F-04 Baixo. Falta política de cabeçalhos de segurança
- A Vercel devolve apenas `Strict-Transport-Security` e `Access-Control-Allow-Origin` padrão; nenhum CSP, `X-Content-Type-Options` ou `X-Frame-Options`. Adicionar em `vercel.json` (`headers`).

### F-05 Baixo. Dependências recentes e versões
- `typescript ~7.0.2`, `vite ^8.3.6`, `vitest ^5.1.0`, `react ^19.3.1`. Manter `package-lock.json` e registrar Node alvo em `engines`.

### F-06 Baixo. Verificação de segredos limitada
- `scripts/check-bundle-secrets.mjs` procura 5 padrões (nomes de variáveis de chave e prefixo `sk-proj-`). Ampliar para padrões genéricos de token e usar também varredura no repositório (por exemplo, hook de pré-commit).

### Pontos positivos verificados no frontend
- `ErrorBoundary` em `App.tsx`, cliente HTTP com tentativas apenas em 502, 503 e 504 e aviso de servidor acordando.
- Bundle principal de 284 KB (JS) e 17 KB (CSS) no `dist/` encontrado, adequado para conexões lentas.
- Testes de acessibilidade com axe-core e função `razaoContraste`.
- Teste E2E de sem rolagem horizontal em 375, 768 e 1280 px.

## 4. Infraestrutura e CLIs (somente leitura)

| Verificação | Resultado |
| :--- | :--- |
| `gh auth status` | Autenticado, escopos repo, workflow, read:org, gist |
| `gh repo view` | Repositório público, branch padrão `main`, criado em 14/nov/2026 17:29 UTC, push mais recente 15/nov 18:35 UTC |
| `gh run list` | Nenhuma execução (sem GitHub Actions) |
| `gh api commits` | Topo remoto: `e6aae5c`, `7be12f4`, `e0bad6a`. Commit `3ff0faa` (mensagem com rótulo W22, mesma hora de `7be12f4`) existe no repositório remoto mas **sem ancestral comum** com `e6aae5c` |
| `vercel whoami`, `project ls`, `alias ls`, `ls` | Projeto `it-flight-simulator-hackbrasil` em equipe `core-hub-lab`, domínio `itflight.nascia.ia.br` e `it-flight-simulator-hackbrasil.vercel.app`, implantação em produção "Ready" |
| Acesso HTTP | `https://it-flight-simulator-hackbrasil.vercel.app` responde 200; `https://itflight.nascia.ia.br` retorna 200 com **tela de login Cloudflare Access** (cabeçalho `CF-Access-Domain`, título "Sign in") |
| `render services` | `it-flight-simulator-api` (web service, runtime docker, plano free, região Oregon, auto deploy na `main`, última atualização 15/nov 04:24 UTC) e outro serviço gratuito de outro projeto (`vitru-agent-gateway`) na mesma conta |
| `/health/ready` | `{"status":"ready","store":"Postgres"}` em 13,8 s na primeira chamada (inclui ativação do serviço) |
| CORS | Origem do Vercel e do domínio personalizado recebem `Access-Control-Allow-Origin`; origem estranha não recebe |
| `neonctl projects list` (por organização) | Projeto `it-flight-simulator-hackbrasil`, PostgreSQL 17, AWS `us-east-2` (Ohio), computação 0,25 a 2 CU, criado em 14/nov 17:26 UTC; outro projeto da conta em `sa-east-1` |
| `cloudflare` (CLI `cf`) | Um perfil de autenticação chamado `default`; não listei zonas para limitar escopo. A presença do Access no domínio indica regra de acesso ativa |

**Lacunas entre código local, GitHub e deploy**
1. Documentação com 8 arquivos modificados e 1 novo sem commit; o remoto não contém a nova matriz pedagógica.
2. Histórico remoto e DevLedger divergem (ver seção 5).
3. Domínio personalizado protegido por login; submissão deve usar o endereço público.
4. Região da API (Oregon) diferente da do banco (Ohio).
5. Auto deploy na `main` da Render versus congelamento de 1 a 11/dez (regulamento 8.4): qualquer commit nesse período reimplanta e pode desclassificar.
6. Duas aplicações gratuitas na mesma conta: confirmar cota mensal de horas antes de manter a API acordada com monitor externo.
7. Sem CI e sem teste de Postgres automatizado.

## 5. DevLedger (somente leitura)

- Banco íntegro (`PRAGMA integrity_check` ok e `foreign_key_check` sem violações). Repositório central: `main`, limpo, HEAD igual ao registrado.
- Projeto `simulador-carreira-ti`: estado corrente com `root_path` e `head_sha` do **repositório do próprio DevLedger**, não do repositório do Hackathon nem do precursor. Os itens de estado citam commits `3ff0faa`, `83c67c5` e `4f2c756` e contagens Dominio 50, Api 16, Vitest 24, Playwright 11. Conferi: `3ff0faa` existe só no remoto e sem ancestral comum com a `main` atual; os outros dois não confirmei.
- Estágio vigente: `C0-CONCEPCAO` (aberto em 11/nov), ainda marcado em andamento.
- Próxima ação registrada: rodada da "Sala" multi-IA suspensa por limite de uso, com retomada planejada.
- Ressalvas registradas: Docker e Postgres locais bloqueados; tabela responsiva manual de Chat e Intranet pendente.
- Conclusão: o DevLedger não é fonte confiável do estado Git do produto neste momento. Registrar novo estado com a raiz correta e o HEAD real.

## 6. Plano técnico antes de programar novas telas educacionais

Ordem recomendada (1 a 2 dias para o bloco A):

**Bloco A, correções que mudam contratos:**
1. B-01 serializador RFC 8785 e vetores novos.
2. F-01 remoção de E comercial e acentuação (strings, seletores, competências) em uma única mudança.
3. B-02 assinatura Ed25519 e novo formato do Currículo Vivo (campos `kid`, `emitidoEm`, `assinatura`).
4. B-03 cabeçalhos encaminhados e teste.
5. B-04 parâmetros de teste protegidos.
6. B-05 e B-06 posse da sessão e limite de corpo.

**Bloco B, fundação:**
7. GitHub Actions: `dotnet test` (com Postgres como serviço, incluindo integração), `npm ci`, `lint`, `vitest --run`, `build`, e verificação de segredos.
8. LICENSE e README com matriz de status.
9. Limpeza de sessões (B-07), Dockerfile (B-13), cabeçalhos de segurança (F-04).
10. Mover API para a região do banco ou o contrário.

**Bloco C, qualidade para a banca:**
11. Cobertura mínima nova: teste de vetores com acento e símbolo, teste de forja do Currículo, teste de limite de taxa por IP, teste de parâmetros de teste desabilitados.
12. Teste manual com leitor de tela do Nível 2.
13. Teste de carga leve (20 usuários simultâneos por 2 minutos) contra a instância Starter para ver latência e 429.

Somente depois, desenhar as telas educacionais (Missão 0, Debrief, Glossário) no mesmo padrão de componentes.
