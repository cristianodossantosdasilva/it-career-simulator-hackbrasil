# Novas Ideias, Conteúdo e Cenários (Kiro CLI)

Regra de privacidade aplicada: das bases de conhecimento reais usei apenas a **taxonomia** (categorias, tipos de falha e títulos genéricos de procedimentos). Nenhum nome de pessoa, empresa cliente, credencial ou identificador foi copiado. Itens que citavam fabricantes aparecem só como tecnologia genérica (por exemplo, "firewall de borda").

## 1. O que as bases de conhecimento mostram (taxonomia)

| Base consultada | Conteúdo observado (somente categorias) |
| :--- | :--- |
| Referências do mentor sênior de TI | Cerca de 25 pastas temáticas, cada uma com cerca de 60 artigos numerados: governança, Microsoft 365, redes e DNS e DHCP e Wi-Fi, servidores, backup e continuidade, sistemas corporativos, estações de trabalho, impressão e digitalização, monitoramento, automação com PowerShell, procedimentos operacionais, migrações, troubleshooting, segurança de e-mail, auditoria, painéis de indicadores, gestão de dispositivos, nuvem e identidade, migração de e-mail, lições aprendidas |
| Snapshot de KB (OPTEC) | Pequeno recorte sobre memória alta, checkpoint de virtualização, monitoramento e lição aprendida |
| Consultoria de modernização e Modernização de suporte legado | Mesma estrutura de 10 a 14 pastas mais artefatos de projeto, processos ITIL, indicadores e conformidade |
| Arquivos de suporte | Dois artigos curtos sobre atualização e reinstalação de aplicativo bancário em estação |
| DeskManager | Automação com perfil de navegador salvo localmente; **não aprofundei** por risco de dados sensíveis; só confirmei a existência de dois subprojetos de automação e validação de backup |

Os índices de artigos (por exemplo, troubleshooting TR001 a TR060, estações WF001 a WF060, impressão IMP, rede NET, lições LI) mostram o que o suporte real brasileiro mais atende: impressora offline ou fila presa, DHCP sem endereço, DNS com registro antigo, VPN que conecta mas não alcança recurso interno, perfil temporário no Windows, Windows Update travado, certificado A1 e A3, caixa compartilhada sem permissão, regra de caixa e encaminhamento suspeitos, backup que falhou, agente offline, disco cheio por checkpoint esquecido, servidor com memória alta sem diagnóstico prévio, regra de firewall aberta demais, bloqueio recorrente de conta, política de grupo aplicada na unidade errada.

**Observação de aderência:** o catálogo atual (5 cenários) cobre bem engenharia social, causa de rede e incidente massivo. Faltam os incidentes de **maior volume real**: impressão, e-mail, perfil, VPN, backup e dispositivos móveis.

## 2. Novos cenários propostos (biblioteca de 24, em quatro pacotes)

Formato: causa sorteada por semente, três a cinco critérios binários observáveis, um erro comum "armadilha" e uma consulta à KB como evidência.

### Pacote A. Balcão e estações (Júnior)
| Código | Cenário | Causas sorteadas | Armadilha didática |
| :--- | :--- | :--- | :--- |
| A1 | Impressora offline | IP alterado, fila presa no spooler, driver corrompido | Reinstalar driver sem olhar a fila |
| A2 | Digitalização para pasta não chega | Permissão de compartilhamento, caminho renomeado, senha expirada da conta de serviço | Culpar o equipamento |
| A3 | Perfil temporário no Windows | Perfil corrompido, disco cheio, serviço de perfil parado | Criar usuário novo e perder dados |
| A4 | Computador lento | Disco quase cheio, inicialização carregada, memória insuficiente | Reiniciar sem medir |
| A5 | Windows Update travado | Cache corrompido, serviço parado, espaço insuficiente | Interromper atualização no meio |
| A6 | Certificado digital A1 ou A3 | Cadeia ausente, token não reconhecido, certificado vencido | Instalar de fonte não verificada |

