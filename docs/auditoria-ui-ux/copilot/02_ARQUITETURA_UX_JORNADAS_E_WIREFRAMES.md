# Arquitetura UX, jornadas e wireframes

## Principio de produto

O produto deve responder sempre a tres perguntas:

1. O que eu preciso aprender para esta missao?
2. O que devo fazer agora no ambiente de trabalho?
3. Como provo que fiz com seguranca?

## Arquitetura de informacao

```text
IT Flight Simulator
|-- Inicio
|   |-- Continuar missao
|   |-- Trilhas
|   |-- Progresso da semana
|-- Aprender
|   |-- Unidade atual
|   |-- Caderno
|   |-- Revisao
|-- Trabalhar
|   |-- Turno atual
|   |-- Chamados
|   |-- Chat
|   |-- SimuDesk
|   |-- Base de conhecimento
|-- Comprovar
|   |-- Replay
|   |-- Criterios
|   |-- Curriculo Vivo
```

### Shell

- Rail lateral de 56 px recolhido e 224 px expandido.
- Barra superior de 48 px com nome da area, status da sessao, busca e perfil.
- Breadcrumb apenas dentro de licao, missao e replay.
- Uma acao primaria por tela.
- O estado da missao permanece visivel ao alternar entre ferramentas.

## Jornada Primeiro Voo

Ao abrir pela primeira vez, o aluno ve uma missao recomendada, nao uma explicacao do produto. O bloco inicial deve conter: titulo da missao, problema em uma frase, tempo estimado, nivel, proxima acao e resultado esperado. O restante fica abaixo.

Fluxo:

```text
Inicio -> Missao recomendada -> Unidade de preparo -> Turno guiado
      -> Evidencia validada -> Replay -> Proxima missao
```

## Wireframe 1440 px: home e catalogo

```text
+-- rail 56 --++---------------- app bar 48 -------------------------------+
| logo         | Inicio                         Buscar  Sessao  Curriculo |
+--------------+-----------------------------------------------------------+
|              | Bom dia, analista.                                        |
|  Inicio       | Continue: Pasta de rede inacessivel       [Retomar]       |
|  Aprender     | N1 | 15 min | 2 de 6 passos | SLA e DNS                  |
|  Trabalhar    +-----------------------------------------------------------+
|  Comprovar    | Trilhas                                                     |
|              | [N1 Redes] [Em andamento] [3 unidades] [Abrir]            |
|              | [N2 Incidentes] [Disponivel] [4 unidades] [Abrir]          |
|              | [SRE Cloud] [Bloqueada por preparo] [Ver requisitos]       |
|              +-----------------------------------------------------------+
|              | Hoje                                                        |
|              | 1 revisao pendente | 25 min de foco | 1 missao concluida |
+--------------+-----------------------------------------------------------+
```

## Wireframe 375 px: home

```text
+-----------------------------------+
| Aurora        [buscar] [perfil]   |
+-----------------------------------+
| Continuar                           |
| Pasta de rede inacessivel          |
| N1 | 15 min                         |
| [Retomar missao]                    |
+-----------------------------------+
| Progresso  3 de 6                   |
| [====------]                        |
+-----------------------------------+
| Trilhas                             |
| N1 Redes                            |
| Redes, DNS e acesso remoto          |
| [Abrir]                             |
| N2 Incidentes                       |
| [Ver trilha]                        |
+-----------------------------------+
| [Inicio] [Aprender] [Trabalhar]     |
| [Comprovar]                         |
+-----------------------------------+
```

## Wireframe 1440 px: course player

```text
+-- rail --+---------------- app bar --------------------------------------+
| Aprender  | N1 Redes / Unidade 2 de 3                 [Abrir laboratorio]|
+-----------+----------------------+---------------------------------------+
| unidades  | Rede, IP e DNS        | Caderno da unidade                    |
| 01 conclu | objetivo da unidade   | Perguntas-chave                      |
| 02 atual  | texto 65 a 72ch       | [textarea]                           |
| 03 bloque | diagrama simples      | [Salvar] [Abrir caderno]             |
|           | checkpoint             |                                       |
|           | [Responder]            |                                       |
|           | [Concluir unidade]     |                                       |
+-----------+----------------------+---------------------------------------+
```

