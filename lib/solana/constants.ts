import { PublicKey, clusterApiUrl, Connection } from '@solana/web3.js'

// USDC mint address on Solana mainnet
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
// USDC has 6 decimals
export const USDC_DECIMALS = 6

export function getSolanaConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? clusterApiUrl('mainnet-beta')
  return new Connection(rpcUrl, 'confirmed')
}
