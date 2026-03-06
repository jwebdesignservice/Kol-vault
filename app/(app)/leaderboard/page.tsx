'use client'

import { useState } from 'react'
import { StatBar } from '@/components/kol/StatBar'
import { LeaderboardTable } from '@/components/kol/LeaderboardTable'
import { CallFeed } from '@/components/kol/CallFeed'
import { FilterBar } from '@/components/ui/FilterBar'
import { MOCK_KOLS, MockKOL } from '@/lib/mock/kols'
import { useAuth } from '@/hooks/useAuth'

const FILTERS = ['ALL', 'TOP GAINERS', 'MOST CALLED', 'NEW KOLS', 'DEGEN', 'BLUE CHIP']

function filterKols(kols: MockKOL[], filter: string): MockKOL[] {
  switch (filter) {
    case 'TOP GAINERS':
      return [...kols].sort((a, b) => b.avgRoi - a.avgRoi)
    case 'MOST CALLED':
      return [...kols].sort((a, b) => b.totalCalls - a.totalCalls)
    case 'NEW KOLS':
      return kols.filter((k) => k.tier === 'unverified' || k.tier === 'rising')
    case 'DEGEN':
      return kols.filter((k) => k.avgRoi > 100)
    case 'BLUE CHIP':
      return kols.filter((k) => k.tier === 'elite' || k.tier === 'verified')
    default:
      return kols
  }
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState('ALL')
  const { user, loading } = useAuth()
  const isGuest = !loading && !user

  const filtered = filterKols(MOCK_KOLS, filter)

  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-6">
      {/* Stat Bar */}
      <StatBar />

      {/* Guest banner */}
      {isGuest && (
        <div className="px-6 py-2.5 bg-accent/10 border-b border-accent/30 flex items-center justify-between">
          <p className="text-[12px] text-text-secondary">
            <span className="text-accent font-medium">Free preview</span> — browsing 847 KOLs.{' '}
            Sign up to follow KOLs, get real-time alerts, and access full profiles.
          </p>
          <a
            href="/register"
            className="text-[11px] tracking-widest uppercase mono text-accent hover:text-accent-bright transition-colors whitespace-nowrap ml-4"
          >
            SIGN UP FREE →
          </a>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-border-muted bg-bg">
        <FilterBar options={FILTERS} active={filter} onChange={setFilter} />
      </div>

      {/* Main content */}
      <div className="flex gap-0 flex-1 min-h-0">
        {/* Leaderboard */}
        <div className="flex-1 overflow-x-auto border-r border-border-muted">
          <LeaderboardTable kols={filtered} isGuest={isGuest} />
        </div>

        {/* Call Feed */}
        <div className="w-[340px] shrink-0 h-[calc(100vh-180px)] sticky top-0">
          <CallFeed />
        </div>
      </div>
    </div>
  )
}
