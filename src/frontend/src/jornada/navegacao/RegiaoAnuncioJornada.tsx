/** Região viva única da jornada. Fica montada entre páginas para que o anúncio chegue ao destino. */
export function RegiaoAnuncioJornada({ texto }: { texto: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {texto}
    </p>
  )
}
