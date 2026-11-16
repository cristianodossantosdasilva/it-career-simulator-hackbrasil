# Parecer Geral da Banca Independente, 7 Frentes (Kiro CLI)

- Projeto: IT Flight Simulator, time CVE-K, trilha "Acesso à educação", Hack Brasil 2026
- Data da auditoria: 15/nov/2026 (faltam 15 dias para a submissão de 30/nov/2026, 23h59 BRT)
- Estado auditado: branch main, commit local e6aae5c (igual ao remoto), com 8 arquivos de documentação modificados e 1 não rastreado, ainda sem commit
- Método: leitura do código em `src/`, execução dos testes de backend em cópia temporária fora do repositório, consulta somente leitura ao DevLedger, ao GitHub, à Vercel, à Render, à Neon e à Cloudflare, navegação no demo publicado e no protótipo, leitura do regulamento oficial e pesquisa de preços e legislação
- Nada em `src/`, bancos ou infraestrutura foi alterado. Detalhes e limites na seção 9.

---

## 1. Resumo executivo (sem bajulação)

**O que existe de fato.** Um motor determinístico bem construído em .NET 10, com Event Sourcing, cinco cenários jogáveis (engenharia social, pasta de rede com três causas, incidente massivo, SRE em Kubernetes simulado e SQL somente leitura), Juiz 360 com Replay, interface React acessível e deploy no ar (Vercel, Render, Neon). Reexecutei os testes de backend: 66 de 66 passam (50 de domínio e 16 de API). Para um repositório com dois dias de vida e um único autor de commits, a base técnica é forte.

**O que não existe.** Toda a camada que dá nome ao produto na documentação: Aulas, Flashcards SM-2, Caderno Cornell, Mentor IA, Feynman, Pitch STAR, Pomodoro, Bancada Física de Hardware, os 8 laboratórios dedicados e os 80 cenários. Busca no código do frontend por SM-2, flashcard, Cornell, Bancada, Feynman, Pomodoro e Caderno retorna zero ocorrências. Existem 5 cenários, não 80. O "Mentor" e o "Tech Lead" são respostas por palavra-chave, sem modelo de linguagem (`ClienteDialogo.cs`). A distância entre documento e produto é a maior fragilidade estratégica do projeto.

**Risco imediato de eliminação ou de má impressão (todos corrigíveis em dias):**

1. O domínio personalizado do demo (`itflight.nascia.ia.br`) está atrás do Cloudflare Access e devolve uma tela de login. O regulamento (item 7.2) exige demo sem barreira de login. O endereço `it-flight-simulator-hackbrasil.vercel.app` responde publicamente.
2. O hash do Currículo Vivo calculado no backend não bate com o recalculado no verificador do navegador quando há `E comercial` ou letra acentuada em qualquer texto. Três competências do Juiz 360 contêm `E comercial`. O roteiro do vídeo termina no verificador. Há risco real de a cena final mostrar "DIVERGENTE" no próprio conteúdo legítimo.
3. O hash SHA-256 sem assinatura prova só integridade do JSON. Qualquer pessoa gera um Currículo Vivo falso com XP e cargo à escolha e o verificador responde "íntegro". O documento chama o artefato de "auditável" e "verificável".
4. O limitador de taxa usa o IP da conexão sem tratar cabeçalhos de proxy. Atrás da Render, provavelmente todos os usuários compartilham o mesmo balde de 120 requisições por minuto (hipótese de alta probabilidade, ver 05).
5. O histórico Git publicado foi reescrito: o remoto contém o commit `3ff0faa` que não tem ancestral comum com a main atual, e o DevLedger registra esses hashes antigos. O regulamento (itens 6.1 e 12.2) trata autenticidade de histórico com severidade.
6. A documentação pública do repositório expõe nome completo de quatro pessoas e o motivo pessoal e a localidade da saída de uma delas.
7. A interface publicada ainda exibe `E comercial` em três títulos, violando o `AGENTS.md` do próprio projeto.

**Veredito de posicionamento.** Para o critério "Execução técnica" (primeiro desempate) o projeto está bem posicionado se o demo for estável e verificável. Para "Impacto" (segundo desempate) está fraco: não há evidência de aprendizagem de pessoas reais, e a narrativa de "560 horas e 80 laboratórios" é uma promessa que a banca consegue desmentir em dois minutos olhando o menu. Recomendação central: **reduzir a promessa, endurecer o que existe e provar impacto com um piloto pequeno**, em vez de tentar construir Aulas, Caderno e Mentor em 15 dias.

