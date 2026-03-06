-- ============================================================
-- KOLVault — Phase 3: Results, Scoring, Disputes & Admin
-- ============================================================

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

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER set_updated_at_campaign_results
  BEFORE UPDATE ON public.campaign_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_disputes
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_on_chain_snapshots_deal_id ON public.on_chain_snapshots(deal_id);
CREATE INDEX idx_campaign_results_kol_id ON public.campaign_results(kol_id);
CREATE INDEX idx_kol_score_history_kol_id ON public.kol_score_history(kol_id);
CREATE INDEX idx_disputes_deal_id ON public.disputes(deal_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_platform_fees_deal_id ON public.platform_fees(deal_id);

-- ============================================================
-- RLS Policies
-- ============================================================

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
