'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (user.role === 'project') {
      router.replace('/deals')
    } else {
      router.replace('/leaderboard')
    }
  }, [user, loading, router])

  return null
}
