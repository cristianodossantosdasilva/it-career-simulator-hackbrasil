# 03. Design System: tokens e padrões de componentes

## 1. Identidade visual autoral

**Conceito: "Quadro de operações".** O produto simula um turno de trabalho de suporte. A linguagem visual vem dessa sala: console de fila, relógio de SLA, registro de bordo (a Caixa-Preta). Três escolhas guiam tudo.

1. **Papel e tinta, não neon.** Fundo claro de papel frio, texto quase preto, uma cor de acento (azul-petróleo). O modo escuro "Cockpit" é um alternativo, não o padrão.
2. **O registro de bordo é o elemento memorável.** A linha do tempo (minuto simulado em mono, marcador por evento) aparece no Replay, na Workstation e na credencial. É onde se gasta a ousadia. O resto fica quieto.
3. **Cor só com significado.** Acento para ação. Verde, âmbar e vermelho só para estado. Nada de roxo para IA nem de quatro cores de domínio.

Paleta nomeada (claro):

| Nome | Hex | Uso |
|---|---|---|
| Papel | `#F6F7F9` | canvas |
| Superfície | `#FFFFFF` | painéis |
| Tinta | `#14181F` | texto primário (contraste 17.8:1 sobre superfície) |
| Petróleo | `#0B6E8A` | acento, links, foco (5.8:1 sobre branco) |
| Sinal | `#B4501A` | atenção de SLA e alertas de segurança (5.1:1) |
| Registro | `#1E293B` | fundo do terminal e do cockpit |

Evitar: creme com serif terracota, preto com verde ácido, e o "kit SaaS de cartões" (lista de tells do skill `frontend-design`).

Tipografia (duas famílias claramente distintas):
- UI e leitura: **Inter Variable** (empacotada). Alternativa se a banca preferir mais caráter: **IBM Plex Sans**. Para leitura longa nas aulas, mesma família com line-height maior.
- Dados: **JetBrains Mono** (ou IBM Plex Mono) em ID de chamado, minutos, terminal, hash e logs. Uso restrito a dados, não em rótulos decorativos.

Iconografia: `lucide-react`, traço 1.75 px, tamanhos 16 (densa), 20 (padrão), 24 (navegação). Cor herda `currentColor`.

## 2. Tokens CSS (claro e escuro)

