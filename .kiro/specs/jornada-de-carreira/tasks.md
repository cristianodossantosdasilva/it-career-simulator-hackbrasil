# Implementation Plan: Jornada de Missão

## Overview

Implementação em TypeScript (React 19 e Vite) em `src/frontend`, sem mudança em `src/backend` e sem dependência nova. Todo o trabalho acontece numa worktree própria, na branch `jornada-de-carreira` criada a partir da `main`. O checkout atual (`D:\Projetos\Ativos\it-career-simulator-hackbrasil`, branch `home-vocacional`) não é editado.

A ordem segue sete fases, cada uma terminada por um checkpoint com commit local:

1. Roteador e contextos: refatoração do `App.tsx` sem mudar comportamento, com os testes atuais passando.
2. Páginas por rota, com o armazenamento local, os portões, a Mesa de Trabalho, o menu e o Mentor de que elas dependem.
3. Catálogos de certificações e parceiros, e o Catálogo completo.
4. Modo de demonstração e Diagnóstico Rápido.
5. Limpeza: `TelaInicial` e `TabelaMissoes` aposentadas, specs Playwright atualizadas.
6. Validação: lint, Vitest, build, Playwright em 375 e 1440 px, contraste, varreduras e `dotnet test`.
7. Documentação: `docs/DEPLOY_E_VIDEO.md` com o roteiro novo do vídeo.

Os catálogos estritamente necessários às fases anteriores (`catalogoRotas.ts` para resolver `/mesa-de-trabalho/:missao` e `catalogoVocacional.ts` para o Diagnóstico) entram na fase em que são usados pela primeira vez. A fase 3 acrescenta os catálogos que só o Catálogo e o Plano de Carreira usam.

O Catálogo_de_Rotas distribui 7 cenários pelas 4 etapas, com a N3 Sênior dividida em três Vertentes. Missões e Causas que o backend ainda não oferece (`reset-senha-desbloqueio`, `falha-backup-restore` e as Causas SENHA_ESQUECIDA, CONTA_BLOQUEADA, SENHA_EXPIRADA, C4, EMAIL_PROVEDOR, DOMINIO_SUSPENSO, REPOSITORIO_CHEIO e CADEIA_CORROMPIDA) ficam com status em preparação: visíveis, sem Iniciar e sem sessão criada. A tarefa 18 troca esses status quando a spec `cenarios-por-etapa` entregar os itens no backend. Depois de 30 de novembro de 2026, 23h59, a troca de status fica fora da entrega do hackathon.

Prazo: tudo commitado na branch `jornada-de-carreira` antes de 30 de novembro de 2026, 23h59 (congelamento do repositório). Push e merge só com autorização explícita do usuário.

## Tasks

- [x] 0. Preparar worktree e branch isolados
  - [x] 0.1 Criar a worktree e a branch a partir da `main`
    - No checkout atual, executar somente leitura: `git status --short --branch` e `git worktree list`. Conferir que a branch `home-vocacional` tem as 4 alterações locais (`README.md`, `docs/auditoria-ui-ux/ciclo2/09_REGISTRO_PROGRESSO.md`, `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md` e `docs/auditoria-ui-ux/ciclo2/10_linha_de_base.json`) e não tocar nelas
    - Executar `git worktree add D:\Projetos\Ativos\it-flight-simulator-hackbrasil-jornada -b jornada-de-carreira main`
    - Conferir na worktree: `git status` limpo, `git rev-parse --abbrev-ref HEAD` igual a `jornada-de-carreira` e HEAD igual ao HEAD da `main`
    - Proibido: checkout, stash, commit ou reset no checkout `home-vocacional`, push de qualquer branch sem autorização do usuário
    - _Requirements: 16.6_
  - [x] 0.2 Preparar dependências e medir a linha de base
    - Conferir `git diff --stat main home-vocacional -- src/frontend/package.json src/frontend/package-lock.json` (vazio na leitura do design). Se vazio, criar a junction `New-Item -ItemType Junction -Path D:\Projetos\Ativos\it-flight-simulator-hackbrasil-jornada\src\frontend\node_modules -Target D:\Projetos\Ativos\it-career-simulator-hackbrasil\src\frontend\node_modules`. Se não vazio, executar `npm.cmd ci` em `src/frontend` da worktree
    - Conferir que `node_modules` não aparece em `git status` da worktree
    - Executar na worktree, em `src/frontend`: `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build`. Anotar a contagem de testes atual como linha de base, sem gravar arquivo novo no repositório
    - _Requirements: 16.5, 16.7_
  - [x] 0.3 Levar a spec para a worktree e mapear o impacto
    - Copiar (sem mover) `requirements.md`, `design.md`, `tasks.md` e `.config.kiro` deste diretório para `D:\Projetos\Ativos\it-flight-simulator-hackbrasil-jornada\.kiro\specs\jornada-de-carreira\`. A partir daqui o progresso das tarefas é marcado na cópia da worktree. A pasta `.kiro` só entra em commit com pedido do usuário
    - Usar `graphify` com `--code-only` em `src/frontend` da worktree (reutilizar `graphify-out/graph.json` se existir) para listar dependentes de `App.tsx`, `WorkstationInner`, `TelaInicial.tsx`, `TabelaMissoes.tsx`, `BarraSuperior.tsx` e `api/client.ts`. Registrar a limitação e usar `git grep` como alternativa se `graphify` estiver indisponível
    - Ler `docs/design/DESIGN.md` seções 3 e 4 por `git show 7ab7c22:docs/design/DESIGN.md`, somente leitura
    - _Requirements: 14.1, 14.2, 14.3, 16.4_

- [x] 1. Fase 1: navegação pura e roteador
  - [x] 1.1 Criar o auxiliar de teste de propriedade
    - `src/frontend/src/testes/propriedade.ts`: `criarGerador(semente)` com mulberry32 e `paraTodo(nome, gerar, verificar, opcoes)` com padrão de 100 execuções e semente 20261130, falhando com nome, execução, semente e valor em JSON
    - Sem dependência nova no `package.json`
    - _Requirements: 16.7_
  - [x] 1.2 Criar `status.ts` e `catalogoRotas.ts`
    - `src/frontend/src/jornada/catalogos/status.ts`: `StatusDisponibilidade` e `APRESENTACAO_STATUS`
    - `src/frontend/src/ui/catalogoIcones.ts`: só os ícones `status-disponivel`, `status-preparacao` e `status-futuro`, para que `APRESENTACAO_STATUS` compile com `NomeIcone`
    - `src/frontend/src/jornada/catalogos/catalogoRotas.ts`: tipos `Causa` (código e status), `Missao` (id, status, causas, `titulo` e `descricao` opcionais), `Vertente`, `Etapa` (`missoes` nas etapas 1 a 3, `vertentes` só na N3 Sênior) e `Rota`; `CATALOGO_ROTAS` com Suporte de TI, as 4 etapas na ordem e os 7 cenários, status de Missões e Causas pela tabela de distribuição do design; rotas futuras em preparação ou futuro; `IdRota`, `IdMissao`, `IdVertente`, `rotaPorId`, `escalaDaMissao` (com a Vertente), `missoesDaEscala` e `MISSAO_DEMONSTRACAO`
    - `src/frontend/src/jornada/catalogos/catalogos.test.ts`: os 7 cenários em exatamente uma etapa e, na N3 Sênior, em exatamente uma Vertente; status das Missões e das Causas iguais aos dos Requirements 6.4 e 6.5; Vertentes na ordem N3-A, N3-B, N3-C; `missoes` ou `vertentes` vazio em cada etapa, nunca os dois preenchidos; cada etapa de rota disponível com ao menos uma Missão registrada; cada Missão com nível em `LEVELS` (por `LEVELS.find`) ou com `titulo` e `descricao`; só Suporte de TI disponível; `escalaDaMissao(MISSAO_DEMONSTRACAO)` não nulo e com Missão disponível
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.2, 10.4_
  - [x] 1.3 Implementar `rotas.ts`
    - `src/frontend/src/jornada/navegacao/rotas.ts`: `IdPagina`, `RotaResolvida`, `NOME_PAGINA`, `resolverEndereco` (total, com barra final aceita, `:missao` validada no catálogo, `:sessao` com `^[A-Za-z0-9-]{1,64}$`, `?motivo=sem-cartao` e `?modo=rapido` independentes, `?causa` aceito só com Causa disponível da Missão e nulo nos demais casos), `enderecoDe` e `tituloDocumento`
    - _Requirements: 1.1, 1.7, 2.1, 7.7, 12.1, 13.1, 13.2_
  - [x] 1.4 Escrever testes de propriedade de resolução de endereço
    - `src/frontend/src/jornada/navegacao/rotas.test.ts`
    - **Property 1: Resolução de endereço total e única**
    - **Validates: Requirements 1.1, 1.4, 1.7, 12.1, 13.1, 13.2**
    - **Property 2: Ida e volta de endereço**
    - **Validates: Requirements 1.1, 1.4, 7.7, 12.1**
  - [x]* 1.5 Escrever teste de propriedade do título do documento
    - Acréscimo em `rotas.test.ts`
    - **Property 3: Título do documento**
    - **Validates: Requirements 2.1, 2.3, 13.3, 16.1**
  - [x] 1.6 Implementar `navegador.ts` e `LinkInterno.tsx`
    - `navegar(href, { substituir })`, `useLocalAtual()` com `useSyncExternalStore` sobre `popstate`, origens `inicial`, `interna` e `historico`, chave incremental e rolagem ao topo só na navegação interna
    - `LinkInterno`: elemento `a` com `href` real; intercepta só botão principal, sem Ctrl, Meta, Shift ou Alt, sem `target`, `href` iniciando em `/` e mesma origem; repassa `aria-current` e aceita `substituir`
    - `src/frontend/src/jornada/navegacao/navegador.test.tsx` (obrigatório): `pushState` acrescenta entrada, `popstate` muda a origem para histórico, `LinkInterno` não intercepta Ctrl, Meta, Shift, `target` nem origem externa
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 1.7 Implementar `Roteador`, foco e região viva
    - `useTituloEFoco.ts`: `document.title` por `tituloDocumento`; fora da carga inicial, foco no `#conteudo-pagina h1` com `tabindex="-1"`
    - `MolduraPagina.tsx` (link de salto e `main#conteudo-pagina`), `RegiaoAnuncioJornada.tsx` (`role="status"`, `aria-live="polite"`, persistente entre páginas) e `Roteador.tsx` com limite de erro por página com `key={local.chave}`
    - Nesta fase o `Roteador` renderiza a árvore atual (`TelaInicial` ou Workstation) para todo endereço, para não mudar comportamento
    - `src/frontend/src/index.css`: regra `#conteudo-pagina h1:focus` com `--focus-ring-width`, `--focus-ring` e `--focus-ring-offset`
    - `src/frontend/src/jornada/navegacao/foco.test.tsx` (obrigatório): foco no h1 depois de navegação interna e não na carga inicial, título no formato do Requirement 2.1, região viva mantida entre navegações, erro numa página não derruba a moldura
    - _Requirements: 2.1, 2.2, 2.4, 14.7_

