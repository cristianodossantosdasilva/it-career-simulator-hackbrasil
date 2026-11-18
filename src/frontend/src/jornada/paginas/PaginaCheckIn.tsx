import { type FormEvent, type RefObject, useEffect, useReducer, useRef, useState } from 'react'
import { Icone } from '../../ui/Icone'
import type { CartaoEmbarque as DadosDoCartao } from '../armazenamento/cartaoEmbarque'
import { rotaPorId } from '../catalogos/catalogoRotas'
import {
  ROTEIRO_CHECKIN,
  TEXTO_PONTO_DE_PARTIDA,
  TEXTO_REGRA_INDICACAO,
  type PerguntaRoteiro,
} from '../catalogos/catalogoVocacional'
import { ROTA_PADRAO_DE_EMBARQUE, indicarRota, montarCartaoDoCheckIn, rotaDeEmbarque } from '../catalogos/regrasIndicacao'
import { APRESENTACAO_STATUS } from '../catalogos/status'
import { ESTADO_INICIAL_CHECKIN, reduzirCheckIn, respostasCompletas } from '../checkin/reduzirCheckIn'
import { PainelComandante } from '../comandante/PainelComandante'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { CartaoEmbarque } from '../componentes/CartaoEmbarque'
import { SeloStatus } from '../componentes/SeloStatus'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { CheckInRapido } from '../demonstracao/CheckInRapido'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, type RotaResolvida } from '../navegacao/rotas'

type RotaCheckIn = Extract<RotaResolvida, { pagina: 'check-in' }>

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
      <p className="checkin-progresso">
        Pergunta {numero} de {total}
      </p>
      <fieldset className="checkin-pergunta">
        <legend ref={refLegenda} tabIndex={-1}>
          {pergunta.enunciado}
        </legend>
        <div className="opcoes-checkin">
          {pergunta.opcoes.map((opcao) => (
            <label key={opcao.id} className="opcao-checkin">
              <input
                type="radio"
                name={`checkin-${pergunta.id}`}
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
        <p className="muted" id={`checkin-apoio-${pergunta.id}`}>
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
          aria-describedby={escolhida === null ? `checkin-apoio-${pergunta.id}` : undefined}
        >
          <span>{ultima ? 'Ver indicação' : 'Continuar'}</span>
          <Icone nome="avancar" tamanho={20} />
        </button>
      </div>
    </form>
  )
}

/**
 * Página Check-in: perguntas do roteiro, indicação de rota por regra fixa, confirmação e cartão de
 * embarque. Sem rede e sem IA. O cartão só é gravado depois de confirmar.
 */
export function PaginaCheckIn({ rota }: { rota: RotaCheckIn }) {
  const { cartao, definirCartao, avisoGravacao, dispensarAvisoGravacao } = useArmazenamentoJornada()
  const [estado, despachar] = useReducer(reduzirCheckIn, ESTADO_INICIAL_CHECKIN)
  const [emitido, setEmitido] = useState<DadosDoCartao | null>(null)
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

  const perguntas = ROTEIRO_CHECKIN.perguntas
  const respostas = respostasCompletas(estado)
  const indicacao = respostas ? indicarRota(respostas) : null
  const rotaIndicada = indicacao ? rotaPorId(indicacao.rotaId) : null
  const rotaIndisponivel = indicacao ? rotaDeEmbarque(indicacao.rotaId) !== indicacao.rotaId : false
  const rotaDeSuporte = rotaPorId(ROTA_PADRAO_DE_EMBARQUE)

  function confirmar() {
    if (!respostas) return
    const novo = montarCartaoDoCheckIn(respostas, new Date().toISOString())
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
        <h1 className="h1">{NOME_PAGINA['check-in']}</h1>
        <p className="pagina-jornada-texto">
          {rota.rapido
            ? 'Caminho curto: confirme as respostas padrão e embarque. Nada é enviado para fora deste navegador.'
            : 'Três perguntas curtas indicam por onde começar. Não há resposta certa, e nada é enviado para fora deste navegador.'}
        </p>
      </header>

      {rota.rapido && <CheckInRapido />}
      {!rota.rapido && comPerguntas && semCartao && (
        <AvisoHonesto
          acoes={[{ tipo: 'botao', rotulo: 'Ir para a primeira pergunta', aoClicar: () => refLegenda.current?.focus() }]}
        >
          Para abrir o Plano de voo, faça primeiro o check-in. Ele gera o seu cartão de embarque.
        </AvisoHonesto>
      )}

      {!rota.rapido && comPerguntas && cartao && estado.indice === 0 && respostas === null && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: 'Ir para o Plano de voo', href: '/plano-de-voo' }]}>
          Você já tem um cartão de embarque. Se refizer o check-in e confirmar, o cartão novo substitui o anterior e os seus voos
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
        <section className="indicacao-checkin" aria-labelledby="checkin-indicacao-titulo">
          <h2 id="checkin-indicacao-titulo" ref={refTitulo} tabIndex={-1}>
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
                  ? `Embarcar em ${rotaDeSuporte?.nome ?? 'Suporte de TI'}`
                  : 'Confirmar e gerar o cartão de embarque'}
              </span>
            </button>
          </div>
        </section>
      )}

      {!rota.rapido && estado.fase === 'cartao' && emitido && (
        <section className="secao-jornada" aria-labelledby="checkin-concluido-titulo">
          <h2 id="checkin-concluido-titulo" ref={refTitulo} tabIndex={-1}>
            Check-in concluído
          </h2>
          {avisoGravacao && (
            <AvisoHonesto acoes={[{ tipo: 'botao', rotulo: 'Entendi', aoClicar: dispensarAvisoGravacao }]}>
              {avisoGravacao}
            </AvisoHonesto>
          )}
          <CartaoEmbarque cartao={emitido}>
            <LinkInterno href="/plano-de-voo" className="btn btn-primary">
              <Icone nome="plano-de-voo" tamanho={20} />
              <span>Ir para o Plano de voo</span>
            </LinkInterno>
            <button type="button" className="btn btn-secondary" onClick={() => despachar({ tipo: 'reiniciar' })}>
              <Icone nome="virar" tamanho={20} />
              <span>Refazer o check-in</span>
            </button>
          </CartaoEmbarque>
        </section>
      )}

      <PainelComandante papel="consultor" pagina="check-in" />
    </div>
  )
}
