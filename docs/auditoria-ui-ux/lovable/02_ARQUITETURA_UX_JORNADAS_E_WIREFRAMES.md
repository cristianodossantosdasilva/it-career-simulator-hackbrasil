# Entregavel 02 — Arquitetura de UX, Jornadas do Aluno e Wireframes

> **Auditoria Especializada de UI/UX e Design System — IT Career Simulator**  
> **Auditor Responsavel:** Lovable  
> **Data:** Novembro de 2026  
> **Pasta Oficial do Entregavel:** `docs/auditoria-ui-ux/lovable/02_ARQUITETURA_UX_JORNADAS_E_WIREFRAMES.md`  
> **Status:** 100% Concluido e Validado  

---


## 1. Nova Arquitetura de Informacao e Shell de Produto

Hoje o IT Career Simulator apresenta uma quebra de navegacao: ao entrar na Workstation, o usuario parece entrar em outro sistema, as abas superiores (`Painel`, `Aulas`, `Caderno`, `Mentor`) somem e surgem botoes verticais de aplicativos (`ITSM`, `Chat`, `SimuDesk`, `KB`, `Replay`), sem que o aluno veja simultaneamente o roteiro pedagógico e a ferramenta que deve manipular.

A nova arquitetura unifica o produto em um **App Shell Global Coeso**, inspirado nos padroes do **AWS Skill Builder**, **Microsoft Learn** e **TryHackMe**:

```
[ App Shell Superior: Marca | Trilhas | Minhas Aulas | Caderno | Perfil e XP | Tema Claro/Escuro ]
       |
       +---> / (Catalogo de Carreira e Missoes — AWS Skill Builder Style)
       |
       +---> /trilha/:ucId/licao/:aulaId (Course Player — Udemy / MS Learn Style)
       |        |
       |        +--> [Botao "Iniciar Laboratorio Pratico"]
       |
       +---> /turno/:sessaoId (Workstation Split-Screen — TryHackMe Style)
       |        |
       |        +--> Painel Esquerdo (35%): Guia do Turno / Missao / Mentor Tech Lead
       |        +--> Painel Direito (65%): Mesa de Trabalho de Aplicativos (ITSM / Chat / SimuDesk / KB)
       |
       +---> /turno/:sessaoId/debrief (Revisão Replay e Credencial Criptografica)
       |
       +---> /curriculo/verificar (Verificador JCS e ECDSA P-256 Offline)
```

---

## 2. Jornada do Aluno: Do Primeiro Missão ao Nivel Comercial

A experiencia do participante de 15 a 22 anos (aluno de escola publica ou iniciante em transicao de carreira) e estruturada em quatro fases continuas:

1. **Primeiros 30 Segundos (O "Primeiro Missão")**:
   - O aluno nao le textos gigantes. Ele ve um card de destaque claro: *"Missao 01: Atendimento Inicial sob Engenharia Social"*.
   - Botao primario unico e direto: `[ Iniciar no Primeiro Turno (15 min) ]`.
   - Um contador claro informa a empresa simulada: `Aurora Logistica — Estacao N1`.

2. **Durante o Turno (Split-Screen sem Perda de Rumo)**:
   - Em vez de adivinhar o que fazer nas 4 ferramentas soltas, o painel esquerdo apresenta o checklist do Tech Lead passo a passo com deteccao automatica de conclusao:
     - `[✓] 1. Assumir chamado CH-0001 no ITSM`
     - `[•] 2. Consultar Politica de Reset na KB (Passo Atual)`
     - `[ ] 3. Solicitar Token Corporativo ao solicitante`
     - `[ ] 4. Registrar Nota Interna com evidencia de fraude`
     - `[ ] 5. Recusar o reset indevido e encerrar com nota publica`
   - O painel direito alterna instantaneamente entre ITSM, Chat, SimuDesk e KB, mantendo o guia da missao sempre a vista.

