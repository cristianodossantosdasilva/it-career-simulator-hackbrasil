# Revisão independente do Copilot

## Fatos confirmados ou refutados

| Item | Veredito | Evidência independente |
|---|---|---|
| P1: missão Nível 2 pré-selecionada | Confirmado | `src/frontend/src/workstation/TelaInicial.tsx:73` inicializa `cenario` com `pasta-rede-inacessivel`. O catálogo relaciona esse cenário ao nível `n1`; `src/frontend/src/educacao/catalogoEducacional.ts:761` inicializa `focus` com `n1`. |
| P1: a pré-seleção é estado, não CSS | Confirmado | O rádio selecionado deriva de `cenarioSelecionado === nivel.cenarioId` em `TabelaMissoes.tsx:52`. A imagem `desktop-1280__corporate__missoes.png` mostra a linha 2 destacada. |
| P1: existem dois caminhos primários distintos | Confirmado | Primeiro Missão chama o cenário de Estagiário em `TelaInicial.tsx:274`; Iniciar usa o cenário selecionado em `TelaInicial.tsx:282` e `TabelaMissoes.tsx:117`. |
| P1: foco da Academia também começa em N1 | Confirmado | `criarEstadoInicialAcademia` usa `focus: 'n1'` em `catalogoEducacional.ts:752-764`. |
| P1: o foco é persistido | Confirmado | A chave `itfs_academia_v3` aparece em `catalogoEducacional.ts:753`; `carregarEstadoAcademia` incorpora o objeto salvo em `catalogoEducacional.ts:794-814`. Um navegador que já salvou `n1` continua com esse valor. |
| P1: há duas fontes de próximo passo | Confirmado | `obterProximaAcao` percorre `LEVELS` desde o Estagiário em `catalogoEducacional.ts:879`; a navegação de Aulas usa `estadoAcademia.focus` em `TelaInicial.tsx:211-215`. A imagem `desktop-1280__corporate__aulas.png` abre em Analista Jr, módulo 2 de 5, apesar de Primeiro Missão indicar Nível 1. |
| P1: o E2E normalmente seleciona antes de Iniciar | Confirmado | `jornadas.spec.ts:11-20, 29, 121, 153, 192, 241, 305 e 349`, além de `visual.spec.ts:77`, selecionam um rádio antes do botão primário. A Demo rápida é exceção explícita. |
| P1: remover a seleção quebra os testes atuais | Refutado com ressalva | Os testes selecionam antes de Iniciar, portanto a alteração é compatível. A ressalva é de acessibilidade: o plano não deve usar somente `disabled`, pois isso remove o botão da navegação por foco. |
| P2: Missão 0 está abaixo da tabela | Confirmado | `TelaInicial.tsx:269-282` renderiza Primeiro Missão e tabela; `TelaInicial.tsx:295-310` renderiza Missão 0 depois da tabela. A imagem `desktop-1280__corporate__missoes.png` confirma a ordem. |
| P2: há repetição parcial entre Primeiro Missão e Missão 0 | Confirmado | `PrimeiroVoo.tsx:77-151` apresenta Estudar, Praticar e Revisar; Missão 0 apresenta quatro passos de orientação operacional em `TelaInicial.tsx:295-310`. A repetição é de introdução, não de conteúdo idêntico. |
| P3: contornos corporate são fracos pelos tokens | Confirmado como medição, não como violação WCAG automática | O recálculo independente deu `border-subtle` sobre surface 1,2328, canvas 1,1783 e elevated 1,1253; `border-strong` sobre surface 1,4847, canvas 1,4190 e elevated 1,3553. O plano corretamente trata 2,0 e 1,4 como critérios de projeto. |
| P3: `text-muted` corporate falha sobre hover | Confirmado | `#5E6E84` sobre `#E2E8F0` deu 4,2170. O token está em `index.css:82` e o fundo hover em `index.css:75`. |
| P3: `text-muted` tactical também falha sobre hover | Confirmado | `#8593A8` sobre `#273449` deu 4,0248. Os tokens estão em `index.css:120` e `index.css:129`. O contexto inicial omitia esse problema do tactical. |
| P3: `border-control` corporate está adequado em todo fundo citado | Refutado | Sobre surface deu 4,7588, mas sobre elevated deu 4,3439 e sobre hover 3,8602. O plano só exige surface e elevated para controle, então o critério proposto ainda falha em elevated. |
| P3: cores fixas não acompanham o tactical | Refutado em parte | `banner-notice`, `alert-success` e `alert-danger` têm overrides tactical em `index.css:1059-1061`. Ainda há literais fora dos tokens em `.btn-white`, `index.css:249-250`, e no seletor de arquivo, `index.css:732-733`. Os próprios overrides também usam literais. |
| P3: as cores fixas têm contraste insuficiente | Não confirmado | O recálculo deu 8,24 para banner, 8,30 para success, 8,20 para danger, 17,28 para btn-white e 10,35 para seletor de arquivo. O problema demonstrado é manutenção e coerência de tema, não contraste textual. |
| Teste de tokens protege os tokens atuais | Refutado | `App.test.tsx:19-29` testa hexadecimais antigos como `#0d1322`, `#131c31`, `#f3f5f8` e `#0369a1`, que não são os tokens atuais de `index.css`. |
| axe atual prova contraste renderizado | Refutado | `App.test.tsx:92, 150, 213-233` usa `axe.run` no ambiente de teste. Não há configuração de contraste em navegador real; o teste cobre estrutura, papéis e rótulos, não pixels renderizados. |
| F 20 por cento em estado limpo é real | Confirmado | `DEFAULT_PAGES` já contém notas em `catalogoEducacional.ts:684-717`; `calcularProgressoNivel` considera qualquer nota com mais de 20 caracteres em `catalogoEducacional.ts:857-870`. Isso produz F 20 por cento para Estagiário e N1 sem ação do aluno. A imagem `desktop-1280__corporate__missoes.png` mostra ambos como Em andamento. |
| Os PNG de laboratório representam estado limpo | Refutado | `visual.spec.ts:77-112` executa um turno antes de capturar Replay e Credencial. A imagem `desktop-1280__corporate__credencial.png` mostra XP 60 e um laboratório concluído. |
| Tooltip e barra fixa provam defeito de produto | Não verificável pelos PNG | `visual.spec.ts:29-35` usa `fullPage: true` e não move o mouse antes da captura. O tooltip em `desktop-1280__corporate__aulas.png` e a barra fixa observada no Caderno podem ser artefatos do método. |

