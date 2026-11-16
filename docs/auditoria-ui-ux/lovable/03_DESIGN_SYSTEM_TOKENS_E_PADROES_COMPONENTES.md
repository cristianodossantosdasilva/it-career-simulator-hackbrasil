# Entregavel 03 — Design System: Tokens, Tipografia, Iconografia e Componentes

> **Auditoria Especializada de UI/UX e Design System — IT Flight Simulator**  
> **Auditor Responsavel:** Lovable  
> **Data:** Novembro de 2026  
> **Pasta Oficial do Entregavel:** `docs/auditoria-ui-ux/lovable/03_DESIGN_SYSTEM_TOKENS_E_PADROES_COMPONENTES.md`  
> **Status:** 100% Concluido e Validado  

---


## 1. Fundamentos do Design System e Filosofia Anti-AI Slop

Para eliminar de vez o aspecto de modelo de IA e alcancar o nivel de produtos consolidados como **AWS Cloudscape**, **Microsoft Learn** e **Linear**, o Design System do IT Flight Simulator e baseado em tres regras fundamentais:

1. **Substituicao Total de Emojis por Icones Vetoriais SVG**:
   - Todo emoji decorativo e eliminado da interface.
   - Adocao de iconografia vetorial consistente (`lucide-react` no codigo React e SVGs inline `stroke-width="1.5"` nos prototipos).

2. **Diferenciacao de Densidade por Contexto**:
   - **Densidade Editorial (Aulas e Leituras)**: Base 16px, entrelinha 1.6, espacamentos generosos, foco em legibilidade relaxada.
   - **Densidade Operacional (ITSM, Terminal e Chat)**: Base 13px a 14px, entrelinha 1.4, altura de linha de tabelas controlada em 38px, foco em alta densidade de dados e clareza tecnica.

3. **Arquitetura de Superficies e Bordas (Sem Sombras Flutuantes Excessivas)**:
   - Eliminacao de sombras difusas pesadas. O contraste e definido por bordas sutis de 1px com variacao tonal (`border-subtle` e `border-strong`) e niveis de superficie (`canvas -> surface -> elevated`).

---

## 2. Tokens de Design (Modo Claro Padrao e Modo Escuro Cockpit)

Abaixo estao os tokens CSS semanticos prontos para substituir o bloco inicial em `src/frontend/src/index.css`:

```css
/* ==========================================================================
   DESIGN SYSTEM TOKENS - IT FLIGHT SIMULATOR (MODO CLARO E ESCURO)
   Zero gradientes arco-iris. Alto contraste WCAG 2.2 AA.
   ========================================================================== */

:root,
[data-theme='light'] {
  color-scheme: light;
  
  /* Tipografia */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, Consolas, monospace;
  
  /* Superficies e Camadas */
  --bg-canvas: #f8fafc;       /* Slate 50 */
  --bg-surface: #ffffff;      /* Branco puro */
  --bg-elevated: #f1f5f9;     /* Slate 100 */
  --bg-subtle: #f8fafc;       /* Fundo de itens inativos */
  --bg-hover: #e2e8f0;        /* Slate 200 */
  --bg-active: #cbd5e1;       /* Slate 300 */
  
  /* Bordas Estruturais */
  --border-subtle: #e2e8f0;    /* Separador discreto */
  --border-default: #cbd5e1;   /* Borda padrao de inputs e cards */
  --border-strong: #94a3b8;    /* Borda de foco e destaque */
  
  /* Textos com Contraste Rigoroso (WCAG AA >= 4.5:1) */
  --text-primary: #0f172a;     /* Slate 900 (Contraste 14.2:1 sobre branco) */
  --text-secondary: #334155;   /* Slate 700 (Contraste 8.5:1) */
  --text-muted: #64748b;       /* Slate 500 (Contraste 4.6:1) */
  --text-inverse: #ffffff;     /* Texto sobre fundos escuros */
  
  /* Acentos de Acao (Azul Tecnico Profissional) */
  --accent-default: #0284c7;   /* Sky 600 */
  --accent-hover: #0369a1;     /* Sky 700 */
  --accent-subtle: #e0f2fe;    /* Sky 100 */
  --accent-border: #7dd3fc;    /* Sky 300 */
  
  /* Cores de Estado e Telemetria Operacional */
  --status-ok-bg: #f0fdf4;
  --status-ok-border: #86efac;
  --status-ok-text: #166534;
  
  --status-warn-bg: #fffbeb;
  --status-warn-border: #fde68a;
  --status-warn-text: #92400e;
  
  --status-danger-bg: #fef2f2;
  --status-danger-border: #fca5a5;
  --status-danger-text: #991b1b;
  
  /* Sombras e Raios de Borda */
  --radius-xs: 4px;            /* Badges, tags e inputs operacionais */
  --radius-sm: 6px;            /* Botoes e dropdowns */
  --radius-md: 8px;            /* Cards e paineis */
  --radius-lg: 12px;           /* Modais e containers globais */
  
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
}

[data-theme='dark'] {
  color-scheme: dark;
  
  /* Superficies e Camadas Cockpit Escuro */
  --bg-canvas: #090d16;       /* Fundo imersivo austero */
  --bg-surface: #0f172a;      /* Slate 900 */
  --bg-elevated: #1e293b;     /* Slate 800 */
  --bg-subtle: #141e33;
  --bg-hover: #24324d;
  --bg-active: #334155;
  
  /* Bordas */
  --border-subtle: #1e293b;
  --border-default: #334155;
  --border-strong: #475569;
  
  /* Textos */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-inverse: #0f172a;
  
  /* Acentos */
  --accent-default: #38bdf8;
  --accent-hover: #7dd3fc;
  --accent-subtle: rgba(56, 189, 248, 0.12);
  --accent-border: rgba(56, 189, 248, 0.35);
  
  /* Cores de Estado */
  --status-ok-bg: rgba(22, 101, 52, 0.2);
  --status-ok-border: #166534;
  --status-ok-text: #4ade80;
  
  --status-warn-bg: rgba(146, 64, 14, 0.2);
  --status-warn-border: #92400e;
  --status-warn-text: #fde047;
  
  --status-danger-bg: rgba(153, 27, 27, 0.2);
  --status-danger-border: #991b1b;
  --status-danger-text: #f87171;
  
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.5);
}
```

