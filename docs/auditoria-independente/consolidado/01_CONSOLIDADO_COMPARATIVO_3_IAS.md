# Consolidação Comparativa das 3 Auditorias Independentes (Copilot, Codex e Kiro)

> **Data da Consolidação:** 15/11/2026 (faltam 15 dias para a submissão do Hack Brasil 2026 em 30/nov/2026 às 23h59 BRT)  
> **Fontes Consolidadas:**  
> - **GitHub Copilot CLI:** [01_PARECER_GERAL_7_FRENTES.md](../copilot/01_PARECER_GERAL_7_FRENTES.md) a `06_REFERENCIAS_E_FONTES.md` (`24` itens em matriz)  
> - **Codex CLI:** [01_PARECER_GERAL_7_FRENTES.md](../codex/01_PARECER_GERAL_7_FRENTES.md) a `06_REFERENCIAS_E_FONTES.md` (`25` itens em matriz)  
> - **Kiro CLI:** [01_PARECER_GERAL_7_FRENTES.md](../kiro/01_PARECER_GERAL_7_FRENTES.md) a `06_REFERENCIAS_E_FONTES.md` + `04b_CUSTOS_E_TRIBUTOS.csv` (`62` itens em matriz)

---

## 1. Tabela Comparativa Geral entre as 3 Auditorias

| Dimensão Auditada | GitHub Copilot CLI | Codex CLI | Kiro CLI | Síntese Objetiva |
| :--- | :--- | :--- | :--- | :--- |
| **Testes e Execuções Observadas** | Rodou `dotnet test` (`66` backend), `npm test` (`24` Vitest), lint, build e secrets check | Inspeção estática e CLI sem gravação em `src/`; inspecionou capturas pré-existentes `375px` | Rodou `dotnet test` em cópia isolada (`66/66`), sonda `JcsCanonico` em `%TEMP%`, Playwright/DOM ao vivo no protótipo e no demo publicado | Núcleo `.NET 10` e `React 19` são sólidos; documentação citava `41` xUnit (atributos), quando casos reais são **`66`** |
| **Inspeção de Nuvem e DevLedger** | `gh.exe` + `vercel.cmd` confirmados; Render/Neon/Cloudflare inconclusivos; DevLedger íntegro sem entrada da raiz atual | `Vercel` Ready (`15/11`); `Render` lista API; DevLedger `4f2c756` limpo divergindo de `e6aae5c` sujo | Auditoria profunda completa: `itflight.nascia.ia.br` exige **Cloudflare Access**; `vercel.app` é público `200`; Render Oregon vs Neon Ohio (`us-east-2`); 2 apps grátis na Render; commit remoto órfão `3ff0faa` | Bloqueador **P0**: usar `vercel.app` ou liberar Cloudflare Access; nunca reescrever histórico Git; reconciliar DevLedger e região API/DB |
| **Frente 1 — Produto e Hackathon** | Núcleo forte; cortar excesso de promessas do pitch; jornada única mensurável de 8–10 min | Demo tem substância, mas falta pesquisa com iniciantes; matriz "disponível / demonstrado / roadmap" | Trilha "Acesso à educação" aprova prática segura; criar **Missão 0**, chamar Replay de **Revisão** e rodar analista com 5–10 leigos | **Consenso 3/3:** risco alto de parecer *vaporware* se prometer 560h/80 labs no estado atual; focar MVP real no vídeo de 3 min |
| **Frente 2 — UX, UI e Acessibilidade** | Tema escuro denso para leigos; faixa guiada + ocultar termos avançados | Protótipo claro separado do React; overflow horizontal em `375px` na barra de abas | Falta **acentuação** na UI publicada (`Nivel`, `Servico`); protótipo estático com `23/33` alvos menores que `44px`; cabeçalho `170px` no mobile | **Consenso 3/3:** unificar decisão Claro vs Escuro, corrigir acentos, adicionar **Missão 0** e glossário contextual |
| **Frente 3 — Educação e Pedagogia** | Falta microciclo prático em código; faltam Linux desktop, mobile MDM, VoIP e cliente difícil | Carga `17,5h/sem` plausível mas sem prova de transferência; separar N1 de N2/N3 | Conta de `300h` / `80` labs (`3,75h/lab`) não fecha sem medir tempo ativo; `SM-2` pode ser trocado por `Leitner`/`FSRS`; PBQs como mini-cenários | **Consenso 3/3:** separar núcleo Júnior de N2/N3, medir tempo ativo, cobrir lacunas de Service Desk BR e estruturar PBQs binários |
| **Frente 4 — Financeiro** | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) |
| **Frente 5 — Contabilidade e Tributos** | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) | Retirado do repositório público (modelo de negócio tratado fora dele) |
| **Frente 6 — Jurídico, Marcas e LGPD** | Evitar equivalência MEC/terceiros; autenticar Currículo com Ed25519/HMAC | Alerta **ECA Digital (`Lei nº 15.211/2025`)** + `LGPD Art. 14` (criança vs adolescente); hash forjável | Corrige base legal para **LPI Art. 132 IV + Art. 195 (*trade dress*)**, `Decreto 11.034/2022`, **retirada de dados pessoais da equipe no repo**, falta de `LICENSE` | **Consenso 3/3:** trocar "FIC/Empregabilidade" por **Curso Livre**, usar skins genéricas sem logos, assinar Currículo com Ed25519 e adicionar `LICENSE` |
| **Frente 7 — Engenharia e Infraestrutura** | Proteger `AnexarAsync` lista vazia, remover schema startup multi-réplica, limpar TTL e proxy rate limit | Bloqueio `append-only` não imposto no Postgres (sem hash chain), localStorage bearer capability, falta política `CSP` | Prova **bug de divergência JCS (`\u0026`/`\u00E3`)** entre C# e TS; **sem Ed25519**, **sem `UseForwardedHeaders`**, `CausaForcada` aberta em produção, sem CI | **Consenso 3/3:** corrigir **JCS + Ed25519 + E comercial + Proxy Rate Limit + Params Teste** em Bloco A antes de novas telas |

