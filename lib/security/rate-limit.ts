/**
 * KOL Vault — In-memory sliding window rate limiter
 *
 * ⚠️  Serverless caveat: each Vercel Lambda instance has isolated memory.
 *    This provides best-effort protection per-instance, not globally.
 *    For global rate limiting, use Upstash Redis or Vercel KV (future).
 *
 * Usage:
 *   const result = rateLimit(ip, 'login', { limit: 5, windowMs: 60_000 })
 *   if (!result.ok) return apiError('Too many requests', 429)
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetMs: number
}

/**
 * Check and record a rate limit hit.
 * @param identifier  IP address or user ID
 * @param namespace   Bucket name (e.g. 'login', 'register')
 * @param options     limit + windowMs
 */
export function rateLimit(
  identifier: string,
  namespace: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs } = options
  const key = `${namespace}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Get or create entry
  const entry = store.get(key) ?? { timestamps: [] }

  // Slide the window — remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  const count = entry.timestamps.length

  if (count >= limit) {
    const oldestInWindow = entry.timestamps[0]
    const resetMs = oldestInWindow + windowMs - now
    store.set(key, entry)
    return { ok: false, remaining: 0, resetMs }
  }

  // Record this request
  entry.timestamps.push(now)
  store.set(key, entry)

  // Periodic cleanup to prevent unbounded memory growth
  if (Math.random() < 0.01) {
    Array.from(store.entries()).forEach(([k, v]) => {
      if (v.timestamps.every((t: number) => t <= windowStart)) {
        store.delete(k)
      }
    })
  }

  return { ok: true, remaining: limit - entry.timestamps.length, resetMs: 0 }
}

/**
 * Extract best-available client IP from Next.js request headers.
 * Prefers x-forwarded-for (set by Vercel), falls back to x-real-ip.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
