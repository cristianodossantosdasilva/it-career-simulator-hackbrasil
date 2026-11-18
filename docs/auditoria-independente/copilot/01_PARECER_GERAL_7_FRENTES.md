# Parecer geral independente

## Conclusao executiva

O projeto possui um nucleo tecnico real, demonstravel e acima da media para um hackathon: motor deterministico, eventos append-only, cinco cenarios operacionais, avaliacao reproduzivel, replay, frontend funcional e testes passando. O repositorio publico e a demo sao suficientes para provar uma experiencia de simulacao de suporte de TI.

O risco principal nao e falta de engenharia do nucleo. E a distancia entre a promessa de uma academia de 560 horas, oito laboratorios, 80 cenarios, mentor pedagogico, certificacoes e video ao vivo e o que existe hoje em `src`. O codigo atual entrega uma workstation de simulacao e cinco cenarios; nao entrega ainda a plataforma educacional completa descrita no PRD. Se o pitch vender a matriz inteira como produto presente, a banca pode perceber vaporware. Se o pitch vender um simulador deterministico de entrada em suporte como primeiro recorte, a proposta fica crivel.

Minha recomendacao independente e congelar o escopo do Hackathon em uma jornada demonstravel de 8 a 10 minutos, com um unico problema social de acesso a educacao: transformar teoria passiva em pratica segura, observavel e explicavel. O ganho competitivo vem da evidencia de comportamento, nao da quantidade de telas prometidas.

## Frente 1 — Produto e estrategia

**Forcas observadas**

- O problema do paradoxo do junior e concreto e bem conectado a triagem, atendimento, diagnostico e seguranca.
- A trilha de Acesso a educacao e aderente quando o foco e aprender fazendo, com feedback e replay.
- O motor usa semente, eventos e juiz, o que cria uma diferenca dificil de simular em um video superficial.
- O regulamento oficial confirma times de 1 a 4, submissao ate 30 de novembro as 23h59, repositorio publico, demo funcionando e video de ate 3 minutos.

**Riscos**

- O produto atual nao contem a camada de aulas, SM-2, caderno, painel de estudos, oito laboratorios ou 80 cenarios descritos no PRD.
- A promessa de aptidao profissional em quatro meses e uma alegacao de resultado educacional que exige metricas, acompanhamento e linguagem moderada.
- O pitch pode tentar explicar oito meses de produto quando a banca precisa entender um fluxo em poucos minutos.

**Decisao recomendada**

Apresentar o produto como um simulador pratico deterministico para iniciantes, com trilha futura de academia. Mostrar uma missao completa: identificar risco de engenharia social, consultar evidencia, validar identidade, negar uma acao insegura, documentar e explicar a decisao. Medir tempo ate primeira acao segura, erros destrutivos evitados, qualidade da nota e capacidade de explicar a causa.

## Frente 2 — UX, UI e acessibilidade

O frontend atual tem semantica razoavel, foco visivel, `aria-live`, testes axe e responsividade basica. A interface de workstation e adequada para uma banca tecnica, mas ainda e densa para uma pessoa totalmente leiga. O prototipo visual local tem tema claro, navegacao por abas, skip link e muitos estados interativos, porem continua sendo um prototipo estatico separado do frontend React.

Problemas prioritarios:

- Mistura de termos de produto, ITSM, terminal e nivel tecnico antes de apresentar uma orientacao pedagogica curta.
- O dock de aplicativos exige que o aluno entenda a metafora de workstation antes de saber o proximo passo.
- O frontend atual permanece predominantemente escuro, enquanto a documentacao promete tema claro educacional.
- O prototipo e rico em estados, mas nao prova que seus fluxos estao ligados ao motor de eventos real.
- A validacao automatica nao cobre legibilidade, zoom de 200 por cento, teclado em todos os modais, toque em celular e compreensao de linguagem.

Mudar agora: uma faixa de missao com objetivo, evidencia necessaria, proxima acao e criterio de sucesso; esconder detalhes avancados ate serem necessarios; oferecer modo guiado e modo especialista; testar uma jornada em 360, 768 e 1440 pixels; revisar todos os textos para linguagem de iniciante.

## Frente 3 — Educacional

A matriz de 560 horas e ambiciosa e inclui temas relevantes, mas combina fundamentos de entrada com conteudos de N3, data center, cloud, EDR, IAM e auditoria SQL em uma unica narrativa. Para um leigo, a sequencia precisa ter pre-requisitos visiveis e gates de dominio. A alegacao de prontidao para emprego em quatro meses deve ser tratada como objetivo de aprendizagem, nao garantia de emprego.

Conteudos que devem entrar cedo: Linux desktop pratico, Android e iOS corporativo, MDM, VoIP, atendimento dificil, acessibilidade, escrita de chamados, privacidade operacional e automacao muito basica. Conteudos como Kubernetes, WORM, MPIO e firewall multi-vendor devem ficar depois de fundamentos testados.

As tecnicas SM-2, Cornell, Feynman, STAR e Pomodoro sao coerentes, mas ainda sao promessa documental. O minimo pedagógico demonstravel no Hackathon e um microciclo Aprender, lembrar, praticar, explicar com uma pergunta de recuperacao, uma acao no laboratorio, uma justificativa e um feedback observavel.

## Frente 4 — Financeiro

Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.

## Frente 5 — Contabil e tributaria

Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.

## Frente 6 — Juridico

