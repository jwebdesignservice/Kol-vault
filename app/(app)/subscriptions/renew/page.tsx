'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type SubStatus = 'inactive' | 'active' | 'past_due' | 'cancelled' | null

export default function SubscriptionsRenewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<SubStatus>(null)
  const [fetching, setFetching] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user?.role !== 'kol') {
      router.replace('/dashboard')
      return
    }
    if (!loading && user?.role === 'kol') {
      fetch('/api/subscriptions/status')
        .then((r) => r.json())
        .then((d) => {
          setStatus(d?.data?.subscription_status ?? 'inactive')
        })
        .catch(() => setStatus('inactive'))
        .finally(() => setFetching(false))
    }
  }, [loading, user, router])

  const handleSubscribe = async () => {
    setRedirecting(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/checkout', { method: 'POST' })
      const d = await res.json()
      if (res.ok && d?.data?.url) {
        window.location.href = d.data.url
      } else {
        setError(d.error ?? 'Failed to start checkout')
        setRedirecting(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setRedirecting(false)
    }
  }

  const handleManage = async () => {
    setRedirecting(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/portal', { method: 'POST' })
      const d = await res.json()
      if (res.ok && d?.data?.url) {
        window.location.href = d.data.url
      } else {
        setError(d.error ?? 'Failed to open billing portal')
        setRedirecting(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setRedirecting(false)
    }
  }

  const statusBadge: Record<string, 'positive' | 'negative' | 'accent' | 'muted'> = {
    active: 'positive',
    inactive: 'muted',
    past_due: 'negative',
    cancelled: 'negative',
  }

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-text-muted text-[11px] tracking-widest uppercase mono animate-pulse">LOADING...</span>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-bg-surface border border-border p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-accent text-2xl">◈</span>
            <h1 className="font-heading font-bold text-xl tracking-widest text-text-primary">
              KOL SUBSCRIPTION
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Unlock verified KOL status, apply to paid deals, and build your on-chain reputation.
          </p>
        </div>

        {/* Current status */}
        {status && (
          <div className="flex items-center justify-between p-4 bg-bg border border-border mb-6">
            <span className="text-[11px] tracking-widest uppercase text-text-muted">CURRENT STATUS</span>
            <Badge variant={statusBadge[status] ?? 'muted'}>{status.replace('_', ' ').toUpperCase()}</Badge>
          </div>
        )}

        {/* Pricing */}
        <div className="border border-border p-6 mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-heading font-bold text-4xl text-text-primary">$75</span>
            <span className="text-text-muted text-sm">/ month</span>
          </div>
          <ul className="text-sm text-text-secondary flex flex-col gap-2 mt-4">
            {[
              'Apply to unlimited open deals',
              'Verified KOL badge on your profile',
              'On-chain score tracked & published',
              'Tier progression: Bronze → Elite',
              'USDC payouts via Solana escrow',
              'Priority in project searches',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-accent text-xs">◈</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-negative/10 border border-negative text-negative text-sm mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        {status === 'active' ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-positive/10 border border-positive text-positive text-sm text-center">
              Your subscription is active ✓
            </div>
            <Button variant="outline" className="w-full" onClick={handleManage} disabled={redirecting}>
              {redirecting ? 'REDIRECTING...' : 'MANAGE BILLING'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
              BACK TO DASHBOARD
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full" onClick={handleSubscribe} disabled={redirecting}>
              {redirecting ? 'REDIRECTING TO CHECKOUT...' : 'SUBSCRIBE — $75/MONTH'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
              BACK TO DASHBOARD
            </Button>
          </div>
        )}

        <p className="text-[11px] text-text-muted text-center mt-4">
          Secured by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
