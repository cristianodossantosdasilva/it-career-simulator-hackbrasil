import { Icone } from '../../ui/Icone'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, type RotaResolvida } from '../navegacao/rotas'

type Rota404 = Extract<RotaResolvida, { pagina: 'nao-encontrada' }>

/**
 * Página não encontrada. Diz qual endereço ou missão não existe e dá o caminho de volta: o Início
 * sempre, e o Plano de voo quando há cartão de embarque ou quando a missão informada é que não existe.
 */
export function Pagina404({ rota }: { rota: Rota404 }) {
  const { cartao } = useArmazenamentoJornada()
  const ofereceOPlano = cartao !== null || rota.missaoDesconhecida !== null
  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['nao-encontrada']}</h1>
        {rota.missaoDesconhecida !== null ? (
          <p className="pagina-jornada-texto">
            A missão <strong>{rota.missaoDesconhecida}</strong> não existe no catálogo de rotas. Escolha uma missão no Plano
            de voo.
          </p>
        ) : (
          <p className="pagina-jornada-texto">
            O endereço <strong>{rota.caminho}</strong> não existe nesta aplicação.
          </p>
        )}
      </header>
      <div className="acoes-linha">
        <LinkInterno href="/" className="btn btn-primary">
          <Icone nome="marca" tamanho={20} />
          <span>Ir para o Início</span>
        </LinkInterno>
        {ofereceOPlano && (
          <LinkInterno href="/plano-de-voo" className="btn btn-secondary">
            <Icone nome="plano-de-voo" tamanho={20} />
            <span>Ir para o Plano de voo</span>
          </LinkInterno>
        )}
      </div>
    </div>
  )
}
