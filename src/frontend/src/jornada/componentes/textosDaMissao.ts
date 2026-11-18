import { escalaDaMissao } from '../catalogos/catalogoRotas'

/** Título e descrição de uma Missão, lidos do catálogo de rotas. Identificador desconhecido devolve o próprio id. */
export function textosDaMissao(id: string): { titulo: string; descricao: string | null } {
  const missao = escalaDaMissao(id)?.missao
  return {
    titulo: missao?.titulo ?? id,
    descricao: missao?.descricao ?? null,
  }
}
