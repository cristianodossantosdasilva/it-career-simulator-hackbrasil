# PRD — IT Career Simulator (Edição Hack Brasil 2026)

**Produto:** IT Career Simulator — Simulador Prático de Carreira em TI  
**Time:** CVE-K (Cristiano Silva, Enzo Santos e Kauan Dantas — 3 integrantes ativos)  
**Trilha:** Acesso à educação (Hack Brasil 2026)  
**Demo Pública Oficial:** `https://it-flight-simulator-hackbrasil.vercel.app`  
**Prazo de entrega:** 30/nov/2026 às 23h59 (BRT)  

---

## 1. Visão do Produto, Problema e Posicionamento Educacional

Milhares de pessoas fora da área de TI desejam ingressar no mercado de tecnologia, e milhares de estudantes já consomem teoria passiva, mas todos esbarram no **"paradoxo do júnior"**: não conseguem a primeira oportunidade porque não possuem vivência prática em operação corporativa real (ITSM, SLA, atendimento sob pressão, manutenção física preventiva, cabeamento de rede, diagnóstico de causa raiz e postura de segurança).

O **IT Career Simulator** resolve essa lacuna combinando uma **Plataforma de Aprendizagem Ativa** (aulas curtas com analogias, recordação ativa, repetição espaçada, caderno estilo Notion no Método Cornell, Técnica de Feynman e Pitch STAR) com uma **Workstation Corporativa Simulada** e **8 Laboratórios Interativos Dedicados** (1 por Unidade Curricular — começando no Hackathon por Hardware/UPS e evoluindo para Cabeamento/Rack `U`, Estúdio Wi-Fi Design, Redes Multi-Vendor, Firewall NGFW, Data Center 42U com Cloud Backup WORM e Blue Team/EDR) na empresa fictícia **Aurora Logística** (`aurora.local`).

Em vez de promessas irreais ou cargas horárias superficiais, o estudo de caso inaugural entrega profundidade equivalente à grade de um curso técnico profissionalizante em **560 horas distribuídas em até 8 meses (32 semanas)** em **2 Ciclos Estratégicos**:
- **Ciclo 1 (Meses 1 a 4 · Semanas 1 a 16 · 280h):** *Prontidão Rápida para o Mercado* — do zero ao **Técnico de Suporte Júnior (N1) e Field Service**, apto a trabalhar já ao final do 4º mês;
- **Ciclo 2 (Meses 5 a 8 · Semanas 17 a 32 · +280h = 560h):** *Evolução Corporativa* — **Técnico de Suporte Pleno (N2)** e **3 Vertentes Técnicas N3** (*Infraestrutura, Redes, Zabbix e Cloud*; *Data Center, Virtualização, Storage RAID/SAN/NAS, Backup 3-2-1-1-0 e DRP*; e *Cibersegurança Blue Team, IAM, Proteção de E-mail e Auditoria SQL Read-Only*), culminando em um **Juiz 360º com Replay** e **Currículo Vivo** verificável offline via **JCS (RFC 8785) + SHA-256 + ECDSA P-256**. Na evolução de produto (Onda 4), o aluno também treinará atendimentos reais em **Chamada em Vídeo e Voz ao Vivo com Agentes de IA** (com teto de minutos e fallback texto/voz).

### 1.1. Enquadramento Legal e Regulação Brasileira (Aplicação Real)
- **Natureza:** **Curso Livre de Qualificação Profissional e Capacitação Prática** amparado pela **LDB (Lei nº 9.394/1996, Art. 39, parágrafo 2º, inciso I e Art. 42)** e **Resolução CNE/CP nº 1/2021** (educação por competências), com emissão de **Certificado de Conclusão de Curso Livre** (horas medidas pelo motor determinístico e trilha declarada de competências), respeitando **LGPD**, **ECA Digital (Lei nº 15.211/2025)** e **CDC** (sem equivalência automática a diploma técnico MEC ou certificação FIC institucional sem credenciamento formal).
- **Alinhamento CBO (MTE), LPI/LDA/CDC e Matriz Completa de 560h:** Estruturado em **8 Unidades Curriculares (`UC1` a `UC8`)**, somando **260h de Teoria e Fixação** e **300h de Laboratórios Práticos** (**8 Laboratórios Especializados** e **80 Cenários** `LAB-UC1-01` a `LAB-UC8-10`), além de trilha preparatória para certificações oficiais com uso nominativo lícito de marcas (`Lei nº 9.279/1996 Art. 132`), interfaces autorais sem imitação de trade dress de terceiros (`LPI Art. 195`), simulação própria sem pirataria de firmware (`Lei nº 9.609/1998`), proibição de *brain dumps* (`Lei nº 9.610/1998`), e `CDC Art. 49` / `Decreto nº 7.962/2013`. Detalhes completos em [PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md](PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md).

