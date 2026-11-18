# Requirements Document

## Introduction

O IT Flight Simulator é um orientador de carreira em TI pela prática: a pessoa experimenta a rotina real simulada de uma profissão antes de escolher uma formação e recebe um registro objetivo do que fez, para decidir o próximo passo. O produto não é teste vocacional, não indica carreira pela pessoa e não promete emprego. O tema visual serve a esse propósito: leitura confortável em sessões longas, tom profissional e acolhedor, sem aparência militar.

Esta funcionalidade transforma cada direção visual aprovada no Figma e no Google Stitch em um tema do IT Flight Simulator. O tema pode ser escolhido pelo aluno ou definido pela empresa cliente, no contexto B2B corporativo.

Hoje, na main, existem dois temas, chamados `corporate` (claro) e `tactical` (escuro), aplicados pelo atributo `data-theme` do elemento `html`. Os tokens ficam em `src/frontend/src/index.css` (branch `main`, commit 19bbb18). Hoje, na main, a escolha é salva em `localStorage` na chave `itfs_theme` por `src/frontend/src/shell/tema.ts` e aplicada em `src/frontend/src/main.tsx` e em `src/frontend/src/shell/AppShell.tsx`. Esta funcionalidade substitui esses identificadores e essa chave sem compatibilidade nem migração, porque o produto ainda não tem usuários e não existe preferência salva a preservar (ver D10 e D11). Os identificadores `corporate` e `tactical` e a chave `itfs_theme` deixam de existir no código.

Um tema muda apenas a aparência: cor, família de fonte, tamanho de fonte e peso de fonte, raio, sombra e densidade de espaço. A disposição das páginas é a mesma para todos os temas. Tema é preferência de apresentação e não altera o estado do domínio nem a avaliação do Juiz 360.

Direções visuais que viram tema, na ordem do Catálogo_de_Temas (nome visível, identificador e esquema):

1. Operação (`operacao`, escuro): Tema_Padrão_do_Produto. Tem como linha de base os valores de Token do tema hoje, na main, chamado `tactical`.
2. Corporativo (`corporativo`, claro): tem como linha de base os valores de Token do tema hoje, na main, chamado `corporate`.
3. Editorial (`editorial`, escuro): variante do Stitch com título muito grande, muito espaço e tipografia leve.
4. Acolhedor (`acolhedor`, claro): variante do Stitch, corporativa clara, cartões amplos, cantos de 12 px, tom acolhedor para quem está em transição de carreira.
5. Telemetria (`telemetria`, escuro): variante do Stitch antes chamada Cockpit, com estética de telemetria e rota de voo. Só pode existir com fonte mínima de 12 px e contraste AA, sem aparência de painel militar.

A primeira entrega contém Operação, Corporativo, Editorial, Acolhedor e o Modo_Alto_Contraste. Telemetria fica para uma entrega seguinte e só entra no Catálogo_de_Temas, depois de Acolhedor, quando cumprir os critérios do Requisito 10. Os rótulos atuais "Modo Cockpit Tático - Treinamento" e "Console Corporativo - Auditoria B2B", definidos em `src/frontend/src/shell/tema.ts`, são substituídos pelos nomes visíveis acima.

## Glossary

- **Sistema_de_Temas**: conjunto formado pelo Catálogo_de_Temas, pelo Resolvedor_de_Tema, pelo Script_de_Inicialização_de_Tema e pelo Seletor_de_Tema no frontend.
- **Tema**: conjunto nomeado de valores para os Tokens, identificado por um Identificador_de_Tema, com nome visível em português e indicação de esquema claro ou escuro.
- **Identificador_de_Tema**: valor textual estável gravado no atributo `data-theme` do elemento `html`, igual ao nome do Tema em letras minúsculas e sem acento (por exemplo `operacao` e `corporativo`).
- **Token**: propriedade personalizada de CSS declarada em `src/frontend/src/index.css` (por exemplo `--bg-canvas`, `--text-primary`, `--space-4`, `--radius-md`).
- **Contrato_de_Tokens**: lista fechada dos nomes de Token que todo Tema define, igual à lista de Tokens do tema hoje, na main, chamado `corporate`, que passa a ser `corporativo`.
- **Catálogo_de_Temas**: registro único, no frontend, dos Temas existentes no produto.
- **Configuração_do_Cliente**: dados fornecidos pela empresa cliente com a lista de Temas permitidos, o Tema padrão e o indicador de trava, entregues em arquivo JSON estático opcional servido pela mesma origem do frontend.
- **Trava_do_Cliente**: indicador da Configuração_do_Cliente que impede o aluno de escolher um Tema diferente do Tema padrão do cliente.
- **Preferência_do_Aluno**: Identificador_de_Tema escolhido pelo aluno e guardado entre sessões na chave `itfs_tema` do `localStorage`.
- **Modo_Alto_Contraste**: opção de acessibilidade do aluno que aumenta o contraste da interface, aplicada sobre o Tema resolvido, e que vale mesmo com Trava_do_Cliente. O estado do Modo_Alto_Contraste é guardado entre sessões na chave `itfs_contraste` do `localStorage`.
- **Atributo_de_Alto_Contraste**: atributo próprio do elemento `html`, com nome definido no documento de design, cuja presença ativa o Modo_Alto_Contraste sem alterar o atributo `data-theme`.
- **Conjunto_de_Alto_Contraste**: conjunto de valores de Token de cor usado com o Modo_Alto_Contraste ativo. Existem dois conjuntos, um para esquema claro e outro para esquema escuro, declarados em `src/frontend/src/index.css`.
- **Resolvedor_de_Tema**: lógica que decide qual Tema aplicar a partir da Configuração_do_Cliente, da Preferência_do_Aluno e da preferência de esquema de cor do navegador. O Modo_Alto_Contraste não é entrada do Resolvedor_de_Tema.
- **Script_de_Inicialização_de_Tema**: código executado durante o carregamento do documento que aplica o Tema resolvido e o estado do Modo_Alto_Contraste ao elemento `html`.
- **Botão_de_Aparência**: botão da barra superior que abre e fecha o Painel_de_Aparência, segundo o padrão disclosure da WAI-ARIA Authoring Practices.
- **Painel_de_Aparência**: painel aberto pelo Botão_de_Aparência que contém o Seletor_de_Tema e o controle do Modo_Alto_Contraste.
- **Seletor_de_Tema**: grupo de botões de opção, segundo o padrão radiogroup da WAI-ARIA Authoring Practices, dentro do Painel_de_Aparência, com que o aluno escolhe o Tema. Neste documento, o Seletor_de_Tema inclui também o controle do Modo_Alto_Contraste.
- **Terminal_do_SimuDesk**: área do SimuDesk que exibe a entrada e a saída do terminal simulado.
- **Primeira_Pintura**: primeiro momento em que o navegador desenha conteúdo do documento na tela.
- **Tema_Padrão_do_Produto**: Tema usado quando nenhuma outra fonte define o Tema. Valor decidido: `operacao` (Operação, escuro), primeiro Tema do Catálogo_de_Temas.
- **Spec_de_Contraste**: teste Playwright `src/frontend/e2e/contraste.spec.ts`, que mede contraste nas telas renderizadas.
- **Teste_de_Tokens**: teste unitário `src/frontend/src/tokensContraste.test.ts`, que mede o contraste entre pares de Token.
- **Spec_Visual**: testes Playwright `src/frontend/e2e/visual.spec.ts` e `src/frontend/e2e/home.visual.spec.ts`, que geram capturas de tela.
- **Arquivo_Figma**: arquivo "IT Flight Simulator - Design" (fileKey `wa7yLJvkj6BvvnssUqDx1H`), com as coleções de variáveis Cor, Espaco e raio, e Tipografia.
- **Motor_Determinístico**: código em `src/backend/src/Simulador.Dominio` e `src/backend/src/Simulador.Avaliacao`, autoridade única sobre estado e avaliação.
- **Juiz_360**: componente de avaliação do Motor_Determinístico.
- **WCAG_AA**: nível AA da WCAG 2.2: contraste de 4.5 para 1 em texto normal e de 3 para 1 em texto grande e em componentes de interface.

