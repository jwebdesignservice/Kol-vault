'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className = '', type, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-[10px] tracking-widest uppercase text-text-muted font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-text-muted mono text-sm select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className={[
              'w-full bg-bg-surface border border-border',
              'text-text-primary placeholder:text-text-muted',
              'px-3 py-2.5 text-sm',
              'focus:outline-none focus:border-accent focus:shadow-[0_0_8px_rgba(123,47,190,0.2)]',
              'transition-all duration-150',
              type === 'number' ? 'mono' : 'font-body',
              prefix ? 'pl-7' : '',
              error ? 'border-negative' : '',
              className,
            ].join(' ')}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[11px] text-negative tracking-wide">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-[10px] tracking-widest uppercase text-text-muted font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            'w-full bg-bg-surface border border-border',
            'text-text-primary placeholder:text-text-muted',
            'px-3 py-2.5 text-sm',
            'focus:outline-none focus:border-accent focus:shadow-[0_0_8px_rgba(123,47,190,0.2)]',
            'transition-all duration-150 resize-none',
            error ? 'border-negative' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-[11px] text-negative tracking-wide">{error}</span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
