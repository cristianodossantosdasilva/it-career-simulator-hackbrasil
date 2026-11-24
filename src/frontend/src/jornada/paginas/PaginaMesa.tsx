import { useEffect, useState } from 'react'
import { MesaAtiva } from '../mesa/MesaAtiva'
import type { IdMissao } from '../catalogos/catalogoRotas'
import { AvisoHonesto } from '../componentes/AvisoHonesto'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useMissao } from '../contextosJornada'
import { TEXTO_MISSAO_EM_PREPARACAO, textoEtapaBloqueada } from '../navegacao/destinoDaPratica'
import { navegar, reescreverEndereco } from '../navegacao/navegador'
import type { DecisaoPortao } from '../navegacao/portoes'
import { NOME_PAGINA, type RotaResolvida, enderecoDe } from '../navegacao/rotas'

type RotaMesa = Extract<RotaResolvida, { pagina: 'mesa-de-trabalho' }>

type EstadoAbertura =
  | { tipo: 'abrindo' }
  | { tipo: 'pronto' }
  | { tipo: 'sessao-indisponivel' }
  | { tipo: 'falha'; mensagem: string }

export const TEXTO_SESSAO_INDISPONIVEL = 'Esta sessão não está mais disponível no servidor.'
export const TEXTO_MISSAO_EM_PREPARACAO_MESA = TEXTO_MISSAO_EM_PREPARACAO

const LINK_PLANO = { tipo: 'link', rotulo: 'Voltar ao Plano de Carreira', href: '/plano-de-carreira' } as const

function enderecoDaMesa(missao: IdMissao, extra: { nova: boolean; semente: number | null; causa: string | null }): string {
  return enderecoDe({ pagina: 'mesa-de-trabalho', missao, ...extra })
}

/**
 * Página Mesa de Trabalho: abre a missão da missão (usa a sessão em memória, retoma a registrada ou cria outra) e
 * mostra o turno de atendimento. O h1 existe desde a primeira renderização. Com o portão fechado, a
 * página só avisa e nunca chama `abrirMissao`, então nenhuma sessão é criada.
 */
export function PaginaMesa({ rota, portao }: { rota: RotaMesa; portao: DecisaoPortao }) {
  const { sessao, ocupado, abrirMissao } = useMissao()
  // O endereço pode perder `nova`, `semente` e `causa` depois da abertura. Os valores da chegada valem.
  const [chegada] = useState(() => ({ semente: rota.semente, causa: rota.causa, nova: rota.nova }))
  const [estado, setEstado] = useState<EstadoAbertura>({ tipo: 'abrindo' })
  const [tentativa, setTentativa] = useState(0)
  const [acordando, setAcordando] = useState(false)
  const portaoAberto = portao.tipo === 'exibir'
  const missao = rota.missao

  useEffect(() => {
    if (!portaoAberto) return
    let ativo = true
    const { semente, causa, nova } = chegada
    void abrirMissao(missao, { semente: semente ?? undefined, causa: causa ?? undefined, nova }).then((resultado) => {
      if (!ativo) return
      if (resultado.tipo === 'pronto') {
        // Recarregar a Mesa de Trabalho depois de criar a sessão retoma a mesma sessão, sem criar outra.
        if (nova || semente !== null || causa !== null) {
          reescreverEndereco(enderecoDaMesa(missao, { nova: false, semente: null, causa: null }))
        }
        setEstado({ tipo: 'pronto' })
      } else if (resultado.tipo === 'sessao-indisponivel') {
        setEstado({ tipo: 'sessao-indisponivel' })
      } else {
        setEstado({ tipo: 'falha', mensagem: resultado.mensagem })
      }
    })
    return () => {
      ativo = false
    }
  }, [abrirMissao, portaoAberto, missao, tentativa, chegada])

  const abrindo = estado.tipo === 'abrindo'
  useEffect(() => {
    if (!ocupado || !abrindo) return
    const temporizador = window.setTimeout(() => setAcordando(true), 2000)
    return () => {
      window.clearTimeout(temporizador)
      setAcordando(false)
    }
  }, [ocupado, abrindo])

  // A sessão em memória da mesma missão já é o turno: sem tela de espera na volta de Aulas, por exemplo.
  const emMemoria = sessao?.meta.cenarioId === missao && !chegada.nova
  const efetivo: EstadoAbertura = abrindo && emMemoria ? { tipo: 'pronto' } : estado
  const pronto = portaoAberto && efetivo.tipo === 'pronto'

  function refazer() {
    navegar(enderecoDaMesa(missao, { nova: true, semente: null, causa: null }), { substituir: true })
  }

  function tentarDeNovo() {
    setEstado({ tipo: 'abrindo' })
    setTentativa((valor) => valor + 1)
  }

  return (
    <div className={pronto ? 'workstation' : 'page pagina-jornada'}>
      {pronto ? (
        <MesaAtiva missao={missao} />
      ) : (
        <header className="mesa-titulo">
          <h1>{NOME_PAGINA['mesa-de-trabalho']}</h1>
          <span className="dado-contexto">{textosDaMissao(missao).titulo}</span>
        </header>
      )}
      {portao.tipo === 'aviso-missao-em-preparacao' && (
        <AvisoHonesto acoes={[LINK_PLANO]}>{TEXTO_MISSAO_EM_PREPARACAO_MESA}</AvisoHonesto>
      )}
      {portao.tipo === 'aviso-etapa-bloqueada' && (
        <AvisoHonesto acoes={[LINK_PLANO]}>{textoEtapaBloqueada(missao, portao.etapaNecessaria)}</AvisoHonesto>
      )}
      {portaoAberto && efetivo.tipo === 'abrindo' && (
        <>
          <p className="muted" role="status">
            Abrindo o turno de atendimento.
          </p>
          {ocupado && acordando && (
            <div className="banner-notice" role="status" aria-live="polite">
              Acordando o servidor da API na nuvem. A primeira chamada após inatividade pode levar alguns segundos.
            </div>
          )}
        </>
      )}
      {portaoAberto && efetivo.tipo === 'sessao-indisponivel' && (
        <AvisoHonesto bloqueante acoes={[{ tipo: 'botao', rotulo: 'Refazer a missão', aoClicar: refazer }, LINK_PLANO]}>
          {TEXTO_SESSAO_INDISPONIVEL}
        </AvisoHonesto>
      )}
      {portaoAberto && efetivo.tipo === 'falha' && (
        <AvisoHonesto
          bloqueante
          acoes={[
            { tipo: 'botao', rotulo: 'Tentar de novo', aoClicar: tentarDeNovo },
            ...(chegada.semente !== null || chegada.causa !== null
              ? [
                  {
                    tipo: 'link' as const,
                    rotulo: 'Iniciar sem semente',
                    href: enderecoDaMesa(missao, { nova: false, semente: null, causa: null }),
                    substituir: true,
                  },
                ]
              : []),
            LINK_PLANO,
          ]}
        >
          {efetivo.mensagem}
        </AvisoHonesto>
      )}
    </div>
  )
}