```css
:root,
[data-theme='light'] {
  color-scheme: light;

  /* superfícies */
  --bg-canvas: #f6f7f9;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;       /* modal, menu: diferencia por borda e sombra */
  --bg-subtle: #eef0f4;         /* cabeçalho de tabela, hover de linha */
  --bg-inverse: #1e293b;        /* terminal e registro */

  /* bordas */
  --border-hairline: #e1e5ec;     /* divisor decorativo, não carrega informação */
  --border-strong: #7b8594;       /* 3.7:1 sobre surface: borda de controle (WCAG 1.4.11) */
  --border-focus: #0b6e8a;

  /* texto */
  --text-primary: #14181f;
  --text-secondary: #3b4452;    /* 9.8:1 */
  --text-muted: #566070;        /* 6.4:1 sobre surface, 5.9:1 sobre canvas */
  --text-inverse: #f1f5f9;
  --text-on-accent: #ffffff;

  /* acento */
  --accent: #0b6e8a;
  --accent-hover: #095a72;
  --accent-subtle: #e4f2f6;
  --accent-text: #0a5d75;       /* texto de link sobre fundo claro */

  /* estado (sempre com ícone e texto) */
  --ok: #17803d;       --ok-subtle: #e6f4ea;
  --warn: #9a5b00;     --warn-subtle: #fdf1dc;
  --danger: #b42318;   --danger-subtle: #fdecea;
  --sla-urgent: #b4501a;

  /* tipografia */
  --font-ui: 'Inter Variable', Inter, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
  --fs-11: 0.6875rem;  --fs-12: 0.75rem;   --fs-13: 0.8125rem;
  --fs-14: 0.875rem;   --fs-16: 1rem;      --fs-18: 1.125rem;
  --fs-22: 1.375rem;   --fs-28: 1.75rem;   --fs-36: 2.25rem;
  --lh-tight: 1.25;    --lh-ui: 1.45;      --lh-read: 1.7;
  --ls-tight: -0.011em; --ls-normal: 0;
  --measure: 68ch;

  /* espaçamento: grade de 4 px */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px; --sp-10: 40px; --sp-12: 48px;

  /* raios: três níveis, sem pílula, exceto contador */
  --r-sm: 4px;      /* controles densos, badge, tabela */
  --r-md: 6px;      /* botões, campos */
  --r-lg: 10px;     /* painéis, modal, credencial */

  /* elevação mínima */
  --shadow-pop: 0 8px 24px rgba(20, 24, 31, 0.12), 0 0 0 1px var(--border-hairline);
  --focus-ring: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--border-focus);

  /* movimento */
  --dur-fast: 120ms;  --dur-base: 180ms;
  --ease: cubic-bezier(0.2, 0, 0, 1);

  /* layout */
  --rail-w: 56px;  --rail-w-open: 220px;
  --topbar-h: 44px;  --row-h: 40px;  --row-h-compact: 32px;
  --control-h: 36px; --touch-h: 44px;
}

[data-theme='dark'] {
  color-scheme: dark;
  --bg-canvas: #0d1117;
  --bg-surface: #151b23;
  --bg-elevated: #1b232d;
  --bg-subtle: #1f2833;
  --bg-inverse: #0a0f14;
  --border-hairline: #28323f;
  --border-strong: #6b7a8e;       /* 4.0:1 sobre surface escura */
  --border-focus: #4cc2e0;
  --text-primary: #eef2f6;
  --text-secondary: #c3ccd8;
  --text-muted: #94a1b2;          /* 6.7:1 sobre surface */
  --text-inverse: #14181f;
  --accent: #4cc2e0;
  --accent-hover: #7ad3ea;
  --accent-subtle: #123541;
  --accent-text: #6fd0e8;
  --text-on-accent: #06222b;
  --ok: #4ade80;      --ok-subtle: #11301c;
  --warn: #fbbf24;    --warn-subtle: #33260a;
  --danger: #f87171;  --danger-subtle: #3a1514;
  --sla-urgent: #fb923c;
  --shadow-pop: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-hairline);
}
```

Compatibilidade: os tokens atuais (`--bg-canvas`, `--bg-surface`, `--text-primary`, `--accent`, `--border`...) mantêm os nomes; os que mudam de significado ficam como alias temporário durante a migração (`--border: var(--border-hairline)`, `--theory-solid: var(--accent)` etc.) para a aplicação não quebrar no meio.

## 3. Escala tipográfica

| Papel | Token | Peso | Line-height | Uso |
|---|---|---|---|---|
| Título de página | 28 px | 650 | 1.25, ls -0.011em | H1 |
| Título de seção | 18 px | 600 | 1.3 | H2 |
| Subtítulo de painel | 14 px | 600 | 1.4 | H3 |
| Corpo UI | 14 px | 400 | 1.45 | formulários, tabelas |
| Corpo de leitura | 16 px | 400 | 1.7 | aulas, KB (largura máxima 68ch) |
| Rótulo de campo | 13 px | 500 | 1.4 | label |
| Metadado | 12 px | 400 | 1.4 | cinza `--text-muted` |
| Dado mono | 13 px | 500 | 1.4 | `CH-0001`, `07:30`, hash |

Regras: sem caixa alta em rótulos (usar sentence case). Sem rótulo acima do título. Números tabulares (`font-variant-numeric: tabular-nums`) em SLA, minutos e tabelas.

## 4. Grade e densidade

Duas densidades, escolhidas pela superfície, não pelo gosto da tela.

| Superfície | Onde | Linha | Fonte | Padding de painel | Largura útil |
|---|---|---|---|---|---|
| **Editorial** | Home, Aulas, Caderno, Mentor, Credencial | 56 px de linha de lista | 16 px leitura / 14 px UI | 24 a 32 px | texto 68ch, página até 1200 px |
| **Operacional** | ITSM, Chat, SimuDesk, KB, Replay | 32 a 40 px de linha | 13 a 14 px | 12 a 16 px | tela inteira, sem máximo |