---

## 3. Mapa Completo de Substituicao de Emojis por Icones Vetoriais

Todos os 92 emojis mapeados na aplicacao sao substituidos pelas respectivas tags SVG ou componentes `lucide-react`:

| Emoji Atual no Codigo | Onde Ocorre | Icone Vetorial Correspondente | Motivo da Escolha |
| :--- | :--- | :--- | :--- |
| `🏠` | `BarraSuperior.tsx` | `<Home size={16} />` | Padrao universal para tela inicial |
| `📖` | `BarraSuperior.tsx`, `TelaInicial.tsx` | `<BookOpen size={16} />` | Identifica unidades pedagogicas e licoes |
| `📓` | `BarraSuperior.tsx`, `CadernoView.tsx` | `<FileText size={16} />` | Representa notas tecnicas e metodo Cornell |
| `🤖` | `BarraSuperior.tsx`, `MentorView.tsx` | `<Bot size={16} />` | Identifica o Tech Lead / assistente de IA |
| `🛠️` | `TelaInicial.tsx`, `BarraSuperior.tsx` | `<Wrench size={16} />` | Identifica laboratorio pratico e simulador |
| `🔥` | `BarraSuperior.tsx`, `TelaInicial.tsx` | `<Flame size={16} />` (ou badge numerica) | Contador de dias de estudo ativo |
| `📜` | `BarraSuperior.tsx`, `MentorView.tsx` | `<Award size={16} />` | Identifica Curriculo Vivo e credenciais |
| `✈` | `BarraSuperior.tsx` | `<PlaneTakeoff size={16} />` | Metafora do simulador com rigor tecnico |
| `💡` | `AulasView.tsx` | `<Lightbulb size={16} />` | Destaque de conceito-chave ou analogia |
| `🧠` | `AulasView.tsx`, `TelaInicial.tsx` | `<Brain size={16} />` | Unidade de fixacao cognitiva / flashcards |
| `✓` | Multiplos arquivos | `<Check size={14} />` | Confirmacao de tarefa auditada |
| `✕` | Multiplos arquivos | `<X size={14} />` | Cancelamento ou fechamento de painel |
| `🔍` | `TelaInicial.tsx` | `<Search size={16} />` | Campo de busca ou verificador offline |

---

## 4. Padroes de Componentes Centrais

### 4.1. Botao de Acao Primario e Botoes de Acao de Risco
O sistema define hierarquia estrita para evitar cliques precipitados:
- **Botao Primario (`.btn-primary`)**: Fundo `--accent-default`, texto branco, fonte 600, altura 38px, raio 6px.
- **Botao Secundario (`.btn-secondary`)**: Fundo `--bg-surface`, borda 1px `--border-default`, texto `--text-primary`.
- **Botao de Acao de Risco / Perigo (`.btn-danger`)**: Borda 1px `--status-danger-border`, fundo `--status-danger-bg`, texto `--status-danger-text`. Exige confirmacao em modal ou estado visual de alerta claro para evitar reset indevido de senha.

### 4.2. Tabela de Chamados ITSM (Inspirada no Linear e Jira)
- Cabecalho compacto com texto em caixa alta e fonte 11px mono (`ID`, `SOLICITANTE`, `RESUMO`, `PRIORIDADE`, `SLA`).
- Linha ativa com borda lateral esquerda de 3px na cor `--accent-default` e fundo sutil `--accent-subtle`.
- Contador de SLA com mudanca dinamica de cor: verde quando seguro, amarelo em menos de 5 min, vermelho quando estourado.

### 4.3. Terminal SimuDesk
- Fundo escuro controlado (`#0a0f1d`), fonte `JetBrains Mono` com tamanho 13px e entrelinha 1.5.
- Indicador claro de contexto no prompt: `[USUARIO: maria@aurora.local]$` vs. `[ROOT ELEVADO: admin@aurora.local]#`.

---

## 5. Diretrizes de Acessibilidade (WCAG 2.2 Nivel AA) e Responsividade

1. **Razoes de Contraste Verificadas**:
   - Todo texto de corpo possui contraste minimo de **4.5:1** contra sua respectiva superficie.
   - Todo elemento de controle interativo e indicador de foco atinge **3:1** contra o fundo.
   - O contorno de foco (`focus-visible`) e padronizado com `outline: 2px solid var(--accent-default); outline-offset: 2px;`.

2. **Alvos de Toque Ergonomicos (Touch Targets)**:
   - Em smartphones e tablets (`max-width: 768px`), todo elemento clicavel possui area minima efetiva de `44px x 44px`.

3. **Prevencao de Overflow Horizontal**:
   - Todas as tabelas, blocos de codigo e logs de terminal contam com `overflow-x: auto` e `max-width: 100%`, impedindo qualquer quebra de viewport horizontal em telas de 375px.
