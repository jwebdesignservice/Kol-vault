import Link from 'next/link'
import { StatBar } from '@/components/kol/StatBar'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { BarChart2, Shield, Zap } from 'lucide-react'

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'DegenKing', handle: '@DegenKing', winRate: 76, roi: '+187%', best: 'WIF +2840%' },
  { rank: 2, name: 'SolAlpha', handle: '@SolAlpha', winRate: 71, roi: '+134%', best: 'BONK +1560%' },
  { rank: 3, name: 'WhaleWatcher', handle: '@WhaleWatch', winRate: 68, roi: '+98%', best: 'JTO +920%' },
  { rank: 4, name: 'CryptoOracle', handle: '@CryptoOracle', winRate: 66, roi: '+211%', best: 'PYTH +780%' },
  { rank: 5, name: 'AltSeason', handle: '@AltSeason_', winRate: 64, roi: '+76%', best: 'RNDR +640%' },
]

const FEATURES = [
  {
    icon: BarChart2,
    title: 'TRACK ALPHA',
    desc: 'Follow every on-chain call. Real-time win rates, ROI tracking, and performance history across all KOLs.',
    clip: 'tr' as const,
    col: 'col-span-8',
  },
  {
    icon: Shield,
    title: 'VERIFY PERFORMANCE',
    desc: 'On-chain proof. No fake screenshots. Every call is timestamped and verified against chain data.',
    clip: 'none' as const,
    col: 'col-span-4',
  },
  {
    icon: Zap,
    title: 'STAKE ON SIGNAL',
    desc: 'KOLs stake reputation on their calls. Projects fund verified campaigns with Solana escrow.',
    clip: 'bl' as const,
    col: 'col-span-4',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">
      {/* Nav */}
      <nav className="border-b border-border px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4">
          <span className="font-heading font-bold text-lg tracking-wider">
            <span className="text-accent">◈</span> KOLVAULT
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">SIGN IN</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">LAUNCH APP</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative min-h-[calc(100vh-57px)] flex items-center clip-corner-bl"
        style={{ background: 'linear-gradient(135deg, #0A0010 60%, #100020 100%)' }}
      >
        <div className="grid grid-cols-12 gap-8 w-full px-8 py-20 max-w-7xl mx-auto">
          {/* Left 60% */}
          <div className="col-span-7 flex flex-col justify-center gap-8">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-accent mb-4 mono">
                SOLANA · WEB3 MARKETING MARKETPLACE
              </p>
              <h1 className="font-heading font-bold text-6xl leading-tight text-text-primary mb-4">
                TRACK ALPHA.<br />
                <span className="text-accent">VERIFY SIGNAL.</span><br />
                EARN FROM KOLS.
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-lg">
                The on-chain marketplace connecting crypto projects with proven KOLs. Real win rates, verified calls, Solana-powered escrow.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/register">
                <Button variant="primary" size="lg">LAUNCH APP</Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline" size="lg">VIEW LEADERBOARD</Button>
              </Link>
            </div>
            <div className="flex gap-8">
              {[
                { label: 'KOLs Tracked', value: '847+' },
                { label: 'Platform Volume', value: '$2.4M' },
                { label: 'Avg Win Rate', value: '61.4%' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="stat-number text-2xl font-bold">{value}</div>
                  <div className="text-text-muted text-[11px] tracking-widest uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 40% — Mock Leaderboard */}
          <div className="col-span-5">
            <div className="bg-bg-surface border border-border">
              <div className="px-4 py-2 border-b border-border-muted flex items-center gap-2">
                <span className="w-2 h-2 bg-positive inline-block" style={{ animation: 'pulse_dot 1.5s infinite' }} />
                <span className="text-[11px] tracking-widest text-text-muted uppercase">LIVE LEADERBOARD</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-muted">
                    {['#', 'KOL', 'WIN', 'ROI', 'BEST'].map((h) => (
                      <th key={h} className="text-[10px] tracking-widest text-text-muted px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADERBOARD.map((row) => (
                    <tr key={row.rank} className="border-b border-border-muted hover:bg-bg-elevated transition-colors">
                      <td className="px-3 py-3">
                        <span
                          className={[
                            'mono text-[11px] font-bold',
                            row.rank <= 3 ? 'text-accent-bright' : 'text-text-muted',
                          ].join(' ')}
                        >
                          {row.rank <= 3 ? `#${row.rank}` : row.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-[12px] font-bold text-text-primary">{row.name}</p>
                          <p className="text-[10px] text-text-muted mono">{row.handle}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`mono text-[12px] font-bold ${row.winRate > 60 ? 'positive' : 'text-text-primary'}`}>
                          {row.winRate}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="positive mono text-[12px]">{row.roi}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="mono text-[10px] text-accent-glow">{row.best}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border-muted">
                <Link href="/leaderboard" className="text-[11px] tracking-widest text-accent hover:text-accent-bright uppercase mono transition-colors">
                  VIEW ALL 847 KOLS →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat Bar */}
      <section className="border-y border-border">
        <StatBar />
      </section>

      {/* Features */}
      <section className="px-8 py-20">
        <div className="max-w-7xl mx-auto">
        <p className="text-[11px] tracking-widest uppercase text-accent mono mb-3">PLATFORM FEATURES</p>
        <h2 className="font-heading font-bold text-4xl text-text-primary mb-12">
          BUILT FOR ALPHA.
        </h2>
        <div className="grid grid-cols-12 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, clip, col }, i) => (
            <div key={title} className={col}>
              <StatCard
                label=""
                value=""
                clipCorner={clip}
                icon={<Icon size={24} />}
                className="h-full p-6"
              >
                <div className="flex flex-col gap-3 mt-2">
                  <h3 className="font-heading font-bold text-xl text-text-primary">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
                </div>
              </StatCard>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-8 py-20 bg-bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
        <p className="text-[11px] tracking-widest uppercase text-accent mono mb-3">HOW IT WORKS</p>
        <h2 className="font-heading font-bold text-4xl text-text-primary mb-12">THREE STEPS.</h2>
        <div className="flex items-start gap-0">
          {[
            { n: '01', title: 'CONNECT', desc: 'Create your account as a KOL or Project. Link your Twitter and Solana wallet.' },
            { n: '02', title: 'TRACK KOLS', desc: 'Browse the leaderboard. Follow top performers. Analyze their call history and win rates.' },
            { n: '03', title: 'EARN FROM ALPHA', desc: 'Projects fund KOL campaigns. KOLs earn for hitting verified KPIs. All settled on-chain.' },
          ].map(({ n, title, desc }, i) => (
            <div key={n} className="flex-1 relative px-8 py-6 border border-border">
              <div
                className="absolute inset-0 font-heading font-bold text-[120px] leading-none select-none pointer-events-none flex items-center justify-center opacity-[0.04]"
                style={{ color: '#F0E6FF' }}
              >
                {n}
              </div>
              <div className="relative">
                <p className="stat-number text-sm mb-2">{n}</p>
                <h3 className="font-heading font-bold text-xl text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
              {i < 2 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-accent-bright text-xl font-bold">
                  ›
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="w-full px-8 py-20 text-center"
        style={{ background: 'linear-gradient(180deg, #100020, #0A0010)' }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading font-bold text-5xl text-text-primary mb-4">
            READY TO TRACK<br />
            <span className="text-accent">REAL ALPHA?</span>
          </h2>
          <p className="text-text-secondary mb-10 text-lg">
            Join 847 KOLs and 200+ projects on the only verified performance marketplace.
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg">LAUNCH APP</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-heading font-bold text-sm">
            <span className="text-accent">◈</span> KOLVAULT
          </span>
          <span className="text-text-muted text-[11px] mono">© 2026 KOLVAULT. SOLANA-POWERED.</span>
        </div>
      </footer>
    </div>
  )
}
