'use client'

import { useState } from 'react'
import { StatBar } from '@/components/kol/StatBar'
import { LeaderboardTable } from '@/components/kol/LeaderboardTable'
import { CallFeed } from '@/components/kol/CallFeed'
import { FilterBar } from '@/components/ui/FilterBar'
import { MOCK_KOLS, MockKOL } from '@/lib/mock/kols'

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
  const filtered = filterKols(MOCK_KOLS, filter)

  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-6">
      {/* Stat Bar */}
      <StatBar />

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-border-muted bg-bg">
        <FilterBar options={FILTERS} active={filter} onChange={setFilter} />
      </div>

      {/* Main content */}
      <div className="flex gap-0 flex-1 min-h-0">
        {/* Leaderboard — 8 cols */}
        <div className="flex-1 overflow-x-auto border-r border-border-muted">
          <LeaderboardTable kols={filtered} />
        </div>

        {/* Call Feed — 4 cols */}
        <div className="w-[340px] shrink-0 h-[calc(100vh-180px)] sticky top-0">
          <CallFeed />
        </div>
      </div>
    </div>
  )
}
