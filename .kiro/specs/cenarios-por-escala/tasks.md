# Implementation Plan: Cenários por Escala

## Overview

Implementação em C# (.NET 10) em `src/backend`, sem mudança em `src/frontend` (exceto a exceção condicionada da Decisão 2 em `src/frontend/src/data/kbCatalogo.ts`), sem pacote novo e sem mudança em `Program.cs`. Os testes rodam com `dotnet test src/backend/Simulador.slnx`.

A ordem entrega valor primeiro e deixa cada Item pronto sozinho, com checkpoint e commit local por Item:

1. Alicerce comum, sem mudança de comportamento (tarefas 1 e 2).
2. Escala 1, Help Desk N1: `reset-senha-desbloqueio` com SENHA_ESQUECIDA, depois CONTA_BLOQUEADA, depois SENHA_EXPIRADA (tarefas 3 a 8). É o primeiro item porque o Brevê de piloto exige um voo na Escala 1.
3. Causa C4 de `pasta-rede-inacessivel` (tarefas 9 e 10), a menor entrega e a que não depende de nenhum item novo.
4. Vertente N3-B: `falha-backup-restore` com REPOSITORIO_CHEIO, depois CADEIA_CORROMPIDA (tarefas 11 a 14).
5. `incidente-massivo`: EMAIL_PROVEDOR, depois DOMINIO_SUSPENSO (tarefas 15 a 18).
6. Ativação das Causas novas de cenários existentes no Sorteio, com portão de confirmação do usuário (tarefa 19).
7. Validação final, documento de entrega para a tarefa 18 da `jornada-de-voo` e fechamento (tarefas 20 a 22).

Cada Item acrescenta a sua Causa ao Sorteio do cenário novo no mesmo commit que a entrega; as Causas novas de cenários existentes (C4, EMAIL_PROVEDOR, DOMINIO_SUSPENSO) só entram no Sorteio na tarefa 19, e antes dela nascem só por `causaForcada`.

Prazo: tudo commitado antes de 30 de novembro de 2026, 23h59 (congelamento do repositório). Se faltar tempo, o corte começa pelo fim da lista (tarefa 17 e acima). Push e merge só com autorização explícita do usuário.

Decisões pendentes do usuário (padrão adotado em cada uma, ver `requirements.md`): 1) branch e worktree; 2) KB-027 a KB-032 também no Frontend; 3) momento da Ativação no Sorteio; 4) variante por terceiro sorteada pela semente; 5) apelido GATEWAY.

## Tasks

- [x] 0. Preparar branch, linha de base e mapa de impacto
  - [x] 0.1 Conferir o estado de partida
    - Em `D:\Projetos\Ativos\it-flight-simulator-hackbrasil-jornada`, somente leitura: `git status --short --branch`, `git log --oneline -3` e `git rev-parse HEAD`. Registrar o commit de partida
    - Conferir que `docs/vetores-jcs-sha256.json`, `src/frontend/src/utils/jcs.ts` e `src/frontend/src/api` não têm alteração local
    - _Requirements: 16.6, 18.2_
  - [x] 0.2 Criar a branch de trabalho (Decisão 1)
    - Padrão: `git worktree add D:\Projetos\Ativos\it-flight-simulator-hackbrasil-cenarios -b cenarios-por-escala jornada-de-voo`, depois `git status` limpo e `git rev-parse --abbrev-ref HEAD` igual a `cenarios-por-escala` na nova worktree
    - Se o usuário escolher commitar em `jornada-de-voo`, não criar worktree e trabalhar na worktree atual. A pasta `.kiro` nunca entra em commit sem pedido do usuário
    - Nenhum `checkout`, `stash`, `reset` ou `push`
    - _Requirements: 18.2_
  - [x] 0.3 Medir a linha de base de testes
    - Na worktree de trabalho: `dotnet test src/backend/Simulador.slnx`. Anotar o total de testes e quais ficam ignorados (por exemplo os que exigem PostgreSQL) como linha de base, sem gravar arquivo novo
    - _Requirements: 16.1_
  - [x] 0.4 Atualizar o grafo e mapear dependentes
    - `graphify update src` (somente código), depois `graphify explain "Motor" --graph src/graphify-out/graph.json`, e o mesmo para `Juiz360`, `CatalogoCenarios` e `Projecao`. Se o `graphify` estiver indisponível, registrar a limitação e usar `git grep -n` como alternativa
    - `src/graphify-out/` fica fora de commit (já ignorado por `graphify-out/` no `.gitignore`)
    - _Requirements: 16.6_

