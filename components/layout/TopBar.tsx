'use client'

import { Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { WalletButton } from '@/components/ui/WalletButton'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/leaderboard': 'LEADERBOARD',
  '/deals': 'DEALS',
  '/deals/create': 'CREATE DEAL',
  '/profile': 'PROFILE',
}

const TICKER_ITEMS = [
  'KOLS TRACKED',
  '847',
  '❙',
  'CALLS THIS WEEK',
  '3,241',
  '❙',
  'AVG WIN RATE',
  '61.4%',
  '❙',
  'PLATFORM VOLUME',
  '$2.4M',
  '❙',
  'ACTIVE DEALS',
  '34',
  '❙',
  'TOP ROI',
  '+4,200%',
  '❙',
]

const tickerString = TICKER_ITEMS.join('  ·  ')

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'KOLVAULT'

  return (
    <header
      className="flex items-center h-12 shrink-0 bg-bg-surface overflow-hidden"
      style={{ borderBottom: '1px solid #2D0E5A' }}
    >
      {/* Left — page title */}
      <div className="px-6 shrink-0 w-[180px]">
        <span className="text-[11px] tracking-widest uppercase text-text-primary font-medium font-heading">
          {title}
        </span>
      </div>

      {/* Center — ticker */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex whitespace-nowrap"
          style={{ animation: 'ticker 30s linear infinite' }}
        >
          {/* Duplicate for seamless loop */}
          {[0, 1].map((rep) => (
            <span key={rep} className="pr-16">
              {TICKER_ITEMS.map((item, i) => {
                const isNum = /^[\d,.$+%]+$/.test(item.trim())
                const isDivider = item === '❙'
                return (
                  <span
                    key={i}
                    className={
                      isDivider
                        ? 'text-border mx-3'
                        : isNum
                        ? 'stat-number text-[11px] mx-1'
                        : 'text-text-muted text-[11px] tracking-widest mx-1'
                    }
                  >
                    {item}
                  </span>
                )
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 px-4 shrink-0">
        {user ? (
          <>
            <WalletButton />
            <button className="text-text-muted hover:text-text-primary transition-colors">
              <Bell size={16} />
            </button>
            <div className="w-7 h-7 bg-accent flex items-center justify-center text-white text-[10px] font-bold mono">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <Link href="/login">
              <span className="text-[11px] tracking-widest uppercase mono text-text-muted hover:text-text-primary transition-colors">
                SIGN IN
              </span>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">SIGN UP FREE</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
