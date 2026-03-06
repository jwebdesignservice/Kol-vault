# TASK_PHASE3.md — KOLVault Backend Phase 3: Results, Scoring, Disputes & Admin

## Context

Phases 1 & 2 are complete. The following already exist:
- Auth, project/KOL profiles, Stripe subscriptions (Phase 1)
- Deals, applications, escrow wallets, campaign events (Phase 2)
- `lib/types/index.ts`, `lib/supabase/*`, `lib/auth/helpers.ts`, `lib/validation/schemas.ts`, `lib/api/response.ts`, `lib/crypto/escrow.ts`
- All Phase 1 + Phase 2 API routes

## Goal

Build Phase 3: **Campaign Results, KOL Scoring, Disputes, and Admin APIs**

**DO NOT:**
- Build any UI, pages, or frontend components
- Modify Phase 1 or Phase 2 files unless a bug fix is strictly required
- Install new npm packages (all deps already installed)

---

## Step 1 — Database Migration

Create `supabase/migrations/003_results_scoring_disputes.sql`

### New Tables

```sql
-- on_chain_snapshots: baseline + post-campaign chain data for a deal
CREATE TABLE public.on_chain_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id       UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('baseline', 'post_campaign')),
  token_address TEXT,
  chain         TEXT NOT NULL DEFAULT 'solana',
  metrics       JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"holders": 1200, "volume_24h": 45000, "price_usd": 0.0042, "market_cap": 5040000}
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deal_id, snapshot_type)
);

-- campaign_results: final KPI outcome after campaign completes
CREATE TYPE result_verdict AS ENUM ('success', 'partial', 'failure');

CREATE TABLE public.campaign_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  kol_id          UUID NOT NULL REFERENCES public.kol_profiles(id) ON DELETE CASCADE,
  verdict         result_verdict NOT NULL,
  kpi_achieved    JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"metric": "views", "target": 50000, "actual": 62000, "pct": 124}
  notes           TEXT,
  reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kol_score_history: tracks score changes per campaign
CREATE TABLE public.kol_score_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kol_id          UUID NOT NULL REFERENCES public.kol_profiles(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  score_before    NUMERIC(6, 2) NOT NULL,
  score_after     NUMERIC(6, 2) NOT NULL,
  delta           NUMERIC(6, 2) NOT NULL,
  reason          TEXT NOT NULL,
  -- e.g. "Campaign success: 124% KPI achieved", "Dispute ruled against KOL"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- disputes: raised by KOL or project against a deal outcome
CREATE TYPE dispute_status AS ENUM ('open', 'resolved', 'closed');
CREATE TYPE dispute_verdict AS ENUM ('favour_kol', 'favour_project', 'split', 'dismissed');

CREATE TABLE public.disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  raised_by       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- 'kol' | 'project' (denormalised for convenience)
  raised_by_role  TEXT NOT NULL CHECK (raised_by_role IN ('kol', 'project')),
  reason          TEXT NOT NULL,
  evidence_urls   TEXT[] DEFAULT '{}',
  status          dispute_status NOT NULL DEFAULT 'open',
  verdict         dispute_verdict,
  resolution_notes TEXT,
  resolved_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- platform_fees: ledger of protocol fees collected
CREATE TABLE public.platform_fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fee_usdc        NUMERIC(18, 6) NOT NULL CHECK (fee_usdc >= 0),
  fee_bps         INTEGER NOT NULL DEFAULT 400,
  collected_at    TIMESTAMPTZ,
  tx_signature    TEXT,
  -- Solana transaction signature
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Triggers & Indexes

```sql
CREATE TRIGGER set_updated_at_campaign_results
  BEFORE UPDATE ON public.campaign_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_disputes
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_on_chain_snapshots_deal_id ON public.on_chain_snapshots(deal_id);
CREATE INDEX idx_campaign_results_kol_id ON public.campaign_results(kol_id);
CREATE INDEX idx_kol_score_history_kol_id ON public.kol_score_history(kol_id);
CREATE INDEX idx_disputes_deal_id ON public.disputes(deal_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_platform_fees_deal_id ON public.platform_fees(deal_id);
```

### RLS Policies

```sql
ALTER TABLE public.on_chain_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kol_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- on_chain_snapshots: deal project + accepted KOL + admin can read; project can insert
CREATE POLICY "deal_parties_read_snapshots" ON public.on_chain_snapshots
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
    OR deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.kol_profiles kp ON d.accepted_kol_id = kp.id
      WHERE kp.user_id = auth.uid()
    )
  );
CREATE POLICY "admin_all_snapshots" ON public.on_chain_snapshots
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- campaign_results: deal parties + admin read; admin insert/update
CREATE POLICY "deal_parties_read_results" ON public.campaign_results
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
    OR kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "admin_all_results" ON public.campaign_results
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- kol_score_history: KOL reads own; admin reads all
CREATE POLICY "kol_reads_own_score_history" ON public.kol_score_history
  FOR SELECT USING (kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_score_history" ON public.kol_score_history
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- disputes: deal parties + admin read; deal parties can insert
CREATE POLICY "deal_parties_read_disputes" ON public.disputes
  FOR SELECT USING (
    raised_by = auth.uid()
    OR deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
    OR deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.kol_profiles kp ON d.accepted_kol_id = kp.id
      WHERE kp.user_id = auth.uid()
    )
  );