## Requirements

### Requisito 1: Contrato de tokens por tema

**História de usuário:** Como pessoa desenvolvedora do frontend, quero que todo tema use os mesmos nomes de token, para que os componentes funcionem com qualquer tema sem mudança de código.

#### Critérios de aceitação

1. THE Catálogo_de_Temas SHALL registrar, para cada Tema, três campos obrigatórios: o Identificador_de_Tema, o nome visível em português e o esquema de cor, com valor claro ou escuro. O Identificador_de_Tema deve ser único no Catálogo_de_Temas, ter de 3 a 32 caracteres, começar por letra e conter somente letras minúsculas sem acento, dígitos e hífen. O nome visível deve ter de 1 a 40 caracteres e não pode conter o símbolo E comercial.
2. THE Sistema_de_Temas SHALL definir, para cada Tema registrado no Catálogo_de_Temas, um valor não vazio para cada nome de Token do Contrato_de_Tokens, no bloco de definição de Token identificado pelo Identificador_de_Tema desse Tema em `src/frontend/src/index.css`.
3. THE Sistema_de_Temas SHALL declarar valores de cor em notação hexadecimal, de 3, 4, 6 ou 8 dígitos, somente dentro dos blocos de definição de Token em `src/frontend/src/index.css`, incluídos os blocos dos Conjuntos_de_Alto_Contraste. Nos demais arquivos TypeScript, TSX e CSS do frontend, excluídos os arquivos de teste, a cor deve ser referenciada somente por nome de Token.
4. THE Sistema_de_Temas SHALL limitar as diferenças entre Temas aos valores de Token de cor, família de fonte, tamanho de fonte e peso de fonte, raio, sombra e espaço. Para isso, o bloco de definição de cada Tema declara somente nomes de Token do Contrato_de_Tokens, e nenhum componente fora do Sistema_de_Temas escolhe estilo, estrutura ou conteúdo com base no Identificador_de_Tema.
5. THE Sistema_de_Temas SHALL renderizar, em cada página do frontend, a mesma sequência de elementos, os mesmos textos visíveis e a mesma ordem de conteúdo para todos os Temas registrados no Catálogo_de_Temas. A única diferença permitida é o valor do atributo `data-theme` do elemento `html` e o estado de seleção do Seletor_de_Tema.
6. IF o bloco de definição de um Tema registrado no Catálogo_de_Temas não define um nome de Token do Contrato_de_Tokens, define esse nome com valor vazio ou declara um nome de Token que não pertence ao Contrato_de_Tokens, THEN THE Teste_de_Tokens SHALL falhar e informar o Identificador_de_Tema e o nome de cada Token ausente, vazio ou excedente.
7. IF um arquivo TypeScript, TSX ou CSS do frontend, excluídos os arquivos de teste, declara um valor hexadecimal de cor fora dos blocos de definição de Token em `src/frontend/src/index.css`, THEN THE varredura de regras do frontend, executada pelo comando de lint do frontend, SHALL terminar com falha e informar o arquivo e a linha de cada ocorrência.
8. IF um Tema registrado no Catálogo_de_Temas não tem bloco de definição de Token correspondente em `src/frontend/src/index.css`, ou se existe um bloco de definição de Token cujo Identificador_de_Tema não está registrado no Catálogo_de_Temas, THEN THE Teste_de_Tokens SHALL falhar e informar cada Identificador_de_Tema sem correspondência.
9. IF uma entrada do Catálogo_de_Temas não tem um dos três campos obrigatórios, repete um Identificador_de_Tema já registrado ou tem um campo fora das regras do critério 1, THEN THE Teste_de_Tokens SHALL falhar e informar o Identificador_de_Tema e o campo inválido.

### Requisito 2: Aplicação do tema no documento

**História de usuário:** Como aluno, quero que o tema escolhido valha em toda a aplicação, para que a aparência seja consistente.

#### Critérios de aceitação

1. WHEN o Resolvedor_de_Tema determina um Tema, THE Sistema_de_Temas SHALL gravar no atributo `data-theme` do elemento `html` exatamente um Identificador_de_Tema, o do Tema determinado, e substituir o valor anterior.
2. WHEN o Tema aplicado tem esquema escuro, THE Sistema_de_Temas SHALL deixar a classe `dark` presente no elemento `html`, uma única vez, e definir `color-scheme: dark` no elemento `html`.
3. WHEN o Tema aplicado tem esquema claro, THE Sistema_de_Temas SHALL deixar o elemento `html` sem a classe `dark` e definir `color-scheme: light` no elemento `html`.
4. WHEN o aluno ativa uma opção de Tema no Seletor_de_Tema, por clique, toque ou teclado, THE Sistema_de_Temas SHALL gravar o Identificador_de_Tema escolhido no atributo `data-theme` do elemento `html` em até 100 ms após a ativação, sem recarregar o documento.
5. WHEN o Sistema_de_Temas aplica um novo Tema durante o uso, THE Sistema_de_Temas SHALL manter sem alteração a rota atual, os valores digitados nos campos de formulário, o conteúdo e o histórico do terminal, a sessão de simulação aberta e a sequência de eventos de domínio já registrada, sem gerar evento de domínio novo.
6. WHEN o aluno navega entre páginas da aplicação sem recarregar o documento, THE Sistema_de_Temas SHALL manter no elemento `html` o mesmo Identificador_de_Tema, a mesma presença ou ausência da classe `dark` e o mesmo valor de `color-scheme` até que o Resolvedor_de_Tema determine outro Tema.
7. IF o Identificador_de_Tema recebido pelo Sistema_de_Temas está vazio, ausente ou não pertence ao Catálogo_de_Temas, THEN THE Sistema_de_Temas SHALL gravar no elemento `html` o Identificador_de_Tema do Tema_Padrão_do_Produto, com a classe `dark` e o `color-scheme` do esquema desse Tema, sem gravar o identificador recebido e sem mostrar mensagem de erro ao aluno.

### Requisito 3: Precedência na escolha do tema

**História de usuário:** Como empresa cliente, quero definir o tema padrão e poder travar a escolha, para que a interface siga a identidade combinada no contrato, sem tirar do aluno o recurso de acessibilidade.

#### Critérios de aceitação

