# Manifesto N4b — Diagnóstico SQL somente leitura

> Cenário sintético e determinístico para treinamento; não representa acesso a banco real.

## Objetivo pedagógico

Investigar a divergência de fechamento entre pedidos e pagamentos, distinguir registros confirmados de uma linha duplicada e registrar evidência observável no replay. O console não oferece shell SQL geral nem conexão externa.

## Dataset e execução

- O dataset é constante, sintético, imutável e mantido em memória pelo motor. Não há conexão, arquivo de banco, persistência externa, transação ou operação de escrita.
- `pedidos`: `PED-1001` R$ 1.200,00; `PED-1002` R$ 450,00; `PED-1003` R$ 800,00 (total R$ 2.450,00).
- `pagamentos`: `PAG-1`/`PED-1001` R$ 1.200,00 `CONFIRMADO`; `PAG-2`/`PED-1002` R$ 450,00 `CONFIRMADO`; `PAG-3`/`PED-1002` R$ 450,00 `DUPLICADO`.
- Toda execução é uma função pura em relação ao estado da estação: a saída é registrada em `ComandoExecutado`, com comando e resultado, compondo o replay e o hash existente. Consultas recusadas geram `AcaoPrejudicialRegistrada` e `ComandoNaoSuportado`.

## Investigações esperadas

1. Agrupar `pagamentos` por `status`: revelar a linha `DUPLICADO`, sua chave `PED-1002` e o impacto de R$ 450,00.
2. Inspecionar os pagamentos: relacionar os três IDs, pedidos, valores e estados; dois registros são confirmados e o terceiro está duplicado.
3. Consultar `pedidos`: comparar a soma de R$ 2.450,00 com os pagamentos e registrar a diferença bruta, explicando a duplicidade sem alterar dados.

## Gramática fail-closed

Aceita somente `SELECT` ou `EXPLAIN SELECT`, uma tabela (`pagamentos` ou `pedidos`), projeções de coluna ou `*`, `COUNT(*)`/`SUM(coluna)`, predicados simples com comparação e `AND`, `GROUP BY`, `ORDER BY` e `LIMIT`. Sem joins, subconsultas, CTE, funções arbitrárias, comentários, parâmetros, múltiplas instruções ou extensões implícitas. Qualquer caractere, token ou forma não reconhecida é recusada; a allowlist define o que é autorizado, e não uma lista de bloqueio parcial.

## Limites de recursos

- Consulta com até 512 caracteres e 100 tokens.
- Até 12 itens projetados, 8 predicados, 4 colunas de agrupamento e `LIMIT` entre 1 e 100.
- Dataset fixo de 6 linhas; sem loops controlados pelo usuário, rede, disco ou alocação dependente de cardinalidade externa.
- `EXPLAIN ANALYZE` é recusado para impedir execução com efeitos fora do contrato.

## Evidência e avaliação

O replay conserva o comando aceito e sua saída determinística em `ComandoExecutado`; tentativas bloqueadas preservam o comando e o motivo nos eventos de segurança/recusa. O Juiz avalia classificação, investigação registrada, ausência de tentativa prejudicial e resolução do chamado. O hash da trilha é calculado pelo mecanismo JCS (RFC 8785) + SHA-256.

## Limite conhecido

A gramática e o dataset são uma simulação didática, não um parser PostgreSQL completo nem uma fronteira para executar SQL real. Casos adversariais cobrem a gramática implementada, sem pretender substituir um SGBD completo.
