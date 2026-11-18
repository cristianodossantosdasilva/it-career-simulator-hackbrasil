import { BarraSuperior } from '../educacao/BarraSuperior'
import { obterCardsParaHoje } from '../educacao/catalogoEducacional'
import { PainelPerfilExtra } from '../workstation/PainelPerfilExtra'
import { ehIdMissao } from './catalogos/catalogoRotas'
import { useAcademia, useVoo } from './contextosJornada'
import { useArmazenamentoJornada } from './contextoArmazenamentoJornada'
import { navegar } from './navegacao/navegador'
import { type IdPagina, enderecoDe } from './navegacao/rotas'

/**
 * Barra de navegação da moldura. Reúne os dados da Academia, do voo em memória e dos voos guardados
 * neste navegador. O item Cabine só aparece com voo ativo: sessão em memória ou última missão guardada.
 */
export function BarraDaJornada({ pagina }: { pagina: IdPagina }) {
  const { estadoAcademia, atualizarEstadoAcademia, resumoCarreira, pomodoro } = useAcademia()
  const { sessao, sessaoId } = useVoo()
  const { voosAtivos, modoDemonstracao } = useArmazenamentoJornada()
  const cenarioEmMemoria = sessao?.meta.cenarioId
  const missaoAtiva =
    cenarioEmMemoria && ehIdMissao(cenarioEmMemoria) ? cenarioEmMemoria : voosAtivos.ultimaMissao
  const xpExibido = resumoCarreira ? Math.max(resumoCarreira.xpTotal, estadoAcademia.xp) : estadoAcademia.xp
  const cardsHoje = obterCardsParaHoje(estadoAcademia)

  function abrirCurriculo() {
    navegar(sessaoId && pagina === 'cabine' ? enderecoDe({ pagina: 'caixa-preta', sessao: sessaoId }) : enderecoDe({ pagina: 'breve' }))
  }

  const conteudoPerfil = ({ fechar }: { fechar: () => void }) => (
    <PainelPerfilExtra
      estado={estadoAcademia}
      cardsHoje={cardsHoje}
      pomodoro={pomodoro}
      onRevisar={() => {
        fechar()
        const nivel = cardsHoje[0]?.level ?? estadoAcademia.focus
        atualizarEstadoAcademia((anterior) => ({ ...anterior, focus: nivel }))
        navegar(enderecoDe({ pagina: 'aulas', nivel, modo: 'cards', aula: null }))
      }}
      onAlternarTarefa={(indice) =>
        atualizarEstadoAcademia((anterior) => ({
          ...anterior,
          pages: anterior.pages.map((p) =>
            p.id === 'plano' && p.todos
              ? { ...p, todos: p.todos.map((todo, i) => (i === indice ? { ...todo, done: !todo.done } : todo)) }
              : p,
          ),
        }))
      }
      onEditarPlano={() => {
        fechar()
        atualizarEstadoAcademia((anterior) => ({ ...anterior, activePage: 'plano' }))
        navegar(enderecoDe({ pagina: 'caderno' }))
      }}
    />
  )

  return (
    <BarraSuperior
      paginaAtual={pagina}
      missaoAtiva={missaoAtiva}
      modoDemonstracao={modoDemonstracao}
      estado={estadoAcademia}
      xpOficial={xpExibido}
      onMudarFoco={(nivel) => atualizarEstadoAcademia((anterior) => ({ ...anterior, focus: nivel }))}
      onAbrirCurriculo={abrirCurriculo}
      conteudoPerfil={conteudoPerfil}
    />
  )
}
