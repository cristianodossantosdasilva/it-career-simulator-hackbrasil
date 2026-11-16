# Auditoria Financeira, Contábil e Jurídica (Kiro CLI)

Aviso: este documento é análise técnica de apoio. Não substitui contador nem advogado. Itens marcados como "premissa" são suposições minhas e precisam de validação. Fontes na seção 6 e no arquivo 06. Complemento numérico: `04b_CUSTOS_E_TRIBUTOS.csv`.

## 1. Financeiro

### 1.1 O que o documento afirma

Custo de R$ 1,47 a R$ 2,35 por aluno por mês (1.000 alunos pagos), margem de contribuição de 81,4% a 88,1%, ponto de equilíbrio de 35 a 45 assinantes e impostos de 6% mais gateway de 3%.

### 1.2 Onde o cálculo subestima

1. **Imposto fixo de 6%.** No Simples Nacional a alíquota efetiva depende da receita bruta dos últimos 12 meses (RBT12). Cálculo com a fórmula oficial (alíquota nominal vezes RBT12 menos parcela a deduzir, dividido por RBT12), assinatura Essencial anual de R$ 59,90 por mês:

| Assinantes | RBT12 aproximado | Anexo III efetiva | Anexo V efetiva (sem Fator R) |
| :--- | :--- | :--- | :--- |
| 40 | R$ 28,8 mil | 6,00% | 15,50% |
| 100 | R$ 71,9 mil | 6,00% | 15,50% |
| 300 | R$ 215,6 mil | 6,86% | 15,91% |
| 1.000 | R$ 718,8 mil | 11,05% | 18,12% |

2. **Margem de contribuição por assinante Essencial** (gateway de 4% como premissa para cartão e Pix misturados; custo de nuvem e IA de R$ 1,90 do próprio documento):

| Cenário tributário | Contribuição por assinante | Percentual |
| :--- | :--- | :--- |
| 6% fixo (documento) | R$ 52,01 | 86,8% |
| Anexo III a 1.000 assinantes | cerca de R$ 49,00 | cerca de 81,8% |
| Anexo V a 1.000 assinantes | R$ 44,75 | 74,7% |

3. **Custos ausentes.** Aquisição de clientes (CAC), churn, inadimplência e estorno de cartão, reembolso de 7 dias, suporte humano ao aluno, desenvolvimento contínuo de conteúdo, jurídico e contabilidade variável, tributo sobre prêmios do Hackathon.
4. **Ponto de equilíbrio inconsistente.** Compara custo fixo de infraestrutura dimensionada para 1.000 alunos com receita de 35 a 45 assinantes. Com 40 assinantes o custo real de nuvem é menor, mas também não inclui pró-labore nem esforço de desenvolvimento. O número correto exige incluir salário do fundador.
5. **Premissa de preço de nuvem:** Render Pro, Neon e Vercel Pro são razoáveis. A Vercel Hobby não permite uso comercial; com receita é necessário plano pago. Render gratuita não é para produção (dorme em 15 minutos e sem garantia de nível de serviço).

### 1.3 Unit economics com premissas explícitas (Essencial anual, Anexo III, 1.000 assinantes)

| Cenário | Churn mensal (premissa) | CAC (premissa) | Vida média | LTV de contribuição | LTV/CAC | Payback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Otimista | 5% | R$ 100 | 20 meses | cerca de R$ 986 | 9,9 | 2 meses |
| Base | 8% | R$ 150 | 12,5 meses | cerca de R$ 616 | 4,1 | 3 meses |
| Pessimista | 12% | R$ 250 | 8,3 meses | cerca de R$ 411 | 1,6 | 5,1 meses |

(Contribuição usada: R$ 49,28 por mês, com 10,55% de imposto, que difere pouco da correta de 11,05%. Os valores de churn e CAC são premissas de mercado, não medições do projeto; o piloto deve substituí-las.)

