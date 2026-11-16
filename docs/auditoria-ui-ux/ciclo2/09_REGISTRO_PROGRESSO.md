# Ciclo 2: registro de progresso

Branch: ux-ciclo-2 (a criar na E1, a partir da main em a88988c). Plano: 07_PLANO_FINAL.md. Cada etapa acrescenta uma linha: arquivos tocados, verificações e resultado, pendências e próxima ação.

## Decisões do usuário (aprovadas em 2026-11-16)

1. Nenhuma missão selecionada ao abrir.
2. A alteração local da etapa 10 entra em commit próprio de documentação, antes da E1.
3. Os 4 itens alheios ficam fora do ciclo: README.md, docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md, docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md e docs/consultor-vocacional/.
4. Quem já tem focus n1 salvo permanece em n1, sem migração.
5. Limiares: contorno de container 2,0:1, divisor 1,4:1, controles e foco 3:1.
6. Itens por padrão mantidos: correção do F 20% e rótulos por extenso (E3) e seletor de arquivo em português (E6).

Observação sobre a decisão 1 a 5: o usuário respondeu "aprovado" ao plano final, que trazia a recomendação em cada pergunta. As recomendações foram adotadas como respostas.

## Etapas

| Etapa | Agente | Status | Linha de registro |
|---|---|---|---|
| E1 | sim2-medicao | concluída (commit local, sem push) | ver Registro, E1 |
| E2 | sim2-implementador | concluída (commit local, sem push) | ver Registro, E2 |
| E3 | sim2-implementador | concluída (commit local, sem push) | ver Registro, E3 |
| E4 | sim2-implementador | pendente | |
| E5 | sim2-implementador | pendente | |
| E6 | sim2-implementador | pendente | |
| E7 | sim2-validador | pendente | |
| E8 | sim2-fechamento | pendente | |

## Registro

### E1, base de medição (2026-11-16)

- Arquivos: src/frontend/e2e/contraste.spec.ts, contraste.helper.ts e contraste.relatorio.mjs (novos); src/frontend/e2e/visual.spec.ts (só higiene de captura: mouse fora, foco removido, fixos e sticky neutralizados e tooltips ocultos durante a captura, com a folha de estilo removida depois); src/frontend/playwright.config.ts (a spec nova passa a rodar nos 4 projetos visuais, sem mudar projetos nem viewports); docs/auditoria-ui-ux/ciclo2/10_LINHA_DE_BASE.md e 10_linha_de_base.json; este registro.
- Verificações: git status e HEAD conferidos na retomada (branch ux-ciclo-2, base 7907bda); portas 8080 e 5173 sem listener antes da rodada e depois; npm.cmd run lint sem avisos e sem erros; uma rodada completa de e2e/contraste.spec.ts, 16 testes verdes em 2,0 min (4 projetos x 2 temas x estudo e laboratório); depuração anterior em desktop-1440 já feita na sessão interrompida; relatório regerado com 120 de 120 células medidas e 0 não calculáveis; varredura do caractere E comercial (montado por [char]38) e das formas passadas de sair nos arquivos da etapa: zero ocorrências; git diff mostra só e2e, playwright.config.ts e docs; nenhum arquivo de src/frontend/src alterado; nenhum pacote instalado.
- Resultado (soma dos 4 viewports): tactical, texto 4, container 76, divisor 0, controle 30, foco 0, hover 14; corporate, texto 0, container 76, divisor 8, controle 30, foco 0, hover 20. Sem rolagem horizontal em nenhuma célula. Não calculáveis: 892 elementos, por motivo no relatório (seção 6).
- Observações: (1) o plano cita 5 projetos, mas o projeto chromium ignora as specs visuais, então a rodada tem 4 projetos de medição (mobile-375, tablet-768, desktop-1280, desktop-1440). (2) A matriz de tokens do tactical usa o piso 1,71 e 1,81 (em vez de 1,72 e 1,82) para o divisor sem regressão, porque 1,8196 arredonda para 1,82 e aparecia como falha falsa. (3) A coluna de contagem por viewport mostra mais violações de controle em 375 e 768 (12) do que em 1280 e 1440 (3), por causa de button.lab-guia-alternar, visível só nessas larguras. (4) Os 4 itens alheios continuam sem commit. (5) Zoom em 200 por cento e leitor de tela ficam para a E7.
- Pendências: inspeção visual dos PNG do tactical e do corporate (E6); o teste de tokens que leia index.css (E5); decisão do agente da E5 sobre o menor deslocamento de border-strong e border-subtle do corporate.
- Próxima ação: E2 (nenhuma missão pré-selecionada, focus inicial estagiario, botão Decolar com guarda), em sessão nova, partindo do commit local da E1.

### E2, selecao inicial e focus (2026-11-16)