---

## 2. Quadro de divergências entre documentação, código e deploy

| Afirmação nos documentos | Estado verificado | Gravidade |
| :--- | :--- | :--- |
| 8 laboratórios dedicados, 80 cenários | 5 cenários jogáveis, 0 laboratórios dedicados | Alta |
| Aulas, SM-2, Caderno, Mentor IA, Bancada de Hardware no Hackathon | Nenhum código no frontend; Sprint 2 (19 a 24/nov) ainda não executada | Alta |
| Tema claro educacional (estilo Skill Builder) | Demo publicado usa tema escuro; tema claro só no protótipo estático | Média |
| 41 testes xUnit, 22 Vitest | 66 casos xUnit passam (50 + 16); o número 41 conta atributos, não casos; DevLedger registra Vitest 24 | Baixa, mas denuncia documento desatualizado |
| Interface sem E comercial | 3 títulos com E comercial no demo; 3 competências no backend; comentário e testes idem | Média (regra do projeto) |
| Demo sem login | Domínio personalizado exige login Cloudflare Access; endereço vercel.app é público | Alta |
| Custo zero e benefícios "para finalistas e vencedores" | Maior parte dos créditos é só para o top 3; ver seção 4.4 | Média |
| Verificação "auditável" do Currículo Vivo | Só integridade; falsificável; hash diverge com E comercial e acentos | Alta |
| Repositório com histórico autêntico | Histórico reescrito após publicação (hashes diferentes do registrado) | Alta |
| Time de 3 integrantes ativos | Todos os 28 commits têm o mesmo autor | Média |
| CI e qualidade | Não há GitHub Actions nem LICENSE | Média |
| Estado no DevLedger | `root_path` e `head_sha` do projeto apontam para o repositório do DevLedger, não para o do produto; gates citam commits inexistentes localmente | Média (governança) |

---

## 3. Diagnóstico por frente

### Frente 1. Produto e estratégia para hackathon

**Encaixe na trilha.** O regulamento (item 5.2) define "Acesso à educação" como projetos que ajudam pessoas a aprender ou ensinar, e (item 5.4) exige que problema e público estejam dentro da trilha. Um simulador de prática para iniciantes em suporte de TI se encaixa. O regulamento exclui assistentes de uso geral e ferramentas de colar em prova; não é o caso. Risco de enquadramento: baixo, desde que o texto da submissão fale de aprendizagem e não de "plataforma de empregabilidade".

**A dor do "cru".** A tela inicial lista cinco "níveis" com vocabulário que um leigo não domina: Chaos Injector, semente, SimuDesk, ITSM, N1, SRE, Kubernetes, SQL. Dois dos cinco níveis (SRE em Kubernetes e SQL) são conteúdo de pleno ou sênior. O iniciante não tem uma "Missão 0" que ensine o que é um chamado, SLA ou triagem antes de agir.

**Vaporware.** O risco de parecer "documentação grande para pouco produto" é real. O PRD tem 15 KB, a matriz pedagógica 74 KB, e o produto são 5 cenários. A banca pode avaliar só por código, demo e vídeo (item 7.4), então o que importa é o que está clicável. Não é recomendável abrir README e PRD vendendo 560 horas se o menu mostra 5 telas.

**Indispensável até 30/nov (MVP demonstrável):**
- Demo estável, público, com aviso claro de "servidor acordando" e tempo de resposta aceitável.
- Uma jornada guiada de ponta a ponta para um leigo (Missão 0 curta, depois Nível 2 com Replay didático).
- Currículo Vivo com verificação correta, assinada e com demonstração de adulteração detectada.
- README honesto com matriz "Implementado, Em construção, Roadmap".
- Vídeo de até 3 minutos com uma história, não com cinco níveis em fila.
- Evidência de impacto mínima (piloto de 5 a 10 iniciantes, tempo e depoimentos).

**Fica como roadmap declarado:** 560 horas, 80 laboratórios, Aulas, SM-2, Caderno, Mentor IA, certificações, B2B, vídeo ao vivo com agentes.

