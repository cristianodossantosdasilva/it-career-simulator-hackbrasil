import { Icone } from '../../ui/Icone'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { ListaEtapas } from '../componentes/ListaEtapas'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA } from '../navegacao/rotas'
import { calcularProgressoRota } from '../progressoRota'

/** Página Praticar (Nível Prático): chamados guiados com pistas na Mesa de Trabalho. */
export function PaginaPraticar() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_PERFIL)
  const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.praticar}</h1>
        <p className="pagina-jornada-texto">
          Nível Prático: atenda chamados guiados na Mesa de Trabalho com até 3 pistas progressivas por cenário.
        </p>
      </header>

      <div className="acoes-linha">
        <LinkInterno href="/simulados" className="btn btn-secondary">
          <Icone nome="simulados" tamanho={20} />
          <span>Configurar simulado de Lab</span>
        </LinkInterno>
      </div>

      <ListaEtapas visoes={visoes} />
      <PainelMentor papel="instrutor" pagina="praticar" />
    </div>
  )
}
