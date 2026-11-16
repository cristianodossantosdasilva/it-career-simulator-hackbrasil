# Auditoria de codigo, arquitetura e infraestrutura

## Evidencia de execucao

- `dotnet test src/backend/Simulador.slnx`: 66 aprovados, 0 falhas.
- `npm.cmd test -- --run`: 24 aprovados em 7 arquivos.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: TypeScript, Vite e verificacao de segredos aprovados.
- O prototipo local respondeu HTTP 200 em `127.0.0.1:4180`.
- `gh.exe` esta autenticado e o repositorio atual foi observado como publico, branch principal `main`.
- Vercel esta autenticado.
- Render esta instalado, mas o comando de recursos abriu selecao interativa de organizacao; nenhum recurso foi alterado.
- Neon nao forneceu inventario legivel na chamada usada. Nao inferir projeto ou banco.
- Cloudflare respondeu somente ajuda da CLI na chamada usada. Nao inferir zona ou recurso.

## Achados por arquivo

### Backend

- `src/backend/src/Simulador.Api/Program.cs:184-333,336-414`: as rotas de sessao, avaliacao, replay e resumo de carreira nao possuem autenticacao ou autorizacao. O resumo aceita IDs arbitrarios fornecidos pelo cliente, limitado a 20. Em uma demo anonima isso deve ser documentado como modelo de ameaca; em produto comercial exige vinculo de propriedade.
- `src/backend/src/Simulador.Api/Program.cs:36-45`: CORS usa lista explicita e permite qualquer cabecalho e metodo para as origens configuradas. Revisar origem de producao, proxy e politica por rota.
- `Program.cs:79-96`: rate limit global por IP com 120 requisicoes por minuto. Health fica fora do limite. Adicionar confianca em proxy, limites por operacao e metricas.
- `Program.cs:107-110`: excecao global, CORS e rate limit estao ligados. Confirmar que logs de erro nao vazam payload ou identificador sensivel.
- `Program.cs:198-225`: a rota de acao consulta eventos antes de anexar. A transacao do Postgres protege concorrencia, mas a leitura e o calculo podem ser repetidos sob disputa.
- `Program.cs:231-264`: chat aceita 500 caracteres, mas nao possui limite semantico por usuario. Rate limit global nao substitui controle de custo se dialogo real for ativado.
- `Simulador.Infra/EventStore.cs:25-70`: store em memoria tem locks por sessao e copia eventos na leitura, mas nao poda por TTL. Correto para Development, inadequado como persistencia.
- `Simulador.Infra/schema.sql:1-25`: existe indice de expiracao, mas nao ha rotina observada de expurgo. O banco pode acumular sessoes anonimas indefinidamente.
- `Simulador.Infra/PostgresEventStore.cs:54-78`: schema e inicializado no startup com retry. Em varias instancias, usar migracoes versionadas ou lock.
- `PostgresEventStore.cs:178-222`: `FOR UPDATE` e transacao protegem append concorrente. `novosEventos[^1]` pressupoe lista nao vazia. Tornar o contrato explicito.
- `Simulador.Avaliacao/Juiz360.cs:395-430`: hash da trilha e deterministico e reproduzivel, mas e hash publico, nao assinatura.
- `Simulador.Avaliacao/Juiz360.cs:410-438`: ordenacao de chaves e feita, mas a conformidade completa com RFC 8785 deve cobrir numeros, Unicode e casos extremos.
- `Simulador.Dialogo/ClienteDialogo.cs:126-140`: a implementacao e fallback roteirizado e ignora API key, flag e HttpClient. Isso e bom para determinismo, mas limita a alegacao de IA ativa.

### Frontend

- `src/frontend/src/utils/jcs.ts:1-26`: canonicalizacao manual ordena chaves e remove undefined. A serializacao de numeros e strings depende do runtime JavaScript.
- `jcs.ts:35-79`: verificador aceita JSON fornecido pelo usuario e compara hash local. Nao autentica emissor.
- `src/frontend/src/App.tsx:1-120`: a workstation orienta cenarios e integra cinco abas, mas o fluxo exige vocabulario tecnico e a camada de estudos descrita no PRD nao aparece nessa raiz.
- `src/frontend/src/index.css:1-18`: tema global e escuro. A promessa de tema claro educacional ainda nao corresponde ao estado atual.
- `src/frontend/src/apps`: semantica, foco e `aria-live` sao bons sinais. Os testes axe cobrem componentes, nao equivalem a auditoria de usabilidade real em todos os tamanhos.
- `src/frontend/vercel.json:1-8`: rewrite simples para `index.html`; nao configura headers de seguranca, cache, CSP ou politica de origem.

### Infraestrutura

- `render.yaml:1-17`: servico free, Postgres por variavel secreta e CORS por variavel. Falta evidência de deployment, dominio, alerta e teste de cold start.
- `docker-compose.yml:1-39`: senha de desenvolvimento padrao e backend dependente de healthcheck. Adequado para local, proibido como segredo ou receita de producao.
- `src/backend/src/Simulador.Api/appsettings.json:1-9`: nao ha configuracao de producao versionada, o que evita segredo, mas exige checklist de ambiente.

## DevLedger e Git

O Git local observado esta na branch `main`, HEAD `e6aae5c`, com alteracoes em varios documentos e a pasta de auditoria nao versionada. O estado atual do DevLedger nao possui uma entrada especifica para a raiz local do repositorio. A entrada `simulador-carreira-ti` aponta para a raiz do DevLedger e registra um precursor privado em concepcao. Portanto, o ledger nao confirma estado, deploy ou limpeza do repositorio atual.

O banco DevLedger passou em `PRAGMA integrity_check` e nao houve retorno de violacao em `PRAGMA foreign_key_check`. A consulta de estagios e checkpoints foi feita somente leitura. Handoffs foram tratados como contexto historico, nao como prova atual.

## Ordem tecnica recomendada

1. Fechar escopo e demo publica antes de novas telas.
2. Validar smoke test no ambiente publicado e registrar URL, commit e health.
3. Documentar o modelo anonimo atual e, antes de dados comerciais, adicionar autenticacao e autorizacao.
4. Fortalecer canonicalizacao e autenticidade do Curriculo Vivo.
5. Criar migracoes, expurgo e observabilidade de producao.
6. Adicionar TTL, limites e politicas de custo.
7. So depois construir a camada educacional persistente.