**Pacotes intensivos** (R$ 497 e R$ 897): o risco principal é o arrependimento de 7 dias com reembolso integral e o parcelamento sem juros. Se 10% pedem reembolso (premissa) e a taxa de cartão é de cerca de 4%, a contribuição cai cerca de 14% antes do suporte.

### 1.4 Custo real de voz e vídeo ao vivo (Onda 4)

Preços de tabela observados em outubro de 2026 para o modelo de voz de tempo real da OpenAI: US$ 32 por milhão de tokens de áudio de entrada, US$ 64 por milhão de saída, entrada em cache a US$ 0,40. Estimativas publicadas por terceiros: cerca de US$ 0,235 por minuto sem cache (chamada de 5 minutos a US$ 1,17) e cerca de US$ 0,08 por minuto com cache ideal. Há versão menor a US$ 10 e US$ 20.

Câmbio de R$ 5,80 por dólar (o mesmo do projeto):

| Custo de modelo | Por sessão de 8 minutos | 2 sessões por mês | 4 sessões por mês |
| :--- | :--- | :--- | :--- |
| Ideal, US$ 0,08 por minuto | R$ 3,71 | R$ 7,42 | R$ 14,85 |
| Sem cache, US$ 0,235 por minuto | R$ 10,90 | R$ 21,81 | R$ 43,62 |
| Documento do projeto | R$ 2,80 a R$ 6,90 | R$ 5,60 a R$ 13,80 | não calculado |

O documento ficou próximo do cenário ideal e **excluiu**: avatar em vídeo (costuma ser cobrado por minuto à parte), relé de rede para chamada (TURN), gravação e armazenamento, transcrição adicional, novas tentativas por falha, picos de uso, translação de latência. Com a promessa de "2 a 4 chamadas por mês" no plano Pro a R$ 119,90, o cenário sem cache e 4 chamadas leva a contribuição a cerca de 44% (R$ 52 por assinante), sem avatar. Recomendação: limitar a 2 sessões, orçamento por sessão com corte automático, voz antes de vídeo, e preço do excedente.

### 1.5 Concorrência (apenas o que consegui verificar)

| Concorrente | Dado verificado | Fonte |
| :--- | :--- | :--- |
| Alura | Só planos anuais; promoções de até 50% por tempo limitado | Páginas de suporte e ofertas da Alura |
| Alura para empresas | R$ 125 a R$ 197 por pessoa por mês, mínimo de 10 licenças no plano Corp Plus (outubro de 2026) | Blog de terceiro, verificar na fonte |
| TryHackMe | Premium: 10,50 euros por mês no anual e 16,99 no mensal; MAX: 17,99 e 29,11 | Página oficial de preços |
| Hack The Box | Labs a US$ 25 por mês, planos Academy por cubos | Páginas de comparação |
| Udemy, Coursera, Rocketseat, Escola DNC, cursos técnicos | **Não verificado nesta auditoria** | |

Leitura: R$ 59,90 a R$ 79,90 por mês está acima do TryHackMe anual e muito abaixo do corporativo da Alura. A faixa B2B de R$ 45 a R$ 85 por assento é defensável, mas só com catálogo, painel e suporte; hoje o produto tem cinco cenários. **Não cobrar nada antes de existir conteúdo e termos.** No Hackathon a oferta é gratuita; use isso como argumento de acesso.

### 1.6 Plano de uso dos créditos de parceiros (sem armadilha pós-crédito)

O que o regulamento realmente promete (item 10.3, verificado em 15/nov/2026):

