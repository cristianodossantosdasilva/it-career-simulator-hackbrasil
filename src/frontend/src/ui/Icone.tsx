import type { LucideProps } from 'lucide-react'
import { ICONES, type NomeIcone } from './catalogoIcones'

export type { NomeIcone }

export interface IconeProps extends Omit<LucideProps, 'ref' | 'size' | 'strokeWidth'> {
  nome: NomeIcone
  /** Tamanho em px. Padrao 20 (navegacao). Use 16 em texto corrido e 24 em destaques. */
  tamanho?: 16 | 20 | 24
  /** Quando informado, o icone vira imagem com nome acessivel. Sem rotulo, ele e decorativo. */
  rotulo?: string
}

export function Icone({ nome, tamanho = 20, rotulo, className, ...resto }: IconeProps) {
  const Componente = ICONES[nome]
  const classes = className ? `icone ${className}` : 'icone'
  const acessibilidade = rotulo
    ? ({ role: 'img', 'aria-label': rotulo } as const)
    : ({ 'aria-hidden': true, focusable: false } as const)
  return <Componente size={tamanho} strokeWidth={1.75} className={classes} {...acessibilidade} {...resto} />
}
