# 05. Especificação de código e direção de protótipo

## Regras de implementação

- Preservar o motor determinístico no backend como autoridade de estado, avaliação, acesso remoto e SLA. React organiza controles, apresenta respostas e encaminha ações existentes.
- Não alterar nomes ou formato dos comandos `onAcao`, `onChat`, DTOs de sessão, replay ou currículo sem uma mudança de contrato separada e compatível.
- Não inventar saídas de terminal. A interface deve renderizar somente o que o motor devolve, com rótulo de ambiente e estado de comando.
- Manter dados 100% fictícios. Não representar uma conexão real com diretório, nuvem ou terminal do navegador.
- Evitar dependências de ícone se os SVGs existentes forem suficientes. Caso escolha Lucide, auditar peso e tree shaking antes de adicionar ao bundle.
- Preservar seletores acessíveis e textos usados por Vitest e Playwright; atualizar asserts somente se o texto mudou intencionalmente.

## Refatoração sugerida por arquivo

| Arquivo | Mudança |
|---|---|
| `src/frontend/src/index.css` | Consolidar tokens claros e escuros; remover a faixa decorativa; criar escalas de densidade, estilos de foco, estados e layout responsivo. Desmembrar CSS de laboratório, aula e replay em folhas co-localizadas depois que a primeira entrega estiver estável. |
| `src/frontend/src/App.tsx` | Preservar chamada de sessão e ações. Extrair `AppShell`, `MissionGuide`, `SplitLabWorkspace` e os drawers de nota e ajuda. Evitar duplicar o cabeçalho entre academia e turno. |
| `src/frontend/src/workstation/TelaInicial.tsx` | Refazer hierarquia do painel. Priorizar retomada e próxima missão; reduzir texto de introdução; trocar cartões idênticos por lista de cenário com progresso e ação. |
| `src/frontend/src/educacao/BarraSuperior.tsx` | Transformar em navegação global enxuta, sem emoji e sem seletor de nível persistente em todas as telas. Mover escolha de nível para Trilhas. |
| `src/frontend/src/educacao/AulasView.tsx` | Extrair `LessonPlayer`, sumário recolhível, quiz contextual e ações de nota. O CTA de laboratório recebe cenário já conhecido, sem mudar contrato. |
| `src/frontend/src/educacao/CadernoView.tsx` | Usar lista de páginas, editor e origem da anotação. Manter modelo Cornell e persistência local atual. |
| `src/frontend/src/educacao/MentorView.tsx` | Renomear apresentação para Tutor de estudo; separar conversa, Feynman e Pitch como exercícios. Não sugerir capacidades generativas inexistentes. |
| `src/frontend/src/apps/ItsmApp/ItsmApp.tsx` | Extrair `TicketQueue` e `TicketDetail`. Mostrar prioridade e SLA em coluna própria, selecionar detalhe sem deslocar formulário. Manter nota interna e pública com confirmação explícita. |
| `src/frontend/src/apps/ChatApp/ChatApp.tsx` | Dar cabeçalho ao contato, separar status de identidade da conversa e manter Tech Lead sob ação de pedir pista. Manter validação usando o comando existente. |
| `src/frontend/src/apps/SimuDeskApp/SimuDeskApp.tsx` | Extrair painéis por domínio: acesso remoto, AD e rede, SRE e SQL. Não unificar controles que pertencem a cenários diferentes. Terminal deve anunciar comando e resultado. |
| `src/frontend/src/apps/IntranetApp/IntranetApp.tsx` | Extrair busca e índice de categoria. Criar âncoras para artigo e tornar passos legíveis. Preservar `KB_CATALOGO` e deep link originado do Replay. |
| `src/frontend/src/replay/ReplayView.tsx` | Separar `ReplaySummary`, `ReplayTimeline`, `ReplayEventDetail` e `CredentialCard`. Associar critério a sequência de evento quando o DTO tiver esse vínculo. |
| `src/frontend/src/data/kbCatalogo.ts` | Manter o catálogo como conteúdo. Adicionar tags somente se houver taxonomia pedagógica aprovada. |
| `src/frontend/src/educacao/catalogoEducacional.ts` | Manter trilha, aulas e cartões como dados. Evitar transferir copy para JSX. |

## Estrutura de componentes

