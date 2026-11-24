import { type FormEvent, type RefObject, useEffect, useReducer, useRef, useState } from 'react'
import { Icone } from '../../ui/Icone'
import type { CartaoPerfil as DadosDoCartao } from '../armazenamento/cartaoPerfil'
import { type IdEtapa, rotaPorId } from '../catalogos/catalogoRotas'
import {
  ROTEIRO_DIAGNOSTICO,
  TEXTO_PONTO_DE_PARTIDA,
  TEXTO_REGRA_INDICACAO,
  type PerguntaRoteiro,
} from '../catalogos/catalogoVocacional'
import { ROTA_PADRAO_DE_PERFIL, indicarRota, montarCartaoDoDiagnostico, rotaDePerfil } from '../catalogos/regrasIndicacao'
import { APRESENTACAO_STATUS } from '../catalogos/status'
import { ConfiguracaoModoMissao } from '../diagnostico/ConfiguracaoModoMissao'
import { type ModoMesa, calcularDominiosDaRota, gravarModoMesa, lerModoMesa } from '../diagnostico/configuracaoMissao'
import { ESTADO_INICIAL_DIAGNOSTICO, reduzirDiagnostico, respostasCompletas } from '../diagnostico/reduzirDiagnostico'
import { PainelMentor } from '../mentor/PainelMentor'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { CartaoPerfil } from '../componentes/CartaoPerfil'
import { SeloStatus } from '../componentes/SeloStatus'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { DiagnosticoRapido } from '../demonstracao/DiagnosticoRapido'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, type RotaResolvida } from '../navegacao/rotas'

type RotaDiagnostico = Extract<RotaResolvida, { pagina: 'diagnostico' }>

interface PropsPerguntaAtual {
  pergunta: PerguntaRoteiro
  numero: number
  total: number
  respostaInicial: string | null
  podeVoltar: boolean
  aoContinuar: (opcaoId: string) => void
  aoVoltar: () => void
  refLegenda: RefObject<HTMLLegendElement | null>
}

