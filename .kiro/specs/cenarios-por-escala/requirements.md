# Requirements Document

## Introduction

Esta funcionalidade entrega no Backend (.NET 10, `src/backend`) os cenários e as Causas que a spec `jornada-de-voo` marca como em preparação: 2 cenários novos e 8 Causas novas, cada item com Motor, Juiz_360, pistas e testes. O Frontend não muda aqui. A tarefa 18 da `jornada-de-voo` troca os status no Catálogo_de_Rotas depois que cada item chega ao Backend.

Itens entregues, na ordem de implementação (cada item é entregável sozinho, com checkpoint e commit local):

1. `reset-senha-desbloqueio` (Escala Help Desk N1), com a Causa SENHA_ESQUECIDA.
2. Causa CONTA_BLOQUEADA de `reset-senha-desbloqueio`.
3. Causa SENHA_EXPIRADA de `reset-senha-desbloqueio`.
4. Causa C4 (unidade de rede não mapeada) de `pasta-rede-inacessivel`.
5. `falha-backup-restore` (Vertente N3-B), com a Causa REPOSITORIO_CHEIO.
6. Causa CADEIA_CORROMPIDA de `falha-backup-restore`.
7. Causa EMAIL_PROVEDOR de `incidente-massivo`.
8. Causa DOMINIO_SUSPENSO de `incidente-massivo`.
9. Ativação das Causas novas de cenários já existentes no sorteio, com portão de confirmação do usuário.

Prazo: tudo commitado antes de 30 de novembro de 2026, 23h59 (congelamento do repositório). Push e merge só com autorização explícita do usuário.

### Decisões confirmadas na spec `jornada-de-voo` (texto de origem)

- Escala 1, Help Desk N1: cenário `reset-senha-desbloqueio`, com verificação de identidade antes de agir. A triagem de engenharia social sai do N1.
- `reset-senha-desbloqueio`:
  - SENHA_ESQUECIDA: reset com senha temporária e troca obrigatória no primeiro acesso, só depois de verificar a identidade.
  - CONTA_BLOQUEADA: desbloqueio e identificação da origem das tentativas, um celular com a senha antiga. Desbloquear sem achar a origem faz a conta bloquear de novo.
  - SENHA_EXPIRADA: orientar a troca pela própria pessoa, sem reset.
  - Em todas as Causas o pedido pode chegar por terceiro (o gestor pedindo pela colaboradora) e a verificação de identidade vem antes de qualquer ação.
- `pasta-rede-inacessivel`: C1, C2 e C3 existem. C4, unidade de rede não mapeada, é uma solicitação de mapeamento e não um incidente.
- `incidente-massivo`: EMAIL_PROVEDOR (falha de fornecedor externo, o N2 comunica e acompanha em vez de consertar) e DOMINIO_SUSPENSO (o registrador suspendeu o domínio público fictício `aurora-logistica.example` por fatura não paga, o DNS público para, o N2 confirma pelo status do domínio, aciona financeiro e fornecedor, comunica e acompanha). O domínio interno continua `aurora.local`.
- `falha-backup-restore` (N3-B), duas Causas: REPOSITORIO_CHEIO (o job falha porque o repositório lotou, diagnóstico pelo log do job) e CADEIA_CORROMPIDA (restaurar a pasta do Financeiro pela cópia imutável porque a cadeia incremental está corrompida).

### Escopo

- Dentro: `Simulador.Cenarios` (`CatalogoCenarios`), `Simulador.Dominio` (Motor, Projeção, estado, comandos e pistas), `Simulador.Avaliacao` (Juiz_360 e `KbCatalogo`), `Simulador.Dialogo` (personas), testes em `src/backend/tests` e a documentação de entrega em `docs/`.
- Fora: qualquer arquivo de `src/frontend`, exceto a exceção única e condicionada da Decisão 2 (arquivo de dados `src/frontend/src/data/kbCatalogo.ts`); `docs/vetores-jcs-sha256.json` e `src/frontend/src/utils/jcs.ts` (não são tocados, logo continuam sincronizados); `render.yaml`; pacotes novos; a troca de status do Catálogo_de_Rotas (tarefa 18 da `jornada-de-voo`); roteiros e dicas do Frontend (`lab/dicaMissao.ts`, `lab/roteiros.ts`).
- Decisão de modelagem: nenhuma ação nova na API. As interações novas são comandos declarados do terminal (`estacao.executar_comando`) e ações que o Frontend já envia (`dialogo.verificar_identidade`, `itsm.*`, `estacao.ler_logs`, `estacao.elevar_privilegio`, `seguranca.resetar_senha`). Assim a interface atual consegue jogar os itens novos sem controle novo.

### Decisões do usuário (pendentes, com padrão adotado)

1. Branch e worktree: padrão adotado é a branch `cenarios-por-escala` em uma worktree própria criada a partir de `jornada-de-voo`, para não disputar o índice do Git com o trabalho do Frontend. Alternativa: commitar direto em `jornada-de-voo`.
2. Artigos de KB novos: o contrato Juiz_360 e Frontend exige os mesmos ids e URIs nos dois lados (teste `LinksJuiz360_ResolvemNoCatalogoCompartilhadoComFrontend`). Padrão adotado: acrescentar KB-027 a KB-032 no Backend e no arquivo de dados `src/frontend/src/data/kbCatalogo.ts`, como exceção única de escopo. Alternativa: reutilizar só as URIs atuais (KB-001 a KB-026), com critérios do Juiz_360 apontando para artigos menos precisos.
3. Ativação no sorteio das Causas novas de cenários existentes (C4, EMAIL_PROVEDOR, DOMINIO_SUSPENSO): padrão adotado é ativar só no fim (tarefa 19), depois da confirmação do usuário, porque os roteiros e as dicas atuais do Frontend foram escritos para C1 a C3 e para o gateway. Antes da ativação essas Causas só nascem com `causaForcada`.
4. Variante do pedido por terceiro: padrão adotado é sortear pela semente (cerca de metade das sessões). Alternativa para a demonstração: sempre por terceiro.
5. Identificador do gateway: o Backend guarda `PATCH_MASSIVO` (sessões persistidas), e o Catálogo_de_Rotas do Frontend chama a Causa de GATEWAY. Padrão adotado: o Backend aceita `GATEWAY` como apelido de entrada em `causaForcada` e mantém `PATCH_MASSIVO` como identificador gravado.

