import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateDisputeSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendDisputeOpenedEmails } from "@/lib/email/service";

type RouteContext = { params: { id: string } };

/**
 * GET /api/deals/[id]/disputes
 * List disputes for a deal. Project, accepted KOL, or admin.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id, accepted_kol_id")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    let isParty = false;

    if (user.role === "admin") {
      isParty = true;
    } else if (user.role === "project") {
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      isParty = projectProfile?.id === deal.project_id;
    } else if (user.role === "kol") {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      isParty = kolProfile?.id === deal.accepted_kol_id;
    }

    if (!isParty) return apiError("Forbidden", 403);

    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[deals/[id]/disputes GET]", error);
      return apiError("Failed to fetch disputes", 500);
    }

    return apiSuccess({ disputes: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/disputes
 * Open a dispute. Project owner or accepted KOL only.
 * Body: CreateDisputeSchema
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    if (user.role !== "project" && user.role !== "kol") {
      return apiError("Forbidden", 403);
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id, accepted_kol_id, status")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    if (!["in_progress", "pending_review", "completed"].includes(deal.status)) {
      return apiError(
        "Disputes can only be opened for deals that are in_progress, pending_review, or completed",
        400
      );
    }

    // Verify user is a party to the deal
    let raisedByRole: "kol" | "project";
    if (user.role === "project") {
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!projectProfile || projectProfile.id !== deal.project_id) {
        return apiError("Forbidden", 403);
      }
      raisedByRole = "project";
    } else {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!kolProfile || kolProfile.id !== deal.accepted_kol_id) {
        return apiError("Only the accepted KOL can open a dispute", 403);
      }
      raisedByRole = "kol";
    }

    // Enforce one open dispute per deal
    const { count: openCount } = await supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", dealId)
      .eq("status", "open");

    if ((openCount ?? 0) > 0) {
      return apiError("There is already an open dispute for this deal", 409);
    }

    const body = await req.json();
    const parsed = CreateDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { data: dispute, error } = await supabase
      .from("disputes")
      .insert({
        deal_id: dealId,
        raised_by: user.id,
        raised_by_role: raisedByRole,
        reason: parsed.data.reason,
        evidence_urls: parsed.data.evidence_urls,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("[deals/[id]/disputes POST]", error);
      return apiError("Failed to open dispute", 500);
    }

    // Set deal status to disputed
    await supabase
      .from("deals")
      .update({ status: "disputed" })
      .eq("id", dealId);

    sendDisputeOpenedEmails(dispute.id).catch(console.error)

    return apiSuccess({ dispute }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes POST]", res);
    return apiError("Internal server error", 500);
  }
}
