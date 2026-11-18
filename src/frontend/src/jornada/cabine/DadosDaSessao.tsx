import { Icone } from '../../ui/Icone'
import { useVoo } from '../contextosJornada'

/**
 * Dados do turno e botões das gavetas, no cabeçalho da Cabine. Sair da Cabine é pelo menu: a sessão
 * continua em memória.
 */
export function DadosDaSessao() {
  const { sessao, gaveta, setGaveta } = useVoo()
  if (!sessao) return null
  return (
    <div className="barra-contexto-acoes">
      <span className="dado-contexto hide-sm">
        <span className="dado-contexto-rotulo">Nível</span> {sessao.meta.nivel}
      </span>
      <span className="dado-contexto">
        <Icone nome="relogio" tamanho={16} />
        <span className="dado-mono">{sessao.meta.minutoSimulado} min</span>
        <span className="sr-only">de tempo simulado</span>
      </span>
      <span className="dado-contexto hide-sm">
        <span className="dado-contexto-rotulo">Semente</span> <span className="dado-mono">{sessao.meta.semente}</span>
      </span>
      <span className="dado-contexto hide-sm">
        <span className="dado-contexto-rotulo">Seq</span> <span className="dado-mono">{sessao.ultimoSeq}</span>
      </span>
      <button
        type="button"
        className="botao-contexto"
        aria-pressed={gaveta === 'notas'}
        onClick={() => setGaveta((atual) => (atual === 'notas' ? null : 'notas'))}
      >
        <Icone nome="notas" />
        <span className="botao-contexto-texto">Minhas notas</span>
      </button>
      <button
        type="button"
        className="botao-contexto"
        aria-pressed={gaveta === 'tutor'}
        onClick={() => setGaveta((atual) => (atual === 'tutor' ? null : 'tutor'))}
      >
        <Icone nome="conversa" />
        <span className="botao-contexto-texto">Comandante</span>
      </button>
    </div>
  )
}