/** Uma pergunta por vez, com opções de escolha única. Reiniciada a cada pergunta pela `key` do pai. */
function PerguntaAtual({
  pergunta,
  numero,
  total,
  respostaInicial,
  podeVoltar,
  aoContinuar,
  aoVoltar,
  refLegenda,
}: PropsPerguntaAtual) {
  const [escolhida, setEscolhida] = useState<string | null>(respostaInicial)
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (escolhida !== null) aoContinuar(escolhida)
  }
  const ultima = numero === total
  return (
    <form onSubmit={enviar} className="stack">
      <p className="diagnostico-progresso">
        Pergunta {numero} de {total}
      </p>
      <fieldset className="diagnostico-pergunta">
        <legend ref={refLegenda} tabIndex={-1}>
          {pergunta.enunciado}
        </legend>
        <div className="opcoes-diagnostico">
          {pergunta.opcoes.map((opcao) => (
            <label key={opcao.id} className="opcao-diagnostico">
              <input
                type="radio"
                name={`diagnostico-${pergunta.id}`}
                value={opcao.id}
                checked={escolhida === opcao.id}
                onChange={() => setEscolhida(opcao.id)}
              />
              <span>{opcao.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {escolhida === null && (
        <p className="muted" id={`diagnostico-apoio-${pergunta.id}`}>
          Escolha uma opção para continuar.
        </p>
      )}
      <div className="acoes-linha">
        {podeVoltar && (
          <button type="button" className="btn btn-secondary" onClick={aoVoltar}>
            <Icone nome="voltar" tamanho={20} />
            <span>Voltar</span>
          </button>
        )}
        <button
          type="submit"
          className={escolhida === null ? 'btn btn-primary btn-indisponivel' : 'btn btn-primary'}
          aria-disabled={escolhida === null}
          aria-describedby={escolhida === null ? `diagnostico-apoio-${pergunta.id}` : undefined}
        >
          <span>{ultima ? 'Ver indicação' : 'Continuar'}</span>
          <Icone nome="avancar" tamanho={20} />
        </button>
      </div>
    </form>
  )
}

/**
 * Página Diagnóstico: perguntas do roteiro, indicação de rota por regra fixa, confirmação, cartão de
 * perfil e configuração Treino vs Missão com as cinco regras de preparo. Sem rede e sem IA.
 */
export function PaginaDiagnostico({ rota }: { rota: RotaDiagnostico }) {
  const { cartao, registros, definirCartao, avisoGravacao, dispensarAvisoGravacao } = useArmazenamentoJornada()
  const [estado, despachar] = useReducer(reduzirDiagnostico, ESTADO_INICIAL_DIAGNOSTICO)
  const [emitido, setEmitido] = useState<DadosDoCartao | null>(null)
  const [modo, setModo] = useState<ModoMesa>(lerModoMesa)
  const refLegenda = useRef<HTMLLegendElement | null>(null)
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  // Depois de cada passo, o foco vai para o que mudou. Na primeira renderização não mexe no foco.
  const anterior = useRef({ fase: estado.fase, indice: estado.indice })
  useEffect(() => {
    if (anterior.current.fase === estado.fase && anterior.current.indice === estado.indice) return
    anterior.current = { fase: estado.fase, indice: estado.indice }
    if (estado.fase === 'perguntas') refLegenda.current?.focus()
    else refTitulo.current?.focus()
  }, [estado.fase, estado.indice])

  const perguntas = ROTEIRO_DIAGNOSTICO.perguntas
  const respostas = respostasCompletas(estado)
  const indicacao = respostas ? indicarRota(respostas) : null
  const rotaIndicada = indicacao ? rotaPorId(indicacao.rotaId) : null
  const rotaIndisponivel = indicacao ? rotaDePerfil(indicacao.rotaId) !== indicacao.rotaId : false
  const rotaDeSuporte = rotaPorId(ROTA_PADRAO_DE_PERFIL)
  const dominios = rotaDeSuporte ? calcularDominiosDaRota(rotaDeSuporte, registros) : []
  const [dominiosSelecionados, setDominiosSelecionados] = useState<readonly IdEtapa[]>(() =>
    dominios.map((dominio) => dominio.id),
  )

  function mudarModo(novoModo: ModoMesa) {
    setModo(novoModo)
    gravarModoMesa(novoModo)
  }

  function alternarDominio(id: IdEtapa) {
    setDominiosSelecionados((atuais) => {
      if (atuais.includes(id)) {
        return atuais.length > 1 ? atuais.filter((item) => item !== id) : atuais
      }
      return [...atuais, id]
    })
  }

  function confirmar() {
    if (!respostas) return
    const novo = montarCartaoDoDiagnostico(respostas, new Date().toISOString())
    definirCartao(novo)
    setEmitido(novo)
    despachar({ tipo: 'confirmar' })
  }

  const semCartao = rota.motivo === 'sem-cartao' && cartao === null
  const comPerguntas = estado.fase === 'perguntas'
  const pergunta = perguntas[estado.indice]

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['diagnostico']}</h1>
        <p className="pagina-jornada-texto">
          {rota.rapido
            ? 'Caminho curto: confirme as respostas padrão e perfil. Nada é enviado para fora deste navegador.'
            : 'Três perguntas curtas indicam por onde começar. Não há resposta certa, e nada é enviado para fora deste navegador.'}
        </p>
      </header>

      {rota.rapido && <DiagnosticoRapido />}
      {!rota.rapido && comPerguntas && semCartao && (
        <AvisoHonesto
          acoes={[{ tipo: 'botao', rotulo: 'Ir para a primeira pergunta', aoClicar: () => refLegenda.current?.focus() }]}
        >
          Para abrir o Plano de Carreira, faça primeiro o diagnóstico. Ele gera o seu cartão de perfil.
        </AvisoHonesto>
      )}

      {!rota.rapido && comPerguntas && cartao && estado.indice === 0 && respostas === null && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Ir para o Plano de Carreira', href: '/plano-de-carreira' }]}>
          Você já tem um cartão de perfil. Se refizer o diagnóstico e confirmar, o cartão novo substitui o anterior e os suas missões
          registrados continuam guardados.
        </AvisoHonesto>
      )}

      {!rota.rapido && comPerguntas && pergunta && (
        <PerguntaAtual
          key={estado.indice}
          pergunta={pergunta}
          numero={estado.indice + 1}
          total={perguntas.length}
          respostaInicial={estado.respostas[pergunta.id] ?? null}
          podeVoltar={estado.indice > 0}
          aoContinuar={(opcaoId) => despachar({ tipo: 'responder', opcaoId })}
          aoVoltar={() => despachar({ tipo: 'voltar' })}
          refLegenda={refLegenda}
        />
      )}

      {!rota.rapido && estado.fase === 'indicacao' && indicacao && rotaIndicada && (
        <section className="indicacao-diagnostico" aria-labelledby="diagnostico-indicacao-titulo">
          <h2 id="diagnostico-indicacao-titulo" ref={refTitulo} tabIndex={-1}>
            Rota indicada: {rotaIndicada.nome}
          </h2>
          <p>
            <SeloStatus status={rotaIndicada.status} />
          </p>
          <p className="pagina-jornada-texto">{indicacao.justificativa}</p>
          <p className="muted">{TEXTO_REGRA_INDICACAO}</p>
          <p className="pagina-jornada-texto">{TEXTO_PONTO_DE_PARTIDA}</p>
          {rotaIndisponivel && (
            <AvisoHonesto
              acoes={[{ tipo: 'botao', rotulo: 'Trocar as respostas', aoClicar: () => despachar({ tipo: 'voltar' }) }]}
            >
              A rota {rotaIndicada.nome} está com o status {APRESENTACAO_STATUS[rotaIndicada.status].texto.toLowerCase()} e ainda
              não tem missões no simulador. A rota {rotaDeSuporte?.nome} está disponível e pode ser o seu ponto de partida.
            </AvisoHonesto>
          )}
          <div className="acoes-linha">
            <button type="button" className="btn btn-secondary" onClick={() => despachar({ tipo: 'voltar' })}>
              <Icone nome="voltar" tamanho={20} />
              <span>Voltar</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={confirmar}>
              <Icone nome="confirmar" tamanho={20} />
              <span>
                {rotaIndisponivel
                  ? `Iniciar em ${rotaDeSuporte?.nome ?? 'Suporte de TI'}`
                  : 'Confirmar e gerar o cartão de perfil'}
              </span>
            </button>
          </div>
        </section>
      )}

      {!rota.rapido && estado.fase === 'cartao' && emitido && (
        <>
          <section className="secao-jornada" aria-labelledby="diagnostico-concluido-titulo">
            <h2 id="diagnostico-concluido-titulo" ref={refTitulo} tabIndex={-1}>
              Diagnóstico concluído
            </h2>
            {avisoGravacao && (
              <AvisoHonesto acoes={[{ tipo: 'botao', rotulo: 'Entendi', aoClicar: dispensarAvisoGravacao }]}>
                {avisoGravacao}
              </AvisoHonesto>
            )}
            <CartaoPerfil cartao={emitido}>
              <LinkInterno href="/plano-de-carreira" className="btn btn-primary">
                <Icone nome="plano-de-carreira" tamanho={20} />
                <span>Ir para o Plano de Carreira</span>
              </LinkInterno>
              <button type="button" className="btn btn-secondary" onClick={() => despachar({ tipo: 'reiniciar' })}>
                <Icone nome="virar" tamanho={20} />
                <span>Refazer o diagnóstico</span>
              </button>
            </CartaoPerfil>
          </section>

          <ConfiguracaoModoMissao
            modo={modo}
            aoMudarModo={mudarModo}
            dominios={dominios}
            dominiosSelecionados={dominiosSelecionados}
            aoAlternarDominio={alternarDominio}
            aoSelecionarTodosDominios={() => setDominiosSelecionados(dominios.map((d) => d.id))}
          />
        </>
      )}

      <PainelMentor papel="consultor" pagina="diagnostico" />
    </div>
  )
}
