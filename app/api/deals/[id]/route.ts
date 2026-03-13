export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { getUser, requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateDealSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req);
    const supabase = createAdminClient();

    const { data: deal, error } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (error || !deal) return apiError("Deal not found", 404);

    if (deal.status !== "open") {
      if (!user) return apiError("Unauthorized", 401);
      if (user.role === "project") {
        const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
      } else if (user.role === "kol") {
        const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        if (kolProfile) {
          const { data: app } = await supabase.from("applications").select("id").eq("deal_id", params.id).eq("kol_id", kolProfile.id).single();
          if (!app) return apiError("Forbidden", 403);
        }
      } else if (user.role !== "admin") {
        return apiError("Forbidden", 403);
      }
    }
    return apiSuccess({ deal });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal, error: fetchError } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (fetchError || !deal) return apiError("Deal not found", 404);

    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
    } else if (user.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    if (["in_progress", "completed", "disputed"].includes(deal.status) && user.role !== "admin") {
      return apiError("Cannot edit a deal that is already in progress or completed", 400);
    }

    const body = await req.json();
    const parsed = UpdateDealSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: updated, error: updateError } = await supabase
      .from("deals").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", params.id).select().single();
    if (updateError) return apiError("Failed to update deal", 500);
    return apiSuccess({ deal: updated });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal, error: fetchError } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (fetchError || !deal) return apiError("Deal not found", 404);

    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
    } else if (user.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    if (deal.status !== "draft" && user.role !== "admin") return apiError("Only draft deals can be deleted", 400);

    const { error: deleteError } = await supabase.from("deals").delete().eq("id", params.id);
    if (deleteError) return apiError("Failed to delete deal", 500);
    return apiSuccess({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] DELETE]", res);
    return apiError("Internal server error", 500);
  }
}
