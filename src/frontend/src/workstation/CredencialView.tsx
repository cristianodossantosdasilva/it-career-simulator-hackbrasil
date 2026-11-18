import { useState } from 'react'
import type { CarreiraResumoResponse } from '../api/types'
import {
  LEVELS,
  type EstadoAcademia,
  type NivelEducacional,
  calcularProgressoNivel,
} from '../educacao/catalogoEducacional'
import { textosDaMissao } from '../jornada/componentes/textosDaMissao'
import type { IdMissao } from '../jornada/catalogos/catalogoRotas'
import { Icone } from '../ui/Icone'
import { verificarCurriculoVivoJson, type ResultadoVerificacaoCurriculo } from '../utils/jcs'

interface CredencialViewProps {
  estado: EstadoAcademia
  xpTotal: number
  resumoCarreira?: CarreiraResumoResponse | null
  apelido: string
  onApelidoChange?: (valor: string) => void
  onAtualizarCarreira?: (apelido?: string) => void
  onPraticar: (nivel: NivelEducacional) => void
  /**
   * Aviso de que a prática do nível ainda não está liberada, ou null com o portão aberto. Com aviso, o
   * botão mostra o estado e leva ao Plano de voo em vez de prometer a Cabine.
   */
  avisoDaPratica?: (nivel: NivelEducacional) => string | null
  /** Nível do título. O Brevê tem o próprio h1 e passa 2. */
  nivelTitulo?: 1 | 2
}

const ROTULO_VERIFICACAO: Record<ResultadoVerificacaoCurriculo['status'], string> = {
  integro: 'INTEGRO:',
  divergente: 'DIVERGENTE:',
  nao_verificavel: 'NAO VERIFICAVEL:',
}

const CLASSE_VERIFICACAO: Record<ResultadoVerificacaoCurriculo['status'], string> = {
  integro: 'alert-success',
  divergente: 'alert-danger',
  nao_verificavel: 'banner-notice',
}

