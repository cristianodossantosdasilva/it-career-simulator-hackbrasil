import { useState } from 'react'
import { TelaProvaTeorica } from '../../teorico/TelaProvaTeorica'
import type { ConfigProva } from '../../teorico/estadoProva'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { calcularProgressoRota } from '../progressoRota'
import { ConfigurarSimulado } from '../simulados/ConfigurarSimulado'
import { type ConfiguracaoSimuladoEscolhida, paraConfigProva } from '../simulados/configSimulado'

/** Página Simulados: configuração Teórico vs Lab (Padrão e Prática) e execução do Simulado Teórico. */
export function PaginaSimulados() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const [provaAtiva, setProvaAtiva] = useState<ConfigProva | null>(null)

  function iniciar(escolha: ConfiguracaoSimuladoEscolhida) {
    if (escolha.tipo === 'teorico') {
      setProvaAtiva(paraConfigProva(escolha))
      return
    }
    const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_PERFIL)
    const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []
    const disponivel = visoes
      .flatMap((e) => e.grupos.flatMap((g) => g.missoes))
      .find((m) => m.podeIniciar)
    const missao = disponivel?.missao ?? 'reset-senha-desbloqueio'
    navegar(enderecoDe({ pagina: 'mesa-de-trabalho', missao, semente: null, causa: null, nova: true, ...(escolha.formato === 'padrao' ? { modo: 'prova' as const } : {}) }))
  }

  if (provaAtiva) {
    return (
      <TelaProvaTeorica
        config={provaAtiva}
        titulo={provaAtiva.formato === 'pratica' ? 'Simulado Teórico (Prática)' : 'Simulado Teórico (Padrão)'}
        aoSair={() => setProvaAtiva(null)}
        aoNovo={() => setProvaAtiva(null)}
      />
    )
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.simulados}</h1>
        <p className="pagina-jornada-texto">
          Configure seu simulado Teórico ou de Lab no formato Padrão (cronometrado) ou Prática (feedback imediato).
        </p>
      </header>

      <ConfigurarSimulado aoIniciar={iniciar} />
      <PainelMentor papel="instrutor" pagina="simulados" />
    </div>
  )
}
