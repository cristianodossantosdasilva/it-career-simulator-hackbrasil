# Especificacao de codigo e prototipo de alta fidelidade

## Escopo

Este plano preserva os contratos do backend C sharp, o Event Sourcing, o Juiz 360 graus, o Curriculo Vivo e os testes existentes. A mudanca e de shell, componentes visuais, composicao de telas e estados de interacao. O dialogo nao pode alterar estado tecnico nem avaliar o aluno.

## Refatoracao por arquivo

| Arquivo atual | Acao |
|---|---|
| `src/frontend/src/index.css` | Extrair tokens, reset, tipografia, superficies editorial e operacional, estados e responsividade |
| `src/frontend/src/App.tsx` | Introduzir `AppShell`, manter roteamento de estado e montar contexto de sessao |
| `src/frontend/src/workstation/TelaInicial.tsx` | Trocar grade de cards por `MissionCatalog`, `MissionCard` e `TrackProgress` |
| `src/frontend/src/educacao/BarraSuperior.tsx` | Tornar app bar fina, substituir emojis por `Icon`, mover navegacao para rail |
| `src/frontend/src/educacao/AulasView.tsx` | Montar `CoursePlayer`, drawer de unidades, painel contextual e checkpoint persistente |
| `src/frontend/src/educacao/CadernoView.tsx` | Renderizar caderno como contexto da unidade e pagina independente |
| `src/frontend/src/educacao/MentorView.tsx` | Renomear para revisao guiada, retirar aparencia de chat de IA e preservar avaliacao deterministica |
| `src/frontend/src/apps/ItsmApp/ItsmApp.tsx` | Criar fila semantica, detalhe lateral, SLA countdown e separacao de nota interna |
| `src/frontend/src/apps/ChatApp/ChatApp.tsx` | Adicionar `RequesterCard`, thread e estado de verificacao |
| `src/frontend/src/apps/SimuDeskApp/SimuDeskApp.tsx` | Adicionar `HostHeader`, `HealthBar`, `DiagnosticTabs` e `LogViewer` |
| `src/frontend/src/apps/IntranetApp/IntranetApp.tsx` | Adicionar indice, busca incremental e passos acionaveis |
| `src/frontend/src/replay/ReplayView.tsx` | Substituir cards por `TimelineReplay`, `ScoreStrip`, comparativo e credencial |

## Estrutura sugerida

```text
src/frontend/src/
|-- design/
|   |-- Icon.tsx
|   |-- AppShell.tsx
|   |-- tokens.css
|   |-- primitives.css
|-- components/
|   |-- MissionCard.tsx
|   |-- TrackProgress.tsx
|   |-- CoursePlayer.tsx
|   |-- SplitLabWorkspace.tsx
|   |-- ItsmConsole.tsx
|   |-- TimelineReplay.tsx
|   |-- CredentialCard.tsx
|-- educacao/
|-- apps/
|-- replay/
```

## Bloco CSS inicial

```css
.app-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: var(--rail-width, 56px) minmax(0, 1fr);
  background: var(--bg-canvas);
  color: var(--text-primary);
}

.app-rail {
  border-right: 1px solid var(--border-hairline);
  background: var(--bg-surface);
}

.app-main {
  min-width: 0;
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
}

.content-measure {
  width: min(100% - 48px, 1440px);
  margin-inline: auto;
}

.course-player {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr) 300px;
  gap: var(--space-6);
  align-items: start;
}

.split-lab {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  min-height: calc(100dvh - 48px);
}

.split-lab__guide {
  border-right: 1px solid var(--border-hairline);
  background: var(--bg-surface);
}

.split-lab__bench {
  min-width: 0;
  background: var(--bg-operational);
  color: var(--text-inverse);
}

@media (max-width: 800px) {
  .app-shell { display: block; }
  .app-rail { position: fixed; inset: auto 0 0; z-index: 20; height: 56px; }
  .app-main { padding-bottom: 56px; }
  .course-player { display: block; }
  .course-player__units,
  .course-player__context { display: none; }
  .split-lab { display: block; min-height: auto; }
  .split-lab__guide { border-right: 0; border-bottom: 1px solid var(--border-hairline); }
}
```

## JSX de referencia

```tsx
<AppShell
  area="Trabalhar"
  sessionLabel="Sessao auditada"
  onSearch={openCommandPalette}
>
  <SplitLabWorkspace
    guide={<MissionSteps current={step} onSelect={selectStep} />}
    bench={
      <ItsmConsole
        ticket={ticket}
        events={events}
        onAction={dispatchDeterministicAction}
      />
    }
  />
</AppShell>
```

```tsx
<TimelineReplay
  events={replay.events}
  criteria={replay.criteria}
  onSelectEvent={setSelectedEvent}
  comparison={{
    observed: replay.observed,
    recommended: replay.recommended
  }}
/>
<CredentialCard
  title="Analista N1"
  skills={credential.skills}
  signature={credential.signature}
  hash={credential.hash}
  onVerify={verifyCredential}
/>
```

## Estados obrigatorios

Cada componente novo deve cobrir:

- default
- hover
- focus visible
- active
- disabled
- loading
- empty
- error
- success

O componente nao deve usar texto de sucesso como substituto de estado persistido. O estado visual deve nascer do mesmo contrato que alimenta o replay.

## Plano de entrega

### Antes da banca

1. Iconografia SVG e tokens.
2. AppShell com rail e app bar.
3. Home com uma missao principal.
4. Split screen de turno.
5. Skeleton de cold start.
6. Replay com timeline e score strip.
7. Credencial com hash e verificacao.
8. Testes de acessibilidade e overflow.

### Pos hackathon

1. Course player integrado ao turno.
2. Command palette.
3. Bancada SVG de rede e hardware.
4. Editor visual de scripts e queries.
5. VideoCall simulada com criterios observaveis.
6. Galeria de microcredenciais por trilha.

## Integracao sem regressao

- Nao alterar os nomes de eventos do motor deterministico.
- Nao mover regras de avaliacao para componentes visuais.
- Usar adaptadores de view model para transformar eventos em linhas de tabela e timeline.
- Preservar textos usados por testes ate que os testes sejam migrados deliberadamente.
- Adicionar testes Vitest para estados de `MissionCard`, `ItsmConsole` e `TimelineReplay`.
- Adicionar Playwright para 375, 768, 1280 e 1440 px.
- Executar `axe-core` em home, aula, turno e replay.
- Verificar que nenhum viewport tenha overflow horizontal.

## Criterio de pronto

O redesign esta pronto quando um aluno novo consegue iniciar uma missao em menos de 30 segundos, entende o passo atual sem ler uma parede de texto, executa o turno sem perder contexto e chega ao replay com uma evidencia clara do que fez. Visualmente, nenhuma tela deve depender de emoji, gradiente decorativo, card repetido ou badge sem funcao.
