'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  BarChart2, Briefcase, DollarSign, Users, Shield,
  AlertTriangle, CheckCircle, Clock, ArrowRight, Plus, Zap,
  Activity, Star, Award, Target, Flame
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface DealRow { id: string; title: string; status: string; budget_usdc: number; created_at: string }
interface AppRow  { id: string; deal_id: string; status: string; proposed_rate_usdc: number | null; created_at: string; deal?: { title: string } }
interface KOLStats { score: number; tier: string; display_name: string; active_deals: number; completed_deals: number; pending_review: number; total_earned_usdc: number }
interface ProjectStats { token_name: string; token_symbol: string; total_deals: number; active_deals: number; open_deals: number; completed_deals: number; total_budget_usdc: number; open_disputes: number }

// ─── Colour maps ──────────────────────────────────────────────────
const SC: Record<string, string> = {
  draft:'#4A3566', open:'#22D3A0', in_progress:'#38BDF8',
  pending_review:'#F59E0B', completed:'#A855F7', cancelled:'#FF4466', disputed:'#FF4466',
  accepted:'#22D3A0', rejected:'#FF4466', pending:'#F59E0B',
}
const SB: Record<string, string> = {
  draft:'rgba(74,53,102,0.15)', open:'rgba(34,211,160,0.10)', in_progress:'rgba(56,189,248,0.10)',
  pending_review:'rgba(245,158,11,0.12)', completed:'rgba(168,85,247,0.12)',
  cancelled:'rgba(255,68,102,0.10)', disputed:'rgba(255,68,102,0.15)',
  accepted:'rgba(34,211,160,0.10)', rejected:'rgba(255,68,102,0.10)', pending:'rgba(245,158,11,0.12)',
}
const TC: Record<string, string> = { elite:'#A855F7', platinum:'#7DD3FC', gold:'#D4AF37', silver:'#A8A9AD', bronze:'#CD7F32' }
const TI: Record<string, string> = { elite:'◆', platinum:'◇', gold:'★', silver:'◈', bronze:'●' }

// ─── Micro-components ────────────────────────────────────────────
function Pill({ status }: { status: string }) {
  return (
    <span style={{ color: SC[status]??'#9B7EC8', background: SB[status]??'rgba(155,126,200,0.1)',
      border:`1px solid ${SC[status]??'#9B7EC8'}33`, padding:'2px 8px',
      fontSize:10, letterSpacing:'0.08em', fontFamily:'var(--font-mono)', fontWeight:600, whiteSpace:'nowrap' }}>
      {status.replace(/_/g,' ').toUpperCase()}
    </span>
  )
}

function MiniStat({ label, value, sub, color, icon: Icon }: { label:string; value:string|number; sub?:string; color:string; icon:React.ElementType }) {
  return (
    <div style={{ background:'#0C0018', border:'1px solid #2D0E5A', padding:'20px', display:'flex', flexDirection:'column', gap:8, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:color }} />
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Icon size={13} style={{ color }} />
        <span style={{ fontSize:10, letterSpacing:'0.1em', color:'#4A3566', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontSize:26, fontWeight:700, fontFamily:'var(--font-mono)', color }}>{value}</span>
      {sub && <span style={{ fontSize:11, color:'#9B7EC8' }}>{sub}</span>}
    </div>
  )
}

function QA({ label, href, icon: Icon, color }: { label:string; href:string; icon:React.ElementType; color:string }) {
  return (
    <Link href={href} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
      background:'#0C0018', border:`1px solid ${color}22`, color:'#FFFFFF', textDecoration:'none' }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor=color)}
      onMouseLeave={e=>(e.currentTarget.style.borderColor=`${color}22`)}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontSize:11, letterSpacing:'0.08em', fontFamily:'var(--font-mono)', textTransform:'uppercase', flex:1 }}>{label}</span>
      <ArrowRight size={11} style={{ color:'#4A3566' }} />
    </Link>
  )
}

function SecHead({ title, href, count }: { title:string; href?:string; count?:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, letterSpacing:'0.12em', color:'#FFFFFF', fontFamily:'var(--font-mono)', textTransform:'uppercase', fontWeight:600 }}>{title}</span>
        {count!==undefined && <span style={{ fontSize:10, color:'#A855F7', fontFamily:'var(--font-mono)', background:'rgba(168,85,247,0.12)', padding:'1px 6px', border:'1px solid rgba(168,85,247,0.25)' }}>{count}</span>}
      </div>
      {href && <Link href={href} style={{ fontSize:10, color:'#7B2FBE', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textDecoration:'none' }}>VIEW ALL →</Link>}
    </div>
  )
}

