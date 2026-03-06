/**
 * Helius API client for fetching Solana on-chain data.
 * Uses HELIUS_API_KEY env var.
 *
 * Docs: https://docs.helius.dev
 */

const HELIUS_BASE = 'https://api.helius.xyz/v0'

function getApiKey(): string {
  const key = process.env.HELIUS_API_KEY
  if (!key) throw new Error('HELIUS_API_KEY is not set')
  return key
}

export interface TokenMetrics {
  holders?: number
  price_usd?: number
  volume_24h?: number
  market_cap?: number
}

/**
 * Fetch token holder count for a Solana SPL token.
 * Uses Helius /token-metadata endpoint.
 */
export async function fetchTokenHolders(mintAddress: string): Promise<number | null> {
  const apiKey = getApiKey()
  const res = await fetch(`${HELIUS_BASE}/token-metadata?api-key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mintAccounts: [mintAddress], includeOffChain: false }),
  })
  if (!res.ok) {
    console.error('[helius] fetchTokenHolders failed', res.status, await res.text())
    return null
  }
  const data = await res.json() as Array<{ onChainMetadata?: { tokenInfo?: { supply?: string } } }>
  // Return first result's supply as proxy (real holder count needs DAS API)
  return data[0]?.onChainMetadata?.tokenInfo?.supply
    ? parseInt(data[0].onChainMetadata.tokenInfo.supply, 10)
    : null
}

/**
 * Fetch basic token metrics via Helius DAS getAsset.
 * Falls back gracefully on error.
 */
export async function fetchTokenMetrics(mintAddress: string): Promise<TokenMetrics> {
  try {
    const apiKey = getApiKey()
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'kolvault',
        method: 'getAsset',
        params: { id: mintAddress },
      }),
    })
    if (!res.ok) return {}
    const json = await res.json() as { result?: { token_info?: { price_info?: { price_per_token?: number }; supply?: number } } }
    const tokenInfo = json.result?.token_info
    return {
      price_usd: tokenInfo?.price_info?.price_per_token ?? undefined,
    }
  } catch {
    return {}
  }
}
