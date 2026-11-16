# Parecer geral das sete frentes

**Data de corte:** 15/11/2026. **Modo:** auditoria documental, código em leitura, consultas externas somente leitura. Nenhum teste, build, migration ou alteração fora desta pasta.

## Síntese executiva

O produto demonstrável hoje é uma workstation de suporte com cinco cenários determinísticos, armazenamento de eventos e interface escura orientada a operação. O protótipo educacional é outro artefato: página HTML isolada com armazenamento local e heurísticas, não integrada ao frontend React. As 560 horas, oito bancadas, 80 laboratórios, tutor de IA, certificados e economia unitária são principalmente plano e hipótese, não produto demonstrado.

A ideia tem aderência plausível à trilha oficial Acesso à educação: reduz custo de praticar atendimento e diagnóstico sem laboratório físico. A demo tem substância para mostrar ticket, triagem, diagnóstico, correção e replay. Porém a proposta representa uma formação profissional inteira enquanto o produto entregue ainda é estreito. No pitch, mostre o que funciona e deixe o restante como roadmap.

**Elegibilidade observada:** o regulamento exige repo público novo, criado depois da abertura de 04/11/2026 às 21h, com commits a partir dali. GitHub CLI observou repo público criado em 14/11/2026; primeiro commit local também é de 14/11. A evidência temporal atende ao critério. Inscrição, submissão no painel, aceite pelo time, integrantes registrados e permanência pública até 15/12 não foram verificados. Regulamento atualizado em 09/11/2026.

**Estado e governança:** Git local `main`, HEAD `e6aae5c`, árvore de trabalho já suja por alterações documentais e artefatos preexistentes; não atribuí essas mudanças à auditoria. Snapshot DevLedger de 15/11 aponta o mesmo slug para HEAD `4f2c756` limpo, com raiz correta. Há divergência real de HEAD e sujeira; o estado registrado está obsoleto. Um snapshot adicional aponta para a própria raiz DevLedger, tornando a proveniência ambígua. Nada foi reconciliado.

**Portões do evento:** submissão até 30/11 às 23h59 BRT com repo público, demo funcionando e link HTTPS de vídeo de até 3 minutos; demo acessível durante avaliação. Quatro critérios de mesmo peso e mínimo de 20/40 na fase online. Após submissão, código congelado até a final de 12/12; equipe finalista confirma até 04/12 e comparece inteira salvo justificativa aceita.

## Frente 1 — Produto e estratégia

A dor é concreta, mas não há evidência de entrevistas com iniciantes, avaliação de aprendizagem, retenção ou disposição a pagar. Conte quem não consegue praticar, qual prática segura a plataforma permite e qual competência observável conclui. Não prometa contratação, habilitação técnica ou prontidão garantida em quatro meses.

O diferencial demonstrável é a simulação determinística de procedimento operacional com avaliação pelo rastro de ações. O catálogo tem cinco cenários: pasta de rede, engenharia social, incidente massivo, latência SRE e auditoria SQL. Isso não equivale a 80 laboratórios.

### O que DEVE mudar ou entrar JÁ para o Hackathon até 30/nov/2026

- Congelar demo sem login, roteiro de 90 segundos, evidência de diagnóstico e replay. Validar URL pública, repo, vídeo e descrição no painel.
- Vídeo mostra produto, público e resultado de aprendizagem. Não apresentar telas isoladas do protótipo como integração real.
- Publicar matriz “disponível hoje / demonstrado / roadmap”. Identificar protótipo como protótipo.
- Confirmar integrantes registrados e presença em São Paulo. A regra exige presença do time finalista, salvo justificativa.
- Usar rubrica oficial de quatro critérios iguais; nenhuma ferramenta patrocinadora é obrigatória.

### O que DEVE mudar no Produto Pós-Hackathon

Lançar curso inicial pequeno com objetivos, pré-teste, três práticas graduadas, feedback e avaliação retardada. Medir ganho de desempenho e abandono antes de ampliar currículo, certificados ou oito meses de trilha. Expandir bancadas apenas depois de comprovar entendimento do fluxo inicial.

## Frente 2 — UX, UI e acessibilidade