- [x] 2. Fase 1: contextos e refatoração do `App.tsx`
  - [x] 2.1 Criar `ProvedorJornada` com `ContextoAcademia` e `ContextoVoo`
    - `src/frontend/src/jornada/ProvedorJornada.tsx`: mover sem mudança de lógica o estado da Academia (`estadoAcademia`, `resumoCarreira`, `apelido`, `usePomodoro`) de `WorkstationInner` e `TelaInicial`, e o estado da Workstation (`sessaoId`, `sessao`, `aba`, `gaveta`, `tutorMsgs`, `ocupado`, `aviso`, `replay`, `nivel1Passos`, `historicoTerminal`, KB) com `executarAcao`, `enviarChat`, `carregarReplay`, `abrirKbDoItsm`, `fecharArtigoKb` e `iniciarSessao`
    - Mover `obterProximaDicaMissao` de `App.tsx` para `src/frontend/src/lab/dicaMissao.ts` sem mudança
    - `TelaInicial.tsx` passa a ler a Academia do contexto
    - _Requirements: 12.2, 12.3, 16.6_
  - [x] 2.2 Reescrever `App.tsx` como composição
    - `App.tsx` fica com `ErrorBoundary`, `ProvedorJornada`, `AppShell` e `Roteador`; `WorkstationInner` passa a consumir `ContextoVoo` e `ContextoAcademia`
    - `App.test.tsx`, `EstadoInicial.test.tsx`, `progressoNivel.test.tsx`, `EstudoViews.test.tsx`, `ReplayView.test.tsx` e `SplitLab.test.tsx` passam sem alteração
    - _Requirements: 12.3, 16.7_

- [x] 3. Checkpoint da fase 1
  - Garantir que todos os testes passam (`npm.cmd run lint`, `npm.cmd test -- --run`, `npm.cmd run build` na worktree), sem mudança de comportamento visível. Perguntar ao usuário se surgirem dúvidas.
  - Commit local pequeno na branch `jornada-de-carreira`, sem push.

