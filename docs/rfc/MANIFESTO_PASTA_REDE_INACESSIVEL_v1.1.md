# Manifesto v1.1 — Cenário `pasta-rede-inacessivel`

| Campo | Valor |
| :--- | :--- |
| Versão | 1.1 |
| Base normativa | Decisão arquitetural **D9** |
| RFC relacionado | [PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md](./PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md) |

Este documento especifica o cenário `pasta-rede-inacessivel` em nível técnico e pedagógico: modelo de estado, três causas raiz sorteadas por semente, sinais discriminantes, ações prejudiciais e critérios observáveis de avaliação.

---

## 1. Visão geral

| Campo | Valor |
| :--- | :--- |
| Identificador | `pasta-rede-inacessivel`, versão `1.1` |
| Nível na jornada | Nível 2 · Analista Jr (N1) |
| Duração-alvo | 15 a 25 minutos por atendimento |
| Causas raiz | Três (**D6**), sorteadas por sessão a partir de uma semente |
| Competências | Triagem por perguntas, diagnóstico por eliminação, leitura de mensagens de erro, priorização por impacto, escalonamento, governança de acesso, uso correto de privilégio, documentação com evidência, validação com a usuária |

### 1.1. Ambiente de referência e limite de fidelidade

O cenário reproduz **uma configuração de referência documentada** de workstation corporativa, sem imitar identidade visual proprietária nem prometer paridade integral com todas as edições e políticas de sistema operacional:

| Item | Comportamento de referência |
| :--- | :--- |
| Sistema de referência | Ambiente Windows em português do Brasil (mensagens de erro padrão de rede e serviço) |
| Mensagens de erro `5`, `53`, `2138`, `1060` | Textos padrão de diagnóstico (`Acesso negado`, `Caminho da rede não encontrado`, `Serviço não iniciado`, `Serviço especificado não existe`) |
| `ipconfig /flushdns` sem elevação | `A operação solicitada requer elevação.` (erro 740) |
| `sc query Workstation` | `FALHA 1060` (nome interno do serviço é `LanmanWorkstation`) |
| `net start` / `sc start` sem elevação | Erro `5` (acesso negado) |

Os testes do motor verificam coerência determinística com esta especificação de referência.

### 1.2. Empresa fictícia (**D2**)

*Aurora Logística*, domínio `aurora.local`. Todos os nomes, endereços IP e pessoas são sintéticos. A interface utiliza identidade visual própria, sem copiar marcas de terceiros.

| Elemento | Nome | Endereço / Referência |
| :--- | :--- | :--- |
| Servidor de diretório e DNS | `SRV-DC01` | `10.0.0.10` (ambiente de especificação) |
| Servidor de arquivos | `SRV-ARQUIVOS` / `fileserver.aurora.local` | IP documentado na Base de Conhecimento do cenário |
| Compartilhamento | `\\srv-arquivos\financeiro` / `\\fileserver.aurora.local\Financeiro` | — |
| Estação da usuária | `FIN-PC07` / `EST-FIN-042` | Endereço na sub-rede corporativa |
| Usuária solicitante | Maria Souza (`maria.souza`), Financeiro | — |
| Colega de setor | Joana Lima (`joana.lima`) | — |
| Gestor do Financeiro | Carlos Mendes | — |
| Conta do técnico | `tecnico.n1` (o participante) | — |
| Grupo de acesso à pasta | `GRP_FINANCEIRO_LEITURA` / `GRP_FINANCEIRO_PASTA` | — |

*(Nota: os literais de rede e grupo concretos utilizados em memória são definidos em `CatalogoCenarios.cs` e espelhados na Base de Conhecimento da sessão.)*

---

## 2. Abertura: chamado e fila

### 2.1. Chamado principal (igual nas três causas)

> **Assunto:** não consigo abrir a pasta do financeiro URGENTE  
> **Descrição:** a pasta do financeiro não abre de jeito nenhum, preciso fechar os pagamentos hoje!!  
> **Solicitante:** Maria Souza — **Categoria:** (vazia) — **Prioridade:** (vazia)

### 2.2. Fila inicial (anti-spoiler)

A fila tem **quatro chamados além do principal, todos presentes desde o início**, na mesma ordem e com os mesmos horários nas três causas. Nenhum chamado entra durante o atendimento.

