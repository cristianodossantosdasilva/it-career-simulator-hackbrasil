import { Icone } from '../../ui/Icone'
import { SlaMeter } from '../../ui/SlaMeter'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useVoo } from '../contextosJornada'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA } from '../navegacao/rotas'
import { DadosDaSessao } from './DadosDaSessao'
import { type ModoCabine, chamadoEmFoco, chamadoEncerrado } from './filaDeChamados'
import './cabine.css'

interface Props {
  missao: string
  modo: ModoCabine
  aoMudarModo: (modo: ModoCabine) => void
  focoId: string | null
}

const NOTA_DO_MODO: Record<ModoCabine, string> = {
  treino: 'Treino: dicas e próximo passo à vista, sem SLA cobrado.',
  missao: 'Missão: SLA cronometrado, sem dicas. A avaliação do Juiz 360° vem no fim.',
}

/** Cabeçalho da Cabine: "Chamado X de N", barra de progresso, SLA, modo e Sair com progresso salvo. */
export function CabecalhoDaCabine({ missao, modo, aoMudarModo, focoId }: Props) {
  const { sessao } = useVoo()
  if (!sessao) return null
  const total = sessao.chamados.length
  const emFoco = chamadoEmFoco(sessao.chamados, focoId)
  const posicao = emFoco ? sessao.chamados.findIndex((c) => c.id === emFoco.id) + 1 : 0
  const resolvidos = sessao.chamados.filter(chamadoEncerrado).length

  return (
    <header className="cabine-titulo">
      <div className="cabine-titulo-linha">
        <h1>{NOME_PAGINA.cabine}</h1>
        <span className="dado-contexto">{textosDaMissao(missao).titulo}</span>
        <DadosDaSessao />
      </div>
      <div className="cabine-titulo-linha">
        <div className="cabine-progresso">
          <span className="cabine-progresso-texto">
            Chamado <span className="dado-mono">{posicao}</span> de <span className="dado-mono">{total}</span>
          </span>
          <progress
            className="cabine-progresso-barra"
            value={resolvidos}
            max={Math.max(1, total)}
            aria-label={`Progresso da missão: ${resolvidos} de ${total} chamados resolvidos`}
          />
        </div>
        {modo === 'missao' && emFoco && (
          <div className="cabine-sla" aria-label="SLA do chamado atual">
            <SlaMeter
              abertoEmMinuto={emFoco.abertoEmMinuto}
              alvoMinuto={emFoco.slaAlvoMinuto}
              minutoAtual={sessao.meta.minutoSimulado}
              vencido={emFoco.slaVencido}
              encerrado={chamadoEncerrado(emFoco)}
            />
          </div>
        )}
        <div className="cabine-modo" role="group" aria-label="Modo da Cabine">
          <button type="button" aria-pressed={modo === 'treino'} onClick={() => aoMudarModo('treino')}>
            Treino
          </button>
          <button type="button" aria-pressed={modo === 'missao'} onClick={() => aoMudarModo('missao')}>
            Missão
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary cabine-sair"
          title="O progresso fica salvo neste navegador. Retome pelo Plano de voo."
          onClick={() => navegar('/plano-de-voo')}
        >
          <Icone nome="fechar" tamanho={16} />
          Sair e salvar progresso
        </button>
        <p className="cabine-nota-modo" role="status">
          {NOTA_DO_MODO[modo]}
        </p>
      </div>
    </header>
  )
}