- [x] 4. Fase 2: armazenamento local, progresso e portões
  - [x] 4.1 Implementar os módulos de armazenamento
    - `src/frontend/src/jornada/armazenamento/cartaoPerfil.ts`, `registrosMissao.ts` e `missoesAtivas.ts`: tipos do design, `analisar*` puras e totais, `serializar*`, `ler*` e `gravar*` com `Storage` injetável e retorno `false` em falha, chaves `itfs_cartao_embarque`, `itfs_registros_missao` e `itfs_missoes_ativas`
    - Validação: versão 1, campos obrigatórios, rota disponível do catálogo, origem `diagnostico` ou `diagnostico-rapido`, registros validados item a item, missão fora do catálogo descartada
    - `criarRegistro` copia campo a campo a `AvaliacaoResponse` com `concluida: true` e grava `etapaId` e `vertenteId` (nula fora da N3 Sênior) por `escalaDaMissao`; valores divergentes do catálogo atual não descartam o item; `gravarRegistro` idempotente por `sessaoId`; gravar cartão não toca a chave de registros
    - _Requirements: 4.7, 4.9, 5.6, 7.2, 7.5, 9.5_
  - [x] 4.2 Escrever teste de propriedade de dado inválido
    - `src/frontend/src/jornada/armazenamento/*.test.ts`, com exemplos de `setItem` que lança devolvendo `false`
    - **Property 7: Dado inválido é tratado como ausente** (parte de cartão, registros e missões ativos; a parte do modo entra na tarefa 11.2)
    - **Validates: Requirements 5.6**
  - [x]* 4.3 Escrever teste de propriedade de ida e volta do armazenamento
    - **Property 6: Ida e volta do armazenamento** (cartão com as duas origens, registros e missões ativos)
    - **Validates: Requirements 4.7, 7.2, 7.5, 9.1**
  - [x]* 4.4 Escrever teste de propriedade de refazer o diagnóstico
    - **Property 8: Refazer o diagnóstico preserva os registros**
    - **Validates: Requirements 4.9**
  - [x]* 4.5 Escrever teste de propriedade de fidelidade do registro
    - `src/frontend/src/jornada/registros.test.ts`
    - **Property 16: Registro fiel ao Juiz e idempotente**
    - **Validates: Requirements 7.5, 9.5, 11.6**
  - [x] 4.6 Acrescentar `ContextoArmazenamentoJornada` ao provedor
    - Em `ProvedorJornada.tsx`: cartão, registros e missões ativos lidos uma vez por inicialização preguiçosa, funções de gravação, valor em memória quando a gravação falha e aviso não bloqueante do Error Handling
    - O contexto não importa `api/client.ts`
    - _Requirements: 4.7, 4.9, 5.6, 7.2_
  - [x] 4.7 Implementar `calcularProgressoRota` e `agruparRegistros`
    - `src/frontend/src/jornada/progressoRota.ts`: `VisaoMissao`, `VisaoGrupoMissoes` e `VisaoEscala` (sem os campos do modo nesta fase; a opção `modoDemonstracao` entra na tarefa 11.4) com `cumprida`, `semMissaoDisponivel`, `liberadaPorPreparacao`, `escalaNecessaria` e `grupos` (um por Vertente na N3 Sênior)
    - Escala_Cumprida: toda Missão disponível com registro, somando as Vertentes; sem Missão disponível também conta (verdade vazia). Etapa 0 liberada; etapa i liberada quando a i menos 1 é cumprida; concluída só com ao menos uma Missão disponível e todas com registro; Vertentes seguem o estado da etapa
    - Missão em preparação: estado `em-preparacao` e `podeEmbarcar` falso; Missão disponível: `concluida` com registro, `bloqueada` em etapa bloqueada, `disponivel` nos demais; Causas só entram na contagem `causas`, e `textoCausas` usa "e" sem código de Causa
    - Etapa e Vertente de cada registro vêm do catálogo atual pela `missao`
    - `agruparRegistros(rota, registros)` com grupos na ordem das etapas e, na N3 Sênior, das Vertentes, e link `/revisao/:sessao`
    - _Requirements: 5.2, 5.3, 5.5, 5.9, 5.10, 6.1, 6.2, 6.6, 6.7, 6.8, 9.1, 9.3_
  - [x] 4.8 Escrever testes de propriedade do progresso da rota
    - `src/frontend/src/jornada/progressoRota.test.ts`, com geradores de status de Missões e Causas; exemplo com o catálogo atual sem registros: Service Desk N1 Jr liberada com `liberadaPorPreparacao`, N2 Pleno e N3 Sênior bloqueadas
    - **Property 11: Progresso da rota**
    - **Validates: Requirements 5.2, 5.3, 5.9, 5.10, 6.1, 6.2, 6.6, 6.7, 10.7, 10.9**
    - **Property 12: Liberação monotônica**
    - **Validates: Requirements 5.5**
  - [x]* 4.9 Escrever teste de propriedade do agrupamento do Brevê
    - Acréscimo em `registros.test.ts`
    - **Property 17: Agrupamento do Brevê**
    - **Validates: Requirements 9.1, 9.3**
  - [x] 4.10 Implementar `decidirPortao` e ligar ao `Roteador`
    - `src/frontend/src/jornada/navegacao/portoes.ts`: regras 1, 2, 3 e 5 do design, nessa ordem (sem cartão em `plano-de-carreira` ou `mesa de trabalho` redireciona para `/diagnostico?motivo=sem-cartao`; mesa de trabalho de Missão em preparação devolve `aviso-missao-em-preparacao`, sem olhar o status das Causas; mesa de trabalho de etapa bloqueada devolve aviso; demais exibem). O parâmetro do modo e a regra 4 entram na tarefa 11.6
    - `Roteador.tsx` lê cartão e registros do contexto e chama `navegar(destino, { substituir: true })` em `useEffect`
    - _Requirements: 5.1, 5.4, 5.8_
  - [x] 4.11 Escrever testes dos portões
    - `src/frontend/src/jornada/navegacao/portoes.test.ts` (obrigatório):
    - **Property 13: Portões da jornada** (nesta fase com o modo inativo; o modo gerado entra na tarefa 11.7)
    - **Validates: Requirements 5.1, 5.4, 5.8, 6.8**
    - `src/frontend/src/jornada/navegacao/Roteador.test.tsx` (obrigatório): `/plano-de-carreira` sem cartão termina em `/diagnostico?motivo=sem-cartao` sem aumentar `history.length`; cartão corrompido equivale a ausente sem erro não tratado
    - _Requirements: 5.1, 5.6_
  - [x] 4.12 Escrever teste de propriedade das Causas
    - Acréscimo em `progressoRota.test.ts` (obrigatório)
    - **Property 26: Causas não mudam o perfil**
    - **Validates: Requirements 6.8, 10.2**
  - [x] 4.13 Implementar `calcularBrevePiloto`
    - Em `progressoRota.ts`: `ExigenciaBreve`, `VisaoBrevePiloto` e `calcularBrevePiloto(rota, registros)`, pura, uma exigência por etapa na ordem do catálogo (na N3 Sênior, qualquer Vertente), `conquistado` com as quatro cumpridas, `aguardaPreparacao` para exigência pendente de etapa sem Missão disponível
    - Não recebe o modo de demonstração, não lê armazenamento e não cria chave nova
    - _Requirements: 9.6, 9.7, 9.8, 9.9, 9.10, 17.9_
  - [x] 4.14 Escrever teste de propriedade do Brevê de analista
    - Acréscimo em `progressoRota.test.ts` (obrigatório), com exemplo do catálogo atual: Portfólio_de_Piloto pendente e Help Desk N1 aguardando preparação
    - **Property 25: Brevê de analista**
    - **Validates: Requirements 9.6, 9.7, 9.8, 9.9, 9.10, 17.9**

- [x] 5. Fase 2: cliente da API e abertura da Mesa de Trabalho
  - [x] 5.1 Acrescentar classes de erro ao cliente da API
    - `src/frontend/src/api/client.ts`: `SessaoIndisponivelError` (404 e 410, mantendo a mensagem atual de 410), `ErroDeRede` na falha final de `fetchComRetry`, `classificarFalha`. Sem endpoint novo
    - `src/frontend/src/api/client.test.ts` (obrigatório): exemplos de 404, 410, falha de rede e `ConflitoSeqError`
    - _Requirements: 7.3, 8.2, 8.4, 11.4_
  - [x]* 5.2 Escrever teste de propriedade da classificação de falha
    - **Property 15: Classificação de falha**
    - **Validates: Requirements 7.3, 8.2, 8.4**
  - [x] 5.3 Implementar `decidirInicioCabine`
    - `src/frontend/src/jornada/mesa-de-trabalho/decidirInicioCabine.ts`: `usar-memoria`, `retomar` ou `criar`, com `nova` sempre criando. Não recebe o modo de demonstração
    - _Requirements: 7.1, 7.2, 7.4, 12.3_
  - [x] 5.4 Escrever teste de propriedade da abertura da Mesa de Trabalho
    - `src/frontend/src/jornada/mesa-de-trabalho/decidirInicioCabine.test.ts` (obrigatório)
    - **Property 14: Abertura da mesa de trabalho nunca duplica sessão**
    - **Validates: Requirements 7.1, 7.2, 7.4, 12.3**
  - [x] 5.5 Trocar `iniciarSessao` por `abrirVoo` e gravar o Registro de Missão
    - Em `ProvedorJornada.tsx`: `abrirVoo` com `decidirInicioCabine`, `Map` de promessas por missão contra a dupla execução do `StrictMode`, `criarSessao` só com o identificador da Missão quando não há `?causa` nem `?semente`, gravação de `itfs_missoes_ativas` e `itfs_jornada_sessoes`, resultados `pronto`, `sessao-indisponivel`, `rede` e `erro`
    - Depois de `executarAcao`, com todos os chamados `Resolvido` ou `Encerrado`, chamar `obterAvaliacao`; com `concluida: true`, `criarRegistro`, `gravarRegistro` e `registroRecente`; falha não bloqueia o turno e permite tentar de novo
    - `src/frontend/src/jornada/mesa-de-trabalho/abrirVoo.test.tsx` (obrigatório), com `fetch` simulado: um único `POST /api/sessoes` em `StrictMode` com corpo só com o identificador da Missão, retomada sem `POST` com sessão registrada, 404 devolve `sessao-indisponivel`, registro gravado só com `concluida: true` e com a Vertente da Missão
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 12.3_

