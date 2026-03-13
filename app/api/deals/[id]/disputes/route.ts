export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateDisputeSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendDisputeOpenedEmails } from "@/lib/email/service";
import { validateEvidenceUrls } from "@/lib/security/ssrf";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    if (user.role !== "admin") {
      let hasAccess = false;
      if (user.role === "project") {
        const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = profile?.id === deal.project_id;
      } else if (user.role === "kol") {
        const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = kolProfile?.id === deal.accepted_kol_id;
      }
      if (!hasAccess) return apiError("Forbidden", 403);
    }

    const { data, error } = await supabase.from("disputes").select("*").eq("deal_id", params.id).order("created_at", { ascending: false });
    if (error) return apiError("Failed to fetch disputes", 500);
    return apiSuccess({ disputes: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    if (!["in_progress", "pending_review", "completed"].includes(deal.status)) {
      return apiError("Disputes can only be raised on active deals", 400);
    }

    let raisedByRole: "project" | "kol";
    let raisedById: string;

    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
      raisedByRole = "project";
      raisedById = user.id;
    } else if (user.role === "kol") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      if (!kolProfile || deal.accepted_kol_id !== kolProfile.id) return apiError("Forbidden", 403);
      raisedByRole = "kol";
      raisedById = user.id;
    } else {
      return apiError("Forbidden", 403);
    }

    const { data: existing } = await supabase.from("disputes").select("id").eq("deal_id", params.id).eq("status", "open").single();
    if (existing) return apiError("A dispute is already open for this deal", 400);

    const body = await req.json();
    const parsed = CreateDisputeSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    // SSRF protection — validate all evidence URLs are safe public HTTPS endpoints
    if (parsed.data.evidence_urls?.length) {
      const ssrf = validateEvidenceUrls(parsed.data.evidence_urls);
      if (!ssrf.safe) return apiError(`Invalid evidence URL: ${ssrf.reason}`, 400);
    }

    const { data: dispute, error: insertError } = await supabase
      .from("disputes").insert({ deal_id: params.id, raised_by: raisedById, raised_by_role: raisedByRole, ...parsed.data, status: "open" }).select().single();
    if (insertError) return apiError("Failed to raise dispute", 500);

    await supabase.from("deals").update({ status: "disputed", updated_at: new Date().toISOString() }).eq("id", params.id);
    sendDisputeOpenedEmails(dispute.id).catch(console.error);
    return apiSuccess({ dispute }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes POST]", res);
    return apiError("Internal server error", 500);
  }
}
