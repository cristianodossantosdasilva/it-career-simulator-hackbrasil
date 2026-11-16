import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  CircleUser,
  Clock,
  Crosshair,
  Download,
  Flame,
  Gauge,
  Info,
  Layers,
  Library,
  ListChecks,
  type LucideIcon,
  type LucideProps,
  MessageSquare,
  MessagesSquare,
  Monitor,
  NotebookPen,
  Plane,
  ScreenShare,
  ShieldCheck,
  SquareTerminal,
  Star,
  Ticket,
  X,
} from 'lucide-react'

/**
 * Catalogo unico de icones. As telas usam apenas o nome semantico, nunca o componente do pacote,
 * para que a troca da biblioteca fique restrita a este arquivo.
 */
const ICONES = {
  missoes: ListChecks,
  aulas: BookOpen,
  laboratorio: Monitor,
  caderno: NotebookPen,
  mentor: MessagesSquare,
  credencial: BadgeCheck,
  'tema-tatico': Crosshair,
  'tema-corporativo': Briefcase,
  perfil: CircleUser,
  marca: Plane,
  voltar: ArrowLeft,
  avancar: ArrowRight,
  baixar: Download,
  verificar: ShieldCheck,
  cartoes: Layers,
  fechar: X,
  confirmar: Check,
  expandir: ChevronDown,
  sequencia: Flame,
  xp: Star,
  conquista: Award,
  info: Info,
  relogio: Clock,
  notas: NotebookPen,
  conversa: MessageSquare,
  chamado: Ticket,
  remoto: ScreenShare,
  base: Library,
  terminal: SquareTerminal,
  saude: Gauge,
} satisfies Record<string, LucideIcon>

export type NomeIcone = keyof typeof ICONES

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
