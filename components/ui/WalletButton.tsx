'use client'

import { useToast } from '@/hooks/useToast'

interface WalletButtonProps {
  address?: string | null
  className?: string
}

export function WalletButton({ address, className = '' }: WalletButtonProps) {
  const { addToast } = useToast()

  const handleClick = () => {
    addToast('info', 'Wallet connection coming in Phase 2.')
  }

  const truncate = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`

  if (address) {
    return (
      <button
        onClick={handleClick}
        className={[
          'flex items-center gap-2 px-3 py-1.5',
          'border border-border text-text-secondary text-[11px] tracking-widest uppercase',
          'hover:border-accent hover:text-text-primary transition-all duration-150',
          className,
        ].join(' ')}
      >
        <span className="w-2 h-2 bg-positive inline-block shrink-0" />
        <span className="mono">{truncate(address)}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={[
        'flex items-center gap-2 px-3 py-1.5',
        'border border-border text-text-secondary text-[11px] tracking-widest uppercase',
        'hover:border-accent hover:text-text-primary transition-all duration-150',
        className,
      ].join(' ')}
    >
      <span className="w-2 h-2 border border-text-muted inline-block shrink-0" />
      CONNECT WALLET
    </button>
  )
}
