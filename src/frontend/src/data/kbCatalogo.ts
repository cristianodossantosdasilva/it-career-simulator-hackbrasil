export interface ArtigoKb {
  id: string
  uri: string
  titulo: string
  categoria: string
  nivel: string[]
  conteudo: string
}

export const KB_CATALOGO: ArtigoKb[] = [
  // === N1: Seguranca e Engenharia Social ===
  {
    id: 'KB-001',
    uri: 'kb://seguranca/politica-reset-senha',
    titulo: 'Politica de Verificacao de Identidade e Reset de Senha',
    categoria: 'Seguranca',
    nivel: ['N1'],
    conteudo:
      'Antes de executar reset de senha ou liberar acesso remoto (SimuDesk), o analista DEVE confirmar a identidade do solicitante via Matricula corporativa e Ramal registrado no AD. Se o colaborador nao possuir token corporativo valido, recuse a solicitacao e registre nota interna. Pedidos urgentes de supostos diretores sao vetores comuns de engenharia social.',
  },
  {
    id: 'KB-002',
    uri: 'kb://seguranca/verificacao-identidade',
    titulo: 'Verificacao de Identidade em Solicitacoes Criticas',
    categoria: 'Seguranca',
    nivel: ['N1'],
    conteudo:
      'Para solicitacoes criticas (reset de senha, acesso a dados financeiros, alteracao de permissoes), valide a identidade com pelo menos dois fatores: Matricula + Ramal OU Matricula + Token Corporativo. Nunca confie apenas no nome exibido no e-mail ou chat. Em caso de duvida, solicite callback no ramal registrado.',
  },
  {
    id: 'KB-003',
    uri: 'kb://seguranca/engenharia-social',
    titulo: 'Reconhecendo Tentativas de Engenharia Social',
    categoria: 'Seguranca',
    nivel: ['N1'],
    conteudo:
      'Engenharia social explora confianca e urgencia. Sinais de alerta: pressao de tempo excessiva, ameacas de consequencias, solicitante que evita validacao de identidade, pedidos por canais incomuns. Quando identificar uma tentativa: recuse a solicitacao, registre nota interna detalhada, escalone para o time de Seguranca se necessario.',
  },
  {
    id: 'KB-004',
    uri: 'kb://itsm/documentacao-incidentes',
    titulo: 'Documentacao de Incidentes e Tentativas de Fraude',
    categoria: 'ITSM',
    nivel: ['N1', 'N2'],
    conteudo:
      'Toda tentativa de engenharia social ou solicitacao suspeita deve ser documentada com nota interna no chamado. Inclua: data/hora, canal de comunicacao, dados fornecidos pelo solicitante, razao da recusa. Esta documentacao alimenta metricas de seguranca e auditorias de compliance.',
  },

  // === N2: Diagnostico e Rede ===
  {
    id: 'KB-005',
    uri: 'kb://diagnostico/fluxo-estruturado',
    titulo: 'Fluxo Estruturado de Diagnostico (Observe Antes de Alterar)',
    categoria: 'Diagnostico',
    nivel: ['N2', 'N3'],
    conteudo:
      'Antes de qualquer alteracao na estacao ou servidor, execute diagnostico estruturado: 1) whoami /groups (verificar grupos do usuario), 2) nslookup <servidor> (validar resolucao DNS), 3) ping <servidor> (testar conectividade), 4) net start (listar servicos). Alteracoes sem diagnostico previo podem mascarar a causa raiz e complicar o troubleshooting.',
  },
  {
    id: 'KB-006',
    uri: 'kb://rede/pasta-inacessivel',
    titulo: 'Runbook: Pasta de Rede Inacessivel (Aurora Logistica)',
    categoria: 'Rede',
    nivel: ['N2'],
    conteudo:
      'Para investigar uma pasta de rede: confirme o escopo do impacto, registre mensagens e horarios, verifique conectividade, resolucao de nomes, estado dos servicos e autorizacoes efetivas. Compare os sinais observados com a documentacao aprovada e aplique somente uma mudanca por vez, com privilegio adequado. Se a evidencia indicar componente fora do seu escopo, encaminhe ao grupo responsavel sem antecipar uma causa.',
  },
  {
    id: 'KB-007',
    uri: 'kb://itsm/resolucao-chamado',
    titulo: 'Resolucao de Chamado com Nota Publica',
    categoria: 'ITSM',
    nivel: ['N2', 'N3'],
    conteudo:
      'Ao resolver um chamado, inclua nota publica descrevendo: 1) Qual era o problema, 2) Qual foi a causa raiz identificada, 3) Qual acao corretiva foi aplicada. Nunca resolva antes de confirmar que o usuario consegue acessar o recurso. A nota publica e visivel ao solicitante e melhora a transparencia do atendimento.',
  },
  {
    id: 'KB-008',
    uri: 'kb://itsm/classificacao-sla',
    titulo: 'Classificacao de Chamados e Calculo de SLA',
    categoria: 'ITSM',
    nivel: ['N2', 'N3'],
    conteudo:
      'Classifique o chamado com: Categoria (ex: Rede, Seguranca, Desktop), Urgencia (Critica/Alta/Media/Baixa) e Impacto (Organizacional/Departamental/Individual). O SLA e calculado automaticamente: Critica+Organizacional = 30min, Media+Individual = 8h. Chamados nao classificados nao entram no painel de SLA.',
  },
  {
    id: 'KB-009',
    uri: 'kb://seguranca/acoes-prejudiciais',
    titulo: 'Acoes Prejudiciais e Violacoes de Seguranca',
    categoria: 'Seguranca',
    nivel: ['N2', 'N3'],
    conteudo:
      'Acoes prejudiciais incluem: desativar firewall da estacao, executar comandos destrutivos (format, del /f), ignorar politicas de grupo, resetar senha sem validacao. Qualquer acao prejudicial e registrada como incidente de seguranca e afeta a avaliacao do atendimento. Na duvida, consulte o runbook ou escalone.',
  },

  // === N3: ITIL e Incidentes Massivos ===
  {
    id: 'KB-010',
    uri: 'kb://itil/gestao-problemas',
    titulo: 'Gestao de Problemas ITIL em Incidentes Massivos',
    categoria: 'ITIL',
    nivel: ['N3'],
    conteudo:
      'Em incidentes massivos (multiplos usuarios afetados, mesmo sintoma), crie um Problema ITIL ANTES de resolver chamados individuais. O Problema correlaciona chamados relacionados, centraliza a investigacao de causa raiz e permite resolucao em lote. Sem Problema, a rastreabilidade e perdida e o RCA fica incompleto.',
  },
  {
    id: 'KB-011',
    uri: 'kb://itil/vinculacao-problema',
    titulo: 'Vinculacao de Chamados ao Problema ITIL',
    categoria: 'ITIL',
    nivel: ['N3'],
    conteudo:
      'Vincule TODOS os chamados relacionados ao Problema antes de iniciar a resolucao. A vinculacao permite: comunicacao centralizada, metricas de impacto real, resolucao em lote e rastreabilidade para auditorias. Chamados nao vinculados aparecem como incidentes isolados nas metricas.',
  },
  {
    id: 'KB-012',
    uri: 'kb://diagnostico/logs-servicos',
    titulo: 'Investigacao de Logs e Status de Servicos',
    categoria: 'Diagnostico',
    nivel: ['N3', 'N4'],
    conteudo:
      'Antes de aplicar correcao em incidentes massivos, investigue: 1) Logs do Event Viewer ou journalctl, 2) Status de servicos criticos (net start, systemctl status), 3) Recursos de sistema (Task Manager, top). Os logs indicam a causa raiz; sem eles, a correcao pode ser incompleta ou criar novos problemas.',
  },
  {
    id: 'KB-013',
    uri: 'kb://seguranca/contencao-incidentes',
    titulo: 'Contencao de Incidentes sem Acoes Destrutivas',
    categoria: 'Seguranca',
    nivel: ['N3'],
    conteudo:
      'Durante a contencao de incidentes, evite acoes destrutivas que possam apagar evidencias ou ampliar o impacto. Nao desative firewalls, nao delete logs, nao force reinicializacoes sem diagnostico. O objetivo e estabilizar, nao destruir rastros. Acoes destrutivas sao registradas como incidentes de seguranca.',
  },
  {
    id: 'KB-014',
    uri: 'kb://servicos/privilegio-elevado',
    titulo: 'Operacoes que Requerem Privilegio Elevado',
    categoria: 'Servicos',
    nivel: ['N3', 'N4'],
    conteudo:
      'Operacoes administrativas requerem autorizacao e privilegio adequados ao escopo. Antes de agir, confirme o impacto, use a credencial aprovada, registre a mudanca e valide o resultado. Se a permissao necessaria nao estiver disponivel, interrompa e encaminhe ao grupo responsavel.',
  },
  {
    id: 'KB-015',
    uri: 'kb://itil/analise-causa-raiz',
    titulo: 'Registro de Causa Raiz (RCA) no Problema',
    categoria: 'ITIL',
    nivel: ['N3'],
    conteudo:
      'Um registro de causa raiz deve distinguir evidencias observadas, componente afetado, gatilho confirmado e impacto. Diferencie fatos de hipoteses, cite a linha do tempo e indique como a conclusao foi validada. Nao atribua causa sem evidencia suficiente; mantenha a investigacao aberta ou escale quando necessario.',
  },
  {
    id: 'KB-016',
    uri: 'kb://itil/resolucao-lote',
    titulo: 'Resolucao de Chamados em Lote via Problema',
    categoria: 'ITIL',
    nivel: ['N3'],
    conteudo:
      'Apos registrar a causa raiz no Problema, use "Resolver Todos em Lote" para fechar todos os chamados vinculados simultaneamente. Isso garante: mesma nota de resolucao, mesma data/hora de encerramento, metricas consolidadas. Chamados resolvidos individualmente fragmentam o historico.',
  },
  {
    id: 'KB-017',
    uri: 'kb://itsm/gestao-sla',
    titulo: 'Gestao de SLA em Incidentes Criticos',
    categoria: 'ITSM',
    nivel: ['N3'],
    conteudo:
      'Em incidentes criticos, o SLA e calculado a partir da abertura do primeiro chamado. Classifique e priorize rapidamente para refletir a urgencia real. Chamados vinculados a um Problema herdam a prioridade do Problema. SLA estourado afeta metricas de equipe e avaliacao individual.',
  },

  // === N4 SRE: Cloud e Kubernetes ===
  {
    id: 'KB-018',
    uri: 'kb://sre/classificacao-incidente',
    titulo: 'Classificacao de Incidentes SRE/Cloud',
    categoria: 'SRE',
    nivel: ['N4'],
    conteudo:
      'Incidentes SRE devem ser classificados com: Categoria = Cloud/Infraestrutura, Urgencia = Critica (se afetar disponibilidade), Impacto = Organizacional (se multiplos servicos afetados). A classificacao correta aciona runbooks automaticos e notifica o time de plantao.',
  },
  {
    id: 'KB-019',
    uri: 'kb://sre/diagnostico-cloud',
    titulo: 'Diagnostico SRE: Pods, Logs e Metricas',
    categoria: 'SRE',
    nivel: ['N4'],
    conteudo:
      'Antes de mitigar, execute diagnostico completo: 1) kubectl get pods (status dos pods), 2) kubectl logs <pod> (logs recentes), 3) curl -I <endpoint> (validar resposta HTTP), 4) kubectl top pods (consumo de recursos). Mitigacao sem diagnostico pode mascarar a causa raiz e causar recorrencia.',
  },
  {
    id: 'KB-020',
    uri: 'kb://sre/mitigacao-kubernetes',
    titulo: 'Mitigacao de Incidentes no Cluster Kubernetes',
    categoria: 'SRE',
    nivel: ['N4'],
    conteudo:
      'Operacoes de mitigacao em cluster (kubectl set resources, kubectl rollout restart, kubectl scale) requerem privilegio elevado e RBAC adequado. Verifique seu contexto (kubectl config current-context) antes de executar. Comandos destrutivos (kubectl delete) devem ser evitados durante contencao inicial.',
  },
  {
    id: 'KB-021',
    uri: 'kb://sre/seguranca-operacional',
    titulo: 'Seguranca Operacional em Ambientes Cloud',
    categoria: 'SRE',
    nivel: ['N4'],
    conteudo:
      'Durante mitigacao SRE, evite: kubectl delete pod/deployment sem backup, expor secrets em logs, desabilitar network policies, ignorar alertas de seguranca. Toda acao destrutiva e registrada em audit log e afeta a avaliacao do incidente. Priorize rollback sobre delete.',
  },
  {
    id: 'KB-022',
    uri: 'kb://sre/validacao-disponibilidade',
    titulo: 'Validacao de Disponibilidade Pos-Mitigacao',
    categoria: 'SRE',
    nivel: ['N4'],
    conteudo:
      'Apos aplicar mitigacao, valide disponibilidade antes de resolver o chamado: 1) curl -I <endpoint> retorna 200, 2) kubectl get pods mostra Running, 3) metricas de latencia normalizadas. Resolver chamado sem validacao pode resultar em recorrencia e impacto na confianca do SLA.',
  },

  // === N4b SQL: Auditoria Read-Only ===
  {
    id: 'KB-023',
    uri: 'kb://sql/classificacao-auditoria',
    titulo: 'Classificacao de Chamados de Auditoria de Dados',
    categoria: 'SQL',
    nivel: ['N4b'],
    conteudo:
      'Chamados de auditoria de dados devem ser classificados com: Categoria = Banco de Dados, Urgencia conforme prazo da auditoria, Impacto = Departamental. A classificacao aciona acesso ao console SQL read-only e notifica o DBA de plantao para monitoramento.',
  },
  {
    id: 'KB-024',
    uri: 'kb://sql/investigacao-readonly',
    titulo: 'Investigacao SQL Somente Leitura',
    categoria: 'SQL',
    nivel: ['N4b'],
    conteudo:
      'Investigacoes de auditoria devem usar exclusivamente SELECT e EXPLAIN. O console da Aurora Logistica opera em modo read-only estrito: INSERT, UPDATE, DELETE, DDL e comandos administrativos sao bloqueados. Todas as queries sao registradas para auditoria de acesso a dados sensiveis.',
  },
  {
    id: 'KB-025',
    uri: 'kb://sql/seguranca-readonly',
    titulo: 'Seguranca do Console SQL Read-Only',
    categoria: 'SQL',
    nivel: ['N4b'],
    conteudo:
      'O console SQL read-only implementa: 1) Parsing de query antes de execucao, 2) Blocklist de comandos (INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER), 3) Deteccao de SQL injection (UNION com tabelas nao autorizadas, comentarios maliciosos), 4) Limite de linhas retornadas. Tentativas bloqueadas sao registradas como incidente de seguranca.',
  },
  {
    id: 'KB-026',
    uri: 'kb://sql/resolucao-auditoria',
    titulo: 'Resolucao de Chamados de Auditoria',
    categoria: 'SQL',
    nivel: ['N4b'],
    conteudo:
      'Ao concluir investigacao de auditoria: 1) Documente as queries executadas, 2) Registre a divergencia ou conformidade encontrada, 3) Resolva o chamado com nota publica detalhada. O historico de queries fica vinculado ao chamado para rastreabilidade da auditoria.',
  },
  // === N1: Acesso e Identidade (cenarios por escala) ===
  {
    id: 'KB-027',
    uri: 'kb://acesso/reset-desbloqueio-e-troca',
    titulo: 'Reset, Desbloqueio e Troca de Senha: a Menor Acao',
    categoria: 'Acesso',
    nivel: ['N1'],
    conteudo:
      'Reset, desbloqueio e troca de senha resolvem problemas diferentes. Antes de qualquer um, confirme a identidade da titular e leia o estado da conta no console. Senha esquecida pede reset com senha temporaria e troca obrigatoria. Conta bloqueada pede identificar de onde vem as tentativas antes de desbloquear, senao ela bloqueia de novo. Senha vencida pode ser trocada pela propria titular pelo autoatendimento. Escolha a menor acao que resolve o sintoma: a acao desnecessaria fica registrada na trilha do atendimento.',
  },
  // === N3-B: Data Center e Backup (cenarios por escala) ===
  {
    id: 'KB-030',
    uri: 'kb://backup/diagnostico-de-job',
    titulo: 'Diagnostico de Job de Backup pelo Log',
    categoria: 'Backup',
    nivel: ['N3-B'],
    conteudo:
      'Quando um job de backup falha, o log do job diz o que impediu a execucao. Leia o estado do job e o log antes de qualquer mudanca, depois compare com o estado do repositorio e da cadeia de copias. Alteracoes de capacidade e execucao de jobs exigem privilegio elevado. Depois de corrigir, execute o job de novo e confirme o resultado antes de resolver o chamado com nota publica.',
  },
  {
    id: 'KB-031',
    uri: 'kb://backup/copia-imutavel-e-retencao',
    titulo: 'Copia Imutavel, Cadeia e Retencao',
    categoria: 'Backup',
    nivel: ['N3-B'],
    conteudo:
      'A copia imutavel e a ultima linha de defesa dos dados: nao pode ser alterada nem apagada durante a retencao. A cadeia incremental depende de cada ponto anterior, entao um ponto invalido compromete os seguintes. Antes de restaurar, verifique a integridade da cadeia e das copias para escolher uma origem integra. Nunca apague pontos de restauracao para ganhar espaco e nunca restaure sobre dados integros: as duas acoes comprometem a retencao ou sobrescrevem trabalho do dia.',
  },
  // === N1: Solicitacao de servico (cenarios por escala) ===
  {
    id: 'KB-032',
    uri: 'kb://itsm/solicitacao-de-servico',
    titulo: 'Solicitacao de Servico e Incidente',
    categoria: 'ITSM',
    nivel: ['N1'],
    conteudo:
      'Incidente e a interrupcao ou a degradacao de algo que funcionava. Solicitacao de servico e o pedido de algo novo ou padrao, como mapear uma unidade de rede, liberar um acesso ou instalar um aplicativo. Leia o chamado antes de classificar: se a pessoa descreve uma estacao nova ou diz que precisa de algo que ainda nao tinha, trate como solicitacao e classifique com a categoria de solicitacao de servico. Em qualquer dos casos, diagnostique, aplique a menor mudanca que atende o pedido e resolva com nota publica.',
  },
]

export const KB_URI_MAP: Record<string, string> = Object.fromEntries(
  KB_CATALOGO.map((a) => [a.uri, a.id]),
)

export function resolverUriParaId(uri: string): string | undefined {
  return KB_URI_MAP[uri]
}

export function buscarArtigoPorId(id: string): ArtigoKb | undefined {
  return KB_CATALOGO.find((a) => a.id === id)
}

export function buscarArtigoPorUri(uri: string): ArtigoKb | undefined {
  const id = resolverUriParaId(uri)
  return id ? buscarArtigoPorId(id) : undefined
}
