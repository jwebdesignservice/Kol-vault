import Link from 'next/link'
import { StatBar } from '@/components/kol/StatBar'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { BarChart2, Shield, Zap } from 'lucide-react'

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'DegenKing',    handle: '@DegenKing',    winRate: 76, roi: '+187%', best: 'WIF +2840%' },
  { rank: 2, name: 'SolAlpha',     handle: '@SolAlpha',     winRate: 71, roi: '+134%', best: 'BONK +1560%' },
  { rank: 3, name: 'WhaleWatcher', handle: '@WhaleWatch',   winRate: 68, roi: '+98%',  best: 'JTO +920%' },
  { rank: 4, name: 'CryptoOracle', handle: '@CryptoOracle', winRate: 66, roi: '+211%', best: 'PYTH +780%' },
  { rank: 5, name: 'AltSeason',    handle: '@AltSeason_',   winRate: 64, roi: '+76%',  best: 'RNDR +640%' },
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

/* ─── Reusable SVG flowing-lines overlay ─────────────────────────────────── */
function HeroAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Radial glows */}
      <div
        className="absolute inset-0 aurora-glow"
        style={{
          background: [
            'radial-gradient(ellipse 80% 55% at 50% 10%, rgba(123,47,190,0.45) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 60% at 12% 70%, rgba(34,211,160,0.10) 0%, transparent 60%)',
            'radial-gradient(ellipse 40% 40% at 88% 75%, rgba(168,85,247,0.15) 0%, transparent 55%)',
          ].join(','),
        }}
      />
      {/* Secondary soft glow */}
      <div
        className="absolute inset-0 aurora-glow-slow"
        style={{
          background:
            'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(192,132,252,0.2) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(123,47,190,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(123,47,190,0.08) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Flowing SVG lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 820"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7B2FBE" stopOpacity="0" />
            <stop offset="35%"  stopColor="#A855F7" stopOpacity="0.55" />
            <stop offset="65%"  stopColor="#C084FC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#22D3A0" stopOpacity="0" />
            <stop offset="50%"  stopColor="#22D3A0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22D3A0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg3" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#7B2FBE" stopOpacity="0" />
            <stop offset="45%"  stopColor="#A855F7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main sweep — bottom-left to top-right */}
        <path
          className="flow-path"
          d="M-80,750 C220,520 480,180 720,280 C960,380 1180,220 1520,60"
          stroke="url(#lg1)" strokeWidth="1.2"
        />
        {/* Echo line */}
        <path
          className="flow-path-slow"
          d="M-80,800 C260,560 500,240 720,330 C940,420 1140,280 1520,110"
          stroke="url(#lg1)" strokeWidth="0.6"
        />
        {/* Teal arc — top-left to bottom-right */}
        <path
          className="flow-path-slow"
          d="M-80,200 C160,320 380,600 640,380 C900,160 1160,480 1520,600"
          stroke="url(#lg2)" strokeWidth="0.9"
        />
        {/* Right-side reverse sweep */}
        <path
          className="flow-path"
          d="M1520,700 C1200,500 900,200 720,320 C540,440 280,160 -80,300"
          stroke="url(#lg3)" strokeWidth="0.7"
        />

        {/* Node dots at key intersections */}
        <circle cx="720"  cy="280" r="3"   fill="#A855F7" opacity="0.7" />
        <circle cx="720"  cy="280" r="8"   fill="#A855F7" opacity="0.12" />
        <circle cx="1180" cy="220" r="2.5" fill="#C084FC" opacity="0.5" />
        <circle cx="480"  cy="180" r="2"   fill="#C084FC" opacity="0.4" />
        <circle cx="640"  cy="380" r="2.5" fill="#22D3A0" opacity="0.5" />
        <circle cx="640"  cy="380" r="7"   fill="#22D3A0" opacity="0.08" />
        <circle cx="960"  cy="380" r="2"   fill="#A855F7" opacity="0.35" />
      </svg>
    </div>
  )
}

function FeaturesAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div
        className="absolute inset-0 aurora-glow-slow"
        style={{
          background: [
            'radial-gradient(ellipse 55% 70% at 100% 0%, rgba(123,47,190,0.22) 0%, transparent 60%)',
            'radial-gradient(ellipse 40% 50% at 0% 100%, rgba(34,211,160,0.07) 0%, transparent 55%)',
          ].join(','),
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(123,47,190,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(123,47,190,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

function HowItWorksAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div
        className="absolute inset-0 aurora-glow"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(123,47,190,0.18) 0%, transparent 65%)',
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="hw1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7B2FBE" stopOpacity="0" />
            <stop offset="50%"  stopColor="#A855F7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7B2FBE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="flow-path-slow"
          d="M-80,280 C300,180 700,320 1000,160 C1200,60 1360,200 1520,260"
          stroke="url(#hw1)" strokeWidth="1"
        />
      </svg>
    </div>
  )
}

function CTAAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Central portal glow */}
      <div
        className="absolute inset-0 aurora-glow"
        style={{
          background: [
            'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(123,47,190,0.5) 0%, transparent 55%)',
            'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.25) 0%, transparent 50%)',
            'radial-gradient(ellipse 80% 30% at 50% 100%, rgba(192,132,252,0.15) 0%, transparent 60%)',
          ].join(','),
        }}
      />
      <div
        className="absolute inset-0 aurora-glow-slow"
        style={{
          background:
            'radial-gradient(ellipse 30% 50% at 50% 80%, rgba(34,211,160,0.08) 0%, transparent 55%)',
        }}
      />
      {/* Subtle horizontal scan lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(123,47,190,0.15) 3px, rgba(123,47,190,0.15) 4px)',
        }}
      />
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">

      {/* ── Nav ── */}
      <nav className="border-b border-border px-8 relative z-20">
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

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-57px)] flex items-center clip-corner-bl overflow-hidden bg-bg">
        <HeroAurora />
        <div className="relative z-10 grid grid-cols-12 gap-8 w-full px-8 py-20 max-w-7xl mx-auto">
          {/* Left */}
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
                The on-chain marketplace connecting crypto projects with proven KOLs.
                Real win rates, verified calls, Solana-powered escrow.
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
                { label: 'KOLs Tracked',     value: '847+' },
                { label: 'Platform Volume',  value: '$2.4M' },
                { label: 'Avg Win Rate',     value: '61.4%' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="stat-number text-2xl font-bold">{value}</div>
                  <div className="text-text-muted text-[11px] tracking-widest uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Mock Leaderboard */}
          <div className="col-span-5">
            <div
              className="bg-bg-surface border border-border"
              style={{ boxShadow: '0 0 40px rgba(123,47,190,0.2), inset 0 0 60px rgba(123,47,190,0.04)' }}
            >
              <div className="px-4 py-2 border-b border-border-muted flex items-center gap-2">
                <span
                  className="w-2 h-2 bg-positive inline-block"
                  style={{ animation: 'pulse_dot 1.5s infinite' }}
                />
                <span className="text-[11px] tracking-widest text-text-muted uppercase">LIVE LEADERBOARD</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-muted">
                    {['#', 'KOL', 'WIN', 'ROI', 'BEST'].map((h) => (
                      <th
                        key={h}
                        className="text-[10px] tracking-widest text-text-muted px-3 py-2 text-left font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADERBOARD.map((row) => (
                    <tr key={row.rank} className="border-b border-border-muted hover:bg-bg-elevated transition-colors">
                      <td className="px-3 py-3">
                        <span className={['mono text-[11px] font-bold', row.rank <= 3 ? 'text-accent-bright' : 'text-text-muted'].join(' ')}>
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

      {/* ── Stat Bar ── */}
      <section className="border-y border-border relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 200% at 50% 50%, rgba(123,47,190,0.06) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <StatBar />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative overflow-hidden px-8 py-20 bg-bg">
        <FeaturesAurora />
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="text-[11px] tracking-widest uppercase text-accent mono mb-3">PLATFORM FEATURES</p>
          <h2 className="font-heading font-bold text-4xl text-text-primary mb-12">
            BUILT FOR ALPHA.
          </h2>
          <div className="grid grid-cols-12 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, clip, col }) => (
              <div key={title} className={col}>
                <StatCard label="" value="" clipCorner={clip} icon={<Icon size={24} />} className="h-full p-6">
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

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden px-8 py-20 bg-bg-surface border-y border-border">
        <HowItWorksAurora />
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="text-[11px] tracking-widest uppercase text-accent mono mb-3">HOW IT WORKS</p>
          <h2 className="font-heading font-bold text-4xl text-text-primary mb-12">THREE STEPS.</h2>
          <div className="flex items-start gap-0">
            {[
              { n: '01', title: 'CONNECT',         desc: 'Create your account as a KOL or Project. Link your Twitter and Solana wallet.' },
              { n: '02', title: 'TRACK KOLS',      desc: 'Browse the leaderboard. Follow top performers. Analyze their call history and win rates.' },
              { n: '03', title: 'EARN FROM ALPHA', desc: 'Projects fund KOL campaigns. KOLs earn for hitting verified KPIs. All settled on-chain.' },
            ].map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="flex-1 relative px-8 py-6 border border-border"
                style={{ background: 'rgba(16,0,32,0.6)', backdropFilter: 'blur(4px)' }}
              >
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

      {/* ── CTA ── */}
      <section className="relative overflow-hidden w-full px-8 py-24 text-center bg-bg">
        <CTAAurora />
        <div className="relative z-10 max-w-7xl mx-auto">
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

      {/* ── Footer ── */}
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
