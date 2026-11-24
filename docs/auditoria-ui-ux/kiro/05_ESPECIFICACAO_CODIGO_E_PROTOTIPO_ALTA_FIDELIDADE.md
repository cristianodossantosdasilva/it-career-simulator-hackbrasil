# 05. Especificação de código e protótipo de alta fidelidade

Arquivo complementar: `05_MOCKUP_ALTA_FIDELIDADE.html` (abre offline, ícones SVG inline, sem emojis na proposta, sem dependências externas, alterna claro e escuro). Capturas de conferência em `evidencias/mockup-1440.png` e `evidencias/mockup-375.png`. Medi overflow horizontal do mockup: zero em 1440 e 375.

Esta especificação não altera nada em `src/`. É um plano para o time executar.

## 1. Contratos que não podem quebrar

Selecionei os seletores existentes nos testes (`App.test.tsx`, `ChatApp.test.tsx`, `IntranetApp.test.tsx`, `ItsmApp.test.tsx`, `SimuDeskApp.test.tsx`, `ReplayView.test.tsx`, `e2e/jornadas.spec.ts`).

| Seletor usado hoje | Onde | Regra na refatoração |
|---|---|---|
| `radio` com nome `/Nível 1 · Estagiário/` e botão `/Iniciar no Simulador/` | `App.test.tsx` 45, e2e 10 a 19 | A Home nova precisa manter um grupo de rádio de cenário e o botão de iniciar com esse nome. A linha de cenário (`MissionRow`) pode ser um `radio` visualmente estilizado como linha, e "Iniciar primeiro missão" chama o mesmo handler. O nome do botão de início do cenário selecionado continua "Iniciar no Simulador". |
| `heading` `/IT Career Simulator/` e `/Missão 0/` | `App.test.tsx` 39 e 40 | Se o título mudar para "Seu primeiro turno...", atualizar o teste no mesmo commit. Manter um `h1` com "IT Career Simulator" (pode ficar visualmente na marca). |
| Textos "Assumir Chamado", "Consultar Politica KB-001", "Solicitar Token Corporativo", "Registrar Nota", "Recusar Reset sem Validacao", "Resolver Chamado", "Salvar Classificacao" | e2e 32 a 63 | A correção ortográfica e a nova copy mudam esses nomes. Criar `src/textos/workstation.ts` e importar a mesma constante nos componentes e nos testes. Assim os testes não ficam presos a texto errado. |
| `getByLabel('Texto da nota')`, `'Nota publica de resolucao'`, `/Matrícula/`, `/Ramal/` | e2e, ItsmApp | Manter `aria-label` exatos, ou atualizar pela mesma constante. |
| `button` `/Juiz 360º e Replay/`, `/Comunicador IA/` | e2e 45 e 65 | A nova aba pode chamar "Replay" e "Chat"; atualizar constante. |
| `region` "Intranet e Base de Conhecimento", botão "Fechar artigo", `heading` com foco em KB-001 | e2e 53 a 54, App.test 32 e 34 | Preservar o gerenciamento de foco ao abrir artigo. |
| `log` "Mensagens da conversa", `aria-pressed` em "Tech Lead IA" | ChatApp.test | Preservar `role="log"` e `aria-pressed` nos seletores de contato. |
| `getByPlaceholderText('NNN NNN NNN')` e `'4 digitos'`, `alert` "ID ou PIN invalido." | SimuDeskApp.test | Preservar placeholders, `role="alert"` e texto. A correção ortográfica troca "invalido" e "digitos"; mudar junto com o teste. |
| `toolbar` "Comandos sugeridos", `status` com nome de usuário, `aria-pressed` em "Terminal" e "Paineis Admin" | SimuDeskApp.test | Preservar papéis. |
| `range` com `id="replay-range"`, botão `aria-label="Ver evento sequencia N"`, `Consultar KB: <uri>` | `ReplayView.tsx`, ReplayView.test | Preservar nos novos `TimelineReplay` e `CriteriaPanel`. |
| `aria-label="Aplicativos da Workstation"` | `App.tsx` 454 e 455 | Preservar no novo `ToolTabs`. |

