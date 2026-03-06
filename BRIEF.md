# KOLVault — Project Brief

KOLVault is a two-sided Web3 marketing marketplace on Solana.
It connects crypto projects with KOLs (influencers), handles payments via on-chain escrow,
and builds verifiable reputation scores for KOLs based on real campaign outcomes.

## Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database/Auth:** Supabase (Postgres + Supabase Auth)
- **Payments:** Stripe ($75/mo KOL subscriptions)
- **On-chain:** Helius (Solana data), Solana Web3.js (escrow wallets)
- **Email:** Resend
- **Hosting:** Vercel

## User Types
- `project` — Crypto project admins who post campaigns
- `kol` — Influencers who apply for campaigns
- `admin` — Internal platform admin

## Key Tables (Supabase)
- `users` — Auth records (email, role: project/kol/admin)
- `project_profiles` — Token name, contract address, chain, logo
- `kol_profiles` — Social handles, niche, score, tier, subscription status, Solana wallet
- `deals` — Campaign details, KPI targets, budget, status
- `applications` — KOL applications per deal
- `escrow_wallets` — Unique wallet per deal
- `campaign_events` — URL submissions, timestamps
- `on_chain_snapshots` — Baseline and post-campaign metrics
- `campaign_results` — Final KPI outcomes
- `kol_score_history` — Score progression
- `disputes` — Dispute records
- `subscriptions` — Stripe billing records
- `platform_fees` — Fee ledger

## Revenue
- 4% protocol fee on escrow releases
- $75/mo KOL subscription (Stripe)

## Phase 1 — Foundation
Auth, project profiles, KOL profiles, Stripe subscription
