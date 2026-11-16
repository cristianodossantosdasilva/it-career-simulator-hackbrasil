# 07 Relatório de validação

Etapa 7 (primeira validação), executada por sim-validador em 2026-11-16 (horário local, -03:00).
Branch `redesign-ui-ux`. `git status` limpo antes da execução.

**Veredito: REPROVADO.** A etapa 9 é necessária depois da correção das falhas.

## Portões

| Portão | Comando | Status | Contagem e evidência |
|---|---|---|---|
| Lint | `npm.cmd run lint` em `src/frontend` | Aprovado | Exit 0. Nenhum aviso ou erro na saída. |
| Testes | `npm.cmd test -- --run` | Aprovado | 9 arquivos, 58 de 58 testes. Os avisos "Not implemented: HTMLCanvasElement" vêm do jsdom com axe e não reprovam. |
| Build | `npm.cmd run build` | Aprovado | `tsc -b`, `vite build` e verificação de segredos no bundle (14 arquivos) sem erro. JS 419,04 kB, CSS 70,13 kB. |
| Backend | `dotnet build src/backend/src/Simulador.Api` | Aprovado | Exit 0 e "Construir êxito" em 22,7 s. A contagem de avisos não aparece na saída. |
| Playwright | `npx.cmd playwright test` (5 projetos) | Reprovado | 27 testes: 15 aprovados e 12 reprovados. Duração 18,7 min. Detalhes nas falhas F1 a F4. |
| Caractere E comercial em `docs` (md, csv, html) | busca por `[char]38` | Aprovado | 0 ocorrências. |
| Caractere E comercial em `src/frontend/src` | busca fora do operador lógico duplo, sem testes, com forma `amp;` | Aprovado | 0 ocorrências. |
| Forma passada de sair | padrão do plano | Reprovado | 1 ocorrência real (forma passada do verbo sair, ver achado 4). Outras 5 são o presente "sai" que o padrão captura (achado 5). |
| Emojis em `src/frontend/src` | busca por faixas de emoji | Atenção | 11 em `educacao/catalogoEducacional.ts`, linhas 772 a 783 (ver achado 6). |
| Estilo inline (`style={{`) | contagem por arquivo | Aprovado com nota | 4 ocorrências, todas com largura dinâmica (ver achado 7). |
| Overflow horizontal em 375 px | `jornadas.spec.ts` (W10) | Reprovado | Falha em 375 px ao abrir o CH-0001 (F2). O teste de rolagem dos visuais de estudo passou nos 4 projetos. |

## Falhas do Playwright

Todas as falhas do Playwright estão em 2 causas de seletor e 1 causa de layout, mais 1 consequência nos visuais.

### F1. Botão "Solicitar token corporativo" não encontrado no ITSM (8 visuais de laboratório e 1 jornada)

```
> 35 | await page.getByRole('button', { name: T.itsm.solicitarToken }).click()
Error: locator.click: Test timeout of 60000ms exceeded.
  waiting for getByRole('button', { name: 'Solicitar token corporativo' })
```

Visuais: `visual.spec.ts:98`, 8 casos (4 projetos e 2 temas) com a mesma falha. Jornada: `jornadas.spec.ts:35` (Feliz 1).

Arquivo provável: `src/frontend/src/apps/ItsmApp/ItsmApp.tsx`, linhas 177 a 192. O botão fica dentro do bloco `ehNivel1`, com `disabled={ocupado}`. O texto do botão confere com `src/frontend/src/textos/workstation.ts`. A causa exata não foi confirmada: pode ser a condição `ehNivel1` ou o estado do chamado depois de "Assumir chamado".

### F2. Overflow horizontal em 375 px na jornada W10

```
> 23 | await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
Expected: true
Received: false
Timeout 5000ms exceeded.
```

A falha ocorre na primeira iteração (375 px), depois de abrir o CH-0001. A verificação inicial de 375 px passou, então o estouro aparece só na tela do simulador. Os visuais de estudo, com a mesma checagem, passaram.

Arquivos prováveis: `ItsmApp.tsx` (tabela da fila, que a etapa 5 transformou em bloco abaixo de 640 px) e o bloco "Ferramentas do laboratório" em `src/frontend/src/index.css`. Não confirmado. Não foi medido o elemento que ultrapassa a largura.

### F3. Texto "LOCK" não encontrado na negativa de prompt injection

