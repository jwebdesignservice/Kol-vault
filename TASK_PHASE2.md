# TASK_PHASE2.md — KOLVault Backend Phase 2: Deals & Applications

## Context

Phase 1 is complete. The following already exist:
- `supabase/migrations/001_initial_schema.sql` — users, project_profiles, kol_profiles, subscriptions
- `lib/types/index.ts`, `lib/supabase/*`, `lib/auth/helpers.ts`, `lib/validation/schemas.ts`, `lib/api/response.ts`
- API routes: auth (register/login/logout/me), projects/profile, kols/profile+directory, subscriptions (checkout/status/portal), stripe webhook
- `middleware.ts` — session validation + route protection

## Goal

Build Phase 2: the **Deals & Applications** system — the core marketplace loop.

**DO NOT:**
- Build any UI, pages, or frontend components
- Modify Phase 1 files unless a bug fix is strictly required
- Install new npm packages (all needed deps are already installed)

---

## Step 1 — Database Migration

Create `supabase/migrations/002_deals_applications.sql`

### New Tables

```sql
-- Deal status enum
CREATE TYPE deal_status AS ENUM ('draft', 'open', 'in_progress', 'pending_review', 'completed', 'cancelled', 'disputed');

-- Application status enum  
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget_usdc NUMERIC(18, 6) NOT NULL CHECK (budget_usdc > 0),
  kpi_target JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"metric": "views", "target": 50000, "window_days": 30}
  deadline TIMESTAMPTZ,
  max_applications INTEGER DEFAULT 10,
  status deal_status NOT NULL DEFAULT 'draft',
  accepted_kol_id UUID REFERENCES kol_profiles(id) ON DELETE SET NULL,
  platform_fee_bps INTEGER NOT NULL DEFAULT 400, -- 4% in basis points
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES kol_profiles(id) ON DELETE CASCADE,
  pitch TEXT NOT NULL,
  proposed_rate_usdc NUMERIC(18, 6),
  status application_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deal_id, kol_id)
);

-- Escrow wallets table (one per deal)
CREATE TABLE escrow_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL, -- encrypted at app level before storing
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  balance_usdc NUMERIC(18, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign events table
CREATE TABLE campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES kol_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'url_submission', 'milestone', 'note'
  payload JSONB NOT NULL DEFAULT '{}',
  -- url_submission: {"url": "https://...", "platform": "twitter"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_deals_project_id ON deals(project_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_accepted_kol_id ON deals(accepted_kol_id);
CREATE INDEX idx_applications_deal_id ON applications(deal_id);
CREATE INDEX idx_applications_kol_id ON applications(kol_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_campaign_events_deal_id ON campaign_events(deal_id);
```

### Triggers

```sql
-- updated_at triggers for deals and applications
CREATE TRIGGER set_updated_at_deals
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

-- Deals: projects can manage their own; KOLs can read open deals; admin can read all
CREATE POLICY "projects_manage_own_deals" ON deals
  USING (project_id IN (SELECT id FROM project_profiles WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM project_profiles WHERE user_id = auth.uid()));

CREATE POLICY "kols_read_open_deals" ON deals
  FOR SELECT USING (status = 'open');

CREATE POLICY "admin_all_deals" ON deals
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Applications: KOLs manage own; project sees apps for their deals; admin all
CREATE POLICY "kols_manage_own_applications" ON applications
  USING (kol_id IN (SELECT id FROM kol_profiles WHERE user_id = auth.uid()))
  WITH CHECK (kol_id IN (SELECT id FROM kol_profiles WHERE user_id = auth.uid()));

CREATE POLICY "projects_read_deal_applications" ON applications
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_applications" ON applications
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Escrow wallets: only admin + deal project owner can read; no public write
CREATE POLICY "deal_owner_read_escrow" ON escrow_wallets
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_escrow" ON escrow_wallets
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Campaign events: kol + project of the deal can read; kol can insert
CREATE POLICY "deal_parties_read_events" ON campaign_events
  FOR SELECT USING (
    kol_id IN (SELECT id FROM kol_profiles WHERE user_id = auth.uid())
    OR
    deal_id IN (
      SELECT d.id FROM deals d
      JOIN project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "kol_insert_events" ON campaign_events
  FOR INSERT WITH CHECK (kol_id IN (SELECT id FROM kol_profiles WHERE user_id = auth.uid()));
```

---

## Step 2 — Update TypeScript Types

Append to `lib/types/index.ts`:

```typescript
export type DealStatus = 'draft' | 'open' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled' | 'disputed'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface KPITarget {
  metric: 'views' | 'clicks' | 'followers' | 'transactions' | 'custom'
  target: number
  window_days: number
  custom_label?: string
}

export interface Deal {
  id: string
  project_id: string
  title: string
  description: string
  requirements?: string
  budget_usdc: number
  kpi_target: KPITarget
  deadline?: string
  max_applications: number
  status: DealStatus
  accepted_kol_id?: string
  platform_fee_bps: number
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  deal_id: string
  kol_id: string
  pitch: string
  proposed_rate_usdc?: number
  status: ApplicationStatus
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface EscrowWallet {
  id: string
  deal_id: string
  public_key: string
  funded_at?: string
  released_at?: string
  balance_usdc: number
  created_at: string
}

export interface CampaignEvent {
  id: string
  deal_id: string
  kol_id: string
  event_type: 'url_submission' | 'milestone' | 'note'
  payload: Record<string, unknown>
  created_at: string
}
```

---

## Step 3 — Update Zod Schemas

