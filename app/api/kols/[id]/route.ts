export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("kol_profiles")
      .select("id, display_name, bio, niche, twitter_handle, telegram_handle, youtube_handle, tiktok_handle, audience_size_estimate, score, tier, subscription_status, created_at")
      .eq("id", params.id).single();
    if (error || !data) return apiError("KOL not found", 404);
    return apiSuccess({ profile: data });
  } catch (err) {
    console.error("[kols/[id] GET]", err);
    return apiError("Internal server error", 500);
  }
}
