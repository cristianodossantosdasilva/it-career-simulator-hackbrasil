# Design system, tokens e padroes de componentes

## Direcao

O sistema visual tem duas superficies deliberadas:

- **Editorial:** leitura, estudo e anotacao. Fundo claro, largura controlada, ritmo amplo, poucos estados cromaticos.
- **Operacional:** fila, terminal, logs e replay. Densidade alta, divisores firmes, tipografia de dados e status visivel.

Nao usar uma unica classe de card para as duas superficies.

## Tokens base

```css
:root {
  --bg-canvas: #f5f7fa;
  --bg-surface: #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle: #edf1f5;
  --bg-operational: #101923;
  --text-primary: #17212b;
  --text-secondary: #526170;
  --text-muted: #718092;
  --text-inverse: #f7fafc;
  --border-hairline: #dce3ea;
  --border-strong: #b7c3cf;
  --accent: #1769aa;
  --accent-hover: #125487;
  --accent-soft: #e6f1fa;
  --warning: #a64b00;
  --warning-soft: #fff1df;
  --success: #167447;
  --success-soft: #e4f4eb;
  --danger: #b42318;
  --danger-soft: #fdebe8;
  --focus: #005fcc;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --radius-control: 6px;
  --radius-panel: 8px;
  --shadow-panel: 0 1px 2px rgb(23 33 43 / 8%);
  --font-ui: Inter, "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "Cascadia Code", monospace;
  --text-body: 15px;
  --line-body: 1.6;
  --measure: 70ch;
}

[data-theme="dark"] {
  --bg-canvas: #0c131b;
  --bg-surface: #131d27;
  --bg-elevated: #182531;
  --bg-subtle: #1d2b37;
  --text-primary: #f0f4f7;
  --text-secondary: #c1ccd5;
  --text-muted: #91a1af;
  --border-hairline: #2a3a47;
  --border-strong: #415462;
  --accent: #72b5e8;
  --accent-hover: #a7d4f2;
  --accent-soft: #17364b;
  --focus: #91c9f5;
}
```

## Tipografia e grid

- Etapa: 12, 13, 14, 15, 17, 20, 24, 30, 36.
- Corpo com 15 px e line-height 1.6.
- Titulos em sentence case, peso 650 ou 700.
- Leitura entre 65 e 72ch.
- IDs, tickets, hosts, comandos e timestamps em mono.
- Grid base de 4 px.
- Desktop: rail, conteudo fluido, maximo de 1440 px.
- Mobile: uma coluna, controles de contexto em drawer ou abas.

## Iconografia

Substituir cada emoji estrutural por SVG ou lucide-react.

| Uso atual | Icone recomendado |
|---|---|
| Painel | LayoutDashboard |
| Aulas | BookOpen |
| Caderno | NotebookPen |
| Mentor | MessageCircleQuestion |
| Laboratorio | Wrench |
| Chamado | Ticket |
| Chat | MessagesSquare |
| Acesso remoto | MonitorCog |
| Base de conhecimento | Library |
| Replay | Timeline |
| Curriculo | BadgeCheck |
| Tema | Sun e Moon |
| Busca | Search |
| Configuracao | Settings2 |
| Progresso | ChartNoAxesColumnIncreasing |
| Evidencia | FileCheck2 |
| Bloqueio | LockKeyhole |
| Sucesso | Check |
| Alerta | TriangleAlert |
| Falha | CircleX |
| Menu | Menu |

Regras: 16 px em navegacao, 18 px em botoes, 20 px em titulos de area, stroke 1.75, `aria-hidden` quando o texto ja nomeia a acao.

## Componentes

### AppShell

Responsavel por rail, app bar, breadcrumb, atalho de busca e estado de sessao. Nunca deve renderizar conteudo de uma tela especifica.

Estados: normal, rail recolhido, mobile drawer, sessao conectando, sessao offline.

### MissionCard

Anatomia: titulo, objetivo, nivel, duracao, progresso, estado e uma acao. Sem icone decorativo grande. O estado atual deve ser texto e barra, nao uma nuvem de chips.

### CoursePlayer

Coluna de unidades, conteudo e painel contextual. O painel contextual pode ser caderno, recursos ou mentor. Em mobile, vira drawer.

### SplitLabWorkspace

Grid com tres areas: roteiro de 240 a 280 px, console de 320 a 420 px, bancada flexivel. Deve suportar resize por teclado, colapso do roteiro e persistencia da largura.

### ItsmConsole

Fila em tabela com colunas: ID, prioridade, SLA, solicitante, assunto, ultima atividade. Detalhe em painel lateral ou coluna fixa. Nota interna e resposta ao solicitante sao campos visualmente distintos.

### SimuDeskConsole

Cabecalho de host ou cluster, indicadores de saude, abas de evidencia, terminal e acao segura. Comandos devem ser legiveis, monoespacados e acompanhados de resultado, nao apenas texto verde.

### TimelineReplay

Linha do tempo vertical ou horizontal com eventos clicaveis, filtro por criterio e comparativo entre acao observada e pratica recomendada.

### CredentialCard

Credencial com trilha, competencias, data, hash curto, estado de assinatura e acao de verificar. O visual deve ser tecnico e discreto, sem medalhao gamificado.

## Densidade

| Regra | Editorial | Operacional |
|---|---|---|
| Padding de painel | 24 px | 12 a 16 px |
| Altura de controle | 44 px | 32 a 40 px |
| Largura de leitura | 65 a 72ch | flexivel |
| Divisores | suaves | claros |
| Cor | acento pontual | status e prioridade |
| Sombras | quase nenhuma | uma sombra curta ou nenhuma |
| Animacao | transicao curta | feedback de estado |

## Acessibilidade WCAG 2.2 AA

- Contraste minimo de 4.5:1 para texto normal e 3:1 para texto grande.
- Foco visivel com `outline` de 2 px e offset de 2 px.
- Todos os botoes com nome acessivel.
- Nenhum estado comunicado apenas por cor.
- Tabelas com `caption`, cabecalho semantico e linha selecionada anunciada.
- Dialogos com foco inicial, retorno de foco e Escape.
- Live regions apenas para feedback relevante.
- Alvos de toque de pelo menos 44 por 44 px em mobile.
- Respeitar `prefers-reduced-motion`.
- Campo invalido com mensagem junto ao campo, nao apenas toast.

## Responsividade

- 375 px: uma coluna, barra inferior de areas, drawer para roteiro e caderno.
- 768 px: rail recolhivel, duas colunas apenas em telas de estudo.
- 1280 px: split screen completo, detalhes laterais.
- 1440 px: fila, detalhe e bancada sem compressao.
- 1920 px: limitar largura de leitura e evitar esticar cards.
- Teste automatizado de overflow horizontal em todos os viewports.

## Guardrails de implementacao

- Centralizar tokens em `index.css` ou arquivo de tokens importado.
- Remover cores literais dos componentes.
- Criar `Icon` wrapper para padronizar tamanho e acessibilidade.
- Manter textos de botoes existentes quando forem usados por Vitest ou Playwright; alterar apenas apos atualizar os testes.
- Usar estados explicitos: loading, empty, error, disabled, success.
- Nao esconder falhas de persistencia em catch silencioso.
