# DESIGN.md: direção visual do IT Flight Simulator

Documento lido por pessoas e por ferramentas de IA (Lovable, Google Stitch, Figma, Kiro). Escopo: aparência e interação. Regras de domínio e de arquitetura ficam em `AGENTS.md`.

Estado em 2026-11-16, baseado na `main` (commit 19bbb18). Quando este arquivo divergir de `src/frontend/src/index.css`, o código vale e este arquivo deve ser corrigido.

## 1. Produto em uma frase

Simulador de carreira em TI para quem quer virar profissional de suporte técnico: o participante atende chamados reais simulados da empresa fictícia Aurora Logística (domínio `aurora.local`), com SLA correndo, e recebe uma avaliação por critérios observáveis.

Público: iniciantes e pessoas em transição de carreira, em celular e em desktop. Tom: profissional, claro, sem infantilizar e sem parecer painel militar.

## 2. Liberdade criativa nesta fase

A home vocacional e os materiais do pitch (capa, vídeo, slides) podem ter uma identidade visual nova. O que a identidade nova pode mudar: paleta, tipografia, composição, ilustração, ritmo, formas, movimento decorativo.

O que a identidade nova não pode mudar (ver seções 3 e 4):
- as regras de acessibilidade;
- o mecanismo de temas por tokens, com os atributos `data-theme` e `data-contraste`;
- as regras de conteúdo e de domínio do repositório.

A identidade atual (tokens da seção 5) é a linha de base. Uma proposta nova entra como um novo conjunto de valores para os mesmos nomes de token, nunca como cores soltas no CSS.

## 3. Regras inegociáveis de acessibilidade

1. Contraste mínimo WCAG 2.2 AA: texto normal 4.5 para 1, texto grande e componentes de interface 3 para 1. Vale para todos os temas e também para o modo de alto contraste.
2. Foco visível em todo controle, usando `--focus-ring`, com 2 px de largura e 2 px de afastamento. Nunca remover `outline` sem substituto.
3. Alvo de toque mínimo de 44 px (`--touch-target`).
4. Todo movimento que dure mais de 5 segundos ou repita deve ter pausa, ou parar em `prefers-reduced-motion: reduce`. Animação `infinite` sem esse tratamento é recusada.
5. Informação nunca depende só de cor: estado usa texto ou ícone junto.
6. Layouts testados em 375, 768, 1280 e 1440 px, sem rolagem horizontal.
7. Zoom de 200 por cento sem perda de conteúdo.

## 4. Regras de conteúdo e de domínio (do repositório)

- Nunca usar o símbolo E comercial em texto visível, títulos, nomes de componente ou documentos. Usar "e" ou vírgula.
- Dados 100 por cento sintéticos: Aurora Logística, pessoas, servidores e logs fictícios. Nada de dados reais.
- A interface não imita a identidade visual de sistemas operacionais proprietários.
- Comandos simulados fora do escopo recebem resposta honesta, sem saída inventada.
- Sem emoji como ícone. Ícones vêm de `src/frontend/src/ui/Icone.tsx` e `catalogoIcones.ts`, nos tamanhos que o componente aceita (16 e 20).
- Sem estilo inline (`style={{ }}`).
- Sem chaves de API ou segredos no frontend. Nenhuma variável com prefixo `VITE_` guarda segredo.

## 5. Tokens (linha de base atual)

Fonte de verdade: `src/frontend/src/index.css`.

### Temas e alto contraste

O produto tem quatro temas e um modo de alto contraste, escolhidos pela pessoa e guardados no navegador:

| Tema | Aparência | Nome atual no CSS |
|---|---|---|
| `operacao` | escuro, padrão | `tactical` |
| `corporativo` | claro | `corporate` |
| `editorial` | definido pela spec `temas-selecionaveis` | ainda não existe no CSS |
| `acolhedor` | definido pela spec `temas-selecionaveis` | ainda não existe no CSS |

