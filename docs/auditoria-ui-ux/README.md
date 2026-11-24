# Auditoria Independente Multi-IA de UI, UX, Design System e Produto (Anti-"Cara de IA")

Esta pasta centraliza a auditoria visual, ergonomica e de arquitetura de produto do **IT Career Simulator** realizada de forma independente pelos tres agentes CLI (**Kiro CLI**, **Codex CLI** e **GitHub Copilot CLI**), atuando como especialistas em UI, UX, Design System e Produto EdTech/SaaS.

## Objetivo

1. Diagnosticar por que a interface atual ainda parece gerada por IA ("cara de IA" ou *AI-slop*) em comparacao a produtos de referencia de mercado.
2. Aplicar as skills oficiais de Design/UI/UX instaladas localmente (`frontend-design` / Claude Design, `product-design`, `agency-agents/ui-designer` e `mobbin`).
3. Fazer *benchmarking* estrutural contra **AWS Skill Builder / Cloudscape**, **Microsoft Learn (Sandbox)**, **Udemy**, **TryHackMe / Hack The Box**, **Linear**, **Vercel** e **Stripe**.
4. Especificar melhorias visuais, fluxos, novos componentes interativos e tokens CSS/React prontos para transformar a aplicacao em um produto comercial flagship antes e depois do Hack Brasil 2026 (`30/nov/2026`).

## Estrutura

- [`PROMPT_AUDITORIA_UI_UX_MULTI_IA.md`](./PROMPT_AUDITORIA_UI_UX_MULTI_IA.md): Prompt mestre de auditoria e chamadas CLI prontas.
- [`kiro/`](./kiro/README.md): Entregaveis da auditoria realizada pelo **Kiro CLI**.
- [`codex/`](./codex/README.md): Entregaveis da auditoria realizada pelo **Codex CLI**.
- [`copilot/`](./copilot/README.md): Entregaveis da auditoria realizada pelo **GitHub Copilot CLI**.
- [`consolidado/`](./consolidado/README.md): Sintese cruzada, decisoes escolhidas e plano de implementacao unificado.

## Regra de Isolamento

Os tres agentes auditam em modo **100% somente leitura** sobre `src/`, banco de dados e infraestrutura, gravando exclusivamente em sua respectiva subpasta.
