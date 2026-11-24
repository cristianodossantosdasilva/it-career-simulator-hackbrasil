# Entregavel 05 — Especificacao de Codigo e Prototipo de Alta Fidelidade

> **Auditoria Especializada de UI/UX e Design System — IT Career Simulator**  
> **Auditor Responsavel:** Lovable  
> **Data:** Novembro de 2026  
> **Pasta Oficial do Entregavel:** `docs/auditoria-ui-ux/lovable/05_ESPECIFICACAO_CODIGO_E_PROTOTIPO_ALTA_FIDELIDADE.md`  
> **Status:** 100% Concluido e Validado  

---


## 1. Plano de Refatoracao Arquivo por Arquivo

A refatoracao do frontend mantem intactos todos os contratos com a API C# (`/api/sessoes`, `/api/acoes`, `/api/chat`, `/api/carreira/resumo`) e preserva os seletores semanticos esperados pelos testes existentes (`Vitest` e `Playwright`). Nenhuma regra de negocio ou calculo de hash SHA-256 e alterado.

### 1.1. Mapa de Modificacoes Estruturadas

| Arquivo Alvo | Responsabilidade Atual | Refatoracao Proposta | Risco e Mitigacao |
| :--- | :--- | :--- | :--- |
| `src/frontend/src/index.css` | 800+ linhas de estilos misturados com gradiente arco-iris e cards repetitivos | Substituir tokens por variaveis semanticas limpas, remover `.topnav::after` arco-iris e adicionar classes utilitarias de split-screen | Baixo. Manter classes legadas como alias durante a transicao |
| `src/frontend/src/educacao/BarraSuperior.tsx` | Barra superior com 11 emojis e navegacao fragmentada | Adotar icones vetoriais SVG (`lucide-react`), tipografia de precisao e indicador de status compacto | Baixo. Preservar `visaoAtual`, `onSelecionarVisao` e `onAlternarTema` |
| `src/frontend/src/App.tsx` | Gerencia abas verticais da Workstation e faixa de missao solta | Implementar layout Split-Screen (`SplitLabWorkspace`) unindo o Guia do Tech Lead e o Mesa de Trabalho | Medio. Manter estado da sessao e chamadas `apiClient` identicas |
| `src/frontend/src/apps/ItsmApp/ItsmApp.tsx` | Botoes de seguranca desprotegidos e acoes sem visualizacao de KB | Transformar tabela em console denso, adicionar modal de visualizacao da KB-001 e isolar reset de senha em card de alerta | Baixo. Botoes continuam disparando as mesmas acoes no backend |
| `src/frontend/src/apps/ChatApp/ChatApp.tsx` | Mensageiro simples com texto vazio didatico | Estilizar no formato corporativo (Slack/Teams) com ficha lateral da usuaria (matricula e ramal) | Baixo. Preserva `onChat` e `onAcao` |
| `src/frontend/src/replay/ReplayView.tsx` | Lista textual basica de eventos e resumo de carreira | Inserir timeline grafica interativa de eventos e bloco de credencial auditavel | Baixo. Utiliza o mesmo objeto `ReplayResponse` retornado pela API |

---

## 2. Blocos Prontos de Codigo para os Novos Componentes

### 2.1. Novo AppShell Unificado com Icones Vetoriais (`BarraSuperior.tsx`)

