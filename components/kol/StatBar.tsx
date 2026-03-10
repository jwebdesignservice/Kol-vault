'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface Stat {
  label: string
  value: number
  format: (v: number) => string
  color: string
}

const STATS: Stat[] = [
  { label: 'KOLS TRACKED',    value: 847,     format: (v) => v.toLocaleString(),              color: '#C084FC' }, // purple-glow
  { label: 'CALLS THIS WEEK', value: 3241,    format: (v) => v.toLocaleString(),              color: '#38BDF8' }, // electric blue
  { label: 'AVG WIN RATE',    value: 614,     format: (v) => `${(v / 10).toFixed(1)}%`,       color: '#22D3A0' }, // teal
  { label: 'TOP ROI',         value: 4200,    format: (v) => `+${v.toLocaleString()}%`,       color: '#F59E0B' }, // amber/gold
  { label: 'ACTIVE DEALS',    value: 34,      format: (v) => v.toLocaleString(),              color: '#F472B6' }, // rose
  { label: 'PLATFORM VOLUME', value: 2400000, format: (v) => `$${(v / 1000000).toFixed(1)}M`, color: '#818CF8' }, // indigo
]

function StatItem({ stat }: { stat: Stat }) {
  const count = useCountUp(stat.value, 800)
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3 px-4">
      <span className="text-[10px] tracking-widest uppercase text-text-muted font-medium mb-1 mono">
        {stat.label}
      </span>
      <span className="text-2xl font-bold mono" style={{ color: stat.color, fontFamily: 'var(--font-mono)' }}>
        {stat.format(count)}
      </span>
    </div>
  )
}

export function StatBar() {
  return (
    <div className="flex border-b border-border-muted bg-bg-surface">
      {STATS.map((stat, i) => (
        <div key={stat.label} className="flex flex-1">
          {i > 0 && <div className="w-px bg-border-muted self-stretch" />}
          <StatItem stat={stat} />
        </div>
      ))}
    </div>
  )
}
