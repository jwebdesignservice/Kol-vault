export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateDealSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/helpers";

const DEAL_SELECT = `
  *,
  project:project_profiles (
    id,
    token_name,
    token_symbol,
    logo_url
  )
`

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
      const { data: projectProfile } = await supabase
        .from("project_profiles").select("id").eq("user_id", user.id).single();
      if (!projectProfile) return apiSuccess({ deals: [], total: 0, page, limit });

      let query = supabase
        .from("deals")
        .select(DEAL_SELECT, { count: "exact" })
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
      const { data: kolProfile } = await supabase
        .from("kol_profiles").select("id").eq("user_id", user.id).single();

      let appliedDealIds: string[] = [];
      if (kolProfile) {
        const { data: apps } = await supabase
          .from("applications").select("deal_id").eq("kol_id", kolProfile.id);
        appliedDealIds = (apps ?? []).map((a: { deal_id: string }) => a.deal_id);
      }

      let query = supabase
        .from("deals")
        .select(DEAL_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (statusFilter && statusFilter !== "open") {
        if (appliedDealIds.length === 0) return apiSuccess({ deals: [], total: 0, page, limit });
        query = query.in("id", appliedDealIds).eq("status", statusFilter);
      } else {
        if (appliedDealIds.length > 0) {
          query = query.or(`status.eq.open,id.in.(${appliedDealIds.join(",")})`);
        } else {
          query = query.eq("status", "open");
        }
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
      .select(DEAL_SELECT, { count: "exact" })
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

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "project");
    const body = await req.json();
    const parsed = CreateDealSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const supabase = createAdminClient();
    const { data: projectProfile, error: profileError } = await supabase
      .from("project_profiles").select("id").eq("user_id", user.id).single();
    if (profileError || !projectProfile) return apiError("Project profile not found. Create a project profile first.", 400);

    const { data: deal, error } = await supabase
      .from("deals")
      .insert({ project_id: projectProfile.id, ...parsed.data, status: "draft" })
      .select().single();

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
