# Roadmap: ganchos de evolução

Este documento lista direções, não promessas. Nada aqui depende de parceria que ainda não existe, e nenhum item tem preço ou meta financeira. Nenhuma empresa é citada como parceira. Datas são horizontes, não compromissos.

Estado de partida (entregue no hackathon): rota Suporte de TI com quatro etapas e sete cenários jogáveis, Diagnóstico, Mesa de Trabalho, Revisão com Juiz 360º, Portfólio com Currículo Vivo verificável offline, Catálogo, aulas e caderno.

## Horizonte 1: consolidar (logo após a final)

Meta: deixar o que existe pronto para ser testado por pessoas de fora.

- Teste de carga na API e ajuste do limite por IP.
- Validação de acessibilidade com leitor de tela e com pessoas, além dos testes automáticos.
- Roteiros e dicas para as causas que ainda não têm (as pendências estão em `docs/CENARIOS_POR_ETAPA.md`).
- Rótulos de eventos novos no replay e acentuação dos textos que vêm do backend.
- Estudo de como guardar o progresso entre dispositivos sem exigir dado pessoal.

## Horizonte 2: ampliar a prática (meses seguintes)

Meta: mais profundidade na mesma rota.

- Laboratórios dedicados, um por unidade curricular, começando por hardware e bancada, depois cabeamento e Wi-Fi, redes com mais de um fornecedor, firewall, data center e backup, e defesa em segurança. O PRD descreve a matriz pedagógica de 560 horas, em planejamento.
- Aulas com recordação ativa e repetição espaçada, e caderno com modelos de estudo.
- Mais causas por cenário e mais cenários por etapa, mantendo a regra de que o motor decide e o diálogo não avalia.
- Relatório de turma para quem ensina: quais critérios mais falham, sem dado pessoal real.
- Pilotos com turmas de escolas e programas de formação, quando houver interessados. Hoje não há nenhum acordo.

## Horizonte 3: outras profissões

Meta: reaproveitar o motor em outros trabalhos de TI.

O Catálogo já mostra as rotas em três estados: disponível, em preparação e futuro. Hoje só Suporte de TI está disponível.

| Rota | Estado | Gancho |
| --- | --- | --- |
| Infraestrutura e nuvem | Em preparação | Aproveitar as vertentes da N3: redes e nuvem, data center e backup, segurança e dados. |
| Desenvolvimento de software | Futuro | Novos tipos de evento (testes, revisão, falha em produção) no mesmo motor. |
| Dados e análise | Futuro | Ampliar o console SQL somente leitura e criar cenários de qualidade de dados. |

Cada rota nova entra com a mesma regra: dados sintéticos, comandos declarados por cenário e avaliação por critérios observáveis.

## Horizonte 4: certificações e ecossistema

Meta: ligar a prática ao que o mercado reconhece, com cuidado jurídico.

- **Certificações mapeadas.** Mapear cada unidade curricular às certificações de mercado como referência de estudo. O Catálogo já exibe referências. Nada de cópia de prova nem de banco vazado. Os simulados seriam autorais e inéditos.
- **Vouchers e laboratórios de terceiros.** Só como possibilidade: exigiria credenciamento formal, que não existe. Não prometer voucher, desconto ou equivalência de diploma.
- **Parceiros de ensino e de contratação.** Abrir conversas depois que houver um piloto com resultado medido. Não há parceria hoje.
- **Chamada de vídeo e voz com agentes.** O estudante atenderia usuários leigos, gestores sob pressão e tentativas de engenharia social. Regra fixa: o agente conversa, o motor decide o estado e o Juiz 360º avalia.
- **Curso livre com certificado de conclusão,** respeitando a regulação de educação, a LGPD e o ECA Digital, sem equivalência automática a diploma técnico.

## Fora de escopo deste roadmap

- Preços, planos, margens, metas de receita e estratégia comercial. Esse assunto fica fora do repositório público.
- Compromissos com empresas, escolas ou órgãos.
- Qualquer promessa de emprego ou de aprovação em certificação.

## Como ligar o roadmap à banca

| Pergunta provável | Resposta curta | Critério |
| --- | --- | --- |
| E depois do hackathon? | Primeiro validar com pessoas e carga, depois ampliar laboratórios e rotas. | Impacto |
| Já tem parceiro? | Não. Há ganchos, e só abrimos conversa depois de um piloto medido. | Qualidade da comunicação |
| Dá para outras áreas? | O motor é genérico. O Catálogo já separa disponível, em preparação e futuro. | Implementação técnica |