| Parceiro | Quem recebe | Observação |
| :--- | :--- | :--- |
| Firecrawl | Top 3 (25, 15 e 10 mil dólares) e 5.000 créditos para participantes com rascunho aprovado, até 2.000 pessoas | Útil só se houver coleta de documentação |
| Cognition (Devin) | Top 3 (10, 6 e 4 mil dólares) e cupom de 20 dólares para participantes, até 2.000 | Acelera desenvolvimento |
| Nvoip (telefonia em nuvem) | Top 3 (plano Pro de 12 usuários e número por 3 anos) e 3 meses para 1 usuário por participante | O documento do projeto não menciona este parceiro |
| Resend | Top 3 com 10 mil dólares por 12 meses; 3 meses de plano Pro para todos os finalistas | |
| Capivarafy | Top 3, consultoria sem taxa para captação não diluitiva | Relevante para pesquisa e inovação |
| Globalfy | Top 5 constituição de empresa nos EUA; cupons para finalistas | Não aplicável sem plano de mercado externo |
| WorkOS | Todos os finalistas, 12 meses de autenticação com domínio próprio (US$ 1.188) | |
| AbacatePay | R$ 300, 150 e 50 mil em crédito de taxa para o top 3 e R$ 10 mil por menção honrosa, por até 24 meses | Crédito é diferença de taxa em vendas, não dinheiro |
| Convex | Dinheiro: 3, 2 e 1 mil dólares | |
| Jumpstart e Puentes | Vistos e fast-track para o primeiro lugar, sem garantia | |

Pontos de atenção: o documento do projeto diz que benefícios são para "finalistas e vencedores" de modo genérico; **a maior parte exige estar no top 3**, e só WorkOS e 3 meses de Resend alcançam todos os finalistas. Para participantes comuns, só os cupons de Firecrawl, Devin e Nvoip, condicionados a rascunho aprovado no painel.

Plano recomendado:

1. Orçar o produto com crédito zero. Crédito é redução eventual de custo, não premissa.
2. Isolar cada fornecedor por interface (autenticação, e-mail, pagamento, voz) para trocar sem reescrever.
3. Registrar data de término de cada crédito e criar alarme 60 dias antes.
4. Teto de gasto mensal e kill switch por recurso pago.
5. Usar crédito de pagamento apenas quando houver vendas; é diferença de taxa.
6. Antes do término de WorkOS e Resend, comparar com alternativa de código aberto ou plano menor.
7. Incluir imposto sobre prêmios: o regulamento deixa tributos com o ganhador (item 10.11).

## 2. Contábil e tributário

### 2.1 CNAE

- **8599-6/03 Treinamento em informática** e **8599-6/04 Treinamento em desenvolvimento profissional e gerencial:** cobrem aulas, cursos livres de qualificação e treinamento corporativo. Não cobrem educação profissional técnica regulamentada.
- **Assinatura com software simulado, licenciamento B2B e portal de conteúdo:** a Solução de Consulta Cosit nº 236/2017 separa, no Simples Nacional, escola livre e curso gerencial (Anexo III) de desenvolvimento e licenciamento de programas, hospedagem e portais (Anexo V). Isso indica que a receita de acesso à plataforma pode ser vista como serviço de software. CNAEs secundários prováveis: 6311-9/00 (tratamento de dados, provedores de aplicação e hospedagem), 6319-4/00 (portais e provedores de conteúdo), 6203-1/00 (desenvolvimento e licenciamento de programas não customizáveis). **Confirmar com contador e prefeitura.**
- **Pacote de tutoria e IA:** tutoria é ensino (8599); IA como ferramenta de apoio ao ensino não muda o enquadramento do serviço. Se for vendida como ferramenta separada, é software.

### 2.2 Regime

- MEI não comporta (limite de receita e atividades).
- ME no Simples Nacional até R$ 360 mil de receita bruta anual e EPP até R$ 4,8 milhões.
- Anexo III (alíquota inicial 6%): atividades de ensino em escola livre. Anexo V (alíquota inicial 15,5%): software e hospedagem; pode migrar ao Anexo III se a folha de salários (incluindo pró-labore) dividida pela receita for de 28% ou mais (Fator R).
- Simulação por faixa na seção 1.2; arquivo 04b traz as faixas.
- Segregar a receita por atividade desde o primeiro dia, com notas fiscais distintas ou descrição clara.
- Pró-labore: ao menos o salário mínimo vigente por sócio administrador; no Fator R, aumenta a base de folha e pode compensar a mudança de anexo.

