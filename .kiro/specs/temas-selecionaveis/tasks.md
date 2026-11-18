# Implementation Plan: Temas selecionáveis

## Overview

Implementação em TypeScript (React 19 e Vite) em `src/frontend`, sem mudança em `src/backend` (exceto um teste novo de integração), sem biblioteca de componentes, de animação, Tailwind nem shadcn, e sem dependência nova no `package.json` (só o script `postlint`). O trabalho acontece na worktree `D:\Projetos\Ativos\it-flight-simulator-hackbrasil-jornada`, na própria branch `jornada-de-voo`, a partir do HEAD `8b0824d`. Todo comando de Node no Windows usa `npm.cmd` e `npx.cmd`.

Escopo da entrega: temas `operacao` (escuro, padrão), `corporativo`, `editorial` e `acolhedor`, o modo de alto contraste (`data-contraste="alto"`), as chaves `itfs_tema` e `itfs_contraste`, a Configuração_do_Cliente por JSON estático, o Painel_de_Aparência na barra de contexto, o terminal do SimuDesk sempre escuro e as specs de contraste e visual parametrizadas pelo catálogo. Telemetria fica para uma entrega seguinte e não tem tarefa aqui. Não há compatibilidade nem migração: `corporate`, `tactical` e `itfs_theme` deixam de existir no código (decisões D10 e D11).

A ordem segue sete fases, cada uma terminada por um checkpoint com commit local:

1. Núcleo puro em `src/tema/`: catálogo, contrato, analisador de blocos CSS, persistência, resolvedor, configuração do cliente e aplicação no documento, todos testados sem React.
2. CSS e tokens: reestrutura de `src/index.css`, blocos novos, conjuntos de alto contraste, varredura de regras de estilo e reescrita do `tokensContraste.test.ts`.
3. Aplicação em tempo de execução: armazém, Painel_de_Aparência, plugin de build com o script inicial, integração na casca e remoção do alternador antigo.
4. Playwright: Spec_de_Contraste, Spec_Visual e `aparencia.spec.ts`.
5. Teste de integração do backend (Requisito 11.7).
6. Documentação (`docs/design/DESIGN.md`, steering e registro do Figma).
7. Validação e fechamento: lint, Vitest, build, build de conferência, Playwright, `dotnet test`, varreduras e inspeção visual dos PNG.

Prazo: tudo commitado na branch `jornada-de-voo` antes de 30 de novembro de 2026, 23h59. Push, PR e merge só com autorização explícita do usuário. Se o prazo apertar, o corte é, nesta ordem: tarefa 10.2 (Figma, depende de pessoa), tarefas com `*`, captura `aparencia` e capturas de alto contraste da tarefa 7.3. As tarefas 1 a 5 e 7.4 formam o essencial.

## Divergências entre o design e o código atual

Conferidas por `graphify update src`, `graphify explain` e `git grep` na branch `jornada-de-voo`. Onde o design diverge do código, a solução abaixo é a que vale. As tarefas citam arquivos e símbolos, não números de linha, porque os números de linha do design vêm da `main` antiga.

| Id | Design | Código atual | Solução adotada |
|---|---|---|---|
| V1 | `AlternadorTema` no rodapé do rail e no menu de perfil | Aparece em três lugares: rodapé do rail (`shell-rail-rodape`), lista do botão Mais (`nav-mais-tema`) e `MenuPerfil` | Remover os três. `BotaoAparencia` entra em `.barra-contexto-acoes` de `BarraSuperior`, que existe em todas as larguras. Abaixo de 1024 px o texto do botão fica só para leitor de tela (`.botao-contexto-texto`) |
| V2 | `AppShell` montado duas vezes (Academia e Workstation); `TelaInicial` e home vocacional | `App.tsx` monta `AppShell` uma vez (`CascaJornada`), `TelaInicial` e `TabelaMissoes` foram aposentadas, a barra vem de `BarraDaJornada` para toda rota | O armazém de módulo (DT-09) continua, para o Requisito 4.8 (sem `useEffect` que regrava) e para o `StrictMode`. Sem `useShell` depois da remoção do tema, `contextoShell.ts` é removido e `DensidadeShell` passa para `AppShell.tsx`. Não existe `e2e/home.visual.spec.ts` nem home vocacional a tratar |
| V3 | `fast-check` como devDependency (DT-11) | `src/testes/propriedade.ts` (`criarGerador`, `paraTodo`, mulberry32, semente 20261130, 100 execuções) e regra de não ter dependência nova | Propriedades com `paraTodo`. A falha informa semente e valor, sem redução automática de contraexemplo. `package.json` só ganha `postlint` |
| V4 | `scripts/check-bundle-secrets.mjs` precisa varrer `dist/` inteiro (DT-19) | Já varre todo o `dist` (commit `dd78258`), com padrões novos, e aceita diretório por argumento | Só falta o teste do Requisito 13.9 (tarefa 5.11) |
| V5 | Região `role="status"` própria no Painel_de_Aparência | Existe `RegiaoAnuncioJornada` e `useAnuncioJornada().anunciar` (única região viva, mantida entre páginas) | Reusar `anunciar('Tema ativo: <nome>')`. Os testes do painel envolvem `ContextoAnuncioJornada.Provider` |
| V6 | Projeto Playwright novo `zoom-200` e altura de 900 px nos quatro projetos | `playwright.config.ts` tem alturas 812, 1024, 800 e 900. Já existe, em `visual.spec.ts`, o teste de zoom em 640 por 400 px, só no `desktop-1280` e só em `corporate` | Sem projeto novo. Alturas passam a 900 e o teste de zoom passa a 640 por 450 px e percorre os quatro temas |
| V7 | Configuração do cliente testada com servidor de desenvolvimento e arquivo `config/tema-cliente.json` de teste | Portas 8080 e 5173 compartilhadas, `reuseExistingServer` e CI com `vite preview` de `dist` | `aparencia.spec.ts` injeta o bloco `itfs-config-cliente` pelo `page.route` no HTML do documento. O build de conferência com arquivo temporário fica na tarefa 11.3 |
| V8 | A Spec_de_Contraste falha por limiar | Hoje só mede e grava JSON em `test-results/contraste/`. A linha de base antiga (commit `7907bda`) tinha 19 violações de contorno de container e 12 de controle em 375 px. `contraste.relatorio.mjs` grava em `docs/auditoria-ui-ux/ciclo2/` | Falha apenas pelo que o Requisito 8.4 e os Requisitos 6.11, 8.8, 9.1 e 14.5 mandam: texto (axe), tamanho mínimo de 12 px, status sem cor e cores do terminal. Contorno, controle e divisor continuam medidos e relatados, sem falhar. O relatório passa a gravar em `docs/auditoria-ui-ux/temas/`, sem sobrescrever o ciclo 2 |
| V9 | Documentar a configuração do cliente no README do frontend | `src/frontend/README.md` é o texto padrão do template Vite | Documentar em `docs/design/DESIGN.md`, que o steering `design-system.md` já inclui |
| V10 | DESIGN.md e steering ainda por corrigir | `docs/design/DESIGN.md` e `.kiro/steering/design-system.md` já descrevem os quatro temas, as chaves e `data-contraste`, com "hoje `tactical`" e "hoje `corporate`" | Sobra preencher os valores de cor de `editorial`, `acolhedor` e do alto contraste, remover as notas "hoje" e "Estado atual do código" e acrescentar a configuração do cliente |
| V11 | Terminal em `SimuDeskApp.tsx` linha 371 com `data-theme="tactical"` | Está em `.terminal-shell` com `data-theme="tactical"` (linha 431) | Trocar por `data-superficie="terminal"`, como no DT-06 |
| V12 | Pré-requisito: sem violações de contraste nos temas atuais | Medição de 2026-11-16 em código anterior à jornada, com violações de texto (1 por viewport no tactical) | A tarefa 0.2 mede o estado atual. Violação de texto que sobrar entra na tarefa 3.4 |
| V13 | `postlint` com `node scripts/check-regras-estilo.ts` exige Node 22.18 ou mais novo | CI usa `node-version: '22'` e a máquina local tem Node 24.19 | Mantido. Se o CI falhar por versão, trocar para `scripts/check-regras-estilo.mjs` com as mesmas regras |

