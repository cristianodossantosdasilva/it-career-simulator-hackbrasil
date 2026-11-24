import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import type { VisaoPortfolioAnalista } from '../progressoRota'

interface PropsSecaoPortfolioAnalista {
  visao: VisaoPortfolioAnalista
  /** Nível do título da seção. Na página Portfólio, h2. */
  nivelTitulo?: 2 | 3
}

export const TEXTO_AGUARDA_PREPARACAO = 'Aguarda missão em preparação no simulador.'

/** Portfólio de analista: estado e as quatro exigências, sempre em texto e ícone. */
export function SecaoPortfolioAnalista({ visao, nivelTitulo = 2 }: PropsSecaoPortfolioAnalista) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h3'
  const idTitulo = useId()
  return (
    <section
      className={visao.conquistado ? 'portfolio-analista portfolio-analista-conquistado' : 'portfolio-analista'}
      aria-labelledby={idTitulo}
    >
      <Titulo className="portfolio-analista-titulo" id={idTitulo}>
        Portfólio de analista
      </Titulo>
      <p className="portfolio-analista-estado">
        <Icone nome={visao.conquistado ? 'portfolio' : 'pendente'} tamanho={20} />
        <strong>{visao.conquistado ? 'Portfólio de analista conquistado' : 'Portfólio de analista pendente'}</strong>
      </p>
      <ul className="portfolio-analista-lista">
        {visao.exigencias.map((exigencia) => (
          <li
            key={exigencia.etapaId}
            className={exigencia.cumprida ? 'portfolio-exigencia portfolio-exigencia-cumprida' : 'portfolio-exigencia'}
          >
            <Icone nome={exigencia.cumprida ? 'status-disponivel' : 'pendente'} tamanho={16} />
            <span className="portfolio-exigencia-texto">
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