/** Destino Credencial: progresso, resumo de carreira e verificador local do Curriculo Vivo. */
export function CredencialView({
  estado,
  xpTotal,
  resumoCarreira,
  apelido,
  onApelidoChange,
  onAtualizarCarreira,
  onPraticar,
  avisoDaPratica,
  nivelTitulo = 1,
}: CredencialViewProps) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h1'
  const [jsonVerificar, setJsonVerificar] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [resultado, setResultado] = useState<ResultadoVerificacaoCurriculo | null>(null)

  async function executarVerificacao(conteudo: string) {
    setJsonVerificar(conteudo)
    if (!conteudo.trim()) {
      setResultado(null)
      return
    }
    setResultado(await verificarCurriculoVivoJson(conteudo))
  }

  function exportarCurriculoVivo() {
    if (!resumoCarreira) return
    const payload = {
      ...resumoCarreira,
      apelido: apelido.trim() || resumoCarreira.apelido || null,
      exportadoEm: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'curriculo-vivo-itfs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const promocoes: [IdMissao, boolean][] = resumoCarreira
    ? [
        ['triagem-engenharia-social', resumoCarreira.promocoes.nivel1Concluido],
        ['pasta-rede-inacessivel', resumoCarreira.promocoes.nivel2Concluido],
        ['incidente-massivo', resumoCarreira.promocoes.nivel3Concluido],
        ['sre-cloud-latencia', resumoCarreira.promocoes.nivel4Concluido],
        ['diagnostico-sql-readonly', resumoCarreira.promocoes.nivel4bConcluido],
      ]
    : []

  return (
    <div className="page credencial">
      <div className="page-head">
        <Titulo className={nivelTitulo === 2 ? 'h2' : 'h1'}>Credencial</Titulo>
        <p className="lead">
          Seu progresso e o Currículo Vivo. A assinatura ECDSA P-256 mostra que o arquivo gerado pelo servidor não foi
          alterado depois da exportação. Não é diploma técnico nem certificação de terceiros.
        </p>
      </div>

      <div className="credencial-grade">
        <section className="credencial-bloco" aria-labelledby="cred-progresso">
          <h2 id="cred-progresso" className="h2">
            Seu progresso
          </h2>
          <dl className="dados-resumo">
            <div>
              <dt>XP total</dt>
              <dd className="dado-mono">{xpTotal}</dd>
            </div>
            <div>
              <dt>Aulas concluídas</dt>
              <dd className="dado-mono">{estado.lessonsDone.length}</dd>
            </div>
            <div>
              <dt>Laboratórios concluídos</dt>
              <dd className="dado-mono">{estado.labsDone.length}</dd>
            </div>
            <div>
              <dt>Histórias STAR</dt>
              <dd className="dado-mono">{estado.pitches.length}</dd>
            </div>
          </dl>

          <h3 className="h3 mt">Evolução por nível</h3>
          <ul className="evolucao">
            {LEVELS.map((nivel) => {
              const p = calcularProgressoNivel(estado, nivel.id)
              const aviso = avisoDaPratica?.(nivel) ?? null
              return (
                <li key={nivel.id} className="evolucao-linha">
                  <div>
                    <strong>{nivel.nome}</strong>
                    <p className="muted dado-mono">
                      Teoria {p.t}%, Fixação {p.f}%, Prática {p.p}%
                    </p>
                    {aviso && (
                      <p id={`aviso-pratica-${nivel.id}`} className="muted">
                        {aviso}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-describedby={aviso ? `aviso-pratica-${nivel.id}` : undefined}
                    onClick={() => onPraticar(nivel)}
                  >
                    {aviso ? 'Ver o Plano de voo' : 'Praticar'}
                  </button>
                </li>
              )
            })}
          </ul>

          {estado.pitches.length > 0 && (
            <>
              <h3 className="h3 mt">Histórias STAR salvas</h3>
              {estado.pitches.map((pitch) => (
                <div key={pitch.at} className="preview mt">
                  {pitch.text}
                </div>
              ))}
            </>
          )}
        </section>

        <div className="stack">
          {resumoCarreira ? (
            <section
              id="cv-panel"
              className="credencial-bloco"
              aria-label="Progressão de Carreira e Currículo Vivo"
            >
              <h2 className="h2">Currículo Vivo</h2>
              <p className="credencial-cargo">
                <strong>{resumoCarreira.cargoAtual}</strong>
                <span className="dado-mono">{resumoCarreira.xpTotal} XP</span>
              </p>

              <ul className="promocoes">
                {promocoes.map(([missao, ok]) => (
                  <li key={missao} className={ok ? 'ok' : undefined}>
                    {ok && <Icone nome="confirmar" tamanho={16} />}
                    {`${textosDaMissao(missao).titulo} ${ok ? 'OK' : 'Pendente'}`}
                  </li>
                ))}
              </ul>

              {resumoCarreira.sessoesNaoConfirmadas.length > 0 && (
                <p className="muted mt">
                  {resumoCarreira.sessoesNaoConfirmadas.length} sessão(ões) marcada(s) como não confirmada (expirada ou
                  ausente; sem XP).
                </p>
              )}

              <div className="career-form">
                <label className="field-stack">
                  Apelido no Currículo Vivo (opcional)
                  <input
                    type="text"
                    placeholder="Ex.: Ana Paula"
                    value={apelido}
                    onChange={(e) => onApelidoChange?.(e.target.value)}
                  />
                </label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAtualizarCarreira?.(apelido)}>
                  Atualizar resumo
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={exportarCurriculoVivo}>
                  <Icone nome="baixar" tamanho={16} />
                  Exportar Currículo Vivo (JSON)
                </button>
              </div>

              <details className="detalhes-tecnicos">
                <summary>Detalhes técnicos da integridade</summary>
                <dl>
                  <div>
                    <dt>Hash ({resumoCarreira.integridade.algoritmo})</dt>
                    <dd>
                      <code>{resumoCarreira.integridade.hash}</code>
                    </dd>
                  </div>
                  {resumoCarreira.integridade.algoritmoAssinatura && (
                    <div>
                      <dt>Assinatura ({resumoCarreira.integridade.algoritmoAssinatura})</dt>
                      <dd>
                        Chave <code>{resumoCarreira.integridade.kid}</code>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Regra do hash</dt>
                    <dd>{resumoCarreira.integridade.regraHash}</dd>
                  </div>
                </dl>
              </details>
            </section>
          ) : (
            <section className="credencial-bloco" aria-labelledby="cred-vazio">
              <h2 id="cred-vazio" className="h2">
                Currículo Vivo
              </h2>
              <p className="muted">
                Conclua um turno no laboratório para gerar o resumo de carreira e exportar o Currículo Vivo.
              </p>
            </section>
          )}

          <section className="credencial-bloco" aria-label="Verificador local de Currículo Vivo">
            <h2 className="h2">Verificador offline</h2>
            <p className="muted">
              Valide a integridade SHA-256 e a assinatura ECDSA P-256 de um arquivo{' '}
              <code>curriculo-vivo-itfs.json</code> localmente no navegador.
            </p>
            <div className="verifier-body">
              <label className="field-stack">
                Cole o JSON do Currículo Vivo ou selecione o arquivo .json
                <textarea
                  rows={4}
                  placeholder='{"cargoAtual": "...", "xpTotal": 0, ...}'
                  value={jsonVerificar}
                  onChange={(e) => void executarVerificacao(e.target.value)}
                  className="verifier-textarea"
                />
              </label>
              <div className="verifier-file">
                {/* O input real continua no fluxo de foco (sr-only). O texto nativo do navegador é
                    inglês, por isso o botão visível é um label ligado ao input. */}
                <input
                  id="verificador-arquivo"
                  className="verifier-file-entrada sr-only"
                  type="file"
                  accept=".json,application/json"
                  aria-label="Selecionar arquivo JSON do Currículo Vivo"
                  aria-describedby="verificador-arquivo-nome"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setNomeArquivo(file.name)
                    void file.text().then((txt) => executarVerificacao(txt))
                  }}
                />
                <label htmlFor="verificador-arquivo" className="btn btn-secondary verifier-file-botao">
                  Selecionar arquivo JSON
                </label>
                <span id="verificador-arquivo-nome" className="verifier-file-nome">
                  {nomeArquivo || 'Nenhum arquivo selecionado'}
                </span>
              </div>
              {resultado && (
                <div role="status" className={`verifier-result ${CLASSE_VERIFICACAO[resultado.status]}`}>
                  <strong>{ROTULO_VERIFICACAO[resultado.status]}</strong> {resultado.motivo}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
