# Perguntas prováveis da banca

Respostas curtas e honestas. Cada pergunta indica o critério que ela toca: **ET** execução técnica, **IT** implementação técnica, **IM** impacto, **QC** qualidade da comunicação. Se não souber, diga que não sabe e o que fará para descobrir.

## 1. A IA avalia o aluno?

**Critério:** IT.

Não. A avaliação é feita pelo Juiz 360º, que aplica critérios binários (sim ou não) sobre os eventos da sessão. A mesma trilha dá sempre a mesma nota. O diálogo com o usuário simulado é roteirizado e não altera estado nem avalia. Modelo de linguagem fica desligado por padrão (`Dialogo:HabilitarLlm=false`). Se um dia for ligado, continuará sem autoridade sobre estado e nota.

## 2. Vocês usam dados reais?

**Critério:** IM.

Não. A empresa, as pessoas, os servidores, os logs e as tabelas são fictícios (Aurora Logística, `aurora.local`). A demo não pede login e as sessões são anônimas. O que fica só no navegador (Cartão de Embarque, Registros de Voo, progresso) não vai para outros usuários. As sessões no servidor expiram em 30 dias.

## 3. Isso escala?

**Critério:** IT.

Hoje a demo está em camadas gratuitas, e dizemos isso. O servidor hiberna quando fica parado e há limite de 120 requisições por minuto por IP. A arquitetura ajuda: o motor é puro e sem estado entre chamadas, os eventos ficam num PostgreSQL, e o frontend é estático. O que não foi medido é carga com muitos usuários ao mesmo tempo. Esse teste é um próximo passo, antes de qualquer piloto grande.

## 4. Qual a diferença para um curso comum?

**Critério:** IM.

O curso comum explica. Aqui a pessoa faz. Ela atende um chamado, investiga, escolhe a ação, erra sem risco e vê o replay com o critério e o evento que o prova. A causa muda por semente, então não dá para decorar a resposta. Antes de tudo, o Check-in deixa experimentar o trabalho, o que ataca a evasão por escolha às cegas. Não substituímos o curso nem o professor. Damos o treino que falta.

## 5. Qual é a licença? O código é aberto?

**Critério:** IT.

O repositório é público para leitura e avaliação, como pede o regulamento. A licença é proprietária, com todos os direitos reservados ao time CVE-K. Jurados e organizadores podem ler, clonar, compilar, executar e testar para avaliar. Copiar, modificar ou redistribuir exige autorização por escrito. Versões antigas, anteriores à licença atual, foram publicadas sob MIT e continuam regidas por ela. Não é código aberto, e preferimos dizer isso com clareza.

## 6. Quanto custa manter?

**Critério:** IT.

No hackathon, a execução usa camadas gratuitas e não depende de nenhuma API paga de IA. Isso foi uma escolha de projeto: o diálogo roteirizado dá resposta imediata e previsível durante a avaliação. Não vamos entrar em modelo financeiro neste pitch.

## 7. E a acessibilidade?

**Critério:** IM.

Trabalhamos para o nível AA das diretrizes WCAG: navegação por teclado, foco visível, semântica ARIA e contraste de pelo menos 4,5 para 1 em dois temas, claro e escuro. Essas regras são verificadas por testes automáticos (axe-core) e por medição no navegador. Limite honesto: teste automático não substitui teste com pessoas. A validação com leitor de tela e com usuários reais ainda precisa ser feita.

## 8. O Currículo Vivo vale como diploma ou certificado?

**Critério:** IM.

Não. É um resumo operacional da prática, com verificação de integridade. O hash é SHA-256, a assinatura é ECDSA P-256 e o texto é canonicalizado por JCS (RFC 8785). Qualquer pessoa verifica no navegador, sem rede, e uma alteração é detectada. Ele prova que o documento não foi mexido. Não prova competência por conta própria e não equivale a diploma.

## 9. Como saber que o motor está certo?

**Critério:** ET.

Há mais de dois mil testes automáticos no backend e centenas no frontend (números exatos no CI do dia), além de testes de ponta a ponta. A reprodutibilidade ajuda: mesma semente, mesmo cenário, mesma avaliação. Um teste compara o hash da definição de cada causa antes e depois de mudanças no sorteio, para provar que sessões antigas não mudam.

## 10. E se a pessoa fizer algo fora do roteiro?

**Critério:** ET.

Cada cenário declara os comandos que aceita. O que está fora recebe resposta honesta de que não é suportado, sem saída inventada. Ação sensível sem verificação de identidade não muda o estado e vira evento de falha. O console SQL aceita só leitura e bloqueia escrita e injeção.

## 11. Qual a fidelidade em relação ao trabalho real?

**Critério:** ET.

É uma simulação com fidelidade declarada. A interface não imita sistemas proprietários e não usa saída de ferramentas reais. Ensinamos o raciocínio: identificar, diagnosticar antes de alterar, registrar, escalar. O manuseio da ferramenta real continua exigindo treino próprio.

## 12. Quais são os próximos passos?

**Critério:** IM.

Curto prazo: teste de carga, validação de acessibilidade com pessoas e piloto com uma turma. Depois: mais cenários, mais laboratórios e outras profissões. Detalhes, por horizonte, em [06_ROADMAP.md](06_ROADMAP.md). Não há parceria firmada hoje.

## 13. O código foi feito durante o hackathon? Vocês usaram IA para escrever?

**Critério:** IT.

O código foi escrito para o Hack Brasil 2026, sem aproveitar código privado anterior, e os commits mostram isso. O regulamento permite e incentiva o uso de IA no desenvolvimento e na documentação. Usamos, com revisão humana e testes automáticos como rede de segurança.

## 14. Como o Check-in decide a rota? Isso é aconselhamento vocacional de verdade?

**Critério:** QC.

O Check-in é uma triagem curta e transparente: pontos fixos por resposta, regra visível na tela, sem IA. Ele sugere por onde começar e deixa a pessoa experimentar. Não é teste psicológico nem diagnóstico, e a decisão é sempre dela. Nesta edição, a rota disponível é Suporte de TI.

## 15. O que está pronto e o que é visão?

**Critério:** QC.

Pronto: Check-in, Plano de voo, Cabine com ITSM, Chat, SimuDesk e Intranet, sete cenários jogáveis em quatro escalas, Caixa-preta com Juiz 360º, Brevê com verificador offline, Hangar, aulas e caderno. Visão: laboratórios dedicados por unidade curricular, simulados de certificação autorais, chamada de vídeo com agentes e outras profissões. A matriz de escopo da própria interface separa as duas coisas.

## Resumo por critério

| Critério | Perguntas |
| --- | --- |
| Execução técnica | 9, 10, 11 |
| Implementação técnica | 1, 3, 5, 6, 13 |
| Impacto | 2, 4, 7, 8, 12 |
| Qualidade da comunicação | 14, 15, mais a forma de responder todas: curta, honesta e sem jargão solto |

## Regras para responder

- Respostas de até 30 segundos. Oferecer detalhes só se pedirem.
- Dizer o limite antes que a banca o encontre.
- Não citar empresas como parceiras. Não falar de preço, margem ou plano financeiro.
- Nunca dizer "a IA corrige". Dizer "o motor e o Juiz 360º decidem".
