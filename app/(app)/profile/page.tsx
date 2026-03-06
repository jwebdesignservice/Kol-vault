'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [displayName, setDisplayName] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    addToast('success', 'Profile updated.')
    setSaving(false)
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'
  const roleVariant = user?.role === 'kol' ? 'accent' : user?.role === 'project' ? 'positive' : 'muted'

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl tracking-widest text-text-primary mb-8">
        PROFILE
      </h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-bg-surface border border-border">
        <div className="w-16 h-16 bg-accent flex items-center justify-center text-white font-bold font-mono text-xl">
          {initials}
        </div>
        <div>
          <p className="font-heading font-bold text-lg text-text-primary mb-1">
            {user?.email ?? '—'}
          </p>
          <div className="flex items-center gap-3">
            <Badge variant={roleVariant}>{user?.role ?? '—'}</Badge>
            <span className="mono text-[11px] text-text-muted">ID: {user?.id?.slice(0, 8) ?? '—'}...</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-bg-surface border border-border p-6">
        <h2 className="text-[11px] tracking-widest uppercase text-text-muted mb-6">
          EDIT PROFILE
        </h2>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input
            label="Display Name"
            type="text"
            placeholder="Your public display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Twitter / X Handle"
            type="text"
            placeholder="@yourhandle"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
          />
          {user?.role === 'kol' && (
            <Input
              label="Solana Wallet Address"
              type="text"
              placeholder="Your Solana public key"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="mono"
            />
          )}
          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-bg-surface border border-border p-6">
        <h2 className="text-[11px] tracking-widest uppercase text-negative mb-4">
          ACCOUNT
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-3 border-b border-border-muted">
            <div>
              <p className="text-sm text-text-primary font-medium">Email</p>
              <p className="text-[12px] text-text-muted mono">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-text-primary font-medium">Role</p>
              <p className="text-[12px] text-text-muted mono uppercase">{user?.role}</p>
            </div>
            <Badge variant={roleVariant}>{user?.role}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