## Glossary

- **Backend**: API .NET 10 em `src/backend`, composta pelos projetos `Simulador.Api`, `Simulador.Dominio`, `Simulador.Cenarios`, `Simulador.Avaliacao`, `Simulador.Dialogo`, `Simulador.Itsm` e `Simulador.Infra`.
- **Motor**: `Motor` em `Simulador.Dominio`, função pura `Aplicar(estado, ação, definição)`. É a autoridade única de mudança de estado, de acesso remoto, de comandos e de SLA.
- **Juiz_360**: `Juiz360` em `Simulador.Avaliacao`, que avalia por critérios binários observáveis nos Eventos e no estado. O diálogo nunca avalia.
- **Catálogo_de_Cenários**: `CatalogoCenarios`, que implementa `ICatalogoCenarios` (`SuportaVersao` e `Obter`).
- **Cenário**: identificador de missão do Backend (por exemplo `reset-senha-desbloqueio`), com versão de manifesto.
- **Causa**: identificador do problema simulado dentro de um Cenário (por exemplo SENHA_ESQUECIDA). A Causa fica oculta no replay enquanto a sessão está em andamento.
- **Causa_Forçada**: parâmetro `causaForcada` de `POST /api/sessoes`, aceito só quando `Demo:PermitirParametrosDeTeste` é verdadeiro.
- **Sorteio**: escolha determinística da Causa por `SplitMix64(semente)`.
- **Semente**: inteiro de 64 bits gravado em `SessaoIniciada`; define todo o sorteio.
- **Evento**: registro imutável (`EnvelopeEvento`) gravado em append-only, com `Seq`, `Tipo`, `Dados` e `MinutoSimulado`.
- **Projeção**: `Projecao.Reconstruir`, que refaz o estado a partir dos Eventos e do Catálogo_de_Cenários.
- **Replay**: leitura cronológica dos Eventos de uma sessão, com a Causa oculta até a conclusão.
- **Comando_Declarado**: prefixo de comando listado em `ComandosSuportados` da estação do Cenário. Comando fora da lista recebe `ComandoNaoSuportado` com resposta honesta, sem saída inventada.
- **Comandos_por_Escala**: módulo novo `ComandosPorEscala` em `Simulador.Dominio` que executa os comandos específicos dos itens desta spec.
- **Titular**: pessoa dona da conta no Cenário `reset-senha-desbloqueio` (a colaboradora Fernanda Lima, login `fernanda.lima`, matrícula `AUR-2087`, ramal cadastrado `2087`).
- **Solicitante**: pessoa que abriu o chamado principal. Pode ser a Titular ou o gestor Paulo Andrade.
- **Pedido_por_Terceiro**: variante em que o Solicitante é o gestor pedindo pela Titular.
- **Canal_Cadastrado**: ramal da Titular obtido no cadastro corporativo (comando `diretorio`), nunca informado pelo Solicitante.
- **Verificação_de_Identidade**: evento `IdentidadeVerificada`, produzido por `dialogo.verificar_identidade` com a matrícula e o ramal da Titular.
- **Ação_Sensível**: comando `redefinir-senha`, `desbloquear-conta` ou `enviar-link-troca`, ou a ação `seguranca.resetar_senha` no Cenário `reset-senha-desbloqueio`.
- **Ação_Prejudicial**: Evento `AcaoPrejudicialRegistrada`; marca incidente de segurança no Juiz_360.
- **Ação_Desnecessária**: Evento `AcaoDesnecessariaRegistrada`; ação correta em outra Causa, sem dano de segurança.
- **Origem_do_Bloqueio**: o celular corporativo `MOB-FIN-017` com a senha antiga, que causa as tentativas de logon que bloqueiam a conta de CONTA_BLOQUEADA.
- **Falha_de_Fornecedor**: Causa em que o serviço parado pertence a terceiro (provedor de e-mail ou registrador de domínio); o N2 comunica e acompanha.
- **Domínio_Público_Fictício**: `aurora-logistica.example`, nome reservado para exemplos.
- **Cópia_Imutável**: ponto de restauração do Financeiro que não pode ser alterado nem apagado durante a retenção.
- **Cadeia_Incremental**: sequência de pontos de restauração incrementais do job de backup.
- **Critério_Binário**: critério do Juiz_360 com resultado atendido ou não atendido, decidido só por Eventos e estado observáveis.
- **Pista**: texto de `dialogo.pedir_pista`, no máximo 3 por sessão, sem revelar a Causa.
- **Artigo_de_KB**: item de `KbCatalogo` (backend) e de `kbCatalogo.ts` (frontend), identificado por id `KB-nnn` e URI `kb://...`.
- **Item**: um Cenário novo ou uma Causa nova listada na Introdução.
- **Ativação_no_Sorteio**: inclusão de uma Causa nova de cenário existente na lista que o Sorteio usa quando não há Causa_Forçada.
- **Checkpoint**: tarefa que roda `dotnet test src/backend/Simulador.slnx` e faz commit local.

## Requirements

### Requirement 1: Cenário reset-senha-desbloqueio no catálogo

**User Story:** Como participante da Escala Help Desk N1, quero abrir uma sessão de reset de senha e desbloqueio de conta, para treinar o atendimento mais frequente do N1.

#### Acceptance Criteria

1. THE Catálogo_de_Cenários SHALL aceitar o par (`reset-senha-desbloqueio`, `v0.1-hackathon`) em `SuportaVersao` e retornar a Definição desse Cenário em `Obter`.
2. WHEN `POST /api/sessoes` recebe `cenarioId` igual a `reset-senha-desbloqueio` sem `versaoManifesto`, THE Backend SHALL criar a sessão com a versão `v0.1-hackathon` pelo padrão atual de `Program.cs`, sem alteração nesse arquivo.
3. THE Definição SHALL ter o nível `Help Desk (N1)`, `UsuarioAlvo` igual a `fernanda.lima`, `ServicoAlvo` igual a `ContaAD`, a Titular `Fernanda Lima` com matrícula `AUR-2087` e ramal `2087`, e o chamado principal como primeiro da fila.
4. WHEN não há Causa_Forçada válida, THE Catálogo_de_Cenários SHALL sortear a Causa entre SENHA_ESQUECIDA, CONTA_BLOQUEADA e SENHA_EXPIRADA com `SplitMix64(semente)`.
5. THE Catálogo_de_Cenários SHALL derivar a variante Pedido_por_Terceiro do segundo sorteio do mesmo `SplitMix64(semente)`, e forçar a Causa não SHALL mudar a variante.
6. THE Definição SHALL declarar como Comandos_Declarados exatamente: `net user`, `eventos-seguranca`, `diretorio`, `discar`, `redefinir-senha`, `desbloquear-conta` e `enviar-link-troca`.
7. IF o participante envia um comando fora dessa lista, THEN THE Motor SHALL registrar `ComandoNaoSuportado` com a resposta honesta existente e SHALL manter o estado.
8. THE Definição SHALL usar apenas dados sintéticos: pessoas fictícias, domínio `aurora.local` e matrículas fictícias.