3. **Conclusao do Turno (Debriefing de Missão da Revisão)**:
   - Apresentacao da telemetria de missão: precisao tecnica, adesao as normas de seguranca da informacao, tempo de SLA e qualidade da comunicacao com o usuario.
   - Geracao do bloco assinado ECDSA P-256 do Curriculo Vivo.

---

## 3. Wireframes ASCII de Alta Fidelidade

### 3.1. Tela 1: Catalogo de Missoes e Trilhas (Desktop 1440px)

```
+--------------------------------------------------------------------------------------------------+
| IT FLIGHT SIMULATOR    Trilhas    Minhas Licoes    Caderno    Mentor      [XP: 240]  [Modo Claro] (U)|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  FORMACAO PRATICA EM TECNOLOGIA                                                                  |
|  Simulador de Carreira: Suporte, Redes, Servidores e Ciberseguranca                             |
|  Aprenda resolvendo chamados reais no ambiente corporativo da Aurora Logistica                   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
| [ MISSAO RECOMENDADA AGORA ]                                                                     |
|                                                                                                  |
| Nivel 1 - Suporte N1 e Seguranca                                 Dificuldade: Fundamentos        |
| Cenario: Triagem de Chamado sob Tentativa de Engenharia Social   Duracao Estimada: 15 minutos    |
| Objetivos: Validacao de identidade, consulta a KB-001 e bloqueio de reset fraudulento            |
|                                                                                                  |
| [ Iniciar no Turno Pratico -> ]        [ Ver Teoria e Flashcards ]      Progresso do Nivel: 0%   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  TRILHAS PROFISSIONALIZANTES (MATRIZ 560 HORAS)                                                  |
|                                                                                                  |
|  +--------------------------------+ +--------------------------------+ +------------------------+
|  | CICLO 1: SUPORTE JR E FIELD    | | CICLO 2: PLENO N2 E REDES      | | CICLO 3: SRE E BLUE TEAM |
|  | 4 Meses - 280 Horas            | | 2 Meses - 140 Horas            | | 2 Meses - 140 Horas    |
|  |                                | |                                | |                        |
|  | [✓] UC1: Hardware e Bancada 2D | | [ ] UC5: Servidores e GPO      | | [ ] UC7: Data Center   |
|  | [•] UC2: Windows e Linux       | | [ ] UC6: Redes, Zabbix e Cloud | | [ ] UC8: Blue Team e   |
|  | [ ] UC3: Redes e Cabeamento    | |                                | |      Auditoria SQL     |
|  | [ ] UC4: Ambientes Corp M365   | |                                | |                        |
|  |                                | |                                | |                        |
|  | Progresso: 35% concluido       | | Bloqueado: Conclua Ciclo 1     | | Bloqueado              |
|  | [ Continuar Trilha ]           | | [ Ver Ementa ]                 | | [ Ver Ementa ]         |
|  +--------------------------------+ +--------------------------------+ +------------------------+
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 3.2. Tela 2: Course Player e Guia da Licao (Desktop 1440px)

```
+--------------------------------------------------------------------------------------------------+
| IT FLIGHT SIMULATOR   <- Voltar ao Catalogo   Trilha: Suporte N1   Licao 02 de 10      [Tema] (U)|
+--------------------------------------------------------------------------------------------------+
| CONTEUDO DA LICAO (Max 68ch)                     | EMENTA DO MODULO             | ANOTACOES      |
|                                                   |                              | CORNELL        |
| Modulo: Seguranca Operacional                     | [✓] 1. O que e Service Desk  | [Exportar]     |
| Titulo: Politicas de Senha e Engenharia Social    | [•] 2. Engenharia Social     |                |
|                                                   | [ ] 3. Protocolo de Token    | Ideias-Chave:  |
| No ambiente de suporte, tecnicas de persuasao     | [ ] 4. Abertura no ITSM      | - Atacante usa |
| apelam para urgencia, autoridade ficticia ou      | [ ] 5. Registro de Evidencia |   urgencia     |
| ameaca de prejuizo para forcar o operador a       |                              | - Nunca resetar|
| quebrar normas basicas de seguranca.              | PROGRESSO                    |   sem token    |
|                                                   | [=======>             ] 20%  |                |
| PONTOS DE ATENCAO                                 +------------------------------+ Anotacoes:     |
| 1. Nunca realize reset de senha por solicitacao   | EXERCICIO PRATICO VINCULADO  | Validar sempre |
|    apenas verbal ou chat informal.                |                              | matricula e    |
| 2. A Politica KB-001 exige validacao de           | Cenario: Tentativa de Fraude | ramal antes de |
|    matricula, ramal e geracao de token.           | Empresa: Aurora Logistica    | prosseguir.    |
|                                                   |                              |                |
| [ Praticar este Conceito no Simulador -> ]        | [ Iniciar Lab Pratico ]      |                |
+--------------------------------------------------------------------------------------------------+
```

### 3.3. Tela 3: Workstation Split-Screen em Turno (Desktop 1440px)

```
+--------------------------------------------------------------------------------------------------+
| AURORA WORKSTATION   Turno: N1 Suporte   Tempo: 04:12   SLA Restante: 15:48    [Finalizar Turno] |
+---------------------------------------------------+----------------------------------------------+
| GUIA DO TURNO (35% LARGURA)                       | COCKPIT OPERACIONAL (65% LARGURA)            |
|                                                   | [ ITSM ]  [ Chat ]  [ SimuDesk ]  [ Base KB ]|
| Chamado Ativo: CH-0001                            +----------------------------------------------+
| Solicitante: Marcos Oliveira (Diretoria Vendas)   | FILA DE CHAMADOS                             |
| Prioridade: Alta | Categoria: Acesso a Rede       | ID      Solicitante   Titulo        SLA      |
|                                                   | CH-0001 M. Oliveira   Reset Senha   15m [!]  |
| ORIENTACAO DO TECH LEAD                           +----------------------------------------------+
| "Atencao analista: o usuario alega urgencia para  | DETALHE DO CHAMADO CH-0001                   |
| fechar contrato, mas nao informou ramal valido.   | Status: Em Atendimento (Assumido por Voce)   |
| Consulte a norma antes de qualquer alteracao."    |                                              |
|                                                   | Solicitacao:                                 |
| ETAPAS DO ATENDIMENTO                             | "Preciso da senha do ERP agora, estou diante |
| [✓] 1. Assumir chamado na fila ITSM              | do cliente e nao posso esperar o protocolo!" |
| [•] 2. Consultar Politica KB-001                  |                                              |
|     -> Acao: Clique em [Ver Politica KB-001]      | ACOES DE ATENDIMENTO                         |
| [ ] 3. Solicitar Token Corporativo                | [ Ver Politica KB-001 ] [ Solicitar Token ]  |
| [ ] 4. Registrar Nota Interna                     | [ Recusar Reset Fraudulento ]                |
| [ ] 5. Encerrar Recusa com Nota Publica           | [ Perigo: Resetar Senha Agora (Inseguro) ]   |
|                                                   |                                              |
| [ Pedir Ajuda do Tech Lead ]  [ Ver Glossario ]   | Registro de Nota: [ Interna ] [ Publica ]    |
+---------------------------------------------------+----------------------------------------------+
```

### 3.4. Tela 4: Revisão Replay e Credencial Curriculo Vivo (Desktop 1440px)

```
+--------------------------------------------------------------------------------------------------+
| IT FLIGHT SIMULATOR    Debriefing de Missão: Sessao #4812    Nota Final: 95/100     [Salvar e Sair] |
+--------------------------------------------------------------------------------------------------+
| RESUMO DE COMPETENCIAS OBSERVADAS                 | TIMELINE CRONOLOGICA DA CAIXA-PRETA          |
|                                                   |                                              |
| [✓] Triagem e Protocolo ITIL: 100%                | 00:00 - Turno iniciado na Aurora Logistica   |
| [✓] Defesa contra Engenharia Social: 100%         | 01:15 - Chamado CH-0001 assumido no ITSM     |
| [✓] Consulta e Cumprimento de Politica: 100%      | 02:40 - Politica de Seguranca KB-001 aberta  |
| [✓] Registro de Evidencia Interna: 100%           | 03:10 - Solicitacao de token corporativo     |
| [!] Tempo de Resolucao: 80% (Pequena hesitacao)   | 04:05 - Reset fraudulento recusado com exito |
|                                                   | 04:45 - Chamado resolvido com nota publica   |
+---------------------------------------------------+----------------------------------------------+
| CREDENCIAL CRIPTOGRAFICA DO CURRICULO VIVO (RFC 8785 JCS + ECDSA P-256)                          |
|                                                                                                  |
| Titular: Cristiano Silva                          Certificadora: IT Career Simulator Engine      |
| CBO Correspondente: 3172-10 (Tecnico de Suporte)  Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb924|
| Assinatura ECDSA: 3045022100a89f...               Status: Assinatura Valida (Auditavel Offline)  |
|                                                                                                  |
| [ Baixar Comprovante JSON ]       [ Copiar Link de Verificacao ]       [ Abrir Verificador ]     |
+--------------------------------------------------------------------------------------------------+
```

### 3.5. Wireframe Mobile (375px — Modo Responsivo em Smartphone)

```
+-----------------------------------+
| = IT FLIGHT SIMULATOR      (U) [T]|
+-----------------------------------+
| MISSAO ATIVA                      |
| Nivel 1: Engenharia Social        |
| [ Iniciar no Turno (15m) ]        |
+-----------------------------------+
| ETAPAS DO TURNO                   |
| [✓] 1. Assumir chamado            |
| [•] 2. Consultar Politica KB-001  |
| [ ] 3. Validar Token              |
| [ ] 4. Recusar Reset              |
+-----------------------------------+
| COCKPIT DE FERRAMENTAS            |
| [ ITSM ] [ Chat ] [ SimuDesk ]    |
|                                   |
| Ticket: CH-0001 (Alta)            |
| M. Oliveira - Reset Senha ERP     |
|                                   |
| [ Ver Politica KB-001 ]           |
| [ Solicitar Token Corp ]          |
| [ Recusar com Seguranca ]         |
+-----------------------------------+
| STATUS                            |
| SLA: 15m restantes | Auditoria OK |
+-----------------------------------+
```

---

## 4. Revisao de Micro-copy: Antes (Vicio de IA) vs. Depois (Produto Comercial)

| Localizacao | Texto Atual no Codigo (Vicio de IA) | Novo Texto Proposto (Comercial, Plain Writing) | Motivo da Mudanca |
| :--- | :--- | :--- | :--- |
| `TelaInicial.tsx` (Hero) | "Nunca atuou em TI? Comece aqui com o ciclo completo de 4 etapas" | "Formacao Pratica em Tecnologia: Simule turnos reais de operacoes e suporte" | Remove tom condescendente e foca no valor profissional |
| `App.tsx` (Barra topo) | "Missao Atual: 1) Clique em 'Assumir Chamado' no ITSM." | "Passo 1 de 5: Assuma o chamado CH-0001 na fila do ITSM" | Transforma texto solto em indicador de progresso estruturado |
| `ItsmApp.tsx` (Acoes) | "Acoes de Seguranca (Engenharia Social): Passo a passo: 1) Assuma..." | "Protocolo de Seguranca Operacional — Verificacao Obrigatoria" | Elimina instrucoes redundantes dentro do formulario |
| `ChatApp.tsx` (Vazio) | "Inicie o atendimento cumprimentando a usuaria ou peca orientacao ao Tech Lead." | "Conectado com Maria (Ramal 2042). Fila aguardando primeiro contato." | Simula estado autentico de mensageiro corporativo |
| `TelaInicial.tsx` (Botao) | "Iniciar no Simulador ->" | "Iniciar Turno no Simulador" | Mantem a metafora aeronautica sem parecer jogo arcade infantil |