**Narrativa e vídeo.** O nome já tem uma metáfora forte e subaproveitada: simulador de voo tem **caixa-preta**. O Replay é a caixa-preta do atendimento. Proposta de fio condutor: "Piloto não aprende voando de verdade no primeiro dia. Quem começa em TI aprende no primeiro dia de verdade, com o chamado real." Impacto social concreto: o custo de errar sai do cliente e vai para o simulador, a dados 100% sintéticos, grátis e sem login. O roteiro atual (DEPLOY_E_VIDEO.md) tem 10 trechos de 15 a 25 segundos e percorre cinco níveis; é denso demais para ser compreendido por quem nunca viu o produto. Estrutura sugerida na seção 5.

### Frente 2. UX, UI e acessibilidade

O que medi (DOM e captura em 375 por 800 px; não fiz teste com usuários nem leitor de tela):

- **Demo publicado:** sem rolagem horizontal em 375 px, nenhum alvo de toque menor que 24 px, 3 de 9 alvos com altura menor que 44 px. Tema escuro com texto cinza sobre fundo azul-marinho nos cartões: legível, mas de contraste baixo para descrições longas; não medi razão de contraste real do cartão (o projeto tem teste axe-core e função de contraste, o que é um ponto positivo).
- **Texto sem acentos** em toda a interface ("Nivel", "Estagiario", "Servico", "Seguranca"). Para um produto educacional em português, isso parece defeito, não escolha de estilo. Provavelmente decorre de evitar problemas de codificação. Corrigir antes do vídeo.
- **Termos técnicos sem apoio:** "Chaos Injector", "semente" e siglas aparecem no cartão de entrada sem glossário.
- **Protótipo v3 (`127.0.0.1:4180`):** mostra a visão certa (Painel, Aulas, Caderno, Mentor IA, Laboratório), com acentos, tema claro e trilha por cores. Em 375 px o cabeçalho ocupa cerca de 170 px antes do conteúdo (XP, tema, Currículo, barra de abas), a barra de abas rola na horizontal com a quinta aba cortada e barra de rolagem visível, e 23 de 33 alvos têm menos de 44 px de altura. É uma página estática de 2,4 mil caracteres de texto, não um protótipo interativo; botões como "Zerar" e "Revisar" têm rótulo ambíguo (destrutivo ou não?).
- **Descompasso:** o que está no ar é escuro e técnico; o que foi aprovado como direção é claro e acolhedor. Decidir qual será mostrado à banca e ao público.
- **Recomendações concretas:** Missão 0 com 4 passos (o que é chamado, prioridade, nota interna, resolver); glossário em dica de contexto; esconder semente e causa forçada em "opções avançadas"; rótulos em português corrente; acentuação correta; abas inferiores no celular (no máximo 4); texto alternativo nos ícones; testar com leitor de tela (NVDA) o fluxo do Nível 2; não usar emoji como único rótulo de navegação.
- **Bancadas de hardware, cabeamento, Wi-Fi, NGFW:** não existem em código. Qualquer julgamento sobre sua qualidade é impossível; o protótipo não as contém. Não prometer no vídeo.

### Frente 3. Educacional e pedagógica

**Matriz de 560 horas.** A conta de horas não fecha com o produto. O documento fala em 300 horas de laboratório em 80 cenários (3,75 horas por cenário). O Nível 2 atual leva algumas dezenas de minutos. Sem medição de tempo real na tarefa, "560 horas" é número de marketing, e isso importa juridicamente (Frente 6). Instrumentar tempo ativo por evento já é possível, porque cada ação tem evento.

**Júnior em 4 meses (280 horas).** Plausível como estimativa de estudo para iniciar em N1, com a ressalva de que empregabilidade depende de prática, comunicação e mercado local, e nenhum curso pode prometê-la. O conteúdo é denso: UC2 (Windows, Linux, BitLocker, registro, DISM, PowerShell, systemd, SSH) em 70 horas e UC3 (cabeamento, Wi-Fi, IPv4, DHCP, DNS, VPN, 802.1X) em 70 horas misturam base com N2. UC6 a UC8 (Cisco, MikroTik, UniFi, FortiGate, Zabbix, Kubernetes, RAID, iSCSI, WORM, EDR, acesso condicional, SQL) em cerca de 65 a 70 horas cada são amplitude de várias certificações, não de uma unidade.

