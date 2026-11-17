import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import type { VisaoBrevePiloto } from '../progressoRota'

interface PropsSecaoBrevePiloto {
  visao: VisaoBrevePiloto
  /** Nível do título da seção. Na página Brevê, h2. */
  nivelTitulo?: 2 | 3
}

export const TEXTO_AGUARDA_PREPARACAO = 'Aguarda missão em preparação no simulador.'

/** Brevê de piloto: estado e as quatro exigências, sempre em texto e ícone. */
export function SecaoBrevePiloto({ visao, nivelTitulo = 2 }: PropsSecaoBrevePiloto) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h3'
  const idTitulo = useId()
  return (
    <section
      className={visao.conquistado ? 'breve-piloto breve-piloto-conquistado' : 'breve-piloto'}
      aria-labelledby={idTitulo}
    >
      <Titulo className="breve-piloto-titulo" id={idTitulo}>
        Brevê de piloto
      </Titulo>
      <p className="breve-piloto-estado">
        <Icone nome={visao.conquistado ? 'breve' : 'pendente'} tamanho={20} />
        <strong>{visao.conquistado ? 'Brevê de piloto conquistado' : 'Brevê de piloto pendente'}</strong>
      </p>
      <ul className="breve-piloto-lista">
        {visao.exigencias.map((exigencia) => (
          <li
            key={exigencia.escalaId}
            className={exigencia.cumprida ? 'breve-exigencia breve-exigencia-cumprida' : 'breve-exigencia'}
          >
            <Icone nome={exigencia.cumprida ? 'status-disponivel' : 'pendente'} tamanho={16} />
            <span className="breve-exigencia-texto">
              {exigencia.rotulo}: <strong>{exigencia.cumprida ? 'Cumprida' : 'Pendente'}</strong>
              {exigencia.aguardaPreparacao && (
                <span className="d-block muted">{TEXTO_AGUARDA_PREPARACAO}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
