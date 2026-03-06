export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/admin/deals
 * List all deals with project profile data. Admin only.
 * Query params: ?status=&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("deals")
      .select(
        `
        *,
        project:project_profiles (
          id,
          user_id,
          token_name,
          token_symbol,
          chain,
          logo_url,
          website_url
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/deals GET]", error);
      return apiError("Failed to fetch deals", 500);
    }

    return apiSuccess({
      deals: data,
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/deals GET]", res);
    return apiError("Internal server error", 500);
  }
}

