import { NextRequest } from "next/server";
import { requireAuth, getUser } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewApplicationSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendApplicationStatusEmail, sendDealInProgressEmails } from "@/lib/email/service";

type RouteContext = { params: { id: string; appId: string } };

/**
 * GET /api/deals/[id]/applications/[appId]
 * Get a single application.
 * - KOL: can see their own application
 * - Project: can see applications on their deals
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId, appId } = params;
    const user = await getUser(req);
    if (!user) return apiError("Unauthorized", 401);

    const supabase = createAdminClient();

    const { data: application } = await supabase
      .from("applications")
      .select("*")
      .eq("id", appId)
      .eq("deal_id", dealId)
      .single();

    if (!application) return apiError("Application not found", 404);

    if (user.role === "kol") {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!kolProfile || application.kol_id !== kolProfile.id) {
        return apiError("Forbidden", 403);
      }
      return apiSuccess({ application });
    }

    if (user.role === "project") {
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!projectProfile) return apiError("Forbidden", 403);

      const { data: deal } = await supabase
        .from("deals")
        .select("project_id")
        .eq("id", dealId)
        .single();

      if (!deal || deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);
      return apiSuccess({ application });
    }

    if (user.role === "admin") {
      return apiSuccess({ application });
    }

    return apiError("Forbidden", 403);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications/[appId] GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/deals/[id]/applications/[appId]
 * Review an application. Project owner only.
 * Body: { status: 'accepted' | 'rejected' }
 *
 * If accepted:
 *   - Set deal status to 'in_progress'
 *   - Set deal.accepted_kol_id
 *   - Reject all other pending applications for this deal
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: dealId, appId } = params;
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
    if (deal.status !== "open") {
      return apiError(`Cannot review applications for a deal with status '${deal.status}'`, 400);
    }

    const { data: application } = await supabase
      .from("applications")
      .select("id, kol_id, status")
      .eq("id", appId)
      .eq("deal_id", dealId)
      .single();

    if (!application) return apiError("Application not found", 404);
    if (application.status !== "pending") {
      return apiError(`Application has already been reviewed (status: '${application.status}')`, 400);
    }

    const body = await req.json();
    const parsed = ReviewApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { status: newStatus } = parsed.data;

    // Update the reviewed application
    const { data: updatedApp, error: appError } = await supabase
      .from("applications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq("id", appId)
      .select()
      .single();

    if (appError) {
      console.error("[deals/[id]/applications/[appId] PATCH] app update error", appError);
      return apiError("Failed to update application", 500);
    }

    if (newStatus === "accepted") {
      // Set deal to in_progress and record the accepted KOL
      const { error: dealError } = await supabase
        .from("deals")
        .update({ status: "in_progress", accepted_kol_id: application.kol_id })
        .eq("id", dealId);

      if (dealError) {
        console.error("[deals/[id]/applications/[appId] PATCH] deal update error", dealError);
        return apiError("Failed to update deal status", 500);
      }

      // Reject all other pending applications for this deal
      const { error: rejectError } = await supabase
        .from("applications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("deal_id", dealId)
        .eq("status", "pending")
        .neq("id", appId);

      if (rejectError) {
        console.error("[deals/[id]/applications/[appId] PATCH] bulk reject error", rejectError);
        // Non-fatal: the primary accept succeeded
      }
    }

    sendApplicationStatusEmail(appId, newStatus).catch(console.error)
    if (newStatus === "accepted") {
      sendDealInProgressEmails(dealId).catch(console.error)
    }

    return apiSuccess({ application: updatedApp });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications/[appId] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}
