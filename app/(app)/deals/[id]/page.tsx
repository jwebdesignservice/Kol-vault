'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MOCK_DEALS } from '@/lib/mock/deals'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { ApplicationTable } from '@/components/deals/ApplicationTable'
import { ApplyModal } from '@/components/deals/ApplyModal'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { DealStatus } from '@/lib/mock/deals'

const statusVariant: Record<DealStatus, 'positive' | 'accent' | 'muted' | 'negative'> = {
  OPEN: 'positive',
  IN_PROGRESS: 'accent',
  COMPLETED: 'muted',
  DISPUTED: 'negative',
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const deal = MOCK_DEALS.find((d) => d.id === id)
  const [applied, setApplied] = useState(false)
  const [showApply, setShowApply] = useState(false)

  if (!deal) return notFound()

  const isProject = user?.role === 'project'

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/deals"
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-[11px] tracking-widest uppercase"
        >
          <ArrowLeft size={14} />
          BACK TO DEALS
        </Link>
      </div>

      {/* Deal Header */}
      <div className="bg-bg-surface border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 border border-border flex items-center justify-center text-sm font-bold mono text-accent">
              {deal.projectLogo}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading font-bold text-xl text-text-primary">{deal.title}</h1>
                <Badge variant={statusVariant[deal.status]}>{deal.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-text-muted text-[11px] tracking-widest uppercase">
                {deal.project} · {deal.deadline}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <StatCard label="Budget" value={`$${deal.budgetUsdc.toLocaleString()}`} />
            <StatCard
              label={`KPI Target (${deal.kpiMetric})`}
              value={deal.kpiTarget.toLocaleString()}
            />
            <StatCard label="Applications" value={deal.applicantCount} />
          </div>
        </div>
      </div>

      {/* 3-section layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 cols — description + requirements */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-bg-surface border border-border p-6">
            <h2 className="text-[11px] tracking-widest uppercase text-text-muted mb-3">Description</h2>
            <p className="text-text-secondary leading-relaxed">{deal.description}</p>
          </div>
          <div className="bg-bg-surface border border-border p-6">
            <h2 className="text-[11px] tracking-widest uppercase text-text-muted mb-3">Requirements</h2>
            <p className="text-text-secondary leading-relaxed">{deal.requirements}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Window" value={`${deal.kpiWindowDays} days`} />
            <StatCard label="Max Applicants" value={deal.maxApplications} />
            <StatCard
              label="Deadline"
              value={deal.deadline}
            />
          </div>

          {/* Application Table (Project view) */}
          {isProject && (
            <div className="bg-bg-surface border border-border">
              <div className="px-6 py-3 border-b border-border-muted">
                <h2 className="text-[11px] tracking-widest uppercase text-text-muted">Applications</h2>
              </div>
              <ApplicationTable dealId={deal.id} />
            </div>
          )}
        </div>

        {/* Right 4 cols — Apply (KOL) or summary (Project) */}
        <div className="col-span-4">
          {!isProject && (
            <div className="bg-bg-surface border border-border p-6 sticky top-6">
              <h2 className="text-[11px] tracking-widest uppercase text-text-muted mb-4">
                YOUR APPLICATION
              </h2>
              {applied ? (
                <div className="py-4 text-center">
                  <span className="text-positive text-[11px] tracking-widest uppercase mono">
                    APPLICATION SUBMITTED
                  </span>
                </div>
              ) : showApply ? (
                <ApplyModal
                  dealId={deal.id}
                  dealTitle={deal.title}
                  onSubmit={() => { setApplied(true); setShowApply(false) }}
                  onCancel={() => setShowApply(false)}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-bg border border-border-muted p-4 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted text-[11px]">Budget</span>
                      <span className="stat-number text-sm">${deal.budgetUsdc.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted text-[11px]">KPI</span>
                      <span className="mono text-sm text-text-primary">
                        {deal.kpiTarget.toLocaleString()} {deal.kpiMetric}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted text-[11px]">Window</span>
                      <span className="mono text-sm text-text-primary">{deal.kpiWindowDays}d</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApply(true)}
                    disabled={deal.status !== 'OPEN'}
                    className="w-full py-3 bg-accent text-white text-[12px] tracking-widest uppercase font-medium hover:bg-accent-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    APPLY FOR DEAL
                  </button>
                </div>
              )}
            </div>
          )}
          {isProject && (
            <div className="bg-bg-surface border border-border p-6 sticky top-6">
              <h2 className="text-[11px] tracking-widest uppercase text-text-muted mb-4">
                DEAL SUMMARY
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  ['Status', deal.status.replace('_', ' ')],
                  ['Budget', `$${deal.budgetUsdc.toLocaleString()}`],
                  ['KPI Metric', deal.kpiMetric.toUpperCase()],
                  ['KPI Target', deal.kpiTarget.toLocaleString()],
                  ['Window', `${deal.kpiWindowDays} days`],
                  ['Deadline', deal.deadline],
                  ['Applicants', `${deal.applicantCount} / ${deal.maxApplications}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-border-muted">
                    <span className="text-text-muted text-[11px] uppercase tracking-widest">{k}</span>
                    <span className="mono text-sm text-text-primary">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
