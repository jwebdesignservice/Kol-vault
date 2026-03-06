'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Briefcase, List, User } from 'lucide-react'

const TABS = [
  { href: '/dashboard', icon: BarChart2, label: 'HOME' },
  { href: '/deals', icon: Briefcase, label: 'DEALS' },
  { href: '/leaderboard', icon: List, label: 'BOARD' },
  { href: '/profile', icon: User, label: 'PROFILE' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 md:hidden z-40 bg-bg-surface flex"
      style={{ borderTop: '1px solid #2D0E5A' }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150"
          >
            <Icon
              size={18}
              style={{ color: isActive ? '#A855F7' : '#4A3566' }}
            />
            <span
              className="text-[9px] tracking-widest uppercase font-medium"
              style={{ color: isActive ? '#A855F7' : '#4A3566' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
