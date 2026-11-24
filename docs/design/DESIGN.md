# DESIGN.md: direção visual do IT Career Simulator

Documento lido por pessoas e por ferramentas de IA (Lovable, Google Stitch, Figma, Kiro). Escopo: aparência e interação. Regras de domínio e de arquitetura ficam em `AGENTS.md`.

Estado em 2026-11-20, na branch `jornada-de-carreira`. Quando este arquivo divergir de `src/frontend/src/index.css`, o código vale e este arquivo deve ser corrigido.

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
O produto tem quatro temas e um modo de alto contraste, escolhidos pela pessoa no painel Aparência da barra de contexto e guardados no navegador:
| Tema | Esquema | Aparência |
|---|---|---|
| `operacao` | escuro, padrão do produto | Painel de operação: azul noturno, contornos sóbrios, tipografia compacta |
| `corporativo` | claro | Escritório: neutros frios, acento azul petróleo, contornos de contêiner visíveis |
| `editorial` | escuro | Leitura: fundo grafite quente, acento âmbar, títulos de 48 px, espaços de composição maiores, cantos de 2, 4 e 8 px, pesos mais leves |
| `acolhedor` | claro | Acolhimento: fundo creme, acento verde profundo, cantos de 6, 10 e 12 px, texto-base de 15 px |
- O tema vai no atributo `data-theme` do elemento `html` e fica na chave `itfs_tema` do armazenamento local. A classe `dark` acompanha o esquema escuro.
- O alto contraste é independente do tema. Vai no atributo `data-contraste` (valor `alto`) do elemento `html` e fica na chave `itfs_contraste`. Há um conjunto para o esquema claro e outro para o escuro.
- Um script inline no `head` aplica tema e contraste antes da primeira pintura. Sem preferência salva, vale o esquema do navegador (claro abre `corporativo`, escuro abre `operacao`); sem esquema declarado, abre `operacao`.
- O terminal do SimuDesk é sempre escuro: o elemento marcado com `data-superficie="terminal"` usa as cores de `operacao` em qualquer tema e o conjunto escuro de alto contraste quando o modo está ligado.
- Aparência nunca entra em requisição à API nem em evento do motor. O motor determinístico não conhece tema nem contraste.
- Não confundir o tema `editorial` com a densidade editorial (`data-density`), que é outro mecanismo.
### Configuração do cliente
Uma implantação B2B pode limitar os temas. O arquivo-fonte é opcional e não existe no repositório por padrão: `src/frontend/config/tema-cliente.json`. O build lê o arquivo, higieniza e embute o resultado em um bloco JSON no `head` do `index.html` (`itfs-config-cliente`), antes do script inicial. O mesmo conteúdo, só com os três campos conhecidos, é publicado em `/config/tema-cliente.json`.
```json
{
  "temasPermitidos": ["corporativo", "acolhedor"],
  "temaPadrao": "corporativo",
  "travado": false
}
```
| Campo | Tipo | Obrigatório | Efeito |
|---|---|---|---|
| `temasPermitidos` | lista de textos | não | Temas oferecidos, na ordem informada. Fora do catálogo ou repetido é descartado com aviso. Lista vazia libera o catálogo inteiro |
| `temaPadrao` | texto | não | Tema inicial. Precisa estar em `temasPermitidos`; senão é substituído, com aviso |
| `travado` | booleano | não | Com `true` e `temaPadrao` válido, a pessoa não troca o tema e o painel mostra "Definido pela empresa cliente". O alto contraste continua disponível |
- Campo desconhecido é ignorado e só o nome aparece no console, com o prefixo `[Aparência]`. Sem o arquivo, nenhum aviso aparece.
- Trocar o arquivo publicado sem refazer o build não tem efeito: a fonte é o bloco do `index.html`.
- Nunca colocar segredo, chave ou dado de pessoa nesse arquivo. A verificação `check-bundle-secrets.mjs` varre o `dist` inteiro no build.
### Tipografia e espaço
- Fontes: Inter para interface, JetBrains Mono para terminal, comandos e dados técnicos.
- Escala base: 12, 13, 14, 16, 18, 22, 28 e 36 px (`--font-size-xs` até `--font-size-3xl`). `editorial` amplia os títulos (até 48 px) e `acolhedor` usa 15 px de texto-base.
- Pesos: 400, 500, 600 e 700.
- Linha: 1.25 (títulos), 1.45 (interface), 1.7 (leitura). Medida de leitura: 68ch.
- Espaço: 4, 8, 12, 16, 20, 24, 32, 40 e 48 px (`--space-1` até `--space-12`). Os espaços de composição variam por tema.
- Raio: 4, 8 e 12 px em `operacao` e `corporativo`; 2, 4 e 8 px em `editorial`; 6, 10 e 12 px em `acolhedor`.
### Cor, tema operacao (escuro, padrão)
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #0B1120 |
| Superfície | `--bg-surface` | #0F172A |
| Elevado | `--bg-elevated` | #1E293B |
| Texto principal | `--text-primary` | #F8FAFC |
| Texto secundário | `--text-secondary` | #94A3B8 |
| Texto discreto | `--text-muted` | #8E9DB2 |
| Contorno de contêiner | `--border-strong` | #717C8C |
| Contorno de controle | `--border-control` | #858E99 |
| Ação principal | `--accent-primary` | #0EA5E9 |
| Texto de destaque | `--accent-text` | #7DD3FC |
| Foco | `--focus-ring` | #38BDF8 |
| Sucesso, texto | `--status-success-text` | #34D399 |
| Alerta, texto | `--status-warning-text` | #FBBF24 |
| Perigo, texto | `--status-danger-text` | #F87171 |
### Cor, tema corporativo (claro)
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #F8FAFC |
| Superfície | `--bg-surface` | #FFFFFF |
| Elevado | `--bg-elevated` | #F1F5F9 |
| Texto principal | `--text-primary` | #0F172A |
| Texto secundário | `--text-secondary` | #475569 |
| Texto discreto | `--text-muted` | #586980 |
| Contorno de contêiner | `--border-strong` | #7A8595 |
| Contorno de controle | `--border-control` | #64748B |
| Ação principal | `--accent-primary` | #0B6E8A |
| Texto de destaque | `--accent-text` | #0B6E8A |
| Foco | `--focus-ring` | #0B6E8A |
| Sucesso, texto | `--status-success-text` | #047857 |
| Alerta, texto | `--status-warning-text` | #B45309 |
| Perigo, texto | `--status-danger-text` | #B91C1C |
### Cor, tema editorial (escuro)
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #141414 |
| Superfície | `--bg-surface` | #1C1B1A |
| Elevado | `--bg-elevated` | #262523 |
| Texto principal | `--text-primary` | #F5F2EB |
| Texto secundário | `--text-secondary` | #C9C2B6 |
| Texto discreto | `--text-muted` | #ADA597 |
| Contorno de contêiner | `--border-strong` | #7A7772 |
| Contorno de controle | `--border-control` | #8A8681 |
| Ação principal | `--accent-primary` | #E3A857 |
| Texto de destaque | `--accent-text` | #F0C27F |
| Foco | `--focus-ring` | #F0C27F |
| Sucesso, texto | `--status-success-text` | #6FD3A8 |
| Alerta, texto | `--status-warning-text` | #F2C46B |
| Perigo, texto | `--status-danger-text` | #F59A93 |
### Cor, tema acolhedor (claro)
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #FBF8F3 |
| Superfície | `--bg-surface` | #FFFFFF |
| Elevado | `--bg-elevated` | #F4EFE7 |
| Texto principal | `--text-primary` | #2A2420 |
| Texto secundário | `--text-secondary` | #574E45 |
| Texto discreto | `--text-muted` | #6A6056 |
| Contorno de contêiner | `--border-strong` | #887F71 |
| Contorno de controle | `--border-control` | #7A6F60 |
| Ação principal | `--accent-primary` | #1F6F68 |
| Texto de destaque | `--accent-text` | #1A5F59 |
| Foco | `--focus-ring` | #1F6F68 |
| Sucesso, texto | `--status-success-text` | #1E6B41 |
| Alerta, texto | `--status-warning-text` | #8F5207 |
| Perigo, texto | `--status-danger-text` | #A3322A |
### Cor, alto contraste claro
Vale sobre `corporativo` e `acolhedor`.
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #FFFFFF |
| Superfície | `--bg-surface` | #FFFFFF |
| Elevado | `--bg-elevated` | #F2F2F2 |
| Texto principal | `--text-primary` | #000000 |
| Texto secundário | `--text-secondary` | #1A1A1A |
| Texto discreto | `--text-muted` | #333333 |
| Contorno de contêiner | `--border-strong` | #4D4D4D |
| Contorno de controle | `--border-control` | #000000 |
| Ação principal | `--accent-primary` | #004A80 |
| Texto de destaque | `--accent-text` | #003E6B |
| Foco | `--focus-ring` | #000000 |
| Sucesso, texto | `--status-success-text` | #00552A |
| Alerta, texto | `--status-warning-text` | #6B3900 |
| Perigo, texto | `--status-danger-text` | #8F0000 |
### Cor, alto contraste escuro
Vale sobre `operacao` e `editorial` e sobre o terminal do SimuDesk.
| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--bg-canvas` | #000000 |
| Superfície | `--bg-surface` | #000000 |
| Elevado | `--bg-elevated` | #141414 |
| Texto principal | `--text-primary` | #FFFFFF |
| Texto secundário | `--text-secondary` | #EDEDED |
| Texto discreto | `--text-muted` | #D6D6D6 |
| Contorno de contêiner | `--border-strong` | #B3B3B3 |
| Contorno de controle | `--border-control` | #FFFFFF |
| Ação principal | `--accent-primary` | #8FD3FF |
| Texto de destaque | `--accent-text` | #A6DCFF |
| Foco | `--focus-ring` | #FFD24D |
| Sucesso, texto | `--status-success-text` | #7DEBAF |
| Alerta, texto | `--status-warning-text` | #FFD470 |
| Perigo, texto | `--status-danger-text` | #FFA8A8 |
Lista completa, incluindo superfícies de estado, bordas e sombras: ver `index.css`.
Limiares verificados pela spec de contraste (`e2e/contraste.spec.ts`) e pelo teste de tokens: texto 4,5 para 1 (7 para 1 no alto contraste), controle e foco 3 para 1, contorno de contêiner 2 para 1 e divisor 1,4 para 1 (em `operacao` com contraste padrão, sem regressão do piso 1,71 e 1,81).
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