/** Data de conclusão no formato brasileiro. Texto que não é data válida volta como veio. */
export function formatarDataDoRegistro(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? iso : data.toLocaleDateString('pt-BR')
}