O app real começa na seleção de cenário e oferece ITSM, chat, SimuDesk, KB e replay. O CSS global define tema escuro; não há fluxo educacional React, painel de estudo ou páginas de aula. Contraste testado em amostra não prova WCAG AA de todas as telas, estados, conteúdo dinâmico, zoom, leitor de tela ou dispositivos.

O protótipo tem tema claro, foco visível, abas e fluxo de estudo, mas está isolado, salva em `localStorage`, simula tutor por heurística e exibe progresso local. O navegador estava indisponível, mas havia screenshots preexistentes de 375 px em `.playwright-mcp`. No protótipo educacional, a barra de navegação fica horizontalmente rolável e corta opções fora do viewport; incluir menu mobile ou indicador acessível de overflow. No app real, os cartões ficam em coluna e a seleção de cenário é legível, porém a tela escura e os termos de suporte ainda pressupõem familiaridade. As imagens são snapshots, não uma sessão interativa recém-validada. Contraste e WCAG completa não foram medidos.

Cinco abas e termos de operação podem intimidar iniciantes. Ausência de onboarding real e mistura entre estação de trabalho e aprendizagem exigem revisão. Erros precisam explicar próxima ação e sua segurança. No protótipo, diferencie demonstração de integração real e não trate XP como competência profissional.

## Frente 3 — Educação e pedagogia

A carga prevista equivale a 17,5 horas semanais por 32 semanas. É matematicamente possível, mas não comprova empregabilidade. O plano mistura conteúdo inicial e especializações em servidores, rede, cloud, segurança, SQL, RAID e Kubernetes. A prontidão N1 em quatro meses exige evidência em cenário novo, atendimento, documentação e transferência para equipamento real.

As técnicas citadas são ferramentas, não evidência de eficácia no curso. Protótipo usa escolha manual de prazo nos cartões e heurísticas; não há prova de SM-2 adaptativo nem tutor IA real. Linux desktop aparece; Android/iOS corporativo, MDM, VoIP, acessibilidade operacional, cliente difícil e privacidade precisam de prioridade. Separar laboratório simulado de prática que exige equipamento real.

Sequência proposta: alfabetização digital e atendimento; ticket e prioridade; Windows e periféricos; identidade e MFA; rede local e DNS; Microsoft 365 e impressão; Linux desktop básico; segurança e LGPD; automação pequena e documentação. N2/N3 como optativa avançada. Usar pré e pós-teste, caso novo, rubrica e revisão espaçada medida. Certificações devem ser preparação autoral, sem prometer voucher ou credenciamento.

## Frente 4 — Financeiro

Preços não foram validados por vendas ou entrevistas. Alura Empresas divulga valores por assento a partir de R$ 125, com escopo diferente. TryHackMe Premium exibe €10,50/mês no anual, focado em cibersegurança. Udemy vende cursos e plano individual, sem preço brasileiro fixo na página lida. Cursos técnicos têm outros custos e garantias. Faixa proposta é hipótese.

O modelo não comprova CAC, suporte, chargeback, reembolso, inadimplência, conteúdo, acessibilidade, segurança, tributos por atividade, pessoal, câmbio, egress ou contingência. “Margem líquida” é nome impróprio antes dos custos fixos. Equilíbrio em 35–45 alunos não pode ser refeito sem separar custo fixo, variável, mix e retenção.

A R$ 59,90 para 1.000 clientes, receita anualizada é R$ 718.800. No Anexo III, se corretamente enquadrada, taxa efetiva aproximada é 11,05%, não 6%. A R$ 79,90, receita é R$ 958.800 e a taxa aproximada sobe a 12,28%. Software sujeito ao fator R abaixo de 28% pode ir ao Anexo V, com carga maior. Valores são aproximações sem segregação ou validação municipal.

Realtime é cobrado por tokens de entrada e saída e duração ativa; contexto acumulado pode aumentar custo dos turnos. Avatar client-side não elimina rede, TURN/SFU, hospedagem, moderação e suporte. Definir limite de minutos, opt-in, encerramento, teto de despesa e alternativa sem voz.

Créditos Hack Brasil são condicionais, por classificação ou presença, ligados a fornecedores e prazos. Não contabilizar como receita nem custo recorrente coberto. Orçar preço cheio e planejar migração antes da expiração. Regulamento não exige tecnologia de patrocinador.

## Frente 5 — Contábil e tributário

