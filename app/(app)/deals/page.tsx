'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DealTable } from '@/components/deals/DealTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { MOCK_DEALS, MockDeal, DealStatus } from '@/lib/mock/deals'

const KOL_FILTERS = ['ALL', 'HIGH BUDGET', 'CLOSING SOON', 'APPLIED']
const PROJECT_FILTERS = ['ALL', 'OPEN', 'IN PROGRESS', 'COMPLETED', 'DISPUTED']

function filterDeals(deals: MockDeal[], filter: string, role: string): MockDeal[] {
  if (filter === 'ALL') return deals
  if (role === 'kol') {
    switch (filter) {
      case 'HIGH BUDGET':
        return deals.filter((d) => d.budgetUsdc >= 10000)
      case 'CLOSING SOON':
        return deals.filter((d) => {
          const days = Math.ceil((new Date(d.deadline).getTime() - Date.now()) / 86400000)
          return days <= 7
        })
      default:
        return deals
    }
  } else {
    const statusMap: Record<string, DealStatus> = {
      'OPEN': 'OPEN',
      'IN PROGRESS': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED',
      'DISPUTED': 'DISPUTED',
    }
    const status = statusMap[filter]
    return status ? deals.filter((d) => d.status === status) : deals
  }
}

export default function DealsPage() {
  const { user } = useAuth()
  const role = user?.role ?? 'kol'
  const isProject = role === 'project'
  const filters = isProject ? PROJECT_FILTERS : KOL_FILTERS
  const [filter, setFilter] = useState('ALL')

  const deals = isProject
    ? MOCK_DEALS.slice(0, 5) // project sees their own deals
    : MOCK_DEALS.filter((d) => d.status === 'OPEN' || d.status === 'IN_PROGRESS')

  const filtered = filterDeals(deals, filter, role)

  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-muted bg-bg-surface">
        <FilterBar options={filters} active={filter} onChange={setFilter} />
        {isProject && (
          <Link href="/deals/create">
            <Button variant="primary" size="sm">
              <Plus size={14} />
              CREATE DEAL
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <DealTable deals={filtered} role={isProject ? 'project' : 'kol'} />
    </div>
  )
}
