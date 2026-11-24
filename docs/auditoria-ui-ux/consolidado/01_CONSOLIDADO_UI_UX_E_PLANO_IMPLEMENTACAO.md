# 01. Consolidado UI/UX e plano de implementação

Etapa 1 do plano de execução. Data: 2026-11-16. Branch: `redesign-ui-ux` (HEAD `6b43745`). Nenhum arquivo em `src/` foi alterado.

Este documento junta as quatro auditorias (Kiro, Codex, Copilot, Lovable), arbitra as divergências e fecha o escopo. As decisões marcadas como "proposta" aguardam o usuário (ver seção 8 e o arquivo `00_PLANO_EXECUCAO_E_PROGRESSO.md`). O backlog completo está em `02_BACKLOG_UNIFICADO_UI_UX.csv`.

## 1. Como as fontes foram usadas

| Fonte | Peso | Motivo |
|---|---|---|
| Kiro | Base | Única auditoria com navegação real em produção (Playwright em 375, 1280 e 1440), medições, tokens calculados, mockup e especificação de código. |
| Codex | Verificação cruzada | Boa leitura de contratos e de honestidade do produto (Mentor, SLA, replay). Declara que não abriu navegador, então os achados visuais vêm dos screenshots fornecidos. |
| Copilot | Verificação cruzada | Resumido. Contribui com a separação editorial e operacional e com a lista de ícones. Declara capturas locais, sem medições. |
| Lovable | Complementar | Diagnóstico forte sobre a ação de segurança do ITSM. Os números de linha e a contagem de 92 emojis não têm método descrito, então foram tratados como menor confiança. |

Contagem de emojis: Kiro 81, Lovable 92, soma do mapa do plano 89. Os números diferem por método de contagem. Para o escopo, vale a regra "zero emoji estrutural na UI", não o número.

## 2. Fatos confirmados no código nesta etapa

Verificados com `graphify query` e leitura dirigida, sem ler os fontes inteiros.

| Fato | Evidência | Consequência para o plano |
|---|---|---|
| A API já entrega `prioridade`, `slaAlvoMinuto`, `abertoEmMinuto` e `slaVencido` por chamado. | `src/frontend/src/api/types.ts` (chamado) | O SLA visual pode usar dado real. Não precisa de tabela estimada na UI, como o Kiro chegou a propor. |
| Cada critério do Juiz 360 traz `eventoSeq`, `motivo`, `praticaEsperada` e `linkKb`. Cada evento traz `criterios?: string[]`. | `types.ts` (`CriterioAvaliacaoDto`, `EventoDto`) | O comparativo "Você fez / Prática recomendada" e a marca de critério na linha do tempo usam só campos existentes. Resolve a ressalva do Codex. |
| Os tipos de evento reais no cliente são `PoliticaSegurancaConsultada`, `TokenSolicitado`, `ResetRecusado`, `SenhaResetadaIndevidamente`, `PistaSolicitada`, `AcaoRejeitada`, `DnsRegistroCorrigido`, `AcessoPastaRestabelecido`, `ComandoExecutado`, `ComandoNaoSuportado`. | `App.tsx` linhas 260 a 280 | Os nomes de exemplo do Kiro (`ChamadoAssumido`, `PoliticaConsultada`) são ilustrativos. O mapa `rotulosEvento` deve partir da lista real do backend. |
| `App.tsx` já guarda `nivel1Passos` (política, token, recusado) derivado dos eventos. | `App.tsx` linhas 44 a 60 e 270 a 276 | O `MissionGuide` reaproveita essa lógica de leitura, sem criar avaliação nova. |
| "Consultar Politica KB-001" só envia a ação ao motor e não mostra o artigo. | `ItsmApp.tsx` linha 99, `App.tsx` linha 533 (`abrirArtigoKb` já existe) | Achado do Lovable confirmado. Um callback opcional no ITSM abre o artigo sem mudar contrato de API. |
| Os testes de navegação clicam em `button` com nome `/📖 Aulas/`, `/📓 Caderno/`, `/🤖 Mentor IA/` dentro de `navigation` com nome `/Navegação principal/i`. | `App.test.tsx` linhas 99 a 110 | Remover emoji muda esses nomes: o teste é atualizado na etapa 2. Os itens de navegação devem continuar `button`. Dois `nav` com nome que casa com `/Navegação principal/i` (rail e barra inferior) quebrariam o seletor. Usar um único `nav` que muda de posição por CSS. |
| O Kiro propõe itens de navegação como `<a href>`. | Kiro 05, seção 4.2 | Rejeitado. Sem roteador, o papel `button` preserva os testes. |
| `axe-core` e Vitest já estão instalados. `lucide-react` não está. Não há `@fontsource`. | `package.json` | Ícones por biblioteca e fontes empacotadas exigem `npm install` e a confirmação do usuário (regra 7). |
| O Playwright tem um projeto desktop e a spec `jornadas.spec.ts` usa nomes como `Iniciar no Simulador`, `Assumir Chamado`, `Consultar Politica KB-001`, `Juiz 360º e Replay`. | `playwright.config.ts`, `e2e/jornadas.spec.ts` | Corrigir acentos e renomear botões exige atualizar a spec no mesmo passo. Criar `src/textos/workstation.ts` e importar nos componentes e nos testes. |
| `App.test.tsx` exige `heading` "IT Career Simulator" e "Missão 0", `radio` por nome de cenário e o painel "Progressão de Carreira e Currículo Vivo" com botão de exportar. | `App.test.tsx` linhas 39 a 96 | A nova home mantém `h1` com "IT Career Simulator" e o grupo de rádios. O teste muda de forma deliberada para a Missão 0 e para o painel de carreira. |

