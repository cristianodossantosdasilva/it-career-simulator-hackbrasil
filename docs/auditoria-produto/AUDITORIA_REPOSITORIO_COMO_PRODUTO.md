# Auditoria do repositório como produto

Escopo: branch `jornada-de-voo` (HEAD `b24f6f2`), worktree `it-flight-simulator-hackbrasil-jornada`. A leitura simula um jurado do Hack Brasil 2026 que abre o GitHub, lê a documentação, executa a API e testa a demo.

Critérios: C1 execução técnica (funciona e está completo; primeiro desempate), C2 implementação técnica, C3 impacto na trilha Acesso à educação (segundo desempate), C4 comunicação.

Ordem: por impacto na nota. Severidade: alta, média ou baixa.

## Achados

| Id | Critério | Severidade | Achado | Evidência | Correção proposta |
| --- | --- | --- | --- | --- | --- |
| R1 | C4, com efeito em C1 | alta | O README diz que o modo de demonstração "não grava Registro de Voo". O código grava o Registro quando um voo é concluído, com o modo ligado ou desligado. O modo só libera o embarque nas escalas bloqueadas. O roteiro do pitch está certo sobre isso. O jurado que testar a demo e concluir um voo verá o Registro e vai notar a contradição com a frase de abertura da seção. | README.md:71. src/frontend/src/jornada/ProvedorJornada.tsx:246-252 (`registrarVooConcluido` não consulta o modo) e :287 (chamada ao concluir). src/frontend/src/jornada/progressoRota.ts:94-100 (o modo "só muda o estado exibido e a permissão de embarque"). docs/pitch/04_ROTEIRO_DEMONSTRACAO.md:69. | Trocar a frase do README por: "O modo libera as escalas e não conta como voo concluído. Um voo concluído grava Registro de Voo, com o modo ligado ou não." Sem mudança de código. |
| R2 | C1 | média | O roteiro diz que a semente 42 da Demo rápida (`pasta-rede-inacessivel`) produz "Causa disponível do catálogo, a primeira da lista". A ordem do catálogo é C1, C2, C3, C4. Na API local, a semente 42 deixou no log a resolução de `fileserver.aurora.local` para `10.10.99.250`, que é o caso C2. A frase induz a banca a esperar C1. | docs/pitch/04_ROTEIRO_DEMONSTRACAO.md:81. src/backend/src/Simulador.Cenarios/CatalogoCenarios.cs:8 (ordem), :52 (`ipDns` é 10.10.99.250 quando a causa é C2). Medição: POST `/api/sessoes` com `cenarioId=pasta-rede-inacessivel`, `semente=42`, depois GET da projeção. | Trocar por "a semente 42 gera a causa C2 (DNS aponta para 10.10.99.250)". Confirmar a causa no ensaio antes da banca. |
| R3 | C1 | média | As instruções de execução usam `npm.cmd`, que só existe no Windows. Numa máquina Linux ou macOS, o primeiro comando do frontend falha. O bloco do backend (`dotnet run`) é multiplataforma. | README.md:104-105 (`npm.cmd install`, `npm.cmd run dev`), :118 e :128 (`npm.cmd` em testes e contagens). | Escrever `npm` como comando padrão e deixar `npm.cmd` como nota para Windows. |
| R4 | C2 | média | A CI não roda os testes de ponta a ponta Playwright. O job de frontend tem lint, Vitest e build. O README, o PRD e o pitch afirmam que as 11 jornadas E2E são verificadas, sem dizer que só rodam localmente. Um avaliador que confie no badge de CI não encontra essa verificação. | .github/workflows/ci.yml:54-82 (job frontend, sem passo Playwright). docs/PRD_HACKATHON.md:83. docs/pitch/01_ENREDO.md:61. | Adicionar job com Playwright (instalar navegadores, subir backend e frontend) ou escrever nos três documentos que o E2E roda localmente. |
| R5 | C4 | média | O PRD traz contagens de testes diferentes das do README: "25 testes Vitest", "69 testes xUnit" e "11 jornadas E2E". O README diz 2344 testes do backend e 385 do frontend, medidos em 2026-11-18. Os dois números se referem a escopos diferentes, mas o texto não diz isso, e o jurado encontra dois valores para o mesmo item. | docs/PRD_HACKATHON.md:83. README.md:123-128. | Atualizar o PRD com o escopo e os números medidos, ou remover as contagens do PRD e deixar só o README. |
| R6 | C2 | baixa | O commit 6e6d0c0 não compila sozinho. `TurnoDaCabine.tsx` importa `semAcessoRemoto` de `lab/estadoDoCenario`, arquivo que só existe a partir do commit posterior 53495ec. `git cat-file` confirma que o arquivo não está em 6e6d0c0. O HEAD não é afetado. O problema atinge quem fizer `git bisect` ou revisar commit a commit. Não rodei `tsc` nem o Vitest nesse commit: a prova é estática. | `git show 6e6d0c0:src/frontend/src/jornada/cabine/TurnoDaCabine.tsx` linha 8 (import) e linhas 157-158 (uso). Commit 53495ec cria `src/frontend/src/lab/estadoDoCenario.ts`. | Se a branch ainda não foi publicada, um rebase interativo que leve a criação de `estadoDoCenario.ts` para antes de 6e6d0c0 corrige o histórico. Se já foi publicada, não reescrever: registrar a limitação. Decisão do autor. |
| R7 | C2 | baixa | O script `check-bundle-secrets.mjs` olha só `dist/assets` (linha 4) e cinco padrões de nomes de chave LLM (linha 5). Não cobre `index.html`, nem chaves de outros provedores, como AWS (`AKIA`), GitHub (`ghp_`) ou chave privada. Hoje o repositório não tem esses padrões (busca sem resultado). | src/frontend/scripts/check-bundle-secrets.mjs:4-5. | Ampliar a raiz para `dist/` e incluir padrões genéricos (`AKIA`, `ghp_`, `BEGIN PRIVATE KEY`). |
| R8 | C2 | baixa | Três arquivos de template não têm uso: `src/frontend/src/assets/react.svg`, `vite.svg` e `hero.png`. Nenhum arquivo de `src` os referencia. | `git grep` por `react.svg`, `vite.svg` e `hero.png` em `src`: sem resultado. | Remover, com aprovação do autor, porque remoção é ação que pede confirmação. |
| R9 | C4 | baixa | Materiais internos de processo estão no repositório público: `docs/auditoria-ui-ux` (75 arquivos), `docs/auditoria-independente` (28) e `docs/rfc` (4). Os documentos de auditoria trazem cerca de 120 ocorrências de símbolos da faixa U+2600 a U+27BF e de emojis, em 10 arquivos. O README não aponta para essas pastas. A regra "PRD sem emoji" já foi aplicada ao PRD, mas não a esses arquivos. | `git ls-files docs/auditoria-ui-ux docs/auditoria-independente docs/rfc`. Maior número: docs/auditoria-ui-ux/kiro/01_DIAGNOSTICO_ANTI_CARA_DE_IA_E_BENCHMARK.md. | Mover para uma pasta de arquivo, ou indicar no README que são histórico de processo. Remover símbolos e emojis dos documentos. |
| R10 | C1 (regulamento) | baixa, a confirmar | A licença é proprietária. README e LICENSE são coerentes entre si, e a permissão cobre jurados e organizadores para ler, executar e testar. O documento interno de contexto exige só repositório público. Se o regulamento oficial pedir licença aberta, o projeto fica fora dessa exigência. | LICENSE:1-30. docs/CONTEXTO_HACK_BRASIL_2026.md:22. | Confirmar no regulamento oficial. Nenhuma mudança no repositório antes disso. |
| R11 | C3 | baixa | O impacto está descrito (público, problema e rota), mas não há dado de uso. O pitch admite isso: "Não há parceria firmada hoje" e a validação com pessoas está pendente. A admissão é honesta e fica como está. | docs/pitch/05_PERGUNTAS_DA_BANCA.md:45 e :75. docs/pitch/06_ROADMAP.md:12. | Se houver, incluir um dado de teste com usuários ou de uma turma. Caso contrário, manter a formulação atual. |

