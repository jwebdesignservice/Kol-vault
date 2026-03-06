import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/kols/[id]
 * Returns a single KOL profile by id.
 * Public — no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("kol_profiles")
      .select(
        "id, display_name, bio, niche, twitter_handle, telegram_handle, youtube_handle, tiktok_handle, audience_size_estimate, score, tier, subscription_status, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return apiError("KOL not found", 404);
    }

    return apiSuccess({ kol: data });
  } catch (err) {
    console.error("[kols/[id]]", err);
    return apiError("Internal server error", 500);
  }
}
