import { Icone } from '../ui/Icone'
import {
  type ContextoRoteiro,
  type FerramentaLab,
  ROTULO_FERRAMENTA,
  roteiroDoCenario,
} from './roteiros'

interface MissionGuideProps {
  cenarioId: string
  contexto: ContextoRoteiro
  /** Texto do proximo passo calculado pelo App a partir do estado da sessao. */
  proximoPasso: string
  tituloMissao: string
  onAbrirFerramenta: (ferramenta: FerramentaLab) => void
  onAbrirRevisao: () => void
}

/** Resume o roteiro e o checklist da missao. A conclusao de cada passo vem so da projecao do motor. */
export function MissionGuide({
  cenarioId,
  contexto,
  proximoPasso,
  tituloMissao,
  onAbrirFerramenta,
  onAbrirRevisao,
}: MissionGuideProps) {
  const roteiro = roteiroDoCenario(cenarioId)
  const feitos = roteiro.passos.map((passo) => passo.concluido(contexto))
  const totalFeitos = feitos.filter(Boolean).length
  const indiceAtivo = feitos.findIndex((feito) => !feito)
  const completo = indiceAtivo === -1

  return (
    <aside className="lab-guia" id="lab-guia" aria-label="Guia da missão">
      <div className="lab-guia-cabecalho">
        <h2 className="lab-guia-titulo">Guia da missão</h2>
        <p className="lab-guia-missao">{tituloMissao}</p>
        <p className="lab-guia-objetivo">{roteiro.objetivo}</p>
      </div>

      <div className="lab-guia-andamento">
        <p className="lab-guia-contagem">
          <span className="dado-mono">{totalFeitos}</span> de <span className="dado-mono">{roteiro.passos.length}</span>{' '}
          passos concluídos
        </p>
        <progress className="medidor" value={totalFeitos} max={roteiro.passos.length} aria-label="Passos da missão concluídas" />
      </div>

      <ol className="checklist" aria-label="Checklist da missão">
        {roteiro.passos.map((passo, indice) => {
          const feito = feitos[indice]
          const ativo = indice === indiceAtivo
          return (
            <li
              key={passo.id}
              className={`checklist-item ${feito ? 'feito' : ''} ${ativo ? 'ativo' : ''}`}
              aria-current={ativo ? 'step' : undefined}
            >
              <span className="checklist-marca" aria-hidden="true">
                {feito ? <Icone nome="confirmar" tamanho={16} /> : <span className="dado-mono">{indice + 1}</span>}
              </span>
              <div className="checklist-corpo">
                <p className="checklist-titulo">
                  {passo.titulo}
                  {feito && <span className="sr-only"> (concluído)</span>}
                </p>
                {ativo && <p className="checklist-detalhe">{passo.detalhe}</p>}
                {ativo && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAbrirFerramenta(passo.ferramenta)}
                  >
                    Abrir {ROTULO_FERRAMENTA[passo.ferramenta]}
                    <Icone nome="avancar" tamanho={16} />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="lab-guia-proximo" aria-live="polite">
        <h3 className="lab-guia-subtitulo">Próximo passo</h3>
        <p>{proximoPasso}</p>
        {completo && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onAbrirRevisao}>
            Revisar na Revisão
            <Icone nome="avancar" tamanho={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