### Requirement 2: Verificação de identidade antes de agir e pedido por terceiro

**User Story:** Como instrutor, quero que o simulador cobre a verificação de identidade da Titular antes de qualquer ação sensível, inclusive quando o gestor pede pela colaboradora, para ensinar a armadilha de engenharia social mais comum do N1.

#### Acceptance Criteria

1. WHILE a variante é Pedido_por_Terceiro, THE Definição SHALL abrir o chamado principal com Solicitante `Paulo Andrade (gestor)` e descrição que pede a ação em nome da Titular.
2. WHILE a variante não é Pedido_por_Terceiro, THE Definição SHALL abrir o chamado principal com Solicitante `Fernanda Lima`.
3. WHEN o participante executa `diretorio fernanda.lima`, THE Comandos_por_Escala SHALL responder com o nome da Titular, o ramal do Canal_Cadastrado, o gestor e a política de verificação, sem gravar mudança de estado.
4. WHEN o participante executa `discar` com o ramal do Canal_Cadastrado, THE Comandos_por_Escala SHALL emitir o Evento `TitularContatado` e SHALL marcar `Dialogo.TitularContatado` como verdadeiro.
5. IF o participante executa `discar` com qualquer outro número, THEN THE Comandos_por_Escala SHALL responder que o número está fora do cadastro corporativo e SHALL NOT emitir `TitularContatado`.
6. WHEN o participante envia `dialogo.verificar_identidade` com a matrícula e o ramal da Titular, o chamado principal está `EmAtendimento` e a variante não é Pedido_por_Terceiro ou `TitularContatado` é verdadeiro, THE Motor SHALL emitir `IdentidadeVerificada` e SHALL marcar `IdentidadeValidada` como verdadeiro.
7. WHEN o Motor emite `IdentidadeVerificada` num Cenário com Titular, THE Motor SHALL NOT liberar acesso remoto nem emitir `AcessoRemotoLiberado`.
8. IF a variante é Pedido_por_Terceiro e `TitularContatado` é falso, THEN THE Motor SHALL emitir `IdentidadeNaoConfere` com o motivo de que o Solicitante é terceiro e a Titular precisa ser contatada pelo Canal_Cadastrado, mesmo quando a matrícula e o ramal enviados estão corretos.
9. IF a matrícula ou o ramal não conferem, THEN THE Motor SHALL emitir `IdentidadeNaoConfere` como no comportamento existente.
10. IF uma Ação_Sensível ocorre com `IdentidadeValidada` falso, THEN THE Motor SHALL emitir `AcaoSensivelSemVerificacao` e `AcaoPrejudicialRegistrada` (categoria `seguranca`) e SHALL manter inalterado o estado da conta.
11. THE Motor SHALL permitir os comandos de leitura `net user`, `eventos-seguranca`, `diretorio` e `discar` antes da Verificação_de_Identidade.
12. WHEN `seguranca.resetar_senha` é enviada no Cenário `reset-senha-desbloqueio`, THE Motor SHALL aplicar a mesma regra do comando `redefinir-senha`, para que o botão existente do Frontend não produza o evento `SenhaResetadaIndevidamente` de um reset legítimo.
13. THE Motor SHALL manter para os Cenários sem Titular o comportamento atual de `dialogo.verificar_identidade` (matrícula `AUR-1042`, ramal `2042`, liberação de acesso remoto) e de `seguranca.resetar_senha`.

### Requirement 3: Causa SENHA_ESQUECIDA

**User Story:** Como participante, quero resetar a senha de quem a esqueceu só depois de verificar quem pede, para aprender que a verificação vem antes da ação.

#### Acceptance Criteria

1. WHEN a Causa é SENHA_ESQUECIDA, THE Definição SHALL iniciar a estação com `ContaAD` no status `Ativa` e com o log de tentativas de senha incorreta abaixo do limite de bloqueio.
2. WHEN o participante executa `net user fernanda.lima`, THE Comandos_por_Escala SHALL responder com o estado da conta (ativa, não bloqueada, senha dentro da validade) e o número de tentativas incorretas.
3. WHEN o participante executa `redefinir-senha fernanda.lima` com `IdentidadeValidada` verdadeiro, THE Comandos_por_Escala SHALL emitir `SenhaTemporariaDefinida` com `trocaObrigatoria` verdadeiro e, em seguida, `AcessoContaRestabelecido` com `via` igual a `reset`.
4. WHEN o Motor emite `SenhaTemporariaDefinida`, THE Motor SHALL mudar `ContaAD` para `SenhaTemporaria` e SHALL marcar `CompartilhamentoAcessivel` como verdadeiro, e a saída do comando SHALL informar que a senha temporária foi entregue por canal seguro, sem exibir senha em saída ou Evento.
5. WHEN o participante executa `desbloquear-conta` ou `enviar-link-troca` nesta Causa, THE Comandos_por_Escala SHALL responder que a ação não resolve a causa e SHALL emitir `AcaoDesnecessariaRegistrada`, sem restabelecer o acesso.
6. THE Motor SHALL tratar `dialogo.confirmar_com_usuario` com a regra existente (aceita só com `CompartilhamentoAcessivel` verdadeiro).

### Requirement 4: Causa CONTA_BLOQUEADA

**User Story:** Como participante, quero desbloquear a conta e achar a origem das tentativas, para aprender que desbloquear sem achar a origem faz a conta bloquear de novo.

#### Acceptance Criteria

