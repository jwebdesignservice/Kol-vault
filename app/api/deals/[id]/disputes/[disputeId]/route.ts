import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResolveDisputeSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { clampScore, assignTier } from "@/lib/scoring/kol-score";
import { sendDisputeResolvedEmails } from "@/lib/email/service";

type RouteContext = { params: { id: string; disputeId: string } };

/**
 * GET /api/deals/[id]/disputes/[disputeId]
 * Get a single dispute. Deal parties or admin.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId, disputeId } = params;
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

    const { data: dispute, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .eq("deal_id", dealId)
      .single();

    if (error || !dispute) return apiError("Dispute not found", 404);

    return apiSuccess({ dispute });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes/[disputeId] GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/deals/[id]/disputes/[disputeId]
 * Resolve a dispute. Admin only.
 * Body: ResolveDisputeSchema
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId, disputeId } = params;
    const user = await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: dispute } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .eq("deal_id", dealId)
      .single();

    if (!dispute) return apiError("Dispute not found", 404);
    if (dispute.status !== "open") {
      return apiError("Only open disputes can be resolved", 400);
    }

    const body = await req.json();
    const parsed = ResolveDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { verdict, resolution_notes } = parsed.data;
    const now = new Date().toISOString();

    // Resolve the dispute
    const { data: resolvedDispute, error: disputeError } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        verdict,
        resolution_notes,
        resolved_by: user.id,
        resolved_at: now,
      })
      .eq("id", disputeId)
      .select()
      .single();

    if (disputeError) {
      console.error("[disputes/[disputeId] PATCH] update dispute", disputeError);
      return apiError("Failed to resolve dispute", 500);
    }

    // Get the deal to find the KOL
    const { data: deal } = await supabase
      .from("deals")
      .select("id, accepted_kol_id")
      .eq("id", dealId)
      .single();

    // Apply score penalty if ruling against KOL
    if (deal?.accepted_kol_id && (verdict === "favour_project" || verdict === "dismissed")) {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id, score")
        .eq("id", deal.accepted_kol_id)
        .single();

      if (kolProfile) {
        const scoreBefore = Number(kolProfile.score) || 50;
        const scoreAfter = clampScore(scoreBefore - 5);
        const newTier = assignTier(scoreAfter);

        await supabase
          .from("kol_profiles")
          .update({ score: scoreAfter, tier: newTier })
          .eq("id", deal.accepted_kol_id);

        await supabase.from("kol_score_history").insert({
          kol_id: deal.accepted_kol_id,
          deal_id: dealId,
          score_before: scoreBefore,
          score_after: scoreAfter,
          delta: -5,
          reason: "Dispute ruled against KOL",
        });
      }
    }

    // Update deal status
    const newDealStatus = verdict === "favour_project" ? "cancelled" : "completed";
    await supabase
      .from("deals")
      .update({ status: newDealStatus })
      .eq("id", dealId);

    sendDisputeResolvedEmails(disputeId).catch(console.error)

    return apiSuccess({ dispute: resolvedDispute, deal_status: newDealStatus });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/disputes/[disputeId] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}
