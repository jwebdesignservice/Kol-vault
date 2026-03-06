import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/subscriptions/status
 * Returns the current KOL subscription status and latest subscription record.
 * Requires: auth + role=kol
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, "kol");
    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("kol_profiles")
      .select("id, subscription_status, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return apiError("KOL profile not found", 404);
    }

    // Fetch the latest subscription record
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("kol_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return apiSuccess({
      subscription_status: profile.subscription_status,
      subscription: subscription ?? null,
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[subscriptions/status]", res);
    return apiError("Internal server error", 500);
  }
}