```text
AppShell
├── GlobalNavigation
├── MainContent
│   ├── MissionCatalog
│   ├── LessonPlayer
│   └── SplitLabWorkspace
│       ├── MissionGuide
│       └── ActiveTool
│           ├── ItsmConsole
│           ├── ChatConsole
│           ├── SimuDeskConsole
│           ├── KnowledgeBase
│           └── TimelineReplay
└── ContextPanel
    ├── NotesPanel
    └── TutorPanel
```

## CSS inicial do split

```css
.app-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
  background: var(--bg-canvas);
}

.lab-workspace {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
}

.mission-guide {
  min-height: 0;
  overflow: auto;
  padding: 20px;
  border-right: 1px solid var(--border-hairline);
  background: var(--bg-surface);
}

.tool-workspace {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px;
}

.tool-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-hairline);
}

.tool-tab[aria-selected="true"] {
  color: var(--accent);
  border-bottom: 2px solid currentColor;
}

@media (max-width: 1023px) {
  .lab-workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .mission-guide[hidden] {
    display: none;
  }

  .tool-workspace {
    padding: 12px;
  }
}
```

O controle de alternância “Guia” e “Ferramenta” deve ser visível em celular. `hidden` não pode ocultar a etapa que mantém o aluno orientado sem uma forma óbvia de reabri-la.

## JSX ilustrativo

```tsx
type MissionStep = {
  id: string
  title: string
  instruction: string
  done: boolean
  current: boolean
}

function MissionGuide({
  steps,
  onHint,
}: {
  steps: MissionStep[]
  onHint: () => void
}) {
  const current = steps.find((step) => step.current)

  return (
    <aside className="mission-guide" aria-label="Guia da missão">
      <h2>Etapas da missão</h2>
      {current ? <p>{current.instruction}</p> : null}
      <ol>
        {steps.map((step) => (
          <li key={step.id} aria-current={step.current ? "step" : undefined}>
            <span>{step.done ? "Concluída" : step.current ? "Agora" : "A seguir"}</span>
            <strong>{step.title}</strong>
          </li>
        ))}
      </ol>
      <button type="button" onClick={onHint}>Pedir uma pista</button>
    </aside>
  )
}
```

O componente recebe passos derivados de estado já disponível. Ele não atualiza sessão, não avalia o aluno e não decide acesso remoto. Essas transições continuam no backend.

## Estados visuais obrigatórios

1. **Início:** retomar, nova missão, progresso vazio e API indisponível.
2. **Aula:** carregando conteúdo, sem aula para o nível, erro de persistência local, pergunta não respondida e pergunta avaliada.
3. **Workstation:** criando sessão, ação pendente, ação concluída, comando não suportado, sem acesso autorizado e chamada indisponível.
4. **ITSM:** sem chamados, fila com seleção, prioridade e SLA vencido, nota interna e resposta pública.
5. **Chat:** sem mensagens, envio pendente, identidade pendente, rejeição de dados e identidade confirmada.
6. **KB:** busca sem resultado, artigo expandido, destino vindo do Replay e retorno de foco.
7. **Replay:** carregando, ainda sem eventos, evento selecionado, critério não atendido, assinatura íntegra e assinatura inválida.

Texto de carregamento não deve afirmar que algo foi salvo antes da confirmação do serviço. Indicador de erro deve manter o conteúdo que o aluno já forneceu, quando seguro.

## Guardrails de revisão técnica

- Comparar o contrato de ações antes e depois: `itsm.*`, `dialogo.*`, `estacao.*` e `sre.*` continuam enviados pelo mesmo fluxo.
- Manter a ordenação sequencial dos eventos na UI. Replay não deve fabricar eventos para preencher lacunas.
- SLA exibido como contagem regressiva só quando a origem definir minuto inicial, minuto atual, pausa e alvo. Caso contrário, mostrar o valor-alvo e o nome da regra.
- Não chamar de certificado técnico. O Currículo Vivo é um registro verificável das competências observadas pelo simulador.
- Preservar dados sintéticos e os textos de escopo do MVP. Remover ruído da interface sem remover informação importante sobre privacidade e limites do produto.
- Realizar teste de teclado, axe-core e captura visual em larguras 375, 768, 1280 e 1440 antes de aceitar mudanças. Nenhum teste foi executado como parte desta auditoria.