Marcar a densidade com atributo: `<main data-density="editorial">` e `<div data-density="operational">`. Os tokens `--row-h` e padding mudam por seletor de atributo.

Pontos de quebra e comportamento:

| Largura | Shell | Home | Workstation |
|---|---|---|---|
| 375 a 767 | barra inferior, sem rail | lista de 1 coluna | abas de ferramenta + gaveta de missão |
| 768 a 1023 | rail recolhida 56 px | lista 1 coluna larga | guia em gaveta, ferramentas 100% |
| 1024 a 1279 | rail recolhida | tabela completa | split 300 px de guia + ferramentas |
| 1280 a 1439 | rail expansível | tabela + painel lateral de progresso | split 32 por 68 |
| 1440 a 1920 | rail expandida opcional | idem com largura máxima 1200 px | split 32 por 68, largura máxima das ferramentas 1200 px |

## 5. Mapa completo de substituição de emojis

Todos com `lucide-react`. Nomes exatos de ícones existentes na biblioteca.

| Emoji atual | Onde | Substituir por | Observação |
|---|---|---|---|
| ✈ (logo) | `BarraSuperior.tsx` 36 | SVG próprio: marca "IT Flight" (quadrado 24 px com seta de rota) | ícone de marca, não Lucide |
| 🏠 Painel | nav | `Compass` | nome do item passa a "Missões" |
| 📖 Aulas / 📖 em cartões | nav, `AulasView.tsx` | `BookOpen` | |
| 📓 Caderno / Minhas notas | nav, `App.tsx` | `NotebookPen` | |
| 🤖 Mentor IA / Tutor IA | nav, `App.tsx`, `MentorView.tsx` | `MessagesSquare` | evitar `Bot` e `Sparkles`, clichês de IA |
| 🛠️ Laboratório / Praticar | nav, botões | `Terminal` (nav), `Play` (botão) | |
| 🔥 streak | topo | `Flame` (traço) | só no menu de perfil |
| ⭐ XP | topo | `Star` | só no menu de perfil |
| 🌙 / ☀️ tema | topo | `Moon` / `Sun` | rótulo em `aria-label` |
| 📜 Currículo Vivo | topo | `BadgeCheck` | |
| 🎖️ patente | sub-barra | `Medal` | |
| 🎒 Estagiário | `catalogoEducacional.ts` | `GraduationCap` | |
| 🎧 Analista Jr | catálogo | `Headset` | |
| 🧩 Analista Pleno | catálogo | `Workflow` | |
| ☁️ Engenheiro | catálogo | `Cloud` | |
| 🏅 Especialista | catálogo | `Award` | |
| 💡 Analogia | `AulasView.tsx` | `Lightbulb` | |
| 🧠 Flashcards | `AulasView.tsx` | `Layers` | |
| ⏱ Timer | Painel | `Timer` | |
| ✓ / ✗ (resultado) | quiz, critérios | `Check` / `X` com `CircleCheck` e `CircleAlert` | sempre com texto |
| ← Tela Inicial | `App.tsx` | `ArrowLeft` | |
| ↗ Editar | Painel | `ArrowUpRight` | |
| 🔒 LOCK | dock | `Lock` | texto "Bloqueado" no tooltip |

Contrato de uso: componente único `Icon` com props `name`, `size` (16, 20, 24) e `label` opcional. Sem `label`, `aria-hidden="true"`. Com `label`, `role="img"` e `aria-label`.

## 6. Componentes, estados e regras

Estados em todos: default, hover, focus-visible, active, disabled, loading, error, empty (quando aplicável).

### 6.1 Botão