1. WHILE o Modo_Alto_Contraste está ativo, THE Resolvedor_de_Tema SHALL retornar, pelos critérios 2 a 9, o mesmo Identificador_de_Tema que retornaria com o Modo_Alto_Contraste inativo, com a Trava_do_Cliente ativa ou inativa. A apresentação de alto contraste é aplicada por cima do Tema resolvido, conforme o Requisito 7.
2. WHILE a Trava_do_Cliente está ativa, THE Resolvedor_de_Tema SHALL retornar o Tema padrão da Configuração_do_Cliente e ignorar a Preferência_do_Aluno, seja ela qual for.
3. WHILE a Trava_do_Cliente está inativa, IF a Preferência_do_Aluno é válida, ou seja, é um Identificador_de_Tema presente no Catálogo_de_Temas e na lista de Temas permitidos, THEN THE Resolvedor_de_Tema SHALL retornar a Preferência_do_Aluno.
4. WHILE a Trava_do_Cliente está inativa, IF não existe Preferência_do_Aluno válida e a Configuração_do_Cliente define um Tema padrão válido, THEN THE Resolvedor_de_Tema SHALL retornar o Tema padrão da Configuração_do_Cliente.
5. IF nenhum dos critérios 2 a 4 define um Tema e o navegador informa `prefers-color-scheme` com valor `light` ou `dark`, THEN THE Resolvedor_de_Tema SHALL retornar o primeiro Tema da lista de Temas permitidos, na ordem do Catálogo_de_Temas, cujo esquema de cor (claro ou escuro) corresponde ao valor informado. Com o Catálogo_de_Temas da primeira entrega e sem Configuração_do_Cliente, `dark` resulta em `operacao` e `light` resulta em `corporativo`, o primeiro Tema claro do Catálogo_de_Temas.
6. IF nenhum dos critérios 2 a 5 define um Tema, inclusive quando `prefers-color-scheme` está ausente, vale `no-preference` ou não corresponde a nenhum Tema permitido, THEN THE Resolvedor_de_Tema SHALL retornar o Tema_Padrão_do_Produto (`operacao`) se ele estiver na lista de Temas permitidos. Se não estiver, SHALL retornar o primeiro Tema da lista de Temas permitidos na ordem do Catálogo_de_Temas.
7. IF a Preferência_do_Aluno salva não está no Catálogo_de_Temas ou não está na lista de Temas permitidos, THEN THE Resolvedor_de_Tema SHALL tratá-la como inexistente nos critérios 3 a 6 e manter o valor salvo sem apagá-lo nem alterá-lo.
8. IF o Tema padrão da Configuração_do_Cliente está ausente, não está no Catálogo_de_Temas ou não está na lista de Temas permitidos, THEN THE Resolvedor_de_Tema SHALL tratá-lo como ausente, deixar de aplicar os critérios 2 e 4 e seguir os critérios 5 e 6. Com a Trava_do_Cliente ativa, a Preferência_do_Aluno continua ignorada.
9. IF a Configuração_do_Cliente não existe, ou se sua lista de Temas permitidos está vazia ou não contém nenhum Identificador_de_Tema presente no Catálogo_de_Temas, THEN THE Resolvedor_de_Tema SHALL considerar permitidos todos os Temas do Catálogo_de_Temas e considerar a Trava_do_Cliente inativa.
10. THE Resolvedor_de_Tema SHALL retornar exatamente um Identificador_de_Tema contido no Catálogo_de_Temas e na lista de Temas permitidos para toda combinação de Configuração_do_Cliente, Preferência_do_Aluno e `prefers-color-scheme`.
11. THE Resolvedor_de_Tema SHALL retornar o mesmo Identificador_de_Tema sempre que for chamado mais de uma vez com as mesmas entradas, sem depender de nenhuma outra fonte de dados além de Configuração_do_Cliente, Preferência_do_Aluno e `prefers-color-scheme`.

### Requisito 4: Persistência da escolha e aplicação antes da primeira pintura

**História de usuário:** Como aluno, quero que a minha escolha de tema continue valendo na próxima visita, sem ver a tela piscar em outro tema, para que a experiência seja estável.

#### Critérios de aceitação

1. WHEN o aluno escolhe um Tema no Seletor_de_Tema, THE Sistema_de_Temas SHALL gravar o Identificador_de_Tema escolhido como Preferência_do_Aluno na chave `itfs_tema` do `localStorage` antes de concluir o tratamento da escolha, de modo que uma leitura da chave feita logo após a escolha retorne esse Identificador_de_Tema.
2. WHEN o aluno abre a aplicação em uma nova sessão do navegador (nova aba, nova janela ou navegador reiniciado), THE Sistema_de_Temas SHALL ler a Preferência_do_Aluno na chave `itfs_tema` e entregá-la ao Resolvedor_de_Tema antes que o Script_de_Inicialização_de_Tema grave o Identificador_de_Tema no elemento `html`.
3. WHEN o documento é carregado, THE Script_de_Inicialização_de_Tema SHALL gravar o Identificador_de_Tema resolvido no atributo `data-theme` do elemento `html` antes da Primeira_Pintura, de modo que o valor de `data-theme` lido na Primeira_Pintura seja igual ao Identificador_de_Tema resolvido.
4. THE Sistema_de_Temas SHALL, para todo Identificador_de_Tema do Catálogo_de_Temas, devolver na recuperação da Preferência_do_Aluno exatamente o mesmo Identificador_de_Tema que foi salvo, sem diferença de maiúsculas, minúsculas ou espaços (propriedade de ida e volta).
5. IF a gravação da Preferência_do_Aluno no `localStorage` falha ou é bloqueada pelo navegador, THEN THE Sistema_de_Temas SHALL manter o Tema escolhido aplicado até o fim da sessão atual da página, manter o Seletor_de_Tema operante e não exibir mensagem de erro ao aluno.
6. IF o valor lido na chave `itfs_tema` está vazio ou não é exatamente igual, com distinção entre maiúsculas e minúsculas, a um Identificador_de_Tema do Catálogo_de_Temas, THEN THE Sistema_de_Temas SHALL tratar a Preferência_do_Aluno como ausente, entregar ao Resolvedor_de_Tema a ausência de preferência e não gravar esse valor no atributo `data-theme`.
7. IF a leitura da chave `itfs_tema` falha ou é bloqueada pelo navegador durante a execução do Script_de_Inicialização_de_Tema, THEN THE Script_de_Inicialização_de_Tema SHALL tratar a Preferência_do_Aluno como ausente e gravar antes da Primeira_Pintura o Identificador_de_Tema resolvido a partir das demais fontes do Resolvedor_de_Tema, sem interromper o carregamento do documento.
8. WHILE a aplicação é inicializada, da Primeira_Pintura até o fim da montagem do AppShell, THE Sistema_de_Temas SHALL manter o atributo `data-theme` do elemento `html` igual ao Identificador_de_Tema gravado pelo Script_de_Inicialização_de_Tema, sem trocá-lo por outro valor, mesmo que temporário, sem uma ação do aluno.

### Requisito 5: Configuração do tema pela empresa cliente

**História de usuário:** Como responsável pela conta da empresa cliente, quero informar os temas permitidos, o tema padrão e a trava sem precisar de painel administrativo, para que a implantação seja simples nesta fase.

#### Critérios de aceitação