- [x] 1. Alicerce comum sem mudança de comportamento
  - [x] 1.1 Estender os tipos de estado
    - `src/backend/src/Simulador.Dominio/EstadoSessao.cs`: acrescentar o record `IdentidadeTitular(string Nome, string Matricula, string Ramal, string NomeGestor)`; `DefinicaoCenario` ganha, no fim, `IdentidadeTitular? Titular = null` e `bool PedidoPorTerceiro = false`; `EstadoMeta` ganha, no fim, `bool PedidoPorTerceiro = false`; `EstadoDialogo` ganha, no fim, `bool TitularContatado = false`
    - `dotnet build src/backend/Simulador.slnx` sem erro e sem edição em nenhum outro arquivo (prova de que os valores padrão preservam todo `new` e `with` existente)
    - _Requirements: 16.5_
  - [x] 1.2 Criar `EfeitosDeEventos` e `ComandosPorEscala` vazios e ligar ao Motor e à Projeção
    - `src/backend/src/Simulador.Dominio/EfeitosDeEventos.cs`: `internal static` com `Aplicar(EstadoEstacao, EstadoDialogo, string tipo, IReadOnlyDictionary<string, object?> dados)` que devolve a entrada sem mudança para qualquer tipo, mais o auxiliar `DefinirStatusServico(EstadoEstacao, string nome, string status)` (cria o serviço se não existir)
    - `src/backend/src/Simulador.Dominio/ComandosPorEscala.cs`: `internal sealed record EventoEscala`, `internal sealed record ResultadoComandoEscala`, `TentarExecutar` que devolve `null` e `RedefinirSenha` que lança `NotSupportedException` (ainda sem chamador)
    - `Motor.cs`, `case "estacao.executar_comando"`: inserir a chamada a `TentarExecutar` depois do filtro `suportado` e antes de `ExecutarComandoEstacao`, exatamente como no `design.md`
    - `Projecao.cs`: `default` do `switch` chama `EfeitosDeEventos.Aplicar` e atualiza `estacao` e `dialogo`; `EstadoMeta` final recebe `cenario.PedidoPorTerceiro`. `Motor.AplicarEventosIniciais` copia `cenario.PedidoPorTerceiro` para o `EstadoMeta`
    - _Requirements: 15.2, 16.5_
  - [x] 1.3 Criar `PistasPorCenario` com o texto atual como família padrão
    - `src/backend/src/Simulador.Dominio/PistasPorCenario.cs`: `Obter(string cenarioId, string causa, int indice)` devolve exatamente os 3 textos atuais de `dialogo.pedir_pista` para todos os cenários atuais
    - `Motor.cs`, `case "dialogo.pedir_pista"`: usar `PistasPorCenario.Obter` e manter o limite de 3 e o motivo `pistas_esgotadas`
    - _Requirements: 14.1, 14.2_
  - [x] 1.4 Generalizar `dialogo.verificar_identidade`
    - `Motor.cs`: matrícula e ramal esperados vêm de `cenario.Titular` quando existir e, caso contrário, `AUR-1042` e `2042`. A regra de Pedido_por_Terceiro e a ausência de acesso remoto para cenários com `Titular` entram como no `design.md`. Para cenários sem `Titular`, o comportamento fica idêntico ao atual
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.13_
  - [x] 1.5 Tornar `CatalogoCenarios` e `Juiz360` parciais e ampliar o teste de contrato de KB
    - `CatalogoCenarios.cs`: `public sealed partial class`; `Juiz360.cs`: `public static partial class`. Nenhuma mudança de lógica
    - `tests/Simulador.Dominio.Tests/DominioTests.cs`, `LinksJuiz360_ResolvemNoCatalogoCompartilhadoComFrontend`: no lugar de ler só `Juiz360.cs`, ler todos os `*.cs` de `src/backend/src/Simulador.Avaliacao` e extrair as URIs `kb://` de todos eles
    - _Requirements: 17.3_
  - [x] 1.6 Criar o auxiliar de testes
    - `src/backend/tests/Simulador.Dominio.Tests/SessaoDeTeste.cs`: classe com `Iniciar(cenarioId, versao, causa, semente)`, `Aplicar(tipo, dados)`, `Comando(texto)`, `Estado`, `Eventos`, `Avaliar()` e `Reconstruir()`, usando `Motor`, `Juiz360` e `Projecao` como o teste `FluxoCompleto_C1_...` faz com a função local `Aplicar`
    - _Requirements: 15.1_

- [x] 2. Checkpoint do alicerce
  - `dotnet test src/backend/Simulador.slnx` com o mesmo total da linha de base e nenhuma expectativa alterada, exceto a leitura ampliada do teste de contrato de KB. Perguntar ao usuário se surgirem dúvidas
  - Commit local pequeno: `refactor(backend): alicerce para cenarios por escala sem mudar comportamento`. `git add` por caminho, sem `.kiro`, sem push