- [x] 6. Fase 2: menu e Mentor
  - [x] 6.1 Acrescentar os ícones da jornada
    - `src/frontend/src/ui/catalogoIcones.ts`: `bloqueada`, `iniciar`, `diagnóstico`, `plano-de-carreira`, `catálogo`, `rota`, `portfólio`, `mais` e `pendente`, pelo `lucide-react` existente, tamanhos 16 e 20. Os ícones do modo de demonstração entram na tarefa 11.10
    - _Requirements: 14.5, 16.3_
  - [x] 6.2 Criar `catalogoNavegacao.ts`
    - `src/frontend/src/jornada/catalogos/catalogoNavegacao.ts`: `ITENS_MENU` nos grupos `principal` e `mais`, `hrefDoItem` (Mesa de Trabalho só com missão ativo) e `itemAtivoDoMenu`
    - _Requirements: 1.6, 1.7_
  - [x]* 6.3 Escrever teste de propriedade do item ativo do menu
    - `src/frontend/src/jornada/catalogos/catalogoNavegacao.test.ts`
    - **Property 19: Item ativo do menu**
    - **Validates: Requirements 1.6, 1.7**
  - [x] 6.4 Converter a `BarraSuperior` em navegação por links
    - `src/frontend/src/educacao/BarraSuperior.tsx`: `paginaAtual` e `missaoAtiva` no lugar de `visaoAtual`, `onSelecionarVisao`, `onEntrarLaboratorio` e `credencialAtiva`; destinos como `LinkInterno` com `aria-current="page"`, barra de 2 px e peso semibold; barra de contexto com `NOME_PAGINA`; botão "Mais" com `aria-expanded`, `aria-controls="nav-mais"`, foco no primeiro link ao abrir, Escape devolvendo foco ao botão e `AlternadorTema` dentro da lista no celular
    - `src/frontend/src/index.css`: `nav-mais`, separador de grupos no trilho e posição da lista acima da barra inferior, só com tokens
    - `src/frontend/src/educacao/BarraSuperior.test.tsx` (obrigatório): `aria-current` no item da página, "Mais" com `aria-expanded`, foco no primeiro link, Escape devolvendo foco, botão "Mais" marcado quando a página está no grupo `mais`
    - _Requirements: 1.2, 1.6, 14.2, 14.3, 14.4, 15.3_
  - [x] 6.5 Implementar o Mentor por fase
    - `src/frontend/src/jornada/mentor/catalogoComandante.ts` (`PapelComandante`, `DefinicaoPapel`, `PAPEL_POR_PAGINA`, `papelPorPagina`), `responderComandante.ts` (pura, usa `responderMentor` local) e `PainelMentor.tsx` ("Mentor, papel {nome}" com ícone `mentor`)
    - Mentor repete "Quem avalia é o Juiz 360º da plataforma, não este guia" e não mostra nota, aprovação ou reprovação
    - `src/frontend/src/jornada/mentor/mentor.test.ts` (obrigatório): varredura por `import.meta.glob` de que nenhum módulo de `mentor/` importa `api/client`, `registrosMissao` ou `cartaoPerfil`
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6_
  - [x]* 6.6 Escrever testes de propriedade do Mentor
    - Acréscimo em `mentor.test.ts`
    - **Property 20: Papel do Mentor por página**
    - **Validates: Requirements 11.1**
    - **Property 21: Mentor só orienta**
    - **Validates: Requirements 11.4, 11.5**

