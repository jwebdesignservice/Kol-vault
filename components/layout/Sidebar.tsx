'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart2, Briefcase, Home, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { WalletButton } from '@/components/ui/WalletButton'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'DASHBOARD' },
  { href: '/leaderboard', icon: BarChart2, label: 'LEADERBOARD' },
  { href: '/deals', icon: Briefcase, label: 'DEALS' },
  { href: '/profile', icon: User, label: 'PROFILE' },
  { href: '/subscriptions/renew', icon: Settings, label: 'SUBSCRIPTION' },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <motion.aside
      animate={{ width: expanded ? 220 : 60 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="hidden md:flex flex-col h-screen bg-bg-surface shrink-0 overflow-hidden"
      style={{ borderRight: '1px solid #2D0E5A' }}
    >
      {/* Logo */}
      <div className="flex items-center h-12 px-3.5 border-b border-border shrink-0">
        <span className="text-accent text-xl font-bold shrink-0">◈</span>
        <motion.span
          animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
          transition={{ duration: 0.12 }}
          className="ml-2.5 text-text-primary font-heading font-bold text-sm tracking-widest whitespace-nowrap overflow-hidden"
        >
          KOLVAULT
        </motion.span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={label}
              href={href}
              className={[
                'flex items-center h-10 px-3.5 relative transition-colors duration-150',
                isActive
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50',
              ].join(' ')}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />
              )}
              <Icon size={16} className="shrink-0" />
              <motion.span
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
                transition={{ duration: 0.12 }}
                className="ml-3 text-[11px] tracking-widest uppercase whitespace-nowrap font-medium overflow-hidden"
              >
                {label}
              </motion.span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-2 p-2 border-t border-border shrink-0">
        <WalletButton />
        {user && (
          <button
            onClick={logout}
            className="flex items-center h-9 px-3.5 text-text-muted hover:text-negative transition-colors duration-150 w-full"
          >
            <LogOut size={14} className="shrink-0" />
            <motion.span
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={{ duration: 0.12 }}
              className="ml-3 text-[11px] tracking-widest uppercase whitespace-nowrap overflow-hidden"
            >
              LOGOUT
            </motion.span>
          </button>
        )}
      </div>
    </motion.aside>
  )
}