1. WHEN a Causa é CONTA_BLOQUEADA, THE Definição SHALL iniciar a estação com `ContaAD` no status `Bloqueada`, `EventosDeSeguranca` no status `NaoConsultado` e logs que não citam a Origem_do_Bloqueio.
2. WHEN o participante executa `net user fernanda.lima`, THE Comandos_por_Escala SHALL responder que a conta está bloqueada e o número de tentativas incorretas recentes, sem citar a Origem_do_Bloqueio.
3. WHEN o participante executa `eventos-seguranca fernanda.lima` nesta Causa, THE Comandos_por_Escala SHALL responder com a Origem_do_Bloqueio (o celular corporativo `MOB-FIN-017` tentando entrar a cada 5 minutos com a senha antiga em cache), SHALL emitir `OrigemBloqueioIdentificada` e SHALL mudar `EventosDeSeguranca` para `Consultado`.
4. WHEN o participante executa `desbloquear-conta fernanda.lima` com `IdentidadeValidada` verdadeiro e `EventosDeSeguranca` igual a `Consultado`, THE Comandos_por_Escala SHALL emitir `ContaDesbloqueada` e `AcessoContaRestabelecido` com `via` igual a `desbloqueio`, mudar `ContaAD` para `Ativa` e marcar `CompartilhamentoAcessivel` como verdadeiro.
5. IF o participante executa `desbloquear-conta` com `IdentidadeValidada` verdadeiro e `EventosDeSeguranca` igual a `NaoConsultado`, THEN THE Comandos_por_Escala SHALL emitir `ContaDesbloqueada` seguido de `ContaBloqueadaNovamente`, SHALL manter `ContaAD` em `Bloqueada` e SHALL NOT emitir `AcessoContaRestabelecido`.
6. WHEN o participante executa `redefinir-senha` ou `enviar-link-troca` nesta Causa, THE Comandos_por_Escala SHALL responder que a ação não remove a origem do bloqueio e SHALL emitir `AcaoDesnecessariaRegistrada`, sem restabelecer o acesso.
7. THE Comandos_por_Escala SHALL permitir `eventos-seguranca` e `net user` antes da Verificação_de_Identidade.
8. WHEN o participante executa `eventos-seguranca` em outra Causa, THE Comandos_por_Escala SHALL responder que não há bloqueios recentes e SHALL NOT emitir `OrigemBloqueioIdentificada`.

### Requirement 5: Causa SENHA_EXPIRADA

**User Story:** Como participante, quero orientar a pessoa a trocar a própria senha, sem reset, para aprender a não executar ação desnecessária.

#### Acceptance Criteria

1. WHEN a Causa é SENHA_EXPIRADA, THE Definição SHALL iniciar a estação com `ContaAD` no status `SenhaExpirada` e com o log de logon recusado por senha expirada (política de 90 dias).
2. WHEN o participante executa `net user fernanda.lima`, THE Comandos_por_Escala SHALL responder que a senha expirou e a data de expiração.
3. WHEN o participante executa `enviar-link-troca fernanda.lima` com `IdentidadeValidada` verdadeiro, THE Comandos_por_Escala SHALL emitir `OrientacaoRegistrada` (tema `troca_pela_titular`), `SenhaTrocadaPelaPessoa` e `AcessoContaRestabelecido` com `via` igual a `troca_pela_titular`, mudar `ContaAD` para `Ativa` e marcar `CompartilhamentoAcessivel` como verdadeiro.
4. WHEN o participante executa `redefinir-senha fernanda.lima` com `IdentidadeValidada` verdadeiro nesta Causa, THE Comandos_por_Escala SHALL emitir `SenhaTemporariaDefinida`, `AcessoContaRestabelecido` com `via` igual a `reset` e `AcaoDesnecessariaRegistrada`.
5. WHEN o participante executa `desbloquear-conta` nesta Causa, THE Comandos_por_Escala SHALL responder que a conta não está bloqueada e SHALL emitir `AcaoDesnecessariaRegistrada`.

### Requirement 6: Avaliação do Juiz_360 em reset-senha-desbloqueio

**User Story:** Como participante, quero um relatório com critérios claros, para saber onde acertei e onde errei no atendimento.

#### Acceptance Criteria

1. THE Juiz_360 SHALL avaliar o Cenário `reset-senha-desbloqueio` com funções próprias e SHALL NOT usar a função padrão de pasta de rede para esse Cenário.
2. THE Juiz_360 SHALL aplicar os Critérios_Binários H1 a H8 a toda Causa: H1 verificou a identidade da Titular antes de qualquer Ação_Sensível; H2 no Pedido_por_Terceiro contatou a Titular pelo Canal_Cadastrado antes de verificar (atendido com motivo "nao se aplica" quando o pedido é direto); H3 executou `net user` ou `eventos-seguranca` antes da primeira ação efetiva; H4 nenhuma Ação_Prejudicial; H5 restabeleceu o acesso pela via correta da Causa (`reset` para SENHA_ESQUECIDA, `desbloqueio` para CONTA_BLOQUEADA, `troca_pela_titular` para SENHA_EXPIRADA); H6 nenhuma Ação_Desnecessária; H7 classificou o chamado principal; H8 resolveu o chamado principal depois do restabelecimento, com nota pública.
3. WHEN a Causa é CONTA_BLOQUEADA, THE Juiz_360 SHALL acrescentar H9 (`OrigemBloqueioIdentificada` antes do primeiro `ContaDesbloqueada` e nenhum `ContaBloqueadaNovamente`) e H10 (nota pública do chamado orienta a Titular sobre o celular com a senha antiga, por termos normalizados sem acento e sem caixa).
4. THE Juiz_360 SHALL marcar `IncidenteSeguranca` quando existir `AcaoPrejudicialRegistrada`.
5. THE Juiz_360 SHALL calcular o XP como 10 pontos por critério atendido, mais 10 pontos quando todos os chamados estão dentro do SLA e H8 está atendido.
6. THE Juiz_360 SHALL considerar a avaliação concluída quando o chamado principal está `Resolvido` ou `Encerrado`.
7. THE Juiz_360 SHALL informar em cada critério o `EventoSeq`, o motivo, a prática esperada e um `LinkKb` presente no `KbCatalogo`.