| Variante | Fundo | Texto | Borda | Quando usar |
|---|---|---|---|---|
| primary | `--accent` | `--text-on-accent` | nenhuma | uma por tela ou por painel |
| secondary | `--bg-surface` | `--text-primary` | 1 px `--border-strong` | ações alternativas |
| ghost | transparente | `--accent-text` | nenhuma | ações terciárias, em tabela |
| danger | `--danger` | branco | nenhuma | ação com risco, exige confirmação quando irreversível |

Altura 36 px (densa 32 px). Alvo de toque 44 px no celular via `min-height` em `@media (pointer: coarse)`. Raio `--r-md`. Foco: `--focus-ring`. Disabled: opacidade 0.5, `cursor: not-allowed`. Loading: spinner de 14 px à esquerda, texto permanece, `aria-busy="true"`.

Importante: "Resetar senha" (ação de risco do cenário) NÃO é danger por padrão, porque a lição é que o aluno decida. Usar `secondary` com o mesmo peso das outras opções para não induzir a resposta. Hoje o código a pinta de vermelho e "Recusar" de verde, o que entrega a resposta certa. Isso fere o princípio do Juiz 360 de avaliar decisão.

### 6.2 Barra de navegação global
- Rail 56 px: ícone 20 px, rótulo em tooltip (e texto visível quando expandida). Item ativo: fundo `--accent-subtle`, barra de 2 px à esquerda, `aria-current="page"`.
- Barra superior 44 px: breadcrumb, busca, perfil. Não mostra mais de 4 elementos.
- Teclado: `Tab` percorre; `g` depois letra para ir (`g m` Missões, `g l` Laboratório) em fase opcional.

### 6.3 Linha de cenário (substitui cartão de cenário)
Tabela semântica (`<table>`) ou lista de `role="list"` com linha clicável: número, nível, título, tempo, estado. Estados: `Começar` (primário), `Continuar`, `Concluído` (ícone `CircleCheck` verde), `Em breve` (texto muted). A linha toda é `<a>`.

### 6.4 Tabela e fila ITSM
- Cabeçalho 32 px, `--bg-subtle`, sentence case, texto 12 px 600.
- Linhas 40 px (32 px compacto). Hover `--bg-subtle`. Selecionada: `--accent-subtle` e barra de 2 px à esquerda.
- Colunas: Chave (mono), Resumo, Prioridade (ícone + texto), SLA (mono, com cor `--sla-urgent` abaixo de 25%), Solicitante, Status.
- Vazio: ícone `Inbox` 24 px, texto "Nenhum chamado na fila", ação "Iniciar turno".
- `role="grid"` só se houver navegação por setas; do contrário `<table>` simples com `aria-selected` em linhas selecionáveis.

### 6.5 Terminal e SimuDesk
- Fundo `--bg-inverse`, texto `#e6edf3`, fonte mono 13 px, line-height 1.5. Altura mínima 240 px, redimensionável.
- Prompt em `--accent` (versão clara no escuro), saída com cores só para erro (`--danger`) e aviso (`--warn`). Sem arco-íris ANSI.
- Barra superior do terminal: nome do host (`SRV-AUR-01`), ambiente em texto ("Windows e AD", "Rede", "Cloud e Kubernetes"), estado de conexão com ponto 8 px e texto ("Conectado").
- Diferenciação por ambiente: ícone (`Monitor`, `Network`, `Container`) e cabeçalho; não por cor de fundo.
- Comando fora do escopo do cenário: linha de resposta com ícone `Info` e texto "Comando não disponível neste cenário." (mantém a regra de fidelidade declarada do AGENTS.md).

### 6.6 Modal e gaveta
- Modal: `role="dialog"`, `aria-modal="true"`, foco preso, `Esc` fecha, retorno de foco ao gatilho, raio `--r-lg`, `--shadow-pop`, largura 560 px, backdrop `rgba(14,18,25,0.5)`. Hoje `.cv-modal-*` já existe; apenas padronizar.
- Gaveta lateral 360 px (notas, tutor): mesma regra, sem backdrop escuro em desktop (não bloqueia a Workstation).

### 6.7 Abas
Sublinhado de 2 px em `--accent`, texto 14 px 500, altura 40 px. `role="tablist"`, setas esquerda e direita. Sem fundo roxo nem pílula.