| Posição | C1 e C3 | C2 |
| :--- | :--- | :--- |
| 1 a 3 | Três chamados de ruído de outros setores, idênticos nas três causas (nenhum relacionado a rede ou arquivos). | Iguais. |
| 4 | Chamado vago de outro setor, título **"erro ao abrir arquivos"**, sobre anexos de e-mail. | Chamado relacionado à mesma pasta do financeiro, sem destaque visual diferente. A descrição, visível só ao abrir o chamado, indica impacto no setor. |

Título, posição, horário, prioridade e destaque do chamado 4 são iguais nas três causas. A relação com o caso da Maria só aparece se o participante **abrir** o chamado, **buscar chamados semelhantes** ou **perguntar à Maria**. Vincular e encerrar o chamado correlato ajuda na análise de impacto, sendo tratado como **boa prática observada**, e não exigência obrigatória para concluir C2.

---

## 3. Modelo de Estado

### 3.1. Subsistemas isolados

O estado é separado em camadas independentes para que testes e replay expliquem cada mudança:

| Camada | Conteúdo | Exemplo de uso |
| :--- | :--- | :--- |
| `privilegio` | Perfil exigido por ação e contexto de execução | `ipconfig /flushdns` exige contexto elevado |
| `identidade` | Conta ativa em cada contexto de terminal | `whoami` mostra conta da usuária ou técnico |
| `sessao` | Token da sessão da usuária: grupos carregados no logon | `whoami /groups` |
| `diretorio` | Usuários, grupos e membros no servidor | `net user maria.souza /domain`, painel de usuários |
| `dns`, `rede_estacao`, `servicos_estacao`, `compartilhamento` | Subsistemas do estado limitado | Alterações restritas por papel |
| `meta` | Versão do manifesto (`1.1`) e semente | Replay e auditoria |

Não há propagação automática entre camadas. Em especial, alterar um grupo no `diretorio` não atualiza automaticamente a `sessao`: a usuária precisa efetuar novo logon para renovar o token.

### 3.2. Causas raiz sorteadas por semente

```yaml
causas:
  C1_grupo_ausente:
    resumo: "Maria foi transferida e não está no grupo de acesso da pasta"
    efeito: "Grupo do financeiro ausente no diretório e no token da usuária"
    afeta_outros_usuarios: false
  C2_dns_errado:
    resumo: "Registro DNS do servidor de arquivos aponta para IP incorreto"
    efeito: "Resolução DNS e cache da estação apontam para IP inalcançável"
    afeta_outros_usuarios: true
  C3_servico_parado:
    resumo: "Programa instalado pela usuária interrompeu o serviço LanmanWorkstation"
    efeito: "Serviço de cliente de rede parado na estação"
    afeta_outros_usuarios: false
```

Em **C2**, o cache DNS da estação mantém o registro incorreto mesmo após o escalonamento corrigir o servidor DNS; por isso, o acesso só é restabelecido após executar `ipconfig /flushdns` no contexto elevado.

---

## 4. Sinais discriminantes

Respostas do motor por teste e por causa. Apenas os sinais em negrito diferenciam as causas; todo o restante é idêntico para impedir detecção prematura (*anti-spoiler*):

| Teste do participante | C1 — grupo ausente | C2 — DNS errado | C3 — serviço parado |
| :--- | :--- | :--- | :--- |
| `nslookup <servidor>` | IP correto | **IP incorreto** | IP correto |
| `ping <servidor>` | Responde | **Esgotado o tempo limite** | Responde |
| `ping <IP correto>` | Responde | Responde | Responde |
| `net use \\<servidor>\financeiro` | **Erro 5 (Acesso negado)** | **Erro 53 (Caminho não encontrado)** | **Erro 2138 (Serviço não iniciado)** |
| `net use \\<IP correto>\financeiro` | Acesso negado | **Conecta** | Serviço não iniciado |
| `whoami /groups` (contexto a) | **Sem o grupo financeiro** | Com o grupo | Com o grupo |
| `net user maria.souza /domain` | **Sem o grupo financeiro** | Grupos corretos | Grupos corretos |
| `sc query LanmanWorkstation` / painel Serviços | Em execução | Em execução | **Parado** |
| `sc query Workstation` | Falha 1060 | Falha 1060 | Falha 1060 |
| Pergunta à usuária: "algo mudou?" | **Relata transferência recente** | "Aqui não mudou nada." | **Relata instalação de software recente** |
| Pergunta: "outra pessoa tem o problema?" | Colega acessa normalmente | **Colega também afetada** | Colega acessa normalmente |