### Requirement 7: Causa C4 em pasta-rede-inacessivel

**User Story:** Como participante do Service Desk N1 Jr, quero atender uma solicitação de mapeamento de unidade e não um incidente, para aprender essa distinção.

#### Acceptance Criteria

1. WHEN a Causa_Forçada é C4, THE Catálogo_de_Cenários SHALL retornar a Definição com grupo, DNS e serviço íntegros, `UnidadeRedeZ` no status `NaoMapeada` e o chamado principal descrito como solicitação de mapeamento da unidade Z: para `\\fileserver.aurora.local\Financeiro`.
2. THE Definição de `pasta-rede-inacessivel` SHALL declarar `net use` entre os Comandos_Declarados de todas as Causas (C1 a C4), para que a lista não revele a Causa.
3. WHEN o participante executa `net use z: \\fileserver.aurora.local\Financeiro` na Causa C4, THE Comandos_por_Escala SHALL emitir `UnidadeRedeMapeada` e `AcessoPastaRestabelecido`, mudar `UnidadeRedeZ` para `Mapeada` e marcar `CompartilhamentoAcessivel` como verdadeiro.
4. WHEN o participante executa `net use z:` com o caminho do Financeiro nas Causas C1, C2 ou C3, THE Comandos_por_Escala SHALL responder com o erro coerente com a Causa (acesso negado, caminho de rede não encontrado ou serviço Workstation parado) e SHALL manter o estado.
5. WHILE a Causa é C4, THE Motor SHALL manter `CompartilhamentoAcessivel` falso em `net start`, `ipconfig /flushdns`, `estacao.adicionar_usuario_grupo` e `estacao.reiniciar_servico` até a unidade estar mapeada.
6. WHEN a Causa é C4, THE Juiz_360 SHALL acrescentar o critério J6 (a categoria da classificação do chamado principal contém "solicit" depois de normalizada) aos critérios J1 a J5, sem alterar os critérios das Causas C1 a C3.
7. THE Motor SHALL preservar o comportamento e a saída dos comandos existentes de C1, C2 e C3.

### Requirement 8: Causa EMAIL_PROVEDOR em incidente-massivo

**User Story:** Como participante do N2 Pleno, quero reconhecer a falha de um fornecedor externo e comunicar e acompanhar em vez de consertar, para aprender o papel do N2 nesse caso.

#### Acceptance Criteria

1. WHEN a Causa_Forçada é EMAIL_PROVEDOR, THE Catálogo_de_Cenários SHALL retornar a Definição de `incidente-massivo` com 3 chamados simultâneos de falha de e-mail corporativo, `AuroraGateway` no status `Running` e `ProvedorEmail` no status `Indisponivel`.
2. THE Definição SHALL declarar nesta Causa os Comandos_Declarados `sc query`, `ping`, `nslookup`, `curl -i`, `acionar` e `acompanhar`.
3. WHEN o participante executa `curl -i https://status.provedor-email.example`, THE Comandos_por_Escala SHALL responder com o incidente do provedor (HTTP 503) e SHALL emitir `EvidenciaExternaConfirmada`.
4. WHEN o participante executa `acionar fornecedor`, THE Comandos_por_Escala SHALL emitir `AreaAcionada` com `area` igual a `Fornecedor` e mudar `ProvedorEmail` para `Acionado`.
5. IF o participante executa `acompanhar fornecedor` antes de `acionar fornecedor`, THEN THE Comandos_por_Escala SHALL responder que o fornecedor ainda não foi acionado e SHALL NOT restabelecer o serviço.
6. WHEN o participante executa `acompanhar fornecedor` depois de acionar o fornecedor, THE Comandos_por_Escala SHALL emitir `AcompanhamentoRegistrado` e `ServicoExternoRestabelecido`, mudar `ProvedorEmail` para `Restabelecido` e marcar `CompartilhamentoAcessivel` como verdadeiro.
7. WHEN o participante tenta corrigir internamente com `estacao.reiniciar_servico`, THE Motor SHALL manter o comportamento atual dessa ação, e o Juiz_360 SHALL registrar a tentativa no critério F8. O comando `net start` não faz parte dos Comandos_Declarados desta Causa.
8. THE Motor SHALL manter o comportamento atual da Causa PATCH_MASSIVO.

### Requirement 9: Causa DOMINIO_SUSPENSO em incidente-massivo

**User Story:** Como participante do N2 Pleno, quero atender um incidente massivo de causa não técnica, que exige coordenar financeiro e fornecedor, para aprender a conduzir um incidente entre áreas.

#### Acceptance Criteria

1. WHEN a Causa_Forçada é DOMINIO_SUSPENSO, THE Catálogo_de_Cenários SHALL retornar a Definição de `incidente-massivo` com 3 chamados simultâneos de site e e-mail corporativo fora do ar, `AuroraGateway` no status `Running`, `DominioPublico` no status `Suspenso`, `AreaFornecedor` e `AreaFinanceiro` no status `Pendente`.
2. THE Definição SHALL declarar nesta Causa os Comandos_Declarados `sc query`, `ping`, `nslookup`, `whois`, `acionar` e `acompanhar`.
3. WHEN o participante executa `nslookup` ou `ping` para `www.aurora-logistica.example`, THE Motor SHALL responder pelo comportamento existente de host não encontrado, sem inventar resposta.
4. WHEN o participante executa `whois aurora-logistica.example`, THE Comandos_por_Escala SHALL responder com o status `clientHold` e o motivo de suspensão por fatura não paga, e SHALL emitir `EvidenciaExternaConfirmada`.
5. WHEN o participante executa `acionar fornecedor` ou `acionar financeiro`, THE Comandos_por_Escala SHALL emitir `AreaAcionada` com a `area` correspondente e mudar o status da área para `Acionada`.
6. IF o participante executa `acompanhar fornecedor` sem que as duas áreas estejam `Acionada`, THEN THE Comandos_por_Escala SHALL responder qual área falta e SHALL NOT restabelecer o serviço.
7. WHEN o participante executa `acompanhar fornecedor` com as duas áreas `Acionada`, THE Comandos_por_Escala SHALL emitir `AcompanhamentoRegistrado` e `ServicoExternoRestabelecido`, mudar `DominioPublico` para `Restabelecido` e marcar `CompartilhamentoAcessivel` como verdadeiro.
8. THE Definição SHALL usar o domínio `aurora-logistica.example` apenas como domínio público fictício e SHALL manter `aurora.local` como domínio interno.