Regras de segurança do projeto (AGENTS.md) que continuam valendo: zero caractere E comercial, dados fictícios, motor determinístico como única autoridade (a UI só lê eventos e critérios), `scripts/check-bundle-secrets.mjs` no build.

## 2. Plano de refatoração arquivo por arquivo

Ordem pensada para entregar valor visual cedo e manter o projeto verde a cada commit (`npm.cmd run lint`, `npm.cmd test -- --run`, `npm.cmd run build`).

| Passo | Arquivo | Mudança | Risco |
|---|---|---|---|
| 1 | `package.json` | `npm i lucide-react` e fontes em `src/assets/fonts` (woff2 de Inter Variable e JetBrains Mono, licença OFL). | Baixo. Peso: lucide-react com importação por ícone fica abaixo de 15 kB para ~30 ícones. |
| 2 | `src/styles/tokens.css` (novo) | Tokens do arquivo 03, mais aliases dos nomes antigos. Importar em `main.tsx` antes de `index.css`. | Baixo |
| 3 | `src/ui/Icon.tsx` (novo) | Wrapper com `name`, `size`, `label`. | Baixo |
| 4 | `catalogoEducacional.ts` | Campo `icon` (emoji) vira `iconeNome` (string de ícone). 9 ocorrências. Testes de `AulasView`: nenhum depende do emoji. | Baixo |
| 5 | `BarraSuperior.tsx` | Reduzir a barra de contexto, tirar emojis, faixa e legenda. Seletor de nível em foco vai para a Home. Manter a prop `visaoAtual` e callbacks. | Médio (App.test usa botões da barra) |
| 6 | `src/shell/AppShell.tsx`, `NavRail.tsx`, `BottomNav.tsx` (novos) | Casca única. `App.tsx` passa a renderizar o conteúdo dentro do shell, inclusive a Workstation (hoje é um ramo separado). | Médio |
| 7 | `TelaInicial.tsx` | Trocar por `MissionHome` com tabela de cenários. Mover carreira e verificador para `CredentialsPage`. Pomodoro e plano para `ProfileMenu`. Preservar rádios, "Iniciar no Simulador" e "Demo Rápida". | Alto: arquivo de 874 linhas e usado por testes |
| 8 | `App.tsx` (636 linhas) | Extrair o bloco de dock e gavetas (linhas ~437 a 600) para `Workstation.tsx`, `ToolTabs.tsx`, `NotesDrawer.tsx`, `TutorDrawer.tsx`. Manter estado e contratos de API. | Alto |
| 9 | `ItsmApp.tsx` | Reorganizar em `ItsmConsole`: `TicketTable`, `TicketDetail`, `Composer`. Mesmos `onAcao` e payloads. | Médio |
| 10 | `ChatApp.tsx` | `ChatThread`, `RequesterCard`, `QuickReplies`. Mantém `role="log"`. | Baixo |
| 11 | `SimuDeskApp.tsx` | `HostHeader`, `Terminal`, `PodTable`. Remover 6 estilos inline. | Médio |
| 12 | `IntranetApp.tsx` | `KbPortal` com busca, índice e artigo. | Baixo |
| 13 | `ReplayView.tsx` | `TimelineReplay`, `CriteriaPanel`, `CompareBlock`, `CredentialCard`. Mantém todas as chamadas já existentes (`onAtualizar`, `onNavegaKb`). | Médio |
| 14 | `AulasView.tsx`, `CadernoView.tsx`, `MentorView.tsx` | Player e restyle. | Médio |
| 15 | `index.css` | Remover regras mortas (faixa, legenda, `.chip-sre`, `.chip-sql`, `.btn-ai`, `.flash-inner` 3D...) apenas depois de nenhum componente usar. | Baixo |
| 16 | `e2e/layout.spec.ts`, `e2e/visual.spec.ts` (novos) | Overflow em 4 larguras e snapshots. | Baixo |

Meta para o pitch (pré-banca): passos 1 a 8, 9, 13 e 14 parcial (apenas ícones e tipografia). O restante pode entrar depois.

## 3. CSS pronto (layout principal)

Importar depois de `tokens.css`. Sem caractere E comercial e sem `!important`, exceto `prefers-reduced-motion`.

