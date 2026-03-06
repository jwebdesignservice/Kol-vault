import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { getSolanaConnection, USDC_MINT, USDC_DECIMALS } from './constants'
import { decryptPrivateKey } from '@/lib/crypto/escrow'

/**
 * Reconstructs a Solana Keypair from the encrypted private key stored in the DB.
 * The private key was stored as base64-encoded secretKey (Uint8Array).
 */
export function keypairFromEncrypted(encryptedPrivateKey: string): Keypair {
  const privateKeyB64 = decryptPrivateKey(encryptedPrivateKey)
  const secretKey = Buffer.from(privateKeyB64, 'base64')
  return Keypair.fromSecretKey(secretKey)
}

/**
 * Get the USDC balance (in USDC, not lamports) of a wallet address.
 * Returns 0 if the associated token account doesn't exist yet.
 */
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const connection = getSolanaConnection()
  const walletPubkey = new PublicKey(walletAddress)
  const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)

  try {
    const balance = await connection.getTokenAccountBalance(ata)
    return Number(balance.value.uiAmount ?? 0)
  } catch {
    // Token account doesn't exist — balance is 0
    return 0
  }
}

export interface TransferResult {
  txSignature: string
  fromAddress: string
  toAddress: string
  amountUsdc: number
}

/**
 * Transfer USDC from an escrow wallet to a recipient wallet.
 *
 * @param encryptedPrivateKey - from escrow_wallets.encrypted_private_key
 * @param fromPublicKey - escrow wallet public key string
 * @param toWalletAddress - recipient wallet public key string
 * @param amountUsdc - amount in USDC (e.g. 100.5)
 */
export async function transferUsdcFromEscrow(
  encryptedPrivateKey: string,
  fromPublicKey: string,
  toWalletAddress: string,
  amountUsdc: number
): Promise<TransferResult> {
  const connection = getSolanaConnection()
  const escrowKeypair = keypairFromEncrypted(encryptedPrivateKey)
  const toPubkey = new PublicKey(toWalletAddress)

  // Amount in token units (USDC has 6 decimals)
  const amountRaw = Math.round(amountUsdc * Math.pow(10, USDC_DECIMALS))

  // Get or create the escrow's associated token account for USDC
  const fromAta = await getOrCreateAssociatedTokenAccount(
    connection,
    escrowKeypair, // payer for account creation
    USDC_MINT,
    escrowKeypair.publicKey
  )

  // Get or create the recipient's associated token account for USDC
  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    escrowKeypair, // payer for account creation
    USDC_MINT,
    toPubkey
  )

  const tx = new Transaction().add(
    createTransferInstruction(
      fromAta.address,
      toAta.address,
      escrowKeypair.publicKey,
      amountRaw
    )
  )

  const txSignature = await sendAndConfirmTransaction(connection, tx, [escrowKeypair])

  return {
    txSignature,
    fromAddress: fromPublicKey,
    toAddress: toWalletAddress,
    amountUsdc,
  }
}