## 3. Convergências entre as auditorias

| # | Tema | K | C | P | L | Decisão consolidada |
|---|---|---|---|---|---|---|
| 1 | Trocar emojis estruturais por SVG de traço único (1.75 px) com `aria-hidden` quando decorativo | sim | sim | sim | sim | Adotar. Componente `Icon` único. |
| 2 | Remover a faixa arco-íris (`.topnav::after`), a legenda de cores e a sub-barra | sim | sim | sim | sim | Adotar. |
| 3 | Uma cor de acento. Verde, âmbar e vermelho só para estado. Roxo deixa de ser a cor da IA | sim | sim | sim | sim | Adotar. |
| 4 | Menos cartões e menos pílulas. Badge só para estado ou contagem | sim | sim | sim | sim | Adotar. Superfície plana com divisor de 1 px. |
| 5 | Shell único que acompanha o aluno do estudo ao turno | sim | sim | sim | sim | Adotar. |
| 6 | Workstation em split-screen: guia da missão à esquerda e ferramentas à direita | sim | sim | sim | sim | Adotar. |
| 7 | Home com uma ação principal. Pomodoro, plano e XP saem do primeiro viewport | sim | sim | sim | parcial | Adotar. |
| 8 | Duas densidades: editorial (estudo) e operacional (ITSM, Chat, SimuDesk, Replay) | sim | parcial | sim | sim | Adotar com atributo `data-density`. |
| 9 | Texto de leitura entre 65 e 72 caracteres | sim | sim | sim | sim | Adotar `--measure: 68ch`. |
| 10 | Tokens semânticos claro e escuro, grade de 4 px, três raios | sim | sim | sim | sim | Adotar. |
| 11 | Replay como linha do tempo legível. JSON atrás de "Ver evento bruto" | sim | sim | sim | sim | Adotar. |
| 12 | Credencial verificável com hash e algoritmo recolhidos em "Detalhes técnicos" | sim | sim | sim | sim | Adotar. Sem alterar `jcs.ts` nem a assinatura. |
| 13 | Skeleton e aviso de cold start com tentativa nova | sim | sim | sim | sim | Adotar. |
| 14 | Teste de overflow e axe em 375, 768, 1280 e 1440 | sim | sim | sim | parcial | Adotar na etapa 6. |
| 15 | Copy em sentence case, sem pontos médios, sem gíria e sem emoji | sim | sim | sim | sim | Adotar com glossário fixo. |
| 16 | Barra inferior fixa no celular | sim | sim | sim | não | Adotar. |
| 17 | Labs visuais (hardware, cabeamento, topologia, editor, chamada) são ondas futuras | sim | sim | sim | sim | `POS`. |
| 18 | Preservar o motor determinístico, `onAcao`, `onChat` e os DTOs | sim | sim | sim | sim | Regra inegociável. |

