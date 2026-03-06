# KOLVault — Backend API

KOLVault is a two-sided Web3 marketing marketplace on Solana. It connects crypto projects with KOLs (Key Opinion Leaders / influencers), handles payments via Stripe, and builds verifiable reputation scores for KOLs based on real campaign outcomes.

This repository contains the **Phase 1 backend only** — all API routes, database schema, auth, and Stripe integration. No frontend UI is included.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database / Auth | Supabase (Postgres + Supabase Auth) |
| Payments | Stripe ($75/mo recurring subscriptions) |
| On-chain | Solana Web3.js |
| Email | Resend |
| Validation | Zod |
| Hosting | Vercel |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- (Optional) [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd kolvault
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in all values in .env.local (see Environment Variables below)

# 3. Run Supabase migration
# Go to Supabase Dashboard > SQL Editor and paste the contents of:
# supabase/migrations/001_initial_schema.sql

# 4. Start development server
npm run dev
```

The API will be available at `http://localhost:3000/api/`.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in each value:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key — safe to expose to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — bypasses RLS, **never expose to browser** |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for future frontend use) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe dashboard or CLI |
| `STRIPE_KOL_PRICE_ID` | Price ID for the $75/mo KOL subscription product (`price_...`) |
| `NEXT_PUBLIC_APP_URL` | Full URL of your app (e.g. `https://kolvault.xyz` or `http://localhost:3000`) |
| `RESEND_API_KEY` | API key from Resend (for transactional emails) |

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run the full contents of `supabase/migrations/001_initial_schema.sql`.
4. In **Authentication > Settings**, configure:
   - Site URL: your `NEXT_PUBLIC_APP_URL`
   - Redirect URLs: `<APP_URL>/api/auth/callback`

---

## Stripe Setup

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Create a **Product**: "KOLVault KOL Subscription"
   - Add a **Price**: $75.00 / month (recurring)
   - Copy the Price ID (`price_...`) → `STRIPE_KOL_PRICE_ID`
3. Copy your **API Keys**:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
4. Set up a **Webhook endpoint**:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

### Local webhook testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret printed by the CLI → STRIPE_WEBHOOK_SECRET
```

---

## API Endpoint Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user (project or kol) |
| POST | `/api/auth/login` | None | Login with email + password |
| POST | `/api/auth/logout` | Session | Sign out |
| GET | `/api/auth/me` | Session | Get current user + profile |

**Register body:**
```json
{ "email": "...", "password": "...", "role": "project|kol", "name": "..." }
```

**Login body:**
```json
{ "email": "...", "password": "..." }
```

---

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects/profile` | project | Get own project profile |
| POST | `/api/projects/profile` | project | Create/update project profile |
| GET | `/api/projects/[id]` | None | Get public project profile by ID |

**Project profile body:**
```json
{
  "token_name": "MyToken",
  "token_symbol": "MTK",
  "contract_address": "...",
  "chain": "solana",
  "logo_url": "https://...",
  "website_url": "https://...",
  "description": "..."
}
```

---

### KOLs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/kols` | None | Public KOL directory (active subs only) |
| GET | `/api/kols/[id]` | None | Get single KOL profile by ID |
| GET | `/api/kols/profile` | kol | Get own KOL profile |
| POST | `/api/kols/profile` | kol | Create/update own KOL profile |

**KOL directory query params:** `?tier=gold&niche=defi&limit=20&offset=0`

**KOL profile body:**
```json
{
  "display_name": "CryptoKing",
  "bio": "...",
  "niche": ["defi", "nft"],
  "twitter_handle": "cryptoking",
  "telegram_handle": "cryptoking",
  "youtube_handle": "...",
  "tiktok_handle": "...",
  "audience_size_estimate": 50000,
  "solana_wallet_address": "..."
}
```

---

### Subscriptions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/subscriptions/checkout` | kol | Create Stripe Checkout session |
| GET | `/api/subscriptions/status` | kol | Get current subscription status |
| POST | `/api/subscriptions/portal` | kol | Create Stripe Customer Portal session |

Both checkout and portal return `{ "data": { "url": "https://checkout.stripe.com/..." } }`.
Redirect the user to this URL.

---

### Webhooks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/stripe` | Stripe signature | Stripe event handler |

---

### Deals (Phase 2)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/deals` | Optional | List deals (open for public/KOL; own deals for project) |
| POST | `/api/deals` | project | Create a new deal |
| GET | `/api/deals/[id]` | Optional | Get deal by ID |
| PATCH | `/api/deals/[id]` | project | Update deal (owner only) |
| DELETE | `/api/deals/[id]` | project | Cancel deal (draft/open only) |

**Deal status transitions:** `draft → open`, `draft → cancelled`, `open → cancelled`
Cannot modify a deal in `in_progress`, `pending_review`, `completed`, `cancelled`, or `disputed` state.

**Create/update deal body:**
```json
{
  "title": "Promote our DeFi launch",
  "description": "...",
  "requirements": "...",
  "budget_usdc": 5000,
  "kpi_target": { "metric": "views", "target": 50000, "window_days": 30 },
  "deadline": "2026-06-01T00:00:00Z",
  "max_applications": 10
}
```

**GET /api/deals query params:** `?status=open&page=1&limit=20&min_budget=100&max_budget=10000`

---

### Applications (Phase 2)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/deals/[id]/applications` | project | List applications for a deal |
| POST | `/api/deals/[id]/applications` | kol (subscribed) | Apply to a deal |
| GET | `/api/deals/[id]/applications/[appId]` | kol (own) or project (owner) | Get single application |
| PATCH | `/api/deals/[id]/applications/[appId]` | project | Accept or reject an application |

**Apply body:**
```json
{ "pitch": "I have 100k Twitter followers in DeFi...", "proposed_rate_usdc": 4500 }
```

**Review body:**
```json
{ "status": "accepted" }
```

When an application is **accepted**:
- Deal status → `in_progress`
- `deal.accepted_kol_id` is set
- All other pending applications are automatically rejected

**GET /api/deals/[id]/applications query params:** `?status=pending`

---

### Campaign Events (Phase 2)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/deals/[id]/events` | project or accepted KOL | List campaign events |
| POST | `/api/deals/[id]/events` | accepted KOL only | Submit a campaign event |

**URL submission body:**
```json
{ "event_type": "url_submission", "url": "https://twitter.com/...", "platform": "twitter" }
```

**Milestone/note body:**
```json
{ "event_type": "milestone", "payload": { "description": "50k views reached" } }
```

Supported platforms: `twitter`, `youtube`, `tiktok`, `instagram`, `telegram`, `discord`, `other`

---

### Escrow Wallets (Phase 2)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/escrow/[dealId]` | project owner or accepted KOL | Get escrow wallet public info |
| POST | `/api/escrow/[dealId]` | project owner | Create escrow wallet for a deal |

The POST endpoint generates a fresh Solana keypair via `@solana/web3.js`, encrypts the private key with AES-256-GCM using `ESCROW_ENCRYPTION_KEY`, and stores the ciphertext in `escrow_wallets`. Only the `public_key` and `balance_usdc` are ever returned via the API.

---

## Phase 2 Database Migration

Run migration `002` after `001`:

```bash
# Go to Supabase Dashboard > SQL Editor and paste the contents of:
# supabase/migrations/002_deals_applications.sql
```

New tables: `deals`, `applications`, `escrow_wallets`, `campaign_events`

---

---

## Phase 3 — Results, Scoring, Disputes & Admin

### New Database Tables (migration `003`)

| Table | Description |
|---|---|
| `on_chain_snapshots` | Baseline and post-campaign on-chain metrics per deal |
| `campaign_results` | Final KPI verdict after a campaign completes |
| `kol_score_history` | Audit log of every KOL score change |
| `disputes` | Disputes raised by KOL or project against a deal outcome |
| `platform_fees` | Ledger of protocol fees collected per deal |

Run `supabase/migrations/003_results_scoring_disputes.sql` after `002`.

---

### Phase 3 API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/deals/[id]/snapshots` | project owner or accepted KOL | Get on-chain snapshots for a deal |
| POST | `/api/deals/[id]/snapshots` | project owner | Record a baseline or post-campaign snapshot |
| GET | `/api/deals/[id]/results` | project, accepted KOL, or admin | Get campaign result for a deal |
| POST | `/api/deals/[id]/results` | admin | Submit campaign results + trigger scoring |
| GET | `/api/deals/[id]/disputes` | project, accepted KOL, or admin | List disputes for a deal |
| POST | `/api/deals/[id]/disputes` | project owner or accepted KOL | Open a new dispute |
| GET | `/api/deals/[id]/disputes/[disputeId]` | deal parties or admin | Get single dispute |
| PATCH | `/api/deals/[id]/disputes/[disputeId]` | admin | Resolve dispute + apply score penalty |
| GET | `/api/kols/[id]/score` | public (partial) / KOL or admin (full) | KOL score, tier, and history |
| GET | `/api/admin/deals` | admin | List all deals with project data |
| PATCH | `/api/admin/deals/[id]` | admin | Force-update any deal status |
| GET | `/api/admin/kols` | admin | List all KOL profiles with scores |
| GET | `/api/admin/fees` | admin | Platform fees ledger with aggregates |

---

### KOL Scoring Rules

Scores range **0–100**. A KOL starts at 50 on their first campaign.

| Event | Delta |
|---|---|
| Campaign success (≥100% KPI) | +10 |
| Campaign partial (50–99% KPI) | +2 |
| Campaign failure (<50% KPI) | -8 |
| Dispute ruled against KOL | -5 |
| Dispute dismissed | 0 |

**Tier thresholds:**

| Tier | Score Range |
|---|---|
| bronze | 0–39 |
| silver | 40–59 |
| gold | 60–79 |
| platinum | 80–100 |

---

### Helius Integration

Phase 3 integrates with [Helius](https://helius.dev) to optionally enrich on-chain snapshots with live Solana token data. Set `HELIUS_API_KEY` in `.env.local` to enable. If the key is absent, snapshot submissions still work using manually provided metrics.

---

---

## Phase 4 — Email Notifications (Resend)

### Setup

1. Create a [Resend](https://resend.com) account and generate an API key.
2. Verify your sending domain in the Resend dashboard (DNS records required).
3. Set the following environment variables:

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from Resend (`re_...`) |
| `EMAIL_FROM` | Sender address shown on all emails (e.g. `KOLVault <noreply@kolvault.io>`) |
| `NEXT_PUBLIC_APP_URL` | Full app URL — used to build links inside emails |

### Triggered Emails

| Trigger | Email Sent | Recipient(s) |
|---|---|---|
| `POST /api/auth/register` | Welcome email | New user |
| `POST /api/deals/[id]/applications` | New application received | Project owner |
| `PATCH /api/deals/[id]/applications/[appId]` (accept/reject) | Application status update | KOL |
| `PATCH /api/deals/[id]/applications/[appId]` (accept only) | Deal is now in progress | Project owner + KOL |
| `POST /api/deals/[id]/results` | Campaign result | Project owner + KOL |
| `POST /api/deals/[id]/disputes` | Dispute opened | Other party + all admins |
| `PATCH /api/deals/[id]/disputes/[disputeId]` | Dispute resolved | Project owner + KOL |
| `POST /api/admin/subscriptions/check-expiring` (cron) | Subscription expiring soon | Affected KOLs |

All email sends are fire-and-forget — a Resend failure logs an error but does not fail the API response.

### Subscription Expiry Cron

The endpoint `POST /api/admin/subscriptions/check-expiring` scans for active subscriptions expiring within 7 days and sends a warning email to each KOL.

**Vercel Cron (add to `vercel.json`):**

```json
{
  "crons": [
    {
      "path": "/api/admin/subscriptions/check-expiring",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This fires daily at 09:00 UTC. The endpoint requires admin auth — set up a service account or use an internal cron secret check if running from an external scheduler.

---

---

## Phase 5 — On-Chain USDC Escrow (Solana)

### Overview

Phase 5 adds on-chain USDC transfer from escrow wallets. When a campaign completes or a dispute resolves, an admin can trigger a release (to the KOL) or a refund (back to the project) directly on Solana.

USDC mint address (mainnet): `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

### Solana RPC Setup

A dedicated RPC is strongly recommended. [Helius](https://helius.dev) is the default option.

| Variable | Description |
|---|---|
| `SOLANA_RPC_URL` | Full RPC URL (e.g. `https://mainnet.helius-rpc.com/?api-key=...`). Defaults to the public mainnet endpoint if unset (rate-limited). |

### Funding an Escrow Wallet

1. Create an escrow wallet via `POST /api/escrow/[dealId]` — this generates a fresh Solana keypair.
2. Send USDC to the returned `public_key` address on mainnet.
3. The GET endpoint now returns `live_balance_usdc` — the real-time on-chain USDC balance queried from the RPC.

### Admin Release / Refund

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/escrow/[dealId]/release` | Release USDC to the accepted KOL (deal must be `completed`) |
| POST | `/api/admin/escrow/[dealId]/refund` | Refund USDC to any Solana wallet (any deal status) |

**Release body** (all optional):
```json
{ "amount_usdc": 950.0 }
```
If `amount_usdc` is omitted, the net payout is auto-calculated as `live_balance - protocol_fee` using `platform_fee_bps` from the deal.

**Refund body**:
```json
{ "to_wallet": "<solana-address>", "amount_usdc": 1000.0 }
```
If `amount_usdc` is omitted, the full live balance is refunded.

Both endpoints:
- Verify the escrow wallet exists and has a non-zero balance
- Execute the SPL token transfer on-chain via `@solana/spl-token`
- Mark `escrow_wallets.released_at` and reset `balance_usdc = 0`
- Return `{ txSignature, amountUsdc, ... }`

### KOL Wallet Address Requirement

Before releasing escrow to a KOL, the KOL must have a `solana_wallet_address` set on their profile. KOLs can set this via `POST /api/kols/profile`:

```json
{ "solana_wallet_address": "<base58-solana-address>" }
```

### Testing on Devnet

To test without real funds, swap the USDC mint to the devnet USDC address and point `SOLANA_RPC_URL` to a devnet endpoint (e.g. `https://api.devnet.solana.com`). Use the [Solana faucet](https://faucet.solana.com) and devnet USDC faucets for test tokens.

---

## Response Format

All endpoints return a consistent JSON envelope:

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": "message", "details": { ... } }
```