## Tasks

- [ ] 0. Preparar e medir a linha de base
  - [ ] 0.1 Conferir a branch e medir lint, testes e build
    - Na worktree: `git status --short --branch` (só `.kiro/specs/` não versionado), `git rev-parse --abbrev-ref HEAD` igual a `jornada-de-voo`
    - `graphify update src` e `graphify explain "AppShell" --graph src/graphify-out/graph.json`, repetindo para `BarraSuperior`, `AlternadorTema`, `MenuPerfil` e `SimuDeskApp`, para listar dependentes antes de editar. Se `graphify` falhar, registrar a limitação e usar `git grep`
    - `git grep -n -E "corporate|tactical|itfs_theme" -- src e2e index.html scripts playwright.config.ts` deve citar os 11 arquivos desta spec: `index.html`, `src/index.css`, `src/App.test.tsx`, `src/tokensContraste.test.ts`, `src/shell/tema.ts`, `src/shell/AlternadorTema.tsx`, `src/apps/SimuDeskApp/SimuDeskApp.tsx`, `e2e/contraste.spec.ts`, `e2e/contraste.helper.ts`, `e2e/contraste.relatorio.mjs` e `e2e/visual.spec.ts`. Divergência nessa lista vira nota no topo deste arquivo
    - Em `src/frontend`: `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build`. Anotar a contagem de testes, sem gravar arquivo novo
    - _Requirements: 13.10_
  - [ ] 0.2 Medir o contraste atual no navegador
    - Com as portas 8080 e 5173 livres: `npx.cmd playwright test e2e/contraste.spec.ts --project=mobile-375 --project=desktop-1440`. Não rodar `node e2e/contraste.relatorio.mjs` agora, porque ele sobrescreve arquivos do ciclo 2
    - Ler os JSON de `test-results/contraste/` (ignorados pelo Git) e anotar, por tema, as violações de texto (axe), de tamanho abaixo de 12 px e de status sem texto nem ícone. Registrar o número como linha de base da tarefa 3.4
    - _Requirements: 8.3, 8.4_

