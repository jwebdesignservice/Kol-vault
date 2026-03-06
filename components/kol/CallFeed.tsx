'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_CALL_FEED } from '@/lib/mock/kols'
import { LoadingShimmer } from '@/components/ui/LoadingShimmer'

interface CallEntry {
  id: string
  kol: string
  avatar: string
  token: string
  entry: number
  current: number
  time: string
}

function formatPrice(n: number): string {
  if (n < 0.0001) return n.toExponential(2)
  if (n < 0.01) return n.toFixed(6)
  if (n < 1) return n.toFixed(4)
  return n.toFixed(2)
}

export function CallFeed() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<CallEntry[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setEntries(
        MOCK_CALL_FEED.map((e, i) => ({ ...e, id: String(i) }))
      )
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      const base = MOCK_CALL_FEED[Math.floor(Math.random() * MOCK_CALL_FEED.length)]
      const newEntry: CallEntry = {
        ...base,
        id: Math.random().toString(36).slice(2),
        current: base.current * (0.95 + Math.random() * 0.15),
        time: 'just now',
      }
      setEntries((prev) => [newEntry, ...prev].slice(0, 20))
    }, 4000)
    return () => clearInterval(interval)
  }, [loading])

  return (
    <div className="flex flex-col bg-bg-surface border border-border h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-muted">
        <span
          className="w-2 h-2 bg-positive inline-block"
          style={{ animation: 'pulse_dot 1.5s ease-in-out infinite' }}
        />
        <span className="text-[11px] tracking-widest uppercase text-text-muted font-medium">
          LIVE CALLS
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingShimmer key={i} height={52} />
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry) => {
              const pct = ((entry.current - entry.entry) / entry.entry) * 100
              const isUp = pct >= 0
              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 px-3 py-3 border-b border-border-muted mono text-[11px]"
                  style={{
                    backgroundColor: isUp
                      ? 'rgba(34, 211, 160, 0.05)'
                      : 'rgba(255, 68, 102, 0.05)',
                  }}
                >
                  <div className="w-6 h-6 bg-accent flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                    {entry.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary font-bold">{entry.kol}</span>
                    <span className="text-text-muted"> called </span>
                    <span className="text-accent-bright font-bold">{entry.token}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={isUp ? 'positive' : 'negative'}>
                      {isUp ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                    <span className="text-text-muted text-[10px]">{entry.time}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
