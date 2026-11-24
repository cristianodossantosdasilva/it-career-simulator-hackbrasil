import { Icone } from '../../ui/Icone'
import type { IdEscala } from '../catalogos/catalogoRotas'
import { type DominioConfig, MODOS_VOO, type ModoCabine, REGRAS_PRONTO_PARA_COMECAR } from './configuracaoVoo'

interface PropsConfiguracaoModoVoo {
  modo: ModoCabine
  aoMudarModo: (modo: ModoCabine) => void
  dominios: readonly DominioConfig[]
  dominiosSelecionados: readonly IdEscala[]
  aoAlternarDominio?: (id: IdEscala) => void
  aoSelecionarTodosDominios?: () => void
  mostrarRegras?: boolean
  acaoPrincipal?: {
    rotulo: string
    aoClicar: () => void
    desabilitado?: boolean
  }
}

/**
 * Painel de configuração do simulador inspirado no fluxo de preparo: escolha entre Modo Treino e
 * Modo Missão, seletor de domínios com peso e quadro Pronto para começar com as cinco regras.
 */
export function ConfiguracaoModoVoo({
  modo,
  aoMudarModo,
  dominios,
  dominiosSelecionados,
  aoAlternarDominio,
  aoSelecionarTodosDominios,
  mostrarRegras = true,
  acaoPrincipal,
}: PropsConfiguracaoModoVoo) {
  const todosSelecionados = dominiosSelecionados.length === dominios.length

  return (
    <section className="secao-jornada" aria-labelledby="config-voo-titulo">
      <h2 id="config-voo-titulo" className="h2">
        Configuração da missão
      </h2>
      <p className="muted">
        Escolha como deseja operar os chamados na Mesa de Trabalho e quais domínios priorizar nesta sessão.
      </p>

      <div className="grade-modos-voo" role="group" aria-label="Modo de operação">
        {MODOS_VOO.map((item) => {
          const ativo = modo === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={ativo}
              className={ativo ? 'cartao-modo-voo cartao-modo-voo-ativo' : 'cartao-modo-voo'}
              onClick={() => aoMudarModo(item.id)}
            >
              <span className="cartao-modo-voo-topo">
                <strong>{item.titulo}</strong>
                <span className="selo-status">{ativo ? 'Selecionado' : 'Disponível'}</span>
              </span>
              <span className="muted">{item.subtitulo}</span>
              <span>{item.descricao}</span>
              <ul className="lista-simples">
                {item.destaques.map((destaque) => (
                  <li key={destaque}>{destaque}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {dominios.length > 0 && (
        <div className="seletor-dominios" role="group" aria-labelledby="dominios-titulo">
          <div className="acoes-linha">
            <h3 id="dominios-titulo" className="h3">
              Domínios da rota e peso na operação
            </h3>
            {aoSelecionarTodosDominios && !todosSelecionados && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={aoSelecionarTodosDominios}>
                Selecionar todos
              </button>
            )}
          </div>
          <div className="grade-chips-dominios">
            {dominios.map((dominio) => {
              const marcado = dominiosSelecionados.includes(dominio.id)
              return (
                <button
                  key={dominio.id}
                  type="button"
                  aria-pressed={marcado}
                  disabled={!aoAlternarDominio}
                  className={marcado ? 'chip-dominio chip-dominio-ativo' : 'chip-dominio'}
                  onClick={() => aoAlternarDominio?.(dominio.id)}
                >
                  <span className="chip-dominio-nome">{dominio.nome}</span>
                  <span className="dado-mono">{dominio.peso}%</span>
                  <span className="muted">
                    {dominio.missoesConcluidas}/{dominio.missoesTotal}
                  </span>
                  {dominio.recomendado && <span className="selo-status">Recomendado</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {mostrarRegras && (
        <div className="quadro-pronto-comecar" role="region" aria-labelledby="pronto-comecar-titulo">
          <h3 id="pronto-comecar-titulo" className="h3">
            Pronto para começar?
          </h3>
          <ol className="lista-regras-voo">
            {REGRAS_PRONTO_PARA_COMECAR.map((regra) => (
              <li key={regra}>{regra}</li>
            ))}
          </ol>
          {acaoPrincipal && (
            <div className="acoes-linha">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={acaoPrincipal.desabilitado}
                onClick={acaoPrincipal.aoClicar}
              >
                <Icone nome="embarcar" tamanho={20} />
                <span>{acaoPrincipal.rotulo}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