## 4. Arbitragem das divergências

Cada item traz as opções, a escolhida, o motivo e o risco.

### 4.1 Tipografia

| Fonte | Interface | Dados |
|---|---|---|
| Kiro | Inter Variable empacotada | JetBrains Mono |
| Codex | Inter, sem carregar outra fonte externa | IBM Plex Mono |
| Copilot | Inter ou Plus Jakarta Sans, corpo 15 px | IBM Plex Mono |
| Lovable | Inter ou Plus Jakarta Sans | JetBrains Mono |

**Escolha (proposta):** Inter Variable para interface e leitura, JetBrains Mono para chave de chamado, minuto simulado, hash e terminal. Etapa de 11 a 36 px, corpo de leitura 16 px com altura de linha 1.7, corpo de interface 14 px, `tabular-nums` em SLA e minutos.

**Motivo:** o Kiro mediu que a fonte hoje depende da máquina (Inter declarada, sem `@font-face`), então escolas caem em Segoe UI ou Arial. Empacotar resolve isso. Inter e JetBrains Mono formam um par com famílias distintas e têm licença OFL. Plus Jakarta Sans e IBM Plex Mono são alternativas válidas, mas não trazem ganho que compense uma terceira família.

**Risco:** empacotar exige `npm install` de dois pacotes `@fontsource-variable/*` ou arquivos `woff2` no repositório. Sem a autorização, o fallback é a pilha `Segoe UI, system-ui`, o que mantém o problema atual de variação por máquina. Impacto no bundle: pequeno, com subset latino.

### 4.2 Layout da home

| Fonte | Proposta |
|---|---|
| Kiro | Um CTA "Iniciar primeiro missão" e uma tabela de 5 cenários. Pomodoro e plano vão para o menu de perfil. |
| Codex | "Retomar missão", "Próxima missão" e lista de todas as missões. |
| Copilot | "Continuar" e cartões de trilha, mais uma linha "Hoje" com revisão e foco. |
| Lovable | Não detalha a home. |

**Escolha (proposta):** um bloco principal que muda conforme o estado, seguido da tabela de missões do Kiro.
- Sem progresso: "Iniciar primeiro missão" (cenário 1, com o guia da Missão 0 já aberto no laboratório).
- Com progresso: "Retomar missão" com a etapa atual (ideia do Codex).
- Abaixo: tabela semântica de 5 linhas (nível, cenário, tempo, estado). Cada linha é um `radio` estilizado como linha, e o botão do cenário selecionado continua chamado "Iniciar no Simulador".
- Pomodoro, plano de estudo, meta, streak e XP vão para um bloco "Seu progresso" no menu de perfil. O bloco de carreira e o verificador de currículo vão para o destino "Credencial" (extração, sem redesenho).

**Motivo:** o Kiro mediu 7056 px de altura no celular e 6 blocos competindo no primeiro viewport. O Codex acerta ao tratar o aluno que volta de forma diferente do aluno novo, e o vídeo de 3 minutos exige um caminho curto. Cartões de trilha do Copilot repetem o problema de peso igual dos cartões atuais.

**Risco:** o arquivo `TelaInicial.tsx` tem 38 KB e 17 estilos inline, e `App.test.tsx` o cobre (rádios, "Missão 0", painel de carreira). Mitigação: extrair antes de reescrever e atualizar os testes que mudam de propósito, no mesmo passo. Meta mensurável: altura da home menor que 1800 px em 375.

### 4.3 Navegação desktop e mobile

| Fonte | Desktop | Mobile |
|---|---|---|
| Kiro | Rail de 56 px com 6 itens (Missões, Aulas, Laboratório, Caderno, Mentor, Credencial). Barra de contexto de 44 px com breadcrumb. | Barra inferior de 56 px com 5 itens. Credencial no menu de perfil. |
| Codex | Barra superior com Início, Trilhas, Caderno e Progresso. Tutor como apoio contextual. | Barra inferior com 4 destinos. |
| Copilot | Rail de 56 px com 4 grupos (Início, Aprender, Trabalhar, Comprovar). Barra de 48 px. | Barra inferior com 4 grupos. |
| Lovable | Sem proposta de shell. | Sem proposta. |