### 2.3 ISS e NFS-e

- Subitem 8.02 da LC 116/2003 (instrução, treinamento, orientação pedagógica e avaliação) para o curso.
- Subitens 1.05 (licenciamento ou cessão de direito de uso de programas), 1.03 (processamento de dados) e 1.09 (disponibilização de conteúdo por internet) para a assinatura de plataforma, conforme o município.
- Local de recolhimento depende da lei municipal; na NFS-e nacional, o município do prestador ou do tomador pode variar conforme o serviço.
- Para pessoa física, nota fiscal ao consumidor, sem retenções. Para empresas e escolas (B2B), pode haver retenção de ISS, de contribuições federais conforme o caso, e de INSS se houver cessão de mão de obra (não é o caso de plataforma); revisar contrato.
- Obrigações acessórias do Simples: DAS mensal, PGDAS-D, DEFIS anual, eSocial se houver empregado, DCTFWeb conforme o caso, emissão de NFS-e e controle de receita por município.

### 2.4 Reforma tributária

- Lei Complementar 214/2025: CBS e IBS substituem PIS, Cofins, ICMS e ISS em transição de 2026 a 2033.
- 2026: alíquotas-teste de CBS (0,9%) e IBS (0,1%), com recolhimento dispensado a quem cumpre obrigações acessórias; destaque nos documentos fiscais passou a ser obrigatório em agosto de 2026 para parte dos documentos.
- 2027: CBS passa a ser cobrada integralmente; o Simples Nacional continua, com opção de recolher IBS e CBS por fora para aproveitar crédito (confirmar regra vigente).
- Serviços de educação têm redução de 60% da alíquota nos regimes regulares; a aplicação a curso livre online e a assinatura de plataforma precisa de confirmação.
- Ação: contratar emissor de NFS-e já compatível e revisar preço em 2027.

### 2.5 Estrutura contábil realista

Contabilidade digital com plano de contas por atividade; ME no Simples; conta bancária PJ; certificado digital e-CNPJ; separar finanças pessoais; reserva para impostos de 15 a 20% da receita nos primeiros meses (premissa); orçamento mensal de R$ 320 a R$ 450 para contabilidade, domínio e certificado, em linha com o documento.

## 3. Jurídico

### 3.1 Direito educacional e comunicação

- LDB (Lei 9.394/1996) distingue educação regular, educação profissional e tecnológica e cursos livres. Qualificação profissional e formação inicial e continuada (FIC), como tratadas pelo Decreto 5.154/2004, ocorrem no sistema de educação profissional. Uma plataforma privada de curso livre não deve sugerir que integra esse sistema.
- **Expressões a evitar:** "diploma", "diploma técnico", "técnico formado", "certificado FIC", "reconhecido pelo MEC", "histórico CBO", "microcertificado de empregabilidade", "garantia de emprego", "júnior em 4 meses" como promessa, "aprovação garantida".
- **Expressões seguras:** "curso livre", "certificado de conclusão de curso livre", "carga horária estimada de estudo", "prepara para atividades de suporte de TI", "alinhado a competências observadas em vagas de suporte" (com fonte).
- CDC art. 37: publicidade enganosa, inclusive por omissão; art. 6, III e IV: informação adequada e proteção contra publicidade enganosa; art. 31: oferta com informação clara. O prazo "em até 4 meses" depende do aluno e do mercado; descrever como meta de estudo.
- **Certificado:** emitir como certificado de conclusão de curso livre com carga horária **medida** por tempo ativo, ementa, data, código verificável e aviso de que não equivale a diploma nem a certificação de fabricante.
- Referência à CBO é aceitável como mapeamento de ocupação, não como certificação pelo Ministério do Trabalho.
- Resolução CNE/CP 1/2021 orienta a educação profissional e tecnológica regulamentada; citá-la como "base de inspiração" e não como enquadramento do curso livre.