- [ ] 1. Fase 1: núcleo puro em `src/tema/`
  - [ ] 1.1 Criar o catálogo e o contrato de tokens
    - `src/frontend/src/tema/catalogo.ts`: `EsquemaCor`, `Tema`, `CATALOGO_TEMAS` (`operacao` escuro, `corporativo` claro, `editorial` escuro, `acolhedor` claro, nesta ordem), `IdTema`, `TEMA_PADRAO_PRODUTO` e `TEMA_DO_TERMINAL` iguais a `operacao`, `ehIdTema` (comparação com `===`, sem normalizar), `obterTema`, `validarCatalogo` com `ErroCatalogo`. O caractere U+0026 é montado por `String.fromCharCode(38)`, para o fonte não conter E comercial
    - `src/frontend/src/tema/contratoTokens.ts`: `CONTRATO_TOKENS` com os 63 nomes e categorias (33 de cor, 4 de sombra, 2 de família, 8 de tamanho, 4 de peso, 9 de espaço, 3 de raio), `NOMES_DO_CONTRATO`, `TOKENS_DE_COR`, `TOKENS_ESTRUTURAIS` (`--line-height-*`, `--measure`, `--focus-ring-width`, `--focus-ring-offset`, `--touch-target`, `--rail-width`, `--context-bar-height`, `--bottom-bar-height`, `--z-*`, `--duration-fast`, `--easing-standard`, `--row-height`, `--cell-padding-y`) e as listas de pares `FUNDOS_DE_TEXTO`, `TEXTOS`, `COMPONENTES`, `ICONES_DE_STATUS`, `FUNDOS_DE_COMPONENTE`
    - `src/frontend/src/tema/catalogo.test.ts` (obrigatório): catálogo real (ordem, padrão, terminal), identificador igual ao nome visível normalizado (minúsculas, sem acento, hífen no lugar de espaço), nome sem E comercial, contrato com 63 nomes e 33 de cor, exemplos de `validarCatalogo` por tipo de defeito
    - Sem cor hexadecimal em comentário ou texto dos arquivos de `src/tema/` que não são teste, porque `conformidade.test.ts` varre linhas com `#` seguido de hexadecimal
    - _Requirements: 1.1, 1.9, 13.1_
  - [ ]* 1.2 Escrever teste de propriedade da validação do catálogo
    - Acréscimo em `catalogo.test.ts`, com `paraTodo` de `src/testes/propriedade.ts`
    - **Property 1: Validação do catálogo**
    - **Validates: Requirements 1.1, 1.9, 13.1**
  - [ ] 1.3 Implementar o analisador de blocos CSS
    - `src/frontend/src/tema/blocosTokens.ts`, sem DOM e importando só `.ts` com extensão: `lerBlocos` (nível superior, ignora comentários, mantém `@media` e `@supports` com o seletor original), `lerDeclaracoes`, `serializarBloco`, `classificarBloco` (tema por `[data-theme='<id>']` como primeiro seletor; alto contraste claro por `html[data-contraste='alto']:not(.dark)`; escuro por `html[data-contraste='alto'].dark`), `blocosDeToken` (chaves: id do tema, `alto-contraste-claro`, `alto-contraste-escuro`), `conferirContrato(tokens)` (ausentes, vazios, excedentes) e `compararIdentificadores(catalogo, blocos)` (sem bloco, sem catálogo)
    - `src/frontend/src/tema/blocosTokens.test.ts` (obrigatório): exemplos com comentários, seletores múltiplos, `@media` e bloco `outro`
    - _Requirements: 1.2, 1.6, 1.8, 7.9_
  - [ ]* 1.4 Escrever teste de propriedade da ida e volta do analisador
    - Acréscimo em `blocosTokens.test.ts`
    - **Property 2: Ida e volta do analisador de blocos**
    - **Validates: Requirements 1.2, 7.9, 14.4**
  - [ ] 1.5 Escrever teste de propriedade da conferência do contrato
    - Acréscimo em `blocosTokens.test.ts` (obrigatório)
    - **Property 3: Conferência do contrato e correspondência entre catálogo e blocos**
    - **Validates: Requirements 1.6, 1.8**
  - [ ] 1.6 Implementar a persistência
    - `src/frontend/src/tema/persistencia.ts`: `CHAVE_TEMA = 'itfs_tema'`, `CHAVE_CONTRASTE = 'itfs_contraste'`, `EstadoContraste` (`alto` ou `padrao`), `ArmazenamentoChaveValor`, `obterArmazenamento`, `lerPreferenciaTema`, `salvarPreferenciaTema`, `lerContraste`, `salvarContraste`. A leitura nunca grava, exceção vira `null` ou `false`, nenhuma outra chave é lida
    - `src/frontend/src/tema/persistencia.test.ts` (obrigatório): exemplo sem compatibilidade (`itfs_tema` com `tactical` ou `corporate` vira preferência ausente e continua gravado; `itfs_theme` com `operacao` não é lido), armazenamento nulo e armazenamento que lança exceção
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 7.3, 7.7_
  - [ ] 1.7 Escrever testes de propriedade da persistência
    - Acréscimo em `persistencia.test.ts` (obrigatório)
    - **Property 11: Ida e volta da persistência**
    - **Validates: Requirements 4.4, 7.3**
    - **Property 12: Valores salvos inválidos**
    - **Validates: Requirements 3.7, 4.6, 7.7**
  - [ ] 1.8 Implementar o resolvedor de tema
    - `src/frontend/src/tema/resolvedor.ts`: `EsquemaNavegador`, `EntradasResolvedor`, `PermissoesEfetivas`, `permissoesEfetivas` (defensiva) e `resolverTema`, sem o contraste como parâmetro, sem leitura de armazenamento, relógio ou DOM
    - `src/frontend/src/tema/resolvedor.test.ts` (obrigatório): exemplos do catálogo real sem configuração (`dark` resulta em `operacao`, `light` em `corporativo`, `no-preference` e nulo em `operacao`) e trava com padrão
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_
  - [ ] 1.9 Escrever testes de propriedade do resolvedor
    - Acréscimo em `resolvedor.test.ts` (obrigatório)
    - **Property 6: Totalidade e determinismo do resolvedor**
    - **Validates: Requirements 3.10, 3.11**
    - **Property 7: Precedência da trava**
    - **Validates: Requirements 3.2, 3.8**
    - **Property 8: Preferência e cadeia de reserva**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.8**
  - [ ]* 1.10 Escrever teste de propriedade das equivalências do resolvedor
    - Acréscimo em `resolvedor.test.ts`
    - **Property 9: Equivalências de entrada do resolvedor**
    - **Validates: Requirements 3.7, 3.9**
  - [ ] 1.11 Implementar o envelope e a normalização da configuração
    - `src/frontend/src/tema/envelopeConfiguracao.ts` (sem DOM): `CAMPOS_DA_CONFIGURACAO`, `criarEnvelope` (nunca lança exceção, descarta o valor de campo desconhecido e guarda só o nome), `serializarParaHtml` (troca cada sinal de menor por `\u003c`)
    - `src/frontend/src/tema/configuracaoCliente.ts`: `CONFIGURACAO_AUSENTE`, `ID_BLOCO_CONFIGURACAO = 'itfs-config-cliente'`, `lerEnvelopeDoDocumento`, `normalizarConfiguracao` com os nove passos do design e as sete mensagens `console.warn` com prefixo `[Aparência]`, identificador cortado em 32 caracteres
    - `src/frontend/src/tema/configuracaoCliente.test.ts` (obrigatório): exemplos de cada aviso, bloco ausente sem aviso, trava sem padrão
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9, 5.11, 3.9_
  - [ ] 1.12 Escrever teste de propriedade da normalização
    - Acréscimo em `configuracaoCliente.test.ts` (obrigatório)
    - **Property 14: Normalização da lista e do padrão do cliente**
    - **Validates: Requirements 3.9, 5.3, 5.4, 5.5, 5.9**
  - [ ]* 1.13 Escrever teste de propriedade do envelope
    - Acréscimo em `configuracaoCliente.test.ts`
    - **Property 15: Higienização e tipos do envelope**
    - **Validates: Requirements 5.6, 5.7, 5.8**
  - [ ] 1.14 Implementar documento, inicialização e script inicial
    - `src/frontend/src/tema/documento.ts`: `ATRIBUTO_CONTRASTE = 'data-contraste'`, `VALOR_CONTRASTE_ALTO`, `CLASSE_ESCURO`, `aplicarAparencia` (usa `dataset.theme`, `classList.toggle` e `setAttribute` ou `removeAttribute`, nunca estilo inline, identificador inválido vira `operacao`) e `lerAparenciaDoDocumento`
    - `src/frontend/src/tema/inicializacao.ts`: `AmbienteAparencia`, `calcularAparencia` (só lê), `inicializarAparencia` (captura exceção e mantém os atributos de `index.html`), `criarAmbienteDoNavegador` (`matchMedia` ausente resulta em esquema nulo)
    - `src/frontend/src/tema/scriptInicial.ts`: uma linha útil que chama `inicializarAparencia` com `console.warn`
    - `documento.test.ts` e `inicializacao.test.ts` (obrigatórios), em jsdom: bloco do documento lido antes do resolvedor, ausência de bloco sem aviso, nenhum atributo `style` no `html`
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 4.2, 4.3, 4.7, 7.6, 7.8, 13.3_
  - [ ]* 1.15 Escrever teste de propriedade da aplicação no documento
    - Acréscimo em `documento.test.ts`
    - **Property 5: Aplicação no documento**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.7, 7.8, 13.3**
  - [ ]* 1.16 Escrever teste de propriedade da inicialização sem armazenamento
    - Acréscimo em `inicializacao.test.ts`
    - **Property 13: Inicialização com armazenamento indisponível**
    - **Validates: Requirements 4.7, 7.7**

- [ ] 2. Checkpoint da fase 1
  - Garantir que lint, `npm.cmd test -- --run` (testes de `src/tema/`) e `npm.cmd run build` passam, sem mudança visível. Perguntar ao usuário se surgirem dúvidas.
  - Commit local pequeno e coeso por grupo de tarefas, sem push.

