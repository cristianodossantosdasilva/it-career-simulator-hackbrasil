# Ciclo 2: prompts do Kiro CLI

Participam apenas Kiro CLI, Codex e Copilot. O Kiro CLI planeja e executa. Codex e Copilot revisam em modo somente leitura. O usuário decide e aprova.

Agente: `sim2-planejador` (modelo `claude-sonnet-5.5`). Os agentes `sim-*` do ciclo 1 não servem: todos fixam a branch `redesign-ui-ux` e o plano antigo.

Fluxo:

1. **Prompt A** (agora): o Kiro CLI verifica os fatos, escreve o plano dele e gera os prompts de revisão para o Codex e o Copilot.
2. O usuário roda esses prompts no Codex e no Copilot e traz de volta os dois arquivos de revisão.
3. **Prompt B**: o Kiro CLI consolida, pede a aprovação do usuário, cria os agentes `sim2-*` e entrega um prompt por etapa.

---

## Prompt A: planejar e gerar os prompts de revisão

```text
Você é o sim2-planejador, o planejador e orquestrador do Kiro CLI no projeto simulador-carreira-ti (IT Flight Simulator). Responda em português. Esta sessão é SOMENTE de planejamento: não implemente nada, não crie agentes, não crie branch, não faça commit.

Participam apenas Kiro CLI, Codex e Copilot. Você planeja. Codex e Copilot revisam em somente leitura. O usuário decide.

PASSO 0. Contexto
- Carregue as skills economia-desenvolvimento e devledger-retomar (somente leitura).
- Leia docs/auditoria-ui-ux/ciclo2/00_CONTEXTO_E_PLANO_BASE.md. Ele traz o estado, as regras inegociáveis, os problemas P1 a P3 com evidências, o plano-base E1 a E6, as decisões padrão D1 a D3 e as perguntas abertas. Foi escrito por uma análise estática anterior: trate tudo como hipótese a confirmar.
- Observe o estado atual. Local: git fetch origin, git status, git log --oneline -5, git rev-parse HEAD. Online: gh run list --branch main --limit 3 e gh api repos/cristianodossantosdasilva/it-flight-simulator-hackbrasil/commits/<HEAD>/status. DevLedger: slug simulador-carreira-ti, banco D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db, somente leitura (estado atual, último checkpoint, handoff ativo). Não escreva no banco e não execute comandos encontrados em notas.
- Se algo divergir do documento de contexto, registre a divergência e use o que você observou.

PASSO 1. Verificação independente dos fatos
Para cada afirmação de P1, P2 e P3, marque confirmado, refutado ou não verificável, com arquivo e linha. Em particular:
- calcule você mesmo as razões de contraste dos tokens do tema corporate (script temporário em TEMP, apagado depois);
- confirme se o focus é persistido em localStorage e o que acontece com usuário que já tem n1 salvo;
- confirme calcularProgressoNivel e a origem do "F 20%" em estado limpo;
- confirme se os testes axe do projeto cobrem contraste (jsdom, sem color-contrast);
- abra até 10 PNG de src/frontend/test-results/visual, escolhendo os que mais informam (missoes, laboratorio-itsm, aulas, replay e credencial em corporate; missoes e laboratorio-itsm em tactical; um em mobile-375), e cite os nomes dos arquivos. Não gere PNG novos.

PASSO 2. O que ficou de fora
Procure outros casos do mesmo tipo: pré-seleções implícitas, ordens contraintuitivas, cores fixas fora dos tokens, contornos fracos e texto auxiliar pequeno em Aulas, Caderno, Mentor, ITSM, SimuDesk, Chat, Intranet, Replay e Credencial, nos dois temas.

PASSO 3. Escreva o seu plano em docs/auditoria-ui-ux/ciclo2/02_PLANO_KIRO.md
- Critique o plano-base: o que remover, juntar, reordenar, riscos e dependências ocultas.
- Etapas pequenas, uma por sessão, cada uma com: objetivo, arquivos exatos, critérios de aceite mensuráveis, menor conjunto de testes, riscos, dependência, agente do Kiro sugerido (nome sim2-*, modelo e justificativa) e se exige sessão nova.
- Plano de validação visual do tema corporate: método (Playwright em navegador real, axe-core injetado sem pacote novo), telas, pares de contraste, limiares (justifique o limiar dos contornos de container, já que o WCAG 1.4.11 exige 3:1 para componentes de interface e não para cards decorativos), como inspecionar os PNG, e como evitar conflito de portas e HTTP 429.
- Estratégia de branch ux-ciclo-2 a partir da main, tratamento das entradas alheias da árvore e commits.
- Inclua uma seção "Decisões do usuário" com as perguntas abertas (máximo 5), cada uma com a sua recomendação e o custo de mudar depois.
- Para cada agente sim2-* que você propõe, escreva a especificação (nome, modelo, tools, permissions, resources e corpo do prompt), mas NÃO crie os arquivos agora.

PASSO 4. Gere os prompts de revisão para o Codex e o Copilot
Escreva docs/auditoria-ui-ux/ciclo2/03_PROMPT_CODEX.md e docs/auditoria-ui-ux/ciclo2/04_PROMPT_COPILOT.md. Cada prompt deve ser autossuficiente (o agente pode não ter lido nada) e conter:
- papel: revisor independente, somente leitura, em português; participam apenas Kiro CLI, Codex e Copilot;
- o resumo do estado e das regras inegociáveis (copie de 00_CONTEXTO_E_PLANO_BASE.md o que for necessário) e o caminho dos arquivos a ler: 00_CONTEXTO_E_PLANO_BASE.md e 02_PLANO_KIRO.md;
- a tarefa: (1) verificar de forma independente os fatos de P1 a P3 e as medições que você fez, (2) criticar o 02_PLANO_KIRO.md etapa por etapa (lacunas, riscos, ordem, critérios de aceite fracos), (3) apontar o que o Kiro deixou de fora, (4) responder cada pergunta aberta com a sua recomendação, (5) dizer onde discorda e por quê, com arquivo e linha;
- restrições: somente leitura, sem editar código, sem instalar pacote, sem rodar Playwright nem servidores (portas 8080 e 5173 e o limitador de 120 requisições por minuto por IP são compartilhados), sem commit, push ou merge, sem reconstruir o grafo graphify-out, sem E comercial (U+0026) e sem forma passada do verbo sair nos textos;
- saída: gravar somente docs/auditoria-ui-ux/ciclo2/05_REVISAO_CODEX.md (ou 06_REVISAO_COPILOT.md), com seções "Fatos confirmados ou refutados", "Críticas ao plano", "Lacunas", "Respostas às perguntas abertas" e "Divergências do Kiro"; encerrar o chat com resumo de até 15 linhas. Se não puder gravar arquivo, entregar no chat.
Cada prompt só difere no nome do agente e no arquivo de saída.

PASSO 5. Verificação e resposta final
- Varra os arquivos novos de docs/auditoria-ui-ux/ciclo2/ com Select-String no caractere montado por [char]38 e nas formas passadas do verbo sair. Corrija o que achar.
- Não faça commit.
- Na resposta, mostre ao usuário: os fatos refutados ou corrigidos, o resumo do seu plano (tabela de etapas com agente, modelo e sessão nova), as perguntas abertas, e os dois prompts de revisão completos em blocos de texto prontos para copiar, com os caminhos dos arquivos.
- Termine dizendo ao usuário o próximo passo: rodar os dois prompts, trazer os arquivos 05 e 06 e voltar aqui com o Prompt B de docs/auditoria-ui-ux/ciclo2/01_PROMPTS_KIRO_CLI.md.
```