- [ ] 7. Fase 2: páginas por rota
  - [x] 7.1 Criar o catálogo vocacional, as regras de indicação e o redutor do diagnóstico
    - Ler `src/frontend/src/home/catalogoVocacional.ts` por `git show home-vocacional:src/frontend/src/home/catalogoVocacional.ts`, somente leitura, e copiar `TEXTOS_HOME`, `JORNADA`, limites, pergunta `foco` e `RESPOSTAS_FOCO` para `src/frontend/src/jornada/catalogos/catalogoVocacional.ts`
    - Acrescentar `VERSAO_ROTEIRO`, `ROTEIRO_CHECKIN` (interesse, situacao e ritmo com os pesos do design, identificadores `ajudar-pessoas`, `perguntar-o-que-aparece` e `praticar`) e `JUSTIFICATIVAS`
    - `src/frontend/src/jornada/catalogos/regrasIndicacao.ts` (`indicarRota`, empate pela ordem de `CATALOGO_ROTAS`) e `src/frontend/src/jornada/diagnostico/reduzirDiagnóstico.ts`
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.10_
  - [x] 7.2 Escrever teste de propriedade da indicação
    - `src/frontend/src/jornada/catalogos/regrasIndicacao.test.ts`, enumerando as 32 combinações, e exemplo de que `fetch` não é chamado
    - **Property 4: Indicação total e determinística**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**
  - [x]* 7.3 Escrever teste de propriedade do cartão emitido
    - Acréscimo em `regrasIndicacao.test.ts`
    - **Property 5: Cartão emitido sempre embarca em rota disponível**
    - **Validates: Requirements 4.7, 4.8**
  - [x]* 7.4 Escrever teste de propriedade do redutor do diagnóstico
    - `src/frontend/src/jornada/diagnostico/reduzirDiagnóstico.test.ts`
    - **Property 10: Redutor do diagnóstico**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 7.5 Criar os componentes comuns da jornada
    - `src/frontend/src/jornada/componentes/AvisoHonesto.tsx` (`role="status"` e `aria-live="polite"`, ou `role="alert"` para falha que bloqueia, ícone `alerta` ou `info`, ao menos uma ação), `SeloStatus.tsx` e `CartaoPerfil.tsx`
    - `GrupoVertente.tsx`: `div` com `role="group"` e `aria-labelledby` no título da Vertente, com nível de título por propriedade (h3 no Plano de Carreira, h4 no Catálogo e no Brevê)
    - `SecaoBrevePiloto.tsx`: recebe `VisaoBrevePiloto`; conquistado ou pendente com texto e ícone (`portfólio` ou `pendente`), quatro exigências com "Cumprida" ou "Pendente" e ícone (`status-disponivel` ou `pendente`), e "Aguarda missão em preparação no simulador." quando `aguardaPreparacao`
    - `src/frontend/src/index.css`: todas as classes das páginas desta fase (`selo-status`, `etapa`, `grupo-vertente`, `portfólio-analista`, `cartao-perfil`, `aviso-honesto`, `mesa de trabalho-titulo`), só com tokens existentes, para que as tarefas 7.6 a 7.13 não editem o CSS
    - _Requirements: 9.6, 9.7, 9.8, 9.9, 14.2, 14.3, 14.5, 14.7, 14.8, 16.4_
  - [x] 7.6 Implementar a Página Início
    - `src/frontend/src/jornada/paginas/PaginaInicio.tsx` e `src/frontend/src/jornada/componentes/DemonstracaoDiagnóstico.tsx`: apresentação, pergunta de exemplo, limites do Mentor, botão para `/diagnostico`, botão para `/plano-de-carreira` com cartão válido, `PainelMentor` Consultor
    - `src/frontend/src/jornada/paginas/PaginaInicio.test.tsx` (obrigatório): com e sem cartão, h1 único "Início"
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 11.1_
  - [x]* 7.7 Escrever teste de propriedade da demonstração do diagnóstico no Início
    - `src/frontend/src/jornada/componentes/DemonstracaoDiagnóstico.test.tsx`
    - **Property 9: Demonstração do diagnóstico no Início não grava nada**
    - **Validates: Requirements 3.4**
  - [x] 7.8 Implementar a Página Diagnóstico
    - `src/frontend/src/jornada/paginas/PaginaDiagnóstico.tsx`: uma pergunta por vez, voltar, indicação com justificativa, regra em linguagem simples e texto de ponto de partida, rota indisponível com status em texto e oferta de Suporte de TI, gravação do cartão depois de `confirmar` e link para `/plano-de-carreira`, Aviso_Honesto com `?motivo=sem-cartao`, `PainelMentor` Consultor
    - `src/frontend/src/jornada/paginas/PaginaDiagnóstico.test.tsx` (obrigatório): diagnóstico completo só com teclado, refazer o diagnóstico mantém registros, aviso de cartão ausente anunciado em `role="status"`
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 4.9, 4.10, 5.1, 14.4, 14.7_
  - [x] 7.9 Implementar a Página Plano de Carreira
    - `src/frontend/src/jornada/paginas/PaginaPlanoDeCarreira.tsx`, `src/frontend/src/jornada/componentes/ListaEscalas.tsx`, `CartaoMissao.tsx` e `ConviteMentor.tsx`: etapas de `calcularProgressoRota` como `section` com h2; "Bloqueada" com ícone e etapa necessária; textos de `semMissaoDisponivel` e de `liberadaPorPreparacao`; na N3 Sênior, um `GrupoVertente` por Vertente na ordem N3-A, N3-B, N3-C
    - `CartaoMissao`: nome, etapa, Vertente quando houver e estado em texto; `titulo` e `desc` por `LEVELS.find((l) => l.cenarioId === id)`, ou `titulo` e `descricao` do catálogo; Missão em preparação com `SeloStatus` e "Este cenário ainda não está disponível no simulador.", sem Iniciar; linha de `textoCausas` quando há Causa em preparação; Iniciar como link para `enderecoDe` sem `causa` nem `semente`, só com `podeEmbarcar`
    - `PrimeiroVoo`, `ETAPAS_MISSAO_ZERO` e glossário, opções avançadas (semente, Causa disponível e demo rápida) como links sujeitos aos portões, Convite_Copiloto sem formulário, `PainelMentor` Instrutor
    - `src/frontend/src/jornada/paginas/PaginaPlanoDeCarreira.test.tsx` (obrigatório): etapa bloqueada com Iniciar desabilitado, etapa liberada depois dos registros da anterior, texto de liberação por preparação em Service Desk N1 Jr, `getByRole('group', { name: 'N3-A Redes e Nuvem' })` e as outras duas Vertentes na ordem, `reset-senha-desbloqueio` e `falha-backup-restore` com "Em preparação" e sem Iniciar, contagem de Causas em `pasta-rede-inacessivel` e `incidente-massivo` sem os textos C4, EMAIL_PROVEDOR e DOMINIO_SUSPENSO, `href` do Iniciar sem `causa`, convite sem campo nem requisição
    - _Requirements: 5.2, 5.3, 5.5, 5.9, 5.10, 6.1, 6.2, 6.6, 6.7, 6.8, 6.9, 6.11, 7.7, 10.3, 10.9, 11.1, 14.8_
  - [x] 7.10 Implementar a Página Mesa de Trabalho
    - `src/frontend/src/jornada/paginas/PaginaMesa.tsx`: h1 síncrono, Aviso_Honesto "Este cenário ainda está em preparação no simulador." com link para `/plano-de-carreira` e sem `criarSessao`, aviso de etapa bloqueada sem `criarSessao`, `abrirVoo`, reescrita para `/mesa-de-trabalho/:missao` por `replaceState` depois da criação, Aviso_Honesto de sessão indisponível com "Refazer a missão" (`?nova=1`, substituindo o histórico), banner "Acordando o servidor" depois de 2 s, aviso de registro com link para `/revisao/:sessao`, dock do Juiz 360º como link, gaveta "Mentor" no papel Assistente, telas existentes movidas de `WorkstationInner`
    - `src/frontend/src/jornada/paginas/PaginaMesa.test.tsx` (obrigatório): `StrictMode` com `criarSessao` uma vez e corpo só com o identificador da Missão, `reset-senha-desbloqueio` com o aviso de preparação e sem requisição, etapa bloqueada sem requisição, 404 na retomada mostra o aviso, voltar de Aulas não cria sessão
    - _Requirements: 5.4, 5.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 11.1, 12.3, 14.7_
  - [x] 7.11 Implementar a Página Revisão
    - `src/frontend/src/jornada/paginas/PaginaRevisão.tsx` e `src/frontend/src/jornada/componentes/ResumoLocalDoVoo.tsx`: `ReplayView` com `CriteriaPanel`, `TimelineReplay` e `CredentialCard`, links de KB por `IntranetApp`, 404 ou 410 com aviso, resumo local "Resumo guardado neste navegador", "Refazer a missão" e link para `/portfolio`, erro de rede com "Tentar de novo", `PainelMentor` Mentor
    - `src/frontend/src/jornada/paginas/PaginaRevisão.test.tsx` (obrigatório): 404 com e sem registro local, rede com nova tentativa
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.1, 11.6_
  - [x] 7.12 Implementar a Página Brevê
    - `src/frontend/src/jornada/paginas/PaginaPortfolio.tsx` com `SecaoBrevePiloto` alimentada por `calcularBrevePiloto`, `agruparRegistros` com h3 por etapa e `GrupoVertente` com h4 na N3 Sênior, resultado exatamente como recebido, link por registro, estado vazio com link para `/plano-de-carreira`, `CredencialView` com `nivelTitulo={2}`, `PainelMentor` Mentor; não lê o modo de demonstração
    - `src/frontend/src/workstation/CredencialView.tsx`: propriedade opcional `nivelTitulo?: 1 | 2`, padrão 1
    - `src/frontend/src/jornada/paginas/PaginaPortfolio.test.tsx` (obrigatório): vazio, agrupado por etapa e Vertente, quatro exigências com o texto de aguardo da Help Desk N1, Portfólio_de_Piloto pendente e conquistado com texto e ícone, nenhuma chamada a `fetch`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 11.1_
  - [x] 7.13 Implementar Aulas, Treino, Caderno, Mentor, Catálogo mínimo e 404
    - `PaginaAulas.tsx` (h1 Aulas, nível, modo e aula por parâmetros de endereço, link para `/aulas/treino`), `PaginaTreino.tsx` (`MentorView`), `PaginaCaderno.tsx` (`CadernoView`), `PaginaMentor.tsx` (quatro papéis, limites e páginas de cada papel), `PaginaCatalogo.tsx` mínima (h1 e rotas do catálogo com `SeloStatus`, completada na tarefa 9.5) e `Pagina404.tsx` (caminho ou missão informada, link para `/` e, com cartão, para `/plano-de-carreira`)
    - `src/frontend/src/educacao/AulasView.tsx` e `MentorView.tsx`: propriedade opcional `nivelTitulo?: 1 | 2`, padrão 1
    - `src/frontend/src/jornada/paginas/PaginasEstudo.test.tsx` e `Pagina404.test.tsx` (obrigatórios): h1 único por página, conteúdo de `AulasView` e `CadernoView` mantido, 404 com caminho e links
    - _Requirements: 2.3, 10.1, 11.3, 12.1, 12.2, 13.1, 13.2, 13.3_
  - [x] 7.14 Ligar todas as páginas ao `Roteador` e atualizar os testes atuais
    - `Roteador.tsx`: cada `IdPagina` renderiza a sua página; a árvore antiga deixa de ser renderizada (os arquivos saem na fase 5)
    - `App.test.tsx`, `src/workstation/EstadoInicial.test.tsx` e `src/educacao/progressoNivel.test.tsx` passam a navegar por `getByRole('link', ...)` e a semear o cartão no armazenamento
    - _Requirements: 1.1, 1.4, 1.7, 12.1_
  - [x] 7.15 Escrever o spec Playwright de navegação
    - `src/frontend/e2e/navegacao.spec.ts` (projeto `chromium`, obrigatório): cada item do menu muda a URL e o histórico; `goBack` e `goForward`; `reload` e `goto` direto em cada endereço; foco no h1 com texto igual ao início do `document.title` e `outline` diferente de `none`; `/plano-de-carreira` sem cartão termina em `/diagnostico` sem aumentar `history.length`; `/nao-existe` e `/mesa-de-trabalho/inexistente` na 404; fluxo só com teclado de Diagnóstico a Mesa de Trabalho; recarga da Mesa de Trabalho e ida a Aulas sem novo `POST /api/sessoes`; Revisão e Brevê depois de `pasta-rede-inacessivel`, liberada sem registros; `goto('/mesa-de-trabalho/reset-senha-desbloqueio')` com cartão mostra o aviso de preparação sem `POST /api/sessoes`; as três Vertentes como grupos por `getByRole('group', { name })`
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 2.1, 2.2, 2.4, 5.1, 5.8, 5.9, 7.2, 12.3, 13.1, 13.2, 14.4, 14.8_

- [x] 8. Checkpoint da fase 2
  - Garantir que todos os testes passam (lint, Vitest, build e `navegacao.spec.ts`). Perguntar ao usuário se surgirem dúvidas.
  - Commits locais pequenos e coesos por grupo de tarefas, sem push.