### Razões recalculadas

Usei a fórmula WCAG 2.x em script temporário dentro de `TEMP`, removido ao final. Valores relevantes:

| Par | Corporate | Tactical |
|---|---:|---:|
| border-subtle sobre surface | 1,2328 | 1,7241 |
| border-subtle sobre canvas | 1,1783 | 1,8185 |
| border-subtle sobre elevated | 1,1253 | 1,4128 |
| border-strong sobre surface | 1,4847 | 2,3559 |
| border-strong sobre canvas | 1,4190 | 2,4849 |
| border-strong sobre elevated | 1,3553 | 1,9305 |
| border-control sobre surface | 4,7588 | 3,7514 |
| border-control sobre elevated | 4,3439 | 3,0740 |
| text-muted sobre surface | 5,1987 | 5,7266 |
| text-muted sobre elevated | 4,7454 | 4,6925 |
| text-muted sobre hover | 4,2170 | 4,0248 |
| accent-primary sobre surface | 5,8146 | 6,4417 |

## Críticas ao plano

### E1, base de medição

A ordem é boa e a separação entre medição e correção reduz risco. A dependência descrita como inexistente é incompleta: a baseline depende de ambiente de teste estável, estado local limpo, backend de teste disponível e definição explícita de quais telas são comparáveis. O critério “relatório lista cada violação” não define formato, seletor estável, fundo efetivo, opacidade ou tratamento de texto sobre imagem. O uso de `page.addScriptTag` com arquivo de `node_modules` também precisa de uma verificação de caminho antes da execução.

O plano melhora o método de captura, mas a spec prevista deve registrar o estado da tela. Sem isso, F 20 por cento e XP de turno podem ser confundidos com defeito visual.

### E2, estado inicial

Separar P1 de P2 é correto. Contudo, E2 mistura três decisões de risco diferente: seleção de missão, foco persistido e semeadura de notas. O critério “usuário com n1 salvo permanece” preserva um estado possivelmente criado pelo defeito, e o critério “focus inicial estagiario” pode não ser suficiente para separar estado legado de escolha deliberada. É necessário decidir uma política de versão do armazenamento ou declarar formalmente que a compatibilidade tem precedência.