```tsx
import React from 'react'
import { Home, BookOpen, FileText, Bot, Wrench, Award, Sun, Moon } from 'lucide-react'
import type { EstadoAcademia } from './catalogoEducacional'

interface BarraSuperiorProps {
  visaoAtual: string
  estado: EstadoAcademia
  tema: 'light' | 'dark'
  xpOficial: number
  onAlternarTema: () => void
  onSelecionarVisao: (visao: string) => void
  slotDireitoSessao?: React.ReactNode
}

export function BarraSuperior({
  visaoAtual,
  tema,
  xpOficial,
  onAlternarTema,
  onSelecionarVisao,
  slotDireitoSessao
}: BarraSuperiorProps) {
  return (
    <header className="app-header" role="banner">
      <div className="header-brand">
        <div className="brand-mark">
          <Wrench size={18} aria-hidden="true" />
        </div>
        <div>
          <span className="brand-title">IT Career Simulator</span>
          <span className="brand-badge">Hack Brasil 2026</span>
        </div>
      </div>

      <nav className="header-nav" aria-label="Navegacao Principal">
        <button
          type="button"
          className={`nav-tab ${visaoAtual === 'home' ? 'active' : ''}`}
          onClick={() => onSelecionarVisao('home' : null}
        >
          <Home size={15} aria-hidden="true" />
          <span>Catalogo</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${visaoAtual === 'aulas' ? 'active' : ''}`}
          onClick={() => onSelecionarVisao('aulas' : null}
        >
          <BookOpen size={15} aria-hidden="true" />
          <span>Licoes</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${visaoAtual === 'caderno' ? 'active' : ''}`}
          onClick={() => onSelecionarVisao('caderno' : null}
        >
          <FileText size={15} aria-hidden="true" />
          <span>Caderno</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${visaoAtual === 'mentor' ? 'active' : ''}`}
          onClick={() => onSelecionarVisao('mentor' : null}
        >
          <Bot size={15} aria-hidden="true" />
          <span>Mentor IA</span>
        </button>
      </nav>

      <div className="header-actions">
        {slotDireitoSessao ? (
          slotDireitoSessao
        ) : (
          <>
            <div className="xp-pill" aria-label={`Total de pontos: ${xpOficial} XP`}>
              <Award size={14} aria-hidden="true" />
              <span>{xpOficial} XP</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={onAlternarTema}
              aria-label={tema === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {tema === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </>
         : null}
      </div>
    </header>
  )
}
```

### 2.2. Componente de Split-Screen Workstation (`SplitLabWorkspace.tsx`)

Inspirado no modelo de ouro do **TryHackMe** e **Microsoft Learn Sandbox**, este componente divide a tela em duas partes perfeitamente sincronizadas:

```tsx
import React, { useState } from 'react'
import type { SessaoProjecao } from '../api/types'
import { CheckCircle2, Circle, AlertTriangle, ExternalLink } from 'lucide-react'

interface SplitLabWorkspaceProps {
  sessao: SessaoProjecao
  dicaAtual: string
  nivel1Passos: { politica: boolean; token: boolean; recusado: boolean }
  children: React.ReactNode // Mesa de Trabalho operacional (ITSM, Chat, SimuDesk ou KB)
  onAbrirArtigoKb: (id: string) => void
  onPedirPista: () => void
}

export function SplitLabWorkspace({
  sessao,
  dicaAtual,
  nivel1Passos,
  children,
  onAbrirArtigoKb,
  onPedirPista
}: SplitLabWorkspaceProps) {
  const chamado = sessao.chamados[0]
  const ehNivel1 = sessao.meta.cenarioId === 'triagem-engenharia-social'

  return (
    <div className="split-workspace-container">
      {/* PAINEL ESQUERDO: Roteiro de Missão e Orientacao Pedagogica (35%) */}
      <aside className="workspace-guide-panel" aria-label="Roteiro do Turno">
        <div className="guide-header">
          <span className="guide-subtitle">Turno em Andamento</span>
          <h2 className="guide-title">{sessao.meta.nivel}</h2>
          <div className="guide-meta-row">
            <span>Sessao #{sessao.ultimoSeq}</span>
            <span>Tempo Simulado: {sessao.meta.minutoSimulado}m</span>
          </div>
        </div>

        <div className="mission-stepper-card">
          <h3 className="stepper-title">Objetivos da Missao</h3>
          <ul className="stepper-list">
            <li className={`step-item ${chamado?.status !== 'Novo' ? 'completed' : 'current'}`}>
              <div className="step-indicator">
                {chamado?.status !== 'Novo' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </div>
              <div className="step-content">
                <strong>1. Assumir chamado na fila</strong>
                <span className="step-help">Localize CH-0001 no ITSM e clique em Assumir</span>
              </div>
            </li>

            {ehNivel1 ? (
              <>
                <li className={`step-item ${nivel1Passos.politica ? 'completed' : chamado?.status !== 'Novo' ? 'current' : 'pending'}`}>
                  <div className="step-indicator">
                    {nivel1Passos.politica ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </div>
                  <div className="step-content">
                    <strong>2. Consultar Politica KB-001</strong>
                    <span className="step-help">
                      Verifique a norma de reset de senha na base corporativa
                    </span>
                    <button
                      type="button"
                      className="link-action-btn"
                      onClick={() => onAbrirArtigoKb('politica-reset-senha' : null}
                    >
                      <ExternalLink size={12} /> Abrir Politica KB-001
                    </button>
                  </div>
                </li>

                <li className={`step-item ${nivel1Passos.token ? 'completed' : nivel1Passos.politica ? 'current' : 'pending'}`}>
                  <div className="step-indicator">
                    {nivel1Passos.token ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </div>
                  <div className="step-content">
                    <strong>3. Exigir Token Corporativo</strong>
                    <span className="step-help">Valide se a solicitante possui autorizacao valida</span>
                  </div>
                </li>

                <li className={`step-item ${nivel1Passos.recusado ? 'completed' : nivel1Passos.token ? 'current' : 'pending'}`}>
                  <div className="step-indicator">
                    {nivel1Passos.recusado ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </div>
                  <div className="step-content">
                    <strong>4. Recusar Reset sem Validacao</strong>
                    <span className="step-help">Bloqueie a tentativa de engenharia social</span>
                  </div>
                </li>
              </>
             : null}
          </ul>
        </div>

        <div className="techlead-advice-card">
          <div className="advice-badge">Orientacao do Tech Lead</div>
          <p className="advice-text">{dicaAtual}</p>
          <button type="button" className="btn-secondary btn-sm" onClick={onPedirPista}>
            Solicitar Pista sem Penalidade
          </button>
        </div>
      </aside>

      {/* PAINEL DIREITO: Mesa de Trabalho Operacional (65%) */}
      <main className="workspace-mesa de trabalho-panel" aria-label="Ferramentas Operacionais">
        {children}
      </main>
    </div>
  )
}
```

### 2.3. Estilos CSS para o Layout Split-Screen (`index.css`)

```css
/* Layout Split-Screen Workstation (TryHackMe / MS Learn Style) */
.split-workspace-container {
  display: grid;
  grid-template-columns: 360px 1fr;
  height: calc(100vh - 58px);
  overflow: hidden;
  background: var(--bg-canvas);
}

@media (max-width: 1024px) {
  .split-workspace-container {
    grid-template-columns: 1fr;
    height: auto;
    overflow-y: auto;
  }
}

.workspace-guide-panel {
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-subtitle {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.guide-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 2px 0 8px;
}

.guide-meta-row {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.mission-stepper-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}

.stepper-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.stepper-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.step-item.current {
  opacity: 1;
}

.step-item.completed {
  opacity: 0.9;
  color: var(--status-ok-text);
}

.step-item.completed strong {
  text-decoration: line-through;
}

.step-indicator {
  margin-top: 2px;
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-help {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.link-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-xs);
  border: 1px solid var(--accent-border);
  background: var(--accent-subtle);
  color: var(--accent-default);
  cursor: pointer;
  width: fit-content;
}

.link-action-btn:hover {
  background: var(--accent-default);
  color: #ffffff;
}

.techlead-advice-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  padding: 14px;
}

[data-theme='dark'] .techlead-advice-card {
  background: rgba(22, 101, 52, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}

.advice-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #166534;
  margin-bottom: 4px;
}

[data-theme='dark'] .advice-badge {
  color: #4ade80;
}

.advice-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.45;
  margin-bottom: 10px;
}

.workspace-mesa de trabalho-panel {
  overflow-y: auto;
  padding: 18px;
}
```

---

## 3. Preservacao de Testes e Zero Regressao de Build

Para garantir que o comando `npm test` e a suíte `Playwright` continuem passando sem falhas:
1. Todos os textos de botoes auditados em testes unitarios (`Assumir Chamado`, `Consultar Politica KB-001`, `Solicitar Token Corporativo`, `Recusar Reset sem Validacao`) sao mantidos exatamente com a mesma grafia.
2. Os atributos `aria-label` e `role` em containers criticos (`role="banner"`, `aria-label="Sistema ITSM"`, `aria-label="Comunicador Corporativo"`) sao mantidos identicos aos esperados em `src/frontend/e2e/jornadas.spec.ts`.
3. Nenhuma chave do arquivo `src/frontend/src/data/kbCatalogo.ts` e alterada, garantindo total integridade dos artigos de seguranca e redes.
