# Novas ideias de conteudo e cenarios

## Principio de desenho

Cada laboratorio deve ensinar uma competencia observavel, permitir erro seguro, exigir justificativa e terminar com uma explicacao curta. O motor deterministico deve continuar como autoridade. Tutoria e dialogo podem orientar, mas nao devem alterar estado nem dar nota tecnica.

## Ideias de produto

1. **Mapa de competencia inicial**: cinco minutos de triagem com tarefas de leitura, comunicacao, logica e seguranca. O resultado escolhe a proxima missao sem rotular o aluno como incapaz.
2. **Modo observador**: o aluno assiste uma resolucao comentada, depois repete com pistas reduzidas.
3. **Cartao de decisao**: antes de uma acao destrutiva, o sistema pede impacto, evidencia, reversibilidade e comunicacao.
4. **Replay comparativo**: comparar a propria trilha com uma trilha segura anonima, destacando primeiro erro e tempo ate recuperacao.
5. **Porta de saida profissional**: cada cenario termina em nota de chamado, explicacao para usuario leigo e resumo para entrevista.
6. **Indice de seguranca**: medir recusas corretas, preservacao de evidencias, validacao de identidade e uso de menor privilegio.

## Mecanicas de aprendizagem

- Recordacao ativa antes da consulta a KB.
- Revisao espaçada com intervalos adaptados ao erro, nao apenas ao acerto.
- Feynman em duas versoes: explicar para usuario leigo e explicar para colega tecnico.
- STAR gerado a partir de eventos reais da sessao, sem inventar experiencia.
- Penalidade pedagogica por acao insegura explicada, mas sem apagar a trilha.
- PBQ com ordem de evidencias, escolha de comando, justificativa e rollback.
- Feedback em tres camadas: resultado, criterio e proxima pratica.

## Cenarios sugeridos por taxonomias de suporte

As KBs foram usadas apenas para identificar categorias tecnicas recorrentes. Nenhum nome de pessoa, cliente, credencial ou registro operacional foi copiado.

1. Estacao Linux sem espaco em disco, com coleta de logs e limpeza reversivel.
2. Android corporativo sem conformidade MDM, exigindo isolamento e contato com usuario.
3. iPhone corporativo sem sincronizacao, distinguindo conta, rede e politica MDM.
4. Softphone sem audio, com teste de dispositivo, codec, rede e escalonamento VoIP.
5. Impressora de rede com fila presa, diferenciando spooler, driver, permissao e papel.
6. VPN instavel, com coleta de horario, rota, DNS e impacto por grupo.
7. Conta bloqueada apos tentativa de engenharia social, com preservacao de evidencias.
8. Falha de restore, exigindo validar RPO, RTO, integridade e teste de recuperacao.
9. Certificado expirado em servico interno, com comunicacao de risco e plano de renovacao.
10. Consulta SQL de auditoria, com allowlist, limite de linhas e rejeicao de escrita.

## Melhorias nos oito laboratorios

- UC1: incluir diagnostico de energia e ESD com checklist de seguranca.
- UC2: colocar Windows e Linux lado a lado, com comandos declarados e diferencas de permissao.
- UC3: ensinar cabeamento, DHCP, DNS e Wi-Fi por camadas antes do heatmap.
- UC4: transformar atendimento e escrita de chamado em criterio de dominio.
- UC5: exigir RCA com evidencia, impacto, causa e prevencao.
- UC6: usar topologia generica antes de referencias nominativas de fabricantes.
- UC7: simular restore parcial, falha de backup e teste de DR.
- UC8: unir phishing, IAM, logs e SQL read-only em uma cadeia auditavel.

## VideoCall com agentes de IA

Onda 4 deve ser posterior a uma base de identidade e consentimento. O agente deve atuar como persona de treino, nunca como juiz oculto. Regras minimas:

- consentimento separado para audio, video, transcricao e uso para melhoria;
- modo sem armazenamento por padrao;
- aviso visivel quando a fala e sintetica;
- limite de custo por aluno e por sessao;
- encerramento manual e fallback textual;
- avaliacao derivada de eventos observaveis, nao de emocao, sotaque ou aparencia;
- testes de vies, acessibilidade, latencia e recuperacao de falha;
- fluxo especial para menores com participacao do responsavel.

## Conteudo que deve ser cortado do pitch

Nao prometer no presente oito laboratorios completos, 80 cenarios, certificacao de terceiros, video ao vivo, empregabilidade garantida ou custo por aluno sem dados de operacao. Mostrar o que existe e apontar o restante como roadmap com marcos e criterios de aceite.

