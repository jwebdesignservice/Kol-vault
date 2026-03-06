'use client'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  clipCorner?: 'tr' | 'bl' | 'none'
  icon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  clipCorner = 'none',
  icon,
  className = '',
  children,
}: StatCardProps) {
  const clipClass =
    clipCorner === 'tr'
      ? 'clip-corner-tr'
      : clipCorner === 'bl'
      ? 'clip-corner-bl'
      : ''

  return (
    <div
      className={[
        'bg-bg-surface border border-border p-4 flex flex-col gap-2',
        clipClass,
        className,
      ].join(' ')}
    >
      {icon && <div className="text-accent mb-1">{icon}</div>}
      <span className="text-[10px] tracking-widest uppercase text-text-muted font-medium">
        {label}
      </span>
      <span className="stat-number text-2xl font-bold">{value}</span>
      {delta !== undefined && (
        <span
          className={[
            'text-[11px] mono',
            deltaPositive ? 'positive' : 'negative',
          ].join(' ')}
        >
          {delta}
        </span>
      )}
      {children}
    </div>
  )
}
