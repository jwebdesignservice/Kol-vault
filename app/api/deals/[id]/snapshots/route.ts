import { NextRequest } from "next/server";
import { requireAuth, getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateSnapshotSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { fetchTokenMetrics } from "@/lib/helius/client";

type RouteContext = { params: { id: string } };

/**
 * GET /api/deals/[id]/snapshots
 * Get snapshots for a deal. Project owner or accepted KOL only.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    // Verify deal exists and user is a party to it
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
      .from("on_chain_snapshots")
      .select("*")
      .eq("deal_id", dealId)
      .order("captured_at", { ascending: true });

    if (error) {
      console.error("[deals/[id]/snapshots GET]", error);
      return apiError("Failed to fetch snapshots", 500);
    }

    return apiSuccess({ snapshots: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/snapshots GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/snapshots
 * Record an on-chain snapshot. Project owner only.
 * Body: CreateSnapshotSchema
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req, "project");
    const supabase = createAdminClient();

    const { data: projectProfile } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!projectProfile) return apiError("Project profile not found", 400);

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id, status")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);

    const body = await req.json();
    const parsed = CreateSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { snapshot_type, token_address, chain, metrics: submittedMetrics } = parsed.data;

    // Validate snapshot type against deal status
    if (snapshot_type === "baseline" && deal.status !== "in_progress") {
      return apiError("Baseline snapshots can only be taken when deal is in_progress", 400);
    }
    if (
      snapshot_type === "post_campaign" &&
      !["in_progress", "pending_review"].includes(deal.status)
    ) {
      return apiError(
        "Post-campaign snapshots can only be taken when deal is in_progress or pending_review",
        400
      );
    }

    // Optionally enrich with Helius live data
    let mergedMetrics = { ...submittedMetrics };
    if (process.env.HELIUS_API_KEY && token_address) {
      try {
        const liveMetrics = await fetchTokenMetrics(token_address);
        // Live metrics fill gaps; submitted wins on conflict
        mergedMetrics = { ...liveMetrics, ...submittedMetrics };
      } catch (e) {
        console.warn("[deals/[id]/snapshots POST] helius fetch failed", e);
      }
    }

    const { data: snapshot, error } = await supabase
      .from("on_chain_snapshots")
      .upsert(
        {
          deal_id: dealId,
          snapshot_type,
          token_address: token_address ?? null,
          chain,
          metrics: mergedMetrics,
          captured_at: new Date().toISOString(),
        },
        { onConflict: "deal_id,snapshot_type" }
      )
      .select()
      .single();

    if (error) {
      console.error("[deals/[id]/snapshots POST]", error);
      return apiError("Failed to record snapshot", 500);
    }

    return apiSuccess({ snapshot }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/snapshots POST]", res);
    return apiError("Internal server error", 500);
  }
}