**Escolha (proposta):** a do Kiro, com dois ajustes.
1. Desktop: rail de 56 px com 6 destinos e barra de contexto de 44 px (breadcrumb, relógio de turno no laboratório, perfil). Mobile: barra inferior com 5 destinos (Missões, Aulas, Laboratório, Caderno, Mentor). Credencial fica no menu de perfil e dentro do Replay.
2. Um único elemento `<nav aria-label="Navegação principal">` cujos itens são `button` com `aria-current="page"`. O CSS move o mesmo elemento da lateral para a base em menos de 768 px. Isso evita seletor duplicado nos testes e mantém o papel `button`.

**Motivo:** o rail tem os destinos com o mesmo vocabulário do produto (Aulas, Laboratório, Caderno, Mentor). Os 4 grupos do Copilot escondem o laboratório dentro de "Trabalhar" e dificultam a rota de 6 cliques do vídeo. O Codex remove Aulas e Laboratório do topo, mas o aluno precisa chegar a ambos sem passar pela home.

**Risco:** é a mudança mais transversal, porque `App.tsx` passa a renderizar a Workstation dentro do shell, e o custo de reverter depois da etapa 2 é alto. Mitigação: manter o estado `visaoAtual` atual (sem `react-router`).

### 4.4 Densidade do ITSM

| Fonte | Proposta | Onda |
|---|---|---|
| Kiro | Console em duas colunas: tabela (Chave, Resumo, Prioridade, SLA, Status) e detalhe, com compositor em abas e SLA em mono. | PRE_BANCA |
| Codex | Tabela acessível com detalhe e SLA só se calculável. | PRE_BANCA |
| Copilot | Mesma estrutura, com "última atividade". | ONDA_1 (pós) |
| Lovable | Tabela densa com SLA visual e KB aberta ao consultar a política. | PRE_BANCA |

**Escolha (proposta):** PRE_BANCA, em duas colunas, com densidade operacional (linha de 40 px, 13 a 14 px).
- Tabela da fila com Chave (mono), Resumo, Prioridade, SLA e Status. A chave é um `button` com nome contendo `CH-000N`, para manter `ItsmApp.test.tsx`.
- SLA com dados reais da API (`slaAlvoMinuto`, `abertoEmMinuto`, `slaVencido`). Cor `--sla-urgent` quando faltar menos de 25 por cento.
- O passo a passo em texto corrido vira checklist de verificação de identidade.
- Fica para `POS`: compositor em abas "Resposta" e "Nota interna". Na primeira entrega o `select` "Tipo da nota" permanece, o que preserva os seletores `Tipo da nota` e `Texto da nota` da spec E2E.

**Motivo:** o ITSM é a primeira ferramenta que o jurado vê no vídeo, e a fila de um item com "Prioridade: —" é o ponto mais fraco da Workstation. O Copilot adiou por esforço, mas o dado já existe na API e o corte das abas reduz o risco.

**Risco:** `ItsmApp.tsx` tem 14 KB e `onAcao` com payloads que não podem mudar.

### 4.5 Botões de decisão do ITSM (divergência não listada, mas relevante)

| Fonte | Proposta |
|---|---|
| Kiro | Todas as opções com o mesmo peso visual (`secondary`). "Recusar" verde e "Resetar" vermelho entregam a resposta certa. |
| Lovable | Isolar o botão de reset em alerta, com confirmação dupla ou digitação de motivo. |

**Escolha (proposta):** a do Kiro. Mesmo peso, sem confirmação para o reset.

**Motivo:** o Juiz 360 avalia a decisão do aluno. Uma barreira de confirmação ou um alerta vermelho sinaliza qual é a resposta errada e remove o ponto pedagógico. A parte aproveitada do Lovable é outra: "Consultar Política" passa a abrir o artigo KB-001 (item `UNI-027`).

**Risco:** baixo. Altera só classes e ordem visual. A ordem dos botões deve seguir a ordem do checklist.

### 4.6 SimuDesk

| Fonte | Proposta | Onda |
|---|---|---|
| Kiro | Cartão de conexão, cabeçalho de host, terminal dedicado, `PodTable` e `PoolMeter` por ambiente. | Cabeçalho PRE, restante ONDA_1 |
| Codex | `HostSummary`, `TerminalPanel` e evidência junto da ação. | PRE_BANCA |
| Copilot | `HostHeader`, `HealthBar`, abas de diagnóstico e `LogViewer`. | ONDA_1 |
| Lovable | Sem proposta de SimuDesk. | n/a |

