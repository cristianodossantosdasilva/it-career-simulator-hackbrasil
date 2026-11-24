import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ApiTeorico,
  type CorrecaoProva,
  type ProvaTeorica,
  type VerificacaoQuestao,
  apiTeorico,
} from '../api/teorico'
import { registrarHistorico } from '../jornada/simulados/historico'
import {
  type Andamento,
  type ConfigProva,
  type InstantaneoProva,
  alternarSelecao,
  gravarAndamento,
  lerAndamento,
  limparAndamento,
  pedidoDaConfig,
} from './estadoProva'

export type FaseProva = 'carregando' | 'erro' | 'andamento' | 'enviando' | 'resultado'

export interface OpcoesProva {
  config: ConfigProva
  /** Retoma o andamento salvo, quando existir. */
  retomar?: boolean
  api?: ApiTeorico
}

export interface ResultadoFinal {
  correcao: CorrecaoProva
  duracaoSeg: number
  encerradaPorTempo: boolean
}

/** Estado e ações de uma prova teórica: carregar, responder, verificar (Prática), cronometrar e finalizar. */
export function useProvaTeorica({ config, retomar = false, api = apiTeorico }: OpcoesProva) {
  const [fase, setFase] = useState<FaseProva>('carregando')
  const [erro, setErro] = useState<string | null>(null)
  const [prova, setProva] = useState<ProvaTeorica | null>(null)
  const [configAtiva, setConfigAtiva] = useState<ConfigProva>(config)
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string[]>>({})
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [verificacoes, setVerificacoes] = useState<Record<string, VerificacaoQuestao>>({})
  const [restanteSeg, setRestanteSeg] = useState<number | null>(null)
  const [decorridoSeg, setDecorridoSeg] = useState(0)
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [ocupado, setOcupado] = useState(false)

  const finalizandoRef = useRef(false)

  // Carrega (ou retoma) a prova.
  useEffect(() => {
    let ativo = true
    setFase('carregando')
    setErro(null)
    const salvo: Andamento | null = retomar ? lerAndamento() : null
    const usada = salvo ? salvo.config : config
    setConfigAtiva(usada)
    api
      .criarProva(pedidoDaConfig(usada))
      .then((p) => {
        if (!ativo) return
        setProva(p)
        setIndice(salvo ? Math.min(salvo.indice, p.questoes.length - 1) : 0)
        setRespostas(salvo?.respostas ?? {})
        setMarcadas(salvo?.marcadas ?? [])
        setVerificacoes(salvo?.verificacoes ?? {})
        setRestanteSeg(salvo ? salvo.restanteSeg : p.duracaoSegundos)
        setDecorridoSeg(salvo?.decorridoSeg ?? 0)
        finalizandoRef.current = false
        setFase('andamento')
      })
      .catch((e: unknown) => {
        if (!ativo) return
        setErro(e instanceof Error ? e.message : 'Não foi possível carregar a prova.')
        setFase('erro')
      })
    return () => {
      ativo = false
    }
    // `config` e `retomar` valem na montagem; refazer usa `tentativa`.
  }, [api, tentativa])

  const instantaneo: InstantaneoProva = { respostas, marcadas, verificacoes }

  const finalizar = useCallback(
    async (porTempo = false) => {
      if (!prova || finalizandoRef.current) return
      finalizandoRef.current = true
      setFase('enviando')
      try {
        const correcao = await api.corrigir({
          semente: prova.semente,
          formato: configAtiva.formato,
          escopo: configAtiva.escopo,
          respostas: prova.questoes.map((q) => ({ questaoId: q.id, respostas: respostas[q.id] ?? [] })),
        })
        registrarHistorico({
          tipo: 'teorico',
          formato: configAtiva.formato,
          escopo: configAtiva.escopo,
          duracaoSeg: decorridoSeg,
          percentual: correcao.percentual,
          aprovado: correcao.aprovado,
          porDominio: correcao.porDominio,
          origem: configAtiva.origem,
        })
        limparAndamento()
        setResultado({ correcao, duracaoSeg: decorridoSeg, encerradaPorTempo: porTempo })
        setFase('resultado')
      } catch (e) {
        finalizandoRef.current = false
        setErro(e instanceof Error ? e.message : 'Não foi possível corrigir a prova.')
        setFase('andamento')
      }
    },
    [api, prova, configAtiva, respostas, decorridoSeg],
  )

  const finalizarRef = useRef(finalizar)
  useEffect(() => {
    finalizarRef.current = finalizar
  }, [finalizar])

  // Cronômetro: só corre durante o andamento.
  useEffect(() => {
    if (fase !== 'andamento') return
    const id = window.setInterval(() => {
      setDecorridoSeg((d) => d + 1)
      setRestanteSeg((r) => (r === null ? r : Math.max(0, r - 1)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [fase])

  // Tempo esgotado encerra a prova padrão.
  useEffect(() => {
    if (fase === 'andamento' && restanteSeg === 0) void finalizarRef.current(true)
  }, [fase, restanteSeg])

  // Salva o andamento para "Sair e continuar depois".
  useEffect(() => {
    if (fase !== 'andamento' || !prova) return
    gravarAndamento({
      versao: 1,
      config: { ...configAtiva, semente: prova.semente },
      indice,
      respostas,
      marcadas,
      verificacoes,
      restanteSeg,
      decorridoSeg,
    })
  }, [fase, prova, configAtiva, indice, respostas, marcadas, verificacoes, restanteSeg, decorridoSeg])

  const questao = prova?.questoes[indice] ?? null

  const selecionar = useCallback(
    (questaoId: string, alternativaId: string) => {
      const alvo = prova?.questoes.find((q) => q.id === questaoId)
      if (!alvo || verificacoes[questaoId]) return
      setRespostas((atual) => ({ ...atual, [questaoId]: alternarSelecao(atual[questaoId] ?? [], alternativaId, alvo.selecao) }))
    },
    [prova, verificacoes],
  )

  const verificar = useCallback(
    async (questaoId: string) => {
      const dadas = respostas[questaoId] ?? []
      if (dadas.length === 0 || verificacoes[questaoId]) return
      setOcupado(true)
      setErro(null)
      try {
        const v = await api.verificar(questaoId, dadas)
        setVerificacoes((atual) => ({ ...atual, [questaoId]: v }))
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível verificar a resposta.')
      } finally {
        setOcupado(false)
      }
    },
    [api, respostas, verificacoes],
  )

  const alternarMarca = useCallback((questaoId: string) => {
    setMarcadas((atual) => (atual.includes(questaoId) ? atual.filter((x) => x !== questaoId) : [...atual, questaoId]))
  }, [])

  const irPara = useCallback(
    (novo: number) => {
      if (!prova) return
      setIndice(Math.min(Math.max(0, novo), prova.questoes.length - 1))
    },
    [prova],
  )

  const refazer = useCallback(() => {
    limparAndamento()
    setResultado(null)
    setTentativa((t) => t + 1)
  }, [])

  return {
    fase,
    erro,
    prova,
    config: configAtiva,
    indice,
    questao,
    instantaneo,
    restanteSeg,
    decorridoSeg,
    resultado,
    ocupado,
    selecionar,
    verificar,
    alternarMarca,
    irPara,
    finalizar,
    refazer,
    descartarErro: () => setErro(null),
  }
}

export type EstadoProvaTeorica = ReturnType<typeof useProvaTeorica>
