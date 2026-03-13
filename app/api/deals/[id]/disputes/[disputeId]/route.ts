export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResolveDisputeSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendDisputeResolvedEmails } from "@/lib/email/service";

export async function GET(req: NextRequest, { params }: { params: { id: string; disputeId: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: dispute, error } = await supabase.from("disputes").select("*").eq("id", params.disputeId).eq("deal_id", params.id).single();
    if (error || !dispute) return apiError("Dispute not found", 404);

    if (user.role !== "admin") {
      const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.id).single();
      let hasAccess = false;
      if (user.role === "project") {
        const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = profile?.id === deal?.project_id;
      } else if (user.role === "kol") {
        const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = kolProfile?.id === deal?.accepted_kol_id;
      }
      if (!hasAccess) return apiError("Forbidden", 403);
    }
    return apiSuccess({ dispute });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes/[disputeId] GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; disputeId: string } }) {
  try {
    const user = await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: dispute, error: fetchError } = await supabase.from("disputes").select("*").eq("id", params.disputeId).eq("deal_id", params.id).single();
    if (fetchError || !dispute) return apiError("Dispute not found", 404);
    if (dispute.status !== "open") return apiError("Dispute is already resolved", 400);

    const body = await req.json();
    const parsed = ResolveDisputeSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: resolved, error: updateError } = await supabase
      .from("disputes").update({
        verdict: parsed.data.verdict,
        resolution_notes: parsed.data.resolution_notes,
        status: "resolved",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", params.disputeId).select().single();
    if (updateError) return apiError("Failed to resolve dispute", 500);

    await supabase.from("deals").update({ status: "pending_review", updated_at: new Date().toISOString() }).eq("id", params.id);
    sendDisputeResolvedEmails(params.disputeId).catch(console.error);
    return apiSuccess({ dispute: resolved });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes/[disputeId] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}
