import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { apiClient, classificarFalha, ConflitoSeqError } from '../api/client'
import type { CarreiraResumoResponse, CriarSessaoRequest, SessaoProjecao } from '../api/types'
import {
  type EstadoAcademia,
  carregarEstadoAcademia,
  nivelPorCenarioId,
  salvarEstadoAcademia,
} from '../educacao/catalogoEducacional'
import { usePomodoro } from '../workstation/usePomodoro'
import {
  type Aba,
  ContextoAcademia,
  ContextoMissao,
  type OpcoesAberturaMissao,
  type ResultadoAberturaMissao,
  type ValorAcademia,
  type ValorMissao,
} from './contextosJornada'
import { type RegistroDeMissao, criarRegistro } from './armazenamento/registrosMissao'
import { decidirInicioMesa } from './mesa/decidirInicioMesa'
import { type IdMissao, ehIdMissao } from './catalogos/catalogoRotas'
import { useArmazenamentoJornada } from './contextoArmazenamentoJornada'
import { ProvedorArmazenamentoJornada } from './ProvedorArmazenamentoJornada'

const STORAGE_SESSOES_KEY = 'itfs_jornada_sessoes'

function carregarSessaoIdsSalvas(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_SESSOES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function salvarSessaoId(id: string): string[] {
  const atuais = carregarSessaoIdsSalvas()
  const atualizados = atuais.includes(id) ? atuais : [...atuais, id]
  try {
    window.localStorage.setItem(STORAGE_SESSOES_KEY, JSON.stringify(atualizados))
  } catch {
    // ignore storage errors
  }
  return atualizados
}

/**
 * Estado da Academia, da missão e do Armazenamento_Local acima do Roteador, para que a sessão e o
 * cronômetro continuem em memória quando a pessoa troca de página.
 */
export function ProvedorJornada({ children, armazenamento }: { children: ReactNode; armazenamento?: Storage }) {
  return (
    <ProvedorArmazenamentoJornada armazenamento={armazenamento}>
      <ProvedorAcademiaEMissao>{children}</ProvedorAcademiaEMissao>
    </ProvedorArmazenamentoJornada>
  )
}

/** Estado da Academia e da missão em memória, compartilhado pelas páginas por rota. */
function ProvedorAcademiaEMissao({ children }: { children: ReactNode }) {
  // Academia
  const [estadoAcademia, setEstadoAcademia] = useState<EstadoAcademia>(() => carregarEstadoAcademia())
  const [resumoCarreira, setResumoCarreira] = useState<CarreiraResumoResponse | null>(null)
  const [apelido, setApelido] = useState('')

  const atualizarEstadoAcademia = useCallback((updater: (prev: EstadoAcademia) => EstadoAcademia) => {
    setEstadoAcademia((prev) => {
      const next = updater(prev)
      salvarEstadoAcademia(next)
      return next
    })
  }, [])

  const creditarMinutos = useCallback(
    (minutos: number) => atualizarEstadoAcademia((st) => ({ ...st, weekMin: st.weekMin + minutos })),
    [atualizarEstadoAcademia],
  )
  const pomodoro = usePomodoro(creditarMinutos)

  // Missão
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<SessaoProjecao | null>(null)
  const [aba, setAba] = useState<Aba>('itsm')
  const [gaveta, setGaveta] = useState<'notas' | 'tutor' | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [passosTriagem, setPassosTriagem] = useState({ politica: false, token: false, recusado: false })
  const [historicoTerminal, setHistoricoTerminal] = useState<
    { cmd: string; saida: string; priv: string }[]
  >([])
  const [artigoKbSelecionado, setArtigoKbSelecionado] = useState<string | null>(null)
  const kbOrigemItsmRef = useRef(false)

  // Quem sai da Intranet sem fechar o artigo não volta ao ITSM numa consulta manual posterior.
  useEffect(() => {
    if (aba !== 'kb') kbOrigemItsmRef.current = false
  }, [aba])


  /** Abre o artigo a partir do ITSM. Ao fechar o artigo, o aluno volta ao chamado. */
  function abrirKbDoItsm(artigoId: string) {
    kbOrigemItsmRef.current = true
    setArtigoKbSelecionado(artigoId)
    setAba('kb')
  }
  function fecharArtigoKb() {
    if (!kbOrigemItsmRef.current) return
    kbOrigemItsmRef.current = false
    setArtigoKbSelecionado(null)
    setAba('itsm')
  }

  async function atualizarResumoCarreira(ids?: string[], nome?: string) {
    const lista = ids ?? carregarSessaoIdsSalvas()
    if (lista.length === 0) {
      setResumoCarreira(null)
      return
    }
    try {
      const resumo = await apiClient.obterResumoCarreira(lista, (nome ?? apelido).trim() || undefined)
      setResumoCarreira(resumo)
    } catch {
      // backend pode estar reiniciando; nao bloqueia tela inicial
    }
  }

  useEffect(() => {
    let ativo = true
    const lista = carregarSessaoIdsSalvas()
    if (lista.length === 0) return
    apiClient
      .obterResumoCarreira(lista)
      .then((resumo) => {
        if (ativo) setResumoCarreira(resumo)
      })
      .catch(() => {
        // backend pode estar reiniciando; nao bloqueia tela inicial
      })
    return () => {
      ativo = false
    }
  }, [])

  const [registroRecente, setRegistroRecente] = useState<RegistroDeMissao | null>(null)
  const [falhaRegistro, setFalhaRegistro] = useState(false)
  /** Sessão em memória lida fora do ciclo de renderização, para a decisão de abertura da Mesa de Trabalho. */
  const sessaoAtualRef = useRef<SessaoProjecao | null>(null)
  const sessaoIdAtualRef = useRef<string | null>(null)
  function definirSessao(id: string, proj: SessaoProjecao) {
    sessaoIdAtualRef.current = id
    sessaoAtualRef.current = proj
    setSessaoId(id)
    setSessao(proj)
  }
  function atualizarProjecao(proj: SessaoProjecao) {
    sessaoAtualRef.current = proj
    setSessao(proj)
  }

  /** Estado de mesa de trabalho novo para um turno que acabou de abrir, como em iniciarSessao antes da jornada. */
  function prepararTurno(id: string, proj: SessaoProjecao, cenarioId: string) {
    // Identificador fora do catálogo (nivel nulo) mantém o foco de estudo que o aluno já tinha.
    const nivel = nivelPorCenarioId(cenarioId)
    if (nivel) atualizarEstadoAcademia((prev) => ({ ...prev, focus: nivel.id }))
    definirSessao(id, proj)
    setRegistroRecente(null)
    setFalhaRegistro(false)
    setPassosTriagem({ politica: false, token: false, recusado: false })
    setHistoricoTerminal([])
    setAba('itsm')
  }

  const armazenamentoJornada = useArmazenamentoJornada()
  const aberturasEmAndamento = useRef(new Map<IdMissao, Promise<ResultadoAberturaMissao>>())

  async function executarAbertura(missao: IdMissao, opcoes: OpcoesAberturaMissao): Promise<ResultadoAberturaMissao> {
    const atual = sessaoAtualRef.current
    const decisao = decidirInicioMesa(
      missao,
      atual ? { cenarioId: atual.meta.cenarioId } : null,
      armazenamentoJornada.lerMissoesAtivasAtuais(),
      opcoes.nova,
    )
    if (decisao.tipo === 'usar-memoria' && sessaoIdAtualRef.current) {
      return { tipo: 'pronto', sessaoId: sessaoIdAtualRef.current, retomada: true }
    }
    setOcupado(true)
    setAviso(null)
    try {
      if (decisao.tipo === 'retomar') {
        const proj = await apiClient.obterSessao(decisao.sessaoId)
        prepararTurno(decisao.sessaoId, proj, missao)
        return { tipo: 'pronto', sessaoId: decisao.sessaoId, retomada: true }
      }
      // Sem semente nem Causa, o corpo leva só o identificador da Missão.
      const pedido: CriarSessaoRequest = { cenarioId: missao }
      if (opcoes.semente !== undefined) pedido.semente = opcoes.semente
      if (opcoes.causa !== undefined) pedido.causaForcada = opcoes.causa
      const criada = await apiClient.criarSessao(pedido)
      const proj = await apiClient.obterSessao(criada.sessaoId)
      const ids = salvarSessaoId(criada.sessaoId)
      armazenamentoJornada.registrarMissaoAtiva(missao, criada.sessaoId)
      prepararTurno(criada.sessaoId, proj, missao)
      void atualizarResumoCarreira(ids)
      return { tipo: 'pronto', sessaoId: criada.sessaoId, retomada: false }
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao iniciar sessao'
      const classe = classificarFalha(err)
      if (classe === 'sessao-indisponivel' && decisao.tipo === 'retomar') {
        return { tipo: 'sessao-indisponivel', sessaoId: decisao.sessaoId }
      }
      setAviso(mensagem)
      return classe === 'rede' ? { tipo: 'rede', mensagem } : { tipo: 'erro', mensagem }
    } finally {
      setOcupado(false)
    }
  }

  /**
   * Abre a missão da missão: usa a sessão em memória, retoma a registrada ou cria outra. Uma promessa
   * em andamento por missão evita que a dupla execução de efeitos do StrictMode crie duas sessões.
   */
  const executarAberturaRef = useRef(executarAbertura)
  // Efeito de layout: roda antes dos efeitos comuns das páginas, que chamam abrirMissao ao montar.
  useLayoutEffect(() => {
    executarAberturaRef.current = executarAbertura
  })
  // Identidade estável, para que a página possa pôr abrirMissao na lista de dependências do efeito.
  const abrirMissao = useCallback((missao: IdMissao, opcoes: OpcoesAberturaMissao): Promise<ResultadoAberturaMissao> => {
    const emAndamento = aberturasEmAndamento.current.get(missao)
    if (emAndamento) return emAndamento
    const promessa = executarAberturaRef.current(missao, opcoes).finally(() => {
      aberturasEmAndamento.current.delete(missao)
    })
    aberturasEmAndamento.current.set(missao, promessa)
    return promessa
  }, [])

  /**
   * Único caminho que grava Registro_de_Missão: consulta a avaliação do Juiz 360º e grava só com
   * `concluida: true`. Falha não bloqueia o turno e pode ser tentada de novo.
   */
  async function registrarMissaoConcluido(id: string, proj: SessaoProjecao) {
    try {
      const avaliacao = await apiClient.obterAvaliacao(id)
      setFalhaRegistro(false)
      const registro = criarRegistro(id, proj, avaliacao, new Date())
      if (!registro) return
      armazenamentoJornada.registrarMissao(registro)
      setRegistroRecente(registro)
      // O resumo da carreira acompanha a missão concluída sem o aluno precisar pedir. Só a Mesa de Trabalho chega aqui.
      void atualizarResumoCarreira()
    } catch {
      setFalhaRegistro(true)
    }
  }

  async function tentarRegistrarDeNovo() {
    const id = sessaoIdAtualRef.current
    const proj = sessaoAtualRef.current
    if (id && proj) await registrarMissaoConcluido(id, proj)
  }

  async function executarAcao(tipo: string, dados?: Record<string, unknown>) {
    if (!sessaoId || !sessao) return
    setOcupado(true)
    setAviso(null)
    try {
      const res = await apiClient.executarAcao(sessaoId, tipo, sessao.ultimoSeq, dados)
      atualizarProjecao(res.projecao)
      if (
        res.projecao.chamados.length > 0 &&
        res.projecao.chamados.every((c) => c.status === 'Resolvido' || c.status === 'Encerrado')
      ) {
        // Toda Missão do catálogo conta no progresso da Academia: 60 XP e um laboratório concluído, uma vez.
        const concluido = res.projecao.meta.cenarioId
        if (ehIdMissao(concluido)) {
          atualizarEstadoAcademia((prev) =>
            prev.labsDone.includes(concluido)
              ? prev
              : { ...prev, labsDone: [...prev.labsDone, concluido], xp: prev.xp + 60, weekMin: prev.weekMin + 15 },
          )
        }
        void registrarMissaoConcluido(sessaoId, res.projecao)
      }
      for (const ev of res.eventos) {
        if (ev.tipo === 'AcaoRejeitada') {
          setAviso(`Acao rejeitada: ${String(ev.dados?.motivo ?? 'regra de negocio')}`)
        } else if (ev.tipo === 'PistaSolicitada') {
          setAviso(String(ev.dados?.texto ?? 'Pista registrada.'))
        } else if (ev.tipo === 'DnsRegistroCorrigido') {
          setAviso('N2 Virtual corrigiu o DNS! Eleve o privilegio e execute ipconfig /flushdns no SimuDesk.')
        } else if (ev.tipo === 'AcessoPastaRestabelecido') {
          setAviso('Pasta Financeiro restabelecida! Agora resolva o chamado no ITSM com nota pública.')
        } else if (ev.tipo === 'PoliticaSegurancaConsultada') {
          setPassosTriagem((p) => ({ ...p, politica: true }))
          setAviso('Política KB-001 consultada: reset de senha exige validação de matrícula e ramal e token corporativo.')
        } else if (ev.tipo === 'TokenSolicitado') {
          setPassosTriagem((p) => ({ ...p, token: true }))
          setAviso('Token corporativo verificado: solicitante NAO possui token valido (alerta de engenharia social!).')
        } else if (ev.tipo === 'ResetRecusado') {
          setPassosTriagem((p) => ({ ...p, recusado: true }))
          setAviso('Reset fraudulento recusado com seguranca! Abra "Juiz 360º e Replay" para conferir sua avaliacao.')
        } else if (ev.tipo === 'SenhaResetadaIndevidamente') {
          setAviso('ALERTA: Senha resetada sem verificacao! Incidente de seguranca registrado.')
        } else if (ev.tipo === 'ComandoExecutado' || ev.tipo === 'ComandoNaoSuportado') {
          setHistoricoTerminal((prev) => [
            ...prev,
            {
              cmd: String(ev.dados?.comando ?? ''),
              saida: String(ev.dados?.saida ?? ''),
              priv: String(ev.dados?.privilegio ?? sessao.estacao.privilegio),
            },
          ])
        }
      }
    } catch (err) {
      if (err instanceof ConflitoSeqError) {
        const atual = await apiClient.obterSessao(sessaoId)
        atualizarProjecao(atual)
        setAviso(err.message)
      } else {
        setAviso(err instanceof Error ? err.message : 'Erro ao executar acao')
      }
    } finally {
      setOcupado(false)
    }
  }

  async function enviarChat(persona: 'cliente' | 'techlead', mensagem: string) {
    if (!sessaoId || !sessao) return
    setOcupado(true)
    setAviso(null)
    try {
      const res = await apiClient.enviarChat(sessaoId, persona, mensagem, sessao.ultimoSeq)
      atualizarProjecao(res.projecao)
    } catch (err) {
      if (err instanceof ConflitoSeqError) {
        const atual = await apiClient.obterSessao(sessaoId)
        atualizarProjecao(atual)
        setAviso(err.message)
      } else {
        setAviso(err instanceof Error ? err.message : 'Erro no chat')
      }
    } finally {
      setOcupado(false)
    }
  }


  const valorAcademia: ValorAcademia = {
    estadoAcademia,
    atualizarEstadoAcademia,
    resumoCarreira,
    apelido,
    setApelido,
    atualizarResumoCarreira,
    pomodoro,
  }

  const valorMissao: ValorMissao = {
    sessaoId,
    sessao,
    aba,
    setAba,
    gaveta,
    setGaveta,
    ocupado,
    aviso,
    setAviso,
    passosTriagem,
    historicoTerminal,
    artigoKbSelecionado,
    abrirKbDoItsm,
    fecharArtigoKb,
    abrirMissao,
    registroRecente,
    falhaRegistro,
    tentarRegistrarDeNovo,
    executarAcao,
    enviarChat,
  }

  return (
    <ContextoAcademia.Provider value={valorAcademia}>
      <ContextoMissao.Provider value={valorMissao}>{children}</ContextoMissao.Provider>
    </ContextoAcademia.Provider>
  )
}
