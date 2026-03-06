import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/admin/fees
 * Platform fees ledger. Admin only.
 * Query params: ?page=1&limit=50
 * Returns fees joined with deal title and project name, plus total_fees_usdc aggregate.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("platform_fees")
      .select(
        `
        *,
        deal:deals (
          id,
          title,
          budget_usdc,
          project:project_profiles (
            id,
            token_name,
            token_symbol
          )
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[admin/fees GET]", error);
      return apiError("Failed to fetch fees", 500);
    }

    // Compute total fees across all records (not just current page)
    const { data: aggregateData, error: aggregateError } = await supabase
      .from("platform_fees")
      .select("fee_usdc");

    let totalFeesUsdc = 0;
    if (!aggregateError && aggregateData) {
      totalFeesUsdc = aggregateData.reduce(
        (sum, row) => sum + Number(row.fee_usdc),
        0
      );
    }

    return apiSuccess({
      fees: data,
      total_fees_usdc: totalFeesUsdc,
      pagination: { page, limit, total: count ?? 0 },
    });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/fees GET]", res);
    return apiError("Internal server error", 500);
  }
}
