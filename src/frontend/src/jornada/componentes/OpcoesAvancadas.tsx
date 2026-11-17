import { useId, useState } from 'react'
import { Icone } from '../../ui/Icone'
import { MISSAO_DEMONSTRACAO, escalaDaMissao } from '../catalogos/catalogoRotas'
import { LinkInterno } from '../navegacao/LinkInterno'
import { enderecoDe } from '../navegacao/rotas'
import type { VisaoEscala } from '../progressoRota'
import { textosDaMissao } from './textosDaMissao'

/** Semente da demo rápida, a mesma que o laboratório usava antes da jornada. */
export const SEMENTE_DEMO_RAPIDA = 42

const PADRAO_SEMENTE = /^\d{1,15}$/

function visaoDaMissao(visoes: readonly VisaoEscala[], id: string) {
  for (const escala of visoes) {
    for (const grupo of escala.grupos) {
      const achada = grupo.missoes.find((missao) => missao.missao === id)
      if (achada) return achada
    }
  }
  return null
}

/**
 * Semente e demo rápida como links para a Cabine. Cada link passa pelos mesmos portões do Embarcar:
 * escala bloqueada ou Missão em preparação não ganham link aqui. A Causa da demo rápida sai do catálogo.
 */
export function OpcoesAvancadas({ visoes }: { visoes: readonly VisaoEscala[] }) {
  const idSemente = useId()
  const idApoio = useId()
  const [semente, setSemente] = useState('')
  const sementeValida = PADRAO_SEMENTE.test(semente) ? Number(semente) : null
  const demonstracao = visaoDaMissao(visoes, MISSAO_DEMONSTRACAO)
  const causaDemo = escalaDaMissao(MISSAO_DEMONSTRACAO)?.missao.causas.find((causa) => causa.status === 'disponivel')
  const embarcaveis = visoes.flatMap((escala) =>
    escala.grupos.flatMap((grupo) => grupo.missoes.filter((missao) => missao.podeEmbarcar)),
  )
  return (
    <details className="opcoes-avancadas">
      <summary>Opções avançadas para teste</summary>
      <div className="stack">
        <p className="muted">
          Para repetir um defeito já visto ou treinar um cenário conhecido. O servidor pode recusar estes parâmetros, e o
          aviso aparece na Cabine.
        </p>
        {demonstracao?.podeEmbarcar && causaDemo ? (
          <p>
            <LinkInterno
              href={enderecoDe({
                pagina: 'cabine',
                missao: MISSAO_DEMONSTRACAO,
                semente: SEMENTE_DEMO_RAPIDA,
                causa: causaDemo.codigo,
                nova: true,
              })}
              className="btn btn-secondary btn-sm"
            >
              <Icone nome="embarcar" tamanho={16} />
              <span>Demo rápida: semente {SEMENTE_DEMO_RAPIDA}, causa disponível</span>
            </LinkInterno>
          </p>
        ) : (
          <p className="muted">A demo rápida fica disponível quando a escala da missão de demonstração estiver liberada.</p>
        )}
        <div className="stack">
          <label htmlFor={idSemente} className="block-label">
            Semente (número opcional)
          </label>
          <input
            id={idSemente}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="text"
            value={semente}
            aria-describedby={idApoio}
            aria-invalid={semente !== '' && sementeValida === null}
            onChange={(evento) => setSemente(evento.target.value.trim())}
          />
          <p id={idApoio} className="muted">
            {semente !== '' && sementeValida === null
              ? 'Use só dígitos, até 15.'
              : 'Com uma semente válida, aparece um link por missão liberada.'}
          </p>
        </div>
        {sementeValida !== null && (
          <ul className="lista-simples">
            {embarcaveis.map((missao) => (
              <li key={missao.missao}>
                <LinkInterno
                  href={enderecoDe({
                    pagina: 'cabine',
                    missao: missao.missao,
                    semente: sementeValida,
                    causa: null,
                    nova: true,
                  })}
                >
                  {textosDaMissao(missao.missao).titulo}, semente {sementeValida}
                </LinkInterno>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}