`aria-disabled` não substitui sozinho a lógica de bloqueio. O botão deve permanecer operável por teclado sem iniciar a ação, anunciar a razão por `aria-describedby` e impedir o handler quando não houver cenário. O plano menciona isso, mas não exige um teste de ativação por teclado sem seleção.

O critério de F 20 por cento é tecnicamente fraco ao propor `hasNotes` como distinção. Comparar com o texto padrão falha se o aluno repetir o texto de exemplo; marcar edição exige uma representação persistida. O plano deve exigir teste para estado inicial, edição, restauração e migração de dados antigos.

### E3, ordem da Missão 0

A nova ordem é coerente, mas o critério de altura “não aumenta mais que 5 por cento” é instável e não mede compreensão. Uma Missão 0 aberta pode aumentar a altura mais que esse limite por conteúdo legítimo. O aceite deveria priorizar ordem DOM, ordem de leitura, foco, ausência de rolagem horizontal e comportamento aberto ou recolhido em estados definidos.

O plano não fixa como `details` será anunciado nem como o título vai diferenciar orientação da jornada de conteúdo operacional. Também não há teste que verifique a ordem dos headings e landmarks, apenas um screenshot.

### E4, tokens, contornos e literais

A intenção é correta, mas o aceite “todos os pares de texto dos tokens” é amplo demais sem catálogo de pares e sem regra para texto sobre superfícies de status, terminal e acento. O plano exige `border-control` em elevated, mas a medição atual é 4,3439, enquanto a seção seis também descreve controles como 3,0. É preciso declarar se o objetivo é 3,0 ou 4,5 para cada uso.

O candidato `border-strong #A9B6C7` não cumpre o próprio critério de 2,0 sobre canvas e elevated. O segundo candidato `#9AA8BB` cumpre. Os valores de `text-muted` candidatos precisam ser recalculados para todos os fundos e para o tactical, não apenas para hover e elevated.

Trocar o seletor nativo de arquivo por rótulo em português é uma mudança de UX legítima, mas não deve ser acoplada ao conserto de tokens sem teste do nome acessível e sem verificar os navegadores alvo. O plano não define fallback para o controle nativo.

### E5, ajustes por tela

O escopo nomeia nove telas, mas limita a seis arquivos por sessão e não define prioridade por evidência. Isso pode espalhar correções pequenas por várias sessões e deixar telas importantes sem cobertura. Os critérios “cada defeito corrigido tem antes e depois” e “texto auxiliar com 12 px” não definem qual texto é auxiliar nem como medir contornos em componentes compostos.

Os dez PNG lidos mostram corporate em 1280 px. Aulas, Mentor e Caderno têm textos auxiliares pequenos ou de hierarquia baixa, mas os tooltips sobrepostos em Aulas e Mentor parecem efeito de captura. ITSM, Intranet e Replay têm boa leitura geral, com linhas e bordas discretas. Credencial tem o seletor em inglês e linhas monoespaçadas pequenas. SimuDesk tem bastante espaço vazio, mas não há prova de contraste insuficiente. Não há evidência visual equivalente do tactical nesta revisão.

### E6, revalidação

O conjunto completo é justificável no fim, porém o aceite não exige que a comparação seja contra o mesmo estado de baseline, nem que falhas pré-existentes sejam separadas de regressões. `dotnet build` amplia custo sem relação direta com mudanças permitidas somente no frontend. Se permanecer, deve ser identificado como portão de integração, não como teste da correção visual.

“Varredura de verbo sair” precisa especificar palavras e exclusões para não capturar documentação histórica, código ou usos não relacionados. A regra do projeto deve ser aplicada a textos de interface e arquivos definidos, com relatório reproduzível.

### E7, fechamento

Esta etapa está fora do escopo de uma revisão UX e depende de confirmação explícita para commit, merge e push. A estratégia de commits pequenos é boa, mas a criação da branch no E1 e o commit de documentação da pergunta 2 deveriam ter um portão anterior claro. O plano também deve preservar a regra do trailer de coautoria exigida pelo repositório, caso commits sejam criados.

