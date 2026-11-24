# Retorno AGY — Layout inspirado no CertSim

## Arquivos alterados e criados (dentro do escopo atribuído)
- `src/frontend/src/jornada/checkin/configuracaoVoo.ts` (novo): definição de `MODOS_VOO` (Treino vs Missão), `REGRAS_PRONTO_PARA_COMECAR` (5 regras), `calcularDominiosDaRota` (pesos por domínio somando 100% e recomendação do primeiro domínio incompleto) e persistência em `itfs_modo_cabine`.
- `src/frontend/src/jornada/checkin/configuracaoVoo.test.ts` (novo): testes unitários dos modos, 5 regras e cálculo de pesos e recomendação.
- `src/frontend/src/jornada/checkin/ConfiguracaoModoVoo.tsx` (novo): componente reutilizável com cartões de modo (`Treino` vs `Missão` com `aria-pressed`), seletor de domínios com peso e selo `Recomendado`, e quadro `Pronto para começar?` com as 5 regras.
- `src/frontend/src/jornada/paginas/PaginaInicio.tsx` e `PaginaInicio.test.tsx`: adição da seção `Continuar missão` (lendo `voosAtivos.ultimaMissao` ou estado do cartão) e `Atalhos rápidos` para Plano de voo (ou Check-in), Aulas, Brevê, Caderno de estudos e Comandante.
- `src/frontend/src/jornada/paginas/PaginaPlanoDeVoo.tsx` e `PaginaPlanoDeVoo.test.tsx`: integração de `ConfiguracaoModoVoo` com alternância Treino vs Missão persistida em `itfs_modo_cabine`, filtro de escalas por domínio com peso e botão de início no modo selecionado.
- `src/frontend/src/jornada/paginas/PaginaCheckIn.tsx` e `PaginaCheckIn.test.tsx`: exibição de `ConfiguracaoModoVoo` após a emissão do cartão de embarque na fase final.
- `src/frontend/src/jornada/paginas/PaginaCaixaPreta.tsx` e `PaginaCaixaPreta.test.tsx`: adição de `ResultadoMissao` com percentual grande, status de aprovação (70%+ sem incidente), XP, desempenho por competência (`<progress>`), listas de pontos fortes e áreas a melhorar, revisão critério a critério expansível (`<details>`) com acesso à base de conhecimento, e botões `Refazer a missão`, `Nova missão` e `Ver o Brevê`.

## Comandos rodados e resultado
Todos executados em `D:/Projetos/Ativos/it-flight-simulator-hackbrasil-certsim/src/frontend` após a edição final:
- `npm.cmd run lint`: 0 avisos, 0 erros em 216 arquivos; `check-regras-estilo.ts` aprovado.
- `npm.cmd test -- --run`: 67 arquivos de teste aprovados, 584 testes aprovados (inclui `conformidade.test.ts`).
- `npm.cmd run build`: `tsc -b`, `vite build` e `check-bundle-secrets.mjs` aprovados sem erros.

## Pendências e observações para integração
- Nenhum arquivo fora do escopo (`index.css`, `AppShell.tsx`, `cabine/**`, `navegacao/**`) foi alterado.
- As novas classes de layout (`grade-atalhos-inicio`, `grade-modos-voo`, `cartao-modo-voo`, `cartao-modo-voo-ativo`, `seletor-dominios`, `grade-chips-dominios`, `chip-dominio`, `chip-dominio-ativo`, `quadro-pronto-comecar`, `lista-regras-voo`, `resultado-cabecalho`, `resultado-placar`, `resultado-percentual`, `resultado-competencias`, `lista-competencias`, `item-competencia`, `item-competencia-topo`, `grade-fortes-fracos`, `resultado-revisao`, `lista-revisao-criterios`, `revisao-criterio-resumo`, `revisao-criterio-corpo`) usam tokens e componentes já existentes em `index.css`; caso queira refinar espaçamentos ou bordas visuais dessas classes no Figma/CSS global, podem ser estilizadas em `src/frontend/src/index.css`.
- Nenhum commit ou push realizado.
