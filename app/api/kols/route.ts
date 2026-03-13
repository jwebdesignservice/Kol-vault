export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const niche = searchParams.get("niche");
    const sort = searchParams.get("sort") ?? "score";
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    const supabase = createAdminClient();

    let query = supabase
      .from("kol_profiles")
      .select(
        "id, display_name, bio, niche, twitter_handle, telegram_handle, audience_size_estimate, score, tier, subscription_status, created_at",
        { count: "exact" }
      )
      .not("display_name", "is", null)
      .range(offset, offset + limit - 1);

    // Sort options
    if (sort === "score") {
      query = query.order("score", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "audience") {
      query = query.order("audience_size_estimate", { ascending: false });
    } else {
      query = query.order("score", { ascending: false });
    }

    if (tier) query = query.eq("tier", tier);
    if (niche) query = query.contains("niche", [niche]);

    const { data, error, count } = await query;
    if (error) return apiError("Failed to fetch KOLs", 500);

    return apiSuccess({ kols: data, total: count ?? 0, limit, offset });
  } catch (err) {
    console.error("[kols GET]", err);
    return apiError("Internal server error", 500);
  }
}
