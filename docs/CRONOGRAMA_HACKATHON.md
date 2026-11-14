# Cronograma de Execução — Hack Brasil 2026 (14/nov a 30/nov/2026)

**Meta:** Entregar o **IT Flight Simulator (Edição Hackathon)** funcional, com repositório público limpo, demo acessível sem login e vídeo de até 3 minutos antes do prazo final (**30/nov/2026 às 23h59 BRT**).

---

## Divisão de Frentes do Time CVE-K

- **Liderança / Arquitetura & Motor:** Motor determinístico (`Simulador.Dominio`), cenários/Chaos Injector (`Simulador.Cenarios`), `Simulador.Dialogo`, `Simulador.Avaliacao`, segurança e deploy.
- **Backend / API & Persistência:** `Simulador.Itsm`, `Simulador.Infra` (PostgreSQL append-only + InMemory), `Simulador.Api` e testes automatizados (`xUnit`).
- **Frontend Core / Workstation:** Shell da Workstation Corporativa, `ItsmApp`, `ChatApp` e `IntranetApp` (Base de Conhecimento).
- **Frontend SimuDesk / Replay & Vídeo:** `SimuDeskApp` (Terminal 2 contextos + Painéis), tela de **Avaliação 360º + Replay + Currículo Vivo**, acessibilidade e gravação/edição do vídeo demo.

---

## Plano de Execução por Sprints

### Sprint 1 — Motor Determinístico, API Base e Cenários Core (14/nov a 18/nov)
- **14–15/nov:** Bootstrap da solução `.NET 10` + `React 19/TS/Vite` + `docker-compose.yml` (PostgreSQL 17). Implementação de `Simulador.Dominio` (subsistemas + eventos imutáveis) e `Simulador.Itsm` do zero.
- **16–17/nov:** Implementação dos cenários N1 (`triagem-engenharia-social`), N2 (`pasta-rede-inacessivel` com C1/C2/C3 por semente) e N3 (`incidente-massivo`), além dos cenários avançados N4 SRE (`sre-cloud-latencia`) e N4b SQL Read-Only (`diagnostico-sql-readonly`), com cobertura `xUnit`.
- **18/nov:** `Simulador.Api` + `Simulador.Infra` funcionando localmente ponta a ponta com health checks e rate limiting.

### Sprint 2 — Workstation Completa, Juiz 360º e Verificador Offline (19/nov a 24/nov)
- **19–20/nov:** Shell da Workstation no React + `ItsmApp` + `IntranetApp` (KB pesquisável e topologia da *Aurora Logística*).
- **21–22/nov:** `SimuDeskApp` (Terminal com 2 contextos + Painéis de Diretório, Serviços, DNS, Logs, Cluster Kubernetes e Console SQL) conectado à API.
- **23/nov:** `Simulador.Dialogo` (modo determinístico roteirizado) + `ChatApp` (Cliente + Tech Lead + botão Pedir Pista).
- **24/nov:** `Simulador.Avaliacao` (Juiz 360º), **Replay em linha do tempo**, **Currículo Vivo** com integridade **JCS (RFC 8785) + SHA-256** e Verificador Offline em `/verificar`.

### Sprint 3 — Polimento, Acessibilidade, Deploy e Entregáveis (25/nov a 30/nov)
- **25/nov:** Revisão completa de acessibilidade (navegação por teclado, WCAG contraste, testes automatizados com `axe-core`) e responsividade em múltiplos viewports.
- **26–27/nov:** Deploy em produção (Frontend + Backend + PostgreSQL gerenciado), testes de ponta a ponta no ambiente público e validação de estabilidade sem login.
- **28/nov:** Congelamento de novas funcionalidades, revisão final da documentação e gravação do vídeo de até 3 minutos demonstrando todos os fluxos.
- **29/nov:** Buffer para correção de eventuais bugs críticos e testes finais de regressão.
- **30/nov (até 23h59 BRT):** Submissão oficial no Hack Brasil 2026.

---

## Pós-Submissão
- **01/dez a 11/dez:** Período de congelamento do repositório para avaliação da banca.
- **02/dez:** Divulgação dos finalistas (confirmação até 04/dez 23h59).
- **12/dez:** Final presencial no Google for Startups (São Paulo).