CREATE POLICY "deal_parties_insert_disputes" ON public.disputes
  FOR INSERT WITH CHECK (raised_by = auth.uid());
CREATE POLICY "admin_all_disputes" ON public.disputes
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- platform_fees: admin only (project can read for their deals)
CREATE POLICY "project_read_own_fees" ON public.platform_fees
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );
CREATE POLICY "admin_all_fees" ON public.platform_fees
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
```

---

## Step 2 — TypeScript Types

Append to `lib/types/index.ts`:

```typescript
export type SnapshotType = 'baseline' | 'post_campaign'
export type ResultVerdict = 'success' | 'partial' | 'failure'
export type DisputeStatus = 'open' | 'resolved' | 'closed'
export type DisputeVerdict = 'favour_kol' | 'favour_project' | 'split' | 'dismissed'

export interface OnChainMetrics {
  holders?: number
  volume_24h?: number
  price_usd?: number
  market_cap?: number
  [key: string]: number | undefined
}

export interface OnChainSnapshot {
  id: string
  deal_id: string
  snapshot_type: SnapshotType
  token_address?: string
  chain: string
  metrics: OnChainMetrics
  captured_at: string
  created_at: string
}

export interface KPIAchieved {
  metric: string
  target: number
  actual: number
  pct: number
}