- [ ] 3. Fase 2: CSS e tokens
  - Os testes `src/tokensContraste.test.ts` e `src/App.test.tsx` leem os nomes antigos e falham a partir da tarefa 3.1 até as tarefas 3.7 e 5.8. Nessas tarefas, rodar só os testes novos de `src/tema/` e `npm.cmd run build`
  - [ ] 3.1 Reestruturar `src/index.css` com `operacao` e `corporativo`
    - Cabeçalho do arquivo com os quatro perfis. Bloco `[data-theme='operacao'], [data-superficie='terminal']` (sem `.dark`) e bloco `[data-theme='corporativo']` (sem `:root`). Cada bloco declara os 63 nomes do contrato e nada mais
    - Tipografia, espaço e raio saem de `:root` e entram nos blocos de tema (valores atuais para os dois temas); em `:root` ficam só os tokens estruturais, os de densidade e o `[data-density='operacional']`
    - `color-scheme` sai dos blocos e vai para `html.dark, [data-superficie='terminal'] { color-scheme: dark }` e `html:not(.dark) { color-scheme: light }`
    - Valores `rgba()` de sombra e `--overlay-scrim` viram hexadecimal de 8 dígitos (DT-10). Remover `--nav-text` (conferir por `git grep` que não há uso), a regra `[data-theme='tactical'] .step-box strong` e os comentários que citam `tactical` e `corporate`
    - Bloco de aliases com seletor `:root, [data-superficie='terminal']`. `.skip:focus` passa a `background: var(--text-primary)` e `color: var(--bg-canvas)`. `.done .tick` passa a usar `--status-success-surface` no fundo e `--status-success-text` na cor e na borda
    - `src/frontend/index.html`: `data-theme="operacao" class="dark"` (estado sem JavaScript)
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 14.1_
  - [ ] 3.2 Acrescentar os blocos `editorial` e `acolhedor`
    - Copiar, sem alterar valor, as tabelas "Tokens de cor por tema", "Sombras por tema" e "Tipografia, espaço e raio por tema" do `design.md` desta spec: 63 nomes por bloco, na ordem do catálogo. `editorial` com `--font-weight-semibold: 500` e `--font-weight-bold: 600`; `acolhedor` com `--radius-lg: 12px`
    - Famílias: `--font-sans` e `--font-mono` iguais nos quatro temas. Nenhum arquivo de fonte novo
    - _Requirements: 1.2, 1.4, 9.1, 9.2, 10.3, 10.4_
  - [ ] 3.3 Acrescentar os Conjuntos_de_Alto_Contraste
    - `html[data-contraste='alto']:not(.dark)` (claro) e `html[data-contraste='alto'].dark, html[data-contraste='alto'] [data-superficie='terminal']` (escuro), cada um com os 33 tokens de cor das colunas "AC claro" e "AC escuro" do design e nada mais. Sombras valem as do tema resolvido
    - Conferir a especificidade: o alto contraste vence o bloco do tema no mesmo elemento e dentro do terminal
    - _Requirements: 7.2, 7.5, 7.8, 7.9, 7.10, 14.2_
  - [ ] 3.4 Migrar contêineres, títulos e contraste pendente para tokens
    - Trocar raio e preenchimento literais por `--radius-*` e `--space-*` em `.edu-card`, `.panel`, `.card-section`, `.step-box`, `.glossary-details`, `.kb-article`, `.chat` e `.chat-log`
    - Trocar tamanho e peso literais dos títulos (`.h1`, `.h2`, o `h1` da moldura de página e títulos de seção, por exemplo `font-size: 1.75rem` e `font-weight: 800`) por `--font-size-*` e `--font-weight-*`, para que Editorial e Acolhedor mudem a hierarquia sem regra por tema
    - Corrigir toda violação de texto anotada na tarefa 0.2 usando tokens, sem exceção por tema. Nenhum `font-size` literal abaixo de 12 px
    - Capturar 375 e 1440 px de `operacao` e `corporativo` antes e depois (Playwright MCP) e anotar as mudanças visuais no commit
    - _Requirements: 1.4, 9.1, 10.4, 10.5_
  - [ ] 3.5 Implementar a varredura de regras de estilo
    - `src/frontend/src/tema/regrasEstilo.ts` (sem DOM, importa só `blocosTokens.ts`): `hexForaDeBlocos(arquivo, texto)` (comprimentos 3, 4, 6 e 8, ignora comentários e, em `index.css`, o interior dos blocos de tema e de alto contraste) e `seletoresComTemaForaDeBloco(css)`
    - `src/frontend/scripts/check-regras-estilo.ts`: percorre `src/**/*.{ts,tsx,css}` sem `*.test.ts` e `*.test.tsx`, imprime `arquivo:linha: trecho` e termina com código 1. `package.json`: `"postlint": "node scripts/check-regras-estilo.ts"`. `tsconfig.node.json`: `include` com `plugins/**/*.ts` e `scripts/**/*.ts`
    - `src/frontend/src/tema/regrasEstilo.test.ts` (obrigatório): exemplos sintéticos. Conferir à mão que um hexadecimal temporário em um `.tsx` faz `npm.cmd run lint` falhar, e reverter
    - _Requirements: 1.3, 1.4, 1.7_
  - [ ]* 3.6 Escrever teste de propriedade da varredura de hexadecimais
    - Acréscimo em `regrasEstilo.test.ts`
    - **Property 4: Varredura de hexadecimais**
    - **Validates: Requirements 1.3, 1.7**
  - [ ] 3.7 Reescrever o Teste_de_Tokens, parte 1: enumeração e contrato
    - `src/frontend/src/tokensContraste.test.ts` lê `index.css` do disco e usa `blocosDeToken`. Saem o tipo `Tema` fixo, as expressões regulares dos dois blocos e o `describe.each` com nomes antigos
    - Conjunto esperado de blocos: identificadores de `CATALOGO_TEMAS` mais os dois de alto contraste; diferença em qualquer direção falha e lista os identificadores. Por tema: contrato completo sem vazio nem excedente, cores em hexadecimal de 6 ou 8 dígitos, `seletoresComTemaForaDeBloco` vazio
    - Formato de falha: `<tema>: <token> sobre <token> = <razão> (mínimo <limite>)`
    - _Requirements: 1.2, 1.6, 1.8, 1.9, 8.2, 8.11_
  - [ ] 3.8 Reescrever o Teste_de_Tokens, parte 2: pares de contraste dos temas
    - `describe.each(CATALOGO_TEMAS)`: texto (4 tokens) sobre os 5 fundos com 4,5 ou mais, mantendo a exceção atual só para `operacao` sobre `accent-surface`; hierarquia `text-secondary` acima de `text-muted`; texto de status sobre a superfície própria; `accent-contrast` sobre `accent-primary` e `accent-hover`; `border-control`, `focus-ring` e `accent-primary` sobre 3 fundos com 3 ou mais (DT-17); `border-strong` com 2 ou mais; `border-subtle` com piso 1,71 e 1,81 no `operacao` e 1,4 nos demais; ordem das bordas; pares de 8 para 1 do botão invertido e dos avisos
    - Manter as regras que leem linhas de CSS (`.btn-white`, `.banner-notice`, `.alert-*`) e trocar a regra do seletor `tactical` por `seletoresComTemaForaDeBloco`
    - _Requirements: 8.1, 8.2_
  - [ ] 3.9 Reescrever o Teste_de_Tokens, parte 3: alto contraste, terminal, Acolhedor e tipografia
    - Alto contraste: os 33 tokens de cor e nada mais; texto sobre os 5 fundos com 7 ou mais; componente e ícone de status sobre 3 fundos com 4,5 ou mais
    - Terminal: textos do `operacao` sobre `bg-canvas` e `bg-elevated` com 4,5 ou mais; do alto contraste escuro com 7 ou mais; borda do terminal sobre as superfícies de esquema claro com 2 ou mais
    - Acolhedor: `--radius-lg` igual a `12px`, esquema claro e luminância de `--bg-canvas` maior que a de `--text-primary`. Tipografia: todo `--font-size-*` com 12 px ou mais; `--font-mono` só com `JetBrains Mono`, `ui-monospace`, `Cascadia Code` e `Consolas`, terminando em `monospace`; primeira família `Inter` e `JetBrains Mono`
    - _Requirements: 7.5, 8.1, 8.12, 9.1, 9.2, 10.3, 14.4_