## Status das correções
Atualizado depois da auditoria, na branch `jornada-de-voo`. As seções acima descrevem o estado no momento da auditoria.
| Id | Status | O que foi feito |
| --- | --- | --- |
| R1 | Corrigido | README, `docs/DEPLOY_E_VIDEO.md` e `docs/pitch/04_ROTEIRO_DEMONSTRACAO.md` dizem que o modo não cria Registro de Voo por si só e que um voo concluído grava Registro com o modo ligado ou não. Os demais documentos do pitch não tinham a frase. |
| R2 | Corrigido | O roteiro e o quadro rápido dizem que a semente 42 gera a causa C2 (DNS em `10.10.99.250`), com a recomendação de confirmar no ensaio. |
| R3 | Corrigido | README com `npm` e nota sobre `npm.cmd` e `npx.cmd` no Windows. Os guias de vídeo e de pitch também. `AGENTS.md` mantém `npm.cmd`, por ser instrução para agentes no Windows. O `playwright.config.ts` escolhe `npm` ou `npm.cmd` pela plataforma. |
| R4 | Corrigido | Job `e2e` em `.github/workflows/ci.yml`: API em segundo plano, build do frontend, `vite preview`, Chromium do Playwright, projetos `chromium`, `mobile-375` e `desktop-1440`, relatório como artefato só em falha. `playwright.config.ts` reaproveita os servidores quando `E2E_SERVIDORES_EXTERNOS=1`. Simulado localmente na mesma sequência: 71 aprovados e 3 ignorados por desenho. O job ainda não rodou no GitHub. |
| R5 | Corrigido | PRD, Arquitetura, Cronograma, Planejamento e guia de vídeo deixam de trazer contagens próprias e apontam para a medição do README e para a CI. |
| R6 | Não corrigido | Reescrever histórico é proibido neste fluxo. A limitação fica registrada: o commit `6e6d0c0` não compila sozinho. O HEAD não é afetado. |
| R7 | Corrigido | `check-bundle-secrets.mjs` varre todo o `dist` (inclui `index.html`), ignora só arquivos binários e cobre também AWS (`AKIA`, `ASIA`), chave privada PEM, tokens GitHub (`ghp_` e similares), Google (`AIza`), Anthropic e Slack. Aceita um diretório como argumento, usado para testar com amostras. O build atual passa sem falso positivo. |
| R8 | Corrigido | Removidos `react.svg`, `vite.svg` e `hero.png`, sem referência em `src` (conferido com `git grep`). |
| R9 | Corrigido em parte | O README informa que `docs/auditoria-*` e `docs/rfc` são registro histórico do processo. Os símbolos e emojis dentro desses documentos não foram removidos. |
| R10 | Aceito | A licença fica como está até a confirmação no regulamento oficial. |
| R11 | Aceito | A formulação atual do pitch sobre a ausência de dados de uso fica. |

