'use client'

import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full min-w-max border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={[
        'text-[11px] tracking-widest uppercase text-text-muted font-medium',
        'px-4 py-3 text-left',
        'sticky top-0 bg-bg-surface z-10 border-b border-border-muted',
        className,
      ].join(' ')}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <td
      className={[
        'px-4 py-0 text-sm text-text-primary',
        'border-b border-border-muted',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  )
}