### Agentes, modelos e estratégia

A divisão por sessão e perfil é adequada, mas a escolha nominal de modelos não é verificável neste documento e não deve ser tratada como critério técnico de aceite. O trabalho de E4 e E5 exige leitura de código, medição e julgamento visual; um modelo mais barato pode executar somente após os critérios e casos de teste estarem fechados. A revisão independente deve permanecer com Kiro, Codex e Copilot, sem presumir agentes externos não criados.

A branch dedicada é apropriada. A instrução para nunca usar `git add -A` é correta. Falta, porém, um estado inicial formal com `git status`, hash de HEAD e lista de arquivos alheios preservada antes de qualquer commit. Também falta uma regra para não incluir o arquivo desta revisão no commit de produto sem decisão do usuário.

## Lacunas

1. **Pré-seleções implícitas:** `focus: 'n1'` afeta Aulas, Mentor, Caderno e menu de perfil, não apenas a tabela. `TelaInicial.tsx:211-215` abre Aulas conforme o foco atual. A imagem `desktop-1280__corporate__aulas.png` demonstra a consequência.
2. **Ordem contraintuitiva:** Primeiro Missão recomenda Estagiário, enquanto Aulas abre N1 e a tabela destaca N1. Essa divergência é de produto, não apenas de estilo.
3. **Progresso falso:** notas semeadas em `DEFAULT_PAGES` contam como Fixação. A correção precisa preservar notas educativas sem transformá-las em progresso do aluno.
4. **Cores fora dos tokens:** `.btn-white`, seletor de arquivo e os três alertas usam literais em `index.css:249-250, 732-733 e 1056-1061`. O override tactical reduz o risco visual, mas mantém duplicação e pode divergir de tokens futuros.
5. **Contornos:** o plano cobre cards, painéis, tabelas e glossário, mas não define como tratar bordas internas, foco, campos desabilitados, terminal e componentes com fundo de status.
6. **Texto auxiliar:** Aulas, Caderno, Mentor, ITSM, SimuDesk, Chat, Intranet, Replay e Credencial usam textos de apoio que merecem medição de tamanho e contraste. Nos PNG corporate de 1280 px, o monoespaçado de Credencial e os estados de ITSM são os casos mais evidentes. A regra de 12 px deve ser aplicada somente a texto auxiliar, sem transformar etiquetas de controle em texto grande artificialmente.
7. **Tactical:** há cálculo de tokens, mas a inspeção visual apresentada não cobre PNG tactical. O terminal dentro do tema corporate usa superfície tactical por decisão explícita; esse caso exige medição separada.
8. **Foco persistido:** não há política de esquema para distinguir padrão antigo de escolha do usuário. Respeitar todo `n1` legado mantém a inconsistência; migrar todos pode apagar uma escolha válida.
9. **Teste de tokens:** o teste em `App.test.tsx:19-59` não lê `index.css`, por isso pode continuar verde após regressão nos tokens reais.
10. **Captura:** `visual.spec.ts:29-35` usa `fullPage: true` e não move o mouse antes da captura. O plano percebe o problema, mas deveria transformar isso em critério obrigatório da spec, não somente em orientação.
11. **Rótulo de arquivo:** `desktop-1280__corporate__credencial.png` mostra “Choose File” e “No file chosen”. O plano inclui a correção, mas não define teste de acessibilidade do input nem comportamento em browser sem tradução nativa.
12. **Dados de laboratório:** as imagens de ITSM, Chat, SimuDesk, Intranet, Replay e Credencial dependem de estados distintos. O relatório deve registrar turno concluído, foco atual e tema para evitar comparação inválida.

## Respostas às perguntas abertas

### 1. Pré-seleção

Recomendo nenhuma missão selecionada. O botão deve permanecer presente, com `aria-disabled`, razão associada e bloqueio efetivo até a escolha. Isso alinha a ação explícita com a expectativa de acessibilidade e elimina a falsa escolha visual observada em `desktop-1280__corporate__missoes.png`. O custo de mudar depois é baixo: estado inicial, regra de ativação, texto de apoio e testes.

### 2. Linha final da etapa 10

