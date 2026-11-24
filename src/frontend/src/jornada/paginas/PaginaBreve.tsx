import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import { CredencialView } from '../../workstation/CredencialView'
import type { NivelEducacional } from '../../educacao/catalogoEducacional'
import type { RegistroDeVoo } from '../armazenamento/registrosVoo'
import { type Escala, rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_EMBARQUE } from '../catalogos/regrasIndicacao'
import { PainelComandante } from '../comandante/PainelComandante'
import { GrupoVertente } from '../componentes/GrupoVertente'
import { formatarDataDoRegistro } from '../componentes/formatarDataDoRegistro'
import { SecaoBrevePiloto } from '../componentes/SecaoBrevePiloto'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { useAcademia } from '../contextosJornada'
import { LinkInterno } from '../navegacao/LinkInterno'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA } from '../navegacao/rotas'
import { useDestinoDaPratica } from '../navegacao/usarDestinoDaPratica'
import { type GrupoBreve, agruparRegistros, calcularBrevePiloto } from '../progressoRota'

function RegistroNoBreve({ registro, link }: { registro: RegistroDeVoo; link: string }) {
  const { titulo } = textosDaMissao(registro.missao)
  const { resultado } = registro
  return (
    <li className="registro-voo">
      <div className="registro-voo-dados">
        <span className="registro-voo-titulo">{titulo}</span>
        <span className="registro-voo-meta">
          Concluído em {formatarDataDoRegistro(registro.concluidoEm)}. XP {resultado.xpTotal}.
          {resultado.incidenteSeguranca ? ' Incidente de segurança registrado.' : ''}
        </span>
        <span className="registro-voo-meta">Resultado do Juiz 360º: {resultado.resumo}</span>
      </div>
      <LinkInterno href={link} className="btn btn-secondary btn-sm">
        <Icone nome="credencial" tamanho={16} />
        <span>
          Abrir a Caixa-preta<span className="sr-only"> de {titulo}</span>
        </span>
      </LinkInterno>
    </li>
  )
}

function ListaDeRegistros({ grupo }: { grupo: GrupoBreve }) {
  return (
    <ul className="lista-registros">
      {grupo.registros.map((registro) => (
        <RegistroNoBreve key={registro.sessaoId} registro={registro} link={grupo.linkCaixaPreta(registro)} />
      ))}
    </ul>
  )
}

function EscalaDoBreve({ escala, grupos }: { escala: Escala; grupos: readonly GrupoBreve[] }) {
  const idTitulo = useId()
  return (
    <section className="secao-jornada" aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>{escala.nome}</h3>
      {grupos.map((grupo) =>
        grupo.vertente ? (
          <GrupoVertente key={grupo.vertente.id} nome={grupo.vertente.nome} nivelTitulo={4}>
            <ListaDeRegistros grupo={grupo} />
          </GrupoVertente>
        ) : (
          <ListaDeRegistros key={escala.id} grupo={grupo} />
        ),
      )}
    </section>
  )
}

/** Um bloco por etapa, na ordem da rota. A N3 Sênior ganha um subgrupo por Vertente. */
function agruparPorEscala(grupos: readonly GrupoBreve[]) {
  const porEscala: { escala: Escala; grupos: GrupoBreve[] }[] = []
  for (const grupo of grupos) {
    const existente = porEscala.find((item) => item.escala.id === grupo.escala.id)
    if (existente) existente.grupos.push(grupo)
    else porEscala.push({ escala: grupo.escala, grupos: [grupo] })
  }
  return porEscala
}

/**
 * Portfólio: Portfólio de analista, missões registrados e Credencial. Tudo vem do Armazenamento_Local e do estado da
 * Academia, sem requisição ao servidor e sem ler o Modo_de_Demonstração. O resultado de cada missão é o
 * texto do Juiz 360º, copiado como foi recebido.
 */
export function PaginaBreve() {
  const { registros } = useArmazenamentoJornada()
  const { estadoAcademia, resumoCarreira, apelido, setApelido, atualizarResumoCarreira } = useAcademia()
  const rota = rotaPorId(ROTA_PADRAO_DE_EMBARQUE)
  const grupos = rota ? agruparRegistros(rota, registros) : []
  const visao = rota ? calcularBrevePiloto(rota, registros) : null
  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp

  const destinoDaPratica = useDestinoDaPratica()

  /** Etapa liberada (ou modo de demonstração): Mesa de Trabalho da missão. Bloqueada: Plano de Carreira, nunca a Mesa de Trabalho. */
  function praticar(nivel: NivelEducacional) {
    navegar(destinoDaPratica(nivel.cenarioId).endereco)
  }

  function avisoDaPratica(nivel: NivelEducacional): string | null {
    const destino = destinoDaPratica(nivel.cenarioId)
    return destino.tipo === 'plano-de-voo' ? destino.aviso : null
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.breve}</h1>
        <p className="pagina-jornada-texto">
          Seus missões concluídos, guardados neste navegador, e o que falta para o Portfólio de analista.
        </p>
      </header>
      {visao && <SecaoBrevePiloto visao={visao} nivelTitulo={2} />}
      <section className="secao-jornada" aria-labelledby="breve-voos">
        <h2 id="breve-voos">Missões registrados</h2>
        {grupos.length === 0 ? (
          <div className="estado-vazio">
            <p>Você ainda não tem missões registrados. Conclua uma missão na Mesa de Trabalho e ela aparece aqui.</p>
            <LinkInterno href="/plano-de-voo" className="btn btn-primary">
              <Icone nome="plano-de-voo" tamanho={20} />
              <span>Ir para o Plano de Carreira</span>
            </LinkInterno>
          </div>
        ) : (
          agruparPorEscala(grupos).map((item) => <EscalaDoBreve key={item.escala.id} escala={item.escala} grupos={item.grupos} />)
        )}
      </section>
      <CredencialView
        estado={estadoAcademia}
        xpTotal={xpExibido}
        resumoCarreira={resumoCarreira}
        apelido={apelido}
        onApelidoChange={setApelido}
        onAtualizarCarreira={(nome) => void atualizarResumoCarreira(undefined, nome)}
        onPraticar={praticar}
        avisoDaPratica={avisoDaPratica}
        nivelTitulo={2}
      />
      <PainelComandante papel="mentor" pagina="breve" />
    </div>
  )
}
