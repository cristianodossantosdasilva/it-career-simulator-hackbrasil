# 01. Diagnóstico anti "cara de IA" e benchmark

Auditoria independente do Kiro CLI. Data da inspeção: sessão atual. Nenhum arquivo em `src/` foi alterado.

## 0. Método e evidências

| Fonte | O que foi feito |
|---|---|
| Produção `https://it-flight-simulator-hackbrasil.vercel.app` | Playwright/Chromium em 1440x900, 1280x800 e 375x812. Painel, Aulas, Caderno, Mentor, Laboratório (ITSM, Chat, SimuDesk, Intranet, Juiz 360 e Replay). Capturas em `kiro/evidencias/`. |
| Protótipo `http://127.0.0.1:4180` | Aberto e capturado (`evidencias/prototipo-1440.png`). Texto extraído para análise. |
| Screenshots do usuário | `media_1794790326231_8fc365c9.jpg` (tela inicial antiga com cartão único branco, pílulas e Missão 0), `live-painel-1440.png` e as demais. |
| Código | `index.css` (779 linhas), `App.tsx`, `TelaInicial.tsx`, `BarraSuperior.tsx`, `AulasView.tsx`, `CadernoView.tsx`, `MentorView.tsx`, `ItsmApp.tsx`, `ReplayView.tsx`, `ChatApp.tsx`, `IntranetApp.tsx`, `SimuDeskApp.tsx`. |
| Skills lidas | `frontend-design` (completa), `product-design/audit`, `design-qa`, `ideate` (início, regras e fluxo), `agency-agents/ui-designer.md`, `mobbin` (`redesign-screen`, `best-practices`, `plain-writing`). |

Limite honesto: a interface de produção em Vercel conversa com um backend em Render Free. Medi o estado inicial de cada tela, não uma partida completa até o fim do turno. Os estados de erro e de cold start foram avaliados pelo código, não reproduzidos.

Medições feitas no navegador (produção):

- Overflow horizontal: zero em 375, 1280 e 1440 nas 5 ferramentas do laboratório. Esse ponto está bem resolvido e deve ser preservado.
- Altura total da página Painel: 2765 px em 1440, 3275 px em 1280 e **7056 px em 375**. No celular o aluno rola sete telas antes de chegar ao fim.
- Fonte declarada: `Inter` com fallback `Segoe UI`. Em máquinas sem Inter instalada (a maioria das escolas) cai em Segoe UI ou Arial. Não há `@font-face` nem arquivo de fonte empacotado, então a tipografia que o fundador vê não é a que o aluno vê.
- Contagem de `<button>` na tela Painel: 34. Contagem de emojis estruturais em código de interface: **81** (AulasView 21, MentorView 19, BarraSuperior 12, TelaInicial 12, CadernoView 9, App 8, catálogo 9 em `catalogoEducacional.ts`).
- `style={{...}}` inline em componentes: 42 ocorrências (TelaInicial 17, AulasView 7, MentorView 6, SimuDeskApp 6, CadernoView 5, App 1). O Design System não consegue governar essa parte.
- 83 declarações `border-radius` em `index.css`, com valores 4, 6, 8, 10, 12, 14, 16 e 999 px misturados sem regra de hierarquia.

## 1. Veredito franco

O fundador tem razão. A interface atual não é feia. Ela é **genérica**: parece o resultado mediano de qualquer pedido "faça um painel de EdTech". Três causas concretas:

1. **Não existe um objeto central.** O produto vende "voo de simulador" e "caixa-preta", mas a tela mostra cartões de curso e barras de progresso. O que há de único (turno de trabalho, SLA correndo, Replay verificável por assinatura) não aparece nem no Painel nem na Workstation.
2. **A Workstation parece formulário, não ferramenta.** O ITSM da produção mostra "Prioridade: —", "Categoria: Não classificado" e nenhum relógio de SLA. Um chamado real de Jira Service Management ou Zendesk mostra prioridade, tempo restante e responsável logo na primeira linha. A tela do SimuDesk antes da conexão é dois campos largos de 1100 px de largura e um botão apagado.
3. **O Replay é um despejo de JSON.** A "Caixa-Preta" é o diferencial do pitch e hoje é um `<pre>` com `JSON.stringify` e uma lista de botões `#1 SessaoIniciada`. É a tela que o jurado deveria lembrar e é a mais crua.

