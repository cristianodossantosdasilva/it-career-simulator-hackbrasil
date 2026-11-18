---
inclusion: fileMatch
fileMatchPattern: "src/frontend/**/*.{tsx,css}"
---

# Design system do frontend

Ao criar ou alterar interface, siga as regras do documento abaixo. Ele é a fonte única de direção visual, acessibilidade e checklist de entrega.

#[[file:docs/design/DESIGN.md]]

Regras de execução para o agente:

- Antes de entregar mudança visual, abrir a página em 375 e 1440 px, nos temas `corporate` e `tactical`, com o Playwright MCP, e conferir as capturas.
- Nenhum valor de cor, espaço, raio ou sombra fora das definições de token em `src/frontend/src/index.css`.
- Ícones somente por `src/frontend/src/ui/Icone.tsx`. A biblioteca `lucide-react` já está instalada.
- Toda animação precisa de tratamento de `prefers-reduced-motion`.
- Não adicionar dependência de UI nova (Tailwind, bibliotecas de componentes ou de animação) sem decisão registrada do usuário.
- Se houver arquivo no Figma para a tela, ler as variáveis e a estrutura pelo MCP do Figma antes de escrever o código.