export function razaoContraste(primeiroPlano: string, fundo: string): number {
  const luminancia = (hex: string) => {
    const limpo = hex.replace('#', '')
    if (!/^[0-9a-f]{6}$/i.test(limpo)) throw new Error(`Cor hexadecimal inválida: ${hex}`)
    const canais = [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16) / 255)
    const [r, g, b] = canais.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const a = luminancia(primeiroPlano)
  const b = luminancia(fundo)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
