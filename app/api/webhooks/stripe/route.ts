import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Maps a Stripe subscription status to the internal subscription_status enum.
 */
function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "inactive" | "past_due" | "cancelled" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "paused":
      return "cancelled";
    default:
      return "inactive";
  }
}

/**
 * Upserts the subscriptions table and updates kol_profiles.subscription_status.
 */
async function syncSubscription(
  subscription: Stripe.Subscription,
  kolProfileId: string
) {
  const supabase = createAdminClient();
  const mappedStatus = mapStripeStatus(subscription.status);

  await supabase.from("subscriptions").upsert(
    {
      kol_profile_id: kolProfileId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      status: mappedStatus,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  await supabase
    .from("kol_profiles")
    .update({
      subscription_status: mappedStatus,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", kolProfileId);
}

/**
 * POST /api/webhooks/stripe
 * Receives and verifies Stripe webhook events.
 * No session auth — uses Stripe-Signature header verification.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const kolProfileId = session.metadata?.kol_profile_id;

        if (!kolProfileId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await syncSubscription(subscription, kolProfileId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const kolProfileId = subscription.metadata?.kol_profile_id;

        if (!kolProfileId) {
          // Fallback: look up via stripe_customer_id
          const customerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id;

          const { data: profile } = await supabase
            .from("kol_profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await syncSubscription(subscription, profile.id);
          }
          break;
        }

        await syncSubscription(subscription, kolProfileId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("kol_profiles")
          .update({ subscription_status: "cancelled" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        await supabase
          .from("kol_profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq(
              "stripe_subscription_id",
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : invoice.subscription.id
            );
        }

        break;
      }

      default:
        // Unhandled event — acknowledge receipt
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] error handling ${event.type}`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