---

## 2. Objetivos da Versão Hackathon e Diretriz de Interface

1. **Experiência completa ponta a ponta sem login obrigatório:** qualquer avaliador acessa a demonstração com 1 clique (sessão anônima com semente configurável), podendo iniciar desde o nível zero ou testar diretamente qualquer cenário.
2. **Proibição Absoluta de E Comercial na Interface:** Nenhum título, aba, página, botão ou rótulo de tela utiliza o símbolo E comercial — adota-se exclusivamente **"e"**.
3. **Experiência Educacional no MVP vs. Ciclo Cognitivo Completo (Roadmap):**
   - **Implementado no MVP Hackathon:** **Tema Claro Educacional** (leitura confortável com modo escuro opcional), **Missão 0 guiada em 4 passos**, **Glossário rápido**, **Matriz transparente de Escopo (MVP vs. Roadmap)**, **Debrief Didático da Caixa-Preta** e aviso explícito de operação 100% sintética.
   - **Roadmap Ondas 1–3 (Pós-Hackathon):** Microaulas com analogias e recordação ativa + **Repetição Espaçada (SM-2)**, **Caderno estilo Notion (Método Cornell)**, **Mentor IA (Feynman e Pitch STAR)** e **Bancadas Físicas dedicadas (`UC1` a `UC8`)** com `HardwareWorkbenchLab` (peças/ESD/pasta térmica/upgrade) e Cabeamento T568A/B + Rack PoE.
4. **Os 4 Motores Determinísticos funcionando de ponta a ponta:**
   - **Workstation Unificada:** Desktop corporativo no navegador com 4 apps integrados (**ITSM**, **Comunicador/Chat**, **SimuDesk Acesso Remoto**, **Intranet/KB**).
   - **Clientes Sintéticos e Tech Lead (Máquina de Estados e Sistema em 3 Atos):** Personas distintas com gatilho determinístico de liberação de acesso remoto e diálogo roteirizado sem dependência de chave externa.
   - **Chaos Injector (Injeção de Falhas):** Cenários parametrizados por semente (`SplitMix64`) para impedir "receita decorada" (e flag `Demo:PermitirParametrosDeTeste` configurada como `true` por padrão no modo demonstração do Hackathon e reversível para `false` em ambientes de prova fechada).
   - **Juiz 360º, Replay e Currículo Vivo:** Avaliação determinística por critérios binários observáveis na trilha de eventos (*Event Sourcing*) + linha do tempo navegável (**Caixa-Preta do Atendimento**) + **Currículo Vivo** verificável offline em `/verificar` por **JCS (RFC 8785 UTF-8) + SHA-256 + assinatura ECDSA P-256**.
5. **Visão Futura Onda 4 (Simulador de Chamada em Vídeo com Agentes de IA):** Evolução pós-Hackathon onde o estudante atende clientes leigos, gestores sob pressão de SLA P1, ataques de engenharia social (*Vishing*) e entrevistas técnicas em chamada de vídeo e voz ao vivo dentro do mesa de trabalho, com o motor `.NET 10` mantendo autoridade exclusiva sobre o estado técnico.

---

## 3. Escopo Funcional — Trilha de Técnico de Suporte (MVP Hackathon e Matriz 560h)

### Ciclo 1 — Prontidão Rápida Júnior e Field Service (Meses 1 a 4 · 280h · `UC1` a `UC4`)
- **UC1 (Mês 1 · 70h) — Eletricidade Aplicada, ESD e Bancada Física (`CBO 3132-20` · `HardwareWorkbenchLab`):** Fontes ATX, Nobreaks/UPS, ESD, placa-mãe, POST/UEFI, RAM DDR4/DDR5, SSD NVMe/SMART, termodinâmica e manutenção preventiva em desktop e notebook (`LAB-UC1-01` a `LAB-UC1-10`).
- **UC2 (Mês 2 · 70h) — Sistemas Operacionais Profundos (`CBO 3172-10` · `OsSystemAdminLab`):** Windows 10/11 (UEFI/BCD, BitLocker, Registro, Perfil Temporário, Serviços, Sysinternals, `DISM`/`SFC`, BSOD, PowerShell) e Linux Corporativo (FHS, permissões POSIX, `systemd`, `journalctl`, SSH) (`LAB-UC2-01` a `LAB-UC2-10`).
- **UC3 (Mês 3 · 70h) — Redes TCP/IP, Cabeamento, Rack `U`, Wi-Fi Design e VPN (`NetworkCablingWifiDesignLab`):** Bancada Física de Cabeamento T568A/B, Keystone/Patch Panel, Testador de Cabos, Rack `U` PoE + **Estúdio Visual de Design Wi-Fi inspirado no *Ubiquiti UniFi Design Center*** (planta baixa, atenuação dB, *Heatmap RF* `2.4/5/6 GHz` e Controladora), IPv4/CIDR, DHCP, DNS, SMB, `802.1X` e VPN (`LAB-UC3-01` a `LAB-UC3-10`; base **implementada no MVP** em `pasta-rede-inacessivel` C1/C2/C3).
- **UC4 (Mês 4 · 70h) — Ambientes Corporativos, M365, Impressão, Certificados A1/A3 e ITIL/LGPD (`CorporateWorkspaceLab`):** Active Directory N1, Microsoft 365/Exchange (`.ost`/OneDrive), Spooler/Scanner SMB, ICP-Brasil A1/A3, matriz Impacto x Urgência, LGPD e defesa contra engenharia social (`LAB-UC4-01` a `LAB-UC4-10`; cenário **implementado no MVP** `triagem-engenharia-social` + Capstone Jr 280h).

