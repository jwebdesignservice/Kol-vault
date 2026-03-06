'use client'

interface EmptyStateProps {
  subtext?: string
  className?: string
}

export function EmptyState({ subtext, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 py-16 px-8',
        'border border-dashed border-border',
        className,
      ].join(' ')}
    >
      <span className="mono text-text-muted text-[11px] tracking-widest uppercase">
        NO DATA FOUND
      </span>
      {subtext && (
        <span className="text-[12px] text-text-muted text-center max-w-[240px]">
          {subtext}
        </span>
      )}
    </div>
  )
}
