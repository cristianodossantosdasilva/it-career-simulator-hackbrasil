import { createContext, useContext } from 'react'

export interface ValorAnuncioJornada {
  /**
   * Coloca o texto na região viva da jornada. Um texto anunciado logo antes de uma navegação continua
   * na página de destino e é limpo quando a pessoa sai dela.
   */
  anunciar: (texto: string) => void
}

export const ContextoAnuncioJornada = createContext<ValorAnuncioJornada>({ anunciar: () => {} })

export function useAnuncioJornada(): ValorAnuncioJornada {
  return useContext(ContextoAnuncioJornada)
}
