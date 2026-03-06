import { NextRequest } from "next/server";
import { requireAuth, getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitUrlSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteContext = { params: { id: string } };

/**
 * GET /api/deals/[id]/events
 * Get campaign events for a deal.
 * Accessible to: the accepted KOL and the project owner.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await getUser(req);
    if (!user) return apiError("Unauthorized", 401);

    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id, accepted_kol_id")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    let hasAccess = false;

    if (user.role === "admin") {
      hasAccess = true;
    } else if (user.role === "project") {
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      hasAccess = !!projectProfile && deal.project_id === projectProfile.id;
    } else if (user.role === "kol") {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      hasAccess = !!kolProfile && deal.accepted_kol_id === kolProfile.id;
    }

    if (!hasAccess) return apiError("Forbidden", 403);

    const { data: events, error } = await supabase
      .from("campaign_events")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[deals/[id]/events GET]", error);
      return apiError("Failed to fetch events", 500);
    }

    return apiSuccess({ events });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/events GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/events
 * Submit a campaign event. Accepted KOL on the deal only.
 * For url_submission: body = { event_type: 'url_submission', url, platform }
 * For milestone/note:  body = { event_type: 'milestone'|'note', payload: {...} }
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req, "kol");
    const supabase = createAdminClient();

    const { data: kolProfile } = await supabase
      .from("kol_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!kolProfile) return apiError("KOL profile not found", 400);

    // Verify this KOL is the accepted KOL on the deal
    const { data: deal } = await supabase
      .from("deals")
      .select("id, accepted_kol_id, status")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    if (deal.accepted_kol_id !== kolProfile.id) {
      return apiError("Only the accepted KOL can submit campaign events.", 403);
    }

    if (!["in_progress", "pending_review"].includes(deal.status)) {
      return apiError(
        `Cannot submit events for a deal with status '${deal.status}'`,
        400
      );
    }

    const body = await req.json();
    const { event_type, ...rest } = body as { event_type?: string; [key: string]: unknown };

    const validEventTypes = ["url_submission", "milestone", "note"];
    if (!event_type || !validEventTypes.includes(event_type)) {
      return apiError(
        `event_type must be one of: ${validEventTypes.join(", ")}`,
        400
      );
    }

    let payload: Record<string, unknown>;

    if (event_type === "url_submission") {
      const parsed = SubmitUrlSchema.safeParse(rest);
      if (!parsed.success) {
        return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
      }
      payload = parsed.data;
    } else {
      // milestone or note — accept free-form payload
      payload = typeof rest.payload === "object" && rest.payload !== null
        ? (rest.payload as Record<string, unknown>)
        : {};
    }

    const { data: event, error } = await supabase
      .from("campaign_events")
      .insert({
        deal_id: dealId,
        kol_id: kolProfile.id,
        event_type,
        payload,
      })
      .select()
      .single();

    if (error) {
      console.error("[deals/[id]/events POST]", error);
      return apiError("Failed to submit event", 500);
    }

    return apiSuccess({ event }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/events POST]", res);
    return apiError("Internal server error", 500);
  }
}
