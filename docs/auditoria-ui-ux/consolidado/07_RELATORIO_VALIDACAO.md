# 07 Relatório de validação

Etapa 9 (rodada 3), executada na sessão de fechamento (etapa 10) por autorização explícita do usuário, em 2026-11-16. Branch `redesign-ui-ux`, base HEAD `3576792`, mais a correção de F5 ainda sem commit (`Program.cs` e `playwright.config.ts`).

**Veredito: APROVADO.** Lint, testes, build, backend e Playwright passaram, com 27 de 27 no Playwright. F5 não reapareceu depois da correção do limitador no ambiente de teste.

## Correção de F5 (decisão A do usuário)

- `src/backend/src/Simulador.Api/Program.cs`: o limite do limitador global passa a vir da configuração `RateLimit:PermitLimit`, com padrão 120 por minuto por IP. Valor menor ou igual a zero volta para 120. O comportamento em produção e o contrato da API não mudam.
- `src/frontend/playwright.config.ts`: o servidor de backend do E2E define `RateLimit__PermitLimit=5000`. Um backend já ativo na porta 8080 ignora essa variável. As portas 8080 e 5173 estavam livres antes da rodada.

## Estado do Git

Branch `redesign-ui-ux`. Entradas fora do escopo da etapa 10, que não entram no commit:

- `README.md` (modificado)
- `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md` (modificado)
- `docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md` (não rastreado)
- `docs/consultor-vocacional/` (não rastreado)

A origem delas não está registrada no plano.

## Portões

| Portão | Comando | Status | Contagem e evidência |
|---|---|---|---|
| Lint | `npm.cmd run lint` em `src/frontend` | Aprovado | Exit 0, sem diagnósticos. |
| Testes | `npm.cmd test -- --run` | Aprovado | 58 de 58 testes. |
| Build do frontend | `npm.cmd run build` | Aprovado | Exit 0. JS 419,25 kB, CSS 70,69 kB. Verificação de segredos: 14 arquivos sem padrão de chave. |
| Backend | `dotnet build src/backend/src/Simulador.Api` | Aprovado | 0 avisos, 0 erros, 40,9 s. |
| Playwright (5 projetos) | `npx.cmd playwright test` | Aprovado | 27 de 27 aprovados em 1,8 min, sem repetição. |
| Caractere E comercial em `docs` (md, csv, html) | busca pelo caractere gerado por `[char]38` | Aprovado | 0 ocorrências. |
| Caractere E comercial em `src/frontend/src` (sem testes) | busca, incluindo a forma de entidade | Aprovado | 0 ocorrências fora do operador lógico duplo. |
| Forma passada de sair em `docs` e `src` | `\bsa[ií]u\b`, `\bsa[ií]ram\b`, `\bsa[ií]mos\b`, `\bsaído\b`, `\bsaí\b` | Aprovado | 0 ocorrências. |
| Emojis em `src/frontend/src` | busca por faixas Unicode | Aprovado com nota | 3 ocorrências, todas em `educacao/EstudoViews.test.tsx` (linhas 38, 39 e 46), entradas do teste de migração de ícones. Nenhuma é renderizada. |
| Estilo inline (`style={{`) | busca por arquivo | Aprovado com nota | 4 ocorrências de largura dinâmica: `SimuDeskApp.tsx:132`, `AulasView.tsx:154`, `MentorView.tsx:371` e `SlaMeter.tsx:51`. |
| Screenshots | `src/frontend/test-results/visual` | Aprovado | 80 PNG: 20 por projeto (mobile-375, tablet-768, desktop-1280 e desktop-1440). A pasta está no `.gitignore`. |
| Rolagem horizontal em 375 px | `jornadas.spec.ts` (W10) e `visual.spec.ts` | Aprovado | Passou nos 4 testes visuais de 375 px e no W10. |

## Achados

1. **Resolvido (F5).** Causa: limite fixo de 120 req/min por IP com todo o E2E em 127.0.0.1. A rodada completa passou depois da correção. A causa foi inferida na rodada 2 e a aprovação da rodada 3 é consistente com ela.
2. **Resolvido.** Os screenshots foram regenerados pela suíte completa (80 PNG). A inspeção visual dos 20 PNG de 375 px já tinha sido feita na etapa 8. Os PNG de tablet e desktop desta rodada não foram inspecionados visualmente.
3. **Aberto, fora do plano.** Quatro entradas no `git status` sem relação com a etapa 10 (ver Estado do Git). Ficam fora do commit.
4. **Aceito.** 3 emojis em arquivo de teste e 4 `style={{` de largura dinâmica.

## Histórico

- **Rodada 1 (etapa 7): reprovada.** Playwright com 15 de 27 aprovados. F1 botão "Solicitar token corporativo" ausente no ITSM, F2 overflow em 375 px ao abrir o CH-0001, F3 seletor "LOCK" obsoleto e F4 seletores de replay desatualizados.
- **Etapa 8: correções aplicadas.** F1 a F4 corrigidos e defeitos visuais corrigidos após a inspeção de 20 PNG.
- **Rodada 2 (etapa 9): reprovada.** Playwright com 26 de 27 aprovados. Única falha: F5, HTTP 429 do limitador no visual corporate de 375 px.
- **Rodada 3 (etapa 9, nesta sessão): aprovada.** Correção de F5 pela decisão A. Playwright com 27 de 27 aprovados.
