# Referências e fontes da auditoria

Data de consulta: 15/11/2026. Prioridade a páginas oficiais. Preços devem ser reconferidos antes de contratar.

## Hack Brasil 2026

- Site, trilhas, calendário, submissão e parceiros: https://www.hackbrasil.com/
- Regulamento, marcado como atualizado em 09/11/2026: https://www.hackbrasil.com/regulamento
- Regras confirmadas: equipes de 1 a 4; uma submissão por time; trilha Acesso à educação; repo público novo após 04/11 às 21h e commits posteriores; código privado anterior não pode ser copiado; patrocinadores não são obrigatórios; repo, demo e vídeo acessível sem login de até 3 min; prazo 30/11 às 23h59 BRT; quatro critérios iguais e mínimo 20/40; finalistas anunciados 02/12; presença confirmada até 04/12; código congelado após submissão; final em 12/12.
- Repo observado por CLI: https://github.com/cristianodossantosdasilva/it-flight-simulator-hackbrasil

## Legislação e fontes públicas

- LDB: https://www.planalto.gov.br/ccivil_03/leis/l9394.htm
- Decreto 5.154/2004: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/decreto/d5154.htm
- Resolução CNE/CP 1/2021: https://portal.mec.gov.br/dmdocuments/rcp001_21.pdf
- Simples Nacional, LC 123: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm
- ISS e lista de serviços, LC 116: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm
- IBS/CBS, LC 214: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm
- Normas CGSN sobre reforma: https://www8.receita.fazenda.gov.br/simplesnacional/noticias/noticiacompleta.aspx?id=E595D010-1E04-4C3B-95D9-185FC58594B5
- NFS-e e leiaute IBS/CBS: https://www.gov.br/nfse/pt-br/noticias/publicada-a-nota-tecnica-009-da-nfse
- CNAE 2.0, CONCLA IBGE: https://concla.ibge.gov.br/images/concla/documentacao/EstruturaDetalhadaCNAE_CNAEFiscal2_Atualizada.pdf
- Código de Defesa do Consumidor: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Comércio eletrônico, Decreto 7.962: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Orientação ANPD sobre menores: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes
- ECA Digital, Lei 15.211: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm
- ANPD sobre ECA Digital: https://www.gov.br/anpd/pt-br/assuntos/eca-digital
- Propriedade industrial, Lei 9.279: https://www.planalto.gov.br/ccivil_03/leis/l9279.htm
- Software, Lei 9.609: https://www.planalto.gov.br/ccivil_03/leis/l9609.htm
- Direitos autorais, Lei 9.610: https://www.planalto.gov.br/ccivil_03/leis/l9610.htm

## Preços e documentação de fornecedores

- Alura Empresas: https://www.alura.com.br/empresas/planos
- Planos Alura B2C: https://suporte.alura.com.br/quais-s%C3%A3o-os-planos-dispon%C3%ADveis
- Udemy Individual: https://www.udemy.com/pt/personal-plan/`r`n- Coursera Plus: https://www.coursera.org/courseraplus`r`n- Escola DNC, DNC Hub: https://escoladnc.com.br/`r`n- Rocketseat One: https://www.rocketseat.com.br/assinatura`r`n- Senac MS, Assistente de Suporte de TI: https://dev.ms.senac.br/Curso/Detalhe/126541
- TryHackMe: https://tryhackme.com/pricing
- Hack The Box Academy: https://academy.hackthebox.com/faq
- OpenAI API: https://developers.openai.com/api/docs/pricing
- OpenAI voz e Realtime: https://developers.openai.com/api/docs/guides/voice-latency-cost
- Render preços: https://render.com/pricing
- Render Free: https://render.com/docs/free
- Neon planos: https://neon.com/docs/introduction/plans
- Vercel preços: https://vercel.com/pricing
- Cloudflare planos: https://www.cloudflare.com/plans/

## Arquivos, bases e comandos locais

- `AGENTS.md`, prompt de auditoria integral, `README.md`, `docs/CONTEXTO_HACK_BRASIL_2026.md`, `docs/PRD_HACKATHON.md`, `docs/ARQUITETURA_HACKATHON.md`, `docs/CRONOGRAMA_HACKATHON.md`, `docs/DEPLOY_E_VIDEO.md`, `docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md`, vetores JCS e RFCs.
- Backend consultado: `Program.cs`, `CatalogoCenarios.cs`, `Motor.cs`, `Projecao.cs`, `Eventos.cs`, `Juiz360.cs`, `EventStore.cs`, `PostgresEventStore.cs`, `schema.sql`, `ClienteDialogo.cs` e testes existentes.
- Frontend: `App.tsx`, `TelaInicial.tsx`, apps de suporte, `ReplayView.tsx`, `index.css`, `utils/jcs.ts`, testes, Playwright, `vercel.json`, `package.json` e script de bundle.
- Infra: `render.yaml`, `docker-compose.yml`, Dockerfiles e configurações relevantes.
- Protótipo isolado: `C:/Users/Black/.gemini/antigravity/brain/7af3228f-a969-42a1-a65d-becbf5a06ae0/scratch/prototipo-redesign/index.html`; inspeção estática e GET HTTP. Screenshots preexistentes `.playwright-mcp/proto_375.png` e `.playwright-mcp/live_375.png` foram visualmente inspecionados; não houve navegação interativa por indisponibilidade do navegador.
- Bases de suporte: consultados índices e taxonomias sobre impressão, sincronização, contas, backup, armazenamento, VPN, Microsoft 365, monitoramento e automação. Apenas padrões genéricos. Nenhum dado individual de KB foi levado ao relatório.
- DevLedger SQLite readonly: `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, `sqlite_schema`, `project`, `v_project_state_current`, `v_sovereign_rule_active` e estado do slug do simulador. Consulta de estágios falhou por nome de coluna incorreto e não foi repetida; nenhum estágio ou handoff foi afirmado.
- Git: status, branch, HEAD, log reverso e remotes em leitura.
- CLIs: GitHub `auth status` e `repo view`; Vercel `project ls`, `inspect` e `whoami`; Render `services list`; Neon `projects list`; Cloudflare `auth whoami`. Neon pediu organização e nenhuma foi selecionada. Cloudflare não teve zona consultada.
- HTTP GET: site Hack Brasil, regulamento, demo local e URLs públicas da aplicação.

## Limitações

Nenhum teste, build, deploy, migration, consulta PostgreSQL ou alteração DevLedger foi executado. Regulamento lido diretamente por HTTP depois de falha no navegador. Screenshots preexistentes do protótipo e da aplicação foram inspecionados; o navegador de automação não iniciou, portanto não houve navegação interativa. Este material não é consultoria profissional formal.


