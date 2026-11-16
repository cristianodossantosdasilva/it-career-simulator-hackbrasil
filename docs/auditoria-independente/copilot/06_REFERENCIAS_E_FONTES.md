# Referencias e fontes

## Regulamento oficial consultado

- https://hackbrasil.com/
- https://hackbrasil.com/regulamento

Fatos usados: fase online de 4 a 30 de novembro de 2026, final em 12 de dezembro, times de 1 a 4, repositorio publico, demo funcionando, video de ate 3 minutos, quatro criterios de avaliacao com mesmo peso, nota minima de 20 em 40, congelamento do repositorio entre submissao e final, propriedade intelectual do time, proibicao de dados reais de terceiros e premios condicionados a regras dos parceiros.

## Legislacao e classificacao consultadas

- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- https://concla.ibge.gov.br/busca-online-cnae.html
- https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj/classificacao-nacional-de-atividades-economicas-2013-cnae

Essas fontes sustentam apenas riscos e pontos de verificacao. Nao foram usadas para emitir parecer individual ou fixar aliquotas municipais.

## Mercado e fornecedores

- https://tryhackme.com/resources/blog/cyber-security-training-subscriptions-compared-cost-features-roi-2026

Precos de concorrentes e fornecedores variam por pais, cambio, impostos, consumo e plano. A auditoria nao tratou pagina de terceiro como cotacao vinculante. As paginas de Alura, Udemy, Coursera, Rocketseat, Escola DNC, Vercel, Render, Neon, Cloudflare, Resend e WorkOS nao foram usadas como evidencia nesta rodada e devem ser cotadas antes de uma decisao comercial.

## Arquivos locais do projeto

- `AGENTS.md`
- `README.md`
- `docs/PRD_HACKATHON.md`
- `docs/ARQUITETURA_HACKATHON.md`
- `docs/CONTEXTO_HACK_BRASIL_2026.md`
- `docs/CRONOGRAMA_HACKATHON.md`
- `docs/DEPLOY_E_VIDEO.md`
- `docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`
- `docs/vetores-jcs-sha256.json`
- `render.yaml`
- `docker-compose.yml`
- `src/backend/src/Simulador.Api/Program.cs`
- `src/backend/src/Simulador.Infra/EventStore.cs`
- `src/backend/src/Simulador.Infra/PostgresEventStore.cs`
- `src/backend/src/Simulador.Avaliacao/Juiz360.cs`
- `src/backend/src/Simulador.Dialogo/ClienteDialogo.cs`
- `src/frontend/src/App.tsx`
- `src/frontend/src/index.css`
- `src/frontend/src/utils/jcs.ts`
- `src/frontend/vercel.json`

## Fontes operacionais locais

- Graphify existente em `graphify-out/graph.json` e `graphify-out/GRAPH_REPORT.md`. O grafo foi usado somente como mapa auxiliar porque registra commit anterior ao HEAD atual.
- Prototipo local consultado por `http://127.0.0.1:4180`, resposta HTTP 200, HTML com tema claro e fluxos interativos.
- Bases de conhecimento locais consultadas em modo inventario e leitura direcionada para taxonomias de incidentes. Foram usados apenas padroes tecnicos agregados. Nenhum dado pessoal, credencial, cliente ou registro individual foi reproduzido.

## DevLedger somente leitura

- Banco: `D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db`
- Consultas: `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, schema, `v_project_state_current`, `v_stage_current`, checkpoints, notes e `v_sovereign_rule_active`.
- Resultado relevante: integridade ok; nao ha estado corrente especifico para a raiz local deste repositorio; a entrada do precursor aponta para contexto historico distinto.

## CLIs consultadas

- `gh.exe`: autenticacao existente e repositorio atual publico na branch principal `main`.
- `vercel.cmd`: identidade autenticada observada.
- `render.exe`: instalado; ajuda exibida; selecao de organizacao interativa evitada.
- `neonctl.cmd`: chamada de inventario nao produziu saida utilizavel; nenhum estado foi inferido.
- `cloudflare.cmd`: ajuda exibida; nenhum recurso foi alterado ou inferido.

## Validacoes executadas

- `dotnet test src/backend/Simulador.slnx`: 66 aprovados.
- `npm.cmd test -- --run`: 24 aprovados.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado, incluindo verificacao de segredos do bundle.