**Lacunas para entrada no suporte brasileiro** (cruzadas com a taxonomia das bases de conhecimento reais, ver arquivo 03): atendimento e redação de chamado (escrita de qualidade), suporte remoto com ferramentas de mercado, impressão e digitalização em rede (grande volume real), gestão de dispositivos móveis (Android e iOS corporativos, Intune), telefonia IP e VoIP, backup e restauração do ponto de vista do atendente, Microsoft 365 operacional (caixas compartilhadas, regras de caixa, encaminhamento suspeito), inglês técnico de leitura, LGPD no balcão. Há conteúdo avançado demais na base: acesso condicional, EDR, SAN, MPIO, NGFW com IPS.

**Ferramentas de estudo.** Recordação ativa e repetição espaçada têm a melhor evidência da lista (testes práticos e prática distribuída aparecem como técnicas de alta utilidade na literatura de revisão de Dunlosky e colegas, 2013). Cornell, Feynman e STAR são úteis como andaime, com evidência menor. Pomodoro tem evidência fraca; não vale desenvolver. SM-2 é de 1987; para um MVP, caixas de Leitner ou o algoritmo FSRS dão resultado melhor com a mesma complexidade. O diferencial real do projeto não está nessas ferramentas (qualquer curso tem flashcards), está na **prática com consequência e feedback auditável**. Priorizar: exemplos resolvidos com orientação decrescente, intercalação de causas (o Chaos Injector já faz isso), revisão pós-incidente sem culpa baseada no Replay.

**Certificações e PBQs.** A trilha é razoável como mapeamento de tópicos. Para PBQs (questões práticas) o melhor ativo do projeto é o próprio motor: tarefas observáveis com critérios binários. Estruturar cada PBQ como mini-cenário do motor, com resultado verificável por evento, e nunca reproduzir questão de prova. Detalhes no arquivo 03.

### Frente 4. Financeira

Resumo (números e premissas no arquivo 04 e em `04b_CUSTOS_E_TRIBUTOS.csv`):

- A margem de contribuição declarada (81,4% a 88,1%) usa imposto fixo de 6%. Com 1.000 assinantes Essencial a R$ 59,90 a receita anual é cerca de R$ 718,8 mil, e a alíquota efetiva do Anexo III sobe para cerca de 11,05%. Se a receita de assinatura for classificada como licenciamento ou hospedagem de software (Anexo V), a efetiva é cerca de 18,1% (sem Fator R). Margem de contribuição por assinante cai de 86,8% para 81,8% (Anexo III) ou 74,7% (Anexo V), antes de qualquer custo de aquisição.
- O cálculo de custos ignora aquisição de clientes (CAC), churn, inadimplência de cartão, estornos pelo prazo de 7 dias e suporte humano. Com premissas de mercado (rotuladas como premissas) o LTV/CAC fica entre 1,6 e 9,9 conforme churn e CAC.
- **Vídeo e voz ao vivo (Onda 4) estão subestimados.** O documento assume R$ 2,80 a R$ 6,90 por sessão de 8 minutos e 2 sessões por mês. Preço de tabela do modelo de voz da OpenAI (US$ 32 por milhão de tokens de áudio de entrada e US$ 64 de saída) leva a cerca de US$ 0,08 por minuto com cache otimista e cerca de US$ 0,235 por minuto sem cache nos testes publicados, ou R$ 3,71 a R$ 10,90 por sessão só de modelo, a R$ 5,80 por dólar. Isso exclui avatar, relé TURN, gravação, transcrição extra e novas tentativas. A tabela de preços promete "2 a 4 chamadas por mês"; com 4 chamadas no cenário sem cache o custo de modelo chega a R$ 43,62 por assinante Pro por mês, e a margem do plano Pro cai para cerca de 44%.
- **Créditos de parceiros:** quase tudo é só para o top 3 ou finalistas (seção 4.4 do arquivo 04). Planejar com crédito zero e tratar crédito como bônus.
- **Preços de concorrentes verificados:** Alura vende só planos anuais (página oficial de suporte); TryHackMe Premium custa 10,50 euros por mês no anual e 16,99 no mensal (página oficial); a Alura Corporativo foi reportada por terceiro entre R$ 125 e R$ 197 por pessoa por mês em outubro de 2026. Udemy, Coursera, Rocketseat e Escola DNC não foram verificados nesta auditoria. O B2B a R$ 45 a R$ 85 por assento é competitivo, mas o catálogo hoje não sustenta cobrança.