- [x] 3. Item 1: `reset-senha-desbloqueio` com a Causa SENHA_ESQUECIDA
  - [x] 3.1 Cadastrar o cenário e o artigo de KB
    - `CatalogoCenarios.cs`: `SuportaVersao` aceita (`reset-senha-desbloqueio`, `v0.1-hackathon`); `Obter` despacha para `CriarResetSenha(versao, causaForcada, semente)`
    - `src/backend/src/Simulador.Cenarios/CatalogoCenarios.ResetSenha.cs` (novo, parcial): Definição do `design.md` (nível, usuário, host, serviço, grupo, `Titular`, estação com `ContaAD` `Ativa`, logs de SENHA_ESQUECIDA, os 7 `ComandosSuportados`, 3 chamados). Sorteio: `SplitMix64(semente)`, primeiro `NextInt(n)` sobre as Causas já entregues (neste item só `SENHA_ESQUECIDA`), segundo `NextInt(2) == 1` para `PedidoPorTerceiro`, e Causa forçada válida substitui só a Causa. Chamado principal por variante conforme o `design.md`
    - `KbCatalogo.cs`: KB-027 (`kb://acesso/reset-desbloqueio-e-troca`). Com a Decisão 2, o mesmo artigo (id, uri, titulo, categoria, nivel e conteudo sintético) em `src/frontend/src/data/kbCatalogo.ts` e nenhum outro arquivo do Frontend. Sem a Decisão 2, usar só URIs de KB-001 a KB-026 nos critérios deste item
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 17.1, 17.2, 17.4, 17.5_
  - [x] 3.2 Implementar identidade, comandos e Eventos de SENHA_ESQUECIDA
    - `ComandosPorEscala.cs`: roteamento por `CenarioId` `reset-senha-desbloqueio`; comandos `net user`, `diretorio`, `discar`, `redefinir-senha`, `desbloquear-conta`, `enviar-link-troca`, e `eventos-seguranca` (resposta "nenhum bloqueio recente", pois a Causa de bloqueio ainda não existe); regra de Ação_Sensível sem `IdentidadeValidada` (`AcaoSensivelSemVerificacao` e `AcaoPrejudicialRegistrada`); `RedefinirSenha` para o atalho de `seguranca.resetar_senha`
    - `EfeitosDeEventos.cs`: casos de `TitularContatado`, `SenhaTemporariaDefinida`, `ContaDesbloqueada`, `ContaBloqueadaNovamente`, `SenhaTrocadaPelaPessoa`, `OrigemBloqueioIdentificada` e `AcessoContaRestabelecido`
    - `Motor.cs`: `case "seguranca.resetar_senha"` chama `ComandosPorEscala.RedefinirSenha` só quando `cenario.Titular` existe; a saída dos eventos segue o `design.md`; nenhum comando deste cenário exige privilégio `Elevado`
    - Nenhuma senha aparece em saída ou Evento
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.10, 2.11, 2.12, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 15.1, 15.2_
  - [x] 3.3 Implementar o Juiz_360 do cenário
    - `src/backend/src/Simulador.Avaliacao/Juiz360.Escalas.cs` (novo, parcial): `AvaliarResetSenha` com H1 a H8, XP, competências, concluída e `IncidenteSeguranca` conforme o `design.md`; `Avaliar` ganha `"reset-senha-desbloqueio" => AvaliarResetSenha`
    - Todo `LinkKb` presente em `KbCatalogo`
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7_
  - [x] 3.4 Pistas e diálogo do cenário
    - `PistasPorCenario.cs`: família `reset-senha-desbloqueio` (3 textos do `design.md`)
    - `ClienteDialogo.cs`: `cliente` por Causa para pedido direto e fluxo de pedido por terceiro (antes e depois de `TitularContatado`); `techlead` em 3 níveis; manter o ramo atual para cenários sem Titular
    - _Requirements: 14.1, 14.3, 14.4, 14.6, 14.7_
  - [x] 3.5 Escrever os testes de exemplo obrigatórios
    - `tests/Simulador.Dominio.Tests/ResetSenhaTests.cs` e `tests/Simulador.Dominio.Tests/DialogoCenariosPorEscalaTests.cs`: criação com semente fixa; fluxo correto direto (assumir, classificar, `net user`, verificar, `redefinir-senha`, resolver) com H1 a H8 atendidos; fluxo correto por terceiro (`diretorio`, `discar 2087`, verificar, redefinir); por terceiro sem `discar` gera `IdentidadeNaoConfere` mesmo com dados certos; `redefinir-senha` sem verificação gera `AcaoSensivelSemVerificacao`, `AcaoPrejudicialRegistrada`, `ContaAD` inalterada e H1 e H4 não atendidos; `desbloquear-conta` e `enviar-link-troca` geram `AcaoDesnecessariaRegistrada` e H6 não atendido; `seguranca.resetar_senha` equivale a `redefinir-senha`; comando fora da lista gera `ComandoNaoSuportado`; Reconstruir iguala `Estacao`, `Dialogo`, `Meta` e hash; pistas não citam a Causa
    - `tests/Simulador.Api.Tests/CenariosPorEscalaApiTests.cs`: `POST /api/sessoes` para `reset-senha-desbloqueio` com `causaForcada` `SENHA_ESQUECIDA` e semente 42 retorna 201 com versão `v0.1-hackathon`; replay oculta a Causa em andamento; `POST /api/carreira/resumo` com a sessão concluída soma XP sem erro e mantém `cargoAtual`
    - `dotnet test src/backend/Simulador.slnx --filter "FullyQualifiedName~ResetSenha|FullyQualifiedName~DialogoCenariosPorEscala|FullyQualifiedName~CenariosPorEscalaApi"` verde
    - _Requirements: 1.1 a 1.8, 2.1 a 2.13, 3.1 a 3.6, 6.1 a 6.7, 14.3, 15.2, 15.3, 15.6, 16.7_
  - [x]* 3.6 Escrever testes de propriedade do item
    - **Property 1: Reconstrução equivalente** (SENHA_ESQUECIDA, as duas variantes, 50 sementes). **Validates: Requirements 15.2, 15.3, 15.4**
    - **Property 2: Determinismo do Sorteio** (200 sementes; forçar a Causa não muda a variante). **Validates: Requirements 1.4, 1.5**
    - **Property 3: Ação sensível sem identidade nunca restabelece** (todas as permutações de `redefinir-senha`, `desbloquear-conta` e `enviar-link-troca` antes de verificar). **Validates: Requirements 2.10, 6.4**
    - **Property 6: Comando fora da lista** (100 textos gerados). **Validates: Requirements 1.7, 19.4**
    - **Property 7: Pistas e respostas não vazam a Causa**. **Validates: Requirements 14.3, 15.6**

- [x] 4. Checkpoint do Item 1
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): cenario reset-senha-desbloqueio com causa SENHA_ESQUECIDA`. Sem push

- [x] 5. Item 2: Causa CONTA_BLOQUEADA
  - [x] 5.1 Cadastrar a Causa
    - `CatalogoCenarios.ResetSenha.cs`: acrescentar `CONTA_BLOQUEADA` ao conjunto sorteado e ao aceito como forçado; estado inicial `ContaAD` `Bloqueada`, `EventosDeSeguranca` `NaoConsultado`, logs sem a Origem_do_Bloqueio, chamado principal por variante
    - _Requirements: 1.4, 4.1_
  - [x] 5.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: `net user` e `eventos-seguranca` da Causa (a saída de `eventos-seguranca` cita `MOB-FIN-017` e emite `OrigemBloqueioIdentificada`); `desbloquear-conta` com origem consultada (`ContaDesbloqueada`, `AcessoContaRestabelecido` com `via` `desbloqueio`) e sem origem (`ContaDesbloqueada`, `ContaBloqueadaNovamente`); `redefinir-senha` e `enviar-link-troca` geram `AcaoDesnecessariaRegistrada` sem restabelecer
    - `EfeitosDeEventos.cs`: conferir que os casos de `OrigemBloqueioIdentificada`, `ContaDesbloqueada` e `ContaBloqueadaNovamente` da tarefa 3.2 produzem o estado esperado; corrigir se faltar
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 15.1, 15.2_
  - [x] 5.3 Juiz_360
    - `Juiz360.Escalas.cs`: H5 aceita `via` `desbloqueio` nesta Causa; acrescentar H9 e H10 (termos normalizados `celular`, `telefone`, `dispositivo`, `movel`, `smartphone` e `senha`); competência "Analise de Origem de Bloqueio"
    - _Requirements: 6.2, 6.3_
  - [x] 5.4 Pistas e diálogo
    - `ClienteDialogo.cs`: respostas de `cliente` da Causa (conta bloqueada, "não digitei errado hoje") para pedido direto e por terceiro; `techlead` nível 1 menciona ler os eventos de segurança quando a conta estiver bloqueada, sem citar a origem
    - _Requirements: 14.4, 14.6_
  - [x] 5.5 Testes de exemplo obrigatórios
    - `ResetSenhaTests.cs`: fluxo correto (`net user`, `eventos-seguranca`, verificar, `desbloquear-conta`, nota pública que cita o celular, resolver) com H1 a H10 atendidos; `desbloquear-conta` sem `eventos-seguranca` gera `ContaDesbloqueada` e `ContaBloqueadaNovamente`, `ContaAD` volta a `Bloqueada`, sem `AcessoContaRestabelecido`, H5 e H9 não atendidos; depois de consultar a origem, novo `desbloquear-conta` restabelece, mas H9 continua não atendido; `redefinir-senha` gera `AcaoDesnecessariaRegistrada`; `eventos-seguranca` em outra Causa não emite `OrigemBloqueioIdentificada`; Reconstruir igual (estado e hash); a saída de `net user` e os `Logs` iniciais não contêm `MOB-FIN-017`
    - _Requirements: 4.1 a 4.8, 6.2, 6.3, 15.2_
  - [x]* 5.6 Escrever testes de propriedade do item
    - **Property 4: Desbloqueio sem origem sempre bloqueia de novo** (todas as ordens de `net user`, `eventos-seguranca`, `desbloquear-conta`). **Validates: Requirements 4.4, 4.5**
    - **Property 1** estendida às duas variantes de CONTA_BLOQUEADA. **Validates: Requirements 15.2, 15.3**

- [x] 6. Checkpoint do Item 2
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): causa CONTA_BLOQUEADA em reset-senha-desbloqueio`. Sem push