Comunicar curso livre, FIC ou microcertificado sem sugerir diploma reconhecido pelo MEC. Evitar garantia de emprego, equivalencia a curso tecnico regulamentado ou certificacao de terceiros. O certificado deve identificar carga, competencias avaliadas, natureza nao regulada e entidade emissora.

Usar marcas apenas de forma nominativa e referencial, sem copiar interfaces, logos, firmware, manuais restritos ou identidade visual. A simulacao deve usar linguagem de inspiracao funcional e componentes genericos. Licencas de bibliotecas, conteudo autoral e banco de questoes precisam de inventario.

O Curriculo Vivo com SHA-256 prova consistencia contra alteracao acidental, mas nao autenticidade. Qualquer pessoa pode gerar um JSON novo e seu proprio hash. Para prova externa, usar assinatura Ed25519 ou HMAC verificado no servidor, com chave protegida, identificador de versao e politica de revogacao.

Para audio e video futuros, definir base legal, finalidade, retencao, exclusao, acesso, transcricao, subcontratados e tratamento de menores. Para assinatura, exibir preco, renovacao, cancelamento e direito de arrependimento de sete dias de modo claro.

## Frente 7 — Dev senior e arquitetura

Os testes executados passaram: backend 66 testes, frontend 24 testes, lint, build e verificador de segredos. Isso prova regressao local, nao disponibilidade publicada.

Achados tecnicos:

- `Program.cs` seleciona InMemory apenas em Development e exige Postgres fora desse ambiente, o que e correto como fail closed.
- O rate limit global e por IP, 120 requisicoes por minuto, com health liberado. Em NAT ou proxy, o IP pode concentrar usuarios e precisa de proxy confiavel, limites por rota e observabilidade.
- As rotas de sessao, replay, avaliacao e resumo de carreira nao exigem autenticacao nem vinculam os UUIDs a um proprietario. Conhecer um UUID permite consultar uma sessao; o resumo aceita ate 20 IDs fornecidos pelo cliente. Para uma demo anonima isso e uma escolha de modelo de ameaca, nao uma protecao de dados.
- `PostgresEventStore` usa transacao e `FOR UPDATE`, mas inicializa schema no startup. Em deploy com varias replicas, isso deve virar migracao versionada ou lock de inicializacao.
- `AnexarAsync` assume lista de eventos nao vazia. As rotas atuais produzem eventos, mas a interface nao protege esse contrato no store.
- `InMemoryEventStore` nao expira nem limita sessoes em memoria. E aceitavel para Development, nao para uso persistente.
- A implementacao chamada JCS ordena chaves, mas delega serializacao de numeros e strings ao `System.Text.Json` e ao JSON do navegador. Isso merece vetores RFC 8785 mais amplos antes de afirmar conformidade geral.
- O hash nao tem autenticacao criptografica. O risco esta documentado acima.
- O dialogo atual e roteirizado e ignora chave LLM e HttpClient. Isso protege determinismo, mas o PRD nao deve dizer que existe IA de producao.
- O `docker-compose` usa senha de desenvolvimento padrao. O binding local reduz exposicao, mas o arquivo nao pode ser usado como configuracao de producao.
- O `render.yaml` usa plano free. Cold start, limite de memoria, conexao Postgres e janela de avaliacao precisam ser testados no deploy real.
- O repositorio local esta sujo e o DevLedger nao possui estado corrente especifico para esta raiz. O registro de `simulador-carreira-ti` aponta para a raiz do DevLedger e para um repositorio privado precursor, em estado de concepcao. Isso e divergencia de governanca, nao prova de deploy do repositorio atual.

## O que deve mudar ou entrar ja para o Hackathon

1. Reduzir o pitch a uma jornada unica, mensuravel e repetivel.
2. Exibir no produto um aviso honesto de que aulas, oito laboratorios e demais ondas sao roadmap quando ainda nao estao implementados.
3. Garantir demo publica, seed fixa de demonstracao, dados sinteticos e rota de recuperacao quando o backend cair.
4. Mostrar quatro criterios de avaliacao do Hack Brasil: execucao, implementacao tecnica, impacto e comunicacao.
5. Demonstrar replay, juiz, integridade e uma explicacao pedagogica curta.
6. Corrigir ou enquadrar a linguagem de JCS como canonicalizacao interna ate validar RFC 8785 completo.
7. Criar uma pagina de evidencias com codigo, testes, arquitetura, limites atuais e backlog.
8. Congelar o commit entregue ate o prazo e preservar repositorio publico, conforme regulamento.
9. Declarar no pitch que a demo e anonima e que os UUIDs nao sao autenticacao de usuario.

## O que deve mudar no produto pos Hackathon

1. Construir a camada educacional antes de adicionar video ao vivo.
2. Implementar identidade, progresso, revisao espaçada, notas e persistencia multi-tenant.
3. Criar pre-requisitos e gates para UC1 a UC8.
4. Adicionar cenarios de Linux desktop, mobile corporativo, VoIP e atendimento dificil.
5. Substituir hash publico por assinatura verificavel quando houver uso profissional.
6. Fazer custo de video com fornecedor escolhido, limites e testes de carga.
7. Formalizar politica de privacidade, contratos, certificados e licencas de conteudo.
8. Instrumentar funil, retencao, conclusao, erros seguros e evidencia de aprendizagem.
9. Adicionar identidade, autorizacao, vinculo de sessao e politica de expiracao antes de armazenar dados de aluno.

