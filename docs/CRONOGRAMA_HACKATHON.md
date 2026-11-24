# Cronograma de Execução e Roadmap 560h — IT Career Simulator

**Meta Fase 1 (Hack Brasil 2026):** Entregar o **IT Career Simulator** funcional em produção (`https://it-career-simulator-hackbrasil.vercel.app`), com repositório público limpo (`LICENSE` proprietária, todos os direitos reservados, com permissão de avaliação para jurados e organizadores, e CI GitHub Actions), demo acessível sem login, interface educacional completa (**Tema Claro Educacional, Missão 0 em 4 passos, Glossário rápido, Matriz transparente de Escopo, Debrief Didático da Revisão e verificação ECDSA P-256**), 5 cenários-chave jogáveis ponta a ponta e vídeo de até 3 minutos antes do prazo final (**30/nov/2026 às 23h59 BRT**).  
**Meta Fase 2 (Produto Real — Pós-Hackathon):** Expandir progressivamente o catálogo dos **5 cenários-chefe do MVP** para a matriz completa de **560 horas em até 8 meses (32 semanas)** — cobrindo o **Ciclo 1 Júnior (4 meses / 280h · `UC1` a `UC4`)** e o **Ciclo 2 Pleno N2 e 3 Vertentes N3 (4 meses / 280h · `UC5` a `UC8` · 8 laboratórios dedicados e 80 cenários práticos)** — incluindo `Aulas SM-2`, `Caderno Cornell`, `HardwareWorkbenchLab`, `Mentor Feynman/STAR` e culminando na **Onda 4** com o **Simulador de Chamada em Vídeo ao Vivo com Agentes de IA**.

---

## Divisão de Frentes do Time CVE-K (3 Integrantes Ativos)

- **Liderança, Arquitetura, Segurança e Motor:** Motor determinístico (`Simulador.Dominio`), cenários e *Chaos Injector* (`Simulador.Cenarios`), `Simulador.Dialogo`, `Simulador.Avaliacao` (`JCS UTF-8 + ECDSA P-256`), segurança da API (`UseForwardedHeaders`, limites e trava `Demo:PermitirParametrosDeTeste`), arquitetura pedagógica e deploy.
- **Backend, API, Persistência e CI:** `Simulador.Itsm`, `Simulador.Infra` (`PostgreSQL 17` append-only c/ expurgo `>2 dias` + `InMemory`), `Simulador.Api`, suítes automatizadas (`xUnit` + integração PostgreSQL) e workflow GitHub Actions.
- **Frontend Educacional, Workstation, Replay e Vídeo Demo:** Design System Claro/Escuro (`WCAG AA`), `Missão 0`, `Glossário`, `ItsmApp`, `ChatApp`, `IntranetApp`, `SimuDeskApp` (Terminal 2 contextos + Painéis), tela **Revisão + Avaliação 360º + Replay + Currículo Vivo**, remoção sincronizada de E comercial, acessibilidade (`axe-core`, `Vitest`, `Playwright`) e gravação do vídeo demo.

---

## Fase 1: Cronograma Hackathon (14/nov a 30/nov/2026)