- Arquivos: src/frontend/src/workstation/TelaInicial.tsx (cenario inicial vazio, guarda no onDecolar, entrada do laboratorio pela barra superior cai no cenario do nivel em foco quando nada foi escolhido); src/frontend/src/workstation/TabelaMissoes.tsx (aria-disabled, texto de apoio "Escolha uma missão" ligado por aria-describedby, guarda no clique); src/frontend/src/educacao/catalogoEducacional.ts (focus inicial estagiario, comentario com a tabela de ids e rotulos); src/frontend/src/index.css (regra .btn-indisponivel, so tokens existentes); src/frontend/src/App.test.tsx (a aba Aulas agora abre na primeira aula do Estagiario); src/frontend/src/workstation/EstadoInicial.test.tsx (novo, 7 testes); este registro.
- Verificacoes: npm.cmd test -- --run src/App.test.tsx src/workstation/EstadoInicial.test.tsx: 23 de 23 verdes; npm.cmd run lint: 0 avisos e 0 erros; Playwright (portas 8080 e 5173 livres antes de cada execucao) jornadas.spec.ts "Feliz 1" no projeto chromium: verde; "W10" (375, 768 e 1280 px, teclado) no projeto chromium: verde.
- Desvios: (1) index.css nao estava na lista de arquivos da etapa, mas o estado indisponivel por classe exigia uma regra; foi uma unica regra com tokens existentes (text-secondary sobre bg-elevated, border-control). (2) O projeto mobile-375 so executa as specs visual e contraste (playwright.config.ts), entao "Feliz 1" nao existe nele; a cobertura de 375 px da jornada vem do teste W10 no chromium, que muda o viewport. (3) Enter no botao: o jsdom nao gera clique a partir de keydown, entao o teste dispara keydown e clique em sequencia, como o navegador faz; o Enter real fica coberto pela guarda no handler.
- Pendencias: contraste da regra .btn-indisponivel nao medido no navegador (a medicao no navegador fica para a E5 e a E7; pelos tokens, text-secondary sobre bg-elevated passa de 4,5 nos dois temas); usuario com focus n1 salvo continua em n1 (decisao 4).
- Proxima acao: E3 (progresso real das notas semeadas e rotulos Teoria, Fixacao e Pratica por extenso), partindo do commit local da E2.

### E3, progresso real e rotulos (2026-11-16)

- Arquivos: src/frontend/src/educacao/catalogoEducacional.ts (calcularProgressoNivel usa notaContaComoProgresso: mais de 20 caracteres e texto diferente do texto semeado de DEFAULT_PAGES do mesmo nivel, comparacao com trim e CRLF normalizado; esquema salvo e DEFAULT_PAGES intactos, sem duplicar a string); src/frontend/src/workstation/TabelaMissoes.tsx (rotulo "Teoria X%, Fixação X%, Prática X%", igual ao da Credencial); src/frontend/src/index.css (uma regra: .missao-progresso de font-size-xs, 11 px, para font-size-sm, 13 px); src/frontend/src/educacao/progressoNivel.test.tsx (novo, 9 testes); este registro.
- Verificacoes: npm.cmd test -- --run src/educacao/progressoNivel.test.tsx src/App.test.tsx src/workstation/EstadoInicial.test.tsx: 32 de 32 verdes; npm.cmd run lint: 0 avisos e 0 erros; sem Playwright (a E4 captura). Varredura do caractere E comercial e das formas passadas de sair nas linhas adicionadas: zero.
- Casos cobertos: estado limpo t 0, f 0 e p 0 nos 5 niveis; tabela com "Não iniciada" nos 5; semeado sem edicao nao conta; editado conta 20; igual ao semeado (inclusive com espacos e CRLF) nao conta; apagado, indefinido, 20 caracteres nao contam e 21 contam; dado legado (icone emoji, focus n1) carrega, recalcula e regrava; legado sem paginas nao quebra.
- Desvios: (1) index.css nao estava na lista, mas o texto novo e mais longo e o 11 px da regra violava o minimo de 12 px computado; troca de um token existente por outro. (2) .missao-competencias tambem usa font-size-xs (11 px): fora do escopo, fica para a E6. (3) O texto "T 0%, F 20%, P 0%" so aparecia na tabela; nao havia teste nem spec que o citasse.
- Risco residual: uma edicao minima do exemplo (mais de 20 caracteres e diferente do semeado) conta como progresso; nota que o aluno copia ou restaura para o texto semeado volta a contar zero. Dados salvos com uma versao antiga do texto semeado, se houver, contariam como edicao.
- Pendencias: contraste do .missao-progresso (text-muted) no navegador fica para a E5 e a E7; legibilidade do rotulo longo em 375 px sera vista na captura da E4.
- Proxima acao: E4 (Missao 0 depois do Primeiro Voo e antes das missoes), partindo do commit local da E3.
