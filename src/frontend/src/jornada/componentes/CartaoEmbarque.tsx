import { useId, type ReactNode } from 'react'
import { Icone } from '../../ui/Icone'
import type { CartaoEmbarque as DadosDoCartao } from '../armazenamento/cartaoEmbarque'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTEIRO_CHECKIN, rotuloDaResposta } from '../catalogos/catalogoVocacional'

interface PropsCartaoEmbarque {
  cartao: DadosDoCartao
  /** Ações do cartão, como o link para o Plano de voo. */
  children?: ReactNode
}

const ORIGENS: Record<DadosDoCartao['origem'], string> = {
  checkin: 'Check-in completo',
  'checkin-rapido': 'Check-in rápido, com respostas padrão',
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? iso : data.toLocaleDateString('pt-BR')
}

/** Cartão de embarque: rota, primeira escala e as respostas que o geraram, por extenso. */
export function CartaoEmbarque({ cartao, children }: PropsCartaoEmbarque) {
  const idTitulo = useId()
  const rota = rotaPorId(cartao.rotaId)
  const escala = rota?.escalas.find((item) => item.id === cartao.primeiraEscalaId)
  return (
    <section className="cartao-embarque" aria-labelledby={idTitulo}>
      <h2 className="cartao-embarque-titulo" id={idTitulo}>
        <Icone nome="embarcar" tamanho={20} />
        <span>Cartão de embarque</span>
      </h2>
      <dl className="cartao-embarque-dados">
        <div>
          <dt>Rota</dt>
          <dd>{rota?.nome ?? cartao.rotaId}</dd>
        </div>
        <div>
          <dt>Primeira escala</dt>
          <dd>{escala?.nome ?? cartao.primeiraEscalaId}</dd>
        </div>
        <div>
          <dt>Emitido em</dt>
          <dd>{formatarData(cartao.emitidoEm)}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{ORIGENS[cartao.origem]}</dd>
        </div>
        {ROTEIRO_CHECKIN.perguntas.map((pergunta) => {
          const resposta = cartao.respostas[pergunta.id]
          return (
            <div key={pergunta.id}>
              <dt>{pergunta.enunciado}</dt>
              <dd>{rotuloDaResposta(pergunta.id, resposta) ?? resposta}</dd>
            </div>
          )
        })}
      </dl>
      {children && <div className="cartao-embarque-acoes">{children}</div>}
    </section>
  )
}