- [x] 9. Fase 3: catálogos de certificações e parceiros, e Catálogo
  - [x] 9.1 Criar os catálogos de certificações e parceiros
    - `src/frontend/src/jornada/catalogos/catalogoCertificacoes.ts` com `AVISO_CERTIFICACOES` e os 5 itens do design, e `catalogoParceiros.ts` com tipo sem campo de nome e os 3 itens genéricos com status futuro
    - _Requirements: 10.1, 10.2, 10.5, 10.6_
  - [x] 9.2 Ampliar os testes de catálogo
    - Acréscimo em `catalogos.test.ts` (obrigatório): um status por item, ausência de "oficial", "parceiro", "equivalente", "credenciado" e "certificado pelo" nas certificações, parceiros sem nome de empresa, textos sem E comercial e sem emoji
    - _Requirements: 10.2, 10.5, 10.6, 16.1, 16.2_
  - [x] 9.3 Implementar `visaoDoHangar` e as certificações por etapa
    - Em `progressoRota.ts`: `visaoDoHangar` (rotas, Missões de Suporte de TI agrupadas por etapa e Vertente, inclusive as em preparação, certificações e parceiros) e o campo `certificacoes` de `VisaoEscala`, ambos por `APRESENTACAO_STATUS`
    - _Requirements: 6.10, 10.1, 10.3, 10.7, 10.8_
  - [x]* 9.4 Escrever teste de propriedade do catálogo refletido
    - Acréscimo em `progressoRota.test.ts`
    - **Property 18: Catálogo refletido sem cópia**
    - **Validates: Requirements 6.10, 10.1, 10.7, 10.8, 14.5**
  - [x] 9.5 Completar a Página Catálogo
    - `PaginaCatalogo.tsx` com rotas, seção "Missões de Suporte de TI" (h3 por etapa, `GrupoVertente` com h4 na N3 Sênior, `SeloStatus` e `textoCausas` por Missão), certificações (com o aviso fixo) e parceiros de `visaoDoHangar`, status em texto e ícone, e a seção "Transparência do escopo" vinda de `TelaInicial`
    - `src/frontend/src/jornada/paginas/PaginaCatalogo.test.tsx` (obrigatório): os grupos de catálogo, Missões agrupadas por etapa e Vertente com as em preparação, status em texto, navegação só com teclado
    - _Requirements: 10.1, 10.3, 10.7, 10.8, 14.4, 14.5, 14.8_
  - [x] 9.6 Exibir as certificações no Plano de Carreira
    - `ListaEscalas.tsx` mostra as certificações de cada etapa com `SeloStatus` e o aviso fixo; acréscimo em `PaginaPlanoDeCarreira.test.tsx`
    - _Requirements: 6.10, 10.3_

- [x] 10. Checkpoint da fase 3
  - Garantir que todos os testes passam. Perguntar ao usuário se surgirem dúvidas.
  - Commit local, sem push.

- [x] 11. Fase 4: modo de demonstração e Diagnóstico Rápido
  - [x] 11.1 Implementar `modoDemonstracao.ts`
    - `src/frontend/src/jornada/armazenamento/modoDemonstracao.ts`: `CHAVE_MODO_DEMONSTRACAO`, `ModoDemonstracao`, `analisarModoDemonstracao`, `serializarModoDemonstracao`, `lerModoDemonstracao` (leitura defensiva nos 5 passos, nunca grava) e `gravarModoDemonstracao` (só a chave `itfs_modo_demonstracao`, `false` se `setItem` lançar)
    - Importa só tipos; não importa `api/client.ts`, `registrosMissao.ts`, `cartaoPerfil.ts` nem `missoesAtivas.ts`
    - _Requirements: 5.6, 17.2, 17.5, 17.6, 17.7, 17.8_
  - [x] 11.2 Escrever testes do armazenamento do modo
    - `src/frontend/src/jornada/armazenamento/modoDemonstracao.test.ts` (obrigatório), com exemplos: `getItem` que lança devolve inativo, `setItem` que lança devolve `false`, desativar grava `ativo: false` sem apagar
    - **Property 6: Ida e volta do armazenamento** (parte do modo)
    - **Validates: Requirements 17.2, 17.5, 17.6**
    - **Property 7: Dado inválido é tratado como ausente** (parte do modo)
    - **Validates: Requirements 5.6**
  - [x] 11.3 Acrescentar o modo ao provedor e os textos
    - `ContextoArmazenamentoJornada`: `modoDemonstracao` por inicialização preguiçosa e `definirModoDemonstracao(ativo, origem)`, que atualiza a memória, grava e anuncia na `RegiaoAnuncioJornada`; aviso não bloqueante quando a gravação falha
    - `src/frontend/src/jornada/demonstracao/textosDemonstracao.ts`: anúncios de ativação e desativação, rótulo, explicação, selo, textos do Atalho_Experimentar e do Diagnóstico Rápido
    - `ContextoVoo` e `abrirVoo` continuam sem receber o modo
    - _Requirements: 17.2, 17.5, 17.6, 17.8, 17.17_
  - [x] 11.4 Acrescentar a opção do modo a `calcularProgressoRota`
    - Em `progressoRota.ts`: `opcoes: { modoDemonstracao }`, campos `estadoPorRegistros`, `liberadaPorDemonstracao` e `seloDemonstracao`, regras do design; com o modo ativo, `escalaNecessaria` nula, `liberadaPorPreparacao` falso e Missão em preparação ainda sem perfil; concluída só com registro; `calcularBrevePiloto` continua sem o modo
    - Atualizar as chamadas em `PaginaPlanoDeCarreira.tsx` e `ListaEscalas.tsx` com o modo do contexto, e o texto de apoio "Liberada só para demonstração. Conclua {etapa anterior} para liberar pelos missões."
    - _Requirements: 5.7, 6.7, 17.3, 17.6, 17.10_
  - [x] 11.5 Escrever teste de propriedade do progresso com o modo
    - Acréscimo em `progressoRota.test.ts` (obrigatório)
    - **Property 22: Progresso com o modo de demonstração**
    - **Validates: Requirements 5.3, 5.7, 6.7, 17.3, 17.4, 17.6, 17.10**
  - [x] 11.6 Acrescentar o modo a `decidirPortao`
    - `portoes.ts`: parâmetro `modoDemonstracao`; os portões de cartão e de Missão em preparação valem com o modo ativo ou inativo; etapa bloqueada só com o modo inativo, calculada com `modoDemonstracao: false`; regra 4 do design (modo ativo exibe a Mesa de Trabalho de Missão disponível de qualquer etapa e Vertente)
    - `Roteador.tsx` passa o modo do contexto
    - _Requirements: 5.1, 5.4, 5.7, 5.8_
  - [x] 11.7 Ampliar o teste de propriedade dos portões
    - Acréscimo em `portoes.test.ts` (obrigatório), com o modo gerado
    - **Property 13: Portões da jornada**
    - **Validates: Requirements 5.1, 5.4, 5.7, 5.8, 6.8, 17.3**
  - [x] 11.8 Implementar `CHECKIN_RAPIDO` e o planejamento do atalho
    - `catalogoVocacional.ts`: `CHECKIN_RAPIDO` com as respostas padrão e a explicação
    - `src/frontend/src/jornada/demonstracao/planoDemonstracao.ts`: `planejarAtalho`, `planejarConclusaoDiagnósticoRapido` (cartão com `origem: 'diagnostico-rapido'`) e `executarPlanoDemonstracao` na ordem gravar cartão, ativar modo e navegar
    - Acréscimo em `catalogos.test.ts` (obrigatório): respostas padrão existem nas opções, `indicarRota(CHECKIN_RAPIDO.respostas).rotaId` é `suporte-ti`, textos de `textosDemonstracao.ts` sem E comercial e sem emoji
    - _Requirements: 17.12, 17.13, 17.14, 16.1_
  - [x] 11.9 Escrever teste de propriedade do planejamento do atalho
    - `src/frontend/src/jornada/demonstracao/planoDemonstracao.test.ts` (obrigatório)
    - **Property 24: Planejamento do atalho e do Diagnóstico Rápido**
    - **Validates: Requirements 17.12, 17.13, 17.14**
  - [x] 11.10 Implementar o controle e o selo no Plano de Carreira
    - `catalogoIcones.ts`: `demonstracao`, `modo-ativo` e `modo-inativo`
    - `src/frontend/src/jornada/demonstracao/SeloDemonstracao.tsx` e `ControleModoDemonstracao.tsx` (`button` com `role="switch"`, `aria-checked`, nome acessível igual ao rótulo, estado "Ativado" ou "Desativado" com ícone, `aria-describedby` na explicação, altura `var(--touch-target)`)
    - `PaginaPlanoDeCarreira.tsx`: seção `#modo-demonstracao` com h2 abaixo do h1; aviso de cartão do diagnóstico rápido com link "Fazer o diagnóstico completo"
    - `index.css`: `selo-demonstracao` e `controle-modo-demonstracao` com token de informação, sem cor de sucesso
    - _Requirements: 14.5, 17.1, 17.2, 17.3, 17.4, 17.6, 17.15, 17.16_
  - [x] 11.11 Implementar o indicador do modo na barra de contexto
    - `src/frontend/src/jornada/demonstracao/IndicadorModoDemonstracao.tsx` ("Modo de demonstração ativo" com ícone, `LinkInterno` para `/plano-de-carreira`) e propriedade `modoDemonstracao` em `BarraSuperior.tsx`
    - `index.css`: `indicador-modo-demonstracao`
    - _Requirements: 14.5, 17.5_
  - [x] 11.12 Implementar o Atalho_Experimentar e o Diagnóstico Rápido
    - `src/frontend/src/jornada/demonstracao/BotaoExperimentar.tsx` em `PaginaInicio.tsx` ("Experimentar uma missão agora", ícone `iniciar`, texto de apoio por `aria-describedby`)
    - `src/frontend/src/jornada/demonstracao/DiagnósticoRapido.tsx` em `PaginaDiagnóstico.tsx` com `?modo=rapido`: h2 "Diagnóstico rápido", explicação, três respostas padrão por extenso, indicação e texto de ponto de partida, "Confirmar e iniciar", link "Fazer o diagnóstico completo", `PainelMentor` Consultor; com cartão válido, aviso e botão "Experimentar uma missão agora" que não troca o cartão
    - _Requirements: 4.10, 17.11, 17.12, 17.13, 17.14, 17.15_
  - [x] 11.13 Escrever os testes de isolamento do modo
    - `src/frontend/src/jornada/demonstracao/isolamento.test.ts` (obrigatório): varredura por `import.meta.glob` (sem arquivos de teste) de que `demonstracao/` e `modoDemonstracao.ts` não importam `api/client` nem `registrosMissao`, e de que `api/` e `jornada/mesa-de-trabalho/` não contêm `modoDemonstracao` nem `itfs_modo_demonstracao`; `ContextoVoo` com `fetch` simulado abre `pasta-rede-inacessivel` com semente fixa e executa a mesma ação com o modo ativo e inativo, com URLs, métodos, cabeçalhos e corpos iguais
    - **Property 23: O modo não toca registros nem rede**
    - **Validates: Requirements 17.2, 17.6, 17.7, 17.8**
  - [x] 11.14 Escrever os testes de render do modo
    - `src/frontend/src/jornada/paginas/demonstracao.test.tsx` (obrigatório), com todos os exemplos de Testing Strategy: switch com `aria-checked`, ativação por clique e por Espaço, quatro selos, Iniciar nas Missões disponíveis de N2 Pleno e das três Vertentes da N3 Sênior, `reset-senha-desbloqueio` e `falha-backup-restore` sem Iniciar, Mesa de Trabalho de `reset-senha-desbloqueio` com o aviso de preparação e sem `criarSessao` com o modo ativo, "Concluída" só com registro, anúncio em `role="status"`, desativar volta a "Bloqueada" e grava `ativo: false`, restauração com a chave semeada, atalho sem e com cartão (cartão inalterado), Diagnóstico Rápido sem passar por `/diagnostico?motivo=sem-cartao` e sem aumentar `history.length`, Brevê vazio com o modo ativo, `criarSessao` de `incidente-massivo` uma vez com o modo ativo e nenhuma com o modo inativo, indicador na barra de contexto em toda página
    - _Requirements: 5.7, 5.8, 6.7, 14.5, 17.1, 17.3, 17.4, 17.5, 17.6, 17.9, 17.10, 17.11, 17.12, 17.13, 17.14, 17.16, 17.17_
  - [x] 11.15 Escrever o spec Playwright do modo
    - `src/frontend/e2e/demonstracao.spec.ts` (projeto `chromium`, obrigatório), com `localStorage` limpo e registro de requisições: atalho sem cartão, atalho com cartão e `goBack` ao Início, controle só com teclado com `reload` (Iniciar de `sre-cloud-latencia` habilitado e `falha-backup-restore` sem Iniciar), portão de cartão com o modo ativo sem `POST /api/sessoes`, Brevê vazio, valor corrompido sem erro no console, nenhuma URL, cabeçalho ou `postData()` com `demonstracao` ou `itfs_modo`
    - _Requirements: 5.1, 5.6, 17.2, 17.5, 17.6, 17.8, 17.9, 17.12, 17.13, 17.14_

