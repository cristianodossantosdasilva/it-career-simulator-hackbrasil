# Requirements Document

## Introduction

O IT Career Simulator é um orientador de carreira em TI pela prática. A pessoa experimenta a rotina simulada de uma profissão na empresa fictícia Aurora Logística (domínio `aurora.local`), recebe uma avaliação por critérios observáveis calculada pelo motor determinístico do backend e decide o próximo passo. O produto não é diagnóstico psicológico, não decide a carreira pela pessoa e não promete emprego.

Esta funcionalidade organiza o frontend como uma Jornada de Missão com páginas reais, cada uma com endereço próprio:

1. Início (`/`): apresentação do produto e demonstração do diagnóstico.
2. Diagnóstico (`/diagnostico`): roteiro vocacional fixo, com perguntas e respostas em catálogo e regras determinísticas que indicam a rota e geram o Cartão de Perfil.
3. Plano de Carreira (`/plano-de-carreira`): rota Suporte de TI com as etapas Help Desk N1, Service Desk N1 Jr, N2 Pleno e N3 Sênior, a etapa N3 Sênior dividida em três vertentes à escolha da pessoa, botão Iniciar e convite para ser assistente.
4. Mesa de Trabalho (`/mesa-de-trabalho/:missao`): o turno de atendimento já existente (SimuDesk, chat com usuários simulados, acesso remoto simulado).
5. Revisão (`/revisao/:sessao`): o Replay cronológico e a avaliação do Juiz 360º já existentes.
6. Brevê (`/portfolio`): registro dos missões concluídos.
7. Catálogo (`/catalogo`): catálogos de rotas, certificações mapeadas e parceiros, com status.
8. Aulas (`/aulas`, com o Treino de explicação em `/aulas/treino`), Caderno (`/caderno`) e Mentor (`/mentor`): páginas reais com endereço próprio.

O Mentor é o guia de orientação da jornada e muda de papel por fase: Consultor no Início e no Diagnóstico, Instrutor no Plano de Carreira, Assistente na Mesa de Trabalho e Mentor na Revisão e no Brevê. O Mentor orienta e não altera estado nem avalia. Toda mudança de estado do domínio, todo comando simulado, todo cálculo de SLA e toda avaliação continuam no motor determinístico (`src/backend/src/Simulador.Dominio` e `src/backend/src/Simulador.Avaliacao`).

Restrições de entrega:

- Prazo: 30 de novembro de 2026, com escopo de 7,5 a 10 dias de trabalho.
- Backend sem mudança e nenhum endpoint novo. O backend publicado (`render.yaml`) usa o Event Store com provedor Postgres e prazo de 30 dias por sessão (`EventStore__Provedor: Postgres` e `Sessao__TtlDias: "30"`). Depois desse prazo, ou após reinício em desenvolvimento local sem provedor configurado (provedor em memória), o Backend responde que a sessão não existe ou expirou, e o Frontend informa que ela não está mais disponível no servidor. O roteiro do diagnóstico roda sem rede e sem IA.
- Persistência nova somente no frontend. O frontend guarda localmente o Cartão de Perfil, o resumo de cada missão concluído, os missões ativos e a escolha do modo de demonstração, para que Brevê e Catálogo não dependam da sessão no servidor.
- O Catálogo de Rotas distribui 7 cenários pelas 4 etapas, conforme as decisões confirmadas listadas abaixo: os 5 cenários existentes no Backend (`pasta-rede-inacessivel`, `triagem-engenharia-social`, `incidente-massivo`, `sre-cloud-latencia` e `diagnostico-sql-readonly`) e 2 cenários novos (`reset-senha-desbloqueio` e `falha-backup-restore`). Os cenários novos e as causas novas dos cenários existentes são implementados no Backend pela spec `cenarios-por-etapa`. Esta spec não altera o Backend: enquanto o Backend não oferece um cenário ou uma causa, o Catálogo de Rotas marca esse item como em preparação, e a interface mostra o item com texto honesto e sem botão Iniciar. Quando o Backend passar a oferecer o item, basta trocar o status no catálogo.
- Regulamento do Hack Brasil 2026, regra 7.4: os jurados podem avaliar o projeto pela demonstração. Por isso a jornada oferece um modo de demonstração que libera todas as etapas sem alterar a avaliação (Requirement 17).
- Referência de conteúdo do diagnóstico, somente leitura: `src/frontend/src/home/catalogoVocacional.ts` e `src/frontend/src/home/HomeVocacional.tsx` na branch `home-vocacional`.
- Regras visuais e de acessibilidade: `docs/design/DESIGN.md` (seções 3 e 4). Regras de domínio e de arquitetura: `AGENTS.md`.

Decisões confirmadas no documento de design:

- Navegação: roteador próprio do Frontend sobre a History API do navegador, sem biblioteca de roteamento nova.
- Endereços de Aulas, Caderno e Mentor: `/aulas`, `/aulas/treino` (Treino de explicação), `/caderno` e `/mentor`.
- Título do documento no formato "Página, IT Career Simulator", por exemplo "Plano de Carreira, IT Career Simulator".
- Chaves do Armazenamento_Local criadas por esta funcionalidade: `itfs_cartao_embarque`, `itfs_registros_missao`, `itfs_missoes_ativas` e `itfs_modo_demonstracao`.
- Distribuição dos cenários pelas Etapas, revisada para refletir a divisão de responsabilidades do mercado:
  - Etapa 1, Help Desk N1: cenário novo `reset-senha-desbloqueio` (reset de senha e desbloqueio de conta com verificação de identidade antes de agir). Status inicial: em preparação. A triagem de engenharia social sai do N1, porque é responsabilidade do time de segurança.
  - Etapa 2, Service Desk N1 Jr: `pasta-rede-inacessivel`, disponível.
  - Etapa 3, N2 Pleno: `incidente-massivo`, disponível.
  - Etapa 4, N3 Sênior, com três Vertentes à escolha da pessoa, todas liberadas juntas quando a Etapa 4 é liberada: N3-A Redes e Nuvem com `sre-cloud-latencia`, disponível; N3-B Data Center e Backup com o cenário novo `falha-backup-restore`, em preparação; N3-C Segurança e Dados com `triagem-engenharia-social` e `diagnostico-sql-readonly`, disponíveis.
