-- ============================================================
-- KOLVault — Initial Schema
-- ============================================================

-- Enable UUID extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE user_role AS ENUM ('project', 'kol', 'admin');

CREATE TYPE kol_tier AS ENUM (
  'unverified',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'elite'
);

CREATE TYPE subscription_status AS ENUM (
  'inactive',
  'active',
  'past_due',
  'cancelled'
);

-- ============================================================
-- Tables
-- ============================================================

-- users: mirrors Supabase auth.users with role
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'kol',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- project_profiles: one per project user
CREATE TABLE public.project_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  token_name        TEXT,
  token_symbol      TEXT,
  contract_address  TEXT,
  chain             TEXT NOT NULL DEFAULT 'solana',
  logo_url          TEXT,
  website_url       TEXT,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kol_profiles: one per KOL user
CREATE TABLE public.kol_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  bio                     TEXT,
  niche                   TEXT[],
  twitter_handle          TEXT,
  telegram_handle         TEXT,
  youtube_handle          TEXT,
  tiktok_handle           TEXT,
  audience_size_estimate  INTEGER,
  solana_wallet_address   TEXT,
  score                   DECIMAL(10, 4) NOT NULL DEFAULT 0,
  tier                    kol_tier NOT NULL DEFAULT 'unverified',
  subscription_status     subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- subscriptions: Stripe billing records linked to kol_profiles
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kol_profile_id          UUID NOT NULL REFERENCES public.kol_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT NOT NULL UNIQUE,
  stripe_customer_id      TEXT NOT NULL,
  status                  subscription_status NOT NULL DEFAULT 'inactive',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_profiles_updated_at
  BEFORE UPDATE ON public.project_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_kol_profiles_updated_at
  BEFORE UPDATE ON public.kol_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kol_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- project_profiles: own row only
CREATE POLICY "project_profiles_select_own" ON public.project_profiles
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "project_profiles_insert_own" ON public.project_profiles
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "project_profiles_update_own" ON public.project_profiles
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE id = auth.uid())
  );

-- Public read for project by id (for KOLs to see who posted a campaign)
CREATE POLICY "project_profiles_public_select" ON public.project_profiles
  FOR SELECT USING (true);

-- kol_profiles: public read (for leaderboard/directory)
CREATE POLICY "kol_profiles_public_select" ON public.kol_profiles
  FOR SELECT USING (true);

CREATE POLICY "kol_profiles_insert_own" ON public.kol_profiles
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "kol_profiles_update_own" ON public.kol_profiles
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE id = auth.uid())
  );

-- subscriptions: own row only
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (
    kol_profile_id IN (
      SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (
    kol_profile_id IN (
      SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (
    kol_profile_id IN (
      SELECT id FROM public.kol_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_kol_profiles_score ON public.kol_profiles(score DESC);
CREATE INDEX idx_kol_profiles_tier ON public.kol_profiles(tier);
CREATE INDEX idx_kol_profiles_subscription_status ON public.kol_profiles(subscription_status);
CREATE INDEX idx_kol_profiles_stripe_customer_id ON public.kol_profiles(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