export interface CampaignResult {
  id: string
  deal_id: string
  kol_id: string
  verdict: ResultVerdict
  kpi_achieved: KPIAchieved
  notes?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface KOLScoreHistory {
  id: string
  kol_id: string
  deal_id?: string
  score_before: number
  score_after: number
  delta: number
  reason: string
  created_at: string
}

export interface Dispute {
  id: string
  deal_id: string
  raised_by: string
  raised_by_role: 'kol' | 'project'
  reason: string
  evidence_urls: string[]
  status: DisputeStatus
  verdict?: DisputeVerdict
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface PlatformFee {
  id: string
  deal_id: string
  fee_usdc: number
  fee_bps: number
  collected_at?: string
  tx_signature?: string
  created_at: string
}
```

---

## Step 3 — Zod Schemas

Append to `lib/validation/schemas.ts`:

```typescript
export const CreateSnapshotSchema = z.object({
  snapshot_type: z.enum(['baseline', 'post_campaign']),
  token_address: z.string().optional(),
  chain: z.string().default('solana'),
  metrics: z.object({
    holders: z.number().optional(),
    volume_24h: z.number().optional(),
    price_usd: z.number().optional(),
    market_cap: z.number().optional(),
  }).passthrough(),
})

export const CreateResultSchema = z.object({
  verdict: z.enum(['success', 'partial', 'failure']),
  kpi_achieved: z.object({
    metric: z.string(),
    target: z.number(),
    actual: z.number(),
    pct: z.number(),
  }),
  notes: z.string().max(2000).optional(),
})

export const CreateDisputeSchema = z.object({
  reason: z.string().min(20).max(3000),
  evidence_urls: z.array(z.string().url()).max(10).default([]),
})

export const ResolveDisputeSchema = z.object({
  verdict: z.enum(['favour_kol', 'favour_project', 'split', 'dismissed']),
  resolution_notes: z.string().min(10).max(3000),
})
```

---

## Step 4 — KOL Scoring Library

Create `lib/scoring/kol-score.ts`:

```typescript
/**
 * KOL Score calculation for KOLVault.
 *
 * Score range: 0–100
 * A KOL starts at 50 on first campaign.
 *
 * Delta per campaign:
 *   - success  (≥100% KPI): +10 (capped at 100)
 *   - partial  (50–99% KPI): +2
 *   - failure  (<50% KPI):   -8
 *   - dispute ruled against: additional -5
 *   - dispute dismissed:     no change
 *
 * Tier assignment based on score:
 *   - bronze:   0–39
 *   - silver:  40–59
 *   - gold:    60–79
 *   - platinum: 80–100
 */

export type KOLTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export function calculateScoreDelta(verdict: 'success' | 'partial' | 'failure'): number {
  switch (verdict) {
    case 'success': return 10
    case 'partial': return 2
    case 'failure': return -8
  }
}

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

export function assignTier(score: number): KOLTier {
  if (score >= 80) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

export function calculateFee(budgetUsdc: number, feeBps: number): number {
  return (budgetUsdc * feeBps) / 10000
}
```

---

## Step 5 — Helius Client

Create `lib/helius/client.ts`:

```typescript
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
```

---

## Step 6 — API Routes

### 6.1 `app/api/deals/[id]/snapshots/route.ts`

**GET** — Get snapshots for a deal (project owner or accepted KOL)

**POST** — Record an on-chain snapshot (project owner only)
- Validate with `CreateSnapshotSchema`
- `snapshot_type=baseline` only allowed when deal is `in_progress`
- `snapshot_type=post_campaign` only allowed when deal is `pending_review` or `in_progress`
- If `HELIUS_API_KEY` is set and `token_address` provided, fetch live metrics via `lib/helius/client.ts` and merge with submitted metrics (submitted wins on conflict)
- Enforce UNIQUE(deal_id, snapshot_type)

### 6.2 `app/api/deals/[id]/results/route.ts`

**GET** — Get campaign results for a deal (project or KOL on the deal, or admin)

**POST** — Submit campaign results (admin only)
- Validate with `CreateResultSchema`
- Deal must be `in_progress` or `pending_review`
- After insert:
  1. Get KOL's current `score` from `kol_profiles`
  2. Calculate delta using `calculateScoreDelta(verdict)` from `lib/scoring/kol-score.ts`
  3. Calculate new score with `clampScore`
  4. Determine new tier with `assignTier`
  5. Update `kol_profiles` `score` and `tier`
  6. Insert into `kol_score_history`
  7. Calculate fee with `calculateFee(deal.budget_usdc, deal.platform_fee_bps)`
  8. Insert into `platform_fees` with `collected_at = NOW()`
  9. Update deal status to `completed`

### 6.3 `app/api/deals/[id]/disputes/route.ts`

**GET** — List disputes for a deal (project or KOL on the deal, or admin)

**POST** — Open a dispute (project or KOL on the deal)
- Validate with `CreateDisputeSchema`
- Deal must be `in_progress`, `pending_review`, or `completed`
- Only one open dispute per deal allowed
- Determine `raised_by_role` from user's role
- KOL must be the accepted KOL; project must own the deal
- Set deal status to `disputed`

### 6.4 `app/api/deals/[id]/disputes/[disputeId]/route.ts`

**GET** — Get single dispute (deal parties or admin)

**PATCH** — Resolve dispute (admin only)
- Validate with `ResolveDisputeSchema`
- Update dispute: `status=resolved`, set `verdict`, `resolution_notes`, `resolved_by`, `resolved_at`
- If verdict is `favour_kol`: no score penalty
- If verdict is `favour_project` or `dismissed`:
  - Apply -5 score delta to KOL
  - Insert into `kol_score_history` with reason "Dispute ruled against KOL"
  - Update `kol_profiles` score + tier
- Update deal status back to `completed` (or `cancelled` if verdict = `favour_project`)

### 6.5 `app/api/kols/[id]/score/route.ts`

**GET** — Get KOL score history
- Public: just returns current `score` and `tier` from `kol_profiles`
- If requester is the KOL or admin: also returns full `kol_score_history` records

### 6.6 Admin Routes

#### `app/api/admin/deals/route.ts`

**GET** — List all deals (admin only)
- Query params: `?status=&page=1&limit=20`
- Include project profile data joined

#### `app/api/admin/deals/[id]/route.ts`

**PATCH** — Admin update any deal's status (admin only)
- Body: `{ status: DealStatus }`
- No transition restrictions for admin

#### `app/api/admin/kols/route.ts`

**GET** — List all KOL profiles with scores (admin only)
- Query params: `?tier=&page=1&limit=20&subscribed=true`

#### `app/api/admin/fees/route.ts`

**GET** — Platform fees ledger (admin only)
- Query params: `?page=1&limit=50`
- Returns fees joined with deal title and project name
- Returns `total_fees_usdc` aggregate in response

---

## Step 7 — Update .env.local.example

Add:
```
HELIUS_API_KEY=your-helius-api-key
# Get from: https://helius.dev
```

---

## Step 8 — Update README.md

Add Phase 3 section with:
- New tables (on_chain_snapshots, campaign_results, kol_score_history, disputes, platform_fees)
- New API routes table
- KOL scoring rules summary
- Helius integration notes

---

## Completion Checklist

- [ ] `supabase/migrations/003_results_scoring_disputes.sql` written
- [ ] `lib/types/index.ts` updated with Phase 3 types
- [ ] `lib/validation/schemas.ts` updated with Phase 3 schemas
- [ ] `lib/scoring/kol-score.ts` created
- [ ] `lib/helius/client.ts` created
- [ ] `app/api/deals/[id]/snapshots/route.ts` (GET + POST)
- [ ] `app/api/deals/[id]/results/route.ts` (GET + POST)
- [ ] `app/api/deals/[id]/disputes/route.ts` (GET + POST)
- [ ] `app/api/deals/[id]/disputes/[disputeId]/route.ts` (GET + PATCH)
- [ ] `app/api/kols/[id]/score/route.ts` (GET)
- [ ] `app/api/admin/deals/route.ts` (GET)
- [ ] `app/api/admin/deals/[id]/route.ts` (PATCH)
- [ ] `app/api/admin/kols/route.ts` (GET)
- [ ] `app/api/admin/fees/route.ts` (GET)
- [ ] `.env.local.example` updated
- [ ] `README.md` updated
- [ ] `tsc --noEmit` passes with zero errors

When all items are checked, output: "Phase 3 complete." then run:
openclaw system event --text "Phase 3 complete: Results, Scoring, Disputes and Admin APIs built" --mode now
