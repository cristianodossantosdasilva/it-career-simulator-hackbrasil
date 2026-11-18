# Cenários por escala: tabela de entrega do backend

Documento de entrega da spec `cenarios-por-escala` para a tarefa 18 da `jornada-de-voo` e para o Frontend. Fonte da verdade: o motor determinístico (`Simulador.Dominio`, `Simulador.Cenarios`, `Simulador.Avaliacao`). Todos os dados são sintéticos (empresa Aurora Logística, domínios `aurora.local` e `aurora-logistica.example`, hosts de documentação `*.example`).

Estado medido em 2026-11-17, branch `jornada-de-voo`. Tudo abaixo passou em `dotnet test src/backend/Simulador.slnx`. A disponibilidade `sorteada` significa que a Causa nasce quando a sessão é criada sem `causaForcada`. Toda Causa também nasce por `causaForcada`.

## Itens entregues

| Item | Cenário (versão) | Causa gravada | Disponibilidade | Comandos declarados | Eventos novos | Critérios do Juiz 360 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `reset-senha-desbloqueio` (`v0.1-hackathon`) | `SENHA_ESQUECIDA` | sorteada e forçada | `net user`, `eventos-seguranca`, `diretorio`, `discar`, `redefinir-senha`, `desbloquear-conta`, `enviar-link-troca` | `TitularContatado`, `SenhaTemporariaDefinida`, `AcessoContaRestabelecido`, `AcaoSensivelSemVerificacao`, `AcaoDesnecessariaRegistrada` | H1 a H8 (XP máximo 90) |
| 2 | `reset-senha-desbloqueio` | `CONTA_BLOQUEADA` | sorteada e forçada | os mesmos 7 | `ContaDesbloqueada`, `ContaBloqueadaNovamente`, `OrigemBloqueioIdentificada` | H1 a H10 (XP máximo 110) |
| 3 | `reset-senha-desbloqueio` | `SENHA_EXPIRADA` | sorteada e forçada | os mesmos 7 | `SenhaTrocadaPelaPessoa`, `OrientacaoRegistrada` | H1 a H8 (XP máximo 90) |
| 4 | `pasta-rede-inacessivel` (`v1.1`) | `C4` | sorteada e forçada (ativada na tarefa 19) | os de C1 a C3 mais `net use` | `UnidadeRedeMapeada` | J1 a J5 mais J6 (classificar como solicitação de serviço) |
| 5 | `falha-backup-restore` (`v0.1-hackathon`) | `REPOSITORIO_CHEIO` | sorteada e forçada | `backup status`, `backup log`, `backup repo`, `backup cadeia`, `backup job`, `backup restore` | `RepositorioExpandido`, `BackupConcluido` | B1 a B6 (XP máximo 120) |
| 6 | `falha-backup-restore` | `CADEIA_CORROMPIDA` | sorteada e forçada | os mesmos 6 | `PastaFinanceiroRestaurada` | B1 a B7 (XP máximo 140) |
| 7 | `incidente-massivo` (`v0.1-hackathon`) | `EMAIL_PROVEDOR` | sorteada e forçada (ativada na tarefa 19) | `sc query`, `ping`, `nslookup`, `curl -i`, `acionar`, `acompanhar` | `AreaAcionada`, `EvidenciaExternaConfirmada`, `AcompanhamentoRegistrado`, `ServicoExternoRestabelecido` | F1 a F9 (XP máximo 100) |
| 8 | `incidente-massivo` | `DOMINIO_SUSPENSO` | sorteada e forçada (ativada na tarefa 19) | `sc query`, `ping`, `nslookup`, `whois`, `acionar`, `acompanhar` | os mesmos de EMAIL_PROVEDOR | F1 a F9 (XP máximo 100) |

Causas que já existiam e continuam iguais: `pasta-rede-inacessivel` C1, C2 e C3 (J1 a J5); `incidente-massivo` `PATCH_MASSIVO` (M1 a M8, 4 comandos, serviço `AuroraGateway`).

## Lista exata de Causas aceitas pelo backend