```css
/* shell.css */
.app-shell {
  display: grid;
  grid-template-columns: var(--rail-w) minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--bg-canvas);
  color: var(--text-primary);
  font: 14px/1.45 var(--font-ui);
}
.nav-rail {
  position: sticky; top: 0; height: 100dvh;
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
  padding: var(--sp-3) 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-hairline);
}
.nav-rail a {
  position: relative; display: grid; place-items: center;
  width: 40px; height: 40px; border-radius: var(--r-md);
  color: var(--text-muted);
}
.nav-rail a:hover { background: var(--bg-subtle); color: var(--text-primary); }
.nav-rail a[aria-current='page'] { background: var(--accent-subtle); color: var(--accent-text); }
.nav-rail a[aria-current='page']::before {
  content: ''; position: absolute; left: -8px; top: 8px; bottom: 8px;
  width: 2px; background: var(--accent); border-radius: 2px;
}
.topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: var(--sp-3);
  height: var(--topbar-h); padding: 0 var(--sp-4);
  background: var(--bg-surface); border-bottom: 1px solid var(--border-hairline);
}
.content { min-width: 0; scroll-padding-top: calc(var(--topbar-h) + 16px); }

/* mobile: barra inferior no lugar do rail */
@media (max-width: 767px) {
  .app-shell { grid-template-columns: 1fr; padding-bottom: 56px; }
  .nav-rail { display: none; }
  .bottom-nav {
    position: fixed; inset: auto 0 0 0; height: 56px; z-index: 30;
    display: grid; grid-template-columns: repeat(5, 1fr);
    background: var(--bg-surface); border-top: 1px solid var(--border-hairline);
  }
}
@media (min-width: 768px) { .bottom-nav { display: none; } }

/* workstation */
.lab-split {
  --guide-w: 32%;
  display: grid;
  grid-template-columns: minmax(280px, var(--guide-w)) 6px minmax(0, 1fr);
  height: calc(100dvh - var(--topbar-h));
  min-height: 0;
}
.lab-guide { overflow: auto; background: var(--bg-surface); padding: var(--sp-5); }
.lab-divider { cursor: col-resize; background: var(--border-hairline); }
.lab-divider:hover, .lab-divider:focus-visible { background: var(--accent); }
.lab-tools { min-width: 0; display: flex; flex-direction: column; }
@media (max-width: 1023px) {
  .lab-split { grid-template-columns: 1fr; height: auto; }
  .lab-divider { display: none; }
  .lab-guide { position: fixed; inset: auto 0 56px 0; max-height: 70dvh; z-index: 40;
    transform: translateY(100%); transition: transform var(--dur-base) var(--ease);
    border-top: 1px solid var(--border-strong); border-radius: var(--r-lg) var(--r-lg) 0 0; }
  .lab-guide[data-open='true'] { transform: none; }
}

/* console ITSM */
.itsm { display: grid; grid-template-columns: minmax(260px, 38%) minmax(0, 1fr); min-height: 0; flex: 1; }
.itsm table { width: 100%; border-collapse: collapse; }
.itsm th { height: 32px; padding: 0 var(--sp-3); text-align: left; font-size: var(--fs-12); font-weight: 600;
  color: var(--text-secondary); background: var(--bg-subtle); border-bottom: 1px solid var(--border-hairline); }
.itsm td { height: var(--row-h); padding: 0 var(--sp-3); border-bottom: 1px solid var(--border-hairline); }
.itsm tr[aria-selected='true'] td { background: var(--accent-subtle); }
.itsm tr[aria-selected='true'] td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
@media (max-width: 899px) { .itsm { grid-template-columns: 1fr; } }

/* linha do tempo do replay */
.timeline { list-style: none; margin: 0; padding: 0; }
.timeline li { display: grid; grid-template-columns: 48px 20px minmax(0, 1fr) auto; gap: var(--sp-2); padding: var(--sp-2) 0; }
.timeline .minuto { font: 12px var(--font-mono); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.timeline li[aria-current='step'] { background: var(--accent-subtle); border-radius: var(--r-md); margin-inline: -12px; padding-inline: 12px; }

/* foco e movimento */
:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

## 4. Componentes em TSX

Exemplos para orientar. Sem avaliação no cliente: todo estado de tarefa vem dos eventos e critérios que a API já devolve.

### 4.1 Icon

```tsx
// src/ui/Icon.tsx
import type { LucideIcon } from 'lucide-react'
import { Compass, BookOpen, Terminal, NotebookPen, MessagesSquare, BadgeCheck, Lock, Clock, Check, CircleAlert } from 'lucide-react'