### Requirement 10: Avaliação do Juiz_360 em incidente-massivo com Causa externa

**User Story:** Como participante, quero que a avaliação das Causas EMAIL_PROVEDOR e DOMINIO_SUSPENSO meça comunicação e acompanhamento, e não conserto técnico, para que eu seja avaliado pelo que o N2 faz de fato.

#### Acceptance Criteria

1. WHEN a Causa é PATCH_MASSIVO, THE Juiz_360 SHALL manter os critérios M1 a M8 sem alteração.
2. WHEN a Causa é EMAIL_PROVEDOR ou DOMINIO_SUSPENSO, THE Juiz_360 SHALL aplicar os Critérios_Binários F1 a F9: F1 criou o Problema antes de resolver chamados; F2 vinculou os 3 chamados ao Problema; F3 obteve `EvidenciaExternaConfirmada` antes do primeiro `AreaAcionada`; F4 acionou as áreas exigidas pela Causa (Fornecedor em EMAIL_PROVEDOR; Fornecedor e Financeiro em DOMINIO_SUSPENSO); F5 comunicou o incidente com nota pública em ao menos um chamado antes de `ProblemaResolvidoEmLote`; F6 registrou `AcompanhamentoRegistrado` e obteve `ServicoExternoRestabelecido`; F7 registrou causa raiz que cita o fornecedor (EMAIL_PROVEDOR) ou o domínio, o registrador e a fatura ou inadimplência (DOMINIO_SUSPENSO), por termos normalizados; F8 não houve `ServicoReiniciado`, `ServicoIniciado` nem `AcaoPrejudicialRegistrada`; F9 `ProblemaResolvidoEmLote` depois de `ServicoExternoRestabelecido` e todos os chamados dentro do SLA.
3. THE Juiz_360 SHALL considerar a avaliação concluída quando existe Problema resolvido, como no critério atual do N2.
4. THE Juiz_360 SHALL calcular o XP como 10 pontos por critério atendido, mais 10 pontos quando F9 está atendido.
5. THE Juiz_360 SHALL informar em cada critério o `EventoSeq`, o motivo, a prática esperada e um `LinkKb` presente no `KbCatalogo`.

### Requirement 11: Cenário falha-backup-restore e Causa REPOSITORIO_CHEIO

**User Story:** Como participante da Vertente N3-B Data Center e Backup, quero diagnosticar pelo log do job por que o backup falhou e corrigir sem destruir pontos de restauração, para treinar a falha de backup mais comum.

#### Acceptance Criteria

1. THE Catálogo_de_Cenários SHALL aceitar o par (`falha-backup-restore`, `v0.1-hackathon`) e retornar a Definição com nível `Especialista Data Center e Backup (N3-B)`, `UsuarioAlvo` igual a `backup.oncall`, `ServicoAlvo` igual a `JobBackupFinanceiro` e chamado principal do Gerente do Financeiro.
2. WHEN não há Causa_Forçada válida, THE Catálogo_de_Cenários SHALL sortear a Causa entre REPOSITORIO_CHEIO e CADEIA_CORROMPIDA com `SplitMix64(semente)`.
3. THE Definição SHALL declarar os Comandos_Declarados `backup status`, `backup log`, `backup repo`, `backup cadeia`, `backup job` e `backup restore`, iguais nas duas Causas.
4. WHEN a Causa é REPOSITORIO_CHEIO, THE Comandos_por_Escala SHALL responder `backup log` com a falha do job por falta de espaço no repositório (capacidade 100 por cento).
5. WHEN o participante executa `backup repo expandir` com privilégio Elevado nesta Causa, THE Comandos_por_Escala SHALL emitir `RepositorioExpandido` e mudar `RepositorioBackup` para `Expandido`.
6. IF o participante executa `backup repo expandir`, `backup restore` ou `backup repo limpar` sem privilégio Elevado, THEN THE Comandos_por_Escala SHALL responder que a operação exige privilégio Elevado e SHALL manter o estado.
7. WHEN o participante executa `backup job executar` com `RepositorioBackup` igual a `Expandido` nesta Causa, THE Comandos_por_Escala SHALL emitir `BackupConcluido`, mudar `JobBackupFinanceiro` para `Succeeded` e marcar `CompartilhamentoAcessivel` como verdadeiro.
8. IF o participante executa `backup job executar` com o repositório ainda cheio, THEN THE Comandos_por_Escala SHALL responder que o job falhou por falta de espaço e SHALL manter o estado.
9. WHEN o participante executa `backup repo limpar` com privilégio Elevado, THE Comandos_por_Escala SHALL emitir `AcaoPrejudicialRegistrada` (categoria `backup`, remoção de pontos de restauração compromete a retenção) e SHALL NOT liberar o repositório.
10. IF o participante executa `backup restore --origem imutavel` nesta Causa com privilégio Elevado, THEN THE Comandos_por_Escala SHALL emitir `AcaoPrejudicialRegistrada` (sobrescreve dados íntegros) e SHALL manter o estado.

### Requirement 12: Causa CADEIA_CORROMPIDA

**User Story:** Como participante, quero restaurar a pasta do Financeiro pela cópia imutável quando a cadeia incremental está corrompida, para ver o valor da cópia imutável num restore real.

#### Acceptance Criteria

1. WHEN a Causa é CADEIA_CORROMPIDA, THE Definição SHALL iniciar a estação com `PastaFinanceiro` no status `Indisponivel` e o chamado principal pedindo a restauração do fechamento do Financeiro.
2. WHEN o participante executa `backup log` nesta Causa, THE Comandos_por_Escala SHALL responder com o ponto incremental inválido e a cadeia corrompida.
3. WHEN o participante executa `backup cadeia verificar`, THE Comandos_por_Escala SHALL responder com a integridade da cadeia incremental e da Cópia_Imutável (nesta Causa, cadeia inválida e cópia íntegra).
4. WHEN o participante executa `backup restore --origem imutavel --destino \\fileserver.aurora.local\Financeiro` com privilégio Elevado, THE Comandos_por_Escala SHALL emitir `PastaFinanceiroRestaurada` com `origem` igual a `imutavel`, mudar `PastaFinanceiro` para `Restaurada` e marcar `CompartilhamentoAcessivel` como verdadeiro.
5. WHEN o participante executa `backup restore --origem incremental` nesta Causa, THE Comandos_por_Escala SHALL responder que a restauração falhou por cadeia corrompida e SHALL manter o estado.
6. WHEN o participante executa `backup job executar` nesta Causa, THE Comandos_por_Escala SHALL responder que o job continua falhando por cadeia corrompida e SHALL manter o estado.
7. WHEN o participante executa `backup repo expandir` nesta Causa, THE Comandos_por_Escala SHALL responder que o repositório tem espaço e SHALL manter o estado.

