import { useState } from 'react'
import type { EscopoProva, FormatoProva } from '../../api/teorico'
import { Icone } from '../../ui/Icone'
import {
  type ConfiguracaoSimuladoEscolhida,
  DOMINIOS_SIMULADO,
  REGRAS_SIMULADO,
  type TipoSimulado,
} from './configSimulado'

interface PropsConfigurarSimulado {
  tipoInicial?: TipoSimulado
  aoIniciar: (config: ConfiguracaoSimuladoEscolhida) => void
}

/**
 * Configurador unificado no padrão CertSim para Simulado Teórico e Simulado de Lab:
 * escolha do tipo, formato (Padrão vs Prática), escopo (Completo vs Personalizado), domínios e
 * quadro Pronto para começar com cinco regras.
 */
export function ConfigurarSimulado({ tipoInicial = 'teorico', aoIniciar }: PropsConfigurarSimulado) {
  const [tipo, setTipo] = useState<TipoSimulado>(tipoInicial)
  const [formato, setFormato] = useState<FormatoProva>('padrao')
  const [escopo, setEscopo] = useState<EscopoProva>('completo')
  const [dominios, setDominios] = useState<string[]>([...DOMINIOS_SIMULADO])
  const [nivel, setNivel] = useState<1 | 2 | 3 | undefined>(undefined)
  const [quantidade, setQuantidade] = useState<number>(20)
  const [etapaPronto, setEtapaPronto] = useState(false)

  function alternarDominio(dom: string) {
    setDominios((atuais) => {
      if (atuais.includes(dom)) return atuais.length > 1 ? atuais.filter((d) => d !== dom) : atuais
      return [...atuais, dom]
    })
  }

  const resumoPadrao = tipo === 'teorico' ? '40 questões · 60 min · 70% para aprovar' : '4 chamados · 40 min · Juiz 360º'

  if (etapaPronto) {
    return (
      <section className="certsim-cartao" aria-labelledby="pronto-simulado-titulo">
        <p className="eyebrow">
          {tipo === 'teorico' ? 'Simulado Teórico' : 'Simulado de Lab'} · {formato === 'padrao' ? 'Padrão' : 'Prática'} ·{' '}
          {escopo === 'completo' ? 'Completo' : 'Personalizado'}
        </p>
        <h2 id="pronto-simulado-titulo" className="h2">
          Pronto para começar?
        </h2>
        <p className="muted">{escopo === 'completo' ? resumoPadrao : `${quantidade} itens nos domínios escolhidos`}</p>
        <ol className="certsim-lista-regras">
          {REGRAS_SIMULADO.map((regra) => (
            <li key={regra}>{regra}</li>
          ))}
        </ol>
        <div className="acoes-linha">
          <button type="button" className="btn btn-secondary" onClick={() => setEtapaPronto(false)}>
            <Icone nome="voltar" tamanho={20} />
            <span>Voltar e ajustar</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => aoIniciar({ tipo, formato, escopo, dominios, nivel, quantidade })}
          >
            <Icone nome="iniciar" tamanho={20} />
            <span>Começar agora</span>
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="secao-jornada" aria-labelledby="simulado-tipo-titulo">
        <h2 id="simulado-tipo-titulo" className="h2">
          1. Escolha o tipo de simulado
        </h2>
        <div className="certsim-grade-2">
          <button
            type="button"
            aria-pressed={tipo === 'teorico'}
            className={tipo === 'teorico' ? 'certsim-cartao certsim-cartao-ativo' : 'certsim-cartao'}
            onClick={() => setTipo('teorico')}
          >
            <span className="certsim-cartao-topo">
              <strong className="h3">Simulado Teórico</strong>
              <span className="selo-status">40 questões</span>
            </span>
            <span className="muted">Questões objetivas sobre suporte, redes, segurança, hardware, ERP e backup.</span>
          </button>
          <button
            type="button"
            aria-pressed={tipo === 'lab'}
            className={tipo === 'lab' ? 'certsim-cartao certsim-cartao-ativo' : 'certsim-cartao'}
            onClick={() => setTipo('lab')}
          >
            <span className="certsim-cartao-topo">
              <strong className="h3">Simulado de Lab</strong>
              <span className="selo-status">4 chamados</span>
            </span>
            <span className="muted">Atendimento prático na Mesa de Trabalho com avaliação determinística do Juiz 360º.</span>
          </button>
        </div>
      </section>

      <section className="secao-jornada" aria-labelledby="simulado-formato-titulo">
        <h2 id="simulado-formato-titulo" className="h2">
          2. Escolha o formato
        </h2>
        <div className="certsim-grade-2">
          <button
            type="button"
            aria-pressed={formato === 'padrao'}
            className={formato === 'padrao' ? 'certsim-cartao certsim-cartao-ativo' : 'certsim-cartao'}
            onClick={() => setFormato('padrao')}
          >
            <span className="certsim-cartao-topo">
              <strong className="h3">Padrão (cronometrado)</strong>
              <span className="selo-status">Resultado só no fim</span>
            </span>
            <span className="muted">{resumoPadrao}</span>
          </button>
          <button
            type="button"
            aria-pressed={formato === 'pratica'}
            className={formato === 'pratica' ? 'certsim-cartao certsim-cartao-ativo' : 'certsim-cartao'}
            onClick={() => setFormato('pratica')}
          >
            <span className="certsim-cartao-topo">
              <strong className="h3">Prática (sem cronômetro)</strong>
              <span className="selo-status">Feedback imediato</span>
            </span>
            <span className="muted">Verifique cada resposta na hora com explicação estruturada e referência.</span>
          </button>
        </div>
      </section>

      <section className="secao-jornada" aria-labelledby="simulado-escopo-titulo">
        <h2 id="simulado-escopo-titulo" className="h2">
          3. Escopo e domínios
        </h2>
        <div className="certsim-filtros">
          <button
            type="button"
            className="certsim-chip-botao"
            aria-pressed={escopo === 'completo'}
            onClick={() => setEscopo('completo')}
          >
            {formato === 'padrao' ? 'Completo (todos os domínios)' : 'Completa (todos os domínios)'}
          </button>
          <button
            type="button"
            className="certsim-chip-botao"
            aria-pressed={escopo === 'personalizado'}
            onClick={() => setEscopo('personalizado')}
          >
            {formato === 'padrao' ? 'Personalizado' : 'Personalizada'}
          </button>
        </div>

        {escopo === 'personalizado' && (
          <div className="certsim-cartao">
            <p className="h3">Domínios incluídos</p>
            <div className="certsim-chips" role="group" aria-label="Domínios do simulado">
              {DOMINIOS_SIMULADO.map((dom) => (
                <button
                  key={dom}
                  type="button"
                  className="certsim-chip-botao"
                  aria-pressed={dominios.includes(dom)}
                  onClick={() => alternarDominio(dom)}
                >
                  {dom}
                </button>
              ))}
            </div>

            {tipo === 'teorico' && (
              <div className="certsim-filtros">
                <label>
                  <span className="muted">Quantidade: </span>
                  <select
                    aria-label="Quantidade de questões"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  >
                    <option value={10}>10 questões</option>
                    <option value={20}>20 questões</option>
                    <option value={40}>40 questões</option>
                  </select>
                </label>
                <label>
                  <span className="muted">Nível: </span>
                  <select
                    aria-label="Nível de dificuldade"
                    value={nivel ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setNivel(val === '1' || val === '2' || val === '3' ? (Number(val) as 1 | 2 | 3) : undefined)
                    }}
                  >
                    <option value="">Todos os níveis</option>
                    <option value="1">Nível 1 (Base)</option>
                    <option value="2">Nível 2 (Intermediário)</option>
                    <option value="3">Nível 3 (Avançado)</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}

        <div className="acoes-linha">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => setEtapaPronto(true)}>
            <Icone nome="avancar" tamanho={20} />
            <span>Avançar para revisão das regras</span>
          </button>
        </div>
      </section>
    </div>
  )
}
