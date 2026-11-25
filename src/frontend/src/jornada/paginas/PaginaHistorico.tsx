import { useMemo, useState } from 'react'
import { Icone } from '../../ui/Icone'
import { textosDaMissao } from '../componentes/textosDaMissao'
import { useArmazenamentoJornada } from '../contextoArmazenamentoJornada'
import { PainelMentor } from '../mentor/PainelMentor'
import { LinkInterno } from '../navegacao/LinkInterno'
import { NOME_PAGINA, enderecoDe } from '../navegacao/rotas'
import { lerHistorico } from '../simulados/historico'
import { calcularNotaCriterios, sincronizarProvasLabDeRegistros } from '../simulados/portfolioLab'

type FiltroHistorico = 'todos' | 'teorico' | 'lab' | 'aprovados'
type FiltroModoLab = 'todos' | 'guiado' | 'prova'

function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return `${min}m ${String(seg).padStart(2, '0')}s`
}

/** Página Histórico: unifica simulados, provas teóricas e missões de laboratório. */
export function PaginaHistorico() {
  const { registros } = useArmazenamentoJornada()
  const [filtro, setFiltro] = useState<FiltroHistorico>('todos')
  const [filtroModoLab, setFiltroModoLab] = useState<FiltroModoLab>('todos')
  const entradas = useMemo(() => lerHistorico(), [])
  const entradasProvaLab = useMemo(() => sincronizarProvasLabDeRegistros(registros), [registros])

  const sessoesLabConcluidas = useMemo(() => {
    const porSessaoProva = new Map(entradasProvaLab.map((item) => [item.sessaoId, item]))
    const lista = registros.map((reg) => {
      const prova = porSessaoProva.get(reg.sessaoId)
      return {
        sessaoId: reg.sessaoId,
        cenario: textosDaMissao(reg.missao).titulo,
        data: reg.concluidoEm,
        modo: prova ? ('prova' as const) : ('guiado' as const),
        nota: prova ? prova.nota : calcularNotaCriterios(reg.resultado.criterios),
        xpTotal: reg.resultado.xpTotal,
      }
    })
    const idsExistentes = new Set(lista.map((item) => item.sessaoId))
    for (const prova of entradasProvaLab) {
      if (!idsExistentes.has(prova.sessaoId)) {
        lista.push({
          sessaoId: prova.sessaoId,
          cenario: prova.cenarioTitulo,
          data: prova.data,
          modo: 'prova' as const,
          nota: prova.nota,
          xpTotal: 0,
        })
      }
    }
    return lista.sort((a, b) => b.data.localeCompare(a.data))
  }, [registros, entradasProvaLab])

  const sessoesLabFiltradas = useMemo(() => {
    if (filtroModoLab === 'todos') return sessoesLabConcluidas
    return sessoesLabConcluidas.filter((item) => item.modo === filtroModoLab)
  }, [sessoesLabConcluidas, filtroModoLab])

  const filtradas = useMemo(() => {
    switch (filtro) {
      case 'teorico':
        return entradas.filter((e) => e.tipo === 'teorico')
      case 'lab':
        return entradas.filter((e) => e.tipo === 'lab')
      case 'aprovados':
        return entradas.filter((e) => e.aprovado)
      default:
        return entradas
    }
  }, [entradas, filtro])

  const melhorNota = entradas.reduce((max, e) => Math.max(max, e.percentual), 0)

  return (
    <div className="page pagina-jornada">
      <header>
        <h1 className="h1">{NOME_PAGINA.historico}</h1>
        <p className="pagina-jornada-texto">
          Registro unificado de simulados, provas e atendimentos práticos salvos neste navegador.
        </p>
      </header>

      <div className="certsim-grade-3">
        <article className="certsim-cartao">
          <p className="eyebrow">Total de tentativas</p>
          <p className="certsim-kpi dado-mono">{entradas.length + registros.length}</p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Melhor percentual</p>
          <p className="certsim-kpi dado-mono">{melhorNota}%</p>
        </article>
        <article className="certsim-cartao">
          <p className="eyebrow">Missões de Lab concluídas</p>
          <p className="certsim-kpi dado-mono">{registros.length}</p>
        </article>
      </div>

      <section className="secao-jornada" aria-labelledby="historico-lista-titulo">
        <div className="certsim-cartao-topo">
          <h2 id="historico-lista-titulo" className="h2">
            Simulados e provas ({filtradas.length})
          </h2>
          <div className="certsim-filtros" role="group" aria-label="Filtrar histórico">
            {(
              [
                ['todos', 'Todos'],
                ['teorico', 'Teórico'],
                ['lab', 'Lab'],
                ['aprovados', 'Aprovados'],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                className="certsim-chip-botao"
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="certsim-cartao">
            <p className="pagina-jornada-texto">Nenhum simulado ou prova registrado para este filtro ainda.</p>
            <div className="acoes-linha">
              <LinkInterno href="/simulados" className="btn btn-primary">
                <Icone nome="simulados" tamanho={20} />
                <span>Fazer primeiro simulado</span>
              </LinkInterno>
            </div>
          </div>
        ) : (
          <ul className="lista-simples">
            {filtradas.map((item) => (
              <li key={item.id} className="certsim-item-lista">
                <div>
                  <strong>
                    {item.tipo === 'teorico' ? 'Teórico' : 'Lab'} · {item.origem === 'prova' ? 'Prova' : item.formato === 'pratica' ? 'Prática' : 'Simulado'} ({item.escopo})
                  </strong>
                  <p className="muted">
                    {new Date(item.quando).toLocaleString('pt-BR')} · Duração {formatarDuracao(item.duracaoSeg)}
                  </p>
                </div>
                <div className="acoes-linha">
                  <span className="dado-mono">{item.percentual}%</span>
                  <span className="selo-status">{item.aprovado ? 'Aprovado' : 'Em revisão'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="secao-jornada" aria-labelledby="historico-labs-titulo">
        <div className="certsim-cartao-topo">
          <h2 id="historico-labs-titulo" className="h2">
            Sessões de Lab concluídas ({sessoesLabFiltradas.length})
          </h2>
          <div className="certsim-filtros" role="group" aria-label="Filtrar sessões de Lab por modo">
            {(
              [
                ['todos', 'Todos os modos'],
                ['guiado', 'Guiado'],
                ['prova', 'Prova'],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                className="certsim-chip-botao"
                aria-pressed={filtroModoLab === id}
                onClick={() => setFiltroModoLab(id)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        {sessoesLabFiltradas.length === 0 ? (
          <div className="certsim-cartao">
            <p className="pagina-jornada-texto">Nenhuma sessão de Lab concluída para este filtro ainda.</p>
          </div>
        ) : (
          <ul className="lista-simples">
            {sessoesLabFiltradas.map((sessao) => (
              <li key={sessao.sessaoId} className="certsim-item-lista">
                <div>
                  <strong>{sessao.cenario}</strong>
                  <p className="muted">
                    {new Date(sessao.data).toLocaleString('pt-BR')} · Modo{' '}
                    {sessao.modo === 'prova' ? 'Prova' : 'Guiado'}
                    {sessao.xpTotal > 0 ? ` · ${sessao.xpTotal} XP` : ''}
                  </p>
                </div>
                <div className="acoes-linha">
                  <span className="selo-status">{sessao.modo === 'prova' ? 'Prova' : 'Guiado'}</span>
                  <span className="dado-mono" aria-label={`Nota ${sessao.nota}%`}>
                    {sessao.nota}%
                  </span>
                  <LinkInterno
                    href={enderecoDe({ pagina: 'revisao', sessao: sessao.sessaoId })}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Abrir Revisão</span>
                  </LinkInterno>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PainelMentor papel="mentor" pagina="historico" />
    </div>
  )
}