**Escolha (proposta):** PRE_BANCA limitado. Cabeçalho de host com ambiente em texto e estado de conexão, estado desconectado com formulário estreito e dica de onde obter ID e PIN, remoção dos 6 estilos inline, mensagem honesta para comando fora do escopo. Tabela de pods, medidor de pool, `Terminal.tsx` dedicado, histórico por seta e `LogViewer` ficam em `POS`.

**Motivo:** o SimuDesk tem 21 KB e quatro ambientes. Reescrever todos custa mais que as etapas 5 e 6 permitem. O ganho visível para a banca está no estado inicial e no cabeçalho.

**Risco:** `SimuDeskApp.test.tsx` depende de placeholders `NNN NNN NNN` e `4 digitos`, `role="alert"` com "ID ou PIN invalido.", `toolbar` "Comandos sugeridos" e `aria-pressed`. A correção ortográfica de "invalido" e "digitos" muda esses seletores e o teste muda junto.

### 4.7 Replay

| Fonte | Proposta |
|---|---|
| Kiro | Linha do tempo vertical com minuto em mono, marca do critério, JSON em "Ver bruto", painel de critérios, "Você fez / Recomendado" e cartão de credencial. |
| Codex | Resumo por critério, trilho de eventos, detalhe do evento. Comparativo só quando o avaliador fornecer o dado. |
| Copilot | Faixa de pontuação, linha do tempo filtrável por critério e comparativo. |
| Lovable | Linha do tempo com marcadores e bloco visual da assinatura ECDSA. |

**Escolha (proposta):** a do Kiro, com a condição do Codex. A tela é o "produto final" da aprendizagem e entra inteira em PRE_BANCA: linha do tempo, painel de critérios, comparativo e cartão de credencial.

**Motivo:** é a tela que o pitch promete (Revisão e Currículo Vivo) e a mais crua hoje (`<pre>` com JSON). A condição do Codex já está atendida, porque `CriterioAvaliacaoDto` traz `motivo` e `praticaEsperada`, e `EventoDto` traz `criterios`.

**Risco:** `ReplayView.test.tsx` e a spec E2E usam `range` com `id="replay-range"`, botão `aria-label="Ver evento sequencia N"` e `Consultar KB: <uri>`. Preservar. A verificação continua usando `verificarCurriculoVivoJson` em `utils/jcs.ts`, sem edição. Faixa de pontuação numérica do Copilot fica fora, porque o motor devolve critérios binários e XP, não nota de 0 a 100.

### 4.8 Outras divergências arbitradas