const ICONES = { Compass, BookOpen, Terminal, NotebookPen, MessagesSquare, BadgeCheck, Lock, Clock, Check, CircleAlert } as const
export type IconeNome = keyof typeof ICONES

interface IconProps {
  nome: IconeNome
  tamanho?: 16 | 20 | 24
  rotulo?: string
}

export function Icon({ nome, tamanho = 20, rotulo }: IconProps) {
  const Componente: LucideIcon = ICONES[nome]
  return rotulo ? (
    <Componente size={tamanho} strokeWidth={1.75} role="img" aria-label={rotulo} />
  ) : (
    <Componente size={tamanho} strokeWidth={1.75} aria-hidden="true" />
  )
}
```

### 4.2 AppShell

```tsx
// src/shell/AppShell.tsx
import type { ReactNode } from 'react'
import { Icon, type IconeNome } from '../ui/Icon'

export type Destino = 'home' | 'aulas' | 'lab' | 'caderno' | 'mentor' | 'credencial'

const ITENS: { id: Destino; rotulo: string; icone: IconeNome }[] = [
  { id: 'home', rotulo: 'Missões', icone: 'Compass' },
  { id: 'aulas', rotulo: 'Aulas', icone: 'BookOpen' },
  { id: 'lab', rotulo: 'Laboratório', icone: 'Terminal' },
  { id: 'caderno', rotulo: 'Caderno', icone: 'NotebookPen' },
  { id: 'mentor', rotulo: 'Mentor', icone: 'MessagesSquare' },
  { id: 'credencial', rotulo: 'Credencial', icone: 'BadgeCheck' },
]

interface AppShellProps {
  atual: Destino
  aoNavegar: (destino: Destino) => void
  trilha: string[]            // breadcrumb: ['Missões', 'Estagiário', 'Triagem...']
  acoesTopo?: ReactNode       // relógio de turno, busca, perfil
  children: ReactNode
}