| Cenário | Aceitas em `causaForcada` | Sorteadas sem `causaForcada` |
| --- | --- | --- |
| `reset-senha-desbloqueio` | `SENHA_ESQUECIDA`, `CONTA_BLOQUEADA`, `SENHA_EXPIRADA` | as 3 |
| `falha-backup-restore` | `REPOSITORIO_CHEIO`, `CADEIA_CORROMPIDA` | as 2 |
| `pasta-rede-inacessivel` | `C1`, `C2`, `C3`, `C4` | as 4 |
| `incidente-massivo` | `PATCH_MASSIVO`, `EMAIL_PROVEDOR`, `DOMINIO_SUSPENSO`, e o apelido `GATEWAY` (gravado como `PATCH_MASSIVO`) | as 3 |

Os outros cenários (`triagem-engenharia-social`, `sre-cloud-latencia`, `diagnostico-sql-readonly`) não mudaram. Uma `causaForcada` desconhecida cai no sorteio pela semente, como antes.

## Variante por terceiro

`reset-senha-desbloqueio` sorteia pela semente se o pedido vem da própria titular ou de um terceiro (o gestor). Forçar a Causa não muda a variante. No pedido por terceiro, a identidade só vale se a titular for contatada pelo ramal do diretório (`diretorio`, depois `discar`). Ação sensível sem identidade verificada gera `AcaoSensivelSemVerificacao` e `AcaoPrejudicialRegistrada` e não muda a conta.

## Mudança no sorteio (tarefa 19, autorizada pelo usuário)

C4, `EMAIL_PROVEDOR` e `DOMINIO_SUSPENSO` entraram no sorteio. O mapeamento semente para Causa mudou para sessões novas (resto módulo 4 em `pasta-rede-inacessivel` e módulo 3 em `incidente-massivo`). Efeitos e provas:

- Sessões já gravadas não mudam: `SessaoIniciada` guarda a Causa e a projeção chama `Obter` com ela como Causa forçada. Um teste compara o SHA-256 da Definição de cada Causa forçada, medido antes da ativação, para as sementes 0 a 199.
- A semente 48 de `pasta-rede-inacessivel` sorteava C3 com 3 Causas e passou a sortear C4. O teste de API `Semente48_...` virou `Semente2_SorteiaC3SemPostgres_EOcultaCausaNoReplayEmAndamento` (a semente 2 tem resto 2 módulo 4 e continua sorteando C3).
- O teste `Nivel3_IncidenteMassivo_ProblemaEmLoteERcaNormalizada` agora força `PATCH_MASSIVO`, porque a semente 1 sem Causa forçada passou a sortear `DOMINIO_SUSPENSO`.

## KB

Artigos novos, no backend (`KbCatalogo.cs`) e no frontend (`src/frontend/src/data/kbCatalogo.ts`, única edição do frontend): KB-027 `kb://acesso/reset-desbloqueio-e-troca`, KB-028 `kb://itil/falha-de-fornecedor`, KB-029 `kb://itil/comunicacao-de-incidente`, KB-030 `kb://backup/diagnostico-de-job`, KB-031 `kb://backup/copia-imutavel-e-retencao`, KB-032 `kb://itsm/solicitacao-de-servico`.

## Pontos de atenção para o Frontend (fora desta spec, não verificados na interface)

- `lab/dicaMissao.ts` e `lab/roteiros.ts` não têm roteiro nem dica para as Causas novas (C4, `EMAIL_PROVEDOR`, `DOMINIO_SUSPENSO`, e as três Causas de `reset-senha-desbloqueio` e as duas de `falha-backup-restore`). Como a ativação já aconteceu, uma sessão sem Causa forçada pode cair em uma delas.
- `educacao/catalogoEducacional.ts` não tem nível para os 2 cenários novos, e `nivelPorCenarioId` devolve o primeiro nível quando não encontra o `cenarioId`.
- O Replay e a lista de Eventos podem não ter rótulo para os Eventos novos. O comportamento sem rótulo não foi verificado.
- O Catálogo de Rotas chama a Causa do gateway de `GATEWAY`. O backend aceita o apelido de entrada e grava `PATCH_MASSIVO`.
- O nível exibido pelo backend para os cenários novos é `Help Desk (N1)` (`reset-senha-desbloqueio`) e `Especialista Data Center e Backup (N3-B)` (`falha-backup-restore`). `incidente-massivo` continua em `Analista Pleno (N2)`.
- Testes de ponta a ponta que criam sessões sem `causaForcada` podem receber uma das Causas novas desde a ativação.

## Itens que não entraram

Nenhum. Os 8 Itens da spec estão entregues no backend.
