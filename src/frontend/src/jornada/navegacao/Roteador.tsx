import { Component, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { ContextoAnuncioJornada, type ValorAnuncioJornada } from './anuncioJornada'
import { MolduraPagina } from './MolduraPagina'
import { navegar, obterLocalAtual, reescreverEndereco, useLocalAtual } from './navegador'
import { type DecisaoPortao, decidirPortao } from './portoes'
import { RegiaoAnuncioJornada } from './RegiaoAnuncioJornada'
import { NOME_PAGINA, type RotaResolvida, caminhoCanonico, resolverEndereco } from './rotas'
import { useTituloEFoco } from './useTituloEFoco'

class LimiteErroPagina extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  render() {
    if (this.state.erro) {
      return (
        <div className="page">
          <div className="edu-card card-b" role="alert">
            <h2>Erro nesta página</h2>
            <p className="alert-danger">{this.state.erro.message}</p>
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ erro: null })}>
              Tentar de novo
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

interface PropsRoteador {
  /** Recebe a decisão do portão: os avisos de missão em preparação e de escala bloqueada ficam com a página. */
  renderizarPagina: (rota: RotaResolvida, portao: DecisaoPortao) => ReactNode
  /** Envolve a página em MolduraPagina (link de salto e `main#conteudo-pagina`). A página não declara outro `main`. */
  comMoldura?: boolean
  /** Barra de navegação da moldura, fora do limite de erro, para continuar montada se a página falhar. */
  barra?: (rota: RotaResolvida) => ReactNode
}

/**
 * Lê o endereço atual, resolve a página e a renderiza dentro de um limite de erro reiniciado a cada
 * navegação. A região viva fica fora desse limite para continuar montada entre páginas.
 */
export function Roteador({ renderizarPagina, comMoldura = true, barra }: PropsRoteador) {
  const local = useLocalAtual()
  const rota = useMemo(() => resolverEndereco(local.caminho, local.busca), [local.caminho, local.busca])
  const { cartao, registros } = useArmazenamentoJornada()
  const portao = useMemo(() => decidirPortao(rota, cartao, registros), [rota, cartao, registros])
  useTituloEFoco(NOME_PAGINA[rota.pagina], local)

  // Portão sem cartão: substitui a entrada do histórico, então voltar não reabre a página negada.
  const destinoPortao = portao.tipo === 'redirecionar' ? portao.para : null
  useEffect(() => {
    if (destinoPortao) navegar(destinoPortao, { substituir: true })
  }, [destinoPortao])

  useEffect(() => {
    const canonico = caminhoCanonico(local.caminho)
    if (canonico !== local.caminho) reescreverEndereco(`${canonico}${local.busca}`)
  }, [local.caminho, local.busca])

  const [anuncio, setAnuncio] = useState<{ texto: string; chave: number } | null>(null)
  const anunciar = useCallback((texto: string) => setAnuncio({ texto, chave: obterLocalAtual().chave }), [])
  const valorAnuncio = useMemo<ValorAnuncioJornada>(() => ({ anunciar }), [anunciar])
  const textoAnuncio = anuncio && local.chave - anuncio.chave <= 1 ? anuncio.texto : ''

  const pagina = (
    <LimiteErroPagina key={local.chave}>{destinoPortao ? null : renderizarPagina(rota, portao)}</LimiteErroPagina>
  )

  return (
    <ContextoAnuncioJornada.Provider value={valorAnuncio}>
      <RegiaoAnuncioJornada texto={textoAnuncio} />
      {comMoldura ? <MolduraPagina barra={barra?.(rota)}>{pagina}</MolduraPagina> : pagina}
    </ContextoAnuncioJornada.Provider>
  )
}

