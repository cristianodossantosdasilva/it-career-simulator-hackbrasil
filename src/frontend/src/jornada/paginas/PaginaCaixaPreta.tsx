import { useEffect, useState } from 'react'
import { apiClient, classificarFalha } from '../../api/client'
import type { ReplayResponse } from '../../api/types'
import { IntranetApp } from '../../apps/IntranetApp/IntranetApp'
import { ReplayView } from '../../replay/ReplayView'
import { PainelComandante } from '../comandante/PainelComandante'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { type AcaoAviso, AvisoHonesto } from '../componentes/AvisoHonesto'
import { ResumoLocalDoVoo } from '../componentes/ResumoLocalDoVoo'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, type RotaResolvida, enderecoDe } from '../navegacao/rotas'

type RotaCaixaPreta = Extract<RotaResolvida, { pagina: 'caixa-preta' }>

type EstadoReplay =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; replay: ReplayResponse }
  | { tipo: 'indisponivel' }
  | { tipo: 'falha'; mensagem: string }

export const TEXTO_CAIXA_PRETA_INDISPONIVEL = 'Esta sessão não está mais disponível no servidor.'

/** Botão que abre uma sessão nova da missão do registro local. */
function refazer(missao: IdMissao): AcaoAviso {
  return {
    tipo: 'botao',
    rotulo: 'Refazer a missão',
    aoClicar: () => navegar(enderecoDe({ pagina: 'cabine', missao, semente: null, causa: null, nova: true })),
  }
}

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Falha ao falar com o servidor.'
}

/**
 * Caixa-preta de uma sessão: replay cronológico e avaliação do Juiz 360º, lidos do servidor pelo
 * identificador do endereço. Sem a sessão no servidor, mostra o resumo do registro local, se houver.
 */
export function PaginaCaixaPreta({ rota }: { rota: RotaCaixaPreta }) {
  const sessao = rota.sessao
  const { registros } = useArmazenamentoJornada()
  const [estado, setEstado] = useState<EstadoReplay>({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const [erroAtualizacao, setErroAtualizacao] = useState<string | null>(null)
  const [artigoKb, setArtigoKb] = useState<string | null>(null)
  const [kbRetornoLinkUri, setKbRetornoLinkUri] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    apiClient
      .obterReplay(sessao)
      .then((replay) => {
        if (ativo) setEstado({ tipo: 'pronto', replay })
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        setEstado(
          classificarFalha(erro) === 'sessao-indisponivel'
            ? { tipo: 'indisponivel' }
            : { tipo: 'falha', mensagem: mensagemDe(erro) },
        )
      })
    return () => {
      ativo = false
    }
  }, [sessao, tentativa])

  function tentarDeNovo() {
    setEstado({ tipo: 'carregando' })
    setTentativa((valor) => valor + 1)
  }

  async function atualizar() {
    setAtualizando(true)
    setErroAtualizacao(null)
    try {
      setEstado({ tipo: 'pronto', replay: await apiClient.obterReplay(sessao) })
    } catch (erro) {
      setErroAtualizacao(mensagemDe(erro))
    } finally {
      setAtualizando(false)
    }
  }

  function abrirArtigo(artigoId: string, origem: HTMLElement) {
    setKbRetornoLinkUri(
      origem.getAttribute('data-kb-uri') ?? origem.getAttribute('aria-label')?.replace(/^Consultar KB: /, '') ?? null,
    )
    setArtigoKb(artigoId)
  }

  const registro = registros.find((item) => item.sessaoId === sessao) ?? null
  const linkBreve = { tipo: 'link', rotulo: 'Ver o Brevê', href: enderecoDe({ pagina: 'breve' }) } as const

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA['caixa-preta']}</h1>
        <p className="pagina-jornada-texto">
          Linha do tempo do voo e avaliação por critério, como o Juiz 360º registrou.
        </p>
      </header>
      {estado.tipo === 'carregando' && (
        <p className="muted" role="status">
          Carregando a Caixa-preta.
        </p>
      )}
      {estado.tipo === 'pronto' && (
        <>
          {erroAtualizacao && (
            <AvisoHonesto bloqueante acoes={[{ tipo: 'botao', rotulo: 'Tentar de novo', aoClicar: () => void atualizar() }]}>
              Não foi possível atualizar o relatório. {erroAtualizacao}
            </AvisoHonesto>
          )}
          {artigoKb ? (
            <IntranetApp
              key={artigoKb}
              artigoSelecionadoId={artigoKb}
              onArtigoFechado={() => setArtigoKb(null)}
            />
          ) : (
            <ReplayView
              replay={estado.replay}
              onAtualizar={atualizar}
              ocupado={atualizando}
              onNavegaKb={abrirArtigo}
              kbRetornoLinkUri={kbRetornoLinkUri}
            />
          )}
        </>
      )}
      {estado.tipo === 'indisponivel' && (
        <>
          <AvisoHonesto bloqueante acoes={registro ? [refazer(registro.missao), linkBreve] : [linkBreve]}>
            {TEXTO_CAIXA_PRETA_INDISPONIVEL}
          </AvisoHonesto>
          {registro && <ResumoLocalDoVoo registro={registro} />}
        </>
      )}
      {estado.tipo === 'falha' && (
        <AvisoHonesto
          bloqueante
          acoes={[{ tipo: 'botao', rotulo: 'Tentar de novo', aoClicar: tentarDeNovo }, linkBreve]}
        >
          Não foi possível carregar a Caixa-preta. {estado.mensagem}
        </AvisoHonesto>
      )}
      <PainelComandante papel="mentor" pagina="caixa-preta" />
    </div>
  )
}
