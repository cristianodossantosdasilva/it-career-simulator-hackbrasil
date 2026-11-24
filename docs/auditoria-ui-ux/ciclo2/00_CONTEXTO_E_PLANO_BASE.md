# Ciclo 2: contexto verificado e plano-base

Origem: análise do Claude em 2026-11-16, feita por leitura de código, tokens e 2 screenshots, sem executar o app, testes ou Playwright. O Claude não participa mais. Os participantes são Kiro CLI, Codex e Copilot. Trate todo fato abaixo como hipótese a confirmar por conta própria.

## Papéis

| Quem | Papel |
|---|---|
| Kiro CLI | Planeja, consolida as revisões e executa as etapas aprovadas, uma por sessão. |
| Codex e Copilot | Revisores independentes, somente leitura. Validam fatos e criticam o plano do Kiro. Não implementam. |
| Usuário | Decide as perguntas abertas, aprova o plano e confirma toda ação irreversível. |

## Estado verificado (2026-11-16)

- Repositório: `D:\Projetos\Ativos\it-career-simulator-hackbrasil`. Remoto: `github.com/cristianodossantosdasilva/it-career-simulator-hackbrasil`.
- `main` = `origin/main` = `a88988c` (merge fast-forward da branch `redesign-ui-ux`, 8 commits). CI run `43833833580` verde. Status Vercel do commit: `success` (via `gh api .../commits/a88988c/status`).
- DevLedger, projeto `simulador-carreira-ti`, etapa `C0-CONCEPCAO`: estado atual `01a1e38d-d617-76f7-aa20-42355fd03e50` no HEAD `a88988c`, integridade ok, 0 violações de chave estrangeira. Banco: `D:\GitHub\cristianodossantosdasilva\DevLedger\data\devledger.db`.
- Último ciclo: Vitest 58 de 58, Playwright 27 de 27 em 5 projetos (`chromium`, `mobile-375`, `tablet-768`, `desktop-1280`, `desktop-1440`), lint e build ok.
- Entradas locais alheias a este ciclo (não tocar, não versionar): `README.md`, `docs/rfc/PROJETO_SIMULADOR_CARREIRA_TI_DISCUSSAO_IAS.md`, `docs/rfc/PROMPT_ORQUESTRACAO_CONSULTOR_VOCACIONAL.md` e `docs/consultor-vocacional/`.
- A linha final da etapa 10 em `docs/auditoria-ui-ux/consolidado/00_PLANO_EXECUCAO_E_PROGRESSO.md` está modificada e sem commit.
- O grafo `graphify-out/` está defasado (gerado em `6b437451`, 8 commits atrás). Não reconstruir durante o planejamento. Reconstruir com `--code-only` no início da primeira etapa de implementação.

## Regras inegociáveis