| Tema | Opções | Escolha (proposta) | Motivo | Risco |
|---|---|---|---|---|
| Identidade visual e paleta | Kiro "Quadro de operações" (petróleo `#0B6E8A`, claro padrão). Codex "Console de campo" (petróleo `#075B78`, barra de contexto escura no turno). Copilot "mesa de trabalho Aurora" (azul `#1769AA`). Lovable azul `#0284C7` com topo `#0F172A`. | Kiro: claro por padrão, escuro alternativo, acento petróleo. Os tokens do Kiro têm contraste calculado. Os do Codex e do Copilot declaram que não foram medidos. | Menos retrabalho de contraste. Cor de acento única e estados semânticos. | Etapa 2 mede cada par com `utils/contraste.ts`. Qualquer par abaixo de 4.5:1 é ajustado ali. |
| Nome do Mentor | Kiro mantém "Mentor". Codex renomeia para "Tutor de estudo". Copilot "Revisar com perguntas". | "Mentor", com subtítulo "Respostas guiadas pelo conteúdo da trilha". Sem "IA" no rótulo. | `responderMentor` é função local e determinística. O Codex tem razão sobre a expectativa criada. Manter o substantivo preserva o vocabulário do produto. | `App.test.tsx` busca o heading `Mentor IA`. O teste muda na etapa 4. |
| Largura do guia no laboratório | Kiro 32 por cento (mínimo 280 px). Codex 300 a 340 px. Copilot 240 a 280 px com console extra. Lovable 35 por cento. | 32 por cento, mínimo 280 px, máximo 50 por cento, persistência em `localStorage`, divisória com teclado. Abaixo de 1024 px vira gaveta. | Faixa comum às fontes. A terceira coluna do Copilot reduz a área das ferramentas. | Pointer events e teclado precisam de teste. |
| Command palette | Kiro PRE_BANCA. Codex, Copilot e Lovable pós. | `POS` | Não está no caminho dos 6 cliques do vídeo. Custa um dia e traz foco preso e combobox para testar. | Nenhum para a banca. |
| Toasts | Kiro PRE_BANCA. | `POS` | O aviso atual cumpre a função. Troca de componente sem ganho visível no vídeo. | Baixo. |
| Rota `?demo=1` | Kiro PRE_BANCA. | `POS`. A "Demo Rápida" já existe. O caminho de 6 cliques vira teste E2E, sem rota nova. | Evita lógica de semente fixa na entrada do app. | Nenhum. |
| Quiz e flashcard (flip 3D) | Kiro ONDA_1. Copilot ONDA_1. | `POS`, mas o CSS do flip some quando nenhum componente o usar. | Sem ganho no vídeo. | Nenhum. |
| Biblioteca de ícones | Kiro e Copilot `lucide-react`. Codex SVG próprio ou Lucide com auditoria do bundle. Lovable `lucide-react`. | `lucide-react` com importação por ícone, isolado atrás do componente `Icon`. | Consenso de 3 em 4 e uma única troca se a biblioteca mudar. | Exige confirmar `npm install`. Sem confirmação: SVG inline dentro do `Icon`, com o mesmo contrato. |

## 5. Escopo fechado

Janela: de 16/nov a 30/nov/2026 (15 dias) para a URL no painel e o vídeo de 3 minutos. A estimativa de esforço do Kiro (14 dias para uma pessoa) não foi validada contra o ritmo do time e serve só de ordem de grandeza.

### 5.1 PRE_BANCA_HACKATHON (38 itens no CSV: 15 em P0, 19 em P1 e 4 em P2)

Critério de entrada: aparece no vídeo de 3 minutos, corrige o "cara de IA" apontado pelo fundador, ou protege contrato e teste.

- Fundação: tokens, tipografia, `Icon`, remoção de emoji, faixa arco-íris, legenda e sub-barra, logo e favicon, foco e alvos, contraste.
- Shell: rail, barra de contexto, barra inferior no celular.
- Home: bloco principal, tabela de missões, progresso simples, realocação de Pomodoro, plano, carreira e verificador.
- Laboratório: split-screen, guia da missão por eventos, barra de turno, abas de ferramenta, cold start.
- Estudo: apenas visual e copy em Aulas, Caderno e Mentor (ícones, cores, metadados, inline, nome).
- Operação: ITSM (fila, SLA real, checklist, botões neutros, KB aberta), SimuDesk (cabeçalho, estado desconectado, sem inline), Chat (contato e verificação), Intranet (visual).
- Replay: linha do tempo, critérios, comparativo, credencial.
- Qualidade: acentuação com constantes compartilhadas, axe, overflow e snapshots em 4 larguras, jornada de 6 cliques.

### 5.2 POS (22 itens no CSV)

| Onda | Conteúdo |
|---|---|
| ONDA_1_POS_HACKATHON | Course Player completo, retomada exata, quiz sem flip, editor Cornell com vínculo, command palette, compositor com abas, terminal dedicado e tabela de pods, portal KB com índice, respostas rápidas, toasts, página de credenciais, progresso por competência, biblioteca `src/ui` completa. |
| ONDA_2_LABS_VISUAIS | Bancada de hardware, cabeamento, topologia de rede, editor de consulta e script. |
| ONDA_3_ESCALA | Videochamada ou áudio, micro-credenciais por trilha, catálogo de componentes, i18n completo, imagem social. |

## 6. Mapeamento para as etapas 2 a 6