### Pacote B. Rede e acesso (Júnior para Pleno)
| Código | Cenário | Causas | Armadilha |
| :--- | :--- | :--- | :--- |
| B1 | Sem endereço IP (APIPA) | Escopo DHCP esgotado, cabo, VLAN errada | Atribuir IP fixo e gerar conflito |
| B2 | Conecta na VPN mas não acessa recurso | Sub-rede local conflitante, rota ausente, DNS interno não entregue | Reinstalar o cliente VPN |
| B3 | DNS resolve endereço antigo | Registro desatualizado, cache, reserva errada | Limpar cache só no cliente |
| B4 | Wi-Fi instável em um andar | Canal saturado, ponto desligado, autenticação expirando | Aumentar potência |
| B5 | Regra de firewall aberta demais | Atalho "qualquer origem para qualquer destino" criado em emergência | Remover sem avaliar impacto |

### Pacote C. Nuvem de produtividade e identidade (Pleno)
| Código | Cenário | Causas | Armadilha |
| :--- | :--- | :--- | :--- |
| C1 | Caixa compartilhada sem permissão de envio | Permissão faltando, cache do cliente, delegação mal feita | Dar permissão total ao usuário |
| C2 | Conta suspeita de comprometimento | Regra de caixa criada, encaminhamento externo, sessão antiga | Apenas trocar a senha |
| C3 | E-mails indo para spam | SPF ou DKIM ou DMARC ausente ou desalinhado | Liberar remetente em lista de permissão |
| C4 | Sincronização de arquivos duplicada | Atalho duplicado, conflito de versão, cota | Apagar a pasta local |
| C5 | Bloqueio recorrente de conta | Credencial salva antiga, tarefa agendada, aplicativo móvel | Desbloquear sem achar a origem |
| C6 | Política de grupo não aplica | Unidade organizacional errada, filtro de segurança, replicação | Alterar a política no servidor errado |

### Pacote D. Continuidade e servidores (Pleno para especialista)
| Código | Cenário | Causas | Armadilha |
| :--- | :--- | :--- | :--- |
| D1 | Backup concluído com alerta | Destino sem espaço, agente desatualizado, janela estourada | Marcar como "ok" |
| D2 | Restauração solicitada | Escolha de ponto, teste em área isolada, validação do conteúdo | Restaurar por cima do dado atual |
| D3 | Disco cheio em servidor virtual | Checkpoint esquecido, log crescendo, anexo de e-mail | Apagar arquivos aleatórios |
| D4 | Memória em 99 por cento | Processo vazando, serviço em laço, falta de linha de base | Reiniciar sem evidência |
| D5 | Incidente massivo após mudança | Reaproveita o N3 atual com novas causas | Tratar cada chamado isolado |
| D6 | Aplicativo corporativo de terceiros quebrou após atualização | Versão incompatível, cache, reinstalação limpa | Reinstalar sem copiar configuração |

Cada cenário pode reaproveitar o motor atual, o ITSM e o Juiz 360 sem mudar contratos. Esforço estimado por cenário simples: 1 a 2 dias, incluindo teste e KB.

## 3. Mecânicas de aprendizagem e gamificação (baratas e coerentes com o motor)

1. **Revisão do atendimento:** o Replay vira o centro da identidade do produto. Linha do tempo, decisões, o que foi observado e o que o motor julgou.
2. **Revisão pós-incidente sem culpa:** após cada cenário, formulário curto (linha do tempo, impacto, causa, ação de prevenção) avaliado por checklist objetivo.
3. **Chamado bem escrito:** critérios binários sobre o texto do chamado (continha sintoma, impacto, o que foi testado, próximo passo). Treina a habilidade mais cobrada em N1.
4. **Cartas de decisão:** "resolver ou escalar" com custo explícito de cada escolha.
5. **Plantão do dia:** semente do dia igual para todos (sem placar com dados pessoais), para comparar estratégia.
6. **Trilha reversa:** mostrar a solução de outra pessoa (anonimizada) e pedir para achar a falha de procedimento.
7. **Mapa de competências** em vez de XP isolado: cada critério do Juiz alimenta uma habilidade (triagem, diagnóstico, comunicação, segurança, documentação).
8. **Checklist de pré-missão:** antes de agir em produção simulada, o aluno marca verificações (identidade, backup, janela, plano de volta). Reforça cultura de mudança segura.
9. **Dificuldade adaptativa por semente:** causas mais difíceis só depois de dois acertos na causa fácil.
10. **Modo "ajuda gradual":** pista 1 conceitual, pista 2 de ferramenta, pista 3 de comando; custo em XP só da terceira.

## 4. Melhorias nos oito laboratórios dedicados (quando forem construídos)

