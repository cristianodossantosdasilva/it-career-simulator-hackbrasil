# RETORNO kiro: nível Teórico (backend e tela)

## Backend (commit 2669bcb)
- Projeto novo `src/backend/src/Simulador.Teorico` (adicionado a `Simulador.slnx` e referenciado por `Simulador.Api.csproj`): `BancoQuestoes`, `ServicoTeorico`, modelos e DTOs.
- Banco: 60 questões originais em PT-BR (10 por domínio: acesso, redes, hardware, sistemas, segurança, backup), níveis 1 a 3 em todos os domínios, 6 de múltipla escolha, explicação estruturada (correta, cada incorreta, referência para documentação pública). Dados sintéticos.
- Endpoints (bloco `// === teorico ===` do Program.cs): `GET /api/teorico/topicos`, `POST /api/teorico/provas`, `POST /api/teorico/provas/corrigir`, `POST /api/teorico/questoes/{id}/verificar`, `POST /api/teorico/questoes/{id}/explicar`. Erros no formato `ErroProblema` (400 `validacao`, `topico_desconhecido`, `sem_questoes`; 404 `questao_nao_encontrada`).
- Determinismo: seleção balanceada por domínio e embaralhamento das alternativas por `semente` (xorshift próprio, estável entre versões do .NET). Padrão completo = 40 questões, 90 s por questão (60 min), nota de aprovação 70.
- Sem LLM: `explicar` devolve texto estático derivado da explicação estruturada, com `origem: "fallback"`. O `IClienteDialogo` atual exige `EstadoSessao`, então não serve para explicar questão. Para ligar uma IA depois, basta trocar `TextoEstatico` por um serviço novo; o contrato já prevê `origem: "ia"`.
- Testes: `tests/Simulador.Teorico.Tests` (28: banco, serviço, API). `dotnet test Simulador.slnx` verde (Domínio 2316, Teórico 28, API 36).

## Decisões do contrato
- `corrigir` não guarda estado: `total` é o número de entradas em `respostas` (o front manda uma por questão, com `[]` para em branco). `semente`, `formato` e `escopo` são aceitos, mas a questão vem do banco pelo `questaoId`.
- O gabarito só aparece em `verificar` e `corrigir`; a prova gerada não o contém (testado).
- O domínio no resultado vem com o nome de exibição ("Acesso e contas").
- Mudei `Simulador.Api.csproj` (referência ao projeto novo) e os `packages.lock.json` gerados pelo restore. Fora do trecho `// === teorico ===`, é só isso.

## Frontend
- `src/frontend/src/api/teorico.ts`: cliente tipado (`apiTeorico`).
- `src/frontend/src/teorico/`: `TelaProvaTeorica` (entrada), `useProvaTeorica`, `CartaoQuestao`, `MapaQuestoes`, `ResultadoTeorico`, `estadoProva.ts`, `teorico.css`, `teorico.test.tsx` (8 testes).
- Uso pelo AGY:
```tsx
<TelaProvaTeorica
  config={{ formato: 'padrao' | 'pratica', escopo: 'completo' | 'personalizado', topicos?, nivel?, quantidade?, semente?, origem: 'simulado' | 'prova' | 'pratica' }}
  titulo="Simulado teórico" retomar={false} aoSair={...} aoNovo={...} />
```
  A tela é uma `<main>` completa e o h1 recebe foco. No fim grava `registrarHistorico({ tipo: 'teorico', ... })` do módulo do AGY. Para a Prova (que atesta), o Portfólio pode ser alimentado a partir do histórico (`origem: 'prova'`, `aprovado`).
- Cabeçalho com "Questão X de N", barra fina, cronômetro (só no formato padrão; zerar encerra a prova), botão Sair (andamento salvo em `itfs_teorico_andamento`; `retomar` reconstrói a mesma prova pela semente), mapa lateral com filtros (Prática: Todas, Para revisar, Em branco, Incorretas; Padrão: Todas, Marcadas, Sem resposta) e selos, Finalizar com modal de confirmação, Prática com Verificar e Pular e feedback imediato (correta em verde, escolhida errada em vermelho, explicação estruturada, três botões de explicação extra com rótulo de origem). Resultado: percentual, X de N, selo APROVADO ou NÃO APROVADO, tempo e média por questão, barras por domínio, fortes e fracos, revisão que abre, Refazer, Novo simulado e Sair.
- Estilo: só tokens do `index.css` (segue o tema ativo, claro quando o AGY o definir como padrão). Segui o layout pelo BRIEF (cards com raio e sombra, azul) e não consultei o arquivo Figma pelo MCP.

## Validação
- `dotnet test Simulador.slnx`: verde.
- Frontend: `tsc -b` ok, lint 0 erros (2 avisos de regras react do oxlint no hook), `vitest run src/teorico` 8/8, build ok.

## Pendências
- Integrar `TelaProvaTeorica` nas páginas Simulados, Provas e Aprender (AGY).
- Não rodei a suíte Vitest completa, porque o AGY está alterando outras áreas.
- Explicações por IA reais ficam para depois do MVP.
