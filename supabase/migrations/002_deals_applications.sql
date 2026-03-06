-- ============================================================
-- KOLVault — Phase 2: Deals & Applications Schema
-- ============================================================

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE deal_status AS ENUM (
  'draft',
  'open',
  'in_progress',
  'pending_review',
  'completed',
  'cancelled',
  'disputed'
);

CREATE TYPE application_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
);

-- ============================================================
-- Tables
-- ============================================================

-- deals: campaign deals posted by projects
CREATE TABLE public.deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.project_profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  requirements        TEXT,
  budget_usdc         NUMERIC(18, 6) NOT NULL CHECK (budget_usdc > 0),
  kpi_target          JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"metric": "views", "target": 50000, "window_days": 30}
  deadline            TIMESTAMPTZ,
  max_applications    INTEGER DEFAULT 10,
  status              deal_status NOT NULL DEFAULT 'draft',
  accepted_kol_id     UUID REFERENCES public.kol_profiles(id) ON DELETE SET NULL,
  platform_fee_bps    INTEGER NOT NULL DEFAULT 400, -- 4% in basis points
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- applications: KOL applications to deals
CREATE TABLE public.applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id               UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  kol_id                UUID NOT NULL REFERENCES public.kol_profiles(id) ON DELETE CASCADE,
  pitch                 TEXT NOT NULL,
  proposed_rate_usdc    NUMERIC(18, 6),
  status                application_status NOT NULL DEFAULT 'pending',
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deal_id, kol_id)
);

-- escrow_wallets: one Solana keypair per deal, private key encrypted at app level
CREATE TABLE public.escrow_wallets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id                 UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  public_key              TEXT NOT NULL UNIQUE,
  encrypted_private_key   TEXT NOT NULL,
  funded_at               TIMESTAMPTZ,
  released_at             TIMESTAMPTZ,
  balance_usdc            NUMERIC(18, 6) DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- campaign_events: URL submissions and milestones logged by the accepted KOL
CREATE TABLE public.campaign_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  kol_id      UUID NOT NULL REFERENCES public.kol_profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL, -- 'url_submission', 'milestone', 'note'
  payload     JSONB NOT NULL DEFAULT '{}',
  -- url_submission: {"url": "https://...", "platform": "twitter"}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Updated_at triggers (reuse existing set_updated_at function)
-- ============================================================

CREATE TRIGGER set_updated_at_deals
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_deals_project_id ON public.deals(project_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_accepted_kol_id ON public.deals(accepted_kol_id);
CREATE INDEX idx_applications_deal_id ON public.applications(deal_id);
CREATE INDEX idx_applications_kol_id ON public.applications(kol_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_campaign_events_deal_id ON public.campaign_events(deal_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- Deals: projects can manage their own; KOLs can read open deals; admin can read all
CREATE POLICY "projects_manage_own_deals" ON public.deals
  USING (project_id IN (SELECT id FROM public.project_profiles WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.project_profiles WHERE user_id = auth.uid()));

CREATE POLICY "kols_read_open_deals" ON public.deals
  FOR SELECT USING (status = 'open');

CREATE POLICY "admin_all_deals" ON public.deals
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Applications: KOLs manage own; project sees apps for their deals; admin all
CREATE POLICY "kols_manage_own_applications" ON public.applications
  USING (kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()))
  WITH CHECK (kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()));

CREATE POLICY "projects_read_deal_applications" ON public.applications
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_applications" ON public.applications
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Escrow wallets: only deal project owner can read; admin can read all; no direct write from API
CREATE POLICY "deal_owner_read_escrow" ON public.escrow_wallets
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_escrow" ON public.escrow_wallets
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Campaign events: kol + project of the deal can read; accepted kol can insert
CREATE POLICY "deal_parties_read_events" ON public.campaign_events
  FOR SELECT USING (
    kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid())
    OR
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.project_profiles pp ON d.project_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "kol_insert_events" ON public.campaign_events
  FOR INSERT WITH CHECK (
    kol_id IN (SELECT id FROM public.kol_profiles WHERE user_id = auth.uid())
  );