### Frente 5. Contábil e tributária

(Parecer completo no arquivo 04. Não substitui contador.)

- **CNAE:** 8599-6/03 (treinamento em informática) e 8599-6/04 (treinamento em desenvolvimento profissional e gerencial) cobrem aula e curso livre. Não cobrem com segurança a assinatura de plataforma com software simulado como atividade em si. A Solução de Consulta Cosit nº 236/2017 trata escola livre e cursos gerenciais no Anexo III, e desenvolvimento e licenciamento de programas, hospedagem na internet e portais no Anexo V. Receita de licença B2B de software e acesso a plataforma tende ao Anexo V. É preciso segregar receitas por atividade e incluir CNAEs secundários (6311-9/00 tratamento de dados e hospedagem, 6319-4/00 portais, 6203-1/00 desenvolvimento e licenciamento de programas não customizáveis) conforme orientação do contador e do município.
- **Anexo III contra Anexo V e Fator R:** a primeira faixa do Anexo III é 6,0% e a do Anexo V é 15,5%. Fator R (folha dividida pela receita de 12 meses, limiar de 28%) pode levar atividades do Anexo V para o III. O documento afirma que a faixa de 6% vale "incluindo ISS"; o ISS está dentro do DAS no Simples, e a alíquota efetiva cresce com a receita acumulada de 12 meses.
- **ISS:** subitem 8.02 (instrução e treinamento) contra 1.05 (licenciamento ou cessão de uso de programas), 1.03 e 1.09 (disponibilização de conteúdo por internet). O município do prestador define o enquadramento e a NFS-e; o conflito entre 8.02 e 1.05/1.09 em assinatura mista é frequente e deve ser resolvido com consulta à prefeitura.
- **Reforma tributária:** em 2026 vigoram alíquotas-teste de CBS (0,9%) e IBS (0,1%); CBS plena a partir de 2027; IBS e extinção gradual do ISS na transição até 2033 (LC 214/2025). Serviços de educação têm redução de 60% prevista na lei, mas a aplicação a curso livre online e a assinatura de plataforma deve ser confirmada. O Simples Nacional continua existindo com ajustes a partir de 2027.
- **MEI não serve:** correto. Estrutura realista: ME no Simples Nacional (limite de R$ 360 mil de receita bruta anual) e EPP depois, com contabilidade digital, NFS-e nacional, pró-labore de pelo menos um salário mínimo vigente, e segregação de receita por anexo.
- **Hackathon:** o regulamento permite participar como pessoa física (item 3.3) e não exige CNPJ. Prêmios são pagos ao responsável do time pelo patrocinador e os tributos são do ganhador (itens 10.5 e 10.11). Não abrir empresa antes da submissão só por causa do concurso.

### Frente 6. Jurídica

(Parecer completo no arquivo 04. Não constitui parecer jurídico; revisar com advogado antes de qualquer lançamento comercial.)

Os pontos de maior risco, em ordem:

