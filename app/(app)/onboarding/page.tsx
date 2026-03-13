'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const NICHE_OPTIONS = ['DeFi', 'NFT', 'Gaming', 'L1/L2', 'Meme', 'AI', 'RWA', 'Perps', 'Yield', 'Infra', 'Privacy', 'Social']
const CHAIN_OPTIONS = ['solana', 'ethereum', 'base', 'arbitrum', 'polygon', 'avalanche', 'bnb', 'other']

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // KOL fields
  const [kolForm, setKolForm] = useState({
    display_name: '',
    bio: '',
    twitter_handle: '',
    telegram_handle: '',
    youtube_handle: '',
    tiktok_handle: '',
    audience_size_estimate: '',
    solana_wallet_address: '',
  })
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])

  // Project fields
  const [projectForm, setProjectForm] = useState({
    token_name: '',
    token_symbol: '',
    contract_address: '',
    chain: 'solana',
    website_url: '',
    description: '',
  })

  // Pre-fill display_name from auth if available
  useEffect(() => {
    if (user && user.role === 'kol') {
      // Try to load existing profile
      fetch('/api/kols/profile')
        .then((r) => r.json())
        .then((d) => {
          if (d?.data?.profile) {
            const p = d.data.profile
            setKolForm({
              display_name: p.display_name ?? '',
              bio: p.bio ?? '',
              twitter_handle: p.twitter_handle ?? '',
              telegram_handle: p.telegram_handle ?? '',
              youtube_handle: p.youtube_handle ?? '',
              tiktok_handle: p.tiktok_handle ?? '',
              audience_size_estimate: p.audience_size_estimate?.toString() ?? '',
              solana_wallet_address: p.solana_wallet_address ?? '',
            })
            setSelectedNiches(p.niche ?? [])
          }
        })
        .catch(() => {})
    } else if (user && user.role === 'project') {
      fetch('/api/projects/profile')
        .then((r) => r.json())
        .then((d) => {
          if (d?.data?.profile) {
            const p = d.data.profile
            setProjectForm({
              token_name: p.token_name ?? '',
              token_symbol: p.token_symbol ?? '',
              contract_address: p.contract_address ?? '',
              chain: p.chain ?? 'solana',
              website_url: p.website_url ?? '',
              description: p.description ?? '',
            })
          }
        })
        .catch(() => {})
    }
  }, [user])

  const toggleNiche = (n: string) => {
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 5 ? [...prev, n] : prev
    )
  }

  const setKol = (k: keyof typeof kolForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setKolForm((f) => ({ ...f, [k]: e.target.value }))

  const setProject = (k: keyof typeof projectForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProjectForm((f) => ({ ...f, [k]: e.target.value }))

  const handleKolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kolForm.display_name.trim()) {
      addToast('error', 'Display name is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...kolForm,
        niche: selectedNiches,
        audience_size_estimate: kolForm.audience_size_estimate ? parseInt(kolForm.audience_size_estimate, 10) : undefined,
      }
      const res = await fetch('/api/kols/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDone(true)
        addToast('success', 'Profile saved! Welcome to KOL Vault.')
        setTimeout(() => router.push('/dashboard'), 1200)
      } else {
        const d = await res.json()
        addToast('error', d.error ?? 'Failed to save profile')
      }
    } catch {
      addToast('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectForm.token_name.trim() || !projectForm.token_symbol.trim() || !projectForm.contract_address.trim()) {
      addToast('error', 'Token name, symbol, and contract address are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/projects/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      })
      if (res.ok) {
        setDone(true)
        addToast('success', 'Project profile saved! Welcome to KOL Vault.')
        setTimeout(() => router.push('/dashboard'), 1200)
      } else {
        const d = await res.json()
        addToast('error', d.error ?? 'Failed to save profile')
      }
    } catch {
      addToast('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-text-muted text-[11px] tracking-widest uppercase mono animate-pulse">LOADING...</span>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-accent text-5xl mb-4">◈</div>
          <p className="font-heading font-bold text-xl tracking-widest text-text-primary">PROFILE SAVED</p>
          <p className="text-text-muted text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-accent text-2xl">◈</span>
          <h1 className="font-heading font-bold text-2xl tracking-widest text-text-primary">
            COMPLETE YOUR PROFILE
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          {user?.role === 'kol'
            ? 'Set up your KOL profile so projects can find and evaluate you.'
            : 'Set up your project profile so KOLs know who they are working with.'}
        </p>
        <div className="h-px bg-border mt-6" />
      </div>

      {/* KOL Form */}
      {user?.role === 'kol' && (
        <form onSubmit={handleKolSubmit} className="flex flex-col gap-6">
          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">IDENTITY</p>
            <div className="flex flex-col gap-4">
              <Input label="Display Name *" type="text" placeholder="How you appear on the platform" value={kolForm.display_name} onChange={setKol('display_name')} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] tracking-widest uppercase text-text-secondary">Bio</label>
                <textarea
                  placeholder="Tell projects about yourself — niche, track record, audience..."
                  value={kolForm.bio}
                  onChange={setKol('bio')}
                  rows={3}
                  className="bg-bg border border-border text-text-primary text-sm p-3 w-full resize-none focus:outline-none focus:border-accent placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">NICHE (pick up to 5)</p>
            <div className="flex flex-wrap gap-2">
              {NICHE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNiche(n)}
                  className={[
                    'px-3 py-1 text-[11px] tracking-widest uppercase border transition-colors',
                    selectedNiches.includes(n)
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-text-muted hover:border-accent/50',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">SOCIALS</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Twitter / X" type="text" placeholder="@handle" value={kolForm.twitter_handle} onChange={setKol('twitter_handle')} />
              <Input label="Telegram" type="text" placeholder="@handle" value={kolForm.telegram_handle} onChange={setKol('telegram_handle')} />
              <Input label="YouTube" type="text" placeholder="Channel name or URL" value={kolForm.youtube_handle} onChange={setKol('youtube_handle')} />
              <Input label="TikTok" type="text" placeholder="@handle" value={kolForm.tiktok_handle} onChange={setKol('tiktok_handle')} />
            </div>
            <div className="mt-4">
              <Input label="Estimated Audience Size" type="number" placeholder="e.g. 50000" value={kolForm.audience_size_estimate} onChange={setKol('audience_size_estimate')} />
            </div>
          </div>

          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">WALLET</p>
            <Input label="Solana Wallet Address" type="text" placeholder="Your Solana public key for payouts" value={kolForm.solana_wallet_address} onChange={setKol('solana_wallet_address')} className="mono text-xs" />
            <p className="text-[11px] text-text-muted mt-2">Required to receive USDC payments from completed deals.</p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="lg" disabled={saving} className="flex-1">
              {saving ? 'SAVING...' : 'SAVE PROFILE & ENTER VAULT'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
              SKIP FOR NOW
            </Button>
          </div>
        </form>
      )}

      {/* Project Form */}
      {user?.role === 'project' && (
        <form onSubmit={handleProjectSubmit} className="flex flex-col gap-6">
          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">TOKEN INFO</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Token Name *" type="text" placeholder="e.g. KOL Vault Token" value={projectForm.token_name} onChange={setProject('token_name')} />
              <Input label="Token Symbol *" type="text" placeholder="e.g. KVLT" value={projectForm.token_symbol} onChange={setProject('token_symbol')} />
            </div>
            <div className="mt-4">
              <Input label="Contract Address *" type="text" placeholder="On-chain contract address" value={projectForm.contract_address} onChange={setProject('contract_address')} className="mono text-xs" />
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <label className="text-[11px] tracking-widest uppercase text-text-secondary">Chain</label>
              <select
                value={projectForm.chain}
                onChange={setProject('chain')}
                className="bg-bg border border-border text-text-primary text-sm p-3 w-full focus:outline-none focus:border-accent"
              >
                {CHAIN_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-bg-surface border border-border p-6">
            <p className="text-[10px] tracking-widest uppercase text-accent mb-5">PROJECT DETAILS</p>
            <div className="flex flex-col gap-4">
              <Input label="Website URL" type="url" placeholder="https://yourproject.io" value={projectForm.website_url} onChange={setProject('website_url')} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] tracking-widest uppercase text-text-secondary">Description</label>
                <textarea
                  placeholder="What does your project do? What are you looking for in a KOL?"
                  value={projectForm.description}
                  onChange={setProject('description')}
                  rows={4}
                  className="bg-bg border border-border text-text-primary text-sm p-3 w-full resize-none focus:outline-none focus:border-accent placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="lg" disabled={saving} className="flex-1">
              {saving ? 'SAVING...' : 'SAVE PROFILE & ENTER VAULT'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
              SKIP FOR NOW
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