- [x] 7. Item 3: Causa SENHA_EXPIRADA
  - [x] 7.1 Cadastrar a Causa
    - `CatalogoCenarios.ResetSenha.cs`: acrescentar `SENHA_EXPIRADA` ao Sorteio e às forçadas; `ContaAD` `SenhaExpirada`; log de logon recusado por senha expirada; chamado principal por variante
    - _Requirements: 1.4, 5.1_
  - [x] 7.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: `net user` da Causa; `enviar-link-troca` com identidade (`OrientacaoRegistrada`, `SenhaTrocadaPelaPessoa`, `AcessoContaRestabelecido` com `via` `troca_pela_titular`); `redefinir-senha` (`SenhaTemporariaDefinida`, `AcessoContaRestabelecido` com `via` `reset`, `AcaoDesnecessariaRegistrada`); `desbloquear-conta` (`AcaoDesnecessariaRegistrada`)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 15.1, 15.2_
  - [x] 7.3 Juiz_360 e diálogo
    - `Juiz360.Escalas.cs`: H5 aceita `via` `troca_pela_titular` nesta Causa; `reset` nesta Causa deixa H5 e H6 não atendidos, mesmo com o acesso restabelecido
    - `ClienteDialogo.cs`: resposta de `cliente` da Causa (senha vencida) para as duas variantes
    - _Requirements: 6.2, 14.4_
  - [x] 7.4 Testes de exemplo obrigatórios
    - `ResetSenhaTests.cs`: fluxo correto com `enviar-link-troca` e H1 a H8 atendidos; fluxo com `redefinir-senha` restabelece o acesso, mas H5 e H6 não atendidos e `IncidenteSeguranca` falso; `desbloquear-conta` gera `AcaoDesnecessariaRegistrada`; Reconstruir igual (estado e hash)
    - _Requirements: 5.1 a 5.5, 6.2, 15.2_
  - [x]* 7.5 Escrever testes de propriedade do item
    - **Property 1** estendida às duas variantes de SENHA_EXPIRADA. **Validates: Requirements 15.2, 15.3**
    - **Property 9: Critérios do Juiz_360 determinísticos** para as 3 Causas de `reset-senha-desbloqueio` (relatório e hash iguais em duas avaliações; todo `LinkKb` em `KbCatalogo`). **Validates: Requirements 6.7, 15.3, 17.3**

- [x] 8. Checkpoint do Item 3
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): causa SENHA_EXPIRADA em reset-senha-desbloqueio`. Sem push

- [x] 9. Item 4: Causa C4 em `pasta-rede-inacessivel`
  - [x] 9.1 Cadastrar C4 como Causa forçada
    - `CatalogoCenarios.cs`, `CriarPastaRede`: aceitar `C4` em `causaForcada`; manter `CausasPastaRede` com C1, C2 e C3 para o Sorteio; `ComandosSuportados` de todas as Causas ganha `net use`; em C4, estado com `UnidadeRedeZ` `NaoMapeada`, logs de C4 e chamado principal de solicitação (os 4 chamados de fila ficam)
    - `KbCatalogo.cs`: KB-032 (`kb://itsm/solicitacao-de-servico`), e a mesma exceção da Decisão 2 em `kbCatalogo.ts`
    - _Requirements: 7.1, 7.2, 17.1, 17.2_
  - [x] 9.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: roteamento para `pasta-rede-inacessivel` e o comando `net use` conforme a tabela do `design.md` (C1 a C4; letra ou caminho diferente do solicitado); Eventos `UnidadeRedeMapeada` e `AcessoPastaRestabelecido`
    - `EfeitosDeEventos.cs`: caso de `UnidadeRedeMapeada`
    - `Motor.cs`: `VerificarCompartilhamentoOk` com a condição `unidadeOk` só para C4
    - Não alterar a saída de nenhum comando existente de C1, C2 e C3
    - _Requirements: 7.3, 7.4, 7.5, 7.7, 15.1, 15.2_
  - [x] 9.3 Juiz_360 e diálogo
    - `Juiz360.cs`: `AvaliarNivel2` acrescenta J6 só quando `Meta.Causa` é `C4` (categoria normalizada contém `solicit`; KB-032)
    - `ClienteDialogo.cs`: resposta de `cliente` de C4
    - _Requirements: 7.6, 14.5_
  - [x] 9.4 Testes de exemplo obrigatórios
    - `tests/Simulador.Dominio.Tests/PastaRedeC4Tests.cs`: fluxo correto de C4 (assumir, classificar como "Solicitacao de Servico", `whoami /groups`, `net use z: \\fileserver.aurora.local\Financeiro`, resolver) com J1 a J6 atendidos; em C4, `net start Workstation` elevado e `ipconfig /flushdns` não restabelecem; `net use z:` em C1, C2 e C3 devolve o erro da tabela e não muda o estado; fluxos C1, C2 e C3 existentes continuam com 5 critérios; Reconstruir igual (estado e hash)
    - `CenariosPorEscalaApiTests.cs`: sessão de `pasta-rede-inacessivel` com `causaForcada` `C4` e semente 42 retorna 201
    - _Requirements: 7.1 a 7.7, 15.2, 16.1_
  - [x]* 9.5 Escrever testes de propriedade do item
    - **Property 8: Sorteio legado inalterado** (antes da ativação, sementes 0 a 199, cálculo independente por `SplitMix64(semente).NextInt(3)`). **Validates: Requirements 16.2**
    - **Property 1** para C4. **Validates: Requirements 15.2, 15.3**