function DRow({ deal }: { deal:DealRow }) {
  const date = new Date(deal.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
  return (
    <Link href={`/deals/${deal.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1A0035', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
        onMouseEnter={e=>(e.currentTarget.style.background='#0C0018')}
        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, color:'#F0E6FF', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{deal.title}</div>
          <div style={{ fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', marginTop:2 }}>{date}</div>
        </div>
        <Pill status={deal.status} />
        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'#22D3A0', minWidth:80, textAlign:'right' }}>${(deal.budget_usdc??0).toLocaleString()} USDC</span>
      </div>
    </Link>
  )
}

function ARow({ app }: { app:AppRow }) {
  const date = new Date(app.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
  return (
    <div style={{ padding:'12px 16px', borderBottom:'1px solid #1A0035', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:'#F0E6FF', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {app.deal?.title??`Deal ${app.deal_id.slice(0,8)}…`}
        </div>
        <div style={{ fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', marginTop:2 }}>{date}</div>
      </div>
      <Pill status={app.status} />
      {app.proposed_rate_usdc && (
        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'#38BDF8', minWidth:70, textAlign:'right' }}>${app.proposed_rate_usdc.toLocaleString()}</span>
      )}
    </div>
  )
}

function ScoreRing({ score, tier }: { score:number; tier:string }) {
  const color = TC[tier]??'#7B2FBE', r=42, circ=2*Math.PI*r, pct=Math.min(score,100)/100
  return (
    <div style={{ position:'relative', width:110, height:110, flexShrink:0 }}>
      <svg width={110} height={110} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="#1A0035" strokeWidth={8} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="butt" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:22, fontWeight:700, fontFamily:'var(--font-mono)', color }}>{score}</span>
        <span style={{ fontSize:9, color:'#4A3566', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>SCORE</span>
      </div>
    </div>
  )
}

function Skeleton({ h=60 }: { h?:number }) {
  return <div className="shimmer" style={{ height:h, marginBottom:1 }} />
}

function Empty({ msg }: { msg:string }) {
  return <div style={{ padding:'32px 16px', textAlign:'center', color:'#4A3566', fontSize:12, fontFamily:'var(--font-mono)' }}>{msg}</div>
}

// ════════════════════════════════════════════════════════════════════
// KOL DASHBOARD
// ════════════════════════════════════════════════════════════════════
function KOLDashboard() {
  const [stats, setStats] = useState<KOLStats|null>(null)
  const [deals, setDeals] = useState<DealRow[]>([])
  const [apps, setApps] = useState<AppRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [pr, dr] = await Promise.allSettled([
        fetch('/api/kols/profile').then(r=>r.json()),
        fetch('/api/deals?limit=8').then(r=>r.json()),
      ])
      if (pr.status==='fulfilled' && pr.value?.data) {
        const p = pr.value.data
        setStats({ score:p.score??50, tier:p.tier??'bronze', display_name:p.display_name??'KOL',
          active_deals:0, completed_deals:0, pending_review:0, total_earned_usdc:0 })
      }
      if (dr.status==='fulfilled' && dr.value?.data?.deals) {
        const all: DealRow[] = dr.value.data.deals
        setDeals(all.filter(d=>d.status==='open').slice(0,5))
        setApps([]) // will populate when real applications endpoint exists
        setStats(prev=>prev?{...prev,
          active_deals: all.filter(d=>d.status==='in_progress').length,
          completed_deals: all.filter(d=>d.status==='completed').length,
          pending_review: all.filter(d=>d.status==='pending_review').length,
        }:prev)
      }
    } catch {/* ignore */} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const tier = stats?.tier??'bronze', tc = TC[tier]??'#CD7F32'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1100 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:11, color:'#7B2FBE', fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>KOL DASHBOARD</div>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#FFFFFF', margin:0, fontFamily:'var(--font-heading)' }}>
            {loading ? 'Loading...' : `Welcome, ${stats?.display_name??'KOL'}`}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
            <span style={{ fontSize:10, color:tc, fontFamily:'var(--font-mono)', letterSpacing:'0.1em' }}>{TI[tier]} {tier.toUpperCase()} TIER</span>
            <span style={{ color:'#2D0E5A' }}>·</span>
            <span style={{ fontSize:10, color:'#9B7EC8', fontFamily:'var(--font-mono)' }}>KOLVAULT MEMBER</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/leaderboard" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'rgba(123,47,190,0.1)', border:'1px solid #7B2FBE', color:'#A855F7', textDecoration:'none', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
            <BarChart2 size={12} /> LEADERBOARD
          </Link>
          <Link href="/deals" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#7B2FBE', border:'1px solid #A855F7', color:'#FFFFFF', textDecoration:'none', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
            <Briefcase size={12} /> BROWSE DEALS
          </Link>
        </div>
      </div>

      {/* Score + Stats */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {[...Array(5)].map((_,i)=><Skeleton key={i} h={100} />)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'130px repeat(4,1fr)', gap:12, alignItems:'stretch' }}>
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
            <ScoreRing score={stats?.score??50} tier={tier} />
            <span style={{ fontSize:9, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>VAULT SCORE</span>
          </div>
          <MiniStat label="Active Deals" value={stats?.active_deals??0} sub="In progress" color="#38BDF8" icon={Activity} />
          <MiniStat label="Completed" value={stats?.completed_deals??0} sub="All time" color="#22D3A0" icon={CheckCircle} />
          <MiniStat label="Pending Review" value={stats?.pending_review??0} sub="Awaiting sign-off" color="#F59E0B" icon={Clock} />
          <MiniStat label="Earnings" value={`$${(stats?.total_earned_usdc??0).toLocaleString()}`} sub="USDC lifetime" color="#A855F7" icon={DollarSign} />
        </div>
      )}

      {/* Main content */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Open Deals */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #2D0E5A' }}>
              <SecHead title="Available Deals" href="/deals" count={deals.length} />
            </div>
            {loading ? [...Array(3)].map((_,i)=><Skeleton key={i} />) :
             deals.length===0 ? <Empty msg="No open deals right now — check back soon" /> :
             deals.map(d=><DRow key={d.id} deal={d} />)}
          </div>

          {/* My Applications */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #2D0E5A' }}>
              <SecHead title="My Applications" />
            </div>
            {loading ? [...Array(2)].map((_,i)=><Skeleton key={i} />) :
             apps.length===0 ? <Empty msg="No applications yet — browse deals and apply" /> :
             apps.map(a=><ARow key={a.id} app={a} />)}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Tier ladder */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A', padding:'20px' }}>
            <div style={{ fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>TIER LADDER</div>
            {(['elite','platinum','gold','silver','bronze'] as const).map((t) => {
              const thresh: Record<string,number> = { elite:95, platinum:80, gold:60, silver:40, bronze:0 }
              const score = stats?.score??50
              const isActive = tier===t, isUnlocked = score>=thresh[t], color=TC[t]
              return (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #1A0035' }}>
                  <span style={{ fontSize:12, color:isUnlocked?color:'#2D0E5A', width:14, textAlign:'center' }}>{TI[t]}</span>
                  <span style={{ fontSize:10, color:isUnlocked?color:'#4A3566', fontFamily:'var(--font-mono)', textTransform:'uppercase', flex:1, letterSpacing:'0.08em' }}>{t}</span>
                  <span style={{ fontSize:10, color:isActive?color:'#2D0E5A', fontFamily:'var(--font-mono)', fontWeight:isActive?700:400 }}>
                    {isActive?'CURRENT':`${thresh[t]}+`}
                  </span>
                </div>
              )
            })}
            {/* Score bar */}
            <div style={{ marginTop:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:10, color:'#9B7EC8', fontFamily:'var(--font-mono)' }}>SCORE</span>
                <span style={{ fontSize:10, color:tc, fontFamily:'var(--font-mono)', fontWeight:700 }}>{stats?.score??50} / 100</span>
              </div>
              <div style={{ height:4, background:'#1A0035', position:'relative' }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${stats?.score??50}%`, background:tc, transition:'width 1s ease' }} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
            <div style={{ padding:'16px 20px 12px', fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>QUICK ACTIONS</div>
            <QA label="Browse Open Deals" href="/deals" icon={Briefcase} color="#A855F7" />
            <QA label="View Leaderboard" href="/leaderboard" icon={BarChart2} color="#22D3A0" />
            <QA label="Edit Profile" href="/profile" icon={Users} color="#38BDF8" />
            <QA label="Subscription" href="/subscriptions/renew" icon={Star} color="#F59E0B" />
          </div>

          {/* Tip */}
          <div style={{ background:'rgba(123,47,190,0.06)', border:'1px solid rgba(123,47,190,0.25)', padding:'16px' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <Flame size={13} style={{ color:'#A855F7', flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{ fontSize:11, color:'#A855F7', fontFamily:'var(--font-mono)', marginBottom:5, fontWeight:600 }}>GROW YOUR SCORE</div>
                <div style={{ fontSize:11, color:'#9B7EC8', lineHeight:1.65 }}>Completed campaign +10 pts · Partial +2 · Failure −8 · Hit 95 to reach Elite tier.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// PROJECT DASHBOARD
// ════════════════════════════════════════════════════════════════════
function ProjectDashboard() {
  const [stats, setStats] = useState<ProjectStats|null>(null)
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [pr, dr] = await Promise.allSettled([
        fetch('/api/projects/profile').then(r=>r.json()),
        fetch('/api/deals?limit=20').then(r=>r.json()),
      ])
      const all: DealRow[] = dr.status==='fulfilled' ? (dr.value?.data?.deals??[]) : []
      setDeals(all.slice(0,8))
      const profile = pr.status==='fulfilled' ? pr.value?.data : null
      setStats({
        token_name: profile?.token_name??'Your Project',
        token_symbol: profile?.token_symbol??'',
        total_deals: all.length,
        active_deals: all.filter(d=>d.status==='in_progress').length,
        open_deals: all.filter(d=>d.status==='open').length,
        completed_deals: all.filter(d=>d.status==='completed').length,
        total_budget_usdc: all.reduce((s,d)=>s+(d.budget_usdc??0),0),
        open_disputes: all.filter(d=>d.status==='disputed').length,
      })
    } catch {/* ignore */} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const pipelineItems = [
    { label:'Draft', status:'draft' }, { label:'Open', status:'open' },
    { label:'In Progress', status:'in_progress' }, { label:'Pending Review', status:'pending_review' },
    { label:'Completed', status:'completed' }, { label:'Disputed', status:'disputed' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1100 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:11, color:'#22D3A0', fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>PROJECT ADMIN DASHBOARD</div>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#FFFFFF', margin:0, fontFamily:'var(--font-heading)' }}>
            {loading ? 'Loading...' : (stats?.token_name??'Your Project')}
          </h1>
          {stats?.token_symbol && (
            <span style={{ fontSize:11, color:'#22D3A0', fontFamily:'var(--font-mono)', background:'rgba(34,211,160,0.10)', padding:'2px 10px', border:'1px solid rgba(34,211,160,0.25)', letterSpacing:'0.08em', display:'inline-block', marginTop:6 }}>
              ${stats.token_symbol}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/leaderboard" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'rgba(34,211,160,0.08)', border:'1px solid #22D3A0', color:'#22D3A0', textDecoration:'none', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
            <Users size={12} /> FIND KOLS
          </Link>
          <Link href="/deals/create" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#7B2FBE', border:'1px solid #A855F7', color:'#FFFFFF', textDecoration:'none', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
            <Plus size={12} /> POST DEAL
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {[...Array(5)].map((_,i)=><Skeleton key={i} h={100} />)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          <MiniStat label="Total Deals" value={stats?.total_deals??0} color="#A855F7" icon={Briefcase} />
          <MiniStat label="Open" value={stats?.open_deals??0} sub="Accepting apps" color="#22D3A0" icon={Zap} />
          <MiniStat label="Active" value={stats?.active_deals??0} sub="In progress" color="#38BDF8" icon={Activity} />
          <MiniStat label="Completed" value={stats?.completed_deals??0} sub="All time" color="#A855F7" icon={CheckCircle} />
          {(stats?.open_disputes??0)>0
            ? <MiniStat label="Disputes" value={stats?.open_disputes??0} sub="Needs attention" color="#FF4466" icon={AlertTriangle} />
            : <MiniStat label="Budget" value={`$${((stats?.total_budget_usdc??0)/1000).toFixed(1)}k`} sub="USDC total" color="#D4AF37" icon={DollarSign} />}
        </div>
      )}

      {/* Dispute alert */}
      {!loading && (stats?.open_disputes??0)>0 && (
        <div style={{ background:'rgba(255,68,102,0.06)', border:'1px solid rgba(255,68,102,0.3)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={14} style={{ color:'#FF4466', flexShrink:0 }} />
          <span style={{ fontSize:12, color:'#FF4466', fontFamily:'var(--font-mono)', flex:1 }}>
            {stats?.open_disputes} open dispute{(stats?.open_disputes??0)>1?'s':''} — review and resolve to release escrow
          </span>
          <Link href="/deals" style={{ fontSize:11, color:'#FF4466', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textDecoration:'none' }}>REVIEW →</Link>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>

        {/* Deals table */}
        <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #2D0E5A' }}>
            <SecHead title="Your Deals" href="/deals" count={deals.length} />
          </div>
          {loading ? [...Array(4)].map((_,i)=><Skeleton key={i} />) :
           deals.length===0 ? (
             <div style={{ padding:'48px 20px', textAlign:'center' }}>
               <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
               <div style={{ fontSize:13, color:'#9B7EC8', marginBottom:20 }}>No deals yet. Post your first campaign to hire KOLs.</div>
               <Link href="/deals/create" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 22px', background:'#7B2FBE', color:'#FFFFFF', textDecoration:'none', fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
                 <Plus size={12} /> POST YOUR FIRST DEAL
               </Link>
             </div>
           ) : deals.map(d=><DRow key={d.id} deal={d} />)}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Pipeline */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A', padding:'20px' }}>
            <div style={{ fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>DEAL PIPELINE</div>
            {pipelineItems.map(({ label, status }) => {
              const val = deals.filter(d=>d.status===status).length
              return (
                <div key={status} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #1A0035' }}>
                  <div style={{ width:8, height:8, background:SC[status]??'#4A3566', flexShrink:0 }} />
                  <span style={{ fontSize:11, color:'#9B7EC8', flex:1, fontFamily:'var(--font-mono)' }}>{label}</span>
                  <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:val>0?(SC[status]??'#A855F7'):'#2D0E5A', fontWeight:700 }}>{val}</span>
                </div>
              )
            })}
            {/* Total budget bar */}
            {(stats?.total_budget_usdc??0)>0 && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #1A0035' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, color:'#9B7EC8', fontFamily:'var(--font-mono)' }}>TOTAL BUDGET</span>
                  <span style={{ fontSize:10, color:'#D4AF37', fontFamily:'var(--font-mono)', fontWeight:700 }}>${(stats?.total_budget_usdc??0).toLocaleString()} USDC</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
            <div style={{ padding:'16px 20px 12px', fontSize:10, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>QUICK ACTIONS</div>
            <QA label="Post New Deal" href="/deals/create" icon={Plus} color="#A855F7" />
            <QA label="Browse KOL Leaderboard" href="/leaderboard" icon={BarChart2} color="#22D3A0" />
            <QA label="Manage All Deals" href="/deals" icon={Briefcase} color="#38BDF8" />
            <QA label="Edit Project Profile" href="/profile" icon={Target} color="#F59E0B" />
            <QA label="Subscription" href="/subscriptions/renew" icon={Award} color="#818CF8" />
          </div>

          {/* Escrow tip */}
          <div style={{ background:'rgba(34,211,160,0.04)', border:'1px solid rgba(34,211,160,0.18)', padding:'16px' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <Shield size={13} style={{ color:'#22D3A0', flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{ fontSize:11, color:'#22D3A0', fontFamily:'var(--font-mono)', marginBottom:5, fontWeight:600 }}>ESCROW PROTECTED</div>
                <div style={{ fontSize:11, color:'#9B7EC8', lineHeight:1.65 }}>Funds held on-chain in USDC escrow. Released only when you approve campaign results.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// PLATFORM ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1100 }}>
      <div>
        <div style={{ fontSize:11, color:'#FF4466', fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>PLATFORM ADMIN</div>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#FFFFFF', margin:0 }}>Control Panel</h1>
      </div>

      {/* Alert: Supabase needed */}
      <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.3)', padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <AlertTriangle size={14} style={{ color:'#F59E0B', flexShrink:0 }} />
        <span style={{ fontSize:12, color:'#F59E0B', fontFamily:'var(--font-mono)' }}>
          Connect Supabase to unlock live platform metrics. Currently showing mock state.
        </span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <MiniStat label="All Deals" value="—" sub="DB required" color="#A855F7" icon={Briefcase} />
        <MiniStat label="KOLs" value="—" sub="DB required" color="#22D3A0" icon={Users} />
        <MiniStat label="Open Disputes" value="—" sub="DB required" color="#FF4466" icon={AlertTriangle} />
        <MiniStat label="Fee Revenue" value="—" sub="USDC" color="#D4AF37" icon={DollarSign} />
      </div>

      <div style={{ background:'#0C0018', border:'1px solid #2D0E5A' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #2D0E5A' }}>
          <SecHead title="Admin Actions" />
        </div>
        <QA label="Manage All Deals" href="/deals" icon={Briefcase} color="#A855F7" />
        <QA label="KOL Directory" href="/leaderboard" icon={Users} color="#22D3A0" />
        <QA label="Manage Deals (Admin API)" href="/deals" icon={Target} color="#38BDF8" />
        <QA label="Edit Profile" href="/profile" icon={Shield} color="#F59E0B" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <span style={{ fontSize:11, color:'#4A3566', fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase' }} className="animate-pulse">
        LOADING DASHBOARD...
      </span>
    </div>
  )

  if (!user) return null
  if (user.role==='admin') return <AdminDashboard />
  if (user.role==='project') return <ProjectDashboard />
  return <KOLDashboard />
}