1. **Marketing educacional.** "Júnior em 4 meses", "apto ao mercado", "Certificado FIC com histórico CBO" e "Microcertificado de Empregabilidade" sugerem resultado garantido e reconhecimento oficial. Em consumo, isso é publicidade enganosa (CDC, art. 37). FIC e qualificação profissional no sentido do Decreto 5.154/2004 pertencem ao sistema de educação profissional; plataforma de curso livre deve emitir "certificado de conclusão de curso livre" com carga horária medida.
2. **Marcas e aparência de terceiros.** O documento ampara o uso em LPI art. 132, incisos I e II. Esses incisos tratam de distribuidores e fabricantes de acessórios. A previsão que se aproxima do uso didático é a do inciso IV (citação da marca sem conotação comercial), de aplicação duvidosa a curso pago. A proteção de aparência (trade dress) no Brasil não tem norma própria; opera por concorrência desleal (LPI art. 195) e direito autoral de interface. Comandos de CLI e conceitos são funcionais e livres; telas, ícones, logotipos e textos de interface de fabricante não são. Recomendação: skins genéricas, sem logotipo, nomes de produto só em texto descritivo ("conceitos compatíveis com...").
3. **Menores de idade.** O Hack Brasil é 18+ (item 3.1) e o demo é anônimo com dados sintéticos; sem problema agora. Em produto comercial, jovens de 14 a 17 anos são público natural. Aplicam-se LGPD art. 14 e o ECA Digital (Lei 15.211/2025, em vigor desde 17/mar/2026) a serviços "direcionados a crianças e adolescentes ou de provável acesso por eles", com aferição de idade, supervisão parental e privacidade por padrão.
4. **Voz e vídeo (Onda 4).** Voz é dado pessoal e, se usada para identificação, biométrico e sensível (LGPD art. 5, II). Transferência internacional para APIs de IA exige base e instrumento (Resolução CD/ANPD nº 19/2024). Decisões automatizadas de avaliação têm direito à revisão (art. 20); o juiz determinístico é vantagem aqui.
5. **Currículo Vivo público.** Link verificável com dados de pessoa é exposição. Exigir publicação explícita, pseudônimo por padrão, revogação, sem dados pessoais no payload assinado.
6. **Assinatura recorrente (CDC e Decreto 7.962/2013).** Informar preço total, renovação automática e como cancelar no mesmo canal; direito de arrependimento de 7 dias (CDC art. 49) vale para compra online.
7. **Repositório.** Sem LICENSE e sem aviso de privacidade. O regulamento (item 6.6) recomenda licença e veda restrição que impeça jurados de ler e executar. Adicionar licença deliberada.

### Frente 7. Desenvolvedor sênior e arquiteto

(Achados por arquivo e linha no arquivo 05.)

Pontos fortes: separação em módulos, motor puro sem `DateTime` nem `Random` fora da semente (busca confirmou), controle de concorrência otimista com `seqEsperado` e `FOR UPDATE`, consultas parametrizadas, gramática SQL de allowlist, CORS restrito a origens declaradas (verificado em produção: origem estranha não recebe cabeçalho CORS), exceções sem pilha em produção, scanner de segredos no build, health checks e esquema embutido.

Pontos críticos: ver lista de risco imediato (seção 1), mais: `CausaForcada`, `Semente` e `VersaoManifesto` aceitos de qualquer cliente anônimo em produção; `POST /api/carreira/resumo` sem posse de sessão; ausência de limite de corpo; ausência de limpeza de sessões expiradas; Render (Oregon) e Neon (Ohio) em regiões diferentes; teste de integração de Postgres não executado em ambiente com Docker no último portão registrado; ausência de CI; Dockerfile roda como root.

**Plano técnico antes de programar telas novas:** fazer primeiro as correções P0 (seção 5), porque mudam o conteúdo hasheado (competências sem E comercial, canonicalização RFC 8785, assinatura) e quebrariam qualquer tela construída em cima.

---

## 4. O que DEVE mudar ou entrar JÁ para o Hackathon (até 30/nov/2026)

Ordem sugerida e estimativa (um desenvolvedor, em dias úteis de trabalho concentrado). Total estimado: 11 a 12 dias de 15 disponíveis, com folga mínima.

