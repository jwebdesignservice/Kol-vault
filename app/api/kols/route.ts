export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/kols
 * Returns the public KOL directory. Only includes active-subscription KOLs.
 * Query params: ?tier=&niche=&limit=20&offset=0
 * Public — no auth required.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const niche = searchParams.get("niche");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    const supabase = createServerClient();

    let query = supabase
      .from("kol_profiles")
      .select(
        "id, display_name, bio, niche, twitter_handle, telegram_handle, youtube_handle, tiktok_handle, audience_size_estimate, score, tier, created_at",
        { count: "exact" }
      )
      .eq("subscription_status", "active")
      .order("score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tier) {
      query = query.eq("tier", tier);
    }

    if (niche) {
      query = query.contains("niche", [niche]);
    }

    const { data, error, count } = await query;

    if (error) {
      return apiError("Failed to fetch KOLs", 500);
    }

    return apiSuccess({
      kols: data,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[kols GET]", err);
    return apiError("Internal server error", 500);
  }
}