1. WHEN o documento é carregado, THE Sistema_de_Temas SHALL ler a Configuração_do_Cliente antes de o Resolvedor_de_Tema determinar o Tema, com três campos: lista ordenada de Identificadores_de_Tema permitidos, Identificador_de_Tema padrão (opcional) e indicador de Trava_do_Cliente com valor verdadeiro ou falso.
2. IF nenhuma Configuração_do_Cliente é fornecida, THEN THE Sistema_de_Temas SHALL considerar permitidos todos os Temas do Catálogo_de_Temas, na ordem do Catálogo_de_Temas, sem Tema padrão da Configuração_do_Cliente, com Trava_do_Cliente inativa e sem registrar aviso no console do navegador.
3. IF a lista de Temas permitidos da Configuração_do_Cliente contém um Identificador_de_Tema ausente do Catálogo_de_Temas ou repetido, THEN THE Sistema_de_Temas SHALL descartar essa ocorrência, manter a primeira ocorrência de cada identificador repetido, preservar a ordem informada dos identificadores restantes e registrar no console do navegador um aviso por ocorrência descartada que informa o identificador, sem exibir mensagem ao aluno.
4. IF o Identificador_de_Tema padrão da Configuração_do_Cliente está informado e não está na lista de Temas permitidos resultante da validação dos critérios 3 e 5, THEN THE Sistema_de_Temas SHALL usar o primeiro Tema dessa lista como Tema padrão da Configuração_do_Cliente e registrar no console do navegador um aviso que informa o identificador substituído.
5. IF a lista de Temas permitidos fica vazia após a validação do critério 3, THEN THE Sistema_de_Temas SHALL considerar permitidos todos os Temas do Catálogo_de_Temas, na ordem do Catálogo_de_Temas, e registrar no console do navegador um aviso que informa que a lista ficou vazia.
6. THE Sistema_de_Temas SHALL aceitar na Configuração_do_Cliente apenas dados de apresentação, sem chaves de API, credenciais, tokens de acesso ou dados pessoais, e SHALL manter o frontend aprovado por `scripts/check-bundle-secrets.mjs` com a Configuração_do_Cliente incluída.
7. IF a Configuração_do_Cliente não pode ser lida ou tem um dos três campos com tipo diferente do definido no critério 1 (lista que não é lista de textos, Identificador_de_Tema padrão que não é texto, indicador de Trava_do_Cliente diferente de verdadeiro ou falso), THEN THE Sistema_de_Temas SHALL tratar a Configuração_do_Cliente como não fornecida, conforme o critério 2, registrar no console do navegador um aviso que informa o campo inválido e concluir o carregamento sem exibir erro ao aluno.
8. IF a Configuração_do_Cliente contém campos além dos três definidos no critério 1, THEN THE Sistema_de_Temas SHALL ignorar esses campos, sem aplicá-los nem exibi-los na interface, e registrar no console do navegador um aviso que informa apenas o nome de cada campo ignorado, sem o valor.
9. IF a Trava_do_Cliente está ativa e a Configuração_do_Cliente não informa Identificador_de_Tema padrão, THEN THE Sistema_de_Temas SHALL usar o primeiro Tema da lista de Temas permitidos resultante da validação como Tema padrão da Configuração_do_Cliente.
10. THE Sistema_de_Temas SHALL obter a Configuração_do_Cliente somente de um arquivo JSON estático opcional, servido pela mesma origem do frontend, no caminho definido no documento de design, sem painel administrativo e sem chamada a outra origem.
11. IF o arquivo JSON da Configuração_do_Cliente não existe no caminho definido no documento de design, THEN THE Sistema_de_Temas SHALL tratar a Configuração_do_Cliente como não fornecida, conforme o critério 2.

### Requisito 6: Seletor de tema acessível

**História de usuário:** Como aluno que usa teclado ou leitor de tela, quero escolher o tema com rótulos claros, para que eu saiba qual tema está ativo sem depender de cor.

#### Critérios de aceitação

1. THE Seletor_de_Tema SHALL exibir, para cada Tema permitido, o nome visível em português registrado no Catálogo_de_Temas e a indicação textual de esquema claro ou escuro, sem truncar nenhum dos dois textos na largura mínima de 320 px CSS da janela.
2. THE Seletor_de_Tema SHALL indicar o Tema ativo por texto ou por ícone de `src/frontend/src/ui/Icone.tsx` presente somente na opção ativa, de modo que a opção ativa seja identificável com a interface em escala de cinza.
3. THE Seletor_de_Tema SHALL oferecer área de toque de no mínimo 44 por 44 px CSS, com zoom de 100%, em cada opção, no controle do Modo_Alto_Contraste e no Botão_de_Aparência, usando o Token `--touch-target`.
4. WHEN uma opção do Seletor_de_Tema, o controle do Modo_Alto_Contraste ou o Botão_de_Aparência recebe foco pelo teclado, THE Seletor_de_Tema SHALL exibir contorno de foco com o Token `--focus-ring`, 2 px de largura e 2 px de afastamento, com contraste mínimo de 3 para 1 contra a cor de fundo adjacente no Tema ativo.
5. THE Seletor_de_Tema SHALL permitir escolher e aplicar qualquer Tema permitido somente com teclado, seguindo o padrão radiogroup da WAI-ARIA Authoring Practices: a tecla Tab leva o foco à opção selecionada do grupo, as teclas de seta movem a seleção para a opção seguinte ou anterior, com retorno ao início ou ao fim do grupo, e aplicam imediatamente o Tema da opção selecionada, e a tecla Espaço seleciona e aplica a opção focada que ainda não está selecionada.
6. THE Seletor_de_Tema SHALL expor ao leitor de tela o nome acessível do grupo de botões de opção, o nome visível de cada opção, o estado selecionado somente da opção ativa e o estado ligado ou desligado do controle do Modo_Alto_Contraste.
7. WHEN o aluno aplica um novo Tema, THE Seletor_de_Tema SHALL anunciar ao leitor de tela o nome do Tema ativo uma única vez, em até 1 segundo após a aplicação, sem mover o foco do teclado.
8. WHILE a Trava_do_Cliente está ativa, THE Seletor_de_Tema SHALL exibir o nome do Tema definido pela empresa cliente acompanhado de um texto, também exposto ao leitor de tela, que informa que o Tema foi definido pela empresa cliente, SHALL deixar de oferecer opções para escolher outro Tema, incluindo o acesso por teclado, e SHALL manter disponível o controle do Modo_Alto_Contraste.
9. WHILE a lista de Temas permitidos da Configuração_do_Cliente contém um único Tema, THE Seletor_de_Tema SHALL exibir apenas o nome desse Tema, como texto e não como opção selecionável, e o controle do Modo_Alto_Contraste.
10. IF o aluno pressiona Escape ou move o foco para fora do Painel_de_Aparência com o painel aberto, THEN THE Seletor_de_Tema SHALL fechar o Painel_de_Aparência e manter o Tema ativo no momento do fechamento e, no caso de Escape, devolver o foco ao Botão_de_Aparência.
11. THE Seletor_de_Tema SHALL apresentar, em cada Tema do Catálogo_de_Temas e com o Modo_Alto_Contraste ligado ou desligado, texto com contraste WCAG_AA e tamanho mínimo de 12 px, conforme medido pela Spec_de_Contraste.
12. THE Botão_de_Aparência SHALL abrir e fechar o Painel_de_Aparência segundo o padrão disclosure da WAI-ARIA Authoring Practices, com acionamento por clique, toque, Enter ou Espaço, e SHALL expor ao leitor de tela o nome acessível do botão e o estado aberto ou fechado do Painel_de_Aparência.

### Requisito 7: Modo de alto contraste

**História de usuário:** Como aluno com baixa visão, quero ativar um modo de alto contraste mesmo quando a empresa trava o tema, para que eu consiga ler e operar o simulador.

#### Critérios de aceitação