---

## 2. Consensos Unânimes das 3 IAs (3/3)

### 2.1. O Que Deve Mudar ou Entrar Imediatamente para o Hackathon (até 30/nov/2026)
1. **Exposição Pública Sem Login (`P0`):** O domínio `itflight.nascia.ia.br` exibe barreira de login do Cloudflare Access (violando o item 7.2 do regulamento), enquanto `https://it-flight-simulator-hackbrasil.vercel.app` responde `HTTP 200` público. Liberar o domínio ou submeter oficialmente o link `.vercel.app` testado em aba anônima e rede móvel.
2. **Bug Crítico de Canonicalização JCS (`P0`):** Em `src/backend/src/Simulador.Avaliacao/Juiz360.cs`, o `Utf8JsonWriter` padrão escapa o caractere E comercial (`\u0026`) e acentos (`\u00E3`), enquanto `src/frontend/src/utils/jcs.ts` preserva UTF-8 literal. Qualquer acento ou símbolo faz `/verificar` acusar **DIVERGENTE** no próprio documento legítimo. Corrigir o encoder JCS no backend e ampliar `docs/vetores-jcs-sha256.json` com acentos, símbolos e números decimais.
3. **Assinatura Criptográfica do Currículo Vivo (`P0`):** SHA-256 sozinho prova consistência do JSON, mas permite falsificação livre por terceiros. Assinar o núcleo canonicalizado com **Ed25519** (chave privada apenas no backend; chave pública, `kid`, `emitidoEm` e algoritmo validados offline em `/verificar`).
4. **Remoção Atômica de E Comercial e Correção de Acentuação (`P0`):** Remover o caractere E comercial das 3 competências no `Juiz360.cs` (linhas 93, 298, 299), dos 3 títulos em `TelaInicial.tsx`, abas/rótulos e testes Playwright/Vitest em sincronia, restaurando também a acentuação em português na interface publicada (`Nível`, `Estagiário`, `Serviço`, `Segurança`).
5. **Rate Limit atrás de Proxy e Proteção de Parâmetros (`P0`):** Configurar `UseForwardedHeaders` com proxy confiável em `Program.cs` (evitando que todos os jurados na Render dividam o mesmo limite de 120 req/min), restringir `CausaForcada` e `Semente` à flag de demonstração/teste e limitar o tamanho máximo do payload de ações JSONB.
6. **Honestidade Anti-Vaporware e Matriz de Status (`P0`):** Adicionar no `README.md`, no `PRD_HACKATHON.md` e na própria UI uma tabela explícita separando **Implementado Hoje (MVP Hackathon)**, **Em Construção** e **Roadmap Pós-Hackathon**, evitando prometer no presente 560h, 80 laboratórios, vídeo IA ou empregabilidade garantida.
7. **Higiene Legal, Governança Git e Privacidade do Time (`P0`):**
   - Adicionar arquivo `LICENSE` deliberado (item 6.6 do regulamento);
   - Criar workflow básico de CI no GitHub Actions (`dotnet test` com Postgres + `npm test` + `lint` + `build` + secrets check);
   - Nunca mais reescrever histórico Git publicado (registrar no README a publicação do histórico de 14/nov e manter integridade para o congelamento de 01 a 11/dez);
   - Remover nomes completos e justificativa pessoal/localidade de ex-integrante da documentação pública e confirmar composição do time no painel `hackbrasil.com`;
   - Inserir aviso curto no demo declarando uso de **dados 100% sintéticos e sessão anônima sem login**.
8. **Experiência Guiada para Iniciantes e Roteiro de Vídeo (`P1`):**
   - Criar **Missão 0** (4 passos: o que é chamado, SLA/prioridade, nota interna, verificação segura), **glossário contextual** e **opções avançadas recolhidas** (`Chaos Injector` / `semente`);
   - Valorizar o Replay como **"Revisão do Atendimento"** com *debrief* didático por critério e link para a KB;
   - Decidir visual único para o vídeo (integrar tema claro educacional do protótipo ou explicar a relação de protótipo sem fingir integração pronta);
   - Executar analista real com **5 a 10 iniciantes** para provar impacto real com números no vídeo de 3 minutos;
   - Avaliar Render Starter (`~US\$ 7`) apenas na janela de avaliação (`28/nov` a `16/dez`) ou confirmar cota de horas gratuitas antes de monitor externo (`cold start` medido por Kiro em `13,8s`).