- [ ] 4. Checkpoint da fase 2
  - Garantir que lint (com `postlint`), `npm.cmd test -- --run` e `npm.cmd run build` passam. Os testes `App.test.tsx` e `BarraSuperior.test.tsx` ainda usam o alternador antigo e só são ajustados na tarefa 5.8, por isso o commit desta fase pode registrar essa dependência. Perguntar ao usuário se surgirem dúvidas.
  - Commit local, sem push.

- [ ] 5. Fase 3: aplicação em tempo de execução
  - [ ] 5.1 Implementar o armazém de aparência e o hook
    - `src/frontend/src/tema/armazemAparencia.ts`: `ModoSeletor` (`livre`, `travado`, `unico`), `InstantaneoAparencia`, `criarArmazemAparencia`, `obterArmazemAparencia` (instância única, registro silencioso). Criação sem regravar atributos quando o `html` já traz um tema permitido. `escolherTema` grava no `html` de forma síncrona, depois tenta persistir, depois notifica; retorna `false` com trava ou tema não permitido. `definirContraste` não toca `data-theme` nem `itfs_tema`. `obter` devolve o mesmo objeto até a próxima mudança
    - `src/frontend/src/tema/useAparencia.ts` com `useSyncExternalStore`
    - `armazemAparencia.test.ts` (obrigatório): criação sem gravar, trava, tema fora da lista
    - _Requirements: 2.4, 2.5, 2.6, 3.2, 4.1, 4.5, 4.8, 7.2, 7.3, 7.4_
  - [ ] 5.2 Escrever teste de propriedade do armazém
    - Acréscimo em `armazemAparencia.test.ts` (obrigatório), com `fetch` simulado que falha se for chamado
    - **Property 10: Modelo do armazém de aparência**
    - **Validates: Requirements 2.4, 2.5, 3.1, 4.1, 4.5, 7.2, 7.3, 7.4, 7.8**
  - [ ] 5.3 Trocar os ícones do catálogo
    - `src/frontend/src/ui/catalogoIcones.ts`: acrescentar `aparencia` (Palette), `alto-contraste` (Contrast) e `trava` (Lock) pelo `lucide-react` já instalado; remover `tema-tatico` e `tema-corporativo` (a remoção só compila depois da tarefa 5.7, por isso fazê-la lá). Ícone de confirmação: reaproveitar `confirmar` e de expansão `expandir`, que já existem
    - _Requirements: 6.2, 13.2_
  - [ ] 5.4 Criar `PainelAparencia` e `BotaoAparencia`
    - `src/frontend/src/shell/PainelAparencia.tsx`: `fieldset` com `legend` "Tema" e `input type="radio"` por tema oferecido (nome, texto "Claro" ou "Escuro" e ícone `confirmar` de 16 px só na opção marcada); modo `travado` com ícone `trava`, "Tema: <nome>" e "Definido pela empresa cliente"; modo `unico` só com o nome; em todos, `input type="checkbox" role="switch"` "Alto contraste". `change` em rádio chama `escolherTema` e depois `anunciar('Tema ativo: <nome>')` de `useAnuncioJornada` (V5), sem mover o foco
    - `src/frontend/src/shell/BotaoAparencia.tsx`: botão `.botao-contexto` com `aria-expanded` e `aria-controls` (só com o painel aberto, como `MenuPerfil`), ícone `aparencia`, texto `.botao-contexto-texto` "Aparência" e ícone `expandir`. Escape fecha e devolve o foco; `focusout` com destino fora e `pointerdown` fora fecham sem mover o foco
    - `src/frontend/src/index.css`: `.aparencia`, `.painel-aparencia` (posição como `.menu-perfil-painel`, largura `min(320px, calc(100vw - 2 * var(--space-4)))`, `max-height` da regra móvel de `.menu-perfil-painel`), `.seletor-tema`, `.opcao-tema` (grade, `min-height: var(--touch-target)`, destaque por `:has(input:checked)`), `.controle-contraste`, `.tema-definido`. Só classes e tokens, texto a partir de `--font-size-sm`. Controles vizinhos separados por `gap`
    - `PainelAparencia.test.tsx` (obrigatório), com `ContextoAnuncioJornada.Provider`: anúncio único sem mover foco, Escape com devolução de foco, `focusout`, `aria-expanded` e `aria-controls`, axe sem violações nos três modos, ícones de 16 ou 20 px, ausência de emoji
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 7.1, 13.2, 13.3, 13.5_
  - [ ]* 5.5 Escrever teste de propriedade da renderização do painel
    - Acréscimo em `PainelAparencia.test.tsx`
    - **Property 16: Renderização do painel de aparência**
    - **Validates: Requirements 6.1, 6.2, 6.6, 6.8, 6.9, 7.1**
  - [ ] 5.6 Implementar o plugin de build e o script inicial
    - `src/frontend/plugins/aparenciaInicial.ts`: `aparenciaInicial(opcoes)` e `montarTagsAparencia`. `transformIndexHtml` lê `config/tema-cliente.json` (ausente: sem bloco), monta o envelope, gera o script com `build()` do Vite em modo biblioteca IIFE (`configFile: false`, `write: false`, `minify`, `target: 'es2019'`) com cache até mudar um arquivo de `src/tema/`, e injeta bloco JSON e script em `head-prepend`, nesta ordem. `generateBundle` emite `config/tema-cliente.json` só com os três campos quando o envelope não tem erro. `configureServer` observa o arquivo e `src/tema/` e serve o JSON higienizado. Falha do build aninhado derruba o build principal com mensagem que cita `aparenciaInicial`. Imprime tamanho e hash `sha256` do script
    - `vite.config.ts`: `plugins: [react(), aparenciaInicial()]`. `vitest.config.ts` não muda e não carrega o plugin
    - `src/frontend/src/tema/aparenciaInicial.test.ts` (obrigatório): `montarTagsAparencia` com e sem envelope, ordem das tags, `serializarParaHtml` sem sinal de menor
    - Conferir que o servidor da produção entrega `/config/tema-cliente.json` como arquivo estático antes do rewrite de página (`vercel.json` e `nginx.conf` com `try_files $uri`). Não alterar esses arquivos
    - _Requirements: 4.3, 5.1, 5.6, 5.10, 7.6_
  - [ ] 5.7 Integrar na casca e remover o alternador antigo
    - `src/frontend/src/educacao/BarraSuperior.tsx`: remover o `AlternadorTema` da lista Mais (`li.nav-mais-tema`) e o `div.shell-rail-rodape`; acrescentar `BotaoAparencia` em `.barra-contexto-acoes`, entre `slotDireitoSessao` e `MenuPerfil`
    - `src/frontend/src/shell/MenuPerfil.tsx`: remover o `AlternadorTema` e o import
    - `src/frontend/src/shell/AppShell.tsx`: remover estado e `useEffect` de tema; `DensidadeShell` passa a ser exportado daqui. Remover `contextoShell.ts`, `tema.ts` e `AlternadorTema.tsx`
    - `src/frontend/src/main.tsx`: remover `aplicarTema(carregarTema())` e chamar `obterArmazemAparencia()` antes do `render`
    - `src/frontend/src/apps/SimuDeskApp/SimuDeskApp.tsx`: `data-theme="tactical"` do `.terminal-shell` vira `data-superficie="terminal"`
    - `src/frontend/src/index.css`: remover `.alternador-tema*`, `.shell-rail-rodape`, `.nav-mais-tema` e a regra de `.dica` que só serve ao alternador. Remover `tema-tatico` e `tema-corporativo` de `catalogoIcones.ts`
    - Conferir por `git grep -n -E "AlternadorTema|useShell|ROTULOS_TEMA|shell/tema" -- src e2e` que não sobra referência
    - _Requirements: 1.5, 2.6, 4.8, 13.3, 14.1_
  - [ ] 5.8 Ajustar os testes existentes à casca nova
    - `src/App.test.tsx`: o teste do alternador passa a usar `BotaoAparencia` e os nomes novos; `dataset.theme` com `operacao` e `corporativo`; `itfs_tema`; estrutura igual em todos os temas (`innerHTML` de `#root` com painel fechado, por tema do catálogo); navegar entre páginas sem mudar atributos do `html`
    - `src/educacao/BarraSuperior.test.tsx`: trocar a expectativa do grupo "Tema da interface" na lista Mais por ausência dele e por presença do botão "Aparência" na barra de contexto
    - `src/tema/regrasEstilo.test.ts`: acrescentar o exemplo que percorre `src/`, `index.html` e `scripts/` e falha, com arquivo e linha, se achar `corporate`, `tactical` ou `itfs_theme` fora de `persistencia.test.ts` e `regrasEstilo.test.ts`
    - _Requirements: 1.5, 2.6, 4.6, 6.12_
  - [ ]* 5.9 Escrever teste de propriedade das requisições sem aparência
    - `src/frontend/src/api/client.aparencia.test.ts` (não edita `client.ts`), com `fetch` simulado
    - **Property 17: Requisições sem dados de aparência**
    - **Validates: Requirements 11.1**
  - [ ] 5.10 Cobrir dependências e conformidade
    - `src/frontend/src/dependencias.test.ts`: `package.json` sem Tailwind, shadcn, biblioteca de animação, Radix nem React Aria, e sem dependência de produção nova
    - `src/frontend/src/jornada/conformidade.test.ts`: incluir `/src/tema/` por prefixo e acrescentar `AppShell.tsx`, `BotaoAparencia.tsx`, `PainelAparencia.tsx`, `MenuPerfil.tsx` e `SimuDeskApp.tsx` a `ALTERADOS_FORA_DA_JORNADA`; o teste "encontra os arquivos que deveria vigiar" passa a exigir `/src/tema/resolvedor.ts`. Varredura de `style=` nos arquivos novos (largura dinâmica só fora de `jornada`)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [ ] 5.11 Testar a verificação de segredos no `dist`
    - `src/frontend/src/tema/checkBundleSecrets.test.ts`: com `execFileSync(process.execPath, ['scripts/check-bundle-secrets.mjs', pastaTemporaria])`, uma pasta com `index.html` limpo termina com código 0; uma pasta cujo `index.html` contém um padrão de segredo montado por concatenação termina com código 1 e cita o arquivo. Sem alterar o script (V4)
    - _Requirements: 5.6, 13.8, 13.9_