### 3.2 Propriedade industrial, software e marcas de terceiros

- **LPI (Lei 9.279/1996), art. 132:** o documento do projeto usa os incisos I e II como base para "uso nominativo". Esses incisos tratam de comerciantes e distribuidores e de fabricantes de acessórios. O inciso IV protege a citação da marca em discurso, obra científica ou literária ou publicação, sem conotação comercial e sem prejuízo do caráter distintivo, o que é frágil para curso pago. Usar o nome de marca apenas de modo descritivo e necessário ("prepara para o exame X", "compatível com o conceito Y"), sem estilizar, sem logotipo e sem sugerir parceria.
- **Aparência (trade dress):** não há norma específica; a defesa ocorre por concorrência desleal (art. 195 da LPI e Código Civil) e direitos autorais de interface gráfica. O risco cresce com reprodução de telas, ícones, paleta e textos de interface de produtos específicos, e com nomes como "inspirado no UniFi Design Center" ou "Firewall FortiGate" na identidade do módulo.
- **Linha de risco prática:** (a) baixo: comandos de linha de comando e conceitos técnicos genéricos (função, não aparência), protocolos públicos; (b) médio: nome do produto em texto descritivo; (c) alto: logotipos, telas copiadas, cores e menus reproduzidos, capturas de tela oficiais, uso do nome no título do módulo.
- **Lei 9.609/1998 (software):** nunca distribuir firmware ou imagem de fabricante sem licença; o projeto declara que não o faz. Manter cláusula no termo de uso.
- **Antes de contrato de academia de fabricante (Cisco, Fortinet, MikroTik, Ubiquiti, Microsoft, VMware, Veeam, Zabbix):** usar telas genéricas, nomes de funcionalidade, e aviso de marcas. Buscar programas educacionais oficiais de cada fabricante (a maioria tem) antes de copiar aparência.
- **Microsoft 365, VMware e Hyper-V:** não reproduzir console oficial; criar interface abstrata com rótulos de função.

### 3.3 Certificações, direitos autorais e simulados

- Lei 9.610/1998: questões de exame são obras protegidas e muitas vezes cobertas por acordo de confidencialidade do candidato. Banco de questões deve ser 100% autoral.
- Governança anti-dump: política escrita de origem das questões, registro de autor e revisor, proibição de colaboração a partir de lembranças de prova, canal para denúncia, remoção em 48 horas.
- Contrato e página de venda: "Prepara para exames de terceiros; não emite certificação oficial; marcas pertencem aos respectivos titulares".

### 3.4 Consumo, comércio eletrônico e recorrência

- CDC art. 49: arrependimento em 7 dias para compra fora do estabelecimento, com devolução integral.
- Decreto 7.962/2013: informação clara sobre preço, forma de pagamento, condições, e meios de contato; confirmação do pedido; meio de arrependimento.
- Decreto 11.034/2022 (serviço de atendimento ao consumidor): cancelamento pelo mesmo canal da contratação, sem barreiras. Verificar artigos antes de redigir.
- Renovação automática: mostrar o valor total anual e a data da renovação antes da compra; avisar antes de renovar; botão de cancelar visível. R$ 59,90 por mês no plano anual deve exibir o total (R$ 718,80) e a condição de cobrança.
- Reembolso pro-rata fora dos 7 dias é política comercial; definir e publicar.
- Pacotes parcelados sem juros: informar o valor total à vista e a política em caso de cancelamento.

### 3.5 LGPD, menores e ECA Digital

