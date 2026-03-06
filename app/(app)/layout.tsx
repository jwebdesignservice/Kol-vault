'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ToastProvider } from '@/lib/context/ToastContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'

// Pages that require a logged-in session
const AUTH_REQUIRED = ['/dashboard', '/profile', '/deals/create']

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const requiresAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (!loading && !user && requiresAuth) {
      router.push('/login')
    }
  }, [user, loading, requiresAuth, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-accent text-4xl font-bold">◈</span>
          <span className="text-text-muted text-[11px] tracking-widest uppercase mono">
            LOADING...
          </span>
        </div>
      </div>
    )
  }

  // Block protected pages for guests while redirect is processing
  if (!user && requiresAuth) return null

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </ToastProvider>
  )
}
