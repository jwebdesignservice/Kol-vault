'use client'

import { MockKOL } from '@/lib/mock/kols'
import { StatCard } from '@/components/ui/StatCard'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface KOLProfileCardProps {
  kol: MockKOL
}

const MOCK_PERFORMANCE = Array.from({ length: 12 }, (_, i) => ({
  month: `M${i + 1}`,
  roi: Math.round(40 + Math.random() * 160),
}))

const MOCK_RECENT_CALLS = [
  { token: 'WIF', entry: 0.42, current: 0.68, timeAgo: '2h ago' },
  { token: 'BONK', entry: 0.00002, current: 0.000031, timeAgo: '5h ago' },
  { token: 'JTO', entry: 3.40, current: 2.90, timeAgo: '1d ago' },
  { token: 'PYTH', entry: 0.55, current: 0.61, timeAgo: '2d ago' },
  { token: 'RNDR', entry: 7.20, current: 8.90, timeAgo: '3d ago' },
]

export function KOLProfileCard({ kol }: KOLProfileCardProps) {
  return (
    <div className="bg-bg border border-border border-t-2 border-t-accent p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Left — Bio + Stats */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-accent flex items-center justify-center text-white font-bold font-mono text-sm">
                {kol.avatar}
              </div>
              <div>
                <p className="font-bold text-text-primary font-heading">{kol.name}</p>
                <p className="text-text-muted text-sm mono">{kol.handle}</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Tier: <span className="text-accent uppercase tracking-widest text-[11px]">{kol.tier}</span>
              {' · '}Score: <span className="stat-number">{kol.score}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Win Rate" value={`${kol.winRate}%`} clipCorner="tr" />
            <StatCard label="Total Calls" value={kol.totalCalls.toLocaleString()} clipCorner="none" />
            <StatCard
              label="Avg ROI"
              value={`${kol.avgRoi > 0 ? '+' : ''}${kol.avgRoi}%`}
              deltaPositive={kol.avgRoi > 0}
              clipCorner="none"
            />
            <StatCard
              label="Best Call"
              value={`+${kol.bestCallRoi}%`}
              delta={kol.bestCall}
              deltaPositive
              clipCorner="bl"
            />
          </div>
        </div>

        {/* Center — Recent Calls */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] tracking-widest uppercase text-text-muted mb-1">Recent Calls</h4>
          {MOCK_RECENT_CALLS.map((call) => {
            const pct = ((call.current - call.entry) / call.entry) * 100
            const isUp = pct >= 0
            return (
              <div
                key={call.token}
                className="flex items-center justify-between px-3 py-2 bg-bg-surface border border-border-muted"
              >
                <span className="mono font-bold text-text-primary text-sm">${call.token}</span>
                <div className="flex items-center gap-3">
                  <span className="mono text-[11px] text-text-muted">
                    {call.entry} → {call.current}
                  </span>
                  <span className={`mono text-[11px] font-medium ${isUp ? 'positive' : 'negative'}`}>
                    {isUp ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-muted">{call.timeAgo}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right — Performance Chart */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] tracking-widest uppercase text-text-muted mb-1">12M Performance</h4>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_PERFORMANCE}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B2FBE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7B2FBE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="roi"
                  stroke="#7B2FBE"
                  strokeWidth={2}
                  fill="url(#perfGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
