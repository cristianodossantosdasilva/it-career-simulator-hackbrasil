# Renomeacao: IT Flight Simulator -> IT Career Simulator (sem analogia de voo)

Worktree: D:/Projetos/Ativos/it-career-simulator (branch feat/career-simulator, base 764b45d). Etapa 1 (textos visiveis) ja feita por script. Falta o RESTO do vocabulario de voo, que o script pulou de proposito (codigo, URLs, JSX com chaves, variantes).
Dono do projeto pediu: "muda tudo", foco em TI, sair das analogias de voo.

## Glossario (obrigatorio, genero mantido)
Plano de Voo -> Plano de Carreira | Cabine -> Mesa de Trabalho | Caixa Preta / Caixa-preta -> Revisao | Hangar -> Catalogo | Comandante -> Mentor | Breve -> Portfolio | Check-in -> Diagnostico | Cartao de embarque -> Cartao de perfil | embarcar / Embarque -> Iniciar / Perfil | Decolar -> Iniciar | Piloto -> Analista | Cockpit -> Mesa de Trabalho | voo -> missao (concordar genero: o voo -> a missao, um voo -> uma missao) | escala -> etapa (a escala -> a etapa) | Flight -> Career.
Usar acentos corretos em textos visiveis (Revisão, Catálogo, Portfólio, Diagnóstico, missão, etapa).

## URLs (mudar em rotas e em todo uso)
/plano-de-voo -> /plano-de-carreira | /cabine/:missao -> /mesa-de-trabalho/:missao | /caixa-preta/:sessao -> /revisao/:sessao | /hangar -> /catalogo | /comandante -> /mentor | /breve -> /portfolio | /check-in -> /diagnostico.
Ids internos de pagina em rotas.ts acompanham as URLs. Chaves de localStorage itfs_* e contratos de API/backend NAO mudam (dados persistidos, hashes e vetores).

## Regras
- Proibido o simbolo E comercial. Dados sinteticos. Nao mexer em src/backend, exceto nada. Nao alterar docs/auditoria* (historico) nem docs/vetores-jcs-sha256.json.
- Dono unico por arquivo. NAO commitar nem dar push. Nao usar git restore/checkout/reset/clean.
- Nao quebrar testes: apos editar, rodar em src/frontend: npx.cmd tsc -b; npm.cmd run lint; npm.cmd test -- --run (cd src/frontend). Corrigir testes junto com o codigo.
- Verificar com: git grep -n -P "Voo|voo|Cabine|cabine|Hangar|Comandante|Caixa[- ]?[Pp]reta|Brev|Check-in|Embarque|embarc|Decol|Piloto|Cockpit|Flight|[Ee]scala" no seu escopo; sobrar apenas identificadores/chaves explicitamente preservados (liste-os no retorno).

## Donos
- Kiro: src/frontend/src/** (inclui nomes de arquivos/componentes e rotas.ts; renomear com git mv e ajustar imports)
- AGY: README.md, AGENTS.md, CLAUDE.md, GEMINI.md, docs/*.md (exceto auditoria*), src/frontend/e2e/**, src/frontend/index.html, render.yaml, docker-compose.yml, src/frontend/package.json (so textos), scripts do repo

## Retorno
docs/career-rename/handoffs/RETORNO-<agente>.md (arquivos, comandos e resultados, sobras preservadas) e depois `regente notify "<agente> concluiu"`.