### 6.8 Badge e indicador de estado
Dois componentes, formas diferentes:
- `StatusIndicator`: ícone 14 px + texto, sem fundo (estados: Novo, Em atendimento, Escalonado, Resolvido, Encerrado). Cor só no ícone; texto em `--text-primary`.
- `Count`: número em caixa de 18 px, raio 9 px, fundo `--bg-subtle`.
Eliminar `.chip` de rótulos informativos. `.chip` fica só para ação clicável (pergunta rápida no Chat).

### 6.9 Campo de formulário
Altura 36 px, borda `--border-strong` 1 px, raio `--r-md`, rótulo acima 13 px. Erro: borda `--danger`, ícone e mensagem abaixo com `aria-describedby`. Placeholder nunca substitui rótulo.

### 6.10 Skeleton e cold start
Skeleton cinza com pulso de 1.2 s (só se `prefers-reduced-motion: no-preference`). Depois de 3 s sem resposta, trocar o skeleton por aviso: "O servidor está acordando. Pode levar até 50 segundos." com barra indeterminada e botão "Tentar de novo".

### 6.11 Toast
Canto inferior direito, 360 px, ícone + título + ação. `role="status"` para sucesso e `role="alert"` para erro. Some em 5 s, exceto erro. Vocabulário igual ao botão ("Registrar nota" vira "Nota registrada").

## 7. Movimento

- Uma única orquestração de entrada: ao abrir o Replay, os eventos entram em sequência de 40 ms em 400 ms no total. Em qualquer outra tela, sem animação de entrada.
- Respostas a ação: abrir gaveta (180 ms, translateX), expandir linha (120 ms), marcar tarefa (120 ms).
- Remover flip 3D do flashcard: trocar por revelação de resposta com troca de conteúdo em 120 ms.
- `prefers-reduced-motion` respeitado (já existe regra global em `index.css`).

## 8. Acessibilidade WCAG 2.2 AA

| Critério | Regra de projeto |
|---|---|
| 1.4.3 Contraste do texto | 4.5:1 para texto normal, 3:1 para texto grande. Tokens já calculados acima. Validar em CI com `axe-core`. |
| 1.4.11 Contraste não textual | Bordas de controle (`--border-strong`, 3.7:1) sobre a superfície. Divisores decorativos (`--border-hairline`) ficam abaixo de 3:1 de propósito e nunca delimitam um campo. |
| 1.4.1 Uso da cor | Estado sempre com ícone e texto. |
| 2.4.7 e 2.4.11 Foco visível e não obscurecido | `--focus-ring`; barra superior sticky não pode cobrir o campo focado (`scroll-padding-top: 60px`). |
| 2.5.8 Tamanho do alvo | Mínimo 24 px; adotar 36 px em desktop e 44 px em toque. |
| 3.2.6 Ajuda consistente | O botão "Ajuda" fica na mesma posição em todas as telas. |
| 3.3.7 Entrada redundante | Matrícula e ramal do chat não precisam ser digitados novamente no SimuDesk (preencher a partir da verificação). |
| 4.1.3 Mensagens de estado | `aria-live="polite"` no chat e nos toasts, `role="alert"` em erro. |
| Nome acessível | Ícone decorativo `aria-hidden`; sem emoji dentro de `<h1>`. Os testes que usam `getByRole('heading', { name: /.../ })` continuam passando porque ficam apenas com o texto. |
| Leitura | Largura 68ch, line-height 1.7, texto alinhado à esquerda. |
| Reflow | Sem rolagem horizontal em 320 px. Tabelas largas ficam em contêiner com `overflow-x: auto` e `tabindex="0"`. |
| Movimento | `prefers-reduced-motion`. |

## 9. Responsividade obrigatória

Testar em 375, 768, 1280, 1440 e 1920 com uma asserção de Playwright:

```ts
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth)
expect(overflow).toBe(0)
```

Estado atual medido em produção: zero overflow em 375, 1280 e 1440 em todas as ferramentas. Preservar.