```
> 196 | await expect(page.getByText('LOCK')).toBeVisible()
Error: expect(locator).toBeVisible() failed
Locator: getByText('LOCK')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

A busca em `src/frontend/src` não encontra o texto "LOCK" em nenhum arquivo. A etapa 5 removeu os badges, e o estado do solicitante agora aparece em texto ("Não confirmada" ou "Pendente").

Arquivo provável: `src/frontend/e2e/jornadas.spec.ts:196` (seletor antigo). Se o texto mudou de propósito, atualizar o spec conforme a regra 2. Verificar `src/frontend/src/apps/ChatApp/ChatApp.tsx` antes de decidir.

### F4. Rótulo "Motivo" e texto "Pratica esperada:" não encontrados no replay

```
> 289 | await expect(criterioSre.getByLabel('Motivo')).toBeVisible()
Locator: getByRole('listitem').filter({ hasText: /R3\s*—/ }).getByLabel('Motivo')
Error: element(s) not found
```

`src/frontend/src/replay/CriteriaPanel.tsx` usa os termos "O que você fez" e "Prática recomendada" nas listas de definição, sem rótulo "Motivo". O spec também procura "Pratica esperada:", sem acento. O spec está desatualizado.

Arquivo provável: `src/frontend/e2e/jornadas.spec.ts:289` a `290`. Atualizar os seletores para os textos atuais.

## Achados por prioridade

1. **Bloqueante (F1).** O botão de token do ITSM não aparece no fluxo do nível 1. Bloqueia 9 casos de teste. Investigar a condição de `ehNivel1` antes de mexer no spec.
2. **Bloqueante (F2).** Estouro horizontal em 375 px na tela do simulador. Viola o critério de WCAG e de 375 px das regras do plano.
3. **Alta (F3 e F4).** Seletores do spec desatualizados diante de textos intencionais. Decidir o texto final e alinhar spec e UI no mesmo passo.
4. **Média.** Forma passada do verbo sair em `src/frontend/src/educacao/catalogoEducacional.ts:540`, dentro de um texto visível na UI sobre um grupo do Active Directory. Sugestão: reescrever a frase com o verbo "deixar", sem a forma passada.
5. **Média (ajuste de ferramenta).** O padrão do plano para forma passada inclui `sai`, que é o presente. Ele gerou 5 falsos positivos (`01_PARECER_GERAL_7_FRENTES.md:70`, `PLANEJAMENTO_PEDAGOGICO_E_MATRIZ_560H.md:18`, `catalogoEducacional.ts:159, 280, 648`). Recomendo remover `sai` do padrão.
6. **Baixa.** 11 emojis em `catalogoEducacional.ts`, linhas 772 a 783. É a tabela `ICONE_LEGADO`, usada por `normalizarIconePagina` para converter ícones de páginas salvas. Uso intencional, mas viola a regra de emoji na UI. Decidir: manter como exceção documentada ou remover quando não houver páginas legadas.
7. **Baixa.** 4 `style={{` restantes em `SimuDeskApp.tsx:132`, `AulasView.tsx:154`, `MentorView.tsx:371` e `SlaMeter.tsx:51`. Todos definem largura de barra a partir de dados. Aceitar.
8. **Informativo.** Screenshots: 64 PNG em `src/frontend/test-results/visual/` (4 projetos, 2 temas, 8 visões). As visões são `missoes`, `aulas`, `caderno`, `mentor`, `laboratorio-itsm`, `laboratorio-chat`, `laboratorio-simudesk` e `laboratorio-kb`. Não há `laboratorio-replay` nem `credencial`, porque o teste falhou antes dessas telas. Os arquivos não foram abertos. A inspeção visual é da etapa 8.

## Veredito

**Reprovado.** Etapa 9 necessária: sim.

A etapa 8 deve corrigir F1 e F2, alinhar F3 e F4 com os textos decididos, e tratar os achados 4 e 6 com decisão do usuário. Como a etapa 8 altera código, a etapa 9 repete lint, testes, build, backend e Playwright completo.

## Histórico

- Rodada 1 (2026-11-16, etapa 7): reprovada, 12 falhas de Playwright, 2 bloqueantes e 4 achados de texto ou ferramenta. Esta é a primeira rodada, sem resultado anterior.

- Etapa 8 (2026-11-16): F1 a F4 e achados 4 e 6 corrigidos, mais defeitos visuais encontrados nos screenshots. Detalhes no registro de progresso do plano. Revalidação completa pendente na etapa 9.