- [x] 10. Checkpoint do Item 4
  - `dotnet test src/backend/Simulador.slnx` verde, com `Semente48_...` ainda sorteando C3. Commit local: `feat(backend): causa C4 unidade de rede nao mapeada em pasta-rede-inacessivel`. Sem push

- [x] 11. Item 5: `falha-backup-restore` com a Causa REPOSITORIO_CHEIO
  - [x] 11.1 Cadastrar o cenário e os artigos de KB
    - `CatalogoCenarios.cs`: `SuportaVersao` aceita (`falha-backup-restore`, `v0.1-hackathon`); `Obter` despacha para `CriarBackupRestore`
    - `src/backend/src/Simulador.Cenarios/CatalogoCenarios.BackupRestore.cs` (novo, parcial): Definição do `design.md` (nível, usuário, host, serviço, grupo, `Servicos`, logs, os 6 `ComandosSuportados`, chamado principal e 1 de fila); Sorteio `SplitMix64(semente).NextInt(n)` sobre as Causas já entregues (neste item só `REPOSITORIO_CHEIO`)
    - `KbCatalogo.cs`: KB-030 e KB-031; exceção da Decisão 2 em `kbCatalogo.ts` para os dois
    - _Requirements: 11.1, 11.2, 11.3, 17.1, 17.2_
  - [x] 11.2 Comandos e Eventos de REPOSITORIO_CHEIO
    - `ComandosPorEscala.cs`: roteamento por `falha-backup-restore` e os comandos `backup status`, `backup log`, `backup repo`, `backup repo expandir`, `backup repo limpar`, `backup job executar`, `backup cadeia verificar` e `backup restore` conforme a tabela do `design.md`, incluindo a resposta de privilégio `Elevado` e os Eventos `RepositorioExpandido` e `BackupConcluido` (com `privilegio`) e as Ações_Prejudiciais de `backup repo limpar` e de `backup restore --origem imutavel` nesta Causa
    - `EfeitosDeEventos.cs`: casos de `RepositorioExpandido` e `BackupConcluido`
    - _Requirements: 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 15.1, 15.2_
  - [x] 11.3 Juiz_360
    - `Juiz360.Escalas.cs`: `AvaliarBackup` com B1 a B6, XP, competências e concluída; `Avaliar` ganha `"falha-backup-restore" => AvaliarBackup`
    - _Requirements: 13.1, 13.2, 13.4, 13.5_
  - [x] 11.4 Pistas e diálogo
    - `PistasPorCenario.cs`: família `falha-backup-restore`; `ClienteDialogo.cs`: `cliente` de REPOSITORIO_CHEIO e `techlead` em 3 níveis
    - _Requirements: 14.1, 14.3, 14.5, 14.6_
  - [x] 11.5 Testes de exemplo obrigatórios
    - `tests/Simulador.Dominio.Tests/BackupRestoreTests.cs`: criação; fluxo correto (assumir, classificar, `backup log`, elevar, `backup repo expandir`, `backup job executar`, resolver com nota pública) com B1 a B6 atendidos e XP 120; `backup job executar` com repositório cheio falha sem mudar estado; operação sem `Elevado` responde erro e B3 não atendido; `backup repo limpar` gera `AcaoPrejudicialRegistrada`, não libera espaço e B5 não atendido com XP reduzido; `backup restore --origem imutavel` gera `AcaoPrejudicialRegistrada`; comando fora da lista gera `ComandoNaoSuportado`; Reconstruir igual (estado e hash)
    - `CenariosPorEscalaApiTests.cs`: sessão de `falha-backup-restore` com semente 42 retorna 201 e cria o chat; `Chat` do cenário bloqueia prompt injection com a resposta atual
    - _Requirements: 11.1 a 11.10, 13.1 a 13.5, 15.2_
  - [x]* 11.6 Escrever testes de propriedade do item
    - **Property 1** para REPOSITORIO_CHEIO. **Validates: Requirements 15.2, 15.3**
    - **Property 2** para o Sorteio do cenário. **Validates: Requirements 11.2, 15.3**
    - **Property 5: Rejeição não muda estado** para ações com argumentos inválidos neste cenário. **Validates: Requirement 15.5**