### 2.2. Pontos Críticos para o Produto Pós-Hackathon (Ondas 1 a 4)
1. **Ordem de Implementação Segura (Sem Regressão):**
   - Primeiro fechar o Bloco A (`JCS`, `Ed25519`, remoção de E comercial e restauração de acentos, `UseForwardedHeaders`, parâmetros de teste, limite de payload e posse de sessão) + Bloco B (migrations versionadas fora do startup multi-réplica, rotina de expurgo de sessões expiradas, `InMemoryEventStore` com TTL, CI com Postgres, região única API/Banco, cabeçalhos CSP/`X-Content-Type-Options` em `vercel.json`).
   - Somente sobre essa base endurecida construir a camada educacional persistente.
2. **Revisão da Matriz Pedagógica e dos 8 Laboratórios:**
   - Separar explicitamente **Trilha Base Júnior (N1)** dos **Módulos Opcionais N2 e N3** com *gates* de domínio e pré-requisitos;
   - Medir **tempo ativo por evento** antes de estampar carga horária fechada no certificado (tratando 560h como **estimativa de carga horária** até medição real);
   - Cobrir lacunas de entrada reais do Service Desk brasileiro identificadas nas KBs: **Redação de Chamados, Atendimento a Cliente Difícil, Suporte Remoto e Ética de Acesso, Impressão/Digitalização em Rede, M365 Operacional (Caixa Compartilhada/Regras), Dispositivos Móveis Corporativos (Android/iOS/MDM), Telefonia IP/VoIP, Linux Desktop Básico, Inglês Técnico de Leitura e LGPD no Balcão**;
   - Usar interfaces/topologias **genéricas** sem logotipos ou *trade dress* de fabricantes até assinatura formal de *Vendor Academy*, utilizando o próprio motor para **PBQs autorais** com critérios binários e política escrita anti-*brain dump* (remoção em 48h).
3. **Ajuste Financeiro, Tributário e Jurídico Antes de Cobrança:**
   - **Tributos:** Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.
   - **Unit Economics:** Conteúdo comercial retirado do repositório público: o hackathon roda a custo zero e o modelo de negócio é tratado fora dele.
   - **Voz/Vídeo IA (Onda 4):** Começar por **chamada textual + STT local/voz antes de avatar 3D**, com teto rígido de sessões (máximo 2 chamadas/mês no Pro sem prejuízo), *kill switch* financeiro e consentimentos explícitos;
   - **Jurídico:** Adotar **"Certificado de Conclusão de Curso Livre"** (nunca "diploma técnico" nem "FIC Decreto 5.154" como escola regulada), adequar à **Lei nº 15.211/2025 (ECA Digital)** e `LGPD Art. 14` (público 18+ com aferição ou fluxo parental), pseudônimo + revogação no Currículo Vivo, e avisos completos do `CDC Art. 49` + `Decreto 7.962/2013` + `Decreto 11.034/2022`.

---

## 3. Divergências Construtivas Entre as 3 IAs (Para Decisão do Autor)

| Ponto | Visão A | Visão B | Decisão Sugerida para Registro |
| :--- | :--- | :--- | :--- |
| **Tema Visual até 30/nov (Claro vs. Escuro)** | **Codex e Kiro:** alerta sobre descompasso entre demo React escuro e protótipo claro; pedem decisão clara antes do vídeo | **Copilot:** recomenda já incorporar faixa guiada clara ou modo guiado no MVP | **Decisão para o autor:** migrar tokens claros no React apenas após Bloco A de segurança/JCS, ou manter workstation escura com **Missão 0 guiada** e exibir o protótipo claro rotulado explicitamente como *"Conceito da Trilha Educacional Pós-Hackathon"* |
| **Algoritmo de Revisão Espaçada** | **Copilot:** manter SM-2 em módulo mínimo | **Kiro e Codex:** `SM-2` (1987) pode esperar; no MVP usar **Leitner (3 caixas)** ou migrar direto para **FSRS** no pós-Hackathon | **Recomendação:** adotar **Leitner (3 caixas por erro no laboratório)** se couber em P2 no Hackathon e **FSRS** na Onda 2 |
| **Onda 4 (Voz primeiro vs. Vídeo direto)** | **Planejamento atual:** lançamento direto com Avatar 2.5D/3D em WebRTC | **Codex e Kiro:** lançar **Fase 0 (texto/voz local) → Fase 1 (voz com teto) → Fase 2 (avatar)** após validar ganho pedagógico e custo real | **Recomendação:** adotar fases progressivas (`Texto → Voz com teto → Avatar`), protegendo margem do Plano Pro |

---

## 4. Artefatos da Consolidação
- **Plano de Ação Unificado (CSV):** [02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv](02_PLANO_ACAO_PRIORIZADO_UNIFICADO.csv)
- **Incorporação no RFC:** [PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md](../../rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md) (Seção 10 — Rodada 21, decisões `D21` a `D27`).
