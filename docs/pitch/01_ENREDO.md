# Enredo

## Frase de apresentação

Escola técnica digital de aprender fazendo: a pessoa atende chamados de TI numa empresa fictícia, erra sem risco e revê cada decisão.

## O problema

- Faltam pessoas na base da área de TI: técnicos de suporte, atendentes de service desk, operadores de infraestrutura.
- Muita gente abandona a formação. Escolhe o curso sem saber como é o trabalho e só descobre a rotina depois de meses de teoria.
- Quem termina o curso esbarra no paradoxo do júnior: a vaga pede vivência, e a vivência só vem com a vaga.

O elo que falta é prática de rotina real, antes e durante a formação.

## A solução

O IT Flight Simulator é uma escola técnica digital de aprender fazendo. Cada missão é um chamado da Aurora Logística (`aurora.local`). A pessoa investiga, age, escala, registra e depois assiste ao replay do que fez.

Três peças:

1. **Rota do hackathon: Suporte de TI.** Quatro escalas: Help Desk N1, Service Desk N1 Jr, N2 Pleno e N3 Sênior (com três vertentes: Redes e Nuvem, Data Center e Backup, Segurança e Dados). Sete cenários jogáveis de ponta a ponta. Cada cenário sorteia a causa por semente, então não dá para decorar a receita.
2. **Consultoria vocacional pelo Check-in.** Perguntas curtas indicam por onde começar. A regra é pública: pontos fixos por resposta, sem IA, e a decisão final é da pessoa. Depois do Check-in ela experimenta o trabalho antes de se comprometer. Isso ataca a evasão causada por escolha às cegas.
3. **Aulas e caderno.** Microaulas por nível, treino de explicação e caderno de estudos, para estudar entre um voo e outro.

## A narrativa do voo

Todo o produto usa a metáfora de um voo. A pessoa evolui em três papéis:

- **Passageiro:** observa, faz o Check-in e conhece a rota.
- **Copiloto:** atua com apoio, com dicas durante o atendimento.
- **Piloto:** conduz o atendimento sozinha.

O **Comandante** acompanha o voo em quatro papéis:

| Papel | O que faz |
| --- | --- |
| Consultor | Explica o Check-in, mostra o que cada rota pratica e indica o próximo passo. |
| Instrutor | Explica as escalas, as missões e o que libera a próxima etapa. |
| Copiloto | Dá dicas durante o atendimento, na Cabine. |
| Mentor | Ajuda a ler a linha do tempo do voo e a planejar o próximo treino. |

Regra central: **o Comandante orienta. O motor determinístico e o Juiz 360º decidem.** O Comandante não altera estado, não dá nota e não libera escala. Quem muda o estado da sessão é o motor. Quem avalia é o Juiz 360º, por critérios binários lidos na trilha de eventos.

Páginas do voo: Início, Check-in, Plano de voo, Cabine, Caixa-preta (replay e debrief), Brevê (voos registrados e verificador offline) e Hangar (catálogo de escalas e referências de certificação).

## Diferenciais técnicos verificáveis

Cada item abaixo pode ser conferido no repositório ou na demo pública.

| Diferencial | Como verificar | Critério da banca |
| --- | --- | --- |
| Motor determinístico como autoridade única (`Simulador.Dominio`, `Simulador.Avaliacao`). O diálogo não altera estado nem avalia. | Código dos dois projetos e testes de domínio. | Implementação técnica |
| Event sourcing: cada ação gera evento imutável (append-only). Estado reconstruível e replay cronológico. | Caixa-preta da sessão. | Implementação técnica |
| Juiz 360º com critérios binários observáveis, sem modelo de linguagem. Mesma trilha, mesma nota. | Debrief na Caixa-preta, com cada critério e o evento que o prova. | Execução técnica |
| Currículo Vivo verificável: JCS (RFC 8785), SHA-256 e assinatura ECDSA P-256. Verifica no navegador, sem rede, e detecta JSON adulterado. | Verificador offline no Brevê e vetores em `docs/vetores-jcs-sha256.json`. | Implementação técnica |
| Sorteio por semente (`SplitMix64`): mesma semente, mesmo defeito. | Opções avançadas do Plano de voo. | Execução técnica |
| Fidelidade declarada: os comandos aceitos são declarados por cenário. Fora do escopo, resposta honesta, sem saída inventada. | Terminal do SimuDesk. | Execução técnica |
| Falha segura: o console SQL aceita só leitura e bloqueia escrita e injeção. | Cenário `diagnostico-sql-readonly`. | Implementação técnica |
| Custo zero de IA externa: diálogo roteirizado (`Dialogo:HabilitarLlm=false`). Sem cota para estourar na avaliação. | Variáveis em `docs/DEPLOY_E_VIDEO.md`. | Execução técnica |
| Dados 100% sintéticos, sessões anônimas, sem login e sem dado pessoal real. | Aviso na interface e README. | Impacto |
| Testes: 2344 no backend e 385 no frontend, medidos em 18/nov/2026, e testes de ponta a ponta com Playwright. Contagem atual no CI. | Workflow `.github/workflows/ci.yml`. | Execução técnica |
| Acessibilidade verificada por máquina: axe-core nos testes e contraste medido nos dois temas. | Testes do frontend. | Impacto |

Limites assumidos em público: a interface não imita sistemas de terceiros, o Currículo Vivo é um resumo operacional verificável e não um diploma, e a liberação do modo de demonstração não conta como voo concluído.