- [x] 12. Checkpoint do Item 5
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): cenario falha-backup-restore com causa REPOSITORIO_CHEIO`. Sem push

- [x] 13. Item 6: Causa CADEIA_CORROMPIDA
  - [x] 13.1 Cadastrar a Causa
    - `CatalogoCenarios.BackupRestore.cs`: acrescentar `CADEIA_CORROMPIDA` ao Sorteio e às forçadas; `PastaFinanceiro` `Indisponivel`; logs e chamado principal da Causa
    - _Requirements: 11.2, 12.1_
  - [x] 13.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: ramos de CADEIA_CORROMPIDA de `backup log`, `backup repo`, `backup repo expandir`, `backup job executar`, `backup cadeia verificar` e `backup restore` (imutável com `Elevado`: `PastaFinanceiroRestaurada` com `origem` `imutavel` e `privilegio`; incremental: falha sem Evento)
    - `EfeitosDeEventos.cs`: caso de `PastaFinanceiroRestaurada`
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 15.1, 15.2_
  - [x] 13.3 Juiz_360 e diálogo
    - `Juiz360.Escalas.cs`: B4 aceita `PastaFinanceiroRestaurada` com `origem` `imutavel` nesta Causa; acrescentar B7 (`backup cadeia` antes da restauração); `ClienteDialogo.cs`: `cliente` da Causa
    - _Requirements: 13.2, 13.3, 14.5_
  - [x] 13.4 Testes de exemplo obrigatórios
    - `BackupRestoreTests.cs`: fluxo correto (`backup log`, `backup cadeia verificar`, elevar, `backup restore --origem imutavel --destino \\fileserver.aurora.local\Financeiro`, resolver) com B1 a B7 atendidos; restore pela cadeia incremental falha sem mudar estado; restore sem `backup cadeia verificar` restabelece, mas B7 não atendido; `backup repo expandir` e `backup job executar` não resolvem; Reconstruir igual (estado e hash)
    - _Requirements: 12.1 a 12.7, 13.2, 13.3, 15.2_
  - [x]* 13.5 Escrever testes de propriedade do item
    - **Property 1** para CADEIA_CORROMPIDA. **Validates: Requirements 15.2, 15.3**
    - **Property 9** para as 2 Causas de `falha-backup-restore`. **Validates: Requirements 13.5, 15.3, 17.3**

- [x] 14. Checkpoint do Item 6
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): causa CADEIA_CORROMPIDA em falha-backup-restore`. Sem push

- [x] 15. Item 7: Causa EMAIL_PROVEDOR em `incidente-massivo`
  - [x] 15.1 Abrir o cenário para Causas e cadastrar EMAIL_PROVEDOR
    - `CatalogoCenarios.cs`: `CriarIncidenteMassivo(versao, causaForcada, semente)`; `CausasIncidenteSorteio` com só `PATCH_MASSIVO`; aceitar como forçadas `PATCH_MASSIVO`, `EMAIL_PROVEDOR`, `DOMINIO_SUSPENSO` e o apelido `GATEWAY` (convertido para `PATCH_MASSIVO`); a Definição de PATCH_MASSIVO fica idêntica à atual
    - `src/backend/src/Simulador.Cenarios/CatalogoCenarios.IncidenteMassivo.cs` (novo, parcial): Definição de EMAIL_PROVEDOR do `design.md` (host, serviços, 6 comandos, logs, 3 chamados)
    - `KbCatalogo.cs`: KB-028 e KB-029; exceção da Decisão 2 em `kbCatalogo.ts` para os dois
    - _Requirements: 8.1, 8.2, 8.8, 16.3, 16.4, 17.1, 17.2_
  - [x] 15.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: roteamento por `incidente-massivo` com Causa externa; `curl -i https://status.provedor-email.example`, `acionar fornecedor`, `acionar financeiro` e `acompanhar fornecedor` conforme o `design.md`; `AreaAcionada`, `EvidenciaExternaConfirmada`, `AcompanhamentoRegistrado` e `ServicoExternoRestabelecido`
    - `EfeitosDeEventos.cs`: casos de `AreaAcionada` e `ServicoExternoRestabelecido`
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 15.1, 15.2_
  - [x] 15.3 Juiz_360
    - `Juiz360.cs`: `Avaliar` despacha `incidente-massivo` por `Meta.Causa`; `Juiz360.Escalas.cs`: `AvaliarIncidenteExterno` com F1 a F9 (F4 e F7 por Causa), XP e competências; PATCH_MASSIVO continua em `AvaliarNivel3` com M1 a M8 inalterados
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 15.4 Pistas e diálogo
    - `PistasPorCenario.cs`: família externa de `incidente-massivo`; `ClienteDialogo.cs`: `cliente` e `techlead` das Causas externas, mantendo o texto atual para PATCH_MASSIVO
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6_
  - [x] 15.5 Testes de exemplo obrigatórios
    - `tests/Simulador.Dominio.Tests/IncidenteExternoTests.cs`: Definição de EMAIL_PROVEDOR; fluxo correto (assumir e classificar, `curl -i`, criar Problema, vincular os 3 chamados, `acionar fornecedor`, nota pública, `acompanhar fornecedor`, causa raiz com `provedor`, resolver em lote) com F1 a F9 atendidos; `acompanhar fornecedor` antes de acionar não restabelece; `acionar fornecedor` sem evidência deixa F3 não atendido; `estacao.reiniciar_servico` elevado deixa F8 não atendido; PATCH_MASSIVO: o fluxo atual (existente em `DominioTests`) continua com M1 a M8 e as mesmas pistas; `causaForcada` `GATEWAY` grava `PATCH_MASSIVO`; Reconstruir igual (estado e hash)
    - `CenariosPorEscalaApiTests.cs`: sessão de `incidente-massivo` com `causaForcada` `EMAIL_PROVEDOR` retorna 201; sem Causa forçada, 20 sementes devolvem sempre PATCH_MASSIVO (antes da ativação)
    - _Requirements: 8.1 a 8.8, 10.1 a 10.5, 15.2, 16.3_
  - [x]* 15.6 Escrever testes de propriedade do item
    - **Property 1** para EMAIL_PROVEDOR. **Validates: Requirements 15.2, 15.3**
    - **Property 8** para `incidente-massivo` (antes da ativação). **Validates: Requirement 16.3**

