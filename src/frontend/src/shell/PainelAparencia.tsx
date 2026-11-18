import type { ArmazemAparencia } from '../tema/armazemAparencia'
import { type IdTema, obterTema } from '../tema/catalogo'
import { useAparencia } from '../tema/useAparencia'
import { Icone } from '../ui/Icone'

export interface PainelAparenciaProps {
  readonly id: string
  readonly aoAnunciar: (texto: string) => void
  /** Só para testes: troca o armazém único da aplicação. */
  readonly armazem?: ArmazemAparencia
}

const NOME_NO_GRUPO = 'itfs-tema'

/**
 * Painel de aparência: escolha de tema por grupo de rádios nativos (o teclado do radiogroup vem do
 * navegador), interruptor de alto contraste e, com trava do cliente, só a informação do tema definido.
 */
export function PainelAparencia({ id, aoAnunciar, armazem }: PainelAparenciaProps) {
  const { tema, contraste, temasOferecidos, modoSeletor, escolherTema, definirContraste } = useAparencia(armazem)
  const ativo = obterTema(tema)

  return (
    <div id={id} className="painel-aparencia" role="region" aria-label="Aparência">
      {modoSeletor === 'livre' && (
        <fieldset className="seletor-tema">
          <legend className="seletor-tema-titulo">Tema</legend>
          {temasOferecidos.map((opcao) => {
            const marcado = opcao.id === tema
            return (
              <label key={opcao.id} className="opcao-tema">
                <input
                  type="radio"
                  name={NOME_NO_GRUPO}
                  value={opcao.id}
                  checked={marcado}
                  onChange={() => {
                    if (escolherTema(opcao.id as IdTema)) aoAnunciar(`Tema ativo: ${opcao.nome}`)
                  }}
                />
                <span className="opcao-tema-nome">{opcao.nome}</span>
                <span className="opcao-tema-esquema">{opcao.esquema === 'claro' ? 'Claro' : 'Escuro'}</span>
                {marcado && <Icone nome="confirmar" tamanho={16} />}
              </label>
            )
          })}
        </fieldset>
      )}
      {modoSeletor === 'travado' && (
        <div className="tema-definido">
          <Icone nome="trava" tamanho={16} />
          <div>
            <p className="tema-definido-nome">Tema: {ativo.nome}</p>
            <p className="tema-definido-origem">Definido pela empresa cliente</p>
          </div>
        </div>
      )}
      {modoSeletor === 'unico' && <p className="tema-definido tema-definido-nome">Tema: {ativo.nome}</p>}
      <label className="controle-contraste">
        <input
          type="checkbox"
          role="switch"
          checked={contraste === 'alto'}
          onChange={(evento) => definirContraste(evento.target.checked)}
        />
        <Icone nome="alto-contraste" tamanho={16} />
        <span>Alto contraste</span>
      </label>
    </div>
  )
}
