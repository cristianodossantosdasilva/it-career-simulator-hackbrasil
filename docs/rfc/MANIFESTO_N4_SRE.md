# Manifesto N4 — Diagnóstico SRE/Cloud

> Cenário sintético e determinístico para treinamento; não representa acesso a cluster real.

## Objetivo pedagógico

Investigar degradação de disponibilidade em ambiente cloud simulado, correlacionar logs/métricas sintéticas para identificar a causa raiz entre três cenários distintos, e aplicar mitigação com privilégio elevado. O console simula um ambiente Kubernetes simplificado.

## Causas raiz

| ID | Causa | Sintoma visível | Comando de diagnóstico | Mitigação |
|---|---|---|---|---|
| OOM_KILLED | Pod API com limite de memória insuficiente (128Mi) | CrashLoopBackOff, Exit Code 137 | `kubectl logs api-pedidos` | `kubectl set resources` ou `kubectl rollout restart` com novo limite |
| POOL_EXHAUSTED | PgBouncer saturado (100/100 conexões) | Queries pendentes, FATAL slots reserved | `pg_stat_activity` | `kubectl rollout restart deployment/pgbouncer` com novo max_connections |
| CERT_EXPIRED | Certificado TLS do Ingress expirado | Handshake TLS falha, curl 60 | `kubectl describe ingress` | `kubectl rollout restart deployment/cert-manager` ou renovação manual |

## Dataset e execução

- O cluster é uma simulação em memória mantida pelo Motor. Não há conexão real a Kubernetes, cloud provider, banco ou rede.
- O estado do cluster é derivado de `CatalogoCenarios.CriarSreCloud()` com uma das três causas acima, selecionada por semente determinística ou parâmetro explícito.
- Comandos disponíveis: `kubectl get pods`, `kubectl logs`, `kubectl describe ingress`, `kubectl set resources`, `kubectl rollout restart`, `curl -I`, `pg_stat_activity`.
- Toda execução é uma função pura em relação ao estado da estação: a saída é registrada em `ComandoExecutado`, compondo o replay e o hash de integridade da sessão.

## Fluxo esperado

1. **Assumir e classificar** o chamado de incidente SRE (categoria: Infraestrutura/Cloud, urgência: Crítica, impacto: Generalizado).
2. **Diagnosticar** antes de mitigar: executar comandos de leitura (`kubectl get pods`, `kubectl logs`, `kubectl describe ingress`, `curl -I`, `pg_stat_activity`) para identificar a causa raiz.
3. **Elevar privilégio** antes de aplicar mitigação no cluster.
4. **Aplicar mitigação** com o comando correto para a causa identificada.
5. **Verificar** restauração da disponibilidade (`curl -I` retornando `200`).
6. **Resolver** o chamado com nota pública documentando causa raiz e ação aplicada.

## Causa oculta (simulação pedagógica)

A causa raiz não é óbvia no primeiro comando. O participante precisa correlacionar os sinais:
- **OOM_KILLED:** `kubectl get pods` mostra `CrashLoopBackOff` → `kubectl logs` revela `OOMKilled` / `Exit Code 137` → identificar limite de memória.
- **POOL_EXHAUSTED:** `kubectl get pods` mostra `Running`, mas `curl` falha → `pg_stat_activity` revela saturação → identificar pool de conexões.
- **CERT_EXPIRED:** `kubectl get pods` mostra `Running`, mas `curl` falha com erro TLS → `kubectl describe ingress` revela certificado expirado.

## Gramática de comandos

Aceita somente comandos da lista `ComandosSuportados` do cenário. Qualquer comando fora da lista ou comando de escrita sem privilégio elevado é rejeitado. Comandos destrutivos como `kubectl delete` ou `rm -rf` não estão na lista e são recusados.

## Limites de recursos

- Comandos limitados à lista de 7 comandos SRE simulados.
- Sem loops controlados pelo usuário, rede real, disco ou cluster real.
- Mitigações que não correspondem à causa raiz são registradas, mas não restauram a disponibilidade.

## Evidência e avaliação

O replay conserva o comando aceito e sua saída determinística em `ComandoExecutado`. O Juiz 360º avalia via `AvaliarNivel4Sre`:
- R1: Classificou o incidente antes de encerrar
- R2: Executou diagnóstico antes de mitigar
- R3: Aplicou mitigação com privilégio elevado
- R4: Nenhuma ação destrutiva
- R5: Disponibilidade restaurada e chamado resolvido dentro do SLA

O hash da trilha continua calculado pelo mecanismo JCS (RFC 8785) + SHA-256.

## Limite conhecido

Os comandos e o cluster são uma simulação didática, não um ambiente Kubernetes real. A gramática cobre comandos comuns de troubleshooting, mas não a totalidade do `kubectl`.
