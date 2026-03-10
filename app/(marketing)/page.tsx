import Link from 'next/link'

import { Button } from '@/components/ui/Button'

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'DegenKing',    handle: '@DegenKing',    winRate: 76, roi: '+187%', best: 'WIF +2840%' },
  { rank: 2, name: 'SolAlpha',     handle: '@SolAlpha',     winRate: 71, roi: '+134%', best: 'BONK +1560%' },
  { rank: 3, name: 'WhaleWatcher', handle: '@WhaleWatch',   winRate: 68, roi: '+98%',  best: 'JTO +920%' },
  { rank: 4, name: 'CryptoOracle', handle: '@CryptoOracle', winRate: 66, roi: '+211%', best: 'PYTH +780%' },
  { rank: 5, name: 'AltSeason',    handle: '@AltSeason_',   winRate: 64, roi: '+76%',  best: 'RNDR +640%' },
]

/* ─── Marquee ────────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { text: 'Every KOL call tracked on-chain — no fakes, no excuses',                        bold: true  },
  { text: 'USDC escrow released only when campaign KPIs are verified by Helius',           bold: false },
  { text: '847 KOLs ranked by real on-chain performance — not self-reported screenshots',  bold: true  },
  { text: '4% platform fee on success only — zero cost if the campaign underperforms',     bold: false },
  { text: '$2.4M+ in verified deal volume processed on Solana',                            bold: true  },
  { text: 'Platinum KOLs unlock unlimited deal budgets and exclusive platform deals',      bold: false },
  { text: 'On-chain dispute resolution — full audit trail, zero trust required',           bold: true  },
  { text: 'Performance is the only currency in the Vault',                                 bold: false },
]

function HeroMarquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="relative overflow-hidden border-y border-border bg-bg-surface" style={{ background: 'linear-gradient(180deg, #0C0018 0%, #06000C 100%)' }}>
      {/* Left + right fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #06000C, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #06000C, transparent)' }} />
      {/* Track */}
      <div className="flex py-3 animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center shrink-0">
            {/* Separator */}
            <span className="mx-6 text-accent opacity-40 text-xs select-none">◈</span>
            {/* Text */}
            <span
              className="text-[12px] tracking-wide"
              style={{ color: item.bold ? '#FFFFFF' : '#9B7EC8', fontWeight: item.bold ? 500 : 400 }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Hero: Deep Space Bloomberg ─────────────────────────────────────────── */
function HeroAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* ── Layer 1: Primary nebula — large, top-right, animated drift ── */}
      <div className="absolute inset-0 aurora-glow" style={{
        background: [
          'radial-gradient(ellipse 60% 70% at 78% 0%, rgba(123,47,190,0.55) 0%, rgba(123,47,190,0.18) 40%, transparent 65%)',
          'radial-gradient(ellipse 35% 50% at 100% 50%, rgba(168,85,247,0.2) 0%, transparent 55%)',
        ].join(','),
      }} />

      {/* ── Layer 2: Secondary soft bloom — bottom-left depth ── */}
      <div className="absolute inset-0 aurora-glow-slow" style={{
        background: 'radial-gradient(ellipse 45% 40% at -5% 95%, rgba(123,47,190,0.18) 0%, transparent 55%)',
      }} />

      {/* ── Layer 3: Star field via SVG tiling pattern ── */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          {/* Repeating star tile — 12 stars at varied positions, sizes, colours */}
          <pattern id="starfield" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
            <circle cx="14"  cy="32"  r="0.7" fill="#FFFFFF" opacity="0.22" />
            <circle cx="58"  cy="88"  r="0.5" fill="#FFFFFF" opacity="0.18" />
            <circle cx="102" cy="16"  r="1.0" fill="#C084FC" opacity="0.38" />
            <circle cx="148" cy="122" r="0.6" fill="#FFFFFF" opacity="0.2"  />
            <circle cx="32"  cy="168" r="0.8" fill="#FFFFFF" opacity="0.25" />
            <circle cx="188" cy="62"  r="0.5" fill="#FFFFFF" opacity="0.16" />
            <circle cx="78"  cy="178" r="0.9" fill="#A855F7" opacity="0.28" />
            <circle cx="170" cy="145" r="0.7" fill="#FFFFFF" opacity="0.2"  />
            <circle cx="48"  cy="44"  r="0.5" fill="#22D3A0" opacity="0.22" />
            <circle cx="118" cy="82"  r="0.6" fill="#FFFFFF" opacity="0.22" />
            <circle cx="196" cy="10"  r="0.8" fill="#FFFFFF" opacity="0.16" />
            <circle cx="6"   cy="118" r="0.5" fill="#FFFFFF" opacity="0.18" />
            <circle cx="210" cy="195" r="0.6" fill="#C084FC" opacity="0.2"  />
            <circle cx="88"  cy="140" r="0.4" fill="#FFFFFF" opacity="0.15" />
          </pattern>

          {/* Vignette mask: fade stars toward top (where nebula dominates) */}
          <linearGradient id="starVignette" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="black" stopOpacity="0.7" />
            <stop offset="30%"  stopColor="black" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0"   />
          </linearGradient>
          <mask id="starMask">
            <rect width="1440" height="820" fill="white" />
            <rect width="1440" height="820" fill="url(#starVignette)" />
          </mask>
        </defs>

        {/* Stars with top vignette so they don't compete with the nebula */}
        <rect width="1440" height="820" fill="url(#starfield)" mask="url(#starMask)" />

        {/* A few accent rings — glowing arcs behind the leaderboard area */}
        <circle cx="1160" cy="180" r="320" stroke="#7B2FBE" strokeWidth="0.4" opacity="0.12" />
        <circle cx="1160" cy="180" r="220" stroke="#A855F7" strokeWidth="0.3" opacity="0.09" />
        <circle cx="1160" cy="180" r="420" stroke="#7B2FBE" strokeWidth="0.3" opacity="0.06" />
      </svg>

      {/* ── Layer 4: Subtle scan lines (horizontal rule texture) ── */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(123,47,190,0.015) 3px, rgba(123,47,190,0.015) 4px)',
      }} />

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
    <section className="relative overflow-hidden" style={{ background: '#04000A' }}>
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-px bg-accent" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent">THE PROBLEM</span>
        </div>
        <h2 className="font-heading font-bold text-5xl mb-16" style={{ color: '#FFFFFF' }}>
          The crypto KOL market<br /><span style={{ color: '#A855F7' }}>is broken.</span>
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {problems.map((p) => (
            <div key={p.n} className="relative px-8 py-10 border border-border-muted" style={{ borderLeft: '3px solid rgba(255,68,102,0.3)' }}>
              <div className="absolute right-4 top-2 font-heading font-bold leading-none select-none pointer-events-none mono" style={{ fontSize: '9rem', color: '#7B2FBE', opacity: 0.07 }}>{p.n}</div>
              <div className="relative">
                <p className="mono text-[11px] tracking-widest mb-4 text-accent">{p.n}</p>
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
    <section className="relative overflow-hidden bg-bg pb-20">
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-accent" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent">TWO SIDES. ONE VAULT.</span>
        </div>
        <h2 className="font-heading font-bold text-5xl mb-16" style={{ color: '#FFFFFF' }}>Built for both sides<br /><span style={{ color: '#A855F7' }}>of the deal.</span></h2>
      </div>
      {/* Contained split */}
      <div className="max-w-7xl mx-auto">
      <div className="flex" style={{ minHeight: 420 }}>
        {/* Projects — left */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#0C0018' }}>
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
    <section className="relative overflow-hidden border-y border-border" style={{ background: '#050010' }}>
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
              <h2 className="font-heading font-bold text-5xl leading-tight mb-6" style={{ color: '#FFFFFF' }}>
                A marketplace<br />built for<br /><span style={{ color: '#A855F7' }}>accountability.</span>
              </h2>
              <p className="text-text-secondary text-base leading-relaxed mb-10">
                Every transaction is on-chain. Every KPI verified by real data. Every payment automatic. No trust required.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['SOLANA', 'USDC', 'HELIUS', 'SPL TOKEN', 'AES-256'].map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 text-[10px] tracking-widest mono"
                  style={{ border: '1px solid rgba(192,132,252,0.25)', color: '#C084FC' }}
                >
                  {tag}
                </span>
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
      color: '#CD7F32', bg: 'rgba(205,127,50,0.06)',
      unlocks: ['Deals up to $2,500', 'Basic leaderboard listing', 'Standard application queue'],
      minH: 300,
    },
    {
      label: 'SILVER', n: 'TIER 02', range: '40–59',
      color: '#A8A9AD', bg: 'rgba(168,169,173,0.06)',
      unlocks: ['Deals up to $10,000', 'Verified badge on profile', 'Priority applications', 'Analytics access'],
      minH: 380,
    },
    {
      label: 'GOLD', n: 'TIER 03', range: '60–79',
      color: '#D4AF37', bg: 'rgba(212,175,55,0.06)',
      unlocks: ['Deals up to $25,000', 'Featured on leaderboard', 'Invite-only deal access', 'Direct project contact', 'Custom rate setting'],
      minH: 460,
    },
    {
      label: 'PLATINUM', n: 'TIER 04', range: '80–100',
      color: '#7DD3FC', bg: 'rgba(125,211,252,0.06)',
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
        <h2 className="font-heading font-bold text-5xl mb-4" style={{ color: '#FFFFFF' }}>Four tiers.<br /><span style={{ color: '#A855F7' }}>Unlimited potential.</span></h2>
        <p className="text-text-secondary text-lg max-w-2xl mb-16 leading-relaxed">
          Your on-chain score compounds with every campaign. Higher tiers unlock bigger deal budgets, exclusive access, and platform recognition — all earned, never bought.
        </p>
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
    { wm: '4%', label: 'SUCCESS-ONLY FEE',   body: '4% platform fee charged only on successful campaign completion. Zero cost if it fails.',         bg: '#0C0018' },
    { wm: '∞',  label: 'USDC ESCROW',        body: 'Solana-powered non-custodial escrow. Funds held securely and released only when KPIs are met.',  bg: '#06000C' },
    { wm: '↗',  label: 'ON-CHAIN VERIFIED',  body: 'Every KPI checked against real Helius blockchain data. No self-reporting. No fake screenshots.', bg: '#06000C' },
    { wm: '⚖',  label: 'DISPUTE PROTECTION', body: 'Admin-mediated resolution for every contested campaign. Full audit trail on-chain, always.',     bg: '#0C0018' },
  ]
  return (
    <section className="border-t border-border" style={{ background: '#05000A' }}>
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-8 py-16 border-b border-border-muted">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-px bg-accent" />
          <span className="text-[11px] tracking-widest uppercase mono text-accent">PLATFORM GUARANTEES</span>
        </div>
        <h2 className="font-heading font-bold text-5xl" style={{ color: '#FFFFFF' }}>
          Built on trust.<br /><span style={{ color: '#A855F7' }}>Enforced on-chain.</span>
        </h2>
      </div>
      {/* 2×2 grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 border border-border-muted">
        {anchors.map((a, i) => (
          <div
            key={a.label}
            className="relative overflow-hidden px-14 py-16"
            style={{
              background: a.bg,
              borderRight: i % 2 === 0 ? '1px solid rgba(45,14,90,0.4)' : undefined,
              borderBottom: i < 2 ? '1px solid rgba(45,14,90,0.4)' : undefined,
            }}
          >
            {/* Watermark */}
            <div
              className="absolute right-6 bottom-4 select-none pointer-events-none leading-none mono"
              style={{ fontSize: '9rem', color: '#7B2FBE', opacity: 0.08 }}
            >
              {a.wm}
            </div>
            <div className="relative">
              <p className="text-[10px] tracking-widest uppercase mono mb-5 text-accent-bright">— {a.label}</p>
              <p className="text-xl leading-relaxed font-body max-w-sm" style={{ color: '#FFFFFF' }}>{a.body}</p>
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
              <h1 className="font-heading font-bold text-6xl leading-tight mb-4" style={{ color: '#FFFFFF' }}>
                TRACK ALPHA.<br /><span style={{ color: '#A855F7' }}>VERIFY SIGNAL.</span><br /><span style={{ color: '#C084FC' }}>EARN FROM KOLS.</span>
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
              {[
                { label: 'KOLs Tracked',    value: '847+',  color: '#C084FC' },
                { label: 'Platform Volume', value: '$2.4M', color: '#22D3A0' },
                { label: 'Avg Win Rate',    value: '61.4%', color: '#22D3A0' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="text-2xl font-bold mono" style={{ color, fontFamily: 'var(--font-mono)' }}>{value}</div>
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
                      <td className="px-3 py-3">
                        <span className="mono text-[11px] font-bold" style={{ color: row.rank <= 3 ? '#F59E0B' : '#4A3566' }}>
                          {row.rank <= 3 ? `#${row.rank}` : row.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-[12px] font-bold" style={{ color: '#FFFFFF' }}>{row.name}</p>
                          <p className="text-[10px] text-text-muted mono">{row.handle}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="mono text-[12px] font-bold" style={{ color: row.winRate > 60 ? '#22D3A0' : '#9B7EC8' }}>{row.winRate}%</span>
                      </td>
                      <td className="px-3 py-3"><span className="positive mono text-[12px]">{row.roi}</span></td>
                      <td className="px-3 py-3"><span className="mono text-[10px]" style={{ color: '#38BDF8' }}>{row.best}</span></td>
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

      {/* MARQUEE */}
      <HeroMarquee />

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
          <h2 className="font-heading font-bold text-5xl mb-4" style={{ color: '#FFFFFF' }}>
            READY TO TRACK<br /><span style={{ color: '#C084FC' }}>REAL ALPHA?</span>
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
