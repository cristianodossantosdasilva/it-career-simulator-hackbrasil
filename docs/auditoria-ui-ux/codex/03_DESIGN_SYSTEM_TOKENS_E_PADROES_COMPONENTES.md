# 03. Design system, tokens e padrões

## Direção visual

**Produto:** simulador de operações de suporte, com dados auditáveis de uma empresa fictícia. A referência visual deve vir de um centro de operações e de um caderno de treinamento técnico, sem imitar Windows, AWS ou Jira.

**Marca:** “Console de campo”. Superfícies claras e neutras para estudo. Uma barra de contexto escura identifica apenas o turno ativo. Azul petróleo é a ação principal. Verde, âmbar e vermelho ficam reservados a estados observáveis. A peça proprietária é o trilho de missão com eventos, não gradientes ou mascotes.

## Tokens CSS

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --bg-canvas: #f4f6f8;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle: #edf1f4;
  --bg-selected: #e7f0f7;
  --border-hairline: #d8e0e7;
  --border-strong: #9aa9b7;
  --text-primary: #172631;
  --text-secondary: #435461;
  --text-muted: #586b78;
  --text-on-accent: #ffffff;
  --accent: #075b78;
  --accent-hover: #06465d;
  --focus-ring: #087da2;
  --success: #216e4e;
  --success-bg: #e8f4ed;
  --warning: #80520b;
  --warning-bg: #fff4d6;
  --danger: #a12b25;
  --danger-bg: #fcebe9;
  --info: #285f8f;
  --info-bg: #eaf2f9;
  --font-ui: "Inter", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-display: 2rem;
  --line-tight: 1.25;
  --line-body: 1.55;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --radius-control: 0.375rem;
  --radius-panel: 0.625rem;
  --radius-overlay: 0.75rem;
  --shadow-overlay: 0 8px 24px rgb(23 38 49 / 0.14);
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg-canvas: #0c141b;
  --bg-surface: #121d26;
  --bg-elevated: #192630;
  --bg-subtle: #202f3a;
  --bg-selected: #173749;
  --border-hairline: #31424e;
  --border-strong: #647784;
  --text-primary: #edf3f6;
  --text-secondary: #c3d0d8;
  --text-muted: #a7b8c2;
  --text-on-accent: #ffffff;
  --accent: #43a6c6;
  --accent-hover: #6bbbd3;
  --focus-ring: #7dd3eb;
  --success: #6dc497;
  --success-bg: #153326;
  --warning: #efc36b;
  --warning-bg: #3a2e16;
  --danger: #f08c83;
  --danger-bg: #3b201f;
  --info: #8bbbe1;
  --info-bg: #1b3040;
  --shadow-overlay: 0 10px 30px rgb(0 0 0 / 0.35);
}

body {
  margin: 0;
  background: var(--bg-canvas);
  color: var(--text-primary);
  font: 400 var(--text-md) / var(--line-body) var(--font-ui);
}

.reading-column {
  max-width: 68ch;
}

:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Os tons são uma proposta inicial, não valores medidos em contraste. Validar cada par com ferramenta WCAG antes de publicar. Texto normal deve atingir 4.5:1; texto grande e componentes gráficos essenciais, 3:1. Nunca usar apenas cor para status.

## Tipo, espaço e densidade

- UI: Inter ou a família já empacotada no produto, sem carregar outra fonte externa na primeira entrega. Texto corrido 16 px, controles 14 px, metadados nunca menores que 12 px, títulos de página 28 a 32 px.
- Terminal, IDs, hash e comandos: IBM Plex Mono ou fallback local monospace. Não aplicar monoespaçada a badges, labels genéricas ou títulos pequenos.
- Leitura: 65 a 72 caracteres por linha, corpo 16 px, altura de linha 1.55. Texto operacional pode ser compacto, mas deve manter 14 px e linha de 1.4.
- Grade de 4 px. Espaços mais frequentes: 8, 12, 16, 24 e 32 px.
- Controles densos: raio 6 px; painel: 10 px; overlay: 12 px. Pills somente em filtro selecionável e estado curto.
- Borda de 1 px como separador padrão. Sem sombra em cada card. Elevação apenas para menus, modais, tooltip e drawer.
- Desktop até 1920 px: conteúdo de leitura limitado e grades operacionais fluidas. Breakpoints de validação: 375, 768, 1280 e 1440 px.

## Etapa e semântica de cor

Azul petróleo identifica ação principal e foco. Neutros fazem a maior parte da interface. Verde indica condição atendida, âmbar indica atenção ou pendência e vermelho indica risco ou falha. Roxo deixa de representar uma fase de estudo por padrão. Se “teoria, revisão, prática, domínio” mantiver cores próprias, usar essa paleta exclusivamente na visualização da trilha, com rótulo e valor textual.

## Ícones vetoriais