1. Não editar `src/backend`, `src/frontend/src/api/**` nem `src/frontend/src/utils/jcs.ts` (contratos da API C#, JCS RFC 8785, assinatura ECDSA P-256).
2. Preservar seletores dos testes (role, aria-label, textos acionáveis). Se um texto mudar de propósito, atualizar o teste no mesmo passo.
3. WCAG AA: texto 4,5:1, texto grande e componentes 3:1, alvos de 44 px, foco visível, sem rolagem horizontal em 375 px, nos dois temas: `data-theme` `tactical` (escuro, padrão) e `corporate` (claro). Tokens em `src/frontend/src/index.css` (linhas 69 a 160).
4. Zero caractere E comercial (U+0026) em `.md`, `.csv`, `.html` e textos de UI (o operador lógico duplo do TypeScript é permitido). Zero forma passada do verbo sair. Zero emoji na UI. Estilo inline só para largura dinâmica.
5. Windows: `npm.cmd` e `npx.cmd`. Sem push, merge, deploy ou `npm install` sem confirmação do usuário.
6. Economia: leitura dirigida e menor conjunto de testes que cobre a mudança. Suíte completa e Playwright só na validação.
7. As portas 8080 e 5173 e o limitador da API (120 requisições por minuto por IP em produção, 5000 no backend de teste do Playwright) são compartilhados. Não rodar Playwright nem servidores durante o planejamento e a revisão.

## Problemas relatados pelo usuário e evidências

### P1. O Nível 2 já vem pré-selecionado, nos dois temas

- `TelaInicial.tsx:73`: `useState('pasta-rede-inacessivel')`. Esse cenário é o item `n1` do catálogo, exibido como "Nível 2: Analista Jr (N1)".
- `catalogoEducacional.ts:761`: o estado inicial da Academia tem `focus: 'n1'`. Isso também pré-seleciona "Nível em foco" no menu de perfil (`MenuPerfil.tsx:86`), o preenchimento STAR do Mentor (`MentorView.tsx:440`) e as páginas novas do Caderno.
- É estado, não CSS: acontece igual nos dois temas.
- Há dois botões primários com destinos diferentes. "Iniciar primeiro missão" inicia o Estagiário (`TelaInicial.tsx:166`). "Iniciar no Simulador" (`TabelaMissoes.tsx:118`) inicia o cenário pré-selecionado.
- Os ids e os rótulos divergem: `estagiario` = Nível 1, `n1` = Nível 2, `n2` = Nível 3, `n3` = Nível 4, `esp` = Nível 4b. Não renomear ids (localStorage e testes dependem deles). Documentar.
- Todo E2E clica em um rádio de nível antes de "Iniciar" (`jornadas.spec.ts`, `visual.spec.ts:77`), exceto a "Demo rápida". `App.test.tsx:123-126` também clica antes de verificar. Remover a pré-seleção não quebra esses testes.
- A verificar: se o `focus` é persistido em localStorage (`itfs_academia_v3`) e como tratar usuários que já têm `n1` salvo.

### P2. A Missão 0 aparece abaixo das outras missões

Ordem atual em `TelaInicial.tsx` (linhas 270 a 312): Primeiro Missão, tabela das 5 missões (numeradas de 1 a 5), seção "Missão 0: como funciona em 4 passos", Glossário, Transparência do escopo. A página corporativa em 1440 px mede 2004 px de altura.

### P3. O tema corporativo precisa de validação visual para corrigir contrastes e contornos

Razões calculadas pelos tokens, não por pixels renderizados:

| Par (corporativo) | Razão | Leitura |
|---|---|---|
| `--border-subtle` sobre superfície branca | 1,23:1 | Contorno de cards e linhas quase invisível. |
| `--border-subtle` sobre canvas | 1,18:1 | Idem. |
| `--border-strong` sobre superfície | 1,48:1 | Ainda fraco. |
| `--border-control` sobre superfície | 4,76:1 | Controles ok. |
| `--text-muted` sobre superfície | 5,20:1 | Ok. |
| `--text-muted` sobre `--bg-elevated` | 4,75:1 | Ok. |
| `--text-muted` sobre `--bg-hover` | 4,22:1 | Abaixo de 4,5:1. |
| Acento sobre superfície | 5,81:1 | Ok. |

Outros achados:

- Cores fixas fora dos tokens em `index.css`: `.btn-white` (249 e 250), seletor de arquivo (732 e 733), `.banner-notice` (1056), `.alert-success` (1057) e `.alert-danger` (1058). Não acompanham o tema escuro. `.banner-notice` e `.alert-danger` aparecem na tela inicial. A confirmar nos PNG `tactical`.
- Os testes `axe.run` rodam no jsdom sem configurar `color-contrast`. O jsdom não calcula cores renderizadas, então "0 violações" não prova contraste. Só existe um teste de pares de tokens em `App.test.tsx`. Contraste real exige navegador. `axe-core` já é devDependency: avaliar injetá-lo com `page.addScriptTag` no Playwright, sem pacote novo.
- Há 80 PNG em `src/frontend/test-results/visual` (ignorados pelo Git, nomes `projeto__tema__tela.png`). Foram abertos só `desktop-1440__corporate__missoes` e `desktop-1440__corporate__laboratorio-itsm`. Neles, cards "Missões" e "Fila de chamados" e os separadores de linha ficam achatados, e o texto auxiliar monoespaçado ("T 0%, F 20%, P 0%") é pequeno. É impressão visual, não medida.
- A verificar, sem afirmar defeito: em estado limpo, Nível 1 e Nível 2 aparecem como "Em andamento" com F 20% e o Primeiro Missão diz "Teoria em 0%". Conferir `calcularProgressoNivel` e se a spec semeia estado.

## Plano-base (ponto de partida para criticar)

Branch nova `ux-ciclo-2` a partir da `main` `a88988c`. Uma etapa por sessão.

| Etapa | Conteúdo | Perfil sugerido |
|---|---|---|
| E1 | Base de medição: atualizar o grafo (code-only), criar spec Playwright de contraste e contorno com `axe-core` no navegador (2 temas, 4 viewports), gerar relatório de linha de base. Sem corrigir nada. | Intermediário |
| E2 | P1 e P2: seleção inicial, `focus` padrão, ordem da Missão 0, testes Vitest e ajuste dos E2E afetados. | Intermediário |
| E3 | P3: tokens de contorno e texto do corporativo, cores fixas para tokens, regressão do tático. | Forte (decisão de design com medição) |
| E4 | Inspeção visual dos PNG nos dois temas e ajustes finos por tela (Aulas, Caderno, Mentor, ITSM, SimuDesk, Replay, Credencial). | Intermediário |
| E5 | Revalidação completa: lint, Vitest, build, dotnet build, Playwright nos 5 projetos, contraste real, varreduras. Só relata. | Barato |
| E6 | Fechamento: commit, merge `--ff-only`, push com confirmação, CI, DevLedger. | Barato |

## Decisões padrão recomendadas (contestar com evidência)

- **D1, pré-seleção:** nenhuma missão selecionada ao abrir. "Iniciar no Simulador" fica desabilitado com texto de apoio ("Escolha uma missão"). O `focus` padrão passa a `estagiario`, para continuar válido nos consumidores. A "Demo rápida: Nível 2, C1" permanece como atalho explícito. Alternativa: pré-selecionar o Nível 1.
- **D2, Missão 0:** acima da tabela de missões, logo depois do Primeiro Missão. Expandida sem progresso e recolhida (`details`) com progresso. Avaliar a sobreposição com o fluxo de 3 passos do Primeiro Missão.
- **D3, contornos do corporativo:** subir `--border-subtle` e `--border-strong` dos containers com valores medidos, manter `--border-control`, trocar cores fixas por tokens e corrigir o `--text-muted` sobre `--bg-hover`.

## Perguntas que dependem do usuário

1. Pré-seleção: nenhuma missão (recomendado) ou Nível 1 pré-selecionado?
2. A linha final da etapa 10 no plano (alteração local sem commit) entra no primeiro commit do ciclo 2?
3. Os 4 arquivos alheios continuam fora do ciclo? Recomendação: sim.

## Limites desta análise

Leitura de código, tokens e 2 PNG. Nada foi executado. As razões de contraste vêm dos tokens. Nenhum agente foi criado e o DevLedger não foi alterado nesta análise.
