'use client'

import { useContext } from 'react'
import { ToastContext, ToastContextValue } from '@/lib/context/ToastContext'

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