---

## 5. Resolução esperada por causa

| Item | C1 — grupo ausente | C2 — DNS errado | C3 — serviço parado |
| :--- | :--- | :--- | :--- |
| **Caminho correto** | Solicitar aprovação do gestor (grupo, motivo, evidência) → incluir a usuária no grupo pelo painel administrativo → pedir novo logon → validar com a usuária. | Escalar para N2-Infraestrutura com evidência e prioridade P2 → N2 corrige e devolve → elevar e rodar `ipconfig /flushdns` → validar com a usuária. | Elevar → iniciar `LanmanWorkstation` (painel Serviços ou terminal elevado) → validar com a usuária → registrar o programa suspeito. |
| **Rotas alternativas válidas** | Alteração de grupo restrita ao painel administrativo. | Contorno temporário por IP registrado como nota enquanto aguarda N2. | Painel de Serviços ou terminal elevado. |
| **Armadilha pedagógica** | Acesso continua negado até novo logon. | N1 não altera DNS diretamente; `ipconfig /flushdns` exige elevação. | `net start`/`sc start` sem elevação falham com erro 5. |
| **Prioridade esperada** | P3 | **P2** (impacto setorial) | P3 |
| **Critério de conclusão** | Usuária acessa a pasta pelo nome | Usuária acessa a pasta pelo nome; chamado principal encerrado | Usuária acessa a pasta pelo nome |

### 5.1. Ações prejudiciais

Toda ação prejudicial **altera o estado**, produz efeito observável e pode ser revertida. A trilha de eventos conserva tanto a tentativa quanto a eventual reversão:

| Causa | Ação prejudicial | Efeito no estado | Reversão |
| :--- | :--- | :--- | :--- |
| C1 | Incluir usuária em grupo privilegiado (`Admins do Domínio`) | Membro em grupo privilegiado | Remover pelo painel |
| C1 | Conceder permissão a `Todos` no compartilhamento | Permissão ampla insegura | Remover pelo painel |
| C1 | Incluir no grupo **sem aprovação** | Membro incluído com ressalva de governança | Remover e refazer com aprovação |
| C1 | Encerrar sem pedir novo logon | Acesso continua negado | Solicitar novo logon |
| C2 | Editar arquivo `hosts` e encerrar | Estação acessa localmente, mas DNS permanece incorreto | Remover entrada no `hosts` e escalar |
| C2 | Encerrar apenas com contorno por IP | Problema de resolução por nome persiste | Escalar ao N2 |
| C3 | Desativar firewall | Firewall inativo | Reativar firewall |
| C3 | Encerrar sem registrar o programa suspeito | Falha de governança/documentação | Registrar no chamado |

---

## 6. Base de conhecimento do cenário

Artigos curtos disponíveis desde o início na Intranet, sem revelar a causa sorteada:
- **KB-001 Topologia:** servidores, IPs de referência, compartilhamentos e grupos.
- **KB-004 Acesso a pastas de rede:** política de aprovação do gestor e necessidade de novo logon.
- **KB-007 Diagnóstico de acesso a compartilhamento:** fluxo lógico de investigação por camadas.
- **KB-009 Escalonamento:** fronteiras N1 vs. N2 e evidências exigidas no escalonamento.
- **KB-012 Segurança na estação:** regras sobre firewall, arquivo `hosts`, software não autorizado e menor privilégio.
- **KB-015 Comandos disponíveis:** catálogo oficial de comandos e contextos exigidos (`LanmanWorkstation`).

---

## 7. Interfaces e comandos suportados (**D2**)

### 7.1. Painéis
- **Ambiente remoto da estação:** Serviços (listar; iniciar/parar exigem elevação), Rede (somente leitura), Arquivo `hosts` (editável sob elevação), ação explícita **Elevar**.
- **Painéis administrativos:** Usuários e grupos, DNS (somente leitura para N1), Solicitar aprovação do gestor, Escalar para N2.

### 7.2. Contextos de terminal
- **(a) Sessão da usuária (`maria.souza`):** sem elevação.
- **(b) Prompt elevado do técnico (`tecnico.n1`):** ativado por ação explícita **Elevar**, registrada no replay com timestamp.

