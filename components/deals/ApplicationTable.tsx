'use client'

import { useState } from 'react'
import { MOCK_APPLICATIONS } from '@/lib/mock/deals'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Th, Td } from '@/components/ui/Table'
import { useToast } from '@/hooks/useToast'

interface ApplicationTableProps {
  dealId: string
}

type AppStatus = 'pending' | 'accepted' | 'rejected'

export function ApplicationTable({ dealId }: ApplicationTableProps) {
  const { addToast } = useToast()
  const apps = MOCK_APPLICATIONS.filter((a) => a.dealId === dealId)
  const [statuses, setStatuses] = useState<Record<string, AppStatus>>(
    Object.fromEntries(apps.map((a) => [a.id, a.status]))
  )
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const hasAccepted = Object.values(statuses).includes('accepted')

  const handleAction = (id: string, action: 'accepted' | 'rejected') => {
    if (action === 'accepted' && confirmingId !== id) {
      setConfirmingId(id)
      return
    }
    setStatuses((prev) => ({ ...prev, [id]: action }))
    setConfirmingId(null)
    addToast(
      action === 'accepted' ? 'success' : 'info',
      action === 'accepted' ? 'Application accepted.' : 'Application rejected.'
    )
  }

  if (apps.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted mono text-[11px] tracking-widest uppercase border border-dashed border-border">
        NO APPLICATIONS YET
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-max border-collapse">
        <thead>
          <tr>
            <Th>KOL</Th>
            <Th>WIN RATE</Th>
            <Th>SCORE</Th>
            <Th>TIER</Th>
            <Th>PITCH</Th>
            <Th>RATE</Th>
            <Th>STATUS</Th>
            <Th>ACTION</Th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => {
            const status = statuses[app.id]
            return (
              <>
                <tr
                  key={app.id}
                  className="bg-bg-surface hover:bg-bg-elevated transition-colors border-b border-border-muted"
                  style={{ height: 64 }}
                >
                  <Td>
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-8 h-8 bg-accent flex items-center justify-center text-[10px] font-bold mono text-white shrink-0">
                        {app.avatar}
                      </div>
                      <span className="font-bold text-sm text-text-primary">{app.kol}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className={`mono text-sm font-bold ${app.winRate > 60 ? 'positive' : 'text-text-secondary'}`}>
                      {app.winRate}%
                    </span>
                  </Td>
                  <Td>
                    <span className="stat-number text-sm">{app.score}</span>
                  </Td>
                  <Td>
                    <Badge variant={app.tier === 'elite' ? 'accent' : 'muted'}>{app.tier}</Badge>
                  </Td>
                  <Td>
                    <span className="text-text-secondary text-sm max-w-[200px] truncate block">
                      {app.pitch}
                    </span>
                  </Td>
                  <Td>
                    <span className="mono text-sm text-text-primary">
                      {app.proposedRate ? `$${app.proposedRate.toLocaleString()}` : '—'}
                    </span>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        status === 'accepted' ? 'positive' : status === 'rejected' ? 'negative' : 'muted'
                      }
                    >
                      {status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={status !== 'pending' || (hasAccepted && status === 'pending')}
                        onClick={() => handleAction(app.id, 'accepted')}
                      >
                        ACCEPT
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={status !== 'pending'}
                        onClick={() => handleAction(app.id, 'rejected')}
                      >
                        REJECT
                      </Button>
                    </div>
                  </Td>
                </tr>
                {confirmingId === app.id && (
                  <tr key={`${app.id}-confirm`}>
                    <td colSpan={8} className="p-0">
                      <div className="bg-bg border-l-4 border-accent px-6 py-3 flex items-center gap-4">
                        <span className="text-sm text-text-secondary">
                          Accept <strong className="text-text-primary">{app.kol}</strong>? This will close the deal to other applicants.
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAction(app.id, 'accepted')}
                        >
                          CONFIRM ACCEPT
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmingId(null)}
                        >
                          CANCEL
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
