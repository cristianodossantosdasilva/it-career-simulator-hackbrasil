import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { type CartaoEmbarque, gravarCartao, lerCartao } from './armazenamento/cartaoEmbarque'
import {
  type OrigemModoDemonstracao,
  gravarModoDemonstracao,
  lerModoDemonstracao,
} from './armazenamento/modoDemonstracao'
import { type RegistroDeVoo, gravarRegistros, incluirRegistro, lerRegistros } from './armazenamento/registrosVoo'
import { type VoosAtivos, comVooAtivo, gravarVoosAtivos, lerVoosAtivos } from './armazenamento/voosAtivos'
import type { IdMissao } from './catalogos/catalogoRotas'
import {
  AVISO_FALHA_GRAVACAO,
  ContextoArmazenamentoJornada,
  type ValorArmazenamentoJornada,
} from './contextoArmazenamentoJornada'
import {
  ANUNCIO_MODO_ATIVADO,
  ANUNCIO_MODO_DESATIVADO,
  AVISO_FALHA_GRAVACAO_MODO,
} from './demonstracao/textosDemonstracao'

/** O `localStorage` pode lançar só por ser acessado (modo privado restrito). Sem ele, nada é guardado. */
function armazenamentoPadrao(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const ARMAZENAMENTO_INDISPONIVEL: Storage = {
  length: 0,
  clear() {},
  key: () => null,
  getItem: () => null,
  removeItem() {},
  setItem() {
    throw new Error('Armazenamento indisponível')
  },
}

/**
 * Cartão, registros, voos ativos e modo de demonstração lidos uma vez, por inicialização preguiçosa. Não importa o cliente
 * da API: este contexto só lê e grava o Armazenamento_Local.
 */
export function ProvedorArmazenamentoJornada({
  children,
  armazenamento,
}: {
  children: ReactNode
  armazenamento?: Storage
}) {
  const [origem] = useState<Storage>(() => armazenamento ?? armazenamentoPadrao() ?? ARMAZENAMENTO_INDISPONIVEL)
  const [cartao, setCartao] = useState<CartaoEmbarque | null>(() => lerCartao(origem))
  const [registros, setRegistros] = useState<readonly RegistroDeVoo[]>(() => lerRegistros(origem))
  const [voosAtivos, setVoosAtivos] = useState<VoosAtivos>(() => lerVoosAtivos(origem))
  const [modoDemonstracao, setModoDemonstracao] = useState<boolean>(() => lerModoDemonstracao(origem))
  const [avisoGravacao, setAvisoGravacao] = useState<string | null>(null)
  const anunciador = useRef<((texto: string) => void) | null>(null)
  const registrosAtuais = useRef(registros)
  const voosAtivosAtuais = useRef(voosAtivos)

  const anotarResultado = useCallback((gravou: boolean) => {
    if (!gravou) setAvisoGravacao(AVISO_FALHA_GRAVACAO)
    return gravou
  }, [])

  const definirCartao = useCallback(
    (novo: CartaoEmbarque) => {
      setCartao(novo)
      return anotarResultado(gravarCartao(origem, novo))
    },
    [origem, anotarResultado],
  )

  const definirModoDemonstracao = useCallback(
    (ativo: boolean, origemEscolha: OrigemModoDemonstracao) => {
      setModoDemonstracao(ativo)
      anunciador.current?.(ativo ? ANUNCIO_MODO_ATIVADO : ANUNCIO_MODO_DESATIVADO)
      const gravou = gravarModoDemonstracao(origem, {
        versao: 1,
        ativo,
        origem: origemEscolha,
        alteradoEm: new Date().toISOString(),
      })
      if (!gravou) setAvisoGravacao(AVISO_FALHA_GRAVACAO_MODO)
      return gravou
    },
    [origem],
  )
  const registrarAnunciador = useCallback((anunciar: (texto: string) => void) => {
    anunciador.current = anunciar
    return () => {
      if (anunciador.current === anunciar) anunciador.current = null
    }
  }, [])
  const registrarVoo = useCallback(
    (registro: RegistroDeVoo) => {
      const proximos = incluirRegistro(registrosAtuais.current, registro)
      registrosAtuais.current = proximos
      setRegistros(proximos)
      return anotarResultado(gravarRegistros(origem, proximos))
    },
    [origem, anotarResultado],
  )

  const registrarVooAtivo = useCallback(
    (missao: IdMissao, sessaoId: string) => {
      const proximos = comVooAtivo(voosAtivosAtuais.current, missao, sessaoId)
      voosAtivosAtuais.current = proximos
      setVoosAtivos(proximos)
      return anotarResultado(gravarVoosAtivos(origem, proximos))
    },
    [origem, anotarResultado],
  )

  const lerVoosAtivosAtuais = useCallback(() => voosAtivosAtuais.current, [])
  const dispensarAvisoGravacao = useCallback(() => setAvisoGravacao(null), [])

  const valor = useMemo<ValorArmazenamentoJornada>(
    () => ({
      cartao,
      registros,
      voosAtivos,
      modoDemonstracao,
      definirModoDemonstracao,
      registrarAnunciador,
      definirCartao,
      registrarVoo,
      registrarVooAtivo,
      lerVoosAtivosAtuais,
      avisoGravacao,
      dispensarAvisoGravacao,
    }),
    [
      cartao,
      registros,
      voosAtivos,
      modoDemonstracao,
      definirModoDemonstracao,
      registrarAnunciador,
      definirCartao,
      registrarVoo,
      registrarVooAtivo,
      lerVoosAtivosAtuais,
      avisoGravacao,
      dispensarAvisoGravacao,
    ],
  )

  return <ContextoArmazenamentoJornada.Provider value={valor}>{children}</ContextoArmazenamentoJornada.Provider>
}