Append to `lib/validation/schemas.ts`:

```typescript
export const CreateDealSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  requirements: z.string().max(2000).optional(),
  budget_usdc: z.number().positive(),
  kpi_target: z.object({
    metric: z.enum(['views', 'clicks', 'followers', 'transactions', 'custom']),
    target: z.number().positive(),
    window_days: z.number().int().min(1).max(365),
    custom_label: z.string().optional(),
  }),
  deadline: z.string().datetime().optional(),
  max_applications: z.number().int().min(1).max(100).default(10),
})

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  status: z.enum(['draft', 'open', 'cancelled']).optional(),
})

export const CreateApplicationSchema = z.object({
  pitch: z.string().min(50).max(3000),
  proposed_rate_usdc: z.number().positive().optional(),
})

export const ReviewApplicationSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})

export const SubmitUrlSchema = z.object({
  url: z.string().url(),
  platform: z.enum(['twitter', 'youtube', 'tiktok', 'instagram', 'telegram', 'discord', 'other']),
})
```

---

## Step 4 — API Routes

### 4.1 `app/api/deals/route.ts`

**GET** — List open deals (public/KOL) with optional filters
- Query params: `?status=open&page=1&limit=20&min_budget=100&max_budget=10000`
- If authenticated KOL: show open + applied deals
- If authenticated project: show their own deals (all statuses)
- If unauthenticated: show open deals only

**POST** — Create a deal (project only)
- Validate with `CreateDealSchema`
- `project_id` resolved from user's `project_profiles`
- Status defaults to `'draft'`
- Return created deal

### 4.2 `app/api/deals/[id]/route.ts`

**GET** — Get deal by ID
- Public can see open deals
- Project owner sees all statuses
- KOL sees deal if they have an application

**PATCH** — Update deal (project owner only)
- Validate with `UpdateDealSchema`
- Only allow status transitions: `draft→open`, `open→cancelled`
- Cannot update if status is `in_progress` or later

**DELETE** — Cancel deal (project owner only)
- Only if status is `draft` or `open`
- Set status to `cancelled`

### 4.3 `app/api/deals/[id]/applications/route.ts`

**GET** — List applications for a deal (project owner only)
- Join with `kol_profiles` to include KOL data
- Filter by `?status=pending`

**POST** — Apply to a deal (KOL only, subscribed only)
- Validate with `CreateApplicationSchema`
- Check deal is `open`
- Check KOL hasn't already applied (unique constraint)
- Check deal hasn't hit `max_applications`
- Check KOL subscription is active (check `subscriptions` table)

### 4.4 `app/api/deals/[id]/applications/[appId]/route.ts`

**GET** — Get single application
- KOL can see their own; project owner can see applications to their deals

**PATCH** — Review application (project owner only)
- Validate with `ReviewApplicationSchema`
- If `accepted`: set deal status to `in_progress`, set `accepted_kol_id`, reject all other pending applications
- If `rejected`: just update status

### 4.5 `app/api/deals/[id]/events/route.ts`

**GET** — Get campaign events for a deal (project or KOL on the deal)

**POST** — Submit a campaign event (accepted KOL only)
- For `url_submission`: validate with `SubmitUrlSchema`
- Auto-set `event_type` based on payload

### 4.6 `app/api/escrow/[dealId]/route.ts`

**GET** — Get escrow wallet public info for a deal
- Return `public_key` and `balance_usdc` only (never private key)
- Only accessible to project owner and accepted KOL

**POST** — Create escrow wallet for a deal (project owner only)
- Use `@solana/web3.js` to generate a new `Keypair`
- Encrypt private key with `ESCROW_ENCRYPTION_KEY` env var using AES-256-GCM before storing
- Use Node.js `crypto` module for encryption (already available)
- Store `public_key` + `encrypted_private_key` in `escrow_wallets`
- Return only `public_key`

**Encryption helper** — Create `lib/crypto/escrow.ts`:
```typescript
// AES-256-GCM encryption/decryption for escrow private keys
// Uses ESCROW_ENCRYPTION_KEY from env (must be 32-byte hex string)
export function encryptPrivateKey(privateKeyBase58: string): string
export function decryptPrivateKey(encrypted: string): string
```

---

## Step 5 — Update .env.local.example

Add:
```
ESCROW_ENCRYPTION_KEY=your-32-byte-hex-key-here
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6 — Update README.md

Add Phase 2 section documenting:
- New tables (deals, applications, escrow_wallets, campaign_events)
- New API routes with method/path/auth table
- Escrow wallet generation notes
- How to run migration 002

---

## Completion Checklist

- [ ] `supabase/migrations/002_deals_applications.sql` written
- [ ] `lib/types/index.ts` updated with Phase 2 types
- [ ] `lib/validation/schemas.ts` updated with Phase 2 schemas
- [ ] `lib/crypto/escrow.ts` created
- [ ] `app/api/deals/route.ts` (GET + POST)
- [ ] `app/api/deals/[id]/route.ts` (GET + PATCH + DELETE)
- [ ] `app/api/deals/[id]/applications/route.ts` (GET + POST)
- [ ] `app/api/deals/[id]/applications/[appId]/route.ts` (GET + PATCH)
- [ ] `app/api/deals/[id]/events/route.ts` (GET + POST)
- [ ] `app/api/escrow/[dealId]/route.ts` (GET + POST)
- [ ] `.env.local.example` updated
- [ ] `README.md` updated
- [ ] `tsc --noEmit` passes with zero errors

When all items are checked, output: "Phase 2 complete."
