# Frontend do IT Career Simulator

Interface web do simulador. Ela mostra o estado e envia as ações do participante à API. Quem decide estado, comandos simulados, SLA e avaliação é o motor determinístico do backend.

## Stack

- React 19 e TypeScript, empacotados com Vite.
- Estilos em um único `src/index.css`, com tokens de cor, espaço e tipografia nos temas tactical e corporate.
- Testes unitários e de componentes com Vitest, Testing Library e jsdom.
- Testes de ponta a ponta, contraste e capturas visuais com Playwright e axe-core.
- Lint com Oxlint.

## Comandos

Execute a partir de `src/frontend`. No Windows use `npm.cmd`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do Vite. |
| `npm run lint` | Oxlint. |
| `npm test -- --run` | Vitest uma vez, sem modo de observação. |
| `npm run build` | Verificação de tipos, build de produção e varredura de segredos no bundle. |
| `npm run preview` | Serve o build gerado. |
| `npm run test:e2e` | Playwright. Exige a API local em `http://localhost:8080` e o frontend em `http://localhost:5173`. |

## Estrutura de `src`

`api` (cliente da API), `jornada` (rotas e fluxo de entrada), `educacao`, `workstation`, `lab`, `replay`, `apps`, `shell`, `tema`, `ui`, `textos`, `data`, `utils` e `testes`.

## Regras do código

- Sem atributo `style` em arquivos `.tsx` (o teste `src/jornada/conformidade.test.ts` vigia): a aparência vem das classes e dos tokens de `index.css`.
- Chaves de API nunca entram no bundle. A varredura roda no `build`.
- Dados do simulador são sintéticos.

## Mais informações

- [README da raiz](../../README.md): visão geral do projeto, backend e implantação.
- [docs/design/DESIGN.md](../../docs/design/DESIGN.md): direção visual, temas e acessibilidade.
