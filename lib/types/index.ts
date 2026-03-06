// ============================================================
// KOLVault — Shared TypeScript Types
// ============================================================

export enum UserRole {
  Project = "project",
  KOL = "kol",
  Admin = "admin",
}

export enum KOLTier {
  Unverified = "unverified",
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
  Platinum = "platinum",
  Elite = "elite",
}

export enum SubscriptionStatus {
  Inactive = "inactive",
  Active = "active",
  PastDue = "past_due",
  Cancelled = "cancelled",
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ProjectProfile {
  id: string;
  user_id: string;
  token_name: string | null;
  token_symbol: string | null;
  contract_address: string | null;
  chain: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KOLProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  niche: string[] | null;
  twitter_handle: string | null;
  telegram_handle: string | null;
  youtube_handle: string | null;
  tiktok_handle: string | null;
  audience_size_estimate: number | null;
  solana_wallet_address: string | null;
  score: number;
  tier: KOLTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  kol_profile_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Phase 2 — Deals & Applications
// ============================================================

export type DealStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "cancelled"
  | "disputed";

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface KPITarget {
  metric: "views" | "clicks" | "followers" | "transactions" | "custom";
  target: number;
  window_days: number;
  custom_label?: string;
}

export interface Deal {
  id: string;
  project_id: string;
  title: string;
  description: string;
  requirements?: string;
  budget_usdc: number;
  kpi_target: KPITarget;
  deadline?: string;
  max_applications: number;
  status: DealStatus;
  accepted_kol_id?: string;
  platform_fee_bps: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  deal_id: string;
  kol_id: string;
  pitch: string;
  proposed_rate_usdc?: number;
  status: ApplicationStatus;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EscrowWallet {
  id: string;
  deal_id: string;
  public_key: string;
  funded_at?: string;
  released_at?: string;
  balance_usdc: number;
  created_at: string;
}

export interface CampaignEvent {
  id: string;
  deal_id: string;
  kol_id: string;
  event_type: "url_submission" | "milestone" | "note";
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Phase 3 — Results, Scoring, Disputes & Admin
// ============================================================

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