CNAEs 8599-6/03 e 8599-6/04 descrevem treinamento. Não cobrem automaticamente SaaS e licenciamento. Software não customizável costuma demandar análise de 6203-1/00; customizável, 6202-3/00; desenvolvimento por encomenda, 6201-5/01. Contrato e atividade efetiva definem.

LC 116 inclui instrução no subitem 8.02 e licenciamento no 1.05; município define cadastro, alíquota e obrigação concreta. Curso e software podem ter tratamentos distintos. Segregar receitas e validar retenção B2B, NFS-e, pró-labore, folha, fator R, ME/EPP e sublimites. Não assumir MEI ou Anexo III fixo.

A transição IBS/CBS já exige preparação em 2026. Regras para 2027 e opção entre Simples e recolhimento regular afetam documentos e fluxo de caixa. Contador deve avaliar conforme atividade, município e perfil dos clientes. Isto não substitui parecer individual.

## Frente 6 — Jurídico

Cursos livres e FIC podem emitir certificado próprio com critérios publicados; não equivalem automaticamente a diploma técnico nem autorização do MEC. Evitar “diploma técnico”, emprego garantido ou equivalência a certificação de fabricante. Explicitar emissor, natureza, conteúdo, avaliação e limites.

Uso nominativo de marca para identificar conteúdo pode ser informativo e leal; não autoriza logotipo, cópia de interface, firmware ou trade dress que sugira patrocínio. Criar consoles próprios e avisos claros de independência. Revisar licenças de terceiros.

Questões autorais próprias, com origem e licença registradas. Proibir dumps e material sob NDA. A plataforma prepara, não emite certificado de terceiros. Termos de consumo devem explicar preço, renovação, cancelamento, suporte e arrependimento de sete dias em contratação remota.

LGPD exige finalidade, minimização, retenção, segurança, canal de direitos e contratos com operadores. SHA-256 público não autentica autoria; JSON e digest podem ser recalculados. Currículo público pode expor histórico; preferir exportação privada, apelido opcional e opt-in específico. Para autenticar emissão, assinar com chave privada protegida e oferecer chave pública, revogação e versão do esquema.

LGPD art. 14 impõe melhor interesse a dados de crianças e adolescentes; consentimento parental específico aplica-se à criança, não se deve generalizar igual para todo adolescente. ECA Digital entrou em vigor em 2026 e reforça deveres de serviços acessíveis a menores. Antes de cadastro ou vídeo de menor, avaliar idade, responsável, finalidade, retenção e exclusão. Evitar gravação padrão e oferecer alternativa textual.

## Frente 7 — Engenharia e infraestrutura

Separação do motor determinístico e diálogo é adequada à avaliação reproduzível. Há cinco cenários, motor de eventos e stores em memória e PostgreSQL. PostgreSQL inicializa schema no startup. Não há prova de migrations controladas, projeção persistida ou append-only físico. Banco não tem hash chain.

SQL é parser de gramática pequena aplicado a dados sintéticos, não acesso real ao banco. Hash de currículo não autentica o servidor. UUID de sessão é bearer capability: quem o obtém pode consultar ou agir. Rotas examinadas não têm identidade ou autorização de participante. CORS e limite por IP não substituem autorização.

CORS tem origens configuradas e rate limit global de 120/min por IP. Atrás de proxy, validar IP encaminhado e partição. TTL de 30 dias bloqueia acesso, mas não foi visto expurgo; registros podem acumular. Store em memória perde dados em restart e não serve múltiplas instâncias. Render Free tem limites e pode suspender. Vercel deployment está Ready; Render lista API; Neon não foi inspecionado; Cloudflare autenticado sem consulta a zone. Nenhum segredo foi consultado.

### Antes de novas telas

1. Fechar demo e separar feature funcional, mock e roadmap.
2. Tratar autorização por sessão, expiração, limpeza, limites e testes de concorrência.
3. Versionar migrations e separar runtime de schema.
4. Fechar contrato de hash, assinatura, rotação e revogação do Currículo Vivo.
5. Validar WCAG em mobile, teclado e leitor de tela no produto integrado.
6. Executar suites e builds em ambiente isolado após autorização para artefatos em `src/`.

**Limite:** nenhum teste, build, SQL de produção ou operação de escrita foi feito. Pareceres fiscais e jurídicos requerem validação profissional.