- Lista final de Causas por cenário, escolhida para impressionar na demonstração do hackathon sem estourar o prazo de 30 de novembro de 2026. As causas novas e os cenários novos são implementados no Backend pela spec `cenarios-por-etapa`.
  - `reset-senha-desbloqueio` (Help Desk N1), cenário em preparação, com as três causas em preparação:
    - SENHA_ESQUECIDA: reset com senha temporária e troca obrigatória no primeiro acesso, só depois de verificar a identidade. Justificativa: é o chamado mais frequente do N1 e ensina que a verificação de identidade vem antes da ação.
    - CONTA_BLOQUEADA: desbloqueio e identificação da origem das tentativas, um celular com a senha antiga. Justificativa: mostra que desbloquear sem achar a origem faz a conta bloquear de novo, o que diferencia diagnóstico de reação.
    - SENHA_EXPIRADA: orientar a troca pela própria pessoa, sem reset. Justificativa: ensina a não executar uma ação desnecessária quando a pessoa resolve sozinha com orientação.
    - Em todas as causas, o pedido pode chegar por terceiro (o gestor pedindo pela colaboradora) e a verificação de identidade vem antes de qualquer ação. Justificativa: o pedido por terceiro é a armadilha de engenharia social mais comum no N1 e dá à demonstração um momento de decisão visível para a banca.
  - `pasta-rede-inacessivel` (Service Desk N1 Jr), cenário disponível:
    - C1 falta de grupo de segurança, C2 DNS e C3 serviço parado, disponíveis. Justificativa: já existem no Backend e sustentam a Missão_de_Demonstração.
    - C4 unidade de rede não mapeada, com solicitação de mapeamento, em preparação. Justificativa: acrescenta um caso de solicitação, e não de incidente, que é a distinção central do Service Desk.
  - `incidente-massivo` (N2 Pleno), cenário disponível:
    - GATEWAY: serviço AuroraGateway parado após atualização, disponível. Justificativa: já existe no Backend e mostra a relação entre mudança e incidente.
    - EMAIL_PROVEDOR: provedor de e-mail fora do ar, em preparação. Justificativa: ensina a reconhecer falha de fornecedor externo, em que o N2 comunica e acompanha em vez de consertar.
    - DOMINIO_SUSPENSO: o registrador suspendeu o domínio público fictício `aurora-logistica.example` na internet porque a fatura da mensalidade não foi paga, então o DNS público deixa de responder e site e e-mail param ao mesmo tempo; o N2 confirma pelo status do domínio, aciona financeiro e fornecedor, comunica o incidente e acompanha a reativação. Em preparação. Justificativa: é um incidente massivo de causa não técnica, fácil de entender pela banca, que exige coordenação entre áreas. O nome `aurora.local` continua como domínio interno, e o domínio público usa um nome reservado para exemplos.
    - As causas DNS e BOLETO foram removidas. Justificativa: DNS já aparece em C2 de `pasta-rede-inacessivel` e na causa DOMINIO_SUSPENSO, e BOLETO exigiria uma integração bancária simulada que não cabe no prazo.
  - `sre-cloud-latencia` (N3-A Redes e Nuvem), cenário disponível, com as causas OOM_KILLED, POOL_EXHAUSTED e CERT_EXPIRED, disponíveis. Justificativa: as três já existem no Backend e cobrem memória, banco de dados e certificado sem trabalho novo.
  - `falha-backup-restore` (N3-B Data Center e Backup), cenário em preparação, com duas causas em preparação:
    - REPOSITORIO_CHEIO: o job de backup falha porque o repositório lotou. Justificativa: é a falha de backup mais comum e tem diagnóstico claro pelo log do job.
    - CADEIA_CORROMPIDA: restaurar a pasta do Financeiro a partir da cópia imutável porque a cadeia incremental está corrompida. Justificativa: mostra o valor da cópia imutável num restore real, o momento de maior impacto da Vertente.
    - O cenário fica com duas causas por causa do prazo.
  - `triagem-engenharia-social` e `diagnostico-sql-readonly` (N3-C Segurança e Dados), cenários disponíveis, sem causas novas. Justificativa: já funcionam no Backend, e o prazo vai para os cenários novos.
- Não existe Etapa depois da N3 Sênior. O Brevê de analista exige ao menos um Voo_Concluído em cada uma das Etapas 1, 2 e 3 e em ao menos uma Vertente da Etapa 4 (Requirement 9).
- Portão de Etapa: uma Etapa é liberada quando a Etapa anterior tem Registro de Missão para todas as suas Missões disponíveis. Uma Etapa sem nenhuma Missão disponível não trava a Etapa seguinte, para que a jornada não fique sem saída enquanto as Missões dela estão em preparação.
- Missões e causas em preparação aparecem no Plano de Carreira e no Catálogo, visíveis e sem botão Iniciar. Uma causa em preparação não torna a Missão indisponível: a Missão continua disponível com as causas que o Backend já oferece, e a seleção da causa continua com o Backend.
- Missão_de_Demonstração: `pasta-rede-inacessivel`.
- Os componentes `TelaInicial` e `TabelaMissoes` são aposentados ao final da migração. O conteúdo reaproveitado passa para as Páginas da jornada.
- Persistência de sessões: o Backend publicado guarda as sessões no Event Store Postgres por 30 dias. A frase anterior que dizia que as sessões ficavam só em memória foi corrigida. Esta funcionalidade não muda essa configuração.

Fora do escopo:

- Contas de usuário, login e sincronização entre dispositivos.
- Mudança na persistência de sessões no servidor e qualquer alteração em `src/backend`.
- Implementação no Backend dos cenários `reset-senha-desbloqueio` e `falha-backup-restore` e das causas SENHA_ESQUECIDA, CONTA_BLOQUEADA, SENHA_EXPIRADA, C4, EMAIL_PROVEDOR, DOMINIO_SUSPENSO, REPOSITORIO_CHEIO e CADEIA_CORROMPIDA, que pertencem à spec `cenarios-por-etapa`.
- Rotas além de Suporte de TI com conteúdo jogável.
- Integração real com parceiros ou emissores de certificação.
- Avaliação, nota ou recomendação gerada por IA.

## Glossary

