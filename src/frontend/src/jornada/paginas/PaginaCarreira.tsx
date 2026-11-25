import { Icone } from '../../ui/Icone'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { ListaEtapas } from '../componentes/ListaEtapas'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { ControleModoDemonstracao } from '../demonstracao/ControleModoDemonstracao'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA } from '../navegacao/rotas'
import { calcularProgressoRota } from '../progressoRota'
import { lerHistorico } from '../simulados/historico'

/** Página Carreira: jornada, plano de estudo por domínio e acesso ao diagnóstico. */
export function PaginaCarreira() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_PERFIL)
  const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []
  const historico = lerHistorico()
  const etapasConcluidas = visoes.filter((v) => v.estado === 'concluida').length

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.carreira}</h1>
        <p className="pagina-jornada-texto">
          {rota ? `Rota ${rota.nome}. ` : ''}Acompanhe sua jornada pelas etapas, ajuste o plano de estudo e refaça o diagnóstico quando quiser.
        </p>
      </header>

      <div className="certsim-grade-3">
        <article className="certsim-cartao">
          <p className="eyebrow">Etapas concluídas</p>
          <p className="certsim-kpi dado-mono">
            {etapasConcluidas} de {visoes.length}
          </p>
          <p className="muted">Cada etapa concluída libera a seguinte no atendimento prático.</p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Simulados e provas</p>
          <p className="certsim-kpi dado-mono">{historico.length}</p>
          <p className="muted">Tentativas registradas no histórico local deste navegador.</p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Diagnóstico vocacional</p>
          <p className="pagina-jornada-texto">{cartao ? 'Cartão de perfil ativo' : 'Ainda não realizado'}</p>
          <div className="acoes-linha">
            <LinkInterno href="/diagnostico" className="btn btn-secondary">
              <Icone nome="diagnostico" tamanho={20} />
              <span>{cartao ? 'Refazer diagnóstico' : 'Fazer diagnóstico'}</span>
            </LinkInterno>
          </div>
        </article>
      </div>

      <section className="secao-jornada" aria-labelledby="carreira-plano-titulo">
        <h2 id="carreira-plano-titulo" className="h2">
          Plano de estudo sugerido
        </h2>
        <div className="certsim-cartao">
          <ol className="certsim-lista-regras">
            <li>Comece pelo nível Teórico em Aprender para fixar fundamentos por domínio.</li>
            <li>Pratique chamados guiados com pistas em Praticar antes de avançar de etapa.</li>
            <li>Valide sua prontidão em Simulados e Provas (70% ou mais para aprovação).</li>
            <li>Revise os erros no Reforço diário e consulte o Painel para acompanhar evolução.</li>
          </ol>
          <div className="acoes-linha">
            <LinkInterno href="/plano-de-carreira" className="btn btn-primary">
              <Icone nome="plano-de-carreira" tamanho={20} />
              <span>Abrir Plano de Carreira completo</span>
            </LinkInterno>
            <LinkInterno href="/simulados" className="btn btn-secondary">
              <Icone nome="simulados" tamanho={20} />
              <span>Configurar simulado</span>
            </LinkInterno>
          </div>
        </div>
      </section>

      <ControleModoDemonstracao />
      <ListaEtapas visoes={visoes} />
      <PainelMentor papel="instrutor" pagina="carreira" />
    </div>
  )
}
