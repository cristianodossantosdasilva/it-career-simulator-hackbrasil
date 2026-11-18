import {
  ETAPAS_MISSAO_ZERO,
  GLOSSARIO_INICIANTE,
  LEVELS,
  calcularProgressoNivel,
  nivelPorId,
  obterProximaAcao,
} from '../../educacao/catalogoEducacional'
import { PrimeiroVoo } from '../../workstation/PrimeiroVoo'
import { type IdMissao, ehIdMissao, rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_EMBARQUE } from '../catalogos/regrasIndicacao'
import { PainelComandante } from '../comandante/PainelComandante'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { ConviteCopiloto } from '../componentes/ConviteCopiloto'
import { ListaEscalas } from '../componentes/ListaEscalas'
import { OpcoesAvancadas } from '../componentes/OpcoesAvancadas'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { useAcademia, useVoo } from '../contextosJornada'
import { ControleModoDemonstracao } from '../demonstracao/ControleModoDemonstracao'
import { AVISO_CARTAO_DO_CHECKIN_RAPIDO, ROTULO_CHECKIN_COMPLETO } from '../demonstracao/textosDemonstracao'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { type VisaoEscala, calcularProgressoRota } from '../progressoRota'

const PRIMEIRO_NIVEL = LEVELS[0]

function enderecoDaCabine(missao: IdMissao): string {
  return enderecoDe({ pagina: 'cabine', missao, semente: null, causa: null, nova: false })
}

function missoesEmbarcaveis(visoes: readonly VisaoEscala[]) {
  return visoes.flatMap((escala) => escala.grupos.flatMap((grupo) => grupo.missoes.filter((missao) => missao.podeEmbarcar)))
}

/**
 * Plano de voo: próximo passo, roteiro da Missão 0, escalas da rota com as missões, opções avançadas e
 * convite. O progresso das escalas vem só dos Registros_de_Voo. O Embarcar nunca leva Causa nem semente.
 */
export function PaginaPlanoDeVoo() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const { estadoAcademia, resumoCarreira } = useAcademia()
  const { sessaoId, sessao, ocupado } = useVoo()
  const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_EMBARQUE)
  const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []
  const embarcaveis = missoesEmbarcaveis(visoes)
  // Quem ainda não tem registro vem primeiro: o primeiro voo é o primeiro que a rota libera e que falta fazer.
  const primeira = embarcaveis.find((missao) => missao.estado !== 'concluida') ?? embarcaveis[0] ?? null

  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp
  const proximaAcao = obterProximaAcao(estadoAcademia)
  const nivelDoPasso = nivelPorId(proximaAcao.level)
  const temProgresso =
    estadoAcademia.lessonsDone.length > 0 ||
    estadoAcademia.labsDone.length > 0 ||
    estadoAcademia.pitches.length > 0 ||
    xpExibido > 0
  const sessaoAtiva = Boolean(sessaoId && sessao)

  function irParaPrimeiraMissao() {
    if (primeira) navegar(enderecoDaCabine(primeira.missao))
  }

  function executarProximaAcao() {
    if (proximaAcao.act === 'lesson') {
      navegar(enderecoDe({ pagina: 'aulas', nivel: proximaAcao.level, modo: 'lesson', aula: proximaAcao.lessonId }))
    } else if (proximaAcao.act === 'cards') {
      navegar(enderecoDe({ pagina: 'aulas', nivel: proximaAcao.level, modo: 'cards', aula: null }))
    } else if (proximaAcao.act === 'lab') {
      const daAula = embarcaveis.find((missao) => missao.missao === proximaAcao.cenarioId)
      if (daAula) navegar(enderecoDaCabine(daAula.missao))
      else irParaPrimeiraMissao()
    } else {
      navegar(enderecoDe({ pagina: 'breve' }))
    }
  }

  function retomarVoo() {
    const missao = sessao?.meta.cenarioId
    if (missao && ehIdMissao(missao)) navegar(enderecoDaCabine(missao))
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['plano-de-voo']}</h1>
        <p className="pagina-jornada-texto">
          {rota ? `Rota ${rota.nome}. ` : ''}Cada escala libera a seguinte quando os voos dela ficam registrados neste navegador.
        </p>
      </header>
      <ControleModoDemonstracao />
      {cartao?.origem === 'checkin-rapido' && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: ROTULO_CHECKIN_COMPLETO, href: '/check-in' }]}>
          {AVISO_CARTAO_DO_CHECKIN_RAPIDO}
        </AvisoHonesto>
      )}
      <PrimeiroVoo
        temProgresso={temProgresso}
        sessaoAtiva={sessaoAtiva}
        proximaAcao={proximaAcao}
        nivelFoco={nivelDoPasso}
        progressoFoco={calcularProgressoNivel(estadoAcademia, nivelDoPasso.id)}
        ocupado={ocupado}
        onIniciarPrimeiroVoo={irParaPrimeiraMissao}
        onEstudarAntes={() => navegar(enderecoDe({ pagina: 'aulas', nivel: PRIMEIRO_NIVEL.id, modo: 'lesson', aula: null }))}
        onExecutarProximaAcao={executarProximaAcao}
        onRetomarLaboratorio={retomarVoo}
      />
      {/* Não persiste a escolha manual: a cada visita a abertura segue temProgresso. */}
      <details className="glossary-details" open={!temProgresso} aria-labelledby="missao-zero-titulo">
        <summary className="missao-zero-resumo">
          <h2 id="missao-zero-titulo" className="h2">
            Missão 0: o que fazer dentro do chamado
          </h2>
          <span className="muted">
            O Primeiro Voo abre o chamado. Este roteiro mostra o que fazer depois que ele estiver aberto.
          </span>
        </summary>
        <ol className="steps-grid">
          {ETAPAS_MISSAO_ZERO.map((etapa, indice) => (
            <li key={etapa.titulo} className="step-box">
              <strong>
                {indice + 1}. {etapa.titulo}
              </strong>
              {etapa.texto}
            </li>
          ))}
        </ol>
      </details>
      <ListaEscalas visoes={visoes} />
      <OpcoesAvancadas visoes={visoes} />
      <details className="glossary-details">
        <summary>Glossário rápido para iniciantes (ITSM, SimuDesk, KB, Caixa-Preta e Semente)</summary>
        <div className="glossary-grid">
          {GLOSSARIO_INICIANTE.map((item) => (
            <div key={item.termo} className="glossary-item">
              <strong>{item.termo}:</strong> {item.definicao}
            </div>
          ))}
        </div>
      </details>
      <ConviteCopiloto />
      <PainelComandante papel="instrutor" pagina="plano-de-voo" />
    </div>
  )
}