- **Frontend**: aplicação React 19 com TypeScript e Vite em `src/frontend`.
- **Backend**: API .NET 10 em `src/backend`, que contém o motor determinístico, o Event Store (provedor Postgres no ambiente publicado, com prazo de 30 dias por sessão, e provedor em memória em desenvolvimento local sem provedor configurado) e o Juiz 360º. Esta funcionalidade não altera o Backend.
- **Navegador_de_Páginas**: roteador próprio do Frontend, construído sobre a History API do navegador, que associa cada Endereço_de_Página a uma Página, atualiza o histórico do navegador e trata links diretos.
- **Página**: tela do Frontend com Endereço_de_Página próprio, título visível de nível 1 e título de documento próprio.
- **Endereço_de_Página**: caminho da URL que identifica uma Página, por exemplo `/plano-de-carreira`.
- **Menu_Principal**: lista de navegação do Frontend com um item por Página de destino (Início, Plano de Carreira, Brevê, Catálogo, Aulas, Caderno e Mentor, e demais itens definidos no design).
- **Página_404**: Página exibida para um Endereço_de_Página que não corresponde a nenhuma Página conhecida.
- **Roteiro_de_Diagnóstico**: sequência fixa de perguntas de escolha única, definida no Catálogo_Vocacional.
- **Catálogo_Vocacional**: módulo estático do Frontend com as perguntas, as opções de resposta, os textos de orientação, os limites do guia e as Regras_de_Indicação.
- **Regras_de_Indicação**: função determinística do Frontend que recebe o conjunto de respostas do Roteiro_de_Diagnóstico e devolve exatamente uma Rota do Catálogo_de_Rotas e o texto de justificativa correspondente.
- **Rota**: percurso de profissão do Catálogo_de_Rotas, por exemplo Suporte de TI.
- **Etapa**: etapa ordenada de uma Rota. A Rota Suporte de TI tem as Etapas Help Desk N1 (Etapa 1), Service Desk N1 Jr (Etapa 2), N2 Pleno (Etapa 3) e N3 Sênior (Etapa 4), nessa ordem. A N3 Sênior é a última Etapa da Rota e é dividida em Vertentes.
- **Vertente**: subgrupo rotulado da Etapa N3 Sênior que reúne Missões de uma especialidade, escolhido pelo participante. A Etapa N3 Sênior tem três Vertentes: N3-A Redes e Nuvem, N3-B Data Center e Backup, e N3-C Segurança e Dados. As três Vertentes compartilham o estado de liberação da Etapa N3 Sênior.
- **Missão**: cenário do Backend associado a uma Etapa e, na Etapa N3 Sênior, a uma Vertente, identificado pelo identificador do cenário (por exemplo `pasta-rede-inacessivel`) e com um Status_de_Disponibilidade no Catálogo_de_Rotas. Missão disponível é cenário que o Backend oferece hoje. Missão em preparação é cenário que o Backend ainda não oferece.
- **Causa**: variação de uma Missão que o Backend seleciona ao criar a sessão, identificada por um código do cenário (por exemplo C1 ou GATEWAY), com um Status_de_Disponibilidade no Catálogo_de_Rotas. Causa em preparação é variação que o Backend ainda não oferece.
- **Escala_Cumprida**: Etapa em que toda Missão com Status_de_Disponibilidade disponível tem Registro de Missão. Para o portão da Etapa seguinte, uma Etapa sem nenhuma Missão disponível também conta como Escala_Cumprida.
- **Portfólio_de_Piloto**: conquista exibida na Página Brevê, calculada somente a partir dos Registros de Missão, que exige ao menos um Registro de Missão em cada uma das Etapas Help Desk N1, Service Desk N1 Jr e N2 Pleno e ao menos um Registro de Missão em uma das Vertentes da Etapa N3 Sênior.
- **Cartão de Perfil**: registro local gerado ao final do Diagnóstico, com a Rota indicada, a primeira Etapa, os identificadores das respostas, a versão do Roteiro_de_Diagnóstico e a data de emissão.
- **Missão**: execução de uma Missão em uma sessão do Backend.
- **Voo_Concluído**: Missão cuja sessão terminou e cuja avaliação do Juiz 360º foi recebida pelo Frontend.
- **Registro de Missão**: resumo local de um Voo_Concluído, com identificador da Missão, versão do cenário, identificador da sessão, Etapa, Vertente quando a Etapa é N3 Sênior, data de conclusão e o resultado da avaliação copiado da resposta do Juiz 360º.
- **Armazenamento_Local**: `localStorage` do navegador, usado pelo Frontend para guardar o Cartão de Perfil (chave `itfs_cartao_embarque`), os Registros de Missão (chave `itfs_registros_missao`), os missões ativos (chave `itfs_missoes_ativas`) e a escolha do Modo_de_Demonstração (chave `itfs_modo_demonstracao`).
- **Modo_de_Demonstração**: atalho de avaliação para a banca do Hack Brasil 2026, ativado pelo participante no Plano de Carreira ou pelo Atalho_Experimentar, que libera todas as Etapas sem criar Registro de Missão e sem alterar a avaliação.
- **Atalho_Experimentar**: botão "Experimentar uma missão agora" da Página Início, que leva ao Diagnóstico Rápido e depois à Mesa de Trabalho da Missão_de_Demonstração com o Modo_de_Demonstração ativo.
- **Diagnóstico Rápido**: caminho do Diagnóstico com o menor número de passos definido no documento de design, que gera um Cartão de Perfil da Rota Suporte de TI.
- **Missão_de_Demonstração**: Missão `pasta-rede-inacessivel`, da Etapa Service Desk N1 Jr.
- **Escala_Bloqueada**: Etapa cuja Etapa anterior não é Escala_Cumprida, enquanto o Modo_de_Demonstração está inativo.
- **Escala_Liberada**: primeira Etapa da Rota, Etapa cuja Etapa anterior é Escala_Cumprida, ou qualquer Etapa enquanto o Modo_de_Demonstração está ativo. Quando a Etapa N3 Sênior é Escala_Liberada, as três Vertentes estão liberadas.
- **Escala_Liberada_por_Demonstração**: Etapa que seria Escala_Bloqueada com o Modo_de_Demonstração inativo e que está liberada somente porque o Modo_de_Demonstração está ativo.
- **Mentor**: guia de orientação do Frontend, com conteúdo escrito em catálogo, que muda de Papel_do_Comandante conforme a Página.
- **Papel_do_Comandante**: um dos quatro papéis do Mentor: Consultor, Instrutor, Assistente ou Mentor.
- **Catálogo_de_Rotas**: módulo estático do Frontend com as Rotas, suas Etapas, as Vertentes da Etapa N3 Sênior, as Missões de cada Etapa ou Vertente, as Causas registradas de cada Missão e o Status_de_Disponibilidade de cada Rota, Missão e Causa.
- **Catálogo_de_Certificações**: módulo estático do Frontend com certificações de mercado mapeadas para Rotas e Etapas, cada uma com Status_de_Disponibilidade.
- **Catálogo_de_Parceiros**: módulo estático do Frontend com os parceiros previstos, cada um com Status_de_Disponibilidade.
- **Status_de_Disponibilidade**: valor de catálogo com um destes três valores: disponível, em preparação ou futuro.
- **Convite_Copiloto**: bloco informativo do Plano de Carreira que convida a pessoa a ser assistente do projeto, com texto vindo de catálogo, sem formulário e sem envio de dados.
- **Juiz_360**: componente de avaliação do Backend (`Simulador.Avaliacao`), única autoridade de avaliação técnica.
- **Aviso_Honesto**: mensagem visível que descreve o que aconteceu em linguagem simples, sem inventar dados, e oferece ao menos uma ação de continuação.
- **Verificação_de_Segredos**: script `scripts/check-bundle-secrets.mjs`, executado no build do Frontend.
- **Larguras_de_Referência**: larguras de janela de 375, 768, 1280 e 1440 px.
- **WCAG_AA**: nível AA da WCAG 2.2: contraste de 4.5 para 1 em texto normal e de 3 para 1 em texto grande e em componentes de interface.