Recomendo incluir em commit separado de documentação, antes da E1, somente se o usuário confirmar que essa linha pertence ao ciclo. O custo de deixar para depois é baixo, pois a alteração é isolada; o benefício de incluir agora é manter o plano e o registro de progresso coerentes antes da baseline. Não deve entrar no commit de produto.

### 3. Arquivos alheios

Recomendo mantê-los fora do ciclo. A estratégia de caminhos explícitos está correta e o custo de mudar depois é alto em risco de mistura acidental, embora tecnicamente baixo em quantidade de comandos. O plano deve registrar a lista no estado inicial e conferir o diff antes de cada commit.

### 4. Usuários com `focus` N1 salvo

Recomendo respeitar o valor salvo nesta etapa, mas registrar uma decisão de compatibilidade e adicionar telemetria local inexistente não é necessário. O custo de migrar depois é médio, pois exige versão do esquema, migração somente para valores reconhecidos e testes de escolha deliberada. A correção imediata deve alinhar o estado novo, sem apagar preferências antigas.

### 5. Limiar de contorno

Recomendo 2,0 para contorno de container e 3,0 para controles, foco e objetos gráficos essenciais. Isso preserva hierarquia no corporate. O limite de 2,0 é critério de projeto, não requisito geral de WCAG para todo card. O custo posterior é baixo para um token, mas alto para revisão visual de todas as telas e nova baseline.

## Divergências do Kiro

1. **`border-control` em elevated:** o plano trata o par como atendido por estar acima de 3,0 em vários casos, mas a seção de aceite exige 3,0 enquanto a tabela de tokens pode ser lida como exigência AA de texto. Minha medição é 4,3439 no corporate e 3,0740 no tactical; o aceite precisa separar controle de texto.
2. **Cores fixas:** concordo que devem virar tokens, mas discordo de tratar os alertas como se não tivessem suporte tactical. `index.css:1059-1061` já tem overrides. O problema correto é duplicação e manutenção, não ausência total de adaptação.
3. **F 20 por cento:** concordo com a causa, mas não com uma correção baseada somente em comparação textual de `DEFAULT_PAGES`. Isso não distingue cópia do exemplo, edição parcial e texto restaurado. É necessária uma marca de edição ou regra de progresso baseada em ação observável.
4. **Estado salvo:** concordo em não migrar silenciosamente `n1`, mas o plano deveria documentar que a incoerência permanece para usuários antigos. “Usuário com n1 salvo permanece” não é critério suficiente sem teste de carregamento e escolha posterior.
5. **Missão 0 aberta ou recolhida:** concordo com a ordem proposta, mas discordo de usar o limite de altura de 5 por cento como critério principal. A aceitação deve medir ordem, leitura, foco e rolagem; altura é apenas sinal secundário.
6. **E1 sem dependência:** discordo da ausência de dependência. A baseline depende de estado limpo, ambiente estável, backend de teste, versão do navegador e método de captura. Sem esses dados, a comparação final pode atribuir diferença de método à correção.
7. **Inspeção visual:** o plano afirma cobertura dos dois temas, mas os PNG que pude verificar nesta revisão são `desktop-1280__corporate__aulas.png`, `caderno.png`, `credencial.png`, `laboratorio-chat.png`, `laboratorio-itsm.png`, `laboratorio-kb.png`, `laboratorio-simudesk.png`, `mentor.png`, `missoes.png` e `replay.png`. Não considero o tactical visualmente validado por esses arquivos; apenas os tokens tactical foram recalculados.
8. **Texto auxiliar:** o plano fixa 12 px como mínimo, mas isso não substitui contraste nem clareza. Em Credencial, o texto monoespaçado “Teoria 0 por cento, Fixação 20 por cento, Prática 0 por cento” é menos legível que os rótulos por extenso da própria tela. A correção deve considerar conteúdo e consistência, não somente tamanho.
9. **Modelo e agente:** a escolha de `claude-sonnet-5.5` ou `claude-haiku-5.5` é uma preferência operacional, não uma garantia de qualidade. O critério decisivo deve ser teste reproduzível, diff limitado e evidência visual. Não há base nesta revisão para aprovar agentes não criados ou modelos específicos.
10. **Fechamento:** concordo com merge fast-forward e confirmação explícita, mas o plano deve incluir a preservação do trailer de coautoria e uma regra para não incluir alterações locais alheias nem esta revisão sem autorização.
