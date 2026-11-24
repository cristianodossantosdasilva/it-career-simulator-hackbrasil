# Retorno AGY — Três níveis e layout CertSim

## O que foi feito
- **Módulo de histórico unificado (`itfs_historico_v1`)**: criado `src/frontend/src/jornada/simulados/historico.ts` exportando `registrarHistorico()`, `lerHistorico()`, `analisarHistorico()` e tipos, criado primeiro e notificado via `regente notify`.
- **Tema claro CertSim como padrão**:
  - `src/frontend/src/tema/catalogo.ts` e `src/frontend/index.html`: padrão alterado para `corporativo` (`esquema: 'claro'`, sem classe `dark` inicial).
  - `src/frontend/src/index.css`: tokens do tema `corporativo` atualizados para o layout CertSim (`--bg-canvas: #F8FAFC`, `--bg-surface: #FFFFFF`, `--bg-elevated: #F3F4F6`, `--nav: #F3F4F6`, `--accent-primary: #2563EB`, `--accent-hover: #1D4ED8`, `--accent-surface: #EFF6FF`, `--radius-lg: 24px`, sombras sutis) e classes de layout `.certsim-*`, mantendo 100% de conformidade no `tokensContraste.test.ts` (WCAG AA).
- **Shell e menu lateral 240 px**:
  - `src/frontend/src/index.css`: sidebar desktop de `240px` com fundo `var(--nav)`, itens horizontais e rótulos de seção.
  - `src/frontend/src/jornada/catalogos/catalogoNavegacao.ts`, `src/frontend/src/educacao/BarraSuperior.tsx` e `src/frontend/src/ui/catalogoIcones.ts`: menu agrupado em `Estudo` (`Início`, `Carreira`, `Aprender`, `Praticar`, `Biblioteca`, `Reforço diário`), `Avaliar` (`Simulados`, `Provas`) e `Progresso` (`Painel`, `Histórico`, `Portfólio`, `Mentor`), preservando barra inferior com 4 principais + botão `Mais` abaixo de 768 px.
  - `src/frontend/src/jornada/navegacao/rotas.ts` e `renderizarPaginaJornada.tsx`: adição das 9 novas rotas mantendo as rotas antigas (`/plano-de-carreira`, `/mesa-de-trabalho/:missao`, `/revisao/:sessao`, `/catalogo`, `/diagnostico`) funcionando sem quebrar E2E.
- **Páginas novas e redesenhadas**:
  - `PaginaInicio.tsx`: boas-vindas, continuar missão em andamento, cartões dos três níveis (`Teórico`, `Prático`, `Lab`) e atalhos rápidos.
  - `PaginaCarreira.tsx`: resumo de etapas, histórico, diagnóstico e plano de estudo sugerido.
  - `ConfigurarSimulado.tsx`, `configSimulado.ts` e `PaginaSimulados.tsx`: configuração `Teórico` vs `Lab`, formato `Padrão` vs `Prática`, escopo `Completo` vs `Personalizado`, seletor de domínios/nível/quantidade, quadro `Pronto para começar?` com 5 regras e integração direta com `TelaProvaTeorica` e `Mesa de Trabalho`.
  - `PaginaProvas.tsx`: `Prova teórica` (40 questões, 60 min, 70%) e `Prova de Lab` (4 chamados, 40 min) com confirmação de regras.
  - `PaginaHistorico.tsx`: leitura de `itfs_historico_v1` e `registros` de Lab, KPIs e filtros (`Todos`, `Teórico`, `Lab`, `Aprovados`).
  - `PaginaPainel.tsx`: dashboard com média, taxa de aprovação, Labs concluídos, barras de desempenho por domínio e recomendação do domínio prioritário.
  - `PaginaReforco.tsx`: revisão espaçada dos domínios abaixo de 70% e critérios pendentes de Lab com marcação de revisado.
  - `PaginaAprender.tsx`, `PaginaPraticar.tsx` e `PaginaBiblioteca.tsx`: destinos completos para os itens do grupo `Estudo`.

## Arquivos alterados e criados
- `src/frontend/index.html`
- `src/frontend/src/index.css`
- `src/frontend/src/ui/catalogoIcones.ts`
- `src/frontend/src/tema/catalogo.ts`, `catalogo.test.ts`, `resolvedor.test.ts`, `documento.test.ts`
- `src/frontend/src/educacao/BarraSuperior.tsx`, `BarraSuperior.test.tsx`
- `src/frontend/src/jornada/catalogos/catalogoNavegacao.ts`, `catalogoNavegacao.test.ts`
- `src/frontend/src/jornada/navegacao/rotas.ts`, `rotas.test.ts`
- `src/frontend/src/jornada/simulados/historico.ts`, `historico.test.ts`, `configSimulado.ts`, `ConfigurarSimulado.tsx`
- `src/frontend/src/jornada/paginas/renderizarPaginaJornada.tsx`, `PaginaInicio.tsx`, `PaginaInicio.test.tsx`, `PaginaCarreira.tsx`, `PaginaSimulados.tsx`, `PaginaProvas.tsx`, `PaginaHistorico.tsx`, `PaginaPainel.tsx`, `PaginaReforco.tsx`, `PaginaAprender.tsx`, `PaginaPraticar.tsx`, `PaginaBiblioteca.tsx`, `PaginasCertSim.test.tsx`
- `src/frontend/src/App.test.tsx`, `src/frontend/src/workstation/EstadoInicial.test.tsx`

## Testes e validações executados (`src/frontend`)
- `npx.cmd tsc -b`: aprovado sem erros.
- `npm.cmd run lint`: 0 erros (`oxlint` em 238 arquivos e `check-regras-estilo.ts` aprovado).
- `npm.cmd test -- --run`: 70 arquivos aprovados, 598 testes aprovados (inclui `tokensContraste.test.ts`, `conformidade.test.ts` e `PaginasCertSim.test.tsx`).
- `npm.cmd run build`: `tsc -b`, `vite build` e `check-bundle-secrets.mjs` aprovados sem erros.

## Pendências
- Testes E2E (`playwright test`) e medição de contraste em navegador real (`e2e/contraste.spec.ts`) ficam para integração final com o backend rodando.
- Sem push realizado (`feat/tres-niveis` apenas com commit local).
