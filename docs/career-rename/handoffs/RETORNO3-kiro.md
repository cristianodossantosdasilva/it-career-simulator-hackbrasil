# RETORNO3 kiro: vocabulario de voo zerado em src/frontend/src e src/backend

## Feito (script docs/career-rename/etapa3.cjs, descartavel)
- localStorage: itfs_voos_ativos -> itfs_missoes_ativas, itfs_registros_voo -> itfs_registros_missao, itfs_modo_cabine -> itfs_modo_mesa, itfs_cabine_revisar -> itfs_mesa_revisar. Dados antigos nao sao migrados.
- Campos persistidos: primeiraEscalaId -> primeiraEtapaId, escalaId -> etapaId. Origens 'checkin'/'checkin-rapido' -> 'diagnostico'/'diagnostico-rapido'; versaoRoteiro checkin-vN -> diagnostico-vN.
- Convite: ConviteCopiloto -> ConviteMentor (git mv), CONVITE_COPILOTO -> CONVITE_MENTOR, classe convite-mentor, titulo "Seja mentor do projeto".
- Papel do Mentor `copiloto`/"Copiloto" -> `acompanhante`/"Acompanhante". Desvio do BRIEF: ja existe o papel `mentor`, entao trocar por "Mentor" geraria dois papeis iguais. Se preferir outro nome, e uma troca de texto em catalogoMentor.ts.
- missoesEmbarcaveis -> missoesIniciaveis.
- Backend: Escala -> Etapa em identificadores, comentarios e nomes de arquivo: ComandosPorEtapa.cs, Juiz360.Etapas.cs, EventoEtapa, ResultadoComandoEtapa, testes CenariosPorEtapa*. Nenhum nome serializado, contrato de API, JCS ou vetor foi tocado (o texto "Sem etapa concluida" ja era o do Program.cs; o teste ApiTests ainda esperava "Sem escala concluida" e foi alinhado).

## Validacao
- frontend: tsc -b sem erros; lint 0 erros; vitest 67 arquivos / 584 testes; build OK.
- backend: dotnet test Simulador.slnx: Dominio 2316 e Api 36 aprovados, 0 falhas.

## Varredura
`git grep -i -P "voo|flight|cabine|hangar|comandante|caixa.?preta|brev[eé]|check-?in|embarc|decol|piloto|cockpit|escala(?!r)|copiloto"` em src/frontend/src e src/backend: zero ocorrencias. Sobra legitima: o verbo "escalar" (ITSM) em ChatApp, SimuDeskApp e catalogoRotas.

## Fora do meu escopo (so listar)
Nome do repositorio/pasta, dominio Vercel it-flight-simulator-hackbrasil e service name do Render. E2E e docs: AGY (chaves novas acima).