export function AppShell({ atual, aoNavegar, trilha, acoesTopo, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <nav className="nav-rail" aria-label="Navegação principal">
        {ITENS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.rotulo}
            title={item.rotulo}
            aria-current={atual === item.id ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); aoNavegar(item.id) }}
          >
            <Icon nome={item.icone} />
          </a>
        ))}
      </nav>
      <div className="content">
        <header className="topbar">
          <nav aria-label="Trilha de navegação" className="crumb">
            {trilha.map((parte, i) => (
              <span key={parte} aria-current={i === trilha.length - 1 ? 'page' : undefined}>{parte}</span>
            ))}
          </nav>
          <div className="grow" />
          {acoesTopo}
        </header>
        <main id="conteudo">{children}</main>
      </div>
      <nav className="bottom-nav" aria-label="Navegação principal (celular)">
        {ITENS.slice(0, 5).map((item) => (
          <a key={item.id} href={`#${item.id}`} aria-current={atual === item.id ? 'page' : undefined}
             onClick={(e) => { e.preventDefault(); aoNavegar(item.id) }}>
            <Icon nome={item.icone} />
            <span>{item.rotulo}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
```

Nota: duas `nav` com o mesmo `aria-label` quebrariam `getByRole('navigation', { name })`; por isso o rótulo do celular é diferente. Esconder a que não aparece com `display: none` (já nas regras CSS) retira do leitor de tela.

### 4.3 MissionRow (linha de cenário, mantém contrato de rádio)

```tsx
// src/home/MissionRow.tsx
import { Icon } from '../ui/Icon'

interface MissionRowProps {
  grupo: string               // name do grupo de rádio
  id: string
  numero: number
  nivel: string               // 'Nível 1 · Estagiário' (texto de acessibilidade)
  titulo: string
  minutos: number
  estado: 'comecar' | 'continuar' | 'concluido' | 'em-portfólio'
  selecionado: boolean
  aoSelecionar: (id: string) => void
}

const TEXTO_ESTADO = {
  comecar: 'Começar',
  continuar: 'Continuar',
  concluido: 'Concluído',
  'em-portfólio': 'Em portfólio',
} as const

export function MissionRow(p: MissionRowProps) {
  const desabilitado = p.estado === 'em-portfólio'
  return (
    <label className="mission-row" data-selected={p.selecionado} data-estado={p.estado}>
      <input
        type="radio"
        name={p.grupo}
        value={p.id}
        checked={p.selecionado}
        disabled={desabilitado}
        onChange={() => p.aoSelecionar(p.id)}
        aria-label={p.nivel + ': ' + p.titulo}
      />
      <span className="mission-num mono">{p.numero}</span>
      <span className="mission-main">
        <strong>{p.titulo}</strong>
        <span className="muted">{p.nivel}</span>
      </span>
      <span className="mission-time mono muted">{p.minutos} min</span>
      <span className="mission-state">
        {p.estado === 'concluido' ? <Icon nome="Check" tamanho={16} /> : null}
        {TEXTO_ESTADO[p.estado]}
      </span>
    </label>
  )
}
```

```css
.mission-row {
  display: grid; grid-template-columns: 24px 32px minmax(0, 1fr) 64px 96px; gap: var(--sp-3);
  align-items: center; min-height: 56px; padding: 0 var(--sp-4);
  border-top: 1px solid var(--border-hairline); background: var(--bg-surface); cursor: pointer;
}
.mission-row:first-child { border-top: 0; }
.mission-row:hover { background: var(--bg-subtle); }
.mission-row[data-selected='true'] { background: var(--accent-subtle); box-shadow: inset 2px 0 0 var(--accent); }
.mission-row input { accent-color: var(--accent); }
.mission-row:focus-within { box-shadow: var(--focus-ring); }
@media (max-width: 767px) { .mission-row { grid-template-columns: 24px minmax(0, 1fr) 24px; } .mission-num, .mission-time { display: none; } }
```

O uso de `<input type="radio">` dentro de `<label>` mantém `getByRole('radio', { name })` dos testes e dá clique na linha inteira.

### 4.4 SplitLabWorkspace

```tsx
// src/lab/SplitLabWorkspace.tsx
import { useRef, useState, type ReactNode, type KeyboardEvent, type PointerEvent } from 'react'

interface Props {
  guia: ReactNode
  ferramentas: ReactNode
  larguraInicial?: number    // percentual do guia, 32
}

export function SplitLabWorkspace({ guia, ferramentas, larguraInicial = 32 }: Props) {
  const [largura, setLargura] = useState(() => {
    const salvo = Number(localStorage.getItem('lab.guia'))
    return Math.min(50, Math.max(20, salvo || larguraInicial))
  })
  const raiz = useRef<HTMLDivElement>(null)

  function ajustar(v: number) {
    const novo = Math.min(50, Math.max(20, v))
    setLargura(novo)
    localStorage.setItem('lab.guia', String(novo))
  }
  function aoArrastar(e: PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1 || !raiz.current) return
    const caixa = raiz.current.getBoundingClientRect()
    ajustar(((e.clientX - caixa.left) / caixa.width) * 100)
  }
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') ajustar(largura - 2)
    if (e.key === 'ArrowRight') ajustar(largura + 2)
  }

  return (
    <div className="lab-split" ref={raiz} style={{ ['--guide-w' as string]: largura + '%' }}>
      <aside className="lab-guide" aria-label="Guia da missão">{guia}</aside>
      <div
        className="lab-divider"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(largura)}
        aria-valuemin={20}
        aria-valuemax={50}
        aria-label="Largura do guia da missão"
        tabIndex={0}
        onPointerMove={aoArrastar}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onKeyDown={aoTeclar}
      />
      <section className="lab-tools" aria-label="Ferramentas">{ferramentas}</section>
    </div>
  )
}
```

### 4.5 MissionGuide (lê eventos, não avalia)

```tsx
// src/lab/MissionGuide.tsx
import { Icon } from '../ui/Icon'
import type { ReplayResponse } from '../api/types'

interface Tarefa { id: string; texto: string; detalhe?: string; criterioId?: string }

interface Props {
  titulo: string
  objetivo: string
  tarefas: Tarefa[]                       // vem do catálogo do cenário
  criterios: ReplayResponse['avaliacao']['criterios']   // dado do motor
  dicasUsadas: number
  aoPedirDica: () => void
}