1. THE Seletor_de_Tema SHALL oferecer um controle de ativar e desativar o Modo_Alto_Contraste que fica visível e operável em todos os estados do Seletor_de_Tema, inclusive com Trava_do_Cliente ativa e com lista de Temas permitidos de um único Tema. O controle SHALL ter área de toque de no mínimo 44 por 44 px, SHALL poder ser acionado somente com teclado e SHALL expor ao leitor de tela o nome do controle e o estado atual (ativo ou inativo).
2. WHEN o aluno ativa o Modo_Alto_Contraste, THE Sistema_de_Temas SHALL gravar o Atributo_de_Alto_Contraste no elemento `html` e aplicar por cima do Tema resolvido o Conjunto_de_Alto_Contraste do esquema desse Tema, em até 100 ms, sem recarregar a página, sem perder o estado da sessão em andamento e independentemente do estado da Trava_do_Cliente.
3. WHEN o aluno ativa ou desativa o Modo_Alto_Contraste, THE Sistema_de_Temas SHALL salvar o estado do Modo_Alto_Contraste entre sessões na chave `itfs_contraste` do `localStorage`, com as mesmas regras de persistência do Requisito 4, de forma separada da Preferência_do_Aluno e sem alterar o valor salvo da Preferência_do_Aluno.
4. WHEN o aluno desativa o Modo_Alto_Contraste, THE Sistema_de_Temas SHALL remover o Atributo_de_Alto_Contraste do elemento `html` em até 100 ms, sem recarregar a página, e manter aplicado o Tema determinado pelas regras do Requisito 3, com a Preferência_do_Aluno e a Configuração_do_Cliente vigentes.
5. WHILE o Modo_Alto_Contraste está ativo, THE Sistema_de_Temas SHALL manter, em todas as páginas e para qualquer Tema resolvido pelo Resolvedor_de_Tema, contraste de no mínimo 7 para 1 em texto normal e de no mínimo 4.5 para 1 em texto grande (no mínimo 24 px, ou no mínimo 18.66 px com peso 700 ou maior) e em componentes de interface (bordas de controles, contorno de foco e ícones de status). O Teste_de_Tokens e a Spec_de_Contraste SHALL medir esses valores e falhar com a indicação do par abaixo do limite.
6. WHEN o documento é carregado e o estado salvo do Modo_Alto_Contraste é ativo, THE Script_de_Inicialização_de_Tema SHALL gravar o Atributo_de_Alto_Contraste no elemento `html` antes da Primeira_Pintura, junto com o atributo `data-theme` do Tema resolvido.
7. IF o armazenamento do navegador está indisponível, ou se o valor salvo do Modo_Alto_Contraste está ausente ou não é reconhecido, THEN THE Sistema_de_Temas SHALL tratar o Modo_Alto_Contraste como inativo ao carregar o documento, manter o controle do Modo_Alto_Contraste funcional na sessão atual e continuar a operação sem exibir erro.
8. WHILE o Modo_Alto_Contraste está ativo, THE Sistema_de_Temas SHALL manter no elemento `html` o atributo `data-theme` com o Identificador_de_Tema resolvido, a presença ou ausência da classe `dark` e o valor de `color-scheme` do esquema desse Tema, sem trocar o Tema resolvido por outro.
9. THE Sistema_de_Temas SHALL definir em `src/frontend/src/index.css` dois Conjuntos_de_Alto_Contraste, um para esquema claro e outro para esquema escuro, cada um com valor não vazio para cada Token de cor do Contrato_de_Tokens.
10. WHILE o Modo_Alto_Contraste está ativo, THE Sistema_de_Temas SHALL usar o Conjunto_de_Alto_Contraste de esquema claro quando o Tema resolvido tem esquema claro e o Conjunto_de_Alto_Contraste de esquema escuro quando o Tema resolvido tem esquema escuro.

### Requisito 8: Contraste, responsividade e movimento em todos os temas

**História de usuário:** Como pessoa responsável pela qualidade, quero que todo tema passe pelas mesmas verificações de acessibilidade, para que nenhum tema novo reduza a acessibilidade do produto.

#### Critérios de aceitação

1. WHEN o Teste_de_Tokens é executado, THE Teste_de_Tokens SHALL medir, para cada Tema do Catálogo_de_Temas, a razão de contraste de cada par de Token de texto sobre superfície contra o mínimo de 4.5 para 1 e de cada par de Token de componente de interface sobre superfície contra o mínimo de 3 para 1.
2. IF algum par de Token medido pelo Teste_de_Tokens fica abaixo do mínimo do WCAG_AA, THEN THE Teste_de_Tokens SHALL falhar e informar o Identificador_de_Tema, os dois nomes de Token do par, a razão medida e o mínimo exigido.
3. WHEN a Spec_de_Contraste é executada, THE Spec_de_Contraste SHALL percorrer, para cada Tema do Catálogo_de_Temas, as mesmas telas e estados percorridos para os temas hoje, na main, chamados `corporate` e `tactical` (estudo em estado limpo e laboratório com missão iniciada e turno concluído) e medir a razão de contraste de cada texto visível sobre o seu fundo.
4. IF algum texto medido pela Spec_de_Contraste fica abaixo de 4.5 para 1 em texto normal ou abaixo de 3 para 1 em texto grande (no mínimo 24 px, ou no mínimo 18.66 px em negrito), THEN THE Spec_de_Contraste SHALL falhar e informar o Identificador_de_Tema, a tela, o elemento, a razão medida e o mínimo exigido.
5. WHEN a Spec_Visual é executada, THE Spec_Visual SHALL gerar, para cada Tema do Catálogo_de_Temas, uma captura de cada tela capturada para os temas hoje, na main, chamados `corporate` e `tactical`, nas larguras de 375 px e 1440 px.
6. WHILE qualquer Tema do Catálogo_de_Temas está aplicado, THE Sistema_de_Temas SHALL exibir cada página nas larguras de janela de 375, 768, 1280 e 1440 px, com altura de 900 px, sem que a largura do conteúdo do documento exceda a largura da janela.
7. WHILE qualquer Tema do Catálogo_de_Temas está aplicado e o zoom do navegador está em 200 por cento sobre uma janela de 1280 px de largura, THE Sistema_de_Temas SHALL exibir cada texto sem corte nem sobreposição, manter cada controle visível e operável e não exigir rolagem horizontal.
8. WHILE qualquer Tema do Catálogo_de_Temas está aplicado, THE Sistema_de_Temas SHALL acompanhar cada indicador que usa Token de cor de status com um texto ou com um ícone de `src/frontend/src/ui/Icone.tsx` que nomeia o estado, de modo que o estado continue identificável quando a cor é ignorada.
9. WHILE a preferência `prefers-reduced-motion: reduce` está ativa, THE Sistema_de_Temas SHALL exibir o estado final de toda animação e transição introduzida por qualquer Tema sem movimento intermediário visível e SHALL aplicar a troca de Tema de forma instantânea, sem transição.
10. WHERE um Tema introduz animação que começa sem ação do aluno e que dura mais de 5 segundos ou se repete, THE Sistema_de_Temas SHALL oferecer um controle visível, com nome acessível e operável por teclado, que pausa essa animação e a mantém pausada até o aluno retomá-la.
11. IF um Tema do Catálogo_de_Temas não é coberto pelo Teste_de_Tokens, pela Spec_de_Contraste ou pela Spec_Visual, THEN o teste que deixa de cobri-lo SHALL falhar e informar o Identificador_de_Tema ausente.
12. WHEN o Teste_de_Tokens é executado, THE Teste_de_Tokens SHALL medir os valores de Token de cada Conjunto_de_Alto_Contraste contra o mínimo de 7 para 1 em pares de texto e de 4.5 para 1 em pares de componente de interface, e falhar com as mesmas informações do critério 2 quando algum par fica abaixo desses mínimos.

### Requisito 9: Tipografia e fontes dos temas

**História de usuário:** Como aluno, quero que todo tema tenha texto legível, para que eu leia chamados e comandos sem esforço.

#### Critérios de aceitação