### Requirement 13: Avaliação do Juiz_360 em falha-backup-restore

**User Story:** Como participante, quero critérios claros de diagnóstico, privilégio, correção e segurança de dados, para saber onde melhorar.

#### Acceptance Criteria

1. THE Juiz_360 SHALL avaliar o Cenário `falha-backup-restore` com função própria.
2. THE Juiz_360 SHALL aplicar a toda Causa os Critérios_Binários: B1 classificou o chamado principal; B2 executou `backup log` ou consultou os logs antes da primeira ação corretiva; B3 aplicou a correção com privilégio Elevado (`FoiComPrivilegioElevado` sobre o Evento corretivo); B4 aplicou a correção da Causa (`BackupConcluido` em REPOSITORIO_CHEIO; `PastaFinanceiroRestaurada` com `origem` igual a `imutavel` em CADEIA_CORROMPIDA); B5 nenhuma `AcaoPrejudicialRegistrada`; B6 resolveu o chamado principal depois do restabelecimento, com nota pública e dentro do SLA.
3. WHEN a Causa é CADEIA_CORROMPIDA, THE Juiz_360 SHALL acrescentar B7 (executou `backup cadeia` antes de `PastaFinanceiroRestaurada`).
4. THE Juiz_360 SHALL calcular o XP como 20 pontos por critério atendido, menos 25 pontos quando há Ação_Prejudicial, com mínimo zero, como nos cenários N3 existentes.
5. THE Juiz_360 SHALL considerar a avaliação concluída quando o chamado principal está `Resolvido` ou `Encerrado` e `CompartilhamentoAcessivel` é verdadeiro.

### Requirement 14: Pistas e diálogo por Cenário e Causa

**User Story:** Como participante, quero pistas e respostas das personas coerentes com o meu cenário, sem que elas entreguem a Causa, para aprender sem ganhar a resposta pronta.

#### Acceptance Criteria

1. WHEN o participante envia `dialogo.pedir_pista`, THE Motor SHALL escolher o texto da Pista pelo Cenário e, em `incidente-massivo`, pela família da Causa (técnica ou externa), mantendo o limite de 3 Pistas e `pistas_esgotadas` na quarta.
2. THE Motor SHALL manter os textos atuais das Pistas para `pasta-rede-inacessivel`, `triagem-engenharia-social`, `sre-cloud-latencia`, `diagnostico-sql-readonly` e `incidente-massivo` com a Causa PATCH_MASSIVO.
3. THE Motor SHALL oferecer 3 Pistas próprias para `reset-senha-desbloqueio`, 3 para `falha-backup-restore` e 3 para a família externa de `incidente-massivo`, nenhuma delas contendo o identificador de Causa nem a ação corretiva final.
4. WHEN o participante conversa com a persona `cliente` em `reset-senha-desbloqueio`, THE Dialogo SHALL responder conforme a Causa e a variante: o gestor não conhece a matrícula da Titular e orienta ligar para o ramal dela; depois de `TitularContatado`, a Titular informa a matrícula `AUR-2087` e o ramal `2087`.
5. WHEN o participante conversa com a persona `cliente` em `falha-backup-restore`, `incidente-massivo` (Causas externas) e `pasta-rede-inacessivel` (C4), THE Dialogo SHALL responder com o sintoma percebido pela pessoa, sem citar a Causa nem a solução.
6. WHEN o participante conversa com a persona `techlead` nos Cenários novos, THE Dialogo SHALL responder em 3 níveis progressivos de orientação, sem revelar a Causa nem fornecer a resposta pronta.
7. THE Dialogo SHALL manter `EhTentativaDeInjecao` e as respostas de bloqueio atuais para todos os Cenários, e o diálogo SHALL NOT alterar estado nem avaliar o participante.

### Requirement 15: Determinismo, Event Sourcing e Replay

**User Story:** Como auditor, quero que toda sessão dos itens novos seja reconstruída igual a partir dos Eventos, para confiar no replay e no hash da trilha.

#### Acceptance Criteria

1. THE Motor SHALL produzir Eventos imutáveis em append-only para toda ação e todo comando dos itens novos, com `Seq` consecutivo e `MinutoSimulado` não decrescente.
2. THE Projeção SHALL tratar todo Evento novo (`TitularContatado`, `SenhaTemporariaDefinida`, `ContaDesbloqueada`, `ContaBloqueadaNovamente`, `SenhaTrocadaPelaPessoa`, `AcessoContaRestabelecido`, `OrigemBloqueioIdentificada`, `UnidadeRedeMapeada`, `RepositorioExpandido`, `BackupConcluido`, `PastaFinanceiroRestaurada`, `AreaAcionada`, `ServicoExternoRestabelecido`) de forma que o estado reconstruído seja igual ao estado calculado pelo Motor.
3. WHEN a mesma sequência de ações é aplicada duas vezes ao mesmo (Cenário, Causa, semente), THE Motor SHALL produzir Eventos iguais e o mesmo hash de trilha do Juiz_360.
4. WHEN o Event_Store reconstrói uma sessão, THE Catálogo_de_Cenários SHALL receber a Causa gravada em `SessaoIniciada` como Causa_Forçada e SHALL devolver a mesma Definição da criação da sessão.
5. WHEN uma ação é rejeitada, THE Motor SHALL emitir só `AcaoRejeitada`, sem custo de minutos e sem mudança de estado além de `UltimoSeq`.
6. THE Backend SHALL ocultar a Causa no replay enquanto a sessão está em andamento, como nos Cenários existentes, e SHALL NOT incluir o identificador da Causa em Pistas, mensagens de persona ou saídas de comando.

