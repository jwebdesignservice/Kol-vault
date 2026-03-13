'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DealTable } from '@/components/deals/DealTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { MockDeal, DealStatus } from '@/lib/mock/deals'

const GUEST_FILTERS   = ['ALL', 'HIGH BUDGET', 'CLOSING SOON']
const KOL_FILTERS     = ['ALL', 'HIGH BUDGET', 'CLOSING SOON', 'APPLIED']
const PROJECT_FILTERS = ['ALL', 'OPEN', 'IN PROGRESS', 'COMPLETED', 'DISPUTED']

// Adapter: convert real API deal to MockDeal shape for DealTable
function adaptDeal(d: Record<string, unknown>): MockDeal {
  const project = (d.project as Record<string, string> | null)
  const kpi = (d.kpi_target as Record<string, unknown>) ?? {}
  const status = String(d.status ?? 'open').toUpperCase().replace('-', '_') as DealStatus
  const statusMap: Record<string, DealStatus> = {
    DRAFT: 'OPEN', OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS',
    PENDING_REVIEW: 'IN_PROGRESS', COMPLETED: 'COMPLETED',
    CANCELLED: 'COMPLETED', DISPUTED: 'DISPUTED',
  }
  return {
    id: String(d.id),
    project: project?.token_name ?? project?.token_symbol ?? 'Unknown Project',
    projectLogo: (project?.token_symbol ?? '??').slice(0, 2).toUpperCase(),
    title: String(d.title ?? ''),
    description: String(d.description ?? ''),
    requirements: String(d.requirements ?? ''),
    budgetUsdc: Number(d.budget_usdc ?? 0),
    kpiMetric: (String(kpi.metric ?? 'views')) as MockDeal['kpiMetric'],
    kpiTarget: Number(kpi.target ?? 0),
    kpiWindowDays: Number(kpi.window_days ?? 30),
    deadline: d.deadline ? String(d.deadline).split('T')[0] : 'N/A',
    maxApplications: Number(d.max_applications ?? 10),
    applicantCount: 0,
    status: statusMap[status] ?? 'OPEN',
    createdAt: String(d.created_at ?? '').split('T')[0],
  }
}

function filterDeals(deals: MockDeal[], filter: string, role: string): MockDeal[] {
  if (filter === 'ALL') return deals
  if (role === 'kol' || role === 'guest') {
    if (filter === 'HIGH BUDGET') return deals.filter((d) => d.budgetUsdc >= 10000)
    if (filter === 'CLOSING SOON') {
      return deals.filter((d) => {
        if (d.deadline === 'N/A') return false
        const days = Math.ceil((new Date(d.deadline).getTime() - Date.now()) / 86400000)
        return days <= 7 && days >= 0
      })
    }
    return deals
  }
  const statusMap: Record<string, DealStatus> = {
    'OPEN': 'OPEN', 'IN PROGRESS': 'IN_PROGRESS', 'COMPLETED': 'COMPLETED', 'DISPUTED': 'DISPUTED',
  }
  const s = statusMap[filter]
  return s ? deals.filter((d) => d.status === s) : deals
}

export default function DealsPage() {
  const { user, loading: authLoading } = useAuth()
  const isGuest = !authLoading && !user
  const role = user?.role ?? 'kol'
  const isProject = role === 'project'

  const filters = isProject ? PROJECT_FILTERS : isGuest ? GUEST_FILTERS : KOL_FILTERS
  const [filter, setFilter] = useState('ALL')
  const [deals, setDeals] = useState<MockDeal[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    setFetching(true)
    setError(null)

    const params = new URLSearchParams({ limit: '50' })
    fetch(`/api/deals?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.deals) {
          setDeals((d.data.deals as Record<string, unknown>[]).map(adaptDeal))
        } else {
          setError('Failed to load deals')
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setFetching(false))
  }, [authLoading, user])

  const filtered = filterDeals(deals, filter, isGuest ? 'guest' : role)

  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-6">
      {/* Guest banner */}
      {isGuest && (
        <div className="px-6 py-2.5 bg-accent/10 border-b border-accent/30 flex items-center justify-between">
          <p className="text-[12px] text-text-secondary">
            <span className="text-accent font-medium">Free preview</span> — browsing live deals.
            Sign up as a KOL to apply, or as a Project to post your own.
          </p>
          <div className="flex items-center gap-3 ml-4">
            <Link href="/login"><span className="text-[11px] tracking-widest uppercase mono text-text-muted hover:text-text-secondary transition-colors whitespace-nowrap">SIGN IN</span></Link>
            <Link href="/register"><Button variant="primary" size="sm">SIGN UP FREE</Button></Link>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-muted bg-bg-surface">
        <FilterBar options={filters} active={filter} onChange={setFilter} />
        {isProject && !isGuest && (
          <Link href="/deals/create">
            <Button variant="primary" size="sm"><Plus size={14} />CREATE DEAL</Button>
          </Link>
        )}
      </div>

      {/* Loading / error / table */}
      {fetching ? (
        <div className="flex items-center justify-center py-24">
          <span className="text-text-muted text-[11px] tracking-widest uppercase mono animate-pulse">LOADING DEALS...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 flex-col gap-3">
          <span className="text-negative text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>RETRY</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <span className="text-text-muted text-sm">No deals found.</span>
        </div>
      ) : (
        <DealTable deals={filtered} role={isProject ? 'project' : 'kol'} isGuest={isGuest} />
      )}
    </div>
  )
}
