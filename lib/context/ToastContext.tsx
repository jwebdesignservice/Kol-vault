'use client'

import { createContext, useCallback, useState, ReactNode } from 'react'

export interface Toast {
  id: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

export interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: Toast['type'], message: string) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => {
        const next = [...prev, { id, type, message }]
        return next.slice(-3)
      })
      setTimeout(() => removeToast(id), 3500)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}