- [x] 12. Checkpoint da fase 4
  - Garantir que todos os testes passam, incluindo `demonstracao.spec.ts`. Perguntar ao usuário se surgirem dúvidas.
  - Commit local, sem push.

- [x] 13. Fase 5: limpeza e specs Playwright existentes
  - [x] 13.1 Aposentar `TelaInicial` e `TabelaMissoes`
    - Remover `src/frontend/src/workstation/TelaInicial.tsx`, `src/frontend/src/workstation/TabelaMissoes.tsx` e o código de `WorkstationInner` que restou em `App.tsx`; conferir por `git grep` (ou `graphify`) que não há referência
    - _Requirements: 1.7, 5.3_
  - [x] 13.2 Ajustar o título de fallback
    - `src/frontend/index.html`: título `IT Career Simulator`, sem travessão
    - _Requirements: 2.1_
  - [x] 13.3 Atualizar `e2e/jornadas.spec.ts`
    - Navegação por links, início pelo diagnóstico ou por cartão semeado; N2 Pleno e N3 Sênior (incluindo `triagem-engenharia-social`, agora na N3-C) semeiam `itfs_modo_demonstracao` ativo; a jornada de desbloqueio por registro semeia registro de `pasta-rede-inacessivel` com o modo inativo para liberar N2 Pleno
    - _Requirements: 5.5, 5.7, 6.3, 7.1_
  - [x] 13.4 Atualizar `e2e/visual.spec.ts`
    - Projetos `mobile-375`, `tablet-768`, `desktop-1280` e `desktop-1440`: páginas novas, Plano de Carreira com o modo ativo e Diagnóstico Rápido; `scrollWidth` menor ou igual a `clientWidth`; itens do menu sem interseção e com 44 px ou mais; menu "Mais" com todos os itens em 375 px e Escape devolvendo foco; switch e atalho com 44 px e `outline` visível; zoom de 200 por cento aproximado por viewport 640 por 400 no `desktop-1280`; `reducedMotion: 'reduce'` sem animação infinita; capturas em `test-results/visual/`
    - _Requirements: 14.2, 14.3, 14.6, 15.1, 15.2, 15.3, 17.15_
  - [x] 13.5 Atualizar `e2e/contraste.spec.ts`
    - Endereços novos nos temas corporate e tactical com `contraste.helper.ts` e `axe-core`, incluindo o Plano de Carreira com o modo ativo (selo e indicador)
    - _Requirements: 14.1, 14.5_

- [x] 14. Fase 6: validação
  - [x] 14.1 Escrever o teste de conformidade
    - `src/frontend/src/jornada/conformidade.test.ts` (obrigatório), por `import.meta.glob` em `src/jornada/**` e nos arquivos alterados (`BarraSuperior.tsx`, `catalogoIcones.ts`, `AulasView.tsx`, `MentorView.tsx`, `CredencialView.tsx`): sem E comercial em texto visível e em nomes de arquivo, sem emoji, sem `style={{`, sem cor hexadecimal fora dos blocos de token de `index.css`; `itfs_modo_demonstracao` só em `modoDemonstracao.ts` e nos testes
    - _Requirements: 16.1, 16.3, 16.4_
  - [x] 14.2 Executar lint, Vitest e build
    - Em `src/frontend` da worktree: `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build` (inclui `scripts/check-bundle-secrets.mjs`); corrigir toda falha e anotar a contagem de testes
    - _Requirements: 16.5, 16.7_
  - [x] 14.3 Executar o Playwright
    - Com o backend local em `http://localhost:8080` quando o spec exigir: `npm.cmd run test:e2e -- --project=chromium --project=mobile-375 --project=desktop-1440`, cobrindo `navegacao`, `demonstracao`, `jornadas`, `contraste` e `visual`; corrigir as falhas e conferir as capturas de 375 e 1440 px
    - _Requirements: 1.4, 14.1, 14.4, 15.1, 15.3, 17.8_
  - [x] 14.4 Executar `dotnet test` e conferir o backend intocado
    - `dotnet test src/backend/Simulador.slnx` passando
    - `git diff --stat main -- src/backend docs/vetores-jcs-sha256.json render.yaml src/frontend/vercel.json src/frontend/package.json src/frontend/package-lock.json` vazio
    - _Requirements: 1.5, 16.6_

