import { useId } from 'react'
import { Icone } from '../../ui/Icone'
import type { RegistroDeVoo } from '../armazenamento/registrosVoo'
import { escalaDaMissao } from '../catalogos/catalogoRotas'
import { formatarDataDoRegistro } from './formatarDataDoRegistro'
import { textosDaMissao } from './textosDaMissao'

/**
 * Resumo do Registro_de_Voo guardado neste navegador, para quando o servidor já não tem a sessão.
 * Mostra só os campos do registro, copiados da avaliação do Juiz 360º. Não há eventos aqui.
 */
export function ResumoLocalDoVoo({ registro }: { registro: RegistroDeVoo }) {
  const idTitulo = useId()
  const local = escalaDaMissao(registro.missao)
  const { resultado } = registro
  return (
    <section className="resumo-local" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="h3">
        Resumo guardado neste navegador
      </h2>
      <dl className="cartao-embarque-dados">
        <div>
          <dt>Missão</dt>
          <dd>{textosDaMissao(registro.missao).titulo}</dd>
        </div>
        {local && (
          <div>
            <dt>Escala</dt>
            <dd>{local.vertente ? `${local.escala.nome}, ${local.vertente.nome}` : local.escala.nome}</dd>
          </div>
        )}
        <div>
          <dt>Concluído em</dt>
          <dd>{formatarDataDoRegistro(registro.concluidoEm)}</dd>
        </div>
        <div>
          <dt>Resultado do Juiz 360º</dt>
          <dd>{resultado.resumo}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>{resultado.xpTotal}</dd>
        </div>
        <div>
          <dt>Incidente de segurança</dt>
          <dd>{resultado.incidenteSeguranca ? 'Sim' : 'Não'}</dd>
        </div>
      </dl>
      <ul className="breve-piloto-lista">
        {resultado.criterios.map((criterio) => (
          <li key={criterio.id} className="breve-exigencia">
            <Icone nome={criterio.atendido ? 'status-disponivel' : 'pendente'} tamanho={16} />
            <span className="breve-exigencia-texto">
              {criterio.descricao}: <strong>{criterio.atendido ? 'Atendido' : 'Não atendido'}</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
