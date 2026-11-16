# AGENTS.md — IT Flight Simulator (Hack Brasil 2026)

Diretrizes técnicas e de arquitetura para contribuições neste repositório.

## Princípios de Arquitetura e Domínio

- **Motor determinístico como autoridade única:** Toda mudança de estado, verificação de acesso remoto, execução de comandos simulados, cálculo de SLA e avaliação pelo Juiz 360º é decidida pelo motor determinístico em `src/backend/src/Simulador.Dominio` e `src/backend/src/Simulador.Avaliacao`. O diálogo (`Simulador.Dialogo`, incluindo futuros agentes multimodais em vídeo) não altera estado nem avalia tecnicamente o usuário.
- **Event Sourcing auditável:** Cada ação do participante produz eventos imutáveis (*append-only*), permitindo reconstrução de estado, Replay cronológico e auditoria determinística de critérios binários observáveis.
- **Proibição de E Comercial na Interface e Documentação:** Nenhuma página, aba, título visível, nome de componente, nome de competência exibida ao aluno ou arquivo de documentação pode utilizar o símbolo E comercial — deve-se utilizar sempre **"e"** (ou vírgula quando aplicável).
- **Fidelidade declarada por cenário:** A interface não imita identidade visual de sistemas operacionais proprietários; os comandos suportados são declarados explicitamente por cenário, e comandos fora do escopo recebem resposta honesta sem saídas inventadas.
- **Dados 100% sintéticos:** A empresa simulada (*Aurora Logística*, domínio `aurora.local`), pessoas, servidores, logs e datasets são inteiramente fictícios. Não incluir dados reais de chamados, clientes, credenciais, tokens ou informações pessoais reais.
- **Segurança de build e configuração:** Chaves de API, caso utilizadas em deploy, devem permanecer exclusivamente no servidor via variáveis de ambiente (nunca com prefixo `VITE_` nem no bundle frontend). A verificação de segredos integra o processo de build do frontend (`scripts/check-bundle-secrets.mjs`).

## Comandos de Build, Lint e Testes

### Backend (.NET 10)
```bash
dotnet test src/backend/Simulador.slnx
dotnet run --project src/backend/src/Simulador.Api --urls http://localhost:8080
```

### Frontend (React 19 + TypeScript + Vite)
```bash
cd src/frontend
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
```

## Boas Práticas de Contribuição

- Commits pequenos, coesos e descritivos.
- Não utilizar comandos destrutivos no Git (`git reset --hard`, `git clean`, `git push --force`).
- Manter os vetores de teste de integridade `docs/vetores-jcs-sha256.json` sincronizados entre backend e frontend.