## Requirements

### Requirement 1: Páginas reais com endereço próprio

**User Story:** Como participante, quero que cada item do menu abra uma página com endereço próprio, para que eu possa voltar, avançar, recarregar e compartilhar o link sem perder o lugar.

#### Acceptance Criteria

1. THE Navegador_de_Páginas SHALL associar um Endereço_de_Página único a cada Página: Início em `/`, Diagnóstico em `/diagnostico`, Plano de Carreira em `/plano-de-carreira`, Mesa de Trabalho em `/mesa-de-trabalho/:missao`, Revisão em `/revisao/:sessao`, Brevê em `/portfolio`, Catálogo em `/catalogo`, Aulas em `/aulas`, Treino de explicação em `/aulas/treino`, Caderno em `/caderno` e Mentor em `/mentor`.
2. WHEN o participante seleciona um item do Menu_Principal, THE Navegador_de_Páginas SHALL exibir a Página correspondente e acrescentar o Endereço_de_Página dessa Página ao histórico do navegador.
3. WHEN o participante usa os comandos voltar ou avançar do navegador, THE Navegador_de_Páginas SHALL exibir a Página correspondente ao Endereço_de_Página da entrada de histórico selecionada.
4. WHEN o navegador abre um Endereço_de_Página conhecido por link direto ou por recarga, THE Navegador_de_Páginas SHALL exibir a Página correspondente, sujeita às regras de acesso do Requirement 5.
5. WHEN o Frontend publicado recebe uma requisição para um Endereço_de_Página do critério 1, THE configuração de publicação do Frontend SHALL responder com o documento da aplicação, para que o Navegador_de_Páginas exiba a Página correspondente.
6. THE Menu_Principal SHALL marcar o item da Página exibida com `aria-current="page"` e com indicação visível que não dependa só de cor.
7. THE Navegador_de_Páginas SHALL associar cada Página a um único item do Menu_Principal ou a um fluxo de origem, de modo que nenhuma Página exiba o conteúdo de outra Página no mesmo Endereço_de_Página.

### Requirement 2: Título do documento e foco a cada navegação

**User Story:** Como participante que usa leitor de tela ou teclado, quero saber em que página estou depois de cada navegação, para que eu não precise procurar o início do conteúdo.

#### Acceptance Criteria

1. WHEN o Navegador_de_Páginas exibe uma Página, THE Navegador_de_Páginas SHALL definir o título do documento no formato "Página, IT Career Simulator", com o nome da Página no lugar de "Página".
2. WHEN o Navegador_de_Páginas exibe uma Página a partir de uma navegação dentro do Frontend, THE Navegador_de_Páginas SHALL mover o foco para o título de nível 1 dessa Página.
3. THE Página SHALL ter exatamente um título de nível 1, com texto igual ao nome da Página usado no título do documento.
4. WHEN o foco é movido para o título de nível 1, THE Página SHALL exibir o indicador de foco definido pelo token `--focus-ring`.

### Requirement 3: Início

**User Story:** Como visitante, quero entender o produto e ver como funciona o diagnóstico antes de começar, para que eu decida se quero iniciar.

#### Acceptance Criteria

1. THE Página Início SHALL exibir a apresentação do produto, a demonstração do Roteiro_de_Diagnóstico com ao menos uma pergunta de exemplo do Catálogo_Vocacional, e um botão que leva a `/diagnostico`.
2. THE Página Início SHALL exibir os limites do Mentor definidos no Catálogo_Vocacional: o guia não faz diagnóstico psicológico, não decide a carreira pela pessoa, não promete emprego, salário ou resultado, não avalia desempenho e não substitui um orientador humano.
3. WHILE existe um Cartão de Perfil válido no Armazenamento_Local, THE Página Início SHALL exibir um botão que leva a `/plano-de-carreira`.
4. THE demonstração do diagnóstico na Página Início SHALL funcionar sem gravar Cartão de Perfil no Armazenamento_Local.

### Requirement 4: Diagnóstico vocacional determinístico

**User Story:** Como visitante, quero responder a um roteiro curto e receber uma rota indicada com justificativa, para que eu saiba por onde começar sem depender de IA.

#### Acceptance Criteria

1. THE Página Diagnóstico SHALL apresentar as perguntas do Roteiro_de_Diagnóstico na ordem do Catálogo_Vocacional, uma pergunta por vez, com opções de escolha única.
2. THE Página Diagnóstico SHALL permitir voltar à pergunta anterior e trocar a resposta antes da indicação da Rota.
3. WHEN o participante responde a última pergunta do Roteiro_de_Diagnóstico, THE Regras_de_Indicação SHALL devolver exatamente uma Rota do Catálogo_de_Rotas e o texto de justificativa correspondente.
4. THE Regras_de_Indicação SHALL devolver a mesma Rota e o mesmo texto de justificativa para o mesmo conjunto de respostas e a mesma versão do Roteiro_de_Diagnóstico.
5. THE Regras_de_Indicação SHALL ter uma Rota definida para cada combinação possível de respostas do Roteiro_de_Diagnóstico.
6. THE Página Diagnóstico SHALL executar o Roteiro_de_Diagnóstico e as Regras_de_Indicação sem requisição de rede.
7. WHEN a Rota indicada tem Status_de_Disponibilidade disponível e o participante confirma a indicação, THE Frontend SHALL gravar o Cartão de Perfil no Armazenamento_Local e exibir o Cartão de Perfil com a Rota, a primeira Etapa e um botão que leva a `/plano-de-carreira`.
8. IF a Rota indicada tem Status_de_Disponibilidade em preparação ou futuro, THEN THE Página Diagnóstico SHALL exibir o status dessa Rota em texto e oferecer a Rota Suporte de TI como Rota disponível para gerar o Cartão de Perfil.
9. WHEN o participante refaz o Diagnóstico e confirma uma nova indicação, THE Frontend SHALL substituir o Cartão de Perfil anterior e manter os Registros de Missão existentes.
10. THE Página Diagnóstico SHALL exibir, junto da indicação, o texto do Catálogo_Vocacional que informa que a indicação é um ponto de partida e que a decisão é do participante.