## Verificado sem achado

- Sementes do roteiro de reset de senha (docs/pitch/04_ROTEIRO_DEMONSTRACAO.md, seção Passo 3 e quadro rápido), conferidas na API local. Semente 3: solicitante Paulo Andrade (terceiro), log "senha incorreta, abaixo do limite de bloqueio" (SENHA_ESQUECIDA). Semente 42: solicitante Paulo Andrade, log "conta bloqueada" (CONTA_BLOQUEADA). Semente 7: solicitante Fernanda Lima (pedido direto), log de senha incorreta (SENHA_ESQUECIDA). As três afirmações do roteiro batem com o comportamento.
- A API sobe com `dotnet run` sem PostgreSQL e responde `/health/live`. Criar sessões funciona. O health check do Render também aponta para `/health/live` (render.yaml).
- Demo pública `https://it-flight-simulator-hackbrasil.vercel.app` e a rota `/plano-de-voo` respondem HTTP 200.
- Rotas do README batem com `src/frontend/src/jornada/navegacao/rotas.ts`. Nomes das escalas do README batem com `catalogoRotas.ts:63-160`. Todas as causas e cenários citados existem no backend.
- Todos os links relativos do README existem no repositório.
- Licença MIT residual aparece só onde é intencional: LICENSE:35, README:156, CRONOGRAMA (histórico) e as dependências em `package-lock.json`.
- Primeiro commit em 2026-11-14, depois do corte de 04/nov às 21h (BRT).
- Segredos: nenhuma chave conhecida no histórico do `git grep`. O único `VITE_` de chave é `VITE_CURRICULO_PUBLIC_KEY_JWK`, uma chave pública de verificação (src/frontend/src/utils/jcs.ts:37).
- Hex fora de testes: nenhum em `.ts` e `.tsx` de `src/frontend/src`. As cores ficam em `index.css`.
- Estilo inline: 4 ocorrências de `style={{`, todas com largura dinâmica. O teste `src/frontend/src/jornada/conformidade.test.ts` (linhas 60 a 80) impõe essa regra, e também a de ausência de emoji e de hex nos fontes.
- Caractere E comercial: uma ocorrência em `src/frontend/src/testes/propriedade.ts:19`, dentro de uma lista de caracteres de teste de propriedade, sem exposição na interface. Não é violação.
- TODO e FIXME em `src`: nenhum. A palavra "TODOS" em `kbCatalogo.ts:113` é texto de conteúdo.
- Termo SENAI: aparece só em testes que proíbem a marca.
- Teste de conformidade do frontend cobre emoji, estilo inline e hex.
- Acessibilidade declarada (WCAG AA, axe-core, contraste 4,5:1): 9 arquivos do frontend mencionam axe-core nos testes. O pitch admite que a validação com leitor de tela falta (docs/pitch/05_PERGUNTAS_DA_BANCA.md:45).

## Limitações desta auditoria

- Não rodei `dotnet test` nem `npm test` completos. A contagem do README (2344 e 385) não foi reproduzida. Contagens estáticas de linhas dão 167 `[Fact]` ou `[Theory]` e 382 `it(` ou `test(`, mas elas não equivalem aos testes executados.
- Não iniciei o frontend nem fiz Playwright. A verificação de UI fica para quem executar a demo.
- Docker não foi testado. `docker-compose.yml` declara os serviços `db`, `backend` e `frontend`, de acordo com o README.
- A API local foi encerrada depois dos testes. A porta 8080 ficou livre.
- Nenhuma correção de código foi feita. Todas as correções acima são propostas.

## Veredito

Pronto para leitura e execução da API. Antes da banca, corrigir R1 e R2 no README e no roteiro, que são frases que o jurado vai testar. R3 e R4 fazem diferença para quem roda em outro sistema ou confia na CI. R6 só importa se a banca navegar pelo histórico.