No mobile, o indice vira um drawer acionado por `Unidades`, e o caderno vira uma aba inferior. O texto nunca divide a tela em tres colunas.

## Wireframe 1440 px: workstation split screen

```text
+-- rail --+---------------- turno: Pasta de rede -------------------------+
| Trabalhar| CH-1042  P2  SLA 01:42:18  Sessao auditada     [Encerrar]     |
+-----------+----------------------+---------------------------------------+
| roteiro   | fila e detalhe       | bancada                               |
| 1 assumir | Chamados             | AURORA-SRV01                         |
| 2 classif | filtro [todos]       | Status do host: degradado            |
| 3 validar | tabela compacta      | [diagnostico] [logs] [servicos]     |
| 4 testar  | CH-1042 selecionado  | Terminal / painel contextual         |
| 5 fechar  | solicitante, SLA     | [Executar acao segura]               |
|           | timeline curta       |                                       |
+-----------+----------------------+---------------------------------------+
```

O painel esquerdo tem no maximo 280 px. A bancada ocupa 65 por cento ou mais. O roteiro nao desaparece quando o aluno abre Chat ou KB.

## Wireframe 375 px: turno

```text
+-----------------------------------+
| CH-1042  P2  01:42:18             |
| [Roteiro] [Bancada] [Chat]        |
+-----------------------------------+
| Passo 3 de 5                       |
| Confirmar identidade               |
| Por que: proteger a conta         |
| [Abrir Chat]                       |
+-----------------------------------+
| Solicitante                        |
| Maria Souza | Financeiro           |
| [Pendente]                         |
| [Enviar verificacao]               |
+-----------------------------------+
| [Roteiro] [Bancada] [Replay]       |
+-----------------------------------+
```

## Wireframe 1440 px: replay e credencial

```text
+-- rail --+---------------- replay CH-1042 -------------------------------+
| Comprovar| Resolucao segura                    [Exportar evidencia]       |
+-----------+---------------------------------------------------------------+
| 94       | Triagem 100 | Seguranca 100 | Diagnostico 80 | Comunicacao 100|
| score    +---------------------------------------------------------------+
|          | timeline                                                     |
|          | 08:04 assumiu -> 08:05 classificou -> 08:07 verificou        |
|          | 08:10 diagnosticou -> 08:13 corrigiu -> 08:15 encerrou       |
|          +-------------------------+-------------------------------------+
|          | O que voce fez          | Pratica recomendada               |
|          | evidencia real          | evidencia esperada                |
|          +-------------------------+-------------------------------------+
|          | Curriculo Vivo                                             |
|          | N1 Redes | assinatura valida | hash curto | [Ver detalhes]  |
+-----------+---------------------------------------------------------------+
```

## Microcopy

| Antes | Depois |
|---|---|
| Bora para o proximo passo da sua carreira | Continue sua proxima missao |
| Comece aqui | Abrir trilha |
| Praticar | Iniciar turno |
| Mentor IA | Revisar com perguntas |
| Minhas anotacoes | Caderno desta unidade |
| Curriculo Vivo | Credencial de competencias |
| Acesso remoto bloqueado por seguranca | Acesso bloqueado: confirme a identidade primeiro |
| Como voce aprende aqui | O ciclo desta missao |
| Veja um exemplo | Preencher com exemplo |
| Salvo automaticamente | Salvo agora |

## Regras de interacao

- Toda acao de laboratorio produz feedback no lugar da acao.
- Bloqueios explicam requisito e oferecem o caminho para liberar.
- O aluno nunca perde a unidade, o chamado ou o texto digitado ao trocar de area.
- Erros de rede ou cold start mostram estado, tentativa e alternativa.
- O replay deve ser acessivel pelo fim do turno em um clique.