- O tema vai no atributo `data-theme` do elemento `html` e fica na chave `itfs_tema` do armazenamento local.
- O alto contraste é independente do tema. Vai no atributo `data-contraste` do elemento `html` e fica na chave `itfs_contraste`.
- Estado atual do código: o CSS ainda usa só `corporate` e `tactical`, e a página abre em `tactical`. A renomeação para `operacao` e `corporativo`, a criação de `editorial` e `acolhedor` e o atributo `data-contraste` são feitos pela spec `temas-selecionaveis`. Até lá, as tabelas de cor abaixo valem para os temas `corporativo` (hoje `corporate`) e `operacao` (hoje `tactical`).
- Não confundir o tema `editorial` com a densidade editorial (`data-density`), que é outro mecanismo.
- Os valores de cor de `editorial`, `acolhedor` e do alto contraste entram neste arquivo quando a spec for entregue. Todos devem cumprir a seção 3.

### Tipografia e espaço

- Fontes: Inter para interface, JetBrains Mono para terminal, comandos e dados técnicos.
- Escala: 12, 13, 14, 16, 18, 22, 28 e 36 px (`--font-size-xs` até `--font-size-3xl`).
- Pesos: 400, 500, 600 e 700.
- Linha: 1.25 (títulos), 1.45 (interface), 1.7 (leitura). Medida de leitura: 68ch.
- Espaço: 4, 8, 12, 16, 20, 24, 32, 40 e 48 px (`--space-1` até `--space-12`).
- Raio: 4, 8 e 12 px.

### Cor, tema corporativo (hoje `corporate`, claro)

| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #F8FAFC |
| Superfície | `--bg-surface` | #FFFFFF |
| Elevado | `--bg-elevated` | #F1F5F9 |
| Texto principal | `--text-primary` | #0F172A |
| Texto secundário | `--text-secondary` | #475569 |
| Texto discreto | `--text-muted` | #586980 |
| Ação principal | `--accent-primary` | #0B6E8A |
| Sucesso, texto | `--status-success-text` | #047857 |
| Alerta, texto | `--status-warning-text` | #B45309 |
| Perigo, texto | `--status-danger-text` | #B91C1C |

### Cor, tema operacao (hoje `tactical`, escuro, padrão)

| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #0B1120 |
| Superfície | `--bg-surface` | #0F172A |
| Elevado | `--bg-elevated` | #1E293B |
| Texto principal | `--text-primary` | #F8FAFC |
| Texto secundário | `--text-secondary` | #94A3B8 |
| Ação principal | `--accent-primary` | #0EA5E9 |
| Texto de destaque | `--accent-text` | #7DD3FC |
| Sucesso, texto | `--status-success-text` | #34D399 |
| Alerta, texto | `--status-warning-text` | #FBBF24 |
| Perigo, texto | `--status-danger-text` | #F87171 |

Lista completa, incluindo superfícies de estado, bordas e sombras: ver `index.css`.

## 6. Como uma ferramenta externa deve entregar

Regra central: nenhum valor de cor, espaço, raio ou sombra aparece direto em componente. Tudo passa por token.

1. Entregar a proposta como tokens nomeados (nomes iguais aos da seção 5) para todos os temas.
2. Usar `Icone` para ícones e as classes de componente já existentes antes de criar novas.
3. Cores de status aparecem junto de texto ou ícone.
4. Hex fixo é aceito apenas dentro das definições de token em `index.css`.

## 7. Checklist de PR vinda de ferramenta externa

A PR só é revisada para merge se cumprir todos os itens:

- [ ] Base da PR é a `main`, não outra branch de feature.
- [ ] CI de Backend e de Frontend executou e passou, além do preview da Vercel.
- [ ] Nenhum hex fora das definições de token.
- [ ] Toda animação tem tratamento de `prefers-reduced-motion`.
- [ ] Nenhum E comercial, emoji ou estilo inline.
- [ ] Sem nova dependência sem justificativa.
- [ ] Escopo bate com a decisão aprovada no DevLedger (home vocacional com escopo reduzido).
- [ ] Capturas em 375 e 1440 px, em cada tema tocado e no alto contraste, anexadas.
- [ ] Spec de contraste sem falha.

## 8. Fluxo de trabalho entre ferramentas

1. Figma (plano Education): arquivo com variáveis iguais aos tokens. O Kiro lê e escreve nele pelo servidor MCP do Figma.
2. Google Stitch: variantes rápidas de tela, exportadas como referência.
3. Lovable: laboratório de ideias, sincronizado com o GitHub. Trabalha em branch própria a partir da `main`.
4. Kiro: porta a proposta aprovada para o código, roda os testes e compara capturas.
5. Gemini (app) e Adobe Express: imagens, capa, vídeo e slides do pitch. Nada disso entra no bundle sem passar pela seção 4.