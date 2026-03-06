import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateApplicationSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendApplicationReceivedEmail } from "@/lib/email/service";

type RouteContext = { params: { id: string } };

/**
 * GET /api/deals/[id]/applications
 * List applications for a deal. Project owner only.
 * Query params: ?status=pending
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req, "project");
    const supabase = createAdminClient();

    // Verify deal belongs to this project
    const { data: projectProfile } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!projectProfile) return apiError("Project profile not found", 400);

    const { data: deal } = await supabase
      .from("deals")
      .select("id, project_id")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("applications")
      .select(
        `
        *,
        kol:kol_profiles (
          id,
          display_name,
          bio,
          niche,
          twitter_handle,
          score,
          tier,
          audience_size_estimate
        )
      `
      )
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query;
    if (error) {
      console.error("[deals/[id]/applications GET]", error);
      return apiError("Failed to fetch applications", 500);
    }

    return apiSuccess({ applications: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/applications
 * Apply to a deal. KOL only with active subscription.
 * Body: { pitch, proposed_rate_usdc? }
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId } = params;
    const user = await requireAuth(req, "kol");
    const supabase = createAdminClient();

    // Get KOL profile
    const { data: kolProfile } = await supabase
      .from("kol_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!kolProfile) {
      return apiError("KOL profile not found. Create a KOL profile first.", 400);
    }

    // Check subscription is active
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("kol_profile_id", kolProfile.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      return apiError("An active subscription is required to apply for deals.", 403);
    }

    // Check deal exists and is open
    const { data: deal } = await supabase
      .from("deals")
      .select("id, status, max_applications")
      .eq("id", dealId)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.status !== "open") return apiError("This deal is not accepting applications.", 400);

    // Check max_applications not reached
    const { count: appCount } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", dealId);

    if ((appCount ?? 0) >= deal.max_applications) {
      return apiError("This deal has reached its maximum number of applications.", 400);
    }

    const body = await req.json();
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        deal_id: dealId,
        kol_id: kolProfile.id,
        ...parsed.data,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation: already applied
      if (error.code === "23505") {
        return apiError("You have already applied to this deal.", 409);
      }
      console.error("[deals/[id]/applications POST] insert error", error);
      return apiError("Failed to submit application", 500);
    }

    sendApplicationReceivedEmail(dealId, application.id).catch(console.error)

    return apiSuccess({ application }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications POST]", res);
    return apiError("Internal server error", 500);
  }
}