Referência de arquivos: nesta seção, caminhos sem `src/` inicial são relativos a `src/frontend/src/`. No CSV, os caminhos são relativos a `src/frontend/` (por exemplo `src/App.tsx` e `e2e/jornadas.spec.ts`). Tamanhos e contagens vêm do mapa do plano. Cada linha desta seção cita os itens `UNI-nnn` equivalentes no CSV, agrupados por etapa (etapa 2: UNI-001 a 008, 036; etapa 3: UNI-009 a 019; etapa 4: UNI-021 a 023; etapa 5: UNI-020, 024 a 030; etapa 6: UNI-031 a 035, 037, 038).

### Etapa 2: fundação e shell (sim-arquiteto-ui)

| Item | Arquivos |
|---|---|
| Tokens, aliases temporários dos nomes antigos | novo `styles/tokens.css`, `main.tsx`, `index.css` (47 KB) |
| Fontes empacotadas | `package.json` (se autorizado), `styles/tokens.css` |
| `Icon` e catálogo sem emoji | novo `ui/Icon.tsx`, `educacao/catalogoEducacional.ts` (9 emojis: campo `icon` vira nome de ícone) |
| Remover faixa, legenda e sub-barra | `educacao/BarraSuperior.tsx` (11 emojis), `index.css` (`.topnav::after`, `.subbar`, `.legend`, `.lg`) |
| `AppShell` com um único `nav` | novo `shell/AppShell.tsx`, `App.tsx` (8 emojis, casca em volta de todas as visões, inclusive Workstation) |
| Logo e favicon | novos `assets/logo.svg` e `favicon.svg`, `index.html` na raiz do frontend |
| Foco, alvos e contraste | `styles/tokens.css`, `utils/contraste.ts` (apenas uso, sem editar) |
| Teste | `App.test.tsx` (navegação por nome sem emoji, uma `navigation` com nome `Navegação principal`), teste novo do `Icon` e do `AppShell` com axe |

Critério de passagem: app compila, home antiga ainda funciona dentro do shell, lint, `tsc -b` e `App.test.tsx` passam. O seletor de nível em foco, hoje na `BarraSuperior`, continua acessível até a etapa 3 mover para a home.

### Etapa 3: home e laboratório (sim-implementador-ui)

| Item | Arquivos |
|---|---|
| Home com bloco principal e tabela | `workstation/TelaInicial.tsx` (38 KB, 12 emojis, 17 inline), novos `home/MissionHome.tsx`, `home/MissionRow.tsx`, `home/ProgressTrack.tsx` |
| Bloco "Seu progresso" e destino Credencial | `workstation/TelaInicial.tsx` (extração do painel de carreira e do verificador), novo componente de credenciais, `App.tsx` |
| Split-screen, guia, barra de turno e abas | novos `lab/SplitLabWorkspace.tsx`, `lab/MissionGuide.tsx`, `lab/ShiftBar.tsx`, `lab/ToolTabs.tsx`, `App.tsx` (dock e gavetas, linhas aproximadas 437 a 600), `index.css` |
| Cold start | novo `ui/ColdStartNotice.tsx`, usado a partir do estado `ocupado` do `App.tsx`. Sem editar `api/client.ts` |
| Teste | `App.test.tsx` (headings, rádios, painel de carreira), `e2e/jornadas.spec.ts` (nomes de botão se mudarem), testes novos do guia e do split |

Critério de passagem: botão "Iniciar no Simulador" e rádios de nível preservados, `aria-label="Aplicativos da Workstation"` preservado, home abaixo de 1800 px em 375, guia marca tarefa só por evento do motor.

### Etapa 4: estudo (sim-implementador-ui)

| Item | Arquivos |
|---|---|
| Aulas: ícones, metadados em texto, cores, 68ch, sem inline | `educacao/AulasView.tsx` (19 KB, 21 emojis, 7 inline) |
| Caderno: sentence case, sem emoji no `h1` | `educacao/CadernoView.tsx` (10 KB, 9 emojis, 5 inline) |
| Mentor: sem roxo e sem bolha de marca, nome e subtítulo | `educacao/MentorView.tsx` (20 KB, 19 emojis, 6 inline), `educacao/catalogoEducacional.ts` (apenas copy) |
| CSS | `index.css` |
| Teste | `App.test.tsx` (headings `Caderno de estudos`, `Mentor`, `Rede, IP e DNS`), axe nas três telas |

Fora desta etapa: Course Player completo, retomada exata, vínculo da nota com a aula (todos `POS`).