- [ ] 6. Checkpoint da fase 3
  - Garantir que lint, `npm.cmd test -- --run` e `npm.cmd run build` passam, com `data-theme="operacao"` no primeiro carregamento. Perguntar ao usuário se surgirem dúvidas.
  - Commits locais pequenos e coesos por grupo de tarefas, sem push.

- [ ] 7. Fase 4: Playwright
  - [ ] 7.1 Adaptar o auxiliar de medição
    - `src/frontend/e2e/contraste.helper.ts`: `ct.limiar` recebe esquema e estado de contraste em vez de comparar o tema com `corporate`; divisor de 1,4 nos temas claros e nos escuros novos e o piso atual no `operacao`; `LIMIARES.divisorCorporate` passa a `divisorClaro`
    - Acrescentar medições: nó de texto visível com `font-size` calculado abaixo de 12 px; status sem texto nem `svg.icone` (identificar as classes reais de status por `git grep`: `.estado`, `.chip`, `.alert-*`, `.banner-*`); cores calculadas de `.terminal-shell` e `.terminal-output` contra `--bg-canvas` e `--text-primary` esperados de `blocosDeToken` lido no Node. Axe com `color-contrast` no contraste padrão e `color-contrast-enhanced` no alto contraste
    - _Requirements: 6.11, 7.5, 8.4, 8.8, 9.1, 14.5, 14.6_
  - [ ] 7.2 Parametrizar a Spec_de_Contraste e o relatório
    - `src/frontend/e2e/contraste.spec.ts`: `TEMAS` vem de `CATALOGO_TEMAS`; matriz tema por contraste, com contraste `padrao` em todos os projetos visuais e `alto` só em `mobile-375` e `desktop-1440`; `preparar` grava `itfs_tema` e `itfs_contraste` e confere `data-theme` e `data-contraste`; nome do JSON `projeto__tema__contraste__grupo.json`; célula "Painel de Aparência" com o painel aberto; terminal conferido na célula do SimuDesk
    - Ao fim de cada teste, depois de gravar o JSON, `expect(violacoes, resumo).toEqual([])` só com texto, tamanho mínimo, status sem cor e terminal (V8). Um teste final confere que existe JSON para cada par tema e contraste esperado
    - `src/frontend/e2e/contraste.relatorio.mjs`: `ORDEM_TEMA` pela ordem do catálogo (importando `../src/tema/catalogo.ts`), textos e limiares citando `operacao` e `corporativo`, linha "Temas" com o catálogo inteiro, destino `docs/auditoria-ui-ux/temas/` (`LINHA_DE_BASE_TEMAS.md` e `.json`). Sem E comercial no texto gerado
    - _Requirements: 6.11, 7.5, 8.3, 8.4, 8.11, 14.5, 14.6_
  - [ ] 7.3 Parametrizar a Spec_Visual e a configuração do Playwright
    - `src/frontend/e2e/visual.spec.ts`: `TEMAS` do catálogo; `preparar` grava `itfs_tema`; trocar os usos literais de `tactical` e `corporate` por `operacao` e `corporativo`; capturas de todas as páginas em todos os temas, em 375 e 1440 px; captura `aparencia` com o painel aberto; capturas com alto contraste de Início, Plano de voo e Cabine em `operacao` e `corporativo`
    - Teste de zoom: viewport 640 por 450 px, percorrendo os quatro temas, com controles dentro da largura e nenhum texto com `overflow: hidden` e `scrollWidth` maior que `clientWidth`
    - Teste de espaçamento por `gap` (Requisito 10.5): controle (`button`, `a.btn`, `input`, `select`, `textarea`) com irmão controle em contêiner flex ou grid precisa ter margem calculada `0px` ou automática; falha com seletor e margem. Rodar primeiro só para relatar, corrigir as margens em `index.css` por `gap` e só então deixar o teste falhar
    - Teste de estrutura (Requisito 1.5): `ariaSnapshot` de `main` de cada página igual entre os quatro temas, só no `desktop-1440`
    - `src/frontend/playwright.config.ts`: altura de 900 px em `mobile-375`, `tablet-768` e `desktop-1280`; sem projeto novo (V6)
    - _Requirements: 1.5, 8.5, 8.6, 8.7, 10.5_
  - [ ] 7.4 Criar `e2e/aparencia.spec.ts` no projeto `chromium`
    - `src/frontend/e2e/aparencia.spec.ts` com os casos: tema antes da Primeira_Pintura (`MutationObserver` e `PerformanceObserver` de `paint`, com e sem contraste e com configuração injetada por `page.route` no HTML, V7); configuração do cliente (modo travado, avisos `[Aparência]` esperados e nenhum aviso sem bloco); teclado (Tab, Enter, setas com retorno circular, Espaço, Escape devolvendo o foco, Tab para fora); tempo de aplicação de 100 ms ou menos; área de toque de 44 por 44 px e contorno de foco de 2 px com afastamento de 2 px; janela de 320 px sem texto cortado; painel inteiro dentro da janela e acima da barra inferior em 375 px (WCAG 2.2, foco não obscurecido)
    - Sessão preservada (`/cabine/triagem-engenharia-social?nova=1`, texto no terminal e nota no ITSM) com nenhuma requisição para `/api` durante as trocas; requisições iguais entre os temas e sem `itfs_` nem identificador de tema; Replay abre no tema atual; `color-scheme` por esquema, também com contraste; `font-family` do terminal começando por `JetBrains Mono`; `prefers-reduced-motion: reduce` com troca sem transição; arquivos `.woff2` bloqueados sem mensagem ao aluno e sem requisição de fonte para outra origem
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 4.8, 5.1, 5.2, 6.1, 6.3, 6.4, 6.5, 6.10, 6.12, 7.2, 7.4, 7.6, 7.8, 7.10, 8.9, 9.3, 9.4, 9.8, 11.1, 11.2, 11.3, 11.4, 11.6, 14.3_

