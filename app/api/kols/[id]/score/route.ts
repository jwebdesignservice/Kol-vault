import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteContext = { params: { id: string } };

/**
 * GET /api/kols/[id]/score
 * Get KOL score and tier.
 * Public: returns current score and tier only.
 * KOL (own) or admin: also returns full score history.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: kolId } = params;
    const supabase = createAdminClient();

    const { data: kolProfile, error } = await supabase
      .from("kol_profiles")
      .select("id, user_id, score, tier")
      .eq("id", kolId)
      .single();

    if (error || !kolProfile) return apiError("KOL not found", 404);

    const user = await getUser(req);

    const isOwner =
      user?.role === "kol" && user.id === kolProfile.user_id;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      // Public: score + tier only
      return apiSuccess({ score: kolProfile.score, tier: kolProfile.tier });
    }

    // KOL owner or admin: include full history
    const { data: history, error: historyError } = await supabase
      .from("kol_score_history")
      .select("*")
      .eq("kol_id", kolId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("[kols/[id]/score GET] history error", historyError);
      return apiError("Failed to fetch score history", 500);
    }

    return apiSuccess({
      score: kolProfile.score,
      tier: kolProfile.tier,
      history,
    });
  } catch (err) {
    console.error("[kols/[id]/score GET]", err);
    return apiError("Internal server error", 500);
  }
}