- **Menores:** LGPD art. 14 exige melhor interesse da criança e do adolescente; para crianças, consentimento específico de pelo menos um responsável. O Enunciado CD/ANPD nº 1/2023 admite outras bases legais, com cautela. O **ECA Digital (Lei 15.211/2025, em vigor desde 17/mar/2026)** alcança serviços digitais direcionados a crianças e adolescentes ou de provável acesso por eles: aferição de idade, supervisão parental, privacidade por padrão e regras sobre publicidade. Um curso de carreira aberto a jovens aprendizes se encaixa. Decisão: ou público 18+ com aferição proporcional, ou fluxo parental completo.
- **Hackathon:** o evento exige 18+ (item 3.1) e o demo é anônimo com dados sintéticos. Inserir aviso curto no demo.
- **Áudio, vídeo e transcrição (Onda 4):** voz é dado pessoal; se usada para identificação, é biométrico e sensível. Transferência a API estrangeira exige mecanismo previsto na Resolução CD/ANPD nº 19/2024. Bases e minimização: guardar transcrição, evitar áudio, retenção curta, acesso do titular, exclusão.
- **Decisão automatizada:** o Juiz 360 é determinístico e explicável, o que favorece o direito de revisão (LGPD art. 20). Manter relatório por critério e canal de contestação.
- **Encarregado, registro de operações, relatório de impacto:** necessários ao lançar produto com dados pessoais; para o piloto do Hackathon, usar consentimento simples e pseudonimização.
- **Dados do time no repositório público:** remover nome completo, motivo e localidade da saída de integrante (LGPD e item 13 do regulamento).

### 3.6 Currículo Vivo público e assinatura criptográfica

- Hash SHA-256 prova integridade do JSON, não autoria (ver 05). Para valor probatório mínimo: assinatura digital assimétrica (Ed25519) pelo emissor, chave pública divulgada e versionada, data de emissão, lista de revogação.
- A assinatura não precisa ser ICP-Brasil para ter utilidade como credencial privada; para efeito jurídico reforçado, a Lei 14.063/2020 e a MP 2.200-2/2001 tratam de assinaturas eletrônicas. Para curriculum de aluno, assinatura avançada com carimbo de tempo é suficiente como prova técnica, sem pretensão de documento oficial.
- Padrões abertos aplicáveis: Open Badges 3.0 e Verifiable Credentials 2.0. Usar um deles reduz questionamento.
- Privacidade: pseudônimo por padrão, publicação explícita, revogação a qualquer momento, nada de dado pessoal no payload assinado, página de verificação que mostra só o necessário.

### 3.7 Licença e propriedade intelectual no Hackathon

- Regulamento 11.1: propriedade intelectual permanece com o time. 11.2: licença de exibição para a organização. 11.3: o time garante que não viola direitos de terceiros.
- Sem LICENSE o repositório continua visível, mas o uso por terceiros é indefinido. Escolher licença que permita ler e executar (item 6.6) e proteja o plano comercial (por exemplo, licença de código disponível com restrição comercial) ou licença aberta, de forma deliberada.
- Se todo o código de dois dias foi feito com IA, é permitido (item 6.4); manter registro de decisões humanas.

## 4. Lista de verificações antes de qualquer cobrança

1. Contador contratado, CNAEs e anexo definidos, emissor de NFS-e.
2. Termos de uso, política de privacidade, política de reembolso e cancelamento publicados.
3. Linguagem de marketing revisada por advogado.
4. Decisão sobre público (18+ ou parental) e processo de aferição.
5. Medição de carga horária implementada.
6. Assinatura de credencial, revogação e política de dados do aluno.
7. Parecer sobre uso de marcas e telas de fabricantes.
8. Orçamento de IA com teto e corte automático.

## 5. Dados do cálculo (resumo)

Veja `04b_CUSTOS_E_TRIBUTOS.csv` para tabelas de faixas do Simples Nacional, cenários de unit economics, custo de voz e benefícios de parceiros.

## 6. Fontes principais desta seção

Listadas e com data de acesso em `06_REFERENCIAS_E_FONTES.md`.