- [ ] 8. Checkpoint da fase 4
  - Com as portas 8080 e 5173 livres, rodar `npx.cmd playwright test e2e/aparencia.spec.ts --project=chromium` e `npx.cmd playwright test e2e/contraste.spec.ts --project=mobile-375 --project=desktop-1440`. Perguntar ao usuário se surgirem dúvidas.
  - Commit local, sem push. Não commitar `test-results/`.

- [ ] 9. Fase 5: teste de integração do backend
  - [ ] 9.1 Criar `SeparacaoAparenciaTests.cs`
    - `src/backend/tests/Simulador.Api.Tests/SeparacaoAparenciaTests.cs`, no padrão de `CenariosPorEscalaApiTests.cs` (`IClassFixture<WebApplicationFactory<Program>>`, `POST /api/sessoes`, ações por `POST /api/sessoes/{id}/acoes` com `seqEsperado`, `GET /api/sessoes/{id}/replay`). Para cada cenário de `CatalogoCenarios`, criar a sessão, executar algumas ações e percorrer cada evento do replay em JSON: falha se um valor de texto for exatamente `operacao`, `corporativo`, `editorial`, `acolhedor` ou `telemetria`, ou se uma chave for `tema`, `theme`, `contraste`, `contrast`, `itfs_tema` ou `itfs_contraste`. A mensagem cita o tipo de evento e o cenário
    - Não alterar `Simulador.Dominio`, `Simulador.Avaliacao` nem `docs/vetores-jcs-sha256.json`
    - _Requirements: 11.7, 13.10_