export function MissionGuide({ titulo, objetivo, tarefas, criterios, dicasUsadas, aoPedirDica }: Props) {
  const concluida = (t: Tarefa) => criterios.some((c) => c.id === t.criterioId ? c.atendido : false)
  const atualIdx = tarefas.findIndex((t) => !concluida(t))
  return (
    <>
      <h2>{titulo}</h2>
      <p className="lead">{objetivo}</p>
      <h3>Tarefas</h3>
      <ol className="tasks">
        {tarefas.map((t, i) => (
          <li key={t.id} data-estado={concluida(t) ? 'feito' : i === atualIdx ? 'atual' : 'pendente'}
              aria-current={i === atualIdx ? 'step' : undefined}>
            <span className="mark" aria-hidden="true">{concluida(t) ? <Icon nome="Check" tamanho={16} /> : null}</span>
            <span><span className="sr-only">{concluida(t) ? 'Concluída: ' : 'Pendente: '}</span>{t.texto}
              {t.detalhe ? <span className="muted d-block">{t.detalhe}</span> : null}</span>
          </li>
        ))}
      </ol>
      <div className="hint">
        <span>Dicas usadas: {dicasUsadas} de 3</span>
        <button type="button" className="btn sm" onClick={aoPedirDica} disabled={dicasUsadas >= 3}>Pedir dica</button>
      </div>
    </>
  )
}
```

Limitação a decidir: nem todo passo tem critério `S1`..`S4` hoje (o cenário 1 expõe 4 critérios para 6 tarefas). Duas saídas: (a) marcar tarefa por tipo de evento da lista de eventos já emitida (por exemplo `ChamadoAssumido`), lendo `sessao.eventos`; (b) pedir ao backend que exponha o checklist junto do cenário. A opção (a) não toca no backend e serve para a banca.

### 4.6 ItsmConsole (esqueleto)

```tsx
// src/apps/ItsmApp/ItsmConsole.tsx
interface LinhaChamado {
  id: string; titulo: string; prioridade: string; slaRestante: string; status: string; urgente: boolean
}

