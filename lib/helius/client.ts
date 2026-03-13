/**
 * KOL Vault — Helius API client
 * Solana on-chain data via Helius Enhanced APIs + RPC
 * Docs: https://docs.helius.dev
 */

const HELIUS_RPC    = `https://mainnet.helius-rpc.com`
const HELIUS_BASE   = `https://api.helius.xyz/v0`

function getApiKey(): string {
  const key = process.env.HELIUS_API_KEY
  if (!key) throw new Error('HELIUS_API_KEY is not set')
  return key
}

function rpcUrl(): string {
  return `${HELIUS_RPC}/?api-key=${getApiKey()}`
}

/** Generic RPC call helper */
async function rpcCall<T>(method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'kolvault', method, params }),
    })
    if (!res.ok) {
      console.error(`[helius] ${method} HTTP ${res.status}`)
      return null
    }
    const json = (await res.json()) as { result?: T; error?: { message: string } }
    if (json.error) {
      console.error(`[helius] ${method} RPC error:`, json.error.message)
      return null
    }
    return json.result ?? null
  } catch (err) {
    console.error(`[helius] ${method} failed:`, err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// Token Data
// ─────────────────────────────────────────────────────────────────

export interface TokenMetrics {
  holders?: number
  price_usd?: number
  volume_24h_usd?: number
  market_cap_usd?: number
  supply?: number
}

/**
 * Fetch token supply (as proxy for on-chain activity).
 * For real holder count, a dedicated indexer is needed (Birdeye, Dune).
 */
export async function fetchTokenSupply(mintAddress: string): Promise<number | null> {
  const result = await rpcCall<{ value: { uiAmount: number } }>('getTokenSupply', [mintAddress])
  return result?.value?.uiAmount ?? null
}

/**
 * Fetch token price via Helius DAS getAsset.
 * Returns price in USD if available.
 */
export async function fetchTokenPrice(mintAddress: string): Promise<number | null> {
  try {
    const result = await rpcCall<{
      token_info?: { price_info?: { price_per_token?: number } }
    }>('getAsset', [{ id: mintAddress }])
    return result?.token_info?.price_info?.price_per_token ?? null
  } catch {
    return null
  }
}

/**
 * Fetch all available token metrics for a deal snapshot.
 * Gracefully returns whatever is available.
 */
export async function fetchTokenMetrics(mintAddress: string): Promise<TokenMetrics> {
  const [priceResult, supplyResult] = await Promise.allSettled([
    fetchTokenPrice(mintAddress),
    fetchTokenSupply(mintAddress),
  ])

  return {
    price_usd: priceResult.status === 'fulfilled' ? (priceResult.value ?? undefined) : undefined,
    supply:    supplyResult.status === 'fulfilled' ? (supplyResult.value ?? undefined) : undefined,
  }
}

// ─────────────────────────────────────────────────────────────────
// Wallet / USDC
// ─────────────────────────────────────────────────────────────────

/** USDC mint on Solana mainnet */
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

/**
 * Fetch all SPL token balances for a wallet.
 */
export async function fetchWalletTokenBalances(
  walletAddress: string
): Promise<Array<{ mint: string; amount: number }>> {
  try {
    const result = await rpcCall<{
      value: Array<{
        account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number } } } } }
      }>
    }>('getTokenAccountsByOwner', [
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' },
    ])

    return (result?.value ?? []).map((acc) => ({
      mint: acc.account.data.parsed.info.mint,
      amount: acc.account.data.parsed.info.tokenAmount.uiAmount,
    }))
  } catch {
    return []
  }
}

/**
 * Get USDC balance for a wallet address.
 */
export async function fetchWalletUsdcBalance(walletAddress: string): Promise<number> {
  const balances = await fetchWalletTokenBalances(walletAddress)
  return balances.find((b) => b.mint === USDC_MINT)?.amount ?? 0
}

// ─────────────────────────────────────────────────────────────────
// Transaction History
// ─────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  signature: string
  timestamp: number
  type: string
  fee: number
}

/**
 * Fetch recent parsed transactions for a wallet via Helius Enhanced API.
 */
export async function fetchWalletTransactions(
  walletAddress: string,
  limit = 10
): Promise<ParsedTransaction[]> {
  try {
    const apiKey = getApiKey()
    const res = await fetch(
      `${HELIUS_BASE}/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=${limit}`,
      { method: 'GET' }
    )
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      signature?: string
      timestamp?: number
      type?: string
      fee?: number
    }>
    return data.map((tx) => ({
      signature: tx.signature ?? '',
      timestamp: tx.timestamp ?? 0,
      type: tx.type ?? 'UNKNOWN',
      fee: tx.fee ?? 0,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────
// Deal Snapshot Helper
// ─────────────────────────────────────────────────────────────────

export interface OnChainSnapshot {
  wallet_address: string
  usdc_balance: number
  token_metrics?: TokenMetrics
  captured_at: string
}

/**
 * Capture a complete on-chain snapshot for a deal.
 * Fetches escrow USDC balance + optional token metrics.
 */
export async function captureOnChainSnapshot(
  escrowWalletAddress: string,
  contractAddress?: string
): Promise<OnChainSnapshot> {
  const [usdcBalance, tokenMetrics] = await Promise.allSettled([
    fetchWalletUsdcBalance(escrowWalletAddress),
    contractAddress ? fetchTokenMetrics(contractAddress) : Promise.resolve(undefined),
  ])

  return {
    wallet_address: escrowWalletAddress,
    usdc_balance: usdcBalance.status === 'fulfilled' ? usdcBalance.value : 0,
    token_metrics: tokenMetrics.status === 'fulfilled' ? (tokenMetrics.value ?? undefined) : undefined,
    captured_at: new Date().toISOString(),
  }
}