### Etapa 5: ferramentas do laboratório (sim-implementador-ui)

| Item | Arquivos |
|---|---|
| ITSM: fila em tabela, SLA real, checklist, botões neutros, KB aberta | `apps/ItsmApp/ItsmApp.tsx` (14 KB), `ItsmApp.test.tsx`, `App.tsx` (callback opcional para `abrirArtigoKb`) |
| SimuDesk: cabeçalho, estado desconectado, sem inline | `apps/SimuDeskApp/SimuDeskApp.tsx` (21 KB, 6 inline), `SimuDeskApp.test.tsx` |
| Chat: contato e verificação | `apps/ChatApp/ChatApp.tsx` (7 KB), `ChatApp.test.tsx` |
| Intranet: visual | `apps/IntranetApp/IntranetApp.tsx` (4 KB), `IntranetApp.test.tsx` |
| Acentuação e glossário | novo `textos/workstation.ts` importado por componentes, testes e `e2e/jornadas.spec.ts` |

Critério de passagem: `role="log"` e `aria-pressed` no Chat, foco em heading ao abrir artigo na Intranet, `alert`, placeholders e `toolbar` no SimuDesk preservados ou atualizados junto da constante.

### Etapa 6: replay, credencial e testes visuais (sim-implementador-ui)

| Item | Arquivos |
|---|---|
| Linha do tempo, critérios, comparativo | `replay/ReplayView.tsx` (8 KB), novos `replay/TimelineReplay.tsx`, `replay/CriteriaPanel.tsx`, `replay/rotulosEvento.ts`, `ReplayView.test.tsx` |
| Cartão de credencial | novo `replay/CredentialCard.tsx`, uso de `verificarCurriculoVivoJson` de `utils/jcs.ts` sem alterar |
| Estados vazios e erro | `ReplayView.tsx` e componentes compartilhados |
| Projetos Playwright 375, 768, 1280 e 1440 | `playwright.config.ts` (um projeto por largura, sem tocar nos `webServer`), novos `e2e/layout.spec.ts` e `e2e/visual.spec.ts` |
| Jornada de 6 cliques | `e2e/jornadas.spec.ts` ou spec nova |
| Limpeza de CSS morto | `index.css` (`.chip-sre`, `.chip-sql`, `.btn-ai`, flip 3D, `.eyebrow`), somente depois de nenhuma tela usar |

Pré-requisito: o backend compilado, porque o servidor E2E usa `dotnet run --no-build`.

## 7. Regras de execução para todas as etapas

1. Nenhum arquivo de `src/backend`, `src/frontend/src/api/**` ou `src/frontend/src/utils/jcs.ts` é editado.
2. Todo texto de botão ou heading que muda de propósito atualiza o teste no mesmo passo, por constante compartilhada.
3. Cada etapa fecha com lint, `tsc -b` e os testes dos arquivos tocados. Suite completa e Playwright ficam para a etapa 7.
4. Sem o caractere E comercial (U+0026) e sem a forma passada do verbo "sair" em docs e em textos da UI.
5. Commits locais apenas na branch `redesign-ui-ux`.

## 8. Decisões abertas

As cinco decisões que precisam do usuário antes da etapa 2 estão no fim da resposta da etapa 1 e na seção "Decisões do usuario" de `00_PLANO_EXECUCAO_E_PROGRESSO.md`, todas marcadas como "proposta, aguardando o usuario".

## 9. Limites desta consolidação

- Não foram abertos o mockup HTML nem as imagens de evidência. O arquivo 05 em Markdown do Kiro cobre a especificação, e a leitura foi cortada na seção 8 (checklist de aceite visual) por limite de tamanho da ferramenta. Esse checklist deve ser relido pela etapa 6.
- O Codex e o Copilot foram lidos arquivo por arquivo nos itens 01 a 04. Nos arquivos 05 foram lidos apenas os trechos iniciais de refatoração por arquivo, suficientes para a comparação.
- Os números de linha citados vêm das auditorias e das consultas desta etapa e podem ter deslocado. As etapas de implementação devem localizar os trechos pelo nome do símbolo.
- O grafo Graphify foi consultado em dois pontos (shell e replay). A leitura confirmou os arquivos e as funções, mas as consultas truncaram a lista por orçamento de tokens.