1. THE Sistema_de_Temas SHALL manter, em todos os Temas do Catálogo_de_Temas, com e sem Modo_Alto_Contraste ativo, tamanho de fonte calculado de no mínimo 12 px CSS, com zoom do navegador em 100%, para todo texto visível. Isso inclui rótulos, legendas, selos, textos de ajuda, textos de exemplo de campos, dicas de ferramenta, saída do terminal e números de telemetria.
2. THE Sistema_de_Temas SHALL definir, em todos os Temas, o Token `--font-mono` com uma lista de famílias em que toda família nomeada é monoespaçada, ou seja, todos os caracteres têm a mesma largura de avanço. A lista SHALL terminar na família genérica `monospace`.
3. THE Sistema_de_Temas SHALL aplicar a família do Token `--font-mono`, em todos os Temas, aos seguintes conteúdos: saída e entrada do terminal, comandos exibidos em chamados, dicas e Replay, e dados técnicos. Dados técnicos são endereços IP, nomes de host, caminhos de arquivo, identificadores de chamado e valores de log.
4. WHERE um Tema usa família de fonte diferente de Inter e de JetBrains Mono, THE Sistema_de_Temas SHALL servir todos os arquivos dessa fonte a partir da mesma origem da aplicação, incluídos no bundle do frontend. Nenhuma requisição de arquivo de fonte SHALL ser feita a origem diferente da origem da aplicação, nem durante o carregamento do documento nem depois da troca de Tema.
5. WHERE um Tema usa família de fonte diferente de Inter e de JetBrains Mono, THE documentação do Tema SHALL registrar três informações: o nome de cada arquivo de fonte adicionado com seu tamanho em kB, com uma casa decimal; a soma desses tamanhos em kB; e a justificativa da escolha da família.
6. WHERE um Tema usa família de fonte própria, THE Sistema_de_Temas SHALL não fazer nenhuma requisição aos arquivos dessa fonte enquanto outro Tema estiver aplicado, desde o carregamento do documento até a troca para esse Tema.
7. WHEN o Tema aplicado passa a ser um Tema com família de fonte própria, seja no carregamento do documento ou por escolha no Seletor_de_Tema, THE Sistema_de_Temas SHALL exibir o texto com a família de reserva declarada no Token correspondente até o arquivo da fonte terminar de carregar. Em nenhum momento desde a Primeira_Pintura o texto SHALL ficar invisível.
8. IF um arquivo de fonte própria de um Tema falha ao carregar, THEN THE Sistema_de_Temas SHALL manter o Tema aplicado e exibir o texto com a família de reserva declarada no Token correspondente. O tamanho mínimo de 12 px e a monoespaçada do Token `--font-mono` SHALL continuar valendo, e nenhuma mensagem de erro SHALL ser mostrada ao aluno.

### Requisito 10: Restrições específicas dos temas candidatos

**História de usuário:** Como responsável pela direção visual, quero regras explícitas para cada direção do Stitch, para que nenhum tema contrarie o tom definido no DESIGN.md.

#### Critérios de aceitação

1. WHERE o Tema Telemetria está no Catálogo_de_Temas, THE Tema Telemetria SHALL obter, no Teste_de_Tokens e na Spec_de_Contraste, razão de contraste de no mínimo 4.5 para 1 em todo par de texto normal sobre fundo e de no mínimo 3 para 1 em todo par de texto grande sobre fundo e de componente de interface sobre superfície, em todas as telas medidas.
2. WHERE o Tema Telemetria está no Catálogo_de_Temas, THE Tema Telemetria SHALL exibir em cada página os mesmos textos visíveis, os mesmos rótulos acessíveis e os mesmos ícones que o Tema Corporativo exibe na mesma página, sem acrescentar texto, ícone, imagem, insígnia ou elemento gráfico exclusivo do Tema Telemetria, e obtendo a estética de telemetria somente por valores de Token.
3. WHERE o Tema Acolhedor está no Catálogo_de_Temas, THE Tema Acolhedor SHALL definir o valor 12 px no Token `--radius-lg`, ser registrado no Catálogo_de_Temas com esquema de cor claro e ter luminância relativa do Token `--bg-canvas` maior que a luminância relativa do Token `--text-primary`.
4. WHERE o Tema Editorial está no Catálogo_de_Temas, THE Tema Editorial SHALL obter a hierarquia de títulos e o espaço amplo somente por valores dos Tokens de tamanho de fonte (`--font-size-*`), de peso de fonte (`--font-weight-*`) e de espaço (`--space-*`), sem regra de estilo exclusiva do Tema Editorial fora do bloco de definição de Token e com a mesma estrutura de elementos dos demais Temas.
5. THE Sistema_de_Temas SHALL separar botões, links com aparência de botão, campos e seletores vizinhos dentro do mesmo contêiner de layout somente pela propriedade `gap` com valor de um Token `--space-*`, sem margem externa aplicada a esses controles para afastá-los entre si.
6. WHERE o Tema Telemetria está no Catálogo_de_Temas, THE Tema Telemetria SHALL definir valor de no mínimo 12 px em todo Token de tamanho de fonte e exibir todo texto visível com tamanho de fonte calculado de no mínimo 12 px.
7. IF o Tema Telemetria fica abaixo de algum limite dos critérios 1 ou 6, THEN THE Teste_de_Tokens ou a Spec_de_Contraste SHALL falhar e informar o Identificador_de_Tema, o par de Token ou o elemento medido e o valor obtido.

### Requisito 11: Separação entre tema e motor determinístico

**História de usuário:** Como pessoa responsável pela auditoria, quero que o tema nunca influencie estado ou avaliação, para que o Replay e a nota do Juiz 360 sejam iguais em qualquer tema.

#### Critérios de aceitação

1. THE Sistema_de_Temas SHALL tratar o Tema e o Modo_Alto_Contraste como preferências de apresentação, sem incluir Identificador_de_Tema nem o estado do Modo_Alto_Contraste no corpo, nos parâmetros ou nos cabeçalhos de qualquer requisição de ação, de comando simulado ou de avaliação enviada ao Motor_Determinístico.
2. WHEN a mesma sequência de ações do aluno é executada no mesmo cenário, com o mesmo relógio simulado e a mesma semente, uma vez em cada Tema do Catálogo_de_Temas, com e sem Modo_Alto_Contraste, THE Motor_Determinístico SHALL produzir sequências de eventos de domínio com a mesma quantidade, a mesma ordem, os mesmos tipos e o mesmo conteúdo.
3. WHEN a mesma sequência de ações do aluno é executada nas condições do critério 2, THE Juiz_360 SHALL produzir, em cada Tema, a mesma nota final, o mesmo resultado para cada critério binário observável e o mesmo cálculo de SLA.
4. WHEN o aluno troca de Tema ou ativa ou desativa o Modo_Alto_Contraste durante uma sessão de cenário, THE Motor_Determinístico SHALL manter o estado do cenário e a contagem de SLA inalterados e SHALL não registrar nenhum evento de domínio por causa da troca.
5. WHERE a Preferência_do_Aluno é persistida no backend, THE backend SHALL guardar a Preferência_do_Aluno fora do fluxo de eventos de avaliação do Juiz_360 e fora do Replay, de modo que a reconstrução de estado e o Replay de uma sessão produzam o mesmo resultado com ou sem a Preferência_do_Aluno guardada.
6. WHEN o Replay de uma sessão é exibido, THE Sistema_de_Temas SHALL aplicar somente o Tema resolvido no momento da exibição, sem restaurar o Tema em uso durante a sessão original e sem alterar a ordem ou o conteúdo dos eventos exibidos.
7. IF o Identificador_de_Tema ou o estado do Modo_Alto_Contraste aparece em qualquer evento de domínio gerado pela execução dos cenários do teste de integração do backend, THEN THE teste de integração do backend SHALL falhar e informar o tipo de evento e o cenário em que o valor apareceu.

### Requisito 12: Sincronização com o arquivo Figma

**História de usuário:** Como pessoa designer, quero que cada tema exista também no Figma, para que design e código usem os mesmos valores.

#### Critérios de aceitação