### Requirement 5: Portões leves da jornada

**User Story:** Como participante, quero ser levado ao diagnóstico quando ainda não tenho Cartão de Perfil e ver as etapas futuras como bloqueadas, para que eu siga a jornada na ordem sem ficar sem saída.

O portão de Cartão de Perfil vale com o Modo_de_Demonstração ativo ou inativo. O portão de Etapa vale somente com o Modo_de_Demonstração inativo (Requirement 17).

#### Acceptance Criteria

1. IF o navegador abre `/plano-de-carreira` ou `/mesa-de-trabalho/:missao` sem Cartão de Perfil válido no Armazenamento_Local, THEN THE Navegador_de_Páginas SHALL substituir a entrada atual do histórico por `/diagnostico` e exibir na Página Diagnóstico um Aviso_Honesto que explica a necessidade do Cartão de Perfil, com o Modo_de_Demonstração ativo ou inativo.
2. THE Página Plano de Carreira SHALL exibir todas as Etapas da Rota do Cartão de Perfil, inclusive as Escalas_Bloqueadas.
3. WHILE o Modo_de_Demonstração está inativo e uma Etapa é Escala_Bloqueada, THE Página Plano de Carreira SHALL marcar essa Etapa com o texto "Bloqueada" e um ícone, informar qual Etapa precisa ser concluída antes e manter desabilitado o botão Iniciar das Missões dessa Etapa.
4. IF o Modo_de_Demonstração está inativo e o navegador abre `/mesa-de-trabalho/:missao` para uma Missão de Escala_Bloqueada, THEN THE Página Mesa de Trabalho SHALL exibir um Aviso_Honesto com um link para `/plano-de-carreira`, sem criar sessão no Backend.
5. WHEN uma Etapa passa a ser Escala_Cumprida, THE Página Plano de Carreira SHALL exibir a Etapa seguinte como Escala_Liberada.
6. IF o conteúdo do Armazenamento_Local para o Cartão de Perfil, para os Registros de Missão, para os missões ativos ou para o Modo_de_Demonstração está ausente, corrompido ou em versão desconhecida, THEN THE Frontend SHALL tratar o dado inválido como ausente e continuar a navegação sem erro não tratado.
7. WHILE o Modo_de_Demonstração está ativo, THE Frontend SHALL liberar o acesso a `/mesa-de-trabalho/:missao` para as Missões disponíveis de todas as Etapas e Vertentes e manter habilitado o botão Iniciar dessas Missões.
8. IF o navegador abre `/mesa-de-trabalho/:missao` para uma Missão com Status_de_Disponibilidade em preparação, THEN THE Página Mesa de Trabalho SHALL exibir um Aviso_Honesto que informa que o cenário ainda está em preparação no simulador, com um link para `/plano-de-carreira`, sem criar sessão no Backend, com o Modo_de_Demonstração ativo ou inativo.
9. WHILE o Modo_de_Demonstração está inativo e uma Etapa não tem nenhuma Missão com Status_de_Disponibilidade disponível, THE Página Plano de Carreira SHALL tratar essa Etapa como Escala_Cumprida para o portão da Etapa seguinte e exibir na Etapa seguinte o texto que informa que ela está liberada porque as Missões da Etapa anterior estão em preparação.
10. WHEN a Etapa N3 Sênior passa a ser Escala_Liberada, THE Página Plano de Carreira SHALL exibir as Vertentes N3-A Redes e Nuvem, N3-B Data Center e Backup, e N3-C Segurança e Dados como liberadas ao mesmo tempo.

### Requirement 6: Plano de Carreira

**User Story:** Como participante com Cartão de Perfil, quero ver a rota, as etapas, as missões e as certificações relacionadas, para que eu escolha onde iniciar.

#### Acceptance Criteria

1. THE Página Plano de Carreira SHALL exibir a Rota Suporte de TI com as Etapas Help Desk N1, Service Desk N1 Jr, N2 Pleno e N3 Sênior, nessa ordem, a partir do Catálogo_de_Rotas.
2. THE Página Plano de Carreira SHALL exibir a Etapa N3 Sênior com as três Vertentes como subgrupos rotulados, nesta ordem: N3-A Redes e Nuvem, N3-B Data Center e Backup, e N3-C Segurança e Dados, cada Vertente com título visível e com as Missões dessa Vertente.
3. THE Catálogo_de_Rotas SHALL associar cada um dos 7 cenários a exatamente uma Etapa e, na Etapa N3 Sênior, a exatamente uma Vertente: `reset-senha-desbloqueio` a Help Desk N1; `pasta-rede-inacessivel` a Service Desk N1 Jr; `incidente-massivo` a N2 Pleno; `sre-cloud-latencia` à Vertente N3-A Redes e Nuvem; `falha-backup-restore` à Vertente N3-B Data Center e Backup; e `triagem-engenharia-social` e `diagnostico-sql-readonly` à Vertente N3-C Segurança e Dados.
4. THE Catálogo_de_Rotas SHALL atribuir o Status_de_Disponibilidade em preparação às Missões `reset-senha-desbloqueio` e `falha-backup-restore` e o Status_de_Disponibilidade disponível às Missões `pasta-rede-inacessivel`, `incidente-massivo`, `sre-cloud-latencia`, `triagem-engenharia-social` e `diagnostico-sql-readonly`.
5. THE Catálogo_de_Rotas SHALL registrar as Causas destas Missões com o Status_de_Disponibilidade indicado: `reset-senha-desbloqueio` com SENHA_ESQUECIDA, CONTA_BLOQUEADA e SENHA_EXPIRADA em preparação; `pasta-rede-inacessivel` com C1, C2 e C3 disponíveis e C4 em preparação; `incidente-massivo` com GATEWAY disponível e EMAIL_PROVEDOR e DOMINIO_SUSPENSO em preparação; `sre-cloud-latencia` com OOM_KILLED, POOL_EXHAUSTED e CERT_EXPIRED disponíveis; e `falha-backup-restore` com REPOSITORIO_CHEIO e CADEIA_CORROMPIDA em preparação.
6. THE Página Plano de Carreira SHALL exibir, para cada Missão, o nome, a Etapa, a Vertente quando a Etapa é N3 Sênior, e o estado em texto: disponível, em preparação, bloqueada ou concluída.
7. WHILE uma Missão tem Status_de_Disponibilidade em preparação, THE Página Plano de Carreira SHALL exibir essa Missão com o texto "Em preparação", um ícone e um texto honesto que informa que o cenário ainda não está disponível no simulador, sem botão Iniciar, com o Modo_de_Demonstração ativo ou inativo.
8. WHILE uma Missão disponível tem ao menos uma Causa em preparação, THE Página Plano de Carreira SHALL exibir junto dessa Missão a quantidade de Causas disponíveis e a quantidade de Causas em preparação, sem exibir o nome nem a descrição das Causas, e manter o botão Iniciar dessa Missão conforme o estado da Etapa.
9. WHEN o participante aciona o botão Iniciar de uma Missão disponível de Escala_Liberada, THE Navegador_de_Páginas SHALL exibir `/mesa-de-trabalho/:missao` com o identificador dessa Missão.
10. THE Página Plano de Carreira SHALL exibir as certificações do Catálogo_de_Certificações mapeadas para cada Etapa, com o Status_de_Disponibilidade em texto.
11. THE Página Plano de Carreira SHALL exibir o Convite_Copiloto com o texto do catálogo, sem campo de formulário e sem requisição de rede.