O protótipo anterior (porta 4180) melhorou a hierarquia do Painel, mas manteve os mesmos vícios: emojis como ícones (`🏠 📖 📓 🤖 🛠 🔥 ⭐ 🌙 📜 🎒 🎧 🧩 ☁ 🏅 🎖`), saudação "Olá! Bora para o próximo passo da sua carreira 👋", rótulo em caixa alta "PAINEL DO ALUNO", banner "Continue de onde parou" com gradiente escuro e botão branco, e cinco níveis em cartões iguais. Foi aprovado pelo usuário por ser mais limpo que o anterior, não por ser autoral.

## 2. Auditoria tela a tela (produção)

### 2.1 Painel (`/`)
- **Cabeçalho.** Fundo azul-marinho `#0f1b2d` com uma faixa de 3 px em quatro cores (azul, roxo, laranja, verde) sob ele. A faixa existe só para "dar cor". As quatro cores significam Teoria, Fixação, Prática e Domínio, mas o aluno só descobre isso na legenda da sub-barra. Sinal clássico de decoração disfarçada de informação.
- **Navegação.** Cinco itens com emoji, mais 4 elementos à direita (streak, XP, tema, Currículo Vivo) e ainda uma sub-barra com seletor "Nível em foco", patente e legenda. São três faixas horizontais antes do conteúdo. Em 1440x900 o título do painel só começa a 150 px de altura.
- **Título.** Rótulo "PAINEL DO ALUNO · AURORA LOGÍSTICA (100% DADOS SINTÉTICOS · SEM LOGIN)" em caixa alta, com pontos médios, e depois H1 "IT Flight Simulator — Academia de Suporte de TI". O rótulo é jargão de conformidade do hackathon na primeira linha que o aluno lê. Isso pertence ao rodapé ou a uma página "Sobre os dados".
- **Banner "Continue de onde parou".** Gradiente azul-escuro, ícone em quadrado de 60 px com emoji de livro, botão branco "Começar a aula →". Para um aluno que nunca abriu o produto, "continue de onde parou" é uma frase vazia e o botão leva a uma aula, não ao "primeiro voo".
- **Trilha.** Cinco linhas, cada uma com três barras (Teoria, Fixação, Prática), dois botões (Aulas, Praticar) e emoji em quadrado. São 15 barras e 10 botões que mostram quase tudo em 0%. Informação sem conteúdo.
- **Coluna "Hoje".** Anel de progresso conic-gradient "0 de 90m", Pomodoro, "0 revisões para hoje", Plano de estudos com quatro checkboxes. Quatro widgets de produtividade pessoal numa tela de entrada de um simulador. Parece um template de aplicativo de estudos genérico.

### 2.2 Aulas
- Três colunas (módulos 280 px, texto, anotações 320 px) é o esqueleto correto de um player. O que falta: cabeçalho de módulo com progresso real, botão de abrir o laboratório ao lado do texto e navegação anterior/próxima fixa.
- Caixa amarela "Analogia do dia a dia" com emoji de lâmpada, diagrama em linha tracejada com quebra feia (a seta e "Pasta abre" caem sozinhas na segunda linha) e bloco roxo de "recall" com borda de 2 px. Quatro cores de fundo (branco, amarelo, cinza, roxo) em uma única aula.
- Chips "Teoria", "Aula 1 de 3", "7 min" juntos acima do H1: três pílulas para dizer uma coisa que cabe em uma linha de texto cinza.
- Texto de leitura em 72ch está correto (`.lesson-p`). Esse acerto deve ser mantido.

### 2.3 Caderno e Mentor
- H1 contêm emoji dentro do texto (`📓 Caderno de estudos`, `🤖 Mentor IA`). Isso também vai para o nome acessível do heading e para a leitura em leitor de tela.
- Rótulo em caixa alta antes do H1 (`.eyebrow` "Fixação", "Explicar"). Sem função além de enfeite.
- O Mentor usa o roxo como cor de marca da IA, com bolhas de chat arredondadas em 14 px e botões de sugestão em pílula roxa. É o "gradiente de assistente" que todos os produtos de 2024 usam.

