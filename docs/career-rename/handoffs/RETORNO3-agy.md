# Retorno AGY — Etapa 3 (Zerar vocabulário de voo)

## Arquivos e pastas alterados
- Pastas e arquivo renomeados com `git mv`:
  - `.kiro/specs/jornada-de-voo` -> `.kiro/specs/jornada-de-carreira`
  - `.kiro/specs/cenarios-por-escala` -> `.kiro/specs/cenarios-por-etapa`
  - `docs/CENARIOS_POR_ESCALA.md` -> `docs/CENARIOS_POR_ETAPA.md`
- `LICENSE`, `README.md`, `docs/design/DESIGN.md`, `docs/DEPLOY_E_VIDEO.md`, `docs/CENARIOS_POR_ETAPA.md`: atualização de marca (`IT Career Simulator`), referências de branch/spec (`jornada-de-carreira`, `cenarios-por-etapa`, `CENARIOS_POR_ETAPA.md`) e remoção de `Copiloto`.
- `docs/pitch/**` (`README.md`, `01_ENREDO.md`, `02_ROTEIRO_VIDEO_3MIN.md`, `03_ROTEIRO_FINAL.md`, `04_ROTEIRO_DEMONSTRACAO.md`, `05_PERGUNTAS_DA_BANCA.md`, `06_ROADMAP.md`): reescrita completa da narrativa e roteiros para carreira em TI (sem avião, voo, cabine, caixa-preta, brevê, hangar, comandante, check-in, piloto, embarque, decolar), mantendo fatos, prazos e URLs externas.
- `.kiro/specs/**`, `docs/auditoria-independente/**`, `docs/auditoria-produto/**`, `docs/auditoria-ui-ux/**`, `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md`: aplicação integral do glossário nos arquivos de texto (61 arquivos atualizados, sem tocar em binários `.png`).
- `src/frontend/e2e/**` (`aparencia.spec.ts`, `contraste.helper.ts`, `demonstracao.spec.ts`, `navegacao.spec.ts`, `visual.spec.ts`):
  - `CHAVE_MISSOES_ATIVAS = 'itfs_missoes_ativas'` e `missoes` em `navegacao.spec.ts`
  - `ROTEIRO_DIAGNOSTICO`, `DIAGNOSTICO_RAPIDO`, `origem: 'diagnostico-rapido'` em `demonstracao.spec.ts`
  - Seletores CSS atualizados em `contraste.helper.ts` (`.resposta-diagnostico-rapido`, `.etapa`, `.convite-mentor`, `.indicacao-diagnostico`, `.demonstracao-diagnostico`, `.cartao-perfil`, `.portfolio-analista`, `.registro-missao`, `.rota-catalogo`, `.papel-mentor`)
  - URL `/revisao/` em `aparencia.spec.ts` e variável `semMesa` em `visual.spec.ts`

## Comandos rodados e resultados
Executados em `D:/Projetos/Ativos/it-career-simulator/src/frontend` após a última edição:
- `npx.cmd tsc -b`: aprovado sem erros.
- `npm.cmd run lint`: 0 avisos, 0 erros em 216 arquivos; `check-regras-estilo.ts` aprovado.
- `npm.cmd test -- --run`: 67 arquivos aprovados, 584 testes aprovados.

## Sobras legítimas no escopo (verificadas via `git grep`)
- Itens externos autorizados no BRIEF-ETAPA3: `https://it-flight-simulator-hackbrasil.vercel.app` (domínio Vercel) e `it-flight-simulator-api` (`render.yaml` e docs de deploy), além do nome histórico de worktree `it-flight-simulator-hackbrasil-jornada` em registros de auditoria.
- Escala no sentido não-voo: `Escala base` (tipográfica em `docs/design/DESIGN.md`) e `escalas subjetivas` (em `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md`).
- Identificadores de código C# preservados em specs históricas (`ComandosPorEscala`, `CenariosPorEscala`, `EventoEscala`, `ResultadoComandoEscala` em `.kiro/specs/cenarios-por-etapa/design.md`).
- Arquivos fora de alteração conforme escopo: `docs/vetores-jcs-sha256.json`, `docs/career-rename/**`, `docs/layout-certsim/**` e imagens binárias `.png` em `docs/auditoria-ui-ux/kiro/evidencias/`.
- Nenhum commit ou push realizado.
