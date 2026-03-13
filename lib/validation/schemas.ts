import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["project", "kol"], {
    errorMap: () => ({ message: "Role must be 'project' or 'kol'" }),
  }),
  name: z.string().min(1, "Name is required").max(100),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ProjectProfileSchema = z.object({
  token_name: z.string().min(1).max(100),
  token_symbol: z.string().min(1).max(20),
  contract_address: z.string().min(1).max(200),
  chain: z.string().max(50).optional().default("solana"),
  logo_url: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website_url: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000).optional(),
});

export const KOLProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100),
  bio: z.string().max(1000).optional(),
  niche: z.array(z.string().max(50)).max(10).optional(),
  twitter_handle: z
    .string()
    .max(50)
    .optional()
    .transform((v) => v?.replace(/^@/, "")),
  telegram_handle: z
    .string()
    .max(50)
    .optional()
    .transform((v) => v?.replace(/^@/, "")),
  youtube_handle: z.string().max(100).optional(),
  tiktok_handle: z
    .string()
    .max(50)
    .optional()
    .transform((v) => v?.replace(/^@/, "")),
  audience_size_estimate: z.number().int().min(0).optional(),
  solana_wallet_address: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana wallet address")
    .optional()
    .or(z.literal("")),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProjectProfileInput = z.infer<typeof ProjectProfileSchema>;
export type KOLProfileInput = z.infer<typeof KOLProfileSchema>;

// ============================================================
// Phase 2 — Deals & Applications
// ============================================================

export const CreateDealSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  requirements: z.string().max(2000).optional(),
  budget_usdc: z.number().positive(),
  kpi_target: z.object({
    metric: z.enum(["views", "clicks", "followers", "transactions", "custom"]),
    target: z.number().positive(),
    window_days: z.number().int().min(1).max(365),
    custom_label: z.string().optional(),
  }),
  deadline: z.string().datetime().optional(),
  max_applications: z.number().int().min(1).max(100).default(10),
});

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  // All statuses accepted here — state machine in the route handler enforces valid transitions
  status: z.enum(["draft", "open", "in_progress", "pending_review", "completed", "cancelled", "disputed"]).optional(),
});

export const CreateApplicationSchema = z.object({
  pitch: z.string().min(50).max(3000),
  proposed_rate_usdc: z.number().positive().optional(),
});

export const ReviewApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export const SubmitUrlSchema = z.object({
  url: z.string().url(),
  platform: z.enum([
    "twitter",
    "youtube",
    "tiktok",
    "instagram",
    "telegram",
    "discord",
    "other",
  ]),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
export type SubmitUrlInput = z.infer<typeof SubmitUrlSchema>;

// ============================================================
// Phase 3 — Results, Scoring, Disputes & Admin
// ============================================================

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

export type CreateSnapshotInput = z.infer<typeof CreateSnapshotSchema>;
export type CreateResultInput = z.infer<typeof CreateResultSchema>;
export type CreateDisputeInput = z.infer<typeof CreateDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;

// ============================================================
// Phase 5 — On-Chain Escrow Release / Refund
// ============================================================

export const ReleaseSchema = z.object({
  amount_usdc: z.number().positive().optional(),
})

export const RefundSchema = z.object({
  to_wallet: z.string(),
  amount_usdc: z.number().positive().optional(),
})

export type ReleaseInput = z.infer<typeof ReleaseSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
