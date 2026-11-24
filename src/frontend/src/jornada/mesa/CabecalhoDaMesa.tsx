import { useEffect, useRef } from 'react'
import { Icone } from '../../ui/Icone'
import { SlaMeter } from '../../ui/SlaMeter'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useMissao } from '../contextosJornada'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA } from '../navegacao/rotas'
import { DadosDaSessao } from './DadosDaSessao'
import { type ModoMesa, chamadoEmFoco, chamadoEncerrado } from './filaDeChamados'
import './mesa.css'

interface Props {
  missao: string
  modo: ModoMesa
  aoMudarModo: (modo: ModoMesa) => void
  focoId: string | null
}

const NOTA_DO_MODO: Record<ModoMesa, string> = {
  treino: 'Treino: dicas e próximo passo à vista, sem SLA cobrado.',
  missao: 'Missão: SLA cronometrado, sem dicas. A avaliação do Juiz 360° vem no fim.',
}

/** Cabeçalho da Mesa de Trabalho: "Chamado X de N", barra de progresso, SLA, modo e Sair com progresso salvo. */
export function CabecalhoDaMesa({ missao, modo, aoMudarModo, focoId }: Props) {
  const { sessao } = useMissao()
  const titulo = useRef<HTMLHeadingElement>(null)
  const temSessao = Boolean(sessao)
  // O h1 da página de espera é substituído por este: devolve o foco ao título novo se ele ficou no corpo da página.
  useEffect(() => {
    if (temSessao && (!document.activeElement || document.activeElement === document.body)) titulo.current?.focus()
  }, [temSessao])
  if (!sessao) return null
  const total = sessao.chamados.length
  const emFoco = chamadoEmFoco(sessao.chamados, focoId)
  const posicao = emFoco ? sessao.chamados.findIndex((c) => c.id === emFoco.id) + 1 : 0
  const resolvidos = sessao.chamados.filter(chamadoEncerrado).length

  return (
    <header className="mesa-titulo">
      <div className="mesa-titulo-linha">
        <h1 ref={titulo} tabIndex={-1}>{NOME_PAGINA['mesa-de-trabalho']}</h1>
        <span className="dado-contexto">{textosDaMissao(missao).titulo}</span>
        <DadosDaSessao />
      </div>
      <div className="mesa-titulo-linha">
        <div className="mesa-progresso">
          <span className="mesa-progresso-texto">
            Chamado <span className="dado-mono">{posicao}</span> de <span className="dado-mono">{total}</span>
          </span>
          <progress
            className="mesa-progresso-barra"
            value={resolvidos}
            max={Math.max(1, total)}
            aria-label={`Progresso da missão: ${resolvidos} de ${total} chamados resolvidos`}
          />
        </div>
        {modo === 'missao' && emFoco && (
          <div className="mesa-sla" aria-label="SLA do chamado atual">
            <SlaMeter
              abertoEmMinuto={emFoco.abertoEmMinuto}
              alvoMinuto={emFoco.slaAlvoMinuto}
              minutoAtual={sessao.meta.minutoSimulado}
              vencido={emFoco.slaVencido}
              encerrado={chamadoEncerrado(emFoco)}
            />
          </div>
        )}
        <div className="mesa-modo" role="group" aria-label="Modo da Mesa de Trabalho">
          <button type="button" aria-pressed={modo === 'treino'} onClick={() => aoMudarModo('treino')}>
            Treino
          </button>
          <button type="button" aria-pressed={modo === 'missao'} onClick={() => aoMudarModo('missao')}>
            Missão
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary mesa-sair"
          title="O progresso fica salvo neste navegador. Retome pelo Plano de Carreira."
          onClick={() => navegar('/plano-de-carreira')}
        >
          <Icone nome="fechar" tamanho={16} />
          Sair e salvar progresso
        </button>
        <p className="mesa-nota-modo" role="status">
          {NOTA_DO_MODO[modo]}
        </p>
      </div>
    </header>
  )
}
