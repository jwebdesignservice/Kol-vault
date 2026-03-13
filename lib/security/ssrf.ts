/**
 * KOL Vault — SSRF (Server-Side Request Forgery) protection
 *
 * Validates URLs submitted by users to prevent them from making the server
 * fetch internal resources (AWS metadata, localhost, private IPs, etc.).
 *
 * Usage:
 *   const check = isSafeUrl(url)
 *   if (!check.safe) return apiError(check.reason, 400)
 */

export interface SsrfCheckResult {
  safe: boolean
  reason?: string
}

/** Blocked hostnames (exact match) */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',       // GCP metadata
  '169.254.169.254',                // AWS/Azure/DO instance metadata
  'fd00:ec2::254',                  // AWS IPv6 metadata
])

/** Blocked hostname suffixes */
const BLOCKED_SUFFIXES = [
  '.internal',
  '.local',
  '.localhost',
  '.cluster.local',
]

/** IPv4 private/reserved ranges */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return false
  const [a, b] = parts
  return (
    a === 10 ||                         // 10.0.0.0/8
    a === 127 ||                        // 127.0.0.0/8 (loopback)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||          // 192.168.0.0/16
    (a === 169 && b === 254) ||          // 169.254.0.0/16 (link-local / metadata)
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (shared address space)
    a === 0                             // 0.0.0.0/8
  )
}

/** Check if a string looks like an IPv4 address */
function looksLikeIPv4(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
}

/** Check if a string looks like an IPv6 address (simplified) */
function looksLikeIPv6(hostname: string): boolean {
  return hostname.startsWith('[') || hostname.includes(':')
}

/**
 * Check whether a URL is safe to use as an evidence link.
 * Only allows https:// URLs to public, non-private hosts.
 */
export function isSafeUrl(rawUrl: string): SsrfCheckResult {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { safe: false, reason: `Invalid URL: ${rawUrl}` }
  }

  // Only allow https
  if (parsed.protocol !== 'https:') {
    return { safe: false, reason: 'Only HTTPS URLs are allowed for evidence links' }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Exact blocked hosts
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: `Blocked hostname: ${hostname}` }
  }

  // Blocked suffixes
  for (const suffix of BLOCKED_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { safe: false, reason: `Blocked hostname suffix: ${hostname}` }
    }
  }

  // Private IPv4
  if (looksLikeIPv4(hostname) && isPrivateIPv4(hostname)) {
    return { safe: false, reason: `Private IP addresses are not allowed: ${hostname}` }
  }

  // Block all direct IPv6 (hard to validate safely, and no legitimate evidence URL needs it)
  if (looksLikeIPv6(hostname)) {
    return { safe: false, reason: 'IPv6 addresses are not allowed in evidence URLs' }
  }

  // Block non-standard ports (only 443 or default)
  const port = parsed.port
  if (port && port !== '443') {
    return { safe: false, reason: 'Non-standard ports are not allowed in evidence URLs' }
  }

  return { safe: true }
}

/**
 * Validate an array of evidence URLs.
 * Returns the first violation found, or { safe: true }.
 */
export function validateEvidenceUrls(urls: string[]): SsrfCheckResult {
  for (const url of urls) {
    const check = isSafeUrl(url)
    if (!check.safe) return check
  }
  return { safe: true }
}
