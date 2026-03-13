export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendSubscriptionExpiringEmail } from "@/lib/email/service";

/**
 * GET /api/admin/subscriptions/check-expiring
 * Called daily by Vercel Cron OR manually by admin.
 *
 * Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
 * Manual: pass the same header with the CRON_SECRET value.
 *
 * Schedule (vercel.json): "0 9 * * *" (9AM UTC daily)
 */
export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", 401);
  }

  try {
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
      console.error("[check-expiring] query error", error);
      return apiError("Failed to query subscriptions", 500);
    }

    if (!expiring || expiring.length === 0) {
      return apiSuccess({ sent: 0, message: "No subscriptions expiring in the next 7 days" });
    }

    const sends = expiring.map((sub) =>
      sendSubscriptionExpiringEmail(
        sub.kol_profile_id,
        sub.current_period_end as string
      ).catch(console.error)
    );

    await Promise.all(sends);

    console.log(`[check-expiring] Sent ${expiring.length} expiry warning emails`);
    return apiSuccess({ sent: expiring.length });
  } catch (err) {
    console.error("[check-expiring]", err);
    return apiError("Internal server error", 500);
  }
}
