import { LEVELS } from '../../educacao/catalogoEducacional'
import { escalaDaMissao } from '../catalogos/catalogoRotas'

/** Título e descrição de uma Missão: de LEVELS quando há nível para o cenário, senão do catálogo de rotas. */
export function textosDaMissao(id: string): { titulo: string; descricao: string | null } {
  const nivel = LEVELS.find((item) => item.cenarioId === id)
  const missao = escalaDaMissao(id)?.missao
  return {
    titulo: nivel?.titulo ?? missao?.titulo ?? id,
    descricao: nivel?.desc ?? missao?.descricao ?? null,
  }
}
