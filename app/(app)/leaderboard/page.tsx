'use client'

import { useEffect, useState } from 'react'
import { StatBar } from '@/components/kol/StatBar'
import { LeaderboardTable } from '@/components/kol/LeaderboardTable'
import { CallFeed } from '@/components/kol/CallFeed'
import { FilterBar } from '@/components/ui/FilterBar'
import { MockKOL } from '@/lib/mock/kols'
import { useAuth } from '@/hooks/useAuth'

const FILTERS = ['ALL', 'TOP SCORE', 'ELITE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE']

const TIER_COLOUR: Record<string, string> = {
  elite: '#A855F7', platinum: '#7DD3FC', gold: '#D4AF37', silver: '#A8A9AD', bronze: '#CD7F32',
}

// Adapter: map real KOL profile to MockKOL shape expected by LeaderboardTable
function adaptKOL(k: Record<string, unknown>, rank: number): MockKOL {
  const name = String(k.display_name ?? 'Anonymous')
  const handle = k.twitter_handle ? `@${k.twitter_handle}` : ''
  const score = Number(k.score ?? 50)
  const tier = String(k.tier ?? 'bronze') as MockKOL['tier']
  // Approximate win rate from score (score 50=baseline, 100=perfect)
  const winRate = Math.min(95, Math.max(30, Math.round(score * 0.75 + 15)))
  // Use audience size estimate as a stand-in for total calls
  const totalCalls = Number(k.audience_size_estimate ?? 0)
  return {
    id: String(k.id),
    rank,
    name,
    handle: handle || `@${name.toLowerCase().replace(/\s+/g, '')}`,
    avatar: name.slice(0, 2).toUpperCase(),
    winRate,
    totalCalls,
    avgRoi: 0,
    bestCall: '—',
    bestCallRoi: 0,
    tier: (['elite', 'verified', 'rising', 'unverified'].includes(tier) ? tier : 'unverified') as MockKOL['tier'],
    score,
    sparkline: Array(30).fill(score).map((v, i) =>
      Math.max(0, Math.min(100, v + Math.sin(i * 0.4) * 8))
    ),
    followed: false,
  }
}

function filterKols(kols: MockKOL[], filter: string): MockKOL[] {
  switch (filter) {
    case 'TOP SCORE':  return [...kols].sort((a, b) => b.score - a.score)
    case 'ELITE':      return kols.filter((k) => k.tier === 'elite' || k.score >= 95)
    case 'PLATINUM':   return kols.filter((k) => k.score >= 80 && k.score < 95)
    case 'GOLD':       return kols.filter((k) => k.score >= 60 && k.score < 80)
    case 'SILVER':     return kols.filter((k) => k.score >= 40 && k.score < 60)
    case 'BRONZE':     return kols.filter((k) => k.score < 40)
    default:           return kols
  }
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState('ALL')
  const { user, loading: authLoading } = useAuth()
  const isGuest = !authLoading && !user
  const [kols, setKols] = useState<MockKOL[]>([])
  const [total, setTotal] = useState(0)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFetching(true)
    setError(null)
    fetch('/api/kols?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.kols) {
          const adapted = (d.data.kols as Record<string, unknown>[]).map(adaptKOL)
          setKols(adapted)
          setTotal(d.data.total ?? adapted.length)
        } else {
          setError('Failed to load leaderboard')
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setFetching(false))
  }, [])

  const filtered = filterKols(kols, filter)

  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-6">
      <StatBar />

      {/* Guest banner */}
      {isGuest && (
        <div className="px-6 py-2.5 bg-accent/10 border-b border-accent/30 flex items-center justify-between">
          <p className="text-[12px] text-text-secondary">
            <span className="text-accent font-medium">Free preview</span> — browsing {total} KOLs.{' '}
            Sign up to follow KOLs, access full profiles, and apply to deals.
          </p>
          <a href="/register" className="text-[11px] tracking-widest uppercase mono text-accent hover:text-accent-bright transition-colors whitespace-nowrap ml-4">
            SIGN UP FREE →
          </a>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-border-muted bg-bg flex items-center gap-6">
        <FilterBar options={FILTERS} active={filter} onChange={setFilter} />
        {!fetching && (
          <span className="text-[11px] mono text-text-muted ml-auto">
            {filtered.length} / {total} KOLs
          </span>
        )}
      </div>

      {/* Main content */}
      {fetching ? (
        <div className="flex items-center justify-center py-24">
          <span className="text-text-muted text-[11px] tracking-widest uppercase mono animate-pulse">LOADING LEADERBOARD...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 flex-col gap-3">
          <span className="text-negative text-sm">{error}</span>
        </div>
      ) : (
        <div className="flex gap-0 flex-1 min-h-0">
          <div className="flex-1 overflow-x-auto border-r border-border-muted">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <span className="text-text-muted text-sm">No KOLs found in this tier.</span>
              </div>
            ) : (
              <LeaderboardTable kols={filtered} isGuest={isGuest} />
            )}
          </div>
          <div className="w-[340px] shrink-0 h-[calc(100vh-180px)] sticky top-0">
            <CallFeed />
          </div>
        </div>
      )}
    </div>
  )
}
