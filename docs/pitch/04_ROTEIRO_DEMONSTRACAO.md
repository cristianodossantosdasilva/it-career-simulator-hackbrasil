# Roteiro de demonstração para a banca

Caminho passo a passo na demo pública: `https://it-flight-simulator-hackbrasil.vercel.app`. Sem login. Dados 100% sintéticos (Aurora Logística, `aurora.local`).


## Antes de começar

- Abrir a demo numa janela anônima, para começar sem dados guardados no navegador.
- O servidor gratuito hiberna e pode levar de 30 a 50 segundos para acordar. Abrir a API publicada em `/health/live` antes e esperar a resposta.
- Há limite de 120 requisições por minuto por IP. Em rede compartilhada, evite várias pessoas na mesma demo ao mesmo tempo.
- Para repetir exatamente o mesmo defeito, usar a semente fixa. Isso funciona porque a demo pública aceita parâmetros de teste (`Demo__PermitirParametrosDeTeste`, padrão ligado). Se o servidor recusar a semente, o aviso aparece na Cabine e o voo segue com sorteio normal.

## Passo 1. Modo de demonstração e Check-in rápido

1. Na página Início, acionar **Experimentar um voo agora**.
2. No **Check-in rápido**, conferir as respostas padrão. O texto explica que são respostas padrão.
3. Acionar **Confirmar e embarcar**. O Cartão de Embarque é gravado e o modo de demonstração liga. O modo libera todas as escalas e não conta como voo concluído.
4. A Cabine abre na missão de demonstração `pasta-rede-inacessivel`.

O modo pode ser ligado e desligado no Plano de voo, no controle **Liberar todas as escalas para demonstração**.

## Passo 2. Missão de demonstração: `pasta-rede-inacessivel`

Escala Service Desk N1 Jr. A causa varia por semente (C1 a C4). Para repetir: Plano de voo, **Opções avançadas para teste**, **Demo rápida: semente 42, causa disponível**.

1. No ITSM, assumir o chamado e classificar.
2. No Comunicador, validar a identidade da Maria (`AUR-1042`). Sem isso o acesso remoto não abre.
3. No SimuDesk, conectar e diagnosticar antes de alterar.
4. Corrigir a causa. O Comandante, no papel de Copiloto, dá dicas.
5. Resolver o chamado, com nota pública.

O que a banca vê: a ordem das ações importa, e o sistema só aceita comandos declarados para o cenário. Comando fora do escopo recebe resposta honesta.

## Passo 3. Missão nova: `reset-senha-desbloqueio`, pedido por terceiro

Escala Help Desk N1. Cenário com três causas (`SENHA_ESQUECIDA`, `CONTA_BLOQUEADA`, `SENHA_EXPIRADA`) e duas variantes: o pedido vem da própria titular ou de um terceiro (o gestor).

Semente fixa para a variante por terceiro: **semente 3**, que sorteia `SENHA_ESQUECIDA` com pedido do gestor Paulo Andrade para a titular Fernanda Lima (`AUR-2087`, ramal `2087`). Também serve a semente 42, que sorteia `CONTA_BLOQUEADA` com pedido por terceiro. Para outras sementes, a variante pode ser pedido direto.

Como abrir: Plano de voo, **Opções avançadas para teste**, campo de semente com `3`, e o link da missão Reset de senha e desbloqueio.

Passo a passo:

1. Ler o chamado: o gestor pede para resetar a senha de uma pessoa da equipe e receber a nova.
2. No ITSM, assumir e classificar (Acesso).
3. Consultar a conta com `net user`.
4. Consultar o `diretorio` e `discar` para o ramal da titular. Isso é o contato pelo canal cadastrado.
5. Verificar a identidade da titular, não a do gestor, no Comunicador.
6. Só então aplicar `redefinir-senha` e resolver o chamado, sem repassar a senha ao gestor.

Teste do erro, para mostrar o motor: repetir com uma sessão nova e tentar `redefinir-senha` antes de verificar a titular. O motor registra a ação sensível sem verificação, a conta não muda, e o Juiz 360º marca a falha na Caixa-preta. O critério H2 cobre o contato com a titular antes da verificação.

O que a banca vê: a regra de segurança está no motor, não numa frase do diálogo. Com `CONTA_BLOQUEADA` e `SENHA_EXPIRADA` os comandos e os eventos mudam (desbloquear conta, troca pela própria pessoa).

## Passo 4. Caixa-preta

1. Concluir o chamado e abrir a **Caixa-preta** pelo link do aviso.
2. Recarregar a página. O endereço `/caixa-preta/:sessao` é próprio e mantém o replay.
3. Percorrer o replay cronológico. Cada linha é um evento imutável.
4. Abrir o **Juiz 360º**: critérios binários, cada um com o evento que o prova. A avaliação é a mesma para a mesma trilha.
5. Com o Comandante no papel de Mentor, pedir ajuda para ler a linha do tempo. O Mentor orienta e não dá nota.

## Passo 5. Brevê

1. Abrir o **Brevê**: voos registrados, agrupados por escala, e o acompanhamento do brevê de piloto.
2. Usar o **Verificador offline** com o JSON do Currículo Vivo (verificação por JCS RFC 8785, SHA-256 e ECDSA P-256, no navegador, sem rede).
3. Alterar um caractere do JSON e verificar de novo: a adulteração é detectada.

Atenção: o Registro de Voo só aparece para um voo concluído. O modo de demonstração, por si só, não cria registro. Antes da apresentação, concluir um voo no mesmo navegador e conferir o Brevê. Se o README e o guia de vídeo divergirem sobre este ponto, vale o que a demo mostrar no ensaio.

## Passo 6. Hangar

1. Abrir o **Hangar**: catálogo de escalas, vertentes e referências de certificação.
2. Mostrar que as certificações são referência de mercado e não equivalência de diploma.
3. Voltar ao Plano de voo e desligar o modo de demonstração. As escalas voltam a seguir os voos concluídos, e as bloqueadas mostram o motivo.

## Quadro rápido: semente e resultado

| Cenário | Semente | Resultado |
| --- | --- | --- |
| `pasta-rede-inacessivel` | 42 (Demo rápida) | Causa disponível do catálogo, a primeira da lista. |
| `reset-senha-desbloqueio` | 3 | `SENHA_ESQUECIDA`, pedido por terceiro. |
| `reset-senha-desbloqueio` | 42 | `CONTA_BLOQUEADA`, pedido por terceiro. |
| `reset-senha-desbloqueio` | 7 | `SENHA_ESQUECIDA`, pedido direto da titular, para comparar. |

As causas desses cenários são sorteadas pela mesma regra do motor (`SplitMix64`). Se o cenário mudar de versão, conferir de novo.

## Se algo não funcionar

- Tela lenta no primeiro acesso: esperar o servidor acordar e recarregar.
- Erro 429: esperar um minuto.
- Semente recusada: seguir com o sorteio normal e dizer isso.
- Dúvida sobre um comando: o catálogo de comandos de cada cenário está em `docs/CENARIOS_POR_ESCALA.md`.
