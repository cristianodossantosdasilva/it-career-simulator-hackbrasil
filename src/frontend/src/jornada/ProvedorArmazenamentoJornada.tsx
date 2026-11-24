import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { type CartaoPerfil, gravarCartao, lerCartao } from './armazenamento/cartaoPerfil'
import {
  type OrigemModoDemonstracao,
  gravarModoDemonstracao,
  lerModoDemonstracao,
} from './armazenamento/modoDemonstracao'
import { type RegistroDeMissao, gravarRegistros, incluirRegistro, lerRegistros } from './armazenamento/registrosMissao'
import { type MissoesAtivas, comMissaoAtiva, gravarMissoesAtivas, lerMissoesAtivas } from './armazenamento/missoesAtivas'
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
 * Cartão, registros, missões ativas e modo de demonstração lidos uma vez, por inicialização preguiçosa. Não importa o cliente
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
  const [cartao, setCartao] = useState<CartaoPerfil | null>(() => lerCartao(origem))
  const [registros, setRegistros] = useState<readonly RegistroDeMissao[]>(() => lerRegistros(origem))
  const [missoesAtivas, setMissoesAtivas] = useState<MissoesAtivas>(() => lerMissoesAtivas(origem))
  const [modoDemonstracao, setModoDemonstracao] = useState<boolean>(() => lerModoDemonstracao(origem))
  const [avisoGravacao, setAvisoGravacao] = useState<string | null>(null)
  const anunciador = useRef<((texto: string) => void) | null>(null)
  const registrosAtuais = useRef(registros)
  const missoesAtivasAtuais = useRef(missoesAtivas)

  const anotarResultado = useCallback((gravou: boolean) => {
    if (!gravou) setAvisoGravacao(AVISO_FALHA_GRAVACAO)
    return gravou
  }, [])

  const definirCartao = useCallback(
    (novo: CartaoPerfil) => {
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
  const registrarMissao = useCallback(
    (registro: RegistroDeMissao) => {
      const proximos = incluirRegistro(registrosAtuais.current, registro)
      registrosAtuais.current = proximos
      setRegistros(proximos)
      return anotarResultado(gravarRegistros(origem, proximos))
    },
    [origem, anotarResultado],
  )

  const registrarMissaoAtiva = useCallback(
    (missao: IdMissao, sessaoId: string) => {
      const proximos = comMissaoAtiva(missoesAtivasAtuais.current, missao, sessaoId)
      missoesAtivasAtuais.current = proximos
      setMissoesAtivas(proximos)
      return anotarResultado(gravarMissoesAtivas(origem, proximos))
    },
    [origem, anotarResultado],
  )

  const lerMissoesAtivasAtuais = useCallback(() => missoesAtivasAtuais.current, [])
  const dispensarAvisoGravacao = useCallback(() => setAvisoGravacao(null), [])

  const valor = useMemo<ValorArmazenamentoJornada>(
    () => ({
      cartao,
      registros,
      missoesAtivas,
      modoDemonstracao,
      definirModoDemonstracao,
      registrarAnunciador,
      definirCartao,
      registrarMissao,
      registrarMissaoAtiva,
      lerMissoesAtivasAtuais,
      avisoGravacao,
      dispensarAvisoGravacao,
    }),
    [
      cartao,
      registros,
      missoesAtivas,
      modoDemonstracao,
      definirModoDemonstracao,
      registrarAnunciador,
      definirCartao,
      registrarMissao,
      registrarMissaoAtiva,
      lerMissoesAtivasAtuais,
      avisoGravacao,
      dispensarAvisoGravacao,
    ],
  )

  return <ContextoArmazenamentoJornada.Provider value={valor}>{children}</ContextoArmazenamentoJornada.Provider>
}
