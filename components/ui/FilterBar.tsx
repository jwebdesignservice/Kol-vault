'use client'

interface FilterBarProps {
  options: string[]
  active: string
  onChange: (value: string) => void
  className?: string
}

export function FilterBar({ options, active, onChange, className = '' }: FilterBarProps) {
  return (
    <div className={`flex ${className}`}>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            'px-4 py-2 text-[11px] tracking-widest uppercase font-medium',
            'border transition-colors duration-150',
            i === 0 ? '' : '-ml-px',
            active === opt
              ? 'bg-accent text-text-primary border-accent z-10 relative'
              : 'bg-transparent text-text-secondary border-border hover:text-text-primary hover:border-accent/50',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
