import { NextRequest } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * POST /api/subscriptions/checkout
 * Creates a Stripe Checkout session for the $75/mo KOL subscription.
 * Idempotently creates or reuses the Stripe customer for this KOL.
 * Requires: auth + role=kol
 * Returns: { url } — redirect the user to this URL.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "kol");
    const supabase = createServerClient();

    // Fetch KOL profile
    const { data: profile, error: profileError } = await supabase
      .from("kol_profiles")
      .select("id, stripe_customer_id, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return apiError("KOL profile not found", 404);
    }

    if (profile.subscription_status === "active") {
      return apiError("Subscription already active", 400);
    }

    // Create or reuse Stripe customer
    let customerId: string = profile.stripe_customer_id ?? "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { kol_profile_id: profile.id, user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("kol_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", profile.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_KOL_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
      metadata: { kol_profile_id: profile.id, user_id: user.id },
    });

    return apiSuccess({ url: session.url });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[subscriptions/checkout]", res);
    return apiError("Internal server error", 500);
  }
}
