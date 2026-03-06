# TASK_PHASE5.md — KOLVault Backend Phase 5: On-Chain Escrow Operations (Solana/USDC)

## Context

Phases 1–4 are complete. The following already exist:
- Escrow wallets generated and stored (Phase 2): `lib/crypto/escrow.ts`, `app/api/escrow/[dealId]/route.ts`
- Campaign results + verdict (Phase 3)
- All auth, scoring, dispute resolution logic

## Goal

Build Phase 5: **On-Chain USDC Escrow Release/Refund via Solana**

When a campaign completes or dispute resolves, admin can trigger on-chain USDC transfer from the escrow wallet to the KOL (success/partial) or back to the project (failure/dispute).

---

## Step 0 — Install Required Package

Run: `npm install @solana/spl-token`

`@solana/spl-token` is required for SPL token (USDC) transfers. `@solana/web3.js` is already installed.

---

## Step 1 — Solana/USDC Constants

Create `lib/solana/constants.ts`:

```typescript
import { PublicKey, clusterApiUrl, Connection } from '@solana/web3.js'

// USDC mint address on Solana mainnet
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
// USDC has 6 decimals
export const USDC_DECIMALS = 6

export function getSolanaConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? clusterApiUrl('mainnet-beta')
  return new Connection(rpcUrl, 'confirmed')
}
```

---

## Step 2 — Escrow Operations Library

Create `lib/solana/escrow-ops.ts`:

```typescript
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
```

---

## Step 3 — Update Escrow Balance Endpoint

Update `app/api/escrow/[dealId]/route.ts` GET handler to also fetch the **live on-chain USDC balance** via `getUsdcBalance` and return it alongside the DB record.

- Import `getUsdcBalance` from `@/lib/solana/escrow-ops`
- After fetching the wallet from DB, call `getUsdcBalance(wallet.public_key)`
- Add `live_balance_usdc` to the response
- Wrap in try/catch — if RPC fails, fall back to `wallet.balance_usdc` from DB

---

## Step 4 — Admin Escrow Release/Refund Routes

### 4.1 `app/api/admin/escrow/[dealId]/release/route.ts`

**POST** — Release USDC from escrow to the accepted KOL. Admin only.

Logic:
1. `requireAuth(req, 'admin')`
2. Fetch deal: must be `completed` status
3. Fetch `accepted_kol_id`, then `kol_profiles` to get `solana_wallet_address`
4. If KOL has no `solana_wallet_address`: return 400 "KOL has no Solana wallet address on file"
5. Fetch `escrow_wallets` for this deal (get `encrypted_private_key`, `public_key`)
6. If no escrow wallet: return 404
7. Get live USDC balance via `getUsdcBalance(wallet.public_key)`
8. Calculate net payout: `balance - protocol_fee` where `protocol_fee = (balance * deal.platform_fee_bps) / 10000`
9. If balance <= 0 or net payout <= 0: return 400 "Escrow wallet has no balance to release"
10. Call `transferUsdcFromEscrow(encryptedKey, publicKey, kolWalletAddress, netPayout)`
11. Update `escrow_wallets` set `released_at = NOW()`, `balance_usdc = 0`
12. Update `platform_fees` set `tx_signature = txSignature`, `collected_at = NOW()` for this deal
13. Return `{ txSignature, amountUsdc: netPayout, feeUsdc: balance - netPayout, kolWallet: kolWalletAddress }`

Body params (optional override):
```typescript
const ReleaseSchema = z.object({
  amount_usdc: z.number().positive().optional(), // override auto-calculated amount
})
```
Add `ReleaseSchema` to `lib/validation/schemas.ts`.

### 4.2 `app/api/admin/escrow/[dealId]/refund/route.ts`

**POST** — Refund USDC from escrow back to the project's wallet. Admin only.

Body params:
```typescript
const RefundSchema = z.object({
  to_wallet: z.string(), // project's Solana wallet address to refund to
  amount_usdc: z.number().positive().optional(), // optional override; defaults to full balance
})
```
Add `RefundSchema` to `lib/validation/schemas.ts`.

Logic:
1. `requireAuth(req, 'admin')`
2. Fetch deal (any status — refund may happen on cancelled/disputed)
3. Validate body with `RefundSchema`
4. Fetch escrow wallet
5. Get live balance via `getUsdcBalance`
6. Amount = `body.amount_usdc ?? liveBalance`
7. If amount <= 0: return 400
8. Call `transferUsdcFromEscrow(encryptedKey, publicKey, body.to_wallet, amount)`
9. Update `escrow_wallets` set `released_at = NOW()`, `balance_usdc = 0`
10. Return `{ txSignature, amountUsdc: amount, toWallet: body.to_wallet }`

---

## Step 5 — KOL Wallet Address

For Phase 5 to work end-to-end, KOLs need to have a Solana wallet address on their profile. The `kol_profiles` table already has a `solana_wallet_address` column (check Phase 1 migration — if not present, note it in README as a prerequisite).

Update `app/api/kols/profile/route.ts` POST/PATCH handler to accept and save `solana_wallet_address` if provided:
- Add `solana_wallet_address: z.string().optional()` to the KOL profile schema in `lib/validation/schemas.ts` (check if already present, add if not)

---

## Step 6 — Update .env.local.example

Add:
```
# Solana RPC
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
# Or use a dedicated RPC: https://rpc.helius.xyz, QuickNode, etc.
# Default falls back to public mainnet endpoint (rate-limited)
```

---

## Step 7 — Update README.md

Add Phase 5 section:
- On-chain escrow flow (fund → release → refund)
- USDC mint address
- How to fund the escrow wallet (send USDC to the generated `public_key`)
- Admin release/refund flow
- KOL must have `solana_wallet_address` set before release
- Solana RPC setup (Helius recommended)
- Note: test on devnet first (swap USDC_MINT for devnet USDC)

---

## Completion Checklist

- [ ] `npm install @solana/spl-token` completed
- [ ] `lib/solana/constants.ts` created
- [ ] `lib/solana/escrow-ops.ts` created
- [ ] `app/api/escrow/[dealId]/route.ts` GET updated with live balance
- [ ] `lib/validation/schemas.ts` updated with `ReleaseSchema`, `RefundSchema`, and `solana_wallet_address` on KOL profile schema
- [ ] `app/api/admin/escrow/[dealId]/release/route.ts` created (POST)
- [ ] `app/api/admin/escrow/[dealId]/refund/route.ts` created (POST)
- [ ] `app/api/kols/profile/route.ts` accepts `solana_wallet_address`
- [ ] `.env.local.example` updated
- [ ] `README.md` updated with Phase 5
- [ ] `tsc --noEmit` passes with zero errors

When all items are checked, output: "Phase 5 complete." then run:
openclaw system event --text "Phase 5 complete: On-chain Solana USDC escrow release and refund built" --mode now
