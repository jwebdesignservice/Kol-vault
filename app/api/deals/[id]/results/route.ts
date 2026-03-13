export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { getUser, requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateResultSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { calculateScoreDelta, clampScore, assignTier } from "@/lib/scoring/kol-score";
import { sendCampaignResultEmails } from "@/lib/email/service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req);
    if (!user) return apiError("Unauthorized", 401);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    let hasAccess = user.role === "admin";
    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      hasAccess = profile?.id === deal.project_id;
    } else if (user.role === "kol") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      hasAccess = kolProfile?.id === deal.accepted_kol_id;
    }
    if (!hasAccess) return apiError("Forbidden", 403);

    const { data, error } = await supabase.from("campaign_results").select("*").eq("deal_id", params.id);
    if (error) return apiError("Failed to fetch results", 500);
    return apiSuccess({ results: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/results GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);
    if (!["in_progress", "pending_review", "disputed"].includes(deal.status)) return apiError("Results can only be submitted for active deals", 400);
    if (!deal.accepted_kol_id) return apiError("No KOL assigned to this deal", 400);

    const body = await req.json();
    const parsed = CreateResultSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: result, error: resultError } = await supabase
      .from("campaign_results").insert({ deal_id: params.id, kol_id: deal.accepted_kol_id, ...parsed.data, reviewed_by: user.id }).select().single();
    if (resultError) return apiError("Failed to save results", 500);

    const { data: kolProfile } = await supabase.from("kol_profiles").select("score, tier").eq("id", deal.accepted_kol_id).single();
    if (kolProfile) {
      const scoreBefore = kolProfile.score ?? 50;
      const delta = calculateScoreDelta(parsed.data.verdict);
      const scoreAfter = clampScore(scoreBefore + delta);
      const tier = assignTier(scoreAfter);

      await supabase.from("kol_profiles").update({ score: scoreAfter, tier, updated_at: new Date().toISOString() }).eq("id", deal.accepted_kol_id);
      await supabase.from("kol_score_history").insert({ kol_id: deal.accepted_kol_id, deal_id: params.id, score_before: scoreBefore, score_after: scoreAfter, delta, reason: `Campaign result: ${parsed.data.verdict}` });
      await supabase.from("deals").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", params.id);
      sendCampaignResultEmails(params.id, scoreAfter, tier).catch(console.error);
    }
    return apiSuccess({ result }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/results POST]", res);
    return apiError("Internal server error", 500);
  }
}
