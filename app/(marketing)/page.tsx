import Link from 'next/link'
import { StatBar } from '@/components/kol/StatBar'
import { Button } from '@/components/ui/Button'

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'DegenKing',    handle: '@DegenKing',    winRate: 76, roi: '+187%', best: 'WIF +2840%' },
  { rank: 2, name: 'SolAlpha',     handle: '@SolAlpha',     winRate: 71, roi: '+134%', best: 'BONK +1560%' },
  { rank: 3, name: 'WhaleWatcher', handle: '@WhaleWatch',   winRate: 68, roi: '+98%',  best: 'JTO +920%' },
  { rank: 4, name: 'CryptoOracle', handle: '@CryptoOracle', winRate: 66, roi: '+211%', best: 'PYTH +780%' },
  { rank: 5, name: 'AltSeason',    handle: '@AltSeason_',   winRate: 64, roi: '+76%',  best: 'RNDR +640%' },
]

/* ─── Aurora backgrounds ─────────────────────────────────────────────────── */
function HeroAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 aurora-glow" style={{ background: ['radial-gradient(ellipse 80% 55% at 50% 10%, rgba(123,47,190,0.45) 0%, transparent 65%)', 'radial-gradient(ellipse 50% 60% at 12% 70%, rgba(34,211,160,0.10) 0%, transparent 60%)', 'radial-gradient(ellipse 40% 40% at 88% 75%, rgba(168,85,247,0.15) 0%, transparent 55%)'].join(',') }} />
      <div className="absolute inset-0 aurora-glow-slow" style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(192,132,252,0.2) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(123,47,190,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(123,47,190,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7B2FBE" stopOpacity="0" /><stop offset="35%" stopColor="#A855F7" stopOpacity="0.55" /><stop offset="65%" stopColor="#C084FC" stopOpacity="0.4" /><stop offset="100%" stopColor="#C084FC" stopOpacity="0" /></linearGradient>
          <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22D3A0" stopOpacity="0" /><stop offset="50%" stopColor="#22D3A0" stopOpacity="0.22" /><stop offset="100%" stopColor="#22D3A0" stopOpacity="0" /></linearGradient>
          <linearGradient id="lg3" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stopColor="#7B2FBE" stopOpacity="0" /><stop offset="45%" stopColor="#A855F7" stopOpacity="0.3" /><stop offset="100%" stopColor="#A855F7" stopOpacity="0" /></linearGradient>
        </defs>
        <path className="flow-path" d="M-80,750 C220,520 480,180 720,280 C960,380 1180,220 1520,60" stroke="url(#lg1)" strokeWidth="1.2" />
        <path className="flow-path-slow" d="M-80,800 C260,560 500,240 720,330 C940,420 1140,280 1520,110" stroke="url(#lg1)" strokeWidth="0.6" />
        <path className="flow-path-slow" d="M-80,200 C160,320 380,600 640,380 C900,160 1160,480 1520,600" stroke="url(#lg2)" strokeWidth="0.9" />
        <path className="flow-path" d="M1520,700 C1200,500 900,200 720,320 C540,440 280,160 -80,300" stroke="url(#lg3)" strokeWidth="0.7" />
        <circle cx="720" cy="280" r="3" fill="#A855F7" opacity="0.7" />
        <circle cx="720" cy="280" r="8" fill="#A855F7" opacity="0.12" />
        <circle cx="640" cy="380" r="2.5" fill="#22D3A0" opacity="0.5" />
        <circle cx="640" cy="380" r="7" fill="#22D3A0" opacity="0.08" />
      </svg>
    </div>
  )
}