### 2.4 Workstation (Laboratório)
- Ao entrar, a barra do topo cresce para duas linhas de 60 + 50 px, mais faixa "Missão Atual" azul-clara. São 155 px de cromo antes de qualquer chamado.
- Dock à esquerda com texto e contadores em pílula (`1`, `0`, `LOCK`, `KB`, `XP`). `LOCK` e `XP` em caixa alta na mesma pílula do contador numérico: três significados diferentes numa forma só.
- ITSM: o chamado `CH-0001` aparece em lista de um item ao lado de um formulário gigante. Botões de ação de segurança misturam quatro estilos (contorno, contorno, verde cheio, vermelho cheio) e a ordem não segue o passo a passo escrito acima deles. O passo a passo ("1) Assuma o chamado → 2) Consulte...") é texto corrido em vez de checklist com estado.
- Texto sem acento em vários pontos da Workstation ("Acoes de Seguranca", "Politica", "Resolucao", "Linha do Tempo de Notas"). Mistura de textos acentuados no Painel e sem acento na Workstation passa sensação de produto montado em partes. Quem foi desenhado para jovens de escola pública precisa de português correto.
- SimuDesk antes da conexão: card com dois campos de largura total e botão desabilitado. Nenhuma dica visual de que ali é um acesso remoto a uma máquina.
- Replay: ver seção 4.5.

### 2.5 Celular (375x812)
- Zero overflow horizontal (ponto positivo). Porém o menu superior vira quatro linhas de botões quebrando em grade e a página Painel tem 7056 px de altura.
- A dock vira grade de 2 colunas de botões de texto, sem ícones. Alvos de toque de 44 px respeitam WCAG 2.5.8. Falta uma barra inferior fixa de navegação, padrão que o aluno de 15 a 22 anos conhece de qualquer app.

## 3. Tabela: vício de IA encontrado no código atual

