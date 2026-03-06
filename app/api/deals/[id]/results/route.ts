import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateResultSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  calculateScoreDelta,
  clampScore,
  assignTier,
  calculateFee,
} from "@/lib/scoring/kol-score";
import { sendCampaignResultEmails } from "@/lib/email/service";

type RouteContext = { params: { id: string } };

/**
 * GET /api/deals/[id]/results
 * Get campaign results for a deal. Project, KOL on deal, or admin.
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
      .from("campaign_results")
      .select("*")
      .eq("deal_id", dealId)
      .maybeSingle();

    if (error) {
      console.error("[deals/[id]/results GET]", error);
      return apiError("Failed to fetch results", 500);
    }

    return apiSuccess({ result: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/results GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/results
 * Submit campaign results. Admin only.
 * Body: CreateResultSchema
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id, status, accepted_kol_id, budget_usdc, platform_fee_bps")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (!["in_progress", "pending_review"].includes(deal.status)) {
      return apiError("Results can only be submitted for deals that are in_progress or pending_review", 400);
    }
    if (!deal.accepted_kol_id) {
      return apiError("Deal has no accepted KOL", 400);
    }

    const body = await req.json();
    const parsed = CreateResultSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { verdict, kpi_achieved, notes } = parsed.data;

    // Insert campaign result
    const { data: result, error: resultError } = await supabase
      .from("campaign_results")
      .insert({
        deal_id: dealId,
        kol_id: deal.accepted_kol_id,
        verdict,
        kpi_achieved,
        notes: notes ?? null,
        reviewed_by: user.id,
      })
      .select()
      .single();

    if (resultError) {
      if (resultError.code === "23505") {
        return apiError("Results have already been submitted for this deal", 409);
      }
      console.error("[deals/[id]/results POST] insert result", resultError);
      return apiError("Failed to submit results", 500);
    }

    // Get KOL's current score
    const { data: kolProfile } = await supabase
      .from("kol_profiles")
      .select("id, score")
      .eq("id", deal.accepted_kol_id)
      .single();

    if (!kolProfile) {
      console.error("[deals/[id]/results POST] kol profile not found");
      return apiSuccess({ result }, 201);
    }

    const scoreBefore = Number(kolProfile.score) || 50;
    const delta = calculateScoreDelta(verdict);
    const scoreAfter = clampScore(scoreBefore + delta);
    const newTier = assignTier(scoreAfter);

    // Update KOL score + tier
    await supabase
      .from("kol_profiles")
      .update({ score: scoreAfter, tier: newTier })
      .eq("id", deal.accepted_kol_id);

    // Insert score history
    const reasonMap = {
      success: `Campaign success: ${kpi_achieved.pct}% KPI achieved`,
      partial: `Campaign partial: ${kpi_achieved.pct}% KPI achieved`,
      failure: `Campaign failure: ${kpi_achieved.pct}% KPI achieved`,
    };
    await supabase.from("kol_score_history").insert({
      kol_id: deal.accepted_kol_id,
      deal_id: dealId,
      score_before: scoreBefore,
      score_after: scoreAfter,
      delta,
      reason: reasonMap[verdict],
    });

    // Calculate and insert platform fee
    const feeUsdc = calculateFee(Number(deal.budget_usdc), deal.platform_fee_bps ?? 400);
    await supabase.from("platform_fees").insert({
      deal_id: dealId,
      fee_usdc: feeUsdc,
      fee_bps: deal.platform_fee_bps ?? 400,
      collected_at: new Date().toISOString(),
    });

    // Mark deal as completed
    await supabase
      .from("deals")
      .update({ status: "completed" })
      .eq("id", dealId);

    sendCampaignResultEmails(dealId, scoreAfter, newTier).catch(console.error)

    return apiSuccess({ result, score_after: scoreAfter, tier: newTier }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/results POST]", res);
    return apiError("Internal server error", 500);
  }
}
