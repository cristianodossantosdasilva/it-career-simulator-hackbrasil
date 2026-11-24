# Roteiro do vídeo de até 3 minutos

Total: 2:50, com 10 segundos de folga para respirar. O limite do regulamento é 3:00. O vídeo precisa abrir sem login.

Este roteiro usa os mesmos blocos e os mesmos tempos de `docs/DEPLOY_E_VIDEO.md`, seção 2. A seção 2 descreve o que mostrar na tela. Este arquivo acrescenta a fala. Se um dos dois mudar, mude o outro.

Regras de fala: frases curtas, cerca de 2,5 palavras por segundo, tom calmo. Nada de E comercial nem emoji nos textos de tela e nas legendas. Dados sempre fictícios (Aurora Logística).

## Antes de gravar

- Janela anônima ou perfil limpo, para começar sem dados guardados no navegador.
- Tema claro, largura de 1440 px.
- Abrir `/health/live` da API publicada alguns minutos antes. O servidor gratuito hiberna e demora para acordar.
- Gravar cada bloco separado e montar na edição.
- Para o mesmo defeito em toda tomada, abrir as missões pelas opções avançadas do Plano de Carreira, com semente fixa (ver [04_ROTEIRO_DEMONSTRACAO.md](04_ROTEIRO_DEMONSTRACAO.md)).
- Ler a contagem de testes no último run verde do CI, no dia da gravação.

## Blocos

### 0:00 a 0:15 | Início `/`

- **Tela:** página Início. Apontar "Fazer diagnóstico" e "Atender meu primeiro chamado".
- **Fala:** "Somos o time CVE-K. Faltam pessoas na base da TI, e muita gente desiste do curso sem ter visto o trabalho de perto. O IT Career Simulator deixa a pessoa praticar a rotina real antes de escolher. Tudo com dados fictícios."
- **Mostrar:** o atalho "Atender meu primeiro chamado" é o caminho curto da banca.

### 0:15 a 0:35 | Diagnóstico `/diagnostico`

- **Tela:** três perguntas, uma por vez, com volta à anterior. Indicação Suporte de TI com a regra em tela. Confirmar e mostrar o Cartão de Perfil.
- **Fala:** "O Diagnóstico é a consultoria vocacional. São três perguntas. A regra é pública: pontos fixos por resposta, sem inteligência artificial. Ele indica a rota, e quem decide é a pessoa."

### 0:35 a 0:50 | Plano de Carreira `/plano-de-carreira`

- **Tela:** as quatro etapas com os estados de cada uma. Missão 0 guiada e Glossário rápido. Ativar "Liberar todas as etapas para demonstração" e mostrar o selo e o aviso.
- **Fala:** "O Plano de Carreira mostra as etapas, de Help Desk a N3 Sênior. Cada uma libera a próxima. Para a banca, existe um modo de demonstração que libera tudo. Ele não conta como missão concluída."

### 0:50 a 1:10 | Mesa de Trabalho, Service Desk N1 Jr

- **Tela:** missão `pasta-rede-inacessivel`. Validar a identidade da Maria (`AUR-1042`) no Comunicador. Abrir o SimuDesk, diagnosticar antes de alterar, corrigir a causa, resolver o chamado. O Mentor aparece como apoio na bancada.
- **Fala:** "Este é um atendimento. Primeiro confirmo quem está pedindo. Só então o acesso remoto abre. Diagnostico antes de mexer, corrijo a causa e resolvo o chamado. O Mentor dá dicas, mas não age por mim."

### 1:10 a 1:30 | Mesa de Trabalho, N2 Pleno

- **Tela:** `incidente-massivo`. Problema ITIL com três chamados vinculados, `AuroraGateway` restaurado, resolução em lote.
- **Fala:** "Na etapa seguinte, o problema é maior. Três chamados têm a mesma causa. Abro um Problema, restauro o serviço e resolvo todos de uma vez."

### 1:30 a 1:50 | Mesa de Trabalho, N3-C Segurança e Dados

- **Tela:** `triagem-engenharia-social`. Chamado da suposta Diretoria pedindo reset sem token. KB-001, nota interna, recusa segura.
- **Fala:** "Aqui o desafio é dizer não. Alguém se passa pela diretoria e pede um reset sem token. A resposta certa é recusar, registrar e seguir a política."
- **Opção de reforço, se sobrar tempo:** mostrar o pedido por terceiro de `reset-senha-desbloqueio`, em que a identidade vale só depois do contato com a titular pelo ramal do diretório.

### 1:50 a 2:05 | Mesa de Trabalho, N3-A e N3-C

- **Tela:** `sre-cloud-latencia` com `kubectl` e `curl -I` devolvendo `200`. Depois `diagnostico-sql-readonly` com `SELECT` em `pedidos` e `pagamentos`, achando `DUPLICADO` em `PED-1002`, e o bloqueio de escrita e injeção.
- **Fala:** "Nas etapas avançadas há nuvem e dados. Corrijo a latência e confirmo com um código 200. No banco, só leitura: achei um pagamento duplicado, e o sistema bloqueia qualquer escrita."

### 2:05 a 2:30 | Revisão `/revisao/:sessao` e Portfólio `/portfolio`

- **Tela:** recarregar a Revisão para mostrar o endereço próprio. Replay e Juiz 360º com o Mentor. No Portfólio, as missões concluídas por etapa e o Verificador offline, incluindo a detecção de JSON adulterado.
- **Fala:** "Depois da missão, a Revisão mostra cada ação em ordem. Quem avalia é o Juiz 360º, por critérios que dá para ver, e não o guia. O Currículo Vivo tem hash e assinatura. Verifico no navegador, sem rede, e uma alteração é detectada."

### 2:30 a 2:50 | Arquitetura, testes e encerramento

- **Tela:** diagrama curto do motor e dos eventos. Contagem de testes lida do CI. Links do repositório e da demo.
- **Fala:** "Por dentro, um motor determinístico com registro de eventos, em .NET 10 e PostgreSQL, e React no navegador. Sem custo de inteligência artificial externa. Testado e no ar, sem login. IT Career Simulator, time CVE-K."
- **Tela final (5 s):** `https://it-flight-simulator-hackbrasil.vercel.app` e o link do repositório.

## Correspondência com os critérios

| Bloco | Critério em foco |
| --- | --- |
| Início e Diagnóstico | Impacto e qualidade da comunicação |
| Plano de Carreira e Mesa de Trabalho | Execução técnica |
| Revisão e Portfólio | Implementação técnica |
| Encerramento | Implementação técnica e qualidade da comunicação |

## Lista de conferência final

- Duração total até 3:00.
- Fala sem jargão solto: cada sigla aparece com o que ela faz.
- Nenhum dado real, nenhuma marca de terceiro como parceira, sem preços.
- Vídeo acessível sem login.
- Contagem de testes igual à do CI no dia.