| Laboratório | Recomendação |
| :--- | :--- |
| HardwareWorkbenchLab | Começar por 3 tarefas observáveis (identificar peça, sequência de montagem, diagnóstico por código de bipes); evitar 3D |
| OsSystemAdminLab | Simular apenas comandos declarados por versão; mostrar saída "não suportado nesta simulação" com honestidade |
| NetworkCablingWifiDesignLab | Tela de planta com atenuação simples e mapa de calor aproximado, sem nome de produto de fabricante |
| CorporateWorkspaceLab | Priorizar impressão e caixa compartilhada antes de AD complexo |
| ServerSustainmentLab | Linha do tempo de eventos e correlação de logs |
| MultiVendorNetworkFirewallLab | Interface genérica de firewall e roteador com sintaxe didática; marcar "não equivale a nenhum fabricante" |
| DataCenterStorageCloudBackupLab | Cenário central: restauração validada (o restore, não o backup, é o que importa) |
| CyberBlueTeamSqlLab | Console de alertas e investigação; SQL só leitura sobre dataset fixo |

Para cada laboratório: critérios binários, semente, tempo ativo medido, texto de "o que este laboratório não simula".

## 5. Estrutura de PBQs (questões práticas) para certificações

- Cada PBQ é um mini-cenário do motor com: estado inicial, ações permitidas, ordem não obrigatória, critérios binários.
- Formatos: ordenar passos de diagnóstico, preencher configuração, escolher comando e interpretar saída, identificar item errado em log.
- Banco autoral baseado nos objetivos públicos de cada certificação. Nunca usar questão de prova, nem "parecida demais".
- Revisão por segundo autor e teste com 5 pessoas; metadados (tópico, dificuldade, tempo, taxa de acerto).
- Aviso de que a plataforma prepara e não emite certificação de terceiros.

## 6. Recomendações para o módulo futuro de chamada com agentes de IA

1. **Fase 0 (zero custo):** chamada por texto com personas e reconhecimento de fala no navegador, sem enviar áudio a terceiros.
2. **Fase 1:** voz com modelo de tempo real, sessões curtas (5 a 8 minutos), teto de minutos por plano e corte automático.
3. **Fase 2:** vídeo com avatar apenas se a métrica de aprendizagem mostrar ganho sobre a voz.
4. **Segurança de domínio:** o agente só lê um retrato do estado; nunca altera estado nem atribui nota. A nota vem de critérios sobre a transcrição (checklist de comunicação: saudação, empatia, confirmação de identidade, expectativa realista).
5. **Privacidade:** consentimento específico para gravar; guardar transcrição, não áudio; retenção curta; acesso do aluno e exclusão; sem uso de voz para identificar pessoa.
6. **Custo:** orçamento por sessão (ver 04), alarme de gasto e modo de contingência para chat.
7. **Patrocinador de telefonia:** o regulamento do Hack Brasil inclui plano de telefonia em nuvem para o top 3 e três meses para participantes com rascunho aprovado; só vale a pena se o roteiro de voz estiver pronto, o que não é o caso hoje.

## 7. Ideias de conteúdo de entrada que faltam

1. Redação de chamado e atendimento ao cliente difícil (roteiros, linguagem simples, empatia, limites).
2. Suporte remoto (sessão, consentimento, registro) e ética de acesso.
3. Impressão e digitalização em rede.
4. Dispositivos móveis corporativos (Android e iOS) e conceitos de conformidade.
5. Telefonia IP básica (ramais, fila, troca de aparelho).
6. Linux de estação em nível básico e comandos de rede.
7. Inglês técnico de leitura (mensagens de erro, documentação).
8. LGPD no balcão (o que pedir, o que não pedir, o que registrar).
9. Automação básica (script de coleta de informação, sem administrar servidor).

## 8. Pequenas ideias de produto e narrativa

- **Cartão de "Primeiro dia"** para compartilhar sem dados pessoais (competências e trilha, sem nome).
- **Modo professor** gratuito para escolas e ONGs, com semente da turma e relatório agregado; é onde a trilha "Acesso à educação" ganha tração.
- **Modo baixa conexão:** páginas leves, cache e funcionamento com rede instável; cabe no tema "acesso".
- **Acessibilidade como diferencial:** leitura em voz alta de chamados, alto contraste, tamanho de fonte, navegação só por teclado já parcialmente testada.
- **Glossário vivo:** cada termo clicável abre uma explicação de 20 segundos com o cenário em que ele aparece.