### Requirement 7: Mesa de Trabalho

**User Story:** Como participante, quero que a mesa de trabalho tenha endereço próprio e retome o turno ao recarregar, para que um recarregamento não me faça perder o atendimento.

#### Acceptance Criteria

1. WHEN o participante abre `/mesa-de-trabalho/:missao` para uma Missão de Escala_Liberada sem sessão ativa registrada para essa Missão, THE Página Mesa de Trabalho SHALL criar a sessão pelo endpoint existente do Backend e exibir o turno de atendimento existente.
2. WHEN o participante recarrega `/mesa-de-trabalho/:missao` com sessão ativa registrada no Armazenamento_Local para essa Missão e o Backend devolve essa sessão, THE Página Mesa de Trabalho SHALL retomar o turno dessa sessão sem criar outra sessão.
3. IF o Backend informa que a sessão registrada para a Missão não existe, THEN THE Página Mesa de Trabalho SHALL exibir um Aviso_Honesto que informa que a sessão não está mais disponível no servidor e um botão para refazer a Missão.
4. WHEN o participante aciona o botão para refazer a Missão, THE Página Mesa de Trabalho SHALL criar uma sessão nova pelo endpoint existente do Backend.
5. WHEN o Frontend recebe a avaliação do Juiz_360 ao final de um Missão, THE Frontend SHALL gravar o Registro de Missão no Armazenamento_Local e oferecer um link para `/revisao/:sessao` dessa sessão.
6. THE Página Mesa de Trabalho SHALL enviar ao Backend somente as ações do participante pelos endpoints existentes, e THE Backend SHALL decidir toda mudança de estado, comando simulado e cálculo de SLA.
7. WHEN a Página Mesa de Trabalho cria uma sessão a partir da jornada, THE Página Mesa de Trabalho SHALL enviar ao Backend somente o identificador da Missão, sem Causa forçada, para que o Backend selecione a Causa entre as que oferece.

### Requirement 8: Revisão

**User Story:** Como participante, quero rever a linha do tempo e a avaliação de uma missão pelo link da sessão, para que eu entenda minhas decisões.

#### Acceptance Criteria

1. WHEN o navegador abre `/revisao/:sessao` e o Backend devolve os eventos e a avaliação dessa sessão, THE Página Revisão SHALL exibir o Replay cronológico e a avaliação do Juiz_360 existentes.
2. IF o Backend informa que a sessão de `/revisao/:sessao` não existe, THEN THE Página Revisão SHALL exibir um Aviso_Honesto que informa que a sessão não está mais disponível no servidor, um botão para refazer a Missão quando o Registro de Missão local identifica a Missão, e um link para `/portfolio`.
3. IF o Backend informa que a sessão não existe e existe Registro de Missão local para essa sessão, THEN THE Página Revisão SHALL exibir o resumo do Registro de Missão identificado como resumo local, sem exibir eventos que não estão no Registro de Missão.
4. IF a requisição ao Backend falha por erro de rede, THEN THE Página Revisão SHALL exibir um Aviso_Honesto com um botão para tentar de novo.

### Requirement 9: Brevê

**User Story:** Como participante, quero ver os missões que concluí mesmo depois que a sessão expirar no servidor, para que eu acompanhe minha progressão.

#### Acceptance Criteria

1. THE Página Brevê SHALL exibir os Registros de Missão do Armazenamento_Local agrupados por Etapa e, na Etapa N3 Sênior, por Vertente, com Missão, data de conclusão e resultado copiado da avaliação do Juiz_360.
2. THE Página Brevê SHALL montar a lista de Voos_Concluídos somente a partir do Armazenamento_Local, sem requisição ao Backend.
3. THE Página Brevê SHALL exibir, para cada Registro de Missão, um link para `/revisao/:sessao` da sessão registrada.
4. WHILE não existe Registro de Missão no Armazenamento_Local, THE Página Brevê SHALL exibir um estado vazio com um link para `/plano-de-carreira`.
5. THE Frontend SHALL exibir no Brevê o resultado de avaliação exatamente como recebido do Juiz_360, sem recalcular critérios nem pontuação.
6. THE Página Brevê SHALL exibir a seção Portfólio_de_Piloto com quatro exigências, cada uma com o estado em texto cumprida ou pendente: ao menos um Voo_Concluído na Etapa Help Desk N1, ao menos um Voo_Concluído na Etapa Service Desk N1 Jr, ao menos um Voo_Concluído na Etapa N2 Pleno e ao menos um Voo_Concluído em uma das Vertentes da Etapa N3 Sênior.
7. WHEN o Armazenamento_Local tem ao menos um Registro de Missão em cada uma das Etapas Help Desk N1, Service Desk N1 Jr e N2 Pleno e ao menos um Registro de Missão em uma das Vertentes da Etapa N3 Sênior, THE Página Brevê SHALL exibir o Portfólio_de_Piloto como conquistado, com texto e ícone.
8. WHILE alguma exigência do Portfólio_de_Piloto está pendente, THE Página Brevê SHALL exibir o Portfólio_de_Piloto como pendente, com texto e ícone, e indicar em texto cada exigência pendente.
9. IF uma exigência do Portfólio_de_Piloto está pendente e a Etapa correspondente não tem nenhuma Missão com Status_de_Disponibilidade disponível, THEN THE Página Brevê SHALL informar em texto que essa exigência aguarda Missão em preparação no simulador.
10. THE Frontend SHALL calcular o Portfólio_de_Piloto somente a partir dos Registros de Missão do Armazenamento_Local, sem requisição ao Backend, sem chave nova no Armazenamento_Local e sem considerar o Modo_de_Demonstração.

