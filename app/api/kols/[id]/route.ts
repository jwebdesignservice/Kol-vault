export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { KOLProfileSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/kols/profile
 * Returns the authenticated KOL's own profile.
 * Requires: auth + role=kol
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, "kol");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("kol_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return apiError("Failed to fetch profile", 500);
    }

    return apiSuccess({ profile: data ?? null });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[kols/profile GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/kols/profile
 * Upserts the authenticated KOL's profile.
 * Requires: auth + role=kol
 * Body: { display_name, bio?, niche?, twitter_handle?, telegram_handle?, youtube_handle?, tiktok_handle?, audience_size_estimate?, solana_wallet_address? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "kol");

    const body = await req.json();
    const parsed = KOLProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("kol_profiles")
      .upsert(
        { user_id: user.id, ...parsed.data },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      return apiError("Failed to save profile", 500);
    }

    return apiSuccess({ profile: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[kols/profile POST]", res);
    return apiError("Internal server error", 500);
  }
}