- [x] 15. Fase 7: documentação
  - [x] 15.1 Atualizar `docs/DEPLOY_E_VIDEO.md`
    - Substituir o roteiro cronometrado da seção 2 (2m50s) pelo roteiro da seção "Roteiro da demonstração para o vídeo" do design, com a preparação antes de gravar e o caminho curto para a banca
    - Corrigir as divergências do design: `/verificar` não existe (o Verificador offline fica no Brevê), a Missão 0 guiada e o glossário passam para o Plano de Carreira, "Nível 1" a "Nível 4b" passam a Help Desk N1, Service Desk N1 Jr, N2 Pleno e N3 Sênior (com as Vertentes N3-A, N3-B e N3-C, e a triagem de engenharia social na N3-C), e as contagens fixas de testes (69 xUnit, 25 Vitest e 11 Playwright) dão lugar aos números medidos nas tarefas 14.2 a 14.4, com a data da medição, ou à referência ao CI
    - Se o documento disser que as sessões ficam só em memória, corrigir para Event Store Postgres com prazo de 30 dias por sessão, conforme `render.yaml`
    - Sem E comercial e sem emoji
    - _Requirements: 16.1, 17.11_

- [x] 16. Fechamento antes do congelamento
  - [x] 16.1 Conferir os commits e o prazo
    - Na worktree: `git status` limpo (fora a `.kiro` não versionada), `git log --oneline main..jornada-de-carreira` com commits pequenos e descritivos, tudo commitado antes de 30 de novembro de 2026, 23h59
    - Push, abertura de PR e merge na `main` só com autorização explícita do usuário. Nenhum comando destrutivo do Git
    - _Requirements: 16.6, 16.7_

- [x] 17. Checkpoint final
  - Garantir que todos os testes passam. Perguntar ao usuário se surgirem dúvidas.

- [x] 18. Integração com a spec `cenarios-por-etapa`
  - Prazo: a troca entra na entrega só se estiver commitada até 30 de novembro de 2026, 23h59. Depois dessa data, a troca de status fica fora da entrega do hackathon.
  - [x] 18.1 Trocar o status no catálogo quando o backend entregar um item
    - Gatilho: a spec `cenarios-por-etapa` entrega no backend um cenário (`reset-senha-desbloqueio` ou `falha-backup-restore`) ou uma Causa (SENHA_ESQUECIDA, CONTA_BLOQUEADA, SENHA_EXPIRADA, C4, EMAIL_PROVEDOR, DOMINIO_SUSPENSO, REPOSITORIO_CHEIO ou CADEIA_CORROMPIDA). Conferir em somente leitura, na branch em que a entrega está, que o item existe em `src/backend`; esta tarefa não edita o backend
    - Em `src/frontend/src/jornada/catalogos/catalogoRotas.ts`: trocar o `status` do item de `'em-preparacao'` para `'disponivel'`, sem mudar componente
    - Atualizar só as expectativas que fixam o status atual: exemplo de status em `catalogos.test.ts`, exemplo do catálogo atual em `progressoRota.test.ts` (com `reset-senha-desbloqueio` disponível, Service Desk N1 Jr deixa de ter `liberadaPorPreparacao` e o Portfólio_de_Piloto deixa de aguardar preparação), exemplos de render e specs Playwright que esperam "Em preparação" ou Service Desk N1 Jr liberada sem registros
    - Rodar a validação das tarefas 14.2 a 14.4 (lint, Vitest, build, Playwright e `dotnet test`) e commitar localmente, sem push
    - _Requirements: 5.9, 6.4, 6.5, 9.9, 10.7, 10.9, 16.6, 16.7_

## Notes

- Sub-tarefas com `*` são testes de propriedade opcionais, além do essencial. Os testes de navegação, foco, portões, Brevê de analista, Causas e isolamento do modo de demonstração (Properties 1, 2, 4, 7, 11, 12, 13, 14, 22, 23, 24, 25 e 26, e todos os testes de exemplo, render e Playwright) são obrigatórios.
- Cada tarefa cita os requisitos de `requirements.md` para rastreabilidade. Detalhes de implementação estão em `design.md`.
- Cada teste de propriedade usa `src/frontend/src/testes/propriedade.ts`, com no mínimo 100 execuções e o comentário `Feature: jornada-de-carreira, Property N: <texto>`.
- Nenhuma tarefa edita a branch `home-vocacional`, o checkout `D:\Projetos\Ativos\it-career-simulator-hackbrasil` nem suas 4 alterações locais. Esse checkout só é lido (`git show`, `git status`, `git worktree list`).
- Nenhuma tarefa altera `src/backend`, `docs/vetores-jcs-sha256.json`, `render.yaml`, `src/frontend/vercel.json` ou `src/frontend/package.json`.
- Prazo de congelamento: 30 de novembro de 2026, 23h59. Os checkpoints 3, 8, 10 e 12 fazem commits locais para que uma interrupção não perca trabalho.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1"] },
    { "id": 1, "tasks": ["0.2", "0.3"] },
    { "id": 2, "tasks": ["1.1", "1.2"] },
    { "id": 3, "tasks": ["1.3"] },
    { "id": 4, "tasks": ["1.4", "1.6"] },
    { "id": 5, "tasks": ["1.5", "1.7"] },
    { "id": 6, "tasks": ["2.1"] },
    { "id": 7, "tasks": ["2.2"] },
    { "id": 8, "tasks": ["4.1", "5.1", "6.1", "7.1"] },
    { "id": 9, "tasks": ["4.2", "4.6", "4.7", "5.2", "5.3", "6.2", "7.2", "7.4"] },
    { "id": 10, "tasks": ["4.3", "4.5", "4.8", "4.10", "4.13", "5.4", "6.3", "6.4", "6.5", "7.3"] },
    { "id": 11, "tasks": ["4.4", "4.9", "4.11", "4.12", "5.5", "6.6", "7.5"] },
    { "id": 12, "tasks": ["4.14", "7.6", "7.8", "7.9", "7.10", "7.11", "7.12", "7.13"] },
    { "id": 13, "tasks": ["7.7", "7.14"] },
    { "id": 14, "tasks": ["7.15"] },
    { "id": 15, "tasks": ["9.1"] },
    { "id": 16, "tasks": ["9.2", "9.3"] },
    { "id": 17, "tasks": ["9.4", "9.5", "9.6"] },
    { "id": 18, "tasks": ["11.1"] },
    { "id": 19, "tasks": ["11.2", "11.3"] },
    { "id": 20, "tasks": ["11.4", "11.6", "11.8"] },
    { "id": 21, "tasks": ["11.5", "11.7", "11.9", "11.10", "11.12"] },
    { "id": 22, "tasks": ["11.11"] },
    { "id": 23, "tasks": ["11.13", "11.14"] },
    { "id": 24, "tasks": ["11.15"] },
    { "id": 25, "tasks": ["13.1", "13.2"] },
    { "id": 26, "tasks": ["13.3", "13.4", "13.5"] },
    { "id": 27, "tasks": ["14.1"] },
    { "id": 28, "tasks": ["14.2"] },
    { "id": 29, "tasks": ["14.3", "14.4"] },
    { "id": 30, "tasks": ["15.1"] },
    { "id": 31, "tasks": ["16.1"] },
    { "id": 32, "tasks": ["18.1"] }
  ]
}
```