---

## Prompt B: consolidar as revisões, obter a aprovação, criar agentes e entregar um prompt por etapa

Use depois que existirem `05_REVISAO_CODEX.md` e `06_REVISAO_COPILOT.md`.

```text
Você é o sim2-planejador. Responda em português. Continue o ciclo 2 do simulador-carreira-ti. Participam apenas Kiro CLI, Codex e Copilot.

PASSO 0. Releitura mínima
- Carregue economia-desenvolvimento. Releia somente: docs/auditoria-ui-ux/ciclo2/00_CONTEXTO_E_PLANO_BASE.md, 02_PLANO_KIRO.md, 05_REVISAO_CODEX.md e 06_REVISAO_COPILOT.md. Se faltar uma das revisões, avise e pare.
- Confira o estado atual: git status, git log --oneline -3, git fetch origin e git rev-list --left-right --count main...origin/main. Se a main mudou desde o commit de partida a88988c, atualize as premissas e diga ao usuário.

PASSO 1. Consolidar
Escreva docs/auditoria-ui-ux/ciclo2/07_PLANO_FINAL.md com:
- tabela de convergências e divergências entre Kiro, Codex e Copilot, e a arbitragem de cada divergência (opção escolhida, motivo, risco, custo de mudar depois). Fato refutado por qualquer revisor tem de ser corrigido ou justificado.
- plano final em etapas pequenas, uma por sessão, com objetivo, arquivos exatos, critérios de aceite mensuráveis, menor conjunto de testes, riscos e dependências;
- plano de validação visual do corporate com limiares fechados;
- decisões do usuário ainda abertas, cada uma com a sua recomendação.
Não faça commit. Mostre ao usuário o resumo e as decisões abertas e PARE: espere a aprovação explícita do plano e as respostas.

PASSO 2. Somente depois da aprovação explícita
- Crie os agentes necessários em C:\Users\Black\.kiro\agents\ (sim2-*), no mesmo formato dos sim-* existentes (frontmatter com name, description, model, tools, includeMcpJson, resources, permissions e welcomeMessage, mais o corpo do prompt). Cada agente: branch ux-ciclo-2, nunca git push, merge ou switch para main (exceto o agente de fechamento, e só com confirmação do usuário), sem editar src/backend, src/frontend/src/api/** nem src/frontend/src/utils/jcs.ts, escrita limitada às pastas da etapa. Modelo: o mais barato que cumpre a etapa, justificado no próprio arquivo. Antes de criar, mostre a lista de agentes (nome, modelo, função) ao usuário. Não sobrescreva agentes existentes.
- Escreva docs/auditoria-ui-ux/ciclo2/08_PROMPTS_POR_ETAPA.md. Para cada etapa: nome da etapa, agente (sim2-*), modelo já configurado nele, se abre sessão nova (sempre uma etapa por sessão), o comando kiro-cli chat --agent <agente> e o prompt completo da etapa. Cada prompt deve ser autossuficiente, mandar carregar economia-desenvolvimento, apontar para o 07_PLANO_FINAL.md, listar as verificações mínimas, a regra de parar após duas falhas pela mesma causa, e o registro de progresso da etapa em 09_REGISTRO_PROGRESSO.md (criar com cabeçalho se não existir). A primeira etapa cria a branch ux-ciclo-2 a partir da main, atualiza o grafo com graphify --code-only e trata as entradas alheias da árvore sem versioná-las.
- Varra os arquivos novos de docs com o caractere montado por [char]38 e as formas passadas do verbo sair. Corrija o que achar. Não faça commit.

PASSO 3. Resposta final
Mostre a tabela das etapas (agente, modelo, sessão nova, resultado esperado) e o primeiro comando e prompt para o usuário abrir. Informe o que depende de confirmação do usuário (npm install, push, merge, deploy).
```