### Requirement 10: Catálogo e ganchos de catálogo

**User Story:** Como visitante ou participante, quero ver as rotas, certificações e parceiros previstos com o status de cada um, para que eu saiba o que existe hoje e o que vem depois.

#### Acceptance Criteria

1. THE Página Catálogo SHALL exibir os itens do Catálogo_de_Rotas, do Catálogo_de_Certificações e do Catálogo_de_Parceiros, cada item com o Status_de_Disponibilidade em texto e ícone.
2. THE Catálogo_de_Rotas, THE Catálogo_de_Certificações e THE Catálogo_de_Parceiros SHALL atribuir a cada item, inclusive a cada Missão e a cada Causa registrada, exatamente um Status_de_Disponibilidade entre disponível, em preparação e futuro.
3. THE Página Catálogo e THE Página Plano de Carreira SHALL obter Rotas, Etapas, Vertentes, Missões, Causas, certificações e parceiros somente dos catálogos, sem lista duplicada em componente.
4. THE Catálogo_de_Rotas SHALL marcar a Rota Suporte de TI como disponível e as demais Rotas como em preparação ou futuro.
5. THE Catálogo_de_Certificações SHALL descrever cada certificação como referência de mercado, sem afirmar parceria, equivalência oficial ou emissão de certificado pelo produto.
6. THE Catálogo_de_Parceiros SHALL usar somente descrições genéricas ou nomes fictícios enquanto não houver acordo registrado, sem nome de empresa real.
7. WHEN um item de catálogo muda de Status_de_Disponibilidade, THE Página Catálogo e THE Página Plano de Carreira SHALL refletir o novo status com alteração somente no catálogo.
8. THE Página Catálogo SHALL exibir as Missões da Rota Suporte de TI agrupadas por Etapa e, na Etapa N3 Sênior, por Vertente, com o Status_de_Disponibilidade de cada Missão em texto e ícone, inclusive as Missões em preparação.
9. WHEN uma Missão muda de Status_de_Disponibilidade em preparação para disponível no Catálogo_de_Rotas, THE Página Plano de Carreira SHALL exibir o botão Iniciar dessa Missão conforme o estado da Etapa, sem alteração em componente.

### Requirement 11: Mentor por fase

**User Story:** Como participante, quero um guia que mude de papel conforme a fase da jornada, para que eu receba orientação adequada sem que o guia me avalie.

#### Acceptance Criteria

1. THE Mentor SHALL assumir o Papel_do_Comandante Consultor nas Páginas Início e Diagnóstico, Instrutor na Página Plano de Carreira, Assistente na Página Mesa de Trabalho e Mentor nas Páginas Revisão e Brevê.
2. THE Mentor SHALL exibir o nome do Papel_do_Comandante ativo em texto na área do Mentor.
3. THE Página Mentor SHALL ter Endereço_de_Página próprio e explicar os quatro Papéis_do_Comandante e os limites do guia definidos no Catálogo_Vocacional.
4. THE Mentor SHALL usar somente textos de catálogo do Frontend e os canais de orientação já existentes no Backend, sem endpoint novo.
5. THE Mentor SHALL limitar-se a orientar, sem enviar ao Backend ação que crie evento, sem exibir nota, aprovação ou reprovação e sem alterar Cartão de Perfil ou Registro de Missão.
6. THE Juiz_360 SHALL permanecer a única fonte da avaliação exibida na Mesa de Trabalho, na Revisão e no Brevê.

### Requirement 12: Aulas, Caderno e Mentor como páginas

**User Story:** Como participante, quero abrir Aulas, Caderno e Mentor por endereço próprio, para que eu volte a eles pelo histórico ou por link.

#### Acceptance Criteria

1. THE Navegador_de_Páginas SHALL exibir Aulas, Caderno e Mentor como Páginas com Endereço_de_Página próprio, título de nível 1 e título de documento próprio.
2. THE Página Aulas e THE Página Caderno SHALL manter o conteúdo e o comportamento das telas atuais `AulasView` e `CadernoView`.
3. WHEN o participante abre Aulas, Caderno ou Mentor durante um Missão e volta à Mesa de Trabalho pelo histórico ou pelo Menu_Principal, THE Página Mesa de Trabalho SHALL retomar a sessão ativa sem criar outra sessão.

### Requirement 13: Página 404 honesta

**User Story:** Como participante que abriu um link errado, quero uma página que diga que o endereço não existe e me dê um caminho de volta, para que eu não fique preso.

#### Acceptance Criteria

1. IF o navegador abre um Endereço_de_Página que não corresponde a nenhuma Página conhecida, THEN THE Navegador_de_Páginas SHALL exibir a Página_404 com o caminho solicitado, um link para `/` e, com Cartão de Perfil válido, um link para `/plano-de-carreira`.
2. IF o navegador abre `/mesa-de-trabalho/:missao` com identificador que não existe no Catálogo_de_Rotas, THEN THE Navegador_de_Páginas SHALL exibir a Página_404 com o identificador informado e um link para `/plano-de-carreira`.
3. THE Página_404 SHALL definir o título do documento e mover o foco conforme o Requirement 2.

### Requirement 14: Acessibilidade

**User Story:** Como participante com deficiência visual, motora ou sensibilidade a movimento, quero que todas as páginas da jornada sigam as regras de acessibilidade do DESIGN.md, para que eu complete a jornada.

#### Acceptance Criteria

1. THE Frontend SHALL atender WCAG_AA de contraste em todas as Páginas da jornada, em todos os temas do Frontend.
2. THE Frontend SHALL exibir foco visível em todo controle das Páginas da jornada, com o token `--focus-ring`, 2 px de largura e 2 px de afastamento.
3. THE Frontend SHALL dar a todo controle das Páginas da jornada alvo de toque de no mínimo 44 px, pelo token `--touch-target`.
4. THE Frontend SHALL permitir completar Diagnóstico, Plano de Carreira, Iniciar, Revisão, Brevê e Catálogo somente com teclado.
5. THE Frontend SHALL indicar todo estado (disponível, em preparação, futuro, bloqueada, concluída, liberada para demonstração, Modo_de_Demonstração ativo ou inativo, Papel_do_Comandante ativo, Portfólio_de_Piloto conquistado ou pendente, exigência cumprida ou pendente) com texto ou ícone junto da cor.
6. WHERE o navegador informa `prefers-reduced-motion: reduce`, THE Frontend SHALL parar todo movimento das Páginas da jornada que dure mais de 5 segundos ou que se repita.
7. WHEN o Frontend exibe um Aviso_Honesto, THE Frontend SHALL anunciar o Aviso_Honesto a tecnologias assistivas por região viva ou por foco no aviso.
8. THE Página Plano de Carreira SHALL expor cada Vertente da Etapa N3 Sênior a tecnologias assistivas como grupo com nome acessível igual ao rótulo visível da Vertente.

