import { useId, type ReactNode } from 'react'
import { Icone } from '../../ui/Icone'
import type { CartaoPerfil as DadosDoCartao } from '../armazenamento/cartaoPerfil'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTEIRO_DIAGNOSTICO, rotuloDaResposta } from '../catalogos/catalogoVocacional'

interface PropsCartaoPerfil {
  cartao: DadosDoCartao
  /** Ações do cartão, como o link para o Plano de Carreira. */
  children?: ReactNode
}

const ORIGENS: Record<DadosDoCartao['origem'], string> = {
  diagnostico: 'Diagnóstico completo',
  'diagnostico-rapido': 'Diagnóstico rápido, com respostas padrão',
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? iso : data.toLocaleDateString('pt-BR')
}

/** Cartão de Perfil: rota, primeira etapa e as respostas que o geraram, por extenso. */
export function CartaoPerfil({ cartao, children }: PropsCartaoPerfil) {
  const idTitulo = useId()
  const rota = rotaPorId(cartao.rotaId)
  const etapa = rota?.etapas.find((item) => item.id === cartao.primeiraEtapaId)
  return (
    <section className="cartao-perfil" aria-labelledby={idTitulo}>
      <h2 className="cartao-perfil-titulo" id={idTitulo}>
        <Icone nome="iniciar" tamanho={20} />
        <span>Cartão de Perfil</span>
      </h2>
      <dl className="cartao-perfil-dados">
        <div>
          <dt>Rota</dt>
          <dd>{rota?.nome ?? cartao.rotaId}</dd>
        </div>
        <div>
          <dt>Primeira etapa</dt>
          <dd>{etapa?.nome ?? cartao.primeiraEtapaId}</dd>
        </div>
        <div>
          <dt>Emitido em</dt>
          <dd>{formatarData(cartao.emitidoEm)}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{ORIGENS[cartao.origem]}</dd>
        </div>
        {ROTEIRO_DIAGNOSTICO.perguntas.map((pergunta) => {
          const resposta = cartao.respostas[pergunta.id]
          return (
            <div key={pergunta.id}>
              <dt>{pergunta.enunciado}</dt>
              <dd>{rotuloDaResposta(pergunta.id, resposta) ?? resposta}</dd>
            </div>
          )
        })}
      </dl>
      {children && <div className="cartao-perfil-acoes">{children}</div>}
    </section>
  )
}