- [ ] 10. Fase 6: documentação
  - [ ] 10.1 Atualizar `docs/design/DESIGN.md` e o steering
    - `docs/design/DESIGN.md`: tabela de temas sem a coluna "Nome atual no CSS"; remover "Estado atual do código" e os "(hoje `corporate`)" e "(hoje `tactical`)" dos títulos; acrescentar as tabelas de cor de `editorial`, `acolhedor`, alto contraste claro e escuro com os valores do `index.css`; nota de que o terminal fica sempre escuro (D3); seção "Configuração do cliente" com caminho `src/frontend/config/tema-cliente.json`, os três campos, o exemplo do design, o aviso de que trocar o arquivo publicado sem refazer o build não tem efeito e a regra de não colocar segredo. Sem E comercial e sem emoji
    - `.kiro/steering/design-system.md`: tirar "(hoje `tactical` no CSS)", "(hoje `corporate`)" e a frase sobre a renomeação. A pasta `.kiro` só entra em commit com pedido do usuário
    - _Requirements: 12.4, 13.1_
  - [ ] 10.2 Registrar a sincronização com o Figma
    - No `design.md` desta spec, seção "Registro de sincronização com o Figma": atualizar a tabela "Registro de mudanças" (data, valor anterior, valor novo e "Figma recebeu") e as divergências pendentes
    - Se o servidor MCP do Figma estiver disponível, ler o arquivo `wa7yLJvkj6BvvnssUqDx1H`, renomear os modos `tactical` e `corporate` para `operacao` e `corporativo`, criar `editorial` e `acolhedor` na coleção Cor e nas coleções Espaco e raio e Tipografia, e conferir o limite de modos do plano. Sem o MCP, deixar tudo como pendente e avisar o usuário. O valor de `index.css` prevalece
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 11. Fase 7: validação
  - [ ] 11.1 Executar as varreduras
    - Nos arquivos alterados por `git diff --name-only main...HEAD` (`.md`, `.ts`, `.tsx`, `.css`, `.html`, `.json`, `.cs`): E comercial com `Select-String` e o caractere montado por `[string][char]38` (o operador lógico duplo do TypeScript não conta); emoji por `\p{Extended_Pictographic}`; `style=` nos arquivos novos; `git grep -n -E "corporate|tactical|itfs_theme"` só nas exceções permitidas e em `docs/auditoria-ui-ux/`; `git diff main -- src/frontend/package.json src/frontend/package-lock.json` só com o script `postlint`
    - _Requirements: 1.7, 13.1, 13.2, 13.3, 13.4_
  - [ ] 11.2 Executar lint, Vitest e build
    - Em `src/frontend`: `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build` (inclui `check-bundle-secrets.mjs`). Corrigir toda falha e anotar a contagem de testes
    - _Requirements: 13.8, 13.10_
  - [ ] 11.3 Fazer o build de conferência com configuração de cliente
    - Criar `src/frontend/config/tema-cliente.json` temporário (lista `corporativo` e `acolhedor`, `travado` verdadeiro) e rodar `npm.cmd run build`. Conferir em `dist/index.html`: bloco `itfs-config-cliente` antes do script inline e script antes do primeiro `link rel="stylesheet"`; `dist/config/tema-cliente.json` só com os três campos; hash `sha256` impresso. Repetir sem o arquivo: nenhum bloco. Apagar o arquivo temporário
    - _Requirements: 4.3, 5.6, 5.10, 13.8_
  - [ ] 11.4 Executar o Playwright
    - Com as portas 8080 e 5173 livres e uma execução por vez: `npm.cmd run test:e2e -- --project=chromium --project=mobile-375 --project=tablet-768 --project=desktop-1280 --project=desktop-1440`, cobrindo `navegacao`, `demonstracao`, `jornadas`, `contraste`, `visual` e `aparencia`. Parar após duas falhas pela mesma causa e investigar. Gerar o relatório com `node e2e/contraste.relatorio.mjs` e commitar só `docs/auditoria-ui-ux/temas/`
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 14.5_
  - [ ] 11.5 Executar `dotnet test` e conferir o motor intocado
    - `dotnet test src/backend/Simulador.slnx` passando, com o teste novo da tarefa 9.1
    - `git diff --stat main -- src/backend/src docs/vetores-jcs-sha256.json render.yaml src/frontend/vercel.json` vazio
    - _Requirements: 11.7, 13.10_
  - [ ] 11.6 Inspecionar as capturas
    - Abrir uma amostra dos PNG de `src/frontend/test-results/visual` (início, plano de voo, aulas, caderno e uma página de Cabine, nos quatro temas, em 375 e 1440 px, mais `aparencia` e o alto contraste) e conferir hierarquia de títulos do Editorial, cantos e cartões do Acolhedor, contorno de container e separadores no Corporativo e terminal escuro em todos. Anotar o que foi visto e o que não foi
    - _Requirements: 8.5, 10.3, 10.4, 14.1_

- [ ] 12. Fechamento antes do congelamento
  - [ ] 12.1 Conferir os commits e o prazo
    - Na worktree: `git status` limpo (fora `.kiro` não versionada), `git log --oneline main..jornada-de-voo` com commits pequenos e descritivos, tudo commitado antes de 30 de novembro de 2026, 23h59
    - Push, abertura de PR e merge só com autorização explícita do usuário. Nenhum comando destrutivo do Git
    - _Requirements: 13.10_

- [ ] 13. Checkpoint final
  - Garantir que todos os testes passam. Perguntar ao usuário se surgirem dúvidas.

## Notes

- Sub-tarefas com `*` são testes de propriedade opcionais, além do essencial. São obrigatórias as Properties 3, 6, 7, 8, 10, 11, 12 e 14, e todos os testes de exemplo, de render, de Playwright e de integração.
- Cada teste de propriedade usa `src/frontend/src/testes/propriedade.ts` (`paraTodo`, `criarGerador`), com no mínimo 100 execuções e o comentário `Feature: temas-selecionaveis, Property N: <texto>`.
- Cada tarefa cita os requisitos de `requirements.md` para rastreabilidade. Detalhes de implementação, tabelas de valores e mensagens estão em `design.md`.
- Nenhuma tarefa altera `src/backend/src`, `docs/vetores-jcs-sha256.json`, `render.yaml`, `src/frontend/vercel.json`, `src/frontend/nginx.conf`, `src/frontend/src/api/client.ts` nem as dependências do `package.json`.
- Telemetria, painel administrativo, persistência no backend e variação de layout por tema ficam fora do escopo.
- O que depende de pessoa ou de decisão do usuário: edição do arquivo Figma (tarefa 10.2), push, PR e merge (tarefa 12.1) e a inclusão da pasta `.kiro` em commit.
- Prazo de congelamento: 30 de novembro de 2026, 23h59. Os checkpoints 2, 4, 6 e 8 fazem commits locais para que uma interrupção não perca trabalho.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1"] },
    { "id": 1, "tasks": ["0.2", "1.1"] },
    { "id": 2, "tasks": ["1.2", "1.3", "1.6", "1.8", "1.11", "5.3"] },
    { "id": 3, "tasks": ["1.4", "1.5", "1.7", "1.9", "1.10", "1.12", "1.13", "1.14"] },
    { "id": 4, "tasks": ["1.15", "1.16"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["3.2"] },
    { "id": 7, "tasks": ["3.3"] },
    { "id": 8, "tasks": ["3.4"] },
    { "id": 9, "tasks": ["3.5", "3.7"] },
    { "id": 10, "tasks": ["3.6", "3.8"] },
    { "id": 11, "tasks": ["3.9"] },
    { "id": 12, "tasks": ["5.1", "5.6"] },
    { "id": 13, "tasks": ["5.2", "5.4", "5.11", "9.1"] },
    { "id": 14, "tasks": ["5.5", "5.7", "5.9"] },
    { "id": 15, "tasks": ["5.8", "5.10"] },
    { "id": 16, "tasks": ["7.1"] },
    { "id": 17, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 18, "tasks": ["10.1", "10.2"] },
    { "id": 19, "tasks": ["11.1"] },
    { "id": 20, "tasks": ["11.2"] },
    { "id": 21, "tasks": ["11.3", "11.5"] },
    { "id": 22, "tasks": ["11.4"] },
    { "id": 23, "tasks": ["11.6"] },
    { "id": 24, "tasks": ["12.1"] }
  ]
}
```