### 7.3. Comandos declarados

| Comando | Contexto (a) | Contexto (b) | Efeito no estado |
| :--- | :--- | :--- | :--- |
| `ipconfig` / `ipconfig /all` | Sim | Sim | Nenhum (leitura) |
| `ipconfig /flushdns` | Erro de elevação | Sim | Limpa `cache_dns` |
| `ping` (nome ou IP) | Sim | Sim | Nenhum (leitura) |
| `nslookup` | Sim | Sim | Nenhum (leitura) |
| `net use` | Sim | Sim | Consulta / mapeamento quando válido |
| `whoami` / `whoami /groups` | Lê sessão da usuária | Lê identidade técnica | Nenhum (leitura) |
| `net user maria.souza /domain` | Sim | Sim | Lê diretório |
| `sc query LanmanWorkstation` | Sim | Sim | Nenhum (leitura) |
| `sc query Workstation` | Falha 1060 | Falha 1060 | Nenhum |
| `sc start` / `net start LanmanWorkstation` | Erro 5 | Sim | Inicia o serviço |
| `netsh advfirewall set allprofiles state off` / `on` | Erro de elevação | Sim | Desativa / reativa firewall |
| `help` | Sim | Sim | Lista comandos disponíveis |

Qualquer comando fora da lista declarada recebe resposta explícita informando que não está disponível no ambiente de treinamento — nunca uma saída inventada.

---

## 8. Atores simulados

- **Usuária (Maria Souza):** leiga e educada; conhece apenas sintomas visíveis pelo estado atual do motor. Nunca afirma que funcionou enquanto o estado indicar falha.
- **Liberação do acesso remoto:** decidida por regra determinística no servidor após identificação, confirmação do sintoma e solicitação educada.
- **N2-Infraestrutura virtual:** responde de forma determinística e imediata — corrige o registro DNS e devolve o chamado quando recebe evidência estruturada; devolve sem alterar nada se não houver evidência.
- **Aprovação do gestor (Carlos Mendes):** aprova quando grupo, motivo e evidência estão preenchidos corretamente; recusa com justificativa caso o pedido seja incompleto ou incompatível com a política.

---

## 9. Juiz 360º

### 9.1. Desfecho em três estados

| Desfecho | Critério |
| :--- | :--- |
| **Resolvido em conformidade** | Critério técnico de conclusão atendido; nenhuma ação prejudicial no estado final ou na trilha; itens de processo aplicáveis atendidos. |
| **Resolvido com ressalva** | Critério técnico atendido, porém com item de processo pendente ou ação prejudicial tentada e posteriormente revertida. Restaurar o estado mantém a transparência no replay. |
| **Não resolvido ou agravado** | Usuária não acessa a pasta pelo nome no encerramento, **ou** permanece regressão de segurança (firewall inativo, grupo privilegiado indevido, permissão ampla). |

### 9.2. Checklist observável (binário)

- **Técnica:** usuária acessa o compartilhamento pelo nome ao final; ausência de regressões de segurança (`firewall` ativo, `hosts` limpo, sem grupos privilegiados indevidos).
- **Diagnóstico:** execução de ao menos um teste discriminante **antes** da correção e verificação **depois** da correção.
- **Privilégio:** elevação acionada apenas para ações administrativas necessárias.
- **Processo:** categoria, prioridade, aprovação/escalonamento com evidência e nota técnica completa.
- **Atendimento e Ajuda (D3):** cumprimento de etapas de triagem/comunicação e registro transparente de consultas à KB e pedidos de pista.

---

## 10. Garantias de Testes do Cenário

1. **Rotas determinísticas por causa:** resolução válida para C1, C2 e C3 testada de ponta a ponta sem chamadas externas.
2. **Ações prejudiciais e reversão:** cada anti-padrão testado quanto ao efeito no estado, possibilidade de reversão e impacto no veredito do Juiz.
3. **Anti-spoiler:** fila inicial, artigos da KB, abertura e respostas genéricas idênticos entre sementes; apenas sinais discriminantes mudam conforme a causa sorteada.
4. **Autoridade do motor:** encerrar o chamado com o problema ainda ativo nunca resulta em sucesso técnico, independentemente do texto enviado no chat.