### Requirement 15: Responsividade

**User Story:** Como participante em celular ou em desktop, quero usar a jornada em qualquer largura de tela, para que eu não perca conteúdo.

#### Acceptance Criteria

1. THE Frontend SHALL exibir cada Página da jornada nas Larguras_de_Referência sem rolagem horizontal da página.
2. THE Frontend SHALL exibir cada Página da jornada com zoom de 200 por cento sem perda de conteúdo nem de função.
3. WHILE a largura da janela é de 375 px, THE Menu_Principal SHALL dar acesso a todos os seus itens.

### Requirement 16: Conformidade com o AGENTS.md e o DESIGN.md

**User Story:** Como mantenedor do repositório, quero que a jornada siga as regras de domínio, conteúdo e segurança do projeto, para que a entrega passe na revisão e no CI.

#### Acceptance Criteria

1. THE Frontend SHALL usar a palavra "e" ou vírgula, sem o símbolo E comercial, em textos visíveis, títulos, nomes de componente, nomes de arquivo e documentos da jornada.
2. THE Frontend SHALL usar somente dados sintéticos da Aurora Logística nos catálogos e textos da jornada, sem dados reais de pessoas, chamados, clientes, credenciais ou tokens.
3. THE Frontend SHALL usar ícones somente de `src/frontend/src/ui/Icone.tsx` e `catalogoIcones.ts`, nos tamanhos 16 e 20, sem emoji como ícone.
4. THE Frontend SHALL estilizar as Páginas da jornada por tokens e classes CSS, sem estilo inline e sem cor fora dos blocos de token de `src/frontend/src/index.css`.
5. THE Frontend SHALL manter a Verificação_de_Segredos passando no build, sem chave de API nem segredo no bundle e sem variável com prefixo `VITE_` que guarde segredo.
6. THE entrega SHALL manter os arquivos de `src/backend` e `docs/vetores-jcs-sha256.json` sem alteração, com `dotnet test src/backend/Simulador.slnx` passando.
7. THE entrega SHALL passar em `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build` executados em `src/frontend`.
8. THE Frontend SHALL exibir a interface sem imitar a identidade visual de sistemas operacionais proprietários.

### Requirement 17: Modo de demonstração para a banca

**User Story:** Como jurado do Hack Brasil 2026, quero liberar todas as etapas e entrar num missão em poucos passos, para que eu avalie N2 e N3 pela demonstração, como permite a regra 7.4 do regulamento, sem precisar concluir as etapas anteriores.

#### Acceptance Criteria

1. THE Página Plano de Carreira SHALL exibir um controle visível com o rótulo em texto "Liberar todas as etapas para demonstração", acompanhado de um texto que explica que o controle é um atalho de avaliação e que a liberação não conta como missão concluído.
2. WHEN o participante ativa o controle do Modo_de_Demonstração, THE Frontend SHALL ativar o Modo_de_Demonstração e gravar a escolha na chave `itfs_modo_demonstracao` do Armazenamento_Local.
3. WHILE o Modo_de_Demonstração está ativo, THE Página Plano de Carreira SHALL exibir todas as Etapas da Rota como Escala_Liberada, inclusive as três Vertentes da Etapa N3 Sênior, e manter sem botão Iniciar as Missões em preparação.
4. WHILE o Modo_de_Demonstração está ativo, THE Página Plano de Carreira SHALL exibir em cada Etapa o selo em texto "Liberada para demonstração", com ícone.
5. WHEN o Frontend carrega qualquer Página com o Modo_de_Demonstração gravado como ativo na chave `itfs_modo_demonstracao`, THE Frontend SHALL restaurar o Modo_de_Demonstração ativo.
6. WHEN o participante desativa o controle do Modo_de_Demonstração, THE Frontend SHALL desativar o Modo_de_Demonstração, gravar a escolha na chave `itfs_modo_demonstracao` e exibir o estado de cada Etapa calculado somente a partir dos Registros de Missão.
7. THE Modo_de_Demonstração SHALL liberar Etapas sem criar, alterar ou remover Registro de Missão.
8. THE Frontend SHALL tratar o Modo_de_Demonstração somente no Frontend, sem enviar ao Backend informação ou ação ligada ao Modo_de_Demonstração, para que a avaliação do Juiz_360 seja a mesma com o Modo_de_Demonstração ativo ou inativo.
9. THE Página Brevê SHALL exibir somente Registros de Missão de Voos_Concluídos, sem exibir Escala_Liberada_por_Demonstração como Etapa concluída e sem contar Escala_Liberada_por_Demonstração como exigência cumprida do Portfólio_de_Piloto.
10. THE Página Plano de Carreira SHALL marcar uma Missão como concluída somente quando existe Registro de Missão dessa Missão, com o Modo_de_Demonstração ativo ou inativo.
11. THE Página Início SHALL exibir o Atalho_Experimentar com o texto "Experimentar uma missão agora".
12. WHEN o participante aciona o Atalho_Experimentar sem Cartão de Perfil válido no Armazenamento_Local, THE Navegador_de_Páginas SHALL exibir `/diagnostico` no Diagnóstico Rápido.
13. WHEN o participante conclui o Diagnóstico Rápido iniciado pelo Atalho_Experimentar, THE Frontend SHALL gravar o Cartão de Perfil, ativar o Modo_de_Demonstração, gravar a escolha na chave `itfs_modo_demonstracao` e exibir `/mesa-de-trabalho/pasta-rede-inacessivel`.
14. IF o participante aciona o Atalho_Experimentar com Cartão de Perfil válido no Armazenamento_Local, THEN THE Frontend SHALL ativar o Modo_de_Demonstração, gravar a escolha na chave `itfs_modo_demonstracao` e exibir `/mesa-de-trabalho/pasta-rede-inacessivel`, sem refazer o Diagnóstico e sem substituir o Cartão de Perfil.
15. THE controle do Modo_de_Demonstração e o Atalho_Experimentar SHALL ter alvo de toque de no mínimo 44 px, pelo token `--touch-target`, e foco visível pelo token `--focus-ring`.
16. THE controle do Modo_de_Demonstração SHALL expor a tecnologias assistivas o estado ativado ou desativado pelo papel e pelo atributo de estado do controle.
17. WHEN o estado do Modo_de_Demonstração muda, THE Frontend SHALL anunciar o novo estado em texto por região viva.
