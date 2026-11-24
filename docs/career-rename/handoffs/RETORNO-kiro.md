# RETORNO kiro: renomeacao de voo para carreira (src/frontend/src/**)

## O que foi feito
- Script `docs/career-rename/renomear-frontend.mjs` (conteudo + `git mv`) aplicou o glossario do BRIEF em todo src/frontend/src; depois `concordancia.cjs` corrigiu genero de textos (missoes registradas, A Primeira Missao etc.). `varredura-genero.cjs` e a varredura usada.
- URLs: /plano-de-carreira, /mesa-de-trabalho/:missao, /revisao/:sessao, /catalogo, /mentor, /portfolio, /diagnostico. Ids de pagina em rotas.ts acompanham.
- Pastas: jornada/cabine -> mesa, jornada/checkin -> diagnostico, jornada/comandante -> mentor. Arquivos renomeados com git mv (ex.: PaginaCabine -> PaginaMesa, PaginaCaixaPreta -> PaginaRevisao, PaginaHangar -> PaginaCatalogo, PaginaBreve -> PaginaPortfolio, PaginaPlanoDeVoo -> PaginaPlanoDeCarreira, PaginaCheckIn -> PaginaDiagnostico, PaginaComandante -> PaginaMentor, cartaoEmbarque -> cartaoPerfil, voosAtivos -> missoesAtivas, registrosVoo -> registrosMissao, PrimeiroVoo -> PrimeiraMissao, ListaEscalas -> ListaEtapas).
- Icone `embarcar` -> `iniciar`; classes CSS e ids de DOM renomeados junto (index.css e mesa.css).
- Conflito de nome: `responderComandante` virou `responderComoMentor` (ja existia `responderMentor` em educacao/catalogoEducacional).

## Comandos (src/frontend)
- `npx tsc -b`: sem erros. `npm run lint`: 0 erros, regras de estilo OK. `npm test -- --run`: 67 arquivos, 584 testes passam. `npm run build`: OK, sem segredos.

## Sobras preservadas de proposito (git grep)
- Chaves de localStorage: `itfs_voos_ativos`, `itfs_registros_voo`, `itfs_modo_cabine`, `itfs_cabine_revisar:` (a ultima e a anterior foram criadas na etapa Cabine/CertSim; seguem a regra itfs_* intocavel).
- Campos persistidos no JSON: `primeiraEscalaId` (cartao) e `escalaId` (registro de missao e exigencia do portfolio, mesmo nome por simetria nos tipos).
- Valores persistidos: origem `'checkin'` e `'checkin-rapido'`, versaoRoteiro `checkin-v1`/`checkin-v2`.
- Verbo "escalar" (escalonar chamado/pool) em ChatApp, SimuDeskApp e catalogoRotas: e vocabulario de ITSM, nao de voo.
- `CONVITE_COPILOTO`, componente `ConviteCopiloto` e papel `copiloto` do Mentor: fora do glossario do BRIEF.

## Pendencias / atencao
- Nada alterado em src/backend, docs/auditoria*, vetores. Sem commit.
- Textos antigos "Mentor no papel Mentor" (catalogoMentor) ficaram repetitivos; vale revisar o copy.
- Os 3 scripts em docs/career-rename/*.mjs|cjs sao descartaveis.
- Fora do meu escopo e a ajustar pelo AGY: e2e/** e docs que citem as URLs antigas.