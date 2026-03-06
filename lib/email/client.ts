import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'KOLVault <noreply@kolvault.io>'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kolvault.io'