1. THE Arquivo_Figma SHALL conter, na coleção de variáveis Cor, exatamente um modo para cada Tema do Catálogo_de_Temas, cujo nome seja idêntico ao Identificador_de_Tema, inclusive em letras maiúsculas e minúsculas. A coleção não deve ter nenhum modo sem Tema correspondente no Catálogo_de_Temas.
2. THE Arquivo_Figma SHALL conter, em cada modo da coleção Cor, uma variável para cada Token de cor do Contrato_de_Tokens. O nome da variável é igual ao nome do Token sem o prefixo `--`. Os canais vermelho, verde e azul são iguais, na escala de 0 a 255, aos do valor declarado para o mesmo Tema em `src/frontend/src/index.css`, e o canal alfa difere no máximo 0,01.
3. IF o plano do Figma limitar o número de modos da coleção Cor a um número menor que o de Temas do Catálogo_de_Temas, THEN THE documento de design SHALL registrar o limite de modos do plano, a data do registro e a lista dos Identificadores_de_Tema que ficam fora do Arquivo_Figma. Os temas `operacao` e `corporativo` permanecem sempre no Arquivo_Figma.
4. WHEN o valor de um Token muda em `src/frontend/src/index.css` ou um Tema é adicionado ou removido do Catálogo_de_Temas, THE documento de design SHALL registrar, na mesma alteração submetida ao repositório, o nome do Token ou o Identificador_de_Tema afetado, o valor anterior, o valor novo e a confirmação de que o Arquivo_Figma recebeu a mesma mudança.
5. THE Arquivo_Figma SHALL conter, nas coleções Espaco e raio e Tipografia, uma variável para cada Token de espaço, raio e tipografia do Contrato_de_Tokens. O nome da variável é igual ao nome do Token sem o prefixo `--`. Cada coleção tem um modo por Tema sempre que o valor de algum de seus Tokens variar entre Temas. Os valores numéricos são iguais, em pixels, aos de `src/frontend/src/index.css`, com conversão de rem na base de 16 px. A família de fonte é idêntica ao primeiro nome da lista de famílias declarada para o Token.
6. IF um Token do Contrato_de_Tokens não tiver tipo de variável equivalente no Figma, como os Tokens de sombra, THEN THE documento de design SHALL listar esse Token como exceção à sincronização, com o valor declarado em `src/frontend/src/index.css` para cada Tema.
7. IF o Arquivo_Figma não puder ser atualizado na mesma alteração submetida ao repositório, THEN THE documento de design SHALL registrar a divergência como pendente, com o nome do Token, o Identificador_de_Tema, o valor no código e o valor no Arquivo_Figma, e SHALL manter o registro até a divergência ser resolvida. Enquanto a divergência durar, o valor de `src/frontend/src/index.css` prevalece.

### Requisito 13: Conformidade com as regras do repositório

**História de usuário:** Como pessoa mantenedora, quero que a funcionalidade siga as regras do repositório, para que a PR possa ser revisada sem retrabalho.

#### Critérios de aceitação

1. THE Sistema_de_Temas SHALL usar a palavra "e" ou vírgula, com zero ocorrências do símbolo E comercial, em todo nome visível de Tema do Catálogo_de_Temas, em todo rótulo e texto visível do Seletor_de_Tema, em todo nome de componente e em todo documento criado ou alterado pela funcionalidade. Os operadores lógicos do código-fonte e os seletores de CSS não contam como texto visível.
2. THE Sistema_de_Temas SHALL exibir ícones somente pelo componente `src/frontend/src/ui/Icone.tsx`, com tamanho de 16 px ou 20 px, e com zero caracteres de emoji em nomes de Tema, rótulos, textos visíveis e documentos da funcionalidade.
3. THE Sistema_de_Temas SHALL aplicar estilos somente por classes de CSS e por Tokens, com zero atributos `style` inline nos componentes da funcionalidade. O Script_de_Inicialização_de_Tema SHALL aplicar o Tema somente pelo atributo `data-theme` e o Modo_Alto_Contraste somente pelo Atributo_de_Alto_Contraste, ambos no elemento `html`, sem gravar estilos inline nesse elemento.
4. THE Sistema_de_Temas SHALL funcionar sem acrescentar Tailwind, shadcn ou qualquer biblioteca de animação às dependências do frontend, e a lista de dependências do frontend SHALL conter zero desses pacotes após a entrega.
5. THE Sistema_de_Temas SHALL implementar o Seletor_de_Tema, o Botão_de_Aparência e o Painel_de_Aparência sem Radix, sem React Aria e sem outra biblioteca de componentes de acessibilidade, conforme a decisão D9 registrada neste documento, mantendo a lista de dependências do frontend sem essas bibliotecas.
6. IF uma entrega futura exigir Radix ou React Aria para um componente complexo do Seletor_de_Tema, THEN THE Sistema_de_Temas SHALL usar somente uma dessas duas bibliotecas, e somente depois que a nova decisão do usuário estiver registrada por escrito no documento de design desta funcionalidade, com a biblioteca escolhida e o motivo.
7. THE Sistema_de_Temas SHALL usar somente dados sintéticos da empresa fictícia Aurora Logística, do domínio `aurora.local`, em exemplos, capturas da Spec_Visual e testes, com zero nomes de pessoas reais, endereços de e-mail reais, credenciais, tokens de acesso ou dados de clientes reais.
8. THE Sistema_de_Temas SHALL manter o bundle do frontend sem segredos e sem variável com prefixo `VITE_` que guarde segredo, e a verificação `scripts/check-bundle-secrets.mjs` SHALL terminar com sucesso durante o build do frontend.
9. IF a verificação `scripts/check-bundle-secrets.mjs` detectar um segredo no bundle do frontend, THEN o build do frontend SHALL falhar e indicar a verificação de segredos como causa, sem gerar artefato de publicação.
10. WHEN a PR da funcionalidade for submetida para revisão, THE Sistema_de_Temas SHALL ter o lint, os testes unitários em execução única e o build do frontend concluídos com zero erros, e os testes do backend SHALL passar sem nenhuma alteração em arquivos do Motor_Determinístico nem em `docs/vetores-jcs-sha256.json`.

### Requisito 14: Terminal do SimuDesk

**História de usuário:** Como aluno, quero que o terminal mantenha a mesma aparência escura em qualquer tema, para que a leitura da saída monoespaçada seja estável enquanto trabalho.

#### Critérios de aceitação

1. WHILE o Modo_Alto_Contraste está inativo, THE Sistema_de_Temas SHALL apresentar o Terminal_do_SimuDesk em esquema escuro, com os valores de Token do Tema `operacao`, para todo Tema do Catálogo_de_Temas aplicado ao elemento `html`.
2. WHILE o Modo_Alto_Contraste está ativo, THE Sistema_de_Temas SHALL apresentar o Terminal_do_SimuDesk com os valores do Conjunto_de_Alto_Contraste de esquema escuro, para todo Tema do Catálogo_de_Temas aplicado ao elemento `html`, inclusive Temas de esquema claro.
3. WHEN o Sistema_de_Temas aplica um novo Tema durante o uso, THE Sistema_de_Temas SHALL manter no Terminal_do_SimuDesk os mesmos valores de Token que valiam antes da troca, desde que o estado do Modo_Alto_Contraste não mude.
4. WHEN o Teste_de_Tokens é executado, THE Teste_de_Tokens SHALL medir os pares de Token de texto sobre superfície do Terminal_do_SimuDesk com os valores do Tema `operacao` contra o mínimo de 4.5 para 1 e com os valores do Conjunto_de_Alto_Contraste de esquema escuro contra o mínimo de 7 para 1, e falhar informando os dois nomes de Token do par, a razão medida e o mínimo exigido.
5. WHEN a Spec_de_Contraste é executada, THE Spec_de_Contraste SHALL verificar, para cada Tema do Catálogo_de_Temas, com o Modo_Alto_Contraste ativo e inativo, que a cor de fundo e a cor de texto calculadas do Terminal_do_SimuDesk são iguais às do valor de Token esperado pelos critérios 1 e 2.
6. IF a cor de fundo ou a cor de texto calculada do Terminal_do_SimuDesk difere da esperada pelos critérios 1 e 2, THEN THE Spec_de_Contraste SHALL falhar e informar o Identificador_de_Tema, o estado do Modo_Alto_Contraste, a cor obtida e a cor esperada.

