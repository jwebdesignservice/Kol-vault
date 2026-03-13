export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    cron_secret_set: !!process.env.CRON_SECRET,
    cron_secret_length: process.env.CRON_SECRET?.length ?? 0,
    node_env: process.env.NODE_ENV,
  })
}
