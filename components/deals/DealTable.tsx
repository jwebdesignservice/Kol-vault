'use client'

import { useState } from 'react'
import { MockDeal, DealStatus } from '@/lib/mock/deals'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, Th, Td } from '@/components/ui/Table'
import { ApplyModal } from './ApplyModal'
import Link from 'next/link'

interface DealTableProps {
  deals: MockDeal[]
  role: 'kol' | 'project'
}

const statusVariant: Record<DealStatus, 'positive' | 'accent' | 'muted' | 'negative'> = {
  OPEN: 'positive',
  IN_PROGRESS: 'accent',
  COMPLETED: 'muted',
  DISPUTED: 'negative',
}

export function DealTable({ deals, role }: DealTableProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())

  const handleApply = (dealId: string) => {
    setApplied((prev) => new Set(Array.from(prev).concat(dealId)))
    setApplyingId(null)
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-max border-collapse">
        <thead>
          <tr>
            <Th>#</Th>
            <Th>PROJECT</Th>
            <Th>BUDGET</Th>
            <Th>KPI TARGET</Th>
            <Th>DEADLINE</Th>
            <Th>APPLICANTS</Th>
            <Th>STATUS</Th>
            <Th>ACTION</Th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, i) => (
            <>
              <tr
                key={deal.id}
                className="group bg-bg-surface hover:bg-bg-elevated transition-colors duration-150 border-b border-border-muted"
                style={{ height: 64 }}
              >
                <Td>
                  <span className="mono text-text-muted text-sm">{i + 1}</span>
                </Td>
                <Td>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 bg-accent/20 border border-border flex items-center justify-center text-[10px] font-bold mono text-accent shrink-0">
                      {deal.projectLogo}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-sm">{deal.project}</p>
                      <p className="text-text-muted text-[11px]">{deal.title}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="stat-number text-sm">
                    ${deal.budgetUsdc.toLocaleString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="mono text-sm text-text-primary">
                      {deal.kpiTarget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest">
                      {deal.kpiMetric}
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="mono text-sm text-text-secondary">{deal.deadline}</span>
                </Td>
                <Td>
                  <span className="mono text-sm text-text-secondary">{deal.applicantCount}</span>
                </Td>
                <Td>
                  <Badge variant={statusVariant[deal.status]}>{deal.status.replace('_', ' ')}</Badge>
                </Td>
                <Td>
                  {role === 'kol' ? (
                    applied.has(deal.id) ? (
                      <span className="text-[11px] tracking-widest uppercase text-text-muted font-medium mono">
                        APPLIED
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deal.status !== 'OPEN'}
                        onClick={() => setApplyingId(applyingId === deal.id ? null : deal.id)}
                      >
                        {applyingId === deal.id ? 'CLOSE' : 'APPLY'}
                      </Button>
                    )
                  ) : (
                    <Link href={`/deals/${deal.id}`}>
                      <Button variant="ghost" size="sm">MANAGE</Button>
                    </Link>
                  )}
                </Td>
              </tr>
              {applyingId === deal.id && (
                <tr key={`${deal.id}-apply`}>
                  <td colSpan={8} className="p-0">
                    <ApplyModal
                      dealId={deal.id}
                      dealTitle={deal.title}
                      onSubmit={() => handleApply(deal.id)}
                      onCancel={() => setApplyingId(null)}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
