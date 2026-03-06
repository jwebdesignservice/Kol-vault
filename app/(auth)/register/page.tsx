'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, BarChart2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastProvider } from '@/lib/context/ToastContext'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

type Role = 'project' | 'kol'
type Step = 1 | 2

const ROLE_OPTIONS: { role: Role; icon: typeof Briefcase; title: string; desc: string }[] = [
  {
    role: 'project',
    icon: Briefcase,
    title: 'PROJECT',
    desc: 'Post deals, find verified KOLs, fund campaigns with Solana escrow, track performance on-chain.',
  },
  {
    role: 'kol',
    icon: BarChart2,
    title: 'KOL',
    desc: 'Monetise your alpha. Apply to paid deals, build your on-chain reputation, grow your score.',
  },
]

function RegisterForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ email: '', password: '', confirm: '', twitterHandle: '' })
  const [errors, setErrors] = useState<Partial<typeof form & { role: string }>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const goToStep2 = () => {
    if (!role) {
      setErrors({ role: 'Please select a role' })
      return
    }
    setErrors({})
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!form.email) newErrors.email = 'Required'
    if (!form.password || form.password.length < 8) newErrors.password = 'Min 8 characters'
    if (form.password !== form.confirm) newErrors.confirm = 'Passwords do not match'
    if (role === 'kol' && !form.twitterHandle) newErrors.twitterHandle = 'Required for KOLs'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const body: Record<string, string> = {
        email: form.email,
        password: form.password,
        role: role!,
      }
      if (role === 'kol') body.twitter_handle = form.twitterHandle
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        addToast('success', 'Account created! Signing you in...')
        router.push('/dashboard')
      } else {
        const data = await res.json()
        addToast('error', data.error ?? 'Registration failed.')
      }
    } catch {
      addToast('error', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[520px]">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-accent text-3xl font-bold">◈</span>
          <span className="font-heading font-bold text-2xl tracking-widest text-text-primary">
            KOLVAULT
          </span>
        </div>
        <p className="text-text-muted text-[11px] tracking-widest uppercase mono">
          CREATE YOUR ACCOUNT
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 mb-8">
        {['SELECT ROLE', 'DETAILS'].map((label, i) => {
          const n = i + 1
          const isActive = step === n
          const isDone = step > n
          return (
            <div key={label} className="flex-1">
              <div
                className={[
                  'h-1 transition-colors duration-200',
                  isDone || isActive ? 'bg-accent' : 'bg-border',
                ].join(' ')}
              />
              <span
                className={[
                  'text-[10px] tracking-widest uppercase pt-1 block',
                  isActive ? 'text-accent' : isDone ? 'text-positive' : 'text-text-muted',
                ].join(' ')}
              >
                {n}. {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1 — Role Selection */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {ROLE_OPTIONS.map(({ role: r, icon: Icon, title, desc }) => (
              <button
                key={r}
                onClick={() => { setRole(r); setErrors({}) }}
                className={[
                  'clip-corner-tr flex flex-col gap-3 p-6 border text-left transition-all duration-150',
                  role === r
                    ? 'glow-border bg-bg-elevated'
                    : 'border-border bg-bg-surface hover:border-accent/50',
                ].join(' ')}
              >
                <Icon
                  size={28}
                  className={role === r ? 'text-accent-bright' : 'text-text-muted'}
                />
                <div>
                  <h3 className="font-heading font-bold text-base tracking-widest text-text-primary mb-1">
                    {title}
                  </h3>
                  <p className="text-text-secondary text-[12px] leading-relaxed">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-[11px] text-negative tracking-wide">{errors.role}</p>
          )}
          <Button variant="primary" size="lg" className="w-full mt-2" onClick={goToStep2}>
            CONTINUE
          </Button>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div className="bg-bg-surface border border-border p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[10px] tracking-widest uppercase text-text-muted">Registering as</span>
            <span className="text-[10px] tracking-widest uppercase text-accent font-bold">{role}</span>
            <button
              onClick={() => setStep(1)}
              className="text-[10px] tracking-widest uppercase text-text-muted hover:text-text-primary ml-auto"
            >
              CHANGE
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
            />
            {role === 'kol' && (
              <Input
                label="Twitter / X Handle"
                type="text"
                placeholder="@yourhandle"
                value={form.twitterHandle}
                onChange={set('twitterHandle')}
                error={errors.twitterHandle}
              />
            )}
            <div className="mt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'CREATING ACCOUNT...' : 'COMPLETE REGISTRATION'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="text-center mt-6">
        <span className="text-text-muted text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-accent hover:text-accent-bright transition-colors tracking-widest uppercase text-[11px] font-medium"
          >
            SIGN IN
          </Link>
        </span>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <ToastProvider>
      <RegisterForm />
    </ToastProvider>
  )
}