/* ─── Section 1: THE PROBLEM ─────────────────────────────────────────────── */
function ProblemSection() {
  const problems = [
    { n: '01', title: 'NO VERIFICATION',       body: "KOL win rates and ROI are entirely self-reported. Screenshots are trivial to fake. Projects have zero way to confirm past performance before committing funds." },
    { n: '02', title: 'ZERO ACCOUNTABILITY',   body: "Once paid, KOLs face no consequences for missed targets. No dispute mechanism. No refund path. Wasted budgets with no recourse and no paper trail." },
    { n: '03', title: 'TRUST OR NOTHING',      body: "The entire KOL market runs on personal trust and Telegram DMs. No standardised contracts, no escrow, no proof of delivery at any scale." },
  ]
  return (
    <section className="relative overflow-hidden" style={{ background: '#05000F' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,68,102,0.07) 0%, transparent 60%)' }} />
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-px" style={{ background: '#FF4466' }} />
          <span className="text-[11px] tracking-widest uppercase mono" style={{ color: '#FF4466' }}>THE PROBLEM</span>
        </div>
        <h2 className="font-heading font-bold text-5xl text-text-primary mb-16">
          The crypto KOL market<br /><span style={{ color: '#FF4466' }}>is broken.</span>
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {problems.map((p) => (
            <div key={p.n} className="relative px-8 py-10 border border-border-muted" style={{ borderLeft: '3px solid #FF4466' }}>
              <div className="absolute right-4 top-2 font-heading font-bold leading-none select-none pointer-events-none mono" style={{ fontSize: '9rem', color: '#FF4466', opacity: 0.07 }}>{p.n}</div>
              <div className="relative">
                <p className="mono text-[11px] tracking-widest mb-4" style={{ color: '#FF4466' }}>{p.n}</p>
                <h3 className="font-heading font-bold text-xl text-text-primary mb-4">{p.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Section 2: TWO SIDES ───────────────────────────────────────────────── */
function TwoSidesSection() {
  return (
    <section className="relative overflow-hidden bg-bg">
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-accent" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent">TWO SIDES. ONE VAULT.</span>
        </div>
        <h2 className="font-heading font-bold text-5xl text-text-primary mb-16">Built for both sides<br />of the deal.</h2>
      </div>
      {/* Contained split */}
      <div className="max-w-7xl mx-auto">
      <div className="flex" style={{ minHeight: 420 }}>
        {/* Projects — left */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#100020' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 80% at 0% 60%, rgba(123,47,190,0.18) 0%, transparent 60%)' }} />
          <div className="relative px-16 py-12 h-full border-t border-b border-l border-border">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-accent text-[10px] tracking-widest mono text-accent mb-10">FOR PROJECTS</div>
            <div className="flex flex-col gap-10">
              {[
                { n: '01', title: 'TOTAL BUDGET CONTROL', body: 'Post deals with locked USDC budgets and on-chain KPI targets. Funds only release when targets are verified — not before.' },
                { n: '02', title: 'VERIFIED KOL DISCOVERY', body: 'Browse 847 KOLs ranked by real win rates, tier scores, and verified call history. No fake metrics, no guesswork.' },
              ].map(item => (
                <div key={item.n} className="flex gap-6">
                  <span className="stat-number text-5xl font-bold mono opacity-20 shrink-0 leading-none">{item.n}</span>
                  <div>
                    <h4 className="font-heading font-bold text-text-primary mb-2 tracking-wide">{item.title}</h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Glowing divider */}
        <div className="w-px shrink-0 relative" style={{ background: '#2D0E5A', boxShadow: '0 0 24px rgba(123,47,190,0.5)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-bg border border-accent flex items-center justify-center z-10">
            <span className="text-accent text-xl">◈</span>
          </div>
        </div>

        {/* KOLs — right */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#020D0C' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 80% at 100% 60%, rgba(34,211,160,0.12) 0%, transparent 60%)' }} />
          <div className="relative px-16 py-12 h-full border-t border-b border-r border-border">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-positive text-[10px] tracking-widest mono text-positive mb-10">FOR KOLS</div>
            <div className="flex flex-col gap-10">
              {[
                { n: '01', title: 'ON-CHAIN REPUTATION', body: "Build a permanent, verifiable score (0–100) that compounds with every campaign. Better score unlocks bigger deals. Can't be faked or deleted." },
                { n: '02', title: 'STRUCTURED DEAL FLOW', body: 'Apply to campaigns with clear budgets, KPIs, and deadlines. Get paid automatically when results are confirmed. No chasing invoices.' },
              ].map(item => (
                <div key={item.n} className="flex gap-6">
                  <span className="text-positive text-5xl font-bold mono opacity-20 shrink-0 leading-none">{item.n}</span>
                  <div>
                    <h4 className="font-heading font-bold text-text-primary mb-2 tracking-wide">{item.title}</h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

/* ─── Section 3: VAULT ARCHITECTURE (Terminal) ───────────────────────────── */
function ArchitectureSection() {
  const steps = [
    { n: '01', title: 'POST A DEAL',      desc: 'Project sets budget in USDC, KPI target (views / holders / volume), and campaign deadline.' },
    { n: '02', title: 'BROWSE & APPLY',   desc: 'KOLs browse open deals and submit applications with pitch, strategy, and proposed rate.' },
    { n: '03', title: 'ESCROW LOCKS',     desc: 'On acceptance, USDC transfers to a dedicated Solana escrow wallet. Funds are frozen until verdict.' },
    { n: '04', title: 'CAMPAIGN RUNS',    desc: 'KOL executes the campaign. Real-time on-chain snapshots track progress via Helius API.' },
    { n: '05', title: 'ON-CHAIN VERIFY',  desc: 'At deadline, Helius pulls verified data and compares against KPI targets. Zero self-reporting.' },
    { n: '06', title: 'AUTO-SETTLE',      desc: 'Success: USDC releases to KOL wallet instantly. Failure: funds return to project. All on Solana.' },
  ]
  return (
    <section className="relative overflow-hidden border-y border-border" style={{ background: '#060012' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 70% at 0% 50%, rgba(34,211,160,0.06) 0%, transparent 60%)' }} />
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-12 gap-16">
          {/* Left */}
          <div className="col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-px bg-positive" />
                <span className="text-[11px] tracking-widest uppercase mono text-positive">THE ARCHITECTURE</span>
              </div>
              <h2 className="font-heading font-bold text-5xl text-text-primary leading-tight mb-6">
                A marketplace<br />built for<br /><span className="text-positive">accountability.</span>
              </h2>
              <p className="text-text-secondary text-base leading-relaxed mb-10">
                Every transaction is on-chain. Every KPI verified by real data. Every payment automatic. No trust required.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['SOLANA', 'USDC', 'HELIUS', 'SPL TOKEN', 'AES-256'].map(tag => (
                <span key={tag} className="px-3 py-1 border border-border-muted text-text-muted text-[10px] tracking-widest mono">{tag}</span>
              ))}
            </div>
          </div>
          {/* Right — CLI steps */}
          <div className="col-span-7 flex flex-col gap-0 self-center">
            {steps.map((step, i) => (
              <div key={step.n} className="group flex items-start gap-6 py-5 px-4 border-b border-border-muted hover:bg-bg-surface transition-colors duration-150 cursor-default">
                <span className="text-positive mono text-sm font-bold shrink-0 w-8 mt-0.5">{step.n}</span>
                <div className="flex-1">
                  <p className="font-heading font-bold text-text-primary text-sm tracking-wide mb-1">{step.title}</p>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i === steps.length - 1 && (
                  <span className="text-positive mono text-sm self-center" style={{ animation: 'pulse_dot 1s ease-in-out infinite' }}>▋</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 4: FOUR TIERS (staircase columns) ──────────────────────────── */
function TiersSection() {
  const tiers = [
    {
      label: 'BRONZE', n: 'TIER 01', range: '0–39',
      color: '#F59E0B', bg: 'rgba(245,158,11,0.05)',
      unlocks: ['Deals up to $2,500', 'Basic leaderboard listing', 'Standard application queue'],
      minH: 300,
    },
    {
      label: 'SILVER', n: 'TIER 02', range: '40–59',
      color: '#9B7EC8', bg: 'rgba(155,126,200,0.06)',
      unlocks: ['Deals up to $10,000', 'Verified badge on profile', 'Priority applications', 'Analytics access'],
      minH: 380,
    },
    {
      label: 'GOLD', n: 'TIER 03', range: '60–79',
      color: '#A855F7', bg: 'rgba(168,85,247,0.08)',
      unlocks: ['Deals up to $25,000', 'Featured on leaderboard', 'Invite-only deal access', 'Direct project contact', 'Custom rate setting'],
      minH: 460,
    },
    {
      label: 'PLATINUM', n: 'TIER 04', range: '80–100',
      color: '#C084FC', bg: 'rgba(192,132,252,0.10)',
      unlocks: ['Unlimited deal budgets', 'Top of leaderboard', 'Platform partnership deals', 'Revenue share ops', 'White-glove support', 'KOL Vault Verified seal'],
      minH: 540,
    },
  ]
  return (
    <section className="relative overflow-hidden bg-bg border-b border-border">
      {/* Horizontal grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 63px, rgba(45,14,90,0.25) 63px, rgba(45,14,90,0.25) 64px)' }} />
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-px bg-accent-bright" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent-bright">KOL TIERS</span>
        </div>
        <h2 className="font-heading font-bold text-5xl text-text-primary mb-16">Four tiers.<br />Unlimited potential.</h2>
        {/* Staircase — align to bottom */}
        <div className="flex items-end gap-0">
          {tiers.map((tier, i) => (
            <div
              key={tier.label}
              className="flex-1 flex flex-col border-t border-r border-border-muted group relative overflow-hidden transition-all duration-300 cursor-default"
              style={{ minHeight: tier.minH, background: tier.bg, borderLeft: i === 0 ? '1px solid rgba(45,14,90,0.4)' : undefined }}
            >
              {/* Top accent bar */}
              <div className="h-[3px] w-full shrink-0" style={{ background: tier.color }} />
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: `inset 0 0 80px ${tier.color}18` }} />
              <div className="flex flex-col justify-between flex-1 p-6">
                <div>
                  <p className="mono text-[10px] tracking-widest mb-3 opacity-50" style={{ color: tier.color }}>{tier.n}</p>
                  <h3 className="font-heading font-bold text-2xl mb-1" style={{ color: tier.color }}>{tier.label}</h3>
                  <p className="mono text-[11px] text-text-muted mb-6">{tier.range} pts</p>
                  <div className="flex flex-col gap-2">
                    {tier.unlocks.map(u => (
                      <div key={u} className="flex items-start gap-2">
                        <span className="mt-2 w-1 h-1 shrink-0 inline-block" style={{ background: tier.color }} />
                        <span className="text-text-secondary text-[12px] leading-relaxed">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border-muted">
                  <p className="mono text-[10px] tracking-widest text-text-muted">SCORE RANGE</p>
                  <p className="font-heading font-bold text-3xl mt-1" style={{ color: tier.color }}>{tier.range}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Section 5: TRUST ANCHORS (2×2 full-bleed grid) ────────────────────── */
function TrustSection() {
  const anchors = [
    { wm: '4%',  label: 'SUCCESS-ONLY FEE',      body: '4% platform fee charged only on successful campaign completion. Zero cost if it fails.',          bg: '#100020' },
    { wm: '∞',   label: 'USDC ESCROW',            body: 'Solana-powered non-custodial escrow. Funds held securely and released only when KPIs are met.',   bg: '#0A0010' },
    { wm: '↗',   label: 'ON-CHAIN VERIFIED',      body: 'Every KPI checked against real Helius blockchain data. No self-reporting. No fake screenshots.',  bg: '#0A0010' },
    { wm: '⚖',   label: 'DISPUTE PROTECTION',     body: 'Admin-mediated resolution for every contested campaign. Full audit trail on-chain, always.',      bg: '#100020' },
  ]
  return (
    <section className="border-t border-border" style={{ background: '#08000E' }}>
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-8 py-16 border-b border-border-muted">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-accent" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent">PLATFORM GUARANTEES</span>
        </div>
        <h2 className="font-heading font-bold text-5xl text-text-primary">
          Built on trust.<br /><span className="text-accent">Enforced on-chain.</span>
        </h2>
      </div>
      {/* 2×2 grid */}
      <div className="grid grid-cols-2">
        {anchors.map((a, i) => (
          <div
            key={a.label}
            className="relative overflow-hidden px-14 py-16"
            style={{
              background: a.bg,
              borderRight: i % 2 === 0 ? '1px solid rgba(45,14,90,0.5)' : undefined,
              borderBottom: i < 2 ? '1px solid rgba(45,14,90,0.5)' : undefined,
            }}
          >
            {/* Watermark */}
            <div
              className="absolute right-6 bottom-4 font-heading font-bold select-none pointer-events-none leading-none"
              style={{ fontSize: '9rem', color: '#7B2FBE', opacity: 0.07, fontFamily: 'var(--font-mono)' }}
            >
              {a.wm}
            </div>
            <div className="relative">
              <p className="text-[10px] tracking-widest uppercase mono text-accent mb-5">— {a.label}</p>
              <p className="text-text-primary text-xl leading-relaxed font-body max-w-sm">{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── CTA aurora ─────────────────────────────────────────────────────────── */
function CTAAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 aurora-glow" style={{ background: ['radial-gradient(ellipse 60% 80% at 50% 100%, rgba(123,47,190,0.5) 0%, transparent 55%)', 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.25) 0%, transparent 50%)'].join(',') }} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(123,47,190,0.15) 3px, rgba(123,47,190,0.15) 4px)' }} />
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">

      {/* NAV */}
      <nav className="border-b border-border px-8 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4">
          <span className="font-heading font-bold text-lg tracking-wider"><span className="text-accent">◈</span> KOLVAULT</span>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button variant="ghost" size="sm">SIGN IN</Button></Link>
            <Link href="/register"><Button variant="primary" size="sm">LAUNCH APP</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-57px)] flex items-center clip-corner-bl overflow-hidden bg-bg">
        <HeroAurora />
        <div className="relative z-10 grid grid-cols-12 gap-8 w-full px-8 py-20 max-w-7xl mx-auto">
          <div className="col-span-7 flex flex-col justify-center gap-8">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-accent mb-4 mono">SOLANA · WEB3 MARKETING MARKETPLACE</p>
              <h1 className="font-heading font-bold text-6xl leading-tight text-text-primary mb-4">
                TRACK ALPHA.<br /><span className="text-accent">VERIFY SIGNAL.</span><br />EARN FROM KOLS.
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-lg">
                The on-chain marketplace connecting crypto projects with proven KOLs. Real win rates, verified calls, Solana-powered escrow.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/register"><Button variant="primary" size="lg">LAUNCH APP</Button></Link>
              <Link href="/leaderboard"><Button variant="outline" size="lg">VIEW LEADERBOARD</Button></Link>
            </div>
            <div className="flex gap-8">
              {[{ label: 'KOLs Tracked', value: '847+' }, { label: 'Platform Volume', value: '$2.4M' }, { label: 'Avg Win Rate', value: '61.4%' }].map(({ label, value }) => (
                <div key={label}>
                  <div className="stat-number text-2xl font-bold">{value}</div>
                  <div className="text-text-muted text-[11px] tracking-widest uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5">
            <div className="bg-bg-surface border border-border" style={{ boxShadow: '0 0 40px rgba(123,47,190,0.2), inset 0 0 60px rgba(123,47,190,0.04)' }}>
              <div className="px-4 py-2 border-b border-border-muted flex items-center gap-2">
                <span className="w-2 h-2 bg-positive inline-block" style={{ animation: 'pulse_dot 1.5s infinite' }} />
                <span className="text-[11px] tracking-widest text-text-muted uppercase">LIVE LEADERBOARD</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-muted">
                    {['#', 'KOL', 'WIN', 'ROI', 'BEST'].map(h => (
                      <th key={h} className="text-[10px] tracking-widest text-text-muted px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADERBOARD.map(row => (
                    <tr key={row.rank} className="border-b border-border-muted hover:bg-bg-elevated transition-colors">
                      <td className="px-3 py-3"><span className={`mono text-[11px] font-bold ${row.rank <= 3 ? 'text-accent-bright' : 'text-text-muted'}`}>{row.rank <= 3 ? `#${row.rank}` : row.rank}</span></td>
                      <td className="px-3 py-3"><div><p className="text-[12px] font-bold text-text-primary">{row.name}</p><p className="text-[10px] text-text-muted mono">{row.handle}</p></div></td>
                      <td className="px-3 py-3"><span className={`mono text-[12px] font-bold ${row.winRate > 60 ? 'positive' : 'text-text-primary'}`}>{row.winRate}%</span></td>
                      <td className="px-3 py-3"><span className="positive mono text-[12px]">{row.roi}</span></td>
                      <td className="px-3 py-3"><span className="mono text-[10px] text-accent-glow">{row.best}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border-muted">
                <Link href="/leaderboard" className="text-[11px] tracking-widest text-accent hover:text-accent-bright uppercase mono transition-colors">VIEW ALL 847 KOLS →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAR */}
      <section className="border-y border-border relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 200% at 50% 50%, rgba(123,47,190,0.06) 0%, transparent 70%)' }} />
        <div className="relative z-10"><StatBar /></div>
      </section>

      {/* 1. THE PROBLEM */}
      <ProblemSection />

      {/* 2. TWO SIDES */}
      <TwoSidesSection />

      {/* 3. VAULT ARCHITECTURE */}
      <ArchitectureSection />

      {/* 4. FOUR TIERS */}
      <TiersSection />

      {/* 5. TRUST ANCHORS */}
      <TrustSection />

      {/* CTA */}
      <section className="relative overflow-hidden w-full px-8 py-24 text-center bg-bg">
        <CTAAurora />
        <div className="relative z-10 max-w-7xl mx-auto">
          <h2 className="font-heading font-bold text-5xl text-text-primary mb-4">
            READY TO TRACK<br /><span className="text-accent">REAL ALPHA?</span>
          </h2>
          <p className="text-text-secondary mb-10 text-lg">Join 847 KOLs and 200+ projects on the only verified performance marketplace.</p>
          <Link href="/register"><Button variant="primary" size="lg">LAUNCH APP</Button></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-heading font-bold text-sm"><span className="text-accent">◈</span> KOLVAULT</span>
          <span className="text-text-muted text-[11px] mono">© 2026 KOLVAULT. SOLANA-POWERED.</span>
        </div>
      </footer>
    </div>
  )
}