| # | Vício de IA | Arquivo e linha | Por que empobrece o produto | Como o mercado resolve |
|---|---|---|---|---|
| 1 | Emojis como ícones estruturais de navegação (`🏠 📖 📓 🤖 🛠️`) | `BarraSuperior.tsx` 38, 53, 61, 69, 77 | Renderização muda por sistema (Windows, Android, ChromeOS de escola). Sem controle de cor, espessura ou alinhamento. Entram no nome acessível do botão. | Ícones SVG de traço único (Cloudscape, Linear, Vercel). Ícone `aria-hidden`, rótulo em texto. |
| 2 | Emojis em métricas (`🔥 1 dia(s)`, `⭐ 0 XP`, `🎖️ patente`) | `BarraSuperior.tsx` 85-100, 121 | Gamificação infantil sobre um tema profissional. "dia(s)" com parênteses denuncia texto gerado. | Duolingo usa gamificação com ilustração própria. Linear e Skill Builder usam número limpo com ícone vetorial. |
| 3 | Faixa arco-íris de 4 cores sob o topo | `index.css` `.topnav::after` (linhas 187-196) | Cor sem significado no ponto mais visível da tela. | Nenhuma plataforma séria faz isso. Cor de marca em um ponto só. |
| 4 | Rótulo `.eyebrow` em caixa alta em todo título | `index.css` `.eyebrow`; `TelaInicial.tsx` 218 e 250; `AulasView.tsx` 135; `CadernoView.tsx` 90; `MentorView.tsx` 173 | Marcador de template. Nos casos de `TelaInicial` 218 carrega jargão de conformidade. | Microsoft Learn usa trilha de navegação (breadcrumb) em texto normal. |
| 5 | Pontos médios em metadados (`A · B · C`) | 26 ocorrências em `*.tsx`; ex.: `TelaInicial.tsx` 218, `BarraSuperior.tsx` 34, `ReplayView.tsx` linha de competências | Concatenação sem estrutura. Em leitor de tela vira "ponto" repetido. | Metadados em colunas ou lista de definição (Cloudscape `KeyValuePairs`). |
| 6 | Cartões brancos idênticos com raio 12 px e sombra dupla | `.edu-card`, `.panel`, `.mission-zero-card`, `.scope-card` em `index.css` | Tudo tem o mesmo peso. Aluno não sabe onde olhar. | Linear e Vercel: superfície única com divisores de 1 px; cartão só para objeto clicável. |
| 7 | Pílulas por todo lado (`.chip`, `.badge`, `.nav-chip`, `.c-*`, `.lg`) | `index.css` 160-175, 506 | Pelo menos 5 classes de pílula com cores diferentes. Estado, categoria e contador usam a mesma forma. | Cloudscape `StatusIndicator` (ícone + texto, sem fundo) para estado; `Badge` só para contagem. |
| 8 | Quatro cores de domínio (azul, roxo, laranja, verde) em barra, borda, botão, chip | `index.css` `--theory`, `--fix`, `--practice`, `--mastery` | A paleta funcional virou paleta decorativa. O roxo também é a cor do Mentor IA e do botão `.btn-ai`. | Uma cor de acento e semântica reservada (sucesso, alerta, erro). |
| 9 | Banner com gradiente escuro e botão branco | `index.css` `.continue`; `TelaInicial.tsx` 249 | "Hero" de template. Serve de CTA único e some quando o aluno novo ainda não tem progresso. | Skill Builder: cartão de "Continuar" só aparece se existe progresso. Antes disso, uma ação primária única. |
| 10 | Copy verbosa e autoexplicativa ("Nunca atuou em TI? Comece aqui", "Missão 0 - Como funciona em 4 passos") | `TelaInicial.tsx` 411 | Título de 11 palavras com parêntese. Parece manual escrito por LLM. | Linear: "Get started" em 2 palavras, checklist com 4 itens. |
| 11 | Saudação com emoji de aceno e gíria ("Bora") | protótipo 4180; padrão do catálogo | Tom que não combina com o simulador de trabalho. | Tom neutro, verbo no imperativo, sem emoji. |
| 12 | `style={{...}}` inline em 42 pontos | `TelaInicial.tsx` 226, 249, 289, 296, 316, 332, 348, 434, 441 | Espaçamento e largura fora do sistema. Só as larguras de barra (`width: pr.t%`) são legítimas. | Classes utilitárias e componentes com `variant`. |
| 13 | Botões de 4 a 5 estilos por tela (`btn-primary`, `btn-secondary` cinza-escuro, `btn-practice` laranja, `btn-ai` roxo, `btn-success`, `btn-white`) | `index.css` `.btn-*` | Cor do botão virou categoria de conteúdo. O laranja de "Praticar" disputa com o azul de "Começar a aula". | Um primário, um secundário, um ghost, um destrutivo. |
| 14 | Anatomia de Replay como JSON | `ReplayView.tsx` ~155 (`JSON.stringify(...)`) | Mostra dado interno em vez de narrativa. Aluno não aprende com `{"nivel":"Estagiario"...}`. | Datadog e Vercel Logs: linha do tempo com ícone por tipo, hora e resumo humano; JSON atrás de "ver bruto". |
| 15 | Acentuação ausente na Workstation | `ItsmApp.tsx` (títulos), `ReplayView.tsx` ("Relatorio", "Avaliacao") | Inconsistência com o restante. Passa descuido. | Revisão ortográfica obrigatória no pipeline. |
| 16 | Raio de borda sem hierarquia (4, 6, 8, 10, 12, 14, 16, 999) | 83 ocorrências em `index.css` | Perda de coerência visual. | Escala de 2 valores densos e 2 valores de painel. |
| 17 | Motion genérico: flip 3D de flashcard em 0.5 s, `transition` em todo botão, barra animada 0.4 s | `index.css` `.flash-inner`, `.bar > span` | Efeito sem informação. O flip 3D é um dos mais citados em listas de "demo de IA". | Animar só resposta a ação do usuário (abrir, confirmar) com 120 a 200 ms. |
| 18 | Foco como contorno de 3 px com offset 2 px em tudo | `index.css` `button:focus-visible` | Correto para acessibilidade, mas o mesmo traço grosso em campo de texto e botão quebra a hierarquia visual. | Anel de 2 px com cor de acento e 2 px de afastamento. |
| 19 | Fonte não empacotada | `index.css` linha 3 | Aparência depende da máquina. | Fontes em `@font-face` com `font-display: swap`. |
| 20 | Estado `LOCK` e `XP` em pílula na dock | `App.tsx` 454-500 | Palavra em inglês, caixa alta e forma de contador para três significados diferentes. | Ícone de cadeado + texto "Bloqueado" (tooltip explica o requisito). |

## 4. Benchmark com produtos de referência

Observação: as descrições abaixo vêm do conhecimento sobre as interfaces públicas desses produtos até 2025. Não rodei navegação autenticada em nenhum deles. Onde afirmo um padrão, ele é recorrente e documentado nas páginas públicas e no Cloudscape (cloudscape.design). Para a banca, recomendo capturar prints próprios dessas referências antes de citá-las em slide.

### 4.1 AWS Skill Builder e Cloudscape
- **O que copiar estruturalmente:** hierarquia `Learning plan > Curso > Módulo`. Cartão de trilha com título, duração e uma linha de estado. Cabeçalho de página com breadcrumb, título e ações à direita (`Header` do Cloudscape). `StatusIndicator` com ícone e texto. Tabela densa com seleção e filtros (`Table`). Densidade `compact` para áreas operacionais.
- **O que adaptar:** Skill Builder é pago e corporativo. Aqui o produto é gratuito e para jovens, então manter o tom neutro, mas com linguagem direta e a trilha começando no "Primeiro voo".
- **O que evitar:** excesso de filtros e catálogos vazios. Com 5 cenários a Home não precisa de busca.

