# Auditoria Independente Multi-IA — IT Career Simulator (Hack Brasil 2026)

Este diretório centraliza a revisão crítica, autônoma e independente conduzida por três agentes externos em paralelo (**Kiro CLI**, **Codex CLI** e **GitHub Copilot CLI**), avaliando desde o regulamento oficial do **Hack Brasil 2026** até o código-fonte, infraestrutura em nuvem, banco de dados, governança no DevLedger, matriz curricular, design UX, viabilidade financeira, contabilidade e conformidade jurídica.

## Estrutura de Pastas

| Pasta | Responsável | Conteúdo |
| :--- | :--- | :--- |
| [kiro/README.md](kiro/README.md) | **Kiro CLI** | `7` entregáveis concluídos (`01` a `06` + `04b_CUSTOS_E_TRIBUTOS.csv`, `62` itens) |
| [codex/README.md](codex/README.md) | **Codex CLI** | `6` entregáveis concluídos (`01` a `06`, `25` itens) |
| [copilot/README.md](copilot/README.md) | **GitHub Copilot CLI** | `6` entregáveis concluídos (`01` a `06`, `24` itens) |
| [consolidado/README.md](consolidado/README.md) | **Consolidação Conjunta** | [01_CONSOLIDADO_COMPARATIVO_3_IAS.md](consolidado/01_CONSOLIDADO_COMPARATIVO_3_IAS.md) e [02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv](consolidado/02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv) |

## Prompt Mestre Oficial e Chamadas Prontas com Acesso Total

- [PROMPT_AUDITORIA_INDEPENDENTE_MULTI_IA.md](PROMPT_AUDITORIA_INDEPENDENTE_MULTI_IA.md) — Prompt neutro e completo com todos os caminhos locais, bancos, CLIs, bases de conhecimento, regulamento, escopo das 7 frentes, regras de entrega e comandos prontos de execução com permissão total na Seção 6:
  - **Kiro CLI:** `Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; kiro-cli chat --trust-all-tools --trust-workspace "<PROMPT>"`
  - **Codex CLI:** `Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; codex.cmd -C "D:\Projetos\Ativos\it-career-simulator-hackbrasil" --dangerously-bypass-approvals-and-sandbox --search --add-dir "D:/" --add-dir "C:\Users\Black" "<PROMPT>"`
  - **GitHub Copilot CLI (interativo):** `Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; copilot.cmd --yolo --add-dir "D:/" --add-dir "C:\Users\Black" -i "<PROMPT>"`
  - **GitHub Copilot CLI (não interativo):** `Set-Location "D:\Projetos\Ativos\it-career-simulator-hackbrasil"; copilot.cmd --yolo --trust-folder --add-dir "D:/" --add-dir "C:\Users\Black" -p "<PROMPT>"`
