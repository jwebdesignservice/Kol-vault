'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastProvider } from '@/lib/context/ToastContext'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

function LoginForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = 'Required'
    if (!password) newErrors.password = 'Required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        addToast('success', 'Signed in successfully.')
        router.push('/dashboard')
      } else {
        const data = await res.json()
        addToast('error', data.error ?? 'Invalid credentials.')
        setErrors({ email: ' ', password: 'Invalid email or password' })
      }
    } catch {
      addToast('error', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-accent text-3xl font-bold">◈</span>
          <span className="font-heading font-bold text-2xl tracking-widest text-text-primary">
            KOLVAULT
          </span>
        </div>
        <p className="text-text-muted text-[11px] tracking-widest uppercase mono">
          WEB3 KOL MARKETPLACE
        </p>
      </div>

      {/* Card */}
      <div className="bg-bg-elevated/50 border border-border p-8">
        <h2 className="font-heading font-bold text-lg tracking-widest uppercase text-text-primary mb-6">
          SIGN IN
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
          <div className="mt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Button>
          </div>
        </form>
        <div className="mt-6 pt-4 border-t border-border-muted text-center">
          <span className="text-text-muted text-sm">
            No account?{' '}
            <Link
              href="/register"
              className="text-accent hover:text-accent-bright transition-colors tracking-widest uppercase text-[11px] font-medium"
            >
              REGISTER
            </Link>
          </span>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-text-muted text-[11px] tracking-widest hover:text-text-secondary transition-colors uppercase"
        >
          ← BACK TO HOME
        </Link>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  )
}
