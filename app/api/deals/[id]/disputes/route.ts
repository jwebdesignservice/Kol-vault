export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateDealSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/helpers";

/**
 * GET /api/deals
 * List deals based on caller identity:
 *   - Unauthenticated: open deals only
 *   - Project:         their own deals (all statuses)
 *   - KOL:             open deals + deals they have applied to
 *
 * Query params: ?status=open&page=1&limit=20&min_budget=100&max_budget=10000
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get("status");
    const minBudget = searchParams.get("min_budget");
    const maxBudget = searchParams.get("max_budget");

    const user = await getUser(req);
    const supabase = createAdminClient();

    if (user?.role === "project") {
      // Project: see their own deals (all statuses)
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!projectProfile) {
        return apiSuccess({ deals: [], total: 0, page, limit });
      }

      let query = supabase
        .from("deals")
        .select("*", { count: "exact" })
        .eq("project_id", projectProfile.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (statusFilter) query = query.eq("status", statusFilter);
      if (minBudget) query = query.gte("budget_usdc", parseFloat(minBudget));
      if (maxBudget) query = query.lte("budget_usdc", parseFloat(maxBudget));

      const { data, error, count } = await query;
      if (error) return apiError("Failed to fetch deals", 500);

      return apiSuccess({ deals: data, total: count ?? 0, page, limit });
    }

    if (user?.role === "kol") {
      // KOL: open deals + deals they have applied to
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let appliedDealIds: string[] = [];
      if (kolProfile) {
        const { data: apps } = await supabase
          .from("applications")
          .select("deal_id")
          .eq("kol_id", kolProfile.id);
        appliedDealIds = (apps ?? []).map((a: { deal_id: string }) => a.deal_id);
      }

      let query = supabase
        .from("deals")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (appliedDealIds.length > 0) {
        // Show open deals OR applied deals
        query = query.or(`status.eq.open,id.in.(${appliedDealIds.join(",")})`);
      } else {
        query = query.eq("status", "open");
      }

      if (statusFilter && statusFilter !== "open") {
        // If explicit status filter provided, honour it but only within the visible set
        query = query.eq("status", statusFilter);
      }
      if (minBudget) query = query.gte("budget_usdc", parseFloat(minBudget));
      if (maxBudget) query = query.lte("budget_usdc", parseFloat(maxBudget));

      const { data, error, count } = await query;
      if (error) return apiError("Failed to fetch deals", 500);

      return apiSuccess({ deals: data, total: count ?? 0, page, limit });
    }

    // Unauthenticated: open deals only
    let query = supabase
      .from("deals")
      .select("*", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (minBudget) query = query.gte("budget_usdc", parseFloat(minBudget));
    if (maxBudget) query = query.lte("budget_usdc", parseFloat(maxBudget));

    const { data, error, count } = await query;
    if (error) return apiError("Failed to fetch deals", 500);

    return apiSuccess({ deals: data, total: count ?? 0, page, limit });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals
 * Create a new deal. Requires role=project.
 * Body: CreateDealSchema
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "project");

    const body = await req.json();
    const parsed = CreateDealSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const supabase = createAdminClient();

    const { data: projectProfile, error: profileError } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !projectProfile) {
      return apiError("Project profile not found. Create a project profile first.", 400);
    }

    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        project_id: projectProfile.id,
        ...parsed.data,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[deals POST] insert error", error);
      return apiError("Failed to create deal", 500);
    }

    return apiSuccess({ deal }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals POST]", res);
    return apiError("Internal server error", 500);
  }
}

