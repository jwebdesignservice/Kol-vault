'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { Toast as ToastType } from '@/lib/context/ToastContext'

const borderColors: Record<ToastType['type'], string> = {
  info: '#7B2FBE',
  success: '#22D3A0',
  error: '#FF4466',
  warning: '#F59E0B',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast()
  return (
    <motion.div
      key={toast.id}
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="min-w-[280px] max-w-[360px] bg-bg-surface border border-border px-4 py-3 flex items-start gap-3"
      style={{ borderLeftColor: borderColors[toast.type], borderLeftWidth: 4 }}
    >
      <span className="flex-1 text-sm text-text-primary leading-snug">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-text-muted hover:text-text-primary transition-colors mt-0.5 shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
