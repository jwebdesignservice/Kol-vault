'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white border border-accent hover:bg-accent-bright hover:border-accent-bright hover:shadow-[0_0_12px_rgba(123,47,190,0.5)]',
  outline:
    'bg-transparent border border-border text-text-secondary hover:border-accent hover:text-text-primary',
  ghost:
    'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface border',
  danger:
    'bg-negative/10 border border-negative text-negative hover:bg-negative/20',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-[12px]',
  lg: 'px-6 py-3 text-[12px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2',
          'tracking-widest font-medium uppercase',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
