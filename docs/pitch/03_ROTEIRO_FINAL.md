# Roteiro do pitch da final

Final presencial de 12/dez/2026, em São Paulo. Os finalistas são anunciados em 02/dez/2026.

Suposição: a organização ainda não informou o tempo de fala. Este roteiro usa 5 minutos de pitch, com demo ao vivo dentro dele. Os blocos têm uma versão curta marcada com "corte". Ajustar quando o tempo oficial chegar.

Quem fala: uma pessoa conduz a fala, outra opera a demo. A pessoa que opera não improvisa o texto.

## Linha do tempo

| Tempo | Bloco | Critério em foco |
| --- | --- | --- |
| 0:00 a 0:30 | Abertura | Qualidade da comunicação |
| 0:30 a 1:00 | Problema | Impacto |
| 1:00 a 3:30 | Demo ao vivo | Execução técnica e implementação técnica |
| 3:30 a 4:15 | Impacto e evolução | Impacto |
| 4:15 a 4:40 | Modelo de evolução | Impacto |
| 4:40 a 5:00 | Pedido | Qualidade da comunicação |

## Abertura (0:00 a 0:30)

- **Fala:** "Boa tarde. Somos o time CVE-K. Pense em um técnico de suporte no primeiro dia: chamado aberto, usuário esperando, relógio correndo. Vamos colocar vocês nessa cadeira agora."
- **Tela:** página Início da demo pública, já aberta.
- Gancho: começar pela situação, não pelo nome do produto. O nome vem no fim da abertura: "Isto é o IT Career Simulator."

## Problema (0:30 a 1:00)

- **Fala:** "Faltam pessoas na base da TI. E muita gente desiste da formação porque escolheu o curso sem saber como é o trabalho. Quem termina esbarra em outra parede: a vaga pede experiência, e a experiência só vem com a vaga. Nossa resposta é uma escola técnica digital de aprender fazendo."
- **Tela:** a mesma. Sem slide novo.
- Corte: dizer só as duas primeiras frases.

## Demo ao vivo (1:00 a 3:30)

Detalhes dos passos em [04_ROTEIRO_DEMONSTRACAO.md](04_ROTEIRO_DEMONSTRACAO.md). Aqui, o que falar em cada passo.

1. **1:00 a 1:25 | Atender meu primeiro chamado.** "Um clique leva ao Diagnóstico rápido. Sem login, sem dado real." Confirmar e iniciar.
2. **1:25 a 2:00 | Missão `pasta-rede-inacessivel`.** "Uma usuária da Aurora Logística, empresa fictícia, não acessa uma pasta. Antes de abrir o acesso remoto, preciso confirmar quem ela é." Validar a identidade, abrir o SimuDesk, diagnosticar, corrigir, resolver.
3. **2:00 a 2:35 | Missão `reset-senha-desbloqueio`, pedido por terceiro.** "Agora um gestor pede para resetar a senha de outra pessoa. A identidade que vale é a da titular, não a de quem pede. Ligo para o ramal do diretório." Mostrar o que acontece se agir sem verificar: o motor registra a ação sensível e não muda a conta.
4. **2:35 a 3:30 | Revisão.** "Cada ação virou um evento imutável. O Juiz 360º lê esses eventos e aplica critérios que sim ou não. Não é opinião de modelo de linguagem." Abrir um critério e mostrar o evento que o prova. Fechar no Portfólio com o Verificador offline: alterar um byte do JSON e mostrar a detecção.

Corte para 3 minutos de pitch: manter só os passos 1, 2 e 4, com a Revisão em 40 segundos.

Regra do operador: se um passo falhar, não insistir. Dizer "o servidor está lento", seguir para o próximo passo e voltar no fim, se houver tempo. Não depurar em voz alta.

## Impacto (3:30 a 4:15)

- **Fala:** "Para quem é: quem quer entrar em TI e ainda não sabe se é isso, e quem estuda e precisa de prática. Para quem forma: uma trilha de prática com evidência, porque cada missão deixa um registro verificável. Tudo roda no navegador, sem login e sem dado pessoal."
- **Tela:** Plano de Carreira com as quatro etapas e as três vertentes da N3, e o Catálogo.
- Dois fatos para dizer: sete cenários jogáveis de ponta a ponta, e testes automáticos no CI (dar o número lido no CI naquele dia).
- Não prometer resultado de empregabilidade. Dizer que o produto reduz o risco de escolha às cegas e dá prática mensurável.

## Modelo de evolução (4:15 a 4:40)

Sem números financeiros.

- **Fala:** "Evolui em camadas. Primeiro, mais profissões além de Suporte de TI. Segundo, laboratórios mais próximos do equipamento real. Terceiro, mapeamento com certificações de mercado como referência. Para chegar a escolas e programas de formação, queremos pilotos com turmas reais, com acompanhamento e retorno."
- **Tela:** Catálogo. Evitar slide de planilha.
- Não citar parceiros, vouchers ou empresas como se já existissem. Detalhes honestos em [06_ROADMAP.md](06_ROADMAP.md).

## Pedido (4:40 a 5:00)

- **Fala:** "Pedimos três coisas: olhar crítico sobre a nossa avaliação, contatos de instituições de ensino interessadas em testar com uma turma, e mentoria técnica para escalar com segurança. A demo está no ar agora, em `it-flight-simulator-hackbrasil.vercel.app`. Obrigado."
- **Tela:** endereço da demo grande, sem login, e o link do repositório.
- Terminar na hora. Não abrir novo assunto.

## Plano B se a rede cair

Preparar tudo antes de subir ao palco. Testar os planos A, B e C no mesmo notebook.

| Situação | O que fazer |
| --- | --- |
| Demo pública lenta ou fora (servidor acordando) | Abrir `/health/live` da API 10 minutos antes. Se estiver lento no palco, seguir para o plano B. |
| Wi-Fi do local ruim | Trocar para o roteador do celular (compartilhar internet) e recarregar. Testar antes a conexão com o celular no local. |
| Rede indisponível | **Plano B1: execução local.** Backend e frontend rodando no notebook (`dotnet run --project src/backend/src/Simulador.Api --urls http://localhost:8080` e `npm run dev` em `src/frontend` (`npm.cmd` no Windows)), com o provedor em memória, sem banco. Preparar e testar na véspera, com tudo já compilado e as dependências instaladas. |
| Execução local falhou | **Plano B2: vídeo gravado.** O vídeo de 3 minutos, no notebook e num pendrive, sem depender de streaming. Falar por cima, em vez de ler a legenda. |
| Tudo falhou | **Plano B3: capturas de tela.** Sequência de imagens em PDF: Início, Diagnóstico, Plano de Carreira, Mesa de Trabalho, Revisão, Portfólio. Contar a história com elas. |

O Verificador offline funciona sem rede. Em qualquer plano, ele é o momento de demonstração que não depende da internet.

Lista de conferência na véspera:

- Notebook carregado, com carregador, adaptador de vídeo e cabo de reserva.
- Janela anônima limpa, tema claro, ampliação do navegador conferida no projetor.
- Vídeo, PDF de capturas e este roteiro salvos no notebook e no pendrive.
- Dois ensaios completos cronometrados.
- Um integrante com o celular pronto para compartilhar internet.
- Contagem de testes lida no CI e anotada.
