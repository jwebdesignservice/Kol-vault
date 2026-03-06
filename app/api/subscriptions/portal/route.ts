import { NextRequest } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * POST /api/subscriptions/portal
 * Creates a Stripe Customer Portal session for managing billing.
 * Requires: auth + role=kol + existing stripe_customer_id
 * Returns: { url } — redirect the user to this URL.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "kol");
    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("kol_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return apiError("KOL profile not found", 404);
    }

    if (!profile.stripe_customer_id) {
      return apiError("No billing account found. Subscribe first.", 400);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return apiSuccess({ url: portalSession.url });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[subscriptions/portal]", res);
    return apiError("Internal server error", 500);
  }
}
