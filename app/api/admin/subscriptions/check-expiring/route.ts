import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendSubscriptionExpiringEmail } from "@/lib/email/service";

/**
 * POST /api/admin/subscriptions/check-expiring
 * Admin only or internal cron trigger.
 * Finds all active KOL subscriptions expiring within 7 days and sends warning emails.
 * Returns the count of emails sent.
 *
 * Vercel cron example (vercel.json):
 *   { "path": "/api/admin/subscriptions/check-expiring", "schedule": "0 9 * * *" }
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, "admin");

    const supabase = createAdminClient();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: expiring, error } = await supabase
      .from("subscriptions")
      .select("kol_profile_id, current_period_end")
      .eq("status", "active")
      .gte("current_period_end", now.toISOString())
      .lte("current_period_end", sevenDaysFromNow.toISOString());

    if (error) {
      console.error("[admin/subscriptions/check-expiring]", error);
      return apiError("Failed to query subscriptions", 500);
    }

    if (!expiring || expiring.length === 0) {
      return apiSuccess({ sent: 0 });
    }

    const sends = expiring.map((sub) =>
      sendSubscriptionExpiringEmail(sub.kol_profile_id, sub.current_period_end as string).catch(
        console.error
      )
    );

    await Promise.all(sends);

    return apiSuccess({ sent: expiring.length });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/subscriptions/check-expiring]", res);
    return apiError("Internal server error", 500);
  }
}
