'use client'

type BadgeVariant = 'accent' | 'positive' | 'negative' | 'warning' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'border-accent text-accent',
  positive: 'border-positive text-positive',
  negative: 'border-negative text-negative',
  warning: 'border-warning text-warning',
  muted: 'border-border text-text-muted',
}

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5',
        'border text-[10px] tracking-widest uppercase font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
