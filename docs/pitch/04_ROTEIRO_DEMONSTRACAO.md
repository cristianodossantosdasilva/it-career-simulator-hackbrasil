# Roteiro de demonstração para a banca

Caminho passo a passo na demo pública: `https://it-career-simulator-hackbrasil.vercel.app`. Sem login. Dados 100% sintéticos (Aurora Logística, `aurora.local`).


## Antes de começar

- Abrir a demo numa janela anônima, para começar sem dados guardados no navegador.
- O servidor gratuito hiberna e pode levar de 30 a 50 segundos para acordar. Abrir a API publicada em `/health/live` antes e esperar a resposta.
- Há limite de 120 requisições por minuto por IP. Em rede compartilhada, evite várias pessoas na mesma demo ao mesmo tempo.
- Para repetir exatamente o mesmo defeito, usar a semente fixa. Isso funciona porque a demo pública aceita parâmetros de teste (`Demo__PermitirParametrosDeTeste`, padrão ligado). Se o servidor recusar a semente, o aviso aparece na Mesa de Trabalho e a missão segue com sorteio normal.

## Passo 1. Modo de demonstração e Diagnóstico rápido

1. Na página Início, acionar **Atender meu primeiro chamado**.
2. No **Diagnóstico rápido**, conferir as respostas padrão. O texto explica que são respostas padrão.
3. Acionar **Confirmar e iniciar**. O Cartão de Perfil é gravado e o modo de demonstração liga. O modo libera todas as etapas e não conta como missão concluída.
4. A Mesa de Trabalho abre na missão de demonstração `pasta-rede-inacessivel`.

O modo pode ser ligado e desligado no Plano de Carreira, no controle **Liberar todas as etapas para demonstração**.

## Passo 2. Missão de demonstração: `pasta-rede-inacessivel`

Etapa Service Desk N1 Jr. A causa varia por semente (C1 a C4). Para repetir: Plano de Carreira, **Opções avançadas para teste**, **Demo rápida: semente 42, causa disponível**. A semente 42 gera a causa C2.

1. No ITSM, assumir o chamado e classificar.
2. No Comunicador, validar a identidade da Maria (`AUR-1042`). Sem isso o acesso remoto não abre.
3. No SimuDesk, conectar e diagnosticar antes de alterar.
4. Corrigir a causa. O Mentor dá dicas na bancada.
5. Resolver o chamado, com nota pública.

O que a banca vê: a ordem das ações importa, e o sistema só aceita comandos declarados para o cenário. Comando fora do escopo recebe resposta honesta.

## Passo 3. Missão nova: `reset-senha-desbloqueio`, pedido por terceiro

Etapa Help Desk N1. Cenário com três causas (`SENHA_ESQUECIDA`, `CONTA_BLOQUEADA`, `SENHA_EXPIRADA`) e duas variantes: o pedido vem da própria titular ou de um terceiro (o gestor).

Semente fixa para a variante por terceiro: **semente 3**, que sorteia `SENHA_ESQUECIDA` com pedido do gestor Paulo Andrade para a titular Fernanda Lima (`AUR-2087`, ramal `2087`). Também serve a semente 42, que sorteia `CONTA_BLOQUEADA` com pedido por terceiro. Para outras sementes, a variante pode ser pedido direto.

Como abrir: Plano de Carreira, **Opções avançadas para teste**, campo de semente com `3`, e o link da missão Reset de senha e desbloqueio.

Passo a passo:

1. Ler o chamado: o gestor pede para resetar a senha de uma pessoa da equipe e receber a nova.
2. No ITSM, assumir e classificar (Acesso).
3. Consultar a conta com `net user`.
4. Consultar o `diretorio` e `discar` para o ramal da titular. Isso é o contato pelo canal cadastrado.
5. Verificar a identidade da titular, não a do gestor, no Comunicador.
6. Só então aplicar `redefinir-senha` e resolver o chamado, sem repassar a senha ao gestor.

Teste do erro, para mostrar o motor: repetir com uma sessão nova e tentar `redefinir-senha` antes de verificar a titular. O motor registra a ação sensível sem verificação, a conta não muda, e o Juiz 360º marca a falha na Revisão. O critério H2 cobre o contato com a titular antes da verificação.

O que a banca vê: a regra de segurança está no motor, não numa frase do diálogo. Com `CONTA_BLOQUEADA` e `SENHA_EXPIRADA` os comandos e os eventos mudam (desbloquear conta, troca pela própria pessoa).

## Passo 4. Revisão

1. Concluir o chamado e abrir a **Revisão** pelo link do aviso.
2. Recarregar a página. O endereço `/revisao/:sessao` é próprio e mantém o replay.
3. Percorrer o replay cronológico. Cada linha é um evento imutável.
4. Abrir o **Juiz 360º**: critérios binários, cada um com o evento que o prova. A avaliação é a mesma para a mesma trilha.
5. Com o Mentor, pedir ajuda para ler a linha do tempo. O Mentor orienta e não dá nota.

## Passo 5. Portfólio

1. Abrir o **Portfólio**: missões registradas, agrupadas por etapa, e o acompanhamento do portfólio de analista.
2. Usar o **Verificador offline** com o JSON do Currículo Vivo (verificação por JCS RFC 8785, SHA-256 e ECDSA P-256, no navegador, sem rede).
3. Alterar um caractere do JSON e verificar de novo: a adulteração é detectada.

Atenção: o Registro de Missão só aparece para uma missão concluída. O modo de demonstração, por si só, não cria registro. Antes da apresentação, concluir uma missão no mesmo navegador e conferir o Portfólio. A missão concluída grava o Registro com o modo ligado ou desligado.

## Passo 6. Catálogo

1. Abrir o **Catálogo**: catálogo de etapas, vertentes e referências de certificação.
2. Mostrar que as certificações são referência de mercado e não equivalência de diploma.
3. Voltar ao Plano de Carreira e desligar o modo de demonstração. As etapas voltam a seguir as missões concluídas, e as bloqueadas mostram o motivo.

## Quadro rápido: semente e resultado

| Cenário | Semente | Resultado |
| --- | --- | --- |
| `pasta-rede-inacessivel` | 42 (Demo rápida) | Causa C2 (o DNS aponta para `10.10.99.250`). Confirmar no ensaio antes da banca. |
| `reset-senha-desbloqueio` | 3 | `SENHA_ESQUECIDA`, pedido por terceiro. |
| `reset-senha-desbloqueio` | 42 | `CONTA_BLOQUEADA`, pedido por terceiro. |
| `reset-senha-desbloqueio` | 7 | `SENHA_ESQUECIDA`, pedido direto da titular, para comparar. |

As causas desses cenários são sorteadas pela mesma regra do motor (`SplitMix64`). Se o cenário mudar de versão, conferir de novo.

## Se algo não funcionar

- Tela lenta no primeiro acesso: esperar o servidor acordar e recarregar.
- Erro 429: esperar um minuto.
- Semente recusada: seguir com o sorteio normal e dizer isso.
- Dúvida sobre um comando: o catálogo de comandos de cada cenário está em `docs/CENARIOS_POR_ETAPA.md`.