Adotar Lucide em SVG inline ou sprites SVG versionados, traço 1.75 px, caixa 20 px, cantos e alinhamento constantes. Instalar dependência só após conferir impacto no bundle e preservar os nomes acessíveis dos botões. Ícone decorativo recebe `aria-hidden="true"`; ícone sem texto visível exige `aria-label`.

| Uso ou emoji atual | Ícone proposto | Texto acessível |
|---|---|---|
| Avião da marca | Símbolo próprio de asa ou painel vetorial | IT Career Simulator |
| 🏠 Painel | `layout-dashboard` | Início |
| 📖 Aulas | `book-open` | Trilhas |
| 📓 Caderno e notas | `notebook-pen` | Caderno |
| 🤖 Mentor ou Tutor | `message-circle-question` | Tutor de estudo |
| 🛠️ Laboratório | `monitor-cog` | Laboratório |
| 📜 Currículo Vivo | `badge-check` | Competências registradas |
| 🔥 Streak | `calendar-check` | Dias de estudo consecutivos |
| ⭐ XP | `chart-no-axes-column-increasing` | Pontos de prática |
| 🎯 Meta | `target` | Meta semanal |
| ☁️ Cloud | `cloud` | Serviços de nuvem |
| 🏅 Progresso | `award` | Competência concluída |
| 🧩 Revisão | `brain` | Revisão de cartões |
| 🎧 Atendimento | `headset` | Suporte técnico |
| 🧠 Explicar | `lightbulb` | Explicação do aluno |
| 🔍 Investigar | `scan-search` | Coletar evidência |
| 🌙 Tema escuro | `moon` | Ativar tema escuro |
| ⏱ Temporizador | `timer` | Temporizador de foco |
| ✓ Concluído | `circle-check` | Concluído |
| Fechar | `x` | Fechar painel |

Emoji em conteúdo didático escrito pelo usuário é texto, não ícone estrutural. Não converter esse conteúdo automaticamente.

## Componentes e estados

| Componente | Estados e regra |
|---|---|
| `AppShell` | Navegação ativa, recolhida, foco visível. Móvel abre menu modal e devolve foco ao controle que o abriu. |
| `MissionCard` | Padrão, em progresso, bloqueada, concluída. Cada linha mostra objetivo, duração e uma ação principal. Não usar hover lift. |
| `MissionGuide` | Etapa atual, feita, futura, pista aberta. Nomeia evidência esperada e ferramenta que atende ao passo. |
| `SplitLabWorkspace` | Painel redimensionável com mínimo de 280 px no guia e fallback empilhado abaixo de 1024 px. Em largura móvel, alterna Guia e Ferramenta. |
| `TicketQueue` | Carregando, vazio, erro, selecionado, prioridade alta. Cabeçalho de coluna persistente e seleção por teclado. |
| `TicketDetail` | Status, prioridade, SLA restante quando calculável, solicitante e histórico. Nota interna e resposta pública têm rótulo visível no campo e na confirmação. |
| `TerminalPanel` | Disponível, comando pendente, comando não suportado, erro do cenário. Saída em `pre`, com limite de largura e opção de copiar. Nunca simular resultado que o motor não retornou. |
| `KbArticle` | Resultado, sem resultado, expandido, vindo do Replay. O artigo informa categoria, ID e passos numerados. |
| `ReplayTimeline` | Sem dados, carregando, eventos disponíveis, erro. Selecionar um evento atualiza detalhe e critério associado. |
| `CredentialCard` | Rascunho, assinado, inválido, verificado. Mostrar algoritmo e impressão digital sem sugerir certificação de terceiros. |
| Botão | Primário, secundário, discreto, destrutivo. Default, hover, active, focus-visible, disabled, loading. Não mudar posição com transform no hover. |
| Badge | Só para status curto. Texto explícito, cor semântica, nunca usada como decoração ou competência longa. |
| Toast e alert | Toast confirma ação concluída; alert fica junto ao problema até resolver. Texto de ação idêntico antes e depois. |

## Acessibilidade e responsividade

- Alvos de toque de pelo menos 44 por 44 px no celular. Alvos densos de desktop podem ser menores se tiverem espaçamento e foco visível.
- Usar landmarks, headings em ordem, nome acessível, `aria-current`, `aria-pressed` e `aria-expanded` coerentes com estado real. Não adicionar ARIA quando HTML nativo resolve.
- Operar navegação, tabela, filtros, abas, modal e timeline por teclado. Escape fecha modal ou drawer e devolve foco. Nenhuma ação depende apenas de arrastar.
- Anunciar atualizações de sessão com live region sem reler todo o histórico. Erro usa `role="alert"`; progresso de tarefa usa status polido.
- Checar foco em modo escuro, zoom de 200%, preferência de movimento reduzido, leitor de tela, overflow horizontal e alvos em 375 px.
- Usar `axe-core` nos fluxos principais e Playwright para regressão visual nas larguras exigidas. Essas verificações são recomendação futura, não executadas nesta auditoria.
