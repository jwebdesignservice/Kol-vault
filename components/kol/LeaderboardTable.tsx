'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MockKOL } from '@/lib/mock/kols'
import { Sparkline } from './Sparkline'
import { KOLProfileCard } from './KOLProfileCard'
import { Table, Th, Td } from '@/components/ui/Table'

interface LeaderboardTableProps {
  kols: MockKOL[]
}

export function LeaderboardTable({ kols }: LeaderboardTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [followed, setFollowed] = useState<Set<string>>(
    new Set(kols.filter((k) => k.followed).map((k) => k.id))
  )

  const toggleFollow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setFollowed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-max border-collapse">
        <thead>
          <tr>
            <Th className="w-16">RANK</Th>
            <Th>KOL</Th>
            <Th>HANDLE</Th>
            <Th>WIN RATE</Th>
            <Th>CALLS</Th>
            <Th>AVG ROI</Th>
            <Th>BEST CALL</Th>
            <Th>30D</Th>
            <Th>ACTION</Th>
          </tr>
        </thead>
        <tbody>
          {kols.map((kol) => {
            const isExpanded = expandedId === kol.id
            const isTop10 = kol.rank <= 10
            const isFollowed = followed.has(kol.id)
            const winColor =
              kol.winRate > 60 ? 'positive' : kol.winRate < 40 ? 'negative' : 'text-text-primary'

            return (
              <>
                <tr
                  key={kol.id}
                  onClick={() => toggleExpand(kol.id)}
                  className={[
                    'group cursor-pointer transition-all duration-150 relative',
                    isExpanded ? 'bg-bg-elevated' : 'bg-bg-surface hover:bg-bg-elevated',
                  ].join(' ')}
                  style={{ height: 64 }}
                >
                  {/* Left glow border via box-shadow trick using a cell border */}
                  <Td className="relative w-16 overflow-hidden">
                    <div
                      className={[
                        'absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-150',
                        isTop10 ? 'bg-accent-bright' : 'bg-transparent group-hover:bg-accent',
                      ].join(' ')}
                    />
                    <div className="relative">
                      <span
                        className="absolute -top-4 left-0 text-6xl font-bold mono opacity-30 select-none leading-none"
                        style={{ color: '#4A3566' }}
                      >
                        {kol.rank}
                      </span>
                      <span
                        className={[
                          'relative text-sm mono font-bold',
                          kol.rank <= 3 ? 'clip-corner-tr bg-accent px-2 py-0.5 text-white' : 'text-text-muted',
                        ].join(' ')}
                      >
                        {kol.rank <= 3 ? `#${kol.rank}` : kol.rank}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 bg-accent flex items-center justify-center text-white text-[11px] font-bold mono shrink-0">
                        {kol.avatar}
                      </div>
                      <span className="font-bold text-text-primary text-sm">{kol.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="mono text-text-muted text-sm">{kol.handle}</span>
                  </Td>
                  <Td>
                    <span className={`mono text-2xl font-bold ${winColor}`}>
                      {kol.winRate}%
                    </span>
                  </Td>
                  <Td>
                    <span className="mono text-sm text-text-secondary">{kol.totalCalls.toLocaleString()}</span>
                  </Td>
                  <Td>
                    <span className={`mono text-sm font-medium ${kol.avgRoi >= 0 ? 'positive' : 'negative'}`}>
                      {kol.avgRoi >= 0 ? '+' : ''}{kol.avgRoi}%
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="mono text-accent-bright text-sm font-bold">{kol.bestCall}</span>
                      <span className="positive mono text-[11px]">+{kol.bestCallRoi.toLocaleString()}%</span>
                    </div>
                  </Td>
                  <Td>
                    <Sparkline data={kol.sparkline} />
                  </Td>
                  <Td>
                    <button
                      onClick={(e) => toggleFollow(e, kol.id)}
                      className={[
                        'px-3 py-1.5 text-[11px] tracking-widest uppercase font-medium border transition-all duration-150',
                        isFollowed
                          ? 'bg-accent border-accent text-white'
                          : 'bg-transparent border-border text-text-muted hover:border-accent hover:text-text-primary',
                      ].join(' ')}
                    >
                      {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
                    </button>
                  </Td>
                </tr>
                {isExpanded && (
                  <tr key={`${kol.id}-expanded`}>
                    <td colSpan={9} className="p-0">
                      <AnimatePresence>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <KOLProfileCard kol={kol} />
                        </motion.div>
                      </AnimatePresence>
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