### Sprint 1 — Motor Determinístico, API Base e Cenários Core (14/nov a 18/nov) — *Concluída*
- **14–15/nov:** Bootstrap da solução `.NET 10` + `React 19/TS/Vite` + `docker-compose.yml` (PostgreSQL 17). Implementação de `Simulador.Dominio` (subsistemas + eventos imutáveis) e `Simulador.Itsm`.
- **15/nov (Concluído):** Auditoria independente de código e negócio (3 IAs), implantação do **Tema Claro Educacional** (AWS Skill Builder + alternância Escuro), **Missão 0 guiada**, **Glossário rápido**, **Matriz transparente MVP vs. Roadmap**, **Debrief da Revisão**, migração sincronizada de **zero E comercial**, **JCS RFC 8785 UTF-8 + assinatura ECDSA P-256**, hardening da API (`UseForwardedHeaders`, limites `32 KB`/`16 KB`, `Demo:PermitirParametrosDeTeste`, expurgo `> 2 dias`), headers `vercel.json`, `LICENSE` inicial sob MIT e workflow CI. Em 18/nov, a `LICENSE` passou a ser proprietária (todos os direitos reservados, com permissão para jurados e organizadores lerem, executarem e testarem); as versões publicadas antes dessa troca seguem regidas pela MIT.
- **16–17/nov:** Consolidação e revisão final dos cenários-chefe no backend (`triagem-engenharia-social`, `pasta-rede-inacessivel` C1/C2/C3, `incidente-massivo`, `sre-cloud-latencia` e `diagnostico-sql-readonly`) com cobertura de testes `xUnit` na solução (contagem atual no [README](../README.md#como-testar)) + suíte de integração PostgreSQL.
- **18–20/nov:** Publicação e validação integral no pipeline Neon + Render (`it-career-simulator-api`, com `vitru-agent-gateway` suspenso preventivamente) + Vercel (`https://it-career-simulator-hackbrasil.vercel.app`) sem barreira de login.

### Sprint 2 — Refino de Fluxos, Estabilidade Pública e Higiene Final (21/nov a 24/nov)
- **21–22/nov:** Revisão de UX com usuários teste (foco na **Missão 0**, legibilidade em mobile `375px` e clareza dos comandos no `SimuDesk`).
- **23–24/nov:** Validação integral de `Simulador.Avaliacao` (`Juiz 360º`), `ReplayView` (**Debrief Didático da Revisão**), `Currículo Vivo` (**JCS RFC 8785 UTF-8 + SHA-256 + ECDSA P-256**) e Verificador Offline `/verificar` em navegador sem rede.

### Sprint 3 — Regressão Zero, Acessibilidade, Gravação e Entregáveis (25/nov a 30/nov)
- **25/nov:** Execução completa final de `dotnet test` (contagem no README, mais integração PostgreSQL CI), `npm test -- --run` (contagem no README, com `axe-core`), `oxlint`, `check-bundle-secrets.mjs` e suíte `Playwright` (jornadas E2E nos viewports `375px`, `768px`, `1280px` e `1440px`).
- **26–27/nov:** Deploy em produção (Neon Free + Render + Vercel), testes públicos sem login e checagem de estabilidade/latência.
- **28/nov:** Congelamento de novas funcionalidades, revisão final da documentação e gravação do vídeo de até 3 minutos demonstrando do zero absoluto ao N3.
- **29/nov:** Buffer para correções críticas e regressão final.
- **30/nov (até 23h59 BRT):** Submissão oficial no Hack Brasil 2026.

### Marcos Pós-Submissão Hackathon
- **01/dez a 11/dez:** Período de congelamento do repositório para avaliação da banca.
- **02/dez:** Divulgação dos finalistas (confirmação até 04/dez 23h59).
- **12/dez:** Final presencial no Google for Startups (São Paulo).

---

## Fase 2: Roadmap Estimado do Produto Real — 560h / 80 Cenários (Ondas 1 a 4)

Após o Hackathon, a entrega completa dos **8 Laboratórios Dedicados (`UC1` a `UC8`)**, dos **80 cenários práticos (`LAB-UC1-01` a `LAB-UC8-10`)** e do **Centro de Certificações** da formação de 560 horas descrita em [PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md](PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md) segue 4 Ondas estruturadas:

| Onda e Período Estimado | Entregas Técnicas, Laboratórios Dedicados e Certificações | Cobertura Acumulada |
| :--- | :--- | :--- |
| **Onda 1 — Fundação Multi-Tenant, Aulas SM-2 e Bancadas Iniciais** *(Meses 1–2 pós-Hackathon)* | - Contas multi-tenant (elegível a *WorkOS* + *Resend* caso finalista no `hackbrasil.com`), microaulas interativas + flashcards `SM-2`, Caderno Cornell, Mentor Feynman/STAR e persistência PostgreSQL.<br>- Entrega integral do **`HardwareWorkbenchLab` (`UC1`: `LAB-UC1-01` a `LAB-UC1-10`)** e estreia da parte física do **`NetworkCablingWifiDesignLab`** (Bancada RJ-45 T568A/B e Rack `U` PoE em `LAB-UC3-01` e `LAB-UC3-02`).<br>- Implantação do 1º cenário completo N3-B (`falha-backup-restore` / `LAB-UC7-01`) e triagem SLA (`LAB-UC4-01`), com camada LLM texto 80/20 opcional. | **20 Cenários Ativos** + Aulas/Cornell + 2 Labs Físicos/Rede |
| **Onda 2 — Consolidação Integral do Ciclo 1 (Prontidão Jr 280h) e Núcleo Ciclo 2** *(Meses 3–5)* | - Conclusão dos **40 cenários do Ciclo 1 (`UC1` a `UC4`)**: lançamento completo de **`OsSystemAdminLab`**, **Estúdio Visual de Design Wi-Fi (inspirado no UniFi Design)** com *Heatmap RF* `2.4/5/6 GHz` e Controladora, **`CorporateWorkspaceLab`** (AD, M365, Scanner SMB, A1/A3, ITIL) e Capstone Jr, liberando o **Certificado Parcial de Curso Livre (Ciclo 1 · 280h)**.<br>- Entrega do núcleo de `UC5` (**`ServerSustainmentLab`**: Lockout `4740`, GPO), `UC7` (**`DataCenterStorageCloudBackupLab`**: Rack 42U, iSCSI, Snapshots, VSS, Cloud Backup WORM) e `UC8` (IAM, BEC). | **55 Cenários Ativos** + **5 Laboratórios Dedicados** *(Ciclo 1 100% completo)* |
| **Onda 3 — Formação Completa Pleno N2, 3 Vertentes N3 (560h) e Centro de Certificações** *(Meses 6–7)* | - Conclusão dos **8 Laboratórios Dedicados** e **80 cenários**: entrega completa do **`MultiVendorNetworkFirewallLab`** (**Cisco IOS XE**, **MikroTik RouterOS/WinBox**, **Ubiquiti UniFi**, **Firewall Fortinet NGFW/UTM com GeoIP, Content Filter, Gateway AV, IPS e IPsec** + Zabbix/K8s), **`CyberBlueTeamSqlLab`** com **Console Central de Antivírus/EDR Corporativo** e `DataCenterStorageCloudBackupLab` integral.<br>- Emissor oficial de **Certificado de Conclusão de Curso Livre (560h medidas pelo motor + registro CBO)**, Painel B2B e abertura do **`CertificationPracticeCenter`** (simulados inéditos CompTIA/Cisco/Fortinet/MikroTik/Microsoft) e convênios **Vendor Academies**. | **80 / 80 Cenários Ativos + 8 Laboratórios Dedicados (560h completas)** |
| **Onda 4 — Chamada em Vídeo Ao Vivo com Agentes IA e Labs Oficiais Parceiros** *(Mês 8+)* | - Implementação do **`VideoCallSimulator`** (WebRTC + Multimodal Live API com teto de minutos e fallback Voz/Chat em interface autoral sincronizada Read-Only ao `.NET 10`) nas 4 personas (Usuário Leigo, Gestor P1, *Vishing* e Entrevista Técnica STAR).<br>- Integração opcional de sistemas digitais/equipamentos licenciados com fabricantes credenciados nas **Vendor Academies**. | **80 Cenários + 8 Labs + Vídeo IA + Parcerias Oficiais** |
