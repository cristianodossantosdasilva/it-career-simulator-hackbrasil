import { useState } from 'react'
import { TelaProvaTeorica } from '../../teorico/TelaProvaTeorica'
import type { ConfigProva } from '../../teorico/estadoProva'
import { Icone } from '../../ui/Icone'
import { rotaPorId } from '../catalogos/catalogoRotas'
import { ROTA_PADRAO_DE_PERFIL } from '../catalogos/regrasIndicacao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { navegar } from '../navegacao/navegador'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { calcularProgressoRota } from '../progressoRota'
import { REGRAS_SIMULADO } from '../simulados/configSimulado'

const CONFIG_PROVA_TEORICA: ConfigProva = {
  formato: 'padrao',
  escopo: 'completo',
  quantidade: 40,
  origem: 'prova',
}

/** Página Provas: avaliações formais completas (Prova teórica e Prova de Lab) para atestar prontidão. */
export function PaginaProvas() {
  const { cartao, registros, modoDemonstracao } = useArmazenamentoJornada()
  const [emProvaTeorica, setEmProvaTeorica] = useState(false)
  const [confirmando, setConfirmando] = useState<'teorica' | 'lab' | null>(null)

  function iniciarProvaLab() {
    const rota = rotaPorId(cartao?.rotaId ?? '') ?? rotaPorId(ROTA_PADRAO_DE_PERFIL)
    const visoes = rota ? calcularProgressoRota(rota, registros, { modoDemonstracao }) : []
    const disponivel = visoes
      .flatMap((e) => e.grupos.flatMap((g) => g.missoes))
      .find((m) => m.podeIniciar)
    const missao = disponivel?.missao ?? 'reset-senha-desbloqueio'
    navegar(enderecoDe({ pagina: 'mesa-de-trabalho', missao, semente: null, causa: null, nova: true, modo: 'prova' }))
  }

  if (emProvaTeorica) {
    return (
      <TelaProvaTeorica
        config={CONFIG_PROVA_TEORICA}
        titulo="Prova teórica oficial"
        aoSair={() => {
          setEmProvaTeorica(false)
          setConfirmando(null)
        }}
        aoNovo={() => {
          setEmProvaTeorica(false)
          setConfirmando(null)
        }}
      />
    )
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.provas}</h1>
        <p className="pagina-jornada-texto">
          Provas completas cronometradas que atestam seu preparo no Teórico e no Lab, gerando registro verificável.
        </p>
      </header>

      {confirmando ? (
        <section className="certsim-cartao" aria-labelledby="prova-pronto-titulo">
          <p className="eyebrow">{confirmando === 'teorica' ? 'Prova teórica' : 'Prova de Lab'}</p>
          <h2 id="prova-pronto-titulo" className="h2">
            Pronto para começar?
          </h2>
          <ol className="certsim-lista-regras">
            {REGRAS_SIMULADO.map((regra) => (
              <li key={regra}>{regra}</li>
            ))}
          </ol>
          <div className="acoes-linha">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmando(null)}>
              <Icone nome="voltar" tamanho={20} />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => (confirmando === 'teorica' ? setEmProvaTeorica(true) : iniciarProvaLab())}
            >
              <Icone nome="iniciar" tamanho={20} />
              <span>Iniciar prova</span>
            </button>
          </div>
        </section>
      ) : (
        <div className="certsim-grade-2">
          <article className="certsim-cartao">
            <div className="certsim-cartao-topo">
              <h2 className="h2">Prova teórica</h2>
              <span className="selo-status">40 questões · 60 min</span>
            </div>
            <p className="pagina-jornada-texto">
              Avaliação padrão completa cobrindo todos os 6 domínios de suporte e operações. Nota mínima: 70%.
            </p>
            <div className="acoes-linha">
              <button type="button" className="btn btn-primary" onClick={() => setConfirmando('teorica')}>
                <Icone nome="provas" tamanho={20} />
                <span>Iniciar Prova teórica</span>
              </button>
            </div>
          </article>

          <article className="certsim-cartao">
            <div className="certsim-cartao-topo">
              <h2 className="h2">Prova de Lab</h2>
              <span className="selo-status">4 chamados · 40 min</span>
            </div>
            <p className="pagina-jornada-texto">
              Atendimento prático na Mesa de Trabalho sem pistas, avaliado de forma determinística pelo Juiz 360º.
            </p>
            <div className="acoes-linha">
              <button type="button" className="btn btn-primary" onClick={() => setConfirmando('lab')}>
                <Icone nome="laboratorio" tamanho={20} />
                <span>Iniciar Prova de Lab</span>
              </button>
            </div>
          </article>
        </div>
      )}

      <PainelMentor papel="instrutor" pagina="provas" />
    </div>
  )
}