### 4.2 Microsoft Learn (e Sandbox)
- **Copiar:** coluna de texto até ~75ch, índice "Nesta unidade" à esquerda, indicador de unidade concluída no fim da página, botão para abrir o ambiente de prática na mesma unidade. A unidade termina com verificação de conhecimento curta.
- **Adaptar:** o sandbox abre ao lado do texto (split) em vez de nova aba.
- **Evitar:** o cabeçalho global gigante do Learn. Aqui bastam 48 px.

### 4.3 Udemy e Coursera (Course Player)
- **Copiar:** conteúdo principal à esquerda e currículo em acordeão à direita, abas abaixo (Visão geral, Anotações, Recursos, Perguntas). Barra de progresso do curso no topo, retomada exata do ponto.
- **Adaptar:** "Perguntas e respostas" vira "Mentor"; "Recursos" vira "Base de conhecimento (KB)". Anotações sincronizam com o Caderno atual.
- **Evitar:** comentários públicos e avaliações por estrelas.

### 4.4 TryHackMe e Hack The Box Academy
- **Copiar:** divisão em duas áreas (tarefas e perguntas com validação à esquerda, máquina à direita ocupando 60 a 70%), barra de sessão compacta com cronômetro, botão "Reiniciar sessão", checks verdes por tarefa.
- **Adaptar:** as "tarefas" são os critérios binários do Juiz 360 mostrados como checklist ao vivo, sem revelar a resposta.
- **Evitar:** o visual "hacker" em verde sobre preto. O produto é de suporte e carreira, não de ofensiva.

### 4.5 Linear, Vercel, Stripe e Jira Service Management
- **Copiar:** tipografia precisa (13 a 14 px na UI densa), bordas de 1 px, fundo de canvas levemente diferente do da superfície, tabelas com linha de 36 a 40 px, atalhos de teclado visíveis, `Ctrl+K`. Vercel Logs: linha do tempo com severidade em ícone e pesquisa. JSM: fila com colunas Chave, Resumo, Prioridade, SLA, Responsável, Status.
- **Adaptar:** SLA em minutos simulados (o motor já fornece `minutoSimulado`).
- **Evitar:** configuração demais (workflows, automações), fora do escopo educacional.

### 4.6 Credly e AWS Badges (credencial)
- **Copiar:** cartão de credencial com emissor, competências, data, ID de verificação e botão "Verificar". Selo desenhado, não emoji.
- **Adaptar:** o hash e a assinatura ECDSA P-256 viram "Detalhes técnicos" recolhíveis; a frente do cartão mostra competências em linguagem humana.

## 5. Decisões objetivas (resumo para o time)

1. Banir os 81 emojis de interface; usar `lucide-react` (traço 1.75 px, tamanho 16 e 20).
2. Remover a faixa arco-íris, o gradiente do banner e os cinco "domínios coloridos". Uma cor de acento.
3. Trocar "cartões em tudo" por superfícies planas com divisores de 1 px. Cartão só para objeto selecionável (cenário, credencial).
4. Fundir Painel, Aulas, Caderno e Mentor em um shell com barra lateral estreita (Aprender, Praticar, Caderno, Mentor, Credencial) e tela de **Missões**.
5. A Workstation vira uma tela de duas áreas com guia de missão à esquerda e as ferramentas à direita.
6. O Replay vira linha do tempo legível com critérios, comparativo "Você fez / Prática recomendada" e credencial.
7. Português correto e consistente em toda a Workstation e no Replay.
8. Empacotar fontes (Inter Variable e JetBrains Mono) para consistência.
9. Acessibilidade: manter alvos de 44 px e `aria-current`; reduzir alvos apenas em tabelas densas (24 px mínimo permitido por WCAG 2.5.8 com espaçamento).

## 6. O que o protótipo 4180 acertou e errou

Acertou: título com saudação reduzida, painel de continuação mais compacto, trilha com cinco níveis em uma linha. Errou: manteve emojis em 100% dos ícones, manteve o gradiente arco-íris, manteve três faixas de navegação, manteve gíria e emoji na saudação e mostrou "🎖 Cadete (iniciante)" como chip colorido. Foi uma versão mais branca do mesmo template, como o fundador descreveu.
