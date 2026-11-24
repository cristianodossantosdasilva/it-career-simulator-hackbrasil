# Retorno AGY — Renomeação IT Career Simulator

## Arquivos alterados (dentro do escopo atribuído)
- `README.md`: atualização de textos, narrativa de carreira (sem analogia de voo) e tabela de rotas (`/diagnostico`, `/plano-de-carreira`, `/mesa-de-trabalho/:missao`, `/revisao/:sessao`, `/portfolio`, `/catalogo`, `/mentor`).
- `docs/ARQUITETURA_HACKATHON.md`: substituição de `Caixa-Preta` por `Revisão`.
- `docs/CRONOGRAMA_HACKATHON.md`: substituição de `Caixa-Preta` por `Revisão`.
- `docs/DEPLOY_E_VIDEO.md`: atualização das rotas (`/diagnostico`, `/plano-de-carreira`, `/mesa-de-trabalho/:missao`, `/revisao/:sessao`, `/portfolio`, `/catalogo`, `/mentor`), termos (`Revisão`, `Confirmar e iniciar`) e concordância de gênero (`missão concluída`).
- `docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`: substituição de `Caixa-Preta` por `Revisão`.
- `docs/PRD_HACKATHON.md`: substituição de `Caixa-Preta` por `Revisão`.
- `src/frontend/e2e/aparencia.spec.ts`, `contraste.spec.ts`, `demonstracao.spec.ts`, `jornadas.spec.ts`, `navegacao.spec.ts`, `visual.spec.ts`: atualização das URLs, títulos de página (`Revisão`), botões (`Iniciar`, `Confirmar e iniciar`), nomes de capturas (`plano-de-carreira`, `mesa-de-trabalho-*`, `revisao`, `portfolio-com-missao`), e alinhamento dos imports com os módulos renomeados em `src/jornada/armazenamento/` (`cartaoPerfil`, `registrosMissao`, `CHAVE_CARTAO_PERFIL`, `CHAVE_REGISTROS_MISSAO`, `origem: 'plano-de-carreira'`, `mesa-de-trabalho`).

## Comandos rodados e resultados
Executados em `D:/Projetos/Ativos/it-career-simulator/src/frontend` após a edição final:
- `npx.cmd tsc -b`: aprovado sem erros.
- `npm.cmd run lint`: 0 avisos, 0 erros em 216 arquivos; `check-regras-estilo.ts` aprovado.
- `npm.cmd test -- --run`: 67 arquivos aprovados, 584 testes aprovados.

## Sobras preservadas no escopo (verificadas via `git grep`)
- `README.md:124`, `docs/CENARIOS_POR_ESCALA.md:3,5`, `docs/DEPLOY_E_VIDEO.md:94`: referências históricas a nomes de branch/spec (`jornada-de-voo`, `cenarios-por-escala`).
- `render.yaml:3`: `name: it-flight-simulator-api` (identificador do serviço Render).
- `docs/CRONOGRAMA_HACKATHON.md:3`, `docs/DEPLOY_E_VIDEO.md:81`, `docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md:424`, `README.md:7`: URL de produção já publicada (`https://it-flight-simulator-hackbrasil.vercel.app`).
- `src/frontend/e2e/contraste.helper.ts:351`: seletores de classes CSS de `index.css` (`.escala`, `.cartao-embarque`, `.breve-piloto`, `.registro-voo`, `.rota-hangar`, `.papel-comandante`).
- `src/frontend/e2e/navegacao.spec.ts:5,8,255-256`: chave de `localStorage` preservada (`itfs_voos_ativos`, `CHAVE_VOOS_ATIVOS`, propriedade `voos`) conforme regra do BRIEF.
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `src/frontend/index.html`, `src/frontend/package.json`, `docker-compose.yml`: conferidos e já limpos.
- Nenhum commit ou push realizado.