export function TicketTable({ chamados, selecionadoId, aoSelecionar }: {
  chamados: LinhaChamado[]; selecionadoId: string; aoSelecionar: (id: string) => void
}) {
  return (
    <table aria-label="Fila de chamados">
      <thead><tr><th scope="col">Chave</th><th scope="col">Resumo</th><th scope="col">SLA</th></tr></thead>
      <tbody>
        {chamados.map((c) => (
          <tr key={c.id} aria-selected={c.id === selecionadoId}>
            <td className="mono">
              <button type="button" className="link" onClick={() => aoSelecionar(c.id)} aria-label={'Abrir ' + c.id}>
                {c.id}
              </button>
            </td>
            <td>{c.titulo}</td>
            <td className="mono" data-urgente={c.urgente}>{c.slaRestante}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

```

Observação: o teste `ItsmApp.test.tsx` clica em `button` com nome `/CH-0002/`, então o gatilho de seleção continua um `button` cujo nome contém a chave. O `aria-label="Abrir CH-0002"` atende o regex. O `heading` do detalhe continua `h2` com "CH-0001 ..." para `getByRole('heading', { name: /CH-0001/ })`.

Dados de SLA: se a API ainda não devolve prazo por chamado, calcular na UI apenas para exibição a partir de `minutoSimulado` e de uma tabela de metas por prioridade, marcada como "estimado". A decisão de violação de SLA continua no motor.

### 4.7 TimelineReplay

```tsx
// src/replay/TimelineReplay.tsx
import type { ReplayResponse } from '../api/types'
import { Icon } from '../ui/Icon'
import { rotuloEvento } from './rotulosEvento'

type Evento = ReplayResponse['eventos'][number]

interface Props {
  eventos: Evento[]
  indice: number
  aoSelecionar: (i: number) => void
  criterioPorSeq: Record<number, string>   // seq -> 'S1'
}

export function TimelineReplay({ eventos, indice, aoSelecionar, criterioPorSeq }: Props) {
  const atual = eventos[indice]
  return (
    <section aria-label="Linha do tempo do Replay">
      <h2>Linha do tempo</h2>
      <ol className="timeline">
        {eventos.map((e, i) => (
          <li key={e.seq} aria-current={i === indice ? 'step' : undefined}>
            <span className="minuto">{String(Math.floor(e.minutoSimulado)).padStart(2, '0')}:00</span>
            <span aria-hidden="true">{criterioPorSeq[e.seq] ? <Icon nome="Check" tamanho={16} /> : '•'}</span>
            <button type="button" className="link-plain" onClick={() => aoSelecionar(i)}>
              {rotuloEvento(e.tipo)}
            </button>
            {criterioPorSeq[e.seq] ? <span className="tag mono">{criterioPorSeq[e.seq]}</span> : null}
          </li>
        ))}
      </ol>
      <div className="scrub">
        <label htmlFor="replay-range" className="mono muted">Passo {atual ? atual.seq : 1} de {eventos.length}</label>
        <input id="replay-range" type="range" min={0} max={Math.max(0, eventos.length - 1)} value={indice}
               onChange={(e) => aoSelecionar(Number(e.target.value))}
               aria-valuetext={atual ? rotuloEvento(atual.tipo) : undefined} />
      </div>
      <details className="tech">
        <summary>Ver evento bruto</summary>
        <pre className="mono">{JSON.stringify(atual ? (atual.payload ?? atual.dados ?? {}) : {}, null, 2)}</pre>
      </details>
    </section>
  )
}
```

```ts
// src/replay/rotulosEvento.ts
const ROTULOS: Record<string, string> = {
  SessaoIniciada: 'Sessão iniciada',
  ChamadoAberto: 'Chamado aberto',
  ChamadoAssumido: 'Você assumiu o chamado',
  PoliticaConsultada: 'Você consultou a política',
  TokenSolicitado: 'Você pediu o token corporativo',
  ResetRecusado: 'Você recusou o reset sem validação',
}
export function rotuloEvento(tipo: string): string {
  return ROTULOS[tipo] ?? tipo
}
```

Os nomes de tipos de evento acima são ilustrativos (o cenário atual emite `SessaoIniciada` e `ChamadoAberto`, confirmados na produção). Antes de implementar, listar todos os tipos reais emitidos em `Simulador.Dominio` e preencher a tabela completa; tipos sem rótulo continuam aparecendo com o nome técnico.

### 4.8 CredentialCard

```tsx
// src/replay/CredentialCard.tsx
interface Props {
  titulo: string
  competencias: string[]
  emitidaEm: string
  verificada: boolean | null     // null = ainda não verificada
  algoritmo: string
  hash: string
  aoVerificar: () => void
  aoBaixar: () => void
}

export function CredentialCard(p: Props) {
  return (
    <section className="credential" aria-label="Credencial verificável">
      <svg className="seal" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="48" cy="48" r="44" /><circle cx="48" cy="48" r="36" strokeDasharray="2 4" />
        <path d="M30 50 48 28l18 22H56v16H40V50z" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <div>
        <h3>{p.titulo}</h3>
        <dl>
          <dt>Competências</dt><dd>{p.competencias.length ? p.competencias.join(', ') : 'Nenhuma ainda'}</dd>
          <dt>Emitida em</dt><dd>{p.emitidaEm}</dd>
          <dt>Verificação</dt>
          <dd>{p.verificada === null ? 'Não verificada' : p.verificada ? 'Assinatura válida' : 'Assinatura inválida'}</dd>
        </dl>
        <details><summary>Detalhes técnicos</summary><code>{p.algoritmo}</code> <code>{p.hash}</code></details>
      </div>
      <div className="credential-actions">
        <button type="button" className="btn primary" onClick={p.aoVerificar}>Verificar</button>
        <button type="button" className="btn" onClick={p.aoBaixar}>Baixar JSON</button>
      </div>
    </section>
  )
}
```

A verificação continua usando `utils/jcs.ts` e o fluxo existente, e os vetores `docs/vetores-jcs-sha256.json` não mudam.

## 5. Skeleton, cold start e command palette

```tsx
// src/ui/ColdStartNotice.tsx
import { useEffect, useState } from 'react'

export function ColdStartNotice({ carregando, aoTentar }: { carregando: boolean; aoTentar: () => void }) {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    if (!carregando) { setLento(false); return }
    const t = window.setTimeout(() => setLento(true), 3000)
    return () => window.clearTimeout(t)
  }, [carregando])
  if (!carregando) return null
  return lento ? (
    <div role="status" className="coldstart">
      <p>O servidor está acordando. Na primeira vez pode levar até 50 segundos.</p>
      <div className="indeterminate" aria-hidden="true" />
      <button type="button" className="btn sm" onClick={aoTentar}>Tentar de novo</button>
    </div>
  ) : (
    <div className="skeleton" aria-busy="true" aria-label="Carregando" />
  )
}
```

```css
.skeleton { height: 120px; border-radius: var(--r-lg); background: linear-gradient(90deg, var(--bg-subtle), var(--bg-surface), var(--bg-subtle)); background-size: 200% 100%; animation: pulso 1.2s linear infinite; }
@keyframes pulso { to { background-position: -200% 0; } }
.indeterminate { height: 3px; background: var(--bg-subtle); position: relative; overflow: hidden; border-radius: 2px; }
.indeterminate::after { content: ''; position: absolute; inset: 0 70% 0 0; background: var(--accent); animation: varre 1.4s ease-in-out infinite; }
@keyframes varre { to { inset: 0 0 0 70%; } }
```

Command palette: um `dialog` com `input role="combobox"`, `listbox` de resultados, índice montado a partir de `kbCatalogo` e de `catalogoEducacional`, atalho `Ctrl+K` e `Cmd+K` em `keydown` global, abre/fecha com foco preso e retorno do foco. Estimativa: 1 dia.

## 6. Testes novos

```ts
// e2e/layout.spec.ts
import { test, expect } from '@playwright/test'

for (const largura of [375, 768, 1280, 1440]) {
  test('sem rolagem horizontal em ' + largura, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 })
    await page.goto('/')
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(extra).toBe(0)
  })
}
```

Vitest com axe-core nos componentes novos (`Icon`, `MissionRow`, `AppShell`, `TimelineReplay`, `CredentialCard`): renderizar e rodar `axe.run`, esperar `violations` vazio. Testes de contraste: ampliar `utils/contraste.ts` (já existe) para validar os pares de tokens da seção 2 do arquivo 03.

## 7. Roteiro de entrega e orçamento de tempo

| Janela | Entrega | Esforço estimado |
|---|---|---|
| Dias 1 a 2 | Tokens, fontes, `Icon`, troca dos emojis, barra de contexto sem faixa, ajustes de copy da Home | 2 dias |
| Dias 3 a 5 | `AppShell`, `MissionHome` com tabela, `ColdStartNotice` | 3 dias |
| Dias 6 a 9 | `SplitLabWorkspace`, `MissionGuide`, `ItsmConsole`, abas de ferramenta | 4 dias |
| Dias 10 a 12 | `TimelineReplay`, `CriteriaPanel`, `CredentialCard` | 3 dias |
| Dia 13 | Command palette, correção ortográfica geral e atualização de testes | 1 dia |
| Dia 14 | Gravação do vídeo de 3 minutos, ensaio e ajustes | 1 dia |

Estimativas são de ordem de grandeza para uma pessoa com o código aberto; não foram validadas contra o ritmo real do time.

## 8. Checklist de aceite visual (design QA)

1. Nenhum emoji na interface: busca por regex `[\u2600-\u27BF]|[\uD83C-\uD83E]` em `src/` retorna zero em arquivos que não sejam de teste.
2. Nenhum `style={{` além de largura dinâmica de barra e da variável `--guide-w`.
3. Raios: apenas 4, 6 e 10 px (mais 9 px do contador).
4. Um único botão primário por painel.
5. Overflow horizontal zero em 375, 768, 1280, 1440 e 1920.
6. Contraste: todo texto 4.5:1 ou mais; bordas de controle 3:1 ou mais.
7. Altura da Home em 375 px abaixo de 1800 px.
8. Português acentuado em toda a Workstation e Replay.
9. `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build` verdes; `dotnet test src/backend/Simulador.slnx` continua verde (sem tocar no backend).
10. Zero caractere E comercial em arquivos de interface e documentação.
