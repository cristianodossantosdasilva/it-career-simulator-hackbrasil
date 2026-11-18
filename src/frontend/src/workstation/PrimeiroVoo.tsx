import { LEVELS, type NivelEducacional, type obterProximaAcao } from '../educacao/catalogoEducacional'
import { Icone } from '../ui/Icone'

type ProximaAcao = ReturnType<typeof obterProximaAcao>

interface PrimeiroVooProps {
  /** Ha progresso salvo (aula concluida, laboratorio concluido ou XP). */
  temProgresso: boolean
  /** Existe um turno de laboratorio em memoria que pode ser retomado. */
  sessaoAtiva: boolean
  proximaAcao: ProximaAcao
  nivelFoco: NivelEducacional
  progressoFoco: { t: number; f: number; p: number }
  ocupado: boolean
  onIniciarPrimeiroVoo: () => void
  onEstudarAntes: () => void
  onExecutarProximaAcao: () => void
  onRetomarLaboratorio: () => void
}

function descreverAcao(acao: ProximaAcao, nivel: NivelEducacional): { titulo: string; detalhe: string } {
  switch (acao.phase) {
    case 'theory':
      return { titulo: acao.title, detalhe: `Próxima aula do nível ${nivel.nome}.` }
    case 'fix':
      return { titulo: acao.title, detalhe: 'Repetição espaçada, cerca de 5 minutos.' }
    case 'practice':
      return {
        titulo: `Laboratório do nível ${nivel.nome}`,
        detalhe: 'Prática guiada no Split-Screen, cerca de 15 minutos.',
      }
    default:
      return {
        titulo: 'Jornada completa',
        detalhe: `Você concluiu os ${LEVELS.length} níveis do MVP. Exporte e valide sua credencial.`,
      }
  }
}

function PassoFluxo({ numero, titulo, descricao, estado, concluido }: {
  numero: number
  titulo: string
  descricao: string
  estado: string
  concluido: boolean
}) {
  return (
    <li className="fluxo-passo">
      <span className="fluxo-numero dado-mono" aria-hidden="true">
        {numero}
      </span>
      <div className="fluxo-corpo">
        <h3 className="fluxo-titulo">{titulo}</h3>
        <p className="fluxo-descricao">{descricao}</p>
        <p className={`fluxo-estado ${concluido ? 'concluido' : ''}`}>
          {concluido && <Icone nome="confirmar" tamanho={16} />}
          {estado}
        </p>
      </div>
    </li>
  )
}

/**
 * Objeto central da home: o proximo passo do aluno e o fluxo Estudar, Praticar no Split-Screen,
 * Revisar na Caixa-Preta. Sem progresso vira "Iniciar primeiro voo".
 */
export function PrimeiroVoo({
  temProgresso,
  sessaoAtiva,
  proximaAcao,
  nivelFoco,
  progressoFoco,
  ocupado,
  onIniciarPrimeiroVoo,
  onEstudarAntes,
  onExecutarProximaAcao,
  onRetomarLaboratorio,
}: PrimeiroVooProps) {
  const retomando = sessaoAtiva || temProgresso
  const acao = descreverAcao(proximaAcao, nivelFoco)

  return (
    <section className="primeiro-voo" aria-labelledby="primeiro-voo-titulo">
      <div className="primeiro-voo-principal">
        <p className="primeiro-voo-contexto">
          <Icone nome="laboratorio" tamanho={16} />
          Aurora Logística, empresa fictícia com dados sintéticos
        </p>
        <h2 id="primeiro-voo-titulo" className="primeiro-voo-titulo">
          {retomando ? 'Retomar missão' : 'Iniciar primeiro voo'}
        </h2>

        {sessaoAtiva ? (
          <>
            <p className="primeiro-voo-texto">Há um turno em andamento no laboratório. Ele continua de onde você parou.</p>
            <div className="primeiro-voo-acoes">
              <button type="button" className="btn btn-primary btn-lg" onClick={onRetomarLaboratorio}>
                Retomar laboratório
                <Icone nome="avancar" />
              </button>
            </div>
          </>
        ) : temProgresso ? (
          <>
            <p className="primeiro-voo-destaque">{acao.titulo}</p>
            <p className="primeiro-voo-texto">{acao.detalhe}</p>
            <div className="primeiro-voo-acoes">
              <button type="button" className="btn btn-primary btn-lg" disabled={ocupado} onClick={onExecutarProximaAcao}>
                {proximaAcao.cta}
                <Icone nome="avancar" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="primeiro-voo-texto">
              Comece pelo Help Desk N1, a primeira escala da rota. Um pedido de reset de senha chega ao ITSM. Você
              confirma a identidade de quem pede, escolhe a menor ação e depois revê a decisão na Caixa-Preta.
            </p>
            <div className="primeiro-voo-acoes">
              <button type="button" className="btn btn-primary btn-lg" disabled={ocupado} onClick={onIniciarPrimeiroVoo}>
                Iniciar primeiro voo
                <Icone nome="avancar" />
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={onEstudarAntes}>
                Estudar antes
              </button>
            </div>
          </>
        )}
      </div>

      <ol className="fluxo" aria-label="Fluxo do primeiro voo">
        <PassoFluxo
          numero={1}
          titulo="Estudar"
          descricao="Aulas curtas com analogias e flashcards do nível em foco."
          estado={`Teoria em ${progressoFoco.t}%`}
          concluido={progressoFoco.t === 100}
        />
        <PassoFluxo
          numero={2}
          titulo="Praticar no Split-Screen"
          descricao="Chamado simulado com o roteiro e o checklist da missão ao lado do console."
          estado={progressoFoco.p === 100 ? 'Laboratório concluído' : 'Laboratório não concluído'}
          concluido={progressoFoco.p === 100}
        />
        <PassoFluxo
          numero={3}
          titulo="Revisar na Caixa-Preta"
          descricao="Linha do tempo das suas decisões, avaliação por critério e credencial verificável."
          estado={sessaoAtiva ? 'Disponível no turno atual' : 'Disponível depois do primeiro turno'}
          concluido={false}
        />
      </ol>
    </section>
  )
}
