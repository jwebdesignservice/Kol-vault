'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const NICHE_OPTIONS = ['DeFi', 'NFT', 'Gaming', 'L1/L2', 'Meme', 'AI', 'RWA', 'Perps', 'Yield', 'Infra', 'Privacy', 'Social']

export default function ProfilePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // KOL fields
  const [kolForm, setKolForm] = useState({
    display_name: '', bio: '', twitter_handle: '', telegram_handle: '',
    youtube_handle: '', tiktok_handle: '', audience_size_estimate: '',
    solana_wallet_address: '',
  })
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])

  // Project fields
  const [projectForm, setProjectForm] = useState({
    token_name: '', token_symbol: '', contract_address: '',
    chain: 'solana', website_url: '', description: '',
  })

  // Score info (KOL only)
  const [scoreInfo, setScoreInfo] = useState<{ score: number; tier: string } | null>(null)

  useEffect(() => {
    if (!user) return
    const endpoint = user.role === 'kol' ? '/api/kols/profile' : '/api/projects/profile'
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        const p = d?.data?.profile
        if (!p) return
        if (user.role === 'kol') {
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
          setScoreInfo({ score: p.score ?? 50, tier: p.tier ?? 'bronze' })
        } else {
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
      .finally(() => setLoading(false))
  }, [user])

  const setKol = (k: keyof typeof kolForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setKolForm((f) => ({ ...f, [k]: e.target.value }))

  const setProject = (k: keyof typeof projectForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProjectForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleNiche = (n: string) => {
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 5 ? [...prev, n] : prev
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const endpoint = user?.role === 'kol' ? '/api/kols/profile' : '/api/projects/profile'
      const body = user?.role === 'kol'
        ? { ...kolForm, niche: selectedNiches, audience_size_estimate: kolForm.audience_size_estimate ? parseInt(kolForm.audience_size_estimate, 10) : undefined }
        : projectForm

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        addToast('success', 'Profile updated.')
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

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'
  const roleVariant = user?.role === 'kol' ? 'accent' : user?.role === 'project' ? 'positive' : 'muted'

  const tierColour: Record<string, string> = {
    bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', platinum: '#7DD3FC', elite: '#A855F7',
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl tracking-widest text-text-primary mb-8">PROFILE</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-bg-surface border border-border">
        <div className="w-16 h-16 bg-accent flex items-center justify-center text-white font-bold font-mono text-xl">
          {initials}
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-lg text-text-primary mb-1">{user?.email ?? '—'}</p>
          <div className="flex items-center gap-3">
            <Badge variant={roleVariant}>{user?.role ?? '—'}</Badge>
            <span className="mono text-[11px] text-text-muted">ID: {user?.id?.slice(0, 8) ?? '—'}...</span>
          </div>
        </div>
        {scoreInfo && (
          <div className="text-right">
            <p className="font-heading font-bold text-3xl" style={{ color: tierColour[scoreInfo.tier] ?? '#A855F7' }}>
              {scoreInfo.score}
            </p>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: tierColour[scoreInfo.tier] ?? '#A855F7' }}>
              {scoreInfo.tier}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted text-[11px] tracking-widest uppercase animate-pulse">
          LOADING PROFILE...
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* KOL Form */}
          {user?.role === 'kol' && (
            <>
              <div className="bg-bg-surface border border-border p-6">
                <p className="text-[10px] tracking-widest uppercase text-accent mb-5">IDENTITY</p>
                <div className="flex flex-col gap-4">
                  <Input label="Display Name" type="text" placeholder="Your public name" value={kolForm.display_name} onChange={setKol('display_name')} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] tracking-widest uppercase text-text-secondary">Bio</label>
                    <textarea value={kolForm.bio} onChange={setKol('bio')} rows={3} placeholder="Tell projects about yourself..."
                      className="bg-bg border border-border text-text-primary text-sm p-3 w-full resize-none focus:outline-none focus:border-accent placeholder:text-text-muted" />
                  </div>
                </div>
              </div>

              <div className="bg-bg-surface border border-border p-6">
                <p className="text-[10px] tracking-widest uppercase text-accent mb-4">NICHE (up to 5)</p>
                <div className="flex flex-wrap gap-2">
                  {NICHE_OPTIONS.map((n) => (
                    <button key={n} type="button" onClick={() => toggleNiche(n)}
                      className={['px-3 py-1 text-[11px] tracking-widest uppercase border transition-colors',
                        selectedNiches.includes(n) ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-muted hover:border-accent/50'].join(' ')}>
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
                  <Input label="YouTube" type="text" placeholder="Channel" value={kolForm.youtube_handle} onChange={setKol('youtube_handle')} />
                  <Input label="TikTok" type="text" placeholder="@handle" value={kolForm.tiktok_handle} onChange={setKol('tiktok_handle')} />
                </div>
                <div className="mt-4">
                  <Input label="Estimated Audience Size" type="number" placeholder="e.g. 50000" value={kolForm.audience_size_estimate} onChange={setKol('audience_size_estimate')} />
                </div>
              </div>

              <div className="bg-bg-surface border border-border p-6">
                <p className="text-[10px] tracking-widest uppercase text-accent mb-4">WALLET</p>
                <Input label="Solana Wallet Address" type="text" placeholder="Your Solana public key for payouts" value={kolForm.solana_wallet_address} onChange={setKol('solana_wallet_address')} className="mono text-xs" />
                <p className="text-[11px] text-text-muted mt-2">Required to receive USDC payments.</p>
              </div>
            </>
          )}

          {/* Project Form */}
          {user?.role === 'project' && (
            <>
              <div className="bg-bg-surface border border-border p-6">
                <p className="text-[10px] tracking-widest uppercase text-accent mb-5">TOKEN INFO</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Token Name" type="text" placeholder="e.g. KOL Vault Token" value={projectForm.token_name} onChange={setProject('token_name')} />
                  <Input label="Symbol" type="text" placeholder="e.g. KVLT" value={projectForm.token_symbol} onChange={setProject('token_symbol')} />
                </div>
                <div className="mt-4">
                  <Input label="Contract Address" type="text" placeholder="On-chain address" value={projectForm.contract_address} onChange={setProject('contract_address')} className="mono text-xs" />
                </div>
                <div className="mt-4 flex flex-col gap-1">
                  <label className="text-[11px] tracking-widest uppercase text-text-secondary">Chain</label>
                  <select value={projectForm.chain} onChange={setProject('chain')}
                    className="bg-bg border border-border text-text-primary text-sm p-3 w-full focus:outline-none focus:border-accent">
                    {['solana','ethereum','base','arbitrum','polygon','avalanche','bnb','other'].map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-bg-surface border border-border p-6">
                <p className="text-[10px] tracking-widest uppercase text-accent mb-5">DETAILS</p>
                <div className="flex flex-col gap-4">
                  <Input label="Website URL" type="url" placeholder="https://yourproject.io" value={projectForm.website_url} onChange={setProject('website_url')} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] tracking-widest uppercase text-text-secondary">Description</label>
                    <textarea value={projectForm.description} onChange={setProject('description')} rows={4} placeholder="What does your project do?"
                      className="bg-bg border border-border text-text-primary text-sm p-3 w-full resize-none focus:outline-none focus:border-accent placeholder:text-text-muted" />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </form>
      )}
    </div>
  )
}
