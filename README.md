# IT Career Simulator

Escola técnica digital de aprender fazendo. A pessoa pratica a rotina real de uma profissão de TI, com chamados, ferramentas e decisões em um ambiente simulado, e revê o que fez depois.

Projeto do time **CVE-K** (Cristiano dos Santos da Silva, Enzo Modesto Nascimento dos Santos e Kauan Soares Dantas) para o **Hack Brasil 2026**, trilha **Acesso à educação**, rota **Suporte de TI**.

- **Demonstração pública (sem login):** https://it-flight-simulator-hackbrasil.vercel.app
- **Licença:** proprietária, todos os direitos reservados. Veja [LICENSE](LICENSE) e a seção [Licença](#licença).
- **Integração contínua:** [GitHub Actions](.github/workflows/ci.yml)

## Por que existe

Faltam pessoas na base da área de TI: técnicos de suporte, atendentes de service desk e operadores de infraestrutura. Quem quer entrar na área costuma abandonar a formação antes de ver o trabalho de perto, por escolher o curso sem saber como é a rotina.

O IT Career Simulator ataca os dois pontos:

- **Aprender fazendo.** Cada missão é um chamado da empresa fictícia Aurora Logística. A pessoa investiga, age, registra e confere o resultado, como num posto de trabalho.
- **Consultoria vocacional antes da formação.** O Diagnóstico indica por onde começar, a partir de respostas curtas, e deixa a pessoa experimentar o trabalho antes de se comprometer. Isso reduz a evasão causada por escolha às cegas.

## A narrativa da missão

Todo o produto segue a progressão de carreira em TI. A pessoa evolui de **Iniciante** a **Analista Jr** e a **Analista**: primeiro observa e faz o Diagnóstico, depois atua com apoio, e por fim conduz o atendimento sozinha.

O **Mentor** acompanha a missão em quatro papéis:

| Papel | O que faz |
| --- | --- |
| Consultor | Explica o Diagnóstico, mostra o que cada rota pratica e indica o próximo passo. |
| Instrutor | Explica as etapas, as missões e o que libera a próxima etapa. |
| Assistente | Dá dicas durante o atendimento, na Mesa de Trabalho. |
| Mentor | Ajuda a ler a linha do tempo da missão e a planejar o próximo treino. |

O Mentor orienta, não altera estado e não avalia. A avaliação técnica vem do Juiz 360º, que lê eventos observáveis calculados pelo motor determinístico.

## Páginas

| Rota | Página | Função |
| --- | --- | --- |
| `/` | Início | Apresenta a proposta e o atalho para experimentar. |
| `/diagnostico` | Diagnóstico | Consultoria vocacional: respostas curtas e indicação de rota. |
| `/plano-de-carreira` | Plano de Carreira | Rota indicada, etapas e modo de demonstração. |
| `/mesa-de-trabalho/:missao` | Mesa de Trabalho | Atendimento da missão, com ITSM, Chat, SimuDesk e Intranet. |
| `/revisao/:sessao` | Revisão | Replay e debrief da sessão, com o Juiz 360º. |
| `/portfolio` | Portfólio | Missões registradas e acompanhamento do portfólio de analista. |
| `/catalogo` | Catálogo | Catálogo de etapas, vertentes e referências de certificação. |
| `/aulas` | Aulas | Microaulas por nível. |
| `/aulas/treino` | Treino de explicação | Prática de explicar o conteúdo com as próprias palavras. |
| `/caderno` | Caderno | Anotações e plano de estudos. |
| `/mentor` | Mentor | Conversa com os quatro papéis do guia. |

## Etapas e cenários

A rota **Suporte de TI** tem quatro etapas. A N3 Sênior se divide em três vertentes. Os sete cenários jogáveis rodam de ponta a ponta no motor determinístico. Cada cenário sorteia a causa por semente, ou aceita uma causa forçada.

| Etapa | Cenário | Causas |
| --- | --- | --- |
| Help Desk N1 | `reset-senha-desbloqueio` | `SENHA_ESQUECIDA`, `CONTA_BLOQUEADA`, `SENHA_EXPIRADA` |
| Service Desk N1 Jr | `pasta-rede-inacessivel` | `C1`, `C2`, `C3`, `C4` |
| N2 Pleno | `incidente-massivo` | `PATCH_MASSIVO` (apelido `GATEWAY`), `EMAIL_PROVEDOR`, `DOMINIO_SUSPENSO` |
| N3-A Redes e Nuvem | `sre-cloud-latencia` | `OOM_KILLED`, `POOL_EXHAUSTED`, `CERT_EXPIRED` |
| N3-B Data Center e Backup | `falha-backup-restore` | `REPOSITORIO_CHEIO`, `CADEIA_CORROMPIDA` |
| N3-C Segurança e Dados | `triagem-engenharia-social` | sem causas sorteadas |
| N3-C Segurança e Dados | `diagnostico-sql-readonly` | sem causas sorteadas |

A tabela completa, com comandos, eventos e critérios do Juiz 360º de cada causa, está em [docs/CENARIOS_POR_ETAPA.md](docs/CENARIOS_POR_ETAPA.md).

## Modo de demonstração para a banca

Quem avalia não precisa fazer o Diagnóstico completo. O atalho **Experimentar**, na página Início, leva ao Diagnóstico rápido e depois à Mesa de Trabalho com a missão de demonstração (`pasta-rede-inacessivel`). O modo também pode ser ligado e desligado no Plano de Carreira.

O modo libera as etapas e não conta como missão concluída. Ele não cria Registro de Missão por si só, mas uma missão concluída grava Registro de Missão, com o modo ligado ou não. O modo usa uma chave própria no navegador (`itfs_modo_demonstracao`). Os dados são sintéticos e as sessões são anônimas.

## Arquitetura

- **Motor determinístico como autoridade única.** Mudança de estado, acesso remoto, comandos simulados, SLA e avaliação são decididos em `Simulador.Dominio` e `Simulador.Avaliacao`. O diálogo (`Simulador.Dialogo`) não altera estado nem avalia.
- **Event sourcing.** Cada ação gera eventos imutáveis (*append-only*), o que permite reconstruir o estado, rever a sessão em ordem cronológica e auditar a avaliação.
- **Juiz 360º.** Avalia por critérios binários observáveis na trilha de eventos, sem opinião de modelo de linguagem.
- **Currículo Vivo verificável.** O resumo é canonicalizado por **JCS (RFC 8785)**, tem hash **SHA-256** e assinatura **ECDSA P-256**. Qualquer pessoa verifica no navegador, sem rede, com os vetores de [docs/vetores-jcs-sha256.json](docs/vetores-jcs-sha256.json).
- **Fidelidade declarada.** A interface não imita sistemas proprietários. Os comandos suportados são declarados por cenário, e comandos fora do escopo recebem resposta honesta.
- **Custo zero no hackathon.** O diálogo roteirizado é o padrão (`Dialogo:HabilitarLlm=false`), sem chamada a IA externa.

| Projeto | Papel |
| --- | --- |
| `Simulador.Dominio` | Motor puro (`Aplicar`) e subsistemas isolados. |
| `Simulador.Cenarios` | Catálogo, sementes (`SplitMix64`) e estado inicial. |
| `Simulador.Itsm` | Chamados, SLA, notas, escalonamento e Problemas ITIL. |
| `Simulador.Avaliacao` | Juiz 360º, projeção de Replay, JCS, SHA-256 e ECDSA P-256. |
| `Simulador.Dialogo` | Interface `IClienteDialogo` com modo roteirizado. |
| `Simulador.Infra` | PostgreSQL (`JSONB`, *append-only*, expurgo de sessões antigas) e provedor em memória. |
| `Simulador.Api` | API REST, health checks, limites de corpo e de dados, rate limit por IP. |

O frontend usa React 19, TypeScript e Vite.

## Como rodar

Requisitos: .NET 10, Node.js e, opcionalmente, Docker.

```bash
# Backend (porta 8080)
dotnet run --project src/backend/src/Simulador.Api --urls http://localhost:8080

# Frontend (porta 5173)
cd src/frontend
npm install
npm run dev
```
No Windows, `npm.cmd` e `npx.cmd` funcionam no lugar de `npm` e `npx`, inclusive quando o PowerShell bloqueia scripts. O mesmo vale para os comandos de teste abaixo.

Com Docker: `docker compose up --build` sobe PostgreSQL 17, backend e frontend. Sem banco, o backend usa o provedor em memória.

Verificações de saúde: `GET /health/live` e `GET /health/ready`. Limite de 120 requisições por minuto por IP (`429` acima disso, exceto `/health/*`).

## Como testar

```bash
dotnet test src/backend/Simulador.slnx

cd src/frontend
npm run lint
npm test -- --run
npm run build
```

Contagens medidas em **2026-11-18**, branch `jornada-de-carreira`:

| Suíte | Resultado |
| --- | --- |
| `dotnet test src/backend/Simulador.slnx` | 2344 testes aprovados, 0 falhas (`Simulador.Dominio.Tests` 2316 e `Simulador.Api.Tests` 28) |
| `npm test -- --run` em `src/frontend` | 385 testes aprovados em 49 arquivos, 0 falhas |

`Simulador.Infra.IntegrationTests` roda no CI contra PostgreSQL 17 e não entrou nessa medição local. Os testes de ponta a ponta (Playwright) ficam em `src/frontend/e2e`. A CI roda os projetos `chromium`, `mobile-375` e `desktop-1440` (job `e2e`, com a API em segundo plano e o `vite preview`); os demais viewports rodam localmente com `npx playwright test`.

## Documentação

- [Cenários por etapa](docs/CENARIOS_POR_ETAPA.md)
- [PRD](docs/PRD_HACKATHON.md)
- [Arquitetura técnica](docs/ARQUITETURA_HACKATHON.md)
- [Planejamento pedagógico e matriz de 560 horas](docs/PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md)
- [Contexto e conformidade do Hack Brasil 2026](docs/CONTEXTO_HACK_BRASIL_2026.md)
- [Cronograma](docs/CRONOGRAMA_HACKATHON.md)
- [Deploy e roteiro de vídeo](docs/DEPLOY_E_VIDEO.md)
- [Sistema de design](docs/design/DESIGN.md)

As pastas `docs/auditoria-*` e `docs/rfc` são registro histórico do processo de desenvolvimento (auditorias, propostas e discussões). Não descrevem o estado atual do produto; a referência é o código e os documentos listados acima.

## Conformidade

- Dados 100% sintéticos: a empresa Aurora Logística (`aurora.local`), as pessoas, os servidores, os logs e os conjuntos de dados são fictícios.
- Sem coleta de dados pessoais reais.
- Repositório criado para o Hack Brasil 2026, sem aproveitamento de código privado anterior.
- Chaves de API, se houver, ficam só no servidor, por variáveis de ambiente.

## Licença

O software é **proprietário, com todos os direitos reservados** ao Time CVE-K. O texto completo está em [LICENSE](LICENSE). Em resumo:

- Jurados, organizadores e a equipe técnica do Hack Brasil 2026 podem ler, clonar, compilar, executar e testar o software para avaliar o projeto.
- Qualquer pessoa pode ler o código publicado, mas copiar, modificar, redistribuir ou usar o software, comercialmente ou não, exige autorização prévia e por escrito.
- As versões publicadas antes do commit que introduziu esta licença foram distribuídas sob a licença MIT e continuam regidas por ela.
- Pedidos de licença: abra uma issue neste repositório.