### Ciclo 2 — Técnico Pleno (N2) e 3 Vertentes Técnicas N3 (Meses 5 a 8 · +280h = 560h · `UC5` a `UC8`)
- **UC5 (Mês 5 · 80h) — Sustentação N2 (`CBO 2124-20` · `ServerSustainmentLab`):** Windows/Linux Server, File Server Share vs. NTFS, GPO (`LSDOU`), *Account Lockout* (`Event ID 4740`), Trust AD, Event Viewer, scripts PowerShell/Bash, Gestão de Problemas ITIL e RCA (`LAB-UC5-01` a `LAB-UC5-10`; cenário **implementado no MVP** `incidente-massivo`).
- **UC6 (Mês 6 · 65h) — Vertente N3-A: Redes Multi-Vendor, Firewall NGFW, Zabbix e Cloud (`CBO 2124-10 / 3171-05` · `MultiVendorNetworkFirewallLab`):** Switches/roteadores em **Cisco IOS XE**, **MikroTik RouterOS/WinBox** e **Ubiquiti UniFi** (VLAN `802.1Q`/STP/LACP/Dual WAN Failover) + **Simulador de Firewall NGFW/UTM (inspirado em Fortinet FortiGate)** com NAT, **Bloqueio Geográfico (`GeoIP Filtering`)**, **Filtro de Conteúdo (`Content Filter`)**, **Antivírus de Borda (`Gateway Antivirus`)**, IPS e VPN IPsec Site-to-Site + Zabbix e Kubernetes (`LAB-UC6-01` a `LAB-UC6-10`; cenário **implementado no MVP** `sre-cloud-latencia`).
- **UC7 (Mês 7 · 70h) — Vertente N3-B: Data Center, Virtualização, Storage, Backup Cloud e DRP (`CBO 3172-05 / 2124-20` · `DataCenterStorageCloudBackupLab`):** **Rack `42U`** com PDUs A+B e fluxo frio/quente, S.M.A.R.T., RAID `0/1/5/6/10` + *Hot Spare*, SAN iSCSI (`SAN Policy`/MPIO), Datastores e Snapshots Hyper-V/VMware, **Backup Corporativo Local e Backup em Nuvem com Imutabilidade WORM (`S3 Object Lock` / AES-256)** na regra **3-2-1-1-0**, VSS, `RPO`/`RTO`, Teste de Restore em Sandbox e DRP (`LAB-UC7-01` a `LAB-UC7-10`; prioridade Onda 1 com `falha-backup-restore`).
- **UC8 (Mês 8 · 65h) — Vertente N3-C: Cibersegurança Blue Team, IAM, Antivírus/EDR e Auditoria SQL (`CBO 2123-05 / 3172-10` · `CyberBlueTeamSqlLab`):** MFA/FIDO2, Acesso Condicional/*Impossible Travel*, Break-Glass, apps OAuth, SPF/DKIM/DMARC, forense Phishing/BEC, **Console Central de Antivírus Corporativo e EDR**, Auditoria SQL *Fail-Closed* (`SELECT` / `EXPLAIN`) e proteção contra SQL Injection (`LAB-UC8-01` a `LAB-UC8-10`; cenário **implementado no MVP** `diagnostico-sql-readonly` + Capstone Final 560h).

### Fomento a Certificações, e Parcerias (*Vendor Academies*)
- **Centro de Simulados de Certificações (Pós-Hackathon):** Mapeia as `UC1–UC8` para **CompTIA (Tech+/A+/Network+/Security+/Server+)**, **Cisco (CCST/CCNA)**, **MikroTik (MTCNA/MTCRE)**, **Fortinet (FCF/FCA/FCP)**, **Ubiquiti (UWA/UBRSS)**, **Microsoft (MS-900/MD-102/AZ-800/SC-900/SC-200)**, **LPI**, **Zabbix**, **Veeam (VMCE)** e **ITIL 4**, com banco autoral inédito (zero *dumps*) e futuro credenciamento em **Vendor Academies** para vouchers e laboratórios com sistemas oficiais licenciados.

---

## 4. Requisitos dos Ambientes Integrados

### 4.1. Camada Pedagógica e de Fixação
1. **`Painel do Aluno`:** Banner "Continue de onde parou", trilha nos Ciclos 1 e 2 com 3 barras por nível (*Teoria*, *Fixação*, *Prática*), meta semanal, timer Pomodoro 25/5, revisões devidas hoje e Plano de Estudos.
2. **`Aulas e Flashcards`:** Microaulas estruturadas com analogias e diagramas, checkpoint de recordação ativa antes de exibir alternativas, repetição espaçada (`SM-2`) e anotações Cornell ao lado da aula.
3. **`Laboratórios e Bancadas:`** 1 Laboratório Interativo Dedicado por Unidade Curricular (`UC1` a `UC8`) — iniciando no Hackathon com `HardwareWorkbenchLab` (Hardware/Preventiva/UPS 2D) e Workstation, evoluindo nas Ondas 1–3 para Cabeamento T568A/B + Estúdio Wi-Fi Design, Multi-Vendor Cisco/MikroTik/UniFi + Firewall Fortinet NGFW (GeoIP, Content Filter, Gateway AV), Rack 42U/RAID/iSCSI + Cloud Backup WORM e Console EDR/Antivírus.
4. **`Caderno (estilo Notion)`:** Páginas pesquisáveis com modelos (*Método Cornell*, *Plano de Estudos*, *Página Livre*) e salvamento automático acessível também em gaveta retrátil dentro do Laboratório.
5. **`Mentor IA e Carreira`:** Chat de dúvidas pedagógicas, avaliador da **Técnica de Feynman** (nota `0–100` e detector de jargão), **Construtor de Pitch STAR** integrado ao Currículo Vivo e futuro **Simulador de Chamada em Vídeo ao Vivo (Onda 4)**.

### 4.2. Os 4 Apps da Workstation Unificada (`Laboratório`)
1. **ITSM (Ticket Manager):** Fila com status, SLA em tempo real, categoria, prioridade (Urgência x Impacto), notas públicas/internas, criação/vinculação de Problema ITIL, escalonamento e resolução.
2. **Comunicador Corporativo (Chat):** Cliente Simulado (só libera ID/PIN após triagem e verificação de identidade) e Tech Lead (botão explícito de "Pedir Pista" em 3 atos sem penalidade automática).
3. **SimuDesk (Acesso Remoto e Consoles):** Conexão via ID/PIN, terminal interativo com dois contextos (`UsuarioPadrao` vs. `Elevado`), catálogo declarado de comandos e painéis operacionais (Diretório, Serviços, DNS, Logs, Cluster Kubernetes/PgBouncer/Ingress e Console SQL Read-Only).
4. **Intranet / KB, Replay e Currículo Vivo:** Base de Conhecimento pesquisável (26+ artigos sintéticos), **Avaliação 360º com Debrief Didático e Replay da Caixa-Preta em linha do tempo** e exportação do **Currículo Vivo** verificável offline em `/verificar` via **JCS (RFC 8785 UTF-8) + SHA-256 + assinatura ECDSA P-256**.

---

## 5. Requisitos Não-Funcionais, Conformidade e Custo

- **Código autoral para o Hackathon:** Todo o código (backend, motor, ITSM, cenários, frontend) foi escrito especificamente neste repositório público para o Hack Brasil 2026.
- **100% Dados Sintéticos:** Nenhuma coleta de dados pessoais reais; empresa fictícia (*Aurora Logística*), usuários sintéticos e sessões anônimas com TTL automático (expurgo de sessões expiradas `> 2 dias`).
- **Acessibilidade (WCAG AA):** Navegação por teclado, foco visível, semântica ARIA e contraste maior ou igual a `4.5:1` (em Tema Claro e Tema Escuro) validados automaticamente (`axe-core`, testes Vitest, xUnit e integração PostgreSQL no CI, e jornadas E2E Playwright; contagens medidas no [README](../README.md#como-testar) e no CI).
- **Disponibilidade e custo zero no hackathon:** execução determinística habilitada por padrão (`Dialogo:HabilitarLlm=false`), sem custo de IA externa e com disponibilidade integral para a banca. O modelo de negócio é tratado fora do repositório público.