| Prioridade | Item | Esforço | Critério de pronto |
| :--- | :--- | :--- | :--- |
| P0 | Usar `it-flight-simulator-hackbrasil.vercel.app` como link de demo, ou remover o Access do domínio; testar em janela anônima e em rede móvel | 0,25 dia | Abre sem login em 3 dispositivos |
| P0 | Corrigir canonicalização JCS no backend (sem escape de `E comercial` e de não ASCII), adicionar vetores com acento e símbolo em `docs/vetores-jcs-sha256.json`, rodar nos dois lados | 0,5 dia | Vetores novos passam em C# e TypeScript |
| P0 | Remover `E comercial` de 3 títulos de UI, 3 competências, comentários, testes e2e (alteração atômica) | 0,5 dia | Busca por `E comercial` em `src/` retorna só operadores de linguagem |
| P0 | Assinar o Currículo Vivo com Ed25519 (chave privada só em variável de ambiente do servidor; chave pública embutida no verificador); mostrar `kid`, emissão e algoritmo | 1 dia | Documento forjado dá "assinatura inválida"; adulterado dá "divergente" |
| P0 | Corrigir limitador de taxa atrás de proxy (cabeçalhos encaminhados com proxy confiável configurado, ou partição por cabeçalho do proxy da Render) e teste | 0,5 dia | Dois IPs diferentes têm baldes diferentes |
| P0 | Proteger parâmetros de teste (`CausaForcada`, `Semente`) por configuração, ligados só em demo e em teste; corpo limitado a poucos KB | 0,5 dia | Teste de API cobre |
| P0 | Higiene do repositório: LICENSE deliberada, README com matriz de status, workflow de CI (dotnet test, lint, vitest, build), nenhuma reescrita de histórico daqui em diante | 1 dia | CI verde visível |
| P0 | Retirar da documentação pública nomes completos e motivo e localidade da saída de integrante; atualizar o painel do time em hackbrasil.com (composição até 30/nov) | 0,25 dia | Sem dado pessoal de terceiro nos arquivos |
| P1 | Missão 0 (4 passos) antes do Nível 1, glossário em dica de contexto, opções avançadas recolhidas, acentuação correta | 2 dias | 3 iniciantes concluem sem ajuda |
| P1 | Debrief didático no Replay: por critério, o que foi observado, por que importa e link para a KB | 1,5 dia | Tela de Replay explica, não só lista |
| P1 | Piloto com 5 a 10 iniciantes: tempo até concluir Nível 2, erros, depoimento; publicar resumo anonimizado | 1 dia | Números reais no vídeo e no README |
| P1 | Disponibilidade: Render Starter (cerca de US$ 7) de 28/nov a 16/dez, ou monitor externo a cada 10 minutos (cuidado com o limite de horas gratuitas, ver 05); mesma região de banco | 0,25 dia | Primeira resposta abaixo de 3 s |
| P1 | Vídeo (roteiro da seção 5.1), legendas, hospedagem sem login | 1,5 dia | Menos de 3:00, abre sem login |
| P2 | Revisão de realidade da documentação: PRD, arquitetura, contexto e cronograma separam implementado de roadmap, com números de teste corretos | 0,5 dia | Nenhuma promessa sem código |
| P2 (só se sobrar) | Flashcards simples (Leitner) a partir de 15 artigos da KB | 1,5 dia | Funcional, offline |

**Cortar do Hackathon:** Aulas, Caderno, Mentor IA, Feynman, STAR, Pomodoro, Bancada de Hardware, Wi-Fi, NGFW, Rack, EDR, certificações, B2B, pagamentos e vídeo ao vivo. Todos ficam como roadmap, citados no máximo em uma imagem de "o que vem depois".

### 4.1 Roteiro de vídeo sugerido (2m55s)

1. 0:00 a 0:20. Gancho: primeiro dia no Service Desk, telefone tocando, ninguém ensinou o que fazer. Frase: "Aqui você erra de graça e a caixa-preta mostra por quê."
2. 0:20 a 0:50. Missão 0 (leigo aprende chamado, prioridade e identidade em 30 segundos).
3. 0:50 a 1:50. Nível 2 completo, em ritmo legível: validar identidade, SimuDesk, diagnosticar antes de alterar, resolver.
4. 1:50 a 2:15. Replay e Juiz 360: critérios binários observáveis, debrief didático. Montagem de 8 segundos com os Níveis 3, 4 e 4b ("mais quatro desafios").
5. 2:15 a 2:40. Currículo Vivo assinado: verificação offline; trocar um caractere e mostrar "adulterado".
6. 2:40 a 2:55. Resultado do piloto (números reais), custo zero, repositório e demo.

---

## 5. O que DEVE mudar no produto pós-Hackathon

