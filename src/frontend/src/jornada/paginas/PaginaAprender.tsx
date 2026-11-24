import { useState } from 'react'
import { TelaProvaTeorica } from '../../teorico/TelaProvaTeorica'
import type { ConfigProva } from '../../teorico/estadoProva'
import { Icone } from '../../ui/Icone'
import { PainelMentor } from '../mentor/PainelMentor'
import { NOME_PAGINA } from '../navegacao/rotas'
import { DOMINIOS_SIMULADO } from '../simulados/configSimulado'

/** Página Aprender (Nível Teórico): prática imediata por domínio com explicações e referência. */
export function PaginaAprender() {
  const [configAtiva, setConfigAtiva] = useState<ConfigProva | null>(null)

  if (configAtiva) {
    return (
      <TelaProvaTeorica
        config={configAtiva}
        titulo="Aprender (Nível Teórico)"
        aoSair={() => setConfigAtiva(null)}
        aoNovo={() => setConfigAtiva(null)}
      />
    )
  }

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.aprender}</h1>
        <p className="pagina-jornada-texto">
          Nível Teórico: pratique questões por domínio com verificação imediata e explicação estruturada.
        </p>
      </header>

      <div className="certsim-grade-3">
        {DOMINIOS_SIMULADO.map((dominio) => (
          <article key={dominio} className="certsim-cartao">
            <h2 className="h3">{dominio}</h2>
            <p className="muted">Questões objetivas de nível 1 a 3 com explicação imediata.</p>
            <div className="acoes-linha">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setConfigAtiva({
                    formato: 'pratica',
                    escopo: 'personalizado',
                    topicos: [dominio],
                    quantidade: 10,
                    origem: 'pratica',
                  })
                }
              >
                <Icone nome="aprender" tamanho={16} />
                <span>Praticar tópico</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <PainelMentor papel="consultor" pagina="aprender" />
    </div>
  )
}