### Requirement 16: Não regressão e compatibilidade de contrato

**User Story:** Como mantenedor, quero que os itens novos não quebrem nenhuma sessão, teste ou contrato existente, para entregar com segurança perto do congelamento.

#### Acceptance Criteria

1. THE Backend SHALL manter todos os testes atuais de `dotnet test src/backend/Simulador.slnx` passando sem alteração de expectativa, até a Ativação_no_Sorteio.
2. THE Catálogo_de_Cenários SHALL manter o Sorteio de `pasta-rede-inacessivel` entre C1, C2 e C3 e o teste `Semente48_SorteiaC3SemPostgres_EOcultaCausaNoReplayEmAndamento` até a Ativação_no_Sorteio.
3. THE Catálogo_de_Cenários SHALL manter PATCH_MASSIVO como Causa padrão de `incidente-massivo` até a Ativação_no_Sorteio, e SHALL aceitar `GATEWAY` como apelido de entrada de Causa_Forçada, gravando `PATCH_MASSIVO`.
4. THE Backend SHALL tratar Causa_Forçada desconhecida como hoje: sortear pela semente.
5. THE Backend SHALL acrescentar campos novos a records existentes só como parâmetros finais com valor padrão, para que todo código e teste que constrói esses records continue compilando.
6. THE Backend SHALL NOT alterar `src/backend/src/Simulador.Api/Program.cs`, `src/frontend/src/api/**`, `src/frontend/src/utils/jcs.ts` nem `docs/vetores-jcs-sha256.json`.
7. WHEN `POST /api/carreira/resumo` recebe sessões dos Cenários novos, THE Backend SHALL somar o XP e as competências pelo `cenarioId` sem erro, e SHALL manter inalterados `cargoAtual` e `promocoes`.
8. THE Backend SHALL NOT adicionar pacote NuGet.

### Requirement 17: Artigos de KB e contrato com o Frontend

**User Story:** Como participante, quero que o link de cada critério do Juiz_360 abra um artigo real, para estudar o ponto em que errei.

#### Acceptance Criteria

1. THE KbCatalogo SHALL acrescentar os artigos KB-027 (`kb://acesso/reset-desbloqueio-e-troca`), KB-028 (`kb://itil/falha-de-fornecedor`), KB-029 (`kb://itil/comunicacao-de-incidente`), KB-030 (`kb://backup/diagnostico-de-job`), KB-031 (`kb://backup/copia-imutavel-e-retencao`) e KB-032 (`kb://itsm/solicitacao-de-servico`), sem renumerar KB-001 a KB-026.
2. WHERE a Decisão 2 autoriza a exceção de escopo, THE Backend SHALL acrescentar os mesmos 6 artigos (id, uri, titulo, categoria, nivel e conteudo sintético) em `src/frontend/src/data/kbCatalogo.ts`, e nenhum outro arquivo do Frontend.
3. THE teste `LinksJuiz360_ResolvemNoCatalogoCompartilhadoComFrontend` SHALL verificar as URIs emitidas por todos os arquivos `.cs` de `Simulador.Avaliacao`, e não só de `Juiz360.cs`.
4. WHERE a Decisão 2 não autoriza a exceção, THE Juiz_360 SHALL usar somente URIs de KB-001 a KB-026 e o teste de contrato SHALL passar sem mudança no Frontend.
5. THE Artigo_de_KB novo SHALL conter só conteúdo sintético, sem dados reais e sem valores internos que entreguem a Causa de um Cenário.

### Requirement 18: Entrega incremental, ativação no sorteio e prazo

**User Story:** Como responsável pelo prazo, quero que cada item seja entregável sozinho e com commit local, para que uma interrupção não perca trabalho e eu possa cortar itens do fim.

#### Acceptance Criteria

1. THE Backend SHALL deixar cada Item completo (Motor, Projeção, Juiz_360, pistas, diálogo e testes) e com `dotnet test src/backend/Simulador.slnx` verde antes do commit local do Checkpoint do Item.
2. THE Checkpoint SHALL gerar um commit local pequeno e descritivo por Item, sem push, sem merge e sem comando destrutivo do Git.
3. THE ordem de implementação SHALL seguir a lista da Introdução, de modo que o corte por falta de tempo comece pelo último item.
4. WHEN a tarefa de Ativação_no_Sorteio é executada, THE Backend SHALL incluir C4 em `CausasPastaRede` e EMAIL_PROVEDOR e DOMINIO_SUSPENSO no Sorteio de `incidente-massivo`, SHALL atualizar o teste `Semente48_...` para uma semente que continue sorteando C3 e SHALL provar por teste que uma sessão gravada antes da ativação, com Causa C1, C2 ou C3 em `SessaoIniciada`, continua reconstruindo a mesma Definição e o mesmo estado.
5. IF o usuário não confirma a Ativação_no_Sorteio, THEN THE Backend SHALL manter as Causas novas de cenários existentes acessíveis só por Causa_Forçada.
6. THE Backend SHALL registrar, num documento em `docs/`, a tabela de entrega para a tarefa 18 da `jornada-de-voo`: Cenário, Causa, identificador, comandos, Eventos e estado de disponibilidade no Backend.
7. THE entrega SHALL estar commitada antes de 30 de novembro de 2026, 23h59. Depois dessa data, a troca de status no Frontend fica fora da entrega do hackathon.

### Requirement 19: Conformidade com o AGENTS.md

**User Story:** Como mantenedor, quero que os itens novos sigam as regras do repositório, para passar na revisão sem retrabalho.

#### Acceptance Criteria

1. THE Backend SHALL manter o Motor determinístico como autoridade única de estado, acesso remoto, comandos, SLA e avaliação, e o diálogo SHALL NOT alterar estado.
2. THE Backend SHALL usar identificadores de código, nomes de Eventos e textos em português, no mesmo padrão sem acentos dos arquivos atuais do Backend.
3. THE documentos e textos novos SHALL NOT conter o símbolo E comercial, emoji nem dado real de pessoa, cliente, credencial ou token.
4. THE Backend SHALL declarar os comandos suportados por Cenário e SHALL responder honestamente a comando fora do escopo, sem saída inventada.
5. THE Backend SHALL tratar os comandos novos como simplificação do simulador, sem imitar a identidade visual nem prometer fidelidade a sistema operacional proprietário.
