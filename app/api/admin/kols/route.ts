import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/admin/kols
 * List all KOL profiles with scores. Admin only.
 * Query params: ?tier=&page=1&limit=20&subscribed=true
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const tierFilter = searchParams.get("tier");
    const subscribedFilter = searchParams.get("subscribed");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("kol_profiles")
      .select("*", { count: "exact" })
      .order("score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tierFilter) query = query.eq("tier", tierFilter);
    if (subscribedFilter === "true") query = query.eq("subscription_status", "active");

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/kols GET]", error);
      return apiError("Failed to fetch KOLs", 500);
    }

    return apiSuccess({
      kols: data,
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/kols GET]", res);
    return apiError("Internal server error", 500);
  }
}