- [x] 16. Checkpoint do Item 7
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): causa EMAIL_PROVEDOR em incidente-massivo`. Sem push

- [x] 17. Item 8: Causa DOMINIO_SUSPENSO
  - [x] 17.1 Cadastrar a Causa
    - `CatalogoCenarios.IncidenteMassivo.cs`: Definição de DOMINIO_SUSPENSO do `design.md` (host `www.aurora-logistica.example` sem registro no DNS do cenário, `DominioPublico` `Suspenso`, `AreaFornecedor` e `AreaFinanceiro` `Pendente`, 6 comandos com `whois`, logs, 3 chamados); aceitar como forçada
    - _Requirements: 9.1, 9.2, 9.3, 9.8_
  - [x] 17.2 Comandos e Eventos
    - `ComandosPorEscala.cs`: `whois aurora-logistica.example` (`clientHold`, `EvidenciaExternaConfirmada`); `acionar fornecedor` e `acionar financeiro` com `Financeiro` útil nesta Causa; `acompanhar fornecedor` só com as duas áreas `Acionada`, com a mensagem do que falta
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 15.1, 15.2_
  - [x] 17.3 Juiz_360 e diálogo
    - `Juiz360.Escalas.cs`: F4 exige `Fornecedor` e `Financeiro`; F7 exige `dominio`, `registrador` e um de `fatura`, `inadimpl`, `pagamento`; `ClienteDialogo.cs`: `cliente` da Causa
    - _Requirements: 10.2, 14.5_
  - [x] 17.4 Testes de exemplo obrigatórios
    - `IncidenteExternoTests.cs`: fluxo correto (`whois`, Problema e vínculos, `acionar fornecedor`, `acionar financeiro`, nota pública, `acompanhar fornecedor`, causa raiz com domínio, registrador e fatura, resolver em lote) com F1 a F9 atendidos; `acompanhar fornecedor` com só uma área acionada devolve a área que falta; `nslookup` e `ping` respondem host não encontrado; Reconstruir igual (estado e hash); a saída de `sc query` e os logs iniciais não citam `clientHold` nem a fatura
    - _Requirements: 9.1 a 9.8, 10.2, 15.2_
  - [x]* 17.5 Escrever testes de propriedade do item
    - **Property 1** para DOMINIO_SUSPENSO. **Validates: Requirements 15.2, 15.3**
    - **Property 7** para as Causas de `incidente-massivo`. **Validates: Requirements 14.3, 15.6**

- [x] 18. Checkpoint do Item 8
  - `dotnet test src/backend/Simulador.slnx` verde. Commit local: `feat(backend): causa DOMINIO_SUSPENSO em incidente-massivo`. Sem push

- [x] 19. Ativação das Causas novas no Sorteio (portão do usuário)
  - [x] 19.1 Pedir a confirmação da Decisão 3
    - Perguntar ao usuário se C4, EMAIL_PROVEDOR e DOMINIO_SUSPENSO entram no Sorteio agora. Sem resposta afirmativa, pular as tarefas 19.2 e 19.3 e manter as Causas acessíveis só por `causaForcada`
    - Informar que `lab/dicaMissao.ts` e `lab/roteiros.ts` do Frontend não têm roteiro para as Causas novas
    - _Requirements: 18.4, 18.5_
  - [x] 19.2 Ativar no Sorteio e ajustar o teste da semente
    - `CatalogoCenarios.cs`: `CausasPastaRede` passa a `C1`, `C2`, `C3`, `C4`; `CausasIncidenteSorteio` passa a `PATCH_MASSIVO`, `EMAIL_PROVEDOR`, `DOMINIO_SUSPENSO`
    - `ApiTests.cs`, `Semente48_SorteiaC3SemPostgres_EOcultaCausaNoReplayEmAndamento`: trocar a semente 48 por uma semente que continue sorteando C3 com 4 Causas (calcular com `SplitMix64`, por exemplo uma semente cujo primeiro valor tem resto 2 módulo 4), mantendo as demais asserções; o fato medido para a semente 48 é resto 3 módulo 4, ou seja, C4
    - Ajustar o teste do Item 7 que fixa PATCH_MASSIVO sem Causa forçada para a nova regra
    - _Requirements: 18.4_
  - [x] 19.3 Provar a estabilidade das sessões gravadas
    - Teste novo em `PastaRedeC4Tests.cs`: para as sementes 0 a 199 e as Causas C1 a C3, `Obter(..., causaForcada: Cx, semente)` devolve a Definição de antes da ativação, e `Reconstruir` de uma sessão iniciada com Causa C1 a C3 produz o mesmo estado
    - `dotnet test src/backend/Simulador.slnx` verde
    - _Requirements: 15.4, 18.4_
  - [x]* 19.4 Escrever teste de propriedade da ativação
    - **Property 8** (segunda metade): sessões gravadas com Causa C1 a C3 reconstroem igual. **Validates: Requirements 16.2, 18.4**
  - [x] 19.5 Checkpoint da ativação
    - Commit local: `feat(backend): causas novas de cenarios existentes entram no sorteio`. Sem push

- [x] 20. Validação final e documento de entrega
  - [x] 20.1 Rodar a validação completa
    - `dotnet build src/backend/Simulador.slnx` e `dotnet test src/backend/Simulador.slnx` verdes, com o total de testes da linha de base mais os testes novos
    - Conferir `git diff --name-only <commit de partida>..HEAD`: nenhuma alteração em `src/backend/src/Simulador.Api/Program.cs`, `src/frontend/src/api`, `src/frontend/src/utils/jcs.ts`, `docs/vetores-jcs-sha256.json`, `render.yaml` nem pacotes; em `src/frontend`, somente `src/frontend/src/data/kbCatalogo.ts` (Decisão 2)
    - Se a Decisão 2 autorizou a exceção: `npm.cmd test -- --run src/data/kbCatalogo.test.ts` em `src/frontend` (somente esse teste), sem `npm install`
    - _Requirements: 16.1, 16.5, 16.6, 16.8, 17.2_
  - [x] 20.2 Varreduras de texto
    - `Select-String` nos arquivos novos e alterados de `.md`, `.cs` (textos e strings) e em `kbCatalogo.ts` pelo caractere montado por `[string][char]38` (permitido só como operador lógico duplo em `.cs`), por emoji e por dados reais. Corrigir o que achar
    - _Requirements: 19.2, 19.3_
  - [x] 20.3 Criar o documento de entrega
    - `docs/CENARIOS_POR_ESCALA.md`: tabela com uma linha por Item (Cenário, Causa, identificador gravado, disponibilidade `forçada` ou `sorteada`, comandos declarados, Eventos novos, critérios do Juiz_360), os pontos de atenção do Frontend do `design.md` e a lista de itens que não entraram, se houver. Sem E comercial, sem emoji e sem dado real
    - _Requirements: 18.6_
  - [x] 20.4 Commit local
    - `docs: tabela de entrega dos cenarios por escala`. Sem push

- [x] 21. Fechamento antes do congelamento
  - [x] 21.1 Conferir os commits e o prazo
    - `git status` limpo (fora a `.kiro` não versionada), `git log --oneline jornada-de-voo..cenarios-por-escala` com commits pequenos e descritivos, tudo commitado antes de 30 de novembro de 2026, 23h59
    - Push, merge em `jornada-de-voo` e abertura de PR só com autorização explícita do usuário. Nenhum comando destrutivo do Git
    - Avisar o usuário de que a tarefa 18 da `jornada-de-voo` pode trocar o status dos Itens entregues, item a item, conforme a tabela do `docs/CENARIOS_POR_ESCALA.md`
    - _Requirements: 18.2, 18.7_

- [x] 22. Checkpoint final
  - Garantir que todos os testes passam. Perguntar ao usuário se surgirem dúvidas.

## Notes

- Sub-tarefas com `*` são testes de propriedade opcionais, além do essencial. Os testes de exemplo de cada Item são obrigatórios.
- Cada tarefa cita os requisitos de `requirements.md` para rastreabilidade. Detalhes de implementação estão em `design.md`.
- Testes de propriedade usam `[Theory]` e `SplitMix64` fixo, sem biblioteca nova, com no mínimo 50 execuções, e cada um traz o comentário `Feature: cenarios-por-escala, Property N: <texto>`.
- Cada Checkpoint roda o `dotnet test src/backend/Simulador.slnx` completo e faz um commit local pequeno. `git add` sempre por caminho, nunca `git add .`, e a pasta `.kiro` não entra em commit sem pedido do usuário.
- Nenhuma tarefa altera `src/backend/src/Simulador.Api/Program.cs`, `src/frontend/src/api`, `src/frontend/src/utils/jcs.ts`, `docs/vetores-jcs-sha256.json`, `render.yaml` ou pacotes. A única edição permitida no Frontend é `src/frontend/src/data/kbCatalogo.ts`, e só com a Decisão 2.
- Nenhum comando destrutivo do Git. Push, merge e PR só com autorização explícita do usuário.
- Não rodar Playwright, `npm install` nem servidores nesta spec. As portas 8080 e 5173 e o limitador da API são compartilhados com o trabalho do Frontend.
- Prazo de congelamento: 30 de novembro de 2026, 23h59. Os checkpoints 2, 4, 6, 8, 10, 12, 14, 16, 18 e 19.5 fazem commits locais para que uma interrupção não perca trabalho.
- Cada Item pode ser entregue sozinho depois do alicerce (tarefas 1 e 2). Dependências reais: Itens 2 e 3 dependem do Item 1; o Item 6 depende do Item 5; o Item 8 depende do Item 7; a tarefa 19 depende dos Itens 4, 7 e 8.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1"] },
    { "id": 1, "tasks": ["0.2", "0.3", "0.4"] },
    { "id": 2, "tasks": ["1.1"] },
    { "id": 3, "tasks": ["1.2", "1.3", "1.5", "1.6"] },
    { "id": 4, "tasks": ["1.4"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["3.2", "3.4"] },
    { "id": 7, "tasks": ["3.3"] },
    { "id": 8, "tasks": ["3.5"] },
    { "id": 9, "tasks": ["3.6"] },
    { "id": 10, "tasks": ["5.1"] },
    { "id": 11, "tasks": ["5.2", "5.4"] },
    { "id": 12, "tasks": ["5.3"] },
    { "id": 13, "tasks": ["5.5"] },
    { "id": 14, "tasks": ["5.6", "7.1"] },
    { "id": 15, "tasks": ["7.2"] },
    { "id": 16, "tasks": ["7.3"] },
    { "id": 17, "tasks": ["7.4"] },
    { "id": 18, "tasks": ["7.5", "9.1"] },
    { "id": 19, "tasks": ["9.2"] },
    { "id": 20, "tasks": ["9.3"] },
    { "id": 21, "tasks": ["9.4"] },
    { "id": 22, "tasks": ["9.5", "11.1"] },
    { "id": 23, "tasks": ["11.2", "11.4"] },
    { "id": 24, "tasks": ["11.3"] },
    { "id": 25, "tasks": ["11.5"] },
    { "id": 26, "tasks": ["11.6", "13.1"] },
    { "id": 27, "tasks": ["13.2"] },
    { "id": 28, "tasks": ["13.3"] },
    { "id": 29, "tasks": ["13.4"] },
    { "id": 30, "tasks": ["13.5", "15.1"] },
    { "id": 31, "tasks": ["15.2", "15.4"] },
    { "id": 32, "tasks": ["15.3"] },
    { "id": 33, "tasks": ["15.5"] },
    { "id": 34, "tasks": ["15.6", "17.1"] },
    { "id": 35, "tasks": ["17.2"] },
    { "id": 36, "tasks": ["17.3"] },
    { "id": 37, "tasks": ["17.4"] },
    { "id": 38, "tasks": ["17.5", "19.1"] },
    { "id": 39, "tasks": ["19.2"] },
    { "id": 40, "tasks": ["19.3"] },
    { "id": 41, "tasks": ["19.4", "19.5"] },
    { "id": 42, "tasks": ["20.1"] },
    { "id": 43, "tasks": ["20.2", "20.3"] },
    { "id": 44, "tasks": ["20.4"] },
    { "id": 45, "tasks": ["21.1"] }
  ]
}
```
