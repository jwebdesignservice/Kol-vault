export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateSnapshotSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    if (user.role !== "admin") {
      let hasAccess = false;
      if (user.role === "project") {
        const { data: p } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = p?.id === deal.project_id;
      } else if (user.role === "kol") {
        const { data: k } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = k?.id === deal.accepted_kol_id;
      }
      if (!hasAccess) return apiError("Forbidden", 403);
    }

    const { data, error } = await supabase.from("on_chain_snapshots").select("*").eq("deal_id", params.id).order("captured_at", { ascending: true });
    if (error) return apiError("Failed to fetch snapshots", 500);
    return apiSuccess({ snapshots: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/snapshots GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, status").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
    } else if (user.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const parsed = CreateSnapshotSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: snapshot, error: insertError } = await supabase
      .from("on_chain_snapshots").insert({ deal_id: params.id, ...parsed.data, captured_at: new Date().toISOString() }).select().single();
    if (insertError) return apiError("Failed to save snapshot", 500);
    return apiSuccess({ snapshot }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/snapshots POST]", res);
    return apiError("Internal server error", 500);
  }
}