- **Onda 1 (meses 1 e 2):** contas e persistência de progresso; Missão 0 expandida; conteúdo base de UC1 e UC4 (hardware básico, impressão, M365 operacional, redação de chamado); medição de tempo ativo; termos de uso, política de privacidade, encarregado de dados; público 18+ com aferição de idade; contabilidade e CNAEs; revisão jurídica do marketing.
- **Onda 2:** conteúdo de UC2 e UC3 com redução de profundidade (rede básica, Windows e suporte remoto); biblioteca de cenários a partir da taxonomia de incidentes reais (arquivo 03); PBQs autorais; credencial verificável (Open Badges 3.0 ou Verifiable Credentials) com revogação.
- **Onda 3:** N2 e N3 como especializações opcionais; programa de parceria educacional com fabricantes antes de usar interface semelhante; B2B somente com painel real e contrato.
- **Onda 4:** voz primeiro (custo e latência menores), vídeo com avatar só depois; consentimento específico; retenção mínima; transferência internacional documentada; limites de uso por plano.
- **Revisar a matriz de 560 horas:** renomear para "estimativa de estudo" até medir; separar núcleo Júnior (100 a 140 horas de prática real) de especializações.

---

## 6. Perguntas em aberto para o autor (decisão necessária)

1. O tema final do Hackathon é claro (protótipo) ou escuro (atual)?
2. Aceita pagar cerca de US$ 7 pela Render Starter durante a avaliação para eliminar a espera de ativação?
3. Autoriza reescrever documentos públicos para retirar dados pessoais do time (sem reescrever histórico Git)?
4. Há integrantes dispostos a participar do piloto com iniciantes reais?

---

## 7. Riscos de regulamento observados

| Item do regulamento | Situação | Ação |
| :--- | :--- | :--- |
| 3.1 e 4.1 (18+, 1 a 4 integrantes) | Time de 3 ativos | Confirmar painel |
| 4.3 (composição até 30/nov) | Saída registrada nos documentos, painel não verificável | Atualizar painel |
| 6.1 (repositório novo, commits após 04/nov 21h) | Repositório criado em 14/nov; primeiro commit local às 04h49 de 14/nov, antes da criação do repositório remoto (14h29) | Explicar no README que o histórico local foi publicado depois; não reescrever mais |
| 6.2 (código anterior privado) | Repositório precursor privado existe; RFC copiado para `docs/rfc` | Declarar que é documentação e que nenhum código foi copiado |
| 6.6 (licença) | Sem LICENSE | Adicionar |
| 7.2 (demo sem login) | Domínio personalizado exige login | Usar vercel.app |
| 7.3 (demo no ar durante avaliação) | Render gratuita dorme em 15 minutos | Starter ou monitor |
| 8.4 (congelamento 1 a 11/dez) | Render redeploya a cada commit na main | Nenhum commit no período; trocar variáveis não conta como commit, mas evitar |
| 8.5 (todos presentes na final) | Um integrante encerrou participação por logística | Painel deve refletir a saída antes de 30/nov |
| 9.1 (critérios) | Execução técnica, implementação, impacto, comunicação | Plano acima prioriza nessa ordem |

---

## 8. Itens positivos que devem ser preservados

- Motor determinístico como autoridade única; diálogo sem poder de alterar estado.
- Respostas honestas a comandos fora do escopo; dados sintéticos; sem chave de IA no frontend.
- Concorrência otimista com `seqEsperado` e verificação no Postgres.
- Gramática SQL fechada e cenário de bloqueio de escrita demonstrável.
- Testes de acessibilidade automatizados e jornadas E2E.
- Vetores de teste compartilhados entre linguagens (a ideia é correta; faltam vetores com acento e símbolo).

---

## 9. Limites desta auditoria

- Não executei o frontend (Vitest, Playwright, lint) nem os testes de integração com Postgres: não há Docker disponível para uso autorizado nesta sessão e executar o frontend exigiria gravar em `src/frontend`. Números de teste do frontend vêm do DevLedger e da contagem estática.
- Não criei sessões no ambiente de produção para não gravar dados; a divergência de hash foi provada isoladamente com o mesmo código de canonicalização, e o efeito ponta a ponta é inferência.
- Não testei sobrecarga do limitador de taxa em produção.
- Não verifiquei preços de Udemy, Coursera, Rocketseat e Escola DNC.
- Parecer tributário e jurídico é orientação técnica, sem substituir contador ou advogado.
- Observei que o diretório `src/frontend/dist` foi gerado durante a minha sessão (20h18) por processo que não é meu (provavelmente outro agente da mesma auditoria em paralelo). Meus artefatos temporários ficaram em `%TEMP%` (cópias do backend e sonda de canonicalização) e em `.playwright-mcp` na raiz do repositório (removido ao final).
