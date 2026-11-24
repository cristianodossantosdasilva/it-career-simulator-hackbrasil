import { useState } from 'react'
import {
  ETAPAS_MISSAO_ZERO,
  GLOSSARIO_INICIANTE,
  LEVELS,
  calcularProgressoNivel,
  nivelPorId,
  obterProximaAcao,
} from '../../educacao/catalogoEducacional'
import { PrimeiraMissao } from '../../workstation/PrimeiraMissao'
import { type IdEtapa, type IdMissao, ehIdMissao, rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { ConfiguracaoModoMissao } from '../diagnostico/ConfiguracaoModoMissao'
import { type ModoMesa, calcularDominiosDaRota, gravarModoMesa, lerModoMesa } from '../diagnostico/configuracaoMissao'
import { PainelMentor } from '../mentor/PainelMentor'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { ConviteCopiloto } from '../componentes/ConviteCopiloto'
import { ListaEtapas } from '../componentes/ListaEtapas'
import { OpcoesAvancadas } from '../componentes/OpcoesAvancadas'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { useAcademia, useMissao } from '../contextosJornada'
import { ControleModoDemonstracao } from '../demonstracao/ControleModoDemonstracao'
import { AVISO_CARTAO_DO_DIAGNOSTICO_RAPIDO, ROTULO_DIAGNOSTICO_COMPLETO } from '../demonstracao/textosDemonstracao'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { type VisaoEtapa, calcularProgressoRota } from '../progressoRota'

const PRIMEIRO_NIVEL = LEVELS[0]

function enderecoDaMesa(missao: IdMissao): string {
  return enderecoDe({ pagina: 'mesa-de-trabalho', missao, semente: null, causa: null, nova: false })
}

function missoesEmbarcaveis(visoes: readonly VisaoEtapa[]) {
  return visoes.flatMap((etapa) => etapa.grupos.flatMap((grupo) => grupo.missoes.filter((missao) => missao.podeIniciar)))
}

/**
 * Plano de Carreira: configuração Treino vs Missão, seletor de domínios com peso, quadro Pronto para
 * começar, próximo passo, roteiro da Missão 0, etapas da rota, opções avançadas e convite.
 */
export function PaginaPlanoDeCarreira() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const { estadoAcademia, resumoCarreira } = useAcademia()
  const { sessaoId, sessao, ocupado } = useMissao()
  const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_PERFIL)
  const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []
  const dominios = rota ? calcularDominiosDaRota(rota, registros) : []

  const [modo, setModo] = useState<ModoMesa>(lerModoMesa)
  const [dominiosSelecionados, setDominiosSelecionados] = useState<readonly IdEtapa[]>(() =>
    dominios.map((dominio) => dominio.id),
  )

  const visoesFiltradas =
    dominiosSelecionados.length > 0
      ? visoes.filter((visao) => dominiosSelecionados.includes(visao.etapa.id))
      : visoes

  const iniciaveis = missoesEmbarcaveis(visoesFiltradas)
  // Quem ainda não tem registro vem primeiro: o primeira missão é o primeiro que a rota libera e que falta fazer.
  const primeira = iniciaveis.find((missao) => missao.estado !== 'concluida') ?? iniciaveis[0] ?? null

  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp
  const proximaAcao = obterProximaAcao(estadoAcademia)
  const nivelDoPasso = nivelPorId(proximaAcao.level)
  const temProgresso =
    estadoAcademia.lessonsDone.length > 0 ||
    estadoAcademia.labsDone.length > 0 ||
    estadoAcademia.pitches.length > 0 ||
    xpExibido > 0
  const sessaoAtiva = Boolean(sessaoId && sessao)

  function mudarModo(novoModo: ModoMesa) {
    setModo(novoModo)
    gravarModoMesa(novoModo)
  }

  function alternarDominio(id: IdEtapa) {
    setDominiosSelecionados((atuais) => {
      if (atuais.includes(id)) {
        return atuais.length > 1 ? atuais.filter((item) => item !== id) : atuais
      }
      return [...atuais, id]
    })
  }

  function selecionarTodosDominios() {
    setDominiosSelecionados(dominios.map((dominio) => dominio.id))
  }

  function irParaPrimeiraMissao() {
    if (primeira) navegar(enderecoDaMesa(primeira.missao))
  }

  function executarProximaAcao() {
    if (proximaAcao.act === 'lesson') {
      navegar(enderecoDe({ pagina: 'aulas', nivel: proximaAcao.level, modo: 'lesson', aula: proximaAcao.lessonId }))
    } else if (proximaAcao.act === 'cards') {
      navegar(enderecoDe({ pagina: 'aulas', nivel: proximaAcao.level, modo: 'cards', aula: null }))
    } else if (proximaAcao.act === 'lab') {
      const daAula = iniciaveis.find((missao) => missao.missao === proximaAcao.cenarioId)
      if (daAula) navegar(enderecoDaMesa(daAula.missao))
      else irParaPrimeiraMissao()
    } else {
      navegar(enderecoDe({ pagina: 'portfolio' }))
    }
  }

  function retomarMissao() {
    const missao = sessao?.meta.cenarioId
    if (missao && ehIdMissao(missao)) navegar(enderecoDaMesa(missao))
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['plano-de-carreira']}</h1>
        <p className="pagina-jornada-texto">
          {rota ? `Rota ${rota.nome}. ` : ''}Cada etapa libera a seguinte quando as missões dela ficam registradas neste navegador.
        </p>
      </header>
      <ControleModoDemonstracao />
      {cartao?.origem === 'checkin-rapido' && (
        <AvisoHonesto acoes={[{ tipo: 'link', rotulo: ROTULO_DIAGNOSTICO_COMPLETO, href: '/diagnostico' }]}>
          {AVISO_CARTAO_DO_DIAGNOSTICO_RAPIDO}
        </AvisoHonesto>
      )}
      <ConfiguracaoModoMissao
        modo={modo}
        aoMudarModo={mudarModo}
        dominios={dominios}
        dominiosSelecionados={dominiosSelecionados}
        aoAlternarDominio={alternarDominio}
        aoSelecionarTodosDominios={selecionarTodosDominios}
        acaoPrincipal={
          primeira
            ? {
                rotulo: modo === 'missao' ? 'Iniciar em Modo Missão' : 'Iniciar em Modo Treino',
                aoClicar: irParaPrimeiraMissao,
                desabilitado: ocupado,
              }
            : undefined
        }
      />
      <PrimeiraMissao
        temProgresso={temProgresso}
        sessaoAtiva={sessaoAtiva}
        proximaAcao={proximaAcao}
        nivelFoco={nivelDoPasso}
        progressoFoco={calcularProgressoNivel(estadoAcademia, nivelDoPasso.id)}
        ocupado={ocupado}
        onIniciarPrimeiraMissao={irParaPrimeiraMissao}
        onEstudarAntes={() => navegar(enderecoDe({ pagina: 'aulas', nivel: PRIMEIRO_NIVEL.id, modo: 'lesson', aula: null }))}
        onExecutarProximaAcao={executarProximaAcao}
        onRetomarLaboratorio={retomarMissao}
      />
      {/* Não persiste a escolha manual: a cada visita a abertura segue temProgresso. */}
      <details className="glossary-details" open={!temProgresso} aria-labelledby="missao-zero-titulo">
        <summary className="missao-zero-resumo">
          <h2 id="missao-zero-titulo" className="h2">
            Missão 0: o que fazer dentro do chamado
          </h2>
          <span className="muted">
            A Primeira Missão abre o chamado. Este roteiro mostra o que fazer depois que ele estiver aberto.
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
      <ListaEtapas visoes={visoesFiltradas} />
      <OpcoesAvancadas visoes={visoes} />
      <details className="glossary-details">
        <summary>Glossário rápido para iniciantes (ITSM, SimuDesk, KB, Revisão e Semente)</summary>
        <div className="glossary-grid">
          {GLOSSARIO_INICIANTE.map((item) => (
            <div key={item.termo} className="glossary-item">
              <strong>{item.termo}:</strong> {item.definicao}
            </div>
          ))}
        </div>
      </details>
      <ConviteCopiloto />
      <PainelMentor papel="instrutor" pagina="plano-de-carreira" />
    </div>
  )
}