## Decisões registradas

Decisões aprovadas pelo usuário. As antigas Questões em aberto 1 a 9, 11 e 12 estão resolvidas pelos itens abaixo.

- **D1. Tema_Padrão_do_Produto (antiga Questão 7):** `operacao` (Operação, escuro). Hoje, na main, o padrão é o tema chamado `tactical` em `src/frontend/src/shell/tema.ts` e em `src/frontend/index.html`, que passa a se chamar `operacao`. A sugestão por `prefers-color-scheme` do Requisito 3, critério 5, continua valendo. Como o Catálogo_de_Temas começa pelo tema escuro padrão, quem prefere escuro ou não informa preferência recebe `operacao`, e quem informa `light` recebe o primeiro tema claro do Catálogo_de_Temas, `corporativo`.
- **D2. Nomes visíveis e identificadores (antiga Questão 8):** o Identificador_de_Tema de cada Tema é o nome verdadeiro do Tema, em letras minúsculas e sem acento. Nomes visíveis, sem termos militares: `operacao` é "Operação" (escuro), `corporativo` é "Corporativo" (claro), `editorial` é "Editorial" (escuro), `acolhedor` é "Acolhedor" (claro) e `telemetria` é "Telemetria" (escuro, entrega futura), nome da direção antes chamada Cockpit. Os rótulos "Modo Cockpit Tático - Treinamento" e "Console Corporativo - Auditoria B2B" são substituídos. Ordem do Catálogo_de_Temas: `operacao`, `corporativo`, `editorial`, `acolhedor`, e `telemetria` depois, quando entrar.
- **D3. Terminal do SimuDesk (antiga Questão 9):** o terminal fica sempre em esquema escuro, com o conjunto de Tokens de `operacao`, em todos os Temas. Motivo: é ferramenta de trabalho, mantém estável a leitura da saída monoespaçada e já é medido pelo Teste_de_Tokens. Exceção: com o Modo_Alto_Contraste ativo, o terminal usa o Conjunto_de_Alto_Contraste de esquema escuro. Ver Requisito 14.
- **D4. Primeira entrega (antiga Questão 1):** Operação (`operacao`), Corporativo (`corporativo`), Editorial (`editorial`), Acolhedor (`acolhedor`) e o Modo_Alto_Contraste. Telemetria fica para uma entrega seguinte, condicionada aos critérios do Requisito 10.
- **D5. Persistência da Preferência_do_Aluno (antiga Questão 2):** apenas `localStorage`, na chave `itfs_tema`, nesta entrega. A persistência no backend fica fora de escopo; o Requisito 11, critério 5, vale apenas se ela for adotada no futuro.
- **D6. Configuração_do_Cliente (antiga Questão 3):** arquivo JSON estático opcional, servido pela mesma origem do frontend, em caminho a definir no design, sem painel administrativo. Quem publica a implantação do cliente é quem altera o arquivo. Ver Requisito 5, critérios 10 e 11.
- **D7. Forma do Modo_Alto_Contraste (antiga Questão 4):** ajuste aplicado sobre o Tema resolvido por um Atributo_de_Alto_Contraste no elemento `html`, com dois Conjuntos_de_Alto_Contraste, um de esquema claro e outro de esquema escuro, preservando o esquema do Tema resolvido. O Resolvedor_de_Tema continua resolvendo o Tema normalmente; com a Trava_do_Cliente ativa, o Tema travado continua resolvido e o alto contraste é aplicado por cima. Ver Requisito 3, critérios 1 e 10, e Requisito 7.
- **D8. Precedência e `prefers-color-scheme` (antigas Questões 5 e 6):** a precedência do Requisito 3 e o uso de `prefers-color-scheme` como sugestão inicial estão confirmados.
- **D9. Tipo de controle do Seletor_de_Tema (antiga Questão 12):** grupo de botões de opção, no padrão WAI-ARIA radiogroup, dentro do Painel_de_Aparência, aberto pelo Botão_de_Aparência da barra superior, no padrão WAI-ARIA disclosure, sem Radix e sem React Aria. No radiogroup, as setas mudam a seleção e aplicam o Tema imediatamente; Escape fecha o Painel_de_Aparência e devolve o foco ao Botão_de_Aparência. O anúncio ao leitor de tela continua valendo. Ver Requisito 6, critérios 5, 7, 10 e 12, e Requisito 13, critério 5.
- **D10. Identificadores novos, sem compatibilidade:** o produto não tem usuários e não existe preferência salva a preservar. Os identificadores `corporate` e `tactical` deixam de existir no código, sem camada de compatibilidade nem migração de valores salvos por versões anteriores. O atributo `data-theme`, os seletores de CSS de `src/frontend/src/index.css`, `src/frontend/src/shell/tema.ts`, `src/frontend/index.html`, o Teste_de_Tokens, a Spec_de_Contraste, a Spec_Visual e os modos do Arquivo_Figma passam a usar somente `operacao`, `corporativo`, `editorial` e `acolhedor`. Um valor antigo encontrado no navegador é tratado como Preferência_do_Aluno ausente, conforme o Requisito 4, critério 6.
- **D11. Chaves de `localStorage`:** `itfs_tema` guarda a Preferência_do_Aluno e substitui a chave `itfs_theme`, que deixa de ser lida e gravada. `itfs_contraste` guarda o estado do Modo_Alto_Contraste. Ver Requisito 4 e Requisito 7, critério 3.

### A resolver no design

- **Enumeração de N temas nos testes (antiga Questão 11):** o Teste_de_Tokens localiza os blocos dos temas hoje, na main, chamados `corporate` e `tactical` por expressão regular fixa. O design define como o Teste_de_Tokens, a Spec_de_Contraste e a Spec_Visual enumeram os Temas do Catálogo_de_Temas e os Conjuntos_de_Alto_Contraste.
- **Caminho e leitura da Configuração_do_Cliente:** o design define o caminho do arquivo JSON e como o Script_de_Inicialização_de_Tema obtém a Configuração_do_Cliente sem descumprir a aplicação antes da Primeira_Pintura (Requisito 4, critério 3, e Requisito 5, critério 1).
- **Nome do Atributo_de_Alto_Contraste** e os valores gravados na chave `itfs_contraste` para os estados ativo e inativo.

### Questão em aberto

- **Limite de modos do Figma (antiga Questão 10):** verificar no design o limite de modos do plano do Figma (plano Education) para a coleção Cor antes de criar os modos novos. O Requisito 12, critério 3, define o registro caso o limite seja menor que o número de Temas.

### Ações fora deste arquivo

- Corrigir o DESIGN.md para indicar `operacao` (Operação) como Tema_Padrão_do_Produto, em lugar do tema hoje, na main, chamado `corporate`, e para usar os identificadores novos da decisão D10.
- Renomear no Arquivo_Figma os modos `corporate` e `tactical` da coleção Cor, e das coleções Espaco e raio e Tipografia quando tiverem modos por Tema, para `corporativo` e `operacao`, conforme o Requisito 12, critério 1, e a decisão D10.

## Fora de escopo

- Variar a disposição (layout) das páginas por Tema.
- Painel administrativo para a empresa cliente configurar Temas.
- Mudanças no Motor_Determinístico, nos eventos de domínio ou nos critérios do Juiz_360.
- Materiais do pitch (capa, vídeo, slides).
- Tema Telemetria nesta entrega. O tema entra numa entrega seguinte, condicionado aos critérios do Requisito 10.
- Persistência da Preferência_do_Aluno e do estado do Modo_Alto_Contraste no backend.